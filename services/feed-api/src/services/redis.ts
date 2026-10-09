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
   * Toggle like for a single user per post (Single User Like Restriction).
   * Ensures 1 user can only like once per post.
   */
  async toggleLike(
    postId: string,
    userId: string = 'u1',
    requestedDelta?: number
  ): Promise<{ liked: boolean; likeCount: number; delta: number }> {
    const keySet = `post:${postId}:liked_users`;
    const keyCounter = `post:${postId}:likes`;

    if (redis) {
      try {
        const isMember = await redis.sismember(keySet, userId);
        let delta = 0;
        let nextLiked = Boolean(isMember);

        if (requestedDelta !== undefined) {
          if (requestedDelta > 0 && !isMember) {
            await redis.sadd(keySet, userId);
            delta = 1;
            nextLiked = true;
          } else if (requestedDelta < 0 && isMember) {
            await redis.srem(keySet, userId);
            delta = -1;
            nextLiked = false;
          }
        } else {
          if (isMember) {
            await redis.srem(keySet, userId);
            delta = -1;
            nextLiked = false;
          } else {
            await redis.sadd(keySet, userId);
            delta = 1;
            nextLiked = true;
          }
        }

        if (delta !== 0) {
          const exists = await redis.exists(keyCounter);
          if (!exists) {
            const seed = DataService.getPostSync(postId)?.likeCount || 0;
            await redis.set(keyCounter, seed);
          }
          const updated = await redis.incrby(keyCounter, delta);
          this.trackDelta(postId, delta);
          DataService.toggleUserLike(postId, userId, delta);
          return { liked: nextLiked, likeCount: Math.max(0, updated), delta };
        } else {
          const currentCount = await redis.get(keyCounter);
          return {
            liked: nextLiked,
            likeCount: currentCount ? parseInt(currentCount, 10) : (DataService.getPostSync(postId)?.likeCount || 0),
            delta: 0,
          };
        }
      } catch (err) {
        console.warn('Redis like toggle fallback:', err);
      }
    }

    const res = DataService.toggleUserLike(postId, userId, requestedDelta);
    if (res.delta !== 0) {
      this.trackDelta(postId, res.delta);
    }
    return res;
  }

  /**
   * Increment post likes atomically.
   */
  async incrementLike(postId: string, delta: number = 1, userId?: string): Promise<number> {
    if (userId) {
      const res = await this.toggleLike(postId, userId, delta);
      return res.likeCount;
    }
    if (redis) {
      try {
        const key = `post:${postId}:likes`;
        const exists = await redis.exists(key);
        if (!exists) {
          const seed = DataService.getPostSync(postId)?.likeCount || 0;
          await redis.set(key, seed);
        }
        const updated = await redis.incrby(key, delta);
        this.trackDelta(postId, delta);
        DataService.applyLikeDelta(postId, delta);
        return updated;
      } catch (err) {
        console.warn('Redis incr failed, using local delta:', err);
      }
    }

    this.trackDelta(postId, delta);
    return DataService.applyLikeDelta(postId, delta);
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
