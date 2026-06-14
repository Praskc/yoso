import { YOSOApp } from './app'

document.addEventListener('DOMContentLoaded', () => {
  const app = new YOSOApp()
  void app.iniciar()
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
