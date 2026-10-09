import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreatorStoryGroup } from '../services/api';
import { X, Clock, Flame, ChevronLeft, ChevronRight, Timer } from 'lucide-react';

interface StoryViewerModalProps {
  group: CreatorStoryGroup;
  onClose: () => void;
  isDevMode?: boolean;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ group, onClose, isDevMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = group.stories[currentIndex];

  // Lock body scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Slide Progress timer (~5 seconds per story slide)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      if (isPaused) return;

      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < group.stories.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // ~5 seconds per story slide
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, group.stories.length, isPaused, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
      }
      if (e.key === 'ArrowRight') {
        if (currentIndex < group.stories.length - 1) setCurrentIndex(i => i + 1);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, group.stories.length, onClose]);

  // Live ticking 24-hour cloud expiration countdown (synced with server expiresAt)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    isExpired: boolean;
  }>({ hours: 24, minutes: 0, seconds: 0, formatted: '24h 00m 00s', isExpired: false });

  useEffect(() => {
    const updateCountdown = () => {
      if (!currentStory?.expiresAt) return;
      const now = Date.now();
      const diffMs = currentStory.expiresAt - now;

      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, formatted: '00h 00m 00s (Expired)', isExpired: true });
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`,
        isExpired: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentStory?.expiresAt]);

  if (!currentStory) return null;

  const handleNext = () => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  // Remaining slide playback seconds (counts down from 5s to 1s)
  const slideSecondsLeft = Math.max(1, Math.ceil((100 - progress) / 20));

  const formatPostedTime = (timestamp: number) => {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const formatExactTime = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const modalContent = (
    <div
      className="story-viewer-modal"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Desktop Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          className="story-nav-btn story-nav-prev"
          onClick={e => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Previous Story"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Main Story Container Frame */}
      <div className="story-viewer-frame" onClick={e => e.stopPropagation()}>
        {/* Top Progress Bar Tracks */}
        <div className="story-progress-bar-container">
          {group.stories.map((s, idx) => (
            <div key={s.id} className="story-progress-bar-track">
              <div
                className="story-progress-fill"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header Information & Dual-Timer HUD */}
        <div className="story-viewer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img
              src={group.user.avatarUrl}
              alt={group.user.username}
              className="story-viewer-avatar"
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="story-viewer-username">
                  {group.user.username}
                </span>
                <span className="story-slide-counter">
                  {currentIndex + 1}/{group.stories.length}
                </span>
                <span className="story-posted-time">
                  • {formatPostedTime(currentStory.createdAt)}
                </span>
              </div>

              {/* Server-Backed Live Ticking 24h Expiration Timer */}
              <div className="story-live-countdown-badge" title="Live 24h Ephemeral Countdown (Backed by Cloud Storage Object Lifecycle)">
                <Clock size={12} className="pulse-clock" />
                <span className="countdown-clock-text">
                  Expires in <strong>{timeLeft.formatted}</strong>
                </span>
                <span className="countdown-pill-ttl">24h GCS TTL</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Live slide playback seconds remaining */}
            <div className="story-slide-playback-pill" title="Current story slide duration (5s timer)">
              <Timer size={12} color="#cbd5e1" />
              <span className="playback-timer-value">{slideSecondsLeft}s</span>
            </div>

            <button
              onClick={onClose}
              className="story-close-btn"
              title="Close Story (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Story Media Frame: Full Image Optimization */}
        <div className="story-media-container">
          {/* Ambient blurred backdrop so any aspect ratio fits gracefully without harsh bars */}
          <div
            className="story-ambient-backdrop"
            style={{
              backgroundImage: `url(${currentStory.mediaUrl})`,
            }}
          />

          {/* Sharp, uncropped, full image/video display */}
          <div className="story-media-wrapper">
            {currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                className="story-media-element"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story Content"
                className="story-media-element"
              />
            )}
          </div>

          {/* Interactive Tap Zones (Invisible) */}
          <div className="story-tap-zone-left" onClick={handlePrev} />
          <div className="story-tap-zone-right" onClick={handleNext} />

          {/* Ephemeral Notice Banner with Exact Purge Timestamps */}
          <div className="story-ephemeral-banner">
            <Flame size={15} color="#f97316" className="banner-flame-icon" />
            <div className="story-ephemeral-details">
              <span className="ephemeral-title-line">
                <strong>Ephemeral Story (24h Lifecycle):</strong> Purges at{' '}
                <strong>{formatExactTime(currentStory.expiresAt)}</strong> ({timeLeft.formatted} remaining).
              </span>
              <span className="ephemeral-desc-line">
                Google Cloud Storage native lifecycle rule automatically purges object after 1 day.
              </span>
              {isDevMode && (
                <div className="story-dev-meta">
                  Server expiresAt: <code>{currentStory.expiresAt}</code> (UTC epoch ms) • GCS Prefix: <code>stories/</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Next Arrow */}
      {currentIndex < group.stories.length - 1 && (
        <button
          className="story-nav-btn story-nav-next"
          onClick={e => {
            e.stopPropagation();
            handleNext();
          }}
          title="Next Story"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
