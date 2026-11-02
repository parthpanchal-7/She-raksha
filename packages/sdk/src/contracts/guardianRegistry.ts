/**
 * @she-raksha/sdk — GuardianRegistry Service
 * Typed viem contract binding for GuardianRegistry.sol
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { guardianRegistryAbi } from '../abis/guardianRegistryAbi.js';

export class GuardianRegistryService {
  public readonly address: Address;
  public readonly abi = guardianRegistryAbi;
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
   * Encodes calldata for guardian registration with geohash commitment and public key.
   */
  public encodeRegisterGuardian(geohashCommitment: Hex, publicKey: Hex): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'registerGuardian',
      args: [geohashCommitment, publicKey],
    });
  }

  /**
   * Encodes calldata for updating ephemeral geohash commitment (heartbeat renewal).
   */
  public encodeUpdateGeohashCommitment(newCommitment: Hex): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'updateGeohashCommitment',
      args: [newCommitment],
    });
  }

  /**
   * Encodes calldata for guardian deregistration.
   */
  public encodeDeregisterGuardian(): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'deregisterGuardian',
      args: [],
    });
  }

  /**
   * Reads guardian profile details.
   */
  public async getGuardian(guardianAddress: Address) {
    const contract = this.getContractInstance();
    const g = await contract.read.getGuardian([guardianAddress]);
    return {
      geohashCommitment: g.geohashCommitment,
      publicKey: g.publicKey,
      stakeAmount: g.stakeAmount,
      registeredAt: g.registeredAt,
      lastHeartbeat: g.lastHeartbeat,
      status: g.status,
    };
  }

  /**
   * Checks whether a guardian is active on standby.
   */
  public async isGuardianActive(guardianAddress: Address): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.isGuardianActive([guardianAddress]);
  }

  /**
   * Reads total count of active guardians.
   */
  public async getActiveGuardianCount(): Promise<bigint> {
    const contract = this.getContractInstance();
    return contract.read.activeGuardianCount();
  }
}

