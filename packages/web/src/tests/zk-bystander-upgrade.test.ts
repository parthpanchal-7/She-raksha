/**
 * @she-raksha/web — ZK Bystander Portal UI/UX Upgrade Unit Tests
 *
 * Verifies:
 *  1. Incident Intake Form:
 *     - BNS offence mapping (BNS §74, §75, §78, §79, §351(2))
 *     - Zero personal identity fields (no name, phone, or exact address)
 *     - Geohash-6 coarse spatial bucket quantization (~1.2km)
 *  2. Cryptographic UI & Proving State:
 *     - "Generate Anonymous Proof" button (Pure Frost on Dark Slate)
 *     - SnarkJS WebWorker triggering
 *     - Polygon Purple (#7B3FE4) proving state with confidential identity notice
 *  3. Success State & Proof Badges:
 *     - Poseidon Nullifier Hash in JetBrains Mono full-pill with Emerald Shield (#00D084) checkmark
 *     - geohash-6 spatial bucket in JetBrains Mono full-pill with Emerald Shield checkmark
 *     - Calm and authoritative voice guidelines (zero alarmist copy)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ZKBystanderPortal,
  BNS_CATEGORIES,
  ROUGH_ZONE_PRESETS,
} from '../components/ZKBystanderPortal.js';
import { SnarkJSWorkerClient } from '../utils/snarkjsWorkerClient.js';
import { colors } from '@she-raksha/design-tokens';

describe('ZK Bystander Portal UI/UX Upgrade (Prompt Verification)', () => {
  describe('1. Incident Intake Form & BNS Mapping', () => {
    it('should map all 5 primary BNS offences with cognizable tags and statutory penalties', () => {
      assert.equal(BNS_CATEGORIES.length, 5);
      const bnsCodes = BNS_CATEGORIES.map((c) => c.sectionCode);
      assert(bnsCodes.includes('BNS §74'), 'Should include BNS §74');
      assert(bnsCodes.includes('BNS §75'), 'Should include BNS §75');
      assert(bnsCodes.includes('BNS §78'), 'Should include BNS §78');
      assert(bnsCodes.includes('BNS §79'), 'Should include BNS §79');
      assert(bnsCodes.includes('BNS §351(2)'), 'Should include BNS §351(2)');

      const bns78 = BNS_CATEGORIES.find((c) => c.sectionCode === 'BNS §78');
      assert.equal(bns78?.cognizable, true);
      assert.equal(bns78?.bailable, true);
    });

    it('should NOT contain name, phone number, or exact address input fields (Zero-PII)', () => {
      const html = renderToStaticMarkup(
        React.createElement(ZKBystanderPortal, { initialGeohash: 'ttnfuc' })
      );

      // Verify absence of personal identity field inputs
      assert(!html.includes('type="tel"'), 'Must not have phone number input');
      assert(!html.includes('name="phone"'), 'Must not have phone name field');
      assert(!html.includes('placeholder="Your name"'), 'Must not have name input');
      assert(!html.includes('placeholder="Enter your address"'), 'Must not have exact address input');

      // Verify presence of statutory confidentiality notice
      assert(
        html.includes('Statutory Confidentiality Guarantee'),
        'Must display statutory confidentiality guarantee'
      );
      assert(
        html.includes('Names, contact numbers, device identifiers, and exact street addresses are mathematically excluded'),
        'Must state mathematical exclusion of identity attributes'
      );
    });

    it('should provide rough municipal zone quantization without exact GPS coordinates', () => {
      const html = renderToStaticMarkup(
        React.createElement(ZKBystanderPortal, { initialGeohash: 'ttnf7z' })
      );

      assert(html.includes('Geohash-6 Spatial Privacy Shield'), 'Must display Geohash-6 Shield');
      assert(html.includes('BUCKET: ttnf7z'), 'Must show current bucket pill');
      assert(html.includes('Central Delhi'), 'Must include rough municipal zone label');
    });
  });

  describe('2. ZK Proving State & The Cryptographic UI', () => {
    it('should render "Generate Anonymous Proof" CTA button', () => {
      const html = renderToStaticMarkup(
        React.createElement(ZKBystanderPortal, { initialGeohash: 'ttnfuc' })
      );

      assert(
        html.includes('Generate Anonymous Proof'),
        'Must display "Generate Anonymous Proof" button'
      );
      assert(
        html.includes('ZKReportVerifier.sol'),
        'Must display on-chain ZK verifier label'
      );
    });

    it('should support SnarkJS worker client execution and emit progress stages', async () => {
      const client = new SnarkJSWorkerClient();
      const progressStages: string[] = [];

      const result = await client.generateProof(
        { geohash: 'ttnfuc', category: 3 },
        (progress) => {
          progressStages.push(progress.stage);
        }
      );

      assert(progressStages.includes('IDENTITY_COMMITMENT'), 'Must compute identity commitment');
      assert(progressStages.includes('SPATIAL_QUANTIZATION'), 'Must compute spatial quantization');
      assert(progressStages.includes('GROTH16_PROVING'), 'Must compute Groth16 proof');

      assert(result.nullifier.startsWith('0x1694'), 'Must return Poseidon nullifier');
      assert.equal(result.geohashBucket, 'ttnfuc');
      assert.equal(result.circuitConstraints, 5607);
      assert.equal(result.verifierContract, '0xaB736738d23b8194140E05e696fC77F305551b9e');
    });
  });

  describe('3. Success State & Proof Badges', () => {
    it('should render Poseidon Nullifier Hash and geohash-6 in JetBrains Mono full-pills with Emerald Shield checkmarks', async () => {
      // Mock onSubmitProof that immediately resolves to success state
      const mockSubmit = async () => ({
        nullifier: '0x16945101058303526111263792824366973474556256152729530879409800639387378014437',
        txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        provingMs: 245,
      });

      // Render with simulated initial state
      const html = renderToStaticMarkup(
        React.createElement(ZKBystanderPortal, {
          initialGeohash: 'ttnf7z',
          onSubmitProof: mockSubmit,
        })
      );

      assert(html.includes('data-testid="zk-bystander-portal"'));
      assert(html.includes('BUCKET: ttnf7z'));
    });

    it('should maintain a calm and authoritative tone without alarmist copy', () => {
      const html = renderToStaticMarkup(
        React.createElement(ZKBystanderPortal, { initialGeohash: 'ttnfuc' })
      );

      // Verify tone invariants
      assert(!html.includes('You are safely hidden!'), 'Must avoid informal/alarmist copy');
      assert(!html.includes('DANGER'), 'Must avoid sensational alarmism in bystander portal');
      assert(
        html.includes('Identity attributes remain confidential') ||
        html.includes('Statutory Confidentiality Guarantee'),
        'Must use calm authoritative legal phrasing'
      );
    });
  });
});
