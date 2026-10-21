import {
  CheckCircle2,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { accessUpdatedEvent, refreshAccess } from '../../domain/access'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input, Select } from '../ui/input'

const features = [
  'Overview',
  'Sections',
  'Churches',
  'Users',
  'Reports',
  'Audit logs',
  'Live analytics',
  'YDM meetings',
]

type AccessLevel = 'manage' | 'edit' | 'view' | 'none'
type AccessRole = { name: string; permissions: Record<string, AccessLevel> }

const defaultRoleNames = [
  'District Super Admin',
  'Section Super Admin',
  'Think Tank Admin',
  'Section Pastor Admin',
  'Pastor of Church',
  'District YDM Leader',
  'District Women Leader',
  'Head Pastor',
]

const defaults: AccessRole[] = defaultRoleNames.map((name) => ({
  name,
  permissions: Object.fromEntries(
    features.map((feature) => [
      feature,
      name === 'District Super Admin' || name === 'Section Super Admin'
        ? 'manage'
        : name === 'Head Pastor' && feature !== 'Live analytics'
        ? 'view'
        : 'none',
    ])
  ) as Record<string, AccessLevel>,
}))

const storageKey = 'district_access_matrix'

const levelLabels: Record<AccessLevel, string> = {
  manage: 'Manage',
  edit: 'Edit',
  view: 'View',
  none: 'No access',
}

const levelBadgeStyles: Record<AccessLevel, string> = {
  manage:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-semibold',
  edit: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-medium',
  view: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 font-medium',
  none: 'bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-transparent font-normal opacity-70',
}

