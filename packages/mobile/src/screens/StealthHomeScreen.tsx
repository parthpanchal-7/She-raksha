/**
 * @she-raksha/mobile — Screen 1: Stealth Home & 1-Tap SOS Command Center
 *
 * Implements FR-SOS-001, FR-SOS-002, and Brand Style Guide:
 *  - Root Canvas: Midnight Obsidian (#0A0D12)
 *  - Multi-Rail Status Indicators: Rail A (WSS), Rail B (SMS Base91), Rail C (BLE Mesh)
 *  - 1-Tap SOS Central Button: Crimson Coral (#FF3B5C), minimum 48x48pt (140x140pt)
 *  - Stealth Disguise Decoy Mode (Calculator) with secret unlock
 *  - Heavy double-pulse haptic cadence on SOS dispatch
 *  - Calm authoritative voice: "Protection active. Multi-rail link standby."
 */

import React, { useState } from 'react';
import { colors, radii, touchTargets } from '@she-raksha/design-tokens';
import { Card } from '../ui/components/Card.js';
import { PillBadge } from '../ui/components/PillBadge.js';
import { TouchTarget } from '../ui/components/TouchTarget.js';
import { MultiRailIndicator, type MultiRailStatus } from '../ui/components/MultiRailIndicator.js';
import { HapticService } from '../ui/haptics.js';
import { VOICE_COPY } from '../ui/voiceCopy.js';

export interface StealthHomeScreenProps {
  initialDecoyMode?: boolean;
  onSOSDispatch?: () => void;
  onNavigateVault?: () => void;
  onNavigateEFIR?: () => void;
  onNavigateBystander?: () => void;
  onNavigateSafeJourney?: () => void;
  multiRailStatus?: MultiRailStatus;
}

export const StealthHomeScreen: React.FC<StealthHomeScreenProps> = ({
  initialDecoyMode = false,
  onSOSDispatch,
  onNavigateVault,
  onNavigateEFIR,
  onNavigateBystander,
  onNavigateSafeJourney,
  multiRailStatus = {
    railA: { connected: true, rttMs: 82 },
    railB: { armed: true, queueCount: 0 },
    railC: { active: true, peersNearby: 3 },
  },
}) => {
  const [isDecoyMode, setIsDecoyMode] = useState(initialDecoyMode);
  const [calcInput, setCalcInput] = useState('');
  const [hapticService] = useState(() => new HapticService());

  const handleSOSPress = () => {
    hapticService.trigger('SOS_TRIGGER');
    onSOSDispatch?.();
  };

  const handleCalcKeyPress = (key: string) => {
    const next = calcInput + key;
    setCalcInput(next);
    // Secret decoy unlock pin '9119'
    if (next.endsWith('9119')) {
      setIsDecoyMode(false);
      setCalcInput('');
    }
  };

  if (isDecoyMode) {
    return (
      <div
        data-testid="stealth-decoy-calculator"
        style={{
          backgroundColor: colors.midnightObsidian,
          color: colors.pureFrost,
          minHeight: '100vh',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ textAlign: 'right', padding: '32px 0', fontSize: '36px', color: colors.pureFrost }}>
          {calcInput || '0'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔒'].map((btn) => (
            <TouchTarget
              key={btn}
              onClick={() => (btn === 'C' ? setCalcInput('') : handleCalcKeyPress(btn))}
              style={{
                backgroundColor: colors.darkSlate,
                color: colors.pureFrost,
                border: `1px solid ${colors.subtleWire}`,
                fontSize: '20px',
                fontWeight: 600,
              }}
              testID={`calc-key-${btn}`}
            >
              {btn}
            </TouchTarget>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="stealth-home-screen"
      style={{
        backgroundColor: colors.midnightObsidian,
        color: colors.pureFrost,
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              margin: 0,
              color: colors.pureFrost,
            }}
          >
            SHE-RAKSHA
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.mutedSilver }}>
            {VOICE_COPY.HOME_STANDBY}
          </p>
        </div>
        <TouchTarget
          onClick={() => setIsDecoyMode(true)}
          style={{
            backgroundColor: colors.darkSlate,
            border: `1px solid ${colors.subtleWire}`,
            color: colors.dimSteel,
            padding: '6px 12px',
            fontSize: '12px',
          }}
          testID="decoy-mode-toggle"
        >
          Decoy Mode
        </TouchTarget>
      </div>

      {/* Multi-Rail Network Status */}
      <Card testID="multi-rail-status-card">
        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.mutedSilver, textTransform: 'uppercase' }}>
          Network Resilience Infrastructure
        </div>
        <MultiRailIndicator status={multiRailStatus} testID="home-rail-indicators" />
      </Card>

      {/* Central 1-Tap SOS Dispatcher */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
        }}
      >
        <button
          data-testid="sos-trigger-button"
          onClick={handleSOSPress}
          style={{
            width: `${touchTargets.sosHero}px`,
            height: `${touchTargets.sosHero}px`,
            minWidth: `${touchTargets.sosMin}px`,
            minHeight: `${touchTargets.sosMin}px`,
            borderRadius: '9999px',
            backgroundColor: colors.crimsonCoral,
            border: 'none',
            boxShadow: '0 0 32px rgba(255, 59, 92, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.pureFrost,
            transition: 'transform 0.15s ease',
          }}
        >
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '24px', fontWeight: 700 }}>
            SOS
          </span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            Dispatch
          </span>
        </button>
        <p style={{ fontSize: '12px', color: colors.dimSteel, marginTop: '12px' }}>
          Tap once or rapid 4-tap hardware power button
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <TouchTarget
          onClick={onNavigateVault}
          style={{ width: '100%', height: 'auto', padding: 0 }}
          testID="nav-vault-button"
        >
          <Card style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.pureFrost }}>Evidence Vault</div>
            <div style={{ fontSize: '12px', color: colors.mutedSilver }}>BSA §63 Tamper-Proof</div>
          </Card>
        </TouchTarget>

        <TouchTarget
          onClick={onNavigateEFIR}
          style={{ width: '100%', height: 'auto', padding: 0 }}
          testID="nav-efir-button"
        >
          <Card style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.pureFrost }}>BNSS §173 e-FIR</div>
            <div style={{ fontSize: '12px', color: colors.electricAmber }}>72h Countdown</div>
          </Card>
        </TouchTarget>

        <TouchTarget
          onClick={onNavigateBystander}
          style={{ width: '100%', height: 'auto', padding: 0 }}
          testID="nav-bystander-button"
        >
          <Card style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.pureFrost }}>Bystander ZK</div>
            <div style={{ fontSize: '12px', color: colors.polygonPurple }}>Zero-Knowledge</div>
          </Card>
        </TouchTarget>

        <TouchTarget
          onClick={onNavigateSafeJourney}
          style={{ width: '100%', height: 'auto', padding: 0 }}
          testID="nav-safe-journey-button"
        >
          <Card style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.pureFrost }}>Safe Journey</div>
            <div style={{ fontSize: '12px', color: colors.emeraldShield }}>800m Radar</div>
          </Card>
        </TouchTarget>
      </div>
    </div>
  );
};
