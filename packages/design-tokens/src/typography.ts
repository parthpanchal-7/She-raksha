/**
 * She-Raksha (शी-रक्षा) Typography Tokens
 * - Plus Jakarta Sans (700 Bold / 600 SemiBold) for headings
 * - Inter (400 Regular / 500 Medium) for body & UI
 * - JetBrains Mono (500 Medium, tabular uppercase) for hashes, CIDs, timers, and legal codes
 */

export const typography = {
  fonts: {
    heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  sizes: {
    xs: {
      fontSize: '12px',
      lineHeight: '16px',
    },
    sm: {
      fontSize: '14px',
      lineHeight: '20px',
    },
    base: {
      fontSize: '16px',
      lineHeight: '24px',
    },
    lg: {
      fontSize: '18px',
      lineHeight: '28px',
    },
    xl: {
      fontSize: '20px',
      lineHeight: '28px',
    },
    '2xl': {
      fontSize: '24px',
      lineHeight: '32px',
    },
    '3xl': {
      fontSize: '30px',
      lineHeight: '36px',
    },
    '4xl': {
      fontSize: '36px',
      lineHeight: '40px',
    },
  },
} as const;

export type TypographyToken = typeof typography;
