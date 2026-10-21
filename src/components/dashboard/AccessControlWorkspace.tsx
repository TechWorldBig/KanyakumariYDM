import { CheckCircle2, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { accessUpdatedEvent, refreshAccess } from '../../domain/access'

const features = ['Overview', 'Sections', 'Churches', 'Users', 'Reports', 'Audit logs', 'Live analytics', 'YDM meetings']
type AccessLevel = 'manage' | 'edit' | 'view' | 'none'
type AccessRole = { name: string; permissions: Record<string, AccessLevel> }
const defaultRoleNames = ['District Super Admin', 'Section Super Admin', 'Think Tank Admin', 'Section Pastor Admin', 'Pastor of Church', 'District YDM Leader', 'District Women Leader', 'Head Pastor']
const defaults: AccessRole[] = defaultRoleNames.map((name) => ({
  name,
  permissions: Object.fromEntries(features.map((feature) => [feature, name === 'District Super Admin' || name === 'Section Super Admin' ? 'manage' : name === 'Head Pastor' && feature !== 'Live analytics' ? 'view' : 'none'])) as Record<string, AccessLevel>,
}))
const storageKey = 'district_access_matrix'
const levelLabels: Record<AccessLevel, string> = { manage: 'Manage', edit: 'Edit', view: 'View', none: 'No access' }

export function AccessControlWorkspace() {
  const [roles, setRoles] = useState<AccessRole[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || defaults } catch { return defaults }
  })
  const [newRole, setNewRole] = useState('')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const sync = () => { try { const stored = JSON.parse(localStorage.getItem(storageKey) || '[]') as AccessRole[]; setRoles(defaults.map(role => ({ ...role, permissions: { ...role.permissions, ...(stored.find(item => item.name === role.name)?.permissions || {}) } })).concat(stored.filter(item => !defaults.some(role => role.name === item.name)))) } catch { /* keep defaults */ } }
    const load = async () => {
      const response = await fetch('/api/accounts?mode=access', { credentials: 'include' })
      if (!response.ok) throw new Error('Could not load shared permissions')
      const result = await response.json() as { permissions: Array<{ role: string; feature: string; level: AccessLevel }> }
      if (!result.permissions.length) {
        const legacy = JSON.parse(localStorage.getItem(storageKey) || '[]') as AccessRole[]
        const changed = legacy.flatMap(role => features.filter(feature => role.permissions?.[feature] && !(role.name === 'Section Super Admin' && role.permissions[feature] === 'none') && role.permissions[feature] !== defaults.find(item => item.name === role.name)?.permissions[feature]).map(feature => ({ role: role.name, feature, level: role.permissions[feature] })))
        if (changed.length) await Promise.all(changed.map(item => fetch('/api/accounts?mode=access', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(response => { if (!response.ok) throw new Error('Could not migrate saved permissions') })))
      }
      await refreshAccess(); sync()
    }
    void load().catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load shared permissions'))
    window.addEventListener(accessUpdatedEvent, sync)
    return () => window.removeEventListener(accessUpdatedEvent, sync)
  }, [])
  const save = (next: AccessRole[]) => { setRoles(next); localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(accessUpdatedEvent)) }
  const update = async (roleName: string, feature: string, level: AccessLevel) => {
    setError('')
    try {
      const response = await fetch('/api/accounts?mode=access', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: roleName, feature, level }) })
      if (!response.ok) throw new Error((await response.json()).error || 'Could not save permission')
      save(roles.map((role) => role.name === roleName ? { ...role, permissions: { ...role.permissions, [feature]: level } } : role))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save permission') }
  }
  const addRole = () => {
    const name = newRole.trim()
    if (!name || roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) return
    save([...roles, { name, permissions: Object.fromEntries(features.map((feature) => [feature, 'none'])) as Record<string, AccessLevel> }])
    setNewRole('')
  }
  const deleteRole = (name: string) => {
    if (pendingDelete !== name) { setPendingDelete(name); return }
    save(roles.filter((role) => role.name !== name))
    setPendingDelete('')
  }
  const visibleRoles = useMemo(() => roles.filter((role) => role.name.toLowerCase().includes(search.toLowerCase().trim())), [roles, search])
  const managedCount = roles.filter((role) => Object.values(role.permissions).some((level) => level === 'manage')).length
  const configuredCount = roles.filter((role) => Object.values(role.permissions).some((level) => level !== 'none')).length

  return <section className="access-control panel">
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="access-control-hero">
      <div className="access-control-title">
        <span className="access-control-icon"><ShieldCheck size={22} /></span>
        <div><span className="eyebrow">District administration</span><h2>Access control</h2><p>Define what each role can view, edit, and manage across the district workspace.</p></div>
      </div>
      <span className="access-control-status"><CheckCircle2 size={14} /> Changes saved automatically</span>
    </div>
    <div className="access-summary" aria-label="Access control summary">
      <div><span>Roles configured</span><strong>{roles.length}</strong><small>Across the district</small></div>
      <div><span>With management access</span><strong>{managedCount}</strong><small>Can manage at least one area</small></div>
      <div><span>Areas controlled</span><strong>{features.length}</strong><small>Workspace permissions</small></div>
    </div>
    <div className="access-control-toolbar">
      <div className="access-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles" aria-label="Search roles" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear role search">×</button>}</div>
      <div className="access-role-form"><input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="Add a role" aria-label="New role name" onKeyDown={(event) => event.key === 'Enter' && addRole()} /><button className="primary" onClick={addRole}><Plus size={14} />Add role</button></div>
    </div>
    <div className="access-guide"><SlidersHorizontal size={16} /><div><strong>Permission levels</strong><span>Use the dropdown in each column to set the exact access for a role.</span></div><div className="access-legend">{(['manage', 'edit', 'view', 'none'] as AccessLevel[]).map((level) => <span className={`access-legend-${level}`} key={level}><i />{levelLabels[level]}</span>)}</div></div>
    <div className="access-matrix" role="region" aria-label="Role permissions" tabIndex={0}>
      <div className="access-matrix-row access-matrix-head"><strong>Role</strong>{features.map((feature) => <span key={feature}>{feature}</span>)}<span>Actions</span></div>
      {visibleRoles.length ? visibleRoles.map((role) => <div className="access-matrix-row" key={role.name}>
        <strong className="access-role-name"><span>{role.name.slice(0, 2).toUpperCase()}</span>{role.name}</strong>
        {features.map((feature) => <label key={feature} className={`access-toggle level-${role.permissions[feature] || 'none'}`}><span className="sr-only">{feature} access for {role.name}</span><select value={role.permissions[feature] || 'none'} onChange={(event) => void update(role.name, feature, event.target.value as AccessLevel)} aria-label={`${feature} access for ${role.name}`}><option value="manage">Manage</option><option value="edit">Edit</option><option value="view">View</option><option value="none">No access</option></select></label>)}
        <button className={pendingDelete === role.name ? 'role-delete-confirm' : 'role-delete'} onClick={() => deleteRole(role.name)} aria-label={`${pendingDelete === role.name ? 'Confirm delete' : 'Delete'} ${role.name}`}><Trash2 size={14} />{pendingDelete === role.name ? 'Confirm' : ''}</button>
      </div>) : <div className="access-empty"><Search size={22} /><strong>No roles found</strong><span>Try a different role name.</span></div>}
    </div>
    <p className="access-control-footnote">{configuredCount} of {roles.length} roles have at least one assigned permission. Changes apply across the district workspace.</p>
  </section>
}
