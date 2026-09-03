import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonVariant } from '@/components/common/Button'

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

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close sheet"
        tabIndex={dismissible ? 0 : -1}
        onClick={() => dismissible && onClose()}
        className="absolute inset-0 animate-fade-in bg-ink/35 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Sheet'}
        className={cn(
          'relative flex max-h-[88%] animate-sheet-up flex-col rounded-t-[28px] bg-surface shadow-sheet outline-none',
          className,
        )}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <span className="h-1 w-10 rounded-full bg-line" aria-hidden />
        </div>

        {(title || dismissible) && (
          <div className="flex shrink-0 items-start gap-3 px-5 pb-1 pt-1">
            <div className="min-w-0 flex-1">
              {title ? <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2> : null}
              {description ? <p className="mt-1 text-[13px] leading-snug text-ink-muted">{description}</p> : null}
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

        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-3">{children}</div>

        {footer ? <div className="shrink-0 border-t border-line px-5 pb-6 pt-4">{footer}</div> : <div className="h-5" />}
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
