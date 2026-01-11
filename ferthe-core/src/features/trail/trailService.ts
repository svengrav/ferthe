import { Spot } from '@shared/contracts'
import { Trail } from '@shared/contracts'

export interface TrailActions {
  getTrailById: (id: string) => Promise<Trail | null>
  getAllTrails: () => Promise<Trail[]>
  createTrail: (trail: Omit<Trail, 'id'>) => Promise<Trail>
  updateTrail: (id: string, trail: Partial<Trail>) => Promise<Trail | null>
  deleteTrail: (id: string) => Promise<boolean>
  getSpots: (trailId: string) => Spot[]
  getSpotById: (trailId: string, spotId: string) => Spot | null
}

export const createTrailService = () => {}
