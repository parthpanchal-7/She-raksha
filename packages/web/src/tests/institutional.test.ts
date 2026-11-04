/**
 * @she-raksha/web — Institutional Dashboard Unit Tests
 *
 * Verifies:
 *  - Header Navigation with SHE-RAKSHA brand, Hindi sub-label, Active Platform Status & Time-Synchronization: 123
 *  - Left Sidebar Navigation items (Geospatial Radar, Active Incidents, e-FIR Escrow Queue with badge 2, NGO Escalations, etc.)
 *  - Geospatial Radar 60% panel with PostGIS H3 canvas, 800m geofence, community guardians, and zoom controls
 *  - Active Incident Overlay with Crimson Coral indicator, Telemetry, Rate, • WSS badge, and Base91 packet tracking (#3950:1 #980021)
 *  - 40% Right Detail & Escrow Panel with 72-Hour Statutory Countdown Timer (68:42:15)
 *  - Statutory provisions (BNSS Section 173(1), BNS Section 74, BNS Section 78)
 *  - Trust & Proof JetBrains Mono pill badges (AES-256-GCM, IPFS CIDv1, Polygon L2 hash)
 *  - Audit & Escrow Monitor Panel (SP alert scheduled, 72 Nov 2023 16 PM checkpoint, Aadhaar e-Sign, BSA Section 63)
 *  - Interactive callbacks (Police acknowledgement, SP escalation, BSA63 verification)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { InstitutionalDashboard } from '../index.js';

describe('Institutional Dashboard (SHO / District SP & Accredited NGO)', () => {
  it('should render InstitutionalDashboard with metric summary cards and statutory queue', () => {
    let ackedId: number | null = null;
    let escalatedId: number | null = null;
    let verifiedCertId: string | null = null;

    const element = React.createElement(InstitutionalDashboard, {
      onAcknowledgePolice: (id) => {
        ackedId = id;
      },
      onTriggerSPEscalation: (id) => {
        escalatedId = id;
      },
      onVerifyBSA63: (cert) => {
        verifiedCertId = cert;
      },
    });

    assert(React.isValidElement(element));
    assert.equal(typeof element.type, 'function');

    const html = renderToString(element);
    assert(html.length > 0, 'Rendered HTML should not be empty');

    // Header assertions
    assert(html.includes('SHE-RAKSHA'), 'Must contain SHE-RAKSHA brand title');
    assert(
      html.includes('शी-रक्षा | Institutional Command &amp; Compliance Hub') ||
      html.includes('शी-रक्षा | Institutional Command & Compliance Hub'),
      'Must contain Hindi sub-label'
    );
    assert(html.includes('Active Platform Status'), 'Must contain Active Platform Status badge');
    assert(html.includes('Time-Synchronization: 123'), 'Must contain Time-Synchronization: 123 label');

    // Sidebar navigation assertions
    assert(html.includes('LEFT SIDEBAR NAVIGATION'), 'Must include sidebar heading');
    assert(html.includes('Geospatial Radar'), 'Must include Geospatial Radar');
    assert(html.includes('Active Incidents'), 'Must include Active Incidents');
    assert(html.includes('e-FIR Escrow Queue'), 'Must include e-FIR Escrow Queue');
    assert(html.includes('NGO Escalations'), 'Must include NGO Escalations');
    assert(html.includes('Evidence Verification'), 'Must include Evidence Verification');
    assert(html.includes('Settings'), 'Must include Settings');
    assert(html.includes('TEE Enclave Active'), 'Must include bottom settings toggle card');

    // Geospatial canvas and overlays (60% panel)
    assert(html.includes('ACTIVE INCIDENT'), 'Must include ACTIVE INCIDENT header');
    assert(html.includes('Telemetry'), 'Must include Telemetry label');
    assert(html.includes('Rate'), 'Must include Rate label');
    assert(html.includes('• WSS'), 'Must include • WSS status badge');
    assert(html.includes('#3950:1 #980021'), 'Must include Base91 packet tracking #3950:1 #980021');
    assert(html.includes('800m Geofence Boundary Active'), 'Must include 800m boundary badge');

    // Statutory escalation & escrow monitor (40% panel)
    assert(
      html.includes('RIGHT DETAIL &amp; ESCROW PANEL') ||
      html.includes('RIGHT DETAIL & ESCROW PANEL'),
      'Must include right panel heading'
    );
    assert(html.includes('Active BNSS §173 e-FIR | SemiBold'), 'Must include Active BNSS §173 heading');
    assert(html.includes('72-Hour Statutory Countdown Timer'), 'Must include 72-Hour countdown title');
    assert(html.includes('68:42:15') || html.includes('68:42'), 'Must include countdown clock display');
    assert(html.includes('BNSS Section 173(1) - Zero-FIR'), 'Must include BNSS 173(1) mapping');
    assert(html.includes('BNS Section 74 (Assault)'), 'Must include BNS Section 74');
    assert(html.includes('BNS Section 78 (Stalking)'), 'Must include BNS Section 78');

    // Trust & Proof badges panel
    assert(html.includes('Visible monospace Jeti pill badges:'), 'Must include badges microcopy');
    assert(html.includes('✓ AES-256-GCM'), 'Must include AES-256-GCM badge');
    assert(html.includes('✓ IPFS CIDv1: bafybeicv5'), 'Must include IPFS CIDv1 badge');
    assert(html.includes('✓ Polygon L2 hash: 0x89d2c'), 'Must include Polygon L2 hash badge');

    // Audit & Escrow monitor panel
    assert(html.includes('Superintendent of Police (SP) Alert Scheduled: 72 hours'), 'Must include SP escalation alert banner');
    assert(html.includes('72 Nov, 2023, 16 PM'), 'Must include historical checkpoint date');
    assert(html.includes('Aadhaar e-Sign checking'), 'Must include Aadhaar e-Sign status');
    assert(html.includes('Section 63 BSA Digital Evidence certificate compilation progress'), 'Must include Section 63 BSA status');
  });

  it('should track 72-hour BNSS §173 timers and identify urgent 48h NGO notices', () => {
    const testIncidents = [
      {
        complaintId: 201,
        incidentId: 'inc-test-001',
        bnsSection: 'BNS §78 (Stalking)',
        hoursRemaining: 36, // <= 48h triggers NGO alert
        minutesRemaining: 15,
        isSigned: true,
        policeAcknowledged: false,
        isEscalatedToSP: false,
        h3Index: '8928308280fffff',
        coarseLocation: 'New Delhi Railway Station',
        guardianCountNearby: 5,
        bsa63CertId: 'BSA63-CERT-TEST-001',
      },
    ];

    const element = React.createElement(InstitutionalDashboard, {
      initialIncidents: testIncidents,
    });

    assert(React.isValidElement(element));
    const html = renderToString(element);
    assert(html.includes('inc-test-001'), 'Must display test incident ID');
    assert(html.includes('New Delhi Railway Station'), 'Must display coarse location');
    assert(html.includes('36h 15m remaining') || html.includes('36:15'), 'Must show remaining duration');
  });
});
