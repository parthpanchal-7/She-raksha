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

  const gasOverrides = chainId === 80002 ? {
    maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
    maxFeePerGas: ethers.parseUnits("70", "gwei"),
  } : {};

  const existingAmoy: Record<string, string> = chainId === 80002 ? {
    Groth16Verifier: "0x32ddEC9C7b9d358fAD448E2476e7787ECC8D4F1c",
    ZKReportVerifier: "0xaB736738d23b8194140E05e696fC77F305551b9e",
    EvidenceRegistry: "0x9a48db98B9a1F70E2C4FAa027025443b3DbA7a29",
    SOSLog: "0xB138844B71C272c5D354e040C64e97427E7b33A1",
    GuardianRegistry: "0xfe0e18e37F7219A15E42014E3c3395e0aFBC5413",
    ComplaintEscrow: "0xC1abbA2c778d2B540a87f2fccA667783CFe7c9Fb",
    AccessGrant: "0xdF9D3C13Def66E5e6A01ba72e187b56A8A9016AA",
  } : {};

  // 1. Deploy Groth16Verifier
  console.log("1. Deploying Groth16Verifier...");
  let groth16VerifierAddress = existingAmoy["Groth16Verifier"];
  if (!groth16VerifierAddress) {
    const Groth16VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    const groth16Verifier = await Groth16VerifierFactory.deploy(gasOverrides);
    await groth16Verifier.waitForDeployment();
    groth16VerifierAddress = await groth16Verifier.getAddress();
  }
  console.log(`   ✓ Groth16Verifier at: ${groth16VerifierAddress}`);

  // 2. Deploy ZKReportVerifier (linked to Groth16Verifier)
  console.log("2. Deploying ZKReportVerifier...");
  let zkReportVerifierAddress = existingAmoy["ZKReportVerifier"];
  if (!zkReportVerifierAddress) {
    const ZKReportVerifierFactory = await ethers.getContractFactory("ZKReportVerifier");
    const zkReportVerifier = await ZKReportVerifierFactory.deploy(deployer.address, groth16VerifierAddress, gasOverrides);
    await zkReportVerifier.waitForDeployment();
    zkReportVerifierAddress = await zkReportVerifier.getAddress();
  }
  console.log(`   ✓ ZKReportVerifier at: ${zkReportVerifierAddress}`);

  // 3. Deploy EvidenceRegistry
  console.log("3. Deploying EvidenceRegistry...");
  let evidenceRegistryAddress = existingAmoy["EvidenceRegistry"];
  if (!evidenceRegistryAddress) {
    const EvidenceRegistryFactory = await ethers.getContractFactory("EvidenceRegistry");
    const evidenceRegistry = await EvidenceRegistryFactory.deploy(deployer.address, gasOverrides);
    await evidenceRegistry.waitForDeployment();
    evidenceRegistryAddress = await evidenceRegistry.getAddress();
  }
  console.log(`   ✓ EvidenceRegistry at: ${evidenceRegistryAddress}`);

  // 4. Deploy SOSLog
  console.log("4. Deploying SOSLog...");
  let sosLogAddress = existingAmoy["SOSLog"];
  if (!sosLogAddress) {
    const SOSLogFactory = await ethers.getContractFactory("SOSLog");
    const sosLog = await SOSLogFactory.deploy(deployer.address, gasOverrides);
    await sosLog.waitForDeployment();
    sosLogAddress = await sosLog.getAddress();
  }
  console.log(`   ✓ SOSLog at: ${sosLogAddress}`);

  // 5. Deploy GuardianRegistry
  console.log("5. Deploying GuardianRegistry...");
  let guardianRegistryAddress = existingAmoy["GuardianRegistry"];
  if (!guardianRegistryAddress) {
    const minStakeWei = ethers.parseEther("0.01"); // 0.01 POL min stake
    const GuardianRegistryFactory = await ethers.getContractFactory("GuardianRegistry");
    const guardianRegistry = await GuardianRegistryFactory.deploy(deployer.address, minStakeWei, gasOverrides);
    await guardianRegistry.waitForDeployment();
    guardianRegistryAddress = await guardianRegistry.getAddress();
  }
  console.log(`   ✓ GuardianRegistry at: ${guardianRegistryAddress}`);

  // 6. Deploy ComplaintEscrow (BNSS §173 72-Hour Statutory Constant)
  console.log("6. Deploying ComplaintEscrow...");
  let complaintEscrowAddress = existingAmoy["ComplaintEscrow"];
  if (!complaintEscrowAddress) {
    const ComplaintEscrowFactory = await ethers.getContractFactory("ComplaintEscrow");
    const complaintEscrow = await ComplaintEscrowFactory.deploy(deployer.address, gasOverrides);
    await complaintEscrow.waitForDeployment();
    complaintEscrowAddress = await complaintEscrow.getAddress();
  }
  console.log(`   ✓ ComplaintEscrow at: ${complaintEscrowAddress}`);

  // 7. Deploy AccessGrant
  console.log("7. Deploying AccessGrant...");
  let accessGrantAddress = existingAmoy["AccessGrant"];
  if (!accessGrantAddress) {
    const AccessGrantFactory = await ethers.getContractFactory("AccessGrant");
    const accessGrant = await AccessGrantFactory.deploy(deployer.address, gasOverrides);
    await accessGrant.waitForDeployment();
    accessGrantAddress = await accessGrant.getAddress();
  }
  console.log(`   ✓ AccessGrant at: ${accessGrantAddress}`);

  // 8. Deploy SheRakshaPaymaster
  console.log("8. Deploying SheRakshaPaymaster...");
  const verifyingSigner = process.env.PAYMASTER_VERIFYING_SIGNER || deployer.address;
  const entryPointAddress = chainId === 31337
    ? ethers.ZeroAddress // Standalone mock mode for local testing
    : (process.env.ERC4337_ENTRYPOINT_ADDRESS || CANONICAL_ENTRYPOINT_V07);

  const SheRakshaPaymasterFactory = await ethers.getContractFactory("SheRakshaPaymaster");
  const paymaster = await SheRakshaPaymasterFactory.deploy(deployer.address, entryPointAddress, verifyingSigner, gasOverrides);
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
    accessGrantAddress,
    gasOverrides
  );
  await txBatch.wait();

  const txGuardian = await paymaster.setWhitelistedTarget(guardianRegistryAddress, true, gasOverrides);
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
