/**
 * Shared utilities for formatting galaxy coordinates
 */

export interface SystemCoordinates {
  galaxyNumber: number;
  sectorX: number;
  sectorY: number;
  systemX: number;
  systemY: number;
}

export interface PlanetCoordinates extends SystemCoordinates {
  planetX: number;
  planetY: number;
}

/**
 * Format system coordinates
 * Example: G1/S2-3/Sys4-5
 */
export function formatSystemCoordinates(coords: SystemCoordinates): string {
  return `G${coords.galaxyNumber}/S${coords.sectorX}-${coords.sectorY}/Sys${coords.systemX}-${coords.systemY}`;
}

/**
 * Format planet coordinates (includes system coordinates)
 * Example: G1/S2-3/Sys4-5/P6-7
 */
export function formatPlanetCoordinates(coords: PlanetCoordinates): string {
  return `${formatSystemCoordinates(coords)}/P${coords.planetX}-${coords.planetY}`;
}

/**
 * Format coordinates for display, automatically detecting if planet coordinates are available
 */
export function formatCoordinates(coords: SystemCoordinates | PlanetCoordinates): string {
  if ('planetX' in coords && 'planetY' in coords) {
    return formatPlanetCoordinates(coords);
  }
  return formatSystemCoordinates(coords);
}