import { db } from '../config/gcp.js';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  isCelebrity: boolean;
  bio?: string;
  interests?: string[];
  following?: string[];
}

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  caption: string;
  mediaType: 'image' | 'video';
  rawUrl?: string;
  hlsUrl?: string;
  mediaUrl: string;
  thumbnailUrl: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FLAGGED';
  likeCount: number;
  commentCount: number;
  createdAt: number;
  score?: number;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  authorId: string;
  author?: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: number;
  expiresAt: number; // 24-hour expiration
  viewed?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: number;
}

// In-Memory Seed State
const memoryUsers: Map<string, User> = new Map([
  [
    'u1',
    {
      id: 'u1',
      username: 'inusha.tech',
      displayName: 'Inusha Gunassekara',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      followerCount: 14200,
      followingCount: 310,
      isCelebrity: false,
      bio: 'Cloud Architect & DevOps • Google Cloud Run, Terraform & Kubernetes',
      interests: ['#CloudRun', '#GCP', '#Terraform', '#DevOps', '#Kubernetes'],
      following: ['u2', 'u3', 'u_walle'],
    },
  ],
  [
    'u2',
    {
      id: 'u2',
      username: 'madhura.cloud',
      displayName: 'Madhura Abeywickrama',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      followerCount: 9800,
      followingCount: 240,
      isCelebrity: false,
      bio: 'Distributed Systems Engineer • Low-Latency Redis, WebSockets & Eventarc',
      interests: ['#Redis', '#WebSockets', '#Architecture', '#Performance', '#Databases'],
      following: ['u1', 'u3'],
    },
  ],
  [
    'u3',
    {
      id: 'u3',
      username: 'backtrack.official',
      displayName: 'Team BackTrack',
      avatarUrl: '/logo.png',
      followerCount: 850000,
      followingCount: 50,
      isCelebrity: true,
      bio: 'Official BackTrack Social Platform • BOC 2.0 Scenario 2 Enterprise Edition',
      interests: ['#BackTrack', '#BOC2', '#CloudRun', '#HLS', '#Community'],
      following: ['u1', 'u2', 'u4', 'u_walle'],
    },
  ],
  [
    'u4',
    {
      id: 'u4',
      username: 'alex.creator',
      displayName: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      followerCount: 45000,
      followingCount: 420,
      isCelebrity: false,
      bio: 'Visual Storyteller & Photographer • 4K Cinematic Video & Tokyo Street',
      interests: ['#Photography', '#Cinematography', '#Visuals', '#Travel', '#Design'],
      following: ['u3', 'u_walle'],
    },
  ],
  [
    'u_walle',
    {
      id: 'u_walle',
      username: 'walle.solar',
      displayName: 'WALL-E (Waste Allocation Load Lifter)',
      avatarUrl: '/media/walle_sun.jpg',
      followerCount: 128400,
      followingCount: 3,
      isCelebrity: true,
      bio: 'Solar charged custodian of Earth ☀️🌱 • Compacted waste cubes since 2105 • Collector of vintage treasures, cassette tapes & rare living sprouts',
      interests: ['#PlantDiscovered', '#WALL_E', '#EarthCleanup', '#VintageRelics', '#SolarPower'],
      following: ['u3', 'u1', 'u4'],
    },
  ],
]);

