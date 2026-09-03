import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Radar,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from 'lucide-react'
import type { Fridge } from '@/types'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'
import { StatusChip } from '@/components/common/Badges'
import { FrisaMark } from '@/components/common/FrisaMark'
import { useApp } from '@/hooks/useApp'
import { attemptsRemaining, formatLockout, lockoutRemainingMs, MAX_ATTEMPTS } from '@/lib/pairing'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Device label                                                               */
/* -------------------------------------------------------------------------- */

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
                  {revealed ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
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

/* -------------------------------------------------------------------------- */
/*  Attempt dots                                                               */
/* -------------------------------------------------------------------------- */

function AttemptDots({ remaining }: { remaining: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors duration-200',
            i < remaining ? 'bg-frisa-400' : 'bg-danger-500/70',
          )}
        />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pairing sheet                                                              */
/* -------------------------------------------------------------------------- */

type Phase = 'idle' | 'connecting' | 'verifying' | 'success'

export function PairingSheet({
  open,
  fridgeId,
  onClose,
  onPaired,
}: {
  open: boolean
  fridgeId: string | null
  onClose: () => void
  /** Called after a successful pairing. `usedFactoryPassword` drives the change-password nudge. */
  onPaired?: (fridge: Fridge, usedFactoryPassword: boolean) => void
}) {
  const { fridges, pairDevice } = useApp()
  const fridge = fridges.find((f) => f.id === fridgeId)

  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [lockRemaining, setLockRemaining] = useState(0)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  useEffect(() => {
    if (open) return
    clearTimers()
    setPassword('')
    setReveal(false)
    setPhase('idle')
    setError(null)
  }, [open, clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  /* Countdown while the hub is refusing attempts. */
  useEffect(() => {
    if (!open || !fridge) return
    const tick = () => setLockRemaining(lockoutRemainingMs(fridge.security))
    tick()
    const interval = window.setInterval(tick, 500)
    return () => window.clearInterval(interval)
  }, [open, fridge])

  if (!fridge) return null

  const locked = lockRemaining > 0
  const busy = phase === 'connecting' || phase === 'verifying'
  const remaining = attemptsRemaining(fridge.security)

  const submit = () => {
    if (!password.trim() || busy || locked) return
    setError(null)
    setPhase('connecting')

    timers.current.push(
      window.setTimeout(() => {
        setPhase('verifying')

        timers.current.push(
          window.setTimeout(() => {
            const outcome = pairDevice(fridge.id, password)

            if (outcome.status === 'paired') {
              setPhase('success')
              timers.current.push(
                window.setTimeout(() => {
                  onPaired?.(fridge, outcome.usingFactoryPassword)
                  onClose()
                }, 950),
              )
              return
            }

            setPhase('idle')
            setPassword('')
            setShakeKey((k) => k + 1)

            if (outcome.status === 'wrong-password') {
              setError(
                outcome.attemptsRemaining > 0
                  ? `Incorrect password. ${outcome.attemptsRemaining} ${outcome.attemptsRemaining === 1 ? 'attempt' : 'attempts'} left before the hub pauses pairing.`
                  : 'Incorrect password. The hub has paused pairing for a minute.',
              )
            } else if (outcome.status === 'locked') {
              setError('Too many attempts. The hub has paused pairing.')
            } else {
              setError('The hub is not reachable right now. Check that it is powered on.')
            }
          }, 620),
        )
      }, 520),
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={busy ? () => {} : onClose}
      dismissible={!busy && phase !== 'success'}
      title={phase === 'success' ? 'Paired securely' : 'Connect to this FRISA Hub'}
      description={
        phase === 'success'
          ? `${fridge.deviceId} now trusts this phone.`
          : 'Enter the pairing password so the hub knows this phone belongs to you.'
      }
      footer={
        phase === 'success' ? null : (
          <div className="space-y-2.5">
            <Button size="lg" block onClick={submit} disabled={!password.trim() || busy || locked}>
              {phase === 'connecting'
                ? 'Contacting hub...'
                : phase === 'verifying'
                  ? 'Verifying on the device...'
                  : locked
                    ? `Locked for ${formatLockout(lockRemaining)}`
                    : 'Connect securely'}
            </Button>
            <p className="flex items-start gap-1.5 px-1 text-2xs leading-relaxed text-ink-faint">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
              The password is checked on the hub. FRISA keeps only a salted digest of it, never the
              password itself.
            </p>
          </div>
        )
      }
    >
      <div className="space-y-4 pb-2">
        {/* Device identity */}
        <div className="flex items-center gap-3.5 rounded-3xl border border-line bg-surface p-3.5">
          <span
            className={cn(
              'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              phase === 'success' ? 'bg-frisa-500' : 'bg-frisa-50',
            )}
          >
            {busy ? <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-frisa-200" aria-hidden /> : null}
            <FrisaMark className="relative h-8 w-8" tone={phase === 'success' ? 'white' : 'green'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{fridge.name}</p>
            <p className="num mt-0.5 truncate text-xs text-ink-muted">{fridge.deviceId}</p>
          </div>
          {phase === 'success' ? (
            <StatusChip tone="green" icon={CircleCheck}>
              Paired
            </StatusChip>
          ) : fridge.online ? (
            <StatusChip tone="orange" icon={Radar}>
              In range
            </StatusChip>
          ) : (
            <StatusChip tone="neutral" icon={WifiOff}>
              Offline
            </StatusChip>
          )}
        </div>

        {phase === 'success' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 inline-flex h-16 w-16 animate-pop-in items-center justify-center rounded-3xl bg-frisa-500 text-white">
              <CircleCheck className="h-8 w-8" strokeWidth={2.2} aria-hidden />
            </span>
            <p className="text-[15px] font-bold text-ink">Connected</p>
            <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink-muted">
              This phone now holds a pairing token for {fridge.deviceId}. You can revoke it any time.
            </p>
          </div>
        ) : (
          <>
            <DeviceLabelCard fridge={fridge} />

            <div key={shakeKey} className={cn(error && 'animate-shake')}>
              <label htmlFor="pairing-password" className="mb-1.5 block text-[13px] font-bold text-ink">
                Pairing password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <input
                  id="pairing-password"
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submit()
                  }}
                  disabled={busy || locked}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter the password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'pairing-error' : undefined}
                  className={cn(
                    'h-14 w-full rounded-2xl border bg-mist/50 pl-11 pr-12 text-[15px] font-semibold tracking-wide text-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus:bg-surface focus:outline-none disabled:opacity-60',
                    error ? 'border-danger-500 focus:border-danger-500' : 'border-line focus:border-frisa-400',
                  )}
                />
                <button
                  type="button"
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  onClick={() => setReveal((v) => !v)}
                  className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-ink"
                >
                  {reveal ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={2} />}
                </button>
              </div>

              {error ? (
                <p id="pairing-error" role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-danger-600">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
                  {error}
                </p>
              ) : null}
            </div>

            {/* Attempt budget, always visible so the limit is never a surprise */}
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-mist/50 px-3.5 py-2.5">
              <span className="text-2xs font-semibold text-ink-muted">
                {locked
                  ? `Pairing paused for ${formatLockout(lockRemaining)}`
                  : `${remaining} of ${MAX_ATTEMPTS} attempts left`}
              </span>
              <AttemptDots remaining={locked ? 0 : remaining} />
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
