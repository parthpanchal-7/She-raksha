/**
 * @she-raksha/web — High-Resolution UI Screenshot Generator
 *
 * Implements Phase 12 Deliverable 2:
 *  - Uses Playwright headless browser to render real components
 *  - Generates 5 high-resolution UI screenshots under docs/screenshots/
 *  - Matches the 10-token Brand Style Guide (#0A0D12, #121824, #FF3B5C, #FF9F1C, #7B3FE4, #00D084)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';

// Import screens from @she-raksha/mobile and @she-raksha/web
import {
  StealthHomeScreen,
  EvidenceVaultScreen,
  EFIRTrackerScreen,
  BystanderReportScreen,
  SafeJourneyRadarScreen,
} from '@she-raksha/mobile';
import { InstitutionalDashboard } from '../components/InstitutionalDashboard.js';

const OUTPUT_DIR = path.resolve(process.cwd(), '../../docs/screenshots');

function wrapHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en" style="background-color: #0A0D12; color: #F8FAFC;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0A0D12;
      color: #F8FAFC;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching headless browser to capture She-Raksha UI screenshots...');

  // Try launching system Chrome or Edge
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
    });
  } catch {
    try {
      browser = await chromium.launch({
        headless: true,
        channel: 'msedge',
      });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }

  const targets = [
    {
      file: '01-sos-command-center-multirail.png',
      width: 412,
      height: 915,
      title: 'She-Raksha SOS Command Center & Multi-Rail Resilience',
      element: React.createElement(StealthHomeScreen as any, {
        initialDecoyMode: false,
        multiRailStatus: {
          railA: { connected: true, rttMs: 78 },
          railB: { armed: true, queueCount: 0 },
          railC: { active: true, peersNearby: 4 },
        },
      }),
    },
    {
      file: '02-evidence-vault-bsa63-certificate.png',
      width: 412,
      height: 915,
      title: 'Tamper-Proof Evidence Vault & BSA §63 Digital Certificate',
      element: React.createElement(EvidenceVaultScreen as any, {
        chunks: [
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
        certificate: {
          certificateId: 'BSA63-CERT-AMOY-20261103-0982',
          sessionId: '0x4f12ab98cd34ef760123456789abcdef0123456789abcdef0123456789abcdef',
          merkleRoot: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
          enclaveType: 'Android StrongBox Keymaster',
          statutoryNotice: 'Certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (Admissibility of electronic records)',
          lawEnforcementGrantActive: true,
          ngoGrantActive: true,
        },
      }),
    },
    {
      file: '03-bnss173-efir-72hr-countdown.png',
      width: 412,
      height: 915,
      title: 'Automated BNSS §173 e-FIR & 72-Hour SP Escalation Countdown',
      element: React.createElement(EFIRTrackerScreen as any, {
        initialData: {
          efirId: 'EFIR-DL-2026-98124',
          incidentId: 'inc-9921-3841',
          signDeadlineEpoch: Date.now() + 259182 * 1000,
          isSigned: false,
          policeAcknowledged: false,
          isEscalated: false,
          detectedBnsSections: ['BNS §74 (Outraging Modesty)', 'BNS §78 (Stalking)', 'BNS §351(2) (Intimidation)'],
          victimStatement: 'Accused blocked pedestrian path and issued verbal threats upon leaving the metro station.',
          selectedLanguage: 'Hindi',
        },
      }),
    },
    {
      file: '04-zk-bystander-groth16-prover.png',
      width: 412,
      height: 915,
      title: 'Zero-Knowledge Bystander Reporter with Geohash-6 Shield',
      element: React.createElement(BystanderReportScreen as any, {
        initialGeohash6: 'ttnfuc',
      }),
    },
    {
      file: '05-police-ngo-postgis-dashboard.png',
      width: 1440,
      height: 900,
      title: 'Station House Officer & District SP PostGIS Operations Dashboard',
      element: React.createElement(InstitutionalDashboard as any, {}),
    },
  ];

  for (const target of targets) {
    const rawHtml = renderToStaticMarkup(target.element);
    const fullHtml = wrapHtml(rawHtml, target.title);

    const page = await browser.newPage({
      viewport: { width: target.width, height: target.height },
      deviceScaleFactor: 2, // High DPI retina capture
    });

    await page.setContent(fullHtml, { waitUntil: 'networkidle' });
    // Brief sleep to ensure web fonts render smoothly
    await page.waitForTimeout(400);

    const outPath = path.resolve(OUTPUT_DIR, target.file);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${outPath} (${target.width}x${target.height} @2x)`);
    await page.close();
  }

  await browser.close();
  console.log('All 5 high-resolution UI screenshots captured successfully in docs/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot generation error:', err);
  process.exit(1);
});
