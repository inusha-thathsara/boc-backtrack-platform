import { redis } from '../config/gcp.js';
import { DataService } from './firestore.js';

class DistributedCounterService {
  private localCounterDeltas: Map<string, number> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Micro-batch flush every 5 seconds to avoid Firestore document write locks (1 write/sec limit)
    this.flushTimer = setInterval(() => this.flushPendingDeltas(), 5000);
  }

  /**
   * Increment post likes atomically.
   */
  async incrementLike(postId: string, delta: number = 1): Promise<number> {
    if (redis) {
      try {
        const key = `post:${postId}:likes`;
        const updated = await redis.incrby(key, delta);
        // Track delta to sync with Firestore
        this.trackDelta(postId, delta);
        return updated;
      } catch (err) {
        console.warn('Redis incr failed, using local delta:', err);
      }
    }

    this.trackDelta(postId, delta);
    return DataService.incrementLikes(postId, delta);
  }

  private trackDelta(postId: string, delta: number) {
    const current = this.localCounterDeltas.get(postId) || 0;
    this.localCounterDeltas.set(postId, current + delta);
  }

  /**
   * Flushes accumulated likes to Firestore in batch.
   */
  async flushPendingDeltas(): Promise<void> {
    if (this.localCounterDeltas.size === 0) return;

    const entries = Array.from(this.localCounterDeltas.entries());
    this.localCounterDeltas.clear();

    for (const [postId, delta] of entries) {
      try {
        await DataService.incrementLikes(postId, delta);
      } catch (err) {
        console.error(`Failed to flush like delta for post ${postId}:`, err);
      }
    }
  }

  stop() {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }
}

export const counterService = new DistributedCounterService();
