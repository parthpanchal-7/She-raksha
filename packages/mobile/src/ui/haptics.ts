/**
 * @she-raksha/mobile — Haptic Feedback Service
 *
 * Implements distinct sensory feedback cadences:
 *  - SOS_TRIGGER: Heavy double-pulse (urgent, unmistakable)
 *  - RAIL_FAILOVER: Triple alert vibration (network degradation notice)
 *  - ZK_PROOF_SUCCESS: Dual light confirmation ticks
 *  - CHECK_IN_TICK: Subtle tactile pulse
 *  - WARNING_PULSE: Rhythmic warning vibration
 */

export type HapticCadence =
  | 'SOS_TRIGGER'
  | 'RAIL_FAILOVER'
  | 'ZK_PROOF_SUCCESS'
  | 'CHECK_IN_TICK'
  | 'WARNING_PULSE';

export interface HapticFeedbackRecord {
  cadence: HapticCadence;
  patternMs: number[];
  triggeredAt: string;
}

export class HapticService {
  private static readonly CADENCE_PATTERNS: Record<HapticCadence, number[]> = {
    SOS_TRIGGER: [150, 100, 250],
    RAIL_FAILOVER: [100, 80, 100, 80, 150],
    ZK_PROOF_SUCCESS: [50, 50, 75],
    CHECK_IN_TICK: [40],
    WARNING_PULSE: [200, 100, 200],
  };

  private history: HapticFeedbackRecord[] = [];

  /**
   * Triggers a specific sensory haptic cadence.
   */
  public trigger(cadence: HapticCadence): HapticFeedbackRecord {
    const patternMs = HapticService.CADENCE_PATTERNS[cadence];
    const record: HapticFeedbackRecord = {
      cadence,
      patternMs,
      triggeredAt: new Date().toISOString(),
    };

    this.history.push(record);
    return record;
  }

  public getHistory(): HapticFeedbackRecord[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }
}
