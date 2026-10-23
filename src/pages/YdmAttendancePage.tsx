import {
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  Church,
  Clock,
  Eye,
  FileSpreadsheet,
  Filter,
  Lock,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input, Select } from '../components/ui/input'
import { canAccess, canWrite } from '../domain/access'
import {
  addMemberToChurch,
  getAllChurchesUnified,
  getMembersForChurch,
  getSessionForDate,
  getTodayDateString,
  getYdmDistrictStats,
  markAllMembersAttendance,
  recordAttendance,
  toggleMemberAttendance,
  YDM_ATTENDANCE_EVENT,
  type YdmAttendanceSession,
  type YdmMember,
} from '../domain/ydmAttendance'
import type { UserRole } from '../types'

interface YdmAttendancePageProps {
  role: UserRole
}

export function YdmAttendancePage({ role }: YdmAttendancePageProps) {
  // Permission checks
  const hasAccess = canAccess(role, 'YDM attendance')
  const hasWrite = canWrite(role, 'YDM attendance')

  // Search & filter state
  const [churchSearch, setChurchSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('All')
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null)

  // Attendance date & session state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString())
  const [sessionType, setSessionType] = useState<YdmAttendanceSession['sessionType']>('Youth Fellowship')

  // Member search & filter within church
  const [memberSearch, setMemberSearch] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all')

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberGender, setNewMemberGender] = useState<'Male' | 'Female'>('Male')
  const [newMemberCategory, setNewMemberCategory] = useState<YdmMember['category']>('Senior Youth (18-25)')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [modalError, setModalError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  // State sync trigger
  const [, setSyncTicker] = useState(0)

  useEffect(() => {
    const handleSync = () => setSyncTicker((v) => v + 1)
    window.addEventListener(YDM_ATTENDANCE_EVENT, handleSync)
    return () => window.removeEventListener(YDM_ATTENDANCE_EVENT, handleSync)
  }, [])

  // Auto-hide success notices
  useEffect(() => {
    if (!successNotice) return
    const timer = setTimeout(() => setSuccessNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [successNotice])

  // Get data
  const allChurches = useMemo(() => getAllChurchesUnified(), [])
  const stats = useMemo(() => getYdmDistrictStats(), [])

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

  // Members for selected church
  const churchMembers = useMemo(() => {
    if (!selectedChurchId) return []
    return getMembersForChurch(selectedChurchId)
  }, [selectedChurchId])

  // Current session for selected church & date
  const currentSession = useMemo(() => {
    if (!selectedChurchId) return undefined
    return getSessionForDate(selectedChurchId, selectedDate)
  }, [selectedChurchId, selectedDate])

  const presentSet = useMemo(() => {
    return new Set(currentSession?.presentMemberIds || [])
  }, [currentSession])

  // Filtered members inside selected church
  const filteredMembers = useMemo(() => {
    return churchMembers.filter((m) => {
      const query = memberSearch.trim().toLowerCase()
      const matchQuery =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query) ||
        (m.role && m.role.toLowerCase().includes(query)) ||
        m.category.toLowerCase().includes(query)

      const isPresent = presentSet.has(m.id)
      const matchAttendance =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'present' && isPresent) ||
        (attendanceFilter === 'absent' && !isPresent)

      return matchQuery && matchAttendance
    })
  }, [churchMembers, memberSearch, attendanceFilter, presentSet])

  // Calculations for current church session
  const totalCount = churchMembers.length
  const presentCount = presentSet.size
  const absentCount = Math.max(0, totalCount - presentCount)
  const turnoutPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  // Actions
  const handleToggleAttendance = (memberId: string) => {
    if (!hasWrite || !selectedChurchId) return
    toggleMemberAttendance(selectedChurchId, selectedDate, memberId, sessionType, `${roleName(role)}`)
  }

  const handleMarkAll = (present: boolean) => {
    if (!hasWrite || !selectedChurchId) return
    markAllMembersAttendance(selectedChurchId, selectedDate, present, sessionType, `${roleName(role)}`)
    setSuccessNotice(present ? 'Marked all members as Present for this date.' : 'Cleared attendance marks.')
  }

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasWrite || !selectedChurchId) return

    const trimmedName = newMemberName.trim()
    if (!trimmedName) {
      setModalError('Please enter the full name of the youth member.')
      return
    }

    const created = addMemberToChurch({
      churchId: selectedChurchId,
      name: trimmedName,
      phone: newMemberPhone.trim() || '+91 90000 00000',
      gender: newMemberGender,
      category: newMemberCategory,
      role: newMemberRole.trim() || 'Youth Member',
    })

    // Automatically mark the newly added member present for today's session if active
    if (selectedDate === getTodayDateString()) {
      const sess = getSessionForDate(selectedChurchId, selectedDate)
      const currentPresent = sess?.presentMemberIds || []
      if (!currentPresent.includes(created.id)) {
        recordAttendance({
          churchId: selectedChurchId,
          date: selectedDate,
          sessionType,
          presentMemberIds: [...currentPresent, created.id],
          markedBy: `${roleName(role)}`,
        })
      }
    }

    // Reset and close
    setNewMemberName('')
    setNewMemberPhone('')
    setNewMemberRole('')
    setModalError('')
    setIsAddModalOpen(false)
    setSuccessNotice(`Added ${trimmedName} to ${selectedChurch?.name} roster!`)
  }

  // Access denied screen if role has no permission
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center max-w-xl mx-auto my-12">
          <div className="size-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted to YDM Attendance
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Your current role does not have permission to access the <strong>YDM Attendance</strong> section.
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
              District Youth Department
            </span>
            {hasWrite ? (
              <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold text-[11px] px-2 py-0.5">
                <CheckCircle2 size={12} className="mr-1 inline" /> Full Management Access
              </Badge>
            ) : (
              <Badge className="bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-semibold text-[11px] px-2 py-0.5">
                <Eye size={12} className="mr-1 inline" /> View-Only Access
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1 flex items-center gap-2">
            <span>YDM attendance</span>
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Search churches across the district to manage youth member rosters and record session attendance.
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

      {/* View-Only Mode Banner */}
      {!hasWrite && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 text-xs font-medium flex items-center gap-2.5">
          <Eye size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>View-Only Mode:</strong> The District Super Admin has granted your role view access. You can explore all church rosters, youth member records, and attendance history across the district.
          </span>
        </div>
      )}

      {/* Overview Metrics Cards (2x2 on mobile) */}
      <div className="metrics">
        <Metric
          icon={Church}
          label="Churches Monitored"
          value={String(stats.totalChurches)}
          tone="blue"
          subtext="Active YDM Assemblies"
        />
        <Metric
          icon={Users}
          label="Total YDM Members"
          value={String(stats.totalMembers)}
          tone="green"
          subtext="Enrolled youth registry"
        />
        <Metric
          icon={UserCheck}
          label="Today's Present"
          value={String(stats.todayPresent)}
          tone="orange"
          subtext="Attended today's meetings"
        />
        <Metric
          icon={CalendarCheck}
          label="Attendance Turnout"
          value={`${stats.overallAttendanceRate}%`}
          tone="violet"
          subtext="District-wide avg rate"
        />
      </div>

      {/* Main Workspace: If no church is selected, show church search directory */}
      {!selectedChurch ? (
        <div className="space-y-4">
          {/* Church Search & Section Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={churchSearch}
                  onChange={(e) => setChurchSearch(e.target.value)}
                  placeholder="Search name of church, pastor, town, or address..."
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
              <span>Showing <strong>{filteredChurches.length}</strong> churches</span>
              <span>Click on any church to inspect members & mark attendance</span>
            </div>
          </div>

          {/* Churches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChurches.map((church) => {
              const members = getMembersForChurch(church.id)
              const todaySess = getSessionForDate(church.id, getTodayDateString())
              const todayPresent = todaySess ? todaySess.presentMemberIds.length : 0
              const rate = members.length > 0 && todaySess ? Math.round((todayPresent / members.length) * 100) : null

              return (
                <Card
                  key={church.id}
                  onClick={() => setSelectedChurchId(church.id)}
                  className="p-4 cursor-pointer hover:border-district-400 dark:hover:border-district-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="size-10 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Church size={20} />
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
                      Pastor: {church.pastor}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Users size={13} className="text-district-500" />
                      <span>{members.length} youth members</span>
                    </span>

                    {rate !== null ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[11px]">
                        Today: {rate}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Not marked today
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredChurches.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Church size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No churches found matching "{churchSearch}"
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching by a different name or switch section filters.
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
        /* Selected Church Attendance Workspace */
        <div className="space-y-5">
          {/* Church Selected Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-12 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0">
                <Church size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedChurch.name}
                  </h2>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedChurch.section}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedChurch.address} · Presiding Pastor: <strong>{selectedChurch.pastor}</strong>
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              {hasWrite && (
                <Button
                  onClick={() => {
                    setModalError('')
                    setIsAddModalOpen(true)
                  }}
                  className="shadow-xs text-xs h-9 bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white"
                >
                  <UserPlus size={15} className="mr-1.5" />
                  <span>Add New Member</span>
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

          {/* Attendance Controls Bar: Date Picker, Session Type, & Bulk Actions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Date & Session Selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-district-600 shrink-0" />
                  <label htmlFor="ydm-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Attendance Date:
                  </label>
                  <Input
                    id="ydm-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-8 text-xs w-36 font-semibold bg-white dark:bg-slate-800"
                  />
                  {selectedDate !== getTodayDateString() && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(getTodayDateString())}
                      className="text-[11px] font-semibold text-district-600 dark:text-district-400 hover:underline"
                    >
                      Jump to Today
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-500 shrink-0" />
                  <label htmlFor="ydm-session" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Session:
                  </label>
                  <Select
                    id="ydm-session"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as YdmAttendanceSession['sessionType'])}
                    className="h-8 text-xs font-semibold bg-white dark:bg-slate-800 py-0"
                  >
                    <option value="Youth Fellowship">Youth Fellowship</option>
                    <option value="Sunday Youth Service">Sunday Youth Service</option>
                    <option value="Midweek Prayer">Midweek Prayer</option>
                    <option value="Bible Study">Bible Study</option>
                    <option value="Outreach">Outreach</option>
                  </Select>
                </div>
              </div>

              {/* Bulk Attendance Buttons (Only for Edit/Manage access) */}
              {hasWrite ? (
                <div className="flex items-center gap-2 self-start lg:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll(true)}
                    className="h-8 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <Check size={13} className="mr-1" />
                    <span>Mark All Present</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll(false)}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>Clear All</span>
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                  <span>Attendance sheet is view-only for your role.</span>
                </div>
              )}
            </div>

            {/* Turnout Progress Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {turnoutPercent}% Turnout
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {presentCount} Present
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  {absentCount} Absent
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  Total: {totalCount} members
                </span>
              </div>

              {/* Graphical Progress Bar */}
              <div className="w-full sm:w-48 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${turnoutPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Member Roster Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member by name, phone, or role..."
                className="pl-8 pr-8 h-9 text-xs"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Attendance Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs self-start sm:self-center">
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  attendanceFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('present')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  attendanceFilter === 'present'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('absent')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  attendanceFilter === 'absent'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>
          </div>

          {/* Members Attendance List / Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => {
                const isPresent = presentSet.has(member.id)
                const initials = member.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()

                return (
                  <div
                    key={member.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Member Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {member.name}
                          </strong>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {member.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {member.role && (
                            <span className="text-district-600 dark:text-district-400 font-medium">
                              {member.role}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" />
                            <a href={`tel:${member.phone}`} className="hover:underline">
                              {member.phone}
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Marking / Status */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {hasWrite ? (
                        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(member.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                            }`}
                          >
                            <Check size={13} strokeWidth={2.5} />
                            <span>Present</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(member.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              !isPresent
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <X size={13} strokeWidth={2.5} />
                            <span>Absent</span>
                          </button>
                        </div>
                      ) : (
                        // View-Only Badge
                        <div className="shrink-0">
                          {isPresent ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-bold px-3 py-1">
                              <Check size={13} className="mr-1 inline" /> Present
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 text-xs font-medium px-3 py-1">
                              <X size={13} className="mr-1 inline" /> Absent
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  No youth members match the current filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal Dialog */}
      {selectedChurch && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-district-50 dark:bg-district-950/60 text-district-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <DialogTitle className="text-lg font-bold">Add YDM Member</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Add a new youth member to <strong>{selectedChurch.name}</strong>. They will immediately appear on the attendance roster.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4 mt-3">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Samuel Raj"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <Input
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <Select
                    value={newMemberGender}
                    onChange={(e) => setNewMemberGender(e.target.value as 'Male' | 'Female')}
                    className="h-9 text-xs py-0"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <Select
                    value={newMemberCategory}
                    onChange={(e) => setNewMemberCategory(e.target.value as YdmMember['category'])}
                    className="h-9 text-xs py-0"
                  >
                    <option value="Junior Youth (13-17)">Junior Youth (13-17)</option>
                    <option value="Senior Youth (18-25)">Senior Youth (18-25)</option>
                    <option value="Young Adult (26-35)">Young Adult (26-35)</option>
                    <option value="Youth Leader">Youth Leader</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ministry Role
                  </label>
                  <Input
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    placeholder="e.g. Worship Lead / Member"
                    className="h-9 text-xs"
                  />
                </div>
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
                  <span>Save Member</span>
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
    default:
      return /^section[1-4]$/.test(role) ? `Section ${role.replace('section', '')} Super Admin` : 'Administrator'
  }
}
