import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonVariant } from '@/components/common/Button'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** How far the panel must travel before the release is read as a dismissal. */
const DRAG_DISMISS_PX = 96
/** ...or how fast it must be moving, so a short flick also closes. */
const DRAG_DISMISS_VELOCITY = 0.55
const EXIT_MS = 220

/**
 * The frame's scroll area must not move while a sheet covers it. Sheets can stack
 * (a confirmation over an editor), so the lock is reference counted rather than a
 * boolean that the first sheet to close would wrongly release.
 */
let scrollLocks = 0
function setFrameScrollLock(locked: boolean) {
  const scroller = document.querySelector<HTMLElement>('.app-frame > main')
  scrollLocks = Math.max(0, scrollLocks + (locked ? 1 : -1))
  if (scroller) scroller.style.overflowY = scrollLocks > 0 ? 'hidden' : ''
}

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  /** Hides the close button for sheets that must be resolved by an action. */
  dismissible?: boolean
  className?: string
}

/**
 * Bottom sheet anchored to the mobile frame rather than the browser viewport,
 * so it behaves the same on a phone and inside the desktop device canvas.
 *
 * Modal semantics are real, not decorative: focus moves in, Tab cannot escape,
 * the frame behind it stops scrolling, and focus returns to whatever opened the
 * sheet. The grab handle drags, so the affordance is honest.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  /* `open` is owned by the caller, but the panel has to outlive it for the exit
     animation, so what is rendered is tracked separately. */
  const [render, setRender] = useState(open)
  const [leaving, setLeaving] = useState(false)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flingOut, setFlingOut] = useState(false)
  /* Once the entrance has played, the panel's position is driven by an explicit
     transform. Keeping the entrance class on would otherwise replay the slide-up
     every time a drag snapped back to zero. */
  const [entered, setEntered] = useState(false)
  const gesture = useRef<{
    pointerId: number
    startY: number
    lastY: number
    lastT: number
    velocity: number
  } | null>(null)

  useEffect(() => {
    if (open) {
      setRender(true)
      setLeaving(false)
      setFlingOut(false)
      setEntered(false)
      setDrag(0)
      // Backstop: if animationend never arrives the panel must still be draggable.
      const settled = window.setTimeout(() => setEntered(true), 320)
      return () => window.clearTimeout(settled)
    }
    if (!render) return
    setLeaving(true)
    const timer = window.setTimeout(() => {
      setRender(false)
      setLeaving(false)
      setFlingOut(false)
      setEntered(false)
      setDrag(0)
    }, EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open, render])

  /* Remember the trigger, move focus in, and hand focus back on close. */
  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    setFrameScrollLock(true)

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus({ preventScroll: true })

    return () => {
      setFrameScrollLock(false)
      restoreFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  /* Escape to dismiss, and a Tab loop so focus cannot reach the screen behind. */
  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose, dismissible])

  const settle = useCallback(() => {
    gesture.current = null
    setDragging(false)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dismissible || event.button !== 0) return
    // The grab zone spans the close button too. Capturing the pointer there would
    // retarget the click away from it, so controls keep their own gestures.
    if ((event.target as HTMLElement).closest('button,a,input,select,textarea')) return
    gesture.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: event.timeStamp,
      velocity: 0,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (!state || state.pointerId !== event.pointerId) return

    const dt = event.timeStamp - state.lastT
    if (dt > 0) state.velocity = (event.clientY - state.lastY) / dt
    state.lastY = event.clientY
    state.lastT = event.timeStamp

    const delta = event.clientY - state.startY
    // Upward drags resist rather than lifting the sheet off the bottom edge.
    setDrag(delta >= 0 ? delta : delta / 4)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (!state || state.pointerId !== event.pointerId) return

    const travelled = event.clientY - state.startY
    const flicked = state.velocity > DRAG_DISMISS_VELOCITY
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    settle()

    if (travelled > DRAG_DISMISS_PX || flicked) {
      // Carry the panel the rest of the way down instead of snapping back first.
      setFlingOut(true)
      window.setTimeout(onClose, EXIT_MS * 0.8)
      return
    }
    setDrag(0)
  }

  if (!render) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => dismissible && onClose()}
        className={cn(
          'absolute inset-0 bg-ink/35 backdrop-blur-[2px] transition-opacity duration-200',
          leaving ? 'opacity-0' : 'animate-fade-in',
        )}
        style={{ touchAction: 'none' }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : 'Sheet'}
        /* A flung-out panel is already parked at the bottom, so the exit keyframes
           would snap it back to zero before replaying the same journey. */
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setEntered(true)
        }}
        className={cn(
          'relative flex max-h-[88%] flex-col rounded-t-[28px] bg-surface shadow-sheet outline-none',
          !flingOut && (leaving ? 'animate-sheet-down' : !entered && 'animate-sheet-up'),
          className,
        )}
        style={{
          transform: flingOut ? 'translateY(100%)' : entered ? `translateY(${drag}px)` : undefined,
          transition: dragging ? 'none' : `transform ${EXIT_MS}ms cubic-bezier(0.22,1,0.36,1)`,
        }}
      >
        {/* Grab area. Covers the handle and the title block, so the whole top of
            the sheet drags the way a native sheet does. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn('shrink-0', dismissible && 'cursor-grab active:cursor-grabbing')}
          style={{ touchAction: dismissible ? 'none' : undefined }}
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1 w-10 rounded-full bg-line" aria-hidden />
          </div>

          {(title || dismissible) && (
            <div className="flex items-start gap-3 px-5 pb-1 pt-1">
              <div className="min-w-0 flex-1">
                {title ? (
                  <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="mt-1 text-[13px] leading-snug text-ink-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {dismissible ? (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-mist hover:text-ink"
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 pt-3">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-line px-5 pb-6 pt-4">{footer}</div>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </div>
  )
}

export interface ConfirmationSheetProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: ButtonVariant
  onConfirm: () => void
  onCancel: () => void
  detail?: ReactNode
}

export function ConfirmationSheet({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
  detail,
}: ConfirmationSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" size="lg" block onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone} size="lg" block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {detail ?? null}
    </BottomSheet>
  )
}
