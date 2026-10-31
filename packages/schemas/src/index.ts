/**
 * @she-raksha/schemas
 * Canonical Data Contracts, Unified Enums & Multi-Tier Database Schemas
 */

export const SCHEMAS_VERSION = '1.0.0';

/**
 * Unified Trigger Mode Enum across schemas, mobile, web, and backend
 */
export enum TriggerMode {
  HARDWARE_TAP_FOUR_PRESS = 'HARDWARE_TAP_FOUR_PRESS',
  SHAKE_ACCELEROMETER = 'SHAKE_ACCELEROMETER',
  VOICE_DURESS_TFLITE = 'VOICE_DURESS_TFLITE',
  FALL_DETECTION = 'FALL_DETECTION',
  DEAD_MAN_SWITCH = 'DEAD_MAN_SWITCH',
  MANUAL_BUTTON = 'MANUAL_BUTTON',
}
