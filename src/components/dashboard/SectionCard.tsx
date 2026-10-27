import { ArrowUpRight, Church, Users } from 'lucide-react'
import { motion } from 'motion/react'
import type { Section } from '../../types'
import { Badge } from '../ui/badge'

export function SectionCard({
  section,
  onOpen,
}: {
  section: Section
  onOpen: (section: Section) => void
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(section)}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left cursor-pointer p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-district-500 group flex flex-col justify-between"
    >
      <div className="w-full">
        <div className="flex items-center justify-between mb-3.5">
          <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Church size={18} strokeWidth={2} />
          </div>
          <Badge variant="success" dot>
            Healthy
          </Badge>
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-0.5">
          {section.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal">
          {section.town}
        </p>

        <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-slate-100 dark:border-slate-800/80 mb-3.5 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 truncate">
            <Church size={13} className="text-slate-400 shrink-0" />
            <b className="font-semibold text-slate-900 dark:text-slate-100">{section.churches}</b> churches
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Users size={13} className="text-slate-400 shrink-0" />
            <b className="font-semibold text-slate-900 dark:text-slate-100">{section.users}</b> users
          </span>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-normal">Access health</span>
            <b className="font-mono font-medium text-slate-900 dark:text-slate-100">{section.health}%</b>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${section.health}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-district-600 dark:text-district-400 group-hover:text-district-700 dark:group-hover:text-district-300 pt-0.5">
        <span>Open section workspace</span>
        <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.button>
  )
}
