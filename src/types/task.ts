export type TaskStatus = 'open' | 'completed'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  importance: number
  manual_urgency: number
  urgency_growth_rate: number
  deadline: string | null
  estimated_effort_minutes: number | null
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskDraft = Pick<Task, 'title' | 'description' | 'importance' | 'manual_urgency' | 'urgency_growth_rate' | 'deadline' | 'estimated_effort_minutes'>
export type Quadrant = 'do' | 'schedule' | 'batch' | 'eliminate'

export interface Batch {
  id: string
  user_id: string
  title: string
  status: 'planned' | 'active' | 'completed'
  created_at: string
  task_ids?: string[]
}
