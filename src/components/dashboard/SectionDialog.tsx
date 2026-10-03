import { useState } from 'react'
import { ArrowLeft, KeyRound, MapPin, Pencil, RotateCcw, Save } from 'lucide-react'
import { churches, ChurchRecord, MinistryMember } from '../../data/churches'
import type { Section } from '../../types'

type Credentials = { username: string; password: string }
const credentialsKey = 'district_church_credentials'

function readCredentials(church: ChurchRecord): Credentials {
  try {
    const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<string, Credentials>
    return saved[church.id] || { username: church.username, password: 'church123' }
  } catch { return { username: church.username, password: 'church123' } }
}

function saveCredentials(churchId: string, credentials: Credentials) {
  const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<string, Credentials>
  localStorage.setItem(credentialsKey, JSON.stringify({ ...saved, [churchId]: credentials }))
}

export function SectionDialog({ section, onClose, isDistrict, onRemove }: { section: Section; onClose: () => void; isDistrict: boolean; onRemove: () => void }) {
  const [church, setChurch] = useState<ChurchRecord | null>(null)
  const sectionChurches = churches.filter((item) => item.section === section.name)
  if (church) return <ChurchDialog church={church} onBack={() => setChurch(null)} canManageCredentials scopeLabel={isDistrict ? 'District Super Admin' : `${section.name} Super Admin`} />
  return <div className="section-modal-backdrop section-page-shell" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="section-modal section-detail-modal"><div className="section-page-toolbar"><button className="church-back" onClick={onClose}><ArrowLeft size={15} />Back to dashboard</button><button className="section-modal-close" onClick={onClose} aria-label="Close">×</button></div><span className="eyebrow">Section workspace</span><h2>{section.name}</h2><p className="modal-town">{section.town} · {sectionChurches.length} churches in this MVP directory</p><div className="modal-admin"><div className="avatar">SA</div><div><strong>{section.admin}</strong><span>Section super admin · Full read, write, edit and manage access</span></div></div><div className="church-list-heading"><h3>Churches in {section.name}</h3><span>{sectionChurches.length} records</span></div><div className="church-list">{sectionChurches.map((item) => <button className="church-list-row" key={item.id} onClick={() => setChurch(item)}><div className="church-thumb"><img src={item.photo} alt="" /></div><div><strong>{item.name}</strong><span><MapPin size={12} />{item.distanceKm === 0 ? 'Nagercoil reference point' : `${item.distanceKm} km from Nagercoil`} · {item.address}</span></div><ArrowLeft className="church-open-icon" size={16} /></button>)}</div>{isDistrict && !sectionChurches.length && <button className="danger-outline" onClick={onRemove}>Remove section admin</button>}</div></div>
}

function ChurchDialog({ church, onBack, canManageCredentials, scopeLabel }: { church: ChurchRecord; onBack: () => void; canManageCredentials: boolean; scopeLabel: string }) {
  const [editing, setEditing] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>(() => readCredentials(church))
  const [saved, setSaved] = useState(false)
  const update = (field: keyof Credentials, value: string) => setCredentials((current) => ({ ...current, [field]: value }))
  const save = () => { if (!credentials.username.trim() || !credentials.password.trim()) return; saveCredentials(church.id, credentials); setEditing(false); setSaved(true); window.setTimeout(() => setSaved(false), 2500) }
  return <div className="section-modal-backdrop section-page-shell" role="dialog" aria-modal="true"><div className="section-modal church-detail-modal"><button className="church-back" onClick={onBack}><ArrowLeft size={15} />Back to {church.section}</button><div className="church-hero"><img src={church.photo} alt={church.name} /><div><span className="eyebrow">Church detail</span><h2>{church.name}</h2><p>{church.address} · {church.distanceKm} km from Nagercoil</p></div></div><div className="church-account"><KeyRound size={16} /><div className="church-account-copy"><small>Church admin credentials</small>{editing ? <div className="credential-fields"><label>Username<input value={credentials.username} onChange={(e) => update('username', e.target.value)} autoComplete="username" /></label><label>Password<input type="password" value={credentials.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" /></label></div> : <><strong>{credentials.username}</strong><span>Password hidden for security</span></>}</div>{canManageCredentials && (editing ? <button className="subtle" onClick={save}><Save size={14} />Save credentials</button> : <button className="subtle" onClick={() => setEditing(true)}><Pencil size={14} />Change login</button>)}{saved && <b className="credential-saved">Saved</b>}</div><div className="credential-scope"><KeyRound size={14} />{scopeLabel} can manage this church login.</div><div className="church-detail-grid"><PeopleBlock title="Pastor" people={[{ name: church.pastor, role: 'Church Pastor' }]} /><PeopleBlock title="Church admin" people={[{ name: church.admin, role: 'Church Administrator' }]} /><PeopleBlock title="Committee" people={church.committee} /><PeopleBlock title="YDM ministry" people={church.ydm} /><PeopleBlock title="Women ministry" people={church.womenMinistry} /></div></div></div>
}

function PeopleBlock({ title, people }: { title: string; people: MinistryMember[] }) { return <div className="people-block"><h3>{title}</h3>{people.map((person) => <div className="person-row" key={person.name}><div className="person-avatar">{person.name.slice(0, 1)}</div><div><strong>{person.name}</strong><span>{person.role}</span></div></div>)}</div> }
