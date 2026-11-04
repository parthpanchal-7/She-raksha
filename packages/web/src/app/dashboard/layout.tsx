'use client';

/**
 * @she-raksha/web — Institutional Dashboard Shared Layout
 *
 * Provides:
 *  - Persistent Header with SHE-RAKSHA brand, Hindi sub-label, and Active Status
 *  - Persistent Left Sidebar Navigation adhering strictly to @she-raksha/design-tokens:
 *     - Active Incidents with pill badge LIVE (Crimson Coral #FF3B5C background)
 *     - e-FIR Escrow Queue with circular outline badge 2 (Electric Amber #FF9F1C)
 *     - Lucide React icons: Map, AlertCircle, FileText, ShieldAlert, Key, Settings
 *  - Right-hand main content area rendering children routes
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map as MapIcon,
  AlertCircle,
  FileText,
  ShieldAlert,
  Key,
  Settings,
  CheckCircle2,
  Radio,
  ChevronRight,
  ChevronLeft,
  Database,
  Shield,
} from 'lucide-react';
import { colors } from '@she-raksha/design-tokens';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [syncTime, setSyncTime] = useState<number>(123);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncTime((prev) => (prev >= 999 ? 100 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    {
      label: 'Geospatial Radar',
      href: '/institutional',
      icon: MapIcon,
      badge: null,
      color: colors.crimsonCoral,
    },
    {
      label: 'Active Incidents',
      href: '/institutional',
      icon: AlertCircle,
      badge: (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
          style={{
            backgroundColor: colors.crimsonCoral, // #FF3B5C background
            color: colors.pureFrost,
          }}
        >
          LIVE
        </span>
      ),
      color: colors.crimsonCoral,
    },
    {
      label: 'e-FIR Escrow Queue',
      href: '/dashboard/efir-queue',
      icon: FileText,
      badge: (
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
          style={{
            border: `1px solid ${colors.electricAmber}`, // Circular outline badge #FF9F1C
            color: colors.electricAmber,
          }}
        >
          2
        </span>
      ),
      color: colors.electricAmber,
    },
    {
      label: 'NGO Escalations',
      href: '/dashboard/ngo-escalations',
      icon: ShieldAlert,
      badge: null,
      color: colors.polygonPurple,
    },
    {
      label: 'Evidence Verification',
      href: '/dashboard/evidence-verification',
      icon: Key,
      badge: null,
      color: colors.emeraldShield,
    },
    {
      label: 'Settings',
      href: '/institutional',
      icon: Settings,
      badge: null,
      color: colors.dimSteel,
    },
  ];

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: colors.midnightObsidian, // #0A0D12
        color: colors.pureFrost, // #F8FAFC
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. HEADER NAVIGATION (Height 64px, 1px solid #222F3E) */}
      {/* ------------------------------------------------------------------- */}
      <header
        className="flex items-center justify-between px-6 h-16 w-full z-30 flex-shrink-0"
        style={{
          height: '64px',
          borderBottom: `1px solid ${colors.subtleWire}`,
          backgroundColor: colors.midnightObsidian,
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/institutional" className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm"
              style={{
                backgroundColor: colors.crimsonCoral,
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
                color: colors.pureFrost,
                letterSpacing: '0.05em',
              }}
            >
              SHE-RAKSHA
            </span>
          </Link>

          <div className="h-4 w-px" style={{ backgroundColor: colors.subtleWire }} />

          <span className="text-xs font-medium" style={{ color: colors.mutedSilver }}>
            शी-रक्षा | Institutional Command & Compliance Hub
          </span>
        </div>

        {/* Right Status Panel */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(0, 208, 132, 0.1)',
              border: `1px solid ${colors.emeraldShield}`,
              color: colors.emeraldShield,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldShield }} />
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Platform Status</span>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
              color: colors.mutedSilver,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-shield animate-pulse" style={{ color: colors.emeraldShield }} />
            <span>{`Time-Synchronization: ${syncTime}`}</span>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. BODY CONTAINER: SIDEBAR + RIGHT-HAND MAIN CONTENT */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Floating Sidebar Reopen Tab */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
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

        {/* Left Sidebar Navigation */}
        {!isSidebarCollapsed && (
          <aside
            className="flex flex-col justify-between p-4 h-full flex-shrink-0 transition-all duration-300 z-20"
            style={{
              width: '260px',
              borderRight: `1px solid ${colors.subtleWire}`,
              backgroundColor: colors.midnightObsidian,
            }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{
                    color: colors.dimSteel,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  LEFT SIDEBAR NAVIGATION
                </span>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost cursor-pointer border border-transparent hover:border-subtle-wire"
                  title="Hide Sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
                      style={{
                        backgroundColor: isActive ? colors.darkSlate : 'transparent',
                        border: `1px solid ${isActive ? colors.subtleWire : 'transparent'}`,
                        color: isActive ? colors.pureFrost : colors.mutedSilver,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        item.badge
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Enclave Card */}
            <div
              className="p-3.5 rounded-xl flex flex-col gap-2.5 shadow-sm"
              style={{
                backgroundColor: colors.darkSlate,
                border: `1px solid ${colors.subtleWire}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-pure-frost flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-polygon-purple" style={{ color: colors.polygonPurple }} />
                  TEE Enclave Active
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.emeraldShield }} />
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: colors.dimSteel }}>
                AWS Nitro TEE • StrongBox v3.4 Keymaster Synchronized
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
        )}

        {/* Right-Hand Main Content Area */}
        <main className="flex-1 h-full overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
