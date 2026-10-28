import { useMemo, useState, type DragEvent } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleHelp, Sparkles } from 'lucide-react'
import { getQuadrant, urgencyForTask } from '../../lib/urgency'
import type { Quadrant, Task } from '../../types/task'
import { Button } from '../../components/ui/Button'

const quadrantMeta: Record<Quadrant, { title: string; action: string; guide: string; tone: string; dot: string; accent: string }> = {
  do: { title: 'Do first', action: 'Urgent · Important', guide: 'These tasks require your full attention.', tone: 'bg-[#f2f8ef]', dot: 'bg-[#ff775f]', accent: '#ff775f' },
  schedule: { title: 'Schedule', action: 'Important · Not urgent', guide: 'Set time aside before it turns urgent.', tone: 'bg-[#f4f6ee]', dot: 'bg-[#b7df4c]', accent: '#b7df4c' },
  batch: { title: 'Batch', action: 'Urgent · Less important', guide: 'Group lower-importance urgent work.', tone: 'bg-[#f5f6f4]', dot: 'bg-[#45cdb5]', accent: '#45cdb5' },
  eliminate: { title: 'Consider removing', action: 'Neither urgent nor important', guide: 'Drop it if the value is low.', tone: 'bg-[#f8f8f6]', dot: 'bg-[#a98cff]', accent: '#a98cff' },
}

function TaskDot({ task, urgency, onClick }: { task: Task; urgency: number; onClick: () => void }) {
  const quadrant = quadrantMeta[getQuadrant(urgency, task.importance)]
  const high = urgency >= 75 && task.importance >= 75
  return <button draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', task.id); event.dataTransfer.effectAllowed = 'move' }} onClick={onClick}
    aria-label={`${task.title}, urgency ${Math.round(urgency)}, importance ${task.importance}. Drag to adjust.`} title={`${task.title} · ${Math.round(urgency)} urgency · ${task.importance} importance`}
    className="group absolute z-10 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-white/75 shadow-sm transition-[left,top,transform] duration-500 ease-out hover:z-20 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
    style={{ left: `${urgency}%`, top: `${100 - task.importance}%`, boxShadow: high ? `0 0 0 2px ${quadrant.accent}, 0 0 12px ${quadrant.accent}88` : undefined }}>
    <span className={`h-3 w-3 rounded-full ${quadrant.dot} ${high ? 'h-3.5 w-3.5' : ''}`} />
    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#20362a] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-md group-hover:block group-focus-visible:block">{task.title}<span className="ml-2 text-white/65">{Math.round(urgency)}%</span></span>
  </button>
}

