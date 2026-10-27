import { useState } from 'react'
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Church,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MapPin,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { churches } from '../data/churches'
import type { Page, Section, UserRole } from '../types'
import { isDistrictScope, roleName } from '../domain/permissions'
import { AccessControlWorkspace } from '../components/dashboard/AccessControlWorkspace'
import { downloadNativePdf, type PdfReportOptions } from '../utils/pdfGenerator'
import { canWrite } from '../domain/access'
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

type AddedRecord = {
  id: string
  name: string
  detail: string
  section: string
  username: string
}

type ManagedPage = 'Churches' | 'Users'

const readAdded = (page: ManagedPage): AddedRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(`district_added_${page.toLowerCase()}`) || '[]')
  } catch {
    return []
  }
}

export function WorkspacePage({
  page,
  role,
  section,
  sections,
  onAddSection,
  onOpenSection,
}: {
  page: Page
  role: UserRole
  section: Section
  sections: Section[]
  onAddSection: () => void
  onOpenSection: (section: Section) => void
}) {
  const [adding, setAdding] = useState<ManagedPage | null>(null)
  const [addedChurches, setAddedChurches] = useState(() => readAdded('Churches'))
  const [addedUsers, setAddedUsers] = useState(() => readAdded('Users'))
  const [deleted, setDeleted] = useState<string[]>([])
  const [actionError, setActionError] = useState('')

  const visibleChurches = churches.filter(
    (church) =>
      (isDistrictScope(role) || church.section === (section?.name || 'Section 1')) &&
      !deleted.includes(church.id)
  )

  const canManage = role !== 'head-pastor' && canWrite(role, page)

  const add = () => {
    if (page === 'Sections') {
      onAddSection()
    } else if (page === 'Churches' || page === 'Users') {
      setAdding(page)
    }
  }

  const remove = async (username: string, id: string, kind: ManagedPage) => {
    setActionError('')
    try {
      const response = await fetch('/api/accounts', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not delete this account.')
      }
      if (kind === 'Churches') {
        setAddedChurches((items) => items.filter((item) => item.id !== id))
        setDeleted((items) => [...items, id])
      } else {
        setAddedUsers((items) => items.filter((item) => item.id !== id))
      }
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : 'Could not reach the account service.'
      )
    }
  }

  const create = async (record: AddedRecord, password: string) => {
    setActionError('')
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: record.username,
          password,
          role: adding === 'Churches' ? 'church' : 'user',
          section_scope: record.section,
        }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        setActionError(result.error || 'Could not save this account.')
        return false
      }
      const setter = adding === 'Churches' ? setAddedChurches : setAddedUsers
      setter((current) => {
        const next = [...current, record]
        localStorage.setItem(`district_added_${adding?.toLowerCase()}`, JSON.stringify(next))
        return next
      })
      setAdding(null)
      return true
    } catch {
      setActionError('Could not reach the account service. Try again.')
      return false
    }
  }

  const canAdd =
    canManage &&
    (page === 'Churches' || page === 'Users' || (page === 'Sections' && role === 'district'))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isDistrictScope(role) ? 'District' : section?.name || 'Section 1'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
            {page}
          </h1>
        </div>
        {canAdd && (
          <Button onClick={add} className="shrink-0 shadow-xs" leftIcon={<Plus size={15} />}>
            <span>Add {page.slice(0, -1).toLowerCase()}</span>
          </Button>
        )}
      </div>

      {actionError && (
        <div
          className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-medium"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {page === 'Sections' ? (
        <SectionDirectory sections={sections} onOpen={onOpenSection} />
      ) : page === 'Churches' ? (
        <ChurchDirectory
          records={visibleChurches}
          added={addedChurches}
          canDelete={canManage}
          onDelete={(record) => remove(record.username, record.id, 'Churches')}
        />
      ) : page === 'Users' ? (
        <UserDirectory
          sections={sections}
          added={addedUsers}
          canDelete={canManage}
          onDelete={(record) => remove(record.username, record.id, 'Users')}
        />
      ) : page === 'Access control' && role === 'district' ? (
        <AccessControlWorkspace />
      ) : page === 'Reports' ? (
        <ReportsSuite sections={sections} role={role} />
      ) : (
        <InfoWorkspace page={page} role={role} section={section} />
      )}

      {adding && (
        <AddRecordDialog
          kind={adding}
          sections={sections}
          defaultSection={section?.name || 'Section 1'}
          onClose={() => setAdding(null)}
          onCreate={create}
        />
      )}
    </div>
  )
}

