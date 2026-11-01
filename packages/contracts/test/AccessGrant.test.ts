import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AccessGrant } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AccessGrant (Cryptographic Key Delegation & Revocation)", () => {
  let accessGrant: AccessGrant;
  let owner: HardhatEthersSigner;
  let victim: HardhatEthersSigner;
  let policeOfficer: HardhatEthersSigner;
  let ngoCaseworker: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const validVaultHash = ethers.keccak256(ethers.toUtf8Bytes("bafybeicv5q4tvy7q7l2e3x3y6p5o2a4n5m6k7j8h9g0"));
  const validEnvelope = ethers.toUtf8Bytes("x25519-encrypted-session-key-payload");
  const validDuration = 604800; // 7 days (seconds)

  beforeEach(async () => {
    [owner, victim, policeOfficer, ngoCaseworker, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AccessGrant");
    accessGrant = await Factory.deploy(owner.address);
    await accessGrant.waitForDeployment();
  });

  describe("Deployment & Admin", () => {
    it("Should initialize with correct owner, total grants count 0, and unpaused state", async () => {
      expect(await accessGrant.owner()).to.equal(owner.address);
      expect(await accessGrant.totalGrantsCount()).to.equal(0n);
      expect(await accessGrant.paused()).to.be.false;
    });

    it("Should allow owner to pause and unpause", async () => {
      await accessGrant.connect(owner).pause();
      expect(await accessGrant.paused()).to.be.true;

      await accessGrant.connect(owner).unpause();
      expect(await accessGrant.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing or unpausing", async () => {
      await expect(
        accessGrant.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(accessGrant, "OwnableUnauthorizedAccount");

      await expect(
        accessGrant.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(accessGrant, "OwnableUnauthorizedAccount");
    });
  });

  describe("grantLawEnforcement & grantNGOCaseworker", () => {
    it("Should delegate time-bound access to law enforcement", async () => {
      const tx = await accessGrant
        .connect(victim)
        .grantLawEnforcement(validVaultHash, policeOfficer.address, validEnvelope, validDuration);

      await expect(tx).to.emit(accessGrant, "AccessGranted");

      expect(await accessGrant.totalGrantsCount()).to.equal(1n);
    });

    it("Should delegate time-bound access to an NGO caseworker", async () => {
      const tx = await accessGrant
        .connect(victim)
        .grantNGOCaseworker(validVaultHash, ngoCaseworker.address, validEnvelope, validDuration);

      await expect(tx).to.emit(accessGrant, "AccessGranted");
      expect(await accessGrant.totalGrantsCount()).to.equal(1n);
    });

    it("Should grant generic access with custom role", async () => {
      const tx = await accessGrant
        .connect(victim)
        .grantAccess(validVaultHash, ngoCaseworker.address, 2, validEnvelope, validDuration); // 2 = JUDICIAL_OFFICER

      await expect(tx).to.emit(accessGrant, "AccessGranted");
    });

    it("Should validate inputs and revert on invalid values", async () => {
      // Invalid vault hash
      await expect(
        accessGrant.grantLawEnforcement(ethers.ZeroHash, policeOfficer.address, validEnvelope, validDuration)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidVaultHash");

      // Invalid grantee
      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, ethers.ZeroAddress, validEnvelope, validDuration)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidGrantee");

      // Invalid envelope (empty)
      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, policeOfficer.address, "0x", validDuration)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidEnvelope");

      // Invalid envelope (> 1024 bytes)
      const oversizedEnvelope = new Uint8Array(1025);
      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, policeOfficer.address, oversizedEnvelope, validDuration)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidEnvelope");

      // Invalid duration (0)
      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, policeOfficer.address, validEnvelope, 0)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidDuration");

      // Invalid duration (> 90 days = 7,776,000s)
      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, policeOfficer.address, validEnvelope, 7776001)
      ).to.be.revertedWithCustomError(accessGrant, "InvalidDuration");
    });

    it("Should revert when paused", async () => {
      await accessGrant.connect(owner).pause();

      await expect(
        accessGrant.grantLawEnforcement(validVaultHash, policeOfficer.address, validEnvelope, validDuration)
      ).to.be.revertedWithCustomError(accessGrant, "EnforcedPause");
    });
  });

  describe("revokeAccess & hasValidAccess", () => {
    let grantId: string;

    beforeEach(async () => {
      const tx = await accessGrant
        .connect(victim)
        .grantLawEnforcement(validVaultHash, policeOfficer.address, validEnvelope, validDuration);

      const receipt = await tx.wait();
      // Extract grantId from AccessGranted event args
      const event = receipt!.logs
        .map((log) => {
          try {
            return accessGrant.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "AccessGranted");

      grantId = event!.args[0];
    });

    it("Should verify that claimant has valid access before expiration", async () => {
      expect(await accessGrant.hasValidAccess(grantId, policeOfficer.address)).to.be.true;

      // Claimant address mismatch
      expect(await accessGrant.hasValidAccess(grantId, unauthorized.address)).to.be.false;

      // Non-existent grant
      expect(await accessGrant.hasValidAccess(ethers.ZeroHash, policeOfficer.address)).to.be.false;
    });

    it("Should allow grantor (victim) to revoke access immediately", async () => {
      const tx = await accessGrant.connect(victim).revokeAccess(grantId);

      await expect(tx).to.emit(accessGrant, "AccessRevoked");

      expect(await accessGrant.hasValidAccess(grantId, policeOfficer.address)).to.be.false;

      const g = await accessGrant.getGrant(grantId);
      expect(g.isRevoked).to.be.true;
    });

    it("Should allow contract owner to revoke access for emergency intervention", async () => {
      await expect(accessGrant.connect(owner).revokeAccess(grantId)).to.emit(accessGrant, "AccessRevoked");
      expect(await accessGrant.hasValidAccess(grantId, policeOfficer.address)).to.be.false;
    });

    it("Should revert if unauthorized party attempts to revoke", async () => {
      await expect(
        accessGrant.connect(unauthorized).revokeAccess(grantId)
      ).to.be.revertedWithCustomError(accessGrant, "UnauthorizedRevoker");
    });

    it("Should revert on duplicate revocation", async () => {
      await accessGrant.connect(victim).revokeAccess(grantId);

      await expect(
        accessGrant.connect(victim).revokeAccess(grantId)
      ).to.be.revertedWithCustomError(accessGrant, "AlreadyRevoked");
    });

    it("Should revert if grantId does not exist", async () => {
      await expect(
        accessGrant.connect(victim).revokeAccess(ethers.keccak256(ethers.toUtf8Bytes("random-id")))
      ).to.be.revertedWithCustomError(accessGrant, "GrantNotFound");
    });

    it("Should deny access once expiration duration has elapsed", async () => {
      expect(await accessGrant.hasValidAccess(grantId, policeOfficer.address)).to.be.true;

      // Advance time beyond validDuration (7 days)
      await time.increase(validDuration + 10);

      expect(await accessGrant.hasValidAccess(grantId, policeOfficer.address)).to.be.false;
    });

    it("Should revert getGrant if grantId not found", async () => {
      await expect(
        accessGrant.getGrant(ethers.keccak256(ethers.toUtf8Bytes("not-found")))
      ).to.be.revertedWithCustomError(accessGrant, "GrantNotFound");
    });

    it("Should revert revokeAccess when paused", async () => {
      await accessGrant.connect(owner).pause();

      await expect(
        accessGrant.connect(victim).revokeAccess(grantId)
      ).to.be.revertedWithCustomError(accessGrant, "EnforcedPause");
    });
  });
});
