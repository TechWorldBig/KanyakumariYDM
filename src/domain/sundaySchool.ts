import { churches as defaultChurches } from '../data/churches'

export type SundaySchoolClassLevel =
  | 'Beginner'
  | 'Primary'
  | 'Intermediate'
  | 'Senior'
  | 'Super Senior'

export const SUNDAY_SCHOOL_CLASSES: SundaySchoolClassLevel[] = [
  'Beginner',
  'Primary',
  'Intermediate',
  'Senior',
  'Super Senior',
]

export const CLASS_METADATA: Record<
  SundaySchoolClassLevel,
  { ageRange: string; description: string; color: string }
> = {
  Beginner: {
    ageRange: 'Ages 3 - 5',
    description: 'Foundational Bible stories, rhymes, and gospel songs for young children.',
    color: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-800',
  },
  Primary: {
    ageRange: 'Ages 6 - 8 (1st - 3rd Std)',
    description: 'Scripture memorization, Old Testament heroes, and basic Christian principles.',
    color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
  },
  Intermediate: {
    ageRange: 'Ages 9 - 11 (4th - 6th Std)',
    description: 'Life of Christ, parables, missionary biographies, and Christian discipleship.',
    color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800',
  },
  Senior: {
    ageRange: 'Ages 12 - 14 (7th - 9th Std)',
    description: 'New Testament epistles, Christian character, doctrine, and youth guidance.',
    color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800',
  },
  'Super Senior': {
    ageRange: 'Ages 15 - 18+ (10th Std - College)',
    description: 'Apologetics, moral values, spiritual leadership, and transition to youth fellowship.',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
  },
}

export interface SundaySchoolStudent {
  id: string
  churchId: string
  classLevel: SundaySchoolClassLevel
  name: string
  age: number
  place: string
  educationType: 'School' | 'College'
  schoolStandard?: string // e.g. "4th Standard"
  collegeDegree?: string // e.g. "B.Sc Mathematics"
  parentContact?: string
  enrolledDate: string
  status: 'Active' | 'Graduated'
}

export interface SundaySchoolTeacher {
  id: string
  churchId: string
  name: string
  phone: string
  classLevel: SundaySchoolClassLevel
  roleTitle: string
}

export interface SundaySchoolHeadmaster {
  churchId: string
  name: string
  phone: string
  roleTitle: string
  academicYear: string
}

export interface SundaySchoolClassVerification {
  id: string
  churchId: string
  classLevel: SundaySchoolClassLevel
  academicYear: string
  isFinalised: boolean
  verifiedBy?: string
  verifiedAt?: string
  headmasterNotes?: string
}

export const SUNDAY_SCHOOL_EVENT = 'district-sunday-school-updated'
const STUDENTS_STORAGE_KEY = 'district_sunday_school_students'
const TEACHERS_STORAGE_KEY = 'district_sunday_school_teachers'
const VERIFICATIONS_STORAGE_KEY = 'district_sunday_school_verifications'

export const defaultHeadmasters: SundaySchoolHeadmaster[] = [
  { churchId: 's1-c1', name: 'Prof. S. Jeyakumar', phone: '+91 94430 12345', roleTitle: 'Headmaster Admin', academicYear: '2026 - 2027' },
  { churchId: 's1-c2', name: 'Dr. D. Vasanthakumar', phone: '+91 94430 23456', roleTitle: 'Headmaster Admin', academicYear: '2026 - 2027' },
  { churchId: 's2-c1', name: 'Mr. C. Robinson', phone: '+91 94430 34567', roleTitle: 'Headmaster Admin', academicYear: '2026 - 2027' },
  { churchId: 's3-c1', name: 'Mr. T. Arthur', phone: '+91 94430 45678', roleTitle: 'Headmaster Admin', academicYear: '2026 - 2027' },
  { churchId: 's4-c1', name: 'Mr. M. Wilson Raj', phone: '+91 94430 56789', roleTitle: 'Headmaster Admin', academicYear: '2026 - 2027' },
]

