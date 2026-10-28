import { useEffect, useMemo, useState } from 'react'
import { Check, Circle, Clock3, Focus, Play, Plus, RotateCcw, Square, Timer, Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import type { Batch, Task } from '../../types/task'

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function BatchView({ tasks, batches, onCreateBatch, onBatchStatus, onToggleTask }: {
  tasks: Task[]; batches: Batch[]; onCreateBatch: (title: string, taskIds: string[]) => Promise<Batch>; onBatchStatus: (batch: Batch, status: Batch['status']) => void; onToggleTask: (task: Task) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('Quick wins')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const candidates = tasks.filter((task) => task.status === 'open' && task.importance < 50)
  const selectedTasks = tasks.filter((task) => selected.includes(task.id) && task.status === 'open')
  const total = selectedTasks.reduce((sum, task) => sum + (task.estimated_effort_minutes ?? 15), 0)
  const activeBatch = batches.find((batch) => batch.id === activeId)
  const activeTasks = activeBatch?.task_ids?.map((id) => tasks.find((task) => task.id === id)).filter((task): task is Task => Boolean(task)) ?? []
  const completedInBatch = activeTasks.filter((task) => task.status === 'completed').length
  const activeTotal = activeTasks.reduce((sum, task) => sum + (task.estimated_effort_minutes ?? 15), 0)

  useEffect(() => {
    if (!startedAt) return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  useEffect(() => {
    if (activeId) return
    const running = batches.find((batch) => batch.status === 'active')
    if (running) {
      setActiveId(running.id)
      setStartedAt(new Date(running.created_at).getTime())
    }
  }, [batches, activeId])

  const history = useMemo(() => batches.filter((batch) => batch.id !== activeId), [batches, activeId])
  const toggle = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const startSession = async () => {
    if (!selected.length || creating) return
    setCreating(true); setError('')
    try {
      const batch = await onCreateBatch(title, selected)
      onBatchStatus(batch, 'active')
      setActiveId(batch.id); setStartedAt(Date.now()); setElapsed(0); setSelected([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start this session.') } finally { setCreating(false) }
  }
  const stopSession = () => {
    if (activeBatch) onBatchStatus(activeBatch, completedInBatch >= activeTasks.length ? 'completed' : 'planned')
    setActiveId(null); setStartedAt(null); setElapsed(0)
  }
  const clock = `${String(Math.floor(elapsed / 3600)).padStart(2, '0')}:${String(Math.floor(elapsed / 60) % 60).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return <div className="animate-fade-up">
    <div className="mb-5"><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#819087]">Small things, done together</p><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Batch your busywork</h2><p className="mt-1 text-sm text-muted">Collect a few low-stakes tasks and give them one focused stretch.</p></div>
    {activeBatch ? <section className="mb-5 overflow-hidden rounded-[22px] border border-[#dbe8d8] bg-[#f1f7ee] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe9db] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-forest"><Focus size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#6f856e]">Focus session</p><h3 className="mt-0.5 font-display text-lg font-bold text-ink">{activeBatch.title}</h3></div></div><div className="flex items-center gap-3"><span className="font-mono text-xl font-semibold tabular-nums text-forest">{clock}</span><Button variant="secondary" size="sm" onClick={stopSession}><Square size={13} fill="currentColor" /> End session</Button></div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-[#687a6b]"><span>{completedInBatch} of {activeTasks.length} done</span><span>About {durationLabel(activeTotal)} planned</span></div>
      <div className="space-y-1 px-4 pb-4">{activeTasks.map((task) => <button key={task.id} type="button" onClick={() => onToggleTask(task)} className="flex w-full items-center gap-3 rounded-xl bg-white/75 px-3 py-2.5 text-left"><span className={task.status === 'completed' ? 'text-[#4c8258]' : 'text-[#a1ada2]'}>{task.status === 'completed' ? <Check size={17} /> : <Circle size={17} />}</span><span className={`flex-1 text-sm font-medium ${task.status === 'completed' ? 'text-[#929e93] line-through' : 'text-ink'}`}>{task.title}</span><span className="text-[11px] text-muted">{durationLabel(task.estimated_effort_minutes ?? 15)}</span></button>)}</div>
    </section> : <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(290px,.8fr)]">
      <section className="rounded-[22px] border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-base font-bold text-ink">Choose tasks</h3><p className="mt-1 text-xs text-muted">Low-importance tasks are ready to batch.</p></div><span className="rounded-lg bg-[#f4f6f2] px-2 py-1 text-xs font-semibold text-[#718073]">{selected.length} selected</span></div>
        <div className="mb-3 flex flex-wrap gap-2"><Field label="Session name" aria-label="Session name" className="h-10" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        {candidates.length ? <div className="max-h-[390px] space-y-1 overflow-y-auto pr-1">{candidates.map((task) => <button key={task.id} type="button" onClick={() => toggle(task.id)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${selected.includes(task.id) ? 'border-[#bdd2bb] bg-[#f4f8f1]' : 'border-transparent hover:bg-[#f8f9f7]'}`}><span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border ${selected.includes(task.id) ? 'border-forest bg-forest text-white' : 'border-[#cbd4cc] bg-white text-transparent'}`}><Check size={12} strokeWidth={3} /></span><span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{task.title}</span><span className="flex shrink-0 items-center gap-1 text-[11px] text-muted"><Clock3 size={12} />{durationLabel(task.estimated_effort_minutes ?? 15)}</span></button>)}</div> : <div className="rounded-xl bg-[#f8f9f7] px-4 py-8 text-center"><Zap size={19} className="mx-auto text-[#87958a]" /><p className="mt-2 text-sm font-medium text-ink">No low-importance tasks yet</p><p className="mt-1 text-xs text-muted">Tasks below 50 importance will show up here.</p></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-xs text-muted">Selected time <strong className="ml-1 text-ink">{durationLabel(total)}</strong></p><Button disabled={!selected.length || creating} onClick={() => void startSession()}><Play size={14} fill="currentColor" />{creating ? 'Starting…' : 'Start focused session'}</Button></div>
        {error && <p role="alert" className="mt-3 text-xs text-[#a83f38]">{error}</p>}
      </section>
      <section className="rounded-[22px] border border-line bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-base font-bold text-ink">Your sessions</h3><p className="mt-1 text-xs text-muted">Pick a handful, then move through them.</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2f6ee] text-forest"><Timer size={16} /></span></div>
        {history.length ? <div className="space-y-2">{history.map((batch) => <div key={batch.id} className="flex items-center gap-3 rounded-xl border border-[#eef0ed] p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f7f3] text-[#738474]"><Focus size={14} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{batch.title}</p><p className="mt-0.5 text-[11px] text-muted">{batch.task_ids?.length ?? 0} tasks · {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(batch.created_at))}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${batch.status === 'completed' ? 'bg-[#edf5e9] text-[#4a7551]' : 'bg-[#f5f2e9] text-[#89754d]'}`}>{batch.status}</span></div>)}</div> : <div className="rounded-xl bg-[#f8f9f7] px-4 py-8 text-center"><Plus size={18} className="mx-auto text-[#87958a]" /><p className="mt-2 text-sm font-medium text-ink">No sessions yet</p><p className="mt-1 text-xs text-muted">Your focused work sessions will appear here.</p></div>}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f7f9f5] p-3 text-[11px] leading-5 text-[#738073]"><RotateCcw size={13} className="mt-0.5 shrink-0" />Tasks can belong to multiple sessions. Completing one here updates it everywhere.</p>
      </section>
    </div>}
  </div>
}
