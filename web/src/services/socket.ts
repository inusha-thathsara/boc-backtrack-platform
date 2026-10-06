type MessageHandler = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private currentUserId: string | null = null;
  private isConnecting: boolean = false;

  connect(userId: string) {
    this.currentUserId = userId;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'AUTH', payload: { userId } });
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    const wsUrl = window.location.hostname === 'localhost' 
      ? 'ws://localhost:8081' 
      : `wss://${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('⚡ Connected to BackTrack Real-Time Gateway');
        this.send({ type: 'AUTH', payload: { userId } });
      };

      this.ws.onmessage = event => {
        try {
          const parsed = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(parsed));
        } catch {}
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (this.currentUserId) this.connect(this.currentUserId);
        }, 3000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendDM(recipientId: string, content: string) {
    this.send({
      type: 'SEND_DM',
      payload: { recipientId, content },
    });
  }

  broadcastLike(postId: string, newCount: number) {
    this.send({
      type: 'BROADCAST_LIKE',
      payload: { postId, newCount },
    });
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export const socket = new SocketClient();
