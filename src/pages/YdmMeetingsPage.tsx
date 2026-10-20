import { ExternalLink, RefreshCw, Trash2, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { UserRole } from '../types'
import { meetingNotificationsChanged } from '../components/layout/MeetingNotifications'

type Meeting = { id: number; title: string; meet_url: string; started_by: string; scheduled_for: string; attendee_emails: string[]; active: boolean; cancellation_reason: string | null; cancelled_by: string | null }
const earliestMeetingTime = () => {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
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
  const canSchedule = role === 'district' || role === 'district-ydm'

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/meetings', { credentials: 'include' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not load meeting notifications.')
      setMeetings(result.meetings || [])
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load meeting notifications.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    void load()
    fetch('/api/accounts?mode=profile', { credentials: 'include' }).then(response => response.ok ? response.json() : null).then(result => setProfileEmail(result?.profile?.email || '')).catch(() => undefined)
    const timer = window.setInterval(() => void load(), 30000)
    const clock = window.setInterval(() => setMinimumTime(earliestMeetingTime()), 30000)
    return () => { window.clearInterval(timer); window.clearInterval(clock) }
  }, [])

  const schedule = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !scheduledFor) { setError('Enter a meeting title and date and time.'); return }
    if (new Date(scheduledFor).getTime() <= Date.now()) { setMinimumTime(earliestMeetingTime()); setError('Choose a meeting date and time later than now.'); return }
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/meetings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, scheduledFor, attendeeEmails: profileEmail }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not schedule the meeting.')
      setScheduledFor('')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not schedule the meeting.') }
    finally { setSaving(false) }
  }

  const cancelMeeting = async (event: FormEvent) => {
    event.preventDefault()
    if (!cancelling || !reason.trim()) return
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/meetings', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cancelling.id, reason: reason.trim() }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not cancel the meeting.')
      setCancelling(null); setReason('')
      await load()
      window.dispatchEvent(new Event(meetingNotificationsChanged))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not cancel the meeting.') }
    finally { setSaving(false) }
  }

  return <section className="ydm-meetings">
    <div className="page-heading"><div><span className="eyebrow">District-wide notification</span><h1>YDM meetings</h1><p className="muted">Every signed-in role receives the schedule and join link automatically.</p></div><button className="subtle" onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} />{loading ? 'Refreshing…' : 'Refresh'}</button></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {canSchedule && <form className="panel meeting-start-form" onSubmit={schedule}><div><h2>Schedule a YDM meeting</h2><p className="muted">Your saved profile email is included automatically. No link or attendee list is required.</p></div><label>Meeting title<input value={title} onChange={event => setTitle(event.target.value)} required /></label><label>Date and time<input type="datetime-local" min={minimumTime} value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} required /></label><button className="primary" disabled={saving}><Video size={15}/>{saving ? 'Scheduling…' : 'Schedule and notify everyone'}</button></form>}
    <div className="meeting-list panel"><h2>Meeting notifications</h2><div className="meeting-list-items" role="region" aria-label="Meeting notifications list" tabIndex={0}>{loading && !meetings.length ? <p className="muted">Loading meeting notifications…</p> : meetings.length ? meetings.map(meeting => <article className={`meeting-card${meeting.active ? '' : ' meeting-card-cancelled'}`} key={meeting.id}><div className="meeting-card-content"><div className="meeting-icon"><Video size={18}/></div><div><h3>{meeting.title}</h3><p>{new Date(meeting.scheduled_for).toLocaleString('en-IN')} · Added by {meeting.started_by}</p>{meeting.active ? meeting.attendee_emails.length > 0 && <p>{meeting.attendee_emails.length} profile email{meeting.attendee_emails.length === 1 ? '' : 's'} included automatically</p> : <p className="meeting-cancel-notice"><strong>Cancelled by {meeting.cancelled_by}</strong> · Reason: {meeting.cancellation_reason}</p>}</div></div>{meeting.active && <div className="meeting-actions"><a className="primary" href={meeting.meet_url} target="_blank" rel="noreferrer">Open Google Meet <ExternalLink size={14}/></a>{canSchedule && <button className="subtle meeting-delete" type="button" onClick={() => { setCancelling(meeting); setReason(''); setError('') }}><Trash2 size={15}/> Delete</button>}</div>}</article>) : <p className="muted">No scheduled YDM meeting is available.</p>}</div></div>
    {cancelling && <div className="meeting-dialog-backdrop"><form className="panel meeting-dialog" onSubmit={cancelMeeting} role="dialog" aria-modal="true" aria-labelledby="cancel-meeting-title"><h2 id="cancel-meeting-title">Cancel {cancelling.title}?</h2><p className="muted">The reason will appear in meeting notifications for all signed-in users.</p><label>Meeting cancellation reason<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} required autoFocus rows={4} /></label><div className="meeting-dialog-actions"><button type="button" className="subtle" onClick={() => setCancelling(null)} disabled={saving}>Keep meeting</button><button type="submit" className="primary" disabled={saving || !reason.trim()}>{saving ? 'Cancelling…' : 'Cancel and notify everyone'}</button></div></form></div>}
  </section>
}
