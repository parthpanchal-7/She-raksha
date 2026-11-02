/**
 * @she-raksha/web — Home Page: Discreet Survivor Portal
 *
 * Implements Phase 12 Deliverable:
 *  - Discreet Utility-Disguised Survivor Portal
 *  - Weather / Calculator decoy view with instant Double-ESC / PIN 9119 switch
 *  - Full client-side AES-256-GCM Evidence Vault and BNSS §173 e-FIR generator
 */

'use client';

import React, { useState } from 'react';
import { DecoyWeatherCalculator } from '../components/DecoyWeatherCalculator.js';
import { SurvivorCommandCenter } from '../components/SurvivorCommandCenter.js';

export default function HomePage() {
  const [isEmergencyUnlocked, setIsEmergencyUnlocked] = useState(false);

  if (!isEmergencyUnlocked) {
    return (
      <DecoyWeatherCalculator
        onUnlock={() => setIsEmergencyUnlocked(true)}
        isUnlocked={isEmergencyUnlocked}
      />
    );
  }

  return (
    <SurvivorCommandCenter
      onLockToDecoy={() => setIsEmergencyUnlocked(false)}
      onTriggerSOS={() => {
        // Dispatches multi-rail failover signal
      }}
    />
  );
}