function SectionDirectory({
  sections,
  onOpen,
}: {
  sections: Section[]
  onOpen: (section: Section) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {sections.map((item) => (
        <button
          type="button"
          key={item.name}
          onClick={() => onOpen(item)}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-district-500 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                <Building2 size={18} />
              </div>
              <Badge variant="blue">{item.town}</Badge>
            </div>
            <strong className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-district-600 dark:group-hover:text-district-400 transition-colors">
              {item.name}
            </strong>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <MapPin size={12} className="shrink-0 text-slate-400" />
              {item.admin} Admin
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong className="text-slate-900 dark:text-slate-100 font-medium">{item.churches}</strong> churches
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100 font-medium">{item.users}</strong> users
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <Button
      variant={confirm ? 'destructive' : 'ghost'}
      size="sm"
      onClick={() => (confirm ? onDelete() : setConfirm(true))}
      className="h-8 text-xs font-medium"
      title={confirm ? 'Click again to permanently delete' : 'Delete account'}
    >
      <Trash2 size={13} />
      <span>{confirm ? 'Confirm' : 'Delete'}</span>
    </Button>
  )
}

function ChurchDirectory({
  records,
  added,
  canDelete,
  onDelete,
}: {
  records: typeof churches
  added: AddedRecord[]
  canDelete: boolean
  onDelete: (record: AddedRecord) => void
}) {
  const [query, setQuery] = useState('')

  const filteredRecords = records.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.section.toLowerCase().includes(query.toLowerCase()) ||
      c.address.toLowerCase().includes(query.toLowerCase())
  )

  const filteredAdded = added.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.section.toLowerCase().includes(query.toLowerCase()) ||
      c.detail.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Card className="p-0 overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Church size={18} className="text-district-600 dark:text-district-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Church Directory
          </h2>
          <Badge variant="outline" className="ml-1 text-xs font-semibold">
            {records.length + added.length} total
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search churches..."
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </strong>
                  <Badge variant="blue" className="text-[11px] py-0 px-2 font-semibold">
                    {item.section}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                  {item.address} · {item.distanceKm === 0 ? 'Nagercoil center' : `${item.distanceKm} km from Nagercoil`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-14 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
                  Admin login
                </span>
                <code className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {item.username}
                </code>
              </div>
            </div>
          </div>
        ))}

        {filteredAdded.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-lg shrink-0 bg-district-100 dark:bg-district-900 text-district-700 dark:text-district-300 flex items-center justify-center font-bold">
                <Church size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </strong>
                  <Badge variant="violet" className="text-[11px] py-0 px-2 font-semibold">
                    {item.section}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0 font-medium">Custom Added</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                  {item.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto pl-14 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
                  Username
                </span>
                <code className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {item.username}
                </code>
              </div>
              {canDelete && <DeleteButton onDelete={() => onDelete(item)} />}
            </div>
          </div>
        ))}

        {!filteredRecords.length && !filteredAdded.length && (
          <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
            No churches found matching your query.
          </div>
        )}
      </div>
    </Card>
  )
}

function UserDirectory({
  sections,
  added,
  canDelete,
  onDelete,
}: {
  sections: Section[]
  added: AddedRecord[]
  canDelete: boolean
  onDelete: (record: AddedRecord) => void
}) {
  const [query, setQuery] = useState('')

  const filteredSuperAdmins = sections.filter(
    (s) =>
      s.admin.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
  )

  const filteredAdded = added.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.section.toLowerCase().includes(query.toLowerCase()) ||
      u.detail.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Card className="p-0 overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-district-600 dark:text-district-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Users & Administrators
          </h2>
          <Badge variant="outline" className="ml-1 text-xs font-semibold">
            {sections.length + added.length} total
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {filteredSuperAdmins.map((item) => (
          <div
            key={item.admin}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg shrink-0 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.admin}
                  </strong>
                  <Badge variant="success" className="text-[11px] py-0 font-semibold">
                    Section Super Admin
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  Full administrative permissions for {item.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
                  Scope
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {item.name}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredAdded.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg shrink-0 bg-district-100 dark:bg-district-900 text-district-700 dark:text-district-300 flex items-center justify-center font-bold">
                <UserRound size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </strong>
                  <Badge variant="blue" className="text-[11px] py-0 font-semibold">
                    {item.section}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  {item.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
                  Username
                </span>
                <code className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {item.username}
                </code>
              </div>
              {canDelete && <DeleteButton onDelete={() => onDelete(item)} />}
            </div>
          </div>
        ))}

        {!filteredSuperAdmins.length && !filteredAdded.length && (
          <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
            No users found matching your search.
          </div>
        )}
      </div>
    </Card>
  )
}

