import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import type { Fridge } from '@/types'

/**
 * The sticker under the hub. Owners read the factory password off it once; after
 * they set their own, it is no longer any use and the card says so instead.
 */
export function DeviceLabelCard({ fridge }: { fridge: Fridge }) {
  const [revealed, setRevealed] = useState(false)
  const factory = fridge.security.usingFactoryPassword

  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-mist/50 p-3.5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          Printed on the label under the hub
        </p>
      </div>

      <dl className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs text-ink-muted">Device ID</dt>
          <dd className="num text-[13px] font-bold text-ink">{fridge.deviceId}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs text-ink-muted">Factory password</dt>
          <dd className="flex items-center gap-2">
            {factory ? (
              <>
                <span className="num text-[13px] font-bold tracking-wider text-ink">
                  {revealed ? fridge.security.factoryPassword : '•'.repeat(fridge.security.factoryPassword.length)}
                </span>
                <button
                  type="button"
                  aria-label={revealed ? 'Hide factory password' : 'Show factory password'}
                  onClick={() => setRevealed((v) => !v)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-line hover:text-ink"
                >
                  {revealed ? (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </>
            ) : (
              <span className="text-[13px] font-semibold text-ink-muted">Replaced by the owner</span>
            )}
          </dd>
        </div>
      </dl>

      {!factory ? (
        <p className="mt-2.5 text-2xs leading-relaxed text-ink-muted">
          This hub no longer accepts the printed password. Ask whoever set it up for the current one.
        </p>
      ) : null}
    </div>
  )
}
