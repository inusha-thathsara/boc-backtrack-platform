import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { PORT } from './config/gcp.js';
import { logger } from './config/logger.js';
import { securityHeaders, apiLimiter, uploadLimiter } from './middleware/security.js';
import { authenticateToken } from './middleware/auth.js';
import { counterService } from './services/redis.js';
import { mediaRouter } from './routes/media.js';
import { postsRouter } from './routes/posts.js';
import { storiesRouter } from './routes/stories.js';
import { feedRouter } from './routes/feed.js';
import { authRouter } from './routes/auth.js';

const app = express();

// Trust Cloud Run reverse proxy headers (X-Forwarded-For)
app.set('trust proxy', 1);

// Production Middleware Stack
app.use(securityHeaders);
app.use(compression());
app.use(cors({
  origin: '*', // Whitelisted origins or client domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.static('public'));
app.use(apiLimiter);

// Structured Request Logging for Cloud Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}]`, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      userAgent: req.headers['user-agent'],
    });
  });
  next();
});

// Health & Liveness Probes for Cloud Run (No auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'feed-api',
    environment: process.env.NODE_ENV || 'production',
    freeTierCompliance: true,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes with Auth & Rate Limiting
app.use('/api/media', uploadLimiter, mediaRouter);
app.use('/api/posts', authenticateToken, postsRouter);
app.use('/api/stories', authenticateToken, storiesRouter);
app.use('/api/feed', feedRouter);
app.use('/api/auth', authRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled API Error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.notice(`🚀 Feed API Service listening on http://0.0.0.0:${PORT}`);
});

// Graceful Cloud Run Shutdown Handling (Flushes pending atomic Redis counters to Firestore)
const shutdown = async (signal: string) => {
  logger.notice(`Received ${signal}. Gracefully flushing pending counters & terminating...`);
  counterService.stop();
  await counterService.flushPendingDeltas();
  server.close(() => {
    logger.notice('Server terminated cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
