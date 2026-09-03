import { createContext, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  ActivityEvent,
  ActivityKind,
  AppNotification,
  AssistantMessage,
  DeviceSecurity,
  Fridge,
  FoodItem,
  NotificationCategory,
  Recipe,
  SavingsSummary,
  ShoppingItem,
  UserPreference,
} from '@/types'
import { createSeedFridges, pairedHomeSecurity } from '@/data/fridges'
import {
  createSeedActivity,
  createSeedNotifications,
  createSeedShopping,
  DEFAULT_PREFERENCES,
} from '@/data/seed'
import { CO2_PER_KG, INSIGHT_DATA } from '@/data/insights'
import { planConsumption } from '@/lib/recipes'
import {
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  passwordAccepted,
  verifyPairing,
  type PairingOutcome,
} from '@/lib/pairing'
import { derivePairingDigest, randomHex, timingSafeEqual } from '@/lib/crypto'
import { clamp, isPriority, riskScore, uid } from '@/lib/utils'
import { readStore, STORAGE_KEYS, writeStore, clearStore } from '@/lib/storage'

/* -------------------------------------------------------------------------- */
/*  State                                                                      */
/* -------------------------------------------------------------------------- */

export interface SessionSavings {
  foodSavedKg: number
  moneySaved: number
  itemsRescued: number
}

export interface AppState {
  fridges: Fridge[]
  activeFridgeId: string
  notifications: AppNotification[]
  activity: ActivityEvent[]
  shopping: ShoppingItem[]
  preferences: UserPreference
  favorites: string[]
  assistantLog: AssistantMessage[]
  /** Everything rescued during this demo session, added on top of the seeded analytics. */
  sessionSavings: SessionSavings
  onboarded: boolean
  setupDone: boolean
}

type Action =
  | { type: 'set-active-fridge'; id: string }
  | { type: 'rename-fridge'; id: string; name: string }
  | { type: 'sync-fridge'; id: string }
  | { type: 'pair-device'; id: string; token: string }
  | { type: 'pair-failed'; id: string }
  | { type: 'unpair-device'; id: string }
  | { type: 'set-device-password'; id: string; digest: string; token: string }
  | { type: 'add-item'; fridgeId: string; item: FoodItem }
  | { type: 'update-item'; fridgeId: string; id: string; patch: Partial<FoodItem> }
  | { type: 'consume-item'; fridgeId: string; id: string; portion: number }
  | { type: 'remove-item'; fridgeId: string; id: string }
  | { type: 'add-savings'; delta: SessionSavings }
  | { type: 'push-activity'; event: ActivityEvent }
  | { type: 'push-notification'; notification: AppNotification }
  | { type: 'read-notification'; id: string }
  | { type: 'read-all-notifications' }
  | { type: 'clear-notifications' }
  | { type: 'shopping-add'; item: ShoppingItem }
  | { type: 'shopping-toggle'; id: string }
  | { type: 'shopping-remove'; id: string }
  | { type: 'set-preferences'; preferences: UserPreference }
  | { type: 'toggle-favorite'; id: string }
  | { type: 'assistant-push'; message: AssistantMessage }
  | { type: 'assistant-reset' }
  | { type: 'set-onboarded' }
  | { type: 'set-setup-done' }
  | { type: 'reset-demo'; state: AppState }

function mapFridge(state: AppState, fridgeId: string, fn: (fridge: Fridge) => Fridge): AppState {
  return { ...state, fridges: state.fridges.map((f) => (f.id === fridgeId ? fn(f) : f)) }
}

