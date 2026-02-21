import { CreateSpotRequest, Spot, UpdateSpotRequest } from '@shared/contracts'
import { SpotContentFormValues, SpotOptionsFormValues } from './spotFormSchema'

interface GeoLocation {
  lat: number
  lon: number
}

/** Build a CreateSpotRequest from validated form data. */
export function buildCreateRequest(
  content: SpotContentFormValues,
  options: SpotOptionsFormValues,
  location: GeoLocation,
  imageBase64?: string,
): CreateSpotRequest {
  return {
    content: {
      name: content.name.trim(),
      description: content.description.trim(),
      imageBase64,
      contentBlocks: content.contentBlocks.length > 0 ? content.contentBlocks : undefined,
    },
    location,
    visibility: options.visibility,
    trailIds: options.trailIds.length > 0 ? options.trailIds : undefined,
    consent: true,
  }
}

/** Build an UpdateSpotRequest by diffing form data against the existing spot. Returns undefined if nothing changed. */
export function buildUpdateRequest(
  content: SpotContentFormValues,
  options: SpotOptionsFormValues,
  spot: Spot,
  imageBase64?: string,
): UpdateSpotRequest | undefined {
  const updates: UpdateSpotRequest = {
    content: {
      name: content.name.trim() !== spot.name ? content.name.trim() : undefined,
      description: content.description.trim() !== spot.description ? content.description.trim() : undefined,
      imageBase64,
      contentBlocks: content.contentBlocks,
    },
    visibility: options.visibility !== spot.options.visibility ? options.visibility : undefined,
    trailIds: options.trailIds,
  }

  const hasContentChanges = updates.content?.name || updates.content?.description || updates.content?.imageBase64 || updates.content?.contentBlocks
  if (!hasContentChanges && !updates.visibility) {
    return undefined
  }

  return updates
}

/** Get trail IDs that contain a given spot from the trail store data. */
export function getSpotTrailIds(spotId: string, trailSpotIds: Record<string, string[]>): string[] {
  const result: string[] = []
  for (const [trailId, spotIds] of Object.entries(trailSpotIds)) {
    if (spotIds.includes(spotId)) {
      result.push(trailId)
    }
  }
  return result
}
