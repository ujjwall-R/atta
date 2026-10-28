import type { TaskDraft } from '../types/task'

export function validateTaskDraft(draft: Partial<TaskDraft>): string | null {
  const title = typeof draft.title === 'string' ? draft.title.trim() : ''
  if (!title) return 'Add a task title to continue.'
  if (title.length > 160) return 'Keep task titles under 160 characters.'
  if (draft.description && draft.description.length > 2000) return 'Keep descriptions under 2,000 characters.'
  if (draft.importance !== undefined && (!Number.isFinite(draft.importance) || draft.importance < 0 || draft.importance > 100)) return 'Importance must be between 0 and 100.'
  if (draft.manual_urgency !== undefined && (!Number.isFinite(draft.manual_urgency) || draft.manual_urgency < 0 || draft.manual_urgency > 100)) return 'Urgency must be between 0 and 100.'
  if (draft.urgency_growth_rate !== undefined && (!Number.isFinite(draft.urgency_growth_rate) || draft.urgency_growth_rate <= 0 || draft.urgency_growth_rate > 20)) return 'Growth rate must be between 0 and 20.'
  if (draft.estimated_effort_minutes !== null && draft.estimated_effort_minutes !== undefined && (!Number.isFinite(draft.estimated_effort_minutes) || draft.estimated_effort_minutes < 0 || draft.estimated_effort_minutes > 100_000)) return 'Effort must be a non-negative number of minutes.'
  if (draft.effort_buffer_minutes !== undefined && (!Number.isInteger(draft.effort_buffer_minutes) || draft.effort_buffer_minutes < 0 || draft.effort_buffer_minutes > 100_000)) return 'Effort buffer must be a whole number of minutes between 0 and 100,000.'
  if (draft.deadline && !Number.isFinite(new Date(draft.deadline).getTime())) return 'Choose a valid deadline.'
  return null
}
