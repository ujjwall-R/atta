import type { Quadrant, Task } from '../types/task'

export const DEFAULT_EFFORT_MINUTES = 60
export const DEFAULT_BUFFER_MINUTES = 30
export const DEFAULT_GROWTH_RATE = 0.7
const DAY_MS = 86_400_000

export interface UrgencyInput {
  deadline?: string | null
  estimatedEffortMinutes?: number | null
  growthRate?: number | null
  manualUrgency?: number | null
  status?: string
  now?: string | number | Date
  bufferMinutes?: number
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))
const validNumber = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n)

/** Sigmoid urgency based on days relative to a computed latest-safe-start midpoint. */
export function calculateUrgency(input: UrgencyInput): number {
  const baseline = clamp(validNumber(input.manualUrgency) ? input.manualUrgency : 0)
  if (input.status === 'completed') return baseline
  const now = input.now instanceof Date ? input.now.getTime() : new Date(input.now ?? Date.now()).getTime()
  const deadline = input.deadline ? new Date(input.deadline).getTime() : Number.NaN
  if (!Number.isFinite(now)) return baseline
  if (!Number.isFinite(deadline)) return baseline
  // An overdue open task is explicitly maximally urgent until it is rescheduled or completed.
  if (deadline <= now) return 100
  const effort = validNumber(input.estimatedEffortMinutes) && input.estimatedEffortMinutes >= 0
    ? input.estimatedEffortMinutes : DEFAULT_EFFORT_MINUTES
  const buffer = validNumber(input.bufferMinutes) && input.bufferMinutes >= 0
    ? input.bufferMinutes : DEFAULT_BUFFER_MINUTES
  const midpoint = deadline - (effort + buffer) * 60_000
  const daysFromMidpoint = (now - midpoint) / DAY_MS
  const rate = validNumber(input.growthRate) && input.growthRate > 0 ? input.growthRate : DEFAULT_GROWTH_RATE
  const exponent = Math.max(-700, Math.min(700, -rate * daysFromMidpoint))
  const result = 100 / (1 + Math.exp(exponent))
  // The selected urgency is the curve's lower baseline; deadlines raise it toward 100.
  const curve = Number.isFinite(result) ? result / 100 : 0
  return clamp(baseline + (100 - baseline) * curve)
}

/** Returns the epoch time when a deadline task reaches the requested urgency threshold. */
export function urgencyThresholdTime(input: UrgencyInput, threshold = 50): number | null {
  const baseline = clamp(validNumber(input.manualUrgency) ? input.manualUrgency : 0)
  if (baseline >= threshold || threshold >= 100 || threshold <= baseline) return null
  const deadline = input.deadline ? new Date(input.deadline).getTime() : Number.NaN
  if (!Number.isFinite(deadline)) return null
  const effort = validNumber(input.estimatedEffortMinutes) && input.estimatedEffortMinutes >= 0
    ? input.estimatedEffortMinutes : DEFAULT_EFFORT_MINUTES
  const buffer = validNumber(input.bufferMinutes) && input.bufferMinutes >= 0
    ? input.bufferMinutes : DEFAULT_BUFFER_MINUTES
  const rate = validNumber(input.growthRate) && input.growthRate > 0 ? input.growthRate : DEFAULT_GROWTH_RATE
  const midpoint = deadline - (effort + buffer) * 60_000
  const probability = (threshold - baseline) / (100 - baseline)
  const logOdds = Math.log(probability / (1 - probability))
  const timestamp = midpoint + (logOdds / rate) * DAY_MS
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getQuadrant(urgency: number, importance: number, threshold = 50): Quadrant {
  const urgent = urgency >= threshold
  const important = importance >= threshold
  if (urgent && important) return 'do'
  if (!urgent && important) return 'schedule'
  if (urgent && !important) return 'batch'
  return 'eliminate'
}

export function urgencyForTask(task: Task, now: Date | number = Date.now()): number {
  return calculateUrgency({
    deadline: task.deadline,
    estimatedEffortMinutes: task.estimated_effort_minutes,
    bufferMinutes: task.effort_buffer_minutes ?? DEFAULT_BUFFER_MINUTES,
    growthRate: task.urgency_growth_rate,
    manualUrgency: task.manual_urgency,
    status: task.status,
    now,
  })
}

export function urgencyToDeadline(targetUrgency: number, growthRate: number, now = Date.now(), effortMinutes = DEFAULT_EFFORT_MINUTES, bufferMinutes = DEFAULT_BUFFER_MINUTES, baseline = 0): string {
  const floor = clamp(baseline)
  if (floor >= 100) return new Date(now + Math.max(0, effortMinutes) * 60_000 + Math.max(0, bufferMinutes) * 60_000 + DAY_MS).toISOString()
  const urgency = clamp(targetUrgency, floor + 0.0001, 99.999)
  const curveValue = (urgency - floor) / (100 - floor)
  const rate = validNumber(growthRate) && growthRate > 0 ? growthRate : DEFAULT_GROWTH_RATE
  const probability = clamp(curveValue, 0.000001, 0.999999)
  const logOdds = Math.log(probability / (1 - probability))
  const latestSafeStart = now - (logOdds / rate) * DAY_MS
  return new Date(latestSafeStart + (Math.max(0, effortMinutes) + Math.max(0, bufferMinutes)) * 60_000).toISOString()
}
