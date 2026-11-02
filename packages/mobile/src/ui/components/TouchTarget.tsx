/**
 * @she-raksha/mobile — TouchTarget Component
 *
 * Enforces minimum 48x48pt touch targets for mobile accessibility (NFR-ACC-001).
 */

import React from 'react';
import { touchTargets, radii } from '@she-raksha/design-tokens';

export interface TouchTargetProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  testID?: string;
  ariaLabel?: string;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  onClick,
  disabled = false,
  style,
  testID,
  ariaLabel,
}) => {
  return (
    <button
      data-testid={testID}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: `${touchTargets.sosMin}px`,
        minHeight: `${touchTargets.sosMin}px`,
        borderRadius: `${radii.button}px`,
        border: 'none',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '8px 16px',
        ...style,
      }}
    >
      {children}
    </button>
  );
};
