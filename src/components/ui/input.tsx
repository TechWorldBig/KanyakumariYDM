import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--ink)] placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-district-500 focus:ring-4 focus:ring-district-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--surface-raised)] dark:border-[var(--line)]',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-district-500 focus:ring-4 focus:ring-district-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--surface-raised)] dark:border-[var(--line)]',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'flex h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-sm text-[var(--ink)] outline-none transition-all duration-150 focus:border-district-500 focus:ring-4 focus:ring-district-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--surface-raised)] dark:border-[var(--line)]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
