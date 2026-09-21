import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Send, Sparkles, Square } from 'lucide-react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Mascot } from '@/components/common/Mascot'
import { useApp, useUi } from '@/hooks/useApp'
import { answerQuestion } from '@/lib/assistant'
import { deriveRecipes, sortRecommended } from '@/lib/recipes'
import { RECIPES } from '@/data/recipes'
import { ASSISTANT_PROMPTS } from '@/data/seed'
import { cn, formatClock } from '@/lib/utils'

export function AskFrisaSheet() {
  const { assistantOpen, assistantSeed, closeAssistant } = useUi()
  const { items, activeFridge, shopping, assistantLog, pushAssistantMessage, savingsFor } = useApp()

  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const promptCursor = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const recipes = useMemo(() => sortRecommended(deriveRecipes(RECIPES, items)), [items])
  const savings = savingsFor('30d')

  const context = useMemo(
    () => ({ items, recipes, fridge: activeFridge, savings, shoppingCount: shopping.length }),
    [items, recipes, activeFridge, savings, shopping.length],
  )
  const contextRef = useRef(context)
  contextRef.current = context

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return
      setInput('')
      pushAssistantMessage('user', trimmed)
      setThinking(true)
      const timer = window.setTimeout(() => {
        pushAssistantMessage('frisa', answerQuestion(trimmed, contextRef.current))
        setThinking(false)
      }, 620)
      timers.current.push(timer)
    },
    [pushAssistantMessage],
  )

  /* Seed question passed in when the sheet was opened from elsewhere. */
  const seedHandled = useRef<string | undefined>()
  useEffect(() => {
    if (!assistantOpen) {
      seedHandled.current = undefined
      return
    }
    if (assistantSeed && seedHandled.current !== assistantSeed) {
      seedHandled.current = assistantSeed
      ask(assistantSeed)
    }
  }, [assistantOpen, assistantSeed, ask])

  useEffect(() => {
    if (!assistantOpen) {
      clearTimers()
      setListening(false)
      setThinking(false)
    }
    return clearTimers
  }, [assistantOpen, clearTimers])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [assistantLog.length, thinking])

  /* Simulated voice capture: the hub "hears" one of the household's usual questions. */
  const startListening = () => {
    if (listening || thinking) return
    setListening(true)
    const question = ASSISTANT_PROMPTS[promptCursor.current % ASSISTANT_PROMPTS.length]
    promptCursor.current += 1
    const timer = window.setTimeout(() => {
      setListening(false)
      ask(question)
    }, 1500)
    timers.current.push(timer)
  }

  return (
    <BottomSheet
      open={assistantOpen}
      onClose={closeAssistant}
      className="h-[86%]"
      title="Ask FRISA"
      description="Voice or text. Every answer is read from the fridge you have selected."
      footer={
        <form
          onSubmit={(event) => {
            event.preventDefault()
            ask(input)
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={startListening}
            aria-label={listening ? 'Stop listening' : 'Ask with voice'}
            className={cn(
              'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95',
              listening ? 'bg-ember-500 text-white' : 'bg-frisa-50 text-frisa-700 hover:bg-frisa-100',
            )}
          >
            {listening ? (
              <>
                <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-ember-400/50" aria-hidden />
                <Square className="relative h-4 w-4 fill-current" strokeWidth={2} />
              </>
            ) : (
              <Mic className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={listening ? 'Listening to your voice...' : 'Type a question'}
            aria-label="Ask FRISA a question"
            disabled={listening}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-mist/60 px-4 text-sm text-ink placeholder:text-ink-faint focus:border-frisa-300 focus:bg-surface focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send question"
            disabled={!input.trim() || thinking}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-frisa-500 text-white shadow-pill transition-all duration-200 active:scale-95 disabled:opacity-40"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </form>
      }
    >
      <div ref={scrollRef} className="hide-scrollbar flex h-full flex-col gap-3 overflow-y-auto pb-2">
        {assistantLog.length === 0 && !thinking ? (
          <div className="animate-fade-up rounded-3xl bg-frisa-50 p-4">
            <div className="flex items-start gap-3">
              <Mascot pose="speaker" className="-ml-1 -mt-1 h-[68px] w-auto shrink-0" />
              <div>
                <p className="text-sm font-semibold leading-snug text-frisa-800">
                  I am watching {items.length} items in {activeFridge.name}.
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-frisa-700/90">
                  Ask me what needs using, what to cook, or whether something is still in the fridge.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {assistantLog.map((message) => (
          <div
            key={message.id}
            className={cn('flex animate-fade-up', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-3xl px-4 py-3 text-[13px] leading-relaxed',
                message.role === 'user'
                  ? 'rounded-br-lg bg-ink text-white'
                  : 'rounded-bl-lg bg-mist text-ink',
              )}
            >
              {message.role === 'frisa' ? (
                <span className="mb-1 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-frisa-700">
                  <Sparkles className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                  FRISA
                </span>
              ) : null}
              <p>{message.text}</p>
              <span
                className={cn(
                  'mt-1.5 block text-[10px]',
                  message.role === 'user' ? 'text-white/50' : 'text-ink-faint',
                )}
              >
                {formatClock(message.at)}
              </span>
            </div>
          </div>
        ))}

        {listening ? (
          <div className="flex animate-fade-in items-center gap-3 self-center rounded-full bg-ember-50 px-4 py-2.5">
            <span className="flex h-4 items-end gap-[3px]" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-full w-[3px] origin-bottom animate-wave-bar rounded-full bg-ember-500"
                  style={{ animationDelay: `${i * 110}ms` }}
                />
              ))}
            </span>
            <span className="text-xs font-semibold text-ember-700">Listening through FRISA Hub</span>
          </div>
        ) : null}

        {thinking ? (
          <div className="flex animate-fade-in items-center gap-2 self-start rounded-3xl rounded-bl-lg bg-mist px-4 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-wave-bar rounded-full bg-ink-faint"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </div>
        ) : null}

        <div className="pt-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {ASSISTANT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                disabled={thinking || listening}
                className="rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-soft transition-all duration-200 hover:border-frisa-200 hover:bg-frisa-50 hover:text-frisa-700 active:scale-95 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
