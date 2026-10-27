import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-district-500/20 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-district-600 text-white shadow-xs hover:bg-district-700 active:bg-district-800 dark:bg-district-600 dark:hover:bg-district-500 border border-district-700/30',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700',
        outline:
          'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white shadow-xs',
        ghost:
          'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 font-medium',
        destructive:
          'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800 border border-rose-700/30',
        success:
          'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-700/30',
        link:
          'text-district-600 dark:text-district-400 underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        xs: 'h-7 px-2.5 text-[11px] rounded-md gap-1.5',
        sm: 'h-8 px-3 text-[11px] rounded-md gap-1.5',
        lg: 'h-10 px-4 text-sm rounded-lg',
        icon: 'size-9 min-h-9 p-0 rounded-lg',
        'icon-sm': 'size-7 min-h-7 p-0 rounded-md',
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
  asChild?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  className,
  variant,
  size,
  type,
  asChild = false,
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin size-4 shrink-0" />
          {children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </Comp>
  )
}
