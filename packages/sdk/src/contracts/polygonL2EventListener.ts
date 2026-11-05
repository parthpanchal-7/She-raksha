/**
 * @she-raksha/sdk — Polygon L2 Smart Contract Real-Time Event Listener
 *
 * Implements direct Alchemy/Infura WSS blockchain synchronization:
 *  - Subscribes to ZKReportVerifier.sol: AnonymousReportLogged
 *  - Subscribes to ComplaintEscrow.sol: EscrowEscalated
 *  - Real-time event propagation to Institutional Command Dashboards & NGO Escalation queues
 *  - Zero traditional database polling required
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  createPublicClient,
  webSocket,
  http,
  fallback,
} from 'viem';
import { polygonAmoy } from 'viem/chains';
import { zkReportVerifierAbi } from '../abis/zkReportVerifierAbi.js';
import { complaintEscrowAbi } from '../abis/complaintEscrowAbi.js';
import { POLYGON_AMOY_CONFIG } from '../config/index.js';

export interface AnonymousReportEventPayload {
  nullifier: Hex;
  geohashBucket: Hex;
  timestampBucket: bigint;
  txHash?: Hex;
  blockNumber?: bigint;
}

export interface EscrowEscalatedEventPayload {
  complaintId: bigint;
  timestamp: bigint;
  txHash?: Hex;
  blockNumber?: bigint;
}

export type AnonymousReportCallback = (event: AnonymousReportEventPayload) => void | Promise<void>;
export type EscrowEscalatedCallback = (event: EscrowEscalatedEventPayload) => void | Promise<void>;

export interface PolygonL2EventListenerOptions {
  client?: PublicClient;
  rpcWssUrl?: string;
  rpcHttpUrl?: string;
  zkReportVerifierAddress?: Address;
  complaintEscrowAddress?: Address;
}

export class PolygonL2EventListener {
  private client: PublicClient;
  private zkReportVerifierAddress: Address;
  private complaintEscrowAddress: Address;

  private anonymousReportCallbacks: Set<AnonymousReportCallback> = new Set();
  private escrowEscalatedCallbacks: Set<EscrowEscalatedCallback> = new Set();

  private zkReportUnwatch?: () => void;
  private escrowUnwatch?: () => void;
  private isListening: boolean = false;

  constructor(options: PolygonL2EventListenerOptions = {}) {
    this.zkReportVerifierAddress =
      options.zkReportVerifierAddress || POLYGON_AMOY_CONFIG.contracts.zkReportVerifier;
    this.complaintEscrowAddress =
      options.complaintEscrowAddress || POLYGON_AMOY_CONFIG.contracts.complaintEscrow;

    if (options.client) {
      this.client = options.client;
    } else {
      const wssUrl =
        options.rpcWssUrl ||
        process.env['POLYGON_AMOY_WSS_URL'] ||
        (process.env['ALCHEMY_API_KEY']
          ? `wss://polygon-amoy.g.alchemy.com/v2/${process.env['ALCHEMY_API_KEY']}`
          : undefined);

      const httpUrl =
        options.rpcHttpUrl ||
        process.env['POLYGON_AMOY_RPC_URL'] ||
        POLYGON_AMOY_CONFIG.rpcUrl;

      const transports = [];
      if (wssUrl && typeof WebSocket !== 'undefined') {
        transports.push(webSocket(wssUrl));
      }
      transports.push(http(httpUrl));

      this.client = createPublicClient({
        chain: polygonAmoy,
        transport: fallback(transports),
      }) as PublicClient;
    }
  }

  /**
   * Registers a callback for ZKReportVerifier.sol: AnonymousReportLogged
   */
  public onAnonymousReportLogged(callback: AnonymousReportCallback): () => void {
    this.anonymousReportCallbacks.add(callback);
    return () => this.anonymousReportCallbacks.delete(callback);
  }

  /**
   * Registers a callback for ComplaintEscrow.sol: EscrowEscalated
   */
  public onEscrowEscalated(callback: EscrowEscalatedCallback): () => void {
    this.escrowEscalatedCallbacks.add(callback);
    return () => this.escrowEscalatedCallbacks.delete(callback);
  }

  /**
   * Starts listening to on-chain Polygon L2 smart contract events.
   */
  public async startListening(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    try {
      // 1. Watch ZKReportVerifier.sol: AnonymousReportLogged
      if (this.zkReportVerifierAddress && this.client.watchContractEvent) {
        this.zkReportUnwatch = this.client.watchContractEvent({
          address: this.zkReportVerifierAddress,
          abi: zkReportVerifierAbi,
          eventName: 'AnonymousReportLogged',
          onLogs: (logs) => {
            for (const log of logs) {
              const args = (log as any).args;
              if (args) {
                const payload: AnonymousReportEventPayload = {
                  nullifier: args.nullifier,
                  geohashBucket: args.geohashBucket,
                  timestampBucket: BigInt(args.timestampBucket || 0),
                  txHash: log.transactionHash,
                  blockNumber: log.blockNumber,
                };
                this.dispatchAnonymousReport(payload);
              }
            }
          },
        });
      }

      // 2. Watch ComplaintEscrow.sol: EscrowEscalated
      if (this.complaintEscrowAddress && this.client.watchContractEvent) {
        this.escrowUnwatch = this.client.watchContractEvent({
          address: this.complaintEscrowAddress,
          abi: complaintEscrowAbi,
          eventName: 'EscrowEscalated',
          onLogs: (logs) => {
            for (const log of logs) {
              const args = (log as any).args;
              if (args) {
                const payload: EscrowEscalatedEventPayload = {
                  complaintId: BigInt(args.complaintId || 0),
                  timestamp: BigInt(args.timestamp || 0),
                  txHash: log.transactionHash,
                  blockNumber: log.blockNumber,
                };
                this.dispatchEscrowEscalated(payload);
              }
            }
          },
        });
      }
    } catch {
      // Fallback in environments without live WSS connection
    }
  }

  /**
   * Simulates/dispatches an AnonymousReportLogged event (used in tests or hybrid socket relays).
   */
  public dispatchAnonymousReport(payload: AnonymousReportEventPayload): void {
    for (const cb of this.anonymousReportCallbacks) {
      try {
        const res = cb(payload);
        if (res instanceof Promise) res.catch(() => {});
      } catch {
        /* Ignore listener exceptions */
      }
    }
  }

  /**
   * Simulates/dispatches an EscrowEscalated event (used in tests or hybrid socket relays).
   */
  public dispatchEscrowEscalated(payload: EscrowEscalatedEventPayload): void {
    for (const cb of this.escrowEscalatedCallbacks) {
      try {
        const res = cb(payload);
        if (res instanceof Promise) res.catch(() => {});
      } catch {
        /* Ignore listener exceptions */
      }
    }
  }

  /**
   * Stops listening and cleans up event subscriptions.
   */
  public stopListening(): void {
    if (this.zkReportUnwatch) {
      this.zkReportUnwatch();
      this.zkReportUnwatch = undefined;
    }
    if (this.escrowUnwatch) {
      this.escrowUnwatch();
      this.escrowUnwatch = undefined;
    }
    this.isListening = false;
  }
}
