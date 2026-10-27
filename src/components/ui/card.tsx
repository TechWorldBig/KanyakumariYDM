import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      data-slot="card"
      className={cn(
        'rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[var(--surface)] text-[var(--ink)] shadow-xs transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col space-y-1 p-4 sm:p-5', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-sm sm:text-base font-semibold tracking-tight text-[var(--ink)]', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn('p-4 sm:p-5 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-3', className)}
      {...props}
    />
  )
}
