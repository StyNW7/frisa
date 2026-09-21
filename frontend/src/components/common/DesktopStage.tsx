import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ChefHat,
  CloudSun,
  Cpu,
  Flame,
  Leaf,
  Mic,
  Quote,
  ScanLine,
  Sparkles,
  TimerReset,
  WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FrisaLogo, Mascot, type MascotPose } from '@/components/common/Mascot'
import { useApp } from '@/hooks/useApp'
import { cn, kg, pluralize } from '@/lib/utils'

/**
 * The desktop presentation around the phone canvas. On a phone none of this
 * exists: the app fills the screen. On a wide monitor the canvas would otherwise
 * float in an empty page, so the space either side becomes the pitch: who FRISA
 * is on the left, the character reacting to the current screen on the right.
 *
 * Everything here is `aria-hidden` except the descriptive copy, so screen
 * readers get the story once and the app itself stays the only interactive thing.
 */

const CHIPS = ['AIoT', 'SDG 12', 'Works offline']

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ScanLine,
    title: 'Camera + voice hub',
    body: 'Scan groceries in as you put them away. Ask FRISA about them out loud.',
  },
  {
    icon: TimerReset,
    title: 'Waste Risk Score',
    body: 'Every item is ranked by how soon it must be used, so nothing gets forgotten.',
  },
  {
    icon: ChefHat,
    title: 'Recipes from what you have',
    body: 'Meals built around the ingredients closest to expiry, not a shopping trip.',
  },
]

const QUOTE = 'Food waste does not start at the bin. It starts with forgetting.'

interface Scene {
  pose: MascotPose
  line: string
}

/** The character reacts to what the visitor is doing in the phone. */
function sceneFor(pathname: string, ctx: { firstName: string; priority: number; online: boolean }): Scene {
  const { firstName, priority, online } = ctx
  if (pathname === '/' || pathname === '/onboarding')
    return { pose: 'hi', line: "Hi! I'm Frisa, your fridge's smart assistant. Let me show you around." }
  if (pathname === '/setup') return { pose: 'speaker', line: 'Almost there. Pair me with your fridge and we can start.' }
  if (pathname === '/scan') return { pose: 'speaker', line: 'Hold the item up to my camera. I am listening too, if you would rather just tell me.' }
  if (pathname.startsWith('/recipe'))
    return { pose: 'happy', line: 'Cooking with what you already have is my favourite kind of cooking.' }
  if (pathname === '/insights') return { pose: 'love', line: 'Look at that. Every kilogram saved here is a meal that was not thrown away.' }
  if (pathname === '/inventory' || pathname.startsWith('/food'))
    return {
      pose: 'think',
      line:
        priority > 0
          ? `Hmm. ${pluralize(priority, 'item')} should be used first. Want me to suggest something?`
          : 'Everything in here still has time. Nice and tidy.',
    }
  if (pathname === '/device' || pathname === '/fridges')
    return { pose: online ? 'hi' : 'think', line: online ? 'Hub connected. I am keeping an eye on things.' : 'I cannot reach the hub right now. Check the Wi-Fi?' }
  if (pathname === '/shopping') return { pose: 'think', line: 'Before you buy more, check what is already in here. I did.' }
  if (pathname === '/notifications' || pathname === '/profile')
    return { pose: 'love', line: 'I only nudge when something is worth saving. Promise.' }
  return {
    pose: 'hi',
    line:
      priority > 0
        ? `Welcome back, ${firstName}. ${pluralize(priority, 'item')} ${priority === 1 ? 'needs' : 'need'} using soon.`
        : `Welcome back, ${firstName}. Your fridge is in good shape today.`,
  }
}

