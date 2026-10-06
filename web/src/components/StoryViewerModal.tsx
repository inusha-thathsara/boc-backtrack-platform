import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreatorStoryGroup } from '../services/api';
import { X, Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryViewerModalProps {
  group: CreatorStoryGroup;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ group, onClose }) => {
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

  // Progress timer
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
        return prev + 2; // ~5 seconds per story
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

        {/* Top Header Information */}
        <div className="story-viewer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={group.user.avatarUrl}
              alt={group.user.username}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                objectFit: 'cover',
              }}
            />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', display: 'block', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {group.user.username}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                <Clock size={12} />
                Expires in {currentStory.remainingHours ?? 24}h (24h GCS TTL)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="story-close-btn"
            title="Close Story"
          >
            <X size={18} />
          </button>
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

          {/* Ephemeral Notice Banner */}
          <div className="story-ephemeral-banner">
            <Flame size={15} color="#f97316" />
            <span>
              <strong>Ephemeral Story:</strong> Automated GCS lifecycle policy purges object in 24 hours.
            </span>
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
