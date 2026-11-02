/**
 * @she-raksha/mobile — Screen 2: Tamper-Proof Evidence Vault & BSA §63 Certificate Viewer
 *
 * Implements FR-EV-001, FR-EV-007, and BSA §63 Admissibility:
 *  - Renders IPFS CIDv1 and Polygon L2 Transaction Hashes in JetBrains Mono full-pill badges
 *  - Displays verified checkmarks (#00D084 Emerald Shield)
 *  - Shows BSA §63 Hardware Enclave Attestation (Android StrongBox / iOS Secure Enclave)
 *  - Displays time-bound access grants (AccessGrant.sol)
 */

import React, { useState } from 'react';
import { colors } from '@she-raksha/design-tokens';
import { Card } from '../ui/components/Card.js';
import { PillBadge } from '../ui/components/PillBadge.js';
import { TouchTarget } from '../ui/components/TouchTarget.js';
import { VOICE_COPY } from '../ui/voiceCopy.js';

export interface EvidenceChunkItem {
  chunkIndex: number;
  mediaType: string;
  durationSeconds: number;
  encryptedAt: string;
  ipfsCid: string;
  txHash: string;
  isAnchored: boolean;
}

export interface BSA63CertificateDetails {
  certificateId: string;
  sessionId: string;
  merkleRoot: string;
  enclaveType: 'Android StrongBox Keymaster' | 'iOS Secure Enclave' | 'AWS Nitro TEE';
  statutoryNotice: string;
  lawEnforcementGrantActive: boolean;
  ngoGrantActive: boolean;
}

export interface EvidenceVaultScreenProps {
  chunks?: EvidenceChunkItem[];
  certificate?: BSA63CertificateDetails;
  onExportCertificate?: () => void;
  onBack?: () => void;
}

export const EvidenceVaultScreen: React.FC<EvidenceVaultScreenProps> = ({
  chunks = [
    {
      chunkIndex: 0,
      mediaType: 'VIDEO_H265',
      durationSeconds: 5.0,
      encryptedAt: '2026-11-03T04:15:00Z',
      ipfsCid: 'bafybeiczsscds0bg735wg4tu8qlwskeu3erg1',
      txHash: '0x8f2a91c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
      isAnchored: true,
    },
    {
      chunkIndex: 1,
      mediaType: 'AUDIO_AAC',
      durationSeconds: 5.0,
      encryptedAt: '2026-11-03T04:15:05Z',
      ipfsCid: 'bafybeid7ff823hjkhw98124jkasd8723klnas',
      txHash: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
      isAnchored: true,
    },
  ],
  certificate = {
    certificateId: 'BSA63-CERT-AMOY-20261103-0982',
    sessionId: '0x4f12ab98cd34ef760123456789abcdef0123456789abcdef0123456789abcdef',
    merkleRoot: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    enclaveType: 'Android StrongBox Keymaster',
    statutoryNotice: 'Certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (Admissibility of electronic records)',
    lawEnforcementGrantActive: true,
    ngoGrantActive: false,
  },
  onExportCertificate,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'CHUNKS' | 'BSA63'>('CHUNKS');

  return (
    <div
      data-testid="evidence-vault-screen"
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Tamper-Proof Evidence Vault
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.mutedSilver }}>
            {VOICE_COPY.VAULT_ENCRYPTED}
          </p>
        </div>
        {onBack && (
          <TouchTarget
            onClick={onBack}
            style={{
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
              color: colors.pureFrost,
              fontSize: '12px',
            }}
            testID="vault-back-button"
          >
            ← Back
          </TouchTarget>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <TouchTarget
          onClick={() => setActiveTab('CHUNKS')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'CHUNKS' ? colors.polygonPurple : colors.darkSlate,
            border: `1px solid ${colors.subtleWire}`,
            color: colors.pureFrost,
            fontWeight: 600,
          }}
          testID="tab-chunks"
        >
          Encrypted Chunks ({chunks.length})
        </TouchTarget>
        <TouchTarget
          onClick={() => setActiveTab('BSA63')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'BSA63' ? colors.polygonPurple : colors.darkSlate,
            border: `1px solid ${colors.subtleWire}`,
            color: colors.pureFrost,
            fontWeight: 600,
          }}
          testID="tab-bsa63"
        >
          BSA §63 Certificate
        </TouchTarget>
      </div>

      {activeTab === 'CHUNKS' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="chunk-list-container">
          {chunks.map((chunk) => (
            <Card key={chunk.chunkIndex} testID={`chunk-card-${chunk.chunkIndex}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.pureFrost }}>
                  Chunk #{chunk.chunkIndex} ({chunk.mediaType})
                </span>
                <span style={{ fontSize: '12px', color: colors.dimSteel }}>
                  {chunk.durationSeconds}s
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: colors.mutedSilver, textTransform: 'uppercase' }}>
                  IPFS CIDv1 (Decentralized Pin):
                </span>
                <PillBadge
                  label={chunk.ipfsCid}
                  isVerified={true}
                  accentColor={colors.emeraldShield}
                  testID={`cid-badge-${chunk.chunkIndex}`}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: colors.mutedSilver, textTransform: 'uppercase' }}>
                  Polygon L2 Anchor Receipt:
                </span>
                <PillBadge
                  label={`${chunk.txHash.slice(0, 10)}...${chunk.txHash.slice(-8)}`}
                  isVerified={chunk.isAnchored}
                  accentColor={colors.emeraldShield}
                  testID={`tx-badge-${chunk.chunkIndex}`}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card testID="bsa63-certificate-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: colors.emeraldShield }}>
              ✓ BSA §63 VERIFIED CERTIFICATE
            </span>
            <PillBadge label="AMOY L2" isVerified={true} />
          </div>

          <div style={{ fontSize: '12px', color: colors.mutedSilver }}>
            {certificate.statutoryNotice}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: colors.dimSteel }}>Certificate Identifier:</span>
            <PillBadge label={certificate.certificateId} isVerified={true} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: colors.dimSteel }}>Hardware Enclave:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.pureFrost }}>
              {certificate.enclaveType}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: colors.dimSteel }}>Session Merkle Root:</span>
            <PillBadge label={`${certificate.merkleRoot.slice(0, 16)}...`} isVerified={true} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: colors.dimSteel }}>Access Delegation (AccessGrant.sol):</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <PillBadge
                label={`POLICE: ${certificate.lawEnforcementGrantActive ? 'ACTIVE' : 'REVOKED'}`}
                isVerified={certificate.lawEnforcementGrantActive}
                accentColor={certificate.lawEnforcementGrantActive ? colors.emeraldShield : colors.dimSteel}
              />
              <PillBadge
                label={`NGO: ${certificate.ngoGrantActive ? 'ACTIVE' : 'REVOKED'}`}
                isVerified={certificate.ngoGrantActive}
                accentColor={certificate.ngoGrantActive ? colors.emeraldShield : colors.dimSteel}
              />
            </div>
          </div>

          <TouchTarget
            onClick={onExportCertificate}
            style={{
              backgroundColor: colors.polygonPurple,
              color: colors.pureFrost,
              fontWeight: 600,
              width: '100%',
              marginTop: '8px',
            }}
            testID="export-certificate-button"
          >
            Export BSA §63 Signed PDF/A-3
          </TouchTarget>
        </Card>
      )}
    </div>
  );
};
