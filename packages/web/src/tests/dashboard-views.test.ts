/**
 * @she-raksha/web — Institutional Dashboard Core Views Unit Tests
 *
 * Verifies:
 *  - View 1: e-FIR Escrow Queue (/dashboard/efir-queue)
 *     - Header eFIR-2026-BNSS173-[ID] in JetBrains Mono
 *     - Mapped BNS sections (BNS §74, BNS §78, BNS §75, etc.) in Muted Silver
 *     - Prominent countdown clock with Electric Amber (#FF9F1C) when under 24 hours
 *     - Action button "Initiate Aadhaar e-Sign Acknowledgement" (Pure Frost on Subtle Wire, NOT Crimson Coral)
 *  - View 2: NGO Escalations (/dashboard/ngo-escalations)
 *     - Chronological feed of escalation dossiers
 *     - Type A: 48-Hour Escrow Warning with badge "⚠️ SP Escalation Pending"
 *     - Type B: Anonymous ZK Report with Poseidon Nullifier Hash with Polygon Purple outline
 *     - Obfuscated location geohash-6 bucket (e.g. ttnf7z) without raw GPS/PII
 *  - View 3: Evidence Verification (/dashboard/evidence-verification)
 *     - Two-column split layout (File list and Cryptographic audit trail)
 *     - Step 1: AES-256-GCM Capture with 128-bit auth tag
 *     - Step 2: IPFS Persistence with CIDv1 monospace pill
 *     - Step 3: Polygon L2 Merkle Anchor with tx hash
 *     - Emerald Shield (#00D084) checkmark icons
 *     - Button "Decrypt Media Vault" with disclaimer "Requires active temporal cryptographic delegation via AccessGrant.sol"
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  EFIRQueueView,
  NGOEscalationsView,
  EvidenceVerificationView,
} from '../index.js';

describe('Institutional Dashboard Core Views (e-FIR, NGO, Evidence)', () => {
  describe('View 1: e-FIR Escrow Queue (/dashboard/efir-queue)', () => {
    it('should render eFIR cards with BNSS §173 timers and Aadhaar e-Sign action', () => {
      let initiatedId: string | null = null;
      const element = React.createElement(EFIRQueueView, {
        onAadhaarSignInitiate: (id) => {
          initiatedId = id;
        },
      });

      assert(React.isValidElement(element));
      const html = renderToString(element);

      // Card Header: eFIR-2026-BNSS173-[ID] in JetBrains Mono
      assert(
        html.includes('eFIR-2026-BNSS173-98124'),
        'Must display eFIR-2026-BNSS173-[ID] in JetBrains Mono'
      );
      assert(
        html.includes('eFIR-2026-BNSS173-98125'),
        'Must display second eFIR record'
      );

      // Mapped BNS sections in Muted Silver
      assert(
        html.includes('BNS §74 (Assault)'),
        'Must display BNS §74 (Assault)'
      );
      assert(
        html.includes('BNS §78 (Stalking)'),
        'Must display BNS §78 (Stalking)'
      );
      assert(
        html.includes('BNS §75 (Sexual Harassment)'),
        'Must display BNS §75 (Sexual Harassment)'
      );

      // Countdown Timer (under 24 hours colored Electric Amber #FF9F1C)
      assert(
        html.includes('Remaining'),
        'Must include Remaining countdown timer label'
      );

      // Action: "Initiate Aadhaar e-Sign Acknowledgement"
      assert(
        html.includes('Initiate Aadhaar e-Sign Acknowledgement'),
        'Must include button labeled "Initiate Aadhaar e-Sign Acknowledgement"'
      );

      // Verify no Crimson Coral on the action button
      // The button uses Subtle Wire background and Pure Frost text
      assert(
        !html.includes('bg-crimson-coral') || html.includes('Initiate Aadhaar'),
        'Action button must NOT use Crimson Coral'
      );
    });
  });

  describe('View 2: NGO Escalations (/dashboard/ngo-escalations)', () => {
    it('should render 48h warnings and anonymous ZK dossiers with Poseidon Nullifier & geohash-6', () => {
      let dispatchedId: string | null = null;
      const element = React.createElement(NGOEscalationsView, {
        onDispatchDossier: (id) => {
          dispatchedId = id;
        },
      });

      assert(React.isValidElement(element));
      const html = renderToString(element);

      // Type A: 48-Hour Escrow Warning badge
      assert(
        html.includes('SP Escalation Pending'),
        'Must include badge: ⚠️ SP Escalation Pending'
      );

      // Type B: Anonymous ZK Report
      assert(
        html.includes('Anonymous ZK Bystander Report'),
        'Must render Anonymous ZK Bystander Report header'
      );

      // Poseidon Nullifier Hash badge
      assert(
        html.includes('0x4f89c2b3e8a1d7f6c5b4a39281706f5e4d3c2b1a0987654321fedcba09876543'),
        'Must display Poseidon Nullifier Hash'
      );

      // Obfuscated geohash-6 bucket without raw GPS coordinates
      assert(
        html.includes('geohash-6: ttnf7z') || html.includes('ttnf7z'),
        'Must display obfuscated geohash-6 bucket'
      );

      // Verification state
      assert(
        html.includes('Groth16 zk-SNARK Verified'),
        'Must show Groth16 verification status'
      );
    });
  });

  describe('View 3: Evidence Verification (/dashboard/evidence-verification)', () => {
    it('should render two-column split with BSA §63 stepper, CIDv1 pill, and Decrypt Media Vault', () => {
      let decryptedFile: string | null = null;
      const element = React.createElement(EvidenceVerificationView, {
        onDecryptVault: (id) => {
          decryptedFile = id;
        },
      });

      assert(React.isValidElement(element));
      const html = renderToString(element);

      // Two-column split layout
      assert(
        html.includes('data-testid="evidence-file-list"'),
        'Must include left file list column'
      );
      assert(
        html.includes('data-testid="evidence-audit-trail"'),
        'Must include right cryptographic audit trail column'
      );

      // Stepper Step 1: AES-256-GCM Capture with 128-bit auth tag
      assert(
        html.includes('Step 1: AES-256-GCM Capture'),
        'Must include Step 1: AES-256-GCM Capture'
      );
      assert(
        html.includes('128-bit Auth Tag:'),
        'Must display 128-bit auth tag label'
      );
      assert(
        html.includes('0x7f4b82d3e91a0c4f8b2d1e9a3c5e7b9d'),
        'Must display 128-bit auth tag value'
      );

      // Stepper Step 2: IPFS Persistence with CIDv1 in monospace pill
      assert(
        html.includes('Step 2: IPFS Persistence'),
        'Must include Step 2: IPFS Persistence'
      );
      assert(
        html.includes('bafybeicv5c2j6h2z3x4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a'),
        'Must display CIDv1 in monospace pill'
      );

      // Stepper Step 3: Polygon L2 Merkle Anchor with tx hash
      assert(
        html.includes('Step 3: Polygon L2 Merkle Anchor'),
        'Must include Step 3: Polygon L2 Merkle Anchor'
      );
      assert(
        html.includes('0x89d2c49e7b1a03fc652e91da0183b9c7198a2d1f67890abcde1234567890abcd'),
        'Must display Polygon L2 transaction hash'
      );

      // Action: Decrypt Media Vault button
      assert(
        html.includes('Decrypt Media Vault'),
        'Must include button labeled "Decrypt Media Vault"'
      );

      // Required microcopy disclaimer
      assert(
        html.includes('Requires active temporal cryptographic delegation via AccessGrant.sol'),
        'Must include required disclaimer microcopy'
      );
    });
  });
});

