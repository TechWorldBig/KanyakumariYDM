import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-[background-color,border-color,box-shadow,color,transform] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-district-100 disabled:pointer-events-none disabled:opacity-50 active:translate-y-0',
  {
    variants: {
      variant: {
        default: 'bg-district-700 text-white shadow-sm hover:-translate-y-px hover:bg-district-500',
        outline: 'border border-[var(--line)] bg-[var(--surface)] text-[#395b91] hover:-translate-y-px hover:bg-district-50',
        ghost: 'text-[var(--muted)] hover:bg-district-50 hover:text-district-700',
        destructive: 'bg-danger-500 text-white shadow-sm hover:-translate-y-px hover:bg-[#963f39]',
      },
      size: {
        default: 'h-10',
        sm: 'h-9 min-h-9 px-3 text-[11px]',
        icon: 'size-10 min-h-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, type, onClick, ...props }: ButtonProps) {
  return <button data-slot="button" type={type} onClick={onClick} className={cn(buttonVariants({ variant, size }), className)} {...props}/>
}

export { buttonVariants }
