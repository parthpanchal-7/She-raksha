/**
 * @she-raksha/web — Institutional Command & Compliance Dashboard
 *
 * Implements:
 *  - 1920x1080 Zero-Overflow Widescreen Layout
 *  - Header Navigation with Real-Time Telemetry Synchronization (h-16, #222F3E border)
 *  - Left-Hand Sidebar Navigation (260px, Subtle Wire border, active Dark Slate highlight)
 *  - 60% Geospatial Radar & PostGIS H3 Canvas with concentric 800m geofence & community guardians
 *  - Active Incident Overlay with WSS connection & Base91 telemetry tracking (#3950:1 #980021)
 *  - 40% Statutory Escalation & Escrow Monitor with 72-Hour BNSS §173 Countdown (68:42:15)
 *  - Trust & Proof JetBrains Mono Pill Badges (AES-256-GCM, IPFS CIDv1, Polygon L2 hash)
 *  - Audit & Escrow Monitor Panel with Aadhaar e-Sign and BSA §63 Certificate Verification
 */

import React, { useState, useEffect } from 'react';
import {
  Map as MapIcon,
  AlertCircle,
  FileText,
  ShieldAlert,
  Key,
  Settings,
  CheckCircle2,
  Clock,
  Radio,
  Layers,
  Plus,
  Minus,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Database,
  Wifi,
  Lock,
} from 'lucide-react';
import { colors } from '@she-raksha/design-tokens';

export interface IncidentEscrowItem {
  complaintId: number;
  incidentId: string;
  bnsSection: string;
  hoursRemaining: number;
  minutesRemaining: number;
  isSigned: boolean;
  policeAcknowledged: boolean;
  isEscalatedToSP: boolean;
  h3Index: string;
  coarseLocation: string;
  guardianCountNearby: number;
  bsa63CertId: string;
}

export interface InstitutionalDashboardProps {
  initialIncidents?: IncidentEscrowItem[];
  onAcknowledgePolice?: (complaintId: number) => void;
  onTriggerSPEscalation?: (complaintId: number) => void;
  onVerifyBSA63?: (certId: string) => void;
}

