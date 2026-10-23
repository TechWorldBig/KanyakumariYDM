import { churches as defaultChurches } from '../data/churches'

export interface YdmMember {
  id: string
  churchId: string
  name: string
  phone: string
  gender: 'Male' | 'Female'
  category: 'Junior Youth (13-17)' | 'Senior Youth (18-25)' | 'Young Adult (26-35)' | 'Youth Leader'
  role: string
  joinedDate: string
}

export interface YdmAttendanceSession {
  id: string
  churchId: string
  date: string // YYYY-MM-DD
  sessionType: 'Youth Fellowship' | 'Sunday Youth Service' | 'Midweek Prayer' | 'Bible Study' | 'Outreach'
  presentMemberIds: string[]
  markedBy: string
  notes?: string
  updatedAt: string
}

export const YDM_ATTENDANCE_EVENT = 'district-ydm-attendance-updated'
const MEMBERS_STORAGE_KEY = 'district_ydm_attendance_members'
const SESSIONS_STORAGE_KEY = 'district_ydm_attendance_sessions'

export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const defaultMembers: YdmMember[] = [
  // Section 1 - Nagercoil Central Church (s1-c1)
  {
    id: 'm-s1c1-1',
    churchId: 's1-c1',
    name: 'Arun Kumar',
    phone: '+91 94431 82910',
    gender: 'Male',
    category: 'Youth Leader',
    role: 'YDM Coordinator',
    joinedDate: '2024-01-15',
  },
  {
    id: 'm-s1c1-2',
    churchId: 's1-c1',
    name: 'Joel David',
    phone: '+91 94420 71829',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Youth Lead & Speaker',
    joinedDate: '2024-02-10',
  },
  {
    id: 'm-s1c1-3',
    churchId: 's1-c1',
    name: 'Praveen Raj',
    phone: '+91 98941 23011',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Choir & Worship Leader',
    joinedDate: '2024-03-05',
  },
  {
    id: 'm-s1c1-4',
    churchId: 's1-c1',
    name: 'Sneha Mary',
    phone: '+91 97891 44521',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Praise & Worship Team',
    joinedDate: '2024-03-12',
  },
  {
    id: 'm-s1c1-5',
    churchId: 's1-c1',
    name: 'Kevin Samuel',
    phone: '+91 94862 33100',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Media & Audio Visuals',
    joinedDate: '2024-05-18',
  },
  {
    id: 'm-s1c1-6',
    churchId: 's1-c1',
    name: 'Diana Rose',
    phone: '+91 97510 88219',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Scripture Reading & Intercession',
    joinedDate: '2024-06-01',
  },
  {
    id: 'm-s1c1-7',
    churchId: 's1-c1',
    name: 'Manoj Wilson',
    phone: '+91 94433 19283',
    gender: 'Male',
    category: 'Young Adult (26-35)',
    role: 'Outreach & Missions Lead',
    joinedDate: '2024-01-20',
  },
  {
    id: 'm-s1c1-8',
    churchId: 's1-c1',
    name: 'Anita Grace',
    phone: '+91 98421 90123',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Hospitality & Welcome Team',
    joinedDate: '2024-07-14',
  },
  {
    id: 'm-s1c1-9',
    churchId: 's1-c1',
    name: 'Benson Paul',
    phone: '+91 94422 67890',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-08-22',
  },
  {
    id: 'm-s1c1-10',
    churchId: 's1-c1',
    name: 'Sharon Blessy',
    phone: '+91 97871 12345',
    gender: 'Female',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-09-02',
  },

  // Section 1 - St. Andrew’s Church (s1-c2)
  {
    id: 'm-s1c2-1',
    churchId: 's1-c2',
    name: 'Kevin Paul',
    phone: '+91 94432 11982',
    gender: 'Male',
    category: 'Youth Leader',
    role: 'YDM Coordinator',
    joinedDate: '2024-02-01',
  },
  {
    id: 'm-s1c2-2',
    churchId: 's1-c2',
    name: 'Moses Raj',
    phone: '+91 98422 34567',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Youth Secretary',
    joinedDate: '2024-02-15',
  },
  {
    id: 'm-s1c2-3',
    churchId: 's1-c2',
    name: 'Lydia James',
    phone: '+91 97892 45678',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Youth Choir Lead',
    joinedDate: '2024-03-10',
  },
  {
    id: 'm-s1c2-4',
    churchId: 's1-c2',
    name: 'Stephen Victor',
    phone: '+91 94863 56789',
    gender: 'Male',
    category: 'Young Adult (26-35)',
    role: 'Youth Mentor',
    joinedDate: '2024-04-11',
  },
  {
    id: 'm-s1c2-5',
    churchId: 's1-c2',
    name: 'Priya Thomas',
    phone: '+91 97511 67890',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Sunday School Volunteer',
    joinedDate: '2024-05-19',
  },
  {
    id: 'm-s1c2-6',
    churchId: 's1-c2',
    name: 'Daniel Jebaraj',
    phone: '+91 94434 78901',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-06-25',
  },
  {
    id: 'm-s1c2-7',
    churchId: 's1-c2',
    name: 'Nancy Joy',
    phone: '+91 98423 89012',
    gender: 'Female',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-07-08',
  },

  // Section 2 - Kanyakumari Coast Church (s2-c1)
  {
    id: 'm-s2c1-1',
    churchId: 's2-c1',
    name: 'Daniel Raj',
    phone: '+91 94435 90123',
    gender: 'Male',
    category: 'Youth Leader',
    role: 'YDM Coordinator',
    joinedDate: '2024-01-10',
  },
  {
    id: 'm-s2c1-2',
    churchId: 's2-c1',
    name: 'Peter Arul',
    phone: '+91 98424 01234',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Worship & Music Coordinator',
    joinedDate: '2024-02-12',
  },
  {
    id: 'm-s2c1-3',
    churchId: 's2-c1',
    name: 'Hannah Rose',
    phone: '+91 97893 12345',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Youth Secretary',
    joinedDate: '2024-03-01',
  },
  {
    id: 'm-s2c1-4',
    churchId: 's2-c1',
    name: 'Joshua Paul',
    phone: '+91 94864 23456',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-04-18',
  },
  {
    id: 'm-s2c1-5',
    churchId: 's2-c1',
    name: 'Jenifer Mary',
    phone: '+91 97512 34567',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Prayer Leader',
    joinedDate: '2024-05-20',
  },
  {
    id: 'm-s2c1-6',
    churchId: 's2-c1',
    name: 'Solomon David',
    phone: '+91 94436 45678',
    gender: 'Male',
    category: 'Young Adult (26-35)',
    role: 'Coast Outreach Coordinator',
    joinedDate: '2024-06-15',
  },

  // Section 3 - Thuckalay Fellowship (s3-c1)
  {
    id: 'm-s3c1-1',
    churchId: 's3-c1',
    name: 'Mark Antony',
    phone: '+91 94437 56789',
    gender: 'Male',
    category: 'Youth Leader',
    role: 'YDM Coordinator',
    joinedDate: '2024-01-22',
  },
  {
    id: 'm-s3c1-2',
    churchId: 's3-c1',
    name: 'Andrew Joseph',
    phone: '+91 98425 67890',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Youth Lead & Pianist',
    joinedDate: '2024-02-28',
  },
  {
    id: 'm-s3c1-3',
    churchId: 's3-c1',
    name: 'Elizabeth John',
    phone: '+91 97894 78901',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Worship & Scripture Leader',
    joinedDate: '2024-03-14',
  },
  {
    id: 'm-s3c1-4',
    churchId: 's3-c1',
    name: 'Charles Finny',
    phone: '+91 94865 89012',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Youth Member',
    joinedDate: '2024-05-04',
  },
  {
    id: 'm-s3c1-5',
    churchId: 's3-c1',
    name: 'Keziah Grace',
    phone: '+91 97513 90123',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Youth Member',
    joinedDate: '2024-06-22',
  },
  {
    id: 'm-s3c1-6',
    churchId: 's3-c1',
    name: 'Jonathan Samuel',
    phone: '+91 94438 01234',
    gender: 'Male',
    category: 'Young Adult (26-35)',
    role: 'Youth Mentor',
    joinedDate: '2024-07-30',
  },

  // Section 4 - Marthandam West Church (s4-c1)
  {
    id: 'm-s4c1-1',
    churchId: 's4-c1',
    name: 'Stephen Raj',
    phone: '+91 94439 12345',
    gender: 'Male',
    category: 'Youth Leader',
    role: 'YDM Coordinator',
    joinedDate: '2024-01-18',
  },
  {
    id: 'm-s4c1-2',
    churchId: 's4-c1',
    name: 'Charles David',
    phone: '+91 98426 23456',
    gender: 'Male',
    category: 'Senior Youth (18-25)',
    role: 'Youth Lead & Speaker',
    joinedDate: '2024-02-20',
  },
  {
    id: 'm-s4c1-3',
    churchId: 's4-c1',
    name: 'Rebecca Mary',
    phone: '+91 97895 34567',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Prayer & Intercession Coordinator',
    joinedDate: '2024-03-24',
  },
  {
    id: 'm-s4c1-4',
    churchId: 's4-c1',
    name: 'Prince Emmanuel',
    phone: '+91 94866 45678',
    gender: 'Male',
    category: 'Junior Youth (13-17)',
    role: 'Guitarist & Media',
    joinedDate: '2024-05-15',
  },
  {
    id: 'm-s4c1-5',
    churchId: 's4-c1',
    name: 'Stella Catherine',
    phone: '+91 97514 56789',
    gender: 'Female',
    category: 'Senior Youth (18-25)',
    role: 'Youth Member',
    joinedDate: '2024-06-19',
  },
  {
    id: 'm-s4c1-6',
    churchId: 's4-c1',
    name: 'Godwin Samuel',
    phone: '+91 94440 67890',
    gender: 'Male',
    category: 'Young Adult (26-35)',
    role: 'Youth Mentor',
    joinedDate: '2024-07-28',
  },
]

