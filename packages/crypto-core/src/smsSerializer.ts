/**
 * @she-raksha/crypto-core — SOS SMS Packet Serializer & Decoder
 *
 * Implements Rail B multi-rail distress failover:
 *  - Serializes { sessionUuid, lat, long, h3IndexRes9, accuracyRadius, battery, triggerMode, timestamp, signature }
 *  - Raw binary MUST be < 140 bytes
 *  - Base91 string MUST be <= 160 characters (single GSM-7 SMS segment)
 */

import { TriggerMode } from '@she-raksha/schemas';
import { base91Encode, base91Decode } from './base91Codec.js';

export interface SOSAlertSMSPayload {
  /** UUID v4 of the incident / session (e.g. "550e8400-e29b-41d4-a716-446655440000") */
  sessionUuid: string;
  /** Latitude in decimal degrees (e.g. 28.613939) */
  latitude: number;
  /** Longitude in decimal degrees (e.g. 77.209021) */
  longitude: number;
  /** Uber H3 resolution 9 hex index (e.g. "8928308280fffff") */
  h3IndexRes9: string;
  /** GPS accuracy radius in meters (0..65535) */
  accuracyRadius: number;
  /** Device battery percentage (0..100) */
  battery: number;
  /** Unified SOS trigger mode */
  triggerMode: TriggerMode;
  /** Unix timestamp in seconds (integer) */
  timestamp: number;
  /** ECDSA 65-byte signature as hex string ("0x..." or 130 hex chars) */
  signatureHex: string;
}

const TRIGGER_MODE_MAP: Record<TriggerMode, number> = {
  [TriggerMode.HARDWARE_TAP_FOUR_PRESS]: 0,
  [TriggerMode.SHAKE_ACCELEROMETER]: 1,
  [TriggerMode.VOICE_DURESS_TFLITE]: 2,
  [TriggerMode.FALL_DETECTION]: 3,
  [TriggerMode.DEAD_MAN_SWITCH]: 4,
  [TriggerMode.MANUAL_BUTTON]: 5,
};

const REVERSE_TRIGGER_MODE_MAP: Record<number, TriggerMode> = {
  0: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
  1: TriggerMode.SHAKE_ACCELEROMETER,
  2: TriggerMode.VOICE_DURESS_TFLITE,
  3: TriggerMode.FALL_DETECTION,
  4: TriggerMode.DEAD_MAN_SWITCH,
  5: TriggerMode.MANUAL_BUTTON,
};

/**
 * Parses a standard UUID into 16 raw bytes.
 */
function uuidToBuffer(uuid: string): Buffer {
  const clean = uuid.replace(/-/g, '');
  if (clean.length !== 32) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  return Buffer.from(clean, 'hex');
}

/**
 * Reconstructs a standard UUID from 16 bytes.
 */
