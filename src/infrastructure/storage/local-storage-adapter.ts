import type { Storage } from '../../application/ports/storage'

export class LocalStorageAdapter implements Storage {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {}
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}