import React from 'react';
import { User } from '../services/api';
import { PlusSquare, Send, ChevronDown, SlidersHorizontal, Search, X } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
  isDevMode: boolean;
  onToggleDevMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Badge */}
        <div className="brand-badge" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img
            src="/logo.png"
            alt="Team BackTrack Logo"
            className="brand-logo-img"
          />
          <div className="brand-text-block">
            <span className="brand-title">BackTrack</span>
            <div className="brand-badges-row">
              <span className="brand-subtitle">
                {isDevMode ? 'ALGORITHM INSPECTOR ON' : 'CLOUD SOCIAL PLATFORM'}
              </span>
              <span className="brand-chip-desktop">
                Scenario 2 MVP
              </span>
            </div>
          </div>
        </div>

        {/* Live Search & Discovery Bar (Filters Feed & Hashtags in Real-Time) */}
        <div className="navbar-search-bar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search creators, hashtags (#CloudRun, #HLS)..."
            className="search-input"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <span className="search-shortcut">Search</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Create Post / Story Action Button */}
          <button
            className="btn-create-post"
            onClick={onOpenUpload}
            title="Upload Post or Ephemeral Story (Direct Signed URL)"
          >
            <PlusSquare size={17} />
            <span className="btn-create-label">Create</span>
          </button>

          {/* Algorithm / Developer Inspector Toggle */}
          <button
            className={`btn-dev-toggle ${isDevMode ? 'active' : ''}`}
            onClick={onToggleDevMode}
            title={isDevMode ? 'Hide Algorithmic Scores' : 'Inspect Algorithmic Rank Scores & Formula'}
          >
            <SlidersHorizontal size={16} />
            <span className="dev-toggle-label">
              {isDevMode ? 'Inspector: ON' : 'Inspect Formula'}
            </span>
          </button>

          {/* Direct Messages Action */}
          <button
            className="btn-icon btn-dm-action"
            onClick={onOpenDMs}
            title="Direct Messages (Real-Time WebSockets)"
          >
            <Send size={18} />
            {unreadCount > 0 && <span className="badge-unread">{unreadCount}</span>}
          </button>

          {/* User Persona Switcher Pill */}
          <div className="user-switcher-container">
            <img src={currentUser.avatarUrl} alt={currentUser.username} className="user-switcher-avatar" />
            <select
              value={currentUser.id}
              onChange={e => {
                const u = users.find(x => x.id === e.target.value);
                if (u) onSwitchUser(u);
              }}
              className="user-switcher-select"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} style={{ background: '#11141c', color: '#fff' }}>
                  {u.username} {u.isCelebrity ? '⭐' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="user-switcher-chevron" />
          </div>
        </div>
      </div>
    </header>
  );
};
