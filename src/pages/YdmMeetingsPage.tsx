import {
  Calendar,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  ListOrdered,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { canWrite } from '../domain/access'
import {
  meetingNotificationsChanged,
  openMeetingMOMEvent,
} from '../components/layout/MeetingNotifications'
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
import type { Meeting, MeetingMOM } from '../domain/meetings'
import {
  getLocalMOMStore,
  isMeetingInFuture,
  isMeetingInProgress,
  isMeetingOrganiser,
  isMeetingOver,
  parseMeetingDate,
  saveLocalMOM,
} from '../domain/meetings'
import { MomViewerDialog } from '../components/meetings/MomViewerDialog'
import { MomEditorDialog } from '../components/meetings/MomEditorDialog'

const earliestMeetingTime = () => {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

const LOCAL_MEETINGS_KEY = 'district_ydm_meetings_backup_v2'

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')

  // User identity
  const [currentUsername, setCurrentUsername] = useState('admin')

  // MOM Viewer & Editor dialog states
  const [viewingMom, setViewingMom] = useState<MeetingMOM | null>(null)
  const [viewingMomMeeting, setViewingMomMeeting] = useState<Meeting | null>(null)
  const [editingMomMeeting, setEditingMomMeeting] = useState<Meeting | null>(null)

  // Quick action feedback toast
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Lifecycle helper:
  // 1. 'cancelled': has cancellation reason
  // 2. 'mom_published': mom_published is true and has mom details
  // 3. 'active': meeting scheduled date and time is in the future (> now) OR in progress (within 60m of scheduled time)
  // 4. 'completed': meeting scheduled date and time has passed and not cancelled, awaiting MOM
  const getMeetingState = (m: Meeting): 'active' | 'completed' | 'mom_published' | 'cancelled' => {
    if (m.cancellation_reason || m.cancelled_at) return 'cancelled'
    if (m.mom_published && m.mom) return 'mom_published'
    if (isMeetingInFuture(m.scheduled_for) || isMeetingInProgress(m.scheduled_for)) return 'active'
    return 'completed'
  }

  // Calculate status counts
  const activeCount = useMemo(
    () => meetings.filter((m) => getMeetingState(m) === 'active').length,
    [meetings]
  )
  const completedCount = useMemo(
    () => meetings.filter((m) => getMeetingState(m) === 'completed' || getMeetingState(m) === 'mom_published').length,
    [meetings]
  )
  const cancelledCount = useMemo(
    () => meetings.filter((m) => getMeetingState(m) === 'cancelled').length,
    [meetings]
  )

  const filteredMeetings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return meetings.filter((m) => {
      const state = getMeetingState(m)
      if (statusFilter === 'active' && state !== 'active') return false
      if (statusFilter === 'completed' && state !== 'completed' && state !== 'mom_published') return false
      if (statusFilter === 'cancelled' && state !== 'cancelled') return false

      if (!query) return true
      return (
        m.title.toLowerCase().includes(query) ||
        m.started_by.toLowerCase().includes(query) ||
        (m.mom?.title && m.mom.title.toLowerCase().includes(query)) ||
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

      const localMomStore = getLocalMOMStore()
      const serverMeetings: Meeting[] = result.meetings || []

      // Merge any local MOM store entries & ensure future meetings stay active
      const now = Date.now()
      const merged: Meeting[] = serverMeetings.map((m) => {
        const localMom = localMomStore[m.id]
        if (localMom && !m.mom_published) {
          return {
            ...m,
            mom: localMom,
            mom_published: true,
            status: 'completed',
            active: false,
          }
        }
        // Future or live in-progress meeting without published MOM must be active
        if (!m.cancellation_reason && !m.mom_published && (isMeetingInFuture(m.scheduled_for) || isMeetingInProgress(m.scheduled_for))) {
          return {
            ...m,
            active: true,
            status: 'active' as const,
            completed_at: null,
            completed_by: null,
          }
        }
        return m
      })

      setMeetings(merged)
      try {
        localStorage.setItem(LOCAL_MEETINGS_KEY, JSON.stringify(merged))
      } catch {
        // quota
      }
      setError('')
    } catch {
      // Fallback to local storage if API is offline
      try {
        const backupRaw = localStorage.getItem(LOCAL_MEETINGS_KEY)
        if (backupRaw) {
          const backupMeetings: Meeting[] = JSON.parse(backupRaw)
          const localMomStore = getLocalMOMStore()
          const now = Date.now()
          const merged: Meeting[] = backupMeetings.map((m) => {
            if (localMomStore[m.id]) {
              return { ...m, mom: localMomStore[m.id], mom_published: true, status: 'completed' as const }
            }
            if (!m.cancellation_reason && new Date(m.scheduled_for).getTime() > now) {
              return { ...m, active: true, status: 'active' as const, completed_at: null }
            }
            return m
          })
          setMeetings(merged)
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }

  // Load session username
  useEffect(() => {
    fetch('/api/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((s) => {
        if (s?.username) setCurrentUsername(s.username)
      })
      .catch(() => undefined)
  }, [])

  // Listen for open-meeting-mom event from notifications bell
  useEffect(() => {
    const handleOpenMOM = (event: Event) => {
      const custom = event as CustomEvent<{ meetingId?: number }>
      const targetId = custom.detail?.meetingId
      if (targetId) {
        const found = meetings.find((m) => m.id === targetId)
        if (found?.mom) {
          setViewingMom(found.mom)
          setViewingMomMeeting(found)
        } else if (found) {
          // If not published yet and organiser, open editor
          if (isMeetingOrganiser(found, currentUsername, role)) {
            setEditingMomMeeting(found)
          }
        }
      }
    }

    window.addEventListener(openMeetingMOMEvent, handleOpenMOM)
    return () => window.removeEventListener(openMeetingMOMEvent, handleOpenMOM)
  }, [meetings, currentUsername, role])

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
      showToast(`Meeting "${title.trim()}" scheduled and notification sent to all roles!`)
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
      showToast('Meeting cancelled and cancellation alert sent.')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not cancel the meeting.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Publish MOM action (ONLY for the meeting organiser)
  const handlePublishMOM = async (momData: MeetingMOM) => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/meetings?mode=publish-mom', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: momData.meetingId,
          mom: momData,
        }),
      })

      // Always cache in local store for seamless availability
      saveLocalMOM(momData.meetingId, momData)

      if (!response.ok) {
        // If remote API is not active, apply local update directly
        const result = await response.json().catch(() => ({}))
        console.warn('API sync notice:', result.error || 'Saved locally')
      }

      // Update state locally
      setMeetings((curr) =>
        curr.map((m) =>
          m.id === momData.meetingId
            ? {
                ...m,
                mom: momData,
                mom_published: true,
                status: 'completed',
                active: false,
                completed_at: new Date().toISOString(),
                completed_by: currentUsername,
              }
            : m
        )
      )

      // Notify all tabs and header notification bell
      window.dispatchEvent(new Event(meetingNotificationsChanged))

      showToast(`MOM for "${momData.title}" published! All roles have been notified.`)

      // Open the viewer immediately for the organiser to inspect
      setViewingMom(momData)
      setViewingMomMeeting(meetings.find((m) => m.id === momData.meetingId) || null)
    } catch (cause) {
      // In local mode, still save locally
      saveLocalMOM(momData.meetingId, momData)
      setMeetings((curr) =>
        curr.map((m) =>
          m.id === momData.meetingId
            ? {
                ...m,
                mom: momData,
                mom_published: true,
                status: 'completed',
                active: false,
              }
            : m
        )
      )
      window.dispatchEvent(new Event(meetingNotificationsChanged))
      showToast(`MOM saved locally! All roles notified.`)
    } finally {
      setSaving(false)
      setEditingMomMeeting(null)
    }
  }

  // Conclude / Mark Meeting Over action for organiser
  const handleConcludeMeeting = async (meeting: Meeting) => {
    try {
      await fetch('/api/meetings?mode=complete-meeting', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      }).catch(() => undefined)

      setMeetings((curr) =>
        curr.map((m) =>
          m.id === meeting.id
            ? { ...m, active: false, status: 'completed', completed_at: new Date().toISOString() }
            : m
        )
      )

      // Immediately open MOM editor for the organiser
      setEditingMomMeeting({
        ...meeting,
        active: false,
        status: 'completed',
      })
    } catch {
      // Open editor directly
      setEditingMomMeeting(meeting)
    }
  }

  return (
    <section className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="status"
        >
          <FileCheck2 size={18} className="text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-200 hover:text-white ml-2 p-0.5"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            District-wide notification & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            YDM Video Meetings & MOM
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Schedule district video conferences, review attendance, and publish official Minutes of Meeting (MOM).
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

      {/* Schedule Form (Visible to authorised roles) */}
      {canSchedule && (
        <Card className="p-6 border border-[var(--border)] shadow-xs">
          <form onSubmit={schedule} noValidate className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                Schedule a YDM Meeting
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Every signed-in leader receives scheduled updates. When concluded, the organiser can record member attendance and publish the MOM.
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

      {/* Scheduled Meetings List Card */}
      <Card className="p-0 overflow-hidden border border-[var(--border)] shadow-xs flex flex-col">
        {/* Sticky Header with Search and Quick Status Filters */}
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
                {completedCount > 0
                  ? 'Current active, past concluded conferences, and published Minutes of Meeting.'
                  : 'Current active and past district video conferences.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
              <Badge variant="success" className="text-xs font-semibold">
                {activeCount} Active
              </Badge>
              {completedCount > 0 && (
                <Badge variant="violet" className="text-xs font-semibold">
                  {completedCount} Completed / MOM
                </Badge>
              )}
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
                  placeholder={
                    completedCount > 0
                      ? 'Filter meetings by title, host, or MOM topic...'
                      : 'Filter meetings by title or host...'
                  }
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
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-[var(--color-district-600)] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({meetings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Active ({activeCount})
                </button>
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === 'completed'
                        ? 'bg-purple-600 text-white dark:bg-purple-700 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Completed / MOM ({completedCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'cancelled'
                      ? 'bg-rose-600 text-white dark:bg-rose-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Cancelled ({cancelledCount})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Meeting Cards Container */}
        <div
          className="divide-y divide-[var(--border)] max-h-[560px] overflow-y-auto"
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
            filteredMeetings.map((meeting) => {
              const state = getMeetingState(meeting)
              const isCancelled = state === 'cancelled'
              const hasMom = state === 'mom_published'
              const isActive = state === 'active'
              const isCompletedAwaitingMom = state === 'completed'
              const isOrganiser = isMeetingOrganiser(meeting, currentUsername, role)

              return (
                <article
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors ${
                    hasMom
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40'
                      : isActive
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      : isCompletedAwaitingMom
                      ? 'bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/40'
                      : 'bg-slate-50/80 dark:bg-slate-900/60 opacity-90'
                  }`}
                  key={meeting.id}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        hasMom
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : isCancelled
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : isActive
                          ? 'bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)]'
                          : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {hasMom ? <FileCheck2 size={19} /> : <Video size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">
                          {meeting.title}
                        </h3>

                        {/* Status Badges */}
                        {isCancelled ? (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Cancelled
                          </Badge>
                        ) : hasMom ? (
                          <Badge variant="success" className="text-[10px] py-0 gap-1">
                            <FileCheck2 size={10} />
                            <span>MOM Published</span>
                          </Badge>
                        ) : isCompletedAwaitingMom ? (
                          <Badge variant="violet" className="text-[10px] py-0">
                            Completed · Awaiting MOM
                          </Badge>
                        ) : isMeetingInProgress(meeting.scheduled_for) ? (
                          <Badge variant="success" className="text-[10px] py-0 gap-1 bg-emerald-600 text-white animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white inline-block"></span>
                            Live Now
                          </Badge>
                        ) : (
                          <Badge variant="blue" className="text-[10px] py-0">
                            Upcoming
                          </Badge>
                        )}
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

                      {/* Attendee / Cancellation Info */}
                      {isCancelled ? (
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                          <strong>Cancelled by {meeting.cancelled_by}:</strong>{' '}
                          {meeting.cancellation_reason}
                        </p>
                      ) : hasMom ? (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <UserCheck size={12} />
                            <span>
                              {meeting.mom?.attendance.filter((a) => a.status === 'present').length || 0} Members Present
                            </span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <ListOrdered size={12} />
                            <span>{meeting.mom?.discussionPoints.length || 0} Points Discussed</span>
                          </span>
                        </div>
                      ) : isActive ? (
                        meeting.attendee_emails.length > 0 && (
                          <p className="text-[11px] text-[var(--color-district-600)] dark:text-[var(--color-district-400)] mt-0.5">
                            {meeting.attendee_emails.length} profile email
                            {meeting.attendee_emails.length === 1 ? '' : 's'} notified
                          </p>
                        )
                      ) : (
                        <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5 font-medium">
                          Meeting has concluded. {isOrganiser ? 'Click below to tell and publish the MOM.' : `Awaiting MOM publication by organiser (${meeting.started_by}).`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Column (Clean Responsive on Mobile & Laptop) */}
                  {!isCancelled && (
                    <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2 shrink-0 flex-wrap pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                      {/* MOM View button: Available to ALL ROLES when MOM is published! */}
                      {hasMom && meeting.mom && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                          onClick={() => {
                            setViewingMom(meeting.mom!)
                            setViewingMomMeeting(meeting)
                          }}
                        >
                          <FileText size={13} />
                          <span>View MOM</span>
                        </Button>
                      )}

                      {/* If MOM already exists and current user is organiser: Can edit MOM */}
                      {hasMom && isOrganiser && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          onClick={() => setEditingMomMeeting(meeting)}
                          title="Edit minutes of meeting"
                        >
                          <span>Edit MOM</span>
                        </Button>
                      )}

                      {/* If meeting is Active (Future / Current): Join Meet button for everyone */}
                      {isActive && (
                        <a
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:opacity-95 transition-all"
                          href={meeting.meet_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{isMeetingInProgress(meeting.scheduled_for) ? 'Join Live Meet' : 'Join Meet'}</span>
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {/* If meeting is Over / Completed without MOM: Organiser button to Record MOM */}
                      {isCompletedAwaitingMom && isOrganiser && (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          onClick={() => setEditingMomMeeting(meeting)}
                        >
                          <FileText size={13} />
                          <span>Tell MOM (Record Minutes)</span>
                        </Button>
                      )}

                      {/* If meeting is Active: Cancel button for organiser / admin */}
                      {isActive && canSchedule && (
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
              )
            })
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

      {/* Cancel Confirmation Dialog */}
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

      {/* MOM Viewer Dialog (Explains the MOM: title, member attendance, and discussed points) */}
      {viewingMom && (
        <MomViewerDialog
          mom={viewingMom}
          canEdit={Boolean(
            viewingMomMeeting && isMeetingOrganiser(viewingMomMeeting, currentUsername, role)
          )}
          onClose={() => {
            setViewingMom(null)
            setViewingMomMeeting(null)
          }}
          onEdit={() => {
            if (viewingMomMeeting) {
              setEditingMomMeeting(viewingMomMeeting)
              setViewingMom(null)
            }
          }}
        />
      )}

      {/* MOM Editor Dialog (ONLY for the Organiser to record and publish) */}
      {editingMomMeeting && (
        <MomEditorDialog
          meeting={editingMomMeeting}
          currentUsername={currentUsername}
          currentRole={role}
          onClose={() => setEditingMomMeeting(null)}
          onPublish={handlePublishMOM}
        />
      )}
    </section>
  )
}
