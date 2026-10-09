import React, { useState } from 'react';
import { User } from '../services/api';
import {
  PlusSquare,
  Send,
  CheckCircle2,
  TrendingUp,
  Users,
  Hash,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
  onTagClick: (tag: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenDMs,
  unreadCount,
  onTagClick,
}) => {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    u3: true,
  });

  const toggleFollow = (userId: string) => {
    setFollowingMap(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const trendingTopics = [
    { tag: '#CloudRun', count: '14.2k posts', category: 'Technology' },
    { tag: '#HLS', count: '9.8k posts', category: 'Streaming' },
    { tag: '#BackTrack', count: '28.5k posts', category: 'Trending' },
    { tag: '#Photography', count: '18.1k posts', category: 'Media' },
    { tag: '#WebSockets', count: '6.4k posts', category: 'Real-Time' },
  ];

  const suggestedUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <aside className="desktop-sidebar">
      {/* 1. Active User Profile Summary */}
      <div className="sidebar-card user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar-container">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="user-profile-avatar"
            />
            <span className="online-indicator" title="Online" />
          </div>
          <div className="user-profile-meta">
            <div className="user-profile-name">
              <span>{currentUser.displayName || currentUser.username}</span>
              {currentUser.isCelebrity && (
                <span title="Verified Creator" className="badge-verified">
                  <CheckCircle2 size={15} />
                </span>
              )}
            </div>
            <span className="user-profile-handle">@{currentUser.username}</span>
          </div>
        </div>

        {/* Persona Switcher Chips */}
        <div className="persona-quick-switch">
          <span className="persona-switch-label">Switch Account / Persona:</span>
          <div className="persona-chips-grid">
            {users.map(u => {
              const active = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u)}
                  className={`persona-chip ${active ? 'active' : ''}`}
                  title={`Switch to @${u.username}`}
                >
                  <img src={u.avatarUrl} alt={u.username} className="chip-avatar" />
                  <span>{u.username.split('.')[0]}</span>
                  {active && <span className="active-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Suggested Creators to Follow */}
      <div className="sidebar-card suggested-creators-card">
        <div className="card-title-row">
          <Users size={16} color="#818cf8" />
          <span className="card-title-text">Suggested Creators</span>
        </div>
        <div className="suggested-users-list">
          {suggestedUsers.map(u => {
            const isFollowing = !!followingMap[u.id];
            return (
              <div key={u.id} className="suggested-user-item">
                <div className="suggested-user-left">
                  <img src={u.avatarUrl} alt={u.username} className="suggested-user-avatar" />
                  <div className="suggested-user-info">
                    <div className="suggested-user-name">
                      <span>{u.username}</span>
                      {u.isCelebrity && (
                        <span className="badge-verified">
                          <CheckCircle2 size={13} />
                        </span>
                      )}
                    </div>
                    <span className="suggested-user-sub">
                      {u.isCelebrity ? 'Verified Creator' : 'Suggested for you'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Trending Topics & Hashtags (Search & Discovery) */}
      <div className="sidebar-card trending-topics-card">
        <div className="card-title-row">
          <TrendingUp size={16} color="#ec4899" />
          <span className="card-title-text">Trending Hashtags</span>
        </div>
        <div className="trending-list">
          {trendingTopics.map(topic => (
            <div
              key={topic.tag}
              className="trending-item"
              onClick={() => onTagClick(topic.tag)}
              title={`Filter feed by ${topic.tag}`}
            >
              <div className="trending-item-meta">
                <span className="trending-category">{topic.category}</span>
                <span className="trending-tag">
                  <Hash size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />
                  {topic.tag.replace('#', '')}
                </span>
                <span className="trending-count">{topic.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div className="sidebar-card actions-card">
        <button className="sidebar-action-btn primary" onClick={onOpenUpload}>
          <PlusSquare size={17} />
          <span>New Post or Story</span>
        </button>
        <button className="sidebar-action-btn secondary" onClick={onOpenDMs}>
          <Send size={16} />
          <span>Direct Messages</span>
          {unreadCount > 0 && <span className="action-unread-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* 5. Clean Platform Footer */}
      <div className="sidebar-footer">
        <div className="footer-links-row">
          <span>About</span>
          <span>•</span>
          <span>Help</span>
          <span>•</span>
          <span>Privacy</span>
          <span>•</span>
          <span>Terms</span>
          <span>•</span>
          <span>API</span>
        </div>
        <p className="footer-copyright">© 2026 BackTrack Platform • Team BackTrack</p>
      </div>
    </aside>
  );
};
