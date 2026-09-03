import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Lock,
  Minus,
  Plus,
  Radar,
  Refrigerator,
  ShieldCheck,
  TriangleAlert,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { PlainAppShell } from '@/components/common/MobileAppShell'
import { FrisaMark } from '@/components/common/FrisaMark'
import { StatusChip } from '@/components/common/Badges'
import {
  ALLERGY_OPTIONS,
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  RECIPE_PREF_OPTIONS,
} from '@/data/seed'
import { PairingSheet } from '@/components/device/PairingSheet'
import { useApp, useToast } from '@/hooks/useApp'
import { passwordAccepted, passwordRules, passwordStrength } from '@/lib/pairing'
import { cn } from '@/lib/utils'

const STEPS = ['Fridge', 'Device', 'Household', 'Food'] as const

const STRENGTH_META = {
  weak: { label: 'Weak', bar: 'bg-danger-500', text: 'text-danger-600' },
  fair: { label: 'Fair', bar: 'bg-ember-500', text: 'text-ember-700' },
  strong: { label: 'Strong', bar: 'bg-frisa-500', text: 'text-frisa-700' },
} as const

function ChipSelect({
  options,
  selected,
  onToggle,
  columns = 'auto',
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  columns?: 'auto' | 'two'
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', columns === 'two' && 'grid grid-cols-2')}>
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
              active
                ? 'border-frisa-500 bg-frisa-50 text-frisa-700'
                : 'border-line bg-surface text-ink-muted hover:border-frisa-200',
            )}
          >
            {active ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : null}
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function SetupPage() {
  const navigate = useNavigate()
  const { completeSetup, fridges } = useApp()
  const { toast } = useToast()

  const homeHub = fridges.find((f) => f.id === 'home')!

  const [step, setStep] = useState(0)
  const [fridgeName, setFridgeName] = useState('Home Fridge')
  const [household, setHousehold] = useState('Wijaya Family')
  const [members, setMembers] = useState(4)
  const [diet, setDiet] = useState('No restriction')
  const [allergies, setAllergies] = useState<string[]>(['Peanuts'])
  const [cuisines, setCuisines] = useState<string[]>(['Indonesian', 'Asian'])
  const [recipePrefs, setRecipePrefs] = useState<string[]>(['High Protein'])
  const [done, setDone] = useState(false)

  /* Device pairing */
  const [scanning, setScanning] = useState(true)
  const [pairingOpen, setPairingOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [skipPasswordChange, setSkipPasswordChange] = useState(false)

  /* Discovery runs whenever the user arrives at the device step. */
  useEffect(() => {
    if (step !== 1) return
    if (homeHub.paired) {
      setScanning(false)
      return
    }
    setScanning(true)
    const timer = window.setTimeout(() => setScanning(false), 1300)
    return () => window.clearTimeout(timer)
  }, [step, homeHub.paired])

  const toggle = (list: string[], setList: (next: string[]) => void) => (value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const canContinue = useMemo(() => {
    if (step === 0) return fridgeName.trim().length > 1
    if (step === 1) {
      if (!homeHub.paired) return false
      if (skipPasswordChange || !newPassword) return true
      return passwordAccepted(newPassword, homeHub.security.factoryPassword) && newPassword === confirmPassword
    }
    if (step === 2) return household.trim().length > 1
    return true
  }, [step, fridgeName, household, homeHub, skipPasswordChange, newPassword, confirmPassword])

  const finish = () => {
    const chosenPassword =
      !skipPasswordChange && passwordAccepted(newPassword, homeHub.security.factoryPassword) && newPassword === confirmPassword
        ? newPassword
        : undefined

    completeSetup({
      fridgeName: fridgeName.trim(),
      homePassword: chosenPassword,
      household: household.trim(),
      members,
      diet,
      allergies,
      cuisines,
      recipePrefs,
    })
    setDone(true)
  }

  if (done) {
    return (
      <PlainAppShell>
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-frisa-700 px-8 text-center text-white">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(520px 420px at 50% 25%, rgba(74,200,148,0.55) 0%, rgba(22,134,83,0) 70%), linear-gradient(180deg, #1CA167 0%, #168653 50%, #0D4E34 100%)',
            }}
            aria-hidden
          />
          <div className="relative animate-fade-up">
            <span className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/10 ring-1 ring-inset ring-white/20">
              <span className="absolute inset-0 animate-pulse-ring rounded-[28px] bg-white/20" aria-hidden />
              <FrisaMark className="h-14 w-14" tone="white" />
            </span>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">FRISA is Ready</h1>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-white/80">
              {fridgeName} is connected and synced. FRISA is already watching 16 items for you.
            </p>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <StatusChip tone="onGreen" icon={CircleCheck}>
                Hub paired
              </StatusChip>
              <StatusChip tone="onGreen" icon={CircleCheck}>
                Inventory synced
              </StatusChip>
              <StatusChip tone="onGreen" icon={CircleCheck}>
                Preferences saved
              </StatusChip>
            </ul>
          </div>

          <div className="relative mt-12 w-full">
            <Button
              size="lg"
              block
              className="bg-white text-frisa-700 shadow-none hover:bg-white/90"
              onClick={() => {
                toast('Welcome to FRISA', { description: 'Your fridge is being monitored in real time.' })
                navigate('/home', { replace: true })
              }}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </PlainAppShell>
    )
  }

  return (
    <PlainAppShell>
      <div className="flex h-full flex-col bg-surface">
        <header className="sticky top-0 z-20 bg-surface px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                aria-label="Previous step"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line text-ink transition-colors hover:bg-mist"
              >
                <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            ) : (
              <FrisaMark className="h-10 w-10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-frisa-600">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight text-ink">
                Let&apos;s set up your FRISA
              </h1>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5" aria-hidden>
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-300',
                  i <= step ? 'bg-frisa-500' : 'bg-line',
                )}
              />
            ))}
          </div>
        </header>

        <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-4">
          {step === 0 ? (
            <section key="s0" className="animate-fade-up space-y-5 pt-2">
              <div className="flex items-start gap-3 rounded-3xl bg-frisa-50 p-4">
                <Refrigerator className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
                <p className="text-[13px] leading-relaxed text-frisa-800">
                  Give this refrigerator a name. You can connect more fridges later and switch between them at any
                  time.
                </p>
              </div>

              <div>
                <label htmlFor="fridge-name" className="mb-2 block text-[13px] font-bold text-ink">
                  Fridge name
                </label>
                <input
                  id="fridge-name"
                  value={fridgeName}
                  onChange={(event) => setFridgeName(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-line bg-mist/50 px-4 text-[15px] font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  placeholder="Home Fridge"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Home Fridge', 'Kitchen Fridge', 'Apartment Fridge'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setFridgeName(suggestion)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-frisa-200 hover:text-frisa-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section key="s1" className="animate-fade-up space-y-4 pt-2">
              {/* Discovered device */}
              <div className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-b from-frisa-50 to-white p-6">
                <div className="flex flex-col items-center">
                  <span className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-card">
                    {scanning || !homeHub.paired ? (
                      <>
                        <span className="absolute inset-0 animate-pulse-ring rounded-[28px] bg-frisa-200" aria-hidden />
                        <span
                          className="absolute inset-0 animate-pulse-ring rounded-[28px] bg-frisa-200"
                          style={{ animationDelay: '700ms' }}
                          aria-hidden
                        />
                      </>
                    ) : null}
                    <FrisaMark className="relative h-14 w-14" />
                  </span>

                  <p className="text-sm font-bold text-ink">FRISA Hub</p>
                  <p className="num mt-0.5 text-xs font-semibold text-ink-muted">{homeHub.deviceId}</p>

                  <div className="mt-4">
                    {scanning ? (
                      <StatusChip tone="neutral" icon={Radar}>
                        Searching for nearby hubs
                      </StatusChip>
                    ) : homeHub.paired ? (
                      <StatusChip tone="green" icon={CircleCheck}>
                        Paired securely
                      </StatusChip>
                    ) : (
                      <StatusChip tone="orange" icon={Lock}>
                        Locked - password required
                      </StatusChip>
                    )}
                  </div>
                </div>
              </div>

              {/* Pair, or confirm the pairing */}
              {!homeHub.paired ? (
                <>
                  <div className="flex items-start gap-3 rounded-3xl bg-frisa-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
                    <p className="text-[13px] leading-relaxed text-frisa-800">
                      Anyone in Wi-Fi range can see this hub, so it will not share anything until you prove it is
                      yours. Enter the password printed on its label.
                    </p>
                  </div>

                  <Button size="lg" block disabled={scanning} onClick={() => setPairingOpen(true)}>
                    <Lock className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
                    {scanning ? 'Searching...' : 'Enter pairing password'}
                  </Button>
                </>
              ) : (
                <>
                  <ol className="space-y-2.5">
                    {['Hub discovered on your network', 'Password verified on the device', 'Inventory synchronised'].map(
                      (label, i) => (
                        <li key={label} className="flex items-center gap-3">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-frisa-500 text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                          </span>
                          <span className="text-[13px] font-semibold text-ink">{label}</span>
                          <span className="sr-only">step {i + 1} complete</span>
                        </li>
                      ),
                    )}
                  </ol>

                  {/* Replace the factory password */}
                  <div className="card overflow-hidden">
                    <div className="flex items-start gap-3 border-b border-line bg-ember-50 p-4">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
                      <div>
                        <p className="text-[13px] font-bold text-ember-800">Replace the factory password</p>
                        <p className="mt-1 text-[13px] leading-snug text-ember-800/80">
                          The password on the label is printed on every hub of this model. Set your own so only your
                          household can connect.
                        </p>
                      </div>
                    </div>

                    {skipPasswordChange ? (
                      <button
                        type="button"
                        onClick={() => setSkipPasswordChange(false)}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-mist/60"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist text-ink-soft">
                          <Lock className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                        </span>
                        <span className="text-[13px] font-semibold text-ink">
                          Set a password now after all
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-3.5 p-4">
                        <div>
                          <label htmlFor="setup-new-password" className="mb-1.5 block text-[13px] font-bold text-ink">
                            New pairing password
                          </label>
                          <input
                            id="setup-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            autoComplete="new-password"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="At least 8 characters"
                            className="h-[52px] w-full rounded-2xl border border-line bg-mist/50 px-4 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-faint focus:border-frisa-400 focus:bg-surface focus:outline-none"
                          />
                        </div>

                        {newPassword ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-semibold text-ink-muted">Strength</span>
                              <span
                                className={cn(
                                  'text-2xs font-bold',
                                  STRENGTH_META[passwordStrength(newPassword).level].text,
                                )}
                              >
                                {STRENGTH_META[passwordStrength(newPassword).level].label}
                              </span>
                            </div>
                            <div className="mt-1.5 flex gap-1" aria-hidden>
                              {[1, 2, 3, 4, 5].map((stepIndex) => (
                                <span
                                  key={stepIndex}
                                  className={cn(
                                    'h-1.5 flex-1 rounded-full transition-colors duration-200',
                                    stepIndex <= passwordStrength(newPassword).score
                                      ? STRENGTH_META[passwordStrength(newPassword).level].bar
                                      : 'bg-mist',
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <ul className="space-y-1.5">
                          {passwordRules(newPassword, homeHub.security.factoryPassword).map((rule) => (
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
                              <span className={cn('text-xs', rule.passed ? 'text-ink-soft' : 'text-ink-muted')}>
                                {rule.label}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div>
                          <label htmlFor="setup-confirm-password" className="mb-1.5 block text-[13px] font-bold text-ink">
                            Confirm password
                          </label>
                          <input
                            id="setup-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="Type it once more"
                            aria-invalid={confirmPassword.length > 0 && confirmPassword !== newPassword}
                            className={cn(
                              'h-[52px] w-full rounded-2xl border bg-mist/50 px-4 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-faint focus:bg-surface focus:outline-none',
                              confirmPassword.length > 0 && confirmPassword !== newPassword
                                ? 'border-danger-500 focus:border-danger-500'
                                : 'border-line focus:border-frisa-400',
                            )}
                          />
                          {confirmPassword.length > 0 && confirmPassword !== newPassword ? (
                            <p className="mt-1.5 text-xs font-semibold text-danger-600">
                              The two passwords do not match.
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSkipPasswordChange(true)
                            setNewPassword('')
                            setConfirmPassword('')
                          }}
                          className="w-full rounded-xl py-2 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-mist hover:text-ink"
                        >
                          Skip for now, keep the factory password
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section key="s2" className="animate-fade-up space-y-5 pt-2">
              <div className="flex items-start gap-3 rounded-3xl bg-frisa-50 p-4">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
                <p className="text-[13px] leading-relaxed text-frisa-800">
                  Household size helps FRISA estimate how quickly food is normally consumed.
                </p>
              </div>

              <div>
                <label htmlFor="household" className="mb-2 block text-[13px] font-bold text-ink">
                  Household name
                </label>
                <input
                  id="household"
                  value={household}
                  onChange={(event) => setHousehold(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-line bg-mist/50 px-4 text-[15px] font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                />
              </div>

              <div>
                <p className="mb-2 text-[13px] font-bold text-ink">Members</p>
                <div className="flex items-center justify-between rounded-2xl border border-line bg-mist/50 p-2.5">
                  <button
                    type="button"
                    aria-label="Remove one member"
                    onClick={() => setMembers((m) => Math.max(1, m - 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink shadow-card transition-transform active:scale-95"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                  <span className="num text-2xl font-extrabold text-ink">{members}</span>
                  <button
                    type="button"
                    aria-label="Add one member"
                    onClick={() => setMembers((m) => Math.min(12, m + 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink shadow-card transition-transform active:scale-95"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section key="s3" className="animate-fade-up space-y-6 pt-2">
              <div className="flex items-start gap-3 rounded-3xl bg-frisa-50 p-4">
                <Utensils className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
                <p className="text-[13px] leading-relaxed text-frisa-800">
                  FRISA filters every recipe suggestion against these preferences.
                </p>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-ink">Diet</p>
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={diet === option}
                      onClick={() => setDiet(option)}
                      className={cn(
                        'rounded-2xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
                        diet === option
                          ? 'border-frisa-500 bg-frisa-50 text-frisa-700'
                          : 'border-line bg-surface text-ink-muted hover:border-frisa-200',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-ink">Allergies</p>
                <ChipSelect options={ALLERGY_OPTIONS} selected={allergies} onToggle={toggle(allergies, setAllergies)} />
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-ink">Favourite cuisines</p>
                <ChipSelect options={CUISINE_OPTIONS} selected={cuisines} onToggle={toggle(cuisines, setCuisines)} />
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-ink">Recipe preferences</p>
                <ChipSelect
                  options={RECIPE_PREF_OPTIONS}
                  selected={recipePrefs}
                  onToggle={toggle(recipePrefs, setRecipePrefs)}
                />
              </div>
            </section>
          ) : null}
        </div>

        <PairingSheet
          open={pairingOpen}
          fridgeId="home"
          onClose={() => setPairingOpen(false)}
          onPaired={(fridge) =>
            toast(`${fridge.deviceId} paired`, {
              description: 'Now replace the factory password so only your household can connect.',
            })
          }
        />

        <div className="shrink-0 border-t border-line bg-surface px-5 pb-7 pt-4">
          <Button
            size="lg"
            block
            disabled={!canContinue}
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep((s) => s + 1))}
          >
            {step === STEPS.length - 1
              ? 'Finish setup'
              : step === 1 && !homeHub.paired
                ? 'Connect your hub to continue'
                : 'Continue'}
          </Button>
        </div>
      </div>
    </PlainAppShell>
  )
}