function mapItems(state: AppState, fridgeId: string, fn: (items: FoodItem[]) => FoodItem[]): AppState {
  return mapFridge(state, fridgeId, (f) => ({ ...f, items: fn(f.items) }))
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set-active-fridge': {
      // A fridge that has not been paired on this device stays unreadable.
      const target = state.fridges.find((f) => f.id === action.id)
      if (!target?.paired) return state
      return { ...state, activeFridgeId: action.id }
    }

    case 'pair-device':
      return mapFridge(state, action.id, (f) => ({
        ...f,
        paired: true,
        security: {
          ...f.security,
          pairingToken: action.token,
          pairedAt: new Date().toISOString(),
          failedAttempts: 0,
          lockedUntil: undefined,
        },
      }))

    case 'pair-failed':
      return mapFridge(state, action.id, (f) => {
        const failedAttempts = f.security.failedAttempts + 1
        const locked = failedAttempts >= MAX_ATTEMPTS
        return {
          ...f,
          security: {
            ...f.security,
            // The counter restarts after a lockout, so the next window is a fresh five.
            failedAttempts: locked ? 0 : failedAttempts,
            lockedUntil: locked ? Date.now() + LOCKOUT_MS : f.security.lockedUntil,
          },
        }
      })

    case 'unpair-device': {
      // Never strand the app with no readable fridge; the UI blocks this too.
      const pairedCount = state.fridges.filter((f) => f.paired).length
      if (pairedCount <= 1) return state

      const next = mapFridge(state, action.id, (f) => ({
        ...f,
        paired: false,
        security: { ...f.security, pairingToken: undefined, pairedAt: undefined, failedAttempts: 0 },
      }))
      if (state.activeFridgeId !== action.id) return next
      const fallback = next.fridges.find((f) => f.paired)
      return fallback ? { ...next, activeFridgeId: fallback.id } : next
    }

    case 'set-device-password':
      return mapFridge(state, action.id, (f) => ({
        ...f,
        security: {
          ...f.security,
          passwordDigest: action.digest,
          usingFactoryPassword: false,
          // Changing the password re-issues the token, so other phones must pair again.
          pairingToken: action.token,
          failedAttempts: 0,
          lockedUntil: undefined,
        },
      }))

    case 'rename-fridge':
      return mapFridge(state, action.id, (f) => ({ ...f, name: action.name }))

    case 'sync-fridge':
      return mapFridge(state, action.id, (f) => ({ ...f, online: true, lastSyncMinutes: 0 }))

    case 'add-item':
      return mapItems(state, action.fridgeId, (items) => {
        const existing = items.find((i) => i.id === action.item.id)
        if (existing) {
          return items.map((i) =>
            i.id === action.item.id
              ? {
                  ...i,
                  quantity: i.quantity + action.item.quantity,
                  initialQuantity: i.initialQuantity + action.item.quantity,
                  expiresAt: action.item.expiresAt,
                }
              : i,
          )
        }
        return [action.item, ...items]
      })

    case 'update-item':
      return mapItems(state, action.fridgeId, (items) =>
        items.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i)),
      )

    case 'consume-item':
      return mapItems(state, action.fridgeId, (items) =>
        items
          .map((i) =>
            i.id === action.id
              ? { ...i, quantity: Math.round((i.quantity - action.portion) * 1000) / 1000 }
              : i,
          )
          .filter((i) => i.quantity > 0.0001),
      )

    case 'remove-item':
      return mapItems(state, action.fridgeId, (items) => items.filter((i) => i.id !== action.id))

    case 'add-savings':
      return {
        ...state,
        sessionSavings: {
          foodSavedKg: state.sessionSavings.foodSavedKg + action.delta.foodSavedKg,
          moneySaved: state.sessionSavings.moneySaved + action.delta.moneySaved,
          itemsRescued: state.sessionSavings.itemsRescued + action.delta.itemsRescued,
        },
      }

    case 'push-activity':
      return { ...state, activity: [action.event, ...state.activity].slice(0, 40) }

    case 'push-notification':
      return { ...state, notifications: [action.notification, ...state.notifications].slice(0, 40) }

    case 'read-notification':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      }

    case 'read-all-notifications':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    case 'clear-notifications':
      return { ...state, notifications: [] }

    case 'shopping-add':
      return { ...state, shopping: [action.item, ...state.shopping] }

    case 'shopping-toggle':
      return {
        ...state,
        shopping: state.shopping.map((s) => (s.id === action.id ? { ...s, checked: !s.checked } : s)),
      }

    case 'shopping-remove':
      return { ...state, shopping: state.shopping.filter((s) => s.id !== action.id) }

    case 'set-preferences':
      return { ...state, preferences: action.preferences }

    case 'toggle-favorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.id)
          ? state.favorites.filter((f) => f !== action.id)
          : [...state.favorites, action.id],
      }

    case 'assistant-push':
      return { ...state, assistantLog: [...state.assistantLog, action.message] }

    case 'assistant-reset':
      return { ...state, assistantLog: [] }

    case 'set-onboarded':
      return { ...state, onboarded: true }

    case 'set-setup-done':
      return { ...state, setupDone: true, onboarded: true }

    case 'reset-demo':
      return action.state

    default:
      return state
  }
}

