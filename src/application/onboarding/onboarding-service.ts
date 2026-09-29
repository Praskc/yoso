import type { Storage } from '../ports/storage'

const ONBOARDING_KEY = 'yosoOnboarded'
const ONBOARDING_VERSION = 'v10_manifesto'

export class OnboardingService {
  constructor(private readonly storage: Storage) {}

  hasSeenCurrentVersion(): boolean {
    return this.storage.get(ONBOARDING_KEY) === ONBOARDING_VERSION
  }

  markCurrentVersionSeen(): void {
    this.storage.set(ONBOARDING_KEY, ONBOARDING_VERSION)
  }
}