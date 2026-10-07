import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { socketManager } from './socketManager.js';

const app = express();
app.use(cors());

const PORT = parseInt(process.env.PORT || '8081', 10);

app.get('/health', (_req, res) => {
  res.json({ service: 'websocket-gateway', status: 'HEALTHY' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  socketManager.handleConnection(ws);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ WebSocket Gateway Service listening on ws://0.0.0.0:${PORT}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[WebSocket Gateway] Received ${signal}, starting graceful shutdown...`);
  socketManager.close();
  wss.close(() => {
    server.close(() => {
      console.log('[WebSocket Gateway] HTTP & WebSocket servers closed.');
      process.exit(0);
    });
  });
  // Force exit after 10s if connections remain stuck
  setTimeout(() => {
    console.error('[WebSocket Gateway] Force exit timeout reached.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

