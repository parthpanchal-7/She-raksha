'use client';

/**
 * @she-raksha/web — View 3: Evidence Verification (/dashboard/evidence-verification)
 *
 * Purpose: Validate BSA §63 digital custody chains and unlock encrypted media via AccessGrant.sol.
 * Layout: Two-column split. Left side: File list. Right side: Cryptographic audit trail.
 *
 * Audit Trail UI (The BSA §63 Timeline):
 *  - Vertical stepper component proving chain of custody.
 *  - Step 1: AES-256-GCM Capture. Display the 128-bit auth tag.
 *  - Step 2: IPFS Persistence. Display the CIDv1 in a monospace pill.
 *  - Step 3: Polygon L2 Merkle Anchor. Display the transaction hash.
 *  - Verification State: Emerald Shield (#00D084) checkmark icon on each step confirming mathematical validity.
 *
 * Action:
 *  - Secure button labeled "Decrypt Media Vault".
 *  - Microcopy disclaimer below it: "Requires active temporal cryptographic delegation via AccessGrant.sol".
 *
 * Strictly adheres to @she-raksha/design-tokens with zero heavy drop shadows.
 */

import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Database,
  FileCode,
  FileAudio,
  FileVideo,
  FileText,
  Clock,
  Layers,
  Unlock,
  AlertCircle,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { colors } from '@she-raksha/design-tokens';
import { MOCK_EVIDENCE_FILES, MockEvidenceFileItem } from '../data/mockInstitutionalData.js';

export interface EvidenceVerificationViewProps {
  onDecryptVault?: (fileId: string) => void;
}

