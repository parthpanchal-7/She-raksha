/**
 * @she-raksha/backend — 72-Hour BNSS §173 Countdown & SP Escalation Tests (FR-EV-005, FR-EV-006, NFR-REG-002)
 *
 * Verifies:
 *  - NFR-REG-002: BNSS §173 72-hour statutory deadline monitoring
 *  - FR-EV-005: 48-hour early-warning webhook to accredited legal aid NGOs
 *  - FR-EV-006: 72-hour SP escalation dossier compilation under Section 173(4)
 *  - Synchronization with on-chain ComplaintEscrow contract
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BNSSCountdownWorker } from '../legal/bnssCountdownWorker.js';
import { MemoryStore } from '../store/memoryStore.js';
import { BNSClassifierEngine } from '../legal/bnsClassifier.js';
import {
  EFIRStatus,
  BNSS_173_DEADLINE_SECONDS,
  NGO_EARLY_WARNING_SECONDS,
  DispatchRail,
  DispatchStatus,
} from '@she-raksha/schemas';
import { ComplaintEscrowService } from '@she-raksha/sdk';

describe('72-Hour BNSS §173 Countdown & SP Escalation Worker (NFR-REG-002)', () => {
  const classifier = new BNSClassifierEngine();
  const mockEscrowAddress = '0x4444444444444444444444444444444444444444';
  const escrowService = new ComplaintEscrowService(mockEscrowAddress);

  test('keeps status as NONE when under 48 hours (in compliance window)', async () => {
    const store = new MemoryStore();
    const worker = new BNSSCountdownWorker({ store, escrowService });

    const baseTimeSec = 1700000000;
    const baseTimeIso = new Date(baseTimeSec * 1000).toISOString();

    const { efir } = classifier.generateEFIRRecord({
      incidentId: '22222222-2222-4000-8000-222222222222',
      narrativeText: 'Assaulted on the street yesterday evening.',
      createdAt: baseTimeIso,
    });
    await store.saveEFIRRecord(efir);

    // 24 hours elapsed (well under 48 hours)
    const checkTime24h = baseTimeSec + 24 * 3600;
    const results = await worker.evaluateRecords(checkTime24h);

    assert.equal(results.length, 1);
    assert.equal(results[0].action, 'NONE');
    assert.equal(results[0].status, EFIRStatus.PENDING_SIGN);
    assert.ok(results[0].hoursElapsed >= 23.9 && results[0].hoursElapsed <= 24.1);
  });

  test('triggers 48-hour NGO early-warning webhook alert (FR-EV-005)', async () => {
    const store = new MemoryStore();
    const worker = new BNSSCountdownWorker({ store, escrowService });

    const baseTimeSec = 1700000000;
    const baseTimeIso = new Date(baseTimeSec * 1000).toISOString();

    const { efir } = classifier.generateEFIRRecord({
      incidentId: '33333333-3333-4000-8000-333333333333',
      narrativeText: 'Followed home by stalker and received threatening messages.',
      createdAt: baseTimeIso,
    });
    await store.saveEFIRRecord(efir);

    // 49 hours elapsed (exceeds 48h early warning, before 72h)
    const checkTime49h = baseTimeSec + NGO_EARLY_WARNING_SECONDS + 3600;
    const results = await worker.evaluateRecords(checkTime49h);

    assert.equal(results.length, 1);
    assert.equal(results[0].action, 'NGO_48HR_EARLY_WARNING_ISSUED');
    assert.ok(results[0].ngoAlert, 'NGO early-warning alert must be defined');
    assert.ok(results[0].ngoAlert.alertId.startsWith('NGO-ALERT-'));
    assert.equal(results[0].ngoAlert.actionRequired, 'PRO_BONO_LEGAL_COUNSEL_DISPATCH');
    assert.ok(results[0].ngoAlert.hoursRemainingToDeadline <= 24);

    // Verify logged in dispatch logs
    const logs = await store.getDispatchLogsForIncident(efir.incidentId);
    assert.ok(logs.length >= 1);
    assert.equal(logs[0].status, DispatchStatus.DELIVERED);
  });

  test('triggers 72-hour BNSS §173(4) statutory SP escalation dossier (FR-EV-006, NFR-REG-002)', async () => {
    const store = new MemoryStore();
    const worker = new BNSSCountdownWorker({ store, escrowService });

    const baseTimeSec = 1700000000;
    const baseTimeIso = new Date(baseTimeSec * 1000).toISOString();

    const { efir } = classifier.generateEFIRRecord({
      incidentId: '44444444-4444-4000-8000-444444444444',
      narrativeText: 'Grabbed and assaulted with intent to outrage modesty. Police did not register FIR.',
      createdAt: baseTimeIso,
      escrowContractId: '0x' + '99'.repeat(32),
      escrowInitTxHash: ('0x' + '88'.repeat(32)) as any,
    });
    await store.saveEFIRRecord(efir);

    // 72 hours + 10 seconds elapsed
    const checkTime72h = baseTimeSec + BNSS_173_DEADLINE_SECONDS + 10;
    const results = await worker.evaluateRecords(checkTime72h);

    assert.equal(results.length, 1);
    assert.equal(results[0].action, 'SP_72HR_ESCALATION_TRIGGERED');
    assert.equal(results[0].status, EFIRStatus.ESCALATED_SP);

    // Verify statutory dossier contents
    const dossier = results[0].dossier;
    assert.ok(dossier, 'Dossier must be compiled');
    assert.ok(dossier.dossierId.startsWith('SP-DOSSIER-'));
    assert.equal(dossier.toAuthority, 'DISTRICT_SUPERINTENDENT_OF_POLICE');
    assert.equal(dossier.statutoryReference, 'Section 173(4), Bharatiya Nagarik Suraksha Sanhita, 2023');
    assert.ok(dossier.legalNoticeText.includes('OFFICIAL STATUTORY NOTICE UNDER SECTION 173(4)'));
    assert.ok(dossier.legalNoticeText.includes(efir.incidentId));
    assert.ok(dossier.legalNoticeText.includes('BNSS §173(1)'));

    // Verify eFIR updated in store
    const updatedEfir = await store.getEFIRRecord(efir.efirId);
    assert.ok(updatedEfir);
    assert.equal(updatedEfir.status, EFIRStatus.ESCALATED_SP);
    assert.equal(updatedEfir.isEscalatedToSP, true);
    assert.ok(updatedEfir.escalatedAt);

    // Ensure subsequent evaluation does not re-escalate already escalated record
    const secondPass = await worker.evaluateRecords(checkTime72h + 3600);
    // Already escalated record is no longer returned in active records query
    assert.equal(secondPass.length, 0);
  });
});
