import { cn } from '@/lib/utils'

/**
 * FRISA brand mark: a friendly hub device with a sprout, drawn as inline SVG so it
 * stays crisp at every size and can invert on green surfaces.
 */
export function FrisaMark({
  className,
  tone = 'green',
}: {
  className?: string
  /** `green` for light surfaces, `white` for green surfaces. */
  tone?: 'green' | 'white'
}) {
  const body = tone === 'white' ? '#FFFFFF' : '#25B877'
  const accent = tone === 'white' ? '#FFD9B3' : '#FC8612'
  const face = tone === 'white' ? '#168653' : '#FFFFFF'
  const eye = tone === 'white' ? '#FFFFFF' : '#18211C'

  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('h-10 w-10', className)} role="img" aria-label="FRISA">
      <path
        d="M24 9.6c-1.6-3.4-4.7-5-8.6-4.8-.5 3.9 1.2 6.9 4.8 8.4"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M25.6 10.2c1.1-3.6 3.9-5.6 7.8-5.9 1 3.8-.3 7-3.7 8.9"
        stroke={body}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="7" y="13" width="34" height="30" rx="9" fill={body} />
      <rect x="12.5" y="18.5" width="23" height="15" rx="6" fill={face} />
      <circle cx="19.5" cy="25.4" r="2.3" fill={eye} />
      <circle cx="28.5" cy="25.4" r="2.3" fill={eye} />
      <path d="M20.4 29.6c1.9 1.6 5.3 1.6 7.2 0" stroke={eye} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="18" y="37" width="12" height="2.6" rx="1.3" fill={face} opacity="0.65" />
    </svg>
  )
}

export function FrisaWordmark({ className, tone = 'green' }: { className?: string; tone?: 'green' | 'white' }) {
  return (
    <span
      className={cn(
        'text-[26px] font-extrabold leading-none tracking-tight',
        tone === 'white' ? 'text-white' : 'text-frisa-600',
        className,
      )}
    >
      Fr<span className={tone === 'white' ? 'text-ember-200' : 'text-ember-500'}>i</span>sa
    </span>
  )
}

export function FrisaLockup({
  className,
  tone = 'green',
  showTagline = true,
}: {
  className?: string
  tone?: 'green' | 'white'
  showTagline?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <FrisaMark className="h-16 w-16" tone={tone} />
      <div className="flex flex-col items-center gap-1">
        <FrisaWordmark tone={tone} className="text-[34px]" />
        <p
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.22em]',
            tone === 'white' ? 'text-white/70' : 'text-ink-muted',
          )}
        >
          Fridge&apos;s Smart Assistant
        </p>
      </div>
      {showTagline ? (
        <p className={cn('text-[13px] font-medium', tone === 'white' ? 'text-white/80' : 'text-ink-muted')}>
          Know Your Food. Waste Less.
        </p>
      ) : null}
    </div>
  )
}
