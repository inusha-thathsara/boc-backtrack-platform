import { db } from '../config/gcp.js';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  isCelebrity: boolean;
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
    },
  ],
  [
    'u3',
    {
      id: 'u3',
      username: 'backtrack.official',
      displayName: 'Team BackTrack',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      followerCount: 850000,
      followingCount: 50,
      isCelebrity: true,
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
    },
  ],
]);

const memoryPosts: Map<string, Post> = new Map([
  [
    'p1',
    {
      id: 'p1',
      authorId: 'u3',
      caption: 'Scaling to millions on Google Cloud Platform! Check out our decoupled HLS streaming pipeline 🚀 #BOC2 #CloudRun #GCP',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
      status: 'READY',
      likeCount: 12450,
      commentCount: 412,
      createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    },
  ],
  [
    'p2',
    {
      id: 'p2',
      authorId: 'u1',
      caption: 'Live demo testing: Direct Cloud Storage signed URL uploads bypass API servers completely. Zero bottlenecks! ⚡',
      mediaType: 'video',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400',
      status: 'READY',
      likeCount: 890,
      commentCount: 45,
      createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    },
  ],
  [
    'p3',
    {
      id: 'p3',
      authorId: 'u2',
      caption: 'Distributed Redis counters flush atomic like increments in micro-batches every 5 seconds. No Firestore lock contention!',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      status: 'READY',
      likeCount: 520,
      commentCount: 28,
      createdAt: Date.now() - 1000 * 60 * 300, // 5 hours ago
    },
  ],
]);

const memoryStories: Map<string, Story> = new Map([
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
      mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
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
]);

const memoryComments: Map<string, Comment[]> = new Map([
  [
    'p1',
    [
      { id: 'c1', postId: 'p1', userId: 'u1', content: 'Incredible architecture team!', createdAt: Date.now() - 1000 * 60 * 30 },
      { id: 'c2', postId: 'p1', userId: 'u2', content: 'Serverless Cloud Run + FFmpeg is lightning fast.', createdAt: Date.now() - 1000 * 60 * 15 },
    ],
  ],
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
    // Populate authors
    for (const post of posts) {
      post.author = await this.getUser(post.authorId);
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
          return post;
        }
      } catch {}
    }
    const p = memoryPosts.get(postId);
    if (p) p.author = await this.getUser(p.authorId);
    return p;
  }

  static async createPost(post: Omit<Post, 'id' | 'createdAt' | 'likeCount' | 'commentCount'>): Promise<Post> {
    const newPost: Post = {
      ...post,
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

  static async incrementLikes(postId: string, delta: number = 1): Promise<number> {
    const post = memoryPosts.get(postId);
    if (post) {
      post.likeCount = Math.max(0, post.likeCount + delta);
      return post.likeCount;
    }
    return 0;
  }
}
