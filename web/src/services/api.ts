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

export interface RankingFactors {
  likes: number;
  comments: number;
  hoursElapsed: number;
  affinityBonus: number;
  finalScore: number;
  personalizationReason?: string;
  isOwnPost?: boolean;
  isFollowing?: boolean;
  interestMatch?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  caption: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  hlsUrl?: string;
  thumbnailUrl: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FLAGGED';
  likeCount: number;
  commentCount: number;
  createdAt: number;
  score?: number;
  rankingFactors?: RankingFactors;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  authorId: string;
  author?: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
  remainingHours?: number;
}

export interface CreatorStoryGroup {
  user: User;
  stories: Story[];
}

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

export function resolveMediaUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // In local development, route any Cloud Run uploads through local Vite proxy
  if (!API_BASE.startsWith('https://')) {
    if (url.includes('/media/uploads/')) {
      return url.substring(url.indexOf('/media/uploads/'));
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/media/uploads/')) {
    if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
      const apiHost = API_BASE.replace(/\/api\/?$/, '');
      return `${apiHost}${url}`;
    }
    return url;
  }
  return url;
}

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    const data = await res.json();
    return data.users || [];
  },

  async getFeed(viewerId: string = 'u1'): Promise<{ feed: Post[]; formula: string }> {
    const res = await fetch(`${API_BASE}/feed?viewerId=${viewerId}`);
    const data = await res.json();
    return { feed: data.feed || [], formula: data.rankingFormula || '' };
  },

  async getStories(viewerId: string = 'u1'): Promise<CreatorStoryGroup[]> {
    const res = await fetch(`${API_BASE}/stories?viewerId=${viewerId}`);
    const data = await res.json();
    return data.creatorsWithStories || [];
  },

  async createStory(authorId: string, mediaUrl: string, mediaType: 'image' | 'video'): Promise<Story> {
    const res = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId, mediaUrl, mediaType }),
    });
    const data = await res.json();
    return data.story;
  },

  async likePost(postId: string, delta?: number, userId: string = 'u1'): Promise<{ liked: boolean; likeCount: number; delta?: number }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ delta, userId }),
    });
    const data = await res.json();
    return {
      liked: Boolean(data.liked),
      likeCount: typeof data.likeCount === 'number' ? data.likeCount : 0,
      delta: data.delta,
    };
  },

  async requestSignedUploadUrl(filename: string, contentType: string, mediaCategory: 'posts' | 'stories') {
    const res = await fetch(`${API_BASE}/media/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType, mediaCategory }),
    });
    return res.json();
  },

  async uploadMediaDirect(payload: {
    filename: string;
    contentType: string;
    dataBase64: string;
    mediaCategory: 'posts' | 'stories';
  }): Promise<{ status: string; mediaUrl: string; publicUrl: string; fileId: string }> {
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async createPost(payload: {
    authorId: string;
    caption: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    rawUrl?: string;
  }): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.post;
  },

  async getComments(postId: string) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
    const data = await res.json();
    return data.comments || [];
  },

  async addComment(postId: string, userId: string, content: string) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content }),
    });
    const data = await res.json();
    return data.comment;
  },

  async deletePost(postId: string, userId: string = 'u1'): Promise<boolean> {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    return res.ok;
  },
};
