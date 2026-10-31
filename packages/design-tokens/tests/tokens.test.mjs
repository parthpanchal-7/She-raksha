import test from 'node:test';
import assert from 'node:assert/strict';
import { colors } from '../dist/colors.js';
import { typography } from '../dist/typography.js';
import { radii } from '../dist/radii.js';
import { touchTargets } from '../dist/touchTargets.js';
import { borders } from '../dist/borders.js';
import { sheRakshaTailwindPreset } from '../dist/tailwindPreset.js';
import { reactNativeTheme } from '../dist/reactNativeTheme.js';

test('She-Raksha 10-Token Brand Colors Match Canonical Spec', () => {
  assert.equal(colors.midnightObsidian, '#0A0D12', 'Midnight Obsidian must be #0A0D12');
  assert.equal(colors.darkSlate, '#121824', 'Dark Slate must be #121824');
  assert.equal(colors.crimsonCoral, '#FF3B5C', 'Crimson Coral must be #FF3B5C');
  assert.equal(colors.electricAmber, '#FF9F1C', 'Electric Amber must be #FF9F1C');
  assert.equal(colors.polygonPurple, '#7B3FE4', 'Polygon Purple must be #7B3FE4');
  assert.equal(colors.emeraldShield, '#00D084', 'Emerald Shield must be #00D084');
  assert.equal(colors.subtleWire, '#222F3E', 'Subtle Wire must be #222F3E');
  assert.equal(colors.pureFrost, '#F8FAFC', 'Pure Frost must be #F8FAFC');
  assert.equal(colors.mutedSilver, '#94A3B8', 'Muted Silver must be #94A3B8');
  assert.equal(colors.dimSteel, '#64748B', 'Dim Steel must be #64748B');

  // Verify exact 10 tokens exist
  const tokenKeys = Object.keys(colors);
  assert.equal(tokenKeys.length, 10, 'Must have exactly 10 canonical brand color tokens');
});

test('Component Radii & Touch Target Safety Invariants', () => {
  assert.equal(radii.card, '16px', 'Card radius must be 16px');
  assert.equal(radii.cardSmall, '12px', 'Small card radius must be 12px');
  assert.equal(radii.button, '8px', 'Button radius must be 8px');
  assert.equal(radii.pill, '9999px', 'Pill radius must be 9999px');

  assert.ok(touchTargets.sosMin >= 48, 'SOS trigger minimum touch target must be at least 48x48pt for safety');
  assert.equal(borders.wire, '1px solid #222F3E', 'Border wire must be 1px solid #222F3E');
});

test('Typography & Font Families Integrity', () => {
  assert.match(typography.fonts.heading, /Plus Jakarta Sans/, 'Headings must use Plus Jakarta Sans');
  assert.match(typography.fonts.body, /Inter/, 'Body text must use Inter');
  assert.match(typography.fonts.mono, /JetBrains Mono/, 'Hashes & CIDs must use JetBrains Mono');
});

test('Tailwind Preset & React Native Theme Integration', () => {
  assert.equal(sheRakshaTailwindPreset.theme.extend.colors['crimson-coral'], '#FF3B5C');
  assert.equal(sheRakshaTailwindPreset.theme.extend.colors['midnight-obsidian'], '#0A0D12');
  assert.equal(reactNativeTheme.colors.crimsonCoral, '#FF3B5C');
  assert.equal(reactNativeTheme.cardStyle.backgroundColor, '#121824');
  assert.equal(reactNativeTheme.sosButtonStyle.minWidth, 48);
  assert.equal(reactNativeTheme.sosButtonStyle.minHeight, 48);
});