export const EvidenceVerificationView: React.FC<EvidenceVerificationViewProps> = ({
  onDecryptVault,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(MOCK_EVIDENCE_FILES[0]?.fileId ?? 'ev-file-01');
  const [decryptedState, setDecryptedState] = useState<Record<string, boolean>>({});
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const selectedFile =
    MOCK_EVIDENCE_FILES.find((f) => f.fileId === selectedFileId) || MOCK_EVIDENCE_FILES[0];

  const handleDecrypt = (fileId: string) => {
    setIsDecrypting(true);
    setTimeout(() => {
      setDecryptedState((prev) => ({ ...prev, [fileId]: true }));
      setIsDecrypting(false);
      onDecryptVault?.(fileId);
    }, 800);
  };

  const getFileIcon = (mediaType: string) => {
    if (mediaType.includes('Audio')) return <FileAudio className="w-4 h-4 text-emerald-shield" />;
    if (mediaType.includes('Video')) return <FileVideo className="w-4 h-4 text-electric-amber" />;
    return <FileCode className="w-4 h-4 text-polygon-purple" />;
  };

  return (
    <div
      className="flex flex-col w-full h-full p-6 overflow-hidden select-none"
      style={{
        backgroundColor: colors.midnightObsidian, // #0A0D12
        color: colors.pureFrost, // #F8FAFC
        fontFamily: "'Inter', sans-serif",
      }}
      data-testid="evidence-verification-view"
    >
      {/* View Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-subtle-wire flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: colors.darkSlate,
                borderColor: colors.emeraldShield,
              }}
            >
              <Key className="w-5 h-5" style={{ color: colors.emeraldShield }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                BSA §63 Digital Evidence Custody & AccessGrant Decryption
              </h1>
              <p className="text-xs" style={{ color: colors.mutedSilver }}>
                Cryptographic Chain of Custody under Bharatiya Sakshya Adhiniyam, 2023
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(0, 208, 132, 0.1)',
                borderColor: colors.emeraldShield,
                color: colors.emeraldShield,
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BSA §63 Statutory Compliance Pack: Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-12 gap-6 mt-5 flex-1 min-h-0 overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT SIDE: FILE LIST (40% width / 5 Cols) */}
        {/* ================================================================= */}
        <div
          className="col-span-5 flex flex-col p-4 rounded-xl border overflow-hidden"
          style={{
            backgroundColor: colors.darkSlate, // #121824
            borderColor: colors.subtleWire, // #222F3E
          }}
          data-testid="evidence-file-list"
        >
          <div className="flex items-center justify-between pb-3 border-b border-subtle-wire">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
              Encrypted Evidence Vault ({MOCK_EVIDENCE_FILES.length} Chunks)
            </span>
            <span className="text-[10px] font-mono text-dim-steel">AES-256-GCM</span>
          </div>

          {/* Scrollable File List */}
          <div className="flex flex-col gap-2.5 mt-3 overflow-y-auto flex-1 pr-1">
            {MOCK_EVIDENCE_FILES.map((file) => {
              const isSelected = file.fileId === selectedFile.fileId;
              const isDecrypted = decryptedState[file.fileId];

              return (
                <div
                  key={file.fileId}
                  onClick={() => setSelectedFileId(file.fileId)}
                  className="p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5"
                  style={{
                    backgroundColor: isSelected ? colors.midnightObsidian : 'rgba(10, 13, 18, 0.4)',
                    borderColor: isSelected ? colors.emeraldShield : colors.subtleWire,
                  }}
                  data-testid={`evidence-item-${file.fileId}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.mediaType)}
                      <span className="text-xs font-mono font-bold text-pure-frost truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </div>

                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                      style={{
                        backgroundColor: isDecrypted ? 'rgba(0, 208, 132, 0.2)' : 'rgba(34, 47, 62, 0.6)',
                        color: isDecrypted ? colors.emeraldShield : colors.dimSteel,
                      }}
                    >
                      {isDecrypted ? 'DECRYPTED' : 'ENCRYPTED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-silver pt-1">
                    <span>{file.mediaType} • {file.fileSize}</span>
                    <span className="font-mono text-[10px] text-dim-steel">{file.chunkCount} Chunks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT SIDE: CRYPTOGRAPHIC AUDIT TRAIL (7 Cols) */}
        {/* ================================================================= */}
        <div
          className="col-span-7 flex flex-col p-6 rounded-xl border overflow-y-auto justify-between"
          style={{
            backgroundColor: colors.darkSlate, // #121824
            borderColor: colors.subtleWire, // #222F3E
          }}
          data-testid="evidence-audit-trail"
        >
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-subtle-wire">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
                  BSA §63 Chain of Custody Timeline
                </span>
                <span className="text-sm font-mono font-bold text-pure-frost">
                  {selectedFile.fileName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono text-dim-steel">
                <Clock className="w-3.5 h-3.5 text-emerald-shield" />
                <span>{selectedFile.timestamp}</span>
              </div>
            </div>

            {/* Hardware Attestation Header Callout */}
            <div
              className="p-3.5 rounded-lg border flex items-center justify-between text-xs font-mono"
              style={{
                backgroundColor: colors.midnightObsidian,
                borderColor: colors.subtleWire,
              }}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-polygon-purple" style={{ color: colors.polygonPurple }} />
                <span className="text-dim-steel">TEE Attestation:</span>
                <span className="text-pure-frost font-bold">{selectedFile.teeType}</span>
              </div>
              <span className="text-emerald-shield font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedFile.securityLevel}
              </span>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* AUDIT TRAIL UI: VERTICAL STEPPER COMPONENT */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col gap-4 relative pl-3">
              {/* Stepper Connecting Line */}
              <div
                className="absolute top-4 bottom-4 left-7 w-0.5"
                style={{ backgroundColor: colors.subtleWire }}
              />

              {/* STEP 1: AES-256-GCM Capture */}
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.emeraldShield,
                  }}
                >
                  <Lock className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
                </div>

                <div
                  className="flex-1 p-3.5 rounded-lg border flex flex-col gap-1.5"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.subtleWire,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pure-frost">
                      Step 1: AES-256-GCM Capture
                    </span>
                    {/* Emerald Shield checkmark icon */}
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-shield"
                      style={{ color: colors.emeraldShield }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-silver">
                    Hardware StrongBox generated ephemeral symmetric key with Galois Counter Mode authenticated encryption.
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono text-dim-steel">128-bit Auth Tag:</span>
                    <span
                      className="text-xs font-mono text-emerald-shield px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: colors.darkSlate,
                        borderColor: colors.subtleWire,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {selectedFile.authTag128Bit}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEP 2: IPFS Persistence */}
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.emeraldShield,
                  }}
                >
                  <Database className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
                </div>

                <div
                  className="flex-1 p-3.5 rounded-lg border flex flex-col gap-1.5"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.subtleWire,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pure-frost">
                      Step 2: IPFS Persistence
                    </span>
                    {/* Emerald Shield checkmark icon */}
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-shield"
                      style={{ color: colors.emeraldShield }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-silver">
                    Streamed over mTLS to Pinata IPFS gateway cluster. Replicated across &gt;= 3 storage nodes.
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono text-dim-steel">CIDv1:</span>
                    {/* CIDv1 in a monospace pill */}
                    <span
                      className="text-xs font-mono text-pure-frost px-2.5 py-1 rounded-full border truncate max-w-sm"
                      style={{
                        backgroundColor: 'rgba(0, 208, 132, 0.1)',
                        borderColor: colors.emeraldShield,
                        color: colors.pureFrost,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      title={selectedFile.cidV1}
                    >
                      {selectedFile.cidV1}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEP 3: Polygon L2 Merkle Anchor */}
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.emeraldShield,
                  }}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
                </div>

                <div
                  className="flex-1 p-3.5 rounded-lg border flex flex-col gap-1.5"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    borderColor: colors.subtleWire,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pure-frost">
                      Step 3: Polygon L2 Merkle Anchor
                    </span>
                    {/* Emerald Shield checkmark icon */}
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-shield"
                      style={{ color: colors.emeraldShield }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-silver">
                    Immutable evidence hash committed to EvidenceRegistry.sol via gasless UserOperation.
                  </span>
                  <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                    <span className="text-[10px] font-mono text-dim-steel">Tx Hash:</span>
                    <span
                      className="text-polygon-purple truncate max-w-[280px]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      title={selectedFile.polygonTxHash}
                    >
                      {selectedFile.polygonTxHash}
                    </span>
                    <span className="text-dim-steel text-[10px]">
                      (Block #{selectedFile.blockNumber})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Area: "Decrypt Media Vault" */}
          <div className="flex flex-col gap-2 pt-5 border-t border-subtle-wire mt-4">
            <button
              onClick={() => handleDecrypt(selectedFile.fileId)}
              disabled={isDecrypting || decryptedState[selectedFile.fileId]}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] border hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: decryptedState[selectedFile.fileId]
                  ? 'rgba(0, 208, 132, 0.15)'
                  : colors.emeraldShield,
                borderColor: colors.emeraldShield,
                color: decryptedState[selectedFile.fileId]
                  ? colors.emeraldShield
                  : colors.midnightObsidian,
              }}
            >
              <Unlock className="w-4 h-4" />
              <span>
                {isDecrypting
                  ? 'Validating AccessGrant.sol Delegation...'
                  : decryptedState[selectedFile.fileId]
                  ? '✓ Media Vault Decrypted (Authorized Session)'
                  : 'Decrypt Media Vault'}
              </span>
            </button>

            {/* Required Microcopy Disclaimer */}
            <p
              className="text-center text-[11px] italic"
              style={{ color: colors.dimSteel }}
            >
              Requires active temporal cryptographic delegation via AccessGrant.sol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
