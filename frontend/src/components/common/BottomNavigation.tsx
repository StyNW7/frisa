import { ChartNoAxesCombined, ChefHat, House, PackageOpen, ScanLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/inventory', label: 'Inventory', icon: PackageOpen },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/recipes', label: 'Recipes', icon: ChefHat },
  { to: '/insights', label: 'Insights', icon: ChartNoAxesCombined },
]

/**
 * Fixed tab bar. Scan sits in the middle as an elevated action because it is the
 * point where the physical FRISA hub meets the app.
 */
export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="relative z-40 shrink-0 border-t border-line bg-surface/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 shadow-nav backdrop-blur"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isScan = item.to === '/scan'
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-[54px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-200',
                    !isScan && (isActive ? 'text-frisa-600' : 'text-ink-faint hover:text-ink-muted'),
                  )
                }
              >
                {({ isActive }) =>
                  isScan ? (
                    <>
                      <span
                        className={cn(
                          'absolute -top-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-frisa-500 text-white shadow-pill ring-4 ring-surface transition-all duration-200 group-active:scale-95',
                          isActive && 'bg-frisa-600',
                        )}
                      >
                        <span
                          className="absolute inset-[-3px] rounded-full border-2 border-ember-500/80"
                          aria-hidden
                        />
                        <item.icon className="h-6 w-6" strokeWidth={2.2} aria-hidden />
                      </span>
                      <span
                        className={cn(
                          'mt-8 text-[10px] font-bold',
                          isActive ? 'text-frisa-600' : 'text-ink-faint',
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <item.icon
                        className="h-[22px] w-[22px]"
                        strokeWidth={isActive ? 2.4 : 1.9}
                        aria-hidden
                      />
                      <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-semibold')}>
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'absolute bottom-0 h-[3px] w-7 rounded-full bg-frisa-500 transition-opacity duration-200',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                    </>
                  )
                }
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
