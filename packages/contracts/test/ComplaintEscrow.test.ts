import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ComplaintEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ComplaintEscrow (BNSS §173 & §173(4) Statutory Escrow)", () => {
  let complaintEscrow: ComplaintEscrow;
  let owner: HardhatEthersSigner;
  let victim: HardhatEthersSigner;
  let policeNode: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const validComplaintId = 1001n;
  const validIncidentId = 5555n;
  const validEFIRHash = ethers.keccak256(ethers.toUtf8Bytes("efir-bns-74-assault-spec"));

  beforeEach(async () => {
    [owner, victim, policeNode, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ComplaintEscrow");
    complaintEscrow = await Factory.deploy(owner.address);
    await complaintEscrow.waitForDeployment();

    // Authorize dedicated police node
    await complaintEscrow.connect(owner).setPoliceNodeAuthorization(policeNode.address, true);
  });

  describe("Statutory Constants & Administration", () => {
    it("Should enforce statutory 72 hours (259,200s) and 48 hours (172,800s)", async () => {
      expect(await complaintEscrow.STATUTORY_ESCALATION_SECONDS()).to.equal(259200n);
      expect(await complaintEscrow.NGO_EARLY_WARNING_SECONDS()).to.equal(172800n);
    });

    it("Should allow owner to authorize and revoke police nodes", async () => {
      await expect(
        complaintEscrow.connect(owner).setPoliceNodeAuthorization(unauthorized.address, true)
      )
        .to.emit(complaintEscrow, "PoliceNodeAuthorizationUpdated")
        .withArgs(unauthorized.address, true);

      expect(await complaintEscrow.authorizedPoliceNodes(unauthorized.address)).to.be.true;

      await complaintEscrow.connect(owner).setPoliceNodeAuthorization(unauthorized.address, false);
      expect(await complaintEscrow.authorizedPoliceNodes(unauthorized.address)).to.be.false;
    });

    it("Should prevent non-owner from updating police node authorization", async () => {
      await expect(
        complaintEscrow.connect(unauthorized).setPoliceNodeAuthorization(unauthorized.address, true)
      ).to.be.revertedWithCustomError(complaintEscrow, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause and unpause", async () => {
      await complaintEscrow.connect(owner).pause();
      expect(await complaintEscrow.paused()).to.be.true;

      await complaintEscrow.connect(owner).unpause();
      expect(await complaintEscrow.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing or unpausing", async () => {
      await expect(
        complaintEscrow.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(complaintEscrow, "OwnableUnauthorizedAccount");

      await expect(
        complaintEscrow.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(complaintEscrow, "OwnableUnauthorizedAccount");
    });
  });

  describe("initEscrow", () => {
    it("Should successfully initialize complaint escrow with statutory 72-hour deadline", async () => {
      const tx = await complaintEscrow
        .connect(victim)
        .initEscrow(validComplaintId, validIncidentId, validEFIRHash);

      const blockTimestamp = (await ethers.provider.getBlock("latest"))!.timestamp;
      const expectedDeadline = BigInt(blockTimestamp) + 259200n;

      await expect(tx)
        .to.emit(complaintEscrow, "EscrowInitiated")
        .withArgs(validComplaintId, validIncidentId, validEFIRHash, expectedDeadline, victim.address);

      const [state, meta] = await complaintEscrow.getEscrow(validComplaintId);
      expect(state.incidentId).to.equal(validIncidentId);
      expect(state.signDeadline).to.equal(expectedDeadline);
      expect(state.isEscalated).to.be.false;
      expect(state.isSigned).to.be.false;

      expect(meta.victim).to.equal(victim.address);
      expect(meta.efirHash).to.equal(validEFIRHash);
      expect(meta.isAcknowledged).to.be.false;
    });

    it("Should revert on zero parameters", async () => {
      await expect(
        complaintEscrow.initEscrow(0n, validIncidentId, validEFIRHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "InvalidComplaintId");

      await expect(
        complaintEscrow.initEscrow(validComplaintId, 0n, validEFIRHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "InvalidIncidentId");

      await expect(
        complaintEscrow.initEscrow(validComplaintId, validIncidentId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "InvalidEFIRHash");
    });

    it("Should revert if escrow already exists", async () => {
      await complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash);

      await expect(
        complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "EscrowAlreadyExists");
    });

    it("Should revert when paused", async () => {
      await complaintEscrow.connect(owner).pause();

      await expect(
        complaintEscrow.initEscrow(validComplaintId, validIncidentId, validEFIRHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "EnforcedPause");
    });
  });

  describe("recordVictimSignature", () => {
    beforeEach(async () => {
      await complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash);
    });

    it("Should record direct victim signature (caller is victim)", async () => {
      const tx = await complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x");

      await expect(tx).to.emit(complaintEscrow, "VictimSignatureRecorded");

      const [state, meta] = await complaintEscrow.getEscrow(validComplaintId);
      expect(state.isSigned).to.be.true;
      expect(meta.signedAt).to.be.gt(0);
    });

    it("Should record signature using valid ECDSA signature payload", async () => {
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [validComplaintId, validEFIRHash])
      );
      const sig = await victim.signMessage(ethers.getBytes(messageDigest));

      const tx = await complaintEscrow.connect(unauthorized).recordVictimSignature(validComplaintId, sig);

      await expect(tx).to.emit(complaintEscrow, "VictimSignatureRecorded");

      const [state] = await complaintEscrow.getEscrow(validComplaintId);
      expect(state.isSigned).to.be.true;
    });

    it("Should revert if caller is unauthorized without signature", async () => {
      await expect(
        complaintEscrow.connect(unauthorized).recordVictimSignature(validComplaintId, "0x")
      ).to.be.revertedWithCustomError(complaintEscrow, "UnauthorizedSigner");
    });

    it("Should revert if signature is from unauthorized third party", async () => {
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(["uint256", "bytes32"], [validComplaintId, validEFIRHash])
      );
      const sig = await unauthorized.signMessage(ethers.getBytes(messageDigest));

      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, sig)
      ).to.be.revertedWithCustomError(complaintEscrow, "UnauthorizedSigner");
    });

    it("Should revert if signature is malformed", async () => {
      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x1234")
      ).to.be.revertedWithCustomError(complaintEscrow, "InvalidSignature");
    });

    it("Should revert if already signed", async () => {
      await complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x");

      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x")
      ).to.be.revertedWithCustomError(complaintEscrow, "AlreadySigned");
    });

    it("Should revert if signing deadline exceeded (> 72 hours)", async () => {
      await time.increase(259201); // 72 hours + 1 second

      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x")
      ).to.be.revertedWithCustomError(complaintEscrow, "DeadlineExceeded");
    });

    it("Should revert if complaint escrow does not exist", async () => {
      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(9999n, "0x")
      ).to.be.revertedWithCustomError(complaintEscrow, "EscrowNotFound");
    });

    it("Should revert when paused", async () => {
      await complaintEscrow.connect(owner).pause();
      await expect(
        complaintEscrow.connect(victim).recordVictimSignature(validComplaintId, "0x")
      ).to.be.revertedWithCustomError(complaintEscrow, "EnforcedPause");
    });
  });

  describe("recordPoliceAcknowledgement", () => {
    const badgeHash = ethers.keccak256(ethers.toUtf8Bytes("SHO-BADGE-ND-4901"));

    beforeEach(async () => {
      await complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash);
    });

    it("Should allow authorized police node to record FIR acknowledgement", async () => {
      const tx = await complaintEscrow
        .connect(policeNode)
        .recordPoliceAcknowledgement(validComplaintId, badgeHash);

      await expect(tx)
        .to.emit(complaintEscrow, "PoliceAcknowledged")
        .withArgs(validComplaintId, badgeHash, (await ethers.provider.getBlock("latest"))!.timestamp);

      const [, meta] = await complaintEscrow.getEscrow(validComplaintId);
      expect(meta.isAcknowledged).to.be.true;
      expect(meta.officerBadgeHash).to.equal(badgeHash);
    });

    it("Should allow owner to record FIR acknowledgement", async () => {
      await expect(
        complaintEscrow.connect(owner).recordPoliceAcknowledgement(validComplaintId, badgeHash)
      ).to.emit(complaintEscrow, "PoliceAcknowledged");
    });

    it("Should revert if unauthorized address attempts police acknowledgement", async () => {
      await expect(
        complaintEscrow.connect(unauthorized).recordPoliceAcknowledgement(validComplaintId, badgeHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "UnauthorizedPoliceNode");
    });

    it("Should revert on duplicate police acknowledgement", async () => {
      await complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(validComplaintId, badgeHash);

      await expect(
        complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(validComplaintId, badgeHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "AlreadyAcknowledged");
    });

    it("Should revert if escrow not found", async () => {
      await expect(
        complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(8888n, badgeHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "EscrowNotFound");
    });

    it("Should revert when paused", async () => {
      await complaintEscrow.connect(owner).pause();
      await expect(
        complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(validComplaintId, badgeHash)
      ).to.be.revertedWithCustomError(complaintEscrow, "EnforcedPause");
    });
  });

  describe("trigger72HrEscalation (BNSS §173(4) Automatic Escalation)", () => {
    beforeEach(async () => {
      await complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash);
    });

    it("Should revert if 72 hours have not elapsed", async () => {
      // 48 hours elapsed
      await time.increase(172800);

      await expect(
        complaintEscrow.trigger72HrEscalation(validComplaintId)
      ).to.be.revertedWithCustomError(complaintEscrow, "EscalationWindowNotReached");
    });

    it("Should successfully trigger BNSS §173(4) escalation after 72 hours without police acknowledgement", async () => {
      // Advance time by 72 hours + 10 seconds
      await time.increase(259210);

      const tx = await complaintEscrow.connect(unauthorized).trigger72HrEscalation(validComplaintId);

      await expect(tx)
        .to.emit(complaintEscrow, "EscrowEscalated")
        .withArgs(validComplaintId, (await ethers.provider.getBlock("latest"))!.timestamp);

      const [state, meta] = await complaintEscrow.getEscrow(validComplaintId);
      expect(state.isEscalated).to.be.true;
      expect(meta.escalatedAt).to.be.gt(0);
    });

    it("Should revert if police already acknowledged before 72 hours", async () => {
      const badgeHash = ethers.keccak256(ethers.toUtf8Bytes("SHO-BADGE-ND-4901"));
      await complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(validComplaintId, badgeHash);

      await time.increase(259210);

      await expect(
        complaintEscrow.trigger72HrEscalation(validComplaintId)
      ).to.be.revertedWithCustomError(complaintEscrow, "PoliceAlreadyAcknowledged");
    });

    it("Should revert on duplicate escalation", async () => {
      await time.increase(259210);
      await complaintEscrow.trigger72HrEscalation(validComplaintId);

      await expect(
        complaintEscrow.trigger72HrEscalation(validComplaintId)
      ).to.be.revertedWithCustomError(complaintEscrow, "AlreadyEscalated");
    });

    it("Should revert if escrow not found", async () => {
      await expect(
        complaintEscrow.trigger72HrEscalation(7777n)
      ).to.be.revertedWithCustomError(complaintEscrow, "EscrowNotFound");
    });

    it("Should revert when paused", async () => {
      await time.increase(259210);
      await complaintEscrow.connect(owner).pause();

      await expect(
        complaintEscrow.trigger72HrEscalation(validComplaintId)
      ).to.be.revertedWithCustomError(complaintEscrow, "EnforcedPause");
    });
  });

  describe("is48HrEarlyWarningReached & getEscrow", () => {
    it("Should return false initially, true after 48 hours, and false once escalated/acknowledged", async () => {
      await complaintEscrow.connect(victim).initEscrow(validComplaintId, validIncidentId, validEFIRHash);

      // Immediately after creation (< 48 hrs)
      expect(await complaintEscrow.is48HrEarlyWarningReached(validComplaintId)).to.be.false;

      // Advance by 48 hours + 10 seconds
      await time.increase(172810);
      expect(await complaintEscrow.is48HrEarlyWarningReached(validComplaintId)).to.be.true;

      // If police acknowledge, early warning returns false
      const badgeHash = ethers.keccak256(ethers.toUtf8Bytes("SHO-BADGE-ND-4901"));
      await complaintEscrow.connect(policeNode).recordPoliceAcknowledgement(validComplaintId, badgeHash);
      expect(await complaintEscrow.is48HrEarlyWarningReached(validComplaintId)).to.be.false;
    });

    it("Should return false for non-existent complaint in early warning check", async () => {
      expect(await complaintEscrow.is48HrEarlyWarningReached(99999n)).to.be.false;
    });

    it("Should revert getEscrow for non-existent complaint", async () => {
      await expect(
        complaintEscrow.getEscrow(99999n)
      ).to.be.revertedWithCustomError(complaintEscrow, "EscrowNotFound");
    });
  });
});
