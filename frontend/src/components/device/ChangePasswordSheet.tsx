import { useEffect, useState } from 'react'
import { Check, Eye, EyeOff, Lock, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import type { Fridge } from '@/types'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'
import { useApp, useToast } from '@/hooks/useApp'
import { passwordAccepted, passwordRules, passwordStrength } from '@/lib/pairing'
import { cn } from '@/lib/utils'

function PasswordField({
  id,
  label,
  value,
  onChange,
  invalid,
  autoFocus,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  autoFocus?: boolean
  placeholder?: string
}) {
  const [reveal, setReveal] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
          strokeWidth={2.2}
          aria-hidden
        />
        <input
          id={id}
          type={reveal ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={cn(
            'h-[52px] w-full rounded-2xl border bg-mist/50 pl-11 pr-12 text-[15px] font-semibold tracking-wide text-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus:bg-surface focus:outline-none',
            invalid ? 'border-danger-500 focus:border-danger-500' : 'border-line focus:border-frisa-400',
          )}
        />
        <button
          type="button"
          aria-label={reveal ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setReveal((v) => !v)}
          className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-ink"
        >
          {reveal ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}

const STRENGTH_META = {
  weak: { label: 'Weak', bar: 'bg-danger-500', text: 'text-danger-600' },
  fair: { label: 'Fair', bar: 'bg-ember-500', text: 'text-ember-700' },
  strong: { label: 'Strong', bar: 'bg-frisa-500', text: 'text-frisa-700' },
} as const

export function ChangePasswordSheet({
  open,
  fridge,
  onClose,
}: {
  open: boolean
  fridge: Fridge
  onClose: () => void
}) {
  const { changeDevicePassword } = useApp()
  const { toast } = useToast()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) return
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
    setSaving(false)
  }, [open])

  const rules = passwordRules(next, fridge.security.factoryPassword)
  const strength = passwordStrength(next)
  const meta = STRENGTH_META[strength.level]
  const matches = confirm.length > 0 && confirm === next
  const ready = current.length > 0 && passwordAccepted(next, fridge.security.factoryPassword) && matches

  const submit = () => {
    if (!ready || saving) return
    setSaving(true)
    setError(null)

    // A short beat so the handshake reads as a device round trip rather than a form post.
    window.setTimeout(() => {
      const result = changeDevicePassword(fridge.id, current, next)
      setSaving(false)

      if (result.status === 'changed') {
        toast('Pairing password updated', {
          description: `${fridge.deviceId} now requires the new password.`,
        })
        onClose()
        return
      }
      setError(
        result.status === 'wrong-current'
          ? 'That is not the current pairing password for this hub.'
          : result.reason,
      )
    }, 480)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      className="max-h-[92%]"
      title="Change pairing password"
      description={`Only someone who knows the current password for ${fridge.deviceId} can change it.`}
      footer={
        <div className="space-y-2.5">
          <Button size="lg" block onClick={submit} disabled={!ready || saving}>
            {saving ? 'Updating on the device...' : 'Update password'}
          </Button>
          <p className="flex items-start gap-1.5 px-1 text-2xs leading-relaxed text-ink-faint">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            Changing it re-issues this phone&apos;s pairing token. Any other phone must pair again with
            the new password.
          </p>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        {fridge.security.usingFactoryPassword ? (
          <div className="flex items-start gap-3 rounded-2xl bg-ember-50 p-3.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
            <p className="text-[13px] leading-snug text-ember-800">
              This hub still uses the password printed on its label. Anyone within Wi-Fi range who can read
              that label can connect.
            </p>
          </div>
        ) : null}

        <PasswordField
          id="current-password"
          label="Current password"
          value={current}
          onChange={(value) => {
            setCurrent(value)
            setError(null)
          }}
          invalid={error !== null}
          placeholder={fridge.security.usingFactoryPassword ? 'The password on the label' : 'Your current password'}
        />

        <PasswordField
          id="new-password"
          label="New password"
          value={next}
          onChange={setNext}
          placeholder="At least 8 characters"
        />

        {next ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold text-ink-muted">Strength</span>
              <span className={cn('text-2xs font-bold', meta.text)}>{meta.label}</span>
            </div>
            <div className="mt-1.5 flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  key={step}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-200',
                    step <= strength.score ? meta.bar : 'bg-mist',
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}

        <ul className="space-y-1.5">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                  rule.passed ? 'bg-frisa-500 text-white' : 'bg-mist text-ink-faint',
                )}
              >
                {rule.passed ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3.4} aria-hidden />
                ) : (
                  <X className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                )}
              </span>
              <span className={cn('text-xs', rule.passed ? 'text-ink-soft' : 'text-ink-muted')}>{rule.label}</span>
            </li>
          ))}
        </ul>

        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          invalid={confirm.length > 0 && !matches}
          placeholder="Type it once more"
        />

        {confirm.length > 0 && !matches ? (
          <p className="-mt-2 text-xs font-semibold text-danger-600">The two passwords do not match.</p>
        ) : null}

        {error ? (
          <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-danger-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  )
}
