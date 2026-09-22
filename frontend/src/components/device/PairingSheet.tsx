import { useEffect, useRef, useState } from 'react'
import type { Fridge } from '@/types'
import { BottomSheet } from '@/components/common/BottomSheet'
import { PairingFlow } from '@/components/device/PairingFlow'
import { useApp } from '@/hooks/useApp'

/**
 * The five-step hub setup inside a bottom sheet, for pairing a hub after the
 * initial onboarding: from the Fridges screen or the fridge switcher.
 */
export function PairingSheet({
  open,
  fridgeId,
  onClose,
  onPaired,
}: {
  open: boolean
  fridgeId: string | null
  onClose: () => void
  /** Called once the hub is claimed and synced. `usedFactoryPassword` drives the change-password nudge. */
  onPaired?: (fridge: Fridge, usedFactoryPassword: boolean) => void
}) {
  const { fridges } = useApp()
  const fridge = fridges.find((f) => f.id === fridgeId)

  /* Hosts clear `fridgeId` on close, so the last fridge is kept for the exit animation. */
  const lastFridge = useRef<Fridge | undefined>(fridge)
  if (fridge) lastFridge.current = fridge
  const shown = fridge ?? lastFridge.current

  /* Every opening starts from step one. */
  const [session, setSession] = useState(0)
  useEffect(() => {
    if (open) setSession((s) => s + 1)
  }, [open])

  const [result, setResult] = useState<{ fridge: Fridge; usedFactoryPassword: boolean } | null>(null)

  if (!shown) return null

  return (
    <PairingFlow
      key={session}
      fridge={shown}
      onComplete={(paired, usedFactoryPassword) => setResult({ fridge: paired, usedFactoryPassword })}
      onDone={() => {
        if (result) onPaired?.(result.fridge, result.usedFactoryPassword)
        onClose()
      }}
    >
      {(flow) => (
        <BottomSheet
          open={open}
          onClose={flow.busy ? () => {} : onClose}
          dismissible={!flow.busy && !flow.done}
          title={flow.title}
          description={flow.description}
          footer={flow.footer}
        >
          <div className="space-y-5 pb-2">
            {flow.stepper}
            {flow.body}
          </div>
        </BottomSheet>
      )}
    </PairingFlow>
  )
}
