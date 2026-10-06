import React, { useState } from 'react';
import { api, User } from '../services/api';
import { X, Upload, Video, Image, CheckCircle, Flame, Layers } from 'lucide-react';

interface UploadModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'post' | 'story';
}

export const UploadModal: React.FC<UploadModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
  initialType = 'post',
}) => {
  const [contentType, setContentType] = useState<'post' | 'story'>(initialType);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [sampleMediaUrl, setSampleMediaUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000'
  );

  const [, setStep] = useState<number>(0); // 0: Idle, 1: Requesting Signed URL, 2: Uploading Direct to GCS, 3: Processing & Ready
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPipelineLogs([]);

    try {
      // Step 1: Request Signed URL
      setStep(1);
      setPipelineLogs(prev => [...prev, '1. Requesting ephemeral V4 Signed URL from Feed API...']);
      const signedData = await api.requestSignedUploadUrl(
        `media_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
        mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        contentType === 'story' ? 'stories' : 'posts'
      );
      setPipelineLogs(prev => [
        ...prev,
        `   ↳ Signed URL Acquired (15m TTL). Target Bucket: ${signedData.bucket}`,
      ]);

      // Step 2: Direct Binary Upload (Simulated HTTP PUT to Signed URL)
      setStep(2);
      setPipelineLogs(prev => [...prev, '2. Direct client-to-GCS binary upload (bypassing backend servers)...']);
      await new Promise(r => setTimeout(r, 600));
      setPipelineLogs(prev => [...prev, '   ↳ Upload completed. Origin egress = 0MB from API servers.']);

      // Step 3: Worker Transcoding / Firestore Callback
      setStep(3);
      if (contentType === 'story') {
        setPipelineLogs(prev => [...prev, '3. Creating Ephemeral Story (24h GCS lifecycle expiration)...']);
        await api.createStory(currentUser.id, sampleMediaUrl, mediaType);
      } else {
        setPipelineLogs(prev => [
          ...prev,
          '3. Triggering Eventarc -> Cloud Run worker for FFmpeg HLS transcoding & SafeSearch...',
        ]);
        await api.createPost({
          authorId: currentUser.id,
          caption,
          mediaType,
          mediaUrl: sampleMediaUrl,
          rawUrl: signedData.publicUrl,
        });
      }
      setPipelineLogs(prev => [...prev, '   ↳ Post finalized with status: READY. Added to timeline.']);

      await new Promise(r => setTimeout(r, 800));
      onSuccess();
      onClose();
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#6366f1" />
            Direct Cloud Storage Ingestion
          </h3>
          <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleUpload} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Target Content Type: Post vs Story */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setContentType('post')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: contentType === 'post' ? 'var(--primary)' : 'var(--border-subtle)',
                background: contentType === 'post' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} />
              Main Feed Post
            </button>
            <button
              type="button"
              onClick={() => setContentType('story')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: contentType === 'story' ? '#ec4899' : 'var(--border-subtle)',
                background: contentType === 'story' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Flame size={14} color="#ec4899" />
              24h Ephemeral Story
            </button>
          </div>

          {/* Media Format Selector */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setMediaType('image');
                setSampleMediaUrl('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000');
              }}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: mediaType === 'image' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: 'white',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Image size={14} />
              Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('video');
                setSampleMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
              }}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: mediaType === 'video' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: 'white',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Video size={14} />
              Video (HLS Multi-Bitrate)
            </button>
          </div>

          {/* Caption (if post) */}
          {contentType === 'post' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Post Caption
              </label>
              <textarea
                rows={2}
                placeholder="Share your thoughts or cloud architecture highlights..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Media URL Input */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Media Sample URL (Simulating Direct GCS Payload)
            </label>
            <input
              type="text"
              value={sampleMediaUrl}
              onChange={e => setSampleMediaUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Live Pipeline Telemetry Log */}
          {pipelineLogs.length > 0 && (
            <div
              style={{
                background: '#090b10',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: '#38bdf8',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              {pipelineLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'var(--backtrack-gradient)',
              border: 'none',
              borderRadius: '14px',
              padding: '10px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            {isSubmitting ? (
              <span>Streaming Pipeline Active...</span>
            ) : (
              <>
                <CheckCircle size={16} />
                Publish via Direct Signed URL
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
