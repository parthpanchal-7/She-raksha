/**
 * She-Raksha Tailwind CSS Preset
 * Strict enforcement of the 10-Token Brand Style Guide
 */

import { colors } from './colors.js';
import { radii } from './radii.js';

export const sheRakshaTailwindPreset = {
  theme: {
    extend: {
      colors: {
        'midnight-obsidian': colors.midnightObsidian,
        'dark-slate': colors.darkSlate,
        'crimson-coral': colors.crimsonCoral,
        'electric-amber': colors.electricAmber,
        'polygon-purple': colors.polygonPurple,
        'emerald-shield': colors.emeraldShield,
        'subtle-wire': colors.subtleWire,
        'pure-frost': colors.pureFrost,
        'muted-silver': colors.mutedSilver,
        'dim-steel': colors.dimSteel,

        // Semantic aliases
        brand: {
          canvas: colors.midnightObsidian,
          surface: colors.darkSlate,
          signal: colors.crimsonCoral,
          accent: colors.electricAmber,
          trust: colors.polygonPurple,
          verified: colors.emeraldShield,
          wire: colors.subtleWire,
          primary: colors.pureFrost,
          secondary: colors.mutedSilver,
          tertiary: colors.dimSteel,
        },
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        button: radii.button,
        card: radii.card,
        'card-sm': radii.cardSmall,
        pill: radii.pill,
      },
      boxShadow: {
        'glow-sos': '0 0 24px rgba(255, 59, 92, 0.15)',
        'glow-sos-lg': '0 0 36px rgba(255, 59, 92, 0.30)',
        'glow-amber': '0 0 20px rgba(255, 159, 28, 0.15)',
        'glow-emerald': '0 0 20px rgba(0, 208, 132, 0.15)',
        'glow-purple': '0 0 20px rgba(123, 63, 228, 0.15)',
      },
      minWidth: {
        'touch-min': '44px',
        'touch-sos': '48px',
      },
      minHeight: {
        'touch-min': '44px',
        'touch-sos': '48px',
      },
    },
  },
};

export default sheRakshaTailwindPreset;