const memoryPosts: Map<string, Post> = new Map([
  [
    'p1',
    {
      id: 'p1',
      authorId: 'u3',
      caption: 'Scaling to millions on Google Cloud Platform! Check out our decoupled HLS streaming pipeline 🚀 #BOC2 #CloudRun #GCP #BackTrack',
      mediaType: 'video',
      mediaUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
      status: 'READY',
      likeCount: 12450,
      commentCount: 412,
      createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    },
  ],
  [
    'p_walle_sprout',
    {
      id: 'p_walle_sprout',
      authorId: 'u_walle',
      caption: 'Directive paused... 🌱 Found a living, photosynthesizing sprout growing inside an old leather boot on Earth! 700 years of waste compacting, and life finds a way. Need to keep this safe from the dust storms! ☀️🤖 #PlantDiscovered #EarthCleanup #WALL_E #Directive #Hope',
      mediaType: 'image',
      mediaUrl: '/media/walle_treasure.jpg',
      thumbnailUrl: '/media/walle_treasure.jpg',
      status: 'READY',
      likeCount: 48210,
      commentCount: 1240,
      createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
    },
  ],
  [
    'p2',
    {
      id: 'p2',
      authorId: 'u1',
      caption: 'Live demo testing: Direct Cloud Storage signed URL uploads bypass API servers completely. Zero bottlenecks! ⚡ #CloudRun #DevOps #GCP',
      mediaType: 'video',
      mediaUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400',
      status: 'READY',
      likeCount: 1420,
      commentCount: 88,
      createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    },
  ],
  [
    'p_walle_plant_video',
    {
      id: 'p_walle_plant_video',
      authorId: 'u_walle',
      caption: 'Time-lapse macro observation: The Earth sprout is unfolding new green leaves under the morning sun! 🌱☀️ Biological life returns after 7 centuries. 🤖✨ #PlantDiscovered #WALL_E #LifeFindsAWay #EarthRevival',
      mediaType: 'video',
      mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      thumbnailUrl: '/media/walle_treasure.jpg',
      status: 'READY',
      likeCount: 65400,
      commentCount: 2180,
      createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    },
  ],
  [
    'p3',
    {
      id: 'p3',
      authorId: 'u2',
      caption: 'Distributed Redis counters flush atomic like increments in micro-batches every 5 seconds. No Firestore lock contention! #Redis #Architecture #Performance',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      status: 'READY',
      likeCount: 1150,
      commentCount: 62,
      createdAt: Date.now() - 1000 * 60 * 300, // 5 hours ago
    },
  ],
  [
    'p_walle_shiny',
    {
      id: 'p_walle_shiny',
      authorId: 'u_walle',
      caption: 'Oooh... Shiny! ✨ Inspecting an ancient brass Zippo lighter relic recovered from the sector 4 scrap heaps. The flame still sparks! Adding this to my transport truck collection next to the Rubik\'s cube. 🤖 #VintageRelics #EarthCleanup #WALL_E #Treasures',
      mediaType: 'image',
      mediaUrl: '/media/walle_shiny.jpg',
      thumbnailUrl: '/media/walle_shiny.jpg',
      status: 'READY',
      likeCount: 38900,
      commentCount: 890,
      createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    },
  ],
  [
    'p4',
    {
      id: 'p4',
      authorId: 'u4',
      caption: 'Golden Hour in 4K: Exploring cinematic color grading and anamorphic lens flares on our coastal shoot 🌅✨ #Photography #Cinematography #Visuals',
      mediaType: 'video',
      mediaUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
      status: 'READY',
      likeCount: 2840,
      commentCount: 142,
      createdAt: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
    },
  ],
  [
    'p_walle_log',
    {
      id: 'p_walle_log',
      authorId: 'u_walle',
      caption: 'Discovered petrified timber branch on Earth 🪵 Sensors detect organic cellulose structure. Proof that ancient green forests once flourished across these plains. Documenting for planetary restoration! 🤖🌱 #EarthHistory #WALL_E #EarthCleanup #Archive',
      mediaType: 'image',
      mediaUrl: '/media/walle_log.jpg',
      thumbnailUrl: '/media/walle_log.jpg',
      status: 'READY',
      likeCount: 31200,
      commentCount: 645,
      createdAt: Date.now() - 1000 * 60 * 220, // 3.6 hours ago
    },
  ],
  [
    'p5',
    {
      id: 'p5',
      authorId: 'u4',
      caption: 'Night street photography in Shibuya: Neon reflections captured with high-speed prime 35mm f/1.4 📸 #Photography #Visuals #Travel',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400',
      status: 'READY',
      likeCount: 3190,
      commentCount: 178,
      createdAt: Date.now() - 1000 * 60 * 240, // 4 hours ago
    },
  ],
  [
    'p_walle_solar',
    {
      id: 'p_walle_solar',
      authorId: 'u_walle',
      caption: 'Morning solar array deployment: Photovoltaic chest panels at 100% full capacity! ☀️🔋 Daily routine: compact 50,000 cubes, polish optical lenses, and keep the boot sprout safe. Earth is getting cleaner cube by cube! 🤖 #SolarPower #WALL_E #EarthCleanup #DailyRoutine',
      mediaType: 'image',
      mediaUrl: '/media/walle_sun.jpg',
      thumbnailUrl: '/media/walle_sun.jpg',
      status: 'READY',
      likeCount: 52100,
      commentCount: 1430,
      createdAt: Date.now() - 1000 * 60 * 280, // 4.6 hours ago
    },
  ],
  [
    'p6',
    {
      id: 'p6',
      authorId: 'u1',
      caption: 'Infrastructure as Code: Full Terraform blueprint deployed to GCP Always Free Tier with zero idle costs 🛡️ #Terraform #DevOps #CloudRun #GCP',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
      status: 'READY',
      likeCount: 890,
      commentCount: 54,
      createdAt: Date.now() - 1000 * 60 * 360, // 6 hours ago
    },
  ],
  [
    'p7',
    {
      id: 'p7',
      authorId: 'u2',
      caption: 'Low-latency bidirectional WebSocket gateway with 30s heartbeats & pub/sub backplane benchmarks ⚡ #WebSockets #Performance #Backend',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
      status: 'READY',
      likeCount: 760,
      commentCount: 41,
      createdAt: Date.now() - 1000 * 60 * 420, // 7 hours ago
    },
  ],
]);

