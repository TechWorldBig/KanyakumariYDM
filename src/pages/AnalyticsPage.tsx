import { useEffect, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Eye,
  Globe2,
  Laptop,
  Monitor,
  RefreshCw,
  Smartphone,
  Users,
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Metric } from '../components/shared/Metric'

type Session = {
  username: string
  role: string
  section_scope: string | null
  ip_reference: string
  user_agent: string
  last_seen: string
}

type Analytics = {
  onlineCount: number
  visitsToday: number
  uniqueVisitorsToday: number
  online: Session[]
  recentActivity: ActivityRecord[]
}

type ActivityRecord = {
  username: string
  role: string
  section_scope: string | null
  action: string
  occurred_at: string
}

export function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error()
      setData(await response.json())
      setError('')
    } catch {
      setError(
        'Live analytics are unavailable now'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            Telemetry
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            Usage & Sessions
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Metric
          icon={Activity}
          label="Online Now"
          value={String(data?.onlineCount ?? 0)}
          tone="green"
        />
        <Metric
          icon={Eye}
          label="Visits Today"
          value={String(data?.visitsToday ?? 0)}
          tone="blue"
        />
        <Metric
          icon={Globe2}
          label="Unique Visitors"
          value={String(data?.uniqueVisitorsToday ?? 0)}
          tone="orange"
        />
        <Metric
          icon={Users}
          label="Tracked Sessions"
          value={String(data?.online?.length ?? 0)}
          tone="violet"
        />
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Sessions
          </h2>
          <Badge variant="success" dot className="animate-pulse">
            Live
          </Badge>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {data?.online?.length ? (
            data.online.map((session) => (
              <div
                key={session.username + session.last_seen}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold text-xs shrink-0">
                    {session.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {session.username}
                    </strong>
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate block mt-0.5 font-medium">
                      {session.role === 'district'
                        ? 'District Super Admin'
                        : session.section_scope || 'Member'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-13 sm:pl-0 flex-wrap">
                  <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-semibold">
                    {session.ip_reference}…
                  </code>
                  <Badge variant="outline" className="text-xs gap-1 font-medium">
                    {getDeviceIcon(session.user_agent)}
                    {friendlyDevice(session.user_agent)}
                  </Badge>
                  <time className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {new Date(session.last_seen).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-700 dark:text-slate-300">
              <Activity size={28} className="mx-auto text-slate-500 mb-2" />
              <strong className="block font-semibold text-slate-900 dark:text-slate-100">No active sessions</strong>
              <span className="text-xs">Online administrators will appear here once authenticated.</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Authentication Activity
          </h2>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {data?.recentActivity?.length ? (
            data.recentActivity.map((item) => (
              <div
                key={item.username + item.occurred_at}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300 dark:border-slate-700">
                    {item.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.username}
                    </strong>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block font-medium">
                      {item.role === 'district'
                        ? 'District Super Admin'
                        : item.section_scope || 'User'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={item.action === 'Logged in' ? 'success' : 'outline'}
                    className="text-xs font-medium"
                  >
                    {item.action}
                  </Badge>
                  <time className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {relativeTime(item.occurred_at)}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-700 dark:text-slate-300">
              No recent authentication activity recorded.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function friendlyDevice(agent: string) {
  if (/mobile|android|iphone/i.test(agent)) return 'Mobile'
  if (/windows/i.test(agent)) return 'Windows PC'
  if (/macintosh/i.test(agent)) return 'macOS'
  return 'Web Browser'
}

function getDeviceIcon(agent: string) {
  if (/mobile|android|iphone/i.test(agent)) return <Smartphone size={12} />
  if (/windows/i.test(agent)) return <Monitor size={12} />
  if (/macintosh/i.test(agent)) return <Laptop size={12} />
  return <Globe2 size={12} />
}

function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  )
  if (minutes < 1) return 'This minute'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`
}
