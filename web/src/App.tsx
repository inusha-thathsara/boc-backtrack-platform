import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { api, User, Post, CreatorStoryGroup } from './services/api';
import { socket } from './services/socket';
import { Navbar } from './components/Navbar';
import { StoriesTray } from './components/StoriesTray';
import { PostCard } from './components/PostCard';
import { Cloud, Radio, Activity, RefreshCw } from 'lucide-react';

const StoryViewerModal = lazy(() =>
  import('./components/StoryViewerModal').then(m => ({ default: m.StoryViewerModal }))
);
const UploadModal = lazy(() =>
  import('./components/UploadModal').then(m => ({ default: m.UploadModal }))
);
const DirectMessagesModal = lazy(() =>
  import('./components/DirectMessagesModal').then(m => ({ default: m.DirectMessagesModal }))
);

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [feed, setFeed] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<CreatorStoryGroup[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<CreatorStoryGroup | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialType, setUploadInitialType] = useState<'post' | 'story'>('post');
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(async (viewerId: string) => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedStories, feedData] = await Promise.all([
        api.getUsers(),
        api.getStories(),
        api.getFeed(viewerId),
      ]);

      setUsers(fetchedUsers);
      setStoryGroups(fetchedStories);
      setFeed(feedData.feed);

      if (!currentUser && fetchedUsers.length > 0) {
        setCurrentUser(fetchedUsers[0]);
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData(currentUser?.id || 'u1');
  }, [loadData, currentUser?.id]);

  // Real-Time Socket Connection & Event Handling
  useEffect(() => {
    if (!currentUser) return;

    socket.connect(currentUser.id);

    const unsubscribe = socket.subscribe(event => {
      // Real-time Like broadcast
      if (event.type === 'LIKE_UPDATE' || event.type === 'GLOBAL_LIKE_EVENT') {
        const { postId, newCount } = event;
        setFeed(prev =>
          prev.map(p => (p.id === postId ? { ...p, likeCount: newCount } : p))
        );
      }

      // Real-time DM Notification
      if (event.type === 'NEW_DM') {
        if (!isDMsOpen) {
          setUnreadDMs(count => count + 1);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, isDMsOpen]);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    loadData(user.id);
  };

  const handleLikeOptimistic = (postId: string, newCount: number) => {
    setFeed(prev => prev.map(p => (p.id === postId ? { ...p, likeCount: newCount } : p)));
    socket.broadcastLike(postId, newCount);
  };

  const handleAddStory = () => {
    setUploadInitialType('story');
    setIsUploadOpen(true);
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-feed-column">
        {/* Navigation Bar */}
        <Navbar
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          onOpenUpload={() => {
            setUploadInitialType('post');
            setIsUploadOpen(true);
          }}
          onOpenDMs={() => {
            setIsDMsOpen(true);
            setUnreadDMs(0);
          }}
          unreadCount={unreadDMs}
        />

        {/* Stories Tray with 24h Expiration */}
        <StoriesTray
          currentUser={currentUser}
          storyGroups={storyGroups}
          onSelectStoryGroup={group => setActiveStoryGroup(group)}
          onAddStoryClick={handleAddStory}
        />

        {/* Architecture System Telemetry Pill */}
        <div
          style={{
            margin: '10px 14px 4px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={14} color="#6366f1" />
            <span style={{ color: '#cbd5e1' }}>
              <strong>GCP Cluster:</strong> Cloud Run • Memorystore • GCS Signed URLs
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
            <Radio size={12} className="animate-pulse" />
            <span>Redis WS Active</span>
          </div>
        </div>

        {/* Posts Feed Header */}
        <div style={{ padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
            ALGORITHMIC TIMELINE FEED
          </span>
          <button
            onClick={() => loadData(currentUser.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
            }}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {feed.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              onLikeOptimistic={handleLikeOptimistic}
            />
          ))}
        </div>
      </div>

      {/* Modals rendered outside main-feed-column to escape containing blocks */}
      <Suspense fallback={null}>
        {activeStoryGroup && (
          <StoryViewerModal group={activeStoryGroup} onClose={() => setActiveStoryGroup(null)} />
        )}

        {isUploadOpen && (
          <UploadModal
            currentUser={currentUser}
            initialType={uploadInitialType}
            onClose={() => setIsUploadOpen(false)}
            onSuccess={() => loadData(currentUser.id)}
          />
        )}

        {isDMsOpen && (
          <DirectMessagesModal
            currentUser={currentUser}
            users={users}
            onClose={() => setIsDMsOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
