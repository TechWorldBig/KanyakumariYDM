import type { ElementType } from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

interface MetricProps {
  icon: ElementType
  label: string
  value: string
  tone: 'blue' | 'green' | 'orange' | 'violet' | string
  subtext?: string
  badge?: string
}

export function Metric({ icon: Icon, label, value, tone, subtext = 'Within your access', badge }: MetricProps) {
  return (
    <Card className="min-w-0 flex items-start gap-3 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div
        className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs',
          tone === 'blue' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900',
          tone === 'green' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900',
          tone === 'orange' && 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900',
          tone === 'violet' && 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-900',
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate leading-tight">{label}</span>
          {badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-mono">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50 tabular-nums leading-none">
          {value}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1.5 leading-tight">{subtext}</p>
      </div>
    </Card>
  )
}
