export * from './stumbleApplication'
export * from './stumbleStore'
export { StumblePreferencePicker } from './components/StumblePreferencePicker'
export { useStumbleTrailPicker } from './hooks/useStumbleTrailPicker'

import { Trail } from '@shared/contracts'

/** Type-safe guard: is this trail a stumble trail? */
export const isStumbleTrail = (trail: Trail): boolean => trail.kind === 'stumble'
