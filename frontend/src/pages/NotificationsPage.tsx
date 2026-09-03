import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { BellOff, CheckCheck, ChefHat, Cpu, Package, Trash2, TriangleAlert } from 'lucide-react'
import type { NotificationCategory } from '@/types'
import { TopHeader } from '@/components/common/TopHeader'
import { FilterPills } from '@/components/common/Primitives'
import { EmptyState } from '@/components/common/Feedback'
import { ConfirmationSheet } from '@/components/common/BottomSheet'
import { useApp, useToast } from '@/hooks/useApp'
import { cn, formatEventTime } from '@/lib/utils'

const TABS = ['All', 'Priority', 'Inventory', 'Recipes', 'System'] as const
type Tab = (typeof TABS)[number]

const CATEGORY_META: Record<NotificationCategory, { icon: LucideIcon; tone: string }> = {
  Priority: { icon: TriangleAlert, tone: 'bg-ember-50 text-ember-600' },
  Inventory: { icon: Package, tone: 'bg-frisa-50 text-frisa-600' },
  Recipes: { icon: ChefHat, tone: 'bg-frisa-50 text-frisa-600' },
  System: { icon: Cpu, tone: 'bg-info-50 text-info-600' },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('All')
  const [clearOpen, setClearOpen] = useState(false)

  const list = useMemo(
    () => (tab === 'All' ? notifications : notifications.filter((n) => n.category === tab)),
    [notifications, tab],
  )

  return (
    <div className="pb-8">
      <TopHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
        right={
          notifications.length > 0 ? (
            <>
              <button
                type="button"
                aria-label="Mark all as read"
                onClick={() => {
                  markAllNotificationsRead()
                  toast('All notifications marked as read', { tone: 'info' })
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink-soft transition-colors hover:bg-mist"
              >
                <CheckCheck className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Clear all notifications"
                onClick={() => setClearOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink-soft transition-colors hover:border-danger-100 hover:bg-danger-50 hover:text-danger-500"
              >
                <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </>
          ) : null
        }
      />

      <div className="px-5 pt-4">
        <FilterPills options={TABS} value={tab} onChange={setTab} label="Notification categories" />
      </div>

      <div className="px-5 pt-4">
        {list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={BellOff}
              title="You're all caught up"
              description={
                tab === 'All'
                  ? 'FRISA will let you know the moment something in your fridge needs attention.'
                  : `Nothing in ${tab} right now.`
              }
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((notification) => {
              const { icon: Icon, tone } = CATEGORY_META[notification.category]
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(notification.id)
                      if (notification.link) navigate(notification.link)
                    }}
                    className={cn(
                      'card press flex w-full items-start gap-3 p-3.5 text-left hover:shadow-lift',
                      !notification.read && 'border-frisa-200 bg-frisa-50/40',
                    )}
                  >
                    <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', tone)}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-bold leading-snug text-ink">{notification.title}</span>
                        {!notification.read ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-frisa-500" aria-label="Unread" />
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{notification.body}</span>
                      <span className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            notification.high ? 'bg-ember-50 text-ember-700' : 'bg-mist text-ink-muted',
                          )}
                        >
                          {notification.high ? 'High priority' : notification.category}
                        </span>
                        <span className="num text-[10px] font-medium text-ink-faint">
                          {formatEventTime(notification.at)}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmationSheet
        open={clearOpen}
        title="Clear all notifications?"
        description="The list is emptied. New alerts will keep arriving as your inventory changes."
        confirmLabel="Clear all"
        tone="danger"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          setClearOpen(false)
          clearNotifications()
          toast('Notifications cleared', { tone: 'info' })
        }}
      />
    </div>
  )
}
