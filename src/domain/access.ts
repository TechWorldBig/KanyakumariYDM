import type { UserRole } from '../types'
import { roleName } from './permissions'

type AccessLevel = 'manage' | 'edit' | 'view' | 'none'
const storageKey = 'district_access_matrix'
export const accessUpdatedEvent = 'district-access-updated'

export function accessLevel(role: UserRole, feature: string): AccessLevel {
  try {
    const roles = JSON.parse(localStorage.getItem(storageKey) || '[]') as { name?: string; permissions?: Record<string, AccessLevel | boolean> }[]
    const match = roles.find((item) => item.name === (/^section[1-4]$/.test(role) ? 'Section Super Admin' : roleName(role)))
    const saved = match?.permissions?.[feature]
    if (typeof saved === 'string') return saved
    if (typeof saved === 'boolean') return saved ? 'view' : 'none'
  } catch { /* use the safe default below */ }
  if (role === 'district') return 'manage'
  if (role === 'district-ydm' && (feature === 'YDM meetings' || feature === 'YDM attendance')) return 'manage'
  if (role === 'head-pastor') return feature === 'Live analytics' ? 'none' : 'view'
  if (/^section[1-4]$/.test(role)) return 'manage'
  if (feature === 'YDM attendance') return 'none'
  return 'view'
}

export const canAccess = (role: UserRole, feature: string) => accessLevel(role, feature) !== 'none'
export const canWrite = (role: UserRole, feature: string) => ['edit', 'manage'].includes(accessLevel(role, feature))

export async function refreshAccess() {
  const response = await fetch('/api/accounts?mode=access', { credentials: 'include' })
  if (!response.ok) return
  const result = await response.json() as { permissions: Array<{ role: string; feature: string; level: AccessLevel }> }
  if (!result.permissions.length) return
  const roles: Record<string, { name: string; permissions: Record<string, AccessLevel> }> = {}
  for (const item of result.permissions) {
    roles[item.role] ||= { name: item.role, permissions: {} }
    roles[item.role].permissions[item.feature] = item.level
  }
  localStorage.setItem(storageKey, JSON.stringify(Object.values(roles)))
  window.dispatchEvent(new Event(accessUpdatedEvent))
}
