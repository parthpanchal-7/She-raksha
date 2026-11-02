/**
 * @she-raksha/sdk — ZKReportVerifier Service
 * Typed viem contract binding for ZKReportVerifier.sol
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  getContract,
  encodeFunctionData,
} from 'viem';
import { zkReportVerifierAbi } from '../abis/zkReportVerifierAbi.js';

export interface Groth16ProofTuple {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
}

export class ZKReportVerifierService {
  public readonly address: Address;
  public readonly abi = zkReportVerifierAbi;
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
   * Encodes calldata for submitting a 4-input Groth16 anonymous bystander report.
   * Public inputs: [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour]
   */
  public encodeSubmitAnonymousReport4(
    proof: Groth16ProofTuple,
    publicInputs: [bigint, bigint, bigint, bigint]
  ): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'submitAnonymousReport',
      args: [proof.a, proof.b, proof.c, publicInputs],
    });
  }

  /**
   * Encodes calldata for submitting a 6-input Groth16 anonymous bystander report.
   * Public inputs: [nullifierHash, geohashBucket, categoryCode, epochHour, identityRoot, nullifierSalt]
   */
  public encodeSubmitAnonymousReport6(
    proof: Groth16ProofTuple,
    publicInputs: [bigint, bigint, bigint, bigint, bigint, bigint]
  ): Hex {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'submitAnonymousReport',
      args: [proof.a, proof.b, proof.c, publicInputs],
    });
  }

  /**
   * Checks whether a Poseidon nullifier has already been spent on Polygon L2.
   */
  public async isNullifierSpent(nullifier: Hex): Promise<boolean> {
    const contract = this.getContractInstance();
    return contract.read.isNullifierSpent([nullifier]);
  }

  /**
   * Reads total count of anonymous bystander reports logged.
   */
  public async getTotalReportsLogged(): Promise<bigint> {
    const contract = this.getContractInstance();
    return contract.read.totalReportsLogged();
  }
}

