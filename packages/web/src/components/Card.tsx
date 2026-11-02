/**
 * @she-raksha/web — Card Component
 *
 * Implements Brand Surface Base (#121824) with 1px Subtle Wire (#222F3E) border
 * and 16px corner radius. No heavy drop shadows.
 */

import React from 'react';
import { colors, radii } from '@she-raksha/design-tokens';

export interface CardProps {
  children: React.ReactNode;
  accentBorderColor?: string;
  hasGlow?: boolean;
  style?: React.CSSProperties;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  accentBorderColor,
  hasGlow = false,
  style,
  testID,
}) => {
  const borderColor = accentBorderColor || colors.subtleWire;
  const glowShadow = hasGlow
    ? `0 0 20px rgba(255, 59, 92, 0.15)`
    : undefined;

  return (
    <div
      data-testid={testID}
      style={{
        backgroundColor: colors.darkSlate,
        borderRadius: `${radii.card}px`,
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