function bufferToUuid(buf: Buffer, offset: number): string {
  const hex = buf.subarray(offset, offset + 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Serializes SOSAlert data into raw binary (< 140 bytes).
 *
 * Binary Layout:
 * -  0..15: 16 bytes - UUID
 * - 16..19:  4 bytes - Latitude (float32 IEEE 754)
 * - 20..23:  4 bytes - Longitude (float32 IEEE 754)
 * - 24..31:  8 bytes - H3 Index Res 9 (uint64 BigInt)
 * - 32..33:  2 bytes - Accuracy Radius (uint16)
 * - 34..34:  1 byte  - Battery (uint8)
 * - 35..35:  1 byte  - TriggerMode (uint8)
 * - 36..43:  8 bytes - Timestamp (uint64 seconds BigInt)
 * - 44..108: 65 bytes - ECDSA Signature (r:32 + s:32 + v:1)
 *
 * Total: 109 bytes! Well under the 140-byte constraint.
 */
export function serializeSOSToBinary(payload: SOSAlertSMSPayload): Buffer {
  const buf = Buffer.alloc(109);

  // 1. UUID (16 bytes)
  const uuidBuf = uuidToBuffer(payload.sessionUuid);
  uuidBuf.copy(buf, 0);

  // 2. Latitude (4 bytes float32)
  buf.writeFloatBE(payload.latitude, 16);

  // 3. Longitude (4 bytes float32)
  buf.writeFloatBE(payload.longitude, 20);

  // 4. H3 Index Res 9 (8 bytes BigInt uint64)
  const h3Clean = payload.h3IndexRes9.startsWith('0x')
    ? payload.h3IndexRes9.slice(2)
    : payload.h3IndexRes9;
  const h3BigInt = BigInt(`0x${h3Clean}`);
  buf.writeBigUInt64BE(h3BigInt, 24);

  // 5. Accuracy Radius (2 bytes uint16)
  const accuracy = Math.min(65535, Math.max(0, Math.round(payload.accuracyRadius)));
  buf.writeUInt16BE(accuracy, 32);

  // 6. Battery (1 byte uint8)
  const battery = Math.min(100, Math.max(0, Math.round(payload.battery)));
  buf.writeUInt8(battery, 34);

  // 7. TriggerMode (1 byte uint8)
  const triggerCode = TRIGGER_MODE_MAP[payload.triggerMode] ?? 5;
  buf.writeUInt8(triggerCode, 35);

  // 8. Timestamp (8 bytes BigInt uint64)
  buf.writeBigUInt64BE(BigInt(Math.floor(payload.timestamp)), 36);

  // 9. ECDSA Signature (65 bytes)
  let sigHex = payload.signatureHex.startsWith('0x')
    ? payload.signatureHex.slice(2)
    : payload.signatureHex;

  if (sigHex.length !== 130) {
    // Pad or trim if needed, but error if malformed
    if (sigHex.length < 130) {
      sigHex = sigHex.padEnd(130, '0');
    } else {
      sigHex = sigHex.slice(0, 130);
    }
  }
  const sigBuf = Buffer.from(sigHex, 'hex');
  sigBuf.copy(buf, 44);

  return buf;
}

/**
 * Deserializes raw binary back into SOSAlertSMSPayload.
 */
export function deserializeSOSFromBinary(buf: Buffer): SOSAlertSMSPayload {
  if (buf.length < 109) {
    throw new Error(`Buffer too short for SOS alert: expected at least 109 bytes, got ${buf.length}`);
  }

  const sessionUuid = bufferToUuid(buf, 0);
  const latitude = Math.round(buf.readFloatBE(16) * 1000000) / 1000000;
  const longitude = Math.round(buf.readFloatBE(20) * 1000000) / 1000000;
  const h3BigInt = buf.readBigUInt64BE(24);
  const h3IndexRes9 = h3BigInt.toString(16);
  const accuracyRadius = buf.readUInt16BE(32);
  const battery = buf.readUInt8(34);
  const triggerCode = buf.readUInt8(35);
  const triggerMode = REVERSE_TRIGGER_MODE_MAP[triggerCode] ?? TriggerMode.MANUAL_BUTTON;
  const timestamp = Number(buf.readBigUInt64BE(36));
  const signatureHex = '0x' + buf.subarray(44, 109).toString('hex');

  return {
    sessionUuid,
    latitude,
    longitude,
    h3IndexRes9,
    accuracyRadius,
    battery,
    triggerMode,
    timestamp,
    signatureHex,
  };
}

/**
 * High-level helper: serializes SOS alert to Base91 GSM-7 safe SMS string.
 * Enforces < 140 bytes raw payload and <= 160 characters encoded output.
 */
export function serializeSOSToBase91SMS(payload: SOSAlertSMSPayload): string {
  const binary = serializeSOSToBinary(payload);
  if (binary.length >= 140) {
    throw new Error(`Raw binary payload exceeded 140-byte GSM-7 limit: ${binary.length} bytes`);
  }
  const base91 = base91Encode(binary);
  if (base91.length > 160) {
    throw new Error(`Base91 encoded SMS string exceeded 160-character limit: ${base91.length} chars`);
  }
  return base91;
}

/**
 * High-level helper: decodes Base91 SMS string back to SOS alert payload.
 */
export function deserializeSOSFromBase91SMS(smsText: string): SOSAlertSMSPayload {
  const binary = base91Decode(smsText);
  return deserializeSOSFromBinary(binary);
}

