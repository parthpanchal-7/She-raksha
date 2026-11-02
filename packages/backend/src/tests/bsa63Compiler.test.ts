/**
 * @she-raksha/backend — BSA Section 63 Digital Evidence Certificate Tests (FR-EV-007, NFR-REG-003)
 *
 * Verifies:
 *  - NFR-REG-003: Statutory electronic evidence certification under BSA §63
 *  - Incremental SHA-256 chunk hash chaining and chainRoot computation
 *  - Mandatory Section 63(2) and Section 63(4) statutory admissibility declaration
 *  - PDF/A-3 document binary generation with embedded conformance metadata
 *  - JSON-LD linked legal manifest generation
 *  - Cryptographic 65-byte platform signature
 *  - Strict schema validation against BSA63CertificatePackSchema
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { BSA63Compiler } from '../legal/bsa63Compiler.js';
import { BSA63CertificatePackSchema } from '@she-raksha/schemas';

describe('BSA Section 63 Digital Evidence Certificate Compiler (FR-EV-007, NFR-REG-003)', () => {
  const compiler = new BSA63Compiler('0x5555555555555555555555555555555555555555');

  const chunkDigests: string[] = [
    createHash('sha256').update('chunk_001_audio_5s').digest('hex'),
    createHash('sha256').update('chunk_002_audio_5s').digest('hex'),
    createHash('sha256').update('chunk_003_audio_5s').digest('hex'),
    createHash('sha256').update('chunk_004_video_5s').digest('hex'),
  ];

  test('computes cumulative chain root over sequential chunk digests', () => {
    const chainRoot = compiler.computeChainRoot(chunkDigests);
    assert.match(chainRoot, /^[0-9a-f]{64}$/, 'chainRoot must be 64 lowercase hex characters');

    // Determinism test
    const expected = createHash('sha256').update(chunkDigests.join('')).digest('hex');
    assert.equal(chainRoot, expected);
  });

  test('rejects empty chunkDigests array', () => {
    assert.throws(() => {
      compiler.computeChainRoot([]);
    }, /chunkDigests array cannot be empty/);
  });

  test('generates valid PDF/A-3 document containing Section 63 statutory declaration', () => {
    const text = compiler.generateStatutoryDeclarationText({
      certId: 'cert-123',
      incidentId: 'inc-456',
      efirId: 'efir-789',
      generatedAt: new Date().toISOString(),
      chainRoot: chunkDigests[0],
      totalChunks: 4,
      bundleCID: 'bafybeicm7...mock',
      txHash: '0x1234...',
    });

    assert.ok(text.includes('BHARATIYA SAKSHYA ADHINIYAM, 2023'));
    assert.ok(text.includes('Section 63(2) and Section 63(4)'));
    assert.ok(text.includes('IDENTIFICATION OF ELECTRONIC RECORD'));
    assert.ok(text.includes('INTEGRITY & FREEDOM FROM TAMPERING'));

    const pdfBuffer = compiler.generatePDFA3Buffer(text, { certId: 'cert-123', incidentId: 'inc-456' });
    assert.ok(pdfBuffer.length > 500, 'PDF buffer must have valid size');

    const pdfHeader = pdfBuffer.subarray(0, 8).toString('utf8');
    assert.ok(pdfHeader.startsWith('%PDF-1.7'), 'PDF header should be PDF-1.7');

    const pdfString = pdfBuffer.toString('utf8');
    assert.ok(pdfString.includes('/Type /Catalog'), 'Contains PDF Catalog');
    assert.ok(pdfString.includes('BSA63CertificateIdentifier'), 'Contains embedded XMP PDF/A metadata');
    assert.ok(pdfString.includes('%%EOF'), 'Contains valid PDF EOF marker');
  });

  test('generates valid JSON-LD legal manifest', () => {
    const manifest = compiler.generateJSONLDManifest({
      certId: 'cert-001',
      incidentId: 'inc-001',
      efirId: 'efir-001',
      generatedAt: new Date().toISOString(),
      chainRoot: 'a'.repeat(64),
      bundleCID: 'bafybei...',
      pdfA3CID: 'bafybei_pdf...',
      platformSignerAddress: '0x5555555555555555555555555555555555555555',
    }) as any;

    assert.ok(manifest['@context']);
    assert.equal(manifest.type.includes('BSA63Certificate'), true);
    assert.equal(manifest.statutorySection, 'Bharatiya Sakshya Adhiniyam, 2023 Section 63');
    assert.equal(manifest.credentialSubject.authenticityAssurance, 'HARDWARE_TEE_STRONG_BOX_ATTESTED');
  });

  test('compiles full BSA63CertificatePack conforming 100% to BSA63CertificatePackSchema', async () => {
    const incidentId = '55555555-5555-4000-8000-555555555555';
    const efirId = '66666666-6666-4000-8000-666666666666';

    const { pack, pdfBuffer, jsonLdDocument } = await compiler.compileCertificatePack({
      incidentId,
      efirId,
      chunkDigests,
      teeAttestation: {
        teeType: 'ANDROID_STRONGBOX',
        securityLevel: 'STRONGBOX_LEVEL_3',
      },
    });

    // 1. Validate against Zod schema
    const parsed = BSA63CertificatePackSchema.parse(pack);
    assert.equal(parsed.certId, pack.certId);
    assert.equal(parsed.incidentId, incidentId);
    assert.equal(parsed.efirId, efirId);
    assert.equal(parsed.schemaVersion, '1.0.0');

    // 2. Hardware TEE attestation
    assert.equal(pack.teeAttestation.teeType, 'ANDROID_STRONGBOX');
    assert.ok(pack.teeAttestation.attestationCertChainBase64.length >= 1);
    assert.match(pack.teeAttestation.osBuildFingerprintHash, /^[0-9a-f]{64}$/);

    // 3. Hash chain
    assert.equal(pack.evidenceHashChain.totalChunks, 4);
    assert.equal(pack.evidenceHashChain.chunkDigests.length, 4);
    assert.match(pack.evidenceHashChain.chainRoot, /^[0-9a-f]{64}$/);

    // 4. IPFS proofs
    assert.ok(pack.pdfA3CID.startsWith('bafy'));
    assert.ok(pack.jsonLdCID.startsWith('bafy'));
    assert.ok(pack.ipfsPinStatus.bundleCID.startsWith('bafy'));
    assert.equal(pack.ipfsPinStatus.isPinned, true);

    // 5. Polygon L2 receipts
    assert.ok(pack.polygonReceipts.length >= 1);
    assert.equal(pack.polygonReceipts[0].contractName, 'EvidenceRegistry');
    assert.match(pack.polygonReceipts[0].txHash, /^0x[0-9a-fA-F]{64}$/);

    // 6. Platform signature
    assert.match(pack.platformSignature, /^0x[0-9a-fA-F]{130}$/);
    assert.match(pack.platformSignerAddress, /^0x[0-9a-fA-F]{40}$/);

    // 7. Verify buffers generated
    assert.ok(pdfBuffer.length > 500);
    assert.ok(Object.keys(jsonLdDocument).length > 5);
  });
});
