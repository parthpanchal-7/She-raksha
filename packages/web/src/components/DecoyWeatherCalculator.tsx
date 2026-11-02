/**
 * @she-raksha/web — DecoyWeatherCalculator Component
 *
 * Implements the Discreet Utility-Disguised Survivor Portal:
 *  - Appears as a daily weather widget & calculator
 *  - Double-ESC keyboard shortcut listener (<500ms) for instant toggle
 *  - Secret PIN '9119' calculator unlock
 *  - Protects survivor safety in coerced or domestic surveillance environments
 */

import React, { useState, useEffect, useRef } from 'react';
import { colors, touchTargets } from '@she-raksha/design-tokens';
import { Card } from './Card.js';
import { PillBadge } from './PillBadge.js';

export interface DecoyWeatherCalculatorProps {
  onUnlock: () => void;
  isUnlocked?: boolean;
}

export const DecoyWeatherCalculator: React.FC<DecoyWeatherCalculatorProps> = ({
  onUnlock,
  isUnlocked = false,
}) => {
  const [calcDisplay, setCalcDisplay] = useState('0');
  const lastEscPressTime = useRef<number>(0);

  // Double-ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscPressTime.current < 500) {
          // Double-ESC detected!
          onUnlock();
        }
        lastEscPressTime.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);

  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('0');
      return;
    }

    const next = calcDisplay === '0' ? key : calcDisplay + key;
    setCalcDisplay(next);

    // Secret PIN '9119' unlocks emergency safety portal
    if (next.endsWith('9119')) {
      onUnlock();
      setCalcDisplay('0');
    }
  };

  return (
    <div
      data-testid="decoy-weather-calculator"
      style={{
        backgroundColor: colors.midnightObsidian,
        color: colors.pureFrost,
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Weather Disguise Header */}
        <Card testID="weather-widget-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.pureFrost }}>
              New Delhi, IN
            </span>
            <PillBadge label="CLEAR 26°C" isVerified={true} accentColor={colors.emeraldShield} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.mutedSilver }}>
            <span>Humidity: 42%</span>
            <span>Wind: 9 km/h</span>
            <span>AQI: 68 (Satisfactory)</span>
          </div>
          <div style={{ fontSize: '11px', color: colors.dimSteel, textAlign: 'right' }}>
            Press Double-ESC to switch view
          </div>
        </Card>

        {/* Calculator Display */}
        <Card testID="calc-display-card" style={{ padding: '24px', textAlign: 'right' }}>
          <div
            data-testid="calculator-screen"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: colors.pureFrost,
              letterSpacing: '1px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {calcDisplay}
          </div>
        </Card>

        {/* Calculator Keypad */}
        <div
          data-testid="calc-keypad"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔒'].map((btn) => (
            <button
              key={btn}
              data-testid={`calc-btn-${btn}`}
              onClick={() => handleKeyClick(btn)}
              style={{
                minWidth: `${touchTargets.sosMin}px`,
                minHeight: `${touchTargets.sosMin}px`,
                height: '56px',
                borderRadius: '8px',
                backgroundColor: colors.darkSlate,
                color: btn === '🔒' ? colors.polygonPurple : colors.pureFrost,
                border: `1px solid ${colors.subtleWire}`,
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
            >
              {btn}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            data-testid="decoy-unlock-button"
            onClick={onUnlock}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.dimSteel,
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Toggle Emergency Interface (Double-ESC or PIN)
          </button>
        </div>
      </div>
    </div>
  );
};
