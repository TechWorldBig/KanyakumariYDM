import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Church,
  Eye,
  KeyRound,
  MapPin,
  Pencil,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { churches, ChurchRecord } from '../../data/churches'
import type { Section } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input, Textarea } from '../ui/input'

type Credentials = { username: string; password: string }
const credentialsKey = 'district_church_credentials'

function readCredentials(church: ChurchRecord): Credentials {
  try {
    const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<
      string,
      { username?: string }
    >
    return { username: saved[church.id]?.username || church.username, password: '' }
  } catch {
    return { username: church.username, password: '' }
  }
}

function saveCredentials(churchId: string, credentials: Credentials) {
  const saved = JSON.parse(localStorage.getItem(credentialsKey) || '{}') as Record<
    string,
    { username?: string }
  >
  localStorage.setItem(
    credentialsKey,
    JSON.stringify({ ...saved, [churchId]: { username: credentials.username } })
  )
}

export function SectionDialog({
  section,
  onClose,
  isDistrict,
  canManageCredentials = true,
  canEditSection = isDistrict,
  canDeleteSection = isDistrict,
  onSaveSection,
  onRemove,
}: {
  section: Section
  onClose: () => void
  isDistrict: boolean
  canManageCredentials?: boolean
  canEditSection?: boolean
  canDeleteSection?: boolean
  onSaveSection?: (section: Section) => void
  onRemove: () => void
}) {
  const [church, setChurch] = useState<ChurchRecord | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [editingSection, setEditingSection] = useState(false)
  const [sectionDraft, setSectionDraft] = useState(section)

  const legacySectionName = /^section([1-4])$/i.exec(section.admin)?.[1]
  const hasNamedChurches = churches.some((item) => item.section === section.name)
  const sectionChurches = churches.filter(
    (item) =>
      item.section === section.name ||
      (!hasNamedChurches && legacySectionName && item.section === `Section ${legacySectionName}`)
  )

  if (church) {
    return (
      <ChurchDialog
        church={church}
        onBack={() => setChurch(null)}
        canManageCredentials={canManageCredentials}
        scopeLabel={isDistrict ? 'District Super Admin' : `${section.name} Super Admin`}
      />
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 bg-[var(--card)]/95 backdrop-blur-md px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 gap-1.5 -ml-2 text-xs">
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </Button>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Section
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X size={16} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {editingSection && canEditSection ? (
            <Card className="p-5 border border-district-500/30 bg-slate-50 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--foreground)]">Edit Section Profile</h3>
                <Badge variant="blue">Editing Mode</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--foreground)]">Section Name</label>
                  <Input
                    value={sectionDraft.name}
                    onChange={(e) => setSectionDraft({ ...sectionDraft, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--foreground)]">Location / Area</label>
                  <Input
                    value={sectionDraft.town}
                    onChange={(e) => setSectionDraft({ ...sectionDraft, town: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--foreground)]">Section Details</label>
                <Textarea
                  className="resize-none"
                  rows={3}
                  value={sectionDraft.description || ''}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, description: e.target.value })}
                  placeholder="Add a short description of this section"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingSection(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onSaveSection?.(sectionDraft)
                    setEditingSection(false)
                  }}
                >
                  <Save size={14} />
                  <span>Save Section Details</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    {section.name}
                  </h2>
                  <Badge variant="blue">{section.town}</Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {section.town} · {sectionChurches.length} churches
                </p>
                {section.description && (
                  <p className="text-sm text-[var(--foreground)] mt-3 leading-relaxed">
                    {section.description}
                  </p>
                )}
              </div>
              {canEditSection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSectionDraft(section)
                    setEditingSection(true)
                  }}
                  className="shrink-0"
                >
                  <Pencil size={13} />
                  <span>Edit Section</span>
                </Button>
              )}
            </div>
          )}

          <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold text-sm">
                SA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold text-[var(--foreground)]">
                    {section.admin}
                  </strong>
                  <Badge variant="success" className="text-[10px] py-0">Super Admin</Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Full administrative permissions across {section.name}
                </p>
              </div>
            </div>
            <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Church size={18} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)]" />
                <span>Churches in {section.name}</span>
              </h3>
              <Badge variant="outline" className="text-xs">
                {sectionChurches.length} records
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectionChurches.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setChurch(item)}
                  className="group flex items-center justify-between p-3.5 rounded-xl text-left bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-district-500)]/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--color-district-600)] dark:group-hover:text-[var(--color-district-400)] truncate transition-colors">
                        {item.name}
                      </strong>
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                        <MapPin size={11} className="shrink-0" />
                        {item.distanceKm === 0 ? 'Nagercoil center' : `${item.distanceKm} km`} · {item.address}
                      </span>
                    </div>
                  </div>
                  <Eye size={16} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] shrink-0 ml-2 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {canDeleteSection && (
            <div className="pt-4 border-t border-rose-200 dark:border-rose-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                <div>
                  <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert size={16} />
                    <span>Danger Zone</span>
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                    Deleting this section removes all assigned roles and scoped permissions.
                  </p>
                </div>
                {confirmRemove ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onRemove}>
                      Confirm Delete
                    </Button>
                  </div>
                ) : (
                  <Button variant="destructive" size="sm" onClick={() => setConfirmRemove(true)} className="shrink-0">
                    Delete Section
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ChurchDialog({
  church,
  onBack,
  canManageCredentials,
  scopeLabel,
}: {
  church: ChurchRecord
  onBack: () => void
  canManageCredentials: boolean
  scopeLabel: string
}) {
  const [editing, setEditing] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>(() => readCredentials(church))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [workspace, setWorkspace] = useState<{
    details?: {
      name: string
      location: string
      totalMembers: number
      totalYdmMembers: number
    }
    committee?: { name: string; role?: string }[]
    ydm?: { name: string; role?: string }[]
    women?: { name: string; role?: string }[]
    pastor?: { name: string; role?: string }
    announcements?: { id: string; title: string; category: string }[]
  } | null>(null)

  useEffect(() => {
    fetch(`/api/church-data?churchId=${encodeURIComponent(church.id)}`, {
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setWorkspace(result?.data || null))
      .catch(() => undefined)
  }, [church.id])

  const update = (field: keyof Credentials, value: string) =>
    setCredentials((current) => ({ ...current, [field]: value }))

  const save = async () => {
    setError('')
    if (
      !/^[a-z0-9._-]{3,40}$/i.test(credentials.username.trim()) ||
      credentials.password.length < 12
    ) {
      setError('Use a valid username and a password of at least 12 characters.')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          role: 'church',
          section_scope: church.section,
          church_id: church.id,
        }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setError(result.error || 'Could not save this login.')
        return
      }
      saveCredentials(church.id, credentials)
      setCredentials((current) => ({ ...current, password: '' }))
      setEditing(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Could not reach the account service. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onBack() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 bg-[var(--card)]/95 backdrop-blur-md px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 -ml-2 text-xs">
            <ArrowLeft size={14} />
            <span>Back to {church.section}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full">
            <X size={16} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs bg-slate-100 dark:bg-slate-800">
              <img
                src={church.photo}
                alt={church.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
                Church Details · {church.section}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1">
                {workspace?.details?.name || church.name}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="shrink-0" />
                {workspace?.details?.location || church.address} · {church.distanceKm} km from Nagercoil
              </p>
            </div>
          </div>

          <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center">
                  <KeyRound size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Church Admin Credentials
                  </h4>
                  {!editing && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-sm font-mono font-semibold text-[var(--foreground)] bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {credentials.username}
                      </code>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Password protected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {canManageCredentials && (
                <div className="flex items-center gap-2">
                  {editing ? (
                    <Button size="sm" onClick={save} disabled={saving}>
                      <Save size={13} />
                      <span>{saving ? 'Saving...' : 'Save credentials'}</span>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil size={13} />
                      <span>Change login</span>
                    </Button>
                  )}
                  {saved && (
                    <Badge variant="success" className="gap-1 text-xs">
                      <CheckCircle2 size={12} />
                      Saved
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {editing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--foreground)]">Username</label>
                  <Input
                    value={credentials.username}
                    onChange={(e) => update('username', e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--foreground)]">
                    Password (12+ characters)
                  </label>
                  <Input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => update('password', e.target.value)}
                    autoComplete="new-password"
                    placeholder="New password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium" role="alert">
                {error}
              </div>
            )}

            <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 pt-1">
              <ShieldCheck size={13} className="text-[var(--color-district-600)]" />
              <span>{scopeLabel} can manage this church login.</span>
            </div>
          </Card>

          {workspace?.details && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <Users size={13} />
                  Total Members
                </span>
                <strong className="text-xl font-bold text-[var(--foreground)] block mt-1">
                  {workspace.details.totalMembers}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <Users size={13} />
                  YDM Members
                </span>
                <strong className="text-xl font-bold text-[var(--foreground)] block mt-1">
                  {workspace.details.totalYdmMembers}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)]">Committee</span>
                <strong className="text-xl font-bold text-[var(--foreground)] block mt-1">
                  {workspace.committee?.length || 0}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)]">Announcements</span>
                <strong className="text-xl font-bold text-[var(--foreground)] block mt-1">
                  {workspace.announcements?.length || 0}
                </strong>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              People & Ministry Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PeopleBlock
                title="Pastor"
                people={
                  workspace?.pastor?.name
                    ? [{ name: workspace.pastor.name, role: 'Church Pastor' }]
                    : [{ name: church.pastor, role: 'Church Pastor' }]
                }
              />
              <PeopleBlock
                title="Church Administrator"
                people={[{ name: church.admin, role: 'Church Administrator' }]}
              />
              <PeopleBlock
                title="Committee Members"
                people={
                  workspace?.committee?.length ? workspace.committee : church.committee
                }
              />
              <PeopleBlock
                title="YDM Ministry"
                people={workspace?.ydm?.length ? workspace.ydm : church.ydm}
              />
              <PeopleBlock
                title="Women Ministry"
                people={
                  workspace?.women?.length ? workspace.women : church.womenMinistry
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PeopleBlock({
  title,
  people,
}: {
  title: string
  people: { name: string; role?: string }[]
}) {
  return (
    <Card className="p-4 border border-[var(--border)] space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center justify-between">
        <span>{title}</span>
        <Badge variant="outline" className="text-[10px] py-0">{people.length}</Badge>
      </h4>
      <div className="space-y-2">
        {people.map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-semibold text-xs border border-slate-200 dark:border-slate-700 shrink-0">
              {person.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-semibold text-[var(--foreground)] truncate">
                {person.name}
              </strong>
              <span className="block text-[11px] text-[var(--muted-foreground)] truncate">
                {person.role || title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
