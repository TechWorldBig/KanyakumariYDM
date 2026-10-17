import { Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { accessUpdatedEvent } from '../../domain/access'

const features = ['Overview', 'Sections', 'Churches', 'Users', 'Reports', 'Audit logs', 'Live analytics', 'YDM meetings']
type AccessLevel = 'manage' | 'edit' | 'view' | 'none'
type AccessRole = { name: string; permissions: Record<string, AccessLevel> }
const defaultRoleNames = ['District Super Admin', 'Section Super Admin', 'Think Tank Admin', 'Section Pastor Admin', 'Pastor of Church', 'District YDM Leader', 'District Women Leader', 'Head Pastor']
const defaults: AccessRole[] = defaultRoleNames.map((name) => ({ name, permissions: Object.fromEntries(features.map((feature) => [feature, name === 'District Super Admin' ? 'manage' : name === 'Head Pastor' && feature !== 'Live analytics' ? 'view' : 'none'])) as Record<string, AccessLevel> }))
const storageKey = 'district_access_matrix'

export function AccessControlWorkspace() {
  const [roles, setRoles] = useState<AccessRole[]>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || defaults } catch { return defaults } })
  const [newRole, setNewRole] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')
  const save = (next: AccessRole[]) => { setRoles(next); localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(accessUpdatedEvent)) }
  const update = (roleName: string, feature: string, level: AccessLevel) => save(roles.map((role) => role.name === roleName ? { ...role, permissions: { ...role.permissions, [feature]: level } } : role))
  const addRole = () => { const name = newRole.trim(); if (!name || roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) return; save([...roles, { name, permissions: Object.fromEntries(features.map((feature) => [feature, 'none'])) as Record<string, AccessLevel> }]); setNewRole('') }
  const deleteRole = (name: string) => { if (pendingDelete !== name) { setPendingDelete(name); return } save(roles.filter((role) => role.name !== name)); setPendingDelete('') }
  return <section className="access-control panel"><div className="panel-heading"><div><h2>Role access matrix</h2><p>Choose the exact access level for every role and workspace area.</p></div><ShieldCheck size={22} color="#2f67c9" /></div><div className="access-role-form"><input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="New role name" aria-label="New role name" /><button className="primary" onClick={addRole}><Plus size={14} />Add role</button></div><div className="access-matrix"><div className="access-matrix-row access-matrix-head"><strong>Role</strong>{features.map((feature) => <span key={feature}>{feature}</span>)}<span>Actions</span></div>{roles.map((role) => <div className="access-matrix-row" key={role.name}><strong>{role.name}</strong>{features.map((feature) => <label key={feature} className="access-toggle"><span className="sr-only">{feature} access for {role.name}</span><select value={role.permissions[feature] || 'none'} onChange={(event) => update(role.name, feature, event.target.value as AccessLevel)} aria-label={`${feature} access for ${role.name}`}><option value="manage">Manage</option><option value="edit">Edit</option><option value="view">View</option><option value="none">No access</option></select></label>)}<button className={pendingDelete === role.name ? 'role-delete-confirm' : 'role-delete'} onClick={() => deleteRole(role.name)} aria-label={`${pendingDelete === role.name ? 'Confirm delete' : 'Delete'} ${role.name}`}><Trash2 size={14} />{pendingDelete === role.name ? 'Confirm' : ''}</button></div>)}</div></section>
}
