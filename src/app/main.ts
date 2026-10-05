import { YOSOApp } from '../application/app'

document.addEventListener('DOMContentLoaded', () => {
  const app = new YOSOApp()
  void app.iniciar()
})

// Invalidación única de estado viejo (onboarding v10) — corre solo la primera vez.
try {
  const PURGE_KEY = 'yoso_purge_manifesto_v12'
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.removeItem('yosoOnboarded')
    localStorage.setItem(PURGE_KEY, 'true')
  }
} catch {}

// PWA: registro del Service Worker con actualización inmediata y notificación de toast
if ('serviceWorker' in navigator) {
  let toastDisparado = false
  const dispararToastActualizacion = () => {
    if (toastDisparado) return
    toastDisparado = true
    window.dispatchEvent(new CustomEvent('yoso:sw-actualizado'))
  }

  // 1. Notificación directa por postMessage del Service Worker al activarse una nueva versión
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SW_ACTIVADO') {
      dispararToastActualizacion()
    }
  })

  // 2. Control del ciclo de vida y updates
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Si ya hay un worker en espera (descargado previamente)
      if (reg.waiting && navigator.serviceWorker.controller) {
        dispararToastActualizacion()
      }

      // Si se encuentra una nueva versión instalándose
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            dispararToastActualizacion()
          }
        })
      })

      // Cuando el nuevo SW toma el control de los clientes
      let primeraToma = !navigator.serviceWorker.controller
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (primeraToma) { primeraToma = false; return }
        dispararToastActualizacion()
      })

      // Chequeo forzado inmediato y periódico
      void reg.update()
      window.setInterval(() => { void reg.update().catch(() => {}) }, 5 * 60 * 1000)
    }).catch(() => {})
  })
}
