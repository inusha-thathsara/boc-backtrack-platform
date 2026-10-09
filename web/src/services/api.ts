export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  isCelebrity: boolean;
}

export interface RankingFactors {
  likes: number;
  comments: number;
  hoursElapsed: number;
  affinityBonus: number;
  finalScore: number;
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

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

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

  async getStories(): Promise<CreatorStoryGroup[]> {
    const res = await fetch(`${API_BASE}/stories`);
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

  async likePost(postId: string, delta: number = 1): Promise<number> {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    const data = await res.json();
    return data.likeCount;
  },

  async requestSignedUploadUrl(filename: string, contentType: string, mediaCategory: 'posts' | 'stories') {
    const res = await fetch(`${API_BASE}/media/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType, mediaCategory }),
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
};
