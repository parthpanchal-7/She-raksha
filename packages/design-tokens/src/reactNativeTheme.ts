/**
 * She-Raksha React Native Theme
 * High-performance styling objects and constants for mobile components
 */

import { colors, semanticColors } from './colors.js';
import { typography } from './typography.js';
import { radii } from './radii.js';
import { touchTargets } from './touchTargets.js';

export const reactNativeTheme = {
  colors: {
    ...colors,
    ...semanticColors,
  },
  typography: {
    fonts: {
      heading: 'PlusJakartaSans-Bold',
      headingSemiBold: 'PlusJakartaSans-SemiBold',
      body: 'Inter-Regular',
      bodyMedium: 'Inter-Medium',
      mono: 'JetBrainsMono-Medium',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeights: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 40,
    },
  },
  radii: {
    none: 0,
    sm: 4,
    button: 8,
    cardSmall: 12,
    card: 16,
    lg: 20,
    pill: 9999,
  },
  touchTargets,
  cardStyle: {
    backgroundColor: colors.darkSlate,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.subtleWire,
    padding: 16,
  },
  sosButtonStyle: {
    backgroundColor: colors.crimsonCoral,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 9999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pillBadgeStyle: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
};

export default reactNativeTheme;
