import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BatteryMedium,
  Camera,
  ChevronRight,
  CircleCheck,
  Cpu,
  KeyRound,
  Mic,
  Power,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Thermometer,
  TriangleAlert,
  Volume2,
  Wifi,
} from 'lucide-react'
import { TopHeader } from '@/components/common/TopHeader'
import { Button } from '@/components/common/Button'
import { ConfirmationSheet } from '@/components/common/BottomSheet'
import { StatusChip } from '@/components/common/Badges'
import { FrisaMark } from '@/components/common/FrisaMark'
import { SectionHeader } from '@/components/common/Primitives'
import { ChangePasswordSheet } from '@/components/device/ChangePasswordSheet'
import { DeviceLabelCard } from '@/components/device/PairingSheet'
import { useApp, useToast, useUi } from '@/hooks/useApp'
import { cn, formatDate, formatEventTime, relativeMinutes } from '@/lib/utils'

type TestKey = 'camera' | 'voice' | 'sync' | 'reconnect'

export function DevicePage() {
  const { activeFridge, fridges, syncFridge, activity, logActivity, unpairDevice } = useApp()
  const { toast } = useToast()
  const { openAssistant } = useUi()
  const [running, setRunning] = useState<TestKey | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [unpairOpen, setUnpairOpen] = useState(false)

  const security = activeFridge.security
  const otherPaired = fridges.filter((f) => f.paired && f.id !== activeFridge.id).length

  /* Diagnostics finish on a timer, so leaving the screen mid-test has to cancel it
     rather than raise a toast for a page the user already left. */
  const testTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(testTimer.current), [])

  const run = (key: TestKey) => {
    if (running) return
    setRunning(key)
    testTimer.current = window.setTimeout(() => {
      setRunning(null)
      switch (key) {
        case 'camera':
          logActivity('sync', 'Camera test completed', 'Image sensor responded in 0.4 s')
          toast('Camera is ready', { description: 'The hub captured a clear test frame.' })
          break
        case 'voice':
          logActivity('sync', 'Voice test completed', 'Microphone and speaker responded')
          toast('Voice is ready', { description: 'Try asking FRISA a question.' })
          openAssistant('What should I use first?')
          break
        case 'sync':
          syncFridge(activeFridge.id)
          toast('Inventory synchronized', { description: `${activeFridge.items.length} items confirmed.` })
          break
        default:
          syncFridge(activeFridge.id)
          toast('Device connected', { description: `${activeFridge.deviceId} is back online.` })
      }
    }, 1400)
  }

  const capabilities: Array<{ icon: LucideIcon; label: string; detail: string }> = [
    { icon: Camera, label: 'Camera', detail: 'AI item recognition' },
    { icon: Mic, label: 'Microphone', detail: 'Voice commands' },
    { icon: Volume2, label: 'Speaker', detail: 'Spoken answers' },
    { icon: Wifi, label: 'Network', detail: activeFridge.wifi },
  ]

  const actions: Array<{ key: TestKey; icon: LucideIcon; label: string; variant: 'secondary' | 'outline' }> = [
    { key: 'camera', icon: Camera, label: 'Test Camera', variant: 'secondary' },
    { key: 'voice', icon: Mic, label: 'Test Voice', variant: 'secondary' },
    { key: 'sync', icon: RefreshCw, label: 'Sync Inventory', variant: 'outline' },
    { key: 'reconnect', icon: Power, label: 'Reconnect Device', variant: 'outline' },
  ]

  return (
    <div className="pb-8">
      <TopHeader title="FRISA Hub" subtitle={activeFridge.deviceId} />

      <div className="space-y-6 px-5 pt-4">
        {/* Device hero */}
        <section
          className="relative overflow-hidden rounded-3xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #1CA167 0%, #168653 55%, #0D4E34 100%)' }}
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-inset ring-white/20">
              {activeFridge.online ? (
                <span className="absolute inset-0 animate-pulse-ring rounded-3xl bg-white/25" aria-hidden />
              ) : null}
              <FrisaMark className="relative h-10 w-10" tone="white" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold leading-tight tracking-tight">FRISA Hub</h2>
              <p className="num mt-0.5 text-xs text-white/70">{activeFridge.deviceId}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusChip tone="onGreen" icon={CircleCheck}>
                  {activeFridge.online ? 'Connected' : 'Offline'}
                </StatusChip>
                <StatusChip tone="onGreen" icon={BatteryMedium}>
                  {activeFridge.battery}%
                </StatusChip>
              </div>
            </div>
          </div>

          <dl className="relative mt-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Temperature', value: `${activeFridge.temperature.toFixed(1)}°C`, icon: Thermometer },
              { label: 'Wi-Fi', value: activeFridge.wifi, icon: Wifi },
              { label: 'Last sync', value: relativeMinutes(activeFridge.lastSyncMinutes), icon: RefreshCw },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-inset ring-white/15">
                <Icon className="mx-auto h-4 w-4 text-white/70" strokeWidth={2} aria-hidden />
                <dd className="mt-1.5 truncate text-[11px] font-bold">{value}</dd>
                <dt className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/60">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Pairing security */}
        <section>
          <SectionHeader title="Pairing security" subtitle="Who is allowed to talk to this hub." />

          {security.usingFactoryPassword ? (
            <div className="mb-3 flex items-start gap-3 rounded-3xl border border-ember-200 bg-ember-50 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ember-800">Still using the factory password</p>
                <p className="mt-1 text-[13px] leading-snug text-ember-800/80">
                  Every hub of this model ships with the same printed password. Anyone in Wi-Fi range who can read
                  the label could pair with it.
                </p>
                <Button variant="warning" size="sm" className="mt-3" onClick={() => setPasswordOpen(true)}>
                  <KeyRound className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  Set your own password
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-start gap-3 rounded-3xl border border-frisa-100 bg-frisa-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2.2} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-frisa-800">Protected by your own password</p>
                <p className="mt-1 text-[13px] leading-snug text-frisa-700/90">
                  The factory password no longer works on this hub. FRISA stores only a salted digest of the one
                  you chose.
                </p>
              </div>
            </div>
          )}

          <ul className="card divide-y divide-line overflow-hidden">
            <li className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-frisa-50 text-frisa-600">
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">This phone is paired</span>
                <span className="block truncate text-xs text-ink-muted">
                  {security.pairedAt
                    ? `Authorised on ${formatDate(security.pairedAt.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Authorised on this device'}
                </span>
              </span>
              <StatusChip tone="green">Token held</StatusChip>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-mist/60"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mist text-ink-soft">
                  <KeyRound className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">Change pairing password</span>
                  <span className="block truncate text-xs text-ink-muted">Requires the current password</span>
                </span>
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setUnpairOpen(true)}
                disabled={otherPaired === 0}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-mist/60 disabled:opacity-45"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger-50 text-danger-500">
                  <ShieldOff className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">Unpair this phone</span>
                  <span className="block truncate text-xs text-ink-muted">
                    {otherPaired === 0
                      ? 'Not while this is your only paired hub'
                      : 'Revokes the token and locks the fridge again'}
                  </span>
                </span>
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
              </button>
            </li>
          </ul>

          <div className="mt-3">
            <DeviceLabelCard fridge={activeFridge} />
          </div>
        </section>

        {/* Capabilities */}
        <section>
          <SectionHeader title="Hardware status" subtitle="Everything the hub needs to recognise your food." />
          <ul className="card divide-y divide-line overflow-hidden">
            {capabilities.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-frisa-50 text-frisa-600">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block truncate text-xs text-ink-muted">{detail}</span>
                </span>
                <StatusChip tone="green" icon={CircleCheck}>
                  Ready
                </StatusChip>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <section>
          <SectionHeader title="Device actions" />
          <div className="grid grid-cols-2 gap-2.5">
            {actions.map(({ key, icon: Icon, label, variant }) => (
              <Button
                key={key}
                variant={variant}
                size="lg"
                onClick={() => run(key)}
                disabled={running !== null}
                className="justify-start"
              >
                <Icon className={cn('h-[18px] w-[18px]', running === key && 'animate-spin')} strokeWidth={2.1} aria-hidden />
                {running === key ? 'Running...' : label}
              </Button>
            ))}
          </div>
        </section>

        {/* IoT timeline */}
        <section>
          <SectionHeader title="Hub activity" subtitle="Every interaction between the device and the app." />
          <ol className="card overflow-hidden p-4">
            {activity.slice(0, 7).map((event, index, all) => (
              <li key={event.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                {index < all.length - 1 ? (
                  <span className="absolute left-[11px] top-6 h-full w-px bg-line" aria-hidden />
                ) : null}
                <span className="relative mt-1 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-frisa-50 ring-4 ring-surface">
                  <Cpu className="h-3 w-3 text-frisa-600" strokeWidth={2.4} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{event.title}</p>
                  {event.detail ? <p className="mt-0.5 text-xs text-ink-muted">{event.detail}</p> : null}
                  <p className="num mt-1 text-[10px] font-medium text-ink-faint">{formatEventTime(event.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ChangePasswordSheet open={passwordOpen} fridge={activeFridge} onClose={() => setPasswordOpen(false)} />

      <ConfirmationSheet
        open={unpairOpen}
        title={`Unpair ${activeFridge.name}?`}
        description="This phone loses its pairing token. The fridge locks until you enter the pairing password again."
        confirmLabel="Unpair device"
        tone="danger"
        onCancel={() => setUnpairOpen(false)}
        onConfirm={() => {
          setUnpairOpen(false)
          unpairDevice(activeFridge.id)
          toast(`${activeFridge.name} unpaired`, {
            tone: 'info',
            description: 'Pair again from Fridges whenever you need it.',
          })
        }}
      />
    </div>
  )
}
