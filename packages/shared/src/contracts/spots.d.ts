import { GeoLocation } from '@shared/geo';
import { Result } from './results';
export interface SpotApplicationContract {
    getSpotPreviews: () => Promise<Result<SpotPreview[]>>;
    getSpots: () => Promise<Result<Spot[]>>;
    getSpot: (id: string) => Promise<Result<Spot | undefined>>;
    createSpot: (spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>;
}
export interface Spot {
    id: string;
    trailId: string;
    slug: string;
    name: string;
    description: string;
    image?: {
        id: string;
        url: string;
        previewUrl?: string;
    };
    location: GeoLocation;
    options: {
        discoveryRadius: number;
        clueRadius: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface SpotPreview {
    id: string;
    trailId: string;
    image?: {
        id: string;
        previewUrl?: string;
    };
}
