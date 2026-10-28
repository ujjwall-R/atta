import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask, listTasks, updateTask } from '../../lib/repository'
import { validateTaskDraft } from '../../lib/validation'
import type { Task, TaskDraft } from '../../types/task'

export function useTasks(userId: string) {
  const client = useQueryClient()
  const queryKey = ['tasks', userId]
  const query = useQuery({ queryKey, queryFn: () => listTasks(userId), enabled: Boolean(userId), staleTime: 30_000 })
  const create = useMutation({ mutationFn: (draft: TaskDraft) => {
    const error = validateTaskDraft(draft)
    if (error) throw new Error(error)
    return createTask(userId, draft)
  }, onSuccess: (task) => client.setQueryData<Task[]>(queryKey, (items = []) => [task, ...items]) })
  const update = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => updateTask(id, patch), onSuccess: (task) => client.setQueryData<Task[]>(queryKey, (items = []) => items.map((item) => item.id === task.id ? task : item)) })
  const remove = useMutation({ mutationFn: async (id: string) => { await deleteTask(id); return id }, onSuccess: (id) => client.setQueryData<Task[]>(queryKey, (items = []) => items.filter((item) => item.id !== id)) })
  return { ...query, tasks: query.data ?? [], create, update, remove }
}