export function DesktopStage({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { preferences, priorityItems, activeFridge, savingsFor } = useApp()
  const savings = savingsFor('30d')
  const firstName = preferences.name.split(' ')[0] || 'there'

  const scene = useMemo(
    () => sceneFor(pathname, { firstName, priority: priorityItems.length, online: activeFridge.online }),
    [pathname, firstName, priorityItems.length, activeFridge.online],
  )

  return (
    <div className="stage">
      <aside className="stage-panel stage-panel-left">
        <FrisaLogo className="h-[clamp(48px,7vh,68px)] w-auto self-start" />

        <ul className="mt-6 flex flex-wrap gap-2" aria-hidden>
          {CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-frisa-200/80 bg-white/70 px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-frisa-700 backdrop-blur"
            >
              {chip}
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-[30px] font-extrabold leading-[1.08] tracking-tight text-ink">
          Your fridge, finally <span className="text-frisa-600">paying attention.</span>
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          FRISA is a small camera- and voice-equipped hub that lives with your refrigerator, paired
          with an app that knows what is inside, warns you before food expires, and turns what you
          already have into tonight&apos;s meal.
        </p>

        <ul className="stage-features mt-6 space-y-3.5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-frisa-50 text-frisa-600 ring-1 ring-inset ring-frisa-100">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">{title}</span>
                <span className="block text-[13px] leading-snug text-ink-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <figure className="stage-quote mt-7">
          <Quote className="h-6 w-6 text-ember-300" strokeWidth={2} aria-hidden />
          <blockquote className="mt-2 text-[19px] font-extrabold leading-snug tracking-tight text-white">
            {QUOTE}
          </blockquote>
          <figcaption className="mt-3 text-2xs font-bold uppercase tracking-[0.2em] text-white/60">
            The FRISA philosophy
          </figcaption>
        </figure>

        <p className="stage-tagline mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-faint">
          Know your food. Waste less.
        </p>
      </aside>

      {children}

      <aside className="stage-panel stage-panel-right" aria-hidden>
        <div className="relative flex w-full flex-col items-center">
          {/* Ambient glow the character stands in front of. */}
          <div className="stage-halo" />

          <div key={scene.line} className="stage-bubble animate-bubble-in">
            <p className="text-[14px] font-semibold leading-snug text-ink">{scene.line}</p>
          </div>

          <div className="stage-mascot relative mt-5 w-full">
            <div className="absolute inset-x-0 top-0 flex h-full animate-float items-end justify-center">
              <Mascot key={scene.pose} pose={scene.pose} priority className="h-full w-auto animate-pop-in drop-shadow-mascot" />
            </div>

            {/* Live numbers from the same state the phone renders, so the stage is
                never out of step with the demo. */}
            <StatChip
              className="-left-4 top-[14%] animate-float [animation-delay:-1.2s]"
              icon={Flame}
              tone="ember"
              value={String(priorityItems.length)}
              label="to use soon"
            />
            <StatChip
              className="-right-8 top-[30%] animate-float [animation-delay:-2.4s]"
              icon={Leaf}
              tone="green"
              value={kg(savings.foodSavedKg)}
              label="saved · 30 days"
            />
            <StatChip
              className="-left-6 bottom-[24%] animate-float [animation-delay:-0.6s]"
              icon={CloudSun}
              tone="sky"
              value={`${savings.co2Kg.toFixed(1)} kg`}
              label="CO₂ avoided"
            />
            <StatChip
              className="-right-6 bottom-[7%] animate-float [animation-delay:-1.8s]"
              icon={activeFridge.online ? Cpu : WifiOff}
              tone={activeFridge.online ? 'green' : 'plain'}
              value={activeFridge.online ? 'Online' : 'Offline'}
              label={activeFridge.name}
            />
          </div>

          <div className="stage-ground" />

          <div className="mt-6 flex items-center gap-2 rounded-full border border-line bg-white/80 py-2 pl-2.5 pr-4 shadow-card backdrop-blur">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-frisa-500 text-white">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span className="text-[13px] font-semibold text-ink-soft">
              Meet <span className="font-extrabold text-frisa-700">Frisa</span> · tap the phone to explore
            </span>
            <Mic className="ml-1 h-3.5 w-3.5 text-ink-faint" strokeWidth={2.2} />
          </div>
        </div>
      </aside>
    </div>
  )
}

function StatChip({
  className,
  icon: Icon,
  tone,
  value,
  label,
}: {
  className?: string
  icon: LucideIcon
  tone: 'ember' | 'green' | 'sky' | 'plain'
  value: string
  label: string
}) {
  return (
    <div
      className={cn(
        'absolute flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/90 py-2 pl-2 pr-3.5 shadow-lift backdrop-blur',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl',
          tone === 'ember' && 'bg-ember-50 text-ember-600',
          tone === 'green' && 'bg-frisa-50 text-frisa-600',
          tone === 'sky' && 'bg-info-50 text-info-600',
          tone === 'plain' && 'bg-mist text-ink-soft',
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="num block text-[15px] font-extrabold leading-tight text-ink">{value}</span>
        <span className="block max-w-[140px] truncate text-2xs font-semibold text-ink-muted">{label}</span>
      </span>
    </div>
  )
}
