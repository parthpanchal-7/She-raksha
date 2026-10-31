/**
 * She-Raksha (शी-रक्षा) Touch Target Standards
 * Minimum 48x48pt for SOS triggers to ensure foolproof operation during high-stress distress events.
 */

export const touchTargets = {
  /** Universal minimum touch target (WCAG 2.1 AA) */
  min: 44,

  /** Mandatory minimum for SOS triggers & emergency actions */
  sosMin: 48,

  /** Recommended large SOS trigger button */
  sosRecommended: 64,

  /** Hero distress tap area */
  sosHero: 120,
} as const;

export type TouchTargets = typeof touchTargets;
