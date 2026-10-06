import React from 'react';
import { User } from '../services/api';
import { PlusSquare, Send, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenDMs,
  unreadCount,
}) => {
  return (
    <header className="navbar">
      <div className="brand-badge">
        <img
          src="/logo.png"
          alt="Team BackTrack Logo"
          className="brand-logo-img"
        />
        <div>
          <span className="brand-title">BackTrack</span>
          <span style={{ fontSize: '0.62rem', color: '#6366f1', display: 'block', fontWeight: 600 }}>
            BOC 2.0 CLOUD MVP
          </span>
        </div>
      </div>

      <div className="nav-actions">
        {/* User Switcher Pill */}
        <div className="user-switcher-container" style={{ position: 'relative' }}>
          <select
            value={currentUser.id}
            onChange={e => {
              const u = users.find(x => x.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            style={{
              appearance: 'none',
              background: 'rgba(255, 255, 255, 0.07)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '5px 28px 5px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id} style={{ background: '#11141c', color: '#fff' }}>
                {u.username} {u.isCelebrity ? '⭐' : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#94a3b8',
            }}
          />
        </div>

        {/* Upload Action */}
        <button className="btn-icon" onClick={onOpenUpload} title="Upload Post or Story">
          <PlusSquare size={19} />
        </button>

        {/* Direct Messages Action */}
        <button className="btn-icon" onClick={onOpenDMs} title="Direct Messages (WebSocket)">
          <Send size={18} />
          {unreadCount > 0 && <span className="badge-unread">{unreadCount}</span>}
        </button>
      </div>
    </header>
  );
};
