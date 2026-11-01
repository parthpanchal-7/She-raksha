import { expect } from "chai";
import { ethers } from "hardhat";
import { EvidenceRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EvidenceRegistry (Polygon L2)", () => {
  let evidenceRegistry: EvidenceRegistry;
  let owner: HardhatEthersSigner;
  let observer: HardhatEthersSigner;
  let delegateSigner: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const validSessionId = ethers.keccak256(ethers.toUtf8Bytes("session-uuid-1234"));
  const validChunkId = ethers.keccak256(ethers.toUtf8Bytes("chunk-001"));
  const validChunkHash = ethers.keccak256(ethers.toUtf8Bytes("aes-256-gcm-chunk-ciphertext"));
  const validCID = "bafybeicv5q4tvy7q7l2e3x3y6p5o2a4n5m6k7j8h9g0f1d2c3b4a5z6y7x";

  beforeEach(async () => {
    [owner, observer, delegateSigner, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EvidenceRegistry");
    evidenceRegistry = await Factory.deploy(owner.address);
    await evidenceRegistry.waitForDeployment();
  });

  describe("Deployment & Ownership", () => {
    it("Should set correct owner and unpaused state", async () => {
      expect(await evidenceRegistry.owner()).to.equal(owner.address);
      expect(await evidenceRegistry.paused()).to.be.false;
    });

    it("Should allow owner to pause and unpause", async () => {
      await evidenceRegistry.connect(owner).pause();
      expect(await evidenceRegistry.paused()).to.be.true;

      await evidenceRegistry.connect(owner).unpause();
      expect(await evidenceRegistry.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing or unpausing", async () => {
      await expect(
        evidenceRegistry.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(evidenceRegistry, "OwnableUnauthorizedAccount");

      await expect(
        evidenceRegistry.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(evidenceRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("anchorEvidence (Chunk Level - 5 Parameters)", () => {
    it("Should successfully anchor chunk without signature (msg.sender as observer)", async () => {
      const tx = await evidenceRegistry
        .connect(observer)
        ["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          "0x"
        );

      await expect(tx)
        .to.emit(evidenceRegistry, "EvidenceAnchored")
        .withArgs(
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp),
          observer.address
        );

      const record = await evidenceRegistry.getChunkRecord(validSessionId, validChunkId);
      expect(record.chunkHash).to.equal(validChunkHash);
      expect(record.ipfsCID).to.equal(validCID);
      expect(record.observer).to.equal(observer.address);
      expect(record.timestamp).to.be.gt(0);

      expect(await evidenceRegistry.isChunkHashAnchored(validSessionId, validChunkHash)).to.be.true;
    });

    it("Should anchor chunk with a valid ECDSA signature from delegate signer", async () => {
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "bytes32"],
          [validSessionId, validChunkId, validChunkHash]
        )
      );
      const signature = await delegateSigner.signMessage(ethers.getBytes(messageDigest));

      const tx = await evidenceRegistry
        .connect(observer)
        ["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          signature
        );

      await expect(tx)
        .to.emit(evidenceRegistry, "EvidenceAnchored")
        .withArgs(
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp),
          delegateSigner.address
        );

      const record = await evidenceRegistry.getChunkRecord(validSessionId, validChunkId);
      expect(record.observer).to.equal(delegateSigner.address);
    });

    it("Should revert if signature is invalid length or malformed", async () => {
      const invalidSig = "0x12345678";
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          invalidSig
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSignature");
    });

    it("Should revert when paused", async () => {
      await evidenceRegistry.connect(owner).pause();
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "EnforcedPause");
    });

    it("Should revert on invalid inputs (zero hashes & invalid CIDs)", async () => {
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          ethers.ZeroHash,
          validChunkId,
          validChunkHash,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSessionId");

      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          ethers.ZeroHash,
          validChunkHash,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidChunkId");

      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          ethers.ZeroHash,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidChunkHash");

      // CID too short (< 10)
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          "short",
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidCID");

      // CID too long (> 128)
      const tooLongCID = "a".repeat(129);
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          tooLongCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidCID");
    });

    it("Should revert on duplicate chunk anchoring", async () => {
      await evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
        validSessionId,
        validChunkId,
        validChunkHash,
        validCID,
        "0x"
      );

      await expect(
        evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
          validSessionId,
          validChunkId,
          validChunkHash,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "EvidenceAlreadyAnchored");
    });
  });

  describe("anchorEvidence (Session Root Level - 3 Parameters)", () => {
    it("Should anchor session root directly without signature", async () => {
      const sessionDigest = ethers.keccak256(ethers.toUtf8Bytes("single-session-root"));
      const tx = await evidenceRegistry
        .connect(observer)
        ["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, "0x");

      expect(tx).to.emit(evidenceRegistry, "EvidenceAnchored");
      expect(await evidenceRegistry.isChunkHashAnchored(sessionDigest, sessionDigest)).to.be.true;
    });

    it("Should anchor session root with valid delegate signature", async () => {
      const sessionDigest = ethers.keccak256(ethers.toUtf8Bytes("signed-session-root"));
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "string"], [sessionDigest, validCID])
      );
      const signature = await delegateSigner.signMessage(ethers.getBytes(messageDigest));

      const tx = await evidenceRegistry
        .connect(observer)
        ["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, signature);

      const record = await evidenceRegistry.getChunkRecord(sessionDigest, sessionDigest);
      expect(record.observer).to.equal(delegateSigner.address);
    });

    it("Should revert on invalid session digest or invalid CID", async () => {
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](ethers.ZeroHash, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSessionId");

      await expect(
        evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](validSessionId, "short", "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidCID");
    });

    it("Should revert on duplicate session root anchoring", async () => {
      const sessionDigest = ethers.keccak256(ethers.toUtf8Bytes("duplicate-check"));
      await evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, "0x");

      await expect(
        evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "EvidenceAlreadyAnchored");
    });

    it("Should revert if signature is invalid", async () => {
      const sessionDigest = ethers.keccak256(ethers.toUtf8Bytes("invalid-sig-check"));
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, "0x1234")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSignature");
    });

    it("Should revert when paused", async () => {
      await evidenceRegistry.connect(owner).pause();
      await expect(
        evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](validSessionId, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "EnforcedPause");
    });
  });

  describe("anchorSessionMerkleRoot (Batch Anchoring)", () => {
    const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkle-tree-root-1000"));
    const chunkCount = 1000;

    it("Should batch anchor Merkle root without signature", async () => {
      const tx = await evidenceRegistry
        .connect(observer)
        .anchorSessionMerkleRoot(validSessionId, merkleRoot, chunkCount, validCID, "0x");

      await expect(tx)
        .to.emit(evidenceRegistry, "SessionMerkleRootAnchored")
        .withArgs(
          validSessionId,
          merkleRoot,
          chunkCount,
          validCID,
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp),
          observer.address
        );

      const record = await evidenceRegistry.sessionMerkleRoots(validSessionId);
      expect(record.merkleRoot).to.equal(merkleRoot);
      expect(record.chunkCount).to.equal(chunkCount);
      expect(record.observer).to.equal(observer.address);
    });

    it("Should batch anchor Merkle root with valid delegate signature", async () => {
      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32", "uint256"],
          [validSessionId, merkleRoot, chunkCount]
        )
      );
      const signature = await delegateSigner.signMessage(ethers.getBytes(messageDigest));

      await evidenceRegistry
        .connect(observer)
        .anchorSessionMerkleRoot(validSessionId, merkleRoot, chunkCount, validCID, signature);

      const record = await evidenceRegistry.sessionMerkleRoots(validSessionId);
      expect(record.observer).to.equal(delegateSigner.address);
    });

    it("Should revert on invalid inputs for Merkle root anchoring", async () => {
      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(ethers.ZeroHash, merkleRoot, chunkCount, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSessionId");

      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(validSessionId, ethers.ZeroHash, chunkCount, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidChunkHash");

      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(validSessionId, merkleRoot, 0, validCID, "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidChunkCount");

      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(validSessionId, merkleRoot, chunkCount, "bad", "0x")
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidCID");
    });

    it("Should revert on duplicate Merkle root anchoring", async () => {
      await evidenceRegistry.anchorSessionMerkleRoot(
        validSessionId,
        merkleRoot,
        chunkCount,
        validCID,
        "0x"
      );

      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(
          validSessionId,
          merkleRoot,
          chunkCount,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "EvidenceAlreadyAnchored");
    });

    it("Should revert if signature is invalid", async () => {
      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(
          validSessionId,
          merkleRoot,
          chunkCount,
          validCID,
          "0xbeef"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "InvalidSignature");
    });

    it("Should revert when paused", async () => {
      await evidenceRegistry.connect(owner).pause();
      await expect(
        evidenceRegistry.anchorSessionMerkleRoot(
          validSessionId,
          merkleRoot,
          chunkCount,
          validCID,
          "0x"
        )
      ).to.be.revertedWithCustomError(evidenceRegistry, "EnforcedPause");
    });
  });

  describe("verifyDigest", () => {
    it("Should return false for zero hashes", async () => {
      const res1 = await evidenceRegistry.verifyDigest(ethers.ZeroHash, validChunkHash);
      expect(res1.isAnchored).to.be.false;

      const res2 = await evidenceRegistry.verifyDigest(validSessionId, ethers.ZeroHash);
      expect(res2.isAnchored).to.be.false;
    });

    it("Should return false for unanchored digest", async () => {
      const res = await evidenceRegistry.verifyDigest(validSessionId, validChunkHash);
      expect(res.isAnchored).to.be.false;
      expect(res.timestamp).to.equal(0);
    });

    it("Should verify digest anchored via direct 3-param anchorEvidence", async () => {
      const sessionDigest = ethers.keccak256(ethers.toUtf8Bytes("verify-test-direct"));
      await evidenceRegistry["anchorEvidence(bytes32,string,bytes)"](sessionDigest, validCID, "0x");

      const res = await evidenceRegistry.verifyDigest(sessionDigest, sessionDigest);
      expect(res.isAnchored).to.be.true;
      expect(res.ipfsCID).to.equal(validCID);
      expect(res.timestamp).to.be.gt(0);
    });

    it("Should verify digest anchored via chunk anchor", async () => {
      const chunkHash = validChunkHash;
      await evidenceRegistry["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
        validSessionId,
        validChunkId,
        chunkHash,
        validCID,
        "0x"
      );

      const res = await evidenceRegistry.verifyDigest(validSessionId, chunkHash);
      expect(res.isAnchored).to.be.true;
      expect(res.timestamp).to.be.gt(0);
    });
  });
});
