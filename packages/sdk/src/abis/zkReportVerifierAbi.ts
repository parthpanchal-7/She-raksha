/**
 * @she-raksha/sdk — ZKReportVerifier ABI
 * Typed viem ABI for ZKReportVerifier.sol on Polygon L2
 */

export const zkReportVerifierAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', type: 'address' },
      { name: '_groth16Verifier', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitAnonymousReport',
    inputs: [
      { name: 'a', type: 'uint256[2]' },
      { name: 'b', type: 'uint256[2][2]' },
      { name: 'c', type: 'uint256[2]' },
      { name: 'input', type: 'uint256[4]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitAnonymousReport',
    inputs: [
      { name: 'a', type: 'uint256[2]' },
      { name: 'b', type: 'uint256[2][2]' },
      { name: 'c', type: 'uint256[2]' },
      { name: 'input', type: 'uint256[6]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'nullifierHashes',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isNullifierSpent',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalReportsLogged',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'groth16Verifier',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'updateGroth16Verifier',
    inputs: [{ name: 'newVerifier', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'AnonymousReportLogged',
    inputs: [
      { name: 'nullifier', type: 'bytes32', indexed: true },
      { name: 'geohashBucket', type: 'bytes32', indexed: true },
      { name: 'timestampBucket', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Groth16VerifierUpdated',
    inputs: [
      { name: 'oldVerifier', type: 'address', indexed: true },
      { name: 'newVerifier', type: 'address', indexed: true },
    ],
  },
] as const;
