import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { PlainAppShell } from '@/components/common/MobileAppShell'
import { ONBOARDING_ART } from '@/components/common/OnboardingArt'
import { FrisaWordmark } from '@/components/common/FrisaMark'
import { useApp } from '@/hooks/useApp'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    title: 'Meet Your Smart Fridge Assistant',
    body: 'FRISA helps you understand what is inside your refrigerator, wherever you are.',
    kicker: 'Connected',
  },
  {
    title: 'Never Lose Track of Your Food',
    body: 'Automatically organise your food, quantities, categories and expiry dates in one smart inventory.',
    kicker: 'Organised',
  },
  {
    title: 'Use It Before You Lose It',
    body: 'FRISA identifies food that should be consumed soon and reminds you before it becomes waste.',
    kicker: 'Prioritised',
  },
  {
    title: 'Turn Ingredients Into Meals',
    body: 'Get recipe recommendations based on what you already have, prioritising ingredients that are about to expire.',
    kicker: 'Cooked',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useApp()
  const [index, setIndex] = useState(0)

  const last = index === SLIDES.length - 1
  const slide = SLIDES[index]
  const Art = ONBOARDING_ART[index]

  const finish = () => {
    completeOnboarding()
    navigate('/setup', { replace: true })
  }

  return (
    <PlainAppShell>
      <div className="flex h-full flex-col bg-surface px-6 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <FrisaWordmark className="text-[22px]" />
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-3 py-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-mist hover:text-ink"
          >
            Skip
          </button>
        </div>

        <div key={index} className="mt-7 animate-fade-up">
          <Art />
        </div>

        <div key={`copy-${index}`} className="mt-8 animate-fade-up">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-frisa-600">{slide.kicker}</span>
          <h1 className="mt-2 text-[26px] font-extrabold leading-[1.15] tracking-tight text-ink">{slide.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{slide.body}</p>
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-center gap-2 pb-6" role="tablist" aria-label="Onboarding progress">
          {SLIDES.map((item, i) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Step ${i + 1}: ${item.title}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === index ? 'w-7 bg-frisa-500' : 'w-2 bg-line hover:bg-frisa-200',
              )}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {index > 0 ? (
            <Button variant="outline" size="lg" onClick={() => setIndex((i) => i - 1)} className="w-[52px] px-0">
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
              <span className="sr-only">Back</span>
            </Button>
          ) : null}
          <Button size="lg" block onClick={() => (last ? finish() : setIndex((i) => i + 1))}>
            {last ? 'Get Started' : 'Next'}
            {!last ? <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden /> : null}
          </Button>
        </div>
      </div>
    </PlainAppShell>
  )
}
