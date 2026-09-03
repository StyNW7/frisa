import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  getServerSnapshot,
  getSnapshot,
  isIosBrowser,
  isStandalone,
  promptInstall,
  subscribe,
} from '@/lib/pwa'
import { readStore, writeStore } from '@/lib/storage'

const DISMISS_KEY = 'install-dismissed'

export interface PwaInstall {
  /** The browser can show a native install prompt right now. */
  canInstall: boolean
  /** iOS needs written instructions rather than a prompt. */
  needsManualSteps: boolean
  /** Already running as an installed app. */
  standalone: boolean
  /** Worth showing an install affordance at all. */
  available: boolean
  /** The user hid the banner. Entry points elsewhere stay available. */
  dismissed: boolean
  dismiss: () => void
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

export function usePwaInstall(): PwaInstall {
  const { canInstall, installed } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [dismissed, setDismissed] = useState(() => readStore<boolean>(DISMISS_KEY, false))

  const standalone = isStandalone() || installed
  const needsManualSteps = !standalone && !canInstall && isIosBrowser()

  const dismiss = useCallback(() => {
    writeStore(DISMISS_KEY, true)
    setDismissed(true)
  }, [])

  return useMemo(
    () => ({
      canInstall: canInstall && !standalone,
      needsManualSteps,
      standalone,
      available: !standalone && (canInstall || needsManualSteps),
      dismissed,
      dismiss,
      install: promptInstall,
    }),
    [canInstall, needsManualSteps, standalone, dismissed, dismiss],
  )
}
