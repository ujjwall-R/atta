import { useEffect, useMemo, useState } from 'react'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Activity, AlertCircle, ArrowRight, Check, ChevronRight, CircleHelp, Command, Layers3, LayoutDashboard, ListChecks, LogOut, Moon, Sun, X } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Modal } from './components/ui/Modal'
import { BatchView } from './features/batches/BatchView'
import { useBatches } from './features/batches/useBatches'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import { AboutAttaCard, AntMark, SignIn } from './features/auth/SignIn'
import { MatrixView } from './features/matrix/MatrixView'
import { TaskEditor } from './features/tasks/TaskEditor'
import { TaskListView } from './features/tasks/TaskListView'
import { useTasks } from './features/tasks/useTasks'
import { DEFAULT_BUFFER_MINUTES, DEFAULT_EFFORT_MINUTES, urgencyForTask, urgencyToDeadline } from './lib/urgency'
import type { Task, TaskDraft } from './types/task'
import './index.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
type View = 'matrix' | 'list' | 'batch'

function formatToday(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
}

function Dashboard() {
  const { user, loading: authLoading, localMode, signOut, showAboutAfterSignIn, dismissAboutAfterSignIn } = useAuth()
  const userId = user?.id ?? (localMode ? 'local-user' : '')
  const { tasks, isLoading, isError, error, refetch, create, update, remove } = useTasks(userId)
  const batchQuery = useBatches(userId)
  const [view, setView] = useState<View>('matrix')
  const [now, setNow] = useState(() => new Date())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDrop, setPendingDrop] = useState<{ task: Task; urgency: number; importance: number } | null>(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('atta.theme') !== 'light')
  const [actionError, setActionError] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!showAboutAfterSignIn) return
    setHelpOpen(true)
    dismissAboutAfterSignIn()
  }, [showAboutAfterSignIn, dismissAboutAfterSignIn])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('atta.theme', darkMode ? 'dark' : 'light')
  }, [darkMode])
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setEditorOpen(true); setEditingTask(null) }
      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) { setEditorOpen(true); setEditingTask(null) }
      if (event.key === '/' && view === 'list') { event.preventDefault(); document.querySelector<HTMLInputElement>('[aria-label="Search tasks"]')?.focus() }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [view])

  const openTaskCount = useMemo(() => tasks.filter((task) => task.status === 'open').length, [tasks])
  const urgencySum = useMemo(() => tasks.filter((task) => task.status === 'open').reduce((sum, task) => sum + urgencyForTask(task, now), 0), [tasks, now])
  const averageUrgency = openTaskCount ? Math.round(urgencySum / openTaskCount) : 0
  const rescheduledDeadline = pendingDrop ? urgencyToDeadline(pendingDrop.urgency, pendingDrop.task.urgency_growth_rate, now.getTime(), pendingDrop.task.estimated_effort_minutes ?? DEFAULT_EFFORT_MINUTES, pendingDrop.task.effort_buffer_minutes ?? DEFAULT_BUFFER_MINUTES) : null
  const rescheduleWouldBeOverdue = rescheduledDeadline !== null && new Date(rescheduledDeadline).getTime() <= now.getTime()

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-canvas"><div className="flex items-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cad7cb] border-t-forest" />Finding your space…</div></div>
  if (!localMode && !user) return <SignIn />

  const saveTask = async (draft: TaskDraft) => {
    setActionError('')
    if (editingTask) await update.mutateAsync({ id: editingTask.id, patch: draft })
    else await create.mutateAsync(draft)
  }
  const edit = (task?: Task) => { setEditingTask(task ?? null); setEditorOpen(true) }
  const toggleComplete = async (task: Task) => {
    try { await update.mutateAsync({ id: task.id, patch: { status: task.status === 'completed' ? 'open' : 'completed', completed_at: task.status === 'completed' ? null : new Date().toISOString() } }) }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Could not update task status.') }
  }
  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    try { await remove.mutateAsync(task.id); setEditorOpen(false); setEditingTask(null) }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Could not delete task.') }
  }
  const handleDrop = (task: Task, urgency: number, importance: number) => {
    const currentUrgency = urgencyForTask(task, now)
    const importanceChanged = Math.abs(task.importance - importance) > 0.5
    if (importanceChanged) void update.mutateAsync({ id: task.id, patch: { importance: Math.round(importance) } }).catch((e: unknown) => setActionError(e instanceof Error ? e.message : 'Could not update importance.'))
    if (task.deadline && Math.abs(currentUrgency - urgency) >= 3) {
      setPendingDrop({ task, urgency, importance: Math.round(importance) })
    } else if (!task.deadline) {
      if (Math.abs(task.manual_urgency - urgency) > 0.5 || importanceChanged) void update.mutateAsync({ id: task.id, patch: { manual_urgency: Math.round(urgency), importance: Math.round(importance) } }).catch((e: unknown) => setActionError(e instanceof Error ? e.message : 'Could not move task.'))
    }
  }

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'matrix', label: 'Matrix', icon: LayoutDashboard }, { id: 'list', label: 'Task list', icon: ListChecks }, { id: 'batch', label: 'Batch work', icon: Layers3 },
  ]

  return <div className="app-shell min-h-screen bg-canvas text-ink">
    <aside className="sidebar fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-[#e8ece7] bg-white px-4 pb-4 pt-5 lg:flex">
      <div className="mb-9 flex items-center gap-2.5 px-2"><AntMark small /><span className="font-display text-[22px] font-extrabold tracking-[-.065em] text-ink">atta<span className="text-[#8fa34c]">.</span></span></div>
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#a0a9a1]">Workspace</div>
      <nav className="space-y-1" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)} className={`nav-item flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition ${view === id ? 'bg-[#eef4eb] text-[#315f40]' : 'text-[#758078] hover:bg-[#f7f8f6] hover:text-ink'}`}><Icon size={17} strokeWidth={view === id ? 2.1 : 1.8} /><span className="flex-1">{label}</span>{id === 'list' && openTaskCount > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] ${view === id ? 'bg-white text-forest' : 'bg-[#f2f4f1] text-[#829087]'}`}>{openTaskCount}</span>}{view === id && <ChevronRight size={14} className="opacity-60" />}</button>)}</nav>
      <div className="mt-8 border-t border-[#edf0ec] pt-5"><p className="px-3 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-[#849185]">&gt; focus.status</p><div className="mx-2 mt-3 rounded-2xl bg-[#f6f8f4] p-3.5"><div className="flex items-center justify-between"><span className="font-mono text-[11px] text-[#627064]">tasks.open</span><Activity size={14} className="text-[#879a57]" /></div><p className="mt-2 font-mono text-2xl font-bold tracking-tight text-ink">{String(openTaskCount).padStart(2, '0')}<span className="ml-2 font-sans text-xs font-medium text-[#9aa49b]">in motion</span></p><div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e5eae1]"><div className="h-full rounded-full bg-[#95ad60] transition-all" style={{ width: `${Math.min(100, averageUrgency)}%` }} /></div><p className="mt-1.5 font-mono text-[10px] text-[#8d998d]">{openTaskCount ? `urgency.avg ${averageUrgency}%` : 'status.ready'}</p></div></div>
      <div className="mt-auto rounded-2xl border border-[#edf0ec] bg-[#fbfcfa] p-3"><div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e9f0e6] text-xs font-bold text-[#45674b]">{localMode ? 'A' : (user?.email?.[0]?.toUpperCase() ?? 'U')}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{localMode ? 'Your workspace' : user?.email}</p><p className="text-[10px] text-[#939e94]">{localMode ? 'Local on this device' : 'Personal account'}</p></div><button type="button" aria-label="Sign out" onClick={() => { void signOut() }} className="grid h-8 w-8 place-items-center rounded-lg text-[#8b968d] hover:bg-[#f0f3ee] hover:text-ink"><LogOut size={15} /></button></div></div>
    </aside>

    <div className="min-h-screen lg:pl-[232px]">
      <header className="topbar sticky top-0 z-10 border-b border-[#e8ece7] bg-[#f7f8f6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-9">
          <div className="flex items-center gap-2 lg:hidden"><AntMark small /><span className="font-display text-xl font-extrabold tracking-[-.065em]">atta<span className="text-[#8fa34c]">.</span></span></div>
          <div className="hidden items-center gap-2 font-mono text-[11px] lg:flex"><span className="text-[#7fa477]">~/atta</span><span className="text-[#9aa39b]">/</span><span className="font-semibold lowercase text-[#526157]">{view === 'matrix' ? 'matrix' : view === 'list' ? 'tasks' : 'batch'}</span><span className="terminal-caret ml-0.5 h-3.5 w-[7px] bg-[#8fae63]" aria-hidden="true" /></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3"><span className="hidden text-xs text-[#909a92] sm:inline">{formatToday(now)}</span><span className="hidden h-4 w-px bg-[#e0e5df] sm:block" /><button type="button" aria-label="Keyboard shortcuts" onClick={() => setHelpOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl text-[#849086] transition hover:bg-white hover:text-ink"><Command size={16} /></button><button type="button" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDarkMode(!darkMode)} className="grid h-9 w-9 place-items-center rounded-xl text-[#849086] transition hover:bg-white hover:text-ink">{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button><button type="button" aria-label="Help" onClick={() => setHelpOpen(true)} className="hidden h-9 w-9 place-items-center rounded-xl text-[#849086] transition hover:bg-white hover:text-ink sm:grid"><CircleHelp size={16} /></button><button type="button" aria-label="Sign out" onClick={() => { void signOut() }} className="grid h-9 w-9 place-items-center rounded-xl text-[#849086] transition hover:bg-white hover:text-ink lg:hidden"><LogOut size={16} /></button></div>
        </div>
        <nav className="mobile-nav flex border-t border-[#edf0ec] px-3 py-2 lg:hidden" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setView(id)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold ${view === id ? 'text-forest' : 'text-[#8b958d]'}`}><Icon size={17} /><span>{label}</span></button>)}</nav>
      </header>
      <main className={`mx-auto max-w-[1440px] px-4 ${view === 'matrix' ? 'pb-4' : 'pb-10'} pt-6 sm:px-7 sm:pt-8 lg:px-9 lg:pt-9`}>
        {localMode && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#e2e9dd] bg-[#f1f6ed] px-3.5 py-2.5 text-xs text-[#61745f]"><span><strong className="font-semibold text-[#415e43]">Local mode</strong> · Changes are saved on this device. Connect Supabase for sign-in and sync.</span><button type="button" onClick={() => setHelpOpen(true)} aria-label="Learn about setup"><CircleHelp size={15} /></button></div>}
        {actionError && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl bg-[#fff0ee] px-3.5 py-2.5 text-sm text-[#a83f38]"><span className="flex items-center gap-2"><AlertCircle size={15} />{actionError}</span><button type="button" onClick={() => setActionError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
        {isLoading ? <div className="grid min-h-[460px] place-items-center rounded-2xl border border-line bg-white"><div className="flex items-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cad7cb] border-t-forest" />Loading your tasks…</div></div> : isError ? <div className="grid min-h-[400px] place-items-center rounded-2xl border border-[#f0d8d5] bg-white px-6 text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1ef] text-[#b9574d]"><AlertCircle size={20} /></span><p className="mt-3 text-sm font-semibold text-ink">We couldn’t load your tasks</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted">{error instanceof Error ? error.message : 'Check your connection and Supabase settings, then try again.'}</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></div></div> : view === 'matrix' ? <MatrixView tasks={tasks} now={now} onEdit={edit} onDrop={handleDrop} onAdd={() => edit()} /> : view === 'list' ? <TaskListView tasks={tasks} now={now} onEdit={edit} onAdd={() => edit()} onComplete={(task) => void toggleComplete(task)} /> : batchQuery.isLoading ? <div className="grid min-h-[360px] place-items-center rounded-2xl border border-line bg-white"><div className="flex items-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cad7cb] border-t-forest" />Loading your sessions…</div></div> : batchQuery.isError ? <div role="alert" className="rounded-2xl border border-[#f0d8d5] bg-white p-6 text-sm text-[#a83f38]">Sessions could not be loaded. <button type="button" className="ml-1 font-semibold underline" onClick={() => void batchQuery.refetch()}>Try again</button></div> : <BatchView tasks={tasks} batches={batchQuery.batches} onCreateBatch={(title, taskIds) => batchQuery.create.mutateAsync({ title, taskIds })} onBatchStatus={(batch, status) => batchQuery.update.mutate({ id: batch.id, status })} onToggleTask={(task) => void toggleComplete(task)} />}
        {view !== 'matrix' && <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#e9ede8] pt-4 text-[10px] text-[#9aa39b]"><span>Atta <span className="mx-1">·</span> A little clarity, every day.</span><span>Priorities move. You choose the pace.</span></footer>}
      </main>
    </div>

    <TaskEditor key={editingTask?.id ?? 'new'} open={editorOpen} onClose={() => setEditorOpen(false)} task={editingTask} onSave={saveTask} onComplete={(task) => { void toggleComplete(task); setEditorOpen(false) }} onDelete={(task) => { void deleteTask(task) }} />
    <Modal open={Boolean(pendingDrop)} onClose={() => setPendingDrop(null)} title="Adjust this deadline task?" description="Its urgency comes from the deadline, effort, and buffer. Choose how you want the drag to change it.">
      {pendingDrop && <div className="space-y-3"><div className="rounded-xl bg-[#f6f8f4] p-3"><p className="text-sm font-semibold text-ink">{pendingDrop.task.title}</p><p className="mt-1 text-xs text-muted">New urgency target: {Math.round(pendingDrop.urgency)}% · Importance: {pendingDrop.importance}</p></div><Button disabled={rescheduleWouldBeOverdue} className="w-full justify-between" onClick={() => { if (!rescheduledDeadline || rescheduleWouldBeOverdue) return; void update.mutateAsync({ id: pendingDrop.task.id, patch: { deadline: rescheduledDeadline, importance: pendingDrop.importance } }).catch((e: unknown) => setActionError(e instanceof Error ? e.message : 'Could not reschedule this task.')); setPendingDrop(null) }}>Reschedule deadline <ArrowRight size={15} /></Button>{rescheduleWouldBeOverdue && <p className="rounded-xl bg-[#fff7e9] px-3 py-2 text-xs leading-5 text-[#866c3b]">That urgency target would put the deadline in the past. Review effort or urgency settings to keep the deadline valid.</p>}<Button variant="secondary" className="w-full justify-between" onClick={() => { setEditingTask({ ...pendingDrop.task, importance: pendingDrop.importance }); setEditorOpen(true); setPendingDrop(null) }}>Review urgency settings <ArrowRight size={15} /></Button><Button variant="ghost" className="w-full" onClick={() => setPendingDrop(null)}>Cancel</Button></div>}
    </Modal>
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="About Atta">
      <div className="mb-4"><AboutAttaCard /></div>
      <div className="space-y-2 text-sm"><div className="flex items-center justify-between rounded-xl bg-[#f7f8f6] px-3 py-2.5"><span className="text-[#526057]">Add a task</span><kbd className="rounded-md border border-[#dce2dc] bg-white px-2 py-1 text-xs text-ink">N</kbd></div><div className="flex items-center justify-between rounded-xl bg-[#f7f8f6] px-3 py-2.5"><span className="text-[#526057]">Quick add</span><kbd className="rounded-md border border-[#dce2dc] bg-white px-2 py-1 text-xs text-ink">⌘ / Ctrl + K</kbd></div><div className="flex items-center justify-between rounded-xl bg-[#f7f8f6] px-3 py-2.5"><span className="text-[#526057]">Search the task list</span><kbd className="rounded-md border border-[#dce2dc] bg-white px-2 py-1 text-xs text-ink">/</kbd></div></div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e5ebe2] bg-[#f7faf5] p-3 text-xs leading-5 text-[#68796a]"><Check size={14} className="mt-0.5 shrink-0 text-forest" />Urgency updates on this device while Atta is open. It is calculated from your deadlines; no background jobs are needed.</div>
    </Modal>
  </div>
}

export default function App() {
  return <HashRouter><QueryClientProvider client={queryClient}><AuthProvider><Dashboard /></AuthProvider></QueryClientProvider></HashRouter>
}
