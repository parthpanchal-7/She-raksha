'use client';

/**
 * @she-raksha/web — View 2: NGO Escalations (/dashboard/ngo-escalations)
 *
 * Purpose: Display 48-hour early warnings and zero-knowledge (ZK) anonymous bystander reports.
 * Layout: Chronological feed of escalation dossiers.
 * Dossier Types:
 *  - Type A: 48-Hour Escrow Warning (Police delay, Badge: ⚠️ SP Escalation Pending).
 *  - Type B: Anonymous ZK Report (Bystander hazard reports).
 *
 * ZK Cryptographic UI (Zero PII):
 *  - No name, phone number, or raw GPS.
 *  - Reporter ID: Full-pill badge showing Poseidon Nullifier Hash in JetBrains Mono with Polygon Purple (#7B3FE4) outline.
 *  - Location: Obfuscated geohash-6 bucket (e.g. 'ttnf7z').
 *
 * Strictly adheres to @she-raksha/design-tokens with zero heavy drop shadows.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  EyeOff,
  Hash,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Send,
  Building2,
  FileCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { colors } from '@she-raksha/design-tokens';
import {
  MOCK_ESCROW_WARNINGS,
  MOCK_ZK_REPORTS,
  MockEscrowWarningItem,
  MockZKReportItem,
} from '../data/mockInstitutionalData.js';

export interface NGOEscalationsViewProps {
  onDispatchDossier?: (id: string) => void;
}

export const NGOEscalationsView: React.FC<NGOEscalationsViewProps> = ({ onDispatchDossier }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'warnings' | 'zk'>('all');
  const [dispatchedIds, setDispatchedIds] = useState<Record<string, boolean>>({});

  const handleDispatch = (id: string) => {
    setDispatchedIds((prev) => ({ ...prev, [id]: true }));
    onDispatchDossier?.(id);
  };

  return (
    <div
      className="flex flex-col w-full h-full p-6 overflow-y-auto select-none"
      style={{
        backgroundColor: colors.midnightObsidian, // #0A0D12
        color: colors.pureFrost, // #F8FAFC
        fontFamily: "'Inter', sans-serif",
      }}
      data-testid="ngo-escalations-view"
    >
      {/* View Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-subtle-wire">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: colors.darkSlate,
                borderColor: colors.polygonPurple,
              }}
            >
              <ShieldAlert className="w-5 h-5" style={{ color: colors.polygonPurple }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                NGO Escalations & Anonymous ZK Dossiers
              </h1>
              <p className="text-xs" style={{ color: colors.mutedSilver }}>
                Statutory BNSS §173(4) 48-Hour Alerts & Privacy-Preserving Bystander Reports
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: activeFilter === 'all' ? colors.darkSlate : 'transparent',
                borderColor: activeFilter === 'all' ? colors.polygonPurple : colors.subtleWire,
                color: activeFilter === 'all' ? colors.pureFrost : colors.mutedSilver,
              }}
            >
              All Dossiers ({MOCK_ESCROW_WARNINGS.length + MOCK_ZK_REPORTS.length})
            </button>
            <button
              onClick={() => setActiveFilter('warnings')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: activeFilter === 'warnings' ? colors.darkSlate : 'transparent',
                borderColor: activeFilter === 'warnings' ? colors.electricAmber : colors.subtleWire,
                color: activeFilter === 'warnings' ? colors.electricAmber : colors.mutedSilver,
              }}
            >
              48h Warnings ({MOCK_ESCROW_WARNINGS.length})
            </button>
            <button
              onClick={() => setActiveFilter('zk')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: activeFilter === 'zk' ? colors.darkSlate : 'transparent',
                borderColor: activeFilter === 'zk' ? colors.polygonPurple : colors.subtleWire,
                color: activeFilter === 'zk' ? colors.polygonPurple : colors.mutedSilver,
              }}
            >
              Anonymous ZK ({MOCK_ZK_REPORTS.length})
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Feed of Escalation Dossiers */}
      <div className="flex flex-col gap-4 mt-5 max-w-4xl">
        {/* ================================================================= */}
        {/* TYPE A DOSSIERS: 48-HOUR ESCROW WARNINGS */}
        {/* ================================================================= */}
        {(activeFilter === 'all' || activeFilter === 'warnings') &&
          MOCK_ESCROW_WARNINGS.map((warn) => (
            <div
              key={warn.id}
              className="p-5 rounded-xl border flex flex-col gap-3 transition-all"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                borderColor: colors.electricAmber, // #FF9F1C 1px border
              }}
              data-testid={`dossier-warning-${warn.id}`}
            >
              {/* Top Row: Dossier Badge & Reference */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Badge: ⚠️ SP Escalation Pending */}
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: 'rgba(255, 159, 28, 0.15)',
                      borderColor: colors.electricAmber,
                      color: colors.electricAmber,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>⚠️</span>
                    <span>SP Escalation Pending</span>
                  </span>

                  <span
                    className="text-xs font-mono font-bold text-pure-frost"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    eFIR-2026-BNSS173-{warn.efirDisplayId}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-dim-steel">
                  <Clock className="w-3.5 h-3.5 text-electric-amber" />
                  <span>{warn.hoursElapsed}h elapsed without police registration</span>
                </div>
              </div>

              {/* Dossier Body: Location & Delaying Police Station */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-dim-steel uppercase">
                    Incident Location & Sections
                  </span>
                  <span className="text-pure-frost font-medium">{warn.location}</span>
                  <span className="text-muted-silver">{warn.bnsSections.join(' • ')}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-dim-steel uppercase">
                    Delaying Police Station Jurisdiction
                  </span>
                  <span className="text-pure-frost font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-dim-steel" />
                    {warn.delayingStation}
                  </span>
                  <span className="text-electric-amber font-mono text-[11px]">
                    Automatic BNSS §173(4) SP Escalation: {warn.spEscalationAt}
                  </span>
                </div>
              </div>

              {/* Accredited Legal Aid NGOs Synchronized */}
              <div
                className="p-3 rounded-lg border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: colors.midnightObsidian,
                  borderColor: colors.subtleWire,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-dim-steel uppercase">
                    NGO Webhook Relays:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {warn.ngoNotified.map((ngo) => (
                      <span
                        key={ngo}
                        className="px-2 py-0.5 rounded text-[11px] font-mono border"
                        style={{
                          borderColor: colors.subtleWire,
                          color: colors.pureFrost,
                        }}
                      >
                        ✓ {ngo}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDispatch(warn.id)}
                  className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95"
                  style={{
                    backgroundColor: colors.subtleWire,
                    color: colors.pureFrost,
                    borderColor: colors.subtleWire,
                  }}
                >
                  <Send className="w-3 h-3" />
                  <span>
                    {dispatchedIds[warn.id] ? 'Dossier Dispatched' : 'Dispatch Legal Aid Dossier'}
                  </span>
                </button>
              </div>
            </div>
          ))}

        {/* ================================================================= */}
        {/* TYPE B DOSSIERS: ANONYMOUS ZK REPORTS */}
        {/* ================================================================= */}
        {(activeFilter === 'all' || activeFilter === 'zk') &&
          MOCK_ZK_REPORTS.map((zk) => (
            <div
              key={zk.submissionId}
              className="p-5 rounded-xl border flex flex-col gap-3.5 transition-all"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                borderColor: colors.subtleWire, // 1px Subtle Wire border
              }}
              data-testid={`dossier-zk-${zk.submissionId}`}
            >
              {/* Top Row: ZK Header & Cryptographic Verifier Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: 'rgba(123, 63, 228, 0.15)',
                      borderColor: colors.polygonPurple,
                      color: colors.polygonPurple,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Anonymous ZK Bystander Report</span>
                  </span>

                  <span
                    className="text-xs font-mono text-dim-steel"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {zk.submissionId}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono text-emerald-shield border-emerald-shield/30 bg-emerald-shield/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>✓ Groth16 zk-SNARK Verified</span>
                </div>
              </div>

              {/* ZK Cryptographic UI (Zero PII: Poseidon Nullifier Hash + Geohash-6 Bucket) */}
              <div
                className="p-4 rounded-xl border flex flex-col gap-3"
                style={{
                  backgroundColor: colors.midnightObsidian,
                  borderColor: colors.subtleWire,
                }}
              >
                {/* 1. Reporter ID: Full-pill badge showing Poseidon Nullifier Hash with Polygon Purple outline */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-dim-steel uppercase">
                    Reporter ID (Zero-Knowledge Identity Commitment):
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1.5 rounded-full border text-xs font-mono font-bold text-pure-frost flex items-center gap-2 overflow-x-auto max-w-full"
                      style={{
                        backgroundColor: 'rgba(123, 63, 228, 0.10)',
                        borderColor: colors.polygonPurple, // #7B3FE4 Polygon Purple outline
                        color: colors.pureFrost,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      title={zk.poseidonNullifierHash}
                    >
                      <Hash className="w-3.5 h-3.5 text-polygon-purple flex-shrink-0" style={{ color: colors.polygonPurple }} />
                      <span className="truncate">{zk.poseidonNullifierHash}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-dim-steel">
                    Poseidon(identitySecret, incidentID) • Double-Reporting Prevented via ZKReportVerifier.sol
                  </span>
                </div>

                {/* 2. Location: Obfuscated geohash-6 bucket (e.g. ttnf7z) instead of exact GPS */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-subtle-wire">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-dim-steel uppercase">
                      Spatial Quantization (No Exact GPS):
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded border text-xs font-mono font-bold flex items-center gap-1.5"
                        style={{
                          backgroundColor: colors.darkSlate,
                          borderColor: colors.subtleWire,
                          color: colors.electricAmber,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>geohash-6: {zk.geohashBucket}</span>
                      </span>
                      <span className="text-[11px] text-muted-silver">
                        (~1.2km × 0.6km Coarse Zone)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-dim-steel uppercase">
                      Alleged Hazard Classification:
                    </span>
                    <span className="text-xs font-semibold text-pure-frost">
                      {zk.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-dim-steel">
                      1-Hour Anonymity Window Bucket: #{zk.timestampBucketEpochHour}
                    </span>
                  </div>
                </div>

                {/* On-Chain Anchor Details */}
                <div className="flex items-center justify-between pt-2 border-t border-subtle-wire text-[10px] font-mono text-dim-steel">
                  <span>Polygon L2 Tx: {zk.onChainTxHash.slice(0, 22)}...</span>
                  <span className="text-polygon-purple">ZKey: {zk.zkeyVersion}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

