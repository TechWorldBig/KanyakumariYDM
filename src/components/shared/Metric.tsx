import type { ElementType } from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

interface MetricProps {
  icon: ElementType
  label: string
  value: string
  tone: 'blue' | 'green' | 'orange' | 'violet' | string
  subtext?: string
}

export function Metric({ icon: Icon, label, value, tone, subtext = 'Within your access' }: MetricProps) {
  return (
    <Card className="metric min-w-0 flex items-start gap-4 p-5 hover:border-district-300 dark:hover:border-slate-700 transition-all duration-200">
      <div
        className={cn(
          'size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
          tone === 'blue' && 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
          tone === 'green' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
          tone === 'orange' && 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          tone === 'violet' && 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
        )}
        aria-hidden="true"
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block truncate">{label}</span>
        <strong className="text-2xl font-bold font-mono tracking-tight text-[var(--ink)] block tabular-nums my-0.5">
          {value}
        </strong>
        <small className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">{subtext}</small>
      </div>
    </Card>
  )
}
