import { expect } from "chai";
import { ethers } from "hardhat";
import { SheRakshaPaymaster, MockEntryPoint } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SheRakshaPaymaster (ERC-4337 Verifying Paymaster)", () => {
  let paymaster: SheRakshaPaymaster;
  let mockEntryPoint: MockEntryPoint;
  let owner: HardhatEthersSigner;
  let verifyingSigner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let whitelistedTarget: HardhatEthersSigner;
  let unwhitelistedTarget: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, verifyingSigner, user, whitelistedTarget, unwhitelistedTarget, unauthorized] =
      await ethers.getSigners();

    const EntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await EntryPointFactory.deploy();
    await mockEntryPoint.waitForDeployment();

    const PaymasterFactory = await ethers.getContractFactory("SheRakshaPaymaster");
    paymaster = await PaymasterFactory.deploy(
      owner.address,
      await mockEntryPoint.getAddress(),
      verifyingSigner.address
    );
    await paymaster.waitForDeployment();

    // Whitelist target
    await paymaster.connect(owner).setWhitelistedTarget(whitelistedTarget.address, true);

    // Fund EntryPoint contract with ETH so impersonated signer has gas funds
    await owner.sendTransaction({
      to: await mockEntryPoint.getAddress(),
      value: ethers.parseEther("10.0"),
    });
  });

  describe("Deployment & Configuration", () => {
    it("Should initialize with correct owner, EntryPoint, verifyingSigner, and threshold", async () => {
      expect(await paymaster.owner()).to.equal(owner.address);
      expect(await paymaster.entryPoint()).to.equal(await mockEntryPoint.getAddress());
      expect(await paymaster.verifyingSigner()).to.equal(verifyingSigner.address);
      expect(await paymaster.lowBalanceThreshold()).to.equal(ethers.parseEther("0.5"));
      expect(await paymaster.paused()).to.be.false;
    });

    it("Should allow owner to whitelist single and batch targets", async () => {
      const [t1, t2, t3, t4, t5] = [
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
      ];

      await paymaster.connect(owner).batchWhitelistTargets(t1, t2, t3, t4, t5);

      expect(await paymaster.isWhitelistedTarget(t1)).to.be.true;
      expect(await paymaster.isWhitelistedTarget(t2)).to.be.true;
      expect(await paymaster.isWhitelistedTarget(t3)).to.be.true;
      expect(await paymaster.isWhitelistedTarget(t4)).to.be.true;
      expect(await paymaster.isWhitelistedTarget(t5)).to.be.true;
    });

    it("Should revert if setting zero address target", async () => {
      await expect(
        paymaster.connect(owner).setWhitelistedTarget(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(paymaster, "ZeroAddress");
    });

    it("Should allow owner to update verifying signer", async () => {
      const newSigner = ethers.Wallet.createRandom().address;
      await expect(paymaster.connect(owner).setVerifyingSigner(newSigner))
        .to.emit(paymaster, "VerifyingSignerUpdated")
        .withArgs(verifyingSigner.address, newSigner);

      expect(await paymaster.verifyingSigner()).to.equal(newSigner);
    });

    it("Should revert if updating verifying signer to zero address", async () => {
      await expect(
        paymaster.connect(owner).setVerifyingSigner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(paymaster, "ZeroAddress");
    });

    it("Should allow owner to update EntryPoint address", async () => {
      const newEP = ethers.Wallet.createRandom().address;
      await expect(paymaster.connect(owner).setEntryPoint(newEP))
        .to.emit(paymaster, "EntryPointUpdated")
        .withArgs(await mockEntryPoint.getAddress(), newEP);

      expect(await paymaster.entryPoint()).to.equal(newEP);
    });

    it("Should revert if updating EntryPoint to zero address", async () => {
      await expect(
        paymaster.connect(owner).setEntryPoint(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(paymaster, "ZeroAddress");
    });

    it("Should allow owner to update low balance threshold", async () => {
      const newThreshold = ethers.parseEther("1.0");
      await expect(paymaster.connect(owner).setLowBalanceThreshold(newThreshold))
        .to.emit(paymaster, "LowBalanceThresholdUpdated")
        .withArgs(ethers.parseEther("0.5"), newThreshold);

      expect(await paymaster.lowBalanceThreshold()).to.equal(newThreshold);
    });

    it("Should prevent non-owner from updating parameters", async () => {
      await expect(
        paymaster.connect(unauthorized).setWhitelistedTarget(whitelistedTarget.address, false)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");

      await expect(
        paymaster.connect(unauthorized).setVerifyingSigner(unauthorized.address)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");

      await expect(
        paymaster.connect(unauthorized).setEntryPoint(unauthorized.address)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");

      await expect(
        paymaster.connect(unauthorized).setLowBalanceThreshold(ethers.parseEther("2.0"))
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause and unpause", async () => {
      await paymaster.connect(owner).pause();
      expect(await paymaster.paused()).to.be.true;

      await paymaster.connect(owner).unpause();
      expect(await paymaster.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing/unpausing", async () => {
      await expect(
        paymaster.connect(unauthorized).pause()
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");

      await expect(
        paymaster.connect(unauthorized).unpause()
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });
  });

  describe("validateAndSponsor (Direct Sponsorship & Monotonic Nonces)", () => {
    it("Should sponsor 100% gas for whitelisted target with monotonic nonce", async () => {
      const maxCost = ethers.parseEther("0.005");
      const nonce = 1n;

      const tx = await paymaster
        .connect(user)
        .validateAndSponsor(user.address, whitelistedTarget.address, nonce, maxCost, "0x");

      await expect(tx)
        .to.emit(paymaster, "GasSponsored")
        .withArgs(user.address, whitelistedTarget.address, maxCost);

      expect(await paymaster.userNonces(user.address)).to.equal(nonce);
      expect(await paymaster.totalGasSponsored()).to.equal(maxCost);
      expect(await paymaster.totalOpsSponsored()).to.equal(1n);
    });

    it("Should sponsor with valid verifyingSigner ECDSA signature", async () => {
      const maxCost = ethers.parseEther("0.005");
      const nonce = 2n;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "uint256", "uint256", "uint256"],
          [user.address, whitelistedTarget.address, nonce, maxCost, chainId]
        )
      );
      const sig = await verifyingSigner.signMessage(ethers.getBytes(messageDigest));

      const tx = await paymaster
        .connect(user)
        .validateAndSponsor(user.address, whitelistedTarget.address, nonce, maxCost, sig);

      await expect(tx).to.emit(paymaster, "GasSponsored");
      expect(await paymaster.userNonces(user.address)).to.equal(nonce);
    });

    it("Should sponsor with valid owner signature as fallback signer", async () => {
      const maxCost = ethers.parseEther("0.005");
      const nonce = 3n;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "uint256", "uint256", "uint256"],
          [user.address, whitelistedTarget.address, nonce, maxCost, chainId]
        )
      );
      const sig = await owner.signMessage(ethers.getBytes(messageDigest));

      await expect(
        paymaster.connect(user).validateAndSponsor(user.address, whitelistedTarget.address, nonce, maxCost, sig)
      ).to.emit(paymaster, "GasSponsored");
    });

    it("Should revert if signature is from unauthorized signer", async () => {
      const maxCost = ethers.parseEther("0.005");
      const nonce = 4n;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const messageDigest = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "uint256", "uint256", "uint256"],
          [user.address, whitelistedTarget.address, nonce, maxCost, chainId]
        )
      );
      const sig = await unauthorized.signMessage(ethers.getBytes(messageDigest));

      await expect(
        paymaster.connect(user).validateAndSponsor(user.address, whitelistedTarget.address, nonce, maxCost, sig)
      ).to.be.revertedWithCustomError(paymaster, "InvalidSignature");
    });

    it("Should revert if target is not whitelisted", async () => {
      await expect(
        paymaster.validateAndSponsor(user.address, unwhitelistedTarget.address, 1n, 100n, "0x")
      ).to.be.revertedWithCustomError(paymaster, "TargetNotWhitelisted");
    });

    it("Should revert if nonce is not strictly increasing (NFR-SEC-003 Replay Protection)", async () => {
      await paymaster.validateAndSponsor(user.address, whitelistedTarget.address, 10n, 100n, "0x");

      // Attempt replay with identical nonce (10)
      await expect(
        paymaster.validateAndSponsor(user.address, whitelistedTarget.address, 10n, 100n, "0x")
      ).to.be.revertedWithCustomError(paymaster, "InvalidNonce");

      // Attempt replay with lower nonce (9)
      await expect(
        paymaster.validateAndSponsor(user.address, whitelistedTarget.address, 9n, 100n, "0x")
      ).to.be.revertedWithCustomError(paymaster, "InvalidNonce");
    });

    it("Should emit LowBalanceAlert when deposit is below threshold", async () => {
      // Current deposit is 0, threshold is 0.5 POL
      await expect(
        paymaster.validateAndSponsor(user.address, whitelistedTarget.address, 20n, 100n, "0x")
      ).to.emit(paymaster, "LowBalanceAlert");
    });

    it("Should revert when paused", async () => {
      await paymaster.connect(owner).pause();

      await expect(
        paymaster.validateAndSponsor(user.address, whitelistedTarget.address, 25n, 100n, "0x")
      ).to.be.revertedWithCustomError(paymaster, "EnforcedPause");
    });
  });

  describe("ERC-4337 validatePaymasterUserOp & postOp", () => {
    it("Should successfully validate UserOperation from EntryPoint", async () => {
      // Craft calldata containing whitelisted target in bytes 16:36
      const callData = ethers.solidityPacked(
        ["bytes16", "address", "bytes"],
        ["0x00000000000000000000000000000000", whitelistedTarget.address, "0x1234"]
      );

      const userOp = {
        sender: user.address,
        nonce: 100n,
        initCode: "0x",
        callData: callData,
        callGasLimit: 100000n,
        verificationGasLimit: 50000n,
        preVerificationGas: 21000n,
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: "0x",
        signature: "0x",
      };

      // Call as EntryPoint
      const epSigner = await ethers.getImpersonatedSigner(await mockEntryPoint.getAddress());
      // Fund impersonated signer
      await owner.sendTransaction({ to: await mockEntryPoint.getAddress(), value: ethers.parseEther("1.0") });

      const tx = await paymaster
        .connect(epSigner)
        .validatePaymasterUserOp(userOp, ethers.ZeroHash, ethers.parseEther("0.005"));

      expect(tx).to.emit(paymaster, "GasSponsored");
      expect(await paymaster.userNonces(user.address)).to.equal(100n);

      // Call postOp
      await expect(paymaster.connect(epSigner).postOp(0, "0x", 1000n)).to.not.be.reverted;
    });

    it("Should revert validatePaymasterUserOp if caller is not EntryPoint", async () => {
      const userOp = {
        sender: user.address,
        nonce: 101n,
        initCode: "0x",
        callData: "0x",
        callGasLimit: 100000n,
        verificationGasLimit: 50000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 2n,
        paymasterAndData: "0x",
        signature: "0x",
      };

      await expect(
        paymaster.connect(unauthorized).validatePaymasterUserOp(userOp, ethers.ZeroHash, 1000n)
      ).to.be.revertedWithCustomError(paymaster, "UnauthorizedEntryPoint");

      await expect(
        paymaster.connect(unauthorized).postOp(0, "0x", 1000n)
      ).to.be.revertedWithCustomError(paymaster, "UnauthorizedEntryPoint");
    });

    it("Should revert validatePaymasterUserOp if target is not whitelisted", async () => {
      const callData = ethers.solidityPacked(
        ["bytes16", "address", "bytes"],
        ["0x00000000000000000000000000000000", unwhitelistedTarget.address, "0x1234"]
      );

      const userOp = {
        sender: user.address,
        nonce: 102n,
        initCode: "0x",
        callData: callData,
        callGasLimit: 100000n,
        verificationGasLimit: 50000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 2n,
        paymasterAndData: "0x",
        signature: "0x",
      };

      const epSigner = await ethers.getImpersonatedSigner(await mockEntryPoint.getAddress());
      await expect(
        paymaster.connect(epSigner).validatePaymasterUserOp(userOp, ethers.ZeroHash, 1000n)
      ).to.be.revertedWithCustomError(paymaster, "TargetNotWhitelisted");
    });

    it("Should revert validatePaymasterUserOp if nonce is not strictly increasing", async () => {
      const callData = ethers.solidityPacked(
        ["bytes16", "address", "bytes"],
        ["0x00000000000000000000000000000000", whitelistedTarget.address, "0x1234"]
      );

      const userOp = {
        sender: user.address,
        nonce: 50n,
        initCode: "0x",
        callData: callData,
        callGasLimit: 100000n,
        verificationGasLimit: 50000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 2n,
        paymasterAndData: "0x",
        signature: "0x",
      };

      const epSigner = await ethers.getImpersonatedSigner(await mockEntryPoint.getAddress());
      await paymaster.connect(epSigner).validatePaymasterUserOp(userOp, ethers.ZeroHash, 1000n);

      // Replay with nonce 50n
      await expect(
        paymaster.connect(epSigner).validatePaymasterUserOp(userOp, ethers.ZeroHash, 1000n)
      ).to.be.revertedWithCustomError(paymaster, "InvalidNonce");
    });

    it("Should revert validatePaymasterUserOp when paused", async () => {
      await paymaster.connect(owner).pause();
      const epSigner = await ethers.getImpersonatedSigner(await mockEntryPoint.getAddress());

      const userOp = {
        sender: user.address,
        nonce: 200n,
        initCode: "0x",
        callData: "0x",
        callGasLimit: 100000n,
        verificationGasLimit: 50000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 2n,
        paymasterAndData: "0x",
        signature: "0x",
      };

      await expect(
        paymaster.connect(epSigner).validatePaymasterUserOp(userOp, ethers.ZeroHash, 1000n)
      ).to.be.revertedWithCustomError(paymaster, "EnforcedPause");
    });
  });

  describe("Deposit, Withdraw & Balance Accounting", () => {
    it("Should deposit funds into EntryPoint via deposit() and receive()", async () => {
      const depositVal = ethers.parseEther("1.0");

      await paymaster.connect(owner).deposit({ value: depositVal });
      expect(await paymaster.getDeposit()).to.equal(depositVal);

      // Via receive()
      await owner.sendTransaction({
        to: await paymaster.getAddress(),
        value: depositVal,
      });
      expect(await paymaster.getDeposit()).to.equal(depositVal * 2n);
    });

    it("Should allow owner to withdraw funds from EntryPoint", async () => {
      const depositVal = ethers.parseEther("2.0");
      await paymaster.connect(owner).deposit({ value: depositVal });

      const recipient = ethers.Wallet.createRandom().address;
      const withdrawVal = ethers.parseEther("1.5");

      await paymaster.connect(owner).withdrawTo(payable(recipient), withdrawVal);
      expect(await ethers.provider.getBalance(recipient)).to.equal(withdrawVal);
      expect(await paymaster.getDeposit()).to.equal(ethers.parseEther("0.5"));
    });

    it("Should revert if withdrawing to zero address", async () => {
      await expect(
        paymaster.connect(owner).withdrawTo(payable(ethers.ZeroAddress), 100n)
      ).to.be.revertedWithCustomError(paymaster, "ZeroAddress");
    });

    it("Should revert if non-owner attempts withdrawal", async () => {
      await expect(
        paymaster.connect(unauthorized).withdrawTo(payable(unauthorized.address), 100n)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("Should support standalone deposit and withdrawal when entryPoint is zero address", async () => {
      const Factory = await ethers.getContractFactory("SheRakshaPaymaster");
      const standalone = await Factory.deploy(owner.address, ethers.ZeroAddress, verifyingSigner.address);

      // Send ether directly to standalone contract
      await owner.sendTransaction({
        to: await standalone.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      expect(await standalone.getDeposit()).to.equal(ethers.parseEther("1.0"));

      // Withdraw
      const recipient = ethers.Wallet.createRandom().address;
      await standalone.connect(owner).withdrawTo(payable(recipient), ethers.parseEther("0.5"));
      expect(await ethers.provider.getBalance(recipient)).to.equal(ethers.parseEther("0.5"));
      expect(await standalone.getDeposit()).to.equal(ethers.parseEther("0.5"));
    });
  });
});

function payable(address: string) {
  return address as unknown as HardhatEthersSigner;
}