// Seed initial attendance sessions for today
const today = getTodayDateString()

const defaultSessions: YdmAttendanceSession[] = [
  {
    id: `sess-s1c1-${today}`,
    churchId: 's1-c1',
    date: today,
    sessionType: 'Youth Fellowship',
    presentMemberIds: [
      'm-s1c1-1',
      'm-s1c1-2',
      'm-s1c1-3',
      'm-s1c1-4',
      'm-s1c1-6',
      'm-s1c1-7',
      'm-s1c1-8',
      'm-s1c1-9',
    ],
    markedBy: 'Arun Kumar (YDM Leader)',
    notes: 'Regular Saturday YDM gathering with worship and message on purposeful living.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: `sess-s1c2-${today}`,
    churchId: 's1-c2',
    date: today,
    sessionType: 'Youth Fellowship',
    presentMemberIds: [
      'm-s1c2-1',
      'm-s1c2-2',
      'm-s1c2-3',
      'm-s1c2-5',
      'm-s1c2-6',
    ],
    markedBy: 'Kevin Paul (YDM Leader)',
    notes: 'Youth prayer and Bible study session.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: `sess-s2c1-${today}`,
    churchId: 's2-c1',
    date: today,
    sessionType: 'Youth Fellowship',
    presentMemberIds: [
      'm-s2c1-1',
      'm-s2c1-2',
      'm-s2c1-3',
      'm-s2c1-4',
      'm-s2c1-5',
    ],
    markedBy: 'Daniel Raj (YDM Leader)',
    notes: 'Coastal outreach debrief & weekly prayer fellowship.',
    updatedAt: new Date().toISOString(),
  },
]

