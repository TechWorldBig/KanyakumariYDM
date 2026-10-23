import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  UserCheck,
  UserX,
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
import type { MeetingMOM } from '../../domain/meetings'
import { formatMOMAsPlainText } from '../../domain/meetings'

export function MomViewerDialog({
  mom,
  canEdit,
  onClose,
  onEdit,
}: {
  mom: MeetingMOM
  canEdit: boolean
  onClose: () => void
  onEdit?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'excused'>('all')

  const presentList = mom.attendance.filter((a) => a.status === 'present')
  const absentList = mom.attendance.filter((a) => a.status === 'absent')
  const excusedList = mom.attendance.filter((a) => a.status === 'excused')
  const totalAttendees = mom.attendance.length
  const attendanceRate = totalAttendees > 0 ? Math.round((presentList.length / totalAttendees) * 100) : 100

  const filteredAttendees = mom.attendance.filter((a) => {
    if (attendanceFilter === 'present') return a.status === 'present'
    if (attendanceFilter === 'absent') return a.status === 'absent'
    if (attendanceFilter === 'excused') return a.status === 'excused'
    return true
  })

  const copyText = async () => {
    try {
      const text = formatMOMAsPlainText(mom)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  const printMOM = () => {
    window.print()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border border-[var(--border)] shadow-xl">
        {/* Sticky Dialog Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 tracking-wide uppercase">
                  <FileCheck2 size={12} />
                  <span>Minutes of Meeting (MOM)</span>
                </span>
                <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                  Published {new Date(mom.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] truncate">
                {mom.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Official minutes and member attendance recorded by{' '}
                <strong className="text-[var(--foreground)] font-semibold">{mom.organiserName}</strong> ({mom.organiserRole}).
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyText()}
                className="h-8 text-xs gap-1.5"
                title="Copy formatted MOM to share on WhatsApp or Email"
              >
                <Copy size={13} />
                <span>{copied ? 'Copied!' : 'Copy MOM'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={printMOM}
                className="h-8 text-xs gap-1.5 hidden sm:inline-flex"
                title="Print or export as PDF"
              >
                <Printer size={13} />
                <span>Print</span>
              </Button>
            </div>
          </div>

          {/* Quick Meta Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-3 border-t border-[var(--border)]/70 text-xs">
            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex items-center gap-2">
              <Clock size={15} className="text-[var(--color-district-600)] dark:text-[var(--color-district-400)] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Date & Time</span>
                <span className="font-semibold text-[var(--foreground)] truncate block">
                  {new Date(mom.conductedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex items-center gap-2">
              <Users size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Attendance</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate block">
                  {presentList.length} / {totalAttendees} Present ({attendanceRate}%)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Organiser</span>
                <span className="font-semibold text-[var(--foreground)] truncate block">
                  {mom.organiserName}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex items-center gap-2">
              <MapPin size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Platform</span>
                <span className="font-semibold text-[var(--foreground)] truncate block">
                  {mom.locationOrPlatform || 'Google Meet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Meeting Member Attendance */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                  Attendance of Meeting Members
                </h3>
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({presentList.length} Present, {absentList.length} Absent, {excusedList.length} Excused)
                </span>
              </div>

              {/* Attendance filter pill buttons */}
              <div className="flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    attendanceFilter === 'all'
                      ? 'bg-district-700 text-white dark:bg-district-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  All ({totalAttendees})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    attendanceFilter === 'present'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  Present ({presentList.length})
                </button>
                {absentList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAttendanceFilter('absent')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      attendanceFilter === 'absent'
                        ? 'bg-rose-600 text-white dark:bg-rose-700'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    Absent ({absentList.length})
                  </button>
                )}
                {excusedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAttendanceFilter('excused')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      attendanceFilter === 'excused'
                        ? 'bg-amber-600 text-white dark:bg-amber-700'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    Excused ({excusedList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredAttendees.map((attendee) => {
                const isPresent = attendee.status === 'present'
                const isExcused = attendee.status === 'excused'
                return (
                  <div
                    key={attendee.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isPresent
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50'
                        : isExcused
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/50'
                        : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isPresent
                            ? 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                            : isExcused
                            ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                            : 'bg-rose-200/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 size={15} />
                        ) : isExcused ? (
                          <Clock size={15} />
                        ) : (
                          <XCircle size={15} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-xs font-semibold text-[var(--foreground)] truncate">
                          {attendee.name}
                        </strong>
                        <span className="block text-[10.5px] text-[var(--muted-foreground)] truncate">
                          {attendee.role}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isExcused
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {attendee.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: What They Discussed (Discussion Points) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                  What Was Discussed in the Meeting (Discussion Points)
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Detailed minutes and key points discussed by council members.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {mom.discussionPoints.map((point, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-[var(--border)] flex items-start gap-3.5 hover:border-[var(--color-district-300)] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-[var(--border)] text-district-600 dark:text-district-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-xs text-[var(--foreground)] leading-relaxed flex-1 whitespace-pre-wrap font-normal">
                    {point}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Key Decisions Taken */}
          {mom.decisions && mom.decisions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                  Key Decisions Agreed & Approved
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 space-y-2">
                {mom.decisions.map((decision, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs text-purple-950 dark:text-purple-200">
                    <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{decision}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Action Items & Next Steps */}
          {mom.actionItems && mom.actionItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                  Action Items & Assigned Responsibilities
                </h3>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)]">
                {mom.actionItems.map((item, index) => (
                  <div key={index} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold text-[var(--muted-foreground)] shrink-0 mt-0.5">
                        #{index + 1}
                      </span>
                      <p className="font-semibold text-[var(--foreground)]">{item.task}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-6 sm:pl-0">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] font-medium">
                        <UserCheck size={12} className="text-district-600" />
                        <span>{item.assignee}</span>
                      </span>
                      {item.deadline && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                          Due: {item.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing Remarks */}
          {mom.closingRemarks && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <strong className="block font-semibold text-[var(--foreground)] mb-1">
                Closing Remarks & Benediction:
              </strong>
              {mom.closingRemarks}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 truncate">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">Certified & Published by {mom.organiserName}</span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-1.5 text-xs"
              >
                <Edit3 size={13} />
                <span>Edit MOM</span>
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
