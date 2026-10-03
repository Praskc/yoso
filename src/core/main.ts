import { YOSOApp } from './app'

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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
