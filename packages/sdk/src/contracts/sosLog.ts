/**
 * @she-raksha/sdk — SOSLog Service
 * Typed viem contract binding for SOSLog.sol
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { sosLogAbi } from '../abis/sosLogAbi.js';

export interface OfflineQueueItemRpc {
  incidentHash: Hex;
  rootMerkleTree: Hex;
  deviceTimestamp: bigint;
  signature: Hex;
}

export class SOSLogService {
  public readonly address: Address;
  public readonly abi = sosLogAbi;
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
   * Encodes calldata for live SOS distress notarization.
   */
  public encodeNotarizeDistress(params: {
    incidentHash: Hex;
    rootMerkleTree: Hex;
    signature?: Hex;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'notarizeDistress',
      args: [params.incidentHash, params.rootMerkleTree, params.signature || '0x'],
    });
  }

  /**
   * Encodes calldata for replaying a single offline packet from SQLCipher queue.
   */
  public encodeReplayOfflinePacket(params: {
    incidentHash: Hex;
    rootMerkleTree: Hex;
    deviceTimestamp: bigint;
    signature?: Hex;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'replayOfflinePacket',
      args: [
        params.incidentHash,
        params.rootMerkleTree,
        params.deviceTimestamp,
        params.signature || '0x',
      ],
    });
  }

  /**
   * Encodes calldata for batch replaying multiple offline packets.
   */
  public encodeBatchReplayOfflinePackets(items: OfflineQueueItemRpc[]): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'batchReplayOfflinePackets',
      args: [items],
    });
  }

  /**
   * Reads block anchor details for an incident.
   */
  public async getAnchor(incidentHash: Hex) {
    const contract = this.getContractInstance();
    const anchor = await contract.read.getAnchor([incidentHash]);
    return {
      rootMerkleTree: anchor.rootMerkleTree,
      anchorTimestamp: anchor.anchorTimestamp,
      signatory: anchor.signatory,
    };
  }

  /**
   * Checks whether an incident has been notarized on Polygon L2.
   */
  public async isIncidentNotarized(incidentHash: Hex): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.isIncidentNotarized([incidentHash]);
  }
}
