import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article data-slot="card" className={cn('rounded-panel border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-panel', className)} {...props}/>
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn('p-5', className)} {...props}/>
}
