import type { ChartDataPoint, ConsumptionInsight, PeriodKey, SavingsSummary } from '@/types'

/**
 * Chart palette.
 *
 * Green and orange are the brand identity; the blue slot exists only so the
 * three-part donut passes a colour-vision separation check. Validated with the
 * dataviz palette validator (lightness band, chroma floor, CVD separation and
 * normal-vision floor all pass on a white surface).
 */
export const CHART = {
  green: '#25B877',
  greenDeep: '#168653',
  orange: '#FC8612',
  orangeDeep: '#D96900',
  blue: '#2E86C9',
  grid: '#E4EAE6',
  axis: '#8D998F',
} as const

export const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '3m', label: '3 Months' },
]

export interface PeriodData {
  /** Sentence above the hero figure. */
  heroLabel: string
  summary: SavingsSummary
  /** Food rescued, in kilograms. */
  savedTrend: ChartDataPoint[]
  /** Money saved, in rupiah. */
  moneyTrend: ChartDataPoint[]
  /** Share of everything that entered the fridge in the period. */
  split: { consumed: number; wasted: number; inventory: number }
  /** Food that still became waste, in kilograms. */
  wasteByCategory: ChartDataPoint[]
  insights: ConsumptionInsight[]
}

/** Kilograms of CO2 equivalent avoided per kilogram of food rescued. */
export const CO2_PER_KG = 1.63

