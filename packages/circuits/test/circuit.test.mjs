import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const circuitsDir = path.resolve(__dirname, '..');
const wasmPath = path.resolve(circuitsDir, 'build/AnonymousBystanderReportVerifier_v2_js/AnonymousBystanderReportVerifier_v2.wasm');
const zkeyPath = path.resolve(circuitsDir, 'build/circuit_final.zkey');
const vKeyPath = path.resolve(circuitsDir, 'build/verification_key.json');

describe('She-Raksha Circom 2.1 & Groth16 Anonymous Bystander Reporting Engine', () => {
  let poseidon;
  let F;
  let vKey;

  before(async () => {
    assert(fs.existsSync(wasmPath), `WASM circuit artifact missing: ${wasmPath}`);
    assert(fs.existsSync(zkeyPath), `ZKey proving key artifact missing: ${zkeyPath}`);
    assert(fs.existsSync(vKeyPath), `Verification key missing: ${vKeyPath}`);

    poseidon = await buildPoseidon();
    F = poseidon.F;
    vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
  });

  function createValidWitnessInput({
    identitySecret = 12345678901234567890n,
    incidentId = 101n,
    salt = 987654321n,
    exactLatScaled = 2861393n, // New Delhi 28.61393 N
    exactLongScaled = 7720902n, // New Delhi 77.20902 E
    timestampBucketEpochHour = 492040n,
    timeOffset = 1234n,
    incidentCategoryCode = 1n, // e.g. Outraging modesty / physical stalking
  } = {}) {
    const idCommitment = F.toObject(poseidon([identitySecret]));

    // Construct depth 20 Semaphore Merkle Tree path
    const pathElements = [];
    const pathIndices = [];
    let current = idCommitment;

    for (let i = 0; i < 20; i++) {
      const sibling = BigInt(i + 100);
      pathElements.push(sibling);
      pathIndices.push(0); // 0 = current on left, sibling on right
      current = F.toObject(poseidon([current, sibling]));
    }
    const identityMerkleRoot = current;

    // Canonical Sybil-resistant nullifier: Poseidon(identitySecret, incidentId)
    const poseidonNullifierHash = F.toObject(poseidon([identitySecret, incidentId]));

    // Spatial quantization (~1.1km grid bucket)
    const latBucket = exactLatScaled / 1000n;
    const longBucket = exactLongScaled / 1000n;
    const geohashBucket = F.toObject(poseidon([latBucket, longBucket, salt]));

    // Temporal quantization within 1-hour window
    const exactTimestamp = timestampBucketEpochHour * 3600n + timeOffset;

    return {
      identitySecret: identitySecret.toString(),
      identityPathElements: pathElements.map((x) => x.toString()),
      identityPathIndices: pathIndices,
      exactLatScaled: exactLatScaled.toString(),
      exactLongScaled: exactLongScaled.toString(),
      exactTimestamp: exactTimestamp.toString(),
      salt: salt.toString(),
      poseidonNullifierHash: poseidonNullifierHash.toString(),
      geohashBucket: geohashBucket.toString(),
      incidentCategoryCode: incidentCategoryCode.toString(),
      timestampBucketEpochHour: timestampBucketEpochHour.toString(),
      identityMerkleRoot: identityMerkleRoot.toString(),
      incidentId: incidentId.toString(),
    };
  }

  describe('1. Semaphore Identity Commitment & Poseidon Nullifier Determinism', () => {
    it('Should deterministically generate identical nullifier for same (identitySecret, incidentId)', () => {
      const idSecret = 9876543210987654321n;
      const incidentId = 555n;

      const nullifier1 = F.toObject(poseidon([idSecret, incidentId]));
      const nullifier2 = F.toObject(poseidon([idSecret, incidentId]));

      assert.equal(nullifier1, nullifier2, 'Nullifiers must be identical for same user and incident');
    });

    it('Should generate distinct nullifiers when incidentId differs (cross-incident unlinkability)', () => {
      const idSecret = 9876543210987654321n;
      const incident1 = 555n;
      const incident2 = 556n;

      const nullifier1 = F.toObject(poseidon([idSecret, incident1]));
      const nullifier2 = F.toObject(poseidon([idSecret, incident2]));

      assert.notEqual(nullifier1, nullifier2, 'Nullifiers across distinct incidents must be unlinkable');
    });

    it('Should generate distinct nullifiers when identitySecret differs (user anonymity)', () => {
      const idSecretA = 1111111111111111111n;
      const idSecretB = 2222222222222222222n;
      const incidentId = 555n;

      const nullifierA = F.toObject(poseidon([idSecretA, incidentId]));
      const nullifierB = F.toObject(poseidon([idSecretB, incidentId]));

      assert.notEqual(nullifierA, nullifierB, 'Different witnesses must generate distinct nullifiers');
    });
  });

  describe('2. Groth16 Proving Performance Benchmark (NFR-PERF-003 < 8.0s)', () => {
    it('Should generate and verify a valid Groth16 proof in < 8.0 seconds', async () => {
      const input = createValidWitnessInput();

      const startTime = performance.now();
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      const elapsedSeconds = (performance.now() - startTime) / 1000;

      console.log(`       Groth16 fullProve completed in ${elapsedSeconds.toFixed(3)}s (NFR-PERF-003 budget: < 8.0s)`);
      assert(
        elapsedSeconds < 8.0,
        `Proof generation took ${elapsedSeconds.toFixed(3)}s, exceeding NFR-PERF-003 budget of 8.0s`
      );

      // Verify Groth16 proof against exported verification key
      const isVerified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      assert.equal(isVerified, true, 'Groth16 proof verification must succeed');

      // Verify public signals structure & length
      assert.equal(publicSignals.length, 6, 'Circuit must export exactly 6 public signals');
      assert.equal(publicSignals[0], input.poseidonNullifierHash, 'Signal 0 must be nullifier');
      assert.equal(publicSignals[1], input.geohashBucket, 'Signal 1 must be geohashBucket');
      assert.equal(publicSignals[2], input.incidentCategoryCode, 'Signal 2 must be categoryCode');
      assert.equal(publicSignals[3], input.timestampBucketEpochHour, 'Signal 3 must be epochHour');
      assert.equal(publicSignals[4], input.identityMerkleRoot, 'Signal 4 must be merkleRoot');
      assert.equal(publicSignals[5], input.incidentId, 'Signal 5 must be incidentId');
    });
  });

  describe('3. Sybil Attack Resistance & Duplicate Nullifier Collision', () => {
    it('Should produce identical poseidonNullifierHash when a witness submits duplicate report', async () => {
      const identitySecret = 444333222111000n;
      const incidentId = 999n;

      // Report 1: at timestamp T1, location L1
      const input1 = createValidWitnessInput({
        identitySecret,
        incidentId,
        exactLatScaled: 2861393n,
        exactLongScaled: 7720902n,
        timeOffset: 500n,
      });

      // Report 2: at different timestamp T2, different location L2 (different grid cell)
      const input2 = createValidWitnessInput({
        identitySecret,
        incidentId,
        exactLatScaled: 2875000n, // latBucket 2875 != 2861
        exactLongScaled: 7735000n, // longBucket 7735 != 7720
        timeOffset: 2500n,
      });

      const { publicSignals: signals1 } = await snarkjs.groth16.fullProve(input1, wasmPath, zkeyPath);
      const { publicSignals: signals2 } = await snarkjs.groth16.fullProve(input2, wasmPath, zkeyPath);

      assert.equal(signals1[0], signals2[0], 'Nullifiers from identical witness & incident must be identical');
      assert.notEqual(signals1[1], signals2[1], 'Geohashes may differ for distinct locations');
      console.log(`       Identical nullifier confirmed: ${signals1[0]}`);
    });
  });

  describe('4. Circuit Constraint Enforcement & Tamper Rejection', () => {
    it('Should reject witness calculation if spatial geohashBucket is tampered', async () => {
      const input = createValidWitnessInput();
      input.geohashBucket = '99999999999999999999'; // Tampered geohash bucket

      await assert.rejects(
        async () => {
          await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        },
        /Assert Failed/,
        'Circuit must assert failure on invalid spatial quantization'
      );
    });

    it('Should reject witness calculation if timestamp falls outside 1-hour quantization bucket', async () => {
      const input = createValidWitnessInput();
      // timeOffset = 3601 (>= 3600 seconds, violating LessThan(12) constraint)
      input.exactTimestamp = (BigInt(input.timestampBucketEpochHour) * 3600n + 3601n).toString();

      await assert.rejects(
        async () => {
          await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        },
        /Assert Failed/,
        'Circuit must assert failure on timestamp outside 1-hour window'
      );
    });

    it('Should reject witness calculation if Semaphore Merkle root does not match leaf', async () => {
      const input = createValidWitnessInput();
      input.identityMerkleRoot = '123456789'; // Tampered root

      await assert.rejects(
        async () => {
          await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        },
        /Assert Failed/,
        'Circuit must assert failure on invalid Semaphore Merkle path'
      );
    });

    it('Should reject witness calculation if nullifier hash does not match identitySecret & incidentId', async () => {
      const input = createValidWitnessInput();
      input.poseidonNullifierHash = '1122334455667788'; // Tampered nullifier

      await assert.rejects(
        async () => {
          await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        },
        /Assert Failed/,
        'Circuit must assert failure on tampered Poseidon nullifier'
      );
    });

    it('Should reject witness calculation if incidentCategoryCode is zero', async () => {
      const input = createValidWitnessInput();
      input.incidentCategoryCode = '0'; // Category code 0 violates IsZero constraint

      await assert.rejects(
        async () => {
          await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        },
        /Assert Failed/,
        'Circuit must assert failure on zero incident category code'
      );
    });
  });

  after(() => {
    // Gracefully terminate Node process to prevent snarkjs wasmcurves worker threads from holding event loop
    setTimeout(() => {
      process.exit(0);
    }, 200);
  });
});
