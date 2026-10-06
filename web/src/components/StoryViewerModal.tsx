import React, { useState, useEffect } from 'react';
import { CreatorStoryGroup } from '../services/api';
import { X, Clock, Flame } from 'lucide-react';

interface StoryViewerModalProps {
  group: CreatorStoryGroup;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ group, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = group.stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
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
        return prev + 2; // ~5 seconds total duration
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, group.stories.length, onClose]);

  if (!currentStory) return null;

  return (
    <div className="story-viewer-modal" onClick={e => {
      // Tap navigation: Left half back, Right half forward
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 3) {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
      } else {
        if (currentIndex < group.stories.length - 1) setCurrentIndex(i => i + 1);
        else onClose();
      }
    }}>
      <div className="story-viewer-frame" onClick={e => e.stopPropagation()}>
        {/* Progress Bar Tracks */}
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

        {/* Header Info */}
        <div className="story-viewer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={group.user.avatarUrl}
              alt={group.user.username}
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid white' }}
            />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                {group.user.username}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={12} />
                Expires in {currentStory.remainingHours ?? 24}h (24h GCS TTL)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Media Frame */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story Content"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Ephemeral Notice Banner */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '16px',
              right: '16px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
            }}
          >
            <Flame size={16} color="#f97316" />
            <span>
              <strong>Ephemeral Story:</strong> Automated lifecycle policy permanently purges raw & processed files after 24 hours.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