function createInitialState(): AppState {
  const setupDone = readStore<boolean>(STORAGE_KEYS.setupDone, false)
  const storedNames = readStore<Record<string, string>>(STORAGE_KEYS.fridgeNames, {})

  const fridges = createSeedFridges().map((fridge) => {
    const named = storedNames[fridge.id] ? { ...fridge, name: storedNames[fridge.id] } : fridge
    // Someone who finished setup in an earlier session already paired the home hub
    // and chose their own password, so restore it rather than locking them out.
    if (named.id === 'home' && setupDone) {
      return { ...named, paired: true, security: pairedHomeSecurity() }
    }
    return named
  })

  const storedActive = readStore<string>(STORAGE_KEYS.activeFridge, 'home')
  const activeIsUsable = fridges.some((f) => f.id === storedActive && f.paired)

  return {
    fridges,
    activeFridgeId: activeIsUsable ? storedActive : (fridges.find((f) => f.paired)?.id ?? 'home'),
    notifications: createSeedNotifications(),
    activity: createSeedActivity(),
    shopping: createSeedShopping(),
    preferences: readStore<UserPreference>(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES),
    favorites: readStore<string[]>(STORAGE_KEYS.favorites, ['greek-yogurt-fruit-bowl']),
    assistantLog: [],
    sessionSavings: { foodSavedKg: 0, moneySaved: 0, itemsRescued: 0 },
    onboarded: readStore<boolean>(STORAGE_KEYS.onboarded, false),
    setupDone: readStore<boolean>(STORAGE_KEYS.setupDone, false),
  }
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

export type ChangePasswordResult =
  | { status: 'changed' }
  | { status: 'wrong-current' }
  | { status: 'rejected'; reason: string }

export interface RecipeCompletionResult {
  rescuedValue: number
  rescuedKg: number
  itemsRescued: number
  consumed: Array<{ name: string; portion: number; unit: string }>
}

export interface AppContextValue extends AppState {
  activeFridge: Fridge
  items: FoodItem[]
  priorityItems: FoodItem[]
  unreadCount: number
  /** Seeded analytics plus everything rescued in this session. */
  savingsFor: (period: '7d' | '30d' | '3m') => SavingsSummary
  setActiveFridge: (id: string) => void
  renameFridge: (id: string, name: string) => void
  syncFridge: (id: string) => void
  /** Verifies the pairing password on the hub and, on success, authorises this app. */
  pairDevice: (fridgeId: string, password: string) => PairingOutcome
  /** Revokes this app's pairing token. The fridge locks again until it is re-paired. */
  unpairDevice: (fridgeId: string) => void
  changeDevicePassword: (
    fridgeId: string,
    currentPassword: string,
    newPassword: string,
  ) => ChangePasswordResult
  addItem: (item: FoodItem, opts?: { source?: FoodItem['source'] }) => void
  updateItem: (id: string, patch: Partial<FoodItem>) => void
  consumeItem: (id: string, portion?: number) => void
  wasteItem: (id: string) => void
  removeItem: (id: string) => void
  completeRecipe: (recipe: Recipe) => RecipeCompletionResult
  logActivity: (kind: ActivityKind, title: string, detail?: string) => void
  notify: (
    category: NotificationCategory,
    title: string,
    body: string,
    opts?: { high?: boolean; link?: string },
  ) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  addShoppingItem: (name: string, qty: string, note?: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  setPreferences: (preferences: UserPreference) => void
  toggleFavorite: (id: string) => void
  pushAssistantMessage: (role: AssistantMessage['role'], text: string) => void
  resetAssistant: () => void
  completeOnboarding: () => void
  completeSetup: (patch: Partial<UserPreference> & { fridgeName?: string; homePassword?: string }) => void
  resetDemo: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  /* Persist the light, preference-shaped slices only. Inventory intentionally
     resets on reload so the pitch always starts from a known state. */
  useEffect(() => writeStore(STORAGE_KEYS.onboarded, state.onboarded), [state.onboarded])
  useEffect(() => writeStore(STORAGE_KEYS.setupDone, state.setupDone), [state.setupDone])
  useEffect(() => writeStore(STORAGE_KEYS.activeFridge, state.activeFridgeId), [state.activeFridgeId])
  useEffect(() => writeStore(STORAGE_KEYS.preferences, state.preferences), [state.preferences])
  useEffect(() => writeStore(STORAGE_KEYS.favorites, state.favorites), [state.favorites])
  useEffect(() => {
    writeStore(
      STORAGE_KEYS.fridgeNames,
      Object.fromEntries(state.fridges.map((f) => [f.id, f.name])),
    )
  }, [state.fridges])

  const activeFridge = useMemo(
    () => state.fridges.find((f) => f.id === state.activeFridgeId) ?? state.fridges[0],
    [state.fridges, state.activeFridgeId],
  )

  const items = activeFridge.items

  const priorityItems = useMemo(
    () => items.filter(isPriority).sort((a, b) => riskScore(b) - riskScore(a)),
    [items],
  )

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  )

  const logActivity = useCallback((kind: ActivityKind, title: string, detail?: string) => {
    dispatch({
      type: 'push-activity',
      event: { id: uid('act'), kind, title, detail, at: new Date().toISOString() },
    })
  }, [])

  const notify = useCallback<AppContextValue['notify']>((category, title, body, opts) => {
    dispatch({
      type: 'push-notification',
      notification: {
        id: uid('ntf'),
        category,
        title,
        body,
        at: new Date().toISOString(),
        read: false,
        high: opts?.high,
        link: opts?.link,
      },
    })
  }, [])

  const addItem = useCallback<AppContextValue['addItem']>(
    (item) => {
      dispatch({ type: 'add-item', fridgeId: state.activeFridgeId, item })
      logActivity(
        'added',
        `${item.name} added${item.source === 'hub' ? ' through FRISA Hub' : item.source === 'phone' ? ' with phone camera' : ' manually'}`,
        `${item.quantity} ${item.unit}`,
      )
      if (isPriority(item)) {
        notify('Priority', `${item.name} needs attention soon`, 'FRISA added it to Use These First.', {
          high: true,
          link: `/food/${item.id}`,
        })
      }
    },
    [state.activeFridgeId, logActivity, notify],
  )

  const updateItem = useCallback<AppContextValue['updateItem']>(
    (id, patch) => dispatch({ type: 'update-item', fridgeId: state.activeFridgeId, id, patch }),
    [state.activeFridgeId],
  )

  const consumeItem = useCallback<AppContextValue['consumeItem']>(
    (id, portion) => {
      const item = items.find((i) => i.id === id)
      if (!item) return
      const amount = portion ?? item.quantity
      const wasPriority = isPriority(item)
      dispatch({ type: 'consume-item', fridgeId: state.activeFridgeId, id, portion: amount })
      const unitValue = item.value / item.quantity
      const unitWeight = item.weightKg / item.quantity
      dispatch({
        type: 'add-savings',
        delta: {
          foodSavedKg: wasPriority ? unitWeight * amount : 0,
          moneySaved: wasPriority ? Math.round(unitValue * amount) : 0,
          itemsRescued: wasPriority && amount >= item.quantity ? 1 : 0,
        },
      })
      logActivity('consumed', `${item.name} marked as used`, `${amount} ${item.unit} deducted`)
    },
    [items, state.activeFridgeId, logActivity],
  )

  const wasteItem = useCallback<AppContextValue['wasteItem']>(
    (id) => {
      const item = items.find((i) => i.id === id)
      if (!item) return
      dispatch({ type: 'remove-item', fridgeId: state.activeFridgeId, id })
      logActivity('wasted', `${item.name} marked as wasted`, 'Logged so FRISA can adjust future reminders')
    },
    [items, state.activeFridgeId, logActivity],
  )

  const removeItem = useCallback<AppContextValue['removeItem']>(
    (id) => {
      const item = items.find((i) => i.id === id)
      dispatch({ type: 'remove-item', fridgeId: state.activeFridgeId, id })
      if (item) logActivity('removed', `${item.name} removed from inventory`)
    },
    [items, state.activeFridgeId, logActivity],
  )

  const completeRecipe = useCallback<AppContextValue['completeRecipe']>(
    (recipe) => {
      const plan = planConsumption(recipe, items)
      plan.forEach((c) =>
        dispatch({ type: 'consume-item', fridgeId: state.activeFridgeId, id: c.itemId, portion: c.portion }),
      )

      const rescuedValue = plan.reduce((s, c) => s + c.value, 0)
      const rescuedKg = plan.reduce((s, c) => s + (c.wasPriority ? c.weightKg : 0), 0)
      const itemsRescued = plan.filter((c) => c.wasPriority).length

      dispatch({
        type: 'add-savings',
        delta: { foodSavedKg: rescuedKg, moneySaved: rescuedValue, itemsRescued },
      })
      logActivity('recipe', `${recipe.name} completed`, `Rescued about Rp${rescuedValue.toLocaleString('id-ID')}`)
      notify(
        'Recipes',
        'Inventory updated',
        `${plan.length} ingredients were deducted after cooking ${recipe.name}.`,
        { link: '/inventory' },
      )

      return {
        rescuedValue,
        rescuedKg,
        itemsRescued,
        consumed: plan.map((c) => {
          const item = items.find((i) => i.id === c.itemId)
          return { name: c.name, portion: c.portion, unit: item?.unit ?? '' }
        }),
      }
    },
    [items, state.activeFridgeId, logActivity, notify],
  )

  const savingsFor = useCallback<AppContextValue['savingsFor']>(
    (period) => {
      const base = INSIGHT_DATA[period].summary
      const s = state.sessionSavings
      const foodSavedKg = base.foodSavedKg + s.foodSavedKg
      return {
        foodSavedKg,
        moneySaved: base.moneySaved + s.moneySaved,
        itemsRescued: base.itemsRescued + s.itemsRescued,
        wasteReductionPct: Math.round(clamp(base.wasteReductionPct + s.itemsRescued * 0.8, 0, 72)),
        co2Kg: Math.round(foodSavedKg * CO2_PER_KG * 10) / 10,
      }
    },
    [state.sessionSavings],
  )

  const pairDevice = useCallback<AppContextValue['pairDevice']>(
    (fridgeId, password) => {
      const fridge = state.fridges.find((f) => f.id === fridgeId)
      if (!fridge) return { status: 'offline' }

      const outcome = verifyPairing(fridge, password)

      if (outcome.status === 'paired') {
        dispatch({ type: 'pair-device', id: fridgeId, token: outcome.token })
        logActivity('sync', `${fridge.name} paired`, `${fridge.deviceId} authorised this phone`)
        notify(
          'System',
          `${fridge.name} paired securely`,
          `${fridge.deviceId} now trusts this phone. Unpair it any time from device settings.`,
          { link: '/device' },
        )
        if (outcome.usingFactoryPassword) {
          notify(
            'System',
            'Change the factory password',
            `${fridge.deviceId} still uses the password printed on its label. Anyone who can read the label can connect.`,
            { high: true, link: '/device' },
          )
        }
      } else if (outcome.status === 'wrong-password') {
        dispatch({ type: 'pair-failed', id: fridgeId })
      }

      return outcome
    },
    [state.fridges, logActivity, notify],
  )

  const unpairDevice = useCallback<AppContextValue['unpairDevice']>(
    (fridgeId) => {
      const fridge = state.fridges.find((f) => f.id === fridgeId)
      dispatch({ type: 'unpair-device', id: fridgeId })
      if (fridge) {
        logActivity('sync', `${fridge.name} unpaired`, `${fridge.deviceId} no longer trusts this phone`)
      }
    },
    [state.fridges, logActivity],
  )

  const changeDevicePassword = useCallback<AppContextValue['changeDevicePassword']>(
    (fridgeId, currentPassword, newPassword) => {
      const fridge = state.fridges.find((f) => f.id === fridgeId)
      if (!fridge) return { status: 'rejected', reason: 'Device not found.' }

      const security: DeviceSecurity = fridge.security
      const currentDigest = derivePairingDigest(currentPassword, security.salt)
      if (!timingSafeEqual(currentDigest, security.passwordDigest)) {
        return { status: 'wrong-current' }
      }
      if (!passwordAccepted(newPassword, security.factoryPassword)) {
        return { status: 'rejected', reason: 'The new password does not meet the requirements.' }
      }
      if (timingSafeEqual(derivePairingDigest(newPassword, security.salt), security.passwordDigest)) {
        return { status: 'rejected', reason: 'Choose a password you have not used on this hub.' }
      }

      dispatch({
        type: 'set-device-password',
        id: fridgeId,
        digest: derivePairingDigest(newPassword, security.salt),
        token: randomHex(24),
      })
      logActivity('sync', `${fridge.name} pairing password changed`, fridge.deviceId)
      notify(
        'System',
        'Pairing password updated',
        `${fridge.deviceId} now requires the new password. Other phones must pair again.`,
        { link: '/device' },
      )
      return { status: 'changed' }
    },
    [state.fridges, logActivity, notify],
  )

  const completeSetup = useCallback<AppContextValue['completeSetup']>(
    ({ fridgeName, homePassword, ...prefs }) => {
      if (fridgeName) dispatch({ type: 'rename-fridge', id: 'home', name: fridgeName })
      dispatch({ type: 'pair-device', id: 'home', token: randomHex(24) })
      if (homePassword) {
        const home = state.fridges.find((f) => f.id === 'home')
        if (home) {
          dispatch({
            type: 'set-device-password',
            id: 'home',
            digest: derivePairingDigest(homePassword, home.security.salt),
            token: randomHex(24),
          })
        }
      }
      // Only reachable once the hub is paired, so this is now a valid target.
      dispatch({ type: 'set-active-fridge', id: 'home' })
      dispatch({ type: 'set-preferences', preferences: { ...DEFAULT_PREFERENCES, ...prefs } })
      dispatch({ type: 'set-setup-done' })
    },
    [state.fridges],
  )

  const resetDemo = useCallback(() => {
    clearStore()
    dispatch({ type: 'reset-demo', state: { ...createInitialState(), onboarded: false, setupDone: false } })
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      activeFridge,
      items,
      priorityItems,
      unreadCount,
      savingsFor,
      setActiveFridge: (id) => dispatch({ type: 'set-active-fridge', id }),
      renameFridge: (id, name) => dispatch({ type: 'rename-fridge', id, name }),
      syncFridge: (id) => {
        dispatch({ type: 'sync-fridge', id })
        logActivity('sync', 'Inventory synchronized', 'Requested from the app')
      },
      pairDevice,
      unpairDevice,
      changeDevicePassword,
      addItem,
      updateItem,
      consumeItem,
      wasteItem,
      removeItem,
      completeRecipe,
      logActivity,
      notify,
      markNotificationRead: (id) => dispatch({ type: 'read-notification', id }),
      markAllNotificationsRead: () => dispatch({ type: 'read-all-notifications' }),
      clearNotifications: () => dispatch({ type: 'clear-notifications' }),
      addShoppingItem: (name, qty, note) =>
        dispatch({ type: 'shopping-add', item: { id: uid('shop'), name, qty, note, suggested: false, checked: false } }),
      toggleShoppingItem: (id) => dispatch({ type: 'shopping-toggle', id }),
      removeShoppingItem: (id) => dispatch({ type: 'shopping-remove', id }),
      setPreferences: (preferences) => dispatch({ type: 'set-preferences', preferences }),
      toggleFavorite: (id) => dispatch({ type: 'toggle-favorite', id }),
      pushAssistantMessage: (role, text) =>
        dispatch({ type: 'assistant-push', message: { id: uid('msg'), role, text, at: new Date().toISOString() } }),
      resetAssistant: () => dispatch({ type: 'assistant-reset' }),
      completeOnboarding: () => dispatch({ type: 'set-onboarded' }),
      completeSetup,
      resetDemo,
    }),
    [
      state,
      activeFridge,
      items,
      priorityItems,
      unreadCount,
      savingsFor,
      addItem,
      updateItem,
      consumeItem,
      wasteItem,
      removeItem,
      completeRecipe,
      logActivity,
      notify,
      pairDevice,
      unpairDevice,
      changeDevicePassword,
      completeSetup,
      resetDemo,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