export function getHeadmasterForChurch(churchId: string): SundaySchoolHeadmaster {
  const found = defaultHeadmasters.find((h) => h.churchId === churchId)
  if (found) return found
  return {
    churchId,
    name: 'Church Sunday School Headmaster',
    phone: '+91 94430 00000',
    roleTitle: 'Headmaster Admin',
    academicYear: '2026 - 2027',
  }
}

const defaultTeachers: SundaySchoolTeacher[] = [
  // s1-c1
  { id: 't-s1c1-1', churchId: 's1-c1', name: 'Mrs. Stella Vimala', phone: '+91 94431 11223', classLevel: 'Beginner', roleTitle: 'Class Teacher' },
  { id: 't-s1c1-2', churchId: 's1-c1', name: 'Mrs. Deborah Rani', phone: '+91 94432 22334', classLevel: 'Primary', roleTitle: 'Class Teacher' },
  { id: 't-s1c1-3', churchId: 's1-c1', name: 'Mr. Paulraj Gnanam', phone: '+91 94433 33445', classLevel: 'Intermediate', roleTitle: 'Class Teacher' },
  { id: 't-s1c1-4', churchId: 's1-c1', name: 'Mr. David Kingsly', phone: '+91 94434 44556', classLevel: 'Senior', roleTitle: 'Class Teacher' },
  { id: 't-s1c1-5', churchId: 's1-c1', name: 'Er. J. Ronald', phone: '+91 94435 55667', classLevel: 'Super Senior', roleTitle: 'Class Teacher' },

  // s1-c2
  { id: 't-s1c2-1', churchId: 's1-c2', name: 'Mrs. Ruth Jacob', phone: '+91 94436 66778', classLevel: 'Beginner', roleTitle: 'Class Teacher' },
  { id: 't-s1c2-2', churchId: 's1-c2', name: 'Miss Priya Thomas', phone: '+91 94437 77889', classLevel: 'Primary', roleTitle: 'Class Teacher' },
  { id: 't-s1c2-3', churchId: 's1-c2', name: 'Mr. Victor Raja', phone: '+91 94438 88990', classLevel: 'Intermediate', roleTitle: 'Class Teacher' },
  { id: 't-s1c2-4', churchId: 's1-c2', name: 'Mrs. Hannah Samuel', phone: '+91 94439 99001', classLevel: 'Senior', roleTitle: 'Class Teacher' },
  { id: 't-s1c2-5', churchId: 's1-c2', name: 'Mr. Stephen Victor', phone: '+91 94863 56789', classLevel: 'Super Senior', roleTitle: 'Class Teacher' },

  // s2-c1
  { id: 't-s2c1-1', churchId: 's2-c1', name: 'Mrs. Esther Mary', phone: '+91 94440 00112', classLevel: 'Beginner', roleTitle: 'Class Teacher' },
  { id: 't-s2c1-2', churchId: 's2-c1', name: 'Mrs. Sarah Selvi', phone: '+91 94441 11223', classLevel: 'Primary', roleTitle: 'Class Teacher' },
  { id: 't-s2c1-3', churchId: 's2-c1', name: 'Mr. Thomas Jebaraj', phone: '+91 94442 22334', classLevel: 'Intermediate', roleTitle: 'Class Teacher' },
  { id: 't-s2c1-4', churchId: 's2-c1', name: 'Mrs. Glory Grace', phone: '+91 94443 33445', classLevel: 'Senior', roleTitle: 'Class Teacher' },
  { id: 't-s2c1-5', churchId: 's2-c1', name: 'Mr. Peter Arul', phone: '+91 98424 01234', classLevel: 'Super Senior', roleTitle: 'Class Teacher' },

  // s3-c1
  { id: 't-s3c1-1', churchId: 's3-c1', name: 'Mrs. Daisy Christopher', phone: '+91 94444 44556', classLevel: 'Beginner', roleTitle: 'Class Teacher' },
  { id: 't-s3c1-2', churchId: 's3-c1', name: 'Mrs. Rachel Thomas', phone: '+91 94445 55667', classLevel: 'Primary', roleTitle: 'Class Teacher' },
  { id: 't-s3c1-3', churchId: 's3-c1', name: 'Mr. Joseph Wilson', phone: '+91 94446 66778', classLevel: 'Intermediate', roleTitle: 'Class Teacher' },
  { id: 't-s3c1-4', churchId: 's3-c1', name: 'Mrs. Beulah Grace', phone: '+91 94447 77889', classLevel: 'Senior', roleTitle: 'Class Teacher' },
  { id: 't-s3c1-5', churchId: 's3-c1', name: 'Mr. Andrew Joseph', phone: '+91 98425 67890', classLevel: 'Super Senior', roleTitle: 'Class Teacher' },

  // s4-c1
  { id: 't-s4c1-1', churchId: 's4-c1', name: 'Mrs. Mercy George', phone: '+91 94448 88990', classLevel: 'Beginner', roleTitle: 'Class Teacher' },
  { id: 't-s4c1-2', churchId: 's4-c1', name: 'Mrs. Eunice David', phone: '+91 94449 99001', classLevel: 'Primary', roleTitle: 'Class Teacher' },
  { id: 't-s4c1-3', churchId: 's4-c1', name: 'Mr. Samuel Rajan', phone: '+91 94450 00112', classLevel: 'Intermediate', roleTitle: 'Class Teacher' },
  { id: 't-s4c1-4', churchId: 's4-c1', name: 'Mrs. Janet Stella', phone: '+91 94451 11223', classLevel: 'Senior', roleTitle: 'Class Teacher' },
  { id: 't-s4c1-5', churchId: 's4-c1', name: 'Mr. Charles David', phone: '+91 98426 23456', classLevel: 'Super Senior', roleTitle: 'Class Teacher' },
]

