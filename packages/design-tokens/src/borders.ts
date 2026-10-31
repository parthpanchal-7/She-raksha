/**
 * She-Raksha (शी-रक्षा) Elevation, Borders, and Radiance
 * Invariant: 1px solid #222F3E subtle borders, zero heavy drop shadows.
 * Subtle 10-15% radial accent glow used for active SOS/e-FIR cards.
 */

import { colors } from './colors.js';

export const borders = {
  wire: `1px solid ${colors.subtleWire}`,
  wireLight: `1px solid #2A3B4E`,
  activeAlert: `1px solid ${colors.crimsonCoral}`,
  activeWarning: `1px solid ${colors.electricAmber}`,
  activeVerified: `1px solid ${colors.emeraldShield}`,
  activeTrust: `1px solid ${colors.polygonPurple}`,
} as const;

export const glows = {
  none: 'none',
  sos: '0 0 24px rgba(255, 59, 92, 0.15)',
  sosIntense: '0 0 36px rgba(255, 59, 92, 0.30)',
  timer: '0 0 20px rgba(255, 159, 28, 0.15)',
  verified: '0 0 20px rgba(0, 208, 132, 0.15)',
  crypto: '0 0 20px rgba(123, 63, 228, 0.15)',
} as const;
