/**
 * @she-raksha/sdk — EvidenceRegistry ABI
 * Typed viem ABI for EvidenceRegistry.sol on Polygon L2
 */

export const evidenceRegistryAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'anchorEvidence',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'chunkId', type: 'bytes32' },
      { name: 'chunkHash', type: 'bytes32' },
      { name: 'ipfsCID', type: 'string' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'anchorEvidence',
    inputs: [
      { name: 'sessionRootDigest', type: 'bytes32' },
      { name: 'ipfsCID', type: 'string' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'anchorSessionMerkleRoot',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'chunkCount', type: 'uint256' },
      { name: 'ipfsCID', type: 'string' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyDigest',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'chunkHash', type: 'bytes32' },
    ],
    outputs: [
      { name: 'isAnchored', type: 'bool' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'ipfsCID', type: 'string' },
      { name: 'observer', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRecord',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'chunkId', type: 'bytes32' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'chunkHash', type: 'bytes32' },
          { name: 'ipfsCID', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'observer', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSessionMerkleRecord',
    inputs: [{ name: 'sessionId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'merkleRoot', type: 'bytes32' },
          { name: 'chunkCount', type: 'uint256' },
          { name: 'ipfsCID', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'observer', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'sessionRoot',
    inputs: [
      { name: '', type: 'bytes32' },
      { name: '', type: 'bytes32' },
    ],
    outputs: [
      { name: 'chunkHash', type: 'bytes32' },
      { name: 'ipfsCID', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'observer', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isChunkHashAnchored',
    inputs: [
      { name: '', type: 'bytes32' },
      { name: '', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'EvidenceAnchored',
    inputs: [
      { name: 'sessionId', type: 'bytes32', indexed: true },
      { name: 'chunkId', type: 'bytes32', indexed: true },
      { name: 'chunkHash', type: 'bytes32', indexed: true },
      { name: 'ipfsCID', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'observer', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SessionMerkleRootAnchored',
    inputs: [
      { name: 'sessionId', type: 'bytes32', indexed: true },
      { name: 'merkleRoot', type: 'bytes32', indexed: true },
      { name: 'chunkCount', type: 'uint256', indexed: false },
      { name: 'ipfsCID', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'observer', type: 'address', indexed: false },
    ],
  },
] as const;
