/**
 * @she-raksha/sdk — AccessGrant ABI
 * Typed viem ABI for AccessGrant.sol on Polygon L2
 */

export const accessGrantAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'MAX_GRANT_DURATION_SECONDS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'grantAccess',
    inputs: [
      { name: 'vaultCIDHash', type: 'bytes32' },
      { name: 'grantee', type: 'address' },
      { name: 'encryptedKeyEnvelope', type: 'bytes' },
      { name: 'durationSeconds', type: 'uint256' },
      { name: 'role', type: 'uint8' },
    ],
    outputs: [{ name: 'grantId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'grantLawEnforcement',
    inputs: [
      { name: 'vaultCIDHash', type: 'bytes32' },
      { name: 'lawEnforcementOfficer', type: 'address' },
      { name: 'encryptedKeyEnvelope', type: 'bytes' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'grantId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'grantNGOCaseworker',
    inputs: [
      { name: 'vaultCIDHash', type: 'bytes32' },
      { name: 'caseworker', type: 'address' },
      { name: 'encryptedKeyEnvelope', type: 'bytes' },
      { name: 'durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'grantId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeAccess',
    inputs: [{ name: 'grantId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isAccessValid',
    inputs: [{ name: 'grantId', type: 'bytes32' }],
    outputs: [{ name: 'isValid', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getGrant',
    inputs: [{ name: 'grantId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'vaultCIDHash', type: 'bytes32' },
          { name: 'grantor', type: 'address' },
          { name: 'grantee', type: 'address' },
          { name: 'encryptedKeyEnvelope', type: 'bytes' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'role', type: 'uint8' },
          { name: 'isRevoked', type: 'bool' },
          { name: 'grantedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalGrantsCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AccessGranted',
    inputs: [
      { name: 'grantId', type: 'bytes32', indexed: true },
      { name: 'vaultCIDHash', type: 'bytes32', indexed: true },
      { name: 'grantor', type: 'address', indexed: true },
      { name: 'grantee', type: 'address', indexed: false },
      { name: 'role', type: 'uint8', indexed: false },
      { name: 'validUntil', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AccessRevoked',
    inputs: [
      { name: 'grantId', type: 'bytes32', indexed: true },
      { name: 'revoker', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
