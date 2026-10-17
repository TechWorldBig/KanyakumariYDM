import { Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

const features = ['Overview', 'Sections', 'Churches', 'Users', 'Reports', 'Audit logs', 'Live analytics']
type AccessRole = { name: string; permissions: Record<string, boolean> }
const defaults: AccessRole[] = ['District Super Admin', 'Section Super Admin', 'Think Tank Admin', 'Section Pastor Admin', 'Pastor of Church', 'District YDM Leader', 'District Women Leader', 'Head Pastor'].map((name) => ({ name, permissions: Object.fromEntries(features.map((feature) => [feature, name === 'District Super Admin' || (name === 'Head Pastor' && feature !== 'Live analytics')])) }))
const storageKey = 'district_access_matrix'
export function AccessControlWorkspace() {
  const [roles, setRoles] = useState<AccessRole[]>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || defaults } catch { return defaults } })
  const [newRole, setNewRole] = useState('')
  const update = (roleName: string, feature: string) => setRoles((current) => { const next = current.map((role) => role.name === roleName ? { ...role, permissions: { ...role.permissions, [feature]: !role.permissions[feature] } } : role); localStorage.setItem(storageKey, JSON.stringify(next)); return next })
  const addRole = () => { const name = newRole.trim(); if (!name || roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) return; const next = [...roles, { name, permissions: Object.fromEntries(features.map((feature) => [feature, false])) }]; setRoles(next); localStorage.setItem(storageKey, JSON.stringify(next)); setNewRole('') }
  return <section className="access-control panel"><div className="panel-heading"><div><h2>Role access matrix</h2><p>Define which functions each role can view, edit and manage.</p></div><ShieldCheck size={22} color="#2f67c9" /></div><div className="access-role-form"><input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="New role name" aria-label="New role name" /><button className="primary" onClick={addRole}><Plus size={14} />Add role</button></div><div className="access-matrix"><div className="access-matrix-row access-matrix-head"><strong>Role</strong>{features.map((feature) => <span key={feature}>{feature}</span>)}</div>{roles.map((role) => <div className="access-matrix-row" key={role.name}><strong>{role.name}</strong>{features.map((feature) => <label key={feature} className="access-toggle"><input type="checkbox" checked={Boolean(role.permissions[feature])} onChange={() => update(role.name, feature)} /><span>{role.permissions[feature] ? 'Allowed' : 'Hidden'}</span></label>)}</div>)}</div></section>
}
