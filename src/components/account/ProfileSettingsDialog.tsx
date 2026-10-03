import { useState } from "react";
import type { UserRole } from "../../types";
import { roleName } from "../../domain/permissions";
export interface ProfileData {
  name: string;
  photo: string;
}
export function ProfileSettingsDialog({
  role,
  profile,
  onClose,
  onSave,
}: {
  role: UserRole;
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
}) {
  const [name, setName] = useState(profile.name),
    [photo, setPhoto] = useState(profile.photo);
  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <div
      className="section-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-modal profile-settings-dialog">
        <button
          className="section-modal-close"
          onClick={onClose}
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
        <div className="profile-settings-scope">
          <span>Role</span>
          <strong>{roleName(role)}</strong>
        </div>
        <div className="dialog-actions">
          <button className="subtle" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() =>
              onSave({ name: name.trim() || roleName(role), photo })
            }
          >
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}