const defaultStudents: SundaySchoolStudent[] = [
  // s1-c1 - Nagercoil Central Church
  // Beginner
  {
    id: 'st-s1c1-1',
    churchId: 's1-c1',
    classLevel: 'Beginner',
    name: 'Aaron Joel',
    age: 4,
    place: 'Nagercoil',
    educationType: 'School',
    schoolStandard: 'LKG',
    parentContact: '+91 94431 82910',
    enrolledDate: '2025-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c1-2',
    churchId: 's1-c1',
    classLevel: 'Beginner',
    name: 'Jemimah Grace',
    age: 5,
    place: 'Asaripallam',
    educationType: 'School',
    schoolStandard: 'UKG',
    parentContact: '+91 98941 23011',
    enrolledDate: '2025-06-12',
    status: 'Active',
  },

  // Primary
  {
    id: 'st-s1c1-3',
    churchId: 's1-c1',
    classLevel: 'Primary',
    name: 'Timothy Raj',
    age: 7,
    place: 'Vadasery',
    educationType: 'School',
    schoolStandard: '2nd Standard',
    parentContact: '+91 94420 71829',
    enrolledDate: '2024-06-15',
    status: 'Active',
  },
  {
    id: 'st-s1c1-4',
    churchId: 's1-c1',
    classLevel: 'Primary',
    name: 'Blessy Catherine',
    age: 8,
    place: 'Ramanputhur',
    educationType: 'School',
    schoolStandard: '3rd Standard',
    parentContact: '+91 97891 44521',
    enrolledDate: '2024-06-15',
    status: 'Active',
  },

  // Intermediate
  {
    id: 'st-s1c1-5',
    churchId: 's1-c1',
    classLevel: 'Intermediate',
    name: 'Jason Samuel',
    age: 10,
    place: 'Kottar',
    educationType: 'School',
    schoolStandard: '5th Standard',
    parentContact: '+91 94862 33100',
    enrolledDate: '2023-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c1-6',
    churchId: 's1-c1',
    classLevel: 'Intermediate',
    name: 'Angel Priya',
    age: 11,
    place: 'Parvathipuram',
    educationType: 'School',
    schoolStandard: '6th Standard',
    parentContact: '+91 97510 88219',
    enrolledDate: '2023-06-12',
    status: 'Active',
  },

  // Senior
  {
    id: 'st-s1c1-7',
    churchId: 's1-c1',
    classLevel: 'Senior',
    name: 'Daniel Wesley',
    age: 13,
    place: 'Nagercoil',
    educationType: 'School',
    schoolStandard: '8th Standard',
    parentContact: '+91 94433 19283',
    enrolledDate: '2022-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c1-8',
    churchId: 's1-c1',
    classLevel: 'Senior',
    name: 'Sharon Ruth',
    age: 14,
    place: 'Vetturnimadam',
    educationType: 'School',
    schoolStandard: '9th Standard',
    parentContact: '+91 98421 90123',
    enrolledDate: '2022-06-14',
    status: 'Active',
  },

  // Super Senior
  {
    id: 'st-s1c1-9',
    churchId: 's1-c1',
    classLevel: 'Super Senior',
    name: 'Kevin Immanuel',
    age: 16,
    place: 'Nagercoil',
    educationType: 'School',
    schoolStandard: '11th Standard (Bio-Maths)',
    parentContact: '+91 94422 67890',
    enrolledDate: '2021-06-15',
    status: 'Active',
  },
  {
    id: 'st-s1c1-10',
    churchId: 's1-c1',
    classLevel: 'Super Senior',
    name: 'Sneha Mary',
    age: 19,
    place: 'Nagercoil',
    educationType: 'College',
    collegeDegree: 'B.Sc Nursing (2nd Year)',
    parentContact: '+91 97871 12345',
    enrolledDate: '2020-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c1-11',
    churchId: 's1-c1',
    classLevel: 'Super Senior',
    name: 'Praveen Kumar',
    age: 20,
    place: 'Chunkankadai',
    educationType: 'College',
    collegeDegree: 'B.Tech Information Technology (3rd Year)',
    parentContact: '+91 94430 11990',
    enrolledDate: '2019-06-10',
    status: 'Active',
  },

  // s1-c2 - St. Andrew’s Church
  {
    id: 'st-s1c2-1',
    churchId: 's1-c2',
    classLevel: 'Beginner',
    name: 'Jonathan Paul',
    age: 4,
    place: 'Vadasery',
    educationType: 'School',
    schoolStandard: 'LKG',
    parentContact: '+91 98422 34567',
    enrolledDate: '2025-06-15',
    status: 'Active',
  },
  {
    id: 'st-s1c2-2',
    churchId: 's1-c2',
    classLevel: 'Primary',
    name: 'Rebekah Joy',
    age: 8,
    place: 'Nagercoil',
    educationType: 'School',
    schoolStandard: '3rd Standard',
    parentContact: '+91 97892 45678',
    enrolledDate: '2024-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c2-3',
    churchId: 's1-c2',
    classLevel: 'Intermediate',
    name: 'Benjamin Silas',
    age: 11,
    place: 'Vadasery',
    educationType: 'School',
    schoolStandard: '6th Standard',
    parentContact: '+91 94863 56789',
    enrolledDate: '2023-06-15',
    status: 'Active',
  },
  {
    id: 'st-s1c2-4',
    churchId: 's1-c2',
    classLevel: 'Senior',
    name: 'Esther Keziah',
    age: 13,
    place: 'Erachakulam',
    educationType: 'School',
    schoolStandard: '8th Standard',
    parentContact: '+91 97511 67890',
    enrolledDate: '2022-06-10',
    status: 'Active',
  },
  {
    id: 'st-s1c2-5',
    churchId: 's1-c2',
    classLevel: 'Super Senior',
    name: 'Stephen Victor',
    age: 19,
    place: 'Vadasery',
    educationType: 'College',
    collegeDegree: 'B.Com Corporate Secretaryship',
    parentContact: '+91 94434 78901',
    enrolledDate: '2021-06-15',
    status: 'Active',
  },
]

