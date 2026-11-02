/**
 * @she-raksha/web — MultiRailBadge Component
 *
 * Real-time network resilience telemetry:
 *  - Rail A: WSS (<500ms server ACK NFR-PERF-002)
 *  - Rail B: SMS Base91 (<140B GSM-7 single segment)
 *  - Rail C: BLE Mesh (0xFD63 hop-limited zero-bearer relay)
 */

import React from 'react';
import { colors } from '@she-raksha/design-tokens';
import { PillBadge } from './PillBadge.js';

export interface MultiRailStatus {
  railA: { connected: boolean; rttMs: number };
  railB: { armed: boolean; queueCount: number };
  railC: { active: boolean; peersNearby: number };
}

export interface MultiRailBadgeProps {
  status?: MultiRailStatus;
  testID?: string;
}

export const MultiRailBadge: React.FC<MultiRailBadgeProps> = ({
  status = {
    railA: { connected: true, rttMs: 78 },
    railB: { armed: true, queueCount: 0 },
    railC: { active: true, peersNearby: 4 },
  },
  testID = 'multi-rail-badge-group',
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
        testID="rail-a-pill"
      />
      <PillBadge
        label={`RAIL B: SMS ${status.railB.armed ? 'ARMED' : 'STANDBY'}`}
        isVerified={status.railB.armed}
        accentColor={status.railB.armed ? colors.emeraldShield : colors.dimSteel}
        backgroundColor={status.railB.armed ? 'rgba(0, 208, 132, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
        testID="rail-b-pill"
      />
      <PillBadge
        label={`RAIL C: BLE MESH ${status.railC.active ? `${status.railC.peersNearby} PEERS` : 'INACTIVE'}`}
        isVerified={status.railC.active}
        accentColor={status.railC.active ? colors.emeraldShield : colors.dimSteel}
        backgroundColor={status.railC.active ? 'rgba(0, 208, 132, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
        testID="rail-c-pill"
      />
    </div>
  );
};
