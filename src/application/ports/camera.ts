export type CameraError = 'dismissed' | 'denied' | 'not-found' | 'in-use' | 'other'

export class CameraFailure extends Error {
  constructor(readonly reason: CameraError) {
    super(reason)
    this.name = 'CameraFailure'
  }
}

export interface Camera {
  start(): Promise<HTMLVideoElement>
  stop(): void
  onPermissionGranted(onGranted: () => void): void
}