const defaultVerifications: SundaySchoolClassVerification[] = [
  {
    id: 'ver-s1c1-Beginner',
    churchId: 's1-c1',
    classLevel: 'Beginner',
    academicYear: '2026 - 2027',
    isFinalised: true,
    verifiedBy: 'Prof. S. Jeyakumar (Headmaster Admin)',
    verifiedAt: '2026-10-18T10:30:00Z',
    headmasterNotes: 'Class syllabus verified. Attendance and enrollment registers finalized.',
  },
  {
    id: 'ver-s1c1-Primary',
    churchId: 's1-c1',
    classLevel: 'Primary',
    academicYear: '2026 - 2027',
    isFinalised: true,
    verifiedBy: 'Prof. S. Jeyakumar (Headmaster Admin)',
    verifiedAt: '2026-10-18T10:45:00Z',
    headmasterNotes: 'Roster verified. Ready for district Sunday school exams.',
  },
  {
    id: 'ver-s1c1-Intermediate',
    churchId: 's1-c1',
    classLevel: 'Intermediate',
    academicYear: '2026 - 2027',
    isFinalised: false,
  },
  {
    id: 'ver-s1c1-Senior',
    churchId: 's1-c1',
    classLevel: 'Senior',
    academicYear: '2026 - 2027',
    isFinalised: true,
    verifiedBy: 'Prof. S. Jeyakumar (Headmaster Admin)',
    verifiedAt: '2026-10-19T09:15:00Z',
    headmasterNotes: 'Verified and signed off by the headmaster council.',
  },
  {
    id: 'ver-s1c1-Super Senior',
    churchId: 's1-c1',
    classLevel: 'Super Senior',
    academicYear: '2026 - 2027',
    isFinalised: false,
  },
]