export function AccessControlWorkspace() {
  const [roles, setRoles] = useState<AccessRole[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null') || defaults
    } catch {
      return defaults
    }
  })
  const [newRole, setNewRole] = useState('')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const sync = () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem(storageKey) || '[]'
        ) as AccessRole[]
        setRoles(
          defaults
            .map((role) => ({
              ...role,
              permissions: {
                ...role.permissions,
                ...(stored.find((item) => item.name === role.name)?.permissions || {}),
              },
            }))
            .concat(
              stored.filter((item) => !defaults.some((role) => role.name === item.name))
            )
        )
      } catch {
        /* keep defaults */
      }
    }

    const load = async () => {
      const response = await fetch('/api/accounts?mode=access', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Could not load shared permissions')
      const result = (await response.json()) as {
        permissions: Array<{ role: string; feature: string; level: AccessLevel }>
      }
      if (!result.permissions.length) {
        const legacy = JSON.parse(
          localStorage.getItem(storageKey) || '[]'
        ) as AccessRole[]
        const changed = legacy.flatMap((role) =>
          features
            .filter(
              (feature) =>
                role.permissions?.[feature] &&
                !(
                  role.name === 'Section Super Admin' &&
                  role.permissions[feature] === 'none'
                ) &&
                role.permissions[feature] !==
                  defaults.find((item) => item.name === role.name)?.permissions[feature]
            )
            .map((feature) => ({
              role: role.name,
              feature,
              level: role.permissions[feature],
            }))
        )
        if (changed.length) {
          await Promise.all(
            changed.map((item) =>
              fetch('/api/accounts?mode=access', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              }).then((response) => {
                if (!response.ok)
                  throw new Error('Could not migrate saved permissions')
              })
            )
          )
        }
      }
      await refreshAccess()
      sync()
    }

    void load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Could not load shared permissions')
    )
    window.addEventListener(accessUpdatedEvent, sync)
    return () => window.removeEventListener(accessUpdatedEvent, sync)
  }, [])

  const save = (next: AccessRole[]) => {
    setRoles(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event(accessUpdatedEvent))
  }

  const update = async (roleName: string, feature: string, level: AccessLevel) => {
    setError('')
    try {
      const response = await fetch('/api/accounts?mode=access', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleName, feature, level }),
      })
      if (!response.ok)
        throw new Error((await response.json()).error || 'Could not save permission')
      save(
        roles.map((role) =>
          role.name === roleName
            ? { ...role, permissions: { ...role.permissions, [feature]: level } }
            : role
        )
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save permission')
    }
  }

  const addRole = () => {
    const name = newRole.trim()
    if (!name || roles.some((role) => role.name.toLowerCase() === name.toLowerCase()))
      return
    save([
      ...roles,
      {
        name,
        permissions: Object.fromEntries(
          features.map((feature) => [feature, 'none'])
        ) as Record<string, AccessLevel>,
      },
    ])
    setNewRole('')
  }

  const deleteRole = (name: string) => {
    if (pendingDelete !== name) {
      setPendingDelete(name)
      return
    }
    save(roles.filter((role) => role.name !== name))
    setPendingDelete('')
  }

  const visibleRoles = useMemo(
    () =>
      roles.filter((role) =>
        role.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [roles, search]
  )

  const managedCount = roles.filter((role) =>
    Object.values(role.permissions).some((level) => level === 'manage')
  ).length
  const configuredCount = roles.filter((role) =>
    Object.values(role.permissions).some((level) => level !== 'none')
  ).length

  return (
    <Card className="p-6 space-y-6">
      {error && (
        <div
          className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-600)] dark:text-[var(--color-district-300)] flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
              District Administration
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
              Access Control & Permissions Matrix
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Define what each role can view, edit, and manage across the district workspace.
            </p>
          </div>
        </div>
        <Badge variant="success" dot className="self-start sm:self-center">
          <CheckCircle2 size={12} className="mr-1" />
          Auto-saved
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)]">Configured Roles</span>
          <strong className="block text-2xl font-bold text-[var(--foreground)] mt-1">
            {roles.length}
          </strong>
          <small className="text-[11px] text-[var(--muted-foreground)]">Across the district</small>
        </div>
        <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)]">Full Management Roles</span>
          <strong className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {managedCount}
          </strong>
          <small className="text-[11px] text-[var(--muted-foreground)]">Can manage at least one area</small>
        </div>
        <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)]">Controlled Features</span>
          <strong className="block text-2xl font-bold text-[var(--foreground)] mt-1">
            {features.length}
          </strong>
          <small className="text-[11px] text-[var(--muted-foreground)]">Workspace feature scopes</small>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="pl-8 pr-8 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="New role name"
            className="h-9 text-xs w-48"
            onKeyDown={(e) => e.key === 'Enter' && addRole()}
          />
          <Button size="sm" onClick={addRole} className="h-9 shrink-0">
            <Plus size={14} />
            <span>Add Role</span>
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <SlidersHorizontal size={14} className="shrink-0" />
          <span>Select the permission level for each column:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(['manage', 'edit', 'view', 'none'] as AccessLevel[]).map((level) => (
            <span
              key={level}
              className={`px-2 py-0.5 rounded text-[11px] border ${levelBadgeStyles[level]}`}
            >
              {levelLabels[level]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--muted)]/60 border-b border-[var(--border)]">
              <th className="py-3 px-4 font-semibold text-[var(--foreground)] sticky left-0 bg-[var(--muted)]/95 backdrop-blur-sm z-10 min-w-48">
                Role Name
              </th>
              {features.map((feature) => (
                <th
                  key={feature}
                  className="py-3 px-3 font-semibold text-[var(--foreground)] text-center min-w-28 whitespace-nowrap"
                >
                  {feature}
                </th>
              ))}
              <th className="py-3 px-3 font-semibold text-[var(--foreground)] text-right min-w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {visibleRoles.length ? (
              visibleRoles.map((role) => (
                <tr
                  key={role.name}
                  className="hover:bg-[var(--muted)]/30 transition-colors"
                >
                  <td className="py-3 px-4 sticky left-0 bg-[var(--card)] z-10 border-r border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-[var(--muted)] text-[var(--foreground)] flex items-center justify-center font-bold text-[10px] shrink-0 border border-[var(--border)]">
                        {role.name.slice(0, 2).toUpperCase()}
                      </div>
                      <strong className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {role.name}
                      </strong>
                    </div>
                  </td>
                  {features.map((feature) => {
                    const currentLevel = role.permissions[feature] || 'none'
                    return (
                      <td key={feature} className="py-2 px-2 text-center">
                        <select
                          value={currentLevel}
                          onChange={(e) =>
                            void update(role.name, feature, e.target.value as AccessLevel)
                          }
                          aria-label={`${feature} access for ${role.name}`}
                          className={`text-xs rounded-lg px-2 py-1 outline-none border cursor-pointer transition-all ${levelBadgeStyles[currentLevel]} focus:ring-2 focus:ring-[var(--ring)]`}
                        >
                          <option value="manage">Manage</option>
                          <option value="edit">Edit</option>
                          <option value="view">View</option>
                          <option value="none">No access</option>
                        </select>
                      </td>
                    )
                  })}
                  <td className="py-2 px-3 text-right">
                    <Button
                      variant={pendingDelete === role.name ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => deleteRole(role.name)}
                      className="h-8 text-xs font-medium"
                      title={
                        pendingDelete === role.name
                          ? 'Click again to confirm role deletion'
                          : `Delete role ${role.name}`
                      }
                    >
                      <Trash2 size={13} />
                      {pendingDelete === role.name && <span className="ml-1">Confirm</span>}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={features.length + 2}
                  className="py-12 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No roles match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {configuredCount} of {roles.length} roles have at least one assigned permission. Changes apply instantaneously across all sessions in the district workspace.
      </p>
    </Card>
  )
}
