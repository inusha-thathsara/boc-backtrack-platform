import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'living-blueprint-agent-app';
export const RAW_BUCKET_NAME = process.env.RAW_BUCKET_NAME || `boc-raw-media-${PROJECT_ID}`;
export const PROCESSED_BUCKET_NAME = process.env.PROCESSED_BUCKET_NAME || `boc-processed-media-${PROJECT_ID}`;
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
export const PORT = parseInt(process.env.PORT || '8080', 10);

// Google Cloud Storage
export const storage = new Storage({
  projectId: PROJECT_ID,
});

// Google Cloud Firestore
let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = new Firestore({
    projectId: PROJECT_ID,
  });
} catch (err) {
  console.warn('Firestore initialization fallback to local mock:', err);
}
export const db = firestoreInstance;

// Memorystore / Redis with graceful fallback
let redisClient: Redis | null = null;
try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't hang if local redis is missing
    lazyConnect: true,
  });

  redisClient.connect().catch(() => {
    console.log('[Redis] No active Redis connection; utilizing in-memory cache fallback.');
    redisClient = null;
  });
} catch {
  redisClient = null;
}

export const redis = redisClient;
