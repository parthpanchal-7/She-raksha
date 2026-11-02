/**
 * @she-raksha/sdk — SOSLog ABI
 * Typed viem ABI for SOSLog.sol on Polygon L2
 */

export const sosLogAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'notarizeDistress',
    inputs: [
      { name: 'incidentHash', type: 'bytes32' },
      { name: 'rootMerkleTree', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'replayOfflinePacket',
    inputs: [
      { name: 'incidentHash', type: 'bytes32' },
      { name: 'rootMerkleTree', type: 'bytes32' },
      { name: 'deviceTimestamp', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'batchReplayOfflinePackets',
    inputs: [
      {
        name: 'items',
        type: 'tuple[]',
        components: [
          { name: 'incidentHash', type: 'bytes32' },
          { name: 'rootMerkleTree', type: 'bytes32' },
          { name: 'deviceTimestamp', type: 'uint256' },
          { name: 'signature', type: 'bytes' },
        ],
      },
    ],
    outputs: [{ name: 'successCount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAnchor',
    inputs: [{ name: 'incidentHash', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'rootMerkleTree', type: 'bytes32' },
          { name: 'anchorTimestamp', type: 'uint256' },
          { name: 'signatory', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isIncidentNotarized',
    inputs: [{ name: 'incidentHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deviceTimestamps',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
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
    name: 'DistressNotarized',
    inputs: [
      { name: 'incidentHash', type: 'bytes32', indexed: true },
      { name: 'rootMerkleTree', type: 'bytes32', indexed: true },
      { name: 'anchorTimestamp', type: 'uint256', indexed: false },
      { name: 'signatory', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'OfflinePacketReplayed',
    inputs: [
      { name: 'incidentHash', type: 'bytes32', indexed: true },
      { name: 'rootMerkleTree', type: 'bytes32', indexed: true },
      { name: 'deviceTimestamp', type: 'uint256', indexed: false },
      { name: 'replayedTimestamp', type: 'uint256', indexed: false },
      { name: 'signatory', type: 'address', indexed: true },
    ],
  },
] as const;
