import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FoodCategory, FoodItem, FoodStatus, RiskLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* -------------------------------------------------------------------------- */
/*  Dates                                                                      */
/* -------------------------------------------------------------------------- */

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(days: number, from: Date = startOfToday()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

/** ISO date `days` from today. Seed data is written as offsets so the demo never goes stale. */
export function isoInDays(days: number): string {
  return toISODate(addDays(days))
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Whole days between today and an ISO date. Negative means already expired. */
export function daysUntil(iso: string): number {
  const diff = parseISODate(iso).getTime() - startOfToday().getTime()
  return Math.round(diff / 86_400_000)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return parseISODate(iso).toLocaleDateString('en-GB', opts)
}

export function formatLongDate(d: Date = new Date()) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** "08:42", "Yesterday", "Tuesday" or a date - whichever reads most naturally. */
export function formatEventTime(iso: string): string {
  const then = new Date(iso)
  const dayDiff = Math.round((startOfToday().getTime() - new Date(then).setHours(0, 0, 0, 0)) / 86_400_000)
  if (dayDiff <= 0) return formatClock(iso)
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff < 7) return then.toLocaleDateString('en-GB', { weekday: 'long' })
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function relativeMinutes(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`
}

/** "Tomorrow", "in 3 days", "Today", "2 days ago". */
export function expiryPhrase(days: number): string {
  if (days < -1) return `${Math.abs(days)} days ago`
  if (days === -1) return 'Yesterday'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 31) return `in ${days} days`
  if (days < 365) return `in ${Math.round(days / 30)} months`
  return 'Long shelf life'
}

export function daysRemainingLabel(days: number): string {
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return '1 day left'
  if (days < 31) return `${days} days left`
  if (days < 365) return `${Math.round(days / 30)} months left`
  return 'Long shelf life'
}

/* -------------------------------------------------------------------------- */
/*  Currency & numbers                                                         */
/* -------------------------------------------------------------------------- */

export function rupiah(value: number): string {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

/** Compact rupiah for tight chart axes: Rp116k. */
export function rupiahShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `Rp${Math.round(value / 1_000)}k`
  return `Rp${Math.round(value)}`
}

export function kg(value: number, digits = 1): string {
  return `${value.toFixed(digits)} kg`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatQuantity(item: Pick<FoodItem, 'quantity' | 'unit'>): string {
  const rounded = Math.round(item.quantity * 10) / 10
  const amount = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
  return `${amount} ${item.unit}`
}

/* -------------------------------------------------------------------------- */
/*  Waste Risk engine                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Urgency purely from expiry proximity, interpolated between calibrated anchors.
 * Deliberately steep in the first 72 hours - that is where food is actually lost.
 */
const URGENCY_ANCHORS: Array<[days: number, score: number]> = [
  [0, 100],
  [1, 92],
  [2, 78],
  [3, 64],
  [5, 46],
  [7, 33],
  [10, 24],
  [14, 16],
  [21, 11],
  [45, 7],
  [120, 3],
]

/** How quickly a category degrades once it is in the fridge. */
const CATEGORY_SENSITIVITY: Record<FoodCategory, number> = {
  Leftover: 0.99,
  Dairy: 1.03,
  Protein: 0.95,
  Vegetables: 0.93,
  Fruit: 0.87,
  Frozen: 0.75,
  Drinks: 0.72,
  Pantry: 0.6,
}

function urgencyFromDays(days: number): number {
  if (days <= 0) return 100
  const last = URGENCY_ANCHORS[URGENCY_ANCHORS.length - 1]
  if (days >= last[0]) return last[1]
  for (let i = 1; i < URGENCY_ANCHORS.length; i += 1) {
    const [d1, s1] = URGENCY_ANCHORS[i]
    if (days <= d1) {
      const [d0, s0] = URGENCY_ANCHORS[i - 1]
      const t = (days - d0) / (d1 - d0)
      return s0 + (s1 - s0) * t
    }
  }
  return last[1]
}

/**
 * FRISA Waste Risk Score (0-100).
 * Combines expiry proximity, category sensitivity, remaining quantity and the
 * household consumption pattern. Food-management intelligence, not a medical claim.
 */
export function riskScore(item: FoodItem): number {
  if (item.quantity <= 0) return 0
  const days = daysUntil(item.expiresAt)
  const base = urgencyFromDays(days) * CATEGORY_SENSITIVITY[item.category]
  const remainingRatio = item.initialQuantity > 0 ? clamp(item.quantity / item.initialQuantity, 0, 1) : 1
  const stockTerm = (remainingRatio - 1) * 10
  const score = base + item.patternAdjust + stockTerm
  return Math.round(clamp(score, 1, 99))
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 90) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function foodStatus(item: FoodItem): FoodStatus {
  const days = daysUntil(item.expiresAt)
  if (days < 0) return 'expired'
  if (riskScore(item) >= 60 || days <= 3) return 'use-soon'
  return 'fresh'
}

export function isPriority(item: FoodItem): boolean {
  return !item.shelfStable && riskScore(item) >= 60
}

/** Rupiah value of `portion` units of an item. */
export function portionValue(item: FoodItem, portion: number): number {
  if (item.quantity <= 0) return 0
  const unitValue = item.value / item.quantity
  return Math.round(unitValue * Math.min(portion, item.quantity))
}

export function portionWeight(item: FoodItem, portion: number): number {
  if (item.quantity <= 0) return 0
  const unitWeight = item.weightKg / item.quantity
  return unitWeight * Math.min(portion, item.quantity)
}

/* -------------------------------------------------------------------------- */
/*  Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 11) return 'Good morning'
  if (h < 15) return 'Good afternoon'
  if (h < 19) return 'Good evening'
  return 'Good night'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
