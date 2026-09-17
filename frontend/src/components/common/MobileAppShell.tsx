import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
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
  const navigationType = useNavigationType()
  const scrollRef = useRef<HTMLElement>(null)
  const showNav = TAB_ROUTES.includes(location.pathname)

  /* Keyed by history entry rather than by path, so two visits to the same screen
     keep their own positions. */
  const scrollMemory = useRef(new Map<string, number>())

  /* Record continuously: by the time the route changes, the old scroller is gone. */
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const key = location.key
    const onScroll = () => scrollMemory.current.set(key, scroller.scrollTop)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [location.key])

  /* A new screen opens at the top; going Back returns to where you were, the way
     a native stack behaves. Layout effect so the restore lands before paint. */
  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const remembered = navigationType === 'POP' ? scrollMemory.current.get(location.key) : undefined
    scroller.scrollTo({ top: remembered ?? 0 })
  }, [location.key, navigationType])

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
