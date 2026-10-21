import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-district-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-district-700 to-district-800 text-white shadow-sm hover:from-district-600 hover:to-district-700 dark:from-district-600 dark:to-district-700 dark:hover:from-district-500 dark:hover:to-district-600 border border-district-600/30',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60',
        outline:
          'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-district-50/70 hover:text-district-700 hover:border-district-200 dark:hover:bg-slate-800/60 dark:hover:text-district-300 dark:hover:border-slate-700 shadow-xs',
        ghost:
          'text-[var(--muted)] hover:bg-slate-100/80 hover:text-[var(--ink)] dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
        destructive:
          'bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-sm hover:from-rose-500 hover:to-rose-600 border border-rose-600/30',
        success:
          'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 border border-emerald-600/30',
        link:
          'text-district-600 underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
        sm: 'h-8 px-3 text-[11px] rounded-lg gap-1.5',
        lg: 'h-11 px-5 text-sm rounded-xl',
        icon: 'size-10 min-h-10 p-0 rounded-xl',
        'icon-sm': 'size-8 min-h-8 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  className,
  variant,
  size,
  type,
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export { buttonVariants }
