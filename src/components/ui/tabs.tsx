import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60 max-w-full overflow-x-auto overscroll-x-contain',
        className
      )}
      {...props}
    />
  )
}

export interface TabTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function TabTrigger({ className, active, onClick, ...props }: TabTriggerProps) {
  return (
    <button
      type="button"
      data-slot="tab-trigger"
      data-state={active ? 'active' : 'inactive'}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-district-500',
        active && 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-900 dark:text-slate-50',
        className
      )}
      {...props}
    />
  )
}
