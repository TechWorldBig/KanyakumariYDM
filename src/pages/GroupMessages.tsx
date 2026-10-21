import {
  Check,
  CheckCheck,
  ImagePlus,
  Info,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
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

export function GroupMessages() {
  const [groups, setGroups] = useState<Group[]>([])
  const [people, setPeople] = useState<Person[]>([])
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

  const active = groups.find((group) => group.id === selected)
  const editingMessage = messages.find((message) => message.id === editingId)

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
      .then((result) => setPeople(result.people || []))
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
    <Card className="p-0 overflow-hidden border border-[var(--border)] shadow-xs flex flex-col md:flex-row h-[720px]">
      <aside className="w-full md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--muted)]/15 shrink-0">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Groups
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Restricted to assigned members
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

        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {groups.map((group) => (
            <button
              type="button"
              key={group.id}
              className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-[var(--muted)]/40 ${
                selected === group.id
                  ? 'bg-[var(--color-district-50)] dark:bg-[var(--color-district-950)]/40 border-l-2 border-l-[var(--color-district-600)]'
                  : ''
              }`}
              onClick={() => setSelected(group.id)}
            >
              <div className="h-10 w-10 rounded-full bg-[var(--color-district-100)] dark:bg-[var(--color-district-900)] text-[var(--color-district-700)] dark:text-[var(--color-district-300)] flex items-center justify-center font-bold text-xs shrink-0">
                <Users size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-semibold text-[var(--foreground)] truncate">
                  {group.name}
                </strong>
                <small className="block text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                  {group.memberCount} members
                </small>
              </div>
            </button>
          ))}

          {!groups.length && (
            <div className="py-12 px-4 text-center text-xs text-[var(--muted-foreground)]">
              <Users size={24} className="mx-auto mb-2 opacity-60" />
              <p>No groups created yet. Create a group to collaborate with team members.</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-[var(--card)] min-w-0">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--muted)]/10">
          <div>
            {active ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--color-district-600)] hover:underline flex items-center gap-1.5"
                  onClick={() => void openDetails()}
                  title="View group details"
                >
                  <span>{active.name}</span>
                  <Info size={14} className="text-[var(--muted-foreground)]" />
                </button>
                <Badge variant="outline" className="text-[10px] py-0">
                  {active.memberCount} members
                </Badge>
              </div>
            ) : (
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Select a group
              </h2>
            )}
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              {active ? 'Click name to view details & member list' : 'Choose a group from the list'}
            </p>
          </div>

          {active?.createdBy === username && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleting(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 gap-1.5"
            >
              <Trash2 size={13} />
              <span>Delete Group</span>
            </Button>
          )}
        </div>

        {error && (
          <div className="p-2.5 mx-4 mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium" role="alert">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
          {messages.length ? (
            messages.map((message) => {
              const isMine = message.sender === username
              return (
                <div
                  key={message.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-[var(--muted-foreground)] px-1 mb-0.5">
                    {message.sender}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-2 ${
                      isMine
                        ? 'bg-[var(--color-district-600)] text-white rounded-br-xs'
                        : 'bg-[var(--muted)] text-[var(--foreground)] rounded-bl-xs border border-[var(--border)]'
                    }`}
                  >
                    {message.text && (
                      <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    )}

                    {message.attachment &&
                      (message.attachment.type.startsWith('audio/') ? (
                        <audio
                          controls
                          preload="none"
                          src={message.attachment.url}
                          className="w-56 h-8"
                          aria-label="Voice message"
                        />
                      ) : (
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden border border-white/20 mt-1"
                        >
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="max-h-56 object-cover"
                          />
                        </a>
                      ))}

                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <button
                            type="button"
                            key={emoji}
                            className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border ${
                              users.includes(username)
                                ? 'bg-white/20 border-white/40 text-white'
                                : 'bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]'
                            }`}
                            onClick={() => void reactToMessage(message, emoji)}
                          >
                            <span>{emoji}</span>
                            <span>{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] px-1 mt-0.5">
                    <time>
                      {new Date(message.sentAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {message.editedAt ? ' (edited)' : ''}
                    </time>

                    {isMine && (
                      <span title={message.allRead ? 'Read by all' : 'Sent'}>
                        {message.allRead ? (
                          <CheckCheck size={12} className="text-emerald-500" />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setReactionFor((current) =>
                          current === message.id ? null : message.id
                        )
                      }
                      className="hover:text-[var(--foreground)]"
                      aria-label="React"
                    >
                      <Smile size={11} />
                    </button>

                    {isMine && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(message.id)
                            setText(message.text)
                            setImage(null)
                            setEmojiOpen(false)
                          }}
                          className="hover:text-[var(--foreground)]"
                          aria-label="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteMessage(message)}
                          className="hover:text-rose-500"
                          aria-label="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>

                  {reactionFor === message.id && (
                    <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full p-1 shadow-md my-1">
                      {quickReactions.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => void reactToMessage(message, emoji)}
                          className="hover:scale-125 transition-transform p-1 text-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="py-24 text-center text-sm text-[var(--muted-foreground)]">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
              <strong className="block font-semibold text-[var(--foreground)]">
                {active ? 'No messages in this group yet' : 'Choose a group'}
              </strong>
              <span className="text-xs">
                {active ? 'Send the first message to start the discussion.' : 'Select a group to see communications.'}
              </span>
            </div>
          )}
        </div>

        <form
          className="p-3 border-t border-[var(--border)] flex items-center gap-2 bg-[var(--muted)]/10"
          onSubmit={send}
          noValidate
        >
          <label
            className="h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            title="Add image"
          >
            <ImagePlus size={17} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
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

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setEmojiOpen((current) => !current)}
              disabled={!active || busy}
              aria-label="Add emoji"
            >
              <Smile size={17} />
            </Button>
            {emojiOpen && (
              <div className="absolute bottom-11 left-0 z-20 shadow-xl rounded-xl overflow-hidden border border-[var(--border)]">
                <Suspense fallback={<div className="p-3 bg-[var(--card)] text-xs">Loading emoji…</div>}>
                  <EmojiPicker
                    width={300}
                    height={350}
                    onEmojiClick={(emoji) => {
                      setText((current) => current + emoji.emoji)
                      setEmojiOpen(false)
                    }}
                  />
                </Suspense>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2">
            {image && (
              <Badge variant="outline" className="text-xs gap-1 py-1">
                <span className="truncate max-w-28">{image.name}</span>
                <button type="button" onClick={() => setImage(null)}>
                  <X size={12} />
                </button>
              </Badge>
            )}
            {voice && (
              <div className="flex items-center gap-1">
                <VoicePreview file={voice} />
                <button type="button" onClick={() => setVoice(null)}>
                  <X size={13} />
                </button>
              </div>
            )}
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                editingId
                  ? 'Edit message'
                  : active
                  ? `Message ${active.name}...`
                  : 'Select a group to type'
              }
              disabled={!active || busy}
              maxLength={4000}
              className="h-9 text-xs"
            />
          </div>

          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-xs"
              onClick={() => {
                setEditingId(null)
                setText('')
              }}
              aria-label="Cancel editing"
            >
              <X size={15} />
            </Button>
          )}

          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={
              !active ||
              busy ||
              (editingId
                ? !text.trim() && !editingMessage?.attachment
                : !text.trim() && !image && !voice)
            }
            aria-label={editingId ? 'Save edit' : 'Send message'}
          >
            <Send size={15} />
          </Button>
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
                    className="flex items-center gap-2.5 p-1.5 hover:bg-[var(--muted)]/50 rounded cursor-pointer text-xs"
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
                    <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)]">
                      <p className="text-[var(--muted-foreground)] leading-relaxed">
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

              <DialogFooter>
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
  )
}
