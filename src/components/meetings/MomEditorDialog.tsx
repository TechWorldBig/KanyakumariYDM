import { useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  ListPlus,
  Plus,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Input, Textarea } from '../ui/input'
import type {
  AttendeeStatus,
  Meeting,
  MeetingActionItem,
  MeetingAttendee,
  MeetingMOM,
} from '../../domain/meetings'
import {
  defaultDistrictAttendees,
  sampleActionItemsTemplate,
  sampleDecisionsTemplate,
  sampleDiscussionPointsTemplate,
} from '../../domain/meetings'

export function MomEditorDialog({
  meeting,
  currentUsername,
  currentRole,
  onClose,
  onPublish,
}: {
  meeting: Meeting
  currentUsername: string
  currentRole: string
  onClose: () => void
  onPublish: (mom: MeetingMOM) => Promise<void>
}) {
  const existingMom = meeting.mom

  const [title, setTitle] = useState(
    existingMom?.title || `${meeting.title} — Minutes of Meeting`
  )
  const [locationOrPlatform, setLocationOrPlatform] = useState(
    existingMom?.locationOrPlatform || 'Google Meet / District Virtual Chamber'
  )
  const [closingRemarks, setClosingRemarks] = useState(
    existingMom?.closingRemarks ||
      'Closing prayer led by attendee. Meeting officially adjourned.'
  )

  // Initialize attendance with existing MOM or default district leadership
  const [attendees, setAttendees] = useState<MeetingAttendee[]>(() => {
    if (existingMom?.attendance?.length) return existingMom.attendance
    return defaultDistrictAttendees.map((item, idx) => ({
      id: `attendee-${idx}`,
      name: item.name,
      role: item.role,
      status: 'present' as AttendeeStatus,
    }))
  })

  const [newAttendeeName, setNewAttendeeName] = useState('')
  const [newAttendeeRole, setNewAttendeeRole] = useState('')
  const [showAddAttendee, setShowAddAttendee] = useState(false)

  // Discussion Points (What they discussed as points)
  const [discussionPoints, setDiscussionPoints] = useState<string[]>(() => {
    if (existingMom?.discussionPoints?.length) return existingMom.discussionPoints
    return [
      'Reviewed district-wide ministry growth and verified youth participation targets.',
      'Discussed local church coordination, pastoral updates, and administrative approvals.',
    ]
  })
  const [newPoint, setNewPoint] = useState('')

  // Decisions
  const [decisions, setDecisions] = useState<string[]>(() => {
    if (existingMom?.decisions?.length) return existingMom.decisions
    return ['Approved district conference schedule and delegate allocations.']
  })
  const [newDecision, setNewDecision] = useState('')

  // Action Items
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(() => {
    if (existingMom?.actionItems?.length) return existingMom.actionItems
    return [
      {
        task: 'Circulate MOM summary to all local church pastors and youth coordinators',
        assignee: 'District Super Admin',
        deadline: 'Within 24 hours',
      },
    ]
  })
  const [newTask, setNewTask] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Attendance helpers
  const setAttendeeStatus = (id: string, status: AttendeeStatus) => {
    setAttendees((curr) =>
      curr.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  const markAllStatus = (status: AttendeeStatus) => {
    setAttendees((curr) => curr.map((a) => ({ ...a, status })))
  }

  const addCustomAttendee = () => {
    if (!newAttendeeName.trim()) return
    setAttendees((curr) => [
      ...curr,
      {
        id: `custom-${Date.now()}`,
        name: newAttendeeName.trim(),
        role: newAttendeeRole.trim() || 'Church Leader / Guest',
        status: 'present',
      },
    ])
    setNewAttendeeName('')
    setNewAttendeeRole('')
    setShowAddAttendee(false)
  }

  const removeAttendee = (id: string) => {
    setAttendees((curr) => curr.filter((a) => a.id !== id))
  }

  // Discussion Points helpers
  const addDiscussionPoint = () => {
    if (!newPoint.trim()) return
    setDiscussionPoints((curr) => [...curr, newPoint.trim()])
    setNewPoint('')
  }

  const removeDiscussionPoint = (index: number) => {
    setDiscussionPoints((curr) => curr.filter((_, idx) => idx !== index))
  }

  const loadTemplate = () => {
    setDiscussionPoints(sampleDiscussionPointsTemplate)
    setDecisions(sampleDecisionsTemplate)
    setActionItems(sampleActionItemsTemplate)
  }

  // Decision helpers
  const addDecision = () => {
    if (!newDecision.trim()) return
    setDecisions((curr) => [...curr, newDecision.trim()])
    setNewDecision('')
  }

  const removeDecision = (index: number) => {
    setDecisions((curr) => curr.filter((_, idx) => idx !== index))
  }

  // Action Items helpers
  const addActionItem = () => {
    if (!newTask.trim() || !newAssignee.trim()) return
    setActionItems((curr) => [
      ...curr,
      {
        task: newTask.trim(),
        assignee: newAssignee.trim(),
        deadline: newDeadline.trim() || undefined,
      },
    ])
    setNewTask('')
    setNewAssignee('')
    setNewDeadline('')
  }

  const removeActionItem = (index: number) => {
    setActionItems((curr) => curr.filter((_, idx) => idx !== index))
  }

  const presentCount = attendees.filter((a) => a.status === 'present').length

  const handlePublish = async () => {
    if (!title.trim()) {
      setError('Please provide a title for the Minutes of Meeting')
      return
    }
    if (!discussionPoints.length) {
      setError('Please add at least one discussion point detailing what was discussed')
      return
    }

    setSaving(true)
    setError('')
    try {
      const momData: MeetingMOM = {
        title: title.trim(),
        meetingId: meeting.id,
        conductedAt: meeting.scheduled_for,
        endedAt: new Date().toISOString(),
        organiserName: currentUsername || meeting.started_by,
        organiserRole: currentRole || 'Meeting Organiser',
        locationOrPlatform: locationOrPlatform.trim() || 'Google Meet',
        attendance: attendees,
        agendaPoints: discussionPoints.slice(0, 3),
        discussionPoints,
        decisions,
        actionItems,
        closingRemarks: closingRemarks.trim(),
        publishedAt: new Date().toISOString(),
        publishedBy: currentUsername || meeting.started_by,
      }

      await onPublish(momData)
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not publish Minutes of Meeting'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-district-500/10 text-district-600 dark:text-district-400 border border-district-500/20 tracking-wider uppercase">
                  <FileCheck2 size={12} />
                  <span>Minutes of Meeting</span>
                </span>
                <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                  #{meeting.id}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Meeting Minutes
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Record attendance, discussions, and action items.
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTemplate}
              className="text-xs shrink-0 gap-1.5"
              title="Pre-populate with sample district agenda and discussion template"
            >
              <ListPlus size={13} />
              <span className="hidden sm:inline">Load Sample Points</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* MOM Title & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                MOM Title / Meeting Subject
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. District YDM Leadership Council — Official Minutes"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                Meeting Platform / Location
              </label>
              <Input
                value={locationOrPlatform}
                onChange={(e) => setLocationOrPlatform(e.target.value)}
                placeholder="e.g. Google Meet / District Office"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)]">
                Conducted On
              </label>
              <Input
                type="text"
                disabled
                value={new Date(meeting.scheduled_for).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                className="bg-slate-100 dark:bg-slate-800 text-[var(--muted-foreground)] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Section 1: Member Attendance Tracking */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Meeting Attendance ({presentCount} / {attendees.length} Present)
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Verify which council members were present, absent, or excused.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAllStatus('present')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  All Present
                </button>
                <span className="text-[var(--border)]">·</span>
                <button
                  type="button"
                  onClick={() => setShowAddAttendee((v) => !v)}
                  className="text-xs text-district-600 dark:text-district-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <UserPlus size={12} />
                  <span>Add Guest</span>
                </button>
              </div>
            </div>

            {/* Optional Add Custom Attendee Row */}
            {showAddAttendee && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border)] flex flex-col sm:flex-row gap-2.5 items-end">
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Member / Guest Name</label>
                  <Input
                    value={newAttendeeName}
                    onChange={(e) => setNewAttendeeName(e.target.value)}
                    placeholder="e.g. Pastor John Samuel"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Role or Church</label>
                  <Input
                    value={newAttendeeRole}
                    onChange={(e) => setNewAttendeeRole(e.target.value)}
                    placeholder="e.g. Nagercoil Church Pastor"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addCustomAttendee}
                    className="h-8 text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddAttendee(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Attendee rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-semibold text-[var(--foreground)] truncate">
                      {attendee.name}
                    </strong>
                    <span className="block text-[10.5px] text-[var(--muted-foreground)] truncate">
                      {attendee.role}
                    </span>
                  </div>

                  {/* 3-State Toggle */}
                  <div className="flex items-center rounded-lg bg-[var(--surface-subtle)] p-0.5 border border-[var(--border)] shrink-0 text-[10.5px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setAttendeeStatus(attendee.id, 'present')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        attendee.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                      title="Mark Present"
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeStatus(attendee.id, 'absent')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        attendee.status === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                      title="Mark Absent"
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendeeStatus(attendee.id, 'excused')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        attendee.status === 'excused'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                      title="Mark Excused"
                    >
                      Excused
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: What They Discussed (Discussion Points as Points) */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  What Was Discussed in Meeting (Discussion Points)
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Record what was discussed as clear, structured bullet points.
                </p>
              </div>
            </div>

            {/* Current Discussion Points List */}
            <div className="space-y-2">
              {discussionPoints.map((point, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-[var(--border)] flex items-start gap-3 group"
                >
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-[var(--border)] text-district-600 dark:text-district-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-xs text-[var(--foreground)] flex-1 whitespace-pre-wrap leading-relaxed">
                    {point}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeDiscussionPoint(index)}
                    className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove point"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Input to Add a New Discussion Point */}
            <div className="flex items-start gap-2 pt-1">
              <Textarea
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    addDiscussionPoint()
                  }
                }}
                placeholder="Type a discussed point (e.g. Reviewed Sunday School senior transitions and approved youth rally budget)..."
                rows={2}
                className="text-xs resize-none"
              />
              <Button
                type="button"
                onClick={addDiscussionPoint}
                disabled={!newPoint.trim()}
                className="shrink-0 h-10 px-3.5 text-xs gap-1.5"
              >
                <Plus size={14} />
                <span>Add Point</span>
              </Button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl+Enter</kbd> to quickly add points.
            </p>
          </div>

          {/* Section 3: Key Decisions Taken */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Key Decisions Agreed & Approved (Optional)
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {decisions.map((decision, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex items-start gap-2.5 group"
                >
                  <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-purple-950 dark:text-purple-200 flex-1">{decision}</span>
                  <button
                    type="button"
                    onClick={() => removeDecision(index)}
                    className="opacity-60 group-hover:opacity-100 text-purple-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDecision()
                  }
                }}
                placeholder="Type a key decision agreed upon..."
                className="text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addDecision}
                disabled={!newDecision.trim()}
                className="shrink-0 h-9 text-xs"
              >
                Add Decision
              </Button>
            </div>
          </div>

          {/* Section 4: Action Items & Next Steps */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Action Items & Follow-up Assignments (Optional)
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group text-xs"
                >
                  <p className="font-semibold text-amber-950 dark:text-amber-200 flex-1">
                    {item.task}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-medium border border-amber-200 dark:border-amber-800">
                      {item.assignee}
                    </span>
                    {item.deadline && (
                      <span className="text-[11px] text-amber-800 dark:text-amber-300">
                        Due: {item.deadline}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeActionItem(index)}
                      className="opacity-60 group-hover:opacity-100 text-amber-600 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Action Task / Responsibility..."
                className="text-xs h-9 sm:col-span-1"
              />
              <Input
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="Assignee (e.g. Head Pastor)"
                className="text-xs h-9"
              />
              <div className="flex items-center gap-2">
                <Input
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="Target date..."
                  className="text-xs h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addActionItem}
                  disabled={!newTask.trim() || !newAssignee.trim()}
                  className="shrink-0 h-9 text-xs"
                >
                  Add Task
                </Button>
              </div>
            </div>
          </div>

          {/* Section 5: Closing Remarks */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Closing Remarks & Adjournment Notes
            </label>
            <Input
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
              placeholder="e.g. Closing prayer by District YDM Leader. Next meeting on Nov 24."
            />
          </div>
        </div>

        {/* Sticky Dialog Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-foreground)] text-center sm:text-left">
            Publishing will notify all leadership roles across the district.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handlePublish()}
              disabled={saving || !discussionPoints.length}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send size={13} />
              <span>{saving ? 'Publishing MOM…' : 'Publish MOM & Notify All Roles'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
