import { isVersionOutdated, shouldShowUpdate } from '@app/features/system/versionService'
import type { AppUpdate } from '@shared/contracts'

const makeUpdate = (minAppVersion: string, force: boolean): AppUpdate => ({
  id: 'test',
  version: '1',
  createdAt: '2026-01-01T00:00:00Z',
  latestAppVersion: minAppVersion,
  minAppVersion,
  force,
})

describe('isVersionOutdated', () => {
  it('returns true when current is older (patch)', () => {
    expect(isVersionOutdated('1.0.0', '1.0.1')).toBe(true)
  })

  it('returns true when current is older (minor)', () => {
    expect(isVersionOutdated('1.0.0', '1.1.0')).toBe(true)
  })

  it('returns true when current is older (major)', () => {
    expect(isVersionOutdated('1.0.0', '2.0.0')).toBe(true)
  })

  it('returns false when current equals minimum', () => {
    expect(isVersionOutdated('1.2.3', '1.2.3')).toBe(false)
  })

  it('returns false when current is newer', () => {
    expect(isVersionOutdated('2.0.0', '1.9.9')).toBe(false)
  })

  it('handles missing patch segment gracefully', () => {
    expect(isVersionOutdated('1.0', '1.0.1')).toBe(true)
    expect(isVersionOutdated('1.0.1', '1.0')).toBe(false)
  })
})

describe('shouldShowUpdate', () => {
  it('returns false when version is up-to-date', () => {
    expect(shouldShowUpdate(makeUpdate('1.0.0', false), '1.0.0', null)).toBe(false)
    expect(shouldShowUpdate(makeUpdate('1.0.0', true), '2.0.0', null)).toBe(false)
  })

  it('returns true for forced update regardless of dismissed state', () => {
    const update = makeUpdate('1.1.0', true)
    expect(shouldShowUpdate(update, '1.0.0', '1.1.0')).toBe(true)
    expect(shouldShowUpdate(update, '1.0.0', null)).toBe(true)
  })

  it('returns false for non-forced update when already dismissed', () => {
    const update = makeUpdate('1.1.0', false)
    expect(shouldShowUpdate(update, '1.0.0', '1.1.0')).toBe(false)
  })

  it('returns true for non-forced update when not yet dismissed', () => {
    const update = makeUpdate('1.1.0', false)
    expect(shouldShowUpdate(update, '1.0.0', null)).toBe(true)
    expect(shouldShowUpdate(update, '1.0.0', '1.0.9')).toBe(true)
  })
})
