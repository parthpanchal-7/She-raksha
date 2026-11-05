/**
 * @she-raksha/web — ZKBystanderPortal Component
 *
 * In-Browser WebAssembly ZK Bystander Reporting Engine:
 *  - Groth16 witness compilation via SnarkJS WebWorker
 *  - Geohash-6 spatial privacy shield (~1.2km x 0.6km bucket)
 *  - Sybil-resistant Poseidon nullifier: Poseidon(identitySecret, incidentId)
 *  - Gasless proof verification via ZKReportVerifier.sol
 *  - Zero PII guaranteed by Circom 2.1 Semaphore circuit & DPDP Act 2023
 *  - Strict adherence to @she-raksha/design-tokens (Midnight Obsidian #0A0D12,
 *    Dark Slate #121824, Subtle Wire #222F3E, Polygon Purple #7B3FE4, Emerald Shield #00D084)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { colors, radii } from '@she-raksha/design-tokens';
import { Card } from './Card.js';
import { PillBadge } from './PillBadge.js';
import {
  SnarkJSWorkerClient,
  type ZKWorkerProofProgress,
  type ZKWorkerProofSuccess,
} from '../utils/snarkjsWorkerClient.js';

export interface ZKBystanderPortalProps {
  initialGeohash?: string;
  onSubmitProof?: (data?: {
    category: number;
    geohash: string;
  }) => Promise<{ nullifier: string; txHash: string; provingMs: number }>;
}

export interface BNSOffenceCategory {
  id: number;
  sectionCode: string;
  title: string;
  statutoryDetail: string;
  cognizable: boolean;
  bailable: boolean;
  punishmentYears: string;
}

export const BNS_CATEGORIES: BNSOffenceCategory[] = [
  {
    id: 1,
    sectionCode: 'BNS §74',
    title: 'Assault on woman with intent to outrage modesty',
    statutoryDetail: 'Use of criminal force or physical assault with intention to outrage female modesty.',
    cognizable: true,
    bailable: false,
    punishmentYears: '3 to 7 years imprisonment',
  },
  {
    id: 2,
    sectionCode: 'BNS §75',
    title: 'Sexual harassment & unwelcome advances',
    statutoryDetail: 'Physical contact, unwelcome sexually coloured remarks, or demanding sexual favours.',
    cognizable: true,
    bailable: true,
    punishmentYears: '1 to 3 years imprisonment',
  },
  {
    id: 3,
    sectionCode: 'BNS §78',
    title: 'Stalking & electronic communication surveillance',
    statutoryDetail: 'Following or contacting a woman repeatedly; monitoring electronic internet communication.',
    cognizable: true,
    bailable: true,
    punishmentYears: '3 to 5 years imprisonment',
  },
  {
    id: 4,
    sectionCode: 'BNS §79',
    title: 'Word, gesture or act intended to insult modesty',
    statutoryDetail: 'Uttering words, making sounds or gestures, or exhibiting objects intruding upon privacy.',
    cognizable: true,
    bailable: true,
    punishmentYears: 'Up to 3 years imprisonment',
  },
  {
    id: 5,
    sectionCode: 'BNS §351(2)',
    title: 'Criminal intimidation by threat of injury',
    statutoryDetail: 'Threatening injury to person, reputation, or property to compel actions against will.',
    cognizable: true,
    bailable: true,
    punishmentYears: 'Up to 2 years imprisonment',
  },
];

export const ROUGH_ZONE_PRESETS = [
  { geohash: 'ttnf7z', label: 'Central Delhi (Connaught Place / Barakhamba)' },
  { geohash: 'ttnfuc', label: 'South Delhi (Hauz Khas / Green Park / AIIMS)' },
  { geohash: 'ttnfg5', label: 'West Delhi (Dwarka Sector 10 / Palam)' },
  { geohash: 'ttnfvs', label: 'East Delhi / Noida (Sector 18 / Atta)' },
  { geohash: 'ttnfd4', label: 'South-West NCR (Cyber City / DLF Phase 2)' },
  { geohash: 'ttnfbb', label: 'North Delhi (Civil Lines / Vishwavidyalaya)' },
];

export const ZKBystanderPortal: React.FC<ZKBystanderPortalProps> = ({
  initialGeohash = 'ttnfuc',
  onSubmitProof,
}) => {
  const [category, setCategory] = useState<number>(3); // Default BNS §78 (Stalking)
  const [roughGeohash, setRoughGeohash] = useState<string>(initialGeohash);
  const [selectedZoneLabel, setSelectedZoneLabel] = useState<string>(
    ROUGH_ZONE_PRESETS.find((z) => z.geohash === initialGeohash)?.label || 'South Delhi Municipal Zone'
  );
  const [timeEpochWindow, setTimeEpochWindow] = useState<'RECENT' | 'EARLIER_TODAY' | 'PAST_HOURS'>('RECENT');
  const [observationNotes, setObservationNotes] = useState<string>('');

  const [isProving, setIsProving] = useState<boolean>(false);
  const [provingProgress, setProvingProgress] = useState<ZKWorkerProofProgress | null>(null);
  const [proofSuccess, setProofSuccess] = useState<ZKWorkerProofSuccess | null>(null);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [provingDuration, setProvingDuration] = useState<number | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  const workerClientRef = useRef<SnarkJSWorkerClient | null>(null);

  useEffect(() => {
    workerClientRef.current = new SnarkJSWorkerClient();
    return () => {
      workerClientRef.current?.terminate();
    };
  }, []);

  const handleProveAndSubmit = async () => {
    setIsProving(true);
    setProvingProgress({
      stage: 'STARTING',
      message: 'Compiling Groth16 Proof. Identity attributes remain confidential.',
      progressPercent: 10,
    });

    try {
      if (onSubmitProof) {
        const res = await onSubmitProof({
          category,
          geohash: roughGeohash,
        });
        setNullifierHash(res.nullifier);
        setTxHash(res.txHash);
        setProvingDuration(res.provingMs);
        setProofSuccess({
          nullifier: res.nullifier,
          txHash: res.txHash,
          geohashBucket: roughGeohash,
          bnsCategory: category,
          provingMs: res.provingMs,
          circuitConstraints: 5607,
          protocol: 'Groth16 (BN254 curve)',
          verifierContract: '0xaB736738d23b8194140E05e696fC77F305551b9e',
          network: 'Polygon Amoy (Chain ID 80002)',
        });
      } else {
        const client = workerClientRef.current || new SnarkJSWorkerClient();
        const result = await client.generateProof(
          { geohash: roughGeohash, category },
          (prog) => setProvingProgress(prog)
        );
        setNullifierHash(result.nullifier);
        setTxHash(result.txHash);
        setProvingDuration(result.provingMs);
        setProofSuccess(result);
      }
    } catch (err: any) {
      console.error('Proof generation error:', err);
    } finally {
      setIsProving(false);
      setProvingProgress(null);
    }
  };

  const handleResetForm = () => {
    setNullifierHash(null);
    setTxHash(null);
    setProofSuccess(null);
    setProvingDuration(null);
    setObservationNotes('');
    setCopiedReceipt(false);
  };

  const handleCopyReceipt = () => {
    if (!nullifierHash) return;
    const receiptData = JSON.stringify(
      {
        statutorySystem: 'She-Raksha ZK Bystander Evidence Ledger',
        bnsCategory: BNS_CATEGORIES.find((c) => c.id === category)?.sectionCode,
        geohash6Bucket: roughGeohash,
        poseidonNullifier: nullifierHash,
        l2TxHash: txHash,
        provingDurationMs: provingDuration,
        verifierContract: '0xaB736738d23b8194140E05e696fC77F305551b9e',
        network: 'Polygon Amoy Testnet (Chain ID 80002)',
        zeroPiiAttestation: 'DPDP Act 2023 & BSA §63 Compliant',
      },
      null,
      2
    );

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(receiptData);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  return (
    <div
      data-testid="zk-bystander-portal"
      className="min-h-screen p-4 sm:p-6 md:p-8 flex flex-col gap-6 font-sans text-pure-frost bg-midnight-obsidian"
      style={{
        backgroundColor: colors.midnightObsidian,
        color: colors.pureFrost,
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Header & Architectural Title */}
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(123, 63, 228, 0.12)',
                borderColor: colors.polygonPurple,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.polygonPurple} strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                In-Browser WebAssembly ZK Bystander Portal
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: colors.mutedSilver }}>
                Cryptographic Witness Protocol • Zero-Knowledge Groth16 Prover
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PillBadge
              label="CIRCOM 2.1 / GROTH16"
              isVerified={true}
              accentColor={colors.polygonPurple}
            />
            <PillBadge
              label="POLYGON L2 VERIFIED"
              isVerified={true}
              accentColor={colors.emeraldShield}
            />
          </div>
        </div>

        {/* DPDP Act 2023 & Zero-PII Statutory Guarantee */}
        <div
          className="mt-2 p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5"
          style={{
            backgroundColor: 'rgba(18, 24, 36, 0.8)',
            borderColor: colors.subtleWire,
            color: colors.mutedSilver,
          }}
        >
          <span style={{ color: colors.polygonPurple, fontSize: '14px', lineHeight: '18px' }}>🛡️</span>
          <div>
            <strong style={{ color: colors.pureFrost }}>Statutory Confidentiality Guarantee (DPDP Act 2023):</strong>{' '}
            This intake captures exclusively the alleged BNS legal offence and municipal jurisdiction. Names, contact numbers, device identifiers, and exact street addresses are mathematically excluded from the circuit witness space.
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-5">
        {/* State 3: SUCCESS STATE & CRYPTOGRAPHIC PROOF BADGES */}
        {proofSuccess ? (
          <Card
            testID="zk-action-card"
            accentBorderColor={colors.emeraldShield}
            style={{ padding: '24px', gap: '18px' }}
          >
            <div data-testid="zk-success-box" className="flex flex-col gap-4">
              {/* Header Status */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: 'rgba(0, 208, 132, 0.15)', color: colors.emeraldShield }}
                  >
                    ✓
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '17px',
                        fontWeight: 700,
                        margin: 0,
                        color: colors.emeraldShield,
                      }}
                    >
                      Bystander Report Verified via Groth16 zk-SNARK
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: colors.mutedSilver }}>
                      Identity nullifier spent; exact location masked to municipal geohash-6.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2.5 py-1 rounded border font-mono"
                    style={{
                      borderColor: colors.subtleWire,
                      backgroundColor: colors.midnightObsidian,
                      color: colors.dimSteel,
                    }}
                  >
                    {provingDuration || proofSuccess.provingMs}ms Proving Time
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded border font-mono font-medium"
                    style={{
                      borderColor: 'rgba(0, 208, 132, 0.4)',
                      backgroundColor: 'rgba(0, 208, 132, 0.1)',
                      color: colors.emeraldShield,
                    }}
                  >
                    0 POL Gasless
                  </span>
                </div>
              </div>

              {/* Monospace JetBrains Mono Badges */}
              <div
                className="p-4 rounded-lg border flex flex-col gap-3.5"
                style={{
                  backgroundColor: colors.midnightObsidian,
                  borderColor: colors.subtleWire,
                }}
              >
                {/* Poseidon Nullifier Hash Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.dimSteel }}>
                      Poseidon Nullifier Hash:
                    </span>
                    <span className="text-xs font-mono" style={{ color: colors.mutedSilver }}>
                      (Sybil-Resistant Single-Use Key)
                    </span>
                  </div>
                  <div data-testid="nullifier-hash-pill">
                    <PillBadge
                      label={proofSuccess.nullifier}
                      isVerified={true}
                      accentColor={colors.emeraldShield}
                      testID="nullifier-hash-pill"
                    />
                  </div>
                </div>

                {/* Geohash-6 Spatial Bucket Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.dimSteel }}>
                      Geohash-6 Spatial Bucket:
                    </span>
                    <span className="text-xs font-mono" style={{ color: colors.mutedSilver }}>
                      (~1.2km × 0.6km Municipal Zone)
                    </span>
                  </div>
                  <div data-testid="geohash-shield-pill">
                    <PillBadge
                      label={`BUCKET: ${proofSuccess.geohashBucket}`}
                      isVerified={true}
                      accentColor={colors.emeraldShield}
                      testID="geohash-shield-pill"
                    />
                  </div>
                </div>

                {/* ZKReportVerifier.sol On-Chain Contract */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.dimSteel }}>
                    On-Chain Verifier Contract:
                  </span>
                  <PillBadge
                    label="ZKReportVerifier.sol (0xaB73...1b9e)"
                    isVerified={true}
                    accentColor={colors.polygonPurple}
                  />
                </div>

                {/* Polygon L2 Transaction Hash */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.dimSteel }}>
                    Polygon L2 Anchor Tx:
                  </span>
                  <div data-testid="zk-tx-pill">
                    <PillBadge
                      label={proofSuccess.txHash}
                      isVerified={true}
                      accentColor={colors.emeraldShield}
                      testID="zk-tx-pill"
                    />
                  </div>
                </div>
              </div>

              {/* Cryptographic Specifications Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div
                  className="p-3 rounded border flex flex-col gap-1"
                  style={{ backgroundColor: colors.midnightObsidian, borderColor: colors.subtleWire }}
                >
                  <span style={{ color: colors.dimSteel }}>Alleged Offence</span>
                  <span className="font-semibold" style={{ color: colors.pureFrost }}>
                    {BNS_CATEGORIES.find((c) => c.id === category)?.sectionCode}
                  </span>
                  <span style={{ color: colors.mutedSilver, fontSize: '11px' }}>
                    {BNS_CATEGORIES.find((c) => c.id === category)?.title}
                  </span>
                </div>

                <div
                  className="p-3 rounded border flex flex-col gap-1"
                  style={{ backgroundColor: colors.midnightObsidian, borderColor: colors.subtleWire }}
                >
                  <span style={{ color: colors.dimSteel }}>Proving Scheme</span>
                  <span className="font-semibold" style={{ color: colors.pureFrost }}>
                    Groth16 (BN254 Pairing)
                  </span>
                  <span style={{ color: colors.mutedSilver, fontSize: '11px' }}>
                    5,607 Circom Constraints
                  </span>
                </div>

                <div
                  className="p-3 rounded border flex flex-col gap-1"
                  style={{ backgroundColor: colors.midnightObsidian, borderColor: colors.subtleWire }}
                >
                  <span style={{ color: colors.dimSteel }}>Statutory Status</span>
                  <span className="font-semibold" style={{ color: colors.emeraldShield }}>
                    Admissible Record
                  </span>
                  <span style={{ color: colors.mutedSilver, fontSize: '11px' }}>
                    BSA §63 Cryptographic Proof
                  </span>
                </div>
              </div>

              {/* Actions: Copy Receipt & Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="px-4 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors"
                  style={{
                    backgroundColor: colors.darkSlate,
                    borderColor: colors.subtleWire,
                    color: copiedReceipt ? colors.emeraldShield : colors.pureFrost,
                  }}
                >
                  <span>{copiedReceipt ? '✓ Copied to Clipboard' : 'Copy Verification Receipt'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.subtleWire,
                    color: colors.mutedSilver,
                  }}
                >
                  Submit Another Confidential Report
                </button>
              </div>
            </div>
          </Card>
        ) : (
          /* State 1: INCIDENT INTAKE FORM & State 2: PROVING STATE */
          <div className="flex flex-col gap-5">
            {/* 1. Incident Category Intake Form (Mapped to BNS Codes) */}
            <Card testID="incident-category-card">
              <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: colors.subtleWire }}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.mutedSilver }}>
                    1. Incident Classification
                  </span>
                  <h2 className="text-sm font-bold mt-0.5" style={{ color: colors.pureFrost }}>
                    Bharatiya Nyaya Sanhita (BNS) Statutory Mapping
                  </h2>
                </div>
                <span className="text-xs px-2 py-0.5 rounded border font-mono" style={{ borderColor: colors.subtleWire, color: colors.dimSteel }}>
                  Select 1 Offence
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {BNS_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`cat-select-${cat.id}`}
                      onClick={() => setCategory(cat.id)}
                      disabled={isProving}
                      className="p-3.5 rounded-lg border text-left transition-all flex flex-col gap-1.5"
                      style={{
                        backgroundColor: isSelected ? 'rgba(123, 63, 228, 0.12)' : colors.midnightObsidian,
                        borderColor: isSelected ? colors.polygonPurple : colors.subtleWire,
                        cursor: isProving ? 'not-allowed' : 'pointer',
                        minHeight: '48px',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono font-bold text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: isSelected ? 'rgba(123, 63, 228, 0.3)' : colors.darkSlate,
                              color: isSelected ? colors.pureFrost : colors.polygonPurple,
                              border: `1px solid ${isSelected ? colors.polygonPurple : colors.subtleWire}`,
                            }}
                          >
                            {cat.sectionCode}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: colors.pureFrost }}>
                            {cat.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-mono"
                            style={{
                              backgroundColor: cat.cognizable ? 'rgba(255, 59, 92, 0.15)' : colors.darkSlate,
                              color: cat.cognizable ? colors.crimsonCoral : colors.dimSteel,
                            }}
                          >
                            {cat.cognizable ? 'Cognizable' : 'Non-Cognizable'}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-bold" style={{ color: colors.emeraldShield }}>
                              ✓ Selected
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: colors.mutedSilver, lineHeight: '17px' }}>
                        {cat.statutoryDetail}
                      </p>

                      <div className="flex items-center gap-3 text-xs pt-0.5" style={{ color: colors.dimSteel }}>
                        <span>Penalty: {cat.punishmentYears}</span>
                        <span>•</span>
                        <span>{cat.bailable ? 'Bailable' : 'Non-Bailable'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. Rough Location Intake (Geohash-6 Coarse Spatial Quantizer) */}
            <Card testID="spatial-shield-card">
              <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: colors.subtleWire }}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.polygonPurple }}>
                    2. Rough Municipal Location
                  </span>
                  <h2 className="text-sm font-bold mt-0.5" style={{ color: colors.pureFrost }}>
                    Geohash-6 Spatial Privacy Shield (~1.2 km × 0.6 km)
                  </h2>
                </div>
                <div data-testid="geohash-shield-pill">
                  <PillBadge
                    label={`BUCKET: ${roughGeohash}`}
                    isVerified={true}
                    accentColor={colors.polygonPurple}
                    testID="geohash-shield-pill"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <p style={{ fontSize: '12px', color: colors.mutedSilver, margin: 0, lineHeight: '18px' }}>
                  Select the municipal sector where the observation occurred. Exact physical street addresses, house numbers, and precise GPS pins are intentionally excluded to protect bystander and observer safety.
                </p>

                {/* Rough Zone Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROUGH_ZONE_PRESETS.map((preset) => {
                    const isZoneActive = roughGeohash === preset.geohash;
                    return (
                      <button
                        key={preset.geohash}
                        type="button"
                        disabled={isProving}
                        onClick={() => {
                          setRoughGeohash(preset.geohash);
                          setSelectedZoneLabel(preset.label);
                        }}
                        className="p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: isZoneActive ? 'rgba(123, 63, 228, 0.12)' : colors.midnightObsidian,
                          borderColor: isZoneActive ? colors.polygonPurple : colors.subtleWire,
                          cursor: isProving ? 'not-allowed' : 'pointer',
                          minHeight: '48px',
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold" style={{ color: colors.pureFrost }}>
                            {preset.label}
                          </span>
                          <span className="text-xs font-mono" style={{ color: colors.dimSteel }}>
                            Quantized Hash: {preset.geohash}
                          </span>
                        </div>
                        {isZoneActive && (
                          <span className="text-xs font-bold" style={{ color: colors.emeraldShield }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Geohash-6 Input for Other Zones */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1">
                  <label htmlFor="custom-geohash" className="text-xs" style={{ color: colors.mutedSilver }}>
                    Or enter specific 6-character municipal geohash:
                  </label>
                  <input
                    id="custom-geohash"
                    type="text"
                    maxLength={6}
                    value={roughGeohash}
                    disabled={isProving}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^0-9b-hjkmnp-z]/g, '').slice(0, 6);
                      setRoughGeohash(val || 'ttnfuc');
                    }}
                    className="px-3 py-1.5 rounded border font-mono text-xs text-pure-frost bg-midnight-obsidian"
                    style={{
                      borderColor: colors.subtleWire,
                      backgroundColor: colors.midnightObsidian,
                      color: colors.pureFrost,
                      width: '110px',
                    }}
                    placeholder="ttnfuc"
                  />
                  <span className="text-xs font-mono" style={{ color: colors.dimSteel }}>
                    (Resolution 6 ≈ 1.2km)
                  </span>
                </div>
              </div>
            </Card>

            {/* 3. Temporal Window & Non-PII Observations */}
            <Card>
              <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: colors.subtleWire }}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.mutedSilver }}>
                    3. Approximate Time Window
                  </span>
                  <h2 className="text-sm font-bold mt-0.5" style={{ color: colors.pureFrost }}>
                    1-Hour Quantized Epoch Bucket
                  </h2>
                </div>
                <span className="text-xs font-mono" style={{ color: colors.dimSteel }}>
                  Epoch Modulo 3600
                </span>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'RECENT', label: 'Within last 60 minutes', sub: 'Current hourly epoch' },
                    { id: 'PAST_HOURS', label: '1 to 3 hours ago', sub: '-1 to -3 epoch buckets' },
                    { id: 'EARLIER_TODAY', label: 'Earlier today', sub: 'Today municipal window' },
                  ].map((epoch) => {
                    const isEpochSelected = timeEpochWindow === epoch.id;
                    return (
                      <button
                        key={epoch.id}
                        type="button"
                        disabled={isProving}
                        onClick={() => setTimeEpochWindow(epoch.id as any)}
                        className="p-3 rounded-lg border text-left flex flex-col gap-0.5"
                        style={{
                          backgroundColor: isEpochSelected ? 'rgba(123, 63, 228, 0.12)' : colors.midnightObsidian,
                          borderColor: isEpochSelected ? colors.polygonPurple : colors.subtleWire,
                          minHeight: '48px',
                          cursor: isProving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: colors.pureFrost }}>
                          {epoch.label}
                        </span>
                        <span className="text-xs font-mono" style={{ color: colors.dimSteel }}>
                          {epoch.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Factual Non-PII Notes */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="observation-notes" className="text-xs font-medium" style={{ color: colors.mutedSilver }}>
                      Factual Observation Notes (Optional):
                    </label>
                    <span className="text-xs font-mono" style={{ color: colors.dimSteel }}>
                      Strictly exclude names / phone numbers
                    </span>
                  </div>
                  <textarea
                    id="observation-notes"
                    rows={2}
                    value={observationNotes}
                    disabled={isProving}
                    onChange={(e) => setObservationNotes(e.target.value)}
                    placeholder="e.g. Unidentified individual observed following commuter from bus shelter along outer perimeter ring."
                    className="w-full p-3 rounded-lg border text-xs text-pure-frost resize-none focus:outline-none"
                    style={{
                      backgroundColor: colors.midnightObsidian,
                      borderColor: colors.subtleWire,
                      color: colors.pureFrost,
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* State 2: ZK PROVING STATE (The Cryptographic UI) & Action Button */}
            <Card testID="zk-action-card">
              <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: colors.subtleWire }}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.dimSteel }}>
                    Cryptographic Prover
                  </span>
                  <h2 className="text-sm font-bold mt-0.5" style={{ color: colors.pureFrost }}>
                    On-Chain Anonymous Witness Submission
                  </h2>
                </div>
                <PillBadge label="ZKReportVerifier.sol" isVerified={true} />
              </div>

              {isProving ? (
                /* The Loading State using Polygon Purple #7B3FE4 */
                <div
                  className="p-5 rounded-lg border flex flex-col gap-4 animate-pulse"
                  style={{
                    backgroundColor: 'rgba(123, 63, 228, 0.08)',
                    borderColor: colors.polygonPurple,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: colors.polygonPurple, borderTopColor: 'transparent' }}
                    />
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-bold"
                        style={{ color: colors.polygonPurple }}
                      >
                        Compiling Groth16 Proof. Identity attributes remain confidential.
                      </span>
                      <span className="text-xs" style={{ color: colors.mutedSilver }}>
                        {provingProgress?.message || 'Evaluating R1CS constraints in background WebWorker...'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="w-full bg-midnight-obsidian rounded-full h-1.5 overflow-hidden border" style={{ borderColor: colors.subtleWire }}>
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${provingProgress?.progressPercent || 45}%`,
                        backgroundColor: colors.polygonPurple,
                      }}
                    />
                  </div>

                  {/* Cryptographic Execution Telemetry */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1" style={{ color: colors.dimSteel }}>
                    <div>R1CS: 5,607 constraints</div>
                    <div>Curve: BN254</div>
                    <div>Tree: Semaphore depth 20</div>
                    <div>Target: &lt; 8.0s (NFR-PERF-003)</div>
                  </div>
                </div>
              ) : (
                /* Primary Action Button: Pure Frost text on Dark Slate button */
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    data-testid="btn-generate-zk-proof"
                    onClick={handleProveAndSubmit}
                    disabled={isProving}
                    className="w-full py-4 px-6 rounded-lg font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 border shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: colors.darkSlate,
                      color: colors.pureFrost,
                      borderColor: colors.subtleWire,
                      minHeight: '48px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.polygonPurple;
                      e.currentTarget.style.boxShadow = '0 0 16px rgba(123, 63, 228, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.subtleWire;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.polygonPurple} strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h.01" />
                      <path d="M17 7h.01" />
                      <path d="M7 17h.01" />
                      <path d="M17 17h.01" />
                    </svg>
                    <span>Generate Anonymous Proof</span>
                  </button>

                  <div className="flex items-center justify-between text-xs px-1" style={{ color: colors.dimSteel }}>
                    <span>Gasless Polygon L2 transaction sponsored by SheRakshaPaymaster</span>
                    <span>Zero PII stored on device or server</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
