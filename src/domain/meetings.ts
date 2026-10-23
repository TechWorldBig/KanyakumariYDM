import type { UserRole } from '../types'

export type AttendeeStatus = 'present' | 'absent' | 'excused'

export type MeetingAttendee = {
  id: string
  name: string
  role: string
  status: AttendeeStatus
  notes?: string
}

export type MeetingActionItem = {
  task: string
  assignee: string
  deadline?: string
}

export type MeetingMOM = {
  title: string
  meetingId: number
  conductedAt: string
  endedAt?: string
  organiserName: string
  organiserRole: string
  locationOrPlatform: string
  attendance: MeetingAttendee[]
  agendaPoints: string[]
  discussionPoints: string[] // What was discussed in meeting as points
  decisions: string[] // Key decisions made
  actionItems: MeetingActionItem[]
  closingRemarks?: string
  publishedAt: string
  publishedBy: string
}

export type MeetingStatus = 'active' | 'completed' | 'cancelled'

export type Meeting = {
  id: number
  title: string
  meet_url: string
  started_by: string
  started_role?: string
  started_at?: string
  scheduled_for: string
  attendee_emails: string[]
  active: boolean
  status?: MeetingStatus
  cancellation_reason: string | null
  cancelled_by: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  completed_by?: string | null
  mom?: MeetingMOM | null
  mom_published?: boolean
  mom_published_at?: string | null
  mom_published_by?: string | null
}

export const defaultDistrictAttendees: Array<{ name: string; role: string }> = [
  { name: 'District Super Admin', role: 'District Super Admin' },
  { name: 'Head Pastor', role: 'Head Pastor' },
  { name: 'District YDM Leader', role: 'District YDM Leader' },
  { name: 'District Women Leader', role: 'District Women Leader' },
  { name: 'Section 1 Admin', role: 'Section 1 Super Admin' },
  { name: 'Section 2 Admin', role: 'Section 2 Super Admin' },
  { name: 'Section 3 Admin', role: 'Section 3 Super Admin' },
  { name: 'Section 4 Admin', role: 'Section 4 Super Admin' },
  { name: 'Think Tank Admin', role: 'Think Tank Admin' },
  { name: 'Section Pastor Admin', role: 'Section Pastor Admin' },
  { name: 'Headmaster Admin', role: 'Headmaster Admin' },
  { name: 'Teacher Admin', role: 'Teacher Admin' },
]

export const sampleDiscussionPointsTemplate = [
  'Opening prayer led by Head Pastor with scripture meditation on leadership & unity.',
  'Evaluated district-wide YDM youth conference attendance targets across all 4 administrative sections.',
  'Addressed church committee onboarding and access rights distribution for verified church pastors.',
  'Confirmed unified Sunday school syllabus verification timeline with church headmasters for Q4.',
  'Reviewed financial allocations for rural mission equipment, audio systems, and local outreach grants.',
  'Agreed upon next inter-section youth rally and sports meet schedule.',
]

export const sampleDecisionsTemplate = [
  'Approved quarterly YDM youth leadership rally dates across Sections 1 to 4.',
  'Mandated that Sunday School class verifications must be signed off by Headmasters before monthly cut-off.',
  'Resolved to conduct monthly digital council syncs on every 4th Tuesday.',
]

export const sampleActionItemsTemplate: MeetingActionItem[] = [
  {
    task: 'Distribute rural church equipment subsidy proposal to section pastors',
    assignee: 'District YDM Leader',
    deadline: '05 Nov 2026',
  },
  {
    task: 'Compile verified Sunday school student enrolment records by class tier',
    assignee: 'Section 1 & 2 Admins',
    deadline: '10 Nov 2026',
  },
  {
    task: 'Circulate published MOM to all district church committee presbyters',
    assignee: 'District Super Admin',
    deadline: 'Today',
  },
]

const LOCAL_STORAGE_MOM_KEY = 'district_ydm_meetings_mom_v1'

export function getLocalMOMStore(): Record<number, MeetingMOM> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MOM_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLocalMOM(meetingId: number, mom: MeetingMOM): void {
  try {
    const store = getLocalMOMStore()
    store[meetingId] = mom
    localStorage.setItem(LOCAL_STORAGE_MOM_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage quota
  }
}

export function isMeetingInFuture(scheduledFor: string): boolean {
  try {
    const time = new Date(scheduledFor).getTime()
    return !Number.isNaN(time) && time > Date.now()
  } catch {
    return false
  }
}

export function isMeetingOver(meeting: Meeting): boolean {
  if (meeting.cancellation_reason || meeting.cancelled_at) return false
  if (meeting.mom_published || meeting.mom) return true
  // If scheduled time is in the future, it is NOT over yet
  if (isMeetingInFuture(meeting.scheduled_for)) return false
  // Once the scheduled date/time has arrived or passed, the meeting is over
  return true
}

export function isMeetingOrganiser(
  meeting: Meeting,
  currentUsername: string,
  currentRole: UserRole
): boolean {
  if (currentRole === 'district' || currentRole === 'district-ydm') return true
  if (!currentUsername) return false
  const started = meeting.started_by?.trim().toLowerCase()
  const user = currentUsername.trim().toLowerCase()
  return Boolean(started && (started === user || started.includes(user) || user.includes(started)))
}

export function formatMOMAsPlainText(mom: MeetingMOM): string {
  const present = mom.attendance.filter((a) => a.status === 'present')
  const absent = mom.attendance.filter((a) => a.status === 'absent')
  const excused = mom.attendance.filter((a) => a.status === 'excused')

  return `========================================
MINUTES OF MEETING (MOM)
========================================
Title: ${mom.title}
Date & Time: ${new Date(mom.conductedAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
Organiser: ${mom.organiserName} (${mom.organiserRole})
Platform: ${mom.locationOrPlatform}
Published: ${new Date(mom.publishedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}

----------------------------------------
ATTENDANCE SUMMARY (${present.length} Present / ${absent.length} Absent / ${excused.length} Excused)
----------------------------------------
PRESENT (${present.length}):
${present.map((a) => `  ✓ ${a.name} - ${a.role}`).join('\n') || '  (None)'}

${absent.length ? `ABSENT (${absent.length}):\n${absent.map((a) => `  ✗ ${a.name} - ${a.role}`).join('\n')}\n` : ''}
${excused.length ? `EXCUSED (${excused.length}):\n${excused.map((a) => `  ⏸ ${a.name} - ${a.role}`).join('\n')}\n` : ''}
----------------------------------------
WHAT WAS DISCUSSED (DISCUSSION POINTS)
----------------------------------------
${mom.discussionPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n\n')}

${
  mom.decisions.length
    ? `----------------------------------------
KEY DECISIONS TAKEN
----------------------------------------
${mom.decisions.map((d, i) => `[Decision ${i + 1}] ${d}`).join('\n')}\n`
    : ''
}
${
  mom.actionItems.length
    ? `----------------------------------------
ACTION ITEMS & NEXT STEPS
----------------------------------------
${mom.actionItems.map((a, i) => `${i + 1}. ${a.task} -> Assigned to: ${a.assignee}${a.deadline ? ` (Due: ${a.deadline})` : ''}`).join('\n')}\n`
    : ''
}
${mom.closingRemarks ? `Closing Remarks: ${mom.closingRemarks}\n` : ''}
========================================
KANYAKUMARI DISTRICT ADMINISTRATIVE COUNCIL
`
}
