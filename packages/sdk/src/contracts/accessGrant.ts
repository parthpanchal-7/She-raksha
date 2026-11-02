/**
 * @she-raksha/sdk — AccessGrant Service
 * Typed viem contract binding for AccessGrant.sol (Evidence Vault Decryption Delegation)
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { accessGrantAbi } from '../abis/accessGrantAbi.js';

export enum GranteeRole {
  LAW_ENFORCEMENT = 0,
  NGO_CASEWORKER = 1,
  JUDICIAL_OFFICER = 2,
  LEGAL_REPRESENTATIVE = 3,
}

export class AccessGrantService {
  public readonly address: Address;
  public readonly abi = accessGrantAbi;
  private readonly client?: PublicClient;

  constructor(address: Address, client?: PublicClient) {
    this.address = address;
    this.client = client;
  }

  public getContractInstance() {
    if (!this.client) {
      throw new Error('PublicClient required to instantiate read contract');
    }
    return getContract({
      address: this.address,
      abi: this.abi,
      client: this.client,
    });
  }

  /**
   * Encodes calldata for granting time-bound decryption access to an accredited grantee.
   */
  public encodeGrantAccess(params: {
    vaultCIDHash: Hex;
    grantee: Address;
    encryptedKeyEnvelope: Hex;
    durationSeconds: bigint;
    role: GranteeRole;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'grantAccess',
      args: [
        params.vaultCIDHash,
        params.grantee,
        params.encryptedKeyEnvelope,
        params.durationSeconds,
        params.role,
      ],
    });
  }

  /**
   * Encodes calldata for granting access directly to a law enforcement officer.
   */
  public encodeGrantLawEnforcement(params: {
    vaultCIDHash: Hex;
    lawEnforcementOfficer: Address;
    encryptedKeyEnvelope: Hex;
    durationSeconds: bigint;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'grantLawEnforcement',
      args: [
        params.vaultCIDHash,
        params.lawEnforcementOfficer,
        params.encryptedKeyEnvelope,
        params.durationSeconds,
      ],
    });
  }

  /**
   * Encodes calldata for granting access directly to an accredited NGO caseworker.
   */
  public encodeGrantNGOCaseworker(params: {
    vaultCIDHash: Hex;
    caseworker: Address;
    encryptedKeyEnvelope: Hex;
    durationSeconds: bigint;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'grantNGOCaseworker',
      args: [
        params.vaultCIDHash,
        params.caseworker,
        params.encryptedKeyEnvelope,
        params.durationSeconds,
      ],
    });
  }

  /**
   * Encodes calldata for revoking access before expiration (DPDP consent withdrawal).
   */
  public encodeRevokeAccess(grantId: Hex): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'revokeAccess',
      args: [grantId],
    });
  }

  /**
   * Checks whether a grant is currently valid (non-expired and non-revoked).
   */
  public async isAccessValid(grantId: Hex): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.isAccessValid([grantId]);
  }

  /**
   * Reads full grant metadata.
   */
  public async getGrant(grantId: Hex) {
    const contract = this.getContractInstance();
    const g = await contract.read.getGrant([grantId]);
    return {
      vaultCIDHash: g.vaultCIDHash,
      grantor: g.grantor,
      grantee: g.grantee,
      encryptedKeyEnvelope: g.encryptedKeyEnvelope,
      validUntil: g.validUntil,
      role: g.role,
      isRevoked: g.isRevoked,
      grantedAt: g.grantedAt,
    };
  }
}

