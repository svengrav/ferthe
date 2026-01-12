export interface GeoLocation {
    lat: number;
    lon: number;
}
export interface GeoRegion {
    center: GeoLocation;
    radius: number;
}
export interface GeoBoundary {
    northEast: GeoLocation;
    southWest: GeoLocation;
}
export interface GeoDirection {
    bearing: number;
    direction: number;
    directionShort: GeoCardinalDirection;
    directionLong: GeoCardinalDirectionName;
}
export type GeoCardinalDirection = keyof typeof CARDINAL_DEGREES;
export type GeoCardinalDirectionName = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
export declare const CARDINAL_DEGREES: {
    readonly N: 0;
    readonly NE: 45;
    readonly E: 90;
    readonly SE: 135;
    readonly S: 180;
    readonly SW: 225;
    readonly W: 270;
    readonly NW: 315;
};
export declare const CARDINAL_DIRECTIONS: GeoCardinalDirection[];
export declare const CARDINAL_DIRECTION_NAMES: GeoCardinalDirectionName[];
