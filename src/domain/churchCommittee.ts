import { churches as defaultChurches } from '../data/churches'

export interface CommitteeMember {
  id: string
  churchId: string
  name: string
  role: string
  phone: string
  email?: string
  gender: 'Male' | 'Female'
  term: string // e.g. '2024 - 2027'
  responsibilities?: string
  joinedDate: string
}

export const CHURCH_COMMITTEE_EVENT = 'district-church-committee-updated'
const STORAGE_KEY = 'district_church_committee_members'

const defaultCommitteeMembers: CommitteeMember[] = [
  // Section 1 - Nagercoil Central Church (s1-c1)
  {
    id: 'cm-s1c1-1',
    churchId: 's1-c1',
    name: 'Joseph Samuel',
    role: 'Committee Chair',
    phone: '+91 94430 12345',
    email: 'joseph.samuel@kanyakumari-church.org',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Executive oversight, council moderation, and district representation.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s1c1-2',
    churchId: 's1-c1',
    name: 'Mary Stella',
    role: 'Secretary',
    phone: '+91 97890 23456',
    email: 'mary.stella@kanyakumari-church.org',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Minutes administration, member registry, and official correspondence.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s1c1-3',
    churchId: 's1-c1',
    name: 'Antony Paul',
    role: 'Treasurer',
    phone: '+91 98420 34567',
    email: 'antony.paul@kanyakumari-church.org',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Financial records, tithes auditing, and budget allocations.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s1c1-4',
    churchId: 's1-c1',
    name: 'David Livingstone',
    role: 'Joint Secretary',
    phone: '+91 94860 45678',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Property records, community welfare, and event coordination.',
    joinedDate: '2024-02-15',
  },
  {
    id: 'cm-s1c1-5',
    churchId: 's1-c1',
    name: 'Grace Gnanam',
    role: 'Auditor',
    phone: '+91 97510 56789',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Internal financial audit and monthly balance verification.',
    joinedDate: '2024-02-15',
  },
  {
    id: 'cm-s1c1-6',
    churchId: 's1-c1',
    name: 'Charles Jebaraj',
    role: 'Senior Deacon',
    phone: '+91 94431 67890',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Spiritual counsel, visitation team, and communion service.',
    joinedDate: '2024-01-10',
  },
  {
    id: 'cm-s1c1-7',
    churchId: 's1-c1',
    name: 'Arun Kumar',
    role: 'Youth Representative',
    phone: '+91 94431 82910',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Liaison between youth fellowship (YDM) and church governance.',
    joinedDate: '2024-03-01',
  },
  {
    id: 'cm-s1c1-8',
    churchId: 's1-c1',
    name: 'Grace Mary',
    role: 'Women Representative',
    phone: '+91 97891 78901',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Women fellowship coordination, family care, and hospitality.',
    joinedDate: '2024-03-01',
  },

  // Section 1 - St. Andrew’s Church (s1-c2)
  {
    id: 'cm-s1c2-1',
    churchId: 's1-c2',
    name: 'Moses Raj',
    role: 'Committee Chair',
    phone: '+91 98421 23456',
    email: 'moses.raj@kanyakumari-church.org',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Committee leadership, pastoral liaison, and council planning.',
    joinedDate: '2025-01-01',
  },
  {
    id: 'cm-s1c2-2',
    churchId: 's1-c2',
    name: 'Lydia James',
    role: 'Secretary',
    phone: '+91 97891 34567',
    gender: 'Female',
    term: '2025 - 2028',
    responsibilities: 'Church records, baptismal certificates, and official letters.',
    joinedDate: '2025-01-01',
  },
  {
    id: 'cm-s1c2-3',
    churchId: 's1-c2',
    name: 'Victor Emmanuel',
    role: 'Treasurer',
    phone: '+91 94861 45678',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Financial reporting, building fund, and payroll management.',
    joinedDate: '2025-01-15',
  },
  {
    id: 'cm-s1c2-4',
    churchId: 's1-c2',
    name: 'Kevin Paul',
    role: 'Youth Representative',
    phone: '+91 94432 11982',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Youth ministry representation and youth campus outreach.',
    joinedDate: '2025-02-01',
  },
  {
    id: 'cm-s1c2-5',
    churchId: 's1-c2',
    name: 'Esther David',
    role: 'Women Representative',
    phone: '+91 97511 56789',
    gender: 'Female',
    term: '2025 - 2028',
    responsibilities: 'Women fellowship coordination and charity projects.',
    joinedDate: '2025-02-01',
  },

  // Section 2 - Kanyakumari Coast Church (s2-c1)
  {
    id: 'cm-s2c1-1',
    churchId: 's2-c1',
    name: 'Peter Arul',
    role: 'Committee Chair',
    phone: '+91 98422 34567',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Coastal fellowship leadership, parish property, and community relief.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s2c1-2',
    churchId: 's2-c1',
    name: 'Sarah Paul',
    role: 'Secretary',
    phone: '+91 97892 45678',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Parish documentation, assembly announcements, and meeting minutes.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s2c1-3',
    churchId: 's2-c1',
    name: 'Thomas Alva',
    role: 'Treasurer',
    phone: '+91 94432 56789',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Church accounts, benevolence fund, and maintenance finances.',
    joinedDate: '2024-01-15',
  },
  {
    id: 'cm-s2c1-4',
    churchId: 's2-c1',
    name: 'Daniel Raj',
    role: 'Youth Representative',
    phone: '+91 94435 90123',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Youth engagement, sports ministries, and youth leadership training.',
    joinedDate: '2024-02-01',
  },
  {
    id: 'cm-s2c1-5',
    churchId: 's2-c1',
    name: 'Hannah Rose',
    role: 'Women Representative',
    phone: '+91 97893 12345',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Prayer chain, community counseling, and medical camp liaison.',
    joinedDate: '2024-02-01',
  },

  // Section 3 - Thuckalay Fellowship (s3-c1)
  {
    id: 'cm-s3c1-1',
    churchId: 's3-c1',
    name: 'Andrew Joseph',
    role: 'Committee Chair',
    phone: '+91 98423 45678',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Administrative oversight, church development, and section coordination.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s3c1-2',
    churchId: 's3-c1',
    name: 'Elizabeth John',
    role: 'Secretary',
    phone: '+91 97894 78901',
    gender: 'Female',
    term: '2024 - 2027',
    responsibilities: 'Secretarial administration, church directory, and communications.',
    joinedDate: '2024-01-01',
  },
  {
    id: 'cm-s3c1-3',
    churchId: 's3-c1',
    name: 'Samuel Kingston',
    role: 'Treasurer',
    phone: '+91 94863 67890',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Financial audit, monthly accounts, and offering verification.',
    joinedDate: '2024-01-15',
  },
  {
    id: 'cm-s3c1-4',
    churchId: 's3-c1',
    name: 'Mark Antony',
    role: 'Youth Representative',
    phone: '+91 94437 56789',
    gender: 'Male',
    term: '2024 - 2027',
    responsibilities: 'Youth group representation and gospel mission drives.',
    joinedDate: '2024-02-01',
  },

  // Section 4 - Marthandam West Church (s4-c1)
  {
    id: 'cm-s4c1-1',
    churchId: 's4-c1',
    name: 'Charles David',
    role: 'Committee Chair',
    phone: '+91 98424 56789',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Committee leadership, pastoral council member, and mission trustee.',
    joinedDate: '2025-01-01',
  },
  {
    id: 'cm-s4c1-2',
    churchId: 's4-c1',
    name: 'Rebecca Mary',
    role: 'Secretary',
    phone: '+91 97895 34567',
    gender: 'Female',
    term: '2025 - 2028',
    responsibilities: 'Minutes record, district reporting, and event schedules.',
    joinedDate: '2025-01-01',
  },
  {
    id: 'cm-s4c1-3',
    churchId: 's4-c1',
    name: 'Joshua Soundar',
    role: 'Treasurer',
    phone: '+91 94434 78901',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Accounts, property maintenance budget, and missionary support.',
    joinedDate: '2025-01-15',
  },
  {
    id: 'cm-s4c1-4',
    churchId: 's4-c1',
    name: 'Stephen Raj',
    role: 'Youth Representative',
    phone: '+91 94439 12345',
    gender: 'Male',
    term: '2025 - 2028',
    responsibilities: 'Youth council liaison and conference organizing.',
    joinedDate: '2025-02-01',
  },
]

