import { expect } from "chai";
import { ethers } from "hardhat";
import { SOSLog } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SOSLog (Polygon L2)", () => {
  let sosLog: SOSLog;
  let owner: HardhatEthersSigner;
  let victim: HardhatEthersSigner;
  let delegateSigner: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const validIncidentHash = ethers.keccak256(ethers.toUtf8Bytes("incident-4912"));
  const validMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("telemetry-merkle-root"));

  beforeEach(async () => {
    [owner, victim, delegateSigner, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SOSLog");
    sosLog = await Factory.deploy(owner.address);
    await sosLog.waitForDeployment();
  });

  describe("Deployment & Admin", () => {
    it("Should set owner and initial unpaused status", async () => {
      expect(await sosLog.owner()).to.equal(owner.address);
      expect(await sosLog.paused()).to.be.false;
    });

    it("Should allow owner to pause and unpause", async () => {
      await sosLog.connect(owner).pause();
      expect(await sosLog.paused()).to.be.true;

      await sosLog.connect(owner).unpause();
      expect(await sosLog.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing or unpausing", async () => {
      await expect(
        sosLog.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(sosLog, "OwnableUnauthorizedAccount");

      await expect(
        sosLog.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(sosLog, "OwnableUnauthorizedAccount");
    });
  });

  describe("notarizeDistress", () => {
    it("Should notarize distress without signature (msg.sender as signatory)", async () => {
      const tx = await sosLog.connect(victim).notarizeDistress(validIncidentHash, validMerkleRoot, "0x");

      await expect(tx)
        .to.emit(sosLog, "DistressNotarized")
        .withArgs(
          validIncidentHash,
          validMerkleRoot,
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp),
          victim.address
        );

      expect(await sosLog.isIncidentAnchored(validIncidentHash)).to.be.true;
      const anchor = await sosLog.getIncidentAnchor(validIncidentHash);
      expect(anchor.rootMerkleTree).to.equal(validMerkleRoot);
      expect(anchor.signatory).to.equal(victim.address);
    });

    it("Should notarize distress with valid delegate signature", async () => {
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [validIncidentHash, validMerkleRoot])
      );
      const signature = await delegateSigner.signMessage(ethers.getBytes(messageDigest));

      const tx = await sosLog
        .connect(victim)
        .notarizeDistress(validIncidentHash, validMerkleRoot, signature);

      const anchor = await sosLog.getIncidentAnchor(validIncidentHash);
      expect(anchor.signatory).to.equal(delegateSigner.address);
    });

    it("Should revert on invalid inputs (zero hashes)", async () => {
      await expect(
        sosLog.notarizeDistress(ethers.ZeroHash, validMerkleRoot, "0x")
      ).to.be.revertedWithCustomError(sosLog, "InvalidIncidentHash");

      await expect(
        sosLog.notarizeDistress(validIncidentHash, ethers.ZeroHash, "0x")
      ).to.be.revertedWithCustomError(sosLog, "InvalidMerkleRoot");
    });

    it("Should revert on duplicate notarization", async () => {
      await sosLog.connect(victim).notarizeDistress(validIncidentHash, validMerkleRoot, "0x");

      await expect(
        sosLog.connect(victim).notarizeDistress(validIncidentHash, validMerkleRoot, "0x")
      ).to.be.revertedWithCustomError(sosLog, "IncidentAlreadyAnchored");
    });

    it("Should revert on invalid signature", async () => {
      await expect(
        sosLog.notarizeDistress(validIncidentHash, validMerkleRoot, "0xdeadbeef")
      ).to.be.revertedWithCustomError(sosLog, "InvalidSignature");
    });

    it("Should revert when paused", async () => {
      await sosLog.connect(owner).pause();
      await expect(
        sosLog.notarizeDistress(validIncidentHash, validMerkleRoot, "0x")
      ).to.be.revertedWithCustomError(sosLog, "EnforcedPause");
    });
  });

  describe("logDisconnectionQueue (Offline SQLCipher Replay)", () => {
    it("Should revert if queue is empty", async () => {
      await expect(sosLog.logDisconnectionQueue([])).to.be.revertedWithCustomError(
        sosLog,
        "EmptyQueue"
      );
    });

    it("Should revert if queue exceeds MAX_BATCH_SIZE (100)", async () => {
      const items = [];
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      for (let i = 0; i < 101; i++) {
        items.push({
          incidentHash: ethers.keccak256(ethers.toUtf8Bytes(`incident-${i}`)),
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now,
          signature: "0x",
        });
      }

      await expect(sosLog.logDisconnectionQueue(items)).to.be.revertedWithCustomError(
        sosLog,
        "BatchSizeExceeded"
      );
    });

    it("Should revert if an item has future deviceTimestamp", async () => {
      const futureTimestamp = (await ethers.provider.getBlock("latest"))!.timestamp + 1000;
      const items = [
        {
          incidentHash: validIncidentHash,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: futureTimestamp,
          signature: "0x",
        },
      ];

      await expect(sosLog.logDisconnectionQueue(items)).to.be.revertedWithCustomError(
        sosLog,
        "InvalidDeviceTimestamp"
      );
    });

    it("Should revert if item has zero incidentHash or rootMerkleTree", async () => {
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;

      await expect(
        sosLog.logDisconnectionQueue([
          {
            incidentHash: ethers.ZeroHash,
            rootMerkleTree: validMerkleRoot,
            deviceTimestamp: now,
            signature: "0x",
          },
        ])
      ).to.be.revertedWithCustomError(sosLog, "InvalidIncidentHash");

      await expect(
        sosLog.logDisconnectionQueue([
          {
            incidentHash: validIncidentHash,
            rootMerkleTree: ethers.ZeroHash,
            deviceTimestamp: now,
            signature: "0x",
          },
        ])
      ).to.be.revertedWithCustomError(sosLog, "InvalidMerkleRoot");
    });

    it("Should successfully replay offline batch without signatures", async () => {
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      const incident1 = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
      const incident2 = ethers.keccak256(ethers.toUtf8Bytes("batch-2"));

      const items = [
        {
          incidentHash: incident1,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now - 50,
          signature: "0x",
        },
        {
          incidentHash: incident2,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now - 20,
          signature: "0x",
        },
      ];

      const tx = await sosLog.connect(victim).logDisconnectionQueue(items);

      await expect(tx).to.emit(sosLog, "OfflinePacketReplayed");

      expect(await sosLog.deviceTimestamps(incident1)).to.equal(now - 50);
      expect(await sosLog.deviceTimestamps(incident2)).to.equal(now - 20);

      const anchor1 = await sosLog.getIncidentAnchor(incident1);
      expect(anchor1.signatory).to.equal(victim.address);
    });

    it("Should replay offline item with delegate signature", async () => {
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      const incident = ethers.keccak256(ethers.toUtf8Bytes("signed-offline"));
      const deviceTime = now - 100;

      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "uint256"],
          [incident, validMerkleRoot, deviceTime]
        )
      );
      const signature = await delegateSigner.signMessage(ethers.getBytes(messageDigest));

      const items = [
        {
          incidentHash: incident,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: deviceTime,
          signature: signature,
        },
      ];

      await sosLog.connect(victim).logDisconnectionQueue(items);
      const anchor = await sosLog.getIncidentAnchor(incident);
      expect(anchor.signatory).to.equal(delegateSigner.address);
    });

    it("Should replay items even if already anchored without overwriting initial anchor", async () => {
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      // Anchor incident online first
      await sosLog.connect(victim).notarizeDistress(validIncidentHash, validMerkleRoot, "0x");
      const initialTimestamp = (await sosLog.getIncidentAnchor(validIncidentHash)).anchorTimestamp;

      // Replay offline queue item for same incident
      const items = [
        {
          incidentHash: validIncidentHash,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now - 30,
          signature: "0x",
        },
      ];

      await sosLog.connect(victim).logDisconnectionQueue(items);
      const anchorAfter = await sosLog.getIncidentAnchor(validIncidentHash);
      expect(anchorAfter.anchorTimestamp).to.equal(initialTimestamp);
      expect(await sosLog.deviceTimestamps(validIncidentHash)).to.equal(now - 30);
    });

    it("Should revert if item signature is malformed", async () => {
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      const items = [
        {
          incidentHash: validIncidentHash,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now - 10,
          signature: "0x1234",
        },
      ];

      await expect(sosLog.logDisconnectionQueue(items)).to.be.revertedWithCustomError(
        sosLog,
        "InvalidSignature"
      );
    });

    it("Should revert when paused", async () => {
      await sosLog.connect(owner).pause();
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      const items = [
        {
          incidentHash: validIncidentHash,
          rootMerkleTree: validMerkleRoot,
          deviceTimestamp: now,
          signature: "0x",
        },
      ];

      await expect(sosLog.logDisconnectionQueue(items)).to.be.revertedWithCustomError(
        sosLog,
        "EnforcedPause"
      );
    });
  });

  describe("getIncidentAnchor & isIncidentAnchored", () => {
    it("Should revert getIncidentAnchor if incident not found", async () => {
      const unanchored = ethers.keccak256(ethers.toUtf8Bytes("not-here"));
      expect(await sosLog.isIncidentAnchored(unanchored)).to.be.false;

      await expect(sosLog.getIncidentAnchor(unanchored)).to.be.revertedWithCustomError(
        sosLog,
        "IncidentNotFound"
      );
    });
  });
});
