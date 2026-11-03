import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Canonical ERC-4337 EntryPoint v0.7
const CANONICAL_ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
const STATUTORY_72_HOURS = 259200; // BNSS §173 statutory constant

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("==================================================================");
  console.log(` She-Raksha (शी-रक्षा) — Polygon L2 Smart Contracts Deployment`);
  console.log("==================================================================");
  console.log(`Deployer Address : ${deployer.address}`);
  console.log(`Network          : ${network.name} (Chain ID: ${chainId})`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance : ${ethers.formatEther(balance)} POL / ETH`);
  console.log("------------------------------------------------------------------");

  // 1. Deploy Groth16Verifier
  console.log("1. Deploying Groth16Verifier...");
  const Groth16VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
  const groth16Verifier = await Groth16VerifierFactory.deploy();
  await groth16Verifier.waitForDeployment();
  const groth16VerifierAddress = await groth16Verifier.getAddress();
  console.log(`   ✓ Groth16Verifier deployed at: ${groth16VerifierAddress}`);

  // 2. Deploy ZKReportVerifier (linked to Groth16Verifier)
  console.log("2. Deploying ZKReportVerifier...");
  const ZKReportVerifierFactory = await ethers.getContractFactory("ZKReportVerifier");
  const zkReportVerifier = await ZKReportVerifierFactory.deploy(deployer.address, groth16VerifierAddress);
  await zkReportVerifier.waitForDeployment();
  const zkReportVerifierAddress = await zkReportVerifier.getAddress();
  console.log(`   ✓ ZKReportVerifier deployed at: ${zkReportVerifierAddress}`);

  // 3. Deploy EvidenceRegistry
  console.log("3. Deploying EvidenceRegistry...");
  const EvidenceRegistryFactory = await ethers.getContractFactory("EvidenceRegistry");
  const evidenceRegistry = await EvidenceRegistryFactory.deploy(deployer.address);
  await evidenceRegistry.waitForDeployment();
  const evidenceRegistryAddress = await evidenceRegistry.getAddress();
  console.log(`   ✓ EvidenceRegistry deployed at: ${evidenceRegistryAddress}`);

  // 4. Deploy SOSLog
  console.log("4. Deploying SOSLog...");
  const SOSLogFactory = await ethers.getContractFactory("SOSLog");
  const sosLog = await SOSLogFactory.deploy(deployer.address);
  await sosLog.waitForDeployment();
  const sosLogAddress = await sosLog.getAddress();
  console.log(`   ✓ SOSLog deployed at: ${sosLogAddress}`);

  // 5. Deploy GuardianRegistry
  console.log("5. Deploying GuardianRegistry...");
  const minStakeWei = ethers.parseEther("0.01"); // 0.01 POL min stake
  const GuardianRegistryFactory = await ethers.getContractFactory("GuardianRegistry");
  const guardianRegistry = await GuardianRegistryFactory.deploy(deployer.address, minStakeWei);
  await guardianRegistry.waitForDeployment();
  const guardianRegistryAddress = await guardianRegistry.getAddress();
  console.log(`   ✓ GuardianRegistry deployed at: ${guardianRegistryAddress}`);

  // 6. Deploy ComplaintEscrow (BNSS §173 72-Hour Statutory Constant)
  console.log("6. Deploying ComplaintEscrow...");
  const ComplaintEscrowFactory = await ethers.getContractFactory("ComplaintEscrow");
  const complaintEscrow = await ComplaintEscrowFactory.deploy(deployer.address);
  await complaintEscrow.waitForDeployment();
  const complaintEscrowAddress = await complaintEscrow.getAddress();
  console.log(`   ✓ ComplaintEscrow deployed at: ${complaintEscrowAddress}`);

  // 7. Deploy AccessGrant
  console.log("7. Deploying AccessGrant...");
  const AccessGrantFactory = await ethers.getContractFactory("AccessGrant");
  const accessGrant = await AccessGrantFactory.deploy(deployer.address);
  await accessGrant.waitForDeployment();
  const accessGrantAddress = await accessGrant.getAddress();
  console.log(`   ✓ AccessGrant deployed at: ${accessGrantAddress}`);

  // 8. Deploy SheRakshaPaymaster
  console.log("8. Deploying SheRakshaPaymaster...");
  const verifyingSigner = process.env.PAYMASTER_VERIFYING_SIGNER || deployer.address;
  const entryPointAddress = chainId === 31337
    ? ethers.ZeroAddress // Standalone mock mode for local testing
    : (process.env.ERC4337_ENTRYPOINT_ADDRESS || CANONICAL_ENTRYPOINT_V07);

  const SheRakshaPaymasterFactory = await ethers.getContractFactory("SheRakshaPaymaster");
  const paymaster = await SheRakshaPaymasterFactory.deploy(deployer.address, entryPointAddress, verifyingSigner);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log(`   ✓ SheRakshaPaymaster deployed at: ${paymasterAddress}`);

  // Whitelist She-Raksha Contracts on the Paymaster
  console.log("9. Whitelisting core contracts on Paymaster...");
  const txBatch = await paymaster.batchWhitelistTargets(
    evidenceRegistryAddress,
    sosLogAddress,
    complaintEscrowAddress,
    zkReportVerifierAddress,
    accessGrantAddress
  );
  await txBatch.wait();

  const txGuardian = await paymaster.setWhitelistedTarget(guardianRegistryAddress, true);
  await txGuardian.wait();
  console.log("   ✓ Whitelisted all 6 core contracts on Paymaster.");

  // Export Deployment Manifest
  const deploymentManifest = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      Groth16Verifier: groth16VerifierAddress,
      ZKReportVerifier: zkReportVerifierAddress,
      EvidenceRegistry: evidenceRegistryAddress,
      SOSLog: sosLogAddress,
      GuardianRegistry: guardianRegistryAddress,
      ComplaintEscrow: complaintEscrowAddress,
      AccessGrant: accessGrantAddress,
      SheRakshaPaymaster: paymasterAddress,
      EntryPoint: entryPointAddress,
    },
    constants: {
      statutoryEscrowHours: 72,
      statutoryEscrowSeconds: STATUTORY_72_HOURS,
    },
  };

  const sdkDeployDir = path.resolve(__dirname, "../../sdk/src/deployments");
  if (!fs.existsSync(sdkDeployDir)) {
    fs.mkdirSync(sdkDeployDir, { recursive: true });
  }

  const filename = chainId === 80002 ? "amoy.json" : chainId === 137 ? "mainnet.json" : "localhost.json";
  const outputPath = path.join(sdkDeployDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentManifest, null, 2), "utf8");
  console.log(`   ✓ Deployed manifest written to: ${outputPath}`);

  console.log("==================================================================");
  console.log(" Polygon L2 Smart Contracts Successfully Deployed & Configured!");
  console.log("==================================================================");

  return deploymentManifest;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main };