export function getStoredStudents(): SundaySchoolStudent[] {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(defaultStudents))
      return defaultStudents
    }
    return JSON.parse(raw) as SundaySchoolStudent[]
  } catch {
    return defaultStudents
  }
}

export function saveStoredStudents(students: SundaySchoolStudent[]): void {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students))
    window.dispatchEvent(new Event(SUNDAY_SCHOOL_EVENT))
  } catch (err) {
    console.error('Error saving Sunday School students:', err)
  }
}

export function getStoredTeachers(): SundaySchoolTeacher[] {
  try {
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(defaultTeachers))
      return defaultTeachers
    }
    return JSON.parse(raw) as SundaySchoolTeacher[]
  } catch {
    return defaultTeachers
  }
}

export function saveStoredTeachers(teachers: SundaySchoolTeacher[]): void {
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers))
    window.dispatchEvent(new Event(SUNDAY_SCHOOL_EVENT))
  } catch (err) {
    console.error('Error saving Sunday School teachers:', err)
  }
}

export function getStoredVerifications(): SundaySchoolClassVerification[] {
  try {
    const raw = localStorage.getItem(VERIFICATIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(VERIFICATIONS_STORAGE_KEY, JSON.stringify(defaultVerifications))
      return defaultVerifications
    }
    const list = JSON.parse(raw) as SundaySchoolClassVerification[]
    // Automatically sanitize legacy records that mistakenly attributed verification to "District Super Admin"
    let updated = false
    const sanitized = list.map((v) => {
      if (v.verifiedBy && v.verifiedBy.includes('District Super Admin')) {
        updated = true
        const headmaster = getHeadmasterForChurch(v.churchId)
        return {
          ...v,
          verifiedBy: `${headmaster.name} (Headmaster Admin)`,
        }
      }
      return v
    })
    if (updated) {
      localStorage.setItem(VERIFICATIONS_STORAGE_KEY, JSON.stringify(sanitized))
    }
    return sanitized
  } catch {
    return defaultVerifications
  }
}

