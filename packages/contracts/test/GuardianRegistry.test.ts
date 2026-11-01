import { expect } from "chai";
import { ethers } from "hardhat";
import { GuardianRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuardianRegistry (Polygon L2)", () => {
  let guardianRegistry: GuardianRegistry;
  let owner: HardhatEthersSigner;
  let guardian1: HardhatEthersSigner;
  let guardian2: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const minStake = ethers.parseEther("0.05");
  const validGeohash = ethers.keccak256(ethers.toUtf8Bytes("geohash-ttnf7z-salt99"));
  const validPubKey = ethers.randomBytes(64); // 64-byte uncompressed secp256k1 public key

  beforeEach(async () => {
    [owner, guardian1, guardian2, unauthorized, treasury] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GuardianRegistry");
    guardianRegistry = await Factory.deploy(owner.address, minStake);
    await guardianRegistry.waitForDeployment();
  });

  describe("Deployment & Configuration", () => {
    it("Should initialize with correct owner, minStake, and unpaused state", async () => {
      expect(await guardianRegistry.owner()).to.equal(owner.address);
      expect(await guardianRegistry.minStake()).to.equal(minStake);
      expect(await guardianRegistry.activeGuardianCount()).to.equal(0);
      expect(await guardianRegistry.paused()).to.be.false;
    });

    it("Should allow owner to update minStake", async () => {
      const newStake = ethers.parseEther("0.1");
      await expect(guardianRegistry.connect(owner).setMinStake(newStake))
        .to.emit(guardianRegistry, "MinStakeUpdated")
        .withArgs(minStake, newStake);

      expect(await guardianRegistry.minStake()).to.equal(newStake);
    });

    it("Should prevent non-owner from updating minStake", async () => {
      await expect(
        guardianRegistry.connect(unauthorized).setMinStake(ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause and unpause", async () => {
      await guardianRegistry.connect(owner).pause();
      expect(await guardianRegistry.paused()).to.be.true;

      await guardianRegistry.connect(owner).unpause();
      expect(await guardianRegistry.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing/unpausing", async () => {
      await expect(
        guardianRegistry.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");

      await expect(
        guardianRegistry.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("registerGuardian", () => {
    it("Should successfully register a guardian with sufficient stake and valid parameters", async () => {
      const tx = await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });

      await expect(tx)
        .to.emit(guardianRegistry, "GuardianRegistered")
        .withArgs(guardian1.address, validGeohash, minStake, ethers.hexlify(validPubKey));

      expect(await guardianRegistry.activeGuardianCount()).to.equal(1);
      expect(await guardianRegistry.isGuardianActive(guardian1.address)).to.be.true;

      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.geohashCommitment).to.equal(validGeohash);
      expect(g.stakeAmount).to.equal(minStake);
      expect(g.status).to.equal(1); // ACTIVE
      expect(g.registeredAt).to.be.gt(0);
      expect(g.lastHeartbeat).to.equal(g.registeredAt);
    });

    it("Should revert if provided stake is less than minStake", async () => {
      const lowStake = ethers.parseEther("0.01");
      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, validPubKey, { value: lowStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "InsufficientStake");
    });

    it("Should revert if geohash commitment is zero", async () => {
      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(ethers.ZeroHash, validPubKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "InvalidGeohashCommitment");
    });

    it("Should revert if public key length is invalid (< 32 or > 128 bytes)", async () => {
      const tooShortKey = ethers.randomBytes(31);
      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, tooShortKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "InvalidPublicKey");

      const tooLongKey = ethers.randomBytes(129);
      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, tooLongKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "InvalidPublicKey");
    });

    it("Should revert if guardian is already active", async () => {
      await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });

      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, validPubKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "AlreadyRegistered");
    });

    it("Should revert when paused", async () => {
      await guardianRegistry.connect(owner).pause();

      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, validPubKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "EnforcedPause");
    });
  });

  describe("updateGeohashCommitment (Heartbeat)", () => {
    beforeEach(async () => {
      await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });
    });

    it("Should update geohash commitment and refresh lastHeartbeat", async () => {
      const newGeohash = ethers.keccak256(ethers.toUtf8Bytes("geohash-ttnf7z-new-pos"));

      const tx = await guardianRegistry.connect(guardian1).updateGeohashCommitment(newGeohash);

      await expect(tx).to.emit(guardianRegistry, "GuardianCommitmentUpdated");

      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.geohashCommitment).to.equal(newGeohash);
      expect(g.lastHeartbeat).to.be.gte(g.registeredAt);
    });

    it("Should revert if non-active caller invokes heartbeat", async () => {
      await expect(
        guardianRegistry.connect(guardian2).updateGeohashCommitment(validGeohash)
      ).to.be.revertedWithCustomError(guardianRegistry, "OnlyActiveGuardian");
    });

    it("Should revert if new geohash commitment is zero", async () => {
      await expect(
        guardianRegistry.connect(guardian1).updateGeohashCommitment(ethers.ZeroHash)
      ).to.be.revertedWithCustomError(guardianRegistry, "InvalidGeohashCommitment");
    });

    it("Should revert when paused", async () => {
      await guardianRegistry.connect(owner).pause();

      await expect(
        guardianRegistry.connect(guardian1).updateGeohashCommitment(validGeohash)
      ).to.be.revertedWithCustomError(guardianRegistry, "EnforcedPause");
    });
  });

  describe("slashGuardian", () => {
    beforeEach(async () => {
      await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });
    });

    it("Should allow owner to slash guardian partially and transfer to slashedPool", async () => {
      const slashAmount = ethers.parseEther("0.02");

      const tx = await guardianRegistry
        .connect(owner)
        .slashGuardian(guardian1.address, slashAmount, "FALSE_DISPATCH_INTERCEPT");

      await expect(tx)
        .to.emit(guardianRegistry, "GuardianSlashed")
        .withArgs(guardian1.address, slashAmount, "FALSE_DISPATCH_INTERCEPT");

      expect(await guardianRegistry.slashedPool()).to.equal(slashAmount);
      expect(await guardianRegistry.activeGuardianCount()).to.equal(0);
      expect(await guardianRegistry.isGuardianActive(guardian1.address)).to.be.false;

      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.stakeAmount).to.equal(minStake - slashAmount);
      expect(g.status).to.equal(3); // SLASHED
    });

    it("Should allow owner to suspend, reactivate, or slash a suspended guardian", async () => {
      // Suspend
      await expect(guardianRegistry.connect(owner).suspendGuardian(guardian1.address))
        .to.emit(guardianRegistry, "GuardianSuspended")
        .withArgs(guardian1.address);

      expect(await guardianRegistry.activeGuardianCount()).to.equal(0);
      let g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.status).to.equal(2); // SUSPENDED

      // Slash while suspended
      await expect(
        guardianRegistry
          .connect(owner)
          .slashGuardian(guardian1.address, minStake, "POST_SUSPENSION_SLASH")
      ).to.emit(guardianRegistry, "GuardianSlashed");

      g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.status).to.equal(3); // SLASHED
    });

    it("Should allow reactivation of a suspended guardian", async () => {
      await guardianRegistry.connect(owner).suspendGuardian(guardian1.address);
      await expect(guardianRegistry.connect(owner).reactivateGuardian(guardian1.address))
        .to.emit(guardianRegistry, "GuardianReactivated")
        .withArgs(guardian1.address);

      expect(await guardianRegistry.activeGuardianCount()).to.equal(1);
      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.status).to.equal(1); // ACTIVE
    });

    it("Should revert if non-owner calls suspend or reactivate", async () => {
      await expect(
        guardianRegistry.connect(unauthorized).suspendGuardian(guardian1.address)
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");

      await expect(
        guardianRegistry.connect(unauthorized).reactivateGuardian(guardian1.address)
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should revert if suspending non-active or reactivating non-suspended", async () => {
      await expect(
        guardianRegistry.connect(owner).suspendGuardian(guardian2.address)
      ).to.be.revertedWithCustomError(guardianRegistry, "OnlyActiveGuardian");

      await expect(
        guardianRegistry.connect(owner).reactivateGuardian(guardian1.address)
      ).to.be.revertedWithCustomError(guardianRegistry, "GuardianNotSlashable");
    });

    it("Should slash full stake if slashAmount exceeds staked balance", async () => {
      const excessiveSlash = ethers.parseEther("1.0");

      await guardianRegistry
        .connect(owner)
        .slashGuardian(guardian1.address, excessiveSlash, "SEVERE_MALFEASANCE");

      expect(await guardianRegistry.slashedPool()).to.equal(minStake);
      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.stakeAmount).to.equal(0);
    });

    it("Should revert if non-owner attempts to slash", async () => {
      await expect(
        guardianRegistry
          .connect(unauthorized)
          .slashGuardian(guardian1.address, minStake, "REASON")
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should revert if target is not active or suspended", async () => {
      await expect(
        guardianRegistry
          .connect(owner)
          .slashGuardian(guardian2.address, minStake, "NOT_ACTIVE")
      ).to.be.revertedWithCustomError(guardianRegistry, "GuardianNotSlashable");
    });

    it("Should prevent slashed guardian from re-registering", async () => {
      await guardianRegistry
        .connect(owner)
        .slashGuardian(guardian1.address, minStake, "SLASHED");

      await expect(
        guardianRegistry
          .connect(guardian1)
          .registerGuardian(validGeohash, validPubKey, { value: minStake })
      ).to.be.revertedWithCustomError(guardianRegistry, "GuardianIsSlashed");
    });
  });

  describe("withdrawStakeAndDeregister", () => {
    beforeEach(async () => {
      await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });
    });

    it("Should deregister active guardian and refund active stake", async () => {
      const balanceBefore = await ethers.provider.getBalance(guardian1.address);

      const tx = await guardianRegistry.connect(guardian1).withdrawStakeAndDeregister();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx)
        .to.emit(guardianRegistry, "GuardianDeregistered")
        .withArgs(guardian1.address, minStake);

      const balanceAfter = await ethers.provider.getBalance(guardian1.address);
      expect(balanceAfter).to.equal(balanceBefore + minStake - gasCost);

      expect(await guardianRegistry.activeGuardianCount()).to.equal(0);
      expect(await guardianRegistry.isGuardianActive(guardian1.address)).to.be.false;

      const g = await guardianRegistry.getGuardian(guardian1.address);
      expect(g.status).to.equal(4); // DEREGISTERED
      expect(g.stakeAmount).to.equal(0);
    });

    it("Should revert if caller is not an active guardian", async () => {
      await expect(
        guardianRegistry.connect(unauthorized).withdrawStakeAndDeregister()
      ).to.be.revertedWithCustomError(guardianRegistry, "OnlyActiveGuardian");
    });
  });

  describe("withdrawSlashedPool", () => {
    it("Should revert if slashed pool is zero", async () => {
      await expect(
        guardianRegistry.connect(owner).withdrawSlashedPool(payable(treasury.address))
      ).to.be.revertedWithCustomError(guardianRegistry, "NoFundsInPool");
    });

    it("Should revert if recipient is zero address", async () => {
      await expect(
        guardianRegistry.connect(owner).withdrawSlashedPool(payable(ethers.ZeroAddress))
      ).to.be.revertedWithCustomError(guardianRegistry, "ZeroRecipientAddress");
    });

    it("Should withdraw accumulated slashed pool to recipient", async () => {
      await guardianRegistry
        .connect(guardian1)
        .registerGuardian(validGeohash, validPubKey, { value: minStake });

      await guardianRegistry
        .connect(owner)
        .slashGuardian(guardian1.address, minStake, "SLASHED");

      const treasuryBefore = await ethers.provider.getBalance(treasury.address);

      await expect(guardianRegistry.connect(owner).withdrawSlashedPool(payable(treasury.address)))
        .to.emit(guardianRegistry, "SlashedPoolWithdrawn")
        .withArgs(treasury.address, minStake);

      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryAfter).to.equal(treasuryBefore + minStake);
      expect(await guardianRegistry.slashedPool()).to.equal(0);
    });

    it("Should revert if non-owner attempts to withdraw slashed pool", async () => {
      await expect(
        guardianRegistry.connect(unauthorized).withdrawSlashedPool(payable(treasury.address))
      ).to.be.revertedWithCustomError(guardianRegistry, "OwnableUnauthorizedAccount");
    });
  });
});

function payable(address: string) {
  return address as unknown as HardhatEthersSigner;
}
