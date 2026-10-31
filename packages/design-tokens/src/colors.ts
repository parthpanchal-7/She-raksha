/**
 * She-Raksha (शी-रक्षा) Canonical 10-Token Color System
 * Single Source of Truth as defined in .agent/skills/she-raksha/SKILL.MD
 */

export const colors = {
  /** Canvas / Root: Global dark background, viewport root, deep background cards */
  midnightObsidian: '#0A0D12',

  /** Surface Base: Component containers, modals, bottom sheets, navigation bars */
  darkSlate: '#121824',

  /**
   * Brand Signal: STRICTLY reserved for SOS triggers, critical CTAs, and live countdown alerts.
   * INVARIANT: Never use on routine dismissals or secondary actions.
   */
  crimsonCoral: '#FF3B5C',

  /** High Accent: Escalation warnings, pending 72-hr timers, active status markers */
  electricAmber: '#FF9F1C',

  /** Cryptographic Trust: ZK proof badges, smart contract links, wallet/blockchain status */
  polygonPurple: '#7B3FE4',

  /** Verified State: Hash anchored confirmation, guardian connected, receipt verified checkmarks */
  emeraldShield: '#00D084',

  /** Structural Neutral: 1px solid card borders, dividers, inactive container strokes */
  subtleWire: '#222F3E',

  /** Text Primary: Display headings, screen titles, primary metrics, active button labels */
  pureFrost: '#F8FAFC',

  /** Text Secondary: Standard body copy, secondary descriptive labels, captions */
  mutedSilver: '#94A3B8',

  /** Text Tertiary: Timestamps, raw contract hashes, disabled states */
  dimSteel: '#64748B',
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];

/**
 * Semantic role mappings for UI components
 */
export const semanticColors = {
  background: {
    root: colors.midnightObsidian,
    surface: colors.darkSlate,
    subtle: '#161D2B',
  },
  border: {
    default: colors.subtleWire,
    accent: colors.electricAmber,
    critical: colors.crimsonCoral,
    verified: colors.emeraldShield,
    trust: colors.polygonPurple,
  },
  text: {
    primary: colors.pureFrost,
    secondary: colors.mutedSilver,
    tertiary: colors.dimSteel,
    critical: colors.crimsonCoral,
    warning: colors.electricAmber,
    success: colors.emeraldShield,
    crypto: colors.polygonPurple,
  },
  sos: {
    trigger: colors.crimsonCoral,
    glow: 'rgba(255, 59, 92, 0.15)',
    glowIntense: 'rgba(255, 59, 92, 0.35)',
  },
  status: {
    verified: colors.emeraldShield,
    pending: colors.electricAmber,
    active: colors.crimsonCoral,
    anchored: colors.polygonPurple,
  },
} as const;
