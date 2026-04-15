import { describe, it, expect } from 'vitest'
import { formatCents, formatDate, formatRelativeDate } from '../format'

describe('formatCents', () => {
  it('formats 0 cents', () => {
    expect(formatCents(0)).toBe('$0.00')
  })

  it('formats 1599 cents', () => {
    expect(formatCents(1599)).toBe('$15.99')
  })

  it('formats 100 cents', () => {
    expect(formatCents(100)).toBe('$1.00')
  })

  it('formats negative cents', () => {
    expect(formatCents(-500)).toBe('-$5.00')
  })

  it('formats 1 cent', () => {
    expect(formatCents(1)).toBe('$0.01')
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-01-15T00:00:00Z')
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('formatRelativeDate', () => {
  it('returns "Today" for today', () => {
    const today = new Date().toISOString()
    expect(formatRelativeDate(today)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatRelativeDate(yesterday.toISOString())).toBe('Yesterday')
  })
})
