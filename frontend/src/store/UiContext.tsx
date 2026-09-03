import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'

export interface UiContextValue {
  assistantOpen: boolean
  /** Optional question the assistant answers as soon as the sheet opens. */
  assistantSeed?: string
  openAssistant: (seed?: string) => void
  closeAssistant: () => void
  fridgeSheetOpen: boolean
  setFridgeSheetOpen: (open: boolean) => void
}

export const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantSeed, setAssistantSeed] = useState<string | undefined>()
  const [fridgeSheetOpen, setFridgeSheetOpen] = useState(false)

  const openAssistant = useCallback((seed?: string) => {
    setAssistantSeed(seed)
    setAssistantOpen(true)
  }, [])

  const closeAssistant = useCallback(() => {
    setAssistantOpen(false)
    setAssistantSeed(undefined)
  }, [])

  const value = useMemo(
    () => ({ assistantOpen, assistantSeed, openAssistant, closeAssistant, fridgeSheetOpen, setFridgeSheetOpen }),
    [assistantOpen, assistantSeed, openAssistant, closeAssistant, fridgeSheetOpen],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}
