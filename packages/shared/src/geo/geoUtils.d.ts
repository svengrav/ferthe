import { GeoBoundary, GeoDirection, GeoLocation } from './types';
export declare const formatGeoCoordinates: (lat: number, lon: number) => string;
/**
 * Calculate cardinal direction from one coordinate to another
 * @param origin Starting coordinate
 * @param destination Target coordinate
 * @returns Complete GeoDirection object with bearing and directions
 */
export declare const calculateDirection: (origin: GeoLocation, destination: GeoLocation) => GeoDirection;
/**
 * Find the nearest point to a given location from an array of points
 * @param origin Current location point
 * @param points Array of possible target points
 * @returns Object containing index of nearest point and distance to it in km
 */
export declare const findNearestCoordinate: (origin: GeoLocation, points: GeoLocation[]) => {
    index: number;
    distance: number;
};
export declare const geoUtils: {
    compareCoordinates: (origin: GeoLocation, destination: GeoLocation) => {
        equal: boolean;
        distance: number;
        direction: GeoDirection;
    };
    calculateDistance: (origin: GeoLocation, destination: GeoLocation) => number;
    isCoordinateInBounds: (point: GeoLocation, boundary: GeoBoundary) => boolean;
    toRadians: (degrees: number) => number;
    toDegrees: (radians: number) => number;
    calculateBearing: (origin: GeoLocation, destination: GeoLocation) => number;
    bearingToDirection: (bearing: number) => GeoDirection;
    calculateBoundaries: (location: GeoLocation, radius: number) => GeoBoundary;
    findNearestCoordinate: (origin: GeoLocation, points: GeoLocation[]) => {
        index: number;
        distance: number;
    };
    calculateTargetLocation: (origin: GeoLocation, distance: number, bearing: number) => GeoLocation;
    calculateDistanceToBoundary: (point: GeoLocation, boundary: GeoBoundary) => {
        closestPoint: GeoLocation;
        distance: number;
    };
};
