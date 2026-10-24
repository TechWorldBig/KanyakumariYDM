import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Church,
  Eye,
  FileText,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
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
  addCommitteeMember,
  deleteCommitteeMember,
  getAllChurchesUnified,
  getChurchCommitteeStats,
  getCommitteeMembersForChurch,
  CHURCH_COMMITTEE_EVENT,
  type CommitteeMember,
} from '../domain/churchCommittee'
import type { AccountType, UserRole } from '../types'

interface ChurchCommitteePageProps {
  role: UserRole
  accountType?: AccountType
  churchId?: string | null
}

const roleBadgeColors: Record<string, string> = {
  'Committee Chair': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
  'President': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
  'Vice President': 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-700',
  'Secretary': 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700',
  'Joint Secretary': 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-700',
  'Treasurer': 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700',
  'Auditor': 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-700',
  'Senior Deacon': 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700',
  'Trustee': 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  'Youth Representative': 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-700',
  'Women Representative': 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700',
  'Committee Member': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
}

export function ChurchCommitteePage({ role, accountType, churchId }: ChurchCommitteePageProps) {
  // Permission checks
  const hasAccess = canAccess(role, 'Church committee')
  const hasWrite = canWrite(role, 'Church committee')

  // Search & filter state
  const [churchSearch, setChurchSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('All')
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(churchId || null)

  // Committee members filter within selected church
  const [memberSearch, setMemberSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Executives' | 'Representatives' | 'Deacons'>('All')

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('Committee Member')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newGender, setNewGender] = useState<'Male' | 'Female'>('Male')
  const [newTerm, setNewTerm] = useState('2024 - 2027')
  const [newResponsibilities, setNewResponsibilities] = useState('')
  const [modalError, setModalError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  // State sync ticker
  const [, setSyncTicker] = useState(0)

  useEffect(() => {
    const handleSync = () => setSyncTicker((v) => v + 1)
    window.addEventListener(CHURCH_COMMITTEE_EVENT, handleSync)
    return () => window.removeEventListener(CHURCH_COMMITTEE_EVENT, handleSync)
  }, [])

  useEffect(() => {
    if (!successNotice) return
    const timer = setTimeout(() => setSuccessNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [successNotice])

  const allChurches = useMemo(() => getAllChurchesUnified(), [])
  const stats = useMemo(() => getChurchCommitteeStats(), [])

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

  // Committee members for selected church
  const churchMembers = useMemo(() => {
    if (!selectedChurchId) return []
    return getCommitteeMembersForChurch(selectedChurchId)
  }, [selectedChurchId])

  // Filtered members within selected church
  const filteredMembers = useMemo(() => {
    return churchMembers.filter((m) => {
      const query = memberSearch.trim().toLowerCase()
      const matchQuery =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query) ||
        (m.email && m.email.toLowerCase().includes(query)) ||
        (m.responsibilities && m.responsibilities.toLowerCase().includes(query))

      let matchRole = true
      if (roleFilter === 'Executives') {
        matchRole = ['Chair', 'President', 'Secretary', 'Treasurer', 'Auditor'].some((r) =>
          m.role.toLowerCase().includes(r.toLowerCase())
        )
      } else if (roleFilter === 'Representatives') {
        matchRole = m.role.toLowerCase().includes('representative')
      } else if (roleFilter === 'Deacons') {
        matchRole = m.role.toLowerCase().includes('deacon') || m.role.toLowerCase().includes('trustee')
      }

      return matchQuery && matchRole
    })
  }, [churchMembers, memberSearch, roleFilter])

  // Add Member Submit
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasWrite || !selectedChurchId) return

    const trimmedName = newName.trim()
    if (!trimmedName) {
      setModalError('Please enter the committee member full name.')
      return
    }

    addCommitteeMember({
      churchId: selectedChurchId,
      name: trimmedName,
      role: newRole.trim() || 'Committee Member',
      phone: newPhone.trim() || '+91 94430 00000',
      email: newEmail.trim() || undefined,
      gender: newGender,
      term: newTerm.trim() || '2024 - 2027',
      responsibilities: newResponsibilities.trim() || undefined,
    })

    // Reset and close
    setNewName('')
    setNewPhone('')
    setNewEmail('')
    setNewResponsibilities('')
    setModalError('')
    setIsAddModalOpen(false)
    setSuccessNotice(`Successfully added ${trimmedName} as ${newRole} of ${selectedChurch?.name}!`)
  }

  // Delete Member
  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (!hasWrite) return
    if (window.confirm(`Are you sure you want to remove ${memberName} from the church committee?`)) {
      deleteCommitteeMember(memberId)
      setSuccessNotice(`Removed ${memberName} from church committee.`)
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
            Access Restricted to Church Committee
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Your current role does not have permission to access the <strong>Church committee</strong> section.
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
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
              Church Governance & Council
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
            <span>Church committee</span>
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Search churches across the district to view and manage official committee members, executive office bearers, and tenure records.
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

      {/* Success Notice */}
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


      {/* Metrics Row (2x2 on mobile, 4 columns on desktop) */}
      <div className="metrics grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <Metric
          icon={Church}
          label="Churches Represented"
          value={String(stats.totalChurches)}
          tone="blue"
          subtext="Active parish committees"
        />
        <Metric
          icon={UsersRound}
          label="Committee Members"
          value={String(stats.totalCommitteeMembers)}
          tone="green"
          subtext="Registered office bearers"
        />
        <Metric
          icon={ShieldCheck}
          label="Executive Officers"
          value={String(stats.executiveCount)}
          tone="orange"
          subtext="Chairs, Secs & Treasurers"
        />
        <Metric
          icon={Award}
          label="Avg Roster Size"
          value={stats.avgMembersPerChurch}
          tone="violet"
          subtext="Members per church"
        />
      </div>

      {/* If No Church Selected: Show Church Search Directory */}
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
                  placeholder="Search name of church, pastor, section, or address..."
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
              <span>Click on any church to view its committee members and leadership</span>
            </div>
          </div>

          {/* Churches Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChurches.map((church) => {
              const members = getCommitteeMembersForChurch(church.id)
              const chair = members.find((m) => m.role.toLowerCase().includes('chair') || m.role.toLowerCase().includes('president'))
              const secretary = members.find((m) => m.role.toLowerCase().includes('secretary') && !m.role.toLowerCase().includes('joint'))
              const treasurer = members.find((m) => m.role.toLowerCase().includes('treasurer'))

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
                      Pastor: <strong>{church.pastor}</strong>
                    </p>

                    {/* Quick Officer Highlights */}
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="truncate">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Chair:</span>{' '}
                        {chair?.name || 'Not appointed'}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Secretary:</span>{' '}
                        {secretary?.name || 'Not appointed'}
                      </div>
                      {treasurer && (
                        <div className="truncate">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Treasurer:</span>{' '}
                          {treasurer.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UsersRound size={14} className="text-district-500" />
                      <span>{members.length} Committee Members</span>
                    </span>

                    <span className="text-[11px] font-semibold text-district-600 dark:text-district-400 group-hover:underline">
                      View Committee →
                    </span>
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
                Try searching by a different name or clear the section filter.
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
        /* Selected Church Committee Workspace */
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

            {/* Action buttons */}
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
                  <span>Add Member Information</span>
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

          {/* Search & Category Filter within Selected Church */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search committee member by name, role, phone..."
                className="pl-8 pr-8 h-9 text-xs bg-white dark:bg-slate-800"
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

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-lg text-xs self-start sm:self-center border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setRoleFilter('All')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  roleFilter === 'All'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({churchMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('Executives')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  roleFilter === 'Executives'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Executives
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('Representatives')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  roleFilter === 'Representatives'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Representatives
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('Deacons')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  roleFilter === 'Deacons'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Deacons
              </button>
            </div>
          </div>

          {/* Committee Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const initials = member.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
              const badgeStyle = roleBadgeColors[member.role] || roleBadgeColors['Committee Member']

              return (
                <Card
                  key={member.id}
                  className="p-4 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, and Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {member.name}
                          </h4>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border mt-0.5 ${badgeStyle}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {hasWrite && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove member from committee"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Contact & Tenure Details */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a href={`tel:${member.phone}`} className="font-medium hover:underline text-slate-700 dark:text-slate-300">
                          {member.phone}
                        </a>
                      </div>

                      {member.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${member.email}`} className="truncate hover:underline text-slate-700 dark:text-slate-300">
                            {member.email}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>Term: <strong>{member.term}</strong></span>
                      </div>

                      {member.responsibilities && (
                        <div className="mt-2 text-[11.5px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 line-clamp-2">
                          {member.responsibilities}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 text-[10.5px] text-slate-400 flex items-center justify-between">
                    <span>Enrolled: {member.joinedDate}</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck size={12} /> Active Officer
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <UsersRound size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No committee members found matching your search.
              </p>
              {hasWrite && (
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-3 text-xs bg-[var(--color-district-600)] text-white"
                >
                  <Plus size={14} className="mr-1" />
                  <span>Add First Committee Member</span>
                </Button>
              )}
            </div>
          )}
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
                <DialogTitle className="text-lg font-bold">Add Committee Member</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Add official member information to the <strong>{selectedChurch.name}</strong> committee roster.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 mt-3">
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Selvaraj"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Committee Role / Designation
                  </label>
                  <Select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="h-9 text-xs py-0"
                  >
                    <option value="Committee Chair">Committee Chair</option>
                    <option value="Vice President">Vice President</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Joint Secretary">Joint Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Senior Deacon">Senior Deacon</option>
                    <option value="Trustee">Trustee</option>
                    <option value="Youth Representative">Youth Representative</option>
                    <option value="Women Representative">Women Representative</option>
                    <option value="Committee Member">Committee Member</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <Select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'Male' | 'Female')}
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
                    Phone Number
                  </label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 94430 12345"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tenure Term
                  </label>
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g. 2024 - 2027"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address (Optional)
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="member@kanyakumari-church.org"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Responsibilities / Department
                </label>
                <Input
                  value={newResponsibilities}
                  onChange={(e) => setNewResponsibilities(e.target.value)}
                  placeholder="e.g. Building Committee & Finance Liaison"
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
                  <span>Save Committee Member</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
