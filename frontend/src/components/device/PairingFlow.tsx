import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Bluetooth,
  BluetoothSearching,
  Camera,
  Check,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  LockOpen,
  PackageOpen,
  Power,
  RefreshCw,
  Router,
  ShieldCheck,
  Smartphone,
  Thermometer,
  Timer,
  TriangleAlert,
  Wifi,
  WifiHigh,
  WifiLow,
} from 'lucide-react'
import type { Fridge } from '@/types'
import { Button } from '@/components/common/Button'
import { StatusChip } from '@/components/common/Badges'
import { FrisaMark } from '@/components/common/FrisaMark'
import { DeviceLabelCard } from '@/components/device/DeviceLabelCard'
import { useApp } from '@/hooks/useApp'
import {
  attemptsRemaining,
  formatLockout,
  hubSupportsNetwork,
  lockoutRemainingMs,
  MAX_ATTEMPTS,
  MIN_WIFI_PASSWORD_LENGTH,
  nearbyNetworks,
  PAIRING_STAGES,
  wifiPasswordAccepted,
  type WifiNetwork,
} from '@/lib/pairing'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Stage metadata                                                             */
/* -------------------------------------------------------------------------- */

const STAGE_ICONS: Record<(typeof PAIRING_STAGES)[number]['id'], LucideIcon> = {
  power: Power,
  search: Bluetooth,
  wifi: Wifi,
  password: KeyRound,
  synced: CircleCheck,
}

/* Simulated radio timings. Long enough to read, short enough not to bore a demo. */
const BLE_SCAN_MS = 1700
const BLE_LINK_MS = 900
const WIFI_SCAN_MS = 1100
const WIFI_SEND_MS = 700
const WIFI_JOIN_MS = 1200
const HUB_CONTACT_MS = 520
const HUB_VERIFY_MS = 620
const ADVANCE_MS = 650

/* What the hub does the moment it is claimed, in order. */
const SYNC_TASKS: Array<{ id: string; label: string; icon: LucideIcon; ms: number }> = [
  { id: 'token', label: 'Pairing token issued to this phone', icon: ShieldCheck, ms: 350 },
  { id: 'clock', label: 'Clock and timezone set', icon: Clock, ms: 550 },
  { id: 'camera', label: 'Camera calibrated to the shelves', icon: Camera, ms: 800 },
  { id: 'inventory', label: 'Inventory synced to the app', icon: PackageOpen, ms: 900 },
]

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Timeouts that die with the component, so a closed sheet never fires stale state. */
function useTimers() {
  const timers = useRef<number[]>([])
  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => clear, [clear])
  return { after, clear }
}

/** Latest-value ref, so effects can call parent callbacks without re-running on identity changes. */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/* -------------------------------------------------------------------------- */
/*  Stepper                                                                    */
/* -------------------------------------------------------------------------- */

