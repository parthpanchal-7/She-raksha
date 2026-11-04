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
import { Geospatial3DGisGlobe } from './Geospatial3DGisGlobe.js';

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
          {/* GEOSPATIAL 3D GIS GLOBE PANEL (Center 60% Pane, expands on full view) */}
          {/* ================================================================= */}
          <section
            className="relative flex flex-col h-full overflow-hidden transition-all duration-300"
            style={{
              width: showRightPanel ? (showSidebar ? '60%' : '75%') : '100%',
              backgroundColor: '#070A0E',
            }}
          >
            <Geospatial3DGisGlobe
              activeCase={activeCase}
              isFullMapView={isFullMapView}
              onToggleFullView={() => setIsFullMapView(!isFullMapView)}
              selectedGuardian={selectedGuardian}
              onSelectGuardian={(gId) => setSelectedGuardian(gId)}
              onClearGuardian={() => setSelectedGuardian(null)}
            />
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
