/**
 * @she-raksha/web — Bystander Page: In-Browser ZK Prover Portal
 *
 * Implements Phase 12 Deliverable:
 *  - On-device SnarkJS Groth16 witness compilation
 *  - Geohash-6 spatial privacy shield
 *  - Gasless ZK proof submission to ZKReportVerifier.sol
 */

'use client';

import React from 'react';
import { ZKBystanderPortal } from '../../components/ZKBystanderPortal.js';

export default function BystanderPage() {
  return <ZKBystanderPortal />;
}
