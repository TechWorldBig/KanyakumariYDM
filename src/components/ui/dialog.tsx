import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ children, className, ...props }: DialogPrimitive.DialogContentProps & { children: ReactNode }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 data-[state=open]:animate-in data-[state=closed]:animate-out"/>
    <DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 grid w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-panel border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out sm:w-full', className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
}

export function DialogClose({ className, ...props }: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close className={cn('absolute right-4 top-4 rounded-md p-1 text-[var(--muted)] hover:bg-district-50 hover:text-district-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-district-500', className)} {...props}><X size={18}/><span className="sr-only">Close</span></DialogPrimitive.Close>
}

export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
