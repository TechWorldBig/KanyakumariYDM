import { useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Church,
  Compass,
  FileQuestion,
  FileText,
  GraduationCap,
  Home,
  MessageCircle,
  Search,
  UsersRound,
} from 'lucide-react'
import type { Page } from '../types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

interface NotFoundPageProps {
  onNavigate: (page: Page) => void
  currentPath?: string
}

export function NotFoundPage({ onNavigate, currentPath }: NotFoundPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const displayPath = currentPath || window.location.hash || window.location.pathname || 'unknown'

  const navigationSuggestions: {
    page: Page
    title: string
    description: string
    icon: typeof Church
  }[] = [
    {
      page: 'Overview',
      title: 'District Overview',
      description: 'Central dashboard, regional sections & integrity scores.',
      icon: Home,
    },
    {
      page: 'Churches',
      title: 'Churches Directory',
      description: 'Search local congregations, pastoral care & administration.',
      icon: Church,
    },
    {
      page: 'YDM meetings',
      title: 'YDM Gatherings & Meetings',
      description: 'Scheduled conferences, Google Meet calls & MOM records.',
      icon: CalendarCheck,
    },
    {
      page: 'Reports',
      title: 'Executive Reports',
      description: 'Regional governance statistics & certified PDF downloads.',
      icon: FileText,
    },
    {
      page: 'Sunday school',
      title: 'Sunday School Census',
      description: 'Student enrollments, attendance & teacher registries.',
      icon: GraduationCap,
    },
    {
      page: 'Messages',
      title: 'Real-Time Messages',
      description: 'Direct and departmental communications channel.',
      icon: MessageCircle,
    },
  ]

  const filteredSuggestions = searchQuery.trim()
    ? navigationSuggestions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navigationSuggestions

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 404 Hero Illustration & Typography */}
      <div className="text-center space-y-3 max-w-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <FileQuestion size={14} />
          <span>404</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
          Page Not Found
        </h1>

        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          The requested page does not exist or has been moved.
        </p>

        {/* Display Requested Target */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-w-full overflow-hidden text-ellipsis">
          <span className="text-[var(--muted-foreground)]">Route:</span>
          <code className="text-rose-600 dark:text-rose-400 font-semibold truncate">{displayPath}</code>
        </div>
      </div>

      {/* Main Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => onNavigate('Overview')}
          className="gap-2 bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white shadow-sm h-10 px-5 text-xs font-bold"
        >
          <Home size={15} />
          <span>Return to Overview</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          className="gap-2 text-xs font-semibold h-10 px-4"
        >
          <ArrowLeft size={15} />
          <span>Go Back</span>
        </Button>
      </div>

      {/* Quick Route Search and Recommendations */}
      <div className="w-full space-y-4 pt-4 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
              Authorized Directory Navigation
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Jump directly to an active administrative module below:
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
            <Input
              type="search"
              placeholder="Filter valid workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Workspace Quick-Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSuggestions.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onNavigate(item.page)}
                className="group p-4 rounded-xl text-left bg-[var(--card)] hover:bg-[var(--accent)]/40 border border-[var(--border)] hover:border-[var(--color-district-400)] transition-all duration-200 shadow-xs flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-[var(--color-district-50)] dark:bg-[var(--color-district-950)] text-[var(--color-district-600)] dark:text-[var(--color-district-400)] shrink-0 transition-transform group-hover:scale-105">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--color-district-600)] dark:group-hover:text-[var(--color-district-400)]">
                    {item.title}
                  </strong>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

