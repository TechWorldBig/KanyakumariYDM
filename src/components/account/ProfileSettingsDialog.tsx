import { useState } from "react";
import type { UserRole } from "../../types";
import { roleName } from "../../domain/permissions";
export interface ProfileData {
  name: string;
  photo: string;
  phone: string;
  email: string;
}
type ThemePreference = 'light' | 'dark' | 'system';
export function ProfileSettingsDialog({
  role,
  profile,
  onClose,
  onSave,
}: {
  role: UserRole;
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => Promise<void>;
}) {
  const [name, setName] = useState(profile.name),
    [photo, setPhoto] = useState(profile.photo),
    [phone, setPhone] = useState(profile.phone || ''),
    [email, setEmail] = useState(profile.email || ''),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('district-theme') as ThemePreference) || 'system'),
    [initialTheme] = useState<ThemePreference>(() => (localStorage.getItem('district-theme') as ThemePreference) || 'system');
  const applyTheme = (next: ThemePreference) => { setTheme(next); document.body.dataset.theme = next; };
  const close = () => { document.body.dataset.theme = initialTheme; onClose(); };
  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }
  async function save() {
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), photo, phone: phone.trim(), email: email.trim() });
      localStorage.setItem('district-theme', theme);
      document.body.dataset.theme = theme;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Profile could not be saved');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="section-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="section-modal profile-settings-dialog">
        <button
          className="section-modal-close"
          onClick={close}
          aria-label="Close"
        >
          ×
        </button>
        <span className="eyebrow">Account settings</span>
        <h2 id="profile-settings-title">Profile settings</h2>
        <p className="modal-town">
          Update how your name and photo appear across the workspace.
        </p>
        <div className="profile-photo-editor">
          <div className="profile-photo-preview">
            {photo ? (
              <img src={photo} alt="Profile preview" />
            ) : (
              <span>{name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <label className="photo-upload">
            Upload photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={choose}
            />
          </label>
        </div>
        <label className="profile-name-field">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={roleName(role)}
          />
        </label>
        <label className="profile-name-field">Phone number<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></label>
        <label className="profile-name-field">Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
        <div className="profile-settings-scope">
          <span>Role</span>
          <strong>{roleName(role)}</strong>
        </div>
        <label className="profile-name-field">
          Appearance
          <select value={theme} onChange={(event) => applyTheme(event.target.value as ThemePreference)}>
            <option value="system">Use device setting</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="dialog-actions">
          <button className="subtle" onClick={close}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
