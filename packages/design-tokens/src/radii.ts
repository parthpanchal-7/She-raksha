/**
 * She-Raksha (शी-रक्षा) Radii Tokens
 * - 12px-16px cards
 * - 8px buttons
 * - 9999px full-pill badges
 */

export const radii = {
  none: '0px',
  sm: '4px',
  button: '8px',
  cardSmall: '12px',
  card: '16px',
  lg: '20px',
  full: '9999px',
  pill: '9999px',
} as const;

export type RadiiToken = typeof radii;