export function getStoredCommitteeMembers(): CommitteeMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCommitteeMembers))
      return defaultCommitteeMembers
    }
    return JSON.parse(raw) as CommitteeMember[]
  } catch {
    return defaultCommitteeMembers
  }
}

export function saveStoredCommitteeMembers(members: CommitteeMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
    window.dispatchEvent(new Event(CHURCH_COMMITTEE_EVENT))
  } catch (err) {
    console.error('Error saving church committee members:', err)
  }
}

export function getCommitteeMembersForChurch(churchId: string): CommitteeMember[] {
  const all = getStoredCommitteeMembers()
  return all.filter((m) => m.churchId === churchId)
}

export function addCommitteeMember(data: Omit<CommitteeMember, 'id' | 'joinedDate'>): CommitteeMember {
  const current = getStoredCommitteeMembers()
  const newMember: CommitteeMember = {
    ...data,
    id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    joinedDate: new Date().toISOString().split('T')[0],
  }
  const next = [...current, newMember]
  saveStoredCommitteeMembers(next)
  return newMember
}

export function updateCommitteeMember(id: string, updates: Partial<CommitteeMember>): CommitteeMember | null {
  const current = getStoredCommitteeMembers()
  const idx = current.findIndex((m) => m.id === id)
  if (idx < 0) return null

  const updated: CommitteeMember = {
    ...current[idx],
    ...updates,
  }
  const next = [...current]
  next[idx] = updated
  saveStoredCommitteeMembers(next)
  return updated
}

