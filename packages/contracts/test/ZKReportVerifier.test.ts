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

  describe("submitAnonymousReport", () => {
    it("Should successfully verify and record a valid anonymous bystander proof", async () => {
      const tx = await zkReportVerifier
        .connect(bystander)
        .submitAnonymousReport(validProofA, validProofB, validProofC, validPublicInputs);

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
        .submitAnonymousReport(validProofA, validProofB, validProofC, validPublicInputs);

      // Replay with identical nullifier
      const nullifierBytes32 = ethers.zeroPadValue(ethers.toBeHex(nullifierHash), 32);
      await expect(
        zkReportVerifier
          .connect(bystander)
          .submitAnonymousReport(validProofA, validProofB, validProofC, validPublicInputs)
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
          .submitAnonymousReport(validProofA, validProofB, validProofC, freshInputs)
      ).to.be.revertedWithCustomError(zkReportVerifier, "InvalidProof");
    });

    it("Should revert with VerifierNotConfigured if verifier address is zero", async () => {
      const Factory = await ethers.getContractFactory("ZKReportVerifier");
      const unconfigured = await Factory.deploy(owner.address, ethers.ZeroAddress);

      await expect(
        unconfigured
          .connect(bystander)
          .submitAnonymousReport(validProofA, validProofB, validProofC, validPublicInputs)
      ).to.be.revertedWithCustomError(unconfigured, "VerifierNotConfigured");
    });

    it("Should revert when paused", async () => {
      await zkReportVerifier.connect(owner).pause();

      await expect(
        zkReportVerifier
          .connect(bystander)
          .submitAnonymousReport(validProofA, validProofB, validProofC, validPublicInputs)
      ).to.be.revertedWithCustomError(zkReportVerifier, "EnforcedPause");
    });
  });
});
