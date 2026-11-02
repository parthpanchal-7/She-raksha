/**
 * @she-raksha/sdk — ComplaintEscrow Service
 * Typed viem contract binding for ComplaintEscrow.sol (BNSS §173 statutory escrow)
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { complaintEscrowAbi } from '../abis/complaintEscrowAbi.js';

export class ComplaintEscrowService {
  public readonly address: Address;
  public readonly abi = complaintEscrowAbi;
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
   * Encodes calldata for initializing a 72-hour BNSS §173 statutory escrow.
   */
  public encodeInitEscrow(params: {
    complaintId: bigint;
    incidentId: bigint;
    efirHash: Hex;
    victim: Address;
  }): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'initEscrow',
      args: [params.complaintId, params.incidentId, params.efirHash, params.victim],
    });
  }

  /**
   * Encodes calldata for digitally signing the e-FIR within the 72-hour window.
   */
  public encodeSignComplaint(complaintId: bigint, signature: Hex): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'signComplaint',
      args: [complaintId, signature],
    });
  }

  /**
   * Encodes calldata for police SHO acknowledgement of the e-FIR.
   */
  public encodeAcknowledgeComplaint(complaintId: bigint, officerBadgeHash: Hex): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'acknowledgeComplaint',
      args: [complaintId, officerBadgeHash],
    });
  }

  /**
   * Encodes calldata for triggering §173(4) SP escalation upon 72-hour expiry.
   */
  public encodeTrigger72HrEscalation(complaintId: bigint): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'trigger72HrEscalation',
      args: [complaintId],
    });
  }

  /**
   * Reads the current state of a statutory complaint escrow.
   */
  public async getEscrowState(complaintId: bigint) {
    const contract = this.getContractInstance();
    const state = await contract.read.getEscrowState([complaintId]);
    return {
      incidentId: state.incidentId,
      signDeadline: state.signDeadline,
      isEscalated: state.isEscalated,
      isSigned: state.isSigned,
    };
  }

  /**
   * Checks whether the 48-hour NGO early warning threshold has been breached.
   */
  public async checkEarlyWarning48Hr(complaintId: bigint): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.checkEarlyWarning48Hr([complaintId]);
  }

  /**
   * Checks whether the statutory 72-hour signing deadline has expired.
   */
  public async isEscrowExpired(complaintId: bigint): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.isEscrowExpired([complaintId]);
  }

  /**
   * Returns seconds remaining in the 72-hour signing window (0 if expired).
   */
  public async timeRemainingToSign(complaintId: bigint): Promise<bigint> {
    const contract = this.getContractInstance();
    return contract.read.timeRemainingToSign([complaintId]);
  }
}