export function getStoredMembers(): YdmMember[] {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(defaultMembers))
      return defaultMembers
    }
    return JSON.parse(raw) as YdmMember[]
  } catch {
    return defaultMembers
  }
}

export function saveStoredMembers(members: YdmMember[]): void {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members))
    window.dispatchEvent(new Event(YDM_ATTENDANCE_EVENT))
  } catch (err) {
    console.error('Error saving YDM members:', err)
  }
}

export function getStoredSessions(): YdmAttendanceSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(defaultSessions))
      return defaultSessions
    }
    return JSON.parse(raw) as YdmAttendanceSession[]
  } catch {
    return defaultSessions
  }
}

export function saveStoredSessions(sessions: YdmAttendanceSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
    window.dispatchEvent(new Event(YDM_ATTENDANCE_EVENT))
  } catch (err) {
    console.error('Error saving YDM attendance sessions:', err)
  }
}

export function getMembersForChurch(churchId: string): YdmMember[] {
  const all = getStoredMembers()
  return all.filter((m) => m.churchId === churchId)
}

export function addMemberToChurch(data: Omit<YdmMember, 'id' | 'joinedDate'>): YdmMember {
  const current = getStoredMembers()
  const newMember: YdmMember = {
    ...data,
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    joinedDate: getTodayDateString(),
  }
  const next = [...current, newMember]
  saveStoredMembers(next)
  return newMember
}

