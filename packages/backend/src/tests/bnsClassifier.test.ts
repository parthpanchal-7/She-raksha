/**
 * @she-raksha/backend — Multilingual NLP & BNS Statutory Mapping Tests (FR-EV-004)
 *
 * Verifies:
 *  - Multilingual voice/text incident parsing across 22 Eighth Schedule Indian languages + English
 *  - Deterministic classification of BNS §74, §75, §78, §79, §85, §351(2)
 *  - Chronological entity extraction (temporal, spatial, perpetrator, threat levels)
 *  - Automated eFIRRecord generation compliant with BNSS §173(1) (72-hour deadline)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BNSClassifierEngine,
  EIGHTH_SCHEDULE_LANGUAGES,
} from '../legal/bnsClassifier.js';
import { BNSSection, EFIRStatus, BNSS_173_DEADLINE_SECONDS, NGO_EARLY_WARNING_SECONDS } from '@she-raksha/schemas';

describe('Multilingual NLP & BNS Statutory Mapping Engine (FR-EV-004)', () => {
  const engine = new BNSClassifierEngine();

  test('recognizes all 22 Eighth Schedule Indian languages + English', () => {
    const keys = Object.keys(EIGHTH_SCHEDULE_LANGUAGES);
    assert.equal(keys.length, 23, 'Must support 22 Eighth Schedule languages + English');
    assert.ok(keys.includes('hi'), 'Hindi supported');
    assert.ok(keys.includes('ta'), 'Tamil supported');
    assert.ok(keys.includes('te'), 'Telugu supported');
    assert.ok(keys.includes('bn'), 'Bengali supported');
    assert.ok(keys.includes('mr'), 'Marathi supported');
    assert.ok(keys.includes('kn'), 'Kannada supported');
    assert.ok(keys.includes('ml'), 'Malayalam supported');
    assert.ok(keys.includes('gu'), 'Gujarati supported');
    assert.ok(keys.includes('pa'), 'Punjabi supported');
    assert.ok(keys.includes('ur'), 'Urdu supported');
    assert.ok(keys.includes('as'), 'Assamese supported');
    assert.ok(keys.includes('or'), 'Odia supported');
    assert.ok(keys.includes('sa'), 'Sanskrit supported');
  });

  test('classifies BNS §74: Assault on woman with intent to outrage modesty (Hindi narrative)', () => {
    const hindiText = 'कल रात 9 बजे बस स्टॉप पर एक अज्ञात व्यक्ति ने मुझे पीछे से दबोचा और जबरदस्ती कपड़े खींचे।';
    const result = engine.classifyNarrative(hindiText);

    assert.equal(result.detectedLanguage.code, 'hi');
    assert.equal(result.primarySection, 'BNS_74');
    assert.ok(result.applicableSections.length >= 1);
    assert.equal(result.applicableSections[0].isCognizable, true);
    assert.equal(result.applicableSections[0].isBailable, false); // Non-bailable
    assert.equal(result.applicableSections[0].maxImprisonmentYears, 7);

    // Verify entity extraction
    assert.ok(result.extractedEntities.temporalMarkers.length > 0);
    assert.ok(result.extractedEntities.locationMarkers.includes('बस स्टॉप'));
    assert.ok(result.extractedEntities.perpetratorDescriptors.includes('अज्ञात व्यक्ति'));
    assert.equal(result.extractedEntities.threatLevel, 'HIGH');
  });

  test('classifies BNS §75: Sexual harassment (English narrative)', () => {
    const englishText = 'My manager at the office made unwanted physical contact and demanded sexual favors repeatedly.';
    const result = engine.classifyNarrative(englishText, 'en');

    assert.equal(result.primarySection, 'BNS_75');
    assert.equal(result.applicableSections[0].isCognizable, true);
    assert.equal(result.applicableSections[0].isBailable, true);
    assert.ok(result.applicableSections[0].confidence >= 0.7);
  });

  test('classifies BNS §78: Stalking & Cyberstalking (Tamil narrative)', () => {
    const tamilText = 'கடந்த ஒரு வாரமாக கல்லூரி முடிந்து வரும்போது ஒரு நபர் என்னை பின் தொடர்ந்தார், செல்போனில் தொடர்ந்து கண்காணித்தார்.';
    const result = engine.classifyNarrative(tamilText, 'ta');

    assert.equal(result.detectedLanguage.code, 'ta');
    assert.equal(result.primarySection, 'BNS_78');
    assert.equal(result.applicableSections[0].bnsNumber, 'Section 78');
    assert.ok(result.applicableSections[0].statutoryCitation.includes('354D'));
  });

  test('classifies BNS §79: Word, gesture or act intended to insult modesty', () => {
    const text = 'Two boys on a bike were catcalling and making lewd comments and obscene gestures at the market road.';
    const result = engine.classifyNarrative(text, 'en');

    assert.equal(result.primarySection, 'BNS_79');
    assert.equal(result.applicableSections[0].maxImprisonmentYears, 3);
  });

  test('classifies BNS §85: Cruelty by husband or relatives (Domestic violence / Dowry)', () => {
    const text = 'मेरे पति और ससुराल वाले दहेज के लिए मुझे घर में लगातार मारते-पीटते हैं और घरेलू हिंसा करते हैं।';
    const result = engine.classifyNarrative(text, 'hi');

    assert.equal(result.primarySection, 'BNS_85');
    assert.equal(result.applicableSections[0].isCognizable, true);
    assert.equal(result.applicableSections[0].isBailable, false); // Non-bailable
    assert.ok(result.applicableSections[0].statutoryCitation.includes('498A'));
  });

  test('classifies BNS §351(2): Criminal intimidation (Death/Acid threat) (Telugu narrative)', () => {
    const teluguText = 'రహదారిపై ఒక వ్యక్తి నన్ను అడ్డుకుని చంపుతానని బెదిరించాడు, యాసిడ్ పోస్తానని తీవ్రంగా బెదిరించాడు.';
    const result = engine.classifyNarrative(teluguText, 'te');

    assert.equal(result.detectedLanguage.code, 'te');
    assert.equal(result.primarySection, 'BNS_351_2');
    assert.equal(result.applicableSections[0].isCognizable, true);
    assert.equal(result.applicableSections[0].isBailable, false);
    assert.equal(result.extractedEntities.threatLevel, 'CRITICAL');
  });

  test('generates valid eFIRRecord compliant with BNSS §173(1) (72h deadline & zero cleartext PII)', () => {
    const incidentId = '11111111-1111-4000-8000-111111111111';
    const narrative = 'Yesterday evening at 8 PM near Rajiv Chowk metro station, a stranger grabbed me and threatened to kill me.';

    const { efir, classification } = engine.generateEFIRRecord({
      incidentId,
      narrativeText: narrative,
      langCodeHint: 'en',
    });

    // 1. Structural validity
    assert.ok(efir.efirId);
    assert.equal(efir.incidentId, incidentId);
    assert.equal(efir.status, EFIRStatus.PENDING_SIGN);
    assert.equal(efir.schemaVersion, '1.0.0');

    // 2. BNSS §173 72-hour statutory deadline enforcement (259,200s)
    const createdMs = new Date(efir.createdAt).getTime();
    const deadlineMs = new Date(efir.signDeadlineAt).getTime();
    const diffSec = (deadlineMs - createdMs) / 1000;
    assert.equal(diffSec, BNSS_173_DEADLINE_SECONDS, 'signDeadlineAt must be exactly 72h (259,200s) after createdAt');

    // 3. Optional 48-hour NGO early warning timestamp (172,800s)
    assert.ok(efir.ngoEarlyWarningAt);
    const ngoWarningMs = new Date(efir.ngoEarlyWarningAt!).getTime();
    const ngoDiffSec = (ngoWarningMs - createdMs) / 1000;
    assert.equal(ngoDiffSec, NGO_EARLY_WARNING_SECONDS, 'ngoEarlyWarningAt must be exactly 48h (172,800s) after createdAt');

    // 4. Zero cleartext PII: transcript stored as SHA-256 hash and encrypted CIDv1
    assert.match(efir.transcriptHash, /^[0-9a-f]{64}$/, 'transcriptHash must be 64 hex chars');
    assert.ok(efir.encryptedTranscriptCID.startsWith('bafy'), 'encryptedTranscriptCID must be valid CIDv1');
    assert.ok(!JSON.stringify(efir).includes('Rajiv Chowk'), 'Zero cleartext narrative in eFIR record');

    // 5. Alleged BNS sections
    assert.ok(efir.allegedBNSSections.length >= 1);
    assert.ok(
      efir.allegedBNSSections.includes(BNSSection.SECTION_74) ||
      efir.allegedBNSSections.includes(BNSSection.SECTION_351_2)
    );
  });
});
