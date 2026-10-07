import React from 'react';
import { User } from '../services/api';
import { PlusSquare, Send, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
  isDevMode: boolean;
  onToggleDevMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenDMs,
  unreadCount,
  isDevMode,
  onToggleDevMode,
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
            {isDevMode ? 'DEV INSPECTOR ON' : 'CLOUD PLATFORM'}
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

        {/* Algorithm / Developer Inspector Toggle */}
        <button
          className="btn-icon"
          onClick={onToggleDevMode}
          title={isDevMode ? 'Disable Algorithm Inspector' : 'Enable Judge / Developer Algorithm Inspector'}
          style={{
            color: isDevMode ? '#818cf8' : '#64748b',
            background: isDevMode ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            borderRadius: '10px',
            padding: '6px',
            border: isDevMode ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <SlidersHorizontal size={17} />
        </button>

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
