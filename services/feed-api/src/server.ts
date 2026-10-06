import express from 'express';
import cors from 'cors';
import { PORT } from './config/gcp.js';
import { mediaRouter } from './routes/media.js';
import { postsRouter } from './routes/posts.js';
import { storiesRouter } from './routes/stories.js';
import { feedRouter } from './routes/feed.js';
import { authRouter } from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check for Cloud Run Liveness & Readiness Probes
app.get('/health', (_req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/media', mediaRouter);
app.use('/api/posts', postsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/feed', feedRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Feed API Service listening on http://0.0.0.0:${PORT}`);
});