export function PairingStepper({ current, className }: { current: number; className?: string }) {
  return (
    <ol className={cn('flex items-start', className)} aria-label="Setup progress">
      {PAIRING_STAGES.map((stage, i) => {
        const Icon = STAGE_ICONS[stage.id]
        const done = i < current
        const active = i === current
        return (
          <li key={stage.id} className={cn('flex min-w-0 items-start', i < PAIRING_STAGES.length - 1 && 'flex-1')}>
            <div className="flex w-12 shrink-0 flex-col items-center">
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
                  done && 'bg-frisa-500 text-white',
                  active && 'bg-frisa-50 text-frisa-700 ring-2 ring-frisa-500',
                  !done && !active && 'bg-mist text-ink-faint',
                )}
              >
                {active ? (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-frisa-300" aria-hidden />
                ) : null}
                {done ? (
                  <Check className="relative h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  <Icon className="relative h-4 w-4" strokeWidth={2.3} aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  'mt-1.5 whitespace-nowrap text-[10px] font-bold leading-none',
                  active ? 'text-frisa-700' : done ? 'text-ink-soft' : 'text-ink-faint',
                )}
              >
                {stage.label}
              </span>
              <span className="sr-only">{done ? 'completed' : active ? 'current step' : 'upcoming'}</span>
            </div>
            {i < PAIRING_STAGES.length - 1 ? (
              <span
                className={cn(
                  'mt-[17px] h-0.5 min-w-0 flex-1 -translate-x-1 rounded-full transition-colors duration-500',
                  done ? 'bg-frisa-500' : 'bg-line',
                )}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/* -------------------------------------------------------------------------- */
/*  Link visual: phone <-> hub, hub <-> router                                 */
/* -------------------------------------------------------------------------- */

type LinkNode = { kind: 'phone' | 'hub' | 'router'; label: string; detail?: string }
type LinkState = 'searching' | 'found' | 'linked'

function LinkEnd({ node, dim }: { node: LinkNode; dim?: boolean }) {
  return (
    <div
      className={cn(
        'flex w-[84px] shrink-0 flex-col items-center transition-opacity duration-500',
        dim && 'opacity-40',
      )}
    >
      <span
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card',
          dim ? 'border-2 border-dashed border-line' : 'ring-1 ring-line',
        )}
      >
        {node.kind === 'hub' ? (
          <FrisaMark className="h-9 w-9" />
        ) : node.kind === 'phone' ? (
          <Smartphone className="h-6 w-6 text-ink" strokeWidth={1.9} aria-hidden />
        ) : (
          <Router className="h-6 w-6 text-ink" strokeWidth={1.9} aria-hidden />
        )}
      </span>
      <span className="mt-2 max-w-full truncate text-[11px] font-bold text-ink">{node.label}</span>
      {node.detail ? (
        <span className="num mt-0.5 max-w-full truncate text-[10px] text-ink-muted">{node.detail}</span>
      ) : null}
    </div>
  )
}

/**
 * The connection the current step is establishing, drawn honestly: dashed while
 * searching, a packet travelling while the two sides talk, solid green once linked.
 */
function LinkVisual({
  from,
  to,
  via: Via,
  state,
  caption,
}: {
  from: LinkNode
  to: LinkNode
  via: LucideIcon
  state: LinkState
  caption: string
}) {
  const linked = state === 'linked'
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-b from-frisa-50 to-white px-4 pb-4 pt-5">
      <div className="flex items-start">
        <LinkEnd node={from} />

        <div className="relative mt-7 min-w-0 flex-1 px-1">
          {/* The track */}
          <span
            className={cn(
              'block h-0.5 w-full rounded-full transition-colors duration-500',
              linked ? 'bg-frisa-500' : 'border-t-2 border-dashed border-line bg-transparent',
            )}
            aria-hidden
          />
          {/* The packet */}
          {!linked ? (
            <span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-link-travel rounded-full bg-frisa-500 shadow-pill"
              aria-hidden
            />
          ) : null}
          {/* The medium */}
          <span
            className={cn(
              'absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-4 ring-white transition-colors duration-500',
              linked
                ? 'bg-frisa-500 text-white'
                : state === 'found'
                  ? 'bg-ember-500 text-white'
                  : 'bg-mist text-ink-faint',
            )}
            aria-hidden
          >
            <Via className="h-4 w-4" strokeWidth={2.4} />
          </span>
        </div>

        <LinkEnd node={to} dim={state === 'searching'} />
      </div>

      <p className="mt-4 text-center text-xs font-semibold text-ink-muted" aria-live="polite">
        {caption}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Signal bars                                                                */
/* -------------------------------------------------------------------------- */

function SignalBars({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn('flex items-end gap-0.5', className)} aria-hidden>
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn('w-1 rounded-sm', bar <= level ? 'bg-frisa-500' : 'bg-line')}
          style={{ height: `${4 + bar * 3}px` }}
        />
      ))}
    </span>
  )
}