export const INSIGHT_DATA: Record<PeriodKey, PeriodData> = {
  '7d': {
    heroLabel: 'In the last 7 days you saved',
    summary: {
      foodSavedKg: 3.2,
      moneySaved: 116000,
      itemsRescued: 8,
      wasteReductionPct: 34,
      co2Kg: 5.2,
    },
    savedTrend: [
      { label: 'Thu', value: 0.3 },
      { label: 'Fri', value: 0.5 },
      { label: 'Sat', value: 0.2 },
      { label: 'Sun', value: 0.6 },
      { label: 'Mon', value: 0.4 },
      { label: 'Tue', value: 0.7 },
      { label: 'Wed', value: 0.5 },
    ],
    moneyTrend: [
      { label: 'Thu', value: 11000 },
      { label: 'Fri', value: 17500 },
      { label: 'Sat', value: 8000 },
      { label: 'Sun', value: 22000 },
      { label: 'Mon', value: 15000 },
      { label: 'Tue', value: 26500 },
      { label: 'Wed', value: 16000 },
    ],
    split: { consumed: 86, wasted: 8, inventory: 6 },
    wasteByCategory: [
      { label: 'Vegetables', value: 0.3 },
      { label: 'Leftovers', value: 0.2 },
      { label: 'Dairy', value: 0.1 },
      { label: 'Protein', value: 0.08 },
      { label: 'Fruit', value: 0.05 },
    ],
    insights: [
      {
        id: '7d-1',
        icon: 'sprout',
        title: 'Vegetables remain your highest-risk category',
        body: 'Three of the four items you lost this week came from the fresh drawer. Moving leafy greens to the front shelf usually helps.',
        tone: 'attention',
      },
      {
        id: '7d-2',
        icon: 'calendar',
        title: 'Tuesday is your busiest restocking day',
        body: 'FRISA logged 6 of this week’s 14 additions on Tuesday evening, right after your grocery run.',
        tone: 'neutral',
      },
      {
        id: '7d-3',
        icon: 'trending-up',
        title: 'Your best day was Tuesday',
        body: 'You rescued 0.7 kg of food worth about Rp26,500 by cooking the tempeh before it turned.',
        tone: 'positive',
      },
    ],
  },
  '30d': {
    heroLabel: 'This month you saved',
    summary: {
      foodSavedKg: 8.4,
      moneySaved: 326500,
      itemsRescued: 21,
      wasteReductionPct: 31,
      co2Kg: 13.7,
    },
    savedTrend: [
      { label: 'Week 1', value: 1.3 },
      { label: 'Week 2', value: 1.8 },
      { label: 'Week 3', value: 2.1 },
      { label: 'Week 4', value: 3.2 },
    ],
    moneyTrend: [
      { label: 'Week 1', value: 54000 },
      { label: 'Week 2', value: 67500 },
      { label: 'Week 3', value: 89000 },
      { label: 'Week 4', value: 116000 },
    ],
    split: { consumed: 82, wasted: 11, inventory: 7 },
    wasteByCategory: [
      { label: 'Vegetables', value: 1.1 },
      { label: 'Leftovers', value: 0.8 },
      { label: 'Dairy', value: 0.5 },
      { label: 'Protein', value: 0.4 },
      { label: 'Fruit', value: 0.3 },
    ],
    insights: [
      {
        id: '30d-1',
        icon: 'sprout',
        title: 'Vegetables are your highest-risk food category',
        body: 'Vegetables account for 1.1 kg of the 3.1 kg that still became waste this month. They also carry the shortest average shelf life in your fridge.',
        tone: 'attention',
      },
      {
        id: '30d-2',
        icon: 'trending-down',
        title: 'You reduced food waste by 12% compared with last month',
        body: 'Acting on expiry reminders within the first day is the single change that moved this number.',
        tone: 'positive',
      },
      {
        id: '30d-3',
        icon: 'milk',
        title: 'Your household usually consumes milk 2 days before expiry',
        body: 'FRISA now schedules the milk reminder earlier so the carton is never opened too late.',
        tone: 'neutral',
      },
      {
        id: '30d-4',
        icon: 'wallet',
        title: 'You saved approximately Rp116,000 more this month',
        body: 'Week 4 alone accounted for Rp116,000, more than double the Rp54,000 you rescued in week 1.',
        tone: 'positive',
      },
      {
        id: '30d-5',
        icon: 'calendar',
        title: 'Tuesday is the most common day for food additions',
        body: 'Expiry clusters around Sunday because of it. FRISA front-loads recipe suggestions on Saturday to spread the load.',
        tone: 'neutral',
      },
    ],
  },
  '3m': {
    heroLabel: 'In the last 3 months you saved',
    summary: {
      foodSavedKg: 21.9,
      moneySaved: 856000,
      itemsRescued: 54,
      wasteReductionPct: 27,
      co2Kg: 35.7,
    },
    savedTrend: [
      { label: 'Jul', value: 6.1 },
      { label: 'Aug', value: 7.4 },
      { label: 'Sep', value: 8.4 },
    ],
    moneyTrend: [
      { label: 'Jul', value: 241000 },
      { label: 'Aug', value: 288500 },
      { label: 'Sep', value: 326500 },
    ],
    split: { consumed: 79, wasted: 14, inventory: 7 },
    wasteByCategory: [
      { label: 'Vegetables', value: 3.2 },
      { label: 'Leftovers', value: 2.4 },
      { label: 'Dairy', value: 1.6 },
      { label: 'Protein', value: 1.2 },
      { label: 'Fruit', value: 0.9 },
    ],
    insights: [
      {
        id: '3m-1',
        icon: 'trending-up',
        title: 'Every month has been better than the one before it',
        body: 'Food rescued rose from 6.1 kg in July to 8.4 kg in September, a 38% improvement across the quarter.',
        tone: 'positive',
      },
      {
        id: '3m-2',
        icon: 'sprout',
        title: 'Vegetables and leftovers drive 63% of remaining waste',
        body: 'Both categories lose value within 48 hours. FRISA now ranks them above everything else in Use These First.',
        tone: 'attention',
      },
      {
        id: '3m-3',
        icon: 'wallet',
        title: 'Rp856,000 recovered since July',
        body: 'That is roughly one week of household groceries returned to your budget over the quarter.',
        tone: 'positive',
      },
      {
        id: '3m-4',
        icon: 'leaf',
        title: 'About 35.7 kg CO2e avoided',
        body: 'Estimated from the food that was eaten instead of discarded. Treat it as an indication of direction, not a certified figure.',
        tone: 'neutral',
      },
    ],
  },
}
