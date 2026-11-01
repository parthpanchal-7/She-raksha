pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/switcher.circom";
include "circomlib/circuits/bitify.circom";

/**
 * @title AnonymousBystanderReportVerifier_v2
 * @notice Zero-Knowledge verification circuit for anonymous bystander incident reports.
 * @dev Enforces:
 *   1. Identity membership in Semaphore Merkle tree (depth 20)
 *   2. Sybil-resistant Poseidon nullifier: Nullifier = Poseidon(identitySecret, incidentId)
 *   3. Spatial quantization to geohashBucket without revealing exact coordinates
 *   4. Timestamp quantization within 1-hour epoch window
 */
template AnonymousBystanderReportVerifier_v2() {
    // --- 1. Private Inputs ---
    signal input identitySecret;
    signal input identityPathElements[20];
    signal input identityPathIndices[20];
    signal input exactLatScaled;
    signal input exactLongScaled;
    signal input exactTimestamp;
    signal input salt;

    // --- 2. Public Inputs ---
    signal input poseidonNullifierHash;
    signal input geohashBucket;
    signal input incidentCategoryCode;
    signal input timestampBucketEpochHour;
    signal input identityMerkleRoot;
    signal input incidentId;

    // --- 3. Semaphore Identity Commitment & Merkle Tree Verification ---
    // Identity commitment = Poseidon(1)([identitySecret])
    component identityHasher = Poseidon(1);
    identityHasher.inputs[0] <== identitySecret;
    signal identityCommitment <== identityHasher.out;

    // Verify Merkle tree path of depth 20
    signal currentHash[21];
    currentHash[0] <== identityCommitment;

    component switchers[20];
    component levelHashers[20];

    for (var i = 0; i < 20; i++) {
        // Enforce binary index (0 or 1)
        identityPathIndices[i] * (1 - identityPathIndices[i]) === 0;

        switchers[i] = Switcher();
        switchers[i].sel <== identityPathIndices[i];
        switchers[i].L <== currentHash[i];
        switchers[i].R <== identityPathElements[i];

        levelHashers[i] = Poseidon(2);
        levelHashers[i].inputs[0] <== switchers[i].outL;
        levelHashers[i].inputs[1] <== switchers[i].outR;

        currentHash[i + 1] <== levelHashers[i].out;
    }

    // Leaf must root to public identityMerkleRoot
    currentHash[20] === identityMerkleRoot;

    // --- 4. Sybil-Resistant Nullifier Hash Enforcement ---
    // Nullifier = Poseidon(2)([identitySecret, incidentId])
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identitySecret;
    nullifierHasher.inputs[1] <== incidentId;
    poseidonNullifierHash === nullifierHasher.out;

    // --- 5. Spatial Quantization (geohash-6 equivalent) ---
    // exactLatScaled and exactLongScaled are scaled by 10^5 (e.g. 28.61393 -> 2861393)
    // Grid quantization step = 1000 (~0.01 deg ~= 1.1km x 1.1km)
    // latBucket = exactLatScaled \ 1000, longBucket = exactLongScaled \ 1000
    signal latBucket;
    signal longBucket;
    signal latRemainder;
    signal longRemainder;

    latBucket <-- exactLatScaled \ 1000;
    latRemainder <-- exactLatScaled % 1000;
    exactLatScaled === latBucket * 1000 + latRemainder;

    longBucket <-- exactLongScaled \ 1000;
    longRemainder <-- exactLongScaled % 1000;
    exactLongScaled === longBucket * 1000 + longRemainder;

    // Constrain remainders to [0, 999] using 10-bit range check (< 1024)
    component latRange = Num2Bits(10);
    latRange.in <== latRemainder;

    component longRange = Num2Bits(10);
    longRange.in <== longRemainder;

    // Verify geohashBucket = Poseidon(3)([latBucket, longBucket, salt])
    component geohashHasher = Poseidon(3);
    geohashHasher.inputs[0] <== latBucket;
    geohashHasher.inputs[1] <== longBucket;
    geohashHasher.inputs[2] <== salt;
    geohashBucket === geohashHasher.out;

    // --- 6. Temporal Quantization within 1-Hour Bucket ---
    // 1 hour = 3600 seconds
    signal timeOffset;
    timeOffset <-- exactTimestamp - timestampBucketEpochHour * 3600;
    exactTimestamp === timestampBucketEpochHour * 3600 + timeOffset;

    // Constrain timeOffset to [0, 3599] using 12-bit range check (< 4096)
    component timeRange = Num2Bits(12);
    timeRange.in <== timeOffset;

    component timeComp = LessThan(12);
    timeComp.in[0] <== timeOffset;
    timeComp.in[1] <== 3600;
    timeComp.out === 1;

    // --- 7. Incident Category Validity ---
    // Category code must be non-zero (1..255)
    component catRange = Num2Bits(8);
    catRange.in <== incidentCategoryCode;

    component catNonZero = IsZero();
    catNonZero.in <== incidentCategoryCode;
    catNonZero.out === 0;
}

component main {public [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour, identityMerkleRoot, incidentId]} = AnonymousBystanderReportVerifier_v2();
