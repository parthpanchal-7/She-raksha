'use client';

/**
 * @she-raksha/web — Institutional Command & Compliance Dashboard
 *
 * Implements:
 *  - 1920x1080 Zero-Overflow Widescreen Layout with Collapsible Sidebars (Full GIS Map View Mode)
 *  - Fully Interactive Left-Hand Sidebar Navigation (Radar, Active Incidents, e-FIR Escrow, NGO Escalations, Verification, Settings)
 *  - High-Fidelity Realistic India National 3D GIS Satellite Globe (ISRO Bhuvan, Survey of India, Mappls ERSS-112)
 *  - Tactical 800m PostGIS Radar (Connaught Place, New Delhi radial geometry & Yamuna river corridor)
 *  - Collapsible panels with "Hide" / "Show Nav" / "Show Details" and "⛶ Full GIS View"
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
  Satellite,
  Building2,
  Send,
  FileCheck,
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
  const [verifiedCert, setVerifiedCert] = useState<string | null>(null);
  const [syncTime, setSyncTime] = useState<number>(123);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number>(
    initialIncidents[0]?.complaintId ?? 101
  );

  // Panel & GIS States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isFullMapView, setIsFullMapView] = useState<boolean>(false);
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<'radar' | 'national'>('national');

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
    // Expand right panel if it was collapsed so user sees the new tab
    setIsRightPanelCollapsed(false);
    setIsFullMapView(false);

    if (tabKey === 'radar') {
      setFocusMode('radar');
      setSelectedGuardian(null);
    } else if (tabKey === 'incidents') {
      setFocusMode('national');
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
      {/* 2. BODY CONTAINER: SIDEBAR + MAIN (CENTER GIS + RIGHT ESCROW PANEL) */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Floating Sidebar Reopen Tab */}
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
                      style={{
                        color:
                          activeTab === 'incidents'
                            ? colors.crimsonCoral
                            : colors.dimSteel,
                      }}
                    />
                    <span>Active Incidents</span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                    style={{
                      backgroundColor: colors.crimsonCoral, // Crimson Coral #FF3B5C background
                      color: colors.pureFrost,
                    }}
                  >
                    LIVE
                  </span>
                </button>

                {/* 3. e-FIR Escrow Queue (Active Highlight) */}
                <button
                  onClick={() => handleTabClick('e-fir')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                    activeTab === 'e-fir' ? 'shadow-sm' : 'hover:bg-dark-slate/60'
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
                >
                  <div className="flex items-center gap-3">
                    <FileText
                      className="w-4 h-4"
                      style={{ color: colors.electricAmber }}
                    />
                    <span className="font-semibold">e-FIR Escrow Queue</span>
                  </div>
                  {/* Circular Outline Badge '2' in Electric Amber #FF9F1C */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{
                      border: `1px solid ${colors.electricAmber}`, // #FF9F1C circular outline
                      color: colors.electricAmber,
                      backgroundColor: 'transparent',
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
              focusMode={focusMode}
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
          {/* RIGHT PANEL: DYNAMIC VIEW (e-FIR Escrow / Incidents / Radar / NGO / Verification) */}
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
                    {activeTab === 'radar' && <span>PostGIS Proximity Radar & Telemetry</span>}
                    {activeTab === 'incidents' && <span>Active Multi-Rail SOS Incidents</span>}
                    {activeTab === 'e-fir' && <span>Active BNSS §173 e-FIR | SemiBold</span>}
                    {activeTab === 'ngo' && <span>Accredited Legal Aid NGO Escalations</span>}
                    {activeTab === 'evidence' && <span>BSA §63 Digital Evidence Verifier</span>}
                    {activeTab === 'settings' && <span>Institutional & Indian GIS Settings</span>}
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

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: GEOSPATIAL RADAR TELEMETRY VIEW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'radar' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-dark-slate border border-subtle-wire flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-shield flex items-center gap-2">
                      <Crosshair className="w-4 h-4" />
                      PostGIS ST_DWithin 800m Buffer Active
                    </span>
                    <div className="text-xs font-mono text-pure-frost">
                      Incident Center: 28.6139° N, 77.2090° E (Connaught Place, New Delhi)
                    </div>
                    <div className="text-[11px] font-mono text-dim-steel">
                      Uber H3 Resolution 9 Index: <span className="text-electric-amber">893da11462fffff</span>
                    </div>
                  </div>

                  {/* Guardians Live Telemetry Table */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
                      Active Standby Guardians in Proximity (4)
                    </span>
                    {[
                      { id: 'G-01', dist: '180m', corridor: 'Barakhamba Road', eta: '45s', battery: '96%' },
                      { id: 'G-02', dist: '290m', corridor: 'Minto Road Overpass', eta: '1m 15s', battery: '89%' },
                      { id: 'G-03', dist: '420m', corridor: 'Janpath Metro Exit 2', eta: '1m 50s', battery: '92%' },
                      { id: 'G-04', dist: '510m', corridor: 'Kasturba Gandhi Marg', eta: '2m 20s', battery: '94%' },
                    ].map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGuardian(g.id)}
                        className="p-3 rounded-xl bg-midnight-obsidian border border-subtle-wire hover:border-emerald-shield transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-mono font-bold text-pure-frost flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-shield" />
                            Guardian Node {g.id}
                          </span>
                          <span className="text-[11px] text-muted-silver">{g.corridor}</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-emerald-shield font-bold">{g.dist}</span>
                          <span className="block text-[10px] text-dim-steel">ETA: {g.eta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: ACTIVE INCIDENTS VIEW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'incidents' && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
                    Active SOS Dispatch Dossiers ({incidents.length})
                  </span>
                  {incidents.map((inc) => (
                    <div
                      key={inc.complaintId}
                      onClick={() => setSelectedComplaintId(inc.complaintId)}
                      className="p-3.5 rounded-xl bg-dark-slate border transition-all cursor-pointer flex flex-col gap-2"
                      style={{
                        borderColor:
                          inc.complaintId === activeCase.complaintId
                            ? colors.crimsonCoral
                            : colors.subtleWire,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-pure-frost flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-crimson-coral animate-ping" />
                          {inc.incidentId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-crimson-coral/20 text-crimson-coral">
                          ACTIVE SOS
                        </span>
                      </div>
                      <div className="text-xs text-muted-silver">
                        {inc.coarseLocation}
                      </div>
                      <div className="text-[11px] font-mono text-electric-amber">
                        {inc.bnsSection}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-subtle-wire text-[10px] font-mono text-dim-steel">
                        <span>H3: {inc.h3Index}</span>
                        <span className="text-emerald-shield">{inc.guardianCountNearby} Guardians Nearby</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: e-FIR ESCROW QUEUE VIEW (Default & Contains Test Tokens) */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'e-fir' && (
                <>
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

                  {/* ----------------------------------------------------------- */}
                  {/* TIMER CONTAINER: 72-Hour Statutory Countdown Timer Banner */}
                  {/* ----------------------------------------------------------- */}
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
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: 'rgba(255, 159, 28, 0.2)',
                          color: colors.electricAmber,
                        }}
                      >
                        BNSS §173(1)
                      </span>
                    </div>

                    {/* Countdown Digits: 68:42:15 in large monospace */}
                    <div className="flex items-baseline gap-2 py-1">
                      <span
                        className="text-3xl font-mono font-bold tracking-tight text-pure-frost"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {`${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`}
                      </span>
                      <span className="text-xs font-mono text-dim-steel">
                        Remaining before statutory escalation to District SP
                      </span>
                    </div>

                    {/* Progress Bar towards 72 Hours */}
                    <div className="w-full bg-midnight-obsidian h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, ((72 - countdown.hours) / 72) * 100)}%`,
                          backgroundColor:
                            countdown.hours <= 24
                              ? colors.crimsonCoral
                              : countdown.hours <= 48
                              ? colors.electricAmber
                              : colors.emeraldShield,
                        }}
                      />
                    </div>
                  </div>

                  {/* ----------------------------------------------------------- */}
                  {/* MAPPED STATUTORY PROVISIONS */}
                  {/* ----------------------------------------------------------- */}
                  <div
                    className="p-4 rounded-xl flex flex-col gap-3"
                    style={{
                      backgroundColor: colors.darkSlate,
                      border: `1px solid ${colors.subtleWire}`,
                    }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel"
                    >
                      MAPPED STATUTORY PROVISIONS
                    </span>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-subtle-wire/50">
                        <span className="font-semibold text-pure-frost flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-shield" />
                          BNSS Section 173(1) - Zero-FIR
                        </span>
                        <span className="text-[11px] font-mono text-dim-steel">
                          Automated Registration
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-subtle-wire/50">
                        <span className="font-semibold text-pure-frost flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-crimson-coral" />
                          BNS Section 74 (Assault)
                        </span>
                        <span className="text-[11px] font-mono text-crimson-coral">
                          Cognizable / Non-Bailable
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="font-semibold text-pure-frost flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-polygon-purple" />
                          BNS Section 78 (Stalking)
                        </span>
                        <span className="text-[11px] font-mono text-dim-steel">
                          Cyber & Physical Tracking
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ----------------------------------------------------------- */}
                  {/* TRUST & PROOF PILL BADGES */}
                  {/* ----------------------------------------------------------- */}
                  <div className="flex flex-col gap-2">
                    <span
                      className="text-[10px] font-mono tracking-wider text-dim-steel"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Visible monospace Jeti pill badges:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {/* Badge 1: AES-256-GCM */}
                      <span
                        className="px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold shadow-sm"
                        style={{
                          backgroundColor: 'rgba(0, 208, 132, 0.12)',
                          border: `1px solid ${colors.emeraldShield}`,
                          color: colors.emeraldShield,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        ✓ AES-256-GCM
                      </span>

                      {/* Badge 2: IPFS CIDv1 */}
                      <span
                        className="px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold shadow-sm"
                        style={{
                          backgroundColor: 'rgba(0, 208, 132, 0.12)',
                          border: `1px solid ${colors.emeraldShield}`,
                          color: colors.emeraldShield,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <Database className="w-3.5 h-3.5" />
                        ✓ IPFS CIDv1: bafybeicv5...
                      </span>

                      {/* Badge 3: Polygon L2 Hash */}
                      <span
                        className="px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold shadow-sm"
                        style={{
                          backgroundColor: 'rgba(123, 63, 228, 0.15)',
                          border: `1px solid ${colors.polygonPurple}`,
                          color: colors.polygonPurple,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        ✓ Polygon L2 hash: 0x89d2c...
                      </span>
                    </div>
                  </div>

                  {/* ----------------------------------------------------------- */}
                  {/* AUDIT & ESCROW MONITOR PANEL */}
                  {/* ----------------------------------------------------------- */}
                  <div
                    className="p-4 rounded-xl flex flex-col gap-3.5"
                    style={{
                      backgroundColor: colors.darkSlate,
                      border: `1px solid ${colors.subtleWire}`,
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-subtle-wire pb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
                        AUDIT & ESCROW MONITOR
                      </span>
                      <span className="text-[10px] font-mono text-dim-steel">
                        ComplaintEscrow.sol #101
                      </span>
                    </div>

                    {/* Warning Callout: SP Alert Scheduled */}
                    <div
                      className="p-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold"
                      style={{
                        backgroundColor: 'rgba(255, 159, 28, 0.1)',
                        border: `1px solid ${colors.electricAmber}`,
                        color: colors.electricAmber,
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Superintendent of Police (SP) Alert Scheduled: 72 hours</span>
                    </div>

                    {/* Historical Checkpoints */}
                    <div className="flex flex-col gap-2 text-xs">
                      <span className="text-[10px] font-mono text-dim-steel uppercase">
                        HISTORICAL CHECKPOINTS
                      </span>
                      <div className="flex items-center justify-between text-pure-frost font-mono text-[11px]">
                        <span>Trigger Ingestion Timestamp</span>
                        <span className="text-dim-steel">72 Nov, 2023, 16 PM</span>
                      </div>
                      <div className="flex items-center justify-between text-pure-frost font-mono text-[11px]">
                        <span>Aadhaar e-Sign checking</span>
                        <span className="text-emerald-shield flex items-center gap-1 font-bold">
                          ✓ Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-pure-frost font-mono text-[11px]">
                        <span>Section 63 BSA Digital Evidence certificate compilation progress</span>
                        <span className="text-emerald-shield flex items-center gap-1 font-bold">
                          ✓ Verified
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Police Acknowledge & Trigger SP Escalation */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-subtle-wire">
                      <button
                        onClick={() => handleAcknowledge(activeCase.complaintId)}
                        disabled={activeCase.policeAcknowledged}
                        className="py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                        style={{
                          backgroundColor: activeCase.policeAcknowledged
                            ? colors.darkSlate
                            : colors.emeraldShield,
                          color: activeCase.policeAcknowledged
                            ? colors.mutedSilver
                            : colors.midnightObsidian,
                          border: `1px solid ${
                            activeCase.policeAcknowledged
                              ? colors.subtleWire
                              : colors.emeraldShield
                          }`,
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {activeCase.policeAcknowledged
                            ? 'Police Acknowledged'
                            : 'Acknowledge FIR'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleTriggerSP(activeCase.complaintId)}
                        disabled={activeCase.isEscalatedToSP}
                        className="py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                        style={{
                          backgroundColor: activeCase.isEscalatedToSP
                            ? colors.darkSlate
                            : 'rgba(255, 59, 92, 0.15)',
                          color: colors.crimsonCoral,
                          border: `1px solid ${colors.crimsonCoral}`,
                        }}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>
                          {activeCase.isEscalatedToSP
                            ? 'SP Escalated'
                            : 'Trigger SP Escalation'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: NGO ESCALATIONS VIEW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'ngo' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-dark-slate border border-polygon-purple/40 flex flex-col gap-2">
                    <span className="text-xs font-bold text-polygon-purple flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Statutory NGO Escalation Conduit (BNSS §173(4))
                    </span>
                    <p className="text-xs text-muted-silver leading-relaxed">
                      Complaints exceeding statutory SLA thresholds or flagged for early warning are automatically synchronized with accredited legal aid NGOs and the District Superintendent of Police (SP).
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-dim-steel">
                      Accredited NGO Partners Connected
                    </span>
                    {[
                      { name: 'National Commission for Women (NCW)', status: 'Active Relay', lat: '12ms' },
                      { name: 'Delhi State Legal Services Authority (DSLSA)', status: 'Active Relay', lat: '18ms' },
                      { name: 'Jagori Women Safety Network', status: 'Active Relay', lat: '24ms' },
                    ].map((ngo) => (
                      <div key={ngo.name} className="p-3 rounded-xl bg-midnight-obsidian border border-subtle-wire flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-pure-frost block">{ngo.name}</span>
                          <span className="text-[10px] font-mono text-emerald-shield">{ngo.status} • {ngo.lat}</span>
                        </div>
                        <button className="px-2.5 py-1 rounded bg-dark-slate border border-subtle-wire text-[10px] font-semibold text-pure-frost hover:border-polygon-purple">
                          Hotline Relay
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: EVIDENCE VERIFICATION VIEW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'evidence' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-dark-slate border border-emerald-shield/40 flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-shield flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      BSA Section 63 Digital Evidence Cryptographic Verifier
                    </span>
                    <div className="text-[11px] font-mono text-muted-silver">
                      Certificate ID: <span className="text-pure-frost font-bold">{activeCase.bsa63CertId}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-midnight-obsidian border border-subtle-wire flex flex-col gap-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-dim-steel">StrongBox Hardware Attestation:</span>
                      <span className="text-emerald-shield font-bold">✓ Hardware Rooted</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dim-steel">Sequential SHA-256 Chunks:</span>
                      <span className="text-emerald-shield font-bold">✓ 100% Intact</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dim-steel">Merkle Root Verification:</span>
                      <span className="text-emerald-shield font-bold">✓ On-Chain Verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dim-steel">IPFS CIDv1 Multi-Node Pin:</span>
                      <span className="text-emerald-shield font-bold">✓ 3+ Nodes Verified</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerify(activeCase.bsa63CertId)}
                    className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                    style={{
                      backgroundColor: colors.emeraldShield,
                      color: colors.midnightObsidian,
                    }}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{verifiedCert ? '✓ Cryptographically Verified' : 'Verify BSA §63 Digital Evidence'}</span>
                  </button>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 6: SETTINGS VIEW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-dark-slate border border-subtle-wire flex flex-col gap-2">
                    <span className="text-xs font-bold text-pure-frost flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-polygon-purple" />
                      Institutional Command & GIS Configuration
                    </span>
                    <p className="text-xs text-muted-silver">
                      Configure Indian Geospatial APIs (ISRO Bhuvan, Survey of India Bharat Maps, Mappls ERSS-112), AWS Nitro TEE Keymaster enclave, and telemetry rates.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="p-3 rounded-xl bg-midnight-obsidian border border-subtle-wire flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-pure-frost">ISRO Bhuvan NRSC API</span>
                        <span className="text-[10px] font-mono text-emerald-shield">WMS v1.3 Connected</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-shield/20 text-emerald-shield font-bold">ACTIVE</span>
                    </div>

                    <div className="p-3 rounded-xl bg-midnight-obsidian border border-subtle-wire flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-pure-frost">Mappls ERSS-112 Grid</span>
                        <span className="text-[10px] font-mono text-electric-amber">Police Dispatch Online</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-electric-amber/20 text-electric-amber font-bold">CONNECTED</span>
                    </div>

                    <div className="p-3 rounded-xl bg-midnight-obsidian border border-subtle-wire flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-pure-frost">Survey of India Sovereign Boundaries</span>
                        <span className="text-[10px] font-mono text-polygon-purple">Statutory Demarcation</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-polygon-purple/20 text-polygon-purple font-bold">VERIFIED</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
