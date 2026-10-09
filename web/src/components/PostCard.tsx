import React, { useState } from 'react';
import { Post, api } from '../services/api';
import { VideoPlayer } from './VideoPlayer';
import { Heart, MessageCircle, Send, Cpu, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLikeOptimistic: (postId: string, newCount: number) => void;
  isDevMode?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLikeOptimistic,
  isDevMode = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showRankingDetails, setShowRankingDetails] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; user?: any; content: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    const delta = isLiked ? -1 : 1;
    const nextCount = Math.max(0, post.likeCount + delta);
    setIsLiked(!isLiked);
    onLikeOptimistic(post.id, nextCount);

    try {
      await api.likePost(post.id, delta);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      const fetched = await api.getComments(post.id);
      setComments(fetched);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const added = await api.addComment(post.id, currentUserId, newComment.trim());
      setComments(prev => [...prev, added]);
      setNewComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const timeAgo = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-author-info">
          <img
            src={post.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={post.author?.username}
            className="post-author-avatar"
          />
          <div className="post-author-meta">
            <div className="post-author-name">
              <span>{post.author?.username || 'user'}</span>
              {post.author?.isCelebrity && (
                <span title="High-follower Verified Creator" className="badge-verified">
                  <CheckCircle2 size={14} />
                </span>
              )}
            </div>
            <span className="post-timestamp">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* Right side chips: Personalization Reason + Transcoding status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {post.rankingFactors?.personalizationReason && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.68rem',
                fontWeight: 600,
                color: '#c084fc',
                background: 'rgba(192, 132, 252, 0.1)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                padding: '3px 9px',
                borderRadius: '12px',
              }}
              title="Algorithmic Personalization Match"
            >
              <Sparkles size={11} color="#c084fc" />
              {post.rankingFactors.personalizationReason}
            </span>
          )}

          {post.status === 'PROCESSING' && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              Transcoding...
            </span>
          )}
        </div>
      </div>

      {/* Media Frame */}
      {post.mediaType === 'video' ? (
        <VideoPlayer hlsUrl={post.hlsUrl} fallbackUrl={post.mediaUrl} />
      ) : (
        <div className="post-media-frame">
          <img src={post.mediaUrl} alt={post.caption} className="post-media-img" loading="lazy" />
        </div>
      )}

      {/* Action Row */}
      <div className="post-actions-row">
        <div className="post-actions-left">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={22} fill={isLiked ? '#f43f5e' : 'none'} />
          </button>
          <button className="action-btn" onClick={toggleComments} title="View comments">
            <MessageCircle size={22} />
          </button>
          {isDevMode && (
            <button
              className="action-btn"
              onClick={() => setShowRankingDetails(!showRankingDetails)}
              title="Inspect Algorithmic Rank Score"
            >
              <Cpu size={20} color="#818cf8" />
            </button>
          )}
        </div>

        <button className="action-btn" title="Share post">
          <Send size={20} />
        </button>
      </div>

      {/* Post Details */}
      <div className="post-details">
        <div className="likes-counter">
          <span>{post.likeCount.toLocaleString()} likes</span>
          {isDevMode && (
            <span className="badge-redis-tag" title="Incremented via atomic Redis INCR and flushed every 5s">
              Redis INCR
            </span>
          )}
        </div>

        <p className="post-caption">
          <span className="caption-author">{post.author?.username}</span>
          {post.caption}
        </p>

        {/* Algorithmic Ranking Formula Inspector (Developer / Judge Mode Only) */}
        {isDevMode && (
          <div className="ranking-inspect-chip">
            <div
              className="ranking-chip-header"
              onClick={() => setShowRankingDetails(!showRankingDetails)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Cpu size={14} />
                Algorithmic Rank Score: <strong>{post.score ?? 'Calculated'}</strong>
              </span>
              {showRankingDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {showRankingDetails && post.rankingFactors && (
              <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                <div className="ranking-stats">
                  <span>Likes: {post.rankingFactors.likes}</span>
                  <span>Comments: {post.rankingFactors.comments}</span>
                  <span>Age: {post.rankingFactors.hoursElapsed}h</span>
                  <span>Affinity: +{post.rankingFactors.affinityBonus}</span>
                </div>
                {post.rankingFactors.personalizationReason && (
                  <div style={{ fontSize: '0.72rem', color: '#c084fc', marginTop: '4px', fontWeight: 600 }}>
                    Signal: {post.rankingFactors.personalizationReason}
                  </div>
                )}
                <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                  Formula: (Log10(Likes)*110 + Log10(Comments)*70 + Affinity) / (Age + 2)^1.2
                </p>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        {showComments && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {comments.map(c => (
                <div key={c.id} style={{ fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                  <strong style={{ color: '#93c5fd' }}>{c.user?.username || 'user'}:</strong>
                  <span style={{ color: '#cbd5e1' }}>{c.content}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};
