import { formatDate, formatDatetime } from '@app/shared/utils/dateTimeUtils'

describe('dateTimeUtils', () => {
  describe('formatDatetime', () => {
    it('returns empty string when no date is provided', () => {
      expect(formatDatetime(undefined)).toBe('')
    })

    it('returns a formatted time string for a valid date', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDatetime(date)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('formatDate', () => {
    it('returns empty string when no date is provided', () => {
      expect(formatDate(undefined)).toBe('')
    })

    it('returns a formatted date string for a valid date', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDate(date)
      expect(result).toContain('2024')
      expect(result).toContain('15')
    })

    it('accepts a date string as input', () => {
      const result = formatDate('2024-06-01T10:00:00')
      expect(result).toContain('2024')
    })
  })
})
