import type { Storage } from '../../application/ports/storage'

const LEGACY_PURGE_KEY = 'yoso_purge_manifesto_v10'
const LEGACY_ONBOARDING_KEY = 'yosoOnboarded'

export async function purgeLegacyState(storage: Storage): Promise<void> {
  if (!storage.get(LEGACY_PURGE_KEY)) {
    storage.remove(LEGACY_ONBOARDING_KEY)
    storage.set(LEGACY_PURGE_KEY, 'true')
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    } catch {}
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    } catch {}
  }
}