/**
 * @she-raksha/sdk — ComplaintEscrow ABI
 * Typed viem ABI for ComplaintEscrow.sol on Polygon L2
 */

export const complaintEscrowAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'STATUTORY_ESCALATION_SECONDS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'NGO_EARLY_WARNING_SECONDS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'initEscrow',
    inputs: [
      { name: 'complaintId', type: 'uint256' },
      { name: 'incidentId', type: 'uint256' },
      { name: 'efirHash', type: 'bytes32' },
      { name: 'victim', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'signComplaint',
    inputs: [
      { name: 'complaintId', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'acknowledgeComplaint',
    inputs: [
      { name: 'complaintId', type: 'uint256' },
      { name: 'officerBadgeHash', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'trigger72HrEscalation',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'checkEarlyWarning48Hr',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [{ name: 'isWarningActive', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEscrowState',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'incidentId', type: 'uint256' },
          { name: 'signDeadline', type: 'uint256' },
          { name: 'isEscalated', type: 'bool' },
          { name: 'isSigned', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEscrowMetadata',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'victim', type: 'address' },
          { name: 'efirHash', type: 'bytes32' },
          { name: 'isAcknowledged', type: 'bool' },
          { name: 'officerBadgeHash', type: 'bytes32' },
          { name: 'signedAt', type: 'uint256' },
          { name: 'acknowledgedAt', type: 'uint256' },
          { name: 'escalatedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isEscrowExpired',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timeRemainingToSign',
    inputs: [{ name: 'complaintId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'authorizePoliceNode',
    inputs: [
      { name: 'nodeAddress', type: 'address' },
      { name: 'status', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'EscrowInitiated',
    inputs: [
      { name: 'complaintId', type: 'uint256', indexed: true },
      { name: 'incidentId', type: 'uint256', indexed: true },
      { name: 'efirHash', type: 'bytes32', indexed: true },
      { name: 'signDeadline', type: 'uint256', indexed: false },
      { name: 'victim', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ComplaintSigned',
    inputs: [
      { name: 'complaintId', type: 'uint256', indexed: true },
      { name: 'signer', type: 'address', indexed: true },
      { name: 'signedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ComplaintAcknowledged',
    inputs: [
      { name: 'complaintId', type: 'uint256', indexed: true },
      { name: 'officerBadgeHash', type: 'bytes32', indexed: true },
      { name: 'acknowledgedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EscalationTriggered',
    inputs: [
      { name: 'complaintId', type: 'uint256', indexed: true },
      { name: 'incidentId', type: 'uint256', indexed: true },
      { name: 'escalatedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EarlyWarning48HrTriggered',
    inputs: [
      { name: 'complaintId', type: 'uint256', indexed: true },
      { name: 'timeRemainingSeconds', type: 'uint256', indexed: false },
    ],
  },
] as const;

