import { useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, MapPin, Pencil, Save, Users } from 'lucide-react'
import { churches, ChurchRecord } from '../../data/churches'
import type { Section } from '../../types'

type Credentials = { username: string; password: string }
const credentialsKey = 'district_church_credentials'

function readCredentials(church: ChurchRecord): Credentials {
  try {
    const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<string, { username?: string }>
    return { username: saved[church.id]?.username || church.username, password: '' }
  } catch { return { username: church.username, password: '' } }
}

function saveCredentials(churchId: string, credentials: Credentials) {
  const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<string, { username?: string }>
  localStorage.setItem(credentialsKey, JSON.stringify({ ...saved, [churchId]: { username: credentials.username } }))
}

export function SectionDialog({ section, onClose, isDistrict, onRemove }: { section: Section; onClose: () => void; isDistrict: boolean; onRemove: () => void }) {
  const [church, setChurch] = useState<ChurchRecord | null>(null)
  const sectionChurches = churches.filter((item) => item.section === section.name)
  if (church) return <ChurchDialog church={church} onBack={() => setChurch(null)} canManageCredentials scopeLabel={isDistrict ? 'District Super Admin' : `${section.name} Super Admin`} />
  return <div className="section-modal-backdrop section-page-shell" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="section-modal section-detail-modal"><div className="section-page-toolbar"><button className="church-back" onClick={onClose}><ArrowLeft size={15} />Back to dashboard</button><button className="section-modal-close" onClick={onClose} aria-label="Close">×</button></div><span className="eyebrow">Section workspace</span><h2>{section.name}</h2><p className="modal-town">{section.town} · {sectionChurches.length} churches in this MVP directory</p><div className="modal-admin"><div className="avatar">SA</div><div><strong>{section.admin}</strong><span>Section super admin · Full read, write, edit and manage access</span></div></div><div className="church-list-heading"><h3>Churches in {section.name}</h3><span>{sectionChurches.length} records</span></div><div className="church-list">{sectionChurches.map((item) => <button className="church-list-row" key={item.id} onClick={() => setChurch(item)}><div className="church-thumb"><img src={item.photo} alt="" /></div><div><strong>{item.name}</strong><span><MapPin size={12} />{item.distanceKm === 0 ? 'Nagercoil reference point' : `${item.distanceKm} km from Nagercoil`} · {item.address}</span></div><ArrowLeft className="church-open-icon" size={16} /></button>)}</div>{isDistrict && !sectionChurches.length && <button className="danger-outline" onClick={onRemove}>Remove section admin</button>}</div></div>
}

export function ChurchDialog({ church, onBack, canManageCredentials, scopeLabel }: { church: ChurchRecord; onBack: () => void; canManageCredentials: boolean; scopeLabel: string }) {
  const [editing, setEditing] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>(() => readCredentials(church))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [workspace, setWorkspace] = useState<{ details?: { name: string; location: string; totalMembers: number; totalYdmMembers: number }; committee?: { name: string; role?: string }[]; ydm?: { name: string; role?: string }[]; women?: { name: string; role?: string }[]; pastor?: { name: string; role?: string }; announcements?: { id: string; title: string; category: string }[] } | null>(null)
  useEffect(() => { fetch(`/api/church-data?churchId=${encodeURIComponent(church.id)}`, { credentials: 'include' }).then(response => response.ok ? response.json() : null).then(result => setWorkspace(result?.data || null)).catch(() => undefined) }, [church.id])
  const update = (field: keyof Credentials, value: string) => setCredentials((current) => ({ ...current, [field]: value }))
  const save = async () => {
    setError('')
    if (!/^[a-z0-9._-]{3,40}$/i.test(credentials.username.trim()) || credentials.password.length < 12) { setError('Use a valid username and a password of at least 12 characters.'); return }
    setSaving(true)
    try {
      const response = await fetch('/api/accounts', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: credentials.username, password: credentials.password, role: 'church', section_scope: church.section, church_id: church.id }) })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) { setError(result.error || 'Could not save this login.'); return }
      saveCredentials(church.id, credentials); setCredentials((current) => ({ ...current, password: '' })); setEditing(false); setSaved(true); window.setTimeout(() => setSaved(false), 2500)
    } catch { setError('Could not reach the account service. Try again.') } finally { setSaving(false) }
  }
  return <div className="section-modal-backdrop section-page-shell" role="dialog" aria-modal="true"><div className="section-modal church-detail-modal"><button className="church-back" onClick={onBack}><ArrowLeft size={15} />Back to {church.section}</button><div className="church-hero"><img src={church.photo} alt={church.name} /><div><span className="eyebrow">Church detail</span><h2>{workspace?.details?.name || church.name}</h2><p>{workspace?.details?.location || church.address} · {church.distanceKm} km from Nagercoil</p></div></div><div className="church-account"><KeyRound size={16} /><div className="church-account-copy"><small>Church admin credentials</small>{editing ? <div className="credential-fields"><label>Username<input value={credentials.username} onChange={(e) => update('username', e.target.value)} autoComplete="username" /></label><label>Password<input type="password" value={credentials.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" /></label></div> : <><strong>{credentials.username}</strong><span>Password hidden for security</span></>}</div>{canManageCredentials && (editing ? <button className="subtle" onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving…' : 'Save credentials'}</button> : <button className="subtle" onClick={() => setEditing(true)}><Pencil size={14} />Change login</button>)}{saved && <b className="credential-saved">Saved</b>}</div>{error && <div className="form-error credential-error">{error}</div>}<div className="credential-scope"><KeyRound size={14} />{scopeLabel} can manage this church login.</div>{workspace?.details && <div className="shared-church-summary"><div><Users size={16}/><span>Total members</span><strong>{workspace.details.totalMembers}</strong></div><div><Users size={16}/><span>Total YDM members</span><strong>{workspace.details.totalYdmMembers}</strong></div><div><span>Committee records</span><strong>{workspace.committee?.length || 0}</strong></div><div><span>Announcements</span><strong>{workspace.announcements?.length || 0}</strong></div></div>}<div className="church-detail-grid"><PeopleBlock title="Pastor" people={workspace?.pastor?.name ? [{ name: workspace.pastor.name, role: 'Church Pastor' }] : [{ name: church.pastor, role: 'Church Pastor' }]} /><PeopleBlock title="Church admin" people={[{ name: church.admin, role: 'Church Administrator' }]} /><PeopleBlock title="Committee" people={workspace?.committee?.length ? workspace.committee : church.committee} /><PeopleBlock title="YDM ministry" people={workspace?.ydm?.length ? workspace.ydm : church.ydm} /><PeopleBlock title="Women ministry" people={workspace?.women?.length ? workspace.women : church.womenMinistry} /></div></div></div>
}

function PeopleBlock({ title, people }: { title: string; people: { name: string; role?: string }[] }) { return <div className="people-block"><h3>{title}</h3>{people.map((person) => <div className="person-row" key={person.name}><div className="person-avatar">{person.name.slice(0, 1)}</div><div><strong>{person.name}</strong><span>{person.role || title}</span></div></div>)}</div> }