export function getSessionForDate(churchId: string, date: string): YdmAttendanceSession | undefined {
  const sessions = getStoredSessions()
  return sessions.find((s) => s.churchId === churchId && s.date === date)
}

export function recordAttendance(data: {
  churchId: string
  date: string
  sessionType: YdmAttendanceSession['sessionType']
  presentMemberIds: string[]
  markedBy: string
  notes?: string
}): YdmAttendanceSession {
  const current = getStoredSessions()
  const existingIdx = current.findIndex((s) => s.churchId === data.churchId && s.date === data.date)
  
  const updatedSession: YdmAttendanceSession = {
    id: existingIdx >= 0 ? current[existingIdx].id : `sess-${data.churchId}-${data.date}`,
    churchId: data.churchId,
    date: data.date,
    sessionType: data.sessionType,
    presentMemberIds: data.presentMemberIds,
    markedBy: data.markedBy,
    notes: data.notes || '',
    updatedAt: new Date().toISOString(),
  }

  let next: YdmAttendanceSession[]
  if (existingIdx >= 0) {
    next = [...current]
    next[existingIdx] = updatedSession
  } else {
    next = [updatedSession, ...current]
  }

  saveStoredSessions(next)
  return updatedSession
}

export function toggleMemberAttendance(
  churchId: string,
  date: string,
  memberId: string,
  sessionType: YdmAttendanceSession['sessionType'] = 'Youth Fellowship',
  markedBy: string = 'District Leader',
): YdmAttendanceSession {
  const session = getSessionForDate(churchId, date)
  let presentIds = session ? [...session.presentMemberIds] : []

  if (presentIds.includes(memberId)) {
    presentIds = presentIds.filter((id) => id !== memberId)
  } else {
    presentIds.push(memberId)
  }

  return recordAttendance({
    churchId,
    date,
    sessionType: session ? session.sessionType : sessionType,
    presentMemberIds: presentIds,
    markedBy,
    notes: session?.notes,
  })
}

export function markAllMembersAttendance(
  churchId: string,
  date: string,
  present: boolean,
  sessionType: YdmAttendanceSession['sessionType'] = 'Youth Fellowship',
  markedBy: string = 'District Leader',
): YdmAttendanceSession {
  const churchMembers = getMembersForChurch(churchId)
  const presentIds = present ? churchMembers.map((m) => m.id) : []

  const session = getSessionForDate(churchId, date)

  return recordAttendance({
    churchId,
    date,
    sessionType: session ? session.sessionType : sessionType,
    presentMemberIds: presentIds,
    markedBy,
    notes: session?.notes,
  })
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
      ydm: [{ name: 'Youth Leader', role: 'YDM Coordinator' }],
      womenMinistry: [],
      username: item.username || item.id,
    }))

    // Avoid duplicate IDs
    const existingIds = new Set(defaultChurches.map((c) => c.id))
    const fresh = convertedAdded.filter((c: { id: string }) => !existingIds.has(c.id))
    return [...defaultChurches, ...fresh]
  } catch {
    return defaultChurches
  }
}

export function getYdmDistrictStats() {
  const churches = getAllChurchesUnified()
  const members = getStoredMembers()
  const sessions = getStoredSessions()
  const todayDate = getTodayDateString()

  const todaySessions = sessions.filter((s) => s.date === todayDate)
  const todayPresentCount = todaySessions.reduce((acc, s) => acc + s.presentMemberIds.length, 0)

  // Overall attendance rate of recorded sessions
  let totalOpportunities = 0
  let totalAttended = 0

  for (const session of sessions) {
    const churchMembers = members.filter((m) => m.churchId === session.churchId)
    if (churchMembers.length > 0) {
      totalOpportunities += churchMembers.length
      totalAttended += session.presentMemberIds.length
    }
  }

  const overallRate = totalOpportunities > 0 ? Math.round((totalAttended / totalOpportunities) * 100) : 85

  return {
    totalChurches: churches.length,
    totalMembers: members.length,
    todayPresent: todayPresentCount,
    overallAttendanceRate: overallRate,
  }
}

