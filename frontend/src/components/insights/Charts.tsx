import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartDataPoint } from '@/types'
import { CHART } from '@/data/insights'
import { cn, rupiah, rupiahShort } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Shared chrome                                                              */
/* -------------------------------------------------------------------------- */

export function ChartCard({
  title,
  subtitle,
  children,
  footnote,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footnote?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      <header className="px-4 pb-1 pt-4">
        <h3 className="text-[15px] font-bold leading-tight tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs leading-snug text-ink-muted">{subtitle}</p> : null}
      </header>
      <div className="px-1 pb-1 pt-3">{children}</div>
      {footnote ? (
        <div className="border-t border-line bg-mist/40 px-4 py-2.5 text-2xs leading-snug text-ink-muted">
          {footnote}
        </div>
      ) : null}
    </section>
  )
}

interface TooltipEntry {
  value?: number | string
  name?: string
  payload?: { label?: string }
}

function FrisaTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  format: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const value = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-lift">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">
        {label ?? entry.payload?.label}
      </p>
      <p className="num mt-0.5 text-[13px] font-extrabold text-ink">{format(value)}</p>
    </div>
  )
}

const AXIS_TICK = { fill: CHART.axis, fontSize: 11, fontWeight: 600 }

/**
 * Evenly spaced axis ticks on round numbers (1, 2, 2.5 or 5 times a power of ten),
 * with a little headroom above the peak. Recharts' own ticks drop labels that
 * collide, which leaves uneven gaps such as 0, 2, 5.
 */
function niceTicks(peak: number): number[] {
  if (!(peak > 0)) return [0, 1]
  const ceiling = peak * 1.06
  const magnitude = 10 ** Math.floor(Math.log10(ceiling))
  /* Of every round step that gives three to six intervals, keep the one whose
     top sits closest above the peak, so the data fills the plot. */
  let best = { step: magnitude, top: Math.ceil(ceiling / magnitude) * magnitude }
  for (const scale of [0.1, 1]) {
    for (const nice of [1, 2, 2.5, 5]) {
      const step = nice * magnitude * scale
      const intervals = Math.ceil(ceiling / step)
      if (intervals < 3 || intervals > 6) continue
      const top = intervals * step
      if (top < best.top || (top === best.top && step > best.step)) best = { step, top }
    }
  }
  const ticks: number[] = []
  for (let i = 0; i * best.step <= best.top + best.step / 1000; i += 1) {
    ticks.push(Math.round(i * best.step * 1000) / 1000)
  }
  return ticks
}

const GRID = <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 4" />

/* -------------------------------------------------------------------------- */
/*  1. Food saved trend - one series, so no legend; the title names it.        */
/* -------------------------------------------------------------------------- */

export function FoodSavedTrendChart({ data }: { data: ChartDataPoint[] }) {
  const gradientId = useId()
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)))

  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.green} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.green} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {GRID}
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          tick={AXIS_TICK}
          dy={6}
          interval={data.length > 8 ? 'preserveStartEnd' : 0}
          padding={{ left: 14, right: 14 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={34}
          tickFormatter={(value: number) => `${value}`}
          ticks={ticks}
          domain={[0, ticks[ticks.length - 1]]}
          interval={0}
        />
        <Tooltip
          cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
          content={<FrisaTooltip format={(value) => `${value} kg rescued`} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART.green}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: '#FFFFFF', stroke: CHART.green, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: CHART.green, stroke: '#FFFFFF', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* -------------------------------------------------------------------------- */
/*  2. Consumed vs wasted - part to whole, three segments.                     */
/* -------------------------------------------------------------------------- */

const SPLIT_COLORS = [CHART.green, CHART.orange, CHART.blue]

export function ConsumptionSplitChart({
  split,
}: {
  split: { consumed: number; wasted: number; inventory: number }
}) {
  const data = [
    { label: 'Consumed', value: split.consumed },
    { label: 'Wasted', value: split.wasted },
    { label: 'Still in inventory', value: split.inventory },
  ]

  return (
    <div className="flex items-center gap-1">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={SPLIT_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip content={<FrisaTooltip format={(value) => `${value}% of food` } />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {split.consumed}%
          </span>
          <span className="mt-1 text-2xs font-semibold text-ink-muted">consumed</span>
        </div>
      </div>

      {/* Legend doubles as the direct label, so identity is never colour alone. */}
      <ul className="min-w-0 flex-1 space-y-2 pr-3">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SPLIT_COLORS[index] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-soft">{entry.label}</span>
            <span className="num text-xs font-extrabold text-ink">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  3. Waste by category - one measure across nominal categories, so one hue.  */
/* -------------------------------------------------------------------------- */

export function WasteByCategoryChart({ data }: { data: ChartDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <ResponsiveContainer width="100%" height={data.length * 34 + 28}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide domain={[0, max * 1.18]} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={78}
        />
        <Tooltip
          cursor={{ fill: 'rgba(228,234,230,0.45)' }}
          content={<FrisaTooltip format={(value) => `${value} kg wasted`} />}
        />
        {/* One measure across nominal categories, so every bar wears the same hue. */}
        <Bar dataKey="value" fill={CHART.orange} radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* -------------------------------------------------------------------------- */
/*  4. Money saved trend                                                       */
/* -------------------------------------------------------------------------- */

export function MoneySavedChart({ data }: { data: ChartDataPoint[] }) {
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)))

  return (
    <ResponsiveContainer width="100%" height={196}>
      <BarChart data={data} margin={{ top: 20, right: 12, bottom: 4, left: 0 }} barCategoryGap={data.length > 5 ? 6 : 18}>
        {GRID}
        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART.grid }} tick={AXIS_TICK} dy={6} interval={0} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={48}
          tickFormatter={(value: number) => rupiahShort(value)}
          ticks={ticks}
          domain={[0, ticks[ticks.length - 1]]}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: 'rgba(228,234,230,0.45)' }}
          content={<FrisaTooltip format={(value) => `${rupiah(value)} saved`} />}
        />
        {/* Emphasis, not a value ramp: the current period is solid, earlier ones recede. */}
        <Bar dataKey="value" fill={CHART.green} radius={[4, 4, 0, 0]} maxBarSize={38}>
          {data.map((entry, index) => (
            <Cell key={entry.label} fillOpacity={index === data.length - 1 ? 1 : 0.5} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* -------------------------------------------------------------------------- */
/*  Table view - the WCAG-clean twin of every chart above.                     */
/* -------------------------------------------------------------------------- */

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: [string, string]
  rows: Array<[string, string]>
}) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left">
        <caption className="px-4 pb-2 pt-4 text-left text-[15px] font-bold tracking-tight text-ink">
          {caption}
        </caption>
        <thead>
          <tr className="border-y border-line bg-mist/40">
            <th scope="col" className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {columns[0]}
            </th>
            <th scope="col" className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {columns[1]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([key, value]) => (
            <tr key={key}>
              <th scope="row" className="px-4 py-2.5 text-[13px] font-semibold text-ink">
                {key}
              </th>
              <td className="num px-4 py-2.5 text-right text-[13px] font-semibold text-ink-soft">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
