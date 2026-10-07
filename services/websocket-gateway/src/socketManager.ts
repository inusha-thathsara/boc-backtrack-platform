import { WebSocket } from 'ws';
import { pubsub } from './pubsub.js';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  isAlive: boolean;
  subscriptions: Map<string, (data: any) => void>;
}

export class SocketManager {
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    // 30s heartbeat keeps connections alive across Cloud Run / load balancer proxies
    this.heartbeatInterval = setInterval(() => {
      for (const [ws, conn] of this.clients.entries()) {
        if (!conn.isAlive) {
          console.log(`[WebSocket] Terminating inactive connection for user: ${conn.userId || 'anonymous'}`);
          this.cleanup(conn);
          this.clients.delete(ws);
          ws.terminate();
          continue;
        }

        conn.isAlive = false;
        ws.ping();
      }
    }, 30000);
  }

  handleConnection(ws: WebSocket) {
    const conn: ClientConnection = {
      ws,
      isAlive: true,
      subscriptions: new Map(),
    };
    this.clients.set(ws, conn);

    console.log(`[WebSocket] New client connected. Total clients: ${this.clients.size}`);

    ws.on('pong', () => {
      conn.isAlive = true;
    });

    ws.on('message', data => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(conn, msg);
      } catch (e) {
        console.warn('Invalid JSON message received:', e);
      }
    });

    ws.on('close', () => {
      this.cleanup(conn);
      this.clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Remaining: ${this.clients.size}`);
    });

    ws.on('error', err => {
      console.warn('[WebSocket] Client error:', err.message);
    });

    // Send initial handshake
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to BackTrack Real-Time Gateway' }));
  }

  private handleMessage(conn: ClientConnection, msg: any) {
    const { type, payload } = msg;

    switch (type) {
      case 'AUTH':
        conn.userId = payload.userId;
        const userChannel = `channel:user:${payload.userId}`;
        this.subscribe(conn, userChannel);
        // Also subscribe to global notifications
        this.subscribe(conn, 'channel:global');
        conn.ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId: payload.userId }));
        break;

      case 'JOIN_POST':
        if (payload.postId) {
          const postChannel = `channel:post:${payload.postId}`;
          this.subscribe(conn, postChannel);
        }
        break;

      case 'SEND_DM':
        // Real-time direct message broadcast over Pub/Sub
        if (payload.recipientId && payload.content) {
          const dmPayload = {
            id: 'dm_' + Date.now(),
            senderId: conn.userId,
            recipientId: payload.recipientId,
            content: payload.content,
            createdAt: Date.now(),
          };

          // Publish to recipient channel and sender channel
          pubsub.publish(`channel:user:${payload.recipientId}`, { type: 'NEW_DM', dm: dmPayload });
          pubsub.publish(`channel:user:${conn.userId}`, { type: 'NEW_DM', dm: dmPayload });
        }
        break;

      case 'BROADCAST_LIKE':
        // Publish live like update to post channel
        if (payload.postId) {
          pubsub.publish(`channel:post:${payload.postId}`, {
            type: 'LIKE_UPDATE',
            postId: payload.postId,
            newCount: payload.newCount,
          });
          // Also broadcast to global timeline
          pubsub.publish('channel:global', {
            type: 'GLOBAL_LIKE_EVENT',
            postId: payload.postId,
            newCount: payload.newCount,
          });
        }
        break;

      default:
        console.log('Unhandled socket action:', type);
    }
  }

  private subscribe(conn: ClientConnection, channel: string) {
    if (conn.subscriptions.has(channel)) return;

    const listener = (data: any) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(data));
      }
    };

    conn.subscriptions.set(channel, listener);
    pubsub.subscribeChannel(channel, listener);
  }

  private cleanup(conn: ClientConnection) {
    for (const [channel, listener] of conn.subscriptions.entries()) {
      pubsub.unsubscribeChannel(channel, listener);
    }
    conn.subscriptions.clear();
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    for (const [ws, conn] of this.clients.entries()) {
      this.cleanup(conn);
      ws.close();
    }
    this.clients.clear();
  }
}

export const socketManager = new SocketManager();