export function saveStoredVerifications(verifications: SundaySchoolClassVerification[]): void {
  try {
    localStorage.setItem(VERIFICATIONS_STORAGE_KEY, JSON.stringify(verifications))
    window.dispatchEvent(new Event(SUNDAY_SCHOOL_EVENT))
  } catch (err) {
    console.error('Error saving Sunday School verifications:', err)
  }
}

export function getStudentsForChurch(churchId: string, classLevel?: SundaySchoolClassLevel): SundaySchoolStudent[] {
  const all = getStoredStudents()
  return all.filter((s) => s.churchId === churchId && (!classLevel || s.classLevel === classLevel))
}

export function getTeachersForChurch(churchId: string): SundaySchoolTeacher[] {
  const all = getStoredTeachers()
  return all.filter((t) => t.churchId === churchId)
}

export function getClassVerification(churchId: string, classLevel: SundaySchoolClassLevel): SundaySchoolClassVerification {
  const all = getStoredVerifications()
  const existing = all.find((v) => v.churchId === churchId && v.classLevel === classLevel)
  if (existing) return existing
  return {
    id: `ver-${churchId}-${classLevel}`,
    churchId,
    classLevel,
    academicYear: '2026 - 2027',
    isFinalised: false,
  }
}

export function addSundaySchoolStudent(data: Omit<SundaySchoolStudent, 'id' | 'enrolledDate' | 'status'>): SundaySchoolStudent {
  const current = getStoredStudents()
  const newStudent: SundaySchoolStudent = {
    ...data,
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enrolledDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  }
  const next = [...current, newStudent]
  saveStoredStudents(next)
  return newStudent
}

export function deleteSundaySchoolStudent(studentId: string): boolean {
  const current = getStoredStudents()
  const next = current.filter((s) => s.id !== studentId)
  if (next.length === current.length) return false
  saveStoredStudents(next)
  return true
}

export function toggleClassFinalisation(
  churchId: string,
  classLevel: SundaySchoolClassLevel,
  finalise: boolean,
  headmasterName?: string,
  notes: string = ''
): SundaySchoolClassVerification {
  const current = getStoredVerifications()
  const idx = current.findIndex((v) => v.churchId === churchId && v.classLevel === classLevel)

  // Enforce proper Headmaster attribution: District Super Admin is NOT Headmaster Admin
  const churchHeadmaster = getHeadmasterForChurch(churchId)
  const resolvedHeadmaster = (!headmasterName || headmasterName.includes('District Super Admin'))
    ? `${churchHeadmaster.name} (Headmaster Admin)`
    : headmasterName

  const updated: SundaySchoolClassVerification = {
    id: idx >= 0 ? current[idx].id : `ver-${churchId}-${classLevel}`,
    churchId,
    classLevel,
    academicYear: '2026 - 2027',
    isFinalised: finalise,
    verifiedBy: finalise ? resolvedHeadmaster : undefined,
    verifiedAt: finalise ? new Date().toISOString() : undefined,
    headmasterNotes: finalise ? (notes || 'Verified and officially finalised by Headmaster Admin.') : undefined,
  }

  let next: SundaySchoolClassVerification[]
  if (idx >= 0) {
    next = [...current]
    next[idx] = updated
  } else {
    next = [...current, updated]
  }

  saveStoredVerifications(next)
  return updated
}

export function getSundaySchoolStats() {
  const churches = getAllChurchesUnified()
  const students = getStoredStudents()
  const verifications = getStoredVerifications()

  const finalisedCount = verifications.filter((v) => v.isFinalised).length
  const totalClassesTracked = churches.length * 5 // 5 classes per church

  return {
    totalChurches: churches.length,
    totalStudents: students.length,
    finalisedClasses: finalisedCount,
    totalClasses: totalClassesTracked,
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

