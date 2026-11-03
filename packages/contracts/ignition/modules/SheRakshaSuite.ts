import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CANONICAL_ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

export default buildModule("SheRakshaSuite", (m) => {
  const initialOwner = m.getAccount(0);

  // Module parameters with sensible defaults
  const entryPointAddress = m.getParameter("entryPoint", CANONICAL_ENTRYPOINT_V07);
  const verifyingSigner = m.getParameter("verifyingSigner", initialOwner);
  const minStake = m.getParameter("minStake", 10000000000000000n); // 0.01 POL

  // 1. Deploy Groth16 Pairing Verifier
  const groth16Verifier = m.contract("Groth16Verifier", []);

  // 2. Deploy ZKReportVerifier (linked to Groth16Verifier)
  const zkReportVerifier = m.contract("ZKReportVerifier", [
    initialOwner,
    groth16Verifier,
  ]);

  // 3. Deploy EvidenceRegistry
  const evidenceRegistry = m.contract("EvidenceRegistry", [initialOwner]);

  // 4. Deploy SOSLog
  const sosLog = m.contract("SOSLog", [initialOwner]);

  // 5. Deploy GuardianRegistry
  const guardianRegistry = m.contract("GuardianRegistry", [
    initialOwner,
    minStake,
  ]);

  // 6. Deploy ComplaintEscrow (BNSS §173 72-Hour Statutory Escrow)
  const complaintEscrow = m.contract("ComplaintEscrow", [initialOwner]);

  // 7. Deploy AccessGrant (Cryptographic Key Delegation & Revocation)
  const accessGrant = m.contract("AccessGrant", [initialOwner]);

  // 8. Deploy SheRakshaPaymaster (ERC-4337 Gas Sponsorship)
  const paymaster = m.contract("SheRakshaPaymaster", [
    initialOwner,
    entryPointAddress,
    verifyingSigner,
  ]);

  // 9. Whitelist Core Contracts on the Paymaster
  const batchWhitelist = m.call(paymaster, "batchWhitelistTargets", [
    evidenceRegistry,
    sosLog,
    complaintEscrow,
    zkReportVerifier,
    accessGrant,
  ]);

  m.call(paymaster, "setWhitelistedTarget", [guardianRegistry, true], {
    after: [batchWhitelist],
  });

  return {
    groth16Verifier,
    zkReportVerifier,
    evidenceRegistry,
    sosLog,
    guardianRegistry,
    complaintEscrow,
    accessGrant,
    paymaster,
  };
});
