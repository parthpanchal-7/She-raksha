/**
 * @she-raksha/mobile — Spatial Quantizer & Geohash-6 Shield
 *
 * Implements Circom-compatible spatial quantization and canonical Geohash-6:
 *  - Quantizes exact GPS into ~1.2km x 0.6km jurisdiction bucket
 *  - Prevents leaking exact victim/witness coordinates while verifying spatial municipal jurisdiction
 */

import { type SpatialQuantizationResult } from './types.js';

const BASE32_GEOHASH = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Computes standard 6-character geohash string for given latitude and longitude.
 */
export function encodeGeohash6(latitude: number, longitude: number): string {
  let latMin = -90.0;
  let latMax = 90.0;
  let lonMin = -180.0;
  let lonMax = 180.0;

  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  while (geohash.length < 6) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32_GEOHASH[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Quantizes exact coordinates for Circom circuit inputs.
 * Scales by 10^5 and partitions into 1000-unit (~1.1km) buckets.
 */
export function quantizeCoordinates(
  latitude: number,
  longitude: number
): { latScaled: bigint; longScaled: bigint; latBucket: bigint; longBucket: bigint; geohash6: string } {
  const latScaled = BigInt(Math.round(latitude * 100000));
  const longScaled = BigInt(Math.round(longitude * 100000));
  const latBucket = latScaled / 1000n;
  const longBucket = longScaled / 1000n;
  const geohash6 = encodeGeohash6(latitude, longitude);

  return {
    latScaled,
    longScaled,
    latBucket,
    longBucket,
    geohash6,
  };
}
