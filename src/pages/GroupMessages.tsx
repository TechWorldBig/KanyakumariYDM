import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  Info,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { meetingNotificationsChanged } from '../components/layout/MeetingNotifications'
import { VoicePreview, VoiceRecordButton } from '../components/shared/VoiceMessage'
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
import { Input, Textarea } from '../components/ui/input'

type Group = {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  memberCount: number
}
type Person = { username: string; label: string }
type GroupDetails = Group & { members: Array<{ username: string; name: string }> }
type GroupMessage = {
  id: string
  sender: string
  senderDisplayName?: string
  text: string
  sentAt: string
  editedAt: string | null
  attachment: { url: string; name: string; type: string } | null
  reactions: Record<string, string[]>
  readByMe: boolean
  allRead: boolean
}

const EmojiPicker = lazy(() => import('emoji-picker-react'))
const quickReactions = ['👍', '❤️', '😂', '🙏', '😮']

const BUILT_IN_SENDER_NAMES: Record<string, string> = {
  admin: 'District Super Admin',
  district: 'District Super Admin',
  headpastor: 'Head Pastor',
  'head-pastor': 'Head Pastor',
  ydmleader: 'District YDM Leader',
  districtydm: 'District YDM Leader',
  'district-ydm': 'District YDM Leader',
  'district-women': 'District Women Leader',
  'think-tank': 'Think Tank Admin',
  'section-pastor': 'Section Pastor Admin',
  'church-pastor': 'Pastor of Church',
  section1: 'Section 1 Admin',
  section2: 'Section 2 Admin',
  section3: 'Section 3 Admin',
  section4: 'Section 4 Admin',
}

function resolveSenderLabel(
  sender: string,
  senderDisplayName?: string,
  directory?: Record<string, string>
): string {
  if (senderDisplayName && senderDisplayName.trim() && senderDisplayName !== sender) {
    return senderDisplayName.trim()
  }
  if (directory) {
    if (directory[sender]) return directory[sender]
    if (directory[sender.toLowerCase()]) return directory[sender.toLowerCase()]
  }
  const lower = sender.toLowerCase()
  if (BUILT_IN_SENDER_NAMES[lower]) {
    return BUILT_IN_SENDER_NAMES[lower]
  }
  if (/^section\d+$/i.test(sender)) {
    return `Section ${sender.replace(/^section/i, '')} Admin`
  }
  return sender
}

const senderColorPalette = [
  'text-emerald-700 dark:text-emerald-400',
  'text-sky-700 dark:text-sky-400',
  'text-violet-700 dark:text-violet-400',
  'text-amber-700 dark:text-amber-400',
  'text-indigo-700 dark:text-indigo-400',
  'text-rose-700 dark:text-rose-400',
  'text-teal-700 dark:text-teal-400',
  'text-pink-700 dark:text-pink-400',
]
function getSenderColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % senderColorPalette.length
  return senderColorPalette[index]
}

function messageDateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startOfDay = (item: Date) =>
    new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime()
  const daysApart = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000)
  if (daysApart === 0) return 'Today'
  if (daysApart === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

async function imagePayload(file: File) {
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) ||
    file.size > 5_000_000
  )
    throw new Error('Choose a JPG, PNG, WebP or GIF image smaller than 5 MB')
  if (file.type === 'image/gif' && file.size > 3_000_000)
    throw new Error('Choose a GIF smaller than 3 MB')
  if (file.type === 'image/gif') {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return { name: file.name, type: file.type, data }
  }
  const source = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare image')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close()
  const data = canvas.toDataURL('image/jpeg', 0.78)
  if (data.length > 4_000_000)
    throw new Error('This image is too large after compression')
  return {
    name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
    type: 'image/jpeg',
    data,
  }
}

async function voicePayload(file: File) {
  if (
    !['audio/webm', 'audio/mp4', 'audio/ogg'].includes(file.type) ||
    file.size > 3_000_000
  )
    throw new Error('Voice message must be smaller than 3 MB')
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return { name: file.name, type: file.type, data }
}

