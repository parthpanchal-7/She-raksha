/**
 * @she-raksha/backend — Safe-Journey Dead-Man Check-In Monitor Tests (FR-SOS-004)
 *
 * Verifies:
 *  - Journey session registration & heartbeat recording
 *  - 120-second missed check-in threshold (FR-SOS-004)
 *  - Transition to STAGE_1_WARNING for missed check-in > 120s
 *  - Escalation to STAGE_2_ESCALATED + ERSS-112 dispatch on continued timeout
 *  - Reset back to ACTIVE on delayed check-in
 *  - Successful completion of journey
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DeadManMonitor } from '../monitor/deadManMonitor.js';
import { MemoryStore } from '../store/memoryStore.js';
import { ERSS112Relay } from '../relays/erss112Relay.js';
import { TriggerMode, SOSStatus } from '@she-raksha/schemas';

describe('Safe-Journey Dead-Man Check-In Monitor (FR-SOS-004)', () => {
  const userId = '0x2222222222222222222222222222222222222222';
  const startLoc = { latitude: 28.6139, longitude: 77.2090 };
  const destLoc = { latitude: 28.5355, longitude: 77.3910 };

  test('registers journey and resets heartbeat correctly', () => {
    const monitor = new DeadManMonitor();
    const session = monitor.registerJourney({
      journeyId: 'journey-001',
      userId,
      startLocation: startLoc,
      destination: destLoc,
      expectedDurationSeconds: 1800, // 30 min
      checkInIntervalSeconds: 300,   // 5 min
    });

    assert.equal(session.journeyId, 'journey-001');
    assert.equal(session.status, 'ACTIVE');
    assert.ok(session.lastHeartbeatAt > 0);

    // Record heartbeat
    const initialHeartbeat = session.lastHeartbeatAt;
    const updated = monitor.recordHeartbeat('journey-001', { latitude: 28.6000, longitude: 77.2100 });
    assert.ok(updated.lastHeartbeatAt >= initialHeartbeat);
    assert.equal(updated.startLocation.latitude, 28.6000);
  });

  test('triggers STAGE 1 warning after 120 seconds missed check-in (FR-SOS-004)', async () => {
    const store = new MemoryStore();
    const monitor = new DeadManMonitor(store);

    const baseTime = 1000000;
    const checkInInterval = 300; // 5 min = 300s

    const session = monitor.registerJourney({
      journeyId: 'journey-timeout-test',
      userId,
      startLocation: startLoc,
      destination: destLoc,
      expectedDurationSeconds: 1800,
      checkInIntervalSeconds: checkInInterval,
    });
    session.lastHeartbeatAt = baseTime;

    // Case 1: 100 seconds past expected check-in (within 120s grace period)
    const timeWithinGrace = baseTime + checkInInterval + 100;
    const results1 = await monitor.evaluateJourneys(timeWithinGrace);
    assert.equal(results1[0].currentStatus, 'ACTIVE');
    assert.equal(results1[0].actionTaken, 'NONE');

    // Case 2: 121 seconds past expected check-in (exceeds 120s grace threshold)
    const timeExceededGrace = baseTime + checkInInterval + 121;
    const results2 = await monitor.evaluateJourneys(timeExceededGrace);
    assert.equal(results2[0].currentStatus, 'STAGE_1_WARNING');
    assert.equal(results2[0].actionTaken, 'STAGE_1_WARNING_ISSUED');
    assert.equal(session.status, 'STAGE_1_WARNING');
    assert.equal(session.stage1AlertedAt, timeExceededGrace);
  });

  test('escalates to STAGE 2 full SOS and ERSS-112 on prolonged non-response', async () => {
    const store = new MemoryStore();
    const erssRelay = new ERSS112Relay('https://mock-erss-112.nic.in/api/v1/cad', 'test-cert', store);
    const monitor = new DeadManMonitor(store, erssRelay);

    const baseTime = 1000000;
    const checkInInterval = 300;

    const session = monitor.registerJourney({
      journeyId: 'journey-escalate-test',
      userId,
      startLocation: startLoc,
      destination: destLoc,
      expectedDurationSeconds: 1800,
      checkInIntervalSeconds: checkInInterval,
    });
    session.lastHeartbeatAt = baseTime;

    // Trigger Stage 1 at baseTime + 421s
    const stage1Time = baseTime + checkInInterval + 121;
    await monitor.evaluateJourneys(stage1Time);
    assert.equal(session.status, 'STAGE_1_WARNING');

    // After 60 more seconds with no heartbeat -> Escalates to STAGE 2
    const stage2Time = stage1Time + 60;
    const resultsStage2 = await monitor.evaluateJourneys(stage2Time);
    assert.equal(resultsStage2[0].currentStatus, 'STAGE_2_ESCALATED');
    assert.equal(resultsStage2[0].actionTaken, 'STAGE_2_SOS_ESCALATED');
    assert.ok(resultsStage2[0].erssCADIncidentId?.startsWith('CAD-112-'));

    // Check incident record was created in store
    const inc = await store.getIncident('journey-escalate-test');
    assert.ok(inc, 'Incident should be created on Stage 2');
    assert.equal(inc.triggerMode, TriggerMode.DEAD_MAN_SWITCH);
    assert.equal(inc.status, SOSStatus.INITIATED);
  });

  test('recovers from STAGE 1 warning back to ACTIVE upon traveler check-in', () => {
    const monitor = new DeadManMonitor();
    const session = monitor.registerJourney({
      journeyId: 'journey-recovery-test',
      userId,
      startLocation: startLoc,
      destination: destLoc,
      expectedDurationSeconds: 1800,
      checkInIntervalSeconds: 300,
    });

    session.status = 'STAGE_1_WARNING';
    session.stage1AlertedAt = 1000421;

    // User checks in
    const recovered = monitor.recordHeartbeat('journey-recovery-test');
    assert.equal(recovered.status, 'ACTIVE');
    assert.equal(recovered.stage1AlertedAt, undefined);
  });

  test('completes journey and ignores further evaluations', async () => {
    const monitor = new DeadManMonitor();
    monitor.registerJourney({
      journeyId: 'journey-complete-test',
      userId,
      startLocation: startLoc,
      destination: destLoc,
      expectedDurationSeconds: 1800,
      checkInIntervalSeconds: 300,
    });

    const completed = monitor.completeJourney('journey-complete-test');
    assert.equal(completed.status, 'COMPLETED');

    const results = await monitor.evaluateJourneys(2000000);
    assert.equal(results.length, 0, 'Completed journey should not trigger actions');
  });
});

