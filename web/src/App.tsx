import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { api, User, Post, CreatorStoryGroup } from './services/api';
import { socket } from './services/socket';
import { Navbar } from './components/Navbar';
import { StoriesTray } from './components/StoriesTray';
import { PostCard } from './components/PostCard';
import { DesktopSidebar } from './components/DesktopSidebar';
import { Activity, RefreshCw, Code2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('backtrack_dev_mode') === 'true';
  });

  const handleToggleDevMode = () => {
    setIsDevMode(prev => {
      const next = !prev;
      localStorage.setItem('backtrack_dev_mode', String(next));
      return next;
    });
  };

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

  // Filter feed based on search query (search creators, hashtags, caption)
  const filteredFeed = feed.filter(post => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      post.caption?.toLowerCase().includes(q) ||
      post.author?.username?.toLowerCase().includes(q) ||
      post.author?.displayName?.toLowerCase().includes(q)
    );
  });

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Full-width Responsive Top Navigation Bar */}
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
        isDevMode={isDevMode}
        onToggleDevMode={handleToggleDevMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Responsive Layout: Feed (Center) + Desktop Sidebar (Right) */}
      <main className="app-main-layout">
        {/* Center Feed Column */}
        <div className="main-feed-column">
          {/* Stories Tray with 24h Expiration */}
          <StoriesTray
            currentUser={currentUser}
            storyGroups={storyGroups}
            onSelectStoryGroup={group => setActiveStoryGroup(group)}
            onAddStoryClick={handleAddStory}
          />

          {/* Mobile Developer Inspector Banner (Visible only when Dev Mode is toggled ON on small screens) */}
          {isDevMode && (
            <div className="mobile-dev-inspector-card">
              <div className="mobile-dev-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={15} color="#818cf8" />
                  <strong>Cloud Architecture (Dev Mode)</strong>
                </div>
                <span className="live-region-badge">
                  <span className="pulsing-green-dot" /> us-central1
                </span>
              </div>
              <div className="mobile-dev-chips">
                <span className="mobile-dev-chip">Cloud Run Microservices</span>
                <span className="mobile-dev-chip">Redis Pub/Sub</span>
                <span className="mobile-dev-chip">Firestore NoSQL</span>
                <span className="mobile-dev-chip">Direct V4 Signed URLs</span>
              </div>
              <div className="mobile-dev-formula-note">
                Live Algorithm Active: <code>(Likes × 0.4) + (Recency × 0.6)</code>
              </div>
            </div>
          )}

          {/* Posts Feed Header */}
          <div className="feed-section-header">
            <span className="feed-title-label">
              {searchQuery ? `SEARCH: "${searchQuery}"` : 'FOR YOU'}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                loadData(currentUser.id);
              }}
              className="feed-refresh-btn"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Posts Feed */}
          <div className="posts-feed">
            {filteredFeed.length > 0 ? (
              filteredFeed.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser.id}
                  onLikeOptimistic={handleLikeOptimistic}
                  isDevMode={isDevMode}
                />
              ))
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '8px' }}>
                  No posts matching "{searchQuery}"
                </p>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '18px' }}>
                  Try searching by creator name (inusha, madhura) or hashtags (#CloudRun, #HLS)
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: '#818cf8',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear Search Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar (Rendered on Widescreen PC >= 1024px) */}
        <DesktopSidebar
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
          onTagClick={tag => setSearchQuery(tag)}
          isDevMode={isDevMode}
          onToggleDevMode={handleToggleDevMode}
        />
      </main>

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
