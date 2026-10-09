import React from 'react';
import { User } from '../services/api';
import { PlusSquare, Send, ChevronDown, SlidersHorizontal, Search, ShieldCheck } from 'lucide-react';

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
                {isDevMode ? 'JUDGE INSPECTOR ACTIVE' : 'CLOUD PLATFORM'}
              </span>
              <span className="brand-chip-desktop">
                <ShieldCheck size={11} color="#10b981" /> Free Tier ($0/mo)
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Search Bar (Widescreen PC) */}
        <div className="navbar-search-bar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search creators, posts, #architecture..."
            className="search-input"
            readOnly
            onClick={() => alert('Search & Discovery: Powered by Google Cloud in Phase 2 roadmap!')}
          />
          <span className="search-shortcut">Ctrl+K</span>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Create Post / Story Action Button */}
          <button
            className="btn-create-post"
            onClick={onOpenUpload}
            title="Upload Post or Ephemeral Story via Direct GCS Signed URL"
          >
            <PlusSquare size={17} />
            <span className="btn-create-label">Create</span>
          </button>

          {/* Algorithm / Developer Inspector Toggle */}
          <button
            className={`btn-dev-toggle ${isDevMode ? 'active' : ''}`}
            onClick={onToggleDevMode}
            title={isDevMode ? 'Disable Algorithm Inspector' : 'Enable Judge / Developer Algorithm Inspector'}
          >
            <SlidersHorizontal size={16} />
            <span className="dev-toggle-label">
              {isDevMode ? 'Inspector: ON' : 'Judge Mode'}
            </span>
          </button>

          {/* Direct Messages Action */}
          <button
            className="btn-icon btn-dm-action"
            onClick={onOpenDMs}
            title="Direct Messages (Real-Time Cloud Run WebSockets)"
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
