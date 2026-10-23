import { useState } from 'react'
import { Camera, ShieldCheck, Trash2 } from 'lucide-react'
import type { UserRole } from '../../types'
import { roleName } from '../../domain/permissions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
} from '../ui/dialog'

export interface ProfileData {
  name: string
  photo: string
  phone: string
  email: string
}

export function ProfileSettingsDialog({
  role,
  profile,
  onClose,
  onSave,
}: {
  role: UserRole
  profile: ProfileData
  onClose: () => void
  onSave: (profile: ProfileData) => Promise<void>
}) {
  const [name, setName] = useState(profile.name)
  const [photo, setPhoto] = useState(profile.photo)
  const [phone, setPhone] = useState(profile.phone || '')
  const [email, setEmail] = useState(profile.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(String(reader.result))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        photo,
        phone: phone.trim(),
        email: email.trim(),
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Profile could not be saved')
    } finally {
      setSaving(false)
    }
  }

  const fallbackName = name.trim() || roleName(role)
  const initials = fallbackName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'DS'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg p-5 sm:p-6 gap-5">
        <DialogCloseButton />

        <DialogHeader className="space-y-1 pb-3 border-b border-[var(--line)]">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-district-500/10 text-district-600 dark:text-district-400 border border-district-500/20 tracking-wider uppercase">
              Account Settings
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--ink)]">
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--muted-foreground)]">
            Update your public name, photo avatar, and contact information.
          </DialogDescription>
        </DialogHeader>

        {/* Photo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-[var(--line)]">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-district-700 to-district-900 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white dark:border-slate-800">
              {photo ? (
                <img src={photo} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <label
              htmlFor="profile-photo-upload"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-district-600 hover:bg-district-700 text-white shadow-sm cursor-pointer transition-transform active:scale-95 border-2 border-white dark:border-slate-800"
              title="Upload new photo"
              aria-label="Upload photo"
            >
              <Camera size={14} />
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={choose}
                className="sr-only hidden"
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--ink)]">Profile Photo</h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              Square JPG, PNG, or WebP up to 5MB.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label
                htmlFor="profile-photo-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-[var(--ink)] border border-[var(--line)] hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs cursor-pointer transition-colors"
              >
                <Camera size={13} className="text-district-500" />
                <span>{photo ? 'Change photo' : 'Upload photo'}</span>
              </label>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Role Info */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-district-50/70 dark:bg-district-950/30 border border-district-200/80 dark:border-district-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-district-600/10 text-district-600 dark:text-district-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} />
            </div>
            <div>
              <span className="block text-[10.5px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                Assigned Role
              </span>
              <strong className="block text-sm font-bold text-[var(--ink)]">
                {roleName(role)}
              </strong>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Active
          </span>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="profile-display-name" className="block text-xs font-semibold text-[var(--ink)]">
              Display Name
            </label>
            <Input
              id="profile-display-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={roleName(role)}
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Name displayed across chat messages, meetings, and activity logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="block text-xs font-semibold text-[var(--ink)]">
                Phone Number
              </label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="block text-xs font-semibold text-[var(--ink)]">
                Email Address
              </label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300" role="alert">
            {error}
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-[var(--line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} loading={saving} disabled={saving}>
            {saving ? 'Saving changes…' : 'Save profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
