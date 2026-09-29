import { describe, expect, it } from 'vitest'
import { MemoryStorage } from '../../infrastructure/storage/memory-storage'
import { OnboardingService } from './onboarding-service'

describe('OnboardingService', () => {
  it('shows onboarding when nothing was stored', () => {
    const service = new OnboardingService(new MemoryStorage())
    expect(service.hasSeenCurrentVersion()).toBe(false)
  })

  it('hides onboarding after the current version was seen', () => {
    const service = new OnboardingService(new MemoryStorage())
    service.markCurrentVersionSeen()
    expect(service.hasSeenCurrentVersion()).toBe(true)
  })

  it('shows onboarding again when the stored version changes', () => {
    const storage = new MemoryStorage()
    storage.set('yosoOnboarded', 'older_version')
    const service = new OnboardingService(storage)
    expect(service.hasSeenCurrentVersion()).toBe(false)
  })
})