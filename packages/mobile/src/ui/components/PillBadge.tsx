/**
 * @she-raksha/mobile — PillBadge Component
 *
 * Full-pill 9999px badge with JetBrains Mono font, 1px solid Subtle Wire border,
 * and optional Emerald Shield (#00D084) verified checkmark.
 */

import React from 'react';
import { colors } from '@she-raksha/design-tokens';

export interface PillBadgeProps {
  label: string;
  isVerified?: boolean;
  accentColor?: string;
  backgroundColor?: string;
  testID?: string;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  label,
  isVerified = false,
  accentColor = colors.emeraldShield,
  backgroundColor = colors.darkSlate,
  testID,
}) => {
  return (
    <div
      data-testid={testID}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        backgroundColor,
        border: `1px solid ${colors.subtleWire}`,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: colors.pureFrost,
      }}
    >
      {isVerified && (
        <span style={{ color: accentColor, fontWeight: 700 }}>✓</span>
      )}
      <span>{label}</span>
    </div>
  );
};
