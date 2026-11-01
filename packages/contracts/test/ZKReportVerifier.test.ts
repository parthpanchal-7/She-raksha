import { expect } from "chai";
import { ethers } from "hardhat";
import { ZKReportVerifier, MockGroth16Verifier } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZKReportVerifier (Groth16 Zero-Knowledge Bystander Verification)", () => {
  let zkReportVerifier: ZKReportVerifier;
  let mockVerifier: MockGroth16Verifier;
  let owner: HardhatEthersSigner;
  let bystander: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const validProofA: [bigint, bigint] = [1n, 2n];
  const validProofB: [[bigint, bigint], [bigint, bigint]] = [
    [3n, 4n],
    [5n, 6n],
  ];
  const validProofC: [bigint, bigint] = [7n, 8n];

  // Public inputs: [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour]
  const nullifierHash = 9999888877776666n;
  const geohashBucket = 123456n;
  const categoryCode = 1n; // e.g. Assault on woman / outraging modesty
  const timestampBucket = 492040n; // 1-hour epoch bucket

  const validPublicInputs: [bigint, bigint, bigint, bigint] = [
    nullifierHash,
    geohashBucket,
    categoryCode,
    timestampBucket,
  ];

  beforeEach(async () => {
    [owner, bystander, unauthorized] = await ethers.getSigners();

    const MockFactory = await ethers.getContractFactory("MockGroth16Verifier");
    mockVerifier = await MockFactory.deploy();
    await mockVerifier.waitForDeployment();

    const VerifierFactory = await ethers.getContractFactory("ZKReportVerifier");
    zkReportVerifier = await VerifierFactory.deploy(owner.address, await mockVerifier.getAddress());
    await zkReportVerifier.waitForDeployment();
  });

  describe("Deployment & Configuration", () => {
    it("Should initialize with correct owner, verifier address, and zero initial reports", async () => {
      expect(await zkReportVerifier.owner()).to.equal(owner.address);
      expect(await zkReportVerifier.groth16Verifier()).to.equal(await mockVerifier.getAddress());
      expect(await zkReportVerifier.totalReportsLogged()).to.equal(0n);
      expect(await zkReportVerifier.paused()).to.be.false;
    });

    it("Should allow deployment with address(0) verifier and subsequent update", async () => {
      const Factory = await ethers.getContractFactory("ZKReportVerifier");
      const unconfigured = await Factory.deploy(owner.address, ethers.ZeroAddress);
      expect(await unconfigured.groth16Verifier()).to.equal(ethers.ZeroAddress);

      await expect(
        unconfigured.connect(owner).setGroth16Verifier(await mockVerifier.getAddress())
      ).to.emit(unconfigured, "Groth16VerifierUpdated");
    });

    it("Should allow owner to update Groth16 verifier contract", async () => {
      const newMockFactory = await ethers.getContractFactory("MockGroth16Verifier");
      const newMock = await newMockFactory.deploy();
      await newMock.waitForDeployment();

      const tx = await zkReportVerifier.connect(owner).setGroth16Verifier(await newMock.getAddress());

      await expect(tx)
        .to.emit(zkReportVerifier, "Groth16VerifierUpdated")
        .withArgs(await mockVerifier.getAddress(), await newMock.getAddress());

      expect(await zkReportVerifier.groth16Verifier()).to.equal(await newMock.getAddress());
    });

    it("Should revert if updating verifier to zero address", async () => {
      await expect(
        zkReportVerifier.connect(owner).setGroth16Verifier(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(zkReportVerifier, "ZeroVerifierAddress");
    });

    it("Should prevent non-owner from updating verifier", async () => {
      await expect(
        zkReportVerifier.connect(unauthorized).setGroth16Verifier(await mockVerifier.getAddress())
      ).to.be.revertedWithCustomError(zkReportVerifier, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause and unpause", async () => {
      await zkReportVerifier.connect(owner).pause();
      expect(await zkReportVerifier.paused()).to.be.true;

      await zkReportVerifier.connect(owner).unpause();
      expect(await zkReportVerifier.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing or unpausing", async () => {
      await expect(
        zkReportVerifier.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(zkReportVerifier, "OwnableUnauthorizedAccount");

      await expect(
        zkReportVerifier.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(zkReportVerifier, "OwnableUnauthorizedAccount");
    });
  });

  describe("submitAnonymousReport (4 Public Inputs Compatibility)", () => {
    it("Should successfully verify and record a valid anonymous bystander proof", async () => {
      const tx = await zkReportVerifier
        .connect(bystander)
        ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
          validProofA,
          validProofB,
          validProofC,
          validPublicInputs
        );

      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(nullifierHash), 32);
      const geohashBytes32 = ethers.zeroPadValue(ethers.toBeHex(geohashBucket), 32);

      await expect(tx)
        .to.emit(zkReportVerifier, "AnonymousReportLogged")
        .withArgs(nullifierBytes32, geohashBytes32, timestampBucket);

      expect(await zkReportVerifier.isNullifierSpent(nullifierBytes32)).to.be.true;
      expect(await zkReportVerifier.totalReportsLogged()).to.equal(1n);
    });

    it("Should revert with DuplicateNullifier if nullifier is reused (Sybil protection)", async () => {
      // First submission
      await zkReportVerifier
        .connect(bystander)
        ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
          validProofA,
          validProofB,
          validProofC,
          validPublicInputs
        );

      // Replay with identical nullifier
      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(nullifierHash), 32);
      await expect(
        zkReportVerifier
          .connect(bystander)
          ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
            validProofA,
            validProofB,
            validProofC,
            validPublicInputs
          )
      )
        .to.be.revertedWithCustomError(zkReportVerifier, "DuplicateNullifier")
        .withArgs(nullifierBytes32);
    });

    it("Should revert with InvalidProof if Groth16 verification returns false", async () => {
      await mockVerifier.setShouldPass(false);

      const freshInputs: [bigint, bigint, bigint, bigint] = [
        1111222233334444n,
        geohashBucket,
        categoryCode,
        timestampBucket,
      ];

      await expect(
        zkReportVerifier
          .connect(bystander)
          ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
            validProofA,
            validProofB,
            validProofC,
            freshInputs
          )
      ).to.be.revertedWithCustomError(zkReportVerifier, "InvalidProof");
    });

    it("Should revert with VerifierNotConfigured if verifier address is zero", async () => {
      const Factory = await ethers.getContractFactory("ZKReportVerifier");
      const unconfigured = await Factory.deploy(owner.address, ethers.ZeroAddress);

      await expect(
        unconfigured
          .connect(bystander)
          ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
            validProofA,
            validProofB,
            validProofC,
            validPublicInputs
          )
      ).to.be.revertedWithCustomError(unconfigured, "VerifierNotConfigured");
    });

    it("Should revert when paused", async () => {
      await zkReportVerifier.connect(owner).pause();

      await expect(
        zkReportVerifier
          .connect(bystander)
          ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[4])"](
            validProofA,
            validProofB,
            validProofC,
            validPublicInputs
          )
      ).to.be.revertedWithCustomError(zkReportVerifier, "EnforcedPause");
    });
  });

  describe("submitAnonymousReport & submitAnonymousReportV2 (6 Public Inputs Circom v2)", () => {
    const merkleRoot = 888777666555n;
    const incidentId = 42n;
    const validPublicInputs6: [bigint, bigint, bigint, bigint, bigint, bigint] = [
      nullifierHash + 100n,
      geohashBucket,
      categoryCode,
      timestampBucket,
      merkleRoot,
      incidentId,
    ];

    it("Should verify and record a valid report using overloaded 6-input submitAnonymousReport", async () => {
      const tx = await zkReportVerifier
        .connect(bystander)
        ["submitAnonymousReport(uint256[2],uint256[2][2],uint256[2],uint256[6])"](
          validProofA,
          validProofB,
          validProofC,
          validPublicInputs6
        );

      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(nullifierHash + 100n), 32);
      const geohashBytes32 = ethers.zeroPadValue(ethers.toBeHex(geohashBucket), 32);

      await expect(tx)
        .to.emit(zkReportVerifier, "AnonymousReportLogged")
        .withArgs(nullifierBytes32, geohashBytes32, timestampBucket);

      expect(await zkReportVerifier.isNullifierSpent(nullifierBytes32)).to.be.true;
    });

    it("Should verify and record a valid report using submitAnonymousReportV2", async () => {
      const freshNullifier = nullifierHash + 200n;
      const inputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
        freshNullifier,
        geohashBucket,
        categoryCode,
        timestampBucket,
        merkleRoot,
        incidentId,
      ];

      const tx = await zkReportVerifier
        .connect(bystander)
        .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs);

      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(freshNullifier), 32);
      const geohashBytes32 = ethers.zeroPadValue(ethers.toBeHex(geohashBucket), 32);

      await expect(tx)
        .to.emit(zkReportVerifier, "AnonymousReportLogged")
        .withArgs(nullifierBytes32, geohashBytes32, timestampBucket);

      expect(await zkReportVerifier.isNullifierSpent(nullifierBytes32)).to.be.true;
    });

    it("Should revert with DuplicateNullifier if 6-input report nullifier is reused", async () => {
      const freshNullifier = nullifierHash + 300n;
      const inputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
        freshNullifier,
        geohashBucket,
        categoryCode,
        timestampBucket,
        merkleRoot,
        incidentId,
      ];

      await zkReportVerifier
        .connect(bystander)
        .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs);

      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(freshNullifier), 32);
      await expect(
        zkReportVerifier
          .connect(bystander)
          .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs)
      )
        .to.be.revertedWithCustomError(zkReportVerifier, "DuplicateNullifier")
        .withArgs(nullifierBytes32);
    });

    it("Should revert with InvalidProof if 6-input Groth16 verification fails", async () => {
      await mockVerifier.setShouldPass(false);

      const inputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
        nullifierHash + 400n,
        geohashBucket,
        categoryCode,
        timestampBucket,
        merkleRoot,
        incidentId,
      ];

      await expect(
        zkReportVerifier
          .connect(bystander)
          .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs)
      ).to.be.revertedWithCustomError(zkReportVerifier, "InvalidProof");
    });

    it("Should revert with VerifierNotConfigured if 6-input report runs without verifier", async () => {
      const Factory = await ethers.getContractFactory("ZKReportVerifier");
      const unconfigured = await Factory.deploy(owner.address, ethers.ZeroAddress);

      const inputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
        nullifierHash + 500n,
        geohashBucket,
        categoryCode,
        timestampBucket,
        merkleRoot,
        incidentId,
      ];

      await expect(
        unconfigured
          .connect(bystander)
          .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs)
      ).to.be.revertedWithCustomError(unconfigured, "VerifierNotConfigured");
    });

    it("Should revert 6-input submission when paused", async () => {
      await zkReportVerifier.connect(owner).pause();

      const inputs: [bigint, bigint, bigint, bigint, bigint, bigint] = [
        nullifierHash + 600n,
        geohashBucket,
        categoryCode,
        timestampBucket,
        merkleRoot,
        incidentId,
      ];

      await expect(
        zkReportVerifier
          .connect(bystander)
          .submitAnonymousReportV2(validProofA, validProofB, validProofC, inputs)
      ).to.be.revertedWithCustomError(zkReportVerifier, "EnforcedPause");
    });
  });

  describe("End-to-End On-Chain Verification with Real Groth16Verifier.sol", () => {
    let realVerifier: any;
    let realZkReportVerifier: ZKReportVerifier;
    let realFixture: any;

    beforeEach(async () => {
      realFixture = require("./fixtures/realProofFixture.json");

      const Groth16VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
      realVerifier = await Groth16VerifierFactory.deploy();
      await realVerifier.waitForDeployment();

      const VerifierFactory = await ethers.getContractFactory("ZKReportVerifier");
      realZkReportVerifier = await VerifierFactory.deploy(
        owner.address,
        await realVerifier.getAddress()
      );
      await realZkReportVerifier.waitForDeployment();
    });

    it("Should verify real Groth16 zk-SNARK proof on-chain with Groth16Verifier.sol", async () => {
      const a = realFixture.calldata.a as [string, string];
      const b = realFixture.calldata.b as [[string, string], [string, string]];
      const c = realFixture.calldata.c as [string, string];
      const input = realFixture.calldata.input as [
        string,
        string,
        string,
        string,
        string,
        string
      ];

      const tx = await realZkReportVerifier
        .connect(bystander)
        .submitAnonymousReportV2(a, b, c, input);

      const nullifierBytes32 = input[0];
      const geohashBytes32 = input[1];
      const timestampBucket = BigInt(input[3]);

      await expect(tx)
        .to.emit(realZkReportVerifier, "AnonymousReportLogged")
        .withArgs(nullifierBytes32, geohashBytes32, timestampBucket);

      expect(await realZkReportVerifier.isNullifierSpent(nullifierBytes32)).to.be.true;
      expect(await realZkReportVerifier.totalReportsLogged()).to.equal(1n);
    });

    it("Should reject replay of identical (identitySecret, incidentId) on-chain with DuplicateNullifier", async () => {
      const a = realFixture.calldata.a as [string, string];
      const b = realFixture.calldata.b as [[string, string], [string, string]];
      const c = realFixture.calldata.c as [string, string];
      const input = realFixture.calldata.input as [
        string,
        string,
        string,
        string,
        string,
        string
      ];

      // First submission passes
      await realZkReportVerifier.connect(bystander).submitAnonymousReportV2(a, b, c, input);

      // Second submission with same nullifier reverts
      await expect(
        realZkReportVerifier.connect(bystander).submitAnonymousReportV2(a, b, c, input)
      )
        .to.be.revertedWithCustomError(realZkReportVerifier, "DuplicateNullifier")
        .withArgs(input[0]);
    });

    it("Should revert with InvalidProof on tampered public input or proof in real verifier", async () => {
      const a = realFixture.calldata.a as [string, string];
      const b = realFixture.calldata.b as [[string, string], [string, string]];
      const c = realFixture.calldata.c as [string, string];
      const tamperedInput = [...realFixture.calldata.input] as [
        string,
        string,
        string,
        string,
        string,
        string
      ];
      // Tamper geohash bucket
      tamperedInput[1] = "0x0000000000000000000000000000000000000000000000000000000000009999";

      await expect(
        realZkReportVerifier.connect(bystander).submitAnonymousReportV2(a, b, c, tamperedInput)
      ).to.be.revertedWithCustomError(realZkReportVerifier, "InvalidProof");
    });
  });
});