export function deleteCommitteeMember(id: string): boolean {
  const current = getStoredCommitteeMembers()
  const next = current.filter((m) => m.id !== id)
  if (next.length === current.length) return false
  saveStoredCommitteeMembers(next)
  return true
}

export function getChurchCommitteeStats() {
  const churches = getAllChurchesUnified()
  const members = getStoredCommitteeMembers()

  const executiveCount = members.filter((m) =>
    ['Committee Chair', 'President', 'Secretary', 'Treasurer'].some((role) =>
      m.role.toLowerCase().includes(role.toLowerCase())
    )
  ).length

  return {
    totalChurches: churches.length,
    totalCommitteeMembers: members.length,
    executiveCount,
    avgMembersPerChurch: churches.length > 0 ? (members.length / churches.length).toFixed(1) : '0',
  }
}

export function getAllChurchesUnified() {
  try {
    const rawAdded = localStorage.getItem('district_added_churches')
    const added = rawAdded ? JSON.parse(rawAdded) : []
    const convertedAdded = added.map((item: { id: string; name: string; section: string; detail?: string; username?: string }) => ({
      id: item.id,
      name: item.name,
      section: item.section,
      address: item.detail || `${item.section}, Kanyakumari`,
      pastor: 'Appointed Pastor',
      admin: item.username || `${item.id}.admin`,
      photo: '/assets/church-building.svg',
      distanceKm: 15,
      committee: [],
      ydm: [],
      womenMinistry: [],
      username: item.username || item.id,
    }))

    const existingIds = new Set(defaultChurches.map((c) => c.id))
    const fresh = convertedAdded.filter((c: { id: string }) => !existingIds.has(c.id))
    return [...defaultChurches, ...fresh]
  } catch {
    return defaultChurches
  }
}
