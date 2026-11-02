/**
 * @she-raksha/sdk — UserOperation Builder
 *
 * Constructs and formats ERC-4337 UserOperation structs conforming to
 * SheRakshaPaymaster.sol and IEntryPoint.sol specifications.
 */

import {
  type Address,
  type Hex,
  keccak256,
  encodeAbiParameters,
  encodePacked,
  concat,
  toHex,
  pad,
} from 'viem';
import {
  type UserOperation,
  type PaymasterSponsorshipResult,
} from './types.js';

export class UserOpBuilder {
  private sender: Address;
  private nonce: bigint;
  private entryPointAddress: Address;
  private chainId: number;
  private paymasterAddress?: Address;

  constructor(options: {
    sender: Address;
    entryPointAddress: Address;
    chainId: number;
    paymasterAddress?: Address;
    nonce?: bigint;
  }) {
    this.sender = options.sender;
    this.entryPointAddress = options.entryPointAddress;
    this.chainId = options.chainId;
    this.paymasterAddress = options.paymasterAddress;
    this.nonce = options.nonce ?? 0n;
  }

  public setNonce(nonce: bigint): void {
    this.nonce = nonce;
  }

  public getNonce(): bigint {
    return this.nonce;
  }

  /**
   * Builds an unsigned UserOperation for target execution.
   */
  public buildUserOp(params: {
    target: Address;
    callData: Hex;
    value?: bigint;
    paymasterAndData?: Hex;
  }): UserOperation {
    // She-Raksha Smart Account execute(target, value, data) calldata encoding
    const executeCallData = encodePacked(
      ['bytes4', 'address', 'uint256', 'bytes'],
      [
        '0xb61d27f6', // execute(address,uint256,bytes) function selector
        params.target,
        params.value ?? 0n,
        params.callData,
      ]
    );

    return {
      sender: this.sender,
      nonce: this.nonce,
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: 250000n,
      verificationGasLimit: 150000n,
      preVerificationGas: 50000n,
      maxFeePerGas: 30000000000n, // 30 gwei
      maxPriorityFeePerGas: 2000000000n, // 2 gwei
      paymasterAndData: params.paymasterAndData ?? '0x',
      signature: '0x',
    };
  }

  /**
   * Computes the canonical ERC-4337 UserOperation hash matching EntryPoint.sol:
   * keccak256(abi.encode(keccak256(packUserOp(userOp)), entryPoint, chainId))
   */
  public computeUserOpHash(userOp: UserOperation): Hex {
    // Pack userOp excluding signature
    const packedCore = encodeAbiParameters(
      [
        { name: 'sender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'initCodeHash', type: 'bytes32' },
        { name: 'callDataHash', type: 'bytes32' },
        { name: 'callGasLimit', type: 'uint256' },
        { name: 'verificationGasLimit', type: 'uint256' },
        { name: 'preVerificationGas', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymasterAndDataHash', type: 'bytes32' },
      ],
      [
        userOp.sender,
        userOp.nonce,
        keccak256(userOp.initCode),
        keccak256(userOp.callData),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        keccak256(userOp.paymasterAndData),
      ]
    );

    const userOpHashCore = keccak256(packedCore);

    return keccak256(
      encodeAbiParameters(
        [
          { name: 'userOpHash', type: 'bytes32' },
          { name: 'entryPoint', type: 'address' },
          { name: 'chainId', type: 'uint256' },
        ],
        [userOpHashCore, this.entryPointAddress, BigInt(this.chainId)]
      )
    );
  }

  /**
   * Generates paymasterAndData conforming to SheRakshaPaymaster.sol:
   * paymasterAddress (20 bytes) + validUntil (6 bytes uint48) + validAfter (6 bytes uint48) + signature (65 bytes)
   */
  public static encodePaymasterAndData(params: {
    paymasterAddress: Address;
    validUntil: number;
    validAfter: number;
    signature: Hex;
  }): Hex {
    // uint48 hex string is 12 hex chars (6 bytes)
    const validUntilHex = params.validUntil.toString(16).padStart(12, '0');
    const validAfterHex = params.validAfter.toString(16).padStart(12, '0');

    const cleanSig = params.signature.startsWith('0x')
      ? params.signature.slice(2)
      : params.signature;

    const packed = `${params.paymasterAddress.toLowerCase()}${validUntilHex}${validAfterHex}${cleanSig}`;
    return (packed.startsWith('0x') ? packed : `0x${packed}`) as Hex;
  }
}
