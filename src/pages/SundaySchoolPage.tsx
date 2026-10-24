import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Church,
  Clock,
  Eye,
  FileCheck,
  GraduationCap,
  Lock,
  Phone,
  Plus,
  School,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Metric } from '../components/shared/Metric'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input, Select } from '../components/ui/input'
import { canAccess, canWrite } from '../domain/access'
import {
  addSundaySchoolStudent,
  CLASS_METADATA,
  deleteSundaySchoolStudent,
  getAllChurchesUnified,
  getClassVerification,
  getHeadmasterForChurch,
  getStudentsForChurch,
  getSundaySchoolStats,
  getTeachersForChurch,
  SUNDAY_SCHOOL_CLASSES,
  SUNDAY_SCHOOL_EVENT,
  SundaySchoolClassLevel,
  SundaySchoolStudent,
  SundaySchoolTeacher,
  toggleClassFinalisation,
} from '../domain/sundaySchool'
import type { AccountType, UserRole } from '../types'

interface SundaySchoolPageProps {
  role: UserRole
  accountType?: AccountType
  churchId?: string | null
}

export function SundaySchoolPage({ role, accountType, churchId }: SundaySchoolPageProps) {
  // Permission checks
  const hasAccess = canAccess(role, 'Sunday school')
  const hasWrite = canWrite(role, 'Sunday school')
  const isHeadmasterRole = role === 'headmaster-admin'
  const isTeacherRole = role === 'teacher-admin'
  const isDistrictRole = role === 'district'
  // Verification belongs to Headmaster Admin of that church; District Admin can oversee
  const canVerify = role === 'headmaster-admin' || role === 'district'

  // Search & filter state
  const [churchSearch, setChurchSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('All')
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(churchId || null)

  // Active view tab inside selected church: 'classes' (Headmaster view) or 'students' (Class Teacher view)
  const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes')
  const [selectedClassLevel, setSelectedClassLevel] = useState<SundaySchoolClassLevel>('Beginner')
  const [studentSearch, setStudentSearch] = useState('')

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentAge, setNewStudentAge] = useState<number>(5)
  const [newStudentPlace, setNewStudentPlace] = useState('')
  const [newStudentEducationType, setNewStudentEducationType] = useState<'School' | 'College'>('School')
  const [newStudentSchoolStd, setNewStudentSchoolStd] = useState('1st Standard')
  const [newStudentCollegeDegree, setNewStudentCollegeDegree] = useState('')
  const [newStudentParentContact, setNewStudentParentContact] = useState('')
  const [modalClassLevel, setModalClassLevel] = useState<SundaySchoolClassLevel>('Beginner')
  const [modalError, setModalError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  // State sync ticker
  const [, setSyncTicker] = useState(0)

  useEffect(() => {
    const handleSync = () => setSyncTicker((v) => v + 1)
    window.addEventListener(SUNDAY_SCHOOL_EVENT, handleSync)
    return () => window.removeEventListener(SUNDAY_SCHOOL_EVENT, handleSync)
  }, [])

  useEffect(() => {
    if (!successNotice) return
    const timer = setTimeout(() => setSuccessNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [successNotice])

  const allChurches = useMemo(() => getAllChurchesUnified(), [])
  const stats = useMemo(() => getSundaySchoolStats(), [])

  // Filter churches
  const filteredChurches = useMemo(() => {
    return allChurches.filter((c) => {
      const matchSection = selectedSection === 'All' || c.section === selectedSection
      const query = churchSearch.trim().toLowerCase()
      const matchQuery =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.section.toLowerCase().includes(query) ||
        c.pastor.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query)
      return matchSection && matchQuery
    })
  }, [allChurches, selectedSection, churchSearch])

  // Selected church
  const selectedChurch = useMemo(() => {
    if (!selectedChurchId) return null
    return allChurches.find((c) => c.id === selectedChurchId) || null
  }, [allChurches, selectedChurchId])

  // Church specific data
  const churchStudents = useMemo(() => {
    if (!selectedChurchId) return []
    return getStudentsForChurch(selectedChurchId)
  }, [selectedChurchId])

  const churchTeachers = useMemo(() => {
    if (!selectedChurchId) return []
    return getTeachersForChurch(selectedChurchId)
  }, [selectedChurchId])

  // Filtered students within church
  const filteredStudents = useMemo(() => {
    return churchStudents.filter((s) => {
      const matchClass = s.classLevel === selectedClassLevel
      const query = studentSearch.trim().toLowerCase()
      const matchQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.place.toLowerCase().includes(query) ||
        (s.schoolStandard && s.schoolStandard.toLowerCase().includes(query)) ||
        (s.collegeDegree && s.collegeDegree.toLowerCase().includes(query)) ||
        (s.parentContact && s.parentContact.toLowerCase().includes(query))
      return matchClass && matchQuery
    })
  }, [churchStudents, selectedClassLevel, studentSearch])

  // Verification status for all 5 classes
  const verificationsMap = useMemo(() => {
    if (!selectedChurchId) return {} as Record<SundaySchoolClassLevel, ReturnType<typeof getClassVerification>>
    const map = {} as Record<SundaySchoolClassLevel, ReturnType<typeof getClassVerification>>
    for (const lvl of SUNDAY_SCHOOL_CLASSES) {
      map[lvl] = getClassVerification(selectedChurchId, lvl)
    }
    return map
  }, [selectedChurchId, SUNDAY_SCHOOL_CLASSES])

  // Teacher map by class
  const teachersMap = useMemo(() => {
    const map = {} as Record<SundaySchoolClassLevel, SundaySchoolTeacher | undefined>
    for (const t of churchTeachers) {
      map[t.classLevel] = t
    }
    return map
  }, [churchTeachers])

  // Church Headmaster Admin details
  const churchHeadmaster = useMemo(() => {
    if (!selectedChurchId) return null
    return getHeadmasterForChurch(selectedChurchId)
  }, [selectedChurchId])

  // Headmaster Verify / Finalise action
  // Note: District Super Admin is NOT Headmaster Admin; verification is attributed to Church Headmaster Admin
  const handleVerifyClass = (classLevel: SundaySchoolClassLevel, finalise: boolean) => {
    if (!hasWrite || !selectedChurchId) return
    const headmaster = getHeadmasterForChurch(selectedChurchId)
    const headmasterName = `${headmaster.name} (Headmaster Admin)`
    toggleClassFinalisation(selectedChurchId, classLevel, finalise, headmasterName)
    setSuccessNotice(
      finalise
        ? `Successfully verified & finalised ${classLevel} Class roster by Headmaster Admin (${headmaster.name})!`
        : `Reopened ${classLevel} Class for teacher revisions.`
    )
  }

  // Add student submit
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasWrite || !selectedChurchId) return

    const trimmedName = newStudentName.trim()
    if (!trimmedName) {
      setModalError('Please enter student full name.')
      return
    }

    addSundaySchoolStudent({
      churchId: selectedChurchId,
      classLevel: modalClassLevel,
      name: trimmedName,
      age: Number(newStudentAge) || 5,
      place: newStudentPlace.trim() || 'Nagercoil',
      educationType: newStudentEducationType,
      schoolStandard: newStudentEducationType === 'School' ? newStudentSchoolStd.trim() : undefined,
      collegeDegree: newStudentEducationType === 'College' ? newStudentCollegeDegree.trim() : undefined,
      parentContact: newStudentParentContact.trim() || undefined,
    })

    // Reset and close
    setNewStudentName('')
    setNewStudentAge(7)
    setNewStudentPlace('')
    setNewStudentCollegeDegree('')
    setModalError('')
    setIsAddModalOpen(false)
    setSuccessNotice(`Added new student ${trimmedName} to ${modalClassLevel} Class!`)
  }

  // Delete student
  const handleDeleteStudent = (studentId: string, name: string) => {
    if (!hasWrite) return
    if (window.confirm(`Are you sure you want to remove ${name} from this Sunday class?`)) {
      deleteSundaySchoolStudent(studentId)
      setSuccessNotice(`Removed ${name} from Sunday class.`)
    }
  }

  // Access Denied Screen
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center max-w-xl mx-auto my-12">
          <div className="size-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted to Sunday School
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Your current role does not have permission to access the <strong>Sunday school</strong> section.
          </p>
          <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-300">
            Please ask the <strong>District Super Admin</strong> to grant you <strong>View</strong> or <strong>Edit</strong> access in the <strong>Access Control</strong> workspace.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
              Christian Education Ministry
            </span>
            {isDistrictRole ? (
              <Badge className="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-semibold text-[11px] px-2 py-0.5">
                <ShieldCheck size={12} className="mr-1 inline" /> District Super Admin Oversight
              </Badge>
            ) : isHeadmasterRole ? (
              <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold text-[11px] px-2 py-0.5">
                <Award size={12} className="mr-1 inline" /> Headmaster Admin Access
              </Badge>
            ) : isTeacherRole ? (
              <Badge className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold text-[11px] px-2 py-0.5">
                <Users size={12} className="mr-1 inline" /> Sunday Teacher Admin Access
              </Badge>
            ) : hasWrite ? (
              <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold text-[11px] px-2 py-0.5">
                <CheckCircle2 size={12} className="mr-1 inline" /> {roleName(role)} Access
              </Badge>
            ) : (
              <Badge className="bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-semibold text-[11px] px-2 py-0.5">
                <Eye size={12} className="mr-1 inline" /> View-Only Access
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1 flex items-center gap-2">
            <span>Sunday school</span>
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Sunday teacher admins enroll students by class (Beginner, Primary, Intermediate, Senior, Super Senior), and Headmaster admins verify and finalise the official class rosters.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {selectedChurch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedChurchId(null)}
              className="text-xs"
            >
              <ChevronLeft size={14} className="mr-1" />
              <span>All Churches</span>
            </Button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button type="button" onClick={() => setSuccessNotice('')} className="p-1 hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Overview Metrics Cards (2x2 on mobile, 4 columns on desktop) */}
      <div className="metrics grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <Metric
          icon={Church}
          label="Sunday Schools"
          value={String(stats.totalChurches)}
          tone="blue"
          subtext="Parish Sunday schools"
        />
        <Metric
          icon={GraduationCap}
          label="Enrolled Students"
          value={String(stats.totalStudents)}
          tone="green"
          subtext="Across 5 class levels"
        />
        <Metric
          icon={FileCheck}
          label="Finalised Classes"
          value={`${stats.finalisedClasses} / ${stats.totalClasses}`}
          tone="orange"
          subtext="Headmaster verified"
        />
        <Metric
          icon={BookOpen}
          label="Active Class Levels"
          value="5 Levels"
          tone="violet"
          subtext="Beginner to Super Senior"
        />
      </div>

      {/* Main Workspace: If No Church Selected, Show Church Search Directory */}
      {!selectedChurch ? (
        <div className="space-y-4">
          {/* Search & Section Filter */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={churchSearch}
                  onChange={(e) => setChurchSearch(e.target.value)}
                  placeholder="Search Sunday school by church name, pastor, town, or section..."
                  className="pl-9 pr-8 h-10 text-xs sm:text-sm"
                />
                {churchSearch && (
                  <button
                    type="button"
                    onClick={() => setChurchSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Section Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Section 1', 'Section 2', 'Section 3', 'Section 4'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedSection === sec
                        ? 'bg-[var(--color-district-600)] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Showing <strong>{filteredChurches.length}</strong> church Sunday schools</span>
              <span>Click any church to open teacher admin classes & headmaster verification</span>
            </div>
          </div>

          {/* Churches Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChurches.map((church) => {
              const students = getStudentsForChurch(church.id)
              const teachers = getTeachersForChurch(church.id)

              return (
                <Card
                  key={church.id}
                  onClick={() => setSelectedChurchId(church.id)}
                  className="p-4 cursor-pointer hover:border-district-400 dark:hover:border-district-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="size-10 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap size={20} />
                      </div>
                      <Badge variant="outline" className="text-[11px] font-medium shrink-0">
                        {church.section}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-3 group-hover:text-district-600 dark:group-hover:text-district-400 transition-colors">
                      {church.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {church.address}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                      Presiding Pastor: <strong>{church.pastor}</strong>
                    </p>

                    {/* Classes Breakdown Pills */}
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {SUNDAY_SCHOOL_CLASSES.map((lvl) => {
                        const count = students.filter((s) => s.classLevel === lvl).length
                        return (
                          <span
                            key={lvl}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {lvl}: {count}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users size={14} className="text-district-500" />
                      <span>{students.length} Students Enrolled</span>
                    </span>

                    <span className="text-[11px] font-semibold text-district-600 dark:text-district-400 group-hover:underline">
                      Manage Sunday School →
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredChurches.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <School size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Sunday schools found matching "{churchSearch}"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChurchSearch('')
                  setSelectedSection('All')
                }}
                className="mt-3"
              >
                Reset Search
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Selected Church Sunday School Workspace */
        <div className="space-y-5">
          {/* Church Selected Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-12 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0">
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedChurch.name} — Sunday School
                  </h2>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedChurch.section}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedChurch.address} · Presiding Pastor: <strong>{selectedChurch.pastor}</strong>
                  {churchHeadmaster && (
                    <span> · Sunday School Headmaster: <strong>{churchHeadmaster.name}</strong> ({churchHeadmaster.phone})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              {hasWrite && (
                <Button
                  onClick={() => {
                    setModalClassLevel(selectedClassLevel)
                    setModalError('')
                    setIsAddModalOpen(true)
                  }}
                  className="shadow-xs text-xs h-9 bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white"
                >
                  <UserPlus size={15} className="mr-1.5" />
                  <span>Add New Student</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedChurchId(null)}
                className="text-xs h-9"
              >
                <span>Change Church</span>
              </Button>
            </div>
          </div>

          {/* Perspective View Switcher: Classes Overview vs Student Registry */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'classes'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Classes & Headmaster Verification</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              <span>Sunday Teacher Admin: Student Rosters</span>
            </button>
          </div>

          {/* TAB 1: Classes & Headmaster Verification View */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <strong>Headmaster Verification Console:</strong> Review all 5 Sunday school classes and their assigned teacher admins. Official roster verifications are certified by Church <strong>Headmaster Admin</strong> ({churchHeadmaster?.name || 'Headmaster Admin'}).
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Headmaster: {churchHeadmaster?.name || 'Headmaster Admin'} · Total Students: {churchStudents.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUNDAY_SCHOOL_CLASSES.map((classLvl) => {
                  const meta = CLASS_METADATA[classLvl]
                  const teacher = teachersMap[classLvl]
                  const students = churchStudents.filter((s) => s.classLevel === classLvl)
                  const verification = verificationsMap[classLvl]

                  return (
                    <Card
                      key={classLvl}
                      className="p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div>
                        {/* Class Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${meta.color}`}>
                              {classLvl} Class
                            </span>
                            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                              {meta.ageRange}
                            </span>
                          </div>

                          {/* Verification Status Pill */}
                          {verification.isFinalised ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[11px] font-bold px-2 py-0.5 shrink-0">
                              <CheckCircle2 size={12} className="mr-1 inline" /> Finalised
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[11px] font-bold px-2 py-0.5 shrink-0">
                              <Clock size={12} className="mr-1 inline" /> Verification Pending
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          {meta.description}
                        </p>

                        {/* Teacher Admin Card */}
                        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Sunday Teacher Admin
                          </span>
                          <strong className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                            {teacher?.name || 'Assigned Class Teacher'}
                          </strong>
                          {teacher?.phone && (
                            <a href={`tel:${teacher.phone}`} className="text-xs text-district-600 dark:text-district-400 hover:underline flex items-center gap-1 font-medium">
                              <Phone size={11} /> {teacher.phone}
                            </a>
                          )}
                        </div>

                        {/* Students count */}
                        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Enrolled: <strong>{students.length} students</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClassLevel(classLvl)
                              setActiveTab('students')
                            }}
                            className="text-district-600 dark:text-district-400 hover:underline font-semibold"
                          >
                            View Roster →
                          </button>
                        </div>
                      </div>

                      {/* Headmaster Verification Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {verification.isFinalised ? (
                          <div className="space-y-2">
                            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <div>✓ {verification.headmasterNotes || 'Verified and officially finalised by Headmaster Admin.'}</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                                By {verification.verifiedBy}
                              </div>
                            </div>
                            {canVerify && (
                              <button
                                type="button"
                                onClick={() => handleVerifyClass(classLvl, false)}
                                className="text-[11px] text-slate-500 hover:text-rose-600 underline font-medium"
                              >
                                Reopen class for edits
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            {canVerify ? (
                              <Button
                                size="sm"
                                onClick={() => handleVerifyClass(classLvl, true)}
                                className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                              >
                                <CheckCircle2 size={13} className="mr-1.5" />
                                <span>Verify & Finalise Class</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Awaiting Headmaster verification ({churchHeadmaster?.name})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Sunday Teacher Admin - Student Roster by Class */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Class Level Switcher Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {SUNDAY_SCHOOL_CLASSES.map((classLvl) => {
                  const count = churchStudents.filter((s) => s.classLevel === classLvl).length
                  const isFinal = verificationsMap[classLvl]?.isFinalised

                  return (
                    <button
                      key={classLvl}
                      type="button"
                      onClick={() => setSelectedClassLevel(classLvl)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                        selectedClassLevel === classLvl
                          ? 'bg-[var(--color-district-600)] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{classLvl} Class</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        selectedClassLevel === classLvl ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {count}
                      </span>
                      {isFinal && (
                        <Check size={12} className={selectedClassLevel === classLvl ? 'text-emerald-200' : 'text-emerald-600'} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Class Info & Controls Bar */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {selectedClassLevel} Class Roster
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${CLASS_METADATA[selectedClassLevel].color}`}>
                      {CLASS_METADATA[selectedClassLevel].ageRange}
                    </span>
                    {verificationsMap[selectedClassLevel]?.isFinalised ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 text-[10px] font-bold">
                        Finalised
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 text-[10px] font-bold">
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sunday Teacher Admin: <strong>{teachersMap[selectedClassLevel]?.name || 'Assigned Class Teacher'}</strong> ({teachersMap[selectedClassLevel]?.phone || 'Contact pending'})
                    {churchHeadmaster && (
                      <span> · Headmaster Admin: <strong>{churchHeadmaster.name}</strong></span>
                    )}
                  </p>
                </div>

                {/* Search in class */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student, place, std, or degree..."
                      className="pl-8 pr-8 h-9 text-xs bg-white dark:bg-slate-800"
                    />
                    {studentSearch && (
                      <button
                        type="button"
                        onClick={() => setStudentSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {hasWrite && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setModalClassLevel(selectedClassLevel)
                        setModalError('')
                        setIsAddModalOpen(true)
                      }}
                      className="text-xs h-9 bg-[var(--color-district-600)] text-white shrink-0"
                    >
                      <Plus size={14} className="mr-1" />
                      <span>Add Student</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const initials = student.name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <Card
                      key={student.id}
                      className="p-4 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Student Name & Initials */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {student.name}
                              </h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Age {student.age} · {student.place}
                              </span>
                            </div>
                          </div>

                          {hasWrite && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Remove student from class"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Education Details: School Standard or College Degree */}
                        <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              {student.educationType === 'School' ? 'Schooling' : 'College Education'}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {student.educationType}
                            </span>
                          </div>

                          {student.educationType === 'School' ? (
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 pt-0.5">
                              <School size={13} className="text-district-500 shrink-0" />
                              <span>{student.schoolStandard || 'School Student'}</span>
                            </div>
                          ) : (
                            <div className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 pt-0.5">
                              <GraduationCap size={13} className="text-emerald-500 shrink-0" />
                              <span>{student.collegeDegree || 'College Student'}</span>
                            </div>
                          )}
                        </div>

                        {student.parentContact && (
                          <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400" />
                            <span>Parent: <a href={`tel:${student.parentContact}`} className="hover:underline text-slate-700 dark:text-slate-300 font-medium">{student.parentContact}</a></span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <span>Joined: {student.enrolledDate}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Active Student
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {filteredStudents.length === 0 && (
                <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <GraduationCap size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No students enrolled in {selectedClassLevel} Class yet.
                  </p>
                  {hasWrite && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setModalClassLevel(selectedClassLevel)
                        setIsAddModalOpen(true)
                      }}
                      className="mt-3 text-xs bg-[var(--color-district-600)] text-white"
                    >
                      <Plus size={14} className="mr-1" />
                      <span>Enroll First Student</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add New Student Modal Dialog */}
      {selectedChurch && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-district-50 dark:bg-district-950/60 text-district-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <DialogTitle className="text-lg font-bold">Enroll Sunday School Student</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Add a new student to <strong>{selectedChurch.name}</strong> Sunday school roster.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 mt-3">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200">
                  {modalError}
                </div>
              )}

              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Timothy Samuel"
                  className="h-9 text-xs"
                />
              </div>

              {/* Class Level & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sunday Class Level
                  </label>
                  <Select
                    value={modalClassLevel}
                    onChange={(e) => setModalClassLevel(e.target.value as SundaySchoolClassLevel)}
                    className="h-9 text-xs py-0"
                  >
                    {SUNDAY_SCHOOL_CLASSES.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} Class
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    min={2}
                    max={30}
                    value={newStudentAge}
                    onChange={(e) => setNewStudentAge(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Place / Town */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Place / Village / Town <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={newStudentPlace}
                  onChange={(e) => setNewStudentPlace(e.target.value)}
                  placeholder="e.g. Nagercoil / Vadasery / Chunkankadai"
                  className="h-9 text-xs"
                />
              </div>

              {/* Education Type: School or College */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Education Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStudentEducationType('School')}
                    className={`h-9 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                      newStudentEducationType === 'School'
                        ? 'bg-district-50 dark:bg-district-950/60 border-district-400 text-district-700 dark:text-district-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <School size={14} />
                    <span>School Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStudentEducationType('College')}
                    className={`h-9 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                      newStudentEducationType === 'College'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <GraduationCap size={14} />
                    <span>College Student</span>
                  </button>
                </div>
              </div>

              {/* Dynamic field based on Education */}
              {newStudentEducationType === 'School' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    School Class / Standard <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={newStudentSchoolStd}
                    onChange={(e) => setNewStudentSchoolStd(e.target.value)}
                    placeholder="e.g. 5th Standard / 10th Standard"
                    className="h-9 text-xs"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    College Degree & Branch <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={newStudentCollegeDegree}
                    onChange={(e) => setNewStudentCollegeDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science / B.Sc Nursing"
                    className="h-9 text-xs"
                  />
                </div>
              )}

              {/* Parent Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Parent / Guardian Contact (Optional)
                </label>
                <Input
                  value={newStudentParentContact}
                  onChange={(e) => setNewStudentParentContact(e.target.value)}
                  placeholder="+91 94430 00000"
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white"
                >
                  <Plus size={14} className="mr-1" />
                  <span>Enroll Student</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function roleName(role: UserRole): string {
  switch (role) {
    case 'district':
      return 'District Super Admin'
    case 'head-pastor':
      return 'Head Pastor'
    case 'think-tank':
      return 'Think Tank Admin'
    case 'section-pastor':
      return 'Section Pastor Admin'
    case 'church-pastor':
      return 'Pastor of Church'
    case 'district-ydm':
      return 'District YDM Leader'
    case 'district-women':
      return 'District Women Leader'
    case 'headmaster-admin':
      return 'Headmaster Admin'
    case 'teacher-admin':
      return 'Teacher Admin'
    default:
      return /^section[1-4]$/.test(role) ? `Section ${role.replace('section', '')} Super Admin` : 'Administrator'
  }
}