function WifiIconFor({ network, className }: { network: WifiNetwork; className?: string }) {
  const Icon = network.strength === 3 ? WifiHigh : network.strength === 2 ? Wifi : WifiLow
  return <Icon className={className} strokeWidth={2} aria-hidden />
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
/*  The flow                                                                   */
/* -------------------------------------------------------------------------- */

type ScanPhase = 'scanning' | 'found' | 'linking' | 'linked'
type WifiPhase = 'scanning' | 'list' | 'sending' | 'joining' | 'online'
type VerifyPhase = 'idle' | 'contacting' | 'verifying' | 'accepted'

export interface PairingFlowRender {
  /** Index into PAIRING_STAGES. */
  step: number
  title: string
  description: string
  stepper: ReactNode
  body: ReactNode
  footer: ReactNode
  /** A radio operation is in progress: the host should not let the flow be dismissed. */
  busy: boolean
  /** The hub is paired and its first sync has finished. */
  done: boolean
}

export interface PairingFlowProps {
  fridge: Fridge
  /** Fires once the hub is claimed and its first sync has finished. */
  onComplete?: (fridge: Fridge, usedFactoryPassword: boolean) => void
  /** The final button. */
  onDone?: () => void
  doneLabel?: string
  children: (flow: PairingFlowRender) => ReactNode
}

/**
 * Hub setup, end to end: power on, find it over Bluetooth, hand it Wi-Fi, claim it
 * with the pairing password, and watch the first sync land. The host decides where
 * the pieces go (a sheet, or a page), so the parts are handed back rather than laid out.
 */
export function PairingFlow({ fridge, onComplete, onDone, doneLabel = 'Done', children }: PairingFlowProps) {
  const { pairDevice, setDeviceWifi, syncFridge } = useApp()
  const { after, clear } = useTimers()
  const latest = useLatest({ onComplete, syncFridge, setDeviceWifi })

  const [step, setStep] = useState(0)

  /* Each step starts at the top of whatever scroll area the host put the body in. */
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bodyRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 })
  }, [step])

  /* 2. Search */
  const [scan, setScan] = useState<ScanPhase>('scanning')

  /* 3. Wi-Fi */
  const networks = nearbyNetworks(fridge)
  const [wifiPhase, setWifiPhase] = useState<WifiPhase>('scanning')
  const [ssid, setSsid] = useState<string | null>(null)
  const [wifiPassword, setWifiPassword] = useState('')
  const [revealWifi, setRevealWifi] = useState(false)
  const network = networks.find((n) => n.ssid === ssid) ?? null

  /* 4. Pairing password */
  const [password, setPassword] = useState('')
  const [revealPassword, setRevealPassword] = useState(false)
  const [verify, setVerify] = useState<VerifyPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [usedFactory, setUsedFactory] = useState(false)

  /* 5. Sync */
  const [syncedTasks, setSyncedTasks] = useState(0)
  const [synced, setSynced] = useState(false)

  const goTo = useCallback(
    (next: number) => {
      clear()
      setStep(next)
    },
    [clear],
  )

  /* Bluetooth discovery starts the moment the search step is shown. */
  useEffect(() => {
    if (step !== 1 || scan !== 'scanning') return
    const t = window.setTimeout(() => setScan('found'), BLE_SCAN_MS)
    return () => window.clearTimeout(t)
  }, [step, scan])

  /* The hub scans for networks as soon as we ask. */
  useEffect(() => {
    if (step !== 2 || wifiPhase !== 'scanning') return
    const t = window.setTimeout(() => setWifiPhase('list'), WIFI_SCAN_MS)
    return () => window.clearTimeout(t)
  }, [step, wifiPhase])

  /* Countdown while the hub is refusing attempts. */
  useEffect(() => {
    if (step !== 3) return
    const tick = () => setLockRemaining(lockoutRemainingMs(fridge.security))
    tick()
    const interval = window.setInterval(tick, 500)
    return () => window.clearInterval(interval)
  }, [step, fridge.security])

  /* First sync runs through its checklist, then reports back to the host. */
  useEffect(() => {
    if (step !== 4) return
    const timers: number[] = []
    let acc = 0
    SYNC_TASKS.forEach((task, i) => {
      acc += task.ms
      timers.push(window.setTimeout(() => setSyncedTasks(i + 1), acc))
    })
    timers.push(
      window.setTimeout(() => {
        setSynced(true)
        latest.current.syncFridge(fridge.id)
        latest.current.onComplete?.(fridge, usedFactory)
      }, acc + 350),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
    // `fridge` is read once at sync time; re-running on every fridge update would restart the sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, fridge.id, usedFactory, latest])

  /* ---- actions ---------------------------------------------------------- */

  const linkOverBluetooth = () => {
    if (scan !== 'found') return
    setScan('linking')
    after(BLE_LINK_MS, () => {
      setScan('linked')
      after(ADVANCE_MS, () => goTo(2))
    })
  }

  const wifiReady = network !== null && hubSupportsNetwork(network) && wifiPasswordAccepted(network, wifiPassword)

  const sendWifi = () => {
    if (!wifiReady || !network || wifiPhase !== 'list') return
    setWifiPhase('sending')
    after(WIFI_SEND_MS, () => {
      setWifiPhase('joining')
      after(WIFI_JOIN_MS, () => {
        latest.current.setDeviceWifi(fridge.id, network.ssid)
        setWifiPhase('online')
        after(ADVANCE_MS, () => goTo(3))
      })
    })
  }

  const locked = lockRemaining > 0
  const verifying = verify === 'contacting' || verify === 'verifying'
  const remaining = attemptsRemaining(fridge.security)

  const claimHub = () => {
    if (!password.trim() || verifying || locked || verify === 'accepted') return
    setError(null)
    setVerify('contacting')

    after(HUB_CONTACT_MS, () => {
      setVerify('verifying')
      after(HUB_VERIFY_MS, () => {
        const outcome = pairDevice(fridge.id, password)

        if (outcome.status === 'paired') {
          setUsedFactory(outcome.usingFactoryPassword)
          setVerify('accepted')
          after(ADVANCE_MS, () => goTo(4))
          return
        }

        setVerify('idle')
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
          setError('The hub is not reachable right now. Check that its light is on.')
        }
      })
    })
  }

  const busy =
    scan === 'linking' ||
    scan === 'linked' ||
    wifiPhase === 'sending' ||
    wifiPhase === 'joining' ||
    wifiPhase === 'online' ||
    verifying ||
    verify === 'accepted' ||
    (step === 4 && !synced)

  /* ---- copy ------------------------------------------------------------- */

  const heading: Record<number, { title: string; description: string }> = {
    0: {
      title: 'Power on the hub',
      description: 'Put the FRISA Hub into pairing mode so this phone can find it.',
    },
    1:
      scan === 'scanning'
        ? { title: 'Searching for your hub', description: 'FRISA is looking for hubs in pairing mode over Bluetooth.' }
        : scan === 'found'
          ? { title: 'Hub found', description: 'Check the device ID against the label, then link to it.' }
          : { title: 'Linking over Bluetooth', description: 'Opening a direct channel to the hub for setup.' },
    2: {
      title: 'Connect the hub to Wi-Fi',
      description: 'Bluetooth is only for setup. The hub needs your Wi-Fi to reach FRISA from the kitchen.',
    },
    3: {
      title: 'Claim this hub',
      description: 'Enter the pairing password so the hub knows this phone belongs to you.',
    },
    4: synced
      ? { title: 'Paired and synced', description: `${fridge.deviceId} is online and already watching your food.` }
      : { title: 'Paired securely', description: `${fridge.deviceId} now trusts this phone. Running the first sync.` },
  }

  /* ---- bodies ----------------------------------------------------------- */

  const powerBody = (
    <div className="space-y-4">
      {/* What the hub should look like right now */}
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-b from-frisa-50 to-white p-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <span
              className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-white ring-4 ring-white"
              aria-hidden
            >
              <Power className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
            <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-card ring-1 ring-line">
              <FrisaMark className="h-14 w-14" />
            </span>
            <span
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-line"
              aria-hidden
            >
              <span className="h-3 w-3 animate-led-blink rounded-full bg-ember-500" />
            </span>
          </div>

          <p className="mt-5 text-sm font-bold text-ink">FRISA Hub</p>
          <p className="mt-0.5 text-xs text-ink-muted">What you should see once it is in pairing mode</p>

          <div className="mt-4">
            <StatusChip tone="orange" icon={Bluetooth}>
              Pairing mode · light blinks orange
            </StatusChip>
          </div>
        </div>
      </div>

      <ol className="card divide-y divide-line overflow-hidden">
        {[
          {
            icon: Power,
            title: 'Plug the hub in and press the power button',
            body: 'It sits on top, next to the camera.',
          },
          {
            icon: Timer,
            title: 'Hold it for 3 seconds',
            body: 'The light turns orange and starts blinking. That is pairing mode.',
          },
          {
            icon: Smartphone,
            title: 'Keep this phone close',
            body: 'Within about 2 metres, with Bluetooth switched on.',
          },
        ].map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex items-start gap-3 px-4 py-3.5">
            <span className="relative mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-frisa-50 text-frisa-600">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              <span className="num absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white">
                {i + 1}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-ink">{title}</span>
              <span className="block text-xs leading-snug text-ink-muted">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 rounded-2xl bg-mist/60 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-2xs font-semibold text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-ember-500" aria-hidden /> Blinking orange · pairing
        </span>
        <span className="flex items-center gap-1.5 text-2xs font-semibold text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-frisa-500" aria-hidden /> Solid green · connected
        </span>
      </div>
    </div>
  )

  const searchBody = (
    <div className="space-y-4">
      <LinkVisual
        from={{ kind: 'phone', label: 'This phone' }}
        to={{ kind: 'hub', label: 'FRISA Hub', detail: scan === 'scanning' ? undefined : fridge.deviceId }}
        via={scan === 'scanning' ? BluetoothSearching : Bluetooth}
        state={scan === 'scanning' ? 'searching' : scan === 'linked' ? 'linked' : 'found'}
        caption={
          scan === 'scanning'
            ? 'Listening for hubs in pairing mode...'
            : scan === 'found'
              ? '1 hub in pairing mode nearby'
              : scan === 'linking'
                ? 'Opening a Bluetooth channel to the hub...'
                : 'Bluetooth link established'
        }
      />

      {scan === 'scanning' ? (
        <div className="space-y-2.5" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3.5 rounded-3xl border border-line p-3.5">
              <span className="skeleton h-12 w-12 rounded-2xl" />
              <span className="flex-1 space-y-2">
                <span className="skeleton block h-3.5 w-1/2 rounded-full" />
                <span className="skeleton block h-3 w-1/3 rounded-full" />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          aria-label="Hub found"
          className={cn(
            'flex animate-pop-in items-center gap-3.5 rounded-3xl border-2 border-frisa-500 p-3.5 transition-colors',
            scan === 'linked' ? 'bg-frisa-50' : 'bg-surface',
          )}
        >
          <span
            className={cn(
              'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              scan === 'linked' ? 'bg-frisa-500' : 'bg-frisa-50',
            )}
          >
            {scan === 'linking' ? (
              <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-frisa-200" aria-hidden />
            ) : null}
            <FrisaMark className="relative h-8 w-8" tone={scan === 'linked' ? 'white' : 'green'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">FRISA Hub</p>
            <p className="num mt-0.5 text-xs text-ink-muted">{fridge.deviceId}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {scan === 'linked' ? (
                <StatusChip tone="green" icon={CircleCheck}>
                  Linked
                </StatusChip>
              ) : (
                <StatusChip tone="orange">Pairing mode</StatusChip>
              )}
              <StatusChip tone="neutral">
                <SignalBars level={3} />
                Strong · about 1 m
              </StatusChip>
            </div>
          </div>
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-frisa-500 text-white"
            aria-hidden
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>
      )}

      {scan === 'found' ? (
        <p className="px-1 text-2xs leading-relaxed text-ink-muted">
          The ID should match the label under your hub. If a different hub shows up, someone nearby is also setting one
          up.
        </p>
      ) : null}
    </div>
  )

  const wifiBody = (
    <div className="space-y-4">
      {wifiPhase === 'sending' || wifiPhase === 'joining' || wifiPhase === 'online' ? (
        <LinkVisual
          from={{ kind: 'hub', label: 'FRISA Hub', detail: fridge.deviceId }}
          to={{ kind: 'router', label: network?.ssid ?? 'Wi-Fi', detail: network?.band }}
          via={Wifi}
          state={wifiPhase === 'online' ? 'linked' : wifiPhase === 'joining' ? 'found' : 'searching'}
          caption={
            wifiPhase === 'sending'
              ? 'Sending the network details over Bluetooth...'
              : wifiPhase === 'joining'
                ? `Hub is joining ${network?.ssid}...`
                : `Hub is online on ${network?.ssid}`
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-[13px] font-bold text-ink">
              {wifiPhase === 'scanning' ? 'Hub is scanning for networks' : 'Networks the hub can see'}
            </p>
            {wifiPhase === 'scanning' ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-frisa-600" strokeWidth={2.4} aria-label="Scanning" />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSsid(null)
                  setWifiPassword('')
                  setWifiPhase('scanning')
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-2xs font-semibold text-ink-muted transition-colors hover:bg-mist hover:text-ink"
              >
                <RefreshCw className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                Rescan
              </button>
            )}
          </div>

          {wifiPhase === 'scanning' ? (
            <div className="card divide-y divide-line overflow-hidden" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="skeleton h-9 w-9 rounded-xl" />
                  <span className="flex-1 space-y-2">
                    <span className="skeleton block h-3.5 w-2/5 rounded-full" />
                    <span className="skeleton block h-3 w-1/4 rounded-full" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Wi-Fi networks"
              className="card animate-fade-up divide-y divide-line overflow-hidden"
            >
              {networks.map((n, i) => {
                const supported = hubSupportsNetwork(n)
                const selected = n.ssid === ssid
                return (
                  <button
                    key={n.ssid}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!supported}
                    onClick={() => {
                      setSsid(n.ssid)
                      setWifiPassword('')
                      setRevealWifi(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      selected ? 'bg-frisa-50' : 'hover:bg-mist/60',
                      !supported && 'opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        selected ? 'bg-frisa-500 text-white' : 'bg-mist text-ink-soft',
                      )}
                    >
                      <WifiIconFor network={n} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{n.ssid}</span>
                        {i === 0 ? <StatusChip tone="green">Strongest</StatusChip> : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {!supported
                          ? 'Hub needs a 2.4 GHz network'
                          : n.secured
                            ? `Secured · ${n.band}`
                            : `Open network · ${n.band}`}
                      </span>
                    </span>
                    <SignalBars level={n.strength} />
                    {n.secured ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {network ? (
            <div key={network.ssid} className="animate-fade-up">
              {network.secured ? (
                <>
                  <label htmlFor="wifi-password" className="mb-1.5 block text-[13px] font-bold text-ink">
                    Password for {network.ssid}
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    <input
                      id="wifi-password"
                      type={revealWifi ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(event) => setWifiPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') sendWifi()
                      }}
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={`At least ${MIN_WIFI_PASSWORD_LENGTH} characters`}
                      className="h-14 w-full rounded-2xl border border-line bg-mist/50 pl-11 pr-12 text-[15px] font-semibold tracking-wide text-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus:border-frisa-400 focus:bg-surface focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={revealWifi ? 'Hide Wi-Fi password' : 'Show Wi-Fi password'}
                      onClick={() => setRevealWifi((v) => !v)}
                      className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-ink"
                    >
                      {revealWifi ? (
                        <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-ember-200 bg-ember-50 p-3.5">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
                  <p className="text-xs leading-relaxed text-ember-800">
                    {network.ssid} has no password. The hub can use it, but a network you control is safer for a device
                    that lives in your kitchen.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  )

  const passwordBody = (
    <div className="space-y-4">
      {/* Device identity, now reachable over Wi-Fi */}
      <div className="flex items-center gap-3.5 rounded-3xl border border-line bg-surface p-3.5">
        <span
          className={cn(
            'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            verify === 'accepted' ? 'bg-frisa-500' : 'bg-frisa-50',
          )}
        >
          {verifying ? (
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-frisa-200" aria-hidden />
          ) : null}
          <FrisaMark className="relative h-8 w-8" tone={verify === 'accepted' ? 'white' : 'green'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{fridge.name}</p>
          <p className="num mt-0.5 truncate text-xs text-ink-muted">{fridge.deviceId}</p>
        </div>
        {verify === 'accepted' ? (
          <StatusChip tone="green" icon={CircleCheck}>
            Claimed
          </StatusChip>
        ) : (
          <StatusChip tone="green" icon={Wifi}>
            {fridge.wifi}
          </StatusChip>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-3xl bg-frisa-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
        <p className="text-[13px] leading-relaxed text-frisa-800">
          The hub is online, but it answers only phones that know its pairing password. Anyone on the same Wi-Fi can see
          it; only you can claim it.
        </p>
      </div>

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
            type={revealPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') claimHub()
            }}
            disabled={verifying || locked || verify === 'accepted'}
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
            aria-label={revealPassword ? 'Hide password' : 'Show password'}
            onClick={() => setRevealPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-ink"
          >
            {revealPassword ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
        </div>

        {error ? (
          <p
            id="pairing-error"
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-danger-600"
          >
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
    </div>
  )

  const syncPct = Math.round((syncedTasks / SYNC_TASKS.length) * 100)

  const syncedBody = (
    <div className="space-y-4">
      <div className="flex flex-col items-center pt-1 text-center">
        <span className="relative mb-4 inline-flex h-16 w-16 animate-pop-in items-center justify-center rounded-3xl bg-frisa-500 text-white">
          {!synced ? (
            <span className="absolute inset-0 animate-pulse-ring rounded-3xl bg-frisa-300" aria-hidden />
          ) : null}
          <CircleCheck className="relative h-8 w-8" strokeWidth={2.2} aria-hidden />
        </span>
        <p className="text-[15px] font-bold text-ink">{synced ? 'Connected and syncing' : 'Hub claimed'}</p>
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-ink-muted">
          {fridge.deviceId} holds a pairing token for this phone and talks to FRISA over {fridge.wifi}.
        </p>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-ink">First sync</span>
          <span className="num text-2xs font-semibold text-ink-muted" aria-live="polite">
            {synced ? 'Complete' : `${syncPct}%`}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist"
          role="progressbar"
          aria-valuenow={syncPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="First sync"
        >
          <div
            className="h-full rounded-full bg-frisa-500 transition-all duration-500"
            style={{ width: `${Math.max(6, syncPct)}%` }}
          />
        </div>

        <ul className="mt-4 space-y-3">
          {SYNC_TASKS.map(({ id, label, icon: Icon }, i) => {
            const state = i < syncedTasks ? 'done' : i === syncedTasks && !synced ? 'active' : 'pending'
            return (
              <li
                key={id}
                className={cn('flex items-center gap-3 transition-opacity', state === 'pending' && 'opacity-45')}
              >
                <span
                  className={cn(
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                    state === 'done' ? 'bg-frisa-500 text-white' : 'bg-mist text-ink-soft',
                  )}
                >
                  {state === 'done' ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  ) : state === 'active' ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.4} aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">
                  {label}
                  {id === 'inventory' && state === 'done' ? (
                    <span className="num ml-1.5 text-xs font-semibold text-ink-muted">
                      · {fridge.items.length} items
                    </span>
                  ) : null}
                </span>
                <span className="sr-only">
                  {state === 'done' ? 'done' : state === 'active' ? 'in progress' : 'waiting'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {synced ? (
        <dl className="grid animate-fade-up grid-cols-3 gap-2">
          {[
            { label: 'Fridge temp', value: `${fridge.temperature.toFixed(1)}°C`, icon: Thermometer },
            { label: 'Items seen', value: `${fridge.items.length}`, icon: PackageOpen },
            { label: 'Network', value: fridge.wifi, icon: Wifi },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-line bg-surface p-2.5 text-center">
              <Icon className="mx-auto h-4 w-4 text-frisa-600" strokeWidth={2} aria-hidden />
              <dd className="num mt-1.5 truncate text-[12px] font-bold text-ink">{value}</dd>
              <dt className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )

  const bodies = [powerBody, searchBody, wifiBody, passwordBody, syncedBody]

  /* ---- footers ---------------------------------------------------------- */

  const backButton =
    step > 0 && step < 4 && !busy ? (
      <Button
        variant="outline"
        size="lg"
        aria-label="Previous step"
        className="w-[52px] shrink-0 px-0"
        onClick={() => goTo(step - 1)}
      >
        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      </Button>
    ) : null

  const primary = (() => {
    switch (step) {
      case 0:
        return (
          <Button size="lg" block onClick={() => goTo(1)}>
            <Bluetooth className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            The light is blinking orange
          </Button>
        )
      case 1:
        return (
          <Button size="lg" block disabled={scan !== 'found'} onClick={linkOverBluetooth}>
            {scan === 'scanning' ? (
              <>
                <LoaderCircle className="h-[18px] w-[18px] animate-spin" strokeWidth={2.4} aria-hidden />
                Searching...
              </>
            ) : scan === 'linking' ? (
              'Linking...'
            ) : scan === 'linked' ? (
              'Linked'
            ) : (
              <>
                <Bluetooth className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                Link over Bluetooth
              </>
            )}
          </Button>
        )
      case 2:
        return (
          <Button size="lg" block disabled={!wifiReady || wifiPhase !== 'list'} onClick={sendWifi}>
            {wifiPhase === 'sending'
              ? 'Sending to hub...'
              : wifiPhase === 'joining'
                ? 'Hub is joining...'
                : wifiPhase === 'online'
                  ? 'Hub is online'
                  : wifiPhase === 'scanning'
                    ? 'Scanning...'
                    : network
                      ? 'Send Wi-Fi to hub'
                      : 'Choose a network'}
          </Button>
        )
      case 3:
        return (
          <Button
            size="lg"
            block
            onClick={claimHub}
            disabled={!password.trim() || verifying || locked || verify === 'accepted'}
          >
            {verify === 'contacting'
              ? 'Contacting hub...'
              : verify === 'verifying'
                ? 'Verifying on the device...'
                : verify === 'accepted'
                  ? 'Accepted'
                  : locked
                    ? `Locked for ${formatLockout(lockRemaining)}`
                    : 'Claim this hub'}
          </Button>
        )
      default:
        return (
          <Button size="lg" block disabled={!synced} onClick={onDone}>
            {synced ? (
              doneLabel
            ) : (
              <>
                <LoaderCircle className="h-[18px] w-[18px] animate-spin" strokeWidth={2.4} aria-hidden />
                Syncing...
              </>
            )}
          </Button>
        )
    }
  })()

  const hint: Record<number, ReactNode> = {
    0: 'Light not blinking? Unplug the hub, wait five seconds and hold the power button again.',
    1:
      scan === 'found' ? (
        <button
          type="button"
          onClick={() => setScan('scanning')}
          className="font-semibold text-frisa-700 hover:underline"
        >
          Not your hub? Search again
        </button>
      ) : (
        'Keep the hub within a couple of metres while it is found.'
      ),
    2: (
      <span className="flex items-start gap-1.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
        Sent over the encrypted Bluetooth link straight to the hub. FRISA never sees your Wi-Fi password.
      </span>
    ),
    3: (
      <span className="flex items-start gap-1.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
        The password is checked on the hub. FRISA keeps only a salted digest of it, never the password itself.
      </span>
    ),
    4: synced
      ? 'Bluetooth is off again. The hub now talks to the app over Wi-Fi only.'
      : 'Keep the app open for a moment.',
  }

  const footer = (
    <div className="space-y-2.5">
      <div className="flex gap-2.5">
        {backButton}
        {primary}
      </div>
      <p className="px-1 text-center text-2xs leading-relaxed text-ink-faint">{hint[step]}</p>
    </div>
  )

  return (
    <>
      {children({
        step,
        title: heading[step].title,
        description: heading[step].description,
        stepper: <PairingStepper current={step} />,
        body: (
          <div key={step} ref={bodyRef} className="animate-fade-up">
            {bodies[step]}
          </div>
        ),
        footer,
        busy,
        done: synced,
      })}
    </>
  )
}
