import Redis from 'ioredis';
import { EventEmitter } from 'events';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

class PubSubManager extends EventEmitter {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private isRedisActive: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(0); // Unlimited listeners for production pub/sub channels
    try {
      this.publisher = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        lazyConnect: true,
      });

      this.subscriber = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        lazyConnect: true,
      });

      Promise.all([this.publisher.connect(), this.subscriber.connect()])
        .then(() => {
          this.isRedisActive = true;
          console.log('✅ Connected to Memorystore / Redis Pub/Sub Backplane');

          this.subscriber?.psubscribe('channel:*', err => {
            if (err) console.error('Subscription error:', err);
          });

          this.subscriber?.on('pmessage', (_pattern, channel, message) => {
            try {
              const parsed = JSON.parse(message);
              this.emit(channel, parsed);
            } catch {
              this.emit(channel, message);
            }
          });
        })
        .catch(() => {
          console.log('ℹ️ Running WebSocket Gateway with In-Memory Pub/Sub backplane.');
        });
    } catch {
      this.isRedisActive = false;
    }
  }

  async publish(channel: string, payload: any): Promise<void> {
    const serialized = JSON.stringify(payload);
    if (this.isRedisActive && this.publisher) {
      await this.publisher.publish(channel, serialized);
    } else {
      // In-memory fallback broadcast
      this.emit(channel, payload);
    }
  }

  subscribeChannel(channel: string, callback: (data: any) => void) {
    this.on(channel, callback);
  }

  unsubscribeChannel(channel: string, callback: (data: any) => void) {
    this.off(channel, callback);
  }
}

export const pubsub = new PubSubManager();
