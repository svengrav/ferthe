import { AccountContext, ImageApplicationContract, ImageReference, Spot, StoredSpot } from '@shared/contracts/index.ts'

/**
 * Enrich spot entity with fresh image URLs
 */
export async function enrichSpotWithImages(
  context: AccountContext,
  spotEntity: StoredSpot,
  imageApplication: ImageApplicationContract
): Promise<Spot> {
  let image: ImageReference | undefined
  let blurredImage: ImageReference | undefined

  if (spotEntity.imageBlobPath) {
    const urlResult = await imageApplication.refreshImageUrl(context, spotEntity.imageBlobPath)

    if (urlResult.success && urlResult.data) {
      image = {
        id: spotEntity.imageBlobPath,
        url: urlResult.data,
      }
    }
  }

  // Load blurred image separately (for undiscovered spots)
  if (spotEntity.blurredImageBlobPath) {
    const blurredResult = await imageApplication.refreshImageUrl(context, spotEntity.blurredImageBlobPath)
    if (blurredResult.success && blurredResult.data) {
      blurredImage = {
        id: spotEntity.blurredImageBlobPath,
        url: blurredResult.data,
      }
    }
  }

  return {
    id: spotEntity.id,
    slug: spotEntity.slug,
    name: spotEntity.name,
    description: spotEntity.description,
    image,
    blurredImage,
    location: spotEntity.location,
    options: spotEntity.options,
    createdAt: spotEntity.createdAt,
    updatedAt: spotEntity.updatedAt,
  }
}
