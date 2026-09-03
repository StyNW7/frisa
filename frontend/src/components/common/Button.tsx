import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'danger' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-frisa-500 text-white shadow-pill hover:bg-frisa-600 active:bg-frisa-700',
  secondary: 'bg-frisa-50 text-frisa-700 hover:bg-frisa-100 active:bg-frisa-200',
  outline: 'border border-line bg-surface text-ink hover:border-frisa-200 hover:bg-frisa-50/60',
  ghost: 'text-ink-muted hover:bg-mist hover:text-ink',
  warning: 'bg-ember-500 text-white hover:bg-ember-600 active:bg-ember-700',
  danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100 active:bg-danger-100',
  dark: 'bg-ink text-white hover:bg-ink-soft',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-[13px]',
  md: 'h-11 gap-2 rounded-2xl px-4 text-sm',
  lg: 'h-[52px] gap-2 rounded-2xl px-5 text-[15px]',
}

const BASE =
  'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 ease-out active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  )
})

export interface LinkButtonProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
  children?: ReactNode
  state?: unknown
  'aria-label'?: string
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
  state,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      state={state as never}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  )
}

/** Square icon-only button. Always give it an aria-label. */
export function IconButton({
  className,
  children,
  label,
  tone = 'muted',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'muted' | 'plain' | 'green' }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95',
        tone === 'muted' && 'border border-line bg-surface text-ink-soft hover:bg-mist',
        tone === 'plain' && 'text-ink-muted hover:bg-mist hover:text-ink',
        tone === 'green' && 'bg-frisa-50 text-frisa-700 hover:bg-frisa-100',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
