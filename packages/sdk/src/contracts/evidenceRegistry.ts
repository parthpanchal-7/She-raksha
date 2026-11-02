/**
 * @she-raksha/sdk — EvidenceRegistry Service
 * Typed viem contract binding for EvidenceRegistry.sol
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { evidenceRegistryAbi } from '../abis/evidenceRegistryAbi.js';

export class EvidenceRegistryService {
  public readonly address: Address;
  public readonly abi = evidenceRegistryAbi;
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
   * Encodes calldata for anchoring a 5-second encrypted evidence chunk.
   */
  public encodeAnchorEvidence(params: {
    sessionId: Hex;
    chunkId: Hex;
    chunkHash: Hex;
    ipfsCID: string;
    signature?: Hex;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'anchorEvidence',
      args: [
        params.sessionId,
        params.chunkId,
        params.chunkHash,
        params.ipfsCID,
        params.signature || '0x',
      ],
    });
  }

  /**
   * Encodes calldata for batch anchoring a session Merkle root (up to 1,000 chunks).
   */
  public encodeAnchorSessionMerkleRoot(params: {
    sessionId: Hex;
    merkleRoot: Hex;
    chunkCount: bigint;
    ipfsCID: string;
    signature?: Hex;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'anchorSessionMerkleRoot',
      args: [
        params.sessionId,
        params.merkleRoot,
        params.chunkCount,
        params.ipfsCID,
        params.signature || '0x',
      ],
    });
  }

  /**
   * Verifies an anchored chunk digest directly on-chain under BSA §63.
   */
  public async verifyDigest(sessionId: Hex, chunkHash: Hex) {
    const contract = this.getContractInstance();
    const result = await contract.read.verifyDigest([sessionId, chunkHash]);
    return {
      isAnchored: result[0],
      timestamp: result[1],
      ipfsCID: result[2],
      observer: result[3],
    };
  }

  /**
   * Retrieves an individual anchored chunk record.
   */
  public async getRecord(sessionId: Hex, chunkId: Hex) {
    const contract = this.getContractInstance();
    return contract.read.getRecord([sessionId, chunkId]);
  }

  /**
   * Retrieves an anchored session Merkle record.
   */
  public async getSessionMerkleRecord(sessionId: Hex) {
    const contract = this.getContractInstance();
    return contract.read.getSessionMerkleRecord([sessionId]);
  }
}

