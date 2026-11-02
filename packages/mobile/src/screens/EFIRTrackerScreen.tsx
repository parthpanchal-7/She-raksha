/**
 * @she-raksha/mobile — Screen 3: Automated BNSS §173 e-FIR Generator & 72-Hour Countdown Tracker
 *
 * Implements FR-EV-004, FR-EV-005, FR-EV-006, and BNSS §173:
 *  - 72-Hour statutory countdown timer (259,200 seconds) in JetBrains Mono with Electric Amber accent
 *  - 48-Hour NGO early-warning notice
 *  - Automated BNSS §173(4) Superintendent of Police (SP) escalation trigger
 *  - Voice statement input across 22 Eighth Schedule Indian languages
 *  - Live BNS statutory violation badges: BNS §74, BNS §75, BNS §78, BNS §351(2)
 */

import React, { useState } from 'react';
import { colors } from '@she-raksha/design-tokens';
import { Card } from '../ui/components/Card.js';
import { PillBadge } from '../ui/components/PillBadge.js';
import { TouchTarget } from '../ui/components/TouchTarget.js';
import { VOICE_COPY } from '../ui/voiceCopy.js';

export const EIGHTH_SCHEDULE_LANGUAGES = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam',
  'Punjabi', 'Assamese', 'Maithili', 'Santali', 'Kashmiri',
  'Nepali', 'Konkani', 'Sindhi', 'Dogri', 'Manipuri',
  'Bodo', 'Sanskrit'
] as const;

export interface EFIRRecordData {
  efirId: string;
  incidentId: string;
  signDeadlineEpoch: number; // e.g. Date.now() + 72*3600*1000
  isSigned: boolean;
  policeAcknowledged: boolean;
  isEscalated: boolean;
  detectedBnsSections: string[];
  victimStatement: string;
  selectedLanguage: string;
}

export interface EFIRTrackerScreenProps {
  initialData?: EFIRRecordData;
  onRecordVoiceStatement?: () => void;
  onSubmitSignature?: () => void;
  onBack?: () => void;
}

export const EFIRTrackerScreen: React.FC<EFIRTrackerScreenProps> = ({
  initialData = {
    efirId: 'EFIR-DL-2026-98124',
    incidentId: 'inc-9921-3841',
    signDeadlineEpoch: Date.now() + 259200 * 1000, // 72 hours
    isSigned: false,
    policeAcknowledged: false,
    isEscalated: false,
    detectedBnsSections: ['BNS §74 (Outraging Modesty)', 'BNS §78 (Stalking)'],
    victimStatement: 'Accused followed survivor from Metro Station and issued threats.',
    selectedLanguage: 'Hindi',
  },
  onRecordVoiceStatement,
  onSubmitSignature,
  onBack,
}) => {
  const [data, setData] = useState<EFIRRecordData>(initialData);
  const [selectedLanguage, setSelectedLanguage] = useState(data.selectedLanguage);
  const [statementText, setStatementText] = useState(data.victimStatement);

  // Calculate remaining seconds
  const remainingSeconds = Math.max(0, Math.floor((data.signDeadlineEpoch - Date.now()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isNGOEarlyWarningActive = hours <= 48;
  const isSPEscalationTriggered = remainingSeconds === 0 && !data.policeAcknowledged;

  return (
    <div
      data-testid="efir-tracker-screen"
      style={{
        backgroundColor: colors.midnightObsidian,
        color: colors.pureFrost,
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              margin: 0,
            }}
          >
            BNSS §173 e-FIR & Escalation Tracker
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.mutedSilver }}>
            {VOICE_COPY.EFIR_COUNTDOWN}
          </p>
        </div>
        {onBack && (
          <TouchTarget
            onClick={onBack}
            style={{
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
              color: colors.pureFrost,
              fontSize: '12px',
            }}
            testID="efir-back-button"
          >
            ← Back
          </TouchTarget>
        )}
      </div>

      {/* 72-Hour Statutory Countdown Card */}
      <Card
        accentBorderColor={colors.electricAmber}
        hasGlow={true}
        testID="countdown-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: colors.electricAmber, textTransform: 'uppercase' }}>
            Statutory 72-Hour Police Sign Window (BNSS §173)
          </span>
          <PillBadge label={data.efirId} isVerified={true} testID="efir-id-badge" />
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            data-testid="timer-display"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '36px',
              fontWeight: 700,
              color: colors.electricAmber,
              letterSpacing: '2px',
            }}
          >
            {formattedCountdown}
          </div>
          <span style={{ fontSize: '12px', color: colors.dimSteel }}>
            Hours : Minutes : Seconds remaining before SP escalation
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <PillBadge
            label={`48H NGO WARNING: ${isNGOEarlyWarningActive ? 'TRIGGERED' : 'PENDING'}`}
            isVerified={isNGOEarlyWarningActive}
            accentColor={isNGOEarlyWarningActive ? colors.electricAmber : colors.dimSteel}
            testID="ngo-warning-badge"
          />
          <PillBadge
            label={`SP ESCALATION §173(4): ${isSPEscalationTriggered ? 'ACTIVE' : 'READY'}`}
            isVerified={isSPEscalationTriggered}
            accentColor={isSPEscalationTriggered ? colors.crimsonCoral : colors.emeraldShield}
            testID="sp-escalation-badge"
          />
        </div>
      </Card>

      {/* Detected BNS Sections */}
      <Card testID="bns-sections-card">
        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.mutedSilver, textTransform: 'uppercase' }}>
          Statutory Violations Identified (Bharatiya Nyaya Sanhita)
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} data-testid="bns-badges-container">
          {data.detectedBnsSections.map((sec) => (
            <PillBadge
              key={sec}
              label={sec}
              isVerified={true}
              accentColor={colors.polygonPurple}
              backgroundColor="rgba(123, 63, 228, 0.15)"
            />
          ))}
        </div>
      </Card>

      {/* Multilingual Voice Statement Input */}
      <Card testID="multilingual-statement-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: colors.mutedSilver, textTransform: 'uppercase' }}>
            Survivor Statement (22 Eighth Schedule Languages)
          </span>
          <select
            data-testid="language-selector"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              backgroundColor: colors.midnightObsidian,
              color: colors.pureFrost,
              border: `1px solid ${colors.subtleWire}`,
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '12px',
            }}
          >
            {EIGHTH_SCHEDULE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <textarea
          data-testid="statement-textarea"
          value={statementText}
          onChange={(e) => setStatementText(e.target.value)}
          rows={3}
          style={{
            backgroundColor: colors.midnightObsidian,
            color: colors.pureFrost,
            border: `1px solid ${colors.subtleWire}`,
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            resize: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <TouchTarget
            onClick={onRecordVoiceStatement}
            style={{
              flex: 1,
              backgroundColor: colors.darkSlate,
              border: `1px solid ${colors.subtleWire}`,
              color: colors.pureFrost,
              fontSize: '13px',
            }}
            testID="record-voice-button"
          >
            🎙️ Record Voice in {selectedLanguage}
          </TouchTarget>
          <TouchTarget
            onClick={onSubmitSignature}
            style={{
              flex: 1,
              backgroundColor: colors.polygonPurple,
              color: colors.pureFrost,
              fontWeight: 600,
              fontSize: '13px',
            }}
            testID="sign-efir-button"
          >
            ✍️ Sign e-FIR (Aadhaar / Passkey)
          </TouchTarget>
        </div>
      </Card>
    </div>
  );
};
