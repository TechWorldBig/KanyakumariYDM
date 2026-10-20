import { ImagePlus, MessageCircle, Plus, Send, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { meetingNotificationsChanged } from '../components/layout/MeetingNotifications'

type Group = { id: string; name: string; description: string; createdBy: string; createdAt: string; memberCount: number }
type Person = { username: string; label: string }
type GroupDetails = Group & { members: Array<{ username: string; name: string }> }
type GroupMessage = { id: string; sender: string; text: string; sentAt: string; attachment: { url: string; name: string; type: string } | null }

async function imagePayload(file: File) {
  if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type) || file.size > 5_000_000) throw new Error('Choose a JPG, PNG, WebP or GIF image smaller than 5 MB')
  if (file.type === 'image/gif' && file.size > 3_000_000) throw new Error('Choose a GIF smaller than 3 MB')
  if (file.type === 'image/gif') {
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
    return { name: file.name, type: file.type, data }
  }
  const source = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not prepare image')
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close()
  const data = canvas.toDataURL('image/jpeg', 0.78)
  if (data.length > 4_000_000) throw new Error('This image is too large after compression')
  return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data }
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = groups.find(group => group.id === selected)

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/chat-files?mode=groups', { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load groups')
      setGroups(result.groups || [])
      setSelected(current => current && result.groups.some((group: Group) => group.id === current) ? current : result.groups[0]?.id || null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load groups') }
  }

  useEffect(() => {
    void loadGroups()
    fetch('/api/chat-files?mode=group-people', { credentials: 'include' }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load members'); return result }).then(result => setPeople(result.people || [])).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load members'))
    fetch('/api/session', { credentials: 'include' }).then(response => response.json()).then(result => setUsername(result.username || '')).catch(() => undefined)
    const timer = window.setInterval(() => void loadGroups(), 10000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selected) { setMessages([]); return }
    let live = true
    const load = async () => {
      try {
        const response = await fetch(`/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`, { credentials: 'include' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load group messages')
        if (live) { setMessages(result.messages || []); setError('') }
      } catch (cause) { if (live) setError(cause instanceof Error ? cause.message : 'Could not load group messages') }
    }
    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => { live = false; window.clearInterval(timer) }
  }, [selected])

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !members.length) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/chat-files?mode=groups', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), description: description.trim(), members }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create group')
      await loadGroups()
      setSelected(result.group.id)
      setCreating(false); setName(''); setDescription(''); setMembers([])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create group') }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!active) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/chat-files?mode=groups', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId: active.id }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not delete group')
      setDeleting(false); setSelected(null); await loadGroups()
      window.dispatchEvent(new Event(meetingNotificationsChanged))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete group') }
    finally { setBusy(false) }
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || (!text.trim() && !image)) return
    setBusy(true); setError('')
    try {
      const payload: { text: string; image?: { name: string; type: string; data: string } } = { text: text.trim() }
      if (image) payload.image = await imagePayload(image)
      const response = await fetch(`/api/chat-files?mode=group-messages&groupId=${encodeURIComponent(selected)}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send message')
      setMessages(current => [...current, result.message])
      setText(''); setImage(null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send message') }
    finally { setBusy(false) }
  }

  const openDetails = async () => {
    if (!active) return
    setError('')
    try {
      const response = await fetch(`/api/chat-files?mode=group-details&groupId=${encodeURIComponent(active.id)}`, { credentials: 'include' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load group details')
      setDetails({ ...result.group, memberCount: result.group.members.length })
      setDescriptionDraft(result.group.description || '')
      setEditingDescription(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load group details') }
  }

  const saveDescription = async (event: FormEvent) => {
    event.preventDefault()
    if (!details) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/chat-files?mode=group-details', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId: details.id, description: descriptionDraft.trim() }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save description')
      setDetails(current => current ? { ...current, description: result.description } : current)
      setGroups(current => current.map(group => group.id === details.id ? { ...group, description: result.description } : group))
      setEditingDescription(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save description') }
    finally { setBusy(false) }
  }

  return <div className="group-layout panel">
    <aside className="group-sidebar"><div className="group-sidebar-head"><h2>Groups</h2><button type="button" className="subtle" onClick={() => { setCreating(true); setError('') }}><Plus size={14}/> New</button></div><p className="muted group-hint">Only selected members can see a group.</p>{groups.map(group => <button type="button" key={group.id} className={`group-contact${selected === group.id ? ' active' : ''}`} onClick={() => setSelected(group.id)}><span className="chat-avatar"><Users size={16}/></span><span><strong>{group.name}</strong><small>{group.memberCount} members</small></span></button>)}{!groups.length && <p className="muted group-empty">Create a group to share messages and images.</p>}</aside>
    <div className="group-window"><div className="group-window-head"><div>{active ? <h2><button type="button" className="group-name-button" onClick={() => void openDetails()} title="View group details">{active.name}</button></h2> : <h2>Select a group</h2>}{active && <p className="muted">{active.memberCount} members · Click the name for details</p>}</div>{active?.createdBy === username && <button type="button" className="subtle group-delete" onClick={() => setDeleting(true)}><Trash2 size={14}/> Delete group</button>}</div>{error && <div className="form-error" role="alert">{error}</div>}<div className="group-messages" aria-live="polite">{messages.length ? messages.map(message => <div className={`group-bubble${message.sender === username ? ' mine' : ''}`} key={message.id}><strong>{message.sender}</strong>{message.text && <p>{message.text}</p>}{message.attachment && <a href={message.attachment.url} target="_blank" rel="noreferrer"><img src={message.attachment.url} alt={message.attachment.name}/></a>}<time>{new Date(message.sentAt).toLocaleString('en-IN')}</time></div>) : <div className="chat-empty"><MessageCircle size={28}/><strong>{active ? 'No messages yet' : 'Choose a group'}</strong></div>}</div><form className="group-compose" onSubmit={send}><label className="group-image-button" title="Add image"><ImagePlus size={18}/><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => setImage(event.target.files?.[0] || null)} disabled={!active || busy}/></label><div className="group-compose-input">{image && <span>{image.name} <button type="button" onClick={() => setImage(null)} aria-label="Remove image"><X size={13}/></button></span>}<input value={text} onChange={event => setText(event.target.value)} placeholder={active ? `Message ${active.name}` : 'Select a group'} disabled={!active || busy} maxLength={4000}/></div><button className="primary" disabled={!active || busy || (!text.trim() && !image)} aria-label="Send group message"><Send size={16}/></button></form></div>
    {creating && <div className="meeting-dialog-backdrop"><form className="panel group-dialog" role="dialog" aria-modal="true" aria-labelledby="create-group-title" onSubmit={create}><h2 id="create-group-title">Create group</h2>{error && <p className="form-error" role="alert">{error}</p>}<label>Group name<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required autoFocus/></label><label>Team description<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={3} placeholder="What is this group for?"/></label><fieldset><legend>Select members</legend><div className="group-people">{people.map(person => <label key={person.username}><input type="checkbox" checked={members.includes(person.username)} onChange={event => setMembers(current => event.target.checked ? [...current,person.username] : current.filter(value => value !== person.username))}/><span>{person.label}<small>{person.username}</small></span></label>)}</div></fieldset><div className="meeting-dialog-actions"><button className="subtle" type="button" onClick={() => setCreating(false)}>Cancel</button><button className="primary" disabled={busy || !name.trim() || !members.length}>{busy ? 'Creating…' : 'Create group'}</button></div></form></div>}
    {details && <div className="meeting-dialog-backdrop"><div className="panel group-dialog" role="dialog" aria-modal="true" aria-labelledby="group-details-title"><div className="group-details-head"><h2 id="group-details-title">{details.name}</h2><button type="button" className="subtle" onClick={() => setDetails(null)} aria-label="Close group details"><X size={16}/></button></div><p className="muted">Created {new Date(details.createdAt).toLocaleString('en-IN')} by {details.createdBy}</p>{error && <p className="form-error" role="alert">{error}</p>}<div><strong>Team description</strong>{editingDescription ? <form className="group-description-form" onSubmit={saveDescription}><textarea value={descriptionDraft} onChange={event => setDescriptionDraft(event.target.value)} maxLength={500} rows={4} autoFocus/><div className="meeting-dialog-actions"><button type="button" className="subtle" onClick={() => setEditingDescription(false)}>Cancel</button><button className="primary" disabled={busy}>Save description</button></div></form> : <><p>{details.description || 'No description added.'}</p>{details.createdBy === username && <button type="button" className="subtle group-description-edit" onClick={() => setEditingDescription(true)}>Edit description</button>}</>}</div><div><strong>Members ({details.members.length})</strong><ul className="group-member-list">{details.members.map(member => <li key={member.username}>{member.name}<small>{member.username === details.createdBy ? 'Creator · ' : ''}{member.username}</small></li>)}</ul></div></div></div>}
    {deleting && active && <div className="meeting-dialog-backdrop"><div className="panel group-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-group-title"><h2 id="delete-group-title">Delete {active.name}?</h2><p className="muted">This deletes the group and its messages for every member.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="meeting-dialog-actions"><button className="subtle" type="button" onClick={() => setDeleting(false)} disabled={busy}>Keep group</button><button className="primary" type="button" onClick={() => void remove()} disabled={busy}>{busy ? 'Deleting…' : 'Delete group'}</button></div></div></div>}
  </div>
}
