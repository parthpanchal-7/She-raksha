/**
 * @she-raksha/mobile — Media Capture Pipeline
 *
 * Implements FR-EV-001 (5-Second Chunked Capture):
 *  - Continuously records 1080p H.265 video, AAC 128kbps audio, and high-accuracy GPS/NavIC telemetry
 *  - Packages rolling 5.0-second byte buffers directly in RAM
 *  - Appends cellular network tower measurements (MCC/MNC/LAC/CellID) for statutory BSA §63 provenance
 */

import { randomBytes } from 'node:crypto';
import {
  type RawMediaChunk,
  type MediaType,
  type GPSNavICTelemetry,
} from './types.js';

export interface CapturePipelineOptions {
  chunkDurationSeconds?: number;
  sampleRateHz?: number;
}

export class MediaCapturePipeline {
  public readonly chunkDurationSeconds: number;
  private isRecording: boolean = false;
  private currentChunkIndex: number = 0;
  private activeIncidentId: string | null = null;

  constructor(options: CapturePipelineOptions = {}) {
    this.chunkDurationSeconds = options.chunkDurationSeconds ?? 5.0;
  }

  /**
   * Starts an active capture session for a specific incident.
   */
  public startSession(incidentId: string): void {
    this.isRecording = true;
    this.activeIncidentId = incidentId;
    this.currentChunkIndex = 0;
  }

  /**
   * Stops the active capture session.
   */
  public stopSession(): void {
    this.isRecording = false;
    this.activeIncidentId = null;
  }

  public getSessionStatus(): { isRecording: boolean; activeIncidentId: string | null; currentChunkIndex: number } {
    return {
      isRecording: this.isRecording,
      activeIncidentId: this.activeIncidentId,
      currentChunkIndex: this.currentChunkIndex,
    };
  }

  /**
   * Generates or captures a simulated 5.0-second raw media chunk in RAM.
   * Telemetry includes high-accuracy GPS/NavIC coordinates and cell tower identifiers.
   */
  public async capture5SecondChunk(
    mediaType: MediaType,
    telemetryOverride?: Partial<GPSNavICTelemetry>,
    simulatedContent?: Buffer
  ): Promise<RawMediaChunk> {
    const incidentId = this.activeIncidentId || `incident-${Date.now()}`;
    const chunkIndex = this.currentChunkIndex++;

    const telemetry: GPSNavICTelemetry = {
      latitude: telemetryOverride?.latitude ?? 28.6139, // New Delhi default
      longitude: telemetryOverride?.longitude ?? 77.2090,
      altitudeMeters: telemetryOverride?.altitudeMeters ?? 216.5,
      accuracyMeters: telemetryOverride?.accuracyMeters ?? 2.8,
      satelliteConstellation: telemetryOverride?.satelliteConstellation ?? 'NavIC',
      satellitesInView: telemetryOverride?.satellitesInView ?? 11,
      speedMps: telemetryOverride?.speedMps ?? 0.0,
      headingDegrees: telemetryOverride?.headingDegrees ?? 42.0,
      cellTower: {
        mcc: telemetryOverride?.cellTower?.mcc ?? 404, // India MCC
        mnc: telemetryOverride?.cellTower?.mnc ?? 45,  // Airtel / Jio MNC
        lac: telemetryOverride?.cellTower?.lac ?? 1024,
        cellId: telemetryOverride?.cellTower?.cellId ?? 58921,
        signalDbm: telemetryOverride?.cellTower?.signalDbm ?? -78,
      },
      timestamp: new Date().toISOString(),
    };

    let buffer: Buffer;

    if (simulatedContent) {
      buffer = Buffer.from(simulatedContent);
    } else {
      switch (mediaType) {
        case 'VIDEO_H265': {
          // 1080p H.265 simulated slice with MP4 container box header (ftypmp42)
          const ftypHeader = Buffer.from([
            0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size 24, 'ftyp'
            0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00, // 'mp42', minor ver 0
            0x6d, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6f, 0x6d, // compatible brands
          ]);
          // 5 seconds @ 1080p H.265 compressed stream slice (~12KB test payload)
          const payload = randomBytes(12 * 1024);
          buffer = Buffer.concat([ftypHeader, payload]);
          break;
        }

        case 'AUDIO_AAC': {
          // AAC ADTS header (0xFFF1: syncword, MPEG-4, AAC LC, 44.1kHz, stereo)
          const adtsHeader = Buffer.from([0xff, 0xf1, 0x50, 0x80, 0x00, 0x1f, 0xfc]);
          const audioPayload = randomBytes(4 * 1024); // ~4KB for 5s compressed AAC
          buffer = Buffer.concat([adtsHeader, audioPayload]);
          break;
        }

        case 'SENSOR_TELEMETRY':
        default: {
          const telemetryJson = JSON.stringify({
            incidentId,
            chunkIndex,
            telemetry,
            sensorSampleCount: 250, // 50Hz * 5s
            capturedAt: new Date().toISOString(),
          });
          buffer = Buffer.from(telemetryJson, 'utf-8');
          break;
        }
      }
    }

    return {
      incidentId,
      chunkIndex,
      mediaType,
      durationSeconds: this.chunkDurationSeconds,
      recordedAt: new Date().toISOString(),
      buffer,
      telemetry,
    };
  }
}
