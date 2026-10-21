import { Calendar, ExternalLink, RefreshCw, Search, Trash2, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { canWrite } from '../domain/access'
import { meetingNotificationsChanged } from '../components/layout/MeetingNotifications'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input, Textarea } from '../components/ui/input'
import type { UserRole } from '../types'

type Meeting = {
  id: number
  title: string
  meet_url: string
  started_by: string
  scheduled_for: string
  attendee_emails: string[]
  active: boolean
  cancellation_reason: string | null
  cancelled_by: string | null
}

const earliestMeetingTime = () => {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

export function YdmMeetingsPage({ role }: { role: UserRole }) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [title, setTitle] = useState('District YDM meeting')
  const [scheduledFor, setScheduledFor] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState<Meeting | null>(null)
  const [reason, setReason] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [minimumTime, setMinimumTime] = useState(earliestMeetingTime)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all')

  const activeCount = useMemo(() => meetings.filter((m) => m.active).length, [meetings])
  const cancelledCount = useMemo(() => meetings.filter((m) => !m.active).length, [meetings])

  const filteredMeetings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return meetings.filter((m) => {
      if (statusFilter === 'active' && !m.active) return false
      if (statusFilter === 'cancelled' && m.active) return false
      if (!query) return true
      return (
        m.title.toLowerCase().includes(query) ||
        m.started_by.toLowerCase().includes(query) ||
        (m.attendee_emails &&
          m.attendee_emails.some((email) => email.toLowerCase().includes(query)))
      )
    })
  }, [meetings, statusFilter, searchQuery])

  const canSchedule =
    role === 'district' || role === 'district-ydm' || canWrite(role, 'YDM meetings')

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/meetings', { credentials: 'include' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok)
        throw new Error(result.error || 'Could not load meeting notifications.')
      setMeetings(result.meetings || [])
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load meeting notifications.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    fetch('/api/accounts?mode=profile', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setProfileEmail(result?.profile?.email || ''))
      .catch(() => undefined)
    const timer = window.setInterval(() => void load(), 30000)
    const clock = window.setInterval(
      () => setMinimumTime(earliestMeetingTime()),
      30000
    )
    return () => {
      window.clearInterval(timer)
      window.clearInterval(clock)
    }
  }, [])

  const schedule = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !scheduledFor) {
      setError('Enter a meeting title and date and time.')
      return
    }
    const scheduleDate = new Date(scheduledFor)
    if (scheduleDate.getTime() <= Date.now()) {
      setMinimumTime(earliestMeetingTime())
      setError('Choose a meeting date and time later than now.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          scheduledFor: scheduleDate.toISOString(),
          attendeeEmails: profileEmail,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok)
        throw new Error(result.error || 'Could not schedule the meeting.')
      setScheduledFor('')
      await load()
      window.dispatchEvent(new Event(meetingNotificationsChanged))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not schedule the meeting.'
      )
    } finally {
      setSaving(false)
    }
  }

  const cancelMeeting = async (event: FormEvent) => {
    event.preventDefault()
    if (!cancelling || !reason.trim()) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/meetings', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cancelling.id, reason: reason.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok)
        throw new Error(result.error || 'Could not cancel the meeting.')
      setCancelling(null)
      setReason('')
      await load()
      window.dispatchEvent(new Event(meetingNotificationsChanged))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not cancel the meeting.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            District-wide notification
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            YDM Video Meetings
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Every signed-in role receives scheduled meeting updates and Google Meet join links automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
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

      {canSchedule && (
        <Card className="p-6 border border-[var(--border)] shadow-xs">
          <form onSubmit={schedule} noValidate className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                Schedule a YDM Meeting
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Your saved profile email is linked automatically. A secure Google Meet link is provisioned on schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)]">
                  Meeting Title
                </label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Monthly YDM Leadership Sync"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)]">
                  Date and Time
                </label>
                <Input
                  type="datetime-local"
                  min={minimumTime}
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                <Video size={15} />
                <span>{saving ? 'Scheduling…' : 'Schedule & Notify Everyone'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden border border-[var(--border)] shadow-xs flex flex-col">
        {/* Sticky Header with Search and Quick Filters */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-10 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Scheduled Meetings
                </h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Current active and past district video conferences.
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Badge variant="success" className="text-xs font-semibold">
                {activeCount} Active
              </Badge>
              <Badge variant="blue" className="text-xs font-semibold">
                {meetings.length} Total
              </Badge>
            </div>
          </div>

          {meetings.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-[var(--border)]/70">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter meetings by title or host..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] outline-none focus:border-[var(--color-district-500)] focus:ring-1 focus:ring-[var(--color-district-500)]"
                  aria-label="Filter meetings"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-district-700 text-white dark:bg-district-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({meetings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    statusFilter === 'cancelled'
                      ? 'bg-rose-600 text-white dark:bg-rose-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Cancelled ({cancelledCount})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Scrollable Meeting Events Container */}
        <div
          className="divide-y divide-[var(--border)] max-h-[520px] overflow-y-auto"
          role="region"
          aria-label="Scheduled meetings list"
          tabIndex={0}
        >
          {loading && !meetings.length ? (
            <div className="py-16 text-center text-xs text-[var(--muted-foreground)]">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-50" />
              Loading meeting notifications…
            </div>
          ) : filteredMeetings.length ? (
            filteredMeetings.map((meeting) => (
              <article
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  meeting.active ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-slate-50/80 dark:bg-slate-900/60 opacity-90'
                }`}
                key={meeting.id}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      meeting.active
                        ? 'bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)]'
                        : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <Video size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">
                        {meeting.title}
                      </h3>
                      <Badge
                        variant={meeting.active ? 'success' : 'destructive'}
                        className="text-[10px] py-0"
                      >
                        {meeting.active ? 'Active' : 'Cancelled'}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {new Date(meeting.scheduled_for).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      · Initiated by{' '}
                      <strong className="text-[var(--foreground)] font-medium">
                        {meeting.started_by}
                      </strong>
                    </p>

                    {meeting.active ? (
                      meeting.attendee_emails.length > 0 && (
                        <p className="text-[11px] text-[var(--color-district-600)] dark:text-[var(--color-district-400)] mt-0.5">
                          {meeting.attendee_emails.length} profile email
                          {meeting.attendee_emails.length === 1 ? '' : 's'} notified
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        <strong>Cancelled by {meeting.cancelled_by}:</strong>{' '}
                        {meeting.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>

                {meeting.active && (
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
                    <a
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:opacity-95 transition-all"
                      href={meeting.meet_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>Join Meet</span>
                      <ExternalLink size={13} />
                    </a>
                    {canSchedule && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8"
                        onClick={() => {
                          setCancelling(meeting)
                          setReason('')
                          setError('')
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Cancel</span>
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))
          ) : meetings.length ? (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
              No meetings found matching your filter.
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="block mx-auto mt-2 text-xs font-medium text-[var(--color-district-600)] dark:text-[var(--color-district-400)] hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="py-14 text-center text-sm text-[var(--muted-foreground)]">
              <Video size={28} className="mx-auto mb-2 opacity-40" />
              <strong className="block font-semibold text-[var(--foreground)]">
                No scheduled meetings
              </strong>
              <span className="text-xs">
                Schedule a meeting above to notify district leaders with a Google Meet link.
              </span>
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => {
          if (!open && !saving) setCancelling(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {cancelling?.title}?</DialogTitle>
            <DialogDescription>
              The cancellation reason will be sent in notifications to all signed-in users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={cancelMeeting} noValidate className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Cancellation Reason
              </label>
              <Textarea
                className="resize-none"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                required
                autoFocus
                rows={3}
                placeholder="State why this meeting is being cancelled..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelling(null)}
                disabled={saving}
              >
                Keep Meeting
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={saving || !reason.trim()}
              >
                {saving ? 'Cancelling…' : 'Cancel & Notify Everyone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