function AddRecordDialog({
  kind,
  sections,
  defaultSection,
  onClose,
  onCreate,
}: {
  kind: ManagedPage
  sections: Section[]
  defaultSection: string
  onClose: () => void
  onCreate: (record: AddedRecord, password: string) => Promise<boolean>
}) {
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')
  const [selectedSection, setSelectedSection] = useState(defaultSection)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !detail.trim() || !username.trim() || password.length < 12) {
      setError('Complete all fields and use a password of at least 12 characters.')
      return
    }
    setSaving(true)
    const ok = await onCreate(
      {
        id: `${kind}-${Date.now()}`,
        name: name.trim(),
        detail: detail.trim(),
        section: selectedSection,
        username: username.trim(),
      },
      password
    )
    setSaving(false)
    if (!ok) {
      setError('Could not save this account. Check your secure session and try again.')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            District administration
          </span>
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Add {kind === 'Churches' ? 'Church' : 'User'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--muted-foreground)]">
            Create a new {kind === 'Churches' ? 'church record and administrator account.' : 'user account in the district directory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              {kind === 'Churches' ? 'Church name' : 'Full name'}
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={kind === 'Churches' ? 'e.g. Bethel Church' : 'e.g. John Doe'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              {kind === 'Churches' ? 'Address' : 'Role / responsibility'}
            </label>
            <Input
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder={kind === 'Churches' ? 'e.g. Main Road, Nagercoil' : 'e.g. Youth Coordinator'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Assigned Section
            </label>
            <Select
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
            >
              {sections.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.town})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Username
              </label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="login_username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Password (12+ chars)
              </label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium" role="alert">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReportPreviewModal({
  report,
  onClose,
}: {
  report: PdfReportOptions
  onClose: () => void
}) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    downloadNativePdf(report)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[96vw] p-0 overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl">
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-[var(--foreground)] line-clamp-1">
                {report.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted-foreground)]">
                Document preview & PDF export ready
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 h-8 px-2.5 sm:px-3"
              title="Print or Save as PDF using system dialog"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="text-xs gap-1.5 h-8 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white"
              title="Download standalone .pdf file"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Printable/Previewable Document Canvas */}
        <div id="district-pdf-printable" className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-white text-slate-900">
          {/* Executive Header Banner */}
          <div className="p-4 rounded-xl bg-blue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-100">
                Official District Record · PDF Export
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {report.title}
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                {report.subtitle}
              </p>
            </div>
            <div className="text-left sm:text-right text-[11px] text-blue-100 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-400/40">
              <div className="font-semibold text-white">Kanyakumari District OS</div>
              <div>Certified Digital Document</div>
            </div>
          </div>

          {/* Meta Tags Row */}
          <div className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-200 text-xs">
            {report.meta.map((m, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                <span className="text-slate-500 font-normal">{m.label}:</span>
                <strong className="font-semibold text-slate-900">{m.value}</strong>
              </span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  {report.headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {report.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
            <span>Official Certified Record · Kanyakumari District Administration & Pastoral Oversight</span>
            <span className="font-mono">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportsSuite({
  sections,
  role,
}: {
  sections: Section[]
  role: UserRole
}) {
  const totalChurches = sections.reduce((acc, s) => acc + s.churches, 0) || churches.length
  const totalUsers = sections.reduce((acc, s) => acc + s.users, 0)
  const averageHealth = Math.round(
    sections.reduce((acc, s) => acc + s.health, 0) / (sections.length || 1)
  )

  const [activeReportPreview, setActiveReportPreview] = useState<PdfReportOptions | null>(null)

  const buildChurchesPdfReport = (): PdfReportOptions => ({
    filename: `kanyakumari_district_churches_${new Date().toISOString().slice(0, 10)}.pdf`,
    title: 'KANYAKUMARI DISTRICT — REGISTERED CHURCHES DIRECTORY',
    subtitle: 'District Governance & Ecclesiastical Administration Official Roster',
    meta: [
      { label: 'Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { label: 'Authority', value: 'Kanyakumari District Council' },
      { label: 'Scope', value: roleName(role) },
      { label: 'Total', value: `${totalChurches} Registered Churches` },
    ],
    headers: ['ID', 'Church Name', 'Section', 'Pastor / Overseer', 'District Center'],
    rows: churches.map((c) => [
      c.id,
      c.name,
      c.section,
      c.pastor || 'Pastor In-Charge',
      c.address || 'Kanyakumari District',
    ]),
    columnWidths: [45, 175, 75, 115, 113],
  })

  const buildSectionsPdfReport = (): PdfReportOptions => ({
    filename: `kanyakumari_district_regional_governance_${new Date().toISOString().slice(0, 10)}.pdf`,
    title: 'KANYAKUMARI DISTRICT — REGIONAL GOVERNANCE REPORT',
    subtitle: 'Sectional Roster, Supervisory Personnel & Infrastructure Health',
    meta: [
      { label: 'Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { label: 'District', value: 'Kanyakumari' },
      { label: 'Active Sections', value: `${sections.length} Sectors` },
      { label: 'System Health', value: `${averageHealth}% Optimal` },
    ],
    headers: ['Section Name', 'Admin Center', 'Super Administrator', 'Churches', 'Users', 'Health Score'],
    rows: sections.map((s) => [
      s.name,
      s.town,
      s.admin,
      s.churches,
      s.users,
      `${s.health}%`,
    ]),
    columnWidths: [95, 100, 130, 60, 60, 78],
  })

  const handleDownloadChurchesPdf = () => {
    const report = buildChurchesPdfReport()
    downloadNativePdf(report)
    setActiveReportPreview(report)
  }

  const handleDownloadSectionsPdf = () => {
    const report = buildSectionsPdfReport()
    downloadNativePdf(report)
    setActiveReportPreview(report)
  }

  return (
    <div className="space-y-6">
      {/* Top action cards & PDF triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)] size-5" />
            <h2 className="text-base font-bold text-[var(--foreground)]">Reports</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadChurchesPdf}
            className="text-xs gap-1.5 h-9"
          >
            <FileText size={14} className="text-red-500" />
            <span>Export Churches (PDF)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDownloadSectionsPdf}
            className="text-xs gap-1.5 h-9 bg-[var(--color-district-600)] hover:bg-[var(--color-district-700)] text-white shadow-xs"
          >
            <Download size={14} />
            <span>Export Regional Data (PDF)</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted-foreground)] block">Total Churches</span>
          <strong className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1 block">{totalChurches}</strong>
        </Card>
        <Card className="p-4 bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted-foreground)] block">Active Sections</span>
          <strong className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1 block">{sections.length}</strong>
        </Card>
        <Card className="p-4 bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted-foreground)] block">Total Members</span>
          <strong className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1 block">{totalUsers}</strong>
        </Card>
        <Card className="p-4 bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted-foreground)] block">System Health</span>
          <strong className="text-2xl font-bold font-mono text-[var(--foreground)] mt-1 block">{averageHealth}%</strong>
        </Card>
      </div>

      {/* Regional Governance Breakdown Table */}
      <Card className="p-0 overflow-hidden border border-[var(--border)] shadow-xs">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Regional Governance Breakdown</h3>
          <Badge variant="blue">{sections.length} Active Regions</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20 text-[var(--muted-foreground)] font-semibold">
                <th className="py-3 px-4">Section Name</th>
                <th className="py-3 px-4">Administrative Center</th>
                <th className="py-3 px-4">Super Administrator</th>
                <th className="py-3 px-4 text-center">Churches</th>
                <th className="py-3 px-4 text-center">Users</th>
                <th className="py-3 px-4 text-center">Health</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
              {sections.map((s) => (
                <tr key={s.name} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="py-3 px-4 font-semibold">{s.name}</td>
                  <td className="py-3 px-4 text-[var(--muted-foreground)]">{s.town}</td>
                  <td className="py-3 px-4">{s.admin}</td>
                  <td className="py-3 px-4 text-center font-mono font-medium">{s.churches}</td>
                  <td className="py-3 px-4 text-center font-mono font-medium">{s.users}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.health}%</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="success" className="text-[10px] py-0">Healthy</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Report Preview Modal */}
      {activeReportPreview && (
        <ReportPreviewModal
          report={activeReportPreview}
          onClose={() => setActiveReportPreview(null)}
        />
      )}
    </div>
  )
}

function InfoWorkspace({
  page,
  role,
  section,
}: {
  page: Page
  role: UserRole
  section: Section
}) {
  if (page === 'Access control' && role === 'district') {
    return <AccessControlWorkspace />
  }
  const Icon = page === 'Reports' ? Users : ShieldCheck
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-slate-300 dark:border-slate-700">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-4">
        <Icon size={28} />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {page} Workspace
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium max-w-sm mt-1">
        Your current access is scoped to {role === 'district' ? 'the entire district' : section?.name || 'Section 1'}.
      </p>
    </Card>
  )
}
