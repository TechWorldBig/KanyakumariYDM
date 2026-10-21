import { Bell, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export const meetingNotificationsChanged = 'meeting-notifications-changed'
type Notification = { id: string; type: 'meeting' | 'group'; title: string; scheduled_for: string | null; detail: string | null; occurred_at: string; actor: string; read_at: string | null }

export function MeetingNotifications({ onOpenMeeting }: { onOpenMeeting: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => { if (open && popupRef.current && !popupRef.current.contains(event.target as Node)) setOpen(false) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape) }
  }, [open])

  const load = async (markRead = false) => {
    try {
      const response = await fetch('/api/meetings?mode=notifications', { credentials: 'include' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not load notifications.')
      const items: Notification[] = result.notifications || []
      if (markRead && items.some(item => !item.read_at)) {
        const readResponse = await fetch('/api/meetings?mode=notification-read-all', { method: 'POST', credentials: 'include' })
        if (!readResponse.ok) throw new Error('Could not mark notifications as read.')
        const readAt = new Date().toISOString()
        setNotifications(items.map(item => ({ ...item, read_at: item.read_at || readAt })))
      } else setNotifications(items)
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load notifications.') }
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 30000)
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    window.addEventListener(meetingNotificationsChanged, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener(meetingNotificationsChanged, refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])

  const view = async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        const response = await fetch('/api/meetings?mode=notification-read', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notification.type === 'group' ? { type: 'group', notificationId: notification.id } : { meetingId: notification.id }) })
        if (!response.ok) throw new Error('Could not mark notification as read.')
        setNotifications(current => current.map(item => item.id === notification.id && item.type === notification.type ? { ...item, read_at: new Date().toISOString() } : item))
      } catch { setError('Could not mark notification as read. Please try again.') }
    }
    setOpen(false)
    if (notification.type === 'meeting') onOpenMeeting()
  }

  const unread = notifications.filter(item => !item.read_at).length
  return <div className="notification-wrap" ref={popupRef}>
    <button className="icon-btn notification-trigger" type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => { setOpen(value => !value); if (!open) void load(true) }}><Bell size={18} />{unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <div className="notification-menu" role="dialog" aria-label="Notifications"><div className="notification-menu-head"><strong>Notifications</strong><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={16}/></button></div>{error && <p className="notification-error" role="alert">{error}</p>}<div className="notification-items">{notifications.length ? notifications.map(item => <button type="button" className={`notification-item${item.read_at ? '' : ' unread'}`} key={`${item.type}:${item.id}`} onClick={() => void view(item)}><strong>{item.type === 'group' ? 'Group deleted' : 'Meeting cancelled'}: {item.title}</strong><span>{item.type === 'group' ? `Deleted by ${item.actor}` : `${new Date(item.scheduled_for!).toLocaleString('en-IN')} · Cancelled by ${item.actor}`}</span><span>{item.type === 'group' ? 'This group and its messages are no longer available.' : `Reason: ${item.detail}`}</span><small>{new Date(item.occurred_at).toLocaleString('en-IN')}{item.type === 'meeting' ? ' · View meeting' : ''}</small></button>) : <p className="notification-empty">No notifications.</p>}</div></div>}
  </div>
}
