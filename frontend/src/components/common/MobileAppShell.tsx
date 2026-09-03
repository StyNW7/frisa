import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavigation, NAV_ITEMS } from '@/components/common/BottomNavigation'
import { ToastViewport } from '@/components/common/Feedback'
import { AskFrisaSheet } from '@/components/assistant/AskFrisaSheet'
import { FridgeSwitcherSheet } from '@/components/common/FridgeSwitcherSheet'
import { InstallPrompt } from '@/components/common/InstallPrompt'
import { cn } from '@/lib/utils'

const TAB_ROUTES = NAV_ITEMS.map((item) => item.to)

/**
 * The device canvas. Everything lives inside this frame: the scroll area, the tab
 * bar, toasts and every bottom sheet, so the prototype behaves identically on a
 * phone and inside the centred desktop shell.
 */
export function MobileAppShell() {
  const location = useLocation()
  const scrollRef = useRef<HTMLElement>(null)
  const showNav = TAB_ROUTES.includes(location.pathname)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="app-frame">
      <main
        ref={scrollRef}
        className={cn('hide-scrollbar relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden')}
      >
        <Outlet />
      </main>

      {/* Only on the main tabs, so pushed screens with their own action bar stay untouched. */}
      {showNav ? <InstallPrompt /> : null}
      {showNav ? <BottomNavigation /> : null}

      <ToastViewport />
      <AskFrisaSheet />
      <FridgeSwitcherSheet />
    </div>
  )
}

/** Frame used by full-bleed flows (splash, onboarding, setup) that have no tab bar. */
export function PlainAppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>
}
