import express from 'express';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import path from 'path';
import os from 'os';
import { VideoTranscoder } from './transcoder.js';
import { moderateContent } from './moderation.js';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '8082', 10);
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'living-blueprint-agent-app';
const PROCESSED_BUCKET = process.env.PROCESSED_BUCKET_NAME || `boc-processed-media-${PROJECT_ID}`;

const storage = new Storage({ projectId: PROJECT_ID });
let firestore: Firestore | null = null;
try {
  firestore = new Firestore({ projectId: PROJECT_ID });
} catch {}

app.get('/health', (_req, res) => {
  res.json({ service: 'media-worker', status: 'HEALTHY' });
});

/**
 * Eventarc / HTTP Push Handler: Invoked when a media file is uploaded to the raw bucket.
 */
app.post('/api/process-media', async (req, res): Promise<void> => {
  const startTime = Date.now();
  let tempDir: string | null = null;
  try {
    // Support Eventarc GCS object format or direct invocation
    const bucketName = req.body.bucket || req.headers['ce-bucket'] || `boc-raw-media-${PROJECT_ID}`;
    const fileId = req.body.name || req.body.fileId || req.headers['ce-subject'];
    const postId = req.body.postId;

    console.log(`[Worker] Received transcoding task for: ${fileId} in bucket ${bucketName}`);

    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    tempDir = path.join(os.tmpdir(), `transcode_${Date.now()}`);
    const isVideo = fileId.endsWith('.mp4') || fileId.endsWith('.mov') || fileId.includes('video');

    // 1. Content Moderation
    console.log(`[Worker] Running Cloud Vision SafeSearch moderation...`);
    const moderation = await moderateContent(fileId);
    if (!moderation.isSafe) {
      console.warn(`[Worker] Content FLAGGED as unsafe:`, moderation.flags);
      if (firestore && postId) {
        await firestore.collection('posts').doc(postId).update({ status: 'FLAGGED' });
      }
      res.status(200).json({ status: 'FLAGGED', reason: 'Failed moderation checks' });
      return;
    }

    // 2. Transcode Video to HLS if video
    let hlsUrl = `https://storage.googleapis.com/${PROCESSED_BUCKET}/${fileId}`;
    let thumbnailUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400`;

    if (isVideo) {
      console.log(`[Worker] Packaging multi-bitrate HLS (.m3u8) streams...`);
      const transcodeResult = await VideoTranscoder.transcodeToHLS(fileId, tempDir);
      
      if (!transcodeResult.isMocked && transcodeResult.hlsManifestPath) {
        hlsUrl = `https://storage.googleapis.com/${PROCESSED_BUCKET}/${fileId}/playlist.m3u8`;
        thumbnailUrl = `https://storage.googleapis.com/${PROCESSED_BUCKET}/${fileId}/thumbnail.jpg`;
      } else {
        // High quality test adaptive HLS stream
        hlsUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      }
    }

    // 3. Firestore Completion Callback (Status: READY)
    console.log(`[Worker] Updating Firestore post ${postId} status to READY...`);
    if (firestore && postId) {
      await firestore.collection('posts').doc(postId).update({
        status: 'READY',
        hlsUrl,
        thumbnailUrl,
        processedAt: Date.now(),
      });
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Worker] Transcoding pipeline finished in ${durationMs}ms`);

    res.json({
      status: 'READY',
      fileId,
      postId,
      hlsUrl,
      thumbnailUrl,
      durationMs,
      moderation: moderation.flags,
    });
  } catch (error: any) {
    console.error('[Worker] Transcoding failure:', error);
    res.status(500).json({ error: error.message });
  } finally {
    // Purge temp transcoding folder to reclaim Cloud Run ephemeral container memory/disk
    try {
      if (tempDir) {
        const fs = await import('fs');
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    } catch {}
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Media Worker Service listening on http://0.0.0.0:${PORT}`);
});
