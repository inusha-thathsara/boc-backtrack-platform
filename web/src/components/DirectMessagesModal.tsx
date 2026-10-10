import React, { useState, useEffect, useRef } from 'react';
import { User } from '../services/api';
import { socket } from '../services/socket';
import { aiChatService, ChatMessage } from '../services/aiChat';
import { X, Send, Sparkles, Bot } from 'lucide-react';

interface DirectMessagesModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
}

const DEFAULT_CONVERSATIONS: Record<string, { sender: string; content: string }[]> = {
  'walle.solar': [
    { sender: 'walle.solar', content: 'Beep boop! Plant in the boot is thriving under the sun today! 🌱☀️' },
    { sender: 'self', content: 'Awesome! Did you find any new vintage relics in sector 4?' },
    { sender: 'walle.solar', content: 'Wall-Eee! Found a brass lighter with real sparks! 🤖✨' },
  ],
  'madhura.cloud': [
    { sender: 'madhura.cloud', content: 'Hey! The FFmpeg HLS transcoding on Cloud Run is running smoothly.' },
    { sender: 'self', content: 'Awesome! Redis Pub/Sub backplane is routing real-time socket events instantly.' },
  ],
  'alex.creator': [
    { sender: 'alex.creator', content: 'Hey! Just uploaded a 4K anamorphic video test to the platform.' },
    { sender: 'self', content: 'Looks stunning! The 4-second adaptive HLS chunking plays without any buffering.' },
  ],
  'backtrack.official': [
    { sender: 'backtrack.official', content: 'Welcome to BackTrack! All cloud-native microservices are currently operational.' },
  ],
};

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({ currentUser, users, onClose }) => {
  const eligibleRecipients = users.filter(u => u.id !== currentUser.id);
  const [selectedRecipient, setSelectedRecipient] = useState<User>(
    eligibleRecipients[0] || users[0]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation storage key for this pair of users
  const conversationKey = `backtrack_dm_${[currentUser.id, selectedRecipient.id].sort().join('_')}`;

  // Load conversation on recipient switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(conversationKey);
      if (saved) {
        setMessages(JSON.parse(saved));
        return;
      }
    } catch {}

    // Seed realistic starting messages for this persona
    const initialSeed = DEFAULT_CONVERSATIONS[selectedRecipient.username] || [
      { sender: selectedRecipient.username, content: `Hey @${currentUser.username}! How is the BackTrack platform performing?` },
    ];

    const seeded: ChatMessage[] = initialSeed.map((item, idx) => ({
      id: `seed_${idx}_${Date.now()}`,
      senderId: item.sender === 'self' ? currentUser.id : selectedRecipient.id,
      recipientId: item.sender === 'self' ? selectedRecipient.id : currentUser.id,
      content: item.content,
      createdAt: Date.now() - (initialSeed.length - idx) * 1000 * 60,
    }));

    setMessages(seeded);
    try {
      localStorage.setItem(conversationKey, JSON.stringify(seeded));
    } catch {}
  }, [currentUser.id, selectedRecipient.id, conversationKey]);

  // Real-time socket message handler
  useEffect(() => {
    const unsubscribe = socket.subscribe(data => {
      if (data.type === 'NEW_DM' && data.dm) {
        const dm = data.dm;
        if (
          (dm.senderId === selectedRecipient.id && dm.recipientId === currentUser.id) ||
          (dm.senderId === currentUser.id && dm.recipientId === selectedRecipient.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === dm.id || (m.content === dm.content && Math.abs(m.createdAt - dm.createdAt) < 2000))) {
              return prev;
            }
            const updated = [...prev, dm];
            try {
              localStorage.setItem(conversationKey, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, selectedRecipient.id, conversationKey]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isTyping) return;

    // 1. Optimistic User Message
    const userMsg: ChatMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: currentUser.id,
      recipientId: selectedRecipient.id,
      content: text,
      createdAt: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');

    try {
      localStorage.setItem(conversationKey, JSON.stringify(nextHistory));
    } catch {}

    // 2. Broadcast via WebSocket
    socket.sendDM(selectedRecipient.id, text);

    // 3. Trigger Local Ollama AI Persona Response
    setIsTyping(true);
    try {
      const aiReplyText = await aiChatService.generateReply(
        selectedRecipient,
        currentUser,
        text,
        nextHistory
      );

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: selectedRecipient.id,
        recipientId: currentUser.id,
        content: aiReplyText,
        createdAt: Date.now(),
        isAiGenerated: true,
      };

      setMessages(prev => {
        const withAi = [...prev, aiMsg];
        try {
          localStorage.setItem(conversationKey, JSON.stringify(withAi));
        } catch {}
        return withAi;
      });

      // Echo back via WebSocket gateway for cross-tab sync
      socket.sendDM(currentUser.id, aiReplyText);
    } catch (err) {
      console.error('AI chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={selectedRecipient.avatarUrl}
            alt={selectedRecipient.username}
            style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(99, 102, 241, 0.4)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                {selectedRecipient.displayName || selectedRecipient.username}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600 }}>
                @{selectedRecipient.username}
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bot size={11} color="#38bdf8" />
              <span>Ollama AI (gemma3:1b) • Live WebSocket</span>
            </span>
          </div>
        </div>

        <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} title="Close Chat">
          <X size={16} />
        </button>
      </div>

      {/* Recipient Picker Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        {eligibleRecipients.map(u => {
          const isSelected = u.id === selectedRecipient.id;
          return (
            <button
              key={u.id}
              onClick={() => setSelectedRecipient(u)}
              style={{
                background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              <img src={u.avatarUrl} alt={u.username} style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
              <span>{u.username.split('.')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Feed */}
      <div className="chat-messages-container">
        {messages.map(m => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`chat-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
              <div>{m.content}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px', marginTop: '3px' }}>
                {m.isAiGenerated && (
                  <span style={{ fontSize: '0.58rem', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Generated by local Ollama model">
                    <Sparkles size={8} /> Ollama
                  </span>
                )}
                <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="chat-bubble incoming" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Bot size={13} className="animate-spin" color="#818cf8" />
            <span style={{ fontSize: '0.74rem', color: '#c7d2fe' }}>
              {selectedRecipient.displayName || selectedRecipient.username} is replying via Ollama...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <form onSubmit={handleSendMessage} className="chat-input-row">
        <input
          type="text"
          className="chat-input-field"
          placeholder={`Message ${selectedRecipient.username} (Ollama AI will reply)...`}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
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
            cursor: isTyping ? 'not-allowed' : 'pointer',
            opacity: !inputText.trim() || isTyping ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
