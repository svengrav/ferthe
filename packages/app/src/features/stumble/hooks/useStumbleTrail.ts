import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { useTrail } from '@app/features/trail/stores/trailStore'
import { Trail } from '@shared/contracts'

/** Type-safe guard: is this trail a stumble trail? */
export const isStumbleTrail = (trail: Trail): boolean => trail.kind === 'stumble'

/** Reactive hook: true when the currently active trail is a stumble trail. */
export const useIsStumbleTrail = (): boolean => {
  const trailId = useDiscoveryTrailId()
  const trail = useTrail(trailId ?? '')
  return trail?.kind === 'stumble'
}
