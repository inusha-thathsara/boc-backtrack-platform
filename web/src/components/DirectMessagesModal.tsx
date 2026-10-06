import React, { useState, useEffect, useRef } from 'react';
import { User } from '../services/api';
import { socket } from '../services/socket';
import { X, Send, Radio } from 'lucide-react';

interface DirectMessagesModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: number;
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({ currentUser, users, onClose }) => {
  const [selectedRecipient, setSelectedRecipient] = useState<User>(
    users.find(u => u.id !== currentUser.id) || users[0]
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderId: selectedRecipient.id,
      recipientId: currentUser.id,
      content: 'Hey! The FFmpeg HLS transcoding on Cloud Run is running smoothly.',
      createdAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 'm2',
      senderId: currentUser.id,
      recipientId: selectedRecipient.id,
      content: 'Awesome! Redis Pub/Sub backplane is routing real-time socket events instantly.',
      createdAt: Date.now() - 1000 * 60 * 2,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to incoming DMs over WebSockets
    const unsubscribe = socket.subscribe(data => {
      if (data.type === 'NEW_DM' && data.dm) {
        const dm = data.dm;
        if (
          (dm.senderId === selectedRecipient.id && dm.recipientId === currentUser.id) ||
          (dm.senderId === currentUser.id && dm.recipientId === selectedRecipient.id)
        ) {
          setMessages(prev => [...prev, dm]);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, selectedRecipient.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.sendDM(selectedRecipient.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={selectedRecipient.avatarUrl}
            alt={selectedRecipient.username}
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          />
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', display: 'block' }}>
              {selectedRecipient.username}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={10} className="animate-pulse" />
              Redis Pub/Sub WebSocket
            </span>
          </div>
        </div>

        <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Recipient Picker Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        {users
          .filter(u => u.id !== currentUser.id)
          .map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedRecipient(u)}
              style={{
                background: u.id === selectedRecipient.id ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'white',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {u.username}
            </button>
          ))}
      </div>

      {/* Messages Feed */}
      <div className="chat-messages-container">
        {messages.map(m => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`chat-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
              <div>{m.content}</div>
              <span style={{ fontSize: '0.62rem', opacity: 0.6, marginTop: '2px', display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <form onSubmit={handleSendMessage} className="chat-input-row">
        <input
          type="text"
          className="chat-input-field"
          placeholder={`Message ${selectedRecipient.username}...`}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'white',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
