import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Play, Radio } from 'lucide-react';

interface VideoPlayerProps {
  hlsUrl?: string;
  fallbackUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl, fallbackUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [streamType, setStreamType] = useState<'HLS (Adaptive)' | 'Direct MP4'>('Direct MP4');
  const [resolution, setResolution] = useState<string>('Auto');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setStreamType('HLS (Adaptive)');
        if (data.levels && data.levels.length > 0) {
          const highest = data.levels[data.levels.length - 1];
          setResolution(`${highest.height}p`);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        if (hls.levels[data.level]) {
          setResolution(`${hls.levels[data.level].height}p`);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari
      video.src = hlsUrl;
      setStreamType('HLS (Adaptive)');
    } else {
      // Fallback MP4
      video.src = fallbackUrl;
      setStreamType('Direct MP4');
    }
  }, [hlsUrl, fallbackUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className="post-media-frame" onClick={togglePlay} style={{ cursor: 'pointer' }}>
      <video
        ref={videoRef}
        playsInline
        loop
        muted={isMuted}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Adaptive Streaming Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          borderRadius: '14px',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          zIndex: 10,
        }}
      >
        <Radio size={12} className="animate-pulse" />
        <span>{streamType} • {resolution}</span>
      </div>

      {/* Play/Pause Overlay Icon if paused */}
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.5)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        >
          <Play size={28} fill="white" style={{ marginLeft: '4px' }} />
        </div>
      )}

      {/* Mute Toggle Button */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          background: 'rgba(0, 0, 0, 0.65)',
          border: 'none',
          color: 'white',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
};
