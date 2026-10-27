import { ClipboardList, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { UserRole } from '../types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

type AuditEntry = {
  username: string
  role: string
  section_scope: string | null
  action: string
  occurred_at: string
}

export function AuditLogsPage({ role }: { role: UserRole }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetch('/api/audit', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load audit logs')
        setEntries(result.entries || [])
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Could not load audit logs')
      )
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filteredEntries = entries.filter(
    (e) =>
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase()) ||
      (e.section_scope && e.section_scope.toLowerCase().includes(search.toLowerCase()))
  )

  const latest = entries[0]?.occurred_at

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            Audit Logs
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {error && (
        <div
          className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Events</span>
          <strong className="block text-2xl font-bold font-mono text-slate-900 dark:text-slate-50 mt-1">
            {entries.length}
          </strong>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scope</span>
          <strong className="block text-2xl font-bold text-district-600 dark:text-district-400 mt-1">
            {role === 'district' ? 'District-wide' : 'Section Only'}
          </strong>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Latest Activity</span>
          <strong className="block text-xl font-bold font-mono text-slate-900 dark:text-slate-50 mt-1 truncate">
            {latest
              ? new Date(latest).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '—'}
          </strong>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-district-600 dark:text-district-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Activity History
            </h2>
            <Badge variant="blue" className="ml-1 text-xs font-semibold">
              <ShieldCheck size={11} className="mr-1" />
              {role === 'district' ? 'All Activity' : 'Section Scope'}
            </Badge>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter actions or users..."
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-600 dark:text-slate-400">
            <div className="animate-spin h-6 w-6 border-2 border-district-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading audit history from secure log store…
          </div>
        ) : filteredEntries.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800" role="feed" aria-label="Audit activity timeline">
            {filteredEntries.map((entry, index) => (
              <article
                key={`${entry.username}-${entry.occurred_at}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs text-slate-500 font-semibold w-6 text-right shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {entry.action}
                    </strong>
                    <span className="block text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.username}</span>
                      {' · '}
                      <span>{entry.role}</span>
                      {entry.section_scope && <span> · {entry.section_scope}</span>}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 pl-9 sm:pl-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {new Date(entry.occurred_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <time className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold" dateTime={entry.occurred_at}>
                    {new Date(entry.occurred_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-600 dark:text-slate-400">
            No audit records found matching your filter criteria.
          </div>
        )}
      </Card>
    </div>
  )
}
