import { describe, expect, it } from 'vitest'
import { calculateUrgency, getQuadrant, urgencyToDeadline } from './urgency'
import { validateTaskDraft } from './validation'

const fixedNow = new Date('2026-01-10T12:00:00.000Z')

describe('calculateUrgency', () => {
  it('increases as a deadline approaches', () => {
    const base = { deadline: '2026-01-20T12:00:00.000Z', estimatedEffortMinutes: 60, now: fixedNow }
    expect(calculateUrgency(base)).toBeLessThan(calculateUrgency({ ...base, now: '2026-01-19T12:00:00.000Z' }))
  })
  it('supports different growth rates', () => {
    const input = { deadline: '2026-01-11T12:00:00.000Z', now: '2026-01-11T11:00:00.000Z' }
    expect(calculateUrgency({ ...input, growthRate: 2 })).toBeGreaterThan(calculateUrgency({ ...input, growthRate: 0.2 }))
  })
  it('raises urgency sooner when the effort buffer is larger', () => {
    const input = { deadline: '2026-01-11T12:00:00.000Z', estimatedEffortMinutes: 60, now: '2026-01-11T10:30:00.000Z' }
    expect(calculateUrgency({ ...input, bufferMinutes: 60 })).toBeGreaterThan(calculateUrgency({ ...input, bufferMinutes: 30 }))
  })
  it('returns maximum urgency for overdue tasks', () => {
    expect(calculateUrgency({ deadline: '2026-01-09T12:00:00Z', now: fixedNow })).toBe(100)
  })
  it('uses stable manual urgency without a deadline and clamps it', () => {
    expect(calculateUrgency({ manualUrgency: 28, now: fixedNow })).toBe(28)
    expect(calculateUrgency({ manualUrgency: 120, now: fixedNow })).toBe(100)
  })
  it('returns deterministic output for a supplied timestamp', () => {
    const input = { deadline: '2026-01-15T12:00:00Z', now: fixedNow }
    expect(calculateUrgency(input)).toBe(calculateUrgency(input))
  })
  it('handles completed, invalid and missing values safely', () => {
    expect(calculateUrgency({ status: 'completed', manualUrgency: 15, now: fixedNow })).toBe(15)
    expect(calculateUrgency({ deadline: 'not-a-date', manualUrgency: 44, now: fixedNow })).toBe(44)
    expect(calculateUrgency({ now: fixedNow })).toBe(0)
  })
  it('can reschedule a task to its current target urgency', () => {
    const deadline = urgencyToDeadline(50, 0.7, fixedNow.getTime(), 60, 45)
    const result = calculateUrgency({ deadline, growthRate: 0.7, estimatedEffortMinutes: 60, bufferMinutes: 45, now: fixedNow })
    expect(result).toBeCloseTo(50, 4)
    const earlierInCurve = urgencyToDeadline(25, 0.7, fixedNow.getTime(), 60, 45)
    expect(calculateUrgency({ deadline: earlierInCurve, growthRate: 0.7, estimatedEffortMinutes: 60, bufferMinutes: 45, now: fixedNow })).toBeCloseTo(25, 4)
  })
})

describe('classification and validation', () => {
  it('classifies threshold boundaries consistently', () => {
    expect(getQuadrant(50, 50)).toBe('do')
    expect(getQuadrant(49.99, 50)).toBe('schedule')
    expect(getQuadrant(50, 49.99)).toBe('batch')
    expect(getQuadrant(0, 0)).toBe('eliminate')
  })
  it('validates task title and ranges', () => {
    expect(validateTaskDraft({ title: '  ' })).toContain('title')
    expect(validateTaskDraft({ title: 'Plan', importance: 101 })).toContain('Importance')
    expect(validateTaskDraft({ title: 'Plan', importance: 80 })).toBeNull()
    expect(validateTaskDraft({ title: 'Plan', effort_buffer_minutes: -1 })).toContain('Effort buffer')
    expect(validateTaskDraft({ title: 'Plan', effort_buffer_minutes: 45 })).toBeNull()
  })
})
