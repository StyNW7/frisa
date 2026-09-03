import { useState } from 'react'
import { Check, Lock, Refrigerator, Settings2, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/common/BottomSheet'
import { StatusChip } from '@/components/common/Badges'
import { Button } from '@/components/common/Button'
import { PairingSheet } from '@/components/device/PairingSheet'
import { useApp, useToast, useUi } from '@/hooks/useApp'
import { cn, isPriority, pluralize, relativeMinutes } from '@/lib/utils'

export function FridgeSwitcherSheet() {
  const { fridgeSheetOpen, setFridgeSheetOpen } = useUi()
  const { fridges, activeFridgeId, setActiveFridge } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [pairingTarget, setPairingTarget] = useState<string | null>(null)

  const select = (id: string, name: string) => {
    setActiveFridge(id)
    setFridgeSheetOpen(false)
    toast(`Switched to ${name}`, { description: 'Inventory, recipes and insights now follow this fridge.' })
  }

  const startPairing = (id: string) => {
    setFridgeSheetOpen(false)
    setPairingTarget(id)
  }

  return (
    <>
      <BottomSheet
        open={fridgeSheetOpen}
        onClose={() => setFridgeSheetOpen(false)}
        title="Your fridges"
        description="FRISA keeps a separate inventory for every hub you have paired."
        footer={
          <Button
            variant="outline"
            size="lg"
            block
            onClick={() => {
              setFridgeSheetOpen(false)
              navigate('/fridges')
            }}
          >
            <Settings2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            Manage fridges
          </Button>
        }
      >
        <ul className="space-y-2.5">
          {fridges.map((fridge) => {
            const active = fridge.id === activeFridgeId
            const priority = fridge.items.filter(isPriority).length
            const locked = !fridge.paired

            return (
              <li key={fridge.id}>
                <button
                  type="button"
                  onClick={() => (locked ? startPairing(fridge.id) : select(fridge.id, fridge.name))}
                  aria-current={active}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-3xl border p-3.5 text-left transition-all duration-200 active:scale-[0.99]',
                    active
                      ? 'border-frisa-500 bg-frisa-50'
                      : locked
                        ? 'border-dashed border-line bg-mist/40 hover:border-ember-200'
                        : 'border-line bg-surface hover:border-frisa-200',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                      locked
                        ? 'bg-ember-50 text-ember-600'
                        : fridge.online
                          ? 'bg-frisa-100 text-frisa-700'
                          : 'bg-mist text-ink-faint',
                    )}
                  >
                    {locked ? (
                      <Lock className="h-5 w-5" strokeWidth={2} aria-hidden />
                    ) : fridge.online ? (
                      <Refrigerator className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                    ) : (
                      <WifiOff className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">{fridge.name}</span>
                      {active ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-frisa-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                      ) : null}
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-ink-muted">
                      {locked
                        ? `${fridge.location} · contents hidden until paired`
                        : `${fridge.location} · ${pluralize(fridge.items.length, 'item')}${priority > 0 ? ` · ${priority} need attention` : ''}`}
                    </span>

                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      {locked ? (
                        <>
                          <StatusChip tone="orange" icon={Lock}>
                            Password required
                          </StatusChip>
                          <StatusChip tone="neutral">Tap to connect</StatusChip>
                        </>
                      ) : (
                        <>
                          <StatusChip tone={fridge.online ? 'green' : 'neutral'}>
                            {fridge.online ? 'Connected' : 'Offline'}
                          </StatusChip>
                          <StatusChip tone="neutral">
                            {fridge.online
                              ? `Synced ${relativeMinutes(fridge.lastSyncMinutes)}`
                              : `Last seen ${relativeMinutes(fridge.lastSyncMinutes)}`}
                          </StatusChip>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>

      <PairingSheet
        open={pairingTarget !== null}
        fridgeId={pairingTarget}
        onClose={() => setPairingTarget(null)}
        onPaired={(fridge) => {
          setActiveFridge(fridge.id)
          toast(`${fridge.name} unlocked`, { description: 'Its inventory is now visible on this phone.' })
        }}
      />
    </>
  )
}
