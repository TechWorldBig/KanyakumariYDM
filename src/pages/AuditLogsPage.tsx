import { ClipboardList, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { UserRole } from '../types'

type AuditEntry = { username: string; role: string; section_scope: string | null; action: string; occurred_at: string }
export function AuditLogsPage({ role }: { role: UserRole }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = () => { setLoading(true); setError(''); fetch('/api/audit', { credentials: 'include' }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load audit logs'); setEntries(result.entries || []) }).catch((reason) => setError(reason.message)).finally(() => setLoading(false)) }
  useEffect(load, [])
  return <section className="audit-page"><div className="page-heading"><div><span className="eyebrow">Security history</span><h1>Audit logs</h1><p className="muted">{role === 'district' ? 'All role activity across the district.' : 'Activity from your section only.'}</p></div><button className="subtle" onClick={load} disabled={loading}><RefreshCw size={14} />{loading ? 'Loading…' : 'Refresh'}</button></div>{error && <div className="form-error" role="alert">{error}</div>}<div className="audit-panel panel"><div className="audit-panel-head"><div><h2>Recent activity</h2><p>{entries.length} recorded events in your access scope</p></div><ClipboardList size={21} color="#2f67c9" /></div>{loading ? <div className="audit-empty">Loading audit history…</div> : entries.length ? <div className="audit-list">{entries.map((entry, index) => <div className="audit-row" key={`${entry.username}-${entry.occurred_at}-${index}`}><div className="audit-icon"><ShieldCheck size={15} /></div><div className="audit-copy"><strong>{entry.username}</strong><span>{entry.action} · {entry.role}{entry.section_scope ? ` · ${entry.section_scope}` : ''}</span></div><time dateTime={entry.occurred_at}>{new Date(entry.occurred_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>)}</div> : <div className="audit-empty">No activity has been recorded in this scope yet.</div>}</div></section>
}
