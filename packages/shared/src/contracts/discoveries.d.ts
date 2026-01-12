import { GeoLocation } from '@shared/geo';
import { AccountContext } from './accounts';
import { DiscoveryProfile, DiscoveryProfileUpdateData } from './discoveryProfile';
import { Result } from './results';
import { Spot } from './spots';
import { Trail } from './trails';
export interface DiscoveryApplicationContract {
    processLocation: (context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string) => Promise<Result<DiscoveryLocationRecord>>;
    getDiscoveries: (context: AccountContext, trailId?: string) => Promise<Result<Discovery[]>>;
    getDiscovery: (context: AccountContext, discoveryId: string) => Promise<Result<Discovery | undefined>>;
    getDiscoveredSpotIds: (context: AccountContext, trailId?: string) => Promise<Result<string[]>>;
    getDiscoveredSpots: (context: AccountContext, trailId?: string) => Promise<Result<Spot[]>>;
    getDiscoveredPreviewClues: (context: AccountContext, trailId: string) => Promise<Result<Clue[]>>;
    getDiscoveryTrail: (context: AccountContext, trailId: string, userLocation?: GeoLocation) => Promise<Result<DiscoveryTrail>>;
    getDiscoveryProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>;
    updateDiscoveryProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>;
}
export interface LocationWithDirection {
    location: GeoLocation;
    direction: number;
}
export interface DiscoverySnap {
    distance: number;
    intensity: number;
}
export interface DiscoveryLocationRecord {
    createdAt: Date;
    locationWithDirection: LocationWithDirection;
    snap?: DiscoverySnap | undefined;
    discoveries: Discovery[];
}
export interface Discovery {
    id: string;
    accountId: string;
    spotId: string;
    trailId: string;
    discoveredAt: Date;
    scanEventId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DiscoveryTrail {
    createdAt?: Date;
    trail: Trail | undefined;
    clues: Clue[];
    previewClues?: Clue[];
    spots: Spot[];
    discoveries: Discovery[];
}
export type ClueSource = 'preview' | 'scanEvent';
export interface Clue {
    id: string;
    spotId: string;
    trailId: string;
    location: GeoLocation;
    source: ClueSource;
}