const memoryStories: Map<string, Story> = new Map([
  [
    's_walle',
    {
      id: 's_walle',
      authorId: 'u_walle',
      mediaUrl: '/media/walle_treasure.jpg',
      mediaType: 'image',
      createdAt: Date.now() - 1000 * 60 * 20, // 20 mins ago
      expiresAt: Date.now() + 1000 * 60 * 60 * 23.6,
    },
  ],
  [
    's1',
    {
      id: 's1',
      authorId: 'u1',
      mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      mediaType: 'image',
      createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      expiresAt: Date.now() + 1000 * 60 * 60 * 21, // Expires in 21 hours
    },
  ],
  [
    's2',
    {
      id: 's2',
      authorId: 'u3',
      mediaUrl: '/logo.png',
      mediaType: 'image',
      createdAt: Date.now() - 1000 * 60 * 60 * 1, // 1 hour ago
      expiresAt: Date.now() + 1000 * 60 * 60 * 23, // Expires in 23 hours
    },
  ],
  [
    's3',
    {
      id: 's3',
      authorId: 'u2',
      mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      mediaType: 'image',
      createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
      expiresAt: Date.now() + 1000 * 60 * 60 * 23.5,
    },
  ],
  [
    's4',
    {
      id: 's4',
      authorId: 'u4',
      mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      mediaType: 'image',
      createdAt: Date.now() - 1000 * 60 * 40, // 40 mins ago
      expiresAt: Date.now() + 1000 * 60 * 60 * 23.3,
    },
  ],
]);

const memoryComments: Map<string, Comment[]> = new Map([
  [
    'p1',
    [
      { id: 'c1', postId: 'p1', userId: 'u1', content: 'Incredible architecture team!', createdAt: Date.now() - 1000 * 60 * 30 },
      { id: 'c2', postId: 'p1', userId: 'u2', content: 'Serverless Cloud Run + FFmpeg is lightning fast.', createdAt: Date.now() - 1000 * 60 * 15 },
    ],
  ],
  [
    'p_walle_sprout',
    [
      { id: 'cw1', postId: 'p_walle_sprout', userId: 'u1', content: '700-year cold boot deployment succeeded. Earth recovery pipeline is ONLINE 🚀🌱', createdAt: Date.now() - 1000 * 60 * 20 },
      { id: 'cw2', postId: 'p_walle_sprout', userId: 'u3', content: 'Official BackTrack salute to WALL-E! Genuine organic plant confirmed 🌱', createdAt: Date.now() - 1000 * 60 * 15 },
      { id: 'cw3', postId: 'p_walle_sprout', userId: 'u4', content: 'That lighting on the boot seedling is incredible. True art of resilience! 📸', createdAt: Date.now() - 1000 * 60 * 10 },
    ],
  ],
  [
    'p_walle_plant_video',
    [
      { id: 'cw4', postId: 'p_walle_plant_video', userId: 'u2', content: 'High-definition macro time-lapse. Life finds a way! 🌿', createdAt: Date.now() - 1000 * 60 * 45 },
      { id: 'cw5', postId: 'p_walle_plant_video', userId: 'u1', content: 'Zero carbon footprint, 100% solar powered streaming ☀️', createdAt: Date.now() - 1000 * 60 * 30 },
    ],
  ],
]);

