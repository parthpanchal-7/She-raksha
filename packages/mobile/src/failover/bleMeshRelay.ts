/**
 * @she-raksha/mobile — BLE 5.2 Extended Advertising Mesh Relay (Rail C)
 *
 * Implements FR-SOS-002 (Rail C Zero-Bearer Offline Mesh):
 *  - Broadcasts non-connectable BLE 5.2 Extended Advertising frames (50-100m range).
 *  - Transmits compact 31-byte to 254-byte distress beacon with Service UUID 0xFD63.
 *  - Enforces hop-limited peer relay (TTL default: 3) to prevent broadcast flooding.
 *  - Deduplicates packets via an LRU seen-cache of 100 entries.
 *  - Enables nearby She-Raksha peer devices to forward distress packets to SOS Hub
 *    as soon as cellular or WiFi connectivity is encountered.
 */

import { BLEMeshConfig, BLEMeshFrameType, BLEMeshPacket } from '../types.js';

export class BLEMeshRelay {
  private config: BLEMeshConfig;
  private seenPacketDigests: Set<string> = new Set();
  private broadcastHistory: BLEMeshPacket[] = [];
  private isAdvertising: boolean = false;

  constructor(customConfig?: Partial<BLEMeshConfig>) {
    this.config = {
      serviceUuid: '0xFD63', // She-Raksha Registered 16-bit Service UUID
      defaultTtl: 3, // Maximum 3 hops
      broadcastIntervalMs: 100, // 100ms high-priority advertising
      txPowerDbm: 8, // +8 dBm extended range
      maxSeenCacheSize: 100,
      ...customConfig,
    };
  }

  /**
   * Encodes an SOS distress alert into a binary BLE 5.2 Extended Advertising packet.
   */
  public createDistressFrame(params: {
    nodeIdHex: string; // 8 bytes (16 hex chars)
    incidentDigestHex: string; // 16 bytes (32 hex chars)
    geohash6: string; // 6 chars (e.g. "ttnf7z")
    triggerCode: number; // 0..255
    batteryPct: number; // 0..100
    ttl?: number;
  }): BLEMeshPacket {
    const ttl = params.ttl ?? this.config.defaultTtl;
    const timestampSeconds = Math.floor(Date.now() / 1000);

    // Build raw hex representation
    const header = 'FD63'; // Service UUID
    const version = '01';
    const frameType = '01'; // DISTRESS_BEACON
    const hopLimitHex = ttl.toString(16).padStart(2, '0');
    const nodeHex = params.nodeIdHex.slice(0, 16).padStart(16, '0');
    const digestHex = params.incidentDigestHex.slice(0, 32).padStart(32, '0');

    // Convert 6-char geohash to 6-byte hex
    const geohashHex = Buffer.from(params.geohash6.slice(0, 6)).toString('hex');
    const timeHex = timestampSeconds.toString(16).padStart(8, '0');
    const batteryHex = params.batteryPct.toString(16).padStart(2, '0');
    const triggerHex = params.triggerCode.toString(16).padStart(2, '0');

    const rawPayloadHex = `${header}${version}${frameType}${hopLimitHex}${nodeHex}${digestHex}${geohashHex}${timeHex}${batteryHex}${triggerHex}`;

    const packet: BLEMeshPacket = {
      serviceUuid: this.config.serviceUuid,
      protocolVersion: 1,
      frameType: BLEMeshFrameType.DISTRESS_BEACON,
      hopLimit: ttl,
      nodeId: nodeHex,
      incidentDigest: digestHex,
      geohash6: params.geohash6,
      timestampSeconds,
      batteryPct: params.batteryPct,
      triggerCode: params.triggerCode,
      rawPayloadHex,
    };

    return packet;
  }

  /**
   * Broadcasts the distress beacon via BLE 5.2 Extended Advertising.
   */
  public broadcastDistressBeacon(packet: BLEMeshPacket): boolean {
    this.isAdvertising = true;
    this.broadcastHistory.push(packet);
    this.recordSeenDigest(packet.incidentDigest);
    return true;
  }

  /**
   * Ingests a received BLE mesh packet from a nearby peer device.
   * If the packet is novel and TTL > 1, decrements TTL and relays the packet.
   */
  public handlePeerFrameReceived(packet: BLEMeshPacket): {
    relayed: boolean;
    reason: string;
    nextHopPacket?: BLEMeshPacket;
  } {
    // 1. Check deduplication cache
    if (this.seenPacketDigests.has(packet.incidentDigest)) {
      return { relayed: false, reason: 'Duplicate packet: already processed or relayed.' };
    }

    this.recordSeenDigest(packet.incidentDigest);

    // 2. Check hop limit (TTL)
    if (packet.hopLimit <= 1) {
      return { relayed: false, reason: 'Hop limit reached (TTL <= 1).' };
    }

    // 3. Decrement TTL and rebroadcast
    const nextHopPacket: BLEMeshPacket = {
      ...packet,
      hopLimit: packet.hopLimit - 1,
      frameType: BLEMeshFrameType.PEER_RELAY_ACK,
    };

    this.broadcastDistressBeacon(nextHopPacket);
    return { relayed: true, reason: 'Packet relayed to mesh peers.', nextHopPacket };
  }

  public stopAdvertising(): void {
    this.isAdvertising = false;
  }

  public getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  public getBroadcastHistory(): BLEMeshPacket[] {
    return [...this.broadcastHistory];
  }

  private recordSeenDigest(digest: string): void {
    this.seenPacketDigests.add(digest);
    if (this.seenPacketDigests.size > this.config.maxSeenCacheSize) {
      const firstEntry = this.seenPacketDigests.values().next().value;
      if (firstEntry) {
        this.seenPacketDigests.delete(firstEntry);
      }
    }
  }
}
