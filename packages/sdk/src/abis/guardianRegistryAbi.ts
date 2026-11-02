/**
 * @she-raksha/sdk — GuardianRegistry ABI
 * Typed viem ABI for GuardianRegistry.sol on Polygon L2
 */

export const guardianRegistryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', type: 'address' },
      { name: '_minStake', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'registerGuardian',
    inputs: [
      { name: 'geohashCommitment', type: 'bytes32' },
      { name: 'publicKey', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'updateGeohashCommitment',
    inputs: [{ name: 'newCommitment', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deregisterGuardian',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'slashGuardian',
    inputs: [
      { name: 'guardian', type: 'address' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getGuardian',
    inputs: [{ name: 'guardianAddress', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'geohashCommitment', type: 'bytes32' },
          { name: 'publicKey', type: 'bytes' },
          { name: 'stakeAmount', type: 'uint256' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'lastHeartbeat', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isGuardianActive',
    inputs: [{ name: 'guardianAddress', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minStake',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'activeGuardianCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'slashedPool',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'GuardianRegistered',
    inputs: [
      { name: 'guardian', type: 'address', indexed: true },
      { name: 'geohashCommitment', type: 'bytes32', indexed: true },
      { name: 'stakeAmount', type: 'uint256', indexed: false },
      { name: 'publicKey', type: 'bytes', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GuardianCommitmentUpdated',
    inputs: [
      { name: 'guardian', type: 'address', indexed: true },
      { name: 'newGeohashCommitment', type: 'bytes32', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GuardianDeregistered',
    inputs: [
      { name: 'guardian', type: 'address', indexed: true },
      { name: 'refundAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GuardianSlashed',
    inputs: [
      { name: 'guardian', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
] as const;

