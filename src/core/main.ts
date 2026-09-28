// MAIN.TS — Punto de entrada
import { YOSOApp } from './app'

document.addEventListener('DOMContentLoaded', () => {
  const app = new YOSOApp()
  void app.iniciar()
})

// Invalidación y limpieza inmediata de caché persistente / Service Worker viejo
try {
  const PURGE_KEY = 'yoso_purge_manifesto_v10'
  if (!localStorage.getItem(PURGE_KEY)) {
    localStorage.removeItem('yosoOnboarded')
    localStorage.setItem(PURGE_KEY, 'true')
  }
} catch {}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister()
    }
  }).catch(() => {})
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    for (const key of keys) {
      void caches.delete(key)
    }
  }).catch(() => {})
}
