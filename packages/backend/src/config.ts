/**
 * @she-raksha/backend — Configuration & Canonical Constraints
 *
 * Implements Phase 8 system constants:
 *  - NFR-PERF-002: WebSocket Rail A ACK roundtrip < 500ms
 *  - FR-SOS-003: PostGIS 800m active dispatch radius
 *  - FR-SOS-004: Safe-Journey Dead-Man switch 120-second grace threshold
 *  - Rail A to Rail B failover timeout: 5000ms (5.0s)
 *  - GSM-7 SMS raw payload limit: < 140 bytes
 *  - Uber H3 Spatial Resolution: 9 (~100m)
 */

export const CONFIG = {
  // Server networking
  PORT: Number(process.env.PORT || 3000),
  HOST: process.env.HOST || '0.0.0.0',
  TLS_ENABLED: process.env.TLS_ENABLED === 'true',

  // NFR-PERF-002: WebSocket ACK target latency
  NFR_ACK_TARGET_MS: 500,

  // Multi-rail failover: Rail A timeout before triggering Rail B cellular SMS
  RAIL_A_ACK_TIMEOUT_MS: 5000,

  // FR-SOS-003: Active standby guardian proximity dispatch radius
  GUARDIAN_MATCH_RADIUS_METERS: 800,
  GUARDIAN_MAX_SEARCH_RADIUS_METERS: 2000,

  // Uber H3 resolution for ~100m hexagonal spatial indexing
  H3_RESOLUTION: 9,

  // FR-SOS-004: Safe-Journey Dead-Man missed check-in grace period
  DEAD_MAN_GRACE_PERIOD_SECONDS: 120,

  // GSM-7 SMS constraints
  MAX_RAW_SMS_PAYLOAD_BYTES: 140,
  MAX_BASE91_SMS_CHARS: 160,

  // Emergency services
  MOCK_ERSS_112_ENDPOINT: process.env.ERSS_112_ENDPOINT || 'https://mock-erss-112.nic.in/api/v1/cad',
  MOCK_ERSS_CLIENT_CERT_THUMBPRINT: 'sha256:4a8b9f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
} as const;
