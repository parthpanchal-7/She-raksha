/**
 * @she-raksha/web — Institutional Command & Compliance Dashboard
 *
 * Implements:
 *  - 1920x1080 Zero-Overflow Widescreen Layout with Collapsible Sidebars (Full GIS Map View Mode)
 *  - Interactive Left-Hand Sidebar Navigation (active tab routing, collapse/expand toggle)
 *  - Realistic India National GIS Map with major command hubs (Delhi, Mumbai, Bengaluru, Kolkata, Hyderabad)
 *  - Tactical 800m PostGIS Radar (Connaught Place, New Delhi radial street geometry & Yamuna river corridor)
 *  - Dynamic Zoom and Scale controls with interactive guardian selection
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
  ChevronLeft,
  Database,
  Wifi,
  Lock,
  Maximize2,
  Minimize2,
  Globe,
  Compass,
  X,
  UserCheck,
  Activity,
  Sliders,
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

  // New Interactive Panel & GIS States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isFullMapView, setIsFullMapView] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'tactical' | 'national'>('tactical');
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

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

  // Sidebar Tab Click Handler with Responsive View Switching
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    if (tabKey === 'radar') {
      setMapMode('tactical');
      setSelectedGuardian(null);
    } else if (tabKey === 'ngo') {
      // Find urgent case if exists
      const urgent = incidents.find((i) => i.hoursRemaining <= 48);
      if (urgent) setSelectedComplaintId(urgent.complaintId);
    } else if (tabKey === 'evidence') {
      setVerifiedCert(activeCase.bsa63CertId);
      onVerifyBSA63?.(activeCase.bsa63CertId);
    } else if (tabKey === 'settings') {
      setShowSettingsModal(true);
    }
  };

  // Effective panel widths based on collapse states
  const showSidebar = !isFullMapView && !isSidebarCollapsed;
  const showRightPanel = !isFullMapView && !isRightPanelCollapsed;

  // Zoom scale calculations
  const zoomScale =
    mapMode === 'national' ? (zoomLevel / 14) * 0.9 : zoomLevel / 14;

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
        <div className="flex items-center gap-3">
          {/* Full Screen Map Toggle in Header */}
          <button
            onClick={() => {
              setIsFullMapView(!isFullMapView);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: isFullMapView
                ? 'rgba(123, 63, 228, 0.2)'
                : colors.darkSlate,
              border: `1px solid ${
                isFullMapView ? colors.polygonPurple : colors.subtleWire
              }`,
              color: isFullMapView ? colors.polygonPurple : colors.pureFrost,
            }}
            title={
              isFullMapView ? 'Exit Full GIS Map View' : 'Full GIS Map View'
            }
          >
            {isFullMapView ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{isFullMapView ? 'Exit Full View' : 'Full GIS View'}</span>
          </button>

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
            <Radio
              className="w-3.5 h-3.5 text-emerald-shield animate-pulse"
              style={{ color: colors.emeraldShield }}
            />
            <span>{`Time-Synchronization: ${syncTime}`}</span>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. BODY CONTENT: SIDEBAR + WIDESCREEN 16:9 SPLIT PANES */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Floating Sidebar Reopen Tab when Sidebar is collapsed */}
        {!showSidebar && (
          <button
            onClick={() => {
              setIsSidebarCollapsed(false);
              setIsFullMapView(false);
            }}
            className="absolute top-4 left-4 z-30 p-2 rounded-lg shadow-xl cursor-pointer transition-all flex items-center gap-1 text-xs font-semibold"
            style={{
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
              color: colors.pureFrost,
            }}
            title="Expand Sidebar Navigation"
          >
            <ChevronRight className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
            <span>Nav</span>
          </button>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* LEFT-HAND SIDEBAR NAVIGATION (Width 260px, Subtle Wire border) */}
        {/* ------------------------------------------------------------------- */}
        {showSidebar && (
          <aside
            className="flex flex-col justify-between p-4 h-full flex-shrink-0 transition-all duration-300"
            style={{
              width: '260px',
              borderRight: `1px solid ${colors.subtleWire}`, // #222F3E
              backgroundColor: colors.midnightObsidian,
            }}
          >
            <div className="flex flex-col gap-5">
              {/* Sidebar Header with Collapse Button */}
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{
                    color: colors.dimSteel, // #64748B
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  LEFT SIDEBAR NAVIGATION
                </span>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost cursor-pointer"
                  title="Hide Left Panel"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Navigation Menu Items with Fully Responsive Click Handlers */}
              <nav className="flex flex-col gap-1.5">
                {/* 1. Geospatial Radar */}
                <button
                  onClick={() => handleTabClick('radar')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'radar'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'radar' ? colors.darkSlate : 'transparent',
                    border: `1px solid ${
                      activeTab === 'radar' ? colors.subtleWire : 'transparent'
                    }`,
                    color:
                      activeTab === 'radar'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MapIcon
                      className="w-4 h-4"
                      style={{
                        color:
                          activeTab === 'radar'
                            ? colors.crimsonCoral
                            : colors.dimSteel,
                      }}
                    />
                    <span>Geospatial Radar</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>

                {/* 2. Active Incidents */}
                <button
                  onClick={() => handleTabClick('incidents')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'incidents'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'incidents'
                        ? colors.darkSlate
                        : 'transparent',
                    border: `1px solid ${
                      activeTab === 'incidents'
                        ? colors.subtleWire
                        : 'transparent'
                    }`,
                    color:
                      activeTab === 'incidents'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle
                      className="w-4 h-4"
                      style={{ color: colors.crimsonCoral }}
                    />
                    <span>Active Incidents</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: colors.crimsonCoral,
                      color: colors.pureFrost,
                    }}
                  >
                    LIVE
                  </span>
                </button>

                {/* 3. e-FIR Escrow Queue (Active Highlight with Dark Slate and Amber Badge) */}
                <button
                  onClick={() => handleTabClick('e-fir')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'e-fir'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'e-fir' ? colors.darkSlate : 'transparent',
                    border: `1px solid ${
                      activeTab === 'e-fir' ? colors.subtleWire : 'transparent'
                    }`,
                    color:
                      activeTab === 'e-fir'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                  data-testid="nav-efir-escrow-queue"
                >
                  <div className="flex items-center gap-3">
                    <FileText
                      className="w-4 h-4"
                      style={{ color: colors.electricAmber }}
                    />
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
                  onClick={() => handleTabClick('ngo')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'ngo' ? 'shadow-sm' : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'ngo' ? colors.darkSlate : 'transparent',
                    border: `1px solid ${
                      activeTab === 'ngo' ? colors.subtleWire : 'transparent'
                    }`,
                    color:
                      activeTab === 'ngo'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert
                      className="w-4 h-4"
                      style={{ color: colors.polygonPurple }}
                    />
                    <span>NGO Escalations</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>

                {/* 5. Evidence Verification */}
                <button
                  onClick={() => handleTabClick('evidence')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'evidence'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'evidence'
                        ? colors.darkSlate
                        : 'transparent',
                    border: `1px solid ${
                      activeTab === 'evidence'
                        ? colors.subtleWire
                        : 'transparent'
                    }`,
                    color:
                      activeTab === 'evidence'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Key
                      className="w-4 h-4"
                      style={{ color: colors.emeraldShield }}
                    />
                    <span>Evidence Verification</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>

                {/* 6. Settings */}
                <button
                  onClick={() => handleTabClick('settings')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/50'
                  }`}
                  style={{
                    backgroundColor:
                      activeTab === 'settings'
                        ? colors.darkSlate
                        : 'transparent',
                    border: `1px solid ${
                      activeTab === 'settings'
                        ? colors.subtleWire
                        : 'transparent'
                    }`,
                    color:
                      activeTab === 'settings'
                        ? colors.pureFrost
                        : colors.mutedSilver,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Settings
                      className="w-4 h-4"
                      style={{ color: colors.dimSteel }}
                    />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>
              </nav>
            </div>

            {/* Sidebar Bottom: Secondary Settings Toggle Card */}
            <div
              onClick={() => setShowSettingsModal(true)}
              className="p-3.5 rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-polygon-purple transition-colors"
              style={{
                backgroundColor: colors.darkSlate, // #121824
                border: `1px solid ${colors.subtleWire}`, // #222F3E
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-pure-frost flex items-center gap-1.5">
                  <Database
                    className="w-3.5 h-3.5 text-polygon-purple"
                    style={{ color: colors.polygonPurple }}
                  />
                  TEE Enclave Active
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.emeraldShield }}
                />
              </div>
              <p
                className="text-[10px] leading-relaxed"
                style={{ color: colors.dimSteel }}
              >
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
                <span
                  className="text-emerald-shield"
                  style={{ color: colors.emeraldShield }}
                >
                  BNSS/BSA SEC
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* PRIMARY LAYOUT PANE (WIDESCREEN SPLIT OR FULL GIS MAP) */}
        {/* ------------------------------------------------------------------- */}
        <main className="flex flex-1 h-full overflow-hidden relative">
          {/* ================================================================= */}
          {/* GEOSPATIAL MAP PANEL (Expands to 100% when right panel is hidden) */}
          {/* ================================================================= */}
          <section
            className="relative flex flex-col h-full overflow-hidden transition-all duration-300"
            style={{
              width: showRightPanel ? (showSidebar ? '60%' : '75%') : '100%',
              backgroundColor: '#070A0E',
            }}
          >
            {/* Live Map Canvas / Realistic India GIS & Tactical PostGIS Radar */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <svg
                className="w-full h-full cursor-grab active:cursor-grabbing"
                viewBox="0 0 1000 750"
                preserveAspectRatio="xMidYMid meet"
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
                    <stop
                      offset="0%"
                      stopColor={colors.crimsonCoral}
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="50%"
                      stopColor={colors.emeraldShield}
                      stopOpacity="0.10"
                    />
                    <stop
                      offset="100%"
                      stopColor={colors.emeraldShield}
                      stopOpacity="0"
                    />
                  </radialGradient>

                  {/* India Landmass Shadow */}
                  <filter id="india-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={colors.polygonPurple} floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* Base Grid Canvas */}
                <rect width="100%" height="100%" fill="url(#h3-hex-grid)" />

                {/* ============================================================= */}
                {/* DYNAMIC TRANSFORM GROUP (Scales and Zooms seamlessly) */}
                {/* ============================================================= */}
                <g
                  transform={`translate(500, 375) scale(${zoomScale}) translate(-500, -375)`}
                  className="transition-transform duration-500 ease-out"
                >
                  {/* --------------------------------------------------------- */}
                  {/* LAYER A: REALISTIC INDIA NATIONAL GIS MAP VIEW */}
                  {/* --------------------------------------------------------- */}
                  {mapMode === 'national' ? (
                    <g className="animate-fadeIn">
                      {/* Graticule Grid Lines (Lat / Long parallels & meridians) */}
                      <g stroke={colors.subtleWire} strokeWidth="0.75" strokeDasharray="3 6" strokeOpacity="0.5">
                        {/* Parallels (Latitude) */}
                        <line x1="80" y1="120" x2="920" y2="120" />
                        <line x1="80" y1="240" x2="920" y2="240" />
                        <line x1="80" y1="380" x2="920" y2="380" />
                        <line x1="80" y1="520" x2="920" y2="520" />
                        <line x1="80" y1="640" x2="920" y2="640" />

                        {/* Meridians (Longitude) */}
                        <line x1="260" y1="60" x2="260" y2="700" />
                        <line x1="430" y1="60" x2="430" y2="700" />
                        <line x1="600" y1="60" x2="600" y2="700" />
                        <line x1="770" y1="60" x2="770" y2="700" />
                      </g>

                      {/* Coordinate Labels */}
                      <g fill={colors.dimSteel} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                        <text x="90" y="115">32°N (NORTH COMMAND)</text>
                        <text x="90" y="235">28.6°N (NCR COMMAND)</text>
                        <text x="90" y="375">20°N (CENTRAL CORRIDOR)</text>
                        <text x="90" y="515">13°N (DECCAN PENINSULA)</text>
                        <text x="435" y="80">77.2°E</text>
                        <text x="605" y="80">88.3°E</text>
                      </g>

                      {/* High-Fidelity India Sovereign Territory Vector Path */}
                      <path
                        d="M430,70 L450,85 L480,105 L495,130 L475,150 L450,165 L465,190 L510,210 L555,220 L590,230 L605,215 L615,230 L655,230 L710,215 L770,200 L805,220 L790,255 L775,295 L760,335 L745,370 L730,365 L715,350 L680,355 L650,330 L615,355 L610,395 L585,455 L545,525 L515,590 L485,655 L465,705 L445,745 L435,765 L420,780 L410,775 L395,745 L380,695 L365,645 L350,595 L340,555 L330,495 L310,470 L265,480 L225,465 L210,430 L245,415 L215,405 L245,385 L205,375 L255,355 L240,315 L260,265 L285,215 L325,185 L340,150 L355,120 L375,90 Z"
                        fill="#0E1624"
                        stroke={colors.polygonPurple}
                        strokeWidth="2.5"
                        strokeOpacity="0.8"
                        filter="url(#india-glow)"
                      />

                      {/* Internal Regional Zone Dividing Boundaries */}
                      <g stroke={colors.subtleWire} strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.7">
                        {/* Northern Sector */}
                        <path d="M285,215 Q360,230 430,260 T555,270" />
                        {/* Western / Deccan Sector */}
                        <path d="M310,470 Q370,460 450,470 T545,525" />
                        {/* Peninsular South */}
                        <path d="M350,595 Q410,590 485,600 T515,590" />
                        {/* Eastern Gangetic & Coastal */}
                        <path d="M430,260 Q480,340 585,455" />
                        {/* Northeast Chicken's Neck Corridor */}
                        <path d="M590,230 L615,355" />
                      </g>

                      {/* Islands: Lakshadweep & Andaman Nicobar */}
                      <g fill={colors.darkSlate} stroke={colors.subtleWire} strokeWidth="1.2">
                        {/* Lakshadweep */}
                        <circle cx="340" cy="710" r="3.5" />
                        <circle cx="335" cy="728" r="3" />
                        <circle cx="342" cy="745" r="3" />
                        {/* Andaman & Nicobar */}
                        <ellipse cx="770" cy="610" rx="3.5" ry="12" />
                        <ellipse cx="780" cy="655" rx="3" ry="9" />
                        <ellipse cx="790" cy="700" rx="3.5" ry="14" />
                      </g>

                      {/* National Strategic Hubs & Telemetry Nodes */}
                      {/* 1. New Delhi: Active Incident Center */}
                      <g
                        transform="translate(430, 240)"
                        className="cursor-pointer"
                        onClick={() => setMapMode('tactical')}
                      >
                        <circle r="36" fill={colors.crimsonCoral} fillOpacity="0.18" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                        <circle r="18" fill="none" stroke={colors.crimsonCoral} strokeWidth="2" strokeDasharray="4 4" />
                        <circle r="8" fill={colors.crimsonCoral} />
                        <circle r="3.5" fill={colors.pureFrost} />
                        <text x="22" y="-6" fill={colors.crimsonCoral} fontSize="12" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
                          NEW DELHI (ACTIVE INCIDENT)
                        </text>
                        <text x="22" y="10" fill={colors.mutedSilver} fontSize="10" fontFamily="'JetBrains Mono', monospace">
                          28.6139° N, 77.2090° E • 800m Radar Ready [Click to Zoom]
                        </text>
                      </g>

                      {/* 2. Mumbai Western Command */}
                      <g transform="translate(330, 495)">
                        <circle r="7" fill={colors.emeraldShield} fillOpacity="0.25" />
                        <circle r="4" fill={colors.emeraldShield} />
                        <text x="12" y="4" fill={colors.pureFrost} fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Mumbai Command
                        </text>
                      </g>

                      {/* 3. Bengaluru Southern Command */}
                      <g transform="translate(420, 680)">
                        <circle r="7" fill={colors.emeraldShield} fillOpacity="0.25" />
                        <circle r="4" fill={colors.emeraldShield} />
                        <text x="12" y="4" fill={colors.pureFrost} fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Bengaluru Command
                        </text>
                      </g>

                      {/* 4. Kolkata Eastern Command */}
                      <g transform="translate(615, 355)">
                        <circle r="7" fill={colors.emeraldShield} fillOpacity="0.25" />
                        <circle r="4" fill={colors.emeraldShield} />
                        <text x="12" y="4" fill={colors.pureFrost} fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Kolkata Command
                        </text>
                      </g>

                      {/* 5. Hyderabad Node */}
                      <g transform="translate(445, 560)">
                        <circle r="6" fill={colors.polygonPurple} fillOpacity="0.25" />
                        <circle r="3.5" fill={colors.polygonPurple} />
                        <text x="10" y="4" fill={colors.pureFrost} fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Hyderabad Hub
                        </text>
                      </g>
                    </g>
                  ) : (
                    /* ------------------------------------------------------- */
                    /* LAYER B: TACTICAL 800M RADAR (CONNAUGHT PLACE, NEW DELHI) */
                    /* ------------------------------------------------------- */
                    <g transform="translate(500, 375)">
                      {/* Realistic Delhi GIS Layers: Yamuna River Corridor */}
                      <path
                        d="M240,-350 Q180,-100 220,150 T200,380"
                        stroke="#1E3A8A"
                        strokeWidth="14"
                        fill="none"
                        strokeOpacity="0.3"
                      />
                      <text x="235" y="-180" fill="#3B82F6" fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.6">
                        YAMUNA RIVER
                      </text>

                      {/* Connaught Place Radial Avenues (Real Street Geometry) */}
                      <g stroke={colors.subtleWire} strokeWidth="1.5" strokeOpacity="0.4">
                        {/* Janpath Boulevard (North-South) */}
                        <line x1="0" y1="-320" x2="0" y2="320" />
                        {/* Barakhamba Road (East-West) */}
                        <line x1="-320" y1="0" x2="320" y2="0" />
                        {/* Kasturba Gandhi Marg (KG Marg) */}
                        <line x1="-220" y1="-220" x2="220" y2="220" />
                        {/* Sansad Marg / Parliament Street */}
                        <line x1="-220" y1="220" x2="220" y2="-220" />
                      </g>

                      {/* Connaught Place Concentric Rings (Inner, Middle, Outer Circus) */}
                      <circle
                        r="70"
                        fill="none"
                        stroke={colors.subtleWire}
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                      />
                      <circle
                        r="130"
                        fill="none"
                        stroke={colors.subtleWire}
                        strokeWidth="1.5"
                        strokeOpacity="0.5"
                      />
                      <circle
                        r="190"
                        fill="none"
                        stroke={colors.subtleWire}
                        strokeWidth="1.8"
                        strokeOpacity="0.6"
                      />

                      {/* Outer 2000m Configurable Ceiling */}
                      <circle
                        r="340"
                        fill="none"
                        stroke={colors.subtleWire}
                        strokeWidth="1"
                        strokeDasharray="4 8"
                        strokeOpacity="0.4"
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

                      {/* Central Rajiv Chowk Metro Interchange */}
                      <rect
                        x="-12"
                        y="-12"
                        width="24"
                        height="24"
                        fill={colors.midnightObsidian}
                        stroke={colors.electricAmber}
                        strokeWidth="1"
                        rx="4"
                      />
                      <text x="-8" y="4" fill={colors.electricAmber} fontSize="9" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                        RC
                      </text>

                      {/* Active Incident Victim Center Marker */}
                      <g className="cursor-pointer">
                        <circle
                          r="18"
                          fill={colors.crimsonCoral}
                          className="animate-ping"
                          style={{ animationDuration: '2s' }}
                          fillOpacity="0.4"
                        />
                        <circle r="8" fill={colors.crimsonCoral} />
                        <circle r="3.5" fill={colors.pureFrost} />
                      </g>

                      {/* Community Guardians (Small Emerald Shield Dots with Click Interactivity) */}
                      {/* Guardian 1: G-01 (180m Barakhamba Corridor) */}
                      <g
                        transform="translate(-80, -90)"
                        className="cursor-pointer"
                        onClick={() => setSelectedGuardian('G-01')}
                      >
                        <circle
                          r="10"
                          fill={colors.emeraldShield}
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                        <circle r="5" fill={colors.emeraldShield} />
                        <text
                          x="10"
                          y="4"
                          fill={colors.emeraldShield}
                          fontSize="10"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="bold"
                        >
                          G-01 (180m)
                        </text>
                      </g>

                      {/* Guardian 2: G-02 (290m Minto Road Corridor) */}
                      <g
                        transform="translate(120, -60)"
                        className="cursor-pointer"
                        onClick={() => setSelectedGuardian('G-02')}
                      >
                        <circle
                          r="10"
                          fill={colors.emeraldShield}
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                        <circle r="5" fill={colors.emeraldShield} />
                        <text
                          x="10"
                          y="4"
                          fill={colors.emeraldShield}
                          fontSize="10"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="bold"
                        >
                          G-02 (290m)
                        </text>
                      </g>

                      {/* Guardian 3: G-03 (420m Janpath Metro Corridor) */}
                      <g
                        transform="translate(-130, 85)"
                        className="cursor-pointer"
                        onClick={() => setSelectedGuardian('G-03')}
                      >
                        <circle
                          r="10"
                          fill={colors.emeraldShield}
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                        <circle r="5" fill={colors.emeraldShield} />
                        <text
                          x="10"
                          y="4"
                          fill={colors.emeraldShield}
                          fontSize="10"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="bold"
                        >
                          G-03 (420m)
                        </text>
                      </g>

                      {/* Guardian 4: G-04 (510m KG Marg Corridor) */}
                      <g
                        transform="translate(70, 140)"
                        className="cursor-pointer"
                        onClick={() => setSelectedGuardian('G-04')}
                      >
                        <circle
                          r="10"
                          fill={colors.emeraldShield}
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                        <circle r="5" fill={colors.emeraldShield} />
                        <text
                          x="10"
                          y="4"
                          fill={colors.emeraldShield}
                          fontSize="10"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="bold"
                        >
                          G-04 (510m)
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              </svg>

              {/* Selected Guardian Quick Telemetry Card */}
              {selectedGuardian && (
                <div
                  className="absolute top-20 left-5 p-3 rounded-xl shadow-2xl z-20 flex flex-col gap-1.5 animate-fadeIn"
                  style={{
                    backgroundColor: colors.darkSlate,
                    border: `1px solid ${colors.emeraldShield}`,
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-pure-frost">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
                      Guardian {selectedGuardian} Details
                    </span>
                    <button
                      onClick={() => setSelectedGuardian(null)}
                      className="text-dim-steel hover:text-pure-frost ml-3 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: colors.mutedSilver }}>
                    Status: <span className="text-emerald-shield font-bold" style={{ color: colors.emeraldShield }}>STANDBY READY</span> • Radius: 800m
                  </div>
                  <div className="text-[10px] text-dim-steel font-mono">
                    PostGIS GiST ST_DWithin matched • secp256r1 WebAuthn Verified
                  </div>
                </div>
              )}

              {/* Floating Full View Banner */}
              {isFullMapView && (
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 text-xs font-medium backdrop-blur-md animate-fadeIn"
                  style={{
                    backgroundColor: 'rgba(18, 24, 36, 0.9)',
                    border: `1px solid ${colors.polygonPurple}`,
                    color: colors.pureFrost,
                  }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.polygonPurple }} />
                  <span>FULL GIS MAP VIEW (100% CANVASS)</span>
                  <button
                    onClick={() => setIsFullMapView(false)}
                    className="p-1 hover:bg-midnight-obsidian rounded transition-colors text-dim-steel hover:text-pure-frost flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                </div>
              )}

              {/* Live Zoom, Map Mode & Panel Control Toolbar (Top Right Overlay) */}
              <div
                className="absolute top-5 right-5 flex flex-col gap-1.5 p-1 rounded-xl shadow-lg z-20"
                style={{
                  backgroundColor: colors.darkSlate, // #121824
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                }}
              >
                {/* Switch between Tactical and India National Map */}
                <button
                  onClick={() => {
                    setMapMode(mapMode === 'tactical' ? 'national' : 'tactical');
                    setSelectedGuardian(null);
                  }}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors cursor-pointer"
                  style={{
                    color:
                      mapMode === 'national'
                        ? colors.polygonPurple
                        : colors.emeraldShield,
                  }}
                  title={
                    mapMode === 'tactical'
                      ? 'Switch to National India Map'
                      : 'Switch to Tactical 800m Radar'
                  }
                >
                  <Globe className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Zoom In (+) */}
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 1, 20))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Zoom Out (-) */}
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 1, 6))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Reset Center */}
                <button
                  onClick={() => {
                    setZoomLevel(14);
                    setMapMode('tactical');
                    setSelectedGuardian(null);
                  }}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors cursor-pointer"
                  style={{ color: colors.emeraldShield }}
                  title="Reset to Active Incident"
                >
                  <Crosshair className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Full Screen Toggle */}
                <button
                  onClick={() => setIsFullMapView(!isFullMapView)}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer"
                  title={isFullMapView ? 'Exit Full View' : 'Maximize Map Full View'}
                >
                  {isFullMapView ? (
                    <Minimize2 className="w-4 h-4 text-polygon-purple" style={{ color: colors.polygonPurple }} />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Geospatial Radar Header & Telemetry Overlay (Top Left) */}
              <div
                className="absolute top-5 left-5 flex flex-col gap-1 p-3 rounded-xl shadow-md z-10 max-w-sm"
                style={{
                  backgroundColor: 'rgba(18, 24, 36, 0.88)',
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
                    {mapMode === 'national'
                      ? 'National GIS Command (India)'
                      : 'PostGIS Proximity Radar (800m)'}
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
                <div className="text-[10px] text-dim-steel flex items-center justify-between">
                  <span>GiST ST_DWithin: 5 Active Guardians In Radius</span>
                  <span className="font-mono text-emerald-shield" style={{ color: colors.emeraldShield }}>
                    {mapMode === 'national' ? 'INDIA VIEW' : `ZOOM ${zoomLevel}x`}
                  </span>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* CARD: ACTIVE INCIDENT OVERLAY (Bottom of Map Panel) */}
              {/* Dark Slate surface, Subtle Wire border, Crimson Coral glowing indicator */}
              {/* --------------------------------------------------------------- */}
              <div
                className="absolute bottom-5 left-5 right-5 p-4 rounded-xl shadow-2xl z-10 transition-all"
                style={{
                  backgroundColor: colors.darkSlate, // #121824
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                  boxShadow:
                    '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(255, 59, 92, 0.15)',
                }}
                data-testid="active-incident-overlay"
              >
                {/* Header: ACTIVE INCIDENT (Crimson Coral alert #FF3B5C) */}
                <div
                  className="flex items-center justify-between pb-3 border-b"
                  style={{ borderColor: colors.subtleWire }}
                >
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
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: colors.emeraldShield }}
                      />
                      • WSS
                    </span>
                  </div>
                </div>

                {/* Content: Telemetry and Rate with Base91 packet tracking */}
                <div className="grid grid-cols-4 gap-4 pt-3 text-xs">
                  <div>
                    <span
                      className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
                      style={{ color: colors.dimSteel }}
                    >
                      Telemetry & Location
                    </span>
                    <span
                      className="font-mono text-pure-frost font-medium block truncate"
                      title={activeCase.coarseLocation}
                    >
                      {activeCase.coarseLocation}
                    </span>
                    <span className="text-[10px] font-mono text-dim-steel">
                      GPS HDOP: 1.1 • IMU 2.8g
                    </span>
                  </div>

                  <div>
                    <span
                      className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
                      style={{ color: colors.dimSteel }}
                    >
                      Rate
                    </span>
                    <span className="font-mono text-pure-frost font-medium">
                      5s Chunks • 128kbps AAC
                    </span>
                  </div>

                  <div>
                    <span
                      className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
                      style={{ color: colors.dimSteel }}
                    >
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
                    <span
                      className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
                      style={{ color: colors.dimSteel }}
                    >
                      Dispatch Mode
                    </span>
                    <span
                      className="font-mono text-emerald-shield font-medium"
                      style={{ color: colors.emeraldShield }}
                    >
                      Rail A (WSS) Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Floating Right Panel Reopen Tab */}
          {!showRightPanel && (
            <button
              onClick={() => {
                setIsRightPanelCollapsed(false);
                setIsFullMapView(false);
              }}
              className="absolute top-4 right-4 z-30 p-2 rounded-lg shadow-xl cursor-pointer transition-all flex items-center gap-1 text-xs font-semibold"
              style={{
                backgroundColor: colors.darkSlate,
                border: `1px solid ${colors.subtleWire}`,
                color: colors.pureFrost,
              }}
              title="Expand Details & Escrow Panel"
            >
              <span>Escrow</span>
              <ChevronLeft className="w-4 h-4 text-electric-amber" style={{ color: colors.electricAmber }} />
            </button>
          )}

          {/* ================================================================= */}
          {/* RIGHT PANEL (40% width): Active Statutory Escalation & Escrow Monitor */}
          {/* ================================================================= */}
          {showRightPanel && (
            <section
              className="flex flex-col h-full overflow-y-auto p-6 gap-5 flex-shrink-0 transition-all duration-300"
              style={{
                width: showSidebar ? '40%' : '25%',
                minWidth: '360px',
                borderLeft: `1px solid ${colors.subtleWire}`, // #222F3E
                backgroundColor: colors.midnightObsidian, // #0A0D12
              }}
              data-testid="right-detail-escrow-panel"
            >
              {/* Panel Headings: Microcopy & Item Heading with Collapse Button */}
              <div className="flex items-center justify-between">
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
                  </h2>
                </div>
                <button
                  onClick={() => setIsRightPanelCollapsed(true)}
                  className="p-1 rounded hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost cursor-pointer"
                  title="Hide Right Panel for Full Map"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active Escrow Queue List */}
              <div className="flex flex-col gap-2">
                <span
                  className="text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: colors.dimSteel }}
                >
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
                          backgroundColor: isSelected
                            ? colors.darkSlate
                            : colors.midnightObsidian,
                          border: `1px solid ${
                            isSelected ? colors.electricAmber : colors.subtleWire
                          }`,
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-pure-frost">
                              {inc.incidentId}
                            </span>
                            {isUrgent && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  backgroundColor: 'rgba(255, 159, 28, 0.2)',
                                  color: colors.electricAmber,
                                }}
                              >
                                48h NGO Early Warning
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[11px]"
                            style={{ color: colors.mutedSilver }}
                          >
                            {inc.coarseLocation} • {inc.bnsSection}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: isUrgent
                                ? colors.electricAmber
                                : colors.emeraldShield,
                            }}
                          >
                            {`${inc.hoursRemaining}h ${inc.minutesRemaining}m remaining`}
                          </span>
                          <span
                            className="block text-[10px]"
                            style={{ color: colors.dimSteel }}
                          >
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
                  {`${String(countdown.hours).padStart(2, '0')}:${String(
                    countdown.minutes
                  ).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`}
                </div>

                <div
                  className="flex items-center justify-between text-xs pt-1 border-t"
                  style={{ borderColor: 'rgba(255, 159, 28, 0.2)' }}
                >
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
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: colors.pureFrost }}
                >
                  Mapped Statutory Provisions
                </span>
                <div className="flex flex-col gap-2 text-xs font-medium">
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: colors.midnightObsidian,
                      border: `1px solid ${colors.subtleWire}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: colors.emeraldShield }}
                    />
                    <span className="text-pure-frost font-mono font-semibold">
                      • BNSS Section 173(1) - Zero-FIR
                    </span>
                    <span
                      className="ml-auto text-[10px]"
                      style={{ color: colors.dimSteel }}
                    >
                      Automated Registration
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: colors.midnightObsidian,
                      border: `1px solid ${colors.subtleWire}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: colors.crimsonCoral }}
                    />
                    <span className="text-pure-frost font-mono font-semibold">
                      • BNS Section 74 (Assault)
                    </span>
                    <span
                      className="ml-auto text-[10px] font-bold"
                      style={{ color: colors.crimsonCoral }}
                    >
                      Cognizable / Non-Bailable
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: colors.midnightObsidian,
                      border: `1px solid ${colors.subtleWire}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: colors.polygonPurple }}
                    />
                    <span className="text-pure-frost font-mono font-semibold">
                      • BNS Section 78 (Stalking)
                    </span>
                    <span
                      className="ml-auto text-[10px]"
                      style={{ color: colors.polygonPurple }}
                    >
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
                  <span>
                    ⚠️ Superintendent of Police (SP) Alert Scheduled: 72 hours
                  </span>
                </div>

                {/* Historical Checkpoints */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: colors.dimSteel }}
                  >
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
                    <span className="text-pure-frost font-bold">
                      72 Nov, 2023, 16 PM
                    </span>
                  </div>
                </div>

                {/* Status Items: Aadhaar e-Sign & Section 63 BSA Digital Evidence */}
                <div
                  className="flex flex-col gap-2 pt-1 border-t"
                  style={{ borderColor: colors.subtleWire }}
                >
                  {/* Item 1: Aadhaar e-Sign checking */}
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: colors.mutedSilver }}>
                      Aadhaar e-Sign checking
                    </span>
                    <span
                      className="flex items-center gap-1 font-bold text-xs"
                      style={{ color: colors.emeraldShield }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />✓ Verified
                    </span>
                  </div>

                  {/* Item 2: Section 63 BSA Digital Evidence */}
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: colors.mutedSilver }}>
                      Section 63 BSA Digital Evidence certificate compilation
                      progress
                    </span>
                    <span
                      className="flex items-center gap-1 font-bold text-xs"
                      style={{ color: colors.emeraldShield }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />✓ Verified
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Acknowledge FIR & Trigger SP Escalation */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {!activeCase.policeAcknowledged ? (
                    <button
                      data-testid={`btn-ack-${activeCase.complaintId}`}
                      onClick={() => handleAcknowledge(activeCase.complaintId)}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
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
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
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
                  <div
                    className="flex items-center justify-between text-xs font-bold"
                    style={{ color: colors.emeraldShield }}
                  >
                    <span>✓ BSA §63 CERTIFICATE ADMISSIBLE IN COURT</span>
                    <button
                      onClick={() => setVerifiedCert(null)}
                      className="text-dim-steel hover:text-pure-frost text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: colors.mutedSilver }}
                  >
                    Cert ID:{' '}
                    <strong className="text-pure-frost">{verifiedCert}</strong>{' '}
                    • Hardware Enclave: Android StrongBox Keymaster • SHA-256
                    Merkle Chain: 100% Intact.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Settings Modal if Opened from Sidebar */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md p-6 rounded-2xl flex flex-col gap-4 shadow-2xl"
            style={{
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-polygon-purple" style={{ color: colors.polygonPurple }} />
                <h3 className="font-bold text-sm text-pure-frost">Institutional Hub Configuration</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-dim-steel hover:text-pure-frost text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-midnight-obsidian flex justify-between items-center border border-subtle-wire">
                <span>PostGIS Spatial Resolution</span>
                <span className="font-mono text-emerald-shield">Uber H3 Res-9 (~100m)</span>
              </div>
              <div className="p-3 rounded-lg bg-midnight-obsidian flex justify-between items-center border border-subtle-wire">
                <span>Active Geofence Dispatch</span>
                <span className="font-mono text-electric-amber">800m Buffer GiST</span>
              </div>
              <div className="p-3 rounded-lg bg-midnight-obsidian flex justify-between items-center border border-subtle-wire">
                <span>StrongBox Hardware Keymaster</span>
                <span className="font-mono text-emerald-shield">Verified v3.4</span>
              </div>
              <div className="p-3 rounded-lg bg-midnight-obsidian flex justify-between items-center border border-subtle-wire">
                <span>Polygon Amoy Paymaster</span>
                <span className="font-mono text-polygon-purple">Gasless (0 POL UserOp)</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 rounded-lg text-xs font-bold text-midnight-obsidian cursor-pointer"
              style={{ backgroundColor: colors.emeraldShield }}
            >
              Close Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
