import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Cpu, Sparkles } from 'lucide-react'
import { FrisaLockup } from '@/components/common/FrisaMark'
import { PlainAppShell } from '@/components/common/MobileAppShell'
import { useApp } from '@/hooks/useApp'

const PILLARS = [
  { icon: Cpu, label: 'AIoT' },
  { icon: Sparkles, label: 'Food Intelligence' },
  { icon: Boxes, label: 'Smart Inventory' },
]

export function SplashPage() {
  const navigate = useNavigate()
  const { onboarded, setupDone } = useApp()
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const tick = window.setInterval(() => setProgress((p) => Math.min(100, p + 9)), 90)
    const done = window.setTimeout(() => {
      if (setupDone) navigate('/home', { replace: true })
      else if (onboarded) navigate('/setup', { replace: true })
      else navigate('/onboarding', { replace: true })
    }, 1900)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [navigate, onboarded, setupDone])

  return (
    <PlainAppShell>
      <div className="relative flex h-full flex-col items-center justify-between overflow-hidden bg-frisa-700 px-8 pb-10 pt-20 text-white">
        {/* Ambient depth. Kept subtle so the mark stays the focus. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(520px 420px at 50% 18%, rgba(74,200,148,0.55) 0%, rgba(22,134,83,0) 70%), linear-gradient(180deg, #1CA167 0%, #168653 45%, #0D4E34 100%)',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute -left-20 bottom-24 h-72 w-72 rounded-full border border-white/10" aria-hidden />

        <div className="relative flex flex-1 flex-col items-center justify-center">
          <div className="animate-fade-up">
            <FrisaLockup tone="white" />
          </div>
        </div>

        <div className="relative w-full space-y-6">
          <ul className="flex items-center justify-center gap-2">
            {PILLARS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-semibold text-white/85 ring-1 ring-inset ring-white/15"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-ember-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-center text-2xs font-medium uppercase tracking-[0.2em] text-white/55">
              Connecting to your fridge
            </p>
          </div>
        </div>
      </div>
    </PlainAppShell>
  )
}
