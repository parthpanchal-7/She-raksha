/**
 * @she-raksha/backend — PostGIS/H3 Guardian Matcher & Privacy Obfuscator
 *
 * Implements:
 *  - Uber H3 Resolution 9 cell computation (~100m hexagon)
 *  - Geofence spatial resolution & guardian target matching within 800m (FR-SOS-003)
 *  - Initial push dispatch privacy obfuscation to coarse ~100m vector centroid
 *  - PostGIS ST_DWithin SQL query generation
 */

import * as h3 from 'h3-js';
import { CONFIG } from '../config.js';
import { GuardianRecord, MatchedGuardian, ObfuscatedLocation } from '../types.js';
import { TriggerMode } from '@she-raksha/schemas';

/**
 * Calculates the Uber H3 Resolution 9 hexagon index for a given WGS-84 coordinate.
 */
export function calculateH3Res9(latitude: number, longitude: number): string {
  return h3.latLngToCell(latitude, longitude, CONFIG.H3_RESOLUTION);
}

/**
 * Obfuscates fine GPS coordinates to a ~100m coarse vector.
 * Uses the centroid of the H3 Resolution 9 hexagonal cell.
 * Preserves victim privacy on initial guardian push notification until acceptance.
 */
export function obfuscateCoordinates(
  latitude: number,
  longitude: number,
  spatialBucket = 'ttnf4b'
): ObfuscatedLocation {
  const h3Index = calculateH3Res9(latitude, longitude);
  const [coarseLat, coarseLng] = h3.cellToLatLng(h3Index);

  return {
    coarseLatitude: Math.round(coarseLat * 1000000) / 1000000,
    coarseLongitude: Math.round(coarseLng * 1000000) / 1000000,
    h3IndexRes9: h3Index,
    spatialBucket,
  };
}

/**
 * Computes great-circle distance between two WGS-84 points in meters (Haversine formula).
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface MatchGuardiansOptions {
  victimLat: number;
  victimLng: number;
  incidentId: string;
  triggerMode: TriggerMode;
  guardians: GuardianRecord[];
  maxRadiusMeters?: number; // default: 800m (FR-SOS-003)
  spatialBucket?: string;
}

/**
 * Matches active STANDBY guardians within 800 meters of the victim (FR-SOS-003).
 * Returns matching guardians sorted by distance ascending.
 * Attaches obfuscated coarse coordinates for initial push alert.
 */
export function matchActiveGuardians(options: MatchGuardiansOptions): MatchedGuardian[] {
  const {
    victimLat,
    victimLng,
    incidentId,
    triggerMode,
    guardians,
    maxRadiusMeters = CONFIG.GUARDIAN_MATCH_RADIUS_METERS,
    spatialBucket = 'ttnf4b',
  } = options;

  const coarseLocation = obfuscateCoordinates(victimLat, victimLng, spatialBucket);
  const timestamp = new Date().toISOString();

  const matched: MatchedGuardian[] = [];

  for (const guardian of guardians) {
    // 1. Must be currently active (heartbeat confirmed)
    if (!guardian.isActive) {
      continue;
    }

    // 2. Compute distance
    const dist = haversineDistanceMeters(
      victimLat,
      victimLng,
      guardian.latitude,
      guardian.longitude
    );

    // 3. Must be within the canonical 800m dispatch radius
    if (dist <= maxRadiusMeters) {
      matched.push({
        guardianId: guardian.guardianId,
        userId: guardian.userId,
        distanceMeters: dist,
        h3IndexRes9: guardian.h3IndexRes9,
        notificationPayload: {
          incidentId,
          coarseLocation,
          triggerMode,
          timestamp,
        },
      });
    }
  }

  // Sort by proximity ascending
  matched.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return matched;
}

/**
 * Generates canonical PostgreSQL/PostGIS ST_DWithin query for live database execution.
 * Uses GiST index on guardians.geom GEOGRAPHY(Point, 4326).
 */
export function generatePostGISQuery(
  victimLng: number,
  victimLat: number,
  maxRadiusMeters: number = CONFIG.GUARDIAN_MATCH_RADIUS_METERS
): { sql: string; params: [number, number, number] } {
  const sql = `
    SELECT 
      guardian_id,
      user_id,
      h3_index_res9,
      radius_meters,
      ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
    FROM guardians
    WHERE is_active = TRUE
      AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    ORDER BY distance_meters ASC;
  `.trim();

  return {
    sql,
    params: [victimLng, victimLat, maxRadiusMeters],
  };
}