export function GroupMessages({
  onMobileViewChange,
}: {
  onMobileViewChange?: (view: 'list' | 'chat') => void
} = {}) {
  const [groups, setGroups] = useState<Group[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [directory, setDirectory] = useState<Record<string, string>>({ ...BUILT_IN_SENDER_NAMES })
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [username, setUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [details, setDetails] = useState<GroupDetails | null>(null)
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [voice, setVoice] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [reactionFor, setReactionFor] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const active = groups.find((group) => group.id === selected)
  const editingMessage = messages.find((message) => message.id === editingId)

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return groups
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
    )
  }, [groups, searchQuery])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, selected])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/chat-files?mode=groups', {
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load groups')
      setGroups(result.groups || [])
      setSelected((current) =>
        current && result.groups.some((group: Group) => group.id === current)
          ? current
          : result.groups[0]?.id || null
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load groups')
    }
  }

  useEffect(() => {
    void loadGroups()
    fetch('/api/chat-files?mode=group-people', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load members')
        return result
      })
      .then((result) => {
        setPeople(result.people || [])
        setDirectory((prev) => {
          const next = { ...prev }
          const all = Array.isArray(result.allPeople)
            ? result.allPeople
            : Array.isArray(result.people)
            ? result.people
            : []
          for (const person of all) {
            if (person?.username && person?.label) {
              next[person.username] = person.label
              next[person.username.toLowerCase()] = person.label
            }
          }
          return next
        })
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Could not load members')
      )

    fetch('/api/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((result) => setUsername(result.username || ''))
      .catch(() => undefined)

    const timer = window.setInterval(() => void loadGroups(), 10000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setEditingId(null)
    setText('')
    setImage(null)
    setVoice(null)
    setReactionFor(null)
    setEmojiOpen(false)
    if (!selected) {
      setMessages([])
      return
    }
    let live = true
    const load = async () => {
      try {
        const response = await fetch(
          `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`,
          { credentials: 'include' }
        )
        const result = await response.json()
        if (!response.ok)
          throw new Error(result.error || 'Could not load group messages')
        if (live) {
          setMessages(result.messages || [])
          setError('')
          if (
            document.visibilityState === 'visible' &&
            (result.messages as GroupMessage[]).some(
              (message) => message.sender !== username && !message.readByMe
            )
          ) {
            void fetch(
              `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(
                selected
              )}`,
              {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark-read' }),
              }
            ).catch(() => undefined)
          }
        }
      } catch (cause) {
        if (live)
          setError(cause instanceof Error ? cause.message : 'Could not load group messages')
      }
    }

    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 5000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      live = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [selected, username])

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !members.length) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/chat-files?mode=groups', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          members,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create group')
      await loadGroups()
      setSelected(result.group.id)
      setCreating(false)
      setName('')
      setDescription('')
      setMembers([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create group')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!active) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/chat-files?mode=groups', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: active.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete group')
      setDeleting(false)
      setSelected(null)
      await loadGroups()
      window.dispatchEvent(new Event(meetingNotificationsChanged))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete group')
    } finally {
      setBusy(false)
    }
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !selected ||
      (editingId
        ? !text.trim() && !editingMessage?.attachment
        : !text.trim() && !image && !voice)
    )
      return
    setBusy(true)
    setError('')
    try {
      if (editingId) {
        const response = await fetch(
          `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingId, text: text.trim() }),
          }
        )
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not edit message')
        setMessages((current) =>
          current.map((message) =>
            message.id === editingId
              ? { ...message, text: result.text, editedAt: result.editedAt }
              : message
          )
        )
        setEditingId(null)
        setText('')
        return
      }
      const payload: {
        text: string
        image?: { name: string; type: string; data: string }
        voice?: { name: string; type: string; data: string }
      } = { text: text.trim() }
      if (image) payload.image = await imagePayload(image)
      if (voice) payload.voice = await voicePayload(voice)

      const response = await fetch(
        `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send message')
      setMessages((current) => [...current, result.message])
      setText('')
      setImage(null)
      setVoice(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send message')
    } finally {
      setBusy(false)
    }
  }

  const deleteMessage = async (message: GroupMessage) => {
    if (!selected) return
    setError('')
    try {
      const response = await fetch(
        `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: message.id }),
        }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete message')
      setMessages((current) => current.filter((item) => item.id !== message.id))
      if (editingId === message.id) {
        setEditingId(null)
        setText('')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete message')
    }
  }

  const reactToMessage = async (message: GroupMessage, emoji: string) => {
    if (!selected) return
    const removeReaction = Boolean(message.reactions?.[emoji]?.includes(username))
    setError('')
    try {
      const response = await fetch(
        `/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: message.id,
            action: 'reaction',
            emoji,
            remove: removeReaction,
          }),
        }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not update reaction')
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, reactions: result.reactions } : item
        )
      )
      setReactionFor(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update reaction')
    }
  }

  const openDetails = async () => {
    if (!active) return
    setError('')
    try {
      const response = await fetch(
        `/api/chat-files?mode=group-details&groupId=${encodeURIComponent(active.id)}`,
        { credentials: 'include' }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load group details')
      setDetails({ ...result.group, memberCount: result.group.members.length })
      setDirectory((prev) => {
        const next = { ...prev }
        for (const member of result.group.members || []) {
          if (member?.username && member?.name) {
            next[member.username] = member.name
            next[member.username.toLowerCase()] = member.name
          }
        }
        return next
      })
      setDescriptionDraft(result.group.description || '')
      setEditingDescription(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load group details')
    }
  }

  const saveDescription = async (event: FormEvent) => {
    event.preventDefault()
    if (!details) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/chat-files?mode=group-details', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: details.id,
          description: descriptionDraft.trim(),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save description')
      setDetails((current) =>
        current ? { ...current, description: result.description } : current
      )
      setGroups((current) =>
        current.map((group) =>
          group.id === details.id
            ? { ...group, description: result.description }
            : group
        )
      )
      setEditingDescription(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save description')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Mobile View Switcher */}
      <div className="md:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            setMobileView('list')
            onMobileViewChange?.('list')
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'list'
              ? 'bg-white dark:bg-slate-700 text-[var(--ink)] shadow-xs'
              : 'text-[var(--muted-foreground)]'
          }`}
        >
          <Users size={13} />
          <span>Groups ({filteredGroups.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileView('chat')
            onMobileViewChange?.('chat')
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'chat'
              ? 'bg-white dark:bg-slate-700 text-[var(--ink)] shadow-xs'
              : 'text-[var(--muted-foreground)]'
          }`}
        >
          <MessageCircle size={13} />
          <span className="truncate">Chat: {active?.name || 'Group'}</span>
        </button>
      </div>

      <Card className="group-layout panel">
      <aside className={`group-sidebar ${mobileView === 'chat' ? 'mobile-pane-hidden' : ''}`}>
        <div className="group-sidebar-header">
          <div>
            <h2>Groups</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Assigned district teams
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCreating(true)
              setError('')
            }}
            className="h-8 text-xs gap-1"
          >
            <Plus size={13} />
            <span>New</span>
          </Button>
        </div>

        <div className="chat-search-wrap">
          <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            className="chat-search-input"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search groups"
          />
        </div>

        <div className="group-contacts-list">
          {filteredGroups.map((group) => (
            <button
              type="button"
              key={group.id}
              className={
                selected === group.id ? 'group-contact active' : 'group-contact'
              }
              onClick={() => {
                setSelected(group.id)
                setMobileView('chat')
                onMobileViewChange?.('chat')
              }}
            >
              <div className="chat-avatar shrink-0">
                <Users size={19} />
              </div>
              <div className="chat-contact-info">
                <strong>{group.name}</strong>
                <small>{group.memberCount} members</small>
              </div>
              <span className="shrink-0 md:hidden ml-auto">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  selected === group.id
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <span>{selected === group.id ? 'Open chat' : 'Chat'}</span>
                  <ChevronRight size={13} />
                </span>
              </span>
            </button>
          ))}

          {!filteredGroups.length && (
            <div className="py-12 px-4 text-center text-xs text-[var(--muted-foreground)]">
              <Users size={24} className="mx-auto mb-2 opacity-60" />
              <p>No groups found.</p>
            </div>
          )}
        </div>
      </aside>

      <div className={`group-window ${mobileView === 'list' ? 'mobile-pane-hidden' : ''}`}>
        <div className="group-window-head">
          <div className="group-window-head-left min-w-0 flex-1 overflow-hidden">
            <button
              type="button"
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 -ml-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shrink-0 cursor-pointer transition-colors"
              onClick={() => {
                setMobileView('list')
                onMobileViewChange?.('list')
              }}
              aria-label="Back to groups list"
              title="Back to groups"
            >
              <ChevronLeft size={16} />
              <span>Groups</span>
            </button>
            {active ? (
              <>
                <div className="chat-avatar shrink-0">
                  <Users size={20} />
                </div>
                <div className="group-window-head-info min-w-0 flex-1 overflow-hidden">
                  <button
                    type="button"
                    className="text-left hover:underline flex items-center gap-1.5 cursor-pointer max-w-full min-w-0"
                    onClick={() => void openDetails()}
                    title="View group details"
                  >
                    <h2 className="truncate">{active.name}</h2>
                    <Info size={14} className="text-[var(--muted-foreground)] shrink-0" />
                  </button>
                  <p className="truncate">
                    {active.memberCount} members
                    <span className="hidden sm:inline"> · Click to view details</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="group-window-head-info min-w-0 flex-1 overflow-hidden">
                <h2 className="truncate">Select a group</h2>
                <p className="truncate">Choose a group to start collaborating</p>
              </div>
            )}
          </div>

          {active?.createdBy === username && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleting(true)}
              className="group-delete-button shrink-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 w-8 sm:w-auto p-0 sm:px-2.5 gap-1.5"
              aria-label={`Delete group ${active.name}`}
              title="Delete group"
            >
              <Trash2 size={15} className="shrink-0" />
              <span className="hidden sm:inline">Delete Group</span>
            </Button>
          )}
        </div>

        {error && (
          <div
            className="p-2.5 mx-4 mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="group-messages" ref={messagesContainerRef} aria-live="polite">
          {messages.length ? (
            messages.map((message, index) => {
              const isMine =
                message.sender === username ||
                Boolean(username && message.sender.toLowerCase() === username.toLowerCase())
              const senderLabel = resolveSenderLabel(
                message.sender,
                message.senderDisplayName,
                directory
              )
              const prev = index > 0 ? messages[index - 1] : null
              const showDivider =
                index === 0 ||
                new Date(message.sentAt).toDateString() !==
                  new Date(prev!.sentAt).toDateString()

              return (
                <Fragment key={message.id}>
                  {showDivider && (
                    <div className="chat-date-divider" role="separator">
                      {messageDateLabel(message.sentAt)}
                    </div>
                  )}

                  <div className={`chat-message-row ${isMine ? 'mine' : ''}`}>
                    <div className={`chat-bubble-group ${isMine ? 'mine' : ''}`}>
                      {/* Hover Actions Bar */}
                    <div className="message-hover-actions">
                      <button
                        type="button"
                        className="message-action-btn"
                        onClick={() =>
                          setReactionFor((current) =>
                            current === message.id ? null : message.id
                          )
                        }
                        title="React with emoji"
                        aria-label="React"
                      >
                        <Smile size={14} />
                      </button>
                      {isMine && (
                        <>
                          <button
                            type="button"
                            className="message-action-btn"
                            onClick={() => {
                              setEditingId(message.id)
                              setText(message.text)
                              setImage(null)
                              setEmojiOpen(false)
                            }}
                            title="Edit message"
                            aria-label="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="message-action-btn delete"
                            onClick={() => void deleteMessage(message)}
                            title="Delete message"
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Quick Reaction Picker Popup */}
                    {reactionFor === message.id && (
                      <div
                        className={`message-reaction-picker ${
                          isMine ? 'right-0' : 'left-0'
                        }`}
                      >
                        {quickReactions.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => void reactToMessage(message, emoji)}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setReactionFor(null)}
                          className="message-action-btn"
                          style={{ width: 22, height: 22 }}
                          aria-label="Close"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* WhatsApp Group Bubble */}
                    <div className={`group-bubble ${isMine ? 'mine' : ''}`}>
                      {/* Sender identity stays visible for every group message */}
                      <span
                        className={`group-sender-tag ${
                          isMine ? 'mine' : getSenderColor(message.sender)
                        }`}
                      >
                        {senderLabel}{isMine ? ' (You)' : ''}
                      </span>

                      {/* Attachment: Image or Audio */}
                      {message.attachment && (
                        <div className="mb-1.5">
                          {message.attachment.type.startsWith('audio/') ? (
                            <audio
                              controls
                              preload="none"
                              src={message.attachment.url}
                              className="chat-audio"
                              aria-label="Voice message"
                            />
                          ) : (
                            <a
                              href={message.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-lg overflow-hidden hover:opacity-95 transition-opacity"
                            >
                              <img
                                src={message.attachment.url}
                                alt={message.attachment.name}
                                className="chat-attachment-img"
                              />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Message Text */}
                      {message.text && (
                        <span className="chat-text-content">{message.text}</span>
                      )}

                      {/* Inline Float Timestamp & Read Receipts */}
                      <div className="chat-meta">
                        <time>
                          {new Date(message.sentAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.editedAt ? ' · edited' : ''}
                        </time>
                        {isMine && (
                          <span
                            className={
                              message.allRead
                                ? 'message-status read'
                                : 'message-status'
                            }
                            title={message.allRead ? 'Read by all' : 'Sent'}
                            aria-label={message.allRead ? 'Read by all' : 'Sent'}
                          >
                            {message.allRead ? (
                              <CheckCheck size={14} className="text-[#53bdeb]" />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Reactions Row */}
                      {message.reactions &&
                        Object.keys(message.reactions).length > 0 && (
                          <div className="message-reactions">
                            {Object.entries(message.reactions).map(
                              ([emoji, users]) => (
                                <button
                                  type="button"
                                  key={emoji}
                                  onClick={() => void reactToMessage(message, emoji)}
                                  className={`message-reaction-pill ${
                                    users.includes(username) ? 'mine' : ''
                                  }`}
                                  title={`Reacted by ${users.join(', ')}`}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </Fragment>
              )
            })
          ) : (
            <div className="chat-empty">
              <div className="w-14 h-14 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                <MessageCircle size={28} />
              </div>
              <strong>{active ? 'No messages in this group yet' : 'Choose a group'}</strong>
              <span>
                {active
                  ? 'Send the first message to start the district team discussion.'
                  : 'Select a group from the sidebar to view conversations.'}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Compose Bar */}
        <form className="group-compose" onSubmit={send} noValidate>
          {(image || voice || editingId) && (
            <div className="chat-compose-top">
              {editingId && (
                <div className="attachment-chip border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                  <Pencil size={12} className="text-amber-600" />
                  <span className="truncate max-w-[240px]">Editing message</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setText('')
                    }}
                    aria-label="Cancel edit"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
              {image && (
                <div className="attachment-chip">
                  <ImagePlus size={13} className="text-emerald-600" />
                  <span className="truncate max-w-[200px]">{image.name}</span>
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    aria-label="Remove image"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
              {voice && (
                <div className="attachment-chip voice-chip">
                  <VoicePreview file={voice} />
                  <button
                    type="button"
                    onClick={() => setVoice(null)}
                    aria-label="Remove voice note"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="chat-compose-main">
            <label
              className="attachment-button"
              title="Add image"
              aria-label="Add image"
            >
              <ImagePlus size={18} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  setImage(e.target.files?.[0] || null)
                  setVoice(null)
                }}
                disabled={!active || busy || Boolean(editingId)}
              />
            </label>

            <VoiceRecordButton
              disabled={!active || busy || Boolean(editingId)}
              onRecorded={(file) => {
                setVoice(file)
                setImage(null)
                setError('')
              }}
              onError={setError}
            />

            <div className="emoji-wrap">
              <button
                type="button"
                className="emoji-button"
                onClick={() => setEmojiOpen((current) => !current)}
                disabled={!active || busy}
                title="Add emoji"
                aria-label="Add emoji"
              >
                <Smile size={18} />
              </button>
              {emojiOpen && (
                <div className="emoji-picker-surface">
                  <Suspense
                    fallback={
                      <div className="p-4 bg-white dark:bg-slate-800 text-xs">
                        Loading emoji…
                      </div>
                    }
                  >
                    <EmojiPicker
                      width={320}
                      height={380}
                      onEmojiClick={(emoji) => {
                        setText((current) => current + emoji.emoji)
                        setEmojiOpen(false)
                      }}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            <input
              type="text"
              className="chat-input-pill"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                editingId
                  ? 'Edit message...'
                  : active
                  ? `Message ${active.name}...`
                  : 'Select a group to type'
              }
              disabled={!active || busy}
              maxLength={4000}
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={
                !active ||
                busy ||
                (editingId
                  ? !text.trim() && !editingMessage?.attachment
                  : !text.trim() && !image && !voice)
              }
              aria-label={editingId ? 'Save edit' : 'Send message'}
              title={editingId ? 'Save edit' : 'Send message'}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      <Dialog open={creating} onOpenChange={(open) => { if (!open) setCreating(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team Group</DialogTitle>
            <DialogDescription>
              Create a private communication channel with selected district leaders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={create} noValidate className="space-y-4 py-2">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Group Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="e.g. District Committee"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--foreground)]">Description</label>
              <Textarea
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What is the purpose of this group?"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Select Members ({members.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg p-2 space-y-1">
                {people.map((person) => (
                  <label
                    key={person.username}
                    className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={members.includes(person.username)}
                      onChange={(e) =>
                        setMembers((current) =>
                          e.target.checked
                            ? [...current, person.username]
                            : current.filter((v) => v !== person.username)
                        )
                      }
                      className="rounded"
                    />
                    <div className="min-w-0">
                      <strong className="block text-xs font-semibold text-[var(--foreground)] truncate">
                        {person.label}
                      </strong>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {person.username}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !name.trim() || !members.length}>
                {busy ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetails(null) }}>
        <DialogContent className="sm:max-w-md">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>{details.name}</DialogTitle>
                <DialogDescription>
                  Created on{' '}
                  {new Date(details.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  by {details.createdBy}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div>
                  <h4 className="font-semibold text-[var(--foreground)] mb-1">
                    Group Description
                  </h4>
                  {editingDescription ? (
                    <form onSubmit={saveDescription} noValidate className="space-y-2">
                      <Textarea
                        className="resize-none"
                        value={descriptionDraft}
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        maxLength={500}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDescription(false)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" type="submit" disabled={busy}>
                          Save Description
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {details.description || 'No description provided.'}
                      </p>
                      {details.createdBy === username && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setEditingDescription(true)}
                        >
                          <Pencil size={12} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-[var(--foreground)] mb-1">
                    Group Members ({details.members.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg p-2">
                    {details.members.map((member) => (
                      <div
                        key={member.username}
                        className="flex items-center justify-between py-1.5 px-2"
                      >
                        <span className="font-medium text-[var(--foreground)]">
                          {member.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {member.username === details.createdBy ? 'Creator' : member.username}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between w-full">
                {details.createdBy === username ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setDetails(null)
                      setDeleting(true)
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Group</span>
                  </Button>
                ) : <span />}
                <Button variant="outline" onClick={() => setDetails(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting && Boolean(active)} onOpenChange={(open) => { if (!open) setDeleting(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {active?.name}?</DialogTitle>
            <DialogDescription>
              This action will permanently delete this group and all communications for every member.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(false)}
              disabled={busy}
            >
              Keep Group
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void remove()}
              disabled={busy}
            >
              {busy ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </>
  )
}
