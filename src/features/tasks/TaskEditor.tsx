import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, Clock3, Trash2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Field, TextArea } from '../../components/ui/Field'
import { calculateUrgency, DEFAULT_BUFFER_MINUTES, DEFAULT_GROWTH_RATE, urgencyThresholdTime } from '../../lib/urgency'
import { validateTaskDraft } from '../../lib/validation'
import type { Task, TaskDraft } from '../../types/task'

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatCrossingTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

export function TaskEditor({ open, onClose, task, now, onSave, onComplete, onDelete }: {
  open: boolean
  onClose: () => void
  task?: Task | null
  now: Date
  onSave: (draft: TaskDraft) => Promise<void>
  onComplete?: (task: Task) => void
  onDelete?: (task: Task) => void
}) {
  const [advanced, setAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [importance, setImportance] = useState(65)
  const [manualUrgency, setManualUrgency] = useState(25)
  const [deadline, setDeadline] = useState('')
  const [effort, setEffort] = useState('60')
  const [effortBuffer, setEffortBuffer] = useState(String(DEFAULT_BUFFER_MINUTES))
  const [growthRate, setGrowthRate] = useState(String(DEFAULT_GROWTH_RATE))

  const parsedDeadline = deadline ? new Date(deadline) : null
  const deadlineTimestamp = parsedDeadline?.getTime()
  const validDeadline = parsedDeadline && Number.isFinite(deadlineTimestamp) ? parsedDeadline.toISOString() : null
  const effortMinutes = effort.trim() ? Number(effort) : null
  const bufferMinutes = effortBuffer.trim() ? Number(effortBuffer) : DEFAULT_BUFFER_MINUTES
  const effectiveGrowthRate = Number(growthRate) > 0 ? Number(growthRate) : DEFAULT_GROWTH_RATE
  const urgencyInputs = { deadline: validDeadline, estimatedEffortMinutes: effortMinutes, bufferMinutes, growthRate: effectiveGrowthRate, manualUrgency, now }
  const previewUrgency = calculateUrgency({ ...urgencyInputs, status: task?.status ?? 'open' })
  const crossingTime = urgencyThresholdTime(urgencyInputs)
  const urgentQuadrant = importance >= 50 ? 'Do first' : 'Batch'
  let previewMessage: string
  if (task?.status === 'completed') previewMessage = 'This task is complete. Reopening it will resume urgency from its deadline.'
  else if (deadline && !validDeadline) previewMessage = 'Enter a valid deadline to preview when it becomes urgent.'
  else if (!deadline && manualUrgency >= 50) previewMessage = `Already above 50; it is in ${urgentQuadrant}.`
  else if (!deadline) previewMessage = `No deadline: urgency stays at ${manualUrgency} and will not cross 50 by itself.`
  else if (deadlineTimestamp !== undefined && deadlineTimestamp <= now.getTime()) previewMessage = 'The deadline has passed; an open task is at 100 urgency.'
  else if (manualUrgency >= 50) previewMessage = `Starting urgency is already above 50; it is in ${urgentQuadrant}.`
  else if (crossingTime === null) previewMessage = 'Could not calculate a crossing time from these settings.'
  else if (crossingTime <= now.getTime()) previewMessage = `Already above 50; crossed around ${formatCrossingTime(crossingTime)}. It is in ${urgentQuadrant}.`
  else previewMessage = `Expected to cross 50 around ${formatCrossingTime(crossingTime)} and enter ${urgentQuadrant}.`

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setImportance(task?.importance ?? 65)
    setManualUrgency(task?.manual_urgency ?? 25)
    setDeadline(toLocalInput(task?.deadline))
    setEffort(task?.estimated_effort_minutes == null ? '60' : String(task.estimated_effort_minutes))
    setEffortBuffer(String(task?.effort_buffer_minutes ?? DEFAULT_BUFFER_MINUTES))
    setGrowthRate(String(task?.urgency_growth_rate ?? DEFAULT_GROWTH_RATE))
    setAdvanced(false)
    setError('')
  }, [open, task])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const draft: TaskDraft = {
      title: title.trim(), description: description.trim() || null, importance,
      manual_urgency: manualUrgency, urgency_growth_rate: Number(growthRate) || DEFAULT_GROWTH_RATE,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      estimated_effort_minutes: effort.trim() ? Number(effort) : null,
      effort_buffer_minutes: effortBuffer.trim() ? Number(effortBuffer) : DEFAULT_BUFFER_MINUTES,
    }
    const validationError = validateTaskDraft(draft)
    if (validationError) { setError(validationError); return }
    setSaving(true)
    try { await onSave(draft); onClose() } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this task.') } finally { setSaving(false) }
  }

  return <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'Add a task'} description={task ? 'Update the details and how this task moves through your matrix.' : 'A clear title is enough to get started. You can refine the details later.'}>
    <form onSubmit={submit} className="space-y-4">
      <Field autoFocus label="Task" placeholder="What needs your attention?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      <TextArea label="Notes" placeholder="Add a little context (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      <div className="rounded-2xl border border-line bg-[#fafbf9] p-4">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-ink">Importance</p><p className="mt-0.5 text-xs text-muted">How serious are the consequences if this is not done?</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold tabular-nums text-forest">{importance}</span></div>
        <input aria-label="Importance" type="range" min="0" max="100" value={importance} onChange={(e) => setImportance(Number(e.target.value))} className="mt-3 w-full accent-[#285c42]" />
        <div className="mt-1 flex justify-between text-[10px] text-[#909a92]"><span>Minimal impact</span><span>Serious impact</span></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <Field label="Estimated effort" type="number" min="0" step="1" placeholder="60" value={effort} onChange={(e) => setEffort(e.target.value)} hint="Any whole number of minutes" />
      </div>
      <div className="rounded-2xl border border-[#e6ede6] bg-[#f7faf6] p-4">
        <div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-semibold text-ink">Starting urgency</p><p className="mt-0.5 text-xs text-muted">{deadline ? 'This is the baseline; deadline urgency can rise above it.' : 'No deadline? Atta uses this as the stable urgency.'}</p></div><span className="text-sm font-semibold tabular-nums text-forest">{manualUrgency}</span></div>
        <input aria-label="Starting urgency" type="range" min="0" max="100" value={manualUrgency} onChange={(e) => setManualUrgency(Number(e.target.value))} className="w-full accent-[#285c42]" />
      </div>
      <div role="status" aria-live="polite" className="flex items-center justify-between gap-4 rounded-xl border border-[#e6ede6] bg-white px-3.5 py-3">
        <div><p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#819087]">Urgency preview</p><p className="mt-1 text-xs leading-5 text-muted">{previewMessage}</p></div>
        <span className="shrink-0 rounded-lg bg-[#eff5ea] px-2.5 py-1.5 font-mono text-sm font-semibold tabular-nums text-forest">{Math.round(previewUrgency)}%</span>
      </div>
      <button type="button" onClick={() => setAdvanced(!advanced)} className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left text-sm font-medium text-muted hover:text-ink"><span className="flex items-center gap-2"><Clock3 size={15} /> Urgency settings</span><ChevronDown size={16} className={`transition-transform ${advanced ? 'rotate-180' : ''}`} /></button>
      {advanced && <div className="space-y-3 rounded-xl border border-line p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Effort buffer (minutes)" type="number" min="0" max="100000" step="1" value={effortBuffer} onChange={(e) => setEffortBuffer(e.target.value)} hint="Extra time for unexpected delays, interruptions, or underestimated effort. Used when a deadline is set." />
          <Field label="Growth rate (k)" type="number" min="0.1" max="20" step="0.1" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} hint="Controls how sharply the deadline curve rises around its midpoint. Higher k makes the rise steeper." />
        </div>
        <details className="group rounded-xl bg-[#f7f9f6] px-3 py-2.5">
          <summary className="cursor-pointer list-none text-xs font-semibold text-[#526057] marker:hidden">How the urgency curve works <span className="float-right font-mono text-[#849185] group-open:hidden">+</span><span className="float-right hidden font-mono text-[#849185] group-open:inline">−</span></summary>
          <div className="mt-3 space-y-2.5 border-t border-line pt-3 text-xs leading-5 text-muted">
            <p>Atta uses a sigmoid curve to raise urgency from your selected starting value as the latest safe start approaches:</p>
            <code className="block overflow-x-auto rounded-lg bg-[#17221c] px-3 py-2 font-mono text-[11px] text-[#cce5b2]">U(t) = U₀ + (100 − U₀) / (1 + exp(−k × (t − d)))</code>
            <p><span className="font-mono text-ink">U₀</span> is your starting urgency. <span className="font-mono text-ink">t</span> is now, measured in days. <span className="font-mono text-ink">d</span> is the latest safe start: deadline minus estimated effort and the effort buffer. Missing effort defaults to 60 minutes and the buffer to 30 minutes. <span className="font-mono text-ink">k</span> controls how sharply the curve rises. At <span className="font-mono text-ink">d</span>, urgency is halfway between the starting value and 100.</p>
            <p>Without a deadline, the selected starting urgency stays fixed. After its deadline, an open task is set to 100. Importance stays unchanged. Urgency is calculated on this device and refreshed while the app is open; the changing value is not saved to the database.</p>
          </div>
        </details>
      </div>}
      {error && <p role="alert" className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm text-[#a83f38]">{error}</p>}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="flex items-center gap-1">
          {task && onDelete && <Button type="button" variant="danger" size="sm" onClick={() => onDelete(task)}><Trash2 size={15} /> Delete</Button>}
          {task && onComplete && <Button type="button" variant="ghost" size="sm" onClick={() => onComplete(task)}>{task.status === 'completed' ? 'Reopen' : 'Mark complete'}</Button>}
        </div>
        <div className="flex gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}</Button></div>
      </div>
    </form>
  </Modal>
}
