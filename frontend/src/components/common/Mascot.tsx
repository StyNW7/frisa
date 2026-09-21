import { cn } from '@/lib/utils'

/**
 * The FRISA character. The raw renders in `public/Images/*.png` are the source of
 * truth; `public/Images/brand/` holds the same poses cut out onto transparency and
 * downscaled so they can sit on any surface without a white box around them.
 */
export type MascotPose = 'hi' | 'happy' | 'love' | 'speaker' | 'think'

export const MASCOT_SRC: Record<MascotPose, string> = {
  hi: '/Images/brand/hi-mascot.webp',
  happy: '/Images/brand/happy-mascot.webp',
  love: '/Images/brand/love-mascot.webp',
  speaker: '/Images/brand/speaker-mascot.webp',
  think: '/Images/brand/think-mascot.webp',
}

const MASCOT_ALT: Record<MascotPose, string> = {
  hi: 'Frisa, a friendly fridge-shaped robot in a green varsity jacket, waving hello',
  happy: 'Frisa jumping for joy',
  love: 'Frisa making a heart with both hands',
  speaker: 'Frisa holding a megaphone',
  think: 'Frisa thinking, hand on chin',
}

export const LOGO_SRC = '/Images/brand/logo.webp'

export function Mascot({
  pose,
  className,
  priority,
}: {
  pose: MascotPose
  className?: string
  /** Set on the one instance that is on screen at first paint. */
  priority?: boolean
}) {
  return (
    <img
      src={MASCOT_SRC[pose]}
      alt={MASCOT_ALT[pose]}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('select-none object-contain', className)}
    />
  )
}

export function FrisaLogo({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Frisa"
      draggable={false}
      decoding="async"
      className={cn('select-none object-contain', className)}
    />
  )
}
