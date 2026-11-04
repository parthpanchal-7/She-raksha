'use client';

/**
 * @she-raksha/web — Institutional Command & Compliance Dashboard
 *
 * Implements:
 *  - 1920x1080 Zero-Overflow Widescreen Layout with Collapsible Sidebars (Full GIS Map View Mode)
 *  - Interactive Left-Hand Sidebar Navigation (active tab routing, collapse/expand toggle)
 *  - High-Fidelity Realistic India National GIS Map (State boundaries, Arabian Sea, Bay of Bengal, Command Hubs)
 *  - Tactical 800m PostGIS Radar (Connaught Place, New Delhi radial geometry & Yamuna river corridor)
 *  - Segmented GIS Mode Switcher: [India National GIS] | [Tactical 800m New Delhi Radar]
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
  Shield,
  PhoneCall,
  Search,
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

  // Panel & GIS States - Default mapMode to 'national' so India Map is immediately visible!
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isFullMapView, setIsFullMapView] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'national' | 'tactical'>('national');
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null);
  const [selectedCityHub, setSelectedCityHub] = useState<string | null>('New Delhi');

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

  // Sidebar Tab Click Handler with Responsive Routing
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    if (tabKey === 'radar') {
      setMapMode('tactical');
      setSelectedGuardian(null);
    } else if (tabKey === 'ngo') {
      const urgent = incidents.find((i) => i.hoursRemaining <= 48);
      if (urgent) setSelectedComplaintId(urgent.complaintId);
    } else if (tabKey === 'evidence') {
      setVerifiedCert(activeCase.bsa63CertId);
      onVerifyBSA63?.(activeCase.bsa63CertId);
    }
  };

  // Effective panel widths based on collapse states
  const showSidebar = !isFullMapView && !isSidebarCollapsed;
  const showRightPanel = !isFullMapView && !isRightPanelCollapsed;

  // Zoom scale calculations
  const zoomScale =
    mapMode === 'national' ? (zoomLevel / 14) * 1.0 : zoomLevel / 14;

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
        className="flex items-center justify-between px-6 h-16 w-full z-30 flex-shrink-0 shadow-md"
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

        {/* Right-Side Status & Panel Controls */}
        <div className="flex items-center gap-3">
          {/* Full Screen Map Toggle Button */}
          <button
            onClick={() => {
              setIsFullMapView(!isFullMapView);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: isFullMapView
                ? 'rgba(123, 63, 228, 0.25)'
                : colors.darkSlate,
              border: `1px solid ${
                isFullMapView ? colors.polygonPurple : colors.subtleWire
              }`,
              color: isFullMapView ? colors.polygonPurple : colors.pureFrost,
            }}
            title={
              isFullMapView ? 'Exit Full Screen GIS View' : 'Maximize Full View of GIS Map'
            }
          >
            {isFullMapView ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{isFullMapView ? 'Exit Full View' : '⛶ Full GIS View'}</span>
          </button>

          {/* Badge: Active Platform Status */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm"
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
            className="absolute top-5 left-5 z-40 px-3 py-2 rounded-xl shadow-2xl cursor-pointer transition-all flex items-center gap-2 text-xs font-bold border active:scale-95 hover:bg-dark-slate"
            style={{
              backgroundColor: colors.darkSlate,
              borderColor: colors.emeraldShield,
              color: colors.pureFrost,
            }}
            title="Expand Navigation Sidebar"
          >
            <ChevronRight className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
            <span>Show Nav</span>
          </button>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* LEFT-HAND SIDEBAR NAVIGATION (Width 260px, Subtle Wire border) */}
        {/* ------------------------------------------------------------------- */}
        {showSidebar && (
          <aside
            className="flex flex-col justify-between p-4 h-full flex-shrink-0 transition-all duration-300 z-20"
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
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost cursor-pointer border border-transparent hover:border-subtle-wire"
                  title="Hide Sidebar for Full Map"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </button>
              </div>

              {/* Navigation Menu Items with Fully Responsive Click Handlers */}
              <nav className="flex flex-col gap-1.5">
                {/* 1. Geospatial Radar */}
                <button
                  onClick={() => handleTabClick('radar')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'radar'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/60'
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
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'incidents'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/60'
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
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'e-fir'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/60'
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
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'ngo' ? 'shadow-sm' : 'hover:bg-dark-slate/60'
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
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'evidence'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/60'
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
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'settings'
                      ? 'shadow-sm'
                      : 'hover:bg-dark-slate/60'
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
              onClick={() => handleTabClick('settings')}
              className="p-3.5 rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-polygon-purple transition-colors shadow-sm"
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
              backgroundColor: '#06090D',
            }}
          >
            {/* PROMINENT TOP SEGMENTED CONTROL: INDIA MAP vs TACTICAL RADAR */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center p-1 rounded-xl shadow-2xl backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(18, 24, 36, 0.92)',
                border: `1px solid ${colors.subtleWire}`,
              }}
            >
              <button
                onClick={() => {
                  setMapMode('national');
                  setSelectedGuardian(null);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                style={{
                  backgroundColor:
                    mapMode === 'national' ? colors.polygonPurple : 'transparent',
                  color:
                    mapMode === 'national' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🇮🇳 India National GIS</span>
              </button>
              <button
                onClick={() => {
                  setMapMode('tactical');
                  setSelectedGuardian(null);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                style={{
                  backgroundColor:
                    mapMode === 'tactical' ? colors.crimsonCoral : 'transparent',
                  color:
                    mapMode === 'tactical' ? colors.pureFrost : colors.mutedSilver,
                }}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>🎯 Tactical 800m Radar</span>
              </button>
            </div>

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
                      stopOpacity="0.25"
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

                  {/* India Landmass Purple Glow */}
                  <filter id="india-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={colors.polygonPurple} floodOpacity="0.4" />
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
                  {/* LAYER A: HIGH-FIDELITY REALISTIC INDIA NATIONAL GIS MAP */}
                  {/* --------------------------------------------------------- */}
                  {mapMode === 'national' ? (
                    <g className="animate-fadeIn">
                      {/* Ocean Water Label Annotations */}
                      <g fill={colors.dimSteel} fontSize="11" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.2em" opacity="0.4">
                        <text x="180" y="490">ARABIAN SEA</text>
                        <text x="710" y="490">BAY OF BENGAL</text>
                        <text x="440" y="720">INDIAN OCEAN</text>
                      </g>

                      {/* Graticule Lat / Long Coordinates Grid */}
                      <g stroke={colors.subtleWire} strokeWidth="0.75" strokeDasharray="3 6" strokeOpacity="0.5">
                        <line x1="80" y1="120" x2="920" y2="120" />
                        <line x1="80" y1="240" x2="920" y2="240" />
                        <line x1="80" y1="380" x2="920" y2="380" />
                        <line x1="80" y1="520" x2="920" y2="520" />
                        <line x1="80" y1="640" x2="920" y2="640" />

                        <line x1="280" y1="60" x2="280" y2="700" />
                        <line x1="460" y1="60" x2="460" y2="700" />
                        <line x1="640" y1="60" x2="640" y2="700" />
                        <line x1="800" y1="60" x2="800" y2="700" />
                      </g>

                      {/* Coordinate Labels */}
                      <g fill={colors.dimSteel} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                        <text x="90" y="115">32°N (NORTH COMMAND)</text>
                        <text x="90" y="235">28.6°N (NCR CAPITAL SECTOR)</text>
                        <text x="90" y="375">20°N (CENTRAL CORRIDOR)</text>
                        <text x="90" y="515">13°N (DECCAN PENINSULA)</text>
                        <text x="465" y="80">77.2°E</text>
                        <text x="645" y="80">88.3°E</text>
                      </g>

                      {/* HIGH-PRECISION REALISTIC INDIA SOVEREIGN LANDMASS VECTOR */}
                      <path
                        d="M480,50 L510,70 L540,90 L560,115 L535,135 L510,150 L525,175 L565,190 L610,200 L645,210 L660,195 L670,210 L710,210 L760,195 L820,180 L855,200 L840,235 L825,275 L810,315 L795,350 L780,345 L765,330 L730,335 L700,310 L665,335 L660,375 L635,435 L595,505 L565,570 L535,635 L515,685 L495,725 L485,745 L470,760 L460,755 L445,725 L430,675 L415,625 L400,575 L390,535 L380,475 L360,450 L315,460 L275,445 L260,410 L295,395 L265,385 L295,365 L255,355 L305,335 L290,295 L310,245 L335,195 L375,165 L390,130 L405,100 L425,70 Z"
                        fill="#10192A"
                        stroke={colors.polygonPurple}
                        strokeWidth="2.5"
                        strokeOpacity="0.9"
                        filter="url(#india-glow)"
                      />

                      {/* Internal State and Zone Boundaries */}
                      <g stroke={colors.subtleWire} strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.8">
                        {/* Northern Sector / Rajasthan Border */}
                        <path d="M310,245 Q385,255 460,285 T565,295" />
                        {/* Central / Deccan Boundary */}
                        <path d="M360,450 Q425,440 500,455 T595,505" />
                        {/* Peninsular South Boundary */}
                        <path d="M400,575 Q460,565 535,575 T565,570" />
                        {/* Gangetic Eastern Corridor */}
                        <path d="M460,285 Q515,365 635,435" />
                        {/* Northeast Siliguri Corridor */}
                        <path d="M645,210 L665,335" />
                      </g>

                      {/* Lakshadweep Islands */}
                      <g fill={colors.darkSlate} stroke={colors.subtleWire} strokeWidth="1">
                        <circle cx="390" cy="690" r="4" />
                        <circle cx="385" cy="710" r="3.5" />
                        <circle cx="395" cy="730" r="3.5" />
                      </g>

                      {/* Andaman & Nicobar Islands */}
                      <g fill={colors.darkSlate} stroke={colors.subtleWire} strokeWidth="1">
                        <ellipse cx="800" cy="590" rx="4" ry="14" />
                        <ellipse cx="810" cy="640" rx="3.5" ry="10" />
                        <ellipse cx="820" cy="690" rx="4" ry="16" />
                      </g>

                      {/* National Strategic Hubs & Telemetry Markers */}
                      {/* 1. New Delhi: Active Incident Center */}
                      <g
                        transform="translate(460, 200)"
                        className="cursor-pointer"
                        onClick={() => setMapMode('tactical')}
                      >
                        <circle r="40" fill={colors.crimsonCoral} fillOpacity="0.22" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                        <circle r="20" fill="none" stroke={colors.crimsonCoral} strokeWidth="2" strokeDasharray="4 4" />
                        <circle r="9" fill={colors.crimsonCoral} />
                        <circle r="4" fill={colors.pureFrost} />
                        <text x="26" y="-6" fill={colors.crimsonCoral} fontSize="13" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
                          NEW DELHI (ACTIVE INCIDENT)
                        </text>
                        <text x="26" y="10" fill={colors.mutedSilver} fontSize="10" fontFamily="'JetBrains Mono', monospace">
                          28.6139° N, 77.2090° E • [Click to View 800m Tactical Radar]
                        </text>
                      </g>

                      {/* 2. Mumbai Western Command */}
                      <g
                        transform="translate(388, 475)"
                        className="cursor-pointer"
                        onClick={() => setSelectedCityHub('Mumbai')}
                      >
                        <circle r="8" fill={colors.emeraldShield} fillOpacity="0.3" />
                        <circle r="4.5" fill={colors.emeraldShield} />
                        <text x="14" y="4" fill={colors.pureFrost} fontSize="10" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Mumbai Command
                        </text>
                      </g>

                      {/* 3. Bengaluru Southern Command */}
                      <g
                        transform="translate(465, 650)"
                        className="cursor-pointer"
                        onClick={() => setSelectedCityHub('Bengaluru')}
                      >
                        <circle r="8" fill={colors.emeraldShield} fillOpacity="0.3" />
                        <circle r="4.5" fill={colors.emeraldShield} />
                        <text x="14" y="4" fill={colors.pureFrost} fontSize="10" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Bengaluru Command
                        </text>
                      </g>

                      {/* 4. Kolkata Eastern Command */}
                      <g
                        transform="translate(665, 335)"
                        className="cursor-pointer"
                        onClick={() => setSelectedCityHub('Kolkata')}
                      >
                        <circle r="8" fill={colors.emeraldShield} fillOpacity="0.3" />
                        <circle r="4.5" fill={colors.emeraldShield} />
                        <text x="14" y="4" fill={colors.pureFrost} fontSize="10" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Kolkata Command
                        </text>
                      </g>

                      {/* 5. Hyderabad Central Node */}
                      <g
                        transform="translate(485, 540)"
                        className="cursor-pointer"
                        onClick={() => setSelectedCityHub('Hyderabad')}
                      >
                        <circle r="7" fill={colors.polygonPurple} fillOpacity="0.3" />
                        <circle r="4" fill={colors.polygonPurple} />
                        <text x="12" y="4" fill={colors.pureFrost} fontSize="9" fontFamily="'Plus Jakarta Sans', sans-serif">
                          Hyderabad Hub
                        </text>
                      </g>
                    </g>
                  ) : (
                    /* ------------------------------------------------------- */
                    /* LAYER B: TACTICAL 800M RADAR (CONNAUGHT PLACE, NEW DELHI) */
                    /* ------------------------------------------------------- */
                    <g transform="translate(500, 375)">
                      {/* Subtle India Geographic Background Silhouette so India is never absent! */}
                      <path
                        d="M0,-240 L30,-180 L80,-140 L60,-60 L120,40 L60,160 L0,220 L-60,160 L-120,40 L-60,-60 L-80,-140 L-30,-180 Z"
                        fill="#0B111A"
                        stroke={colors.subtleWire}
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        transform="scale(1.4)"
                      />

                      {/* Delhi GIS Yamuna River Corridor */}
                      <path
                        d="M240,-350 Q180,-100 220,150 T200,380"
                        stroke="#1E3A8A"
                        strokeWidth="16"
                        fill="none"
                        strokeOpacity="0.3"
                      />
                      <text x="235" y="-180" fill="#3B82F6" fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.6">
                        YAMUNA RIVER
                      </text>

                      {/* Connaught Place Radial Avenues Grid */}
                      <g stroke={colors.subtleWire} strokeWidth="1.5" strokeOpacity="0.4">
                        <line x1="0" y1="-320" x2="0" y2="320" />
                        <line x1="-320" y1="0" x2="320" y2="0" />
                        <line x1="-220" y1="-220" x2="220" y2="220" />
                        <line x1="-220" y1="220" x2="220" y2="-220" />
                      </g>

                      {/* Connaught Place Concentric Rings */}
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
                        x="-14"
                        y="-14"
                        width="28"
                        height="28"
                        fill={colors.midnightObsidian}
                        stroke={colors.electricAmber}
                        strokeWidth="1.5"
                        rx="4"
                      />
                      <text x="-9" y="5" fill={colors.electricAmber} fontSize="10" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                        RC
                      </text>

                      {/* Active Incident Victim Center Marker */}
                      <g className="cursor-pointer">
                        <circle
                          r="20"
                          fill={colors.crimsonCoral}
                          className="animate-ping"
                          style={{ animationDuration: '2s' }}
                          fillOpacity="0.4"
                        />
                        <circle r="8" fill={colors.crimsonCoral} />
                        <circle r="3.5" fill={colors.pureFrost} />
                      </g>

                      {/* Community Guardians (Small Emerald Shield Dots with Click Interactivity) */}
                      {/* Guardian 1 */}
                      <g
                        transform="translate(-80, -90)"
                        className="cursor-pointer hover:opacity-80"
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

                      {/* Guardian 2 */}
                      <g
                        transform="translate(120, -60)"
                        className="cursor-pointer hover:opacity-80"
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

                      {/* Guardian 3 */}
                      <g
                        transform="translate(-130, 85)"
                        className="cursor-pointer hover:opacity-80"
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

                      {/* Guardian 4 */}
                      <g
                        transform="translate(70, 140)"
                        className="cursor-pointer hover:opacity-80"
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
                  className="absolute top-20 left-6 p-4 rounded-xl shadow-2xl z-40 flex flex-col gap-2 animate-fadeIn"
                  style={{
                    backgroundColor: colors.darkSlate,
                    border: `1px solid ${colors.emeraldShield}`,
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-pure-frost">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
                      Guardian {selectedGuardian} Live Telemetry
                    </span>
                    <button
                      onClick={() => setSelectedGuardian(null)}
                      className="text-dim-steel hover:text-pure-frost ml-4 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: colors.mutedSilver }}>
                    Status: <span className="text-emerald-shield font-bold" style={{ color: colors.emeraldShield }}>STANDBY ACTIVE</span> • 800m Buffer GiST
                  </div>
                  <div className="text-[10px] text-dim-steel font-mono">
                    Authenticated: W3C secp256r1 Passkey • Battery: 94% • Rail A/B Ready
                  </div>
                  <button
                    onClick={() => alert(`Dispatched priority proximity ping to Guardian ${selectedGuardian}!`)}
                    className="mt-1 py-1 px-2 rounded bg-emerald-shield text-midnight-obsidian text-[11px] font-bold cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: colors.emeraldShield }}
                  >
                    Send Proximity Ping
                  </button>
                </div>
              )}

              {/* Floating Full View Banner */}
              {isFullMapView && (
                <div
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-fadeIn"
                  style={{
                    backgroundColor: 'rgba(18, 24, 36, 0.95)',
                    border: `1px solid ${colors.polygonPurple}`,
                    color: colors.pureFrost,
                  }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.polygonPurple }} />
                  <span>FULL GIS MAP MODE (100% CANVASS)</span>
                  <button
                    onClick={() => setIsFullMapView(false)}
                    className="px-2 py-0.5 rounded bg-midnight-obsidian hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost flex items-center gap-1 cursor-pointer border border-subtle-wire"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit Full View</span>
                  </button>
                </div>
              )}

              {/* Live Zoom, Map Mode & Panel Control Toolbar (Top Right Overlay) */}
              <div
                className="absolute top-5 right-5 flex flex-col gap-1.5 p-1.5 rounded-xl shadow-xl z-30"
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
                      ? 'Switch to National India GIS Map'
                      : 'Switch to Tactical 800m New Delhi Radar'
                  }
                >
                  <Globe className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Zoom In (+) */}
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 1, 20))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer active:scale-95"
                  title="Zoom In (+)"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Zoom Out (-) */}
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 1, 6))}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer active:scale-95"
                  title="Zoom Out (-)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Reset Center */}
                <button
                  onClick={() => {
                    setZoomLevel(14);
                    setSelectedGuardian(null);
                  }}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors cursor-pointer active:scale-95"
                  style={{ color: colors.emeraldShield }}
                  title="Reset Zoom & Center"
                >
                  <Crosshair className="w-4 h-4" />
                </button>

                <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

                {/* Full Screen Toggle */}
                <button
                  onClick={() => setIsFullMapView(!isFullMapView)}
                  className="p-2 rounded-lg hover:bg-midnight-obsidian transition-colors text-pure-frost cursor-pointer active:scale-95"
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
                className="absolute top-5 left-5 flex flex-col gap-1.5 p-3.5 rounded-xl shadow-xl z-20 max-w-sm"
                style={{
                  backgroundColor: 'rgba(18, 24, 36, 0.90)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${colors.subtleWire}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-ping"
                    style={{ backgroundColor: colors.crimsonCoral }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-pure-frost">
                    {mapMode === 'national'
                      ? 'India National GIS Radar'
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
                <div className="text-[10px] text-dim-steel flex items-center justify-between pt-1 border-t border-subtle-wire">
                  <span>GiST ST_DWithin: 5 Active Guardians</span>
                  <span className="font-mono text-emerald-shield font-bold" style={{ color: colors.emeraldShield }}>
                    {mapMode === 'national' ? 'INDIA NATIONAL VIEW' : `ZOOM ${zoomLevel}x`}
                  </span>
                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* CARD: ACTIVE INCIDENT OVERLAY (Bottom of Map Panel) */}
              {/* Dark Slate surface, Subtle Wire border, Crimson Coral glowing indicator */}
              {/* --------------------------------------------------------------- */}
              <div
                className="absolute bottom-5 left-5 right-5 p-4 rounded-xl shadow-2xl z-20 transition-all"
                style={{
                  backgroundColor: colors.darkSlate, // #121824
                  border: `1px solid ${colors.subtleWire}`, // #222F3E
                  boxShadow:
                    '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 24px rgba(255, 59, 92, 0.15)',
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
              className="absolute top-5 right-5 z-40 px-3 py-2 rounded-xl shadow-2xl cursor-pointer transition-all flex items-center gap-2 text-xs font-bold border active:scale-95 hover:bg-dark-slate"
              style={{
                backgroundColor: colors.darkSlate,
                borderColor: colors.electricAmber,
                color: colors.pureFrost,
              }}
              title="Expand Details & Escrow Panel"
            >
              <span>Show Details</span>
              <ChevronLeft className="w-4 h-4 text-electric-amber" style={{ color: colors.electricAmber }} />
            </button>
          )}

          {/* ================================================================= */}
          {/* RIGHT PANEL: DYNAMIC VIEW (e-FIR Escrow / Incidents / NGO / Verification) */}
          {/* ================================================================= */}
          {showRightPanel && (
            <section
              className="flex flex-col h-full overflow-y-auto p-6 gap-5 flex-shrink-0 transition-all duration-300 z-20"
              style={{
                width: showSidebar ? '40%' : '25%',
                minWidth: '380px',
                borderLeft: `1px solid ${colors.subtleWire}`, // #222F3E
                backgroundColor: colors.midnightObsidian, // #0A0D12
              }}
              data-testid="right-detail-escrow-panel"
            >
              {/* Panel Headings: Microcopy & Item Heading with Collapse Button */}
              <div className="flex items-center justify-between pb-1 border-b border-subtle-wire">
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
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost cursor-pointer border border-transparent hover:border-subtle-wire"
                  title="Hide Details for Full Map View"
                >
                  <span>Hide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
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
                        className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all text-xs hover:border-electric-amber"
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
                className="p-5 rounded-xl flex flex-col gap-2 relative overflow-hidden shadow-lg"
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
                className="p-4 rounded-xl flex flex-col gap-2.5 shadow-md"
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
                className="p-4 rounded-xl flex flex-col gap-3 shadow-md"
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
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase shadow-sm"
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
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider shadow-sm"
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
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider shadow-sm"
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
                className="p-4 rounded-xl flex flex-col gap-3 shadow-md"
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
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95"
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
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
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
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 shadow-sm"
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
                  className="p-3.5 rounded-xl flex flex-col gap-2 animate-fadeIn shadow-xl"
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
      {activeTab === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
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
                onClick={() => setActiveTab('e-fir')}
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
              onClick={() => setActiveTab('e-fir')}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-midnight-obsidian cursor-pointer hover:opacity-90 active:scale-95"
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
