import { supabase } from './supabase'
import type { Batch, Task, TaskDraft } from '../types/task'

const TASKS_KEY = 'atta.tasks.v1'
const BATCHES_KEY = 'atta.batches.v1'

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T[] : []
  } catch { return [] }
}
function writeLocal<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)) }
const nowIso = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

export async function listTasks(userId: string): Promise<Task[]> {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Task[]
  }
  return readLocal<Task>(TASKS_KEY).filter((task) => task.user_id === userId)
}

export async function createTask(userId: string, draft: TaskDraft): Promise<Task> {
  const timestamp = nowIso()
  const row: Task = { ...draft, id: newId(), user_id: userId, title: draft.title.trim(), description: draft.description?.trim() || null,
    status: 'open', completed_at: null, created_at: timestamp, updated_at: timestamp }
  if (supabase) {
    const { data, error } = await supabase.from('tasks').insert(row).select().single()
    if (error) throw error
    return data as Task
  }
  writeLocal(TASKS_KEY, [row, ...readLocal<Task>(TASKS_KEY)])
  return row
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const values = { ...patch, updated_at: nowIso() }
  if (supabase) {
    const { data, error } = await supabase.from('tasks').update(values).eq('id', id).select().single()
    if (error) throw error
    return data as Task
  }
  const rows = readLocal<Task>(TASKS_KEY)
  const updated = rows.map((task) => task.id === id ? { ...task, ...values } : task).find((task) => task.id === id)
  if (!updated) throw new Error('Task could not be found.')
  writeLocal(TASKS_KEY, rows.map((task) => task.id === id ? updated : task))
  return updated
}

export async function deleteTask(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    return
  }
  writeLocal(TASKS_KEY, readLocal<Task>(TASKS_KEY).filter((task) => task.id !== id))
}

export async function listBatches(userId: string): Promise<Batch[]> {
  if (supabase) {
    const { data, error } = await supabase.from('batches').select('*, batch_tasks(task_id)').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: { id: string; user_id: string; title: string; status: Batch['status']; created_at: string; batch_tasks?: Array<{ task_id: string }> }) => ({ ...row, task_ids: row.batch_tasks?.map((entry) => entry.task_id) ?? [] })) as Batch[]
  }
  return readLocal<Batch>(BATCHES_KEY).filter((batch) => batch.user_id === userId)
}

export async function createBatch(userId: string, title: string, taskIds: string[]): Promise<Batch> {
  const row: Batch = { id: newId(), user_id: userId, title: title.trim() || 'Focused work', status: 'planned', created_at: nowIso(), task_ids: taskIds }
  if (supabase) {
    const { data, error } = await supabase.from('batches').insert({ id: row.id, user_id: userId, title: row.title, status: row.status }).select().single()
    if (error) throw error
    if (taskIds.length) {
      const result = await supabase.from('batch_tasks').insert(taskIds.map((task_id) => ({ batch_id: row.id, task_id })))
      if (result.error) throw result.error
    }
    return { ...data, task_ids: taskIds } as Batch
  }
  writeLocal(BATCHES_KEY, [row, ...readLocal<Batch>(BATCHES_KEY)])
  return row
}

export async function updateBatch(id: string, patch: Partial<Batch>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('batches').update({ status: patch.status, title: patch.title }).eq('id', id)
    if (error) throw error
    return
  }
  writeLocal(BATCHES_KEY, readLocal<Batch>(BATCHES_KEY).map((batch) => batch.id === id ? { ...batch, ...patch } : batch))
}
