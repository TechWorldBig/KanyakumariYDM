import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-district-500',
  {
    variants: {
      variant: {
        default: 'border border-district-200 bg-district-50 text-district-700 dark:bg-district-950/60 dark:text-district-300 dark:border-district-900',
        secondary: 'border border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        success: 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
        warning: 'border border-amber-200/80 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
        destructive: 'border border-rose-200/80 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
        outline: 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-transparent',
        blue: 'border border-blue-200/80 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
        violet: 'border border-violet-200/80 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'size-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'destructive' && 'bg-rose-500',
            variant === 'blue' && 'bg-blue-500',
            variant === 'violet' && 'bg-violet-500',
            (!variant || variant === 'default') && 'bg-district-500',
            variant === 'secondary' && 'bg-slate-400',
            variant === 'outline' && 'bg-slate-500',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}
