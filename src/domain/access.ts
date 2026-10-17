import type { UserRole } from '../types'
import { roleName } from './permissions'

type AccessLevel = 'manage' | 'edit' | 'view' | 'none'
const storageKey = 'district_access_matrix'

export function accessLevel(role: UserRole, feature: string): AccessLevel {
  try {
    const roles = JSON.parse(localStorage.getItem(storageKey) || '[]') as { name?: string; permissions?: Record<string, AccessLevel | boolean> }[]
    const match = roles.find((item) => item.name === roleName(role))
    const saved = match?.permissions?.[feature]
    if (typeof saved === 'string') return saved
    if (typeof saved === 'boolean') return saved ? 'view' : 'none'
  } catch { /* use the safe default below */ }
  if (role === 'district') return 'manage'
  if (role === 'head-pastor') return feature === 'Live analytics' ? 'none' : 'view'
  if (/^section[1-4]$/.test(role)) return 'manage'
  return 'view'
}

export const canAccess = (role: UserRole, feature: string) => accessLevel(role, feature) !== 'none'
