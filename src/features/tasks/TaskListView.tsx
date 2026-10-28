import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, CircleCheck, CalendarDays, Clock3 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { getQuadrant, urgencyForTask } from '../../lib/urgency'
import type { Quadrant, Task } from '../../types/task'

const quadrantName: Record<Quadrant, string> = { do: 'Do first', schedule: 'Schedule', batch: 'Batch', eliminate: 'Consider removing' }

function dateLabel(value: string | null) {
  if (!value) return 'No deadline'
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export function TaskListView({ tasks, now, onEdit, onAdd, onComplete }: { tasks: Task[]; now: Date; onEdit: (task: Task) => void; onAdd: () => void; onComplete: (task: Task) => void }) {
  const [search, setSearch] = useState('')
  const [quadrant, setQuadrant] = useState('all')
  const [status, setStatus] = useState('open')
  const [sort, setSort] = useState<'urgency' | 'importance' | 'deadline'>('urgency')
  const rows = useMemo(() => tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'all' || (status === 'open' ? task.status === 'open' : task.status === 'completed')
    const matchesQuadrant = quadrant === 'all' || getQuadrant(urgencyForTask(task, now), task.importance) === quadrant
    return matchesSearch && matchesStatus && matchesQuadrant
  }).sort((a, b) => {
    if (sort === 'urgency') return urgencyForTask(b, now) - urgencyForTask(a, now)
    if (sort === 'importance') return b.importance - a.importance
    return (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity)
  }), [tasks, search, status, quadrant, sort, now])

  return <div className="animate-fade-up">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#819087]">Everything in motion</p><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Your tasks</h2><p className="mt-1 text-sm text-muted">A clear list, sorted by what needs you first.</p></div><Button onClick={onAdd}>+ Add task</Button></div>
    <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a39b]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks or notes" aria-label="Search tasks" className="h-10 w-full rounded-xl border border-transparent bg-[#f7f8f6] pl-9 pr-3 text-sm text-ink outline-none placeholder:text-[#a3aca5] focus:border-[#c7d9c8]" /></label>
      <div className="flex flex-wrap gap-2"><label className="relative"><SlidersHorizontal size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><select value={quadrant} onChange={(e) => setQuadrant(e.target.value)} aria-label="Filter by quadrant" className="h-10 rounded-xl border border-line bg-white pl-8 pr-7 text-xs font-medium text-[#536057]"><option value="all">All quadrants</option>{Object.entries(quadrantName).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="h-10 rounded-xl border border-line bg-white px-3 text-xs font-medium text-[#536057]"><option value="open">Open</option><option value="completed">Completed</option><option value="all">All statuses</option></select>
        <label className="relative"><ArrowUpDown size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort tasks" className="h-10 rounded-xl border border-line bg-white pl-8 pr-7 text-xs font-medium text-[#536057]"><option value="urgency">Urgency</option><option value="importance">Importance</option><option value="deadline">Deadline</option></select></label></div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1fr)_145px_130px_50px] gap-3 border-b border-line bg-[#fafbf9] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#929d94] sm:grid"><span>Task</span><span>Quadrant</span><span>Deadline</span><span /></div>
      {rows.length ? rows.map((task) => {
        const urgency = urgencyForTask(task, now)
        const q = getQuadrant(urgency, task.importance)
        return <div key={task.id} className="group flex items-center gap-3 border-b border-[#eff1ee] px-4 py-3 last:border-0 hover:bg-[#fcfdfa] sm:grid sm:grid-cols-[minmax(0,1fr)_145px_130px_50px] sm:gap-3 sm:px-5">
          <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${task.status === 'completed' ? 'bg-[#bdc5bd]' : q === 'do' ? 'bg-[#ff775f]' : q === 'schedule' ? 'bg-[#b7df4c]' : q === 'batch' ? 'bg-[#45cdb5]' : 'bg-[#a98cff]'}`} /><span className={`truncate text-sm font-semibold ${task.status === 'completed' ? 'text-[#99a199] line-through' : 'text-ink'}`}>{task.title}</span></span>{task.description && <span className="mt-1 block truncate pl-4 text-xs text-muted">{task.description}</span>}<span className="mt-1.5 flex items-center gap-3 pl-4 text-[10px] text-[#909a92] sm:hidden"><span>{Math.round(urgency)}% urgent</span><span>·</span><span>{dateLabel(task.deadline)}</span></span></button>
          <span className="hidden rounded-lg bg-[#f5f7f4] px-2.5 py-1.5 text-[11px] font-medium text-[#68766b] sm:inline-flex">{quadrantName[q]}</span>
          <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex"><CalendarDays size={13} />{dateLabel(task.deadline)}</span>
          <Button size="icon" variant="ghost" aria-label={task.status === 'open' ? `Complete ${task.title}` : `Reopen ${task.title}`} className="shrink-0 text-[#91a094] hover:text-forest" onClick={() => onComplete(task)}><CircleCheck size={18} /></Button>
        </div>
      }) : <div className="px-6 py-14 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[#f1f5ee] text-forest"><Clock3 size={19} /></div><p className="text-sm font-semibold text-ink">Nothing matches this view</p><p className="mt-1 text-xs text-muted">Try another filter or add a task to get started.</p>{tasks.length === 0 && <Button className="mt-4" onClick={onAdd}>Add your first task</Button>}</div>}
    </div>
    <p className="mt-3 px-1 text-[11px] text-muted">{rows.length} {rows.length === 1 ? 'task' : 'tasks'} shown · refreshed {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now)}</p>
  </div>
}
