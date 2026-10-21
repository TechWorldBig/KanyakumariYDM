import { useState } from 'react'
import type { Section } from '../../types'
import { Button } from '../ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'

export function AddSectionDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (section: Section) => void }) {
  const [name, setName] = useState('')
  const [town, setTown] = useState('')
  const [admin, setAdmin] = useState('')
  const [error, setError] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !town.trim() || !admin.trim()) { setError('Complete all fields before creating the section.'); return }
    onCreate({ name: name.trim(), town: town.trim(), admin: admin.trim(), churches: 0, users: 1, tone: 'blue', health: 100 })
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="add-section-dialog">
      <DialogClose />
      <span className="eyebrow">District administration</span>
      <DialogTitle className="text-2xl font-semibold tracking-tight">Create a section</DialogTitle>
      <DialogDescription className="modal-town">Set the section identity and its first Super Admin.</DialogDescription>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <label>Section name<Input value={name} onChange={event => setName(event.target.value)} placeholder="Example: Section 5" /></label>
        <label>Location / area<Input value={town} onChange={event => setTown(event.target.value)} placeholder="Example: Colachel East" /></label>
        <label>Super Admin username<Input value={admin} onChange={event => setAdmin(event.target.value)} placeholder="Example: section5" /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Create section</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}
