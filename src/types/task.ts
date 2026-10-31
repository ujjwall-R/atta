export type TaskStatus = 'open' | 'completed'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  importance: number
  manual_urgency: number
  urgency_growth_rate: number
  urgency_lead_hours: number
  deadline: string | null
  estimated_effort_minutes: number | null
  effort_buffer_minutes: number
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskDraft = Pick<Task, 'title' | 'description' | 'importance' | 'manual_urgency' | 'urgency_growth_rate' | 'urgency_lead_hours' | 'deadline' | 'estimated_effort_minutes' | 'effort_buffer_minutes'>
export type Quadrant = 'do' | 'schedule' | 'batch' | 'eliminate'

export interface Batch {
  id: string
  user_id: string
  title: string
  status: 'planned' | 'active' | 'completed'
  created_at: string
  task_ids?: string[]
}
