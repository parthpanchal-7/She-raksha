/**
 * @she-raksha/crypto-core — Incremental SHA-256 Merkle Tree Builder
 *
 * Implements deterministic batch anchoring of up to 1,000 5-second media chunk digests
 * into a single 32-byte session root (sessionRoot) for EvidenceRegistry.sol.
 *
 * Conforms to OpenZeppelin / Solidity MerkleProof verification compatibility:
 *   hash(a, b) = sha256(min(a, b) + max(a, b)) or standard binary tree.
 */

import { createHash } from 'node:crypto';

/**
 * Computes the SHA-256 digest of input data as 32-byte Buffer.
 */
export function sha256(data: Buffer | Uint8Array | string): Buffer {
  const hash = createHash('sha256');
  if (typeof data === 'string') {
    if (/^[0-9a-fA-F]{64}$/.test(data)) {
      hash.update(Buffer.from(data, 'hex'));
    } else {
      hash.update(data, 'utf-8');
    }
  } else {
    hash.update(data);
  }
  return hash.digest();
}

/**
 * Sorts two 32-byte hashes lexicographically and hashes them:
 * SHA256(min(a, b) + max(a, b))
 * This matches OpenZeppelin MerkleProof.sol standard.
 */
export function hashPair(a: Buffer, b: Buffer): Buffer {
  if (a.compare(b) <= 0) {
    return sha256(Buffer.concat([a, b]));
  } else {
    return sha256(Buffer.concat([b, a]));
  }
}

export interface MerkleProof {
  leaf: string; // hex
  proof: string[]; // hex array
  index: number;
}

export class IncrementalMerkleTree {
  private leaves: Buffer[] = [];
  public readonly maxLeaves: number;

  constructor(maxLeaves: number = 1000) {
    this.maxLeaves = maxLeaves;
  }

  /**
   * Appends a chunk SHA-256 digest (either as 64-char hex or 32-byte Buffer).
   */
  public addLeaf(digest: Buffer | string): number {
    if (this.leaves.length >= this.maxLeaves) {
      throw new Error(`Merkle tree exceeds maximum capacity of ${this.maxLeaves} leaves`);
    }

    const leafBuf = typeof digest === 'string'
      ? Buffer.from(digest, 'hex')
      : digest;

    if (leafBuf.length !== 32) {
      throw new Error(`Invalid leaf length: expected 32 bytes, got ${leafBuf.length}`);
    }

    this.leaves.push(leafBuf);
    return this.leaves.length - 1;
  }

  /**
   * Returns all leaf digests as hex strings.
   */
  public getLeaves(): string[] {
    return this.leaves.map((l) => l.toString('hex'));
  }

  /**
   * Returns current number of leaves.
   */
  public get count(): number {
    return this.leaves.length;
  }

  /**
   * Computes the current deterministic Merkle root (sessionRoot).
   */
  public getRoot(): string {
    if (this.leaves.length === 0) {
      // Empty tree root: SHA-256 of empty buffer
      return sha256(Buffer.alloc(0)).toString('hex');
    }

    if (this.leaves.length === 1) {
      return this.leaves[0].toString('hex');
    }

    let currentLevel = [...this.leaves];

    while (currentLevel.length > 1) {
      const nextLevel: Buffer[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          // Odd leaf at level: carry over
          nextLevel.push(currentLevel[i]);
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0].toString('hex');
  }

  /**
   * Generates a Merkle inclusion proof for a given leaf index.
   */
  public getProof(index: number): MerkleProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index ${index} out of bounds (total leaves: ${this.leaves.length})`);
    }

    const proof: string[] = [];
    let currentLevel = [...this.leaves];
    let currentIndex = index;

    while (currentLevel.length > 1) {
      const nextLevel: Buffer[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          if (i === currentIndex) {
            proof.push(currentLevel[i + 1].toString('hex'));
          } else if (i + 1 === currentIndex) {
            proof.push(currentLevel[i].toString('hex'));
          }
          nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          nextLevel.push(currentLevel[i]);
        }
      }
      currentIndex = Math.floor(currentIndex / 2);
      currentLevel = nextLevel;
    }

    return {
      leaf: this.leaves[index].toString('hex'),
      proof,
      index,
    };
  }

  /**
   * Verifies a Merkle proof against a target root.
   */
  public static verifyProof(leafHex: string, proofHexes: string[], rootHex: string): boolean {
    let current: Buffer = Buffer.from(leafHex, 'hex');

    for (const siblingHex of proofHexes) {
      const sibling = Buffer.from(siblingHex, 'hex');
      current = hashPair(current, sibling);
    }

    return current.toString('hex').toLowerCase() === rootHex.toLowerCase();
  }
}
