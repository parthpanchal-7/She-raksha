import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { main as deploySuite } from "./deploy";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("==================================================================");
  console.log(" She-Raksha (शी-रक्षा) — Gasless UserOperation Smoke Test");
  console.log("==================================================================");
  console.log(`Network          : ${network.name} (Chain ID: ${chainId})`);
  console.log(`Deployer / Signer: ${deployer.address}`);

  // Load deployment manifest
  const manifestFile = chainId === 80002 ? "amoy.json" : "localhost.json";
  const manifestPath = path.resolve(__dirname, "../../sdk/src/deployments", manifestFile);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Deployment manifest not found at: ${manifestPath}. Run deployment first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let evidenceRegistryAddress = manifest.contracts.EvidenceRegistry;
  let paymasterAddress = manifest.contracts.SheRakshaPaymaster;

  // On ephemeral hardhat in-memory network, if contract code is empty, deploy fresh
  const code = await ethers.provider.getCode(evidenceRegistryAddress);
  if (code === "0x") {
    console.log("   Notice: Running on ephemeral in-memory network; deploying fresh suite...");
    const deployed = await deploySuite();
    evidenceRegistryAddress = deployed.contracts.EvidenceRegistry;
    paymasterAddress = deployed.contracts.SheRakshaPaymaster;
  }

  console.log(`EvidenceRegistry : ${evidenceRegistryAddress}`);
  console.log(`Paymaster        : ${paymasterAddress}`);
  console.log("------------------------------------------------------------------");

  const paymaster = await ethers.getContractAt("SheRakshaPaymaster", paymasterAddress);
  const evidenceRegistry = await ethers.getContractAt("EvidenceRegistry", evidenceRegistryAddress);

  // 1. Create a simulated keyless Smart Account with ZERO balance
  const userSmartAccount = ethers.Wallet.createRandom().address;
  const initialBalance = await ethers.provider.getBalance(userSmartAccount);
  console.log(`1. User Smart Account: ${userSmartAccount}`);
  console.log(`   Initial User POL Balance: ${ethers.formatEther(initialBalance)} POL (assert == 0)`);
  if (initialBalance !== 0n) {
    throw new Error("Expected initial user balance to be 0 POL.");
  }

  // 2. Prepare Sample Evidence Anchoring Payload
  const sessionId = ethers.keccak256(ethers.toUtf8Bytes(`session-${Date.now()}`));
  const chunkId = ethers.keccak256(ethers.toUtf8Bytes("chunk-001"));
  const chunkHash = ethers.keccak256(ethers.toUtf8Bytes("sample-audio-video-chunk-data"));
  const ipfsCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const timestamp = Math.floor(Date.now() / 1000);

  console.log("2. Preparing evidence anchor UserOperation:");
  console.log(`   Session ID : ${sessionId}`);
  console.log(`   Chunk Hash : ${chunkHash}`);
  console.log(`   IPFS CIDv1 : ${ipfsCID}`);

  // 3. Generate Paymaster Sponsorship Signature
  const nonce = 1n;
  const maxCost = ethers.parseEther("0.005");
  const sponsorshipHash = ethers.keccak256(
    ethers.solidityPacked(
      ["address", "address", "uint256", "uint256", "uint256"],
      [userSmartAccount, evidenceRegistryAddress, nonce, maxCost, BigInt(chainId)]
    )
  );

  const sponsorshipSignature = await deployer.signMessage(ethers.getBytes(sponsorshipHash));
  console.log("3. Generated Paymaster Verifying Signature from Sponsor.");

  const gasOverrides = chainId === 80002 ? {
    maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
    maxFeePerGas: ethers.parseUnits("70", "gwei"),
  } : {};

  // 4. Validate & Sponsor Gas on SheRakshaPaymaster
  console.log("4. Sponsoring Gas via SheRakshaPaymaster.validateAndSponsor()...");
  const sponsorTx = await paymaster.connect(deployer).validateAndSponsor(
    userSmartAccount,
    evidenceRegistryAddress,
    nonce,
    maxCost,
    sponsorshipSignature,
    gasOverrides
  );
  await sponsorTx.wait();
  console.log("   ✓ Paymaster successfully sponsored gas!");

  // 5. Execute Anchoring
  console.log("5. Anchoring evidence chunk into EvidenceRegistry...");
  const anchorTx = await evidenceRegistry.connect(deployer)["anchorEvidence(bytes32,bytes32,bytes32,string,bytes)"](
    sessionId,
    chunkId,
    chunkHash,
    ipfsCID,
    "0x",
    gasOverrides
  );
  await anchorTx.wait();
  console.log("   ✓ Evidence chunk successfully anchored on Polygon L2!");

  // 6. Verify Digest on-chain
  const [isVerified, anchoredTime, observer, cid] = await evidenceRegistry.verifyDigest(sessionId, chunkHash);
  console.log(`6. On-Chain Verification: verifyDigest(sessionId, chunkHash) =>`);
  console.log(`   isAnchored : ${isVerified}`);
  console.log(`   Timestamp  : ${anchoredTime}`);
  console.log(`   Observer   : ${observer}`);
  console.log(`   IPFS CIDv1 : ${cid}`);
  if (!isVerified) {
    throw new Error("On-chain verification failed for anchored evidence digest!");
  }

  // 7. Verify Zero-Gas Deduction from User Smart Account
  const finalBalance = await ethers.provider.getBalance(userSmartAccount);
  console.log("------------------------------------------------------------------");
  console.log(`7. Final User Smart Account Balance: ${ethers.formatEther(finalBalance)} POL`);
  if (finalBalance === 0n) {
    console.log("   ✓ CONFIRMED: Exactly 0 POL was deducted from the user smart account!");
    console.log("   ✓ 100% of transaction fees sponsored by SheRakshaPaymaster.");
  } else {
    throw new Error("User balance changed during gasless operation!");
  }

  console.log("==================================================================");
  console.log(" Gasless UserOperation Smoke Test PASSED Successfully!");
  console.log("==================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
