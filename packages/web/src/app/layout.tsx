/**
 * @she-raksha/web — Root Layout
 *
 * Implements Brand Design Tokens:
 *  - Canvas / Root: Midnight Obsidian (#0A0D12)
 *  - Typography: Plus Jakarta Sans, Inter, JetBrains Mono
 */

import React from 'react';

export const metadata = {
  title: 'She-Raksha (शी-रक्षा) — Decentralized Women’s Safety & Legal Platform',
  description: 'Offline-First Multi-Rail SOS Dispatch, Zero-Knowledge Bystander Reporting & Automated BNSS §173 / BSA §63 Legal Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ backgroundColor: '#0A0D12', color: '#F8FAFC' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #0A0D12;
            color: #F8FAFC;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
