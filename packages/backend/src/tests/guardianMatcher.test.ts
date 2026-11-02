/**
 * @she-raksha/backend — PostGIS/H3 Guardian Matcher Tests
 *
 * Verifies:
 *  - Uber H3 Resolution 9 calculation (~100m hexagon)
 *  - PostGIS ST_DWithin 800m active standby guardian proximity matching (FR-SOS-003)
 *  - Exclusion of guardians >800m and inactive guardians
 *  - Privacy obfuscation of victim coordinates to ~100m coarse vector
 *  - SQL generator for ST_DWithin geography query
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateH3Res9,
  obfuscateCoordinates,
  haversineDistanceMeters,
  matchActiveGuardians,
  generatePostGISQuery,
} from '../spatial/guardianMatcher.js';
import { GuardianRecord } from '../types.js';
import { TriggerMode } from '@she-raksha/schemas';

describe('Spatial Engine & Guardian Matcher (FR-SOS-003)', () => {
  const centerLat = 28.6139; // Connaught Place, New Delhi
  const centerLng = 77.2090;

  test('calculates valid Uber H3 Resolution 9 index (~100m hexagon)', () => {
    const h3Index = calculateH3Res9(centerLat, centerLng);
    assert.ok(h3Index, 'H3 index should be defined');
    assert.match(h3Index, /^[0-9a-f]{15}$/, 'H3 index should be 15 hex characters');
  });

  test('obfuscates victim coordinates to ~100m coarse centroid for initial push alert', () => {
    const obfuscated = obfuscateCoordinates(centerLat, centerLng, 'ttnf4b');
    assert.ok(obfuscated.coarseLatitude, 'Coarse latitude defined');
    assert.ok(obfuscated.coarseLongitude, 'Coarse longitude defined');
    assert.equal(obfuscated.spatialBucket, 'ttnf4b');

    // Distance between raw and coarse centroid must be small (< 200m)
    const dist = haversineDistanceMeters(
      centerLat,
      centerLng,
      obfuscated.coarseLatitude,
      obfuscated.coarseLongitude
    );
    assert.ok(dist <= 200, `Obfuscation offset ${dist}m should be <= 200m`);
    assert.ok(dist >= 0, 'Distance is non-negative');
  });

  test('calculates Haversine distance accurately', () => {
    // 0.001 deg latitude is approximately 111 meters
    const dist = haversineDistanceMeters(centerLat, centerLng, centerLat + 0.001, centerLng);
    assert.ok(dist >= 100 && dist <= 125, `Expected ~111m, got ${dist}m`);
  });

  test('matches only active STANDBY guardians within 800m (FR-SOS-003)', () => {
    const testGuardians: GuardianRecord[] = [
      {
        guardianId: 'g-near-active',
        userId: 'u1',
        latitude: centerLat + 0.002, // ~222m away
        longitude: centerLng + 0.001,
        h3IndexRes9: calculateH3Res9(centerLat + 0.002, centerLng + 0.001),
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '1000000000000000000',
      },
      {
        guardianId: 'g-mid-active',
        userId: 'u2',
        latitude: centerLat - 0.004, // ~444m away
        longitude: centerLng,
        h3IndexRes9: calculateH3Res9(centerLat - 0.004, centerLng),
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '1000000000000000000',
      },
      {
        guardianId: 'g-far-active',
        userId: 'u3',
        latitude: centerLat + 0.010, // ~1110m away (> 800m)
        longitude: centerLng,
        h3IndexRes9: calculateH3Res9(centerLat + 0.010, centerLng),
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '1000000000000000000',
      },
      {
        guardianId: 'g-near-inactive',
        userId: 'u4',
        latitude: centerLat + 0.001, // ~111m away but INACTIVE
        longitude: centerLng,
        h3IndexRes9: calculateH3Res9(centerLat + 0.001, centerLng),
        radiusMeters: 2000,
        isActive: false,
        stakeWei: '1000000000000000000',
      },
    ];

    const matched = matchActiveGuardians({
      victimLat: centerLat,
      victimLng: centerLng,
      incidentId: 'inc-test-001',
      triggerMode: TriggerMode.VOICE_DURESS_TFLITE,
      guardians: testGuardians,
      maxRadiusMeters: 800,
    });

    // Exactly 2 guardians should match: g-near-active and g-mid-active
    assert.equal(matched.length, 2, 'Should match exactly 2 active guardians within 800m');
    assert.equal(matched[0].guardianId, 'g-near-active', 'Nearest guardian sorted first');
    assert.equal(matched[1].guardianId, 'g-mid-active', 'Second nearest sorted second');
    assert.ok(matched[0].distanceMeters <= matched[1].distanceMeters, 'Ascending distance sort');
    assert.ok(matched[0].distanceMeters <= 800, 'Matched within 800m');
    assert.ok(matched[1].distanceMeters <= 800, 'Matched within 800m');

    // Confirm obfuscated coordinate payload is attached
    assert.ok(matched[0].notificationPayload.coarseLocation.h3IndexRes9);
    assert.equal(matched[0].notificationPayload.triggerMode, TriggerMode.VOICE_DURESS_TFLITE);
  });

  test('generates valid PostGIS ST_DWithin query with GiST parameters', () => {
    const { sql, params } = generatePostGISQuery(centerLng, centerLat, 800);
    assert.ok(sql.includes('ST_DWithin'), 'Query contains ST_DWithin');
    assert.ok(sql.includes('ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography'), 'Uses WGS-84 geography');
    assert.ok(sql.includes('is_active = TRUE'), 'Filters by active status');
    assert.deepEqual(params, [centerLng, centerLat, 800]);
  });
});

