/**
 * Install-to-home-screen plumbing.
 *
 * The browser fires `beforeinstallprompt` once, often before React has mounted, so
 * the event is captured at module load and kept in a tiny external store that
 * components subscribe to. Nothing here touches the rest of the app's behaviour.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

export interface PwaSnapshot {
  /** The browser has offered a native install prompt we can trigger. */
  canInstall: boolean
  /** The app was installed during this session. */
  installed: boolean
}

const SERVER_SNAPSHOT: PwaSnapshot = { canInstall: false, installed: false }

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
let snapshot: PwaSnapshot = { canInstall: false, installed: false }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { canInstall: deferred !== null, installed }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep the event so the app can offer installation at a sensible moment.
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    emit()
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    emit()
  })
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): PwaSnapshot {
  return snapshot
}

export function getServerSnapshot(): PwaSnapshot {
  return SERVER_SNAPSHOT
}

/** True when the app is already running as an installed app rather than a tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true
}

/**
 * iOS Safari never fires `beforeinstallprompt`; installing there is a manual
 * Share -> Add to Home Screen, so it needs instructions instead of a button.
 */
export function isIosBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  return isIos && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const event = deferred
  // A deferred prompt can only be used once.
  deferred = null
  emit()
  try {
    await event.prompt()
    const { outcome } = await event.userChoice
    return outcome
  } catch {
    return 'unavailable'
  }
}
