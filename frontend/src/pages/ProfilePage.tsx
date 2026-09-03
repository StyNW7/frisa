import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChefHat,
  Cpu,
  Heart,
  Info,
  Refrigerator,
  RotateCcw,
  ShoppingBasket,
  Utensils,
  Users,
} from 'lucide-react'
import type { UserPreference } from '@/types'
import { TopHeader } from '@/components/common/TopHeader'
import { Button } from '@/components/common/Button'
import { BottomSheet, ConfirmationSheet } from '@/components/common/BottomSheet'
import { InstallRow } from '@/components/common/InstallPrompt'
import { ListRow, SectionHeader, Switch } from '@/components/common/Primitives'
import { StatusChip } from '@/components/common/Badges'
import {
  ALLERGY_OPTIONS,
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  RECIPE_PREF_OPTIONS,
  REMINDER_TIMING_OPTIONS,
} from '@/data/seed'
import { useApp, useToast } from '@/hooks/useApp'
import { cn, initials, pluralize } from '@/lib/utils'

type EditKey = 'diet' | 'allergies' | 'cuisines' | 'recipePrefs' | null

const EDIT_META: Record<Exclude<EditKey, null>, { title: string; description: string; options: string[]; multi: boolean }> = {
  diet: {
    title: 'Diet',
    description: 'FRISA filters every recipe suggestion against this.',
    options: DIET_OPTIONS,
    multi: false,
  },
  allergies: {
    title: 'Allergies',
    description: 'Recipes containing these ingredients are never suggested.',
    options: ALLERGY_OPTIONS,
    multi: true,
  },
  cuisines: {
    title: 'Favourite cuisines',
    description: 'Used to rank recipes when several match equally well.',
    options: CUISINE_OPTIONS,
    multi: true,
  },
  recipePrefs: {
    title: 'Recipe preferences',
    description: 'What kind of cooking suits your household best.',
    options: RECIPE_PREF_OPTIONS,
    multi: true,
  },
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { preferences, setPreferences, fridges, favorites, resetDemo } = useApp()
  const { toast } = useToast()

  const [editing, setEditing] = useState<EditKey>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const update = (patch: Partial<UserPreference>) => setPreferences({ ...preferences, ...patch })

  const toggleNotification = (key: keyof UserPreference['notifications']) => {
    update({ notifications: { ...preferences.notifications, [key]: !preferences.notifications[key] } })
  }

  const toggleTiming = (option: string) => {
    const next = preferences.reminderTiming.includes(option)
      ? preferences.reminderTiming.filter((t) => t !== option)
      : [...preferences.reminderTiming, option]
    update({ reminderTiming: next })
  }

  const currentEdit = editing ? EDIT_META[editing] : null
  const currentValues = editing
    ? editing === 'diet'
      ? [preferences.diet]
      : (preferences[editing] as string[])
    : []

  const chooseOption = (option: string) => {
    if (!editing) return
    if (editing === 'diet') {
      update({ diet: option })
      setEditing(null)
      toast('Diet updated', { tone: 'info' })
      return
    }
    const list = preferences[editing] as string[]
    const next = list.includes(option) ? list.filter((v) => v !== option) : [...list, option]
    update({ [editing]: next } as Partial<UserPreference>)
  }

  const preferenceRows: Array<{ key: Exclude<EditKey, null>; label: string; value: string }> = [
    { key: 'diet', label: 'Diet', value: preferences.diet },
    { key: 'allergies', label: 'Allergies', value: preferences.allergies.join(', ') || 'None' },
    { key: 'cuisines', label: 'Favourite cuisines', value: preferences.cuisines.join(', ') || 'Any' },
    { key: 'recipePrefs', label: 'Recipe preferences', value: preferences.recipePrefs.join(', ') || 'Any' },
  ]

  const notificationRows: Array<{ key: keyof UserPreference['notifications']; label: string; detail: string }> = [
    { key: 'expiry', label: 'Expiry reminder', detail: 'Before food reaches its date' },
    { key: 'recipes', label: 'Recipe suggestions', detail: 'When FRISA finds a good match' },
    { key: 'inventory', label: 'Inventory updates', detail: 'Items added, used or removed' },
    { key: 'device', label: 'Device alerts', detail: 'Sync problems and offline hubs' },
  ]

  return (
    <div className="pb-8">
      <TopHeader title="Profile" subtitle={preferences.household} />

      <div className="space-y-6 px-5 pt-4">
        {/* Identity */}
        <section
          className="flex items-center gap-4 rounded-3xl border border-frisa-100 p-4"
          style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 70%)' }}
        >
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-frisa-500 text-xl font-extrabold text-white shadow-pill">
            {initials(preferences.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight text-ink">
              {preferences.name}
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-ink-muted">{preferences.household}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusChip tone="green" icon={Users}>
                {pluralize(preferences.members, 'member')}
              </StatusChip>
              <StatusChip tone="neutral" icon={Refrigerator}>
                {pluralize(fridges.length, 'fridge')}
              </StatusChip>
            </div>
          </div>
        </section>

        {/* Household shortcuts */}
        <section>
          <SectionHeader title="Household" />
          <div className="card divide-y divide-line overflow-hidden">
            <ListRow icon={Refrigerator} title="Manage fridges" subtitle={`${fridges.length} connected hubs`} to="/fridges" tone="green" />
            <ListRow icon={Cpu} title="Device settings" subtitle="Camera, voice and sync" to="/device" tone="green" />
            <ListRow icon={ShoppingBasket} title="Shopping list" subtitle="Overbuying prevention" to="/shopping" tone="orange" />
            <ListRow
              icon={Heart}
              title="Favourite recipes"
              subtitle={`${favorites.length} saved`}
              onClick={() => navigate('/recipes')}
              tone="orange"
            />
            <InstallRow />
          </div>
        </section>

        {/* Preferences */}
        <section>
          <SectionHeader title="Personalization" subtitle="FRISA uses these to filter every suggestion." />
          <div className="card divide-y divide-line overflow-hidden">
            {preferenceRows.map((row) => (
              <ListRow
                key={row.key}
                icon={row.key === 'diet' ? Utensils : row.key === 'allergies' ? Info : ChefHat}
                title={row.label}
                subtitle={row.value}
                onClick={() => setEditing(row.key)}
              />
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader title="Notifications" />
          <ul className="card divide-y divide-line overflow-hidden">
            {notificationRows.map((row) => (
              <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mist text-ink-soft">
                  <Bell className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{row.label}</span>
                  <span className="block truncate text-xs text-ink-muted">{row.detail}</span>
                </span>
                <Switch
                  checked={preferences.notifications[row.key]}
                  onChange={() => toggleNotification(row.key)}
                  label={row.label}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Reminder timing */}
        <section>
          <SectionHeader title="Expiry reminder timing" subtitle="When FRISA should warn you." />
          <div className="flex flex-wrap gap-2">
            {REMINDER_TIMING_OPTIONS.map((option) => {
              const active = preferences.reminderTiming.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTiming(option)}
                  className={cn(
                    'rounded-2xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                    active
                      ? 'border-frisa-500 bg-frisa-50 text-frisa-700'
                      : 'border-line bg-surface text-ink-muted hover:border-frisa-200',
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </section>

        {/* Prototype note */}
        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint">About this prototype</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            This is a functional FRISA prototype running entirely on your device. Preferences, onboarding and the
            selected fridge are remembered. Inventory changes reset when the page is reloaded, so every demo starts
            from the same state.
          </p>
          <Button variant="outline" size="md" block className="mt-3.5" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-4 w-4" strokeWidth={2.1} aria-hidden />
            Restart the demo
          </Button>
        </section>
      </div>

      {/* Preference editor */}
      <BottomSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={currentEdit?.title ?? ''}
        description={currentEdit?.description}
        footer={
          currentEdit?.multi ? (
            <Button size="lg" block onClick={() => setEditing(null)}>
              Done
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-2 pb-2">
          {currentEdit?.options.map((option) => {
            const active = currentValues.includes(option)
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => chooseOption(option)}
                className={cn(
                  'rounded-2xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                  active
                    ? 'border-frisa-500 bg-frisa-50 text-frisa-700'
                    : 'border-line bg-surface text-ink-muted hover:border-frisa-200',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <ConfirmationSheet
        open={resetOpen}
        title="Restart the demo?"
        description="Inventory, preferences and onboarding return to their original state."
        confirmLabel="Restart"
        tone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false)
          resetDemo()
          navigate('/', { replace: true })
        }}
      />
    </div>
  )
}
