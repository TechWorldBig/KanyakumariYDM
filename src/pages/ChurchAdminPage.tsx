import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Church,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { churches } from '../data/churches'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input, Select, Textarea } from '../components/ui/input'
import { TabsList, TabTrigger } from '../components/ui/tabs'

type Person = {
  id: string
  name: string
  age: string
  gender?: string
  phone?: string
  address: string
  photo?: string
  username?: string
}

type ChurchData = {
  details: {
    name: string
    location: string
    totalMembers: number
    totalYdmMembers: number
  }
  committee: Person[]
  ydm: Person[]
  women: Person[]
  pastor: Person
  announcements: {
    id: string
    title: string
    category: string
    content: string
    date: string
  }[]
}

const blankPerson = (): Person => ({
  id: crypto.randomUUID(),
  name: '',
  age: '',
  gender: '',
  phone: '',
  address: '',
})

const emptyData = (name = '', location = ''): ChurchData => ({
  details: { name, location, totalMembers: 0, totalYdmMembers: 0 },
  committee: [],
  ydm: [],
  women: [],
  pastor: { ...blankPerson() },
  announcements: [],
})

export function ChurchAdminPage({
  churchId,
  canManage,
}: {
  churchId: string
  canManage: boolean
}) {
  const church = churches.find((item) => item.id === churchId)
  const [data, setData] = useState<ChurchData>(() =>
    emptyData(church?.name, church?.address)
  )
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<
    'details' | 'committee' | 'ydm' | 'women' | 'pastor' | 'announcements'
  >('details')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/church-data?churchId=${encodeURIComponent(churchId)}`, {
      credentials: 'include',
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load church data')
        setData(result.data)
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [churchId])

  const persist = async (next: ChurchData) => {
    setError('')
    try {
      const response = await fetch('/api/church-data', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, data: next }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(result.error || 'Could not save church data')
        return
      }
      setData(next)
      setNotice('Saved for Church, Section, and District access')
      window.setTimeout(() => setNotice(''), 2500)
    } catch {
      setError('Could not reach the church service. Check your connection and try again.')
    }
  }

  if (!church) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Church size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Church workspace unavailable
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          This account is not linked to an active church record.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-[var(--color-district-600)] border-t-transparent rounded-full mx-auto mb-3" />
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Loading church workspace…
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Synchronizing latest church records.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            Private Church Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            {church.name}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage people, ministries, and announcements for this church only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canManage ? 'success' : 'blue'} dot>
            {canManage ? 'Church Admin' : 'Church Member'}
          </Badge>
        </div>
      </div>

      {notice && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-sm font-medium"
          role="status"
        >
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div
          className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      <Card className="p-5 bg-gradient-to-r from-[var(--color-district-50)]/40 to-transparent dark:from-[var(--color-district-950)]/30 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-district-600)] dark:text-[var(--color-district-400)]">
            Access Boundary
          </span>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mt-0.5">
            {data.details.location || church.address}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Synchronized with this church, its Section Super Admin, and District Super Admin.
          </p>
        </div>
        <div className="flex items-baseline gap-2 bg-[var(--card)] px-4 py-2.5 rounded-xl border border-[var(--border)] shadow-xs">
          <strong className="text-2xl font-bold text-[var(--foreground)]">
            {data.details.totalMembers}
          </strong>
          <span className="text-xs text-[var(--muted-foreground)] font-medium">
            total members
          </span>
        </div>
      </Card>

      <div className="border-b border-[var(--border)] overflow-x-auto pb-1">
        <TabsList className="min-w-max">
          <TabTrigger active={active === 'details'} onClick={() => setActive('details')}>
            Church details
          </TabTrigger>
          <TabTrigger active={active === 'committee'} onClick={() => setActive('committee')}>
            Committee ({data.committee.length})
          </TabTrigger>
          <TabTrigger active={active === 'ydm'} onClick={() => setActive('ydm')}>
            YDM members ({data.ydm.length})
          </TabTrigger>
          <TabTrigger active={active === 'women'} onClick={() => setActive('women')}>
            Women ministry ({data.women.length})
          </TabTrigger>
          <TabTrigger active={active === 'pastor'} onClick={() => setActive('pastor')}>
            Pastor profile
          </TabTrigger>
          <TabTrigger active={active === 'announcements'} onClick={() => setActive('announcements')}>
            Announcements ({data.announcements.length})
          </TabTrigger>
        </TabsList>
      </div>

      {active === 'details' && (
        <ChurchDetailsSection
          details={data.details}
          canManage={canManage}
          onSave={(details) => void persist({ ...data, details })}
        />
      )}

      {active === 'committee' && (
        <PersonSection
          title="Committee members"
          description="Keep the church committee directory up to date."
          people={data.committee}
          canManage={canManage}
          fields={['phone', 'address']}
          onSave={(people) => persist({ ...data, committee: people })}
          onCreateAccount={createMemberAccount(church, 'committee')}
        />
      )}

      {active === 'ydm' && (
        <PersonSection
          title="YDM members"
          description="Record youth ministry members serving this church."
          people={data.ydm}
          canManage={canManage}
          fields={['address']}
          onSave={(people) => persist({ ...data, ydm: people })}
          onCreateAccount={createMemberAccount(church, 'ydm')}
        />
      )}

      {active === 'women' && (
        <PersonSection
          title="Women ministry"
          description="Maintain the women ministry leadership and members."
          people={data.women}
          canManage={canManage}
          fields={['address']}
          onSave={(people) => persist({ ...data, women: people })}
          onCreateAccount={createMemberAccount(church, 'women')}
        />
      )}

      {active === 'pastor' && (
        <PastorSection
          pastor={data.pastor}
          canManage={canManage}
          onSave={(pastor) => persist({ ...data, pastor })}
        />
      )}

      {active === 'announcements' && (
        <AnnouncementSection
          announcements={data.announcements}
          canManage={canManage}
          onSave={(announcements) => persist({ ...data, announcements })}
        />
      )}
    </div>
  )
}

function ChurchDetailsSection({
  details,
  canManage,
  onSave,
}: {
  details: ChurchData['details']
  canManage: boolean
  onSave: (details: ChurchData['details']) => void
}) {
  const [value, setValue] = useState(details)

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Church Profile & Statistics
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            These figures are visible to church administrators, Section Super Admin, and District Super Admin.
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-600)] dark:text-[var(--color-district-300)] flex items-center justify-center">
          <Church size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Church size={14} />
            Church Name
          </span>
          <strong className="block text-sm font-semibold text-[var(--foreground)] mt-1.5 truncate">
            {value.name || 'Not added'}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <MapPin size={14} />
            Location
          </span>
          <strong className="block text-sm font-semibold text-[var(--foreground)] mt-1.5 truncate">
            {value.location || 'Not added'}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Users size={14} />
            Total Members
          </span>
          <strong className="block text-xl font-bold text-[var(--foreground)] mt-1">
            {value.totalMembers}
          </strong>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Users size={14} />
            YDM Members
          </span>
          <strong className="block text-xl font-bold text-[var(--foreground)] mt-1">
            {value.totalYdmMembers}
          </strong>
        </div>
      </div>

      {canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(value)
          }}
          className="space-y-4 pt-4 border-t border-[var(--border)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Church Name
              </label>
              <Input
                value={value.name}
                onChange={(e) => setValue({ ...value, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Location Address
              </label>
              <Input
                value={value.location}
                onChange={(e) => setValue({ ...value, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Total Members Count
              </label>
              <Input
                type="number"
                min="0"
                value={value.totalMembers}
                onChange={(e) =>
                  setValue({
                    ...value,
                    totalMembers: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Total YDM Members Count
              </label>
              <Input
                type="number"
                min="0"
                value={value.totalYdmMembers}
                onChange={(e) =>
                  setValue({
                    ...value,
                    totalYdmMembers: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">
              <Save size={14} />
              <span>Save Church Details</span>
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function createMemberAccount(church: typeof churches[number], ministry: string) {
  return async (person: Person, password: string) => {
    if (!person.username || !password) return
    await fetch('/api/accounts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: person.username,
        password,
        role: 'user',
        section_scope: church.section,
        church_id: church.id,
        ministry,
      }),
    })
  }
}

function PersonSection({
  title,
  description,
  people,
  canManage,
  fields,
  onSave,
  onCreateAccount,
}: {
  title: string
  description: string
  people: Person[]
  canManage: boolean
  fields: string[]
  onSave: (people: Person[]) => void
  onCreateAccount: (person: Person, password: string) => Promise<void>
}) {
  const [editing, setEditing] = useState<Person | null>(null)
  const list = useMemo(() => people, [people])

  const save = () => {
    if (!editing?.name.trim()) return
    const next = list.some((item) => item.id === editing.id)
      ? list.map((item) => (item.id === editing.id ? editing : item))
      : [...list, editing]
    onSave(next)
    setEditing(null)
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {description}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing(blankPerson())}>
            <Plus size={14} />
            <span>Add Member</span>
          </Button>
        )}
      </div>

      {editing && (
        <PersonForm
          person={editing}
          fields={fields}
          onChange={setEditing}
          onSave={save}
          onCancel={() => setEditing(null)}
          onCreateAccount={onCreateAccount}
        />
      )}

      {list.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--muted-foreground)]">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    person.name.slice(0, 1).toUpperCase() || <UserRound size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-[var(--foreground)] truncate">
                    {person.name}
                  </strong>
                  <span className="block text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                    {person.age ? `${person.age} yrs` : 'Age N/A'}
                    {person.gender ? ` · ${person.gender}` : ''}
                    {person.phone ? ` · ${person.phone}` : ''}
                  </span>
                  {person.address && (
                    <span className="block text-[11px] text-[var(--muted-foreground)] truncate">
                      {person.address}
                    </span>
                  )}
                </div>
              </div>

              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  onClick={() => setEditing(person)}
                  title="Edit member"
                >
                  <Pencil size={13} />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center border-dashed border rounded-xl">
          <UserRound size={28} className="mx-auto text-[var(--muted-foreground)] mb-2" />
          <strong className="block text-sm font-semibold text-[var(--foreground)]">
            No members added yet
          </strong>
          <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Use &ldquo;Add Member&rdquo; to create the first record in this ministry directory.
          </span>
        </div>
      )}
    </Card>
  )
}

function PersonForm({
  person,
  fields,
  onChange,
  onSave,
  onCancel,
  onCreateAccount,
}: {
  person: Person
  fields: string[]
  onChange: (p: Person) => void
  onSave: () => void
  onCancel: () => void
  onCreateAccount: (p: Person, password: string) => Promise<void>
}) {
  const [password, setPassword] = useState('')
  const update = (key: keyof Person, value: string) =>
    onChange({ ...person, [key]: value })

  return (
    <Card className="p-5 border-[var(--color-district-500)]/40 bg-[var(--muted)]/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {person.name ? `Edit ${person.name}` : 'New Member Record'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7">
          <X size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">Full Name</label>
          <Input
            value={person.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">Age</label>
          <Input
            type="number"
            min="1"
            max="120"
            value={person.age}
            onChange={(e) => update('age', e.target.value)}
            placeholder="Years"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">Gender</label>
          <Select
            value={person.gender || ''}
            onChange={(e) => update('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.includes('phone') && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--foreground)]">Phone</label>
            <Input
              type="tel"
              value={person.phone || ''}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+91..."
            />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">Address</label>
          <Input
            value={person.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Address or area"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">
            Username (optional)
          </label>
          <Input
            value={person.username || ''}
            onChange={(e) => update('username', e.target.value)}
            placeholder="Account login"
            autoComplete="username"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--foreground)]">
            Password (optional, 12+ chars)
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Account password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-district-600)] dark:text-[var(--color-district-400)] hover:underline">
          <Upload size={14} />
          <span>{person.photo ? 'Change member photo' : 'Upload photo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = () => update('photo', String(reader.result))
                reader.readAsDataURL(file)
              }
            }}
          />
        </label>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave()
              if (person.username && password.length >= 12) {
                void onCreateAccount(person, password)
              }
            }}
          >
            <Save size={13} />
            <span>Save Member</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PastorSection({
  pastor,
  canManage,
  onSave,
}: {
  pastor: Person
  canManage: boolean
  onSave: (person: Person) => void
}) {
  const [value, setValue] = useState(pastor)

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Pastor Profile
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Keep the current pastor profile and photo available to church leaders and district administrators.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="h-32 w-32 rounded-2xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] shadow-xs">
            {value.photo ? (
              <img
                src={value.photo}
                alt="Pastor"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserRound size={48} />
            )}
          </div>
          {canManage && (
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[var(--color-district-600)] dark:text-[var(--color-district-400)] hover:underline">
              <Upload size={13} />
              <span>Upload photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => setValue({ ...value, photo: String(reader.result) })
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </label>
          )}
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Pastor Name
              </label>
              <Input
                disabled={!canManage}
                value={value.name}
                onChange={(e) => setValue({ ...value, name: e.target.value })}
                placeholder="Pastor's full name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Age</label>
              <Input
                disabled={!canManage}
                type="number"
                value={value.age}
                onChange={(e) => setValue({ ...value, age: e.target.value })}
                placeholder="Years"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Gender
              </label>
              <Select
                disabled={!canManage}
                value={value.gender || ''}
                onChange={(e) => setValue({ ...value, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Residence / Address
            </label>
            <Input
              disabled={!canManage}
              value={value.address}
              onChange={(e) => setValue({ ...value, address: e.target.value })}
              placeholder="Residential address"
            />
          </div>

          {canManage && (
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSave(value)}>
                <Save size={14} />
                <span>Save Pastor Details</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function AnnouncementSection({
  announcements,
  canManage,
  onSave,
}: {
  announcements: ChurchData['announcements']
  canManage: boolean
  onSave: (items: ChurchData['announcements']) => void
}) {
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    content: '',
  })

  const add = () => {
    if (!form.title.trim() || !form.content.trim()) return
    onSave([
      { ...form, id: crypto.randomUUID(), date: new Date().toISOString() },
      ...announcements,
    ])
    setForm({ title: '', category: 'General', content: '' })
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Church Announcements
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Publish official updates and urgent notifications for this church and ministries.
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Megaphone size={20} />
        </div>
      </div>

      {canManage && (
        <Card className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Create New Announcement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Announcement headline"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Category</label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="General">General</option>
                <option value="Worship">Worship</option>
                <option value="YDM">YDM</option>
                <option value="Women ministry">Women ministry</option>
                <option value="Committee">Committee</option>
                <option value="Urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--foreground)]">
              Announcement Message
            </label>
            <Textarea
              className="resize-none"
              rows={3}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write the full announcement details here..."
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={add}>
              <Megaphone size={13} />
              <span>Publish Announcement</span>
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.length ? (
          announcements.map((item) => (
            <article
              key={item.id}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2 hover:border-[var(--color-district-500)]/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant={
                    item.category === 'Urgent'
                      ? 'destructive'
                      : item.category === 'Worship'
                      ? 'violet'
                      : item.category === 'YDM'
                      ? 'blue'
                      : 'outline'
                  }
                  className="text-xs"
                >
                  {item.category}
                </Badge>
                <time className="text-[11px] text-[var(--muted-foreground)]">
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>

              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </article>
          ))
        ) : (
          <div className="py-10 text-center border-dashed border rounded-xl">
            <Megaphone size={28} className="mx-auto text-[var(--muted-foreground)] mb-2" />
            <strong className="block text-sm font-semibold text-[var(--foreground)]">
              No announcements published
            </strong>
            <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Published announcements will appear here for all members.
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
