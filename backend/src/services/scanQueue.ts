import { EventEmitter } from 'events';
import { runScanPipeline } from './scanPipeline';

export type ScanProgressStatus = 'queued' | 'running' | 'axe_done' | 'ai_done' | 'done' | 'failed';

export interface ScanProgress {
  scanId: string;
  status: ScanProgressStatus;
  message: string;
  score?: number;
  issueCount?: number;
  error?: string;
}

export interface ScanJob {
  scanId: string;
  targetUrl: string;
}

/**
 * In-process scan queue.
 * Uses a simple FIFO queue with EventEmitter for SSE progress delivery.
 * For production scale, replace with BullMQ + Redis.
 */
class ScanQueue extends EventEmitter {
  private queue: ScanJob[] = [];
  private statusMap = new Map<string, ScanProgress>();
  private isProcessing = false;

  /**
   * Enqueue a job and start processing if idle.
   * Returns immediately — does NOT await the pipeline.
   */
  async addToQueue(job: ScanJob): Promise<void> {
    this.queue.push(job);
    this.updateProgress(job.scanId, {
      scanId: job.scanId,
      status: 'queued',
      message: 'Scan queued — waiting for worker…',
    });
    // Fire-and-forget
    this.processNext();
  }

  getStatus(scanId: string): ScanProgress | undefined {
    return this.statusMap.get(scanId);
  }

  updateProgress(scanId: string, progress: ScanProgress): void {
    this.statusMap.set(scanId, progress);
    this.emit(`progress:${scanId}`, progress);
  }

  onProgress(scanId: string, cb: (progress: ScanProgress) => void): void {
    this.on(`progress:${scanId}`, cb);
  }

  removeListenerFor(scanId: string, cb: (progress: ScanProgress) => void): void {
    this.removeListener(`progress:${scanId}`, cb);
  }

  private processNext(): void {
    if (this.isProcessing || this.queue.length === 0) return;

    // Process concurrently up to 2 jobs (configurable)
    const MAX_CONCURRENT = 2;
    let running = 0;

    const runOne = async () => {
      const job = this.queue.shift();
      if (!job) return;
      running++;
      try {
        await runScanPipeline(job);
      } catch (err) {
        console.error(`[ScanQueue] Unhandled error for scan ${job.scanId}:`, err);
      } finally {
        running--;
        // Clean up status after 5 minutes (SSE clients would have disconnected by then)
        setTimeout(() => this.statusMap.delete(job.scanId), 5 * 60 * 1000);
        if (this.queue.length > 0) runOne();
        else this.isProcessing = running > 0;
      }
    };

    this.isProcessing = true;
    for (let i = 0; i < Math.min(MAX_CONCURRENT, this.queue.length); i++) {
      runOne();
    }
  }
}

export const scanQueue = new ScanQueue();
// Increase max listeners to avoid Node warnings with many SSE clients
scanQueue.setMaxListeners(100);
