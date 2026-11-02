/**
 * @she-raksha/mobile — MultiRailIndicator Component
 *
 * Displays real-time operational status for the 3 failover rails:
 *  - Rail A (Primary - Duplex WSS)
 *  - Rail B (Secondary - Base91 GSM-7 SMS)
 *  - Rail C (Tertiary - BLE 5.2 Extended Advertising Mesh)
 */

import React from 'react';
import { colors } from '@she-raksha/design-tokens';
import { PillBadge } from './PillBadge.js';

export interface MultiRailStatus {
  railA: { connected: boolean; rttMs: number };
  railB: { armed: boolean; queueCount: number };
  railC: { active: boolean; peersNearby: number };
}

export interface MultiRailIndicatorProps {
  status: MultiRailStatus;
  testID?: string;
}

export const MultiRailIndicator: React.FC<MultiRailIndicatorProps> = ({
  status,
  testID,
}) => {
  return (
    <div
      data-testid={testID}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <PillBadge
        label={`RAIL A: WSS ${status.railA.connected ? `${status.railA.rttMs}ms` : 'OFFLINE'}`}
        isVerified={status.railA.connected}
        accentColor={status.railA.connected ? colors.emeraldShield : colors.dimSteel}
        backgroundColor={status.railA.connected ? 'rgba(0, 208, 132, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
        testID="rail-a-indicator"
      />
      <PillBadge
        label={`RAIL B: SMS ${status.railB.armed ? 'ARMED' : 'UNAVAILABLE'}`}
        isVerified={status.railB.armed}
        accentColor={status.railB.armed ? colors.emeraldShield : colors.dimSteel}
        backgroundColor={status.railB.armed ? 'rgba(0, 208, 132, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
        testID="rail-b-indicator"
      />
      <PillBadge
        label={`RAIL C: BLE MESH ${status.railC.active ? `${status.railC.peersNearby} PEERS` : 'STANDBY'}`}
        isVerified={status.railC.active}
        accentColor={status.railC.active ? colors.emeraldShield : colors.dimSteel}
        backgroundColor={status.railC.active ? 'rgba(0, 208, 132, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
        testID="rail-c-indicator"
      />
    </div>
  );
};
