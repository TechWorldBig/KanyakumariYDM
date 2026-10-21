import { useState } from 'react'
import type { UserRole } from '../../types'
import { roleName } from '../../domain/permissions'
import { Button } from '../ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

export interface ProfileData { name: string; photo: string; phone: string; email: string }
type ThemePreference = 'light' | 'dark' | 'system'

export function ProfileSettingsDialog({ role, profile, onClose, onSave }: { role: UserRole; profile: ProfileData; onClose: () => void; onSave: (profile: ProfileData) => Promise<void> }) {
  const [name, setName] = useState(profile.name)
  const [photo, setPhoto] = useState(profile.photo)
  const [phone, setPhone] = useState(profile.phone || '')
  const [email, setEmail] = useState(profile.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('district-theme') as ThemePreference) || 'system')
  const [initialTheme] = useState<ThemePreference>(() => (localStorage.getItem('district-theme') as ThemePreference) || 'system')
  const applyTheme = (next: ThemePreference) => { setTheme(next); document.body.dataset.theme = next }
  const close = () => { document.body.dataset.theme = initialTheme; onClose() }

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    setError('')
    try { await onSave({ name: name.trim(), photo, phone: phone.trim(), email: email.trim() }); localStorage.setItem('district-theme', theme); document.body.dataset.theme = theme }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Profile could not be saved') }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent className="profile-settings-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogClose />
      <span className="eyebrow">Account settings</span>
      <DialogTitle className="text-2xl font-semibold tracking-tight">Profile settings</DialogTitle>
      <DialogDescription className="modal-town">Update how your name and photo appear across the workspace.</DialogDescription>
      <div className="profile-photo-editor"><div className="profile-photo-preview">{photo ? <img src={photo} alt="Profile preview" /> : <span>{name.slice(0, 2).toUpperCase()}</span>}</div><label className="photo-upload">Upload photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} /></label></div>
      <label className="profile-name-field">Display name<input value={name} onChange={(event) => setName(event.target.value)} placeholder={roleName(role)} /></label>
      <label className="profile-name-field">Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></label>
      <label className="profile-name-field">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
      <div className="profile-settings-scope"><span>Role</span><strong>{roleName(role)}</strong></div>
      <label className="profile-name-field">Appearance<select value={theme} onChange={(event) => applyTheme(event.target.value as ThemePreference)}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="dialog-actions"><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button></div>
    </DialogContent>
  </Dialog>
}
