/**
 * @she-raksha/backend — Rail B Cellular SMS & ERSS-112 Gateway Tests
 *
 * Verifies:
 *  - Twilio SMPP webhook ingestion (POST /webhooks/twilio/sms)
 *  - Base91 SMS payload decoding via @she-raksha/crypto-core
 *  - GSM-7 140-byte raw payload compliance
 *  - Priority-ordered emergency contact routing (Tiers 1 to 5)
 *  - Immediate Mock ERSS-112 CAD dispatch
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SMSRelay } from '../relays/smsRelay.js';
import { ERSS112Relay } from '../relays/erss112Relay.js';
import { MemoryStore } from '../store/memoryStore.js';
import { serializeSOSToBase91SMS, SOSAlertSMSPayload } from '@she-raksha/crypto-core';
import { TriggerMode, DispatchRail, DispatchStatus } from '@she-raksha/schemas';

describe('Rail B Cellular SMS & ERSS-112 Ingestion Gateway', () => {
  const testUserId = '0x1111111111111111111111111111111111111111';

  test('successfully decodes Base91 SMS, respects <140 bytes, and routes to tiers 1-5 & ERSS-112', async () => {
    const store = new MemoryStore();
    const erssRelay = new ERSS112Relay('https://mock-erss-112.nic.in/api/v1/cad', 'test-cert', store);
    const smsRelay = new SMSRelay(store, erssRelay);

    // Setup 3 emergency contacts with explicit priorities
    await store.setEmergencyContacts(testUserId, [
      {
        contactId: 'c3',
        userId: testUserId,
        priorityTier: 3,
        contactPhoneHash: '3'.repeat(64),
        encryptedContactDetails: 'blob_tier3',
        contactEncryptionPubkey: 'a'.repeat(64),
        isConfirmed: true,
      },
      {
        contactId: 'c1',
        userId: testUserId,
        priorityTier: 1,
        contactPhoneHash: '1'.repeat(64),
        encryptedContactDetails: 'blob_tier1',
        contactEncryptionPubkey: 'b'.repeat(64),
        isConfirmed: true,
      },
      {
        contactId: 'c2',
        userId: testUserId,
        priorityTier: 2,
        contactPhoneHash: '2'.repeat(64),
        encryptedContactDetails: 'blob_tier2',
        contactEncryptionPubkey: 'c'.repeat(64),
        isConfirmed: true,
      },
    ]);

    const rawPayload: SOSAlertSMSPayload = {
      sessionUuid: '550e8400-e29b-41d4-a716-446655440000',
      latitude: 28.6139,
      longitude: 77.2090,
      h3IndexRes9: '893da11462fffff',
      accuracyRadius: 15,
      battery: 84,
      triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
      timestamp: Math.floor(Date.now() / 1000),
      signatureHex: '0x' + 'ab'.repeat(65),
    };

    // Serialize to Base91 SMS string (< 160 characters)
    const base91SMS = serializeSOSToBase91SMS(rawPayload);
    assert.ok(base91SMS.length <= 160, `Base91 string length ${base91SMS.length} must be <= 160`);

    // Ingest Twilio webhook
    const result = await smsRelay.handleTwilioWebhook({
      MessageSid: 'SM1234567890abcdef',
      From: testUserId,
      Body: base91SMS,
    });

    assert.equal(result.success, true);
    assert.equal(result.incidentId, '550e8400-e29b-41d4-a716-446655440000');
    assert.ok(result.rawPayloadBytes < 140, `Raw bytes ${result.rawPayloadBytes} must be < 140`);
    assert.equal(result.rawPayloadBytes, 109, 'Standard SOS binary payload is 109 bytes');

    // Verify emergency contact routing order (Tier 1 then Tier 2 then Tier 3)
    assert.equal(result.dispatchedContactsCount, 3);
    assert.deepEqual(result.contactTiersDispatched, [1, 2, 3], 'Contacts must be dispatched strictly in priority order');

    // Verify ERSS CAD incident ID was generated
    assert.ok(result.erssCADIncidentId.startsWith('CAD-112-'), 'CAD incident ID format');

    // Verify incident was saved in store
    const savedIncident = await store.getIncident(result.incidentId);
    assert.ok(savedIncident, 'Incident saved in store');
    assert.equal(savedIncident.triggerMode, TriggerMode.HARDWARE_TAP_FOUR_PRESS);

    // Verify dispatch logs recorded both SMS and ERSS dispatches
    const logs = await store.getDispatchLogsForIncident(result.incidentId);
    assert.ok(logs.length >= 4, 'Logs should record 3 contacts + ERSS + incoming webhook');
    const deliveredSms = logs.filter((l) => l.rail === DispatchRail.RAIL_B_SMS && l.status === DispatchStatus.DELIVERED);
    assert.ok(deliveredSms.length >= 3, 'At least 3 contacts delivered');
  });

  test('rejects empty or whitespace webhook payload', async () => {
    const store = new MemoryStore();
    const smsRelay = new SMSRelay(store);

    await assert.rejects(
      async () => {
        await smsRelay.handleTwilioWebhook({
          MessageSid: 'SM_EMPTY',
          From: testUserId,
          Body: '   ',
        });
      },
      /Twilio SMS webhook payload body is empty/
    );
  });
});

