import { bootstrap } from './bootstrap'

const start = (): void => {
  void bootstrap()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  start()
}
