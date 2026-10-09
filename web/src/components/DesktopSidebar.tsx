import React, { useState } from 'react';
import { User } from '../services/api';
import {
  PlusSquare,
  Send,
  CheckCircle2,
  TrendingUp,
  Users,
  Hash,
  Cloud,
  Radio,
  Database,
  Zap,
  SlidersHorizontal,
  Sparkles,
  Flame,
  Film,
  Clock,
  Shield,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
  onTagClick: (tag: string) => void;
  isDevMode: boolean;
  onToggleDevMode: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenDMs,
  unreadCount,
  onTagClick,
  isDevMode,
  onToggleDevMode,
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
    { tag: '#PlantDiscovered', count: '48.2k posts', category: 'WALL-E Discovery' },
    { tag: '#EarthCleanup', count: '39.4k posts', category: 'Planetary Restoration' },
    { tag: '#WALL_E', count: '52.1k posts', category: 'Robotics' },
    { tag: '#CloudRun', count: '14.2k posts', category: 'Cloud Architecture' },
    { tag: '#BOC2', count: '28.5k posts', category: 'Competition' },
    { tag: '#VintageRelics', count: '18.7k posts', category: 'Earth History' },
    { tag: '#Photography', count: '32.1k posts', category: 'Visual Arts' },
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
            {currentUser.bio && (
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                {currentUser.bio}
              </p>
            )}
          </div>
        </div>

        {/* Personalized Topics */}
        {currentUser.interests && currentUser.interests.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Tailored Feed Topics:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
              {currentUser.interests.map(tag => (
                <span
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

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

      {/* DEVELOPER FEATURES & INFRASTRUCTURE (Visible ONLY when Developer Mode is ON) */}
      {isDevMode && (
        <>
          <div className="sidebar-card telemetry-card">
            <div className="telemetry-header">
              <div className="telemetry-title">
                <Cloud size={16} color="#818cf8" />
                <span>Cloud-Native Infrastructure</span>
              </div>
              <span className="live-region-badge">
                <span className="pulsing-green-dot" /> us-central1
              </span>
            </div>

            <div className="telemetry-grid">
              <div className="telemetry-item">
                <div className="item-label">
                  <Radio size={13} color="#38bdf8" />
                  <span>Cloud Run</span>
                </div>
                <span className="item-value">Decoupled Microservices</span>
              </div>

              <div className="telemetry-item">
                <div className="item-label">
                  <Radio size={13} color="#10b981" />
                  <span>Redis Gateway</span>
                </div>
                <span className="item-value success">Pub/Sub Backplane</span>
              </div>

              <div className="telemetry-item">
                <div className="item-label">
                  <Database size={13} color="#a855f7" />
                  <span>Firestore</span>
                </div>
                <span className="item-value">Document Store</span>
              </div>

              <div className="telemetry-item">
                <div className="item-label">
                  <Zap size={13} color="#f59e0b" />
                  <span>Cloud Storage</span>
                </div>
                <span className="item-value">Direct V4 Signed URLs</span>
              </div>
            </div>

            {/* Algorithm Inspector Summary */}
            <div className="inspector-toggle-box">
              <div className="inspector-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <SlidersHorizontal size={14} color="#818cf8" />
                  <strong>Algorithm Inspector</strong>
                </div>
                <span>Display live ranking score formula on posts</span>
              </div>
              <button
                onClick={onToggleDevMode}
                className="toggle-switch on"
                title="Toggle Dev Mode (Click to turn off)"
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>

          <div className="sidebar-card architecture-highlights-card">
            <div className="card-title-row">
              <Sparkles size={15} color="#6366f1" />
              <span className="card-title-text">Proposal Features Implemented</span>
            </div>
            <ul className="highlights-list">
              <li>
                <div className="feature-item-header">
                  <Flame size={13} color="#f97316" />
                  <strong>Personalized Feed:</strong>
                </div>
                <span>Transparent algorithmic score sorting by recency and viral engagement.</span>
              </li>
              <li>
                <div className="feature-item-header">
                  <Film size={13} color="#38bdf8" />
                  <strong>Adaptive HLS Video:</strong>
                </div>
                <span>Multi-bitrate video streaming with low-latency playback.</span>
              </li>
              <li>
                <div className="feature-item-header">
                  <Zap size={13} color="#eab308" />
                  <strong>Viral Likes Scaling:</strong>
                </div>
                <span>Atomic Redis counters absorb 10k+ likes/sec without database lock contention.</span>
              </li>
              <li>
                <div className="feature-item-header">
                  <Clock size={13} color="#ec4899" />
                  <strong>24h Ephemeral Stories:</strong>
                </div>
                <span>Automated Cloud Storage object lifecycle expiration rules.</span>
              </li>
              <li>
                <div className="feature-item-header">
                  <Shield size={13} color="#10b981" />
                  <strong>Content Moderation:</strong>
                </div>
                <span>Automated Cloud Vision SafeSearch AI image inspection.</span>
              </li>
            </ul>
          </div>
        </>
      )}

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
