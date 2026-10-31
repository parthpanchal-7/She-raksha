She-Raksha Brand Style Guide

Design Systems, Identity & UI Specifications

# 1. Brand Identity & Personality

She-Raksha combines cutting-edge cryptographic engineering with an uncompromised commitment to personal safety. The identity reflects sovereignty, technical rigor, and calm authority.

- **Core Essence:** Cryptographic certainty, personal sovereignty, immediate protection.
- **Tone of Voice:** Direct, calm, authoritative, and empowering. Avoid alarmist or victimizing rhetoric; focus firmly on resilience, legal validity, and agency.
- **Tagline:** "Capture once, prove forever, share only what you choose."

# 2. Color Palette

The visual system utilizes an ambient dark canvas with precise functional accents designed to convey urgency, integrity, and cryptographic state transitions without causing user fatigue.

## Primary Brand Palette

| Token Role    | Color Name        | Hex Code | Purpose & Application                                             |
| ------------- | ----------------- | -------- | ----------------------------------------------------------------- |
| Canvas / Root | Midnight Obsidian | #0A0D12  | Global dark background, viewport root, deep background cards      |
| ---           | ---               | ---      | ---                                                               |
| Surface Base  | Dark Slate        | #121824  | Component containers, modals, bottom sheets, navigation bars      |
| ---           | ---               | ---      | ---                                                               |
| Brand Signal  | Crimson Coral     | #FF3B5C  | SOS triggers, critical CTAs, countdown alerts, primary brand mark |
| ---           | ---               | ---      | ---                                                               |
| High Accent   | Electric Amber    | #FF9F1C  | Escalation warnings, pending timers, active status markers        |
| ---           | ---               | ---      | ---                                                               |

## Functional & Cryptographic Tokens

| Token Role          | Color Name              | Hex Code | Purpose & Application                                            |
| ------------------- | ----------------------- | -------- | ---------------------------------------------------------------- |
| Cryptographic Trust | Polygon Purple / Indigo | #7B3FE4  | ZK badge proofs, smart contract links, wallet/blockchain status  |
| ---                 | ---                     | ---      | ---                                                              |
| Verified State      | Emerald Shield          | #00D084  | Hash anchored confirmation, guardian connected, receipt verified |
| ---                 | ---                     | ---      | ---                                                              |
| Structural Neutral  | Subtle Wire             | #222F3E  | Card borders, dividers, inactive container strokes               |
| ---                 | ---                     | ---      | ---                                                              |

## Typography Neutrals

| Token Role     | Color Name   | Hex Code | Usage Guidelines                                                    |
| -------------- | ------------ | -------- | ------------------------------------------------------------------- |
| Text Primary   | Pure Frost   | #F8FAFC  | Display headings, screen titles, primary metrics, active buttons    |
| ---            | ---          | ---      | ---                                                                 |
| Text Secondary | Muted Silver | #94A3B8  | Standard body copy, secondary descriptive labels, meta descriptions |
| ---            | ---          | ---      | ---                                                                 |
| Text Tertiary  | Dim Steel    | #64748B  | Timestamp details, raw contract hashes, disabled states             |
| ---            | ---          | ---      | ---                                                                 |

# 3. Typography Hierarchy

The type system prioritizes technical legibility, immediate clarity in high-stress interactions, and standardized formatting for cryptographic receipts.

- **Primary Heading & Display:** Plus Jakarta Sans or Inter (Weight: 700 Bold / 600 SemiBold)
- **Body & UI Elements:** Inter (Weight: 400 Regular / 500 Medium)
- **Data, Hashes & Legal Codes:** JetBrains Mono or Fira Code (Weight: 500 Medium)

## Scale & Application Specifications

| Hierarchy Level           | Font & Weight              | Size / Line Height | Tracking & Details          |
| ------------------------- | -------------------------- | ------------------ | --------------------------- |
| Display (Hero / Taglines) | Plus Jakarta Sans Bold     | 32px – 40px / 1.15 | \-0.02em letter-spacing     |
| ---                       | ---                        | ---                | ---                         |
| H1 / Screen Titles        | Plus Jakarta Sans SemiBold | 24px – 28px / 1.2  | \-0.01em letter-spacing     |
| ---                       | ---                        | ---                | ---                         |
| H2 / Section Headers      | Plus Jakarta Sans SemiBold | 18px – 20px / 1.25 | Standard tracking           |
| ---                       | ---                        | ---                | ---                         |
| Body Regular              | Inter Regular              | 14px – 15px / 1.5  | General readability default |
| ---                       | ---                        | ---                | ---                         |
| Microcopy & Captions      | Inter Medium               | 12px / 1.4         | Muted Silver (#94A3B8) tone |
| ---                       | ---                        | ---                | ---                         |
| Code / Hash Badges        | JetBrains Mono Medium      | 11px – 13px / 1.2  | Uppercase, tabular layout   |
| ---                       | ---                        | ---                | ---                         |

# 4. UI Components & Layout Rules

## Corners & Radii

- **Cards & Containers:** 12px to 16px corner radius for rounded, contained framing.
- **Buttons & Tags:** 8px radius for actionable standard inputs; fully pill-shaped (9999px) for active badges and state pills.

## Elevation & Borders

- **Border Definition:** Eliminate heavy, muddy drop shadows. Rely exclusively on subtle 1px solid borders (#222F3E) overlaid against Dark Slate (#121824) surfaces.
- **Active Glow:** For high-priority surfaces (e.g., active e-FIR generation, live SOS countdown), deploy a disciplined radial glow positioned behind the card, matching the accent color at 10% opacity.

## Critical SOS Triggers

- **Color Reservation:** Crimson Coral (#FF3B5C) is strictly reserved for SOS escalation paths and high-criticality primary actions.
- **Alert Fatigue Prevention:** Never deploy Crimson Coral on routine dismissals, secondary workflows, or non-critical actions.

# 5. Imagery, Icons & Tone

## Iconography Guidelines

- Clean, geometric line icons adhering to Feather or Lucide standards.
- Standardized stroke weight of 1.75px to 2px across all system sizes.
- Inactive strokes utilize Subtle Wire (#222F3E) or Muted Silver (#94A3B8); verified or activated icons adopt Emerald Shield (#00D084) or Crimson Coral (#FF3B5C).

## Cryptographic Artifacts & Proof Badges

- Every ledger-bound artifact (IPFS CID, Polygon transaction digest, ZK proof state) must be formatted in monospace type inside a compact pill container.
- Integrate an Emerald Shield verified indicator alongside verified cryptographic receipts.

## Content Voice in Prompts & Modals

| Interaction State   | Preferred Content Voice                                                              | Forbidden / Alarmist Phrasing                                 |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Hash Anchor Success | "Evidence encrypted on-device. Digest anchored on Polygon L2."                       | "Don't panic! Your files are safely hidden now."              |
| ---                 | ---                                                                                  | ---                                                           |
| Guardian Escalation | "Emergency protocol initiated. 3 trusted guardians notified with verified location." | "Danger detected! We are trying to find someone to help you!" |
| ---                 | ---                                                                                  | ---                                                           |
| Data Custody State  | "Zero-knowledge proof generated. Identity attributes remain confidential."           | "Your secret data is locked away where no one can find it."   |
| ---                 | ---                                                                                  | ---                                                           |