import { Link } from 'react-router-dom'
import { Bell, ChevronDown, Refrigerator, WifiOff } from 'lucide-react'
import { useApp, useUi } from '@/hooks/useApp'
import { formatLongDate, greeting, initials, pluralize } from '@/lib/utils'

export function HomeHeader() {
  const { preferences, unreadCount, activeFridge } = useApp()
  const { setFridgeSheetOpen } = useUi()
  const firstName = preferences.name.split(' ')[0]

  return (
    <div className="px-5 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white/70">{greeting()},</p>
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-tight text-white">
            {firstName}
          </h1>
          <p className="mt-1 text-xs font-medium text-white/60">{formatLongDate()}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/notifications"
            aria-label={`Notifications, ${unreadCount} unread`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
          >
            <Bell className="h-[19px] w-[19px]" strokeWidth={2} aria-hidden />
            {unreadCount > 0 ? (
              <span className="num absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ember-500 px-1 text-[10px] font-bold text-white ring-2 ring-frisa-700">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/profile"
            aria-label="Open profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-frisa-700 shadow-card transition-transform active:scale-95"
          >
            {initials(preferences.name)}
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFridgeSheetOpen(true)}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-2.5 pr-3 text-left ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
          {activeFridge.online ? (
            <Refrigerator className="h-5 w-5" strokeWidth={1.9} aria-hidden />
          ) : (
            <WifiOff className="h-5 w-5" strokeWidth={1.9} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{activeFridge.name}</span>
          <span className="block truncate text-2xs font-medium text-white/65">
            {activeFridge.location} · {pluralize(activeFridge.items.length, 'item')} ·{' '}
            {activeFridge.online ? 'Connected' : 'Offline'}
          </span>
        </span>
        <ChevronDown className="h-[18px] w-[18px] shrink-0 text-white/70" strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  )
}
