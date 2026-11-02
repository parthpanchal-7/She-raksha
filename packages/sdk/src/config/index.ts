/**
 * @she-raksha/sdk — Configuration & Network Constants
 * Network parameters, default contract addresses, and ERC-4337 EntryPoint addresses.
 */

import { type Address } from 'viem';

export interface SheRakshaNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  entryPointAddress: Address;
  bundlerUrl: string;
  contracts: {
    evidenceRegistry: Address;
    sosLog: Address;
    complaintEscrow: Address;
    zkReportVerifier: Address;
    guardianRegistry: Address;
    accessGrant: Address;
    paymaster: Address;
  };
}

/**
 * Canonical ERC-4337 v0.6 EntryPoint address
 */
export const ENTRY_POINT_V06_ADDRESS: Address = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

/**
 * Minimum storage node replication factor required under NFR-REL-003
 */
export const MIN_REPLICATION_FACTOR = 3;

/**
 * Statutory 72-hour BNSS §173 deadline in seconds (259,200)
 */
export const BNSS_173_DEADLINE_SECONDS = 259200;

/**
 * Optional 48-hour NGO early warning threshold in seconds (172,800)
 */
export const NGO_EARLY_WARNING_SECONDS = 172800;

/**
 * Polygon Amoy Testnet Configuration (Default Devnet)
 */
export const POLYGON_AMOY_CONFIG: SheRakshaNetworkConfig = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: process.env['POLYGON_AMOY_RPC_URL'] || 'https://rpc-amoy.polygon.technology',
  entryPointAddress: ENTRY_POINT_V06_ADDRESS,
  bundlerUrl: process.env['BUNDLER_RPC_URL'] || 'https://api.biconomy.io/api/v2/80002/bundler',
  contracts: {
    evidenceRegistry: (process.env['EVIDENCE_REGISTRY_ADDRESS'] as Address) || '0x1000000000000000000000000000000000000001',
    sosLog: (process.env['SOS_LOG_ADDRESS'] as Address) || '0x2000000000000000000000000000000000000002',
    complaintEscrow: (process.env['COMPLAINT_ESCROW_ADDRESS'] as Address) || '0x3000000000000000000000000000000000000003',
    zkReportVerifier: (process.env['ZK_REPORT_VERIFIER_ADDRESS'] as Address) || '0x4000000000000000000000000000000000000004',
    guardianRegistry: (process.env['GUARDIAN_REGISTRY_ADDRESS'] as Address) || '0x5000000000000000000000000000000000000005',
    accessGrant: (process.env['ACCESS_GRANT_ADDRESS'] as Address) || '0x6000000000000000000000000000000000000006',
    paymaster: (process.env['PAYMASTER_ADDRESS'] as Address) || '0x7000000000000000000000000000000000000007',
  },
};

