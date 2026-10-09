import React from 'react';
import { User } from '../services/api';
import {
  Server,
  Cloud,
  Database,
  Radio,
  Zap,
  SlidersHorizontal,
  PlusSquare,
  Send,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Shield,
  Film,
  Flame,
  Clock,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  isDevMode: boolean;
  onToggleDevMode: () => void;
  onOpenUpload: () => void;
  onOpenDMs: () => void;
  unreadCount: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  isDevMode,
  onToggleDevMode,
  onOpenUpload,
  onOpenDMs,
  unreadCount,
}) => {
  return (
    <aside className="desktop-sidebar">
      {/* 1. Active User Profile Card */}
      <div className="sidebar-card user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar-container">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="user-profile-avatar"
            />
            <span className="online-indicator" title="Connected to Real-Time WebSocket Gateway" />
          </div>
          <div className="user-profile-meta">
            <div className="user-profile-name">
              <span>{currentUser.displayName || currentUser.username}</span>
              {currentUser.isCelebrity && (
                <span title="Verified High-Follower Creator" className="badge-verified">
                  <CheckCircle2 size={15} />
                </span>
              )}
            </div>
            <span className="user-profile-handle">@{currentUser.username}</span>
            <span className="user-profile-org">Team BackTrack • Scenario 2</span>
          </div>
        </div>

        {/* Quick Switch Personas */}
        <div className="persona-quick-switch">
          <span className="persona-switch-label">Switch Persona (Interactive Demo):</span>
          <div className="persona-chips-grid">
            {users.map(u => {
              const active = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u)}
                  className={`persona-chip ${active ? 'active' : ''}`}
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

      {/* 2. Platform Architecture Core */}
      <div className="sidebar-card telemetry-card">
        <div className="telemetry-header">
          <div className="telemetry-title">
            <Cloud size={16} color="#6366f1" />
            <span>Cloud-Native Infrastructure</span>
          </div>
          <span className="live-region-badge">
            <span className="pulsing-green-dot" /> us-central1
          </span>
        </div>

        <div className="telemetry-grid">
          <div className="telemetry-item">
            <div className="item-label">
              <Server size={13} color="#38bdf8" />
              <span>Cloud Run</span>
            </div>
            <span className="item-value success">Decoupled Microservices</span>
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

        {/* Algorithm Inspector Toggle Switch */}
        <div className="inspector-toggle-box">
          <div className="inspector-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <SlidersHorizontal size={14} color={isDevMode ? '#818cf8' : '#94a3b8'} />
              <strong>Algorithm Inspector</strong>
            </div>
            <span>Display live ranking score formula on posts</span>
          </div>
          <button
            onClick={onToggleDevMode}
            className={`toggle-switch ${isDevMode ? 'on' : 'off'}`}
            title="Toggle Algorithmic Ranking Inspector"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* 3. Proposal Feature Implementation Matrix */}
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

      {/* 4. Quick Actions */}
      <div className="sidebar-card actions-card">
        <button className="sidebar-action-btn primary" onClick={onOpenUpload}>
          <PlusSquare size={17} />
          <span>Upload Post or Story</span>
        </button>
        <button className="sidebar-action-btn secondary" onClick={onOpenDMs}>
          <Send size={16} />
          <span>Direct Messages (Real-Time)</span>
          {unreadCount > 0 && <span className="action-unread-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* 5. Footer & Competition Credits */}
      <div className="sidebar-footer">
        <p className="footer-title">Beauty of Cloud 2.0 (BOC 2.0) — Scenario 2</p>
        <p className="footer-team">Team BackTrack • Faculty of IT, University of Moratuwa</p>
        <div className="footer-links">
          <a
            href="https://github.com/inusha-thathsara/boc-backtrack-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub Repository <ExternalLink size={12} />
          </a>
          <span>•</span>
          <a
            href="https://backtrack-web-894866134623.us-central1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Live Platform <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </aside>
  );
};