export function MatrixView({ tasks, now, onEdit, onDrop, onAdd }: { tasks: Task[]; now: Date; onEdit: (task: Task) => void; onDrop: (task: Task, urgency: number, importance: number) => void; onAdd: () => void }) {
  const openTasks = tasks.filter((task) => task.status === 'open')
  const positioned = useMemo(() => openTasks.map((task) => ({ task, urgency: urgencyForTask(task, now) })), [openTasks, now])
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant>('do')
  const quadrants = Object.keys(quadrantMeta) as Quadrant[]
  const activeTasks = positioned.filter(({ task, urgency }) => getQuadrant(urgency, task.importance) === activeQuadrant)

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    const task = tasks.find((item) => item.id === taskId)
    const rect = event.currentTarget.getBoundingClientRect()
    if (!task || !rect.width || !rect.height) return
    const urgency = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
    const importance = Math.min(100, Math.max(0, 100 - ((event.clientY - rect.top) / rect.height) * 100))
    onDrop(task, urgency, importance)
  }

  return <div className="animate-fade-up">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="rounded-lg bg-[#eff5ea] p-1.5 text-forest"><Sparkles size={16} /></span><p className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#819087]">Your attention, at a glance</p></div><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">The matrix</h2><p className="mt-1 text-sm text-muted">Urgency shifts with time. Importance stays where you set it.</p></div>
      <Button onClick={onAdd}><span className="text-lg leading-none">+</span> Add task <kbd className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-medium sm:inline">N</kbd></Button>
    </div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
      <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0f3ef]"><CircleHelp size={13} /></span><span className="hidden md:inline">Drag a task to adjust importance or urgency</span><span className="md:hidden">Tap a quadrant to view its tasks</span></div>
      <div className="flex items-center gap-1.5"><CalendarDays size={13} /><span>Urgency recalculates every minute</span></div>
    </div>
    <section className="matrix-guide mb-4 rounded-2xl border border-line bg-white p-3.5 shadow-sm sm:p-4" aria-label="How to read the matrix">
      <div className="mb-3 flex items-start gap-2"><span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#7fa477]">guide /</span><p className="text-xs leading-5 text-muted">Deadline tasks move right as their latest safe start approaches. Importance stays where you set it; tasks without deadlines use your manual urgency.</p></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{quadrants.map((key) => <div key={key} className="flex items-start gap-2.5 rounded-xl bg-[#f7f9f6] px-3 py-2.5"><i className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${quadrantMeta[key].dot}`} /><div><p className="text-xs font-semibold text-ink">{quadrantMeta[key].title}</p><p className="mt-0.5 text-[11px] leading-4 text-muted">{quadrantMeta[key].guide}</p>{key === 'eliminate' && <details className="group mt-1"><summary className="cursor-pointer list-none font-mono text-[10px] text-[#7fa477]">read the rule</summary><p className="mt-1 text-[11px] leading-4 text-muted">Try to put as many things as you can in this quadrant. Don’t do things that don’t need to be done. Better to do nothing than to do this thing.</p></details>}</div></div>)}</div>
    </section>
    <div className="matrix-desktop-panel hidden overflow-hidden rounded-[22px] border border-[#e5eae4] bg-white shadow-soft md:block">
      <div className="matrix-board relative mx-10 my-8 aspect-square overflow-hidden rounded-lg border border-[#e2e8e1] bg-[#fbfcfa]" onDragOver={(event) => event.preventDefault()} onDrop={drop}>
        <div className={`matrix-quadrant matrix-schedule absolute left-0 top-0 h-1/2 w-1/2 ${quadrantMeta.schedule.tone}`} />
        <div className={`matrix-quadrant matrix-do absolute right-0 top-0 h-1/2 w-1/2 ${quadrantMeta.do.tone}`} />
        <div className={`matrix-quadrant matrix-eliminate absolute bottom-0 left-0 h-1/2 w-1/2 ${quadrantMeta.eliminate.tone}`} />
        <div className={`matrix-quadrant matrix-batch absolute bottom-0 right-0 h-1/2 w-1/2 ${quadrantMeta.batch.tone}`} />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] border-t border-dashed border-[#cbd5ca]" />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] border-l border-dashed border-[#cbd5ca]" />
        {quadrants.map((key) => <div key={key} className={`pointer-events-none absolute z-[2] px-4 py-3 ${key === 'do' ? 'right-1 top-0 text-right' : key === 'schedule' ? 'left-1 top-0' : key === 'batch' ? 'bottom-0 right-1 text-right' : 'bottom-0 left-1'}`}><p className="font-display text-sm font-bold text-[#4b5b4e]">{quadrantMeta[key].title}</p><p className="mt-0.5 text-[10px] text-[#909a91]">{quadrantMeta[key].action}</p></div>)}
        {positioned.map(({ task, urgency }) => <TaskDot key={task.id} task={task} urgency={urgency} onClick={() => onEdit(task)} />)}
        {openTasks.length === 0 && <div className="pointer-events-none absolute inset-0 z-[3] grid place-items-center"><div className="rounded-2xl border border-white/80 bg-white/85 px-7 py-6 text-center shadow-soft"><div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-[#eef5e9] text-forest"><ArrowUpRight size={19} /></div><p className="text-sm font-semibold text-ink">A little space to think</p><p className="mt-1 text-xs text-muted">Add a task and it will find its place here.</p></div></div>}
      </div>
      <div className="flex items-center justify-between border-t border-line bg-white px-10 py-3 text-[11px] text-[#8c968e]"><span>LESS URGENT <span className="mx-1">←</span> URGENCY <span className="mx-1">→</span> MORE URGENT</span><span>MORE IMPORTANT <ArrowDownRight className="mx-1 inline" size={12} /> LESS IMPORTANT</span></div>
    </div>
    <div className="grid gap-3 md:hidden">
      <section className="rounded-[20px] border border-line bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-wider text-muted"><span>importance ↑</span><span>tap a quadrant</span></div>
        <div className="matrix-board relative mx-auto aspect-square w-full max-w-[480px] overflow-hidden rounded-xl border border-[#e2e8e1] bg-[#fbfcfa]">
          {quadrants.map((key) => <button key={key} type="button" aria-label={`Show ${quadrantMeta[key].title} tasks`} aria-pressed={activeQuadrant === key} onClick={() => setActiveQuadrant(key)} className={`matrix-quadrant absolute z-0 h-1/2 w-1/2 text-left transition-colors ${quadrantMeta[key].tone} ${key === 'do' ? 'matrix-do right-0 top-0' : key === 'schedule' ? 'matrix-schedule left-0 top-0' : key === 'batch' ? 'matrix-batch bottom-0 right-0' : 'matrix-eliminate bottom-0 left-0'} ${activeQuadrant === key ? 'ring-2 ring-inset ring-[#8fae63]/70' : ''}`}><span className={`absolute flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-bold leading-tight text-[#4b5b4e] sm:px-3 sm:text-xs ${key === 'do' ? 'right-0 top-0 text-right' : key === 'schedule' ? 'left-0 top-0' : key === 'batch' ? 'bottom-0 right-0 text-right' : 'bottom-0 left-0'}`}><span className="max-w-[88px]">{quadrantMeta[key].title}</span><span className="rounded-full bg-white/70 px-1.5 py-0.5 font-mono text-[9px] text-muted">{positioned.filter(({ task, urgency }) => getQuadrant(urgency, task.importance) === key).length}</span></span></button>)}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] border-t border-dashed border-[#cbd5ca]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[2] border-l border-dashed border-[#cbd5ca]" />
          {positioned.map(({ task, urgency }) => <TaskDot key={task.id} task={task} urgency={urgency} onClick={() => onEdit(task)} />)}
          {openTasks.length === 0 && <div className="pointer-events-none absolute inset-0 z-[3] grid place-items-center"><div className="rounded-xl border border-white/80 bg-white/85 px-4 py-3 text-center shadow-sm"><p className="text-xs font-semibold text-ink">Nothing plotted yet</p><p className="mt-1 text-[10px] text-muted">Add a task to see it here.</p></div></div>}
        </div>
        <div className="flex justify-between px-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted"><span>less urgent</span><span>urgency → more urgent</span></div>
      </section>
      <section className={`rounded-2xl border border-line p-3 ${quadrantMeta[activeQuadrant].tone}`} aria-live="polite">
        <div className="mb-2 flex items-center justify-between gap-2"><div><p className="font-display text-sm font-bold text-ink">{quadrantMeta[activeQuadrant].title}</p><p className="text-[11px] text-muted">{quadrantMeta[activeQuadrant].action}</p></div><span className="rounded-full bg-white/75 px-2 py-1 font-mono text-[10px] text-muted">{activeTasks.length} tasks</span></div>
        {activeTasks.length ? activeTasks.map(({ task, urgency }) => <button key={task.id} type="button" onClick={() => onEdit(task)} className="mb-1 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left shadow-sm last:mb-0"><span className="min-w-0 truncate text-sm font-medium text-ink">{task.title}</span><span className="ml-2 shrink-0 font-mono text-[10px] text-muted">{Math.round(urgency)}% urgent</span></button>) : <p className="rounded-xl bg-white/70 px-3 py-3 text-xs text-muted">Nothing here right now.</p>}
      </section>
      <p className="text-center font-mono text-[10px] text-muted">Tap a plotted task to open it. Dragging is available on larger screens.</p>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[11px] text-muted"><span className="font-semibold uppercase tracking-wider text-[#96a098]">Legend</span>{quadrants.map((key) => <span key={key} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${quadrantMeta[key].dot}`} /> {quadrantMeta[key].title}</span>)}</div>
  </div>
}
