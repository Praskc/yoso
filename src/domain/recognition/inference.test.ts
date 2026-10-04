import { describe, it, expect, vi } from 'vitest'
import { MotorInferencia, ALFABETO } from './inference'
import type { Lateralidad, Punto } from './types'

// ORT solo aporta la clase Tensor en runtime (el resto del módulo es tipos).
vi.mock('onnxruntime-web', () => ({
  Tensor: class {
    type: string
    data: Float32Array
    dims: number[]
    constructor(type: string, data: Float32Array, dims: number[]) {
      this.type = type
      this.data = data
      this.dims = dims
    }
  },
}))

const DER: Lateralidad = { label: 'Right', score: 1 }

// Mano sintética: 21 landmarks con dp != 0 (muñeca→base del medio).
// x8/x12 permiten simular dedos cruzados para el juez U/R.
const manoBase = (x8 = 0.50, x12 = 0.48): Punto[] =>
  Array.from({ length: 21 }, (_, i) => ({
    x: i === 8 ? x8 : i === 12 ? x12 : 0.4 + i * 0.01,
    y: 0.4 + i * 0.008,
    z: 0,
  }))

const logitsPeak = (letra: string): Float32Array => {
  const l = new Float32Array(ALFABETO.length)
  l[ALFABETO.indexOf(letra)] = 12
  return l
}

const logitsPlanos = (): Float32Array => new Float32Array(ALFABETO.length)

interface SesionFake {
  inputNames: string[]
  outputNames: string[]
  run: (feed: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>>
}

const crearSesion = (logits: () => Float32Array): SesionFake => ({
  inputNames: ['features'],
  outputNames: ['logits'],
  run: async () => ({ logits: { data: logits() } }),
})

const montar = (logits: () => Float32Array) => {
  const motor = new MotorInferencia()
  const detecciones: Array<{ letra: string; conf: number }> = []
  const confirmadas: string[] = []
  motor.iniciar({
    sesion: crearSesion(logits),
    centroides: null,
    callbacks: {
      alConfirmarLetra: l => confirmadas.push(l),
      alDetectarLetra: (letra, conf) => detecciones.push({ letra, conf }),
      alActualizarDebug: () => {},
    },
  })
  return { motor, detecciones, confirmadas }
}

describe('MotorInferencia', () => {
  it('confirma la letra tras llenar el buffer de 9 votos y respeta el cooldown', async () => {
    const { motor, detecciones, confirmadas } = montar(() => logitsPeak('A'))
    const mano = manoBase()

    for (let i = 0; i < 8; i++) await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual([])

    await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual(['A'])
    expect(detecciones.every(d => d.letra === 'A')).toBe(true)
    expect(detecciones[0].conf).toBeGreaterThan(0.82)

    // Frame inmediato con la misma letra: cooldown de 1800ms no re-confirma.
    await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual(['A'])
  })

  it('el juez geométrico distingue U de R por el cruce de dedos', async () => {
    const { motor, detecciones } = montar(() => logitsPeak('U'))

    // Mano derecha: índice(8) más a la izquierda que el medio(12) = cruzados = R.
    await motor.procesar(manoBase(0.45, 0.52), DER, 0.01)
    expect(detecciones[0].letra).toBe('R')

    await motor.procesar(manoBase(0.52, 0.45), DER, 0.01)
    expect(detecciones[1].letra).toBe('U')
  })

  it('con confianza baja detecta "-" y nunca confirma', async () => {
    const { motor, detecciones, confirmadas } = montar(logitsPlanos)

    for (let i = 0; i < 12; i++) await motor.procesar(manoBase(), DER, 0.01)

    expect(detecciones.every(d => d.letra === '-')).toBe(true)
    expect(confirmadas).toEqual([])
  })

  it('reiniciar(false) preserva el cooldown; reiniciar(true) lo borra', async () => {
    const { motor, confirmadas } = montar(() => logitsPeak('A'))
    const mano = manoBase()

    for (let i = 0; i < 9; i++) await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual(['A'])

    // Parpadeo del detector: el buffer se limpia pero el cooldown sobrevive.
    motor.reiniciar(false)
    for (let i = 0; i < 9; i++) await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual(['A'])

    // Cambio de modo / tab oculto: reset total.
    motor.reiniciar(true)
    for (let i = 0; i < 9; i++) await motor.procesar(mano, DER, 0.01)
    expect(confirmadas).toEqual(['A', 'A'])
  })

  it('acepta espacio como comando solo con la mano quieta', async () => {
    const { motor, detecciones } = montar(() => logitsPeak(' '))

    await motor.procesar(manoBase(), DER, 0.01)
    expect(detecciones[0].letra).toBe(' ')

    // Jitter alto: el comando se descarta para evitar falsos espacios.
    await motor.procesar(manoBase(), DER, 0.05)
    expect(detecciones[1].letra).toBe('-')
  })
})
