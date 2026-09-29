import { CameraFailure, type Camera, type CameraError } from '../../application/ports/camera'

export class BrowserCamera implements Camera {
  private permissionListener: (() => void) | null = null

  constructor(private readonly video: HTMLVideoElement) {}

  async start(): Promise<HTMLVideoElement> {
    const isTouchDevice = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0
    const constraints: MediaStreamConstraints = isTouchDevice
      ? { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } }, audio: false }
      : { video: { width: { ideal: 640 }, height: { ideal: 360 } }, audio: false }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      const failure = await this.toCameraFailure(error as DOMException)
      this.watchPermission()
      throw failure
    }

    this.video.srcObject = stream
    await new Promise<void>(resolve => {
      this.video.onloadedmetadata = () => resolve()
    })
    await this.video.play()
    return this.video
  }

  stop(): void {
    const stream = this.video.srcObject as MediaStream | null
    stream?.getTracks().forEach(track => track.stop())
    this.video.srcObject = null
  }

  onPermissionGranted(onGranted: () => void): void {
    this.permissionListener = onGranted
  }

  private async toCameraFailure(error: DOMException): Promise<CameraFailure> {
    const name = error.name || ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      const dismissed = await this.isPermissionDismissed(error)
      return new CameraFailure(dismissed ? 'dismissed' : 'denied')
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return new CameraFailure('not-found')
    if (name === 'NotReadableError' || name === 'TrackStartError') return new CameraFailure('in-use')
    return new CameraFailure('other')
  }

  private async isPermissionDismissed(error: DOMException): Promise<boolean> {
    const message = (error.message || '').toLowerCase()
    const dismissedByMessage = message.includes('dismiss') || message.includes('cancel')
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return permission.state === 'prompt' || dismissedByMessage
    } catch {
      return dismissedByMessage
    }
  }

  private watchPermission(): void {
    if (!navigator.permissions?.query) return
    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then(permission => {
        permission.onchange = () => {
          if (permission.state === 'granted') this.permissionListener?.()
        }
      })
      .catch(() => {})
  }
}

export type { CameraError }