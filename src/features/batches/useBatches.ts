import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBatch, listBatches, updateBatch } from '../../lib/repository'
import type { Batch } from '../../types/task'

export function useBatches(userId: string) {
  const client = useQueryClient()
  const queryKey = ['batches', userId]
  const query = useQuery({ queryKey, queryFn: () => listBatches(userId), enabled: Boolean(userId) })
  const create = useMutation({ mutationFn: ({ title, taskIds }: { title: string; taskIds: string[] }) => createBatch(userId, title, taskIds), onSuccess: (batch) => client.setQueryData<Batch[]>(queryKey, (items = []) => [batch, ...items]) })
  const update = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'planned' | 'active' | 'completed' }) => updateBatch(id, { status }), onSuccess: () => client.invalidateQueries({ queryKey }) })
  return { ...query, batches: query.data ?? [], create, update }
}
