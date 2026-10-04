import { useContext, useMemo } from 'react'
import { AppContext } from '@/store/AppContext'
import { ToastContext } from '@/store/ToastContext'
import { UiContext } from '@/store/UiContext'
import { rankRecipes } from '@/lib/recipes'
import { RECIPES } from '@/data/recipes'

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

/** Recipes ranked for the selected fridge and screened against the household preferences. */
export function useRecipeRanking() {
  const { items, preferences } = useApp()
  return useMemo(() => rankRecipes(RECIPES, items, preferences), [items, preferences])
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside <UiProvider>')
  return ctx
}