// Single-user like tracker (Maps postId -> Set of userIds who liked the post)
const memoryPostLikes: Map<string, Set<string>> = new Map([
  ['p1', new Set(['u2', 'u3'])],
  ['p_walle_sprout', new Set(['u1', 'u2', 'u3', 'u4'])],
  ['p2', new Set(['u3'])],
  ['p_walle_plant_video', new Set(['u1', 'u3'])],
  ['p3', new Set(['u1'])],
  ['p_walle_shiny', new Set(['u4', 'u1'])],
  ['p4', new Set(['u1', 'u3'])],
  ['p_walle_log', new Set(['u2'])],
  ['p5', new Set(['u2'])],
  ['p_walle_solar', new Set(['u1', 'u3'])],
  ['p6', new Set(['u3'])],
  ['p7', new Set(['u1'])],
]);

export class DataService {
  static async getUsers(): Promise<User[]> {
    if (db) {
      try {
        const snap = await db.collection('users').get();
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        }
      } catch (err) {
        console.warn('Firestore fetch failed, returning in-memory:', err);
      }
    }
    return Array.from(memoryUsers.values());
  }

  static async getUser(userId: string): Promise<User | undefined> {
    if (db) {
      try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) return { id: doc.id, ...doc.data() } as User;
      } catch {}
    }
    return memoryUsers.get(userId);
  }

  static async getPosts(): Promise<Post[]> {
    let posts: Post[] = [];
    if (db) {
      try {
        const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(50).get();
        if (!snap.empty) {
          posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        }
      } catch (err) {
        console.warn('Firestore fetch failed, using memory:', err);
      }
    }
    if (posts.length === 0) {
      posts = Array.from(memoryPosts.values());
    }
    // Populate authors and heal any broken blob: URLs
    for (const post of posts) {
      post.author = await this.getUser(post.authorId);
      if (post.mediaUrl && post.mediaUrl.startsWith('blob:')) {
        post.mediaUrl = '/media/walle_treasure.jpg';
        post.thumbnailUrl = '/media/walle_treasure.jpg';
      }
    }
    return posts;
  }

  static async getPost(postId: string): Promise<Post | undefined> {
    if (db) {
      try {
        const doc = await db.collection('posts').doc(postId).get();
        if (doc.exists) {
          const post = { id: doc.id, ...doc.data() } as Post;
          post.author = await this.getUser(post.authorId);
          if (post.mediaUrl && post.mediaUrl.startsWith('blob:')) {
            post.mediaUrl = '/media/walle_treasure.jpg';
            post.thumbnailUrl = '/media/walle_treasure.jpg';
          }
          return post;
        }
      } catch {}
    }
    const p = memoryPosts.get(postId);
    if (p) {
      p.author = await this.getUser(p.authorId);
      if (p.mediaUrl && p.mediaUrl.startsWith('blob:')) {
        p.mediaUrl = '/media/walle_treasure.jpg';
        p.thumbnailUrl = '/media/walle_treasure.jpg';
      }
      return p;
    }
    return undefined;
  }

  static async createPost(post: Omit<Post, 'id' | 'createdAt' | 'likeCount' | 'commentCount'>): Promise<Post> {
    // Guard against client-revoked blob: URLs
    const safeMediaUrl = post.mediaUrl && post.mediaUrl.startsWith('blob:')
      ? (post.rawUrl && !post.rawUrl.startsWith('blob:') ? post.rawUrl : '/media/walle_treasure.jpg')
      : post.mediaUrl;

    const newPost: Post = {
      ...post,
      mediaUrl: safeMediaUrl,
      thumbnailUrl: safeMediaUrl,
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
    };

    if (db) {
      try {
        await db.collection('posts').doc(newPost.id).set(newPost);
      } catch (err) {
        console.warn('Firestore set failed, stored in memory:', err);
      }
    }
    memoryPosts.set(newPost.id, newPost);
    newPost.author = await this.getUser(newPost.authorId);
    return newPost;
  }

  static async updatePostStatus(postId: string, status: Post['status'], hlsUrl?: string, thumbnailUrl?: string): Promise<void> {
    const p = memoryPosts.get(postId);
    if (p) {
      p.status = status;
      if (hlsUrl) p.hlsUrl = hlsUrl;
      if (thumbnailUrl) p.thumbnailUrl = thumbnailUrl;
    }
    if (db) {
      try {
        const updateData: any = { status };
        if (hlsUrl) updateData.hlsUrl = hlsUrl;
        if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
        await db.collection('posts').doc(postId).update(updateData);
      } catch {}
    }
  }

  static async getActiveStories(): Promise<Story[]> {
    const now = Date.now();
    let stories: Story[] = [];

    if (db) {
      try {
        const snap = await db.collection('stories').where('expiresAt', '>', now).get();
        if (!snap.empty) {
          stories = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story));
        }
      } catch (err) {
        console.warn('Firestore fetch stories failed, using memory:', err);
      }
    }
    if (stories.length === 0) {
      stories = Array.from(memoryStories.values()).filter(s => s.expiresAt > now);
    }

    for (const story of stories) {
      story.author = await this.getUser(story.authorId);
    }
    return stories;
  }

  static async createStory(story: Omit<Story, 'id' | 'createdAt' | 'expiresAt'>): Promise<Story> {
    const now = Date.now();
    const newStory: Story = {
      ...story,
      id: 's_' + now + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24-hour expiration
    };

    if (db) {
      try {
        await db.collection('stories').doc(newStory.id).set(newStory);
      } catch {}
    }
    memoryStories.set(newStory.id, newStory);
    newStory.author = await this.getUser(newStory.authorId);
    return newStory;
  }

  static async getComments(postId: string): Promise<Comment[]> {
    const comments = memoryComments.get(postId) || [];
    for (const c of comments) {
      c.user = await this.getUser(c.userId);
    }
    return comments;
  }

  static async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    const comment: Comment = {
      id: 'c_' + Date.now(),
      postId,
      userId,
      content,
      createdAt: Date.now(),
    };
    const list = memoryComments.get(postId) || [];
    list.push(comment);
    memoryComments.set(postId, list);

    const post = memoryPosts.get(postId);
    if (post) post.commentCount += 1;

    comment.user = await this.getUser(userId);
    return comment;
  }

  /**
   * Directly mutates post likeCount in memory (used when incrementing without user tracking).
   */
  static applyLikeDelta(postId: string, delta: number): number {
    const post = memoryPosts.get(postId);
    if (post) {
      post.likeCount = Math.max(0, post.likeCount + delta);
      return post.likeCount;
    }
    return 0;
  }

  /**
   * Persists accumulated like delta to persistent Firestore database.
   * NOTE: In-memory post.likeCount is already updated during toggleUserLike/applyLikeDelta;
   * this method syncs to remote Firestore without double-incrementing in-memory state.
   */
  static async incrementLikes(postId: string, delta: number = 1): Promise<number> {
    if (db) {
      try {
        const postRef = db.collection('posts').doc(postId);
        const doc = await postRef.get();
        if (doc.exists) {
          const current = doc.data()?.likeCount || 0;
          await postRef.update({ likeCount: Math.max(0, current + delta) });
        }
      } catch (err) {
        console.warn('Firestore like increment sync fallback:', err);
      }
    }
    const post = memoryPosts.get(postId);
    return post ? post.likeCount : 0;
  }

  static hasUserLiked(postId: string, userId: string): boolean {
    const set = memoryPostLikes.get(postId);
    return set ? set.has(userId) : false;
  }

  static getPostSync(postId: string): Post | undefined {
    return memoryPosts.get(postId);
  }

  static toggleUserLike(postId: string, userId: string, requestedDelta?: number): { liked: boolean; likeCount: number; delta: number } {
    let set = memoryPostLikes.get(postId);
    if (!set) {
      set = new Set();
      memoryPostLikes.set(postId, set);
    }

    const currentlyLiked = set.has(userId);
    let delta = 0;
    let nextLiked = currentlyLiked;

    if (requestedDelta !== undefined) {
      if (requestedDelta > 0 && !currentlyLiked) {
        set.add(userId);
        delta = 1;
        nextLiked = true;
      } else if (requestedDelta < 0 && currentlyLiked) {
        set.delete(userId);
        delta = -1;
        nextLiked = false;
      } else if (requestedDelta > 0 && currentlyLiked) {
        // User already liked! Cannot like twice!
        delta = 0;
        nextLiked = true;
      } else if (requestedDelta < 0 && !currentlyLiked) {
        delta = 0;
        nextLiked = false;
      }
    } else {
      // Toggle
      if (currentlyLiked) {
        set.delete(userId);
        delta = -1;
        nextLiked = false;
      } else {
        set.add(userId);
        delta = 1;
        nextLiked = true;
      }
    }

    const post = memoryPosts.get(postId);
    let currentLikes = post ? post.likeCount : 0;
    if (delta !== 0 && post) {
      post.likeCount = Math.max(0, post.likeCount + delta);
      currentLikes = post.likeCount;
    }

    return {
      liked: nextLiked,
      likeCount: currentLikes,
      delta,
    };
  }
}
