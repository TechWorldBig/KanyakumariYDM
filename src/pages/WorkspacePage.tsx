import { useState } from 'react'
import {
  Building2,
  Church,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { churches } from '../data/churches'
import type { Page, Section, UserRole } from '../types'
import { isDistrictScope } from '../domain/permissions'
import { AccessControlWorkspace } from '../components/dashboard/AccessControlWorkspace'
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
      (isDistrictScope(role) || church.section === section.name) &&
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            {page === 'Access control'
              ? 'District administration'
              : isDistrictScope(role)
              ? 'District workspace'
              : `${section.name} workspace`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            {page}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {page === 'Access control'
              ? 'Define role permissions across the workspace.'
              : role === 'head-pastor'
              ? 'Read-only view of all district data.'
              : `Manage ${isDistrictScope(role) ? 'district-wide' : section.name} data.`}
          </p>
        </div>
        {canAdd && (
          <Button onClick={add} className="shrink-0 shadow-sm">
            <Plus size={16} />
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
      ) : (
        <InfoWorkspace page={page} role={role} section={section} />
      )}

      {adding && (
        <AddRecordDialog
          kind={adding}
          sections={sections}
          defaultSection={section.name}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {sections.map((item) => (
        <button
          type="button"
          key={item.name}
          onClick={() => onOpen(item)}
          className="group relative flex flex-col justify-between p-5 rounded-xl text-left bg-[var(--card)] border border-[var(--border)] shadow-xs hover:shadow-md hover:border-[var(--color-district-500)]/40 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold text-sm">
                <Building2 size={20} />
              </div>
              <Badge variant="blue">{item.town}</Badge>
            </div>
            <strong className="block text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--color-district-600)] dark:group-hover:text-[var(--color-district-400)] transition-colors">
              {item.name}
            </strong>
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-1">
              <MapPin size={12} className="shrink-0" />
              {item.admin} Admin
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>
              <strong className="text-[var(--foreground)] font-semibold">{item.churches}</strong> churches
            </span>
            <span>
              <strong className="text-[var(--foreground)] font-semibold">{item.users}</strong> users
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
    <Card className="p-0 overflow-hidden shadow-xs border border-[var(--border)]">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Church size={18} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Church Directory
          </h2>
          <Badge variant="outline" className="ml-1 text-xs">
            {records.length + added.length} total
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search churches..."
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-[var(--muted)] border border-[var(--border)]">
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {item.name}
                  </strong>
                  <Badge variant="blue" className="text-[11px] py-0 px-2">
                    {item.section}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                  {item.address} · {item.distanceKm === 0 ? 'Nagercoil center' : `${item.distanceKm} km from Nagercoil`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-14 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">
                  Admin login
                </span>
                <code className="text-xs font-mono font-medium text-[var(--foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
                  {item.username}
                </code>
              </div>
            </div>
          </div>
        ))}

        {filteredAdded.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-lg shrink-0 bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold">
                <Church size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {item.name}
                  </strong>
                  <Badge variant="violet" className="text-[11px] py-0 px-2">
                    {item.section}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0">Custom Added</Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                  {item.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto pl-14 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">
                  Username
                </span>
                <code className="text-xs font-mono font-medium text-[var(--foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
                  {item.username}
                </code>
              </div>
              {canDelete && <DeleteButton onDelete={() => onDelete(item)} />}
            </div>
          </div>
        ))}

        {!filteredRecords.length && !filteredAdded.length && (
          <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
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
    <Card className="p-0 overflow-hidden shadow-xs border border-[var(--border)]">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Users & Administrators
          </h2>
          <Badge variant="outline" className="ml-1 text-xs">
            {sections.length + added.length} total
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {filteredSuperAdmins.map((item) => (
          <div
            key={item.admin}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg shrink-0 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-[var(--foreground)]">
                    {item.admin}
                  </strong>
                  <Badge variant="success" className="text-[11px] py-0">
                    Section Super Admin
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Full administrative permissions for {item.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">
                  Scope
                </span>
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {item.name}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredAdded.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-[var(--muted)]/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg shrink-0 bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold">
                <UserRound size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-semibold text-[var(--foreground)]">
                    {item.name}
                  </strong>
                  <Badge variant="blue" className="text-[11px] py-0">
                    {item.section}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {item.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">
                  Username
                </span>
                <code className="text-xs font-mono font-medium text-[var(--foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
                  {item.username}
                </code>
              </div>
              {canDelete && <DeleteButton onDelete={() => onDelete(item)} />}
            </div>
          </div>
        ))}

        {!filteredSuperAdmins.length && !filteredAdded.length && (
          <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
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
    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
      <div className="h-14 w-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] mb-4">
        <Icon size={28} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {page} Workspace
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1">
        Your current access is scoped to {role === 'district' ? 'the entire district' : section.name}.
      </p>
    </Card>
  )
}
