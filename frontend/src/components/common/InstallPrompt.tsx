import { useState } from 'react'
import { Download, Plus, Share, WifiOff, X } from 'lucide-react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'
import { FrisaMark } from '@/components/common/FrisaMark'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useToast } from '@/hooks/useApp'

/** Share -> Add to Home Screen, for iOS where there is no install event. */
export function InstallInstructionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add FRISA to your Home Screen"
      description="Three taps in Safari, and FRISA opens full screen like any other app."
      footer={
        <Button size="lg" block onClick={onClose}>
          Got it
        </Button>
      }
    >
      <ol className="space-y-2.5 pb-2">
        {[
          { icon: Share, text: 'Tap the Share button in the Safari toolbar.' },
          { icon: Plus, text: 'Choose Add to Home Screen from the list.' },
          { icon: Download, text: 'Confirm with Add. FRISA appears on your Home Screen.' },
        ].map(({ icon: Icon, text }, index) => (
          <li key={text} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
            <span className="num inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-frisa-50 text-xs font-extrabold text-frisa-700">
              {index + 1}
            </span>
            <Icon className="h-[18px] w-[18px] shrink-0 text-ink-soft" strokeWidth={2} aria-hidden />
            <p className="text-[13px] leading-snug text-ink-soft">{text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-start gap-2 px-1 text-2xs leading-relaxed text-ink-faint">
        <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
        Once added, FRISA keeps working without a connection.
      </p>
    </BottomSheet>
  )
}

/**
 * A single, dismissible install affordance. It only renders when the browser says
 * the app can actually be installed, and never on a device that already has it.
 */
export function InstallPrompt() {
  const { needsManualSteps, available, dismissed, dismiss, install } = usePwaInstall()
  const { toast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!available) return null

  const handleInstall = async () => {
    if (needsManualSteps) {
      setSheetOpen(true)
      return
    }
    const outcome = await install()
    if (outcome === 'accepted') {
      toast('Installing FRISA', { description: 'It will appear alongside your other apps.' })
      dismiss()
    } else if (outcome === 'unavailable') {
      setSheetOpen(true)
    }
  }

  return (
    <>
      {!dismissed ? (
        <div className="shrink-0 animate-fade-up border-t border-frisa-100 bg-frisa-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-card">
              <FrisaMark className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-frisa-800">Install FRISA</p>
              <p className="mt-0.5 truncate text-2xs text-frisa-700/90">
                Full screen, on your home screen, works offline.
              </p>
            </div>
            <Button size="sm" onClick={handleInstall}>
              {needsManualSteps ? 'How' : 'Install'}
            </Button>
            <button
              type="button"
              aria-label="Dismiss install suggestion"
              onClick={dismiss}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-frisa-700/70 transition-colors hover:bg-frisa-100 hover:text-frisa-800"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      ) : null}

      <InstallInstructionsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

/** Entry point kept in Profile so installation is reachable after the banner is dismissed. */
export function InstallRow() {
  const { canInstall, needsManualSteps, available, install } = usePwaInstall()
  const { toast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!available) return null

  const handleInstall = async () => {
    if (needsManualSteps) {
      setSheetOpen(true)
      return
    }
    const outcome = await install()
    if (outcome === 'accepted') {
      toast('Installing FRISA', { description: 'It will appear alongside your other apps.' })
    } else if (outcome === 'unavailable') {
      setSheetOpen(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-mist/60 active:bg-mist"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-frisa-50 text-frisa-600">
          <Download className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">Install FRISA</span>
          <span className="mt-0.5 block truncate text-xs text-ink-muted">
            {canInstall ? 'Add it to your device and use it offline' : 'Add it to your Home Screen'}
          </span>
        </span>
      </button>

      <InstallInstructionsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