export const InstitutionalDashboard: React.FC<InstitutionalDashboardProps> = ({
  initialIncidents = [
    {
      complaintId: 101,
      incidentId: 'inc-dl-2026-98124',
      bnsSection: 'BNS §74 (Assault) & §78 (Stalking)',
      hoursRemaining: 68,
      minutesRemaining: 42,
      isSigned: true,
      policeAcknowledged: false,
      isEscalatedToSP: false,
      h3Index: '893da11462fffff',
      coarseLocation: 'Connaught Place Outer Circle, New Delhi',
      guardianCountNearby: 5,
      bsa63CertId: 'BSA63-CERT-AMOY-20261103-0982',
    },
    {
      complaintId: 102,
      incidentId: 'inc-dl-2026-98125',
      bnsSection: 'BNS §75 (Sexual Harassment)',
      hoursRemaining: 18,
      minutesRemaining: 10,
      isSigned: true,
      policeAcknowledged: false,
      isEscalatedToSP: false,
      h3Index: '893da11463fffff',
      coarseLocation: 'Janpath Metro Corridor, New Delhi',
      guardianCountNearby: 3,
      bsa63CertId: 'BSA63-CERT-AMOY-20261103-0983',
    },
  ],
  onAcknowledgePolice,
  onTriggerSPEscalation,
  onVerifyBSA63,
}) => {
  const [incidents, setIncidents] = useState<IncidentEscrowItem[]>(initialIncidents);
  const [activeTab, setActiveTab] = useState<string>('e-fir');
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [verifiedCert, setVerifiedCert] = useState<string | null>(null);
  const [syncTime, setSyncTime] = useState<number>(123);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number>(
    initialIncidents[0]?.complaintId ?? 101
  );

  const activeCase =
    incidents.find((i) => i.complaintId === selectedComplaintId) ||
    incidents[0] ||
    initialIncidents[0];

  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: initialIncidents[0]?.hoursRemaining ?? 68,
    minutes: initialIncidents[0]?.minutesRemaining ?? 42,
    seconds: 15,
  });

  useEffect(() => {
    if (activeCase) {
      setCountdown({
        hours: activeCase.hoursRemaining,
        minutes: activeCase.minutesRemaining,
        seconds: 15,
      });
    }
  }, [activeCase?.complaintId]);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
      setSyncTime((prev) => (prev >= 999 ? 100 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAcknowledge = (id: number) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.complaintId === id ? { ...item, policeAcknowledged: true } : item
      )
    );
    onAcknowledgePolice?.(id);
  };

  const handleTriggerSP = (id: number) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.complaintId === id ? { ...item, isEscalatedToSP: true } : item
      )
    );
    onTriggerSPEscalation?.(id);
  };

  const handleVerify = (certId: string) => {
    setVerifiedCert(certId);
    onVerifyBSA63?.(certId);
  };

  return (
    <div
      data-testid="institutional-dashboard"
      className="flex flex-col w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: colors.midnightObsidian, // #0A0D12
        color: colors.pureFrost, // #F8FAFC
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. HEADER NAVIGATION (Height 64px, 1px solid #222F3E) */}
      {/* --------------------------------------------------------------------- */}
      <header
        className="flex items-center justify-between px-6 h-16 w-full z-20 flex-shrink-0"
        style={{
          height: '64px',
          borderBottom: `1px solid ${colors.subtleWire}`, // #222F3E
          backgroundColor: colors.midnightObsidian,
        }}
      >
        {/* Left: Brand Name & Sub-label */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm"
              style={{
                backgroundColor: colors.crimsonCoral, // #FF3B5C
                boxShadow: '0 0 16px rgba(255, 59, 92, 0.35)',
              }}
            >
              <ShieldAlert className="w-5 h-5 text-pure-frost" />
            </div>
            <span
              className="text-xl font-bold tracking-wider"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                color: colors.pureFrost, // #F8FAFC
                letterSpacing: '0.05em',
              }}
            >
              SHE-RAKSHA
            </span>
          </div>

          <div
            className="h-4 w-px"
            style={{ backgroundColor: colors.subtleWire }}
          />

          <span
            className="text-xs font-medium"
            style={{ color: colors.mutedSilver }} // #94A3B8
          >
            शी-रक्षा | Institutional Command & Compliance Hub
          </span>
        </div>

        {/* Right-Side Status Panel */}
        <div className="flex items-center gap-4">
          {/* Badge: Active Platform Status */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(0, 208, 132, 0.1)',
              border: `1px solid ${colors.emeraldShield}`, // #00D084
              color: colors.emeraldShield,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.emeraldShield }}
            />
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Platform Status</span>
          </div>

          {/* Telemetry Synchronicity Label */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono"
            style={{
              backgroundColor: colors.darkSlate, // #121824
              border: `1px solid ${colors.subtleWire}`, // #222F3E
              color: colors.mutedSilver,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-shield animate-pulse" style={{ color: colors.emeraldShield }} />
            <span>{`Time-Synchronization: ${syncTime}`}</span>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. BODY CONTENT: SIDEBAR + WIDESCREEN 16:9 SPLIT PANES */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
        {/* ------------------------------------------------------------------- */}
        {/* LEFT-HAND SIDEBAR NAVIGATION (Width 260px, Subtle Wire border) */}
        {/* ------------------------------------------------------------------- */}
        <aside
          className="flex flex-col justify-between py-5 px-3 h-full flex-shrink-0"
          style={{
            width: '260px',
            minWidth: '260px',
            borderRight: `1px solid ${colors.subtleWire}`, // #222F3E
            backgroundColor: colors.midnightObsidian, // #0A0D12
          }}
        >
          {/* Sidebar Top: Heading & Navigation Menu Items */}
          <div className="flex flex-col gap-4">
            <div className="px-3">
              <span
                className="text-[10px] font-mono font-bold tracking-widest uppercase"
                style={{
                  color: colors.dimSteel, // #64748B
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                LEFT SIDEBAR NAVIGATION
              </span>
            </div>

            <nav className="flex flex-col gap-1.5" data-testid="sidebar-nav">
              {/* 1. Geospatial Radar */}
              <button
                onClick={() => setActiveTab('radar')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'radar'
                    ? 'shadow-sm'
                    : 'hover:bg-dark-slate/50'
                }`}
                style={{
                  backgroundColor: activeTab === 'radar' ? colors.darkSlate : 'transparent',
                  border: `1px solid ${activeTab === 'radar' ? colors.subtleWire : 'transparent'}`,
                  color: activeTab === 'radar' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <div className="flex items-center gap-3">
                  <MapIcon className="w-4 h-4 text-dim-steel" style={{ color: activeTab === 'radar' ? colors.crimsonCoral : colors.dimSteel }} />
                  <span>Geospatial Radar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>

              {/* 2. Active Incidents */}
              <button
                onClick={() => setActiveTab('incidents')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'incidents'
                    ? 'shadow-sm'
                    : 'hover:bg-dark-slate/50'
                }`}
                style={{
                  backgroundColor: activeTab === 'incidents' ? colors.darkSlate : 'transparent',
                  border: `1px solid ${activeTab === 'incidents' ? colors.subtleWire : 'transparent'}`,
                  color: activeTab === 'incidents' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4" style={{ color: colors.crimsonCoral }} />
                  <span>Active Incidents</span>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{ backgroundColor: colors.crimsonCoral, color: colors.pureFrost }}
                >
                  LIVE
                </span>
              </button>

              {/* 3. e-FIR Escrow Queue (Active Highlight with Dark Slate and Amber Badge) */}
              <button
                onClick={() => setActiveTab('e-fir')}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all shadow-sm"
                style={{
                  backgroundColor: colors.darkSlate, // #121824 Active Highlight
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                  color: colors.pureFrost,
                }}
                data-testid="nav-efir-escrow-queue"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" style={{ color: colors.electricAmber }} />
                  <span className="font-semibold">e-FIR Escrow Queue</span>
                </div>
                {/* Electric Amber Badge '2' */}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: 'rgba(255, 159, 28, 0.15)',
                    border: `1px solid ${colors.electricAmber}`, // #FF9F1C
                    color: colors.electricAmber,
                  }}
                >
                  2
                </span>
              </button>

              {/* 4. NGO Escalations */}
              <button
                onClick={() => setActiveTab('ngo')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'ngo'
                    ? 'shadow-sm'
                    : 'hover:bg-dark-slate/50'
                }`}
                style={{
                  backgroundColor: activeTab === 'ngo' ? colors.darkSlate : 'transparent',
                  border: `1px solid ${activeTab === 'ngo' ? colors.subtleWire : 'transparent'}`,
                  color: activeTab === 'ngo' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" style={{ color: colors.polygonPurple }} />
                  <span>NGO Escalations</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>

              {/* 5. Evidence Verification */}
              <button
                onClick={() => setActiveTab('evidence')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'evidence'
                    ? 'shadow-sm'
                    : 'hover:bg-dark-slate/50'
                }`}
                style={{
                  backgroundColor: activeTab === 'evidence' ? colors.darkSlate : 'transparent',
                  border: `1px solid ${activeTab === 'evidence' ? colors.subtleWire : 'transparent'}`,
                  color: activeTab === 'evidence' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4" style={{ color: colors.emeraldShield }} />
                  <span>Evidence Verification</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>

              {/* 6. Settings */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'shadow-sm'
                    : 'hover:bg-dark-slate/50'
                }`}
                style={{
                  backgroundColor: activeTab === 'settings' ? colors.darkSlate : 'transparent',
                  border: `1px solid ${activeTab === 'settings' ? colors.subtleWire : 'transparent'}`,
                  color: activeTab === 'settings' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" style={{ color: colors.dimSteel }} />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            </nav>
          </div>

          {/* Sidebar Bottom: Secondary Settings Toggle Card */}
          <div
            className="p-3.5 rounded-xl flex flex-col gap-2.5"
            style={{
              backgroundColor: colors.darkSlate, // #121824
              border: `1px solid ${colors.subtleWire}`, // #222F3E
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-pure-frost flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-polygon-purple" style={{ color: colors.polygonPurple }} />
                TEE Enclave Active
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.emeraldShield }}
              />
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: colors.dimSteel }}>
              AWS Nitro TEE • StrongBox v3.4 Hardware Keymaster Synchronized
            </p>
            <div
              className="pt-2 flex items-center justify-between text-[10px] font-mono border-t"
              style={{
                borderColor: colors.subtleWire,
                color: colors.mutedSilver,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span>Build v1.0.0</span>
              <span className="text-emerald-shield" style={{ color: colors.emeraldShield }}>
                BNSS/BSA SEC
              </span>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* PRIMARY LAYOUT PANE (WIDESCREEN 16:9 SPLIT) */}
        {/* ------------------------------------------------------------------- */}
        <main className="flex flex-1 h-full overflow-hidden">
          {/* ================================================================= */}
          {/* LEFT PANEL (60% width): Geospatial & SOS Intake */}
          {/* ================================================================= */}
          <section
            className="relative flex flex-col h-full overflow-hidden"
            style={{
              width: '60%',
              backgroundColor: '#080B0F',
            }}
          >
            {/* Live Map Canvas / 2D H3 Hexagonal Grid & PostGIS Radar Overlay */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* SVG Hexagonal H3 Grid & Radar concentric circles */}
              <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Hexagon Pattern */}
                  <pattern
                    id="h3-hex-grid"
                    width="60"
                    height="104"
                    patternUnits="userSpaceOnUse"
                    patternTransform="scale(0.8)"
                  >
                    <path
                      d="M30 0 L60 17.3 L60 52 L30 69.3 L0 52 L0 17.3 Z M30 104 L60 86.7 L60 52 L30 69.3 L0 52 L0 86.7 Z"
                      fill="none"
                      stroke={colors.subtleWire}
                      strokeWidth="0.75"
                      strokeOpacity="0.4"
                    />
                  </pattern>

                  {/* Radial Pulse Gradient for 800m Geofence */}
                  <radialGradient id="geofence-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={colors.crimsonCoral} stopOpacity="0.18" />
                    <stop offset="50%" stopColor={colors.emeraldShield} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={colors.emeraldShield} stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Grid Canvas */}
                <rect width="100%" height="100%" fill="url(#h3-hex-grid)" />

                {/* Simulated Geofence Search Rings (Concentric Circles) */}
                <g transform="translate(560, 420)">
                  {/* Outer 2000m Configurable Ceiling */}
                  <circle
                    r="340"
                    fill="none"
                    stroke={colors.subtleWire}
                    strokeWidth="1"
                    strokeDasharray="4 8"
                    strokeOpacity="0.5"
                  />
                  {/* Canonical 800m Active Dispatch Radius Ring */}
                  <circle
                    r="210"
                    fill="url(#geofence-glow)"
                    stroke={colors.crimsonCoral}
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    className="animate-spin"
                    style={{ animationDuration: '40s' }}
                  />
                  {/* Inner 400m Proximity Circle */}
                  <circle
                    r="110"
                    fill="none"
                    stroke={colors.emeraldShield}
                    strokeWidth="1"
                    strokeOpacity="0.5"
                  />

                  {/* Active Incident Victim Center Marker */}
                  <circle
                    r="10"
                    fill={colors.crimsonCoral}
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <circle r="7" fill={colors.crimsonCoral} />
                  <circle r="3" fill={colors.pureFrost} />

                  {/* Community Guardians (Small Emerald Shield Dots within boundary) */}
                  {/* Guardian 1 */}
                  <g transform="translate(-80, -90)">
                    <circle r="6" fill={colors.emeraldShield} fillOpacity="0.25" className="animate-ping" />
                    <circle r="4" fill={colors.emeraldShield} />
                    <text x="8" y="4" fill={colors.emeraldShield} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                      G-01 (180m)
                    </text>
                  </g>
                  {/* Guardian 2 */}
                  <g transform="translate(110, -60)">
                    <circle r="6" fill={colors.emeraldShield} fillOpacity="0.25" className="animate-ping" />
                    <circle r="4" fill={colors.emeraldShield} />
                    <text x="8" y="4" fill={colors.emeraldShield} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                      G-02 (290m)
                    </text>
                  </g>
                  {/* Guardian 3 */}
                  <g transform="translate(-120, 75)">
                    <circle r="6" fill={colors.emeraldShield} fillOpacity="0.25" className="animate-ping" />
                    <circle r="4" fill={colors.emeraldShield} />
                    <text x="8" y="4" fill={colors.emeraldShield} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                      G-03 (420m)
                    </text>
                  </g>
                  {/* Guardian 4 */}
                  <g transform="translate(60, 130)">
                    <circle r="6" fill={colors.emeraldShield} fillOpacity="0.25" className="animate-ping" />
                    <circle r="4" fill={colors.emeraldShield} />
                    <text x="8" y="4" fill={colors.emeraldShield} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                      G-04 (510m)
                    </text>
                  </g>
                </g>
              </svg>

              {/* Live Zoom & Map Layer Floating Controls (Top Right Overlay) */}
              <div
                className="absolute top-5 right-5 flex flex-col gap-1.5 p-1 rounded-xl shadow-lg z-10"
                style={{
                  backgroundColor: colors.darkSlate, // #121824
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                }}
              >
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 1, 8))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />
                <button
                  onClick={() => setZoomLevel(14)}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-emerald-shield"
                  style={{ color: colors.emeraldShield }}
                  title="Reset Center"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Geospatial Radar Header & Telemetry Overlay (Top Left) */}
              <div
                className="absolute top-5 left-5 flex flex-col gap-1 p-3 rounded-xl shadow-md z-10 max-w-sm"
                style={{
                  backgroundColor: 'rgba(18, 24, 36, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${colors.subtleWire}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: colors.crimsonCoral }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-pure-frost">
                    PostGIS Proximity Radar (800m)
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: 'rgba(0, 208, 132, 0.15)',
                      border: `1px solid ${colors.emeraldShield}`,
                      color: colors.emeraldShield,
                    }}
                  >
                    800m Geofence Boundary Active
                  </span>
                </div>
                <div
                  className="text-[11px] font-mono leading-tight mt-1"
                  style={{
                    color: colors.mutedSilver,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  28.6139° N, 77.2090° E • {activeCase.coarseLocation} • H3 Res-9: {activeCase.h3Index}
                </div>
                <div className="text-[10px] text-dim-steel">
                  GiST ST_DWithin: 5 Active Guardians In Radius
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* CARD: ACTIVE INCIDENT OVERLAY (Bottom of 60% Left Panel) */}
              {/* Dark Slate surface, Subtle Wire border, Crimson Coral glowing indicator */}
              {/* --------------------------------------------------------------- */}
              <div
                className="absolute bottom-5 left-5 right-5 p-4 rounded-xl shadow-2xl z-10 transition-all"
                style={{
                  backgroundColor: colors.darkSlate, // #121824
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(255, 59, 92, 0.15)',
                }}
                data-testid="active-incident-overlay"
              >
                {/* Header: ACTIVE INCIDENT (Crimson Coral alert #FF3B5C) */}
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: colors.subtleWire }}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full animate-ping"
                      style={{ backgroundColor: colors.crimsonCoral }}
                    />
                    <h3
                      className="text-sm font-bold tracking-wider"
                      style={{
                        color: colors.crimsonCoral, // #FF3B5C
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      ACTIVE INCIDENT
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                      style={{
                        backgroundColor: 'rgba(255, 59, 92, 0.15)',
                        color: colors.crimsonCoral,
                        border: `1px solid rgba(255, 59, 92, 0.3)`,
                      }}
                    >
                      {activeCase.incidentId}
                    </span>
                  </div>

                  {/* Active tracking badge: Connection Status • WSS */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold"
                      style={{
                        backgroundColor: 'rgba(0, 208, 132, 0.12)',
                        border: `1px solid ${colors.emeraldShield}`,
                        color: colors.emeraldShield,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldShield }} />
                      • WSS
                    </span>
                  </div>
                </div>

                {/* Content: Telemetry and Rate with Base91 packet tracking */}
                <div className="grid grid-cols-4 gap-4 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider block mb-0.5" style={{ color: colors.dimSteel }}>
                      Telemetry & Location
                    </span>
                    <span className="font-mono text-pure-frost font-medium block truncate" title={activeCase.coarseLocation}>
                      {activeCase.coarseLocation}
                    </span>
                    <span className="text-[10px] font-mono text-dim-steel">
                      GPS HDOP: 1.1 • IMU 2.8g
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider block mb-0.5" style={{ color: colors.dimSteel }}>
                      Rate
                    </span>
                    <span className="font-mono text-pure-frost font-medium">
                      5s Chunks • 128kbps AAC
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider block mb-0.5" style={{ color: colors.dimSteel }}>
                      Base91 Packet Tracking
                    </span>
                    <span
                      className="font-mono px-2 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: colors.midnightObsidian,
                        border: `1px solid ${colors.subtleWire}`,
                        color: colors.electricAmber,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      #3950:1 #980021
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider block mb-0.5" style={{ color: colors.dimSteel }}>
                      Dispatch Mode
                    </span>
                    <span className="font-mono text-emerald-shield font-medium" style={{ color: colors.emeraldShield }}>
                      Rail A (WSS) Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* RIGHT PANEL (40% width): Active Statutory Escalation & Escrow Monitor */}
          {/* ================================================================= */}
          <section
            className="flex flex-col h-full overflow-y-auto p-6 gap-5 flex-shrink-0"
            style={{
              width: '40%',
              borderLeft: `1px solid ${colors.subtleWire}`, // #222F3E
              backgroundColor: colors.midnightObsidian, // #0A0D12
            }}
            data-testid="right-detail-escrow-panel"
          >
            {/* Panel Headings: Microcopy & Item Heading */}
            <div className="flex flex-col gap-1">
              <span
                className="text-[10px] font-mono font-bold tracking-widest uppercase"
                style={{
                  color: colors.dimSteel, // #64748B
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                RIGHT DETAIL & ESCROW PANEL
              </span>
              <h2
                className="text-lg font-semibold tracking-wide flex items-center justify-between"
                style={{
                  color: colors.pureFrost, // #F8FAFC
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span>Active BNSS §173 e-FIR | SemiBold</span>
                <span className="text-xs font-mono font-normal" style={{ color: colors.dimSteel }}>
                  {activeCase.coarseLocation}
                </span>
              </h2>
            </div>

            {/* Active Escrow Queue List */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: colors.dimSteel }}>
                Active Escrow Queue ({incidents.length})
              </span>
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                {incidents.map((inc) => {
                  const isUrgent = inc.hoursRemaining <= 48;
                  const isSelected = inc.complaintId === activeCase.complaintId;
                  return (
                    <div
                      key={inc.complaintId}
                      onClick={() => setSelectedComplaintId(inc.complaintId)}
                      className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all text-xs"
                      style={{
                        backgroundColor: isSelected ? colors.darkSlate : colors.midnightObsidian,
                        border: `1px solid ${isSelected ? colors.electricAmber : colors.subtleWire}`,
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-pure-frost">{inc.incidentId}</span>
                          {isUrgent && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{ backgroundColor: 'rgba(255, 159, 28, 0.2)', color: colors.electricAmber }}
                            >
                              48h NGO Early Warning
                            </span>
                          )}
                        </div>
                        <span className="text-[11px]" style={{ color: colors.mutedSilver }}>
                          {inc.coarseLocation} • {inc.bnsSection}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold" style={{ color: isUrgent ? colors.electricAmber : colors.emeraldShield }}>
                          {`${inc.hoursRemaining}h ${inc.minutesRemaining}m remaining`}
                        </span>
                        <span className="block text-[10px]" style={{ color: colors.dimSteel }}>
                          {inc.guardianCountNearby} guardians nearby
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* TIMER CONTAINER: 72-Hour Statutory Countdown Timer Banner */}
            {/* In Dark Slate with Electric Amber (#FF9F1C) solid 1px border */}
            {/* Countdown numbers 68:42:15 in extra large monospace/Sans */}
            {/* --------------------------------------------------------------- */}
            <div
              className="p-5 rounded-xl flex flex-col gap-2 relative overflow-hidden"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                border: `1px solid ${colors.electricAmber}`, // #FF9F1C solid 1px border
                boxShadow: '0 4px 20px rgba(255, 159, 28, 0.1)',
              }}
              data-testid="72hr-timer-container"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: colors.electricAmber }}
                >
                  <Clock className="w-4 h-4" />
                  72-Hour Statutory Countdown Timer
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 159, 28, 0.15)',
                    color: colors.electricAmber,
                  }}
                >
                  BNSS §173(1)
                </span>
              </div>

              {/* Extra Large Monospace Countdown Numbers: 68:42:15 */}
              <div
                className="text-4xl font-bold tracking-wider my-1"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: colors.electricAmber, // #FF9F1C
                }}
              >
                {`${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`}
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: 'rgba(255, 159, 28, 0.2)' }}>
                <span style={{ color: colors.mutedSilver }}>
                  Filing Deadline: 72h from Distress Activation
                </span>
                <span style={{ color: colors.dimSteel }}>
                  48h NGO Early Warning Triggered
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* TEXT PANEL: Mapped Statutory Provisions of Active Case */}
            {/* • BNSS Section 173(1) - Zero-FIR */}
            {/* • BNS Section 74 (Assault) */}
            {/* • BNS Section 78 (Stalking) */}
            {/* --------------------------------------------------------------- */}
            <div
              className="p-4 rounded-xl flex flex-col gap-2.5"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                border: `1px solid ${colors.subtleWire}`, // #222F3E
              }}
              data-testid="statutory-provisions-panel"
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.pureFrost }}>
                Mapped Statutory Provisions
              </span>
              <div className="flex flex-col gap-2 text-xs font-medium">
                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: colors.midnightObsidian, border: `1px solid ${colors.subtleWire}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.emeraldShield }} />
                  <span className="text-pure-frost font-mono font-semibold">
                    • BNSS Section 173(1) - Zero-FIR
                  </span>
                  <span className="ml-auto text-[10px]" style={{ color: colors.dimSteel }}>
                    Automated Registration
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: colors.midnightObsidian, border: `1px solid ${colors.subtleWire}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.crimsonCoral }} />
                  <span className="text-pure-frost font-mono font-semibold">
                    • BNS Section 74 (Assault)
                  </span>
                  <span className="ml-auto text-[10px] font-bold" style={{ color: colors.crimsonCoral }}>
                    Cognizable / Non-Bailable
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: colors.midnightObsidian, border: `1px solid ${colors.subtleWire}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.polygonPurple }} />
                  <span className="text-pure-frost font-mono font-semibold">
                    • BNS Section 78 (Stalking)
                  </span>
                  <span className="ml-auto text-[10px]" style={{ color: colors.polygonPurple }}>
                    Cyber & Physical Tailing
                  </span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CARD COMPONENT: TRUST & PROOF BADGES PANEL */}
            {/* Label: Visible monospace Jeti pill badges: (Muted Silver #94A3B8) */}
            {/* ✓ AES-256-GCM, ✓ IPFS CIDv1: bafybeicv5..., ✓ Polygon L2 hash: 0x89d2c... */}
            {/* --------------------------------------------------------------- */}
            <div
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                border: `1px solid ${colors.subtleWire}`, // #222F3E
              }}
              data-testid="trust-proof-badges-panel"
            >
              <span
                className="text-xs font-mono block"
                style={{
                  color: colors.mutedSilver, // #94A3B8
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Visible monospace Jeti pill badges:
              </span>

              <div className="flex flex-wrap gap-2.5">
                {/* Badge 1: ✓ AES-256-GCM */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase"
                  style={{
                    backgroundColor: 'rgba(0, 208, 132, 0.1)',
                    border: `1px solid ${colors.emeraldShield}`, // #00D084
                    color: colors.emeraldShield,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  data-testid="badge-aes-gcm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ AES-256-GCM</span>
                </div>

                {/* Badge 2: ✓ IPFS CIDv1: bafybeicv5... */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    border: `1px solid ${colors.subtleWire}`, // #222F3E
                    color: colors.emeraldShield,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  data-testid="badge-ipfs-cid"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ IPFS CIDv1: bafybeicv5...</span>
                </div>

                {/* Badge 3: ✓ Polygon L2 hash: 0x89d2c... */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider"
                  style={{
                    backgroundColor: 'rgba(123, 63, 228, 0.12)',
                    border: `1px solid ${colors.polygonPurple}`, // #7B3FE4 border
                    color: colors.polygonPurple,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  data-testid="badge-polygon-l2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Polygon L2 hash: 0x89d2c...</span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CARD COMPONENT: AUDIT & ESCROW MONITOR PANEL */}
            {/* Status text: ⚠️ Superintendent of Police (SP) Alert Scheduled: 72 hours */}
            {/* Historical Checkpoint mapping dates (72 Nov, 2023, 16 PM) */}
            {/* Status items: Aadhaar e-Sign checking, BSA §63 Digital Evidence */}
            {/* --------------------------------------------------------------- */}
            <div
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                border: `1px solid ${colors.subtleWire}`, // #222F3E
              }}
              data-testid="audit-escrow-monitor-panel"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-pure-frost">
                  Audit & Escrow Monitor
                </span>
                <span className="text-[10px] font-mono text-dim-steel">
                  ComplaintEscrow.sol #101
                </span>
              </div>

              {/* Active Escalation Status Text */}
              <div
                className="p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(255, 159, 28, 0.1)',
                  border: `1px solid rgba(255, 159, 28, 0.3)`,
                  color: colors.electricAmber,
                }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>⚠️ Superintendent of Police (SP) Alert Scheduled: 72 hours</span>
              </div>

              {/* Historical Checkpoints */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: colors.dimSteel }}>
                  Historical Checkpoints
                </span>
                <div
                  className="flex items-center justify-between p-2 rounded-lg font-mono text-[11px]"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    border: `1px solid ${colors.subtleWire}`,
                    color: colors.mutedSilver,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <span>Trigger Ingestion Timestamp</span>
                  <span className="text-pure-frost font-bold">72 Nov, 2023, 16 PM</span>
                </div>
              </div>

              {/* Status Items: Aadhaar e-Sign & Section 63 BSA Digital Evidence */}
              <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: colors.subtleWire }}>
                {/* Item 1: Aadhaar e-Sign checking */}
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: colors.mutedSilver }}>
                    Aadhaar e-Sign checking
                  </span>
                  <span
                    className="flex items-center gap-1 font-bold text-xs"
                    style={{ color: colors.emeraldShield }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ Verified
                  </span>
                </div>

                {/* Item 2: Section 63 BSA Digital Evidence */}
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: colors.mutedSilver }}>
                    Section 63 BSA Digital Evidence certificate compilation progress
                  </span>
                  <span
                    className="flex items-center gap-1 font-bold text-xs"
                    style={{ color: colors.emeraldShield }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons: Acknowledge FIR & Trigger SP Escalation */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {!activeCase.policeAcknowledged ? (
                  <button
                    data-testid={`btn-ack-${activeCase.complaintId}`}
                    onClick={() => handleAcknowledge(activeCase.complaintId)}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: colors.emeraldShield,
                      color: colors.midnightObsidian,
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Record FIR Ack (SHO)
                  </button>
                ) : (
                  <div
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: 'rgba(0, 208, 132, 0.15)',
                      border: `1px solid ${colors.emeraldShield}`,
                      color: colors.emeraldShield,
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    FIR Acknowledged ✓
                  </div>
                )}

                <button
                  data-testid={`btn-verify-bsa-${activeCase.complaintId}`}
                  onClick={() => handleVerify(activeCase.bsa63CertId)}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: colors.midnightObsidian,
                    border: `1px solid ${colors.polygonPurple}`,
                    color: colors.polygonPurple,
                  }}
                >
                  <Key className="w-3.5 h-3.5" />
                  Verify BSA §63
                </button>
              </div>
            </div>

            {/* Verified Modal/Card if open */}
            {verifiedCert && (
              <div
                className="p-3.5 rounded-xl flex flex-col gap-2 animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(0, 208, 132, 0.08)',
                  border: `1px solid ${colors.emeraldShield}`,
                }}
                data-testid="bsa63-verify-panel"
              >
                <div className="flex items-center justify-between text-xs font-bold" style={{ color: colors.emeraldShield }}>
                  <span>✓ BSA §63 CERTIFICATE ADMISSIBLE IN COURT</span>
                  <button
                    onClick={() => setVerifiedCert(null)}
                    className="text-dim-steel hover:text-pure-frost text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: colors.mutedSilver }}>
                  Cert ID: <strong className="text-pure-frost">{verifiedCert}</strong> • Hardware Enclave: Android StrongBox Keymaster • SHA-256 Merkle Chain: 100% Intact.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
