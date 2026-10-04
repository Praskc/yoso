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

// PWA: registro del Service Worker (precache + stale-while-revalidate del modelo).
// Las cachés de versiones anteriores las borra el propio SW en 'activate',
// por eso ya no se unregister-an cachés/SW globales en cada carga.
// La versión de caché la inyecta el build ('yoso-<sha>'), nunca se bumpea a mano.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Visitas nuevas: el primer controllerchange es el claim inicial, no una
      // actualización. Solo las tomas de control posteriores son versión nueva.
      let primeraToma = !navigator.serviceWorker.controller
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (primeraToma) { primeraToma = false; return }
        window.dispatchEvent(new CustomEvent('yoso:sw-actualizado'))
      })
      // Pestañas abiertas por horas: el navegador solo chequea sw.js al navegar
      // (máx. 1 vez / 24 h), así que forzamos el chequeo cada 60 min.
      window.setInterval(() => { void reg.update().catch(() => {}) }, 60 * 60 * 1000)
    }).catch(() => {})
  })
}
