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
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="section-card w-full text-left cursor-pointer p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_4px_20px_-4px_rgba(23,45,85,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)] hover:border-district-400 dark:hover:border-district-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-district-500 group flex flex-col justify-between"
    >
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="size-11 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Church size={20} strokeWidth={2} />
          </div>
          <Badge variant="success" dot>
            Healthy
          </Badge>
        </div>

        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight mb-1">
          {section.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium">
          {section.town}
        </p>

        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--line)] mb-4 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 truncate">
            <Church size={14} className="text-district-500 shrink-0" />
            <b className="font-semibold text-[var(--ink)]">{section.churches}</b> churches
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Users size={14} className="text-district-500 shrink-0" />
            <b className="font-semibold text-[var(--ink)]">{section.users}</b> users
          </span>
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Access health</span>
            <b className="font-mono font-bold text-[var(--ink)]">{section.health}%</b>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${section.health}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-district-600 dark:text-district-400 group-hover:text-district-700 dark:group-hover:text-district-300 pt-1">
        <span>Open section workspace</span>
        <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.button>
  )
}
