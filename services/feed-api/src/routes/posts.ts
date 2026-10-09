import { Router, Request, Response } from 'express';
import { DataService } from '../services/firestore.js';
import { counterService } from '../services/redis.js';

export const postsRouter = Router();

postsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await DataService.getPosts();
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

postsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await DataService.getPost(req.params.id as string);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json({ post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

postsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorId, caption, mediaType, mediaUrl, rawUrl, status } = req.body;
    if (!authorId || (!mediaUrl && !rawUrl)) {
      res.status(400).json({ error: 'authorId and media are required' });
      return;
    }

    const post = await DataService.createPost({
      authorId,
      caption: caption || '',
      mediaType: mediaType || 'image',
      mediaUrl: mediaUrl || rawUrl,
      rawUrl,
      thumbnailUrl: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      status: status || (mediaType === 'video' ? 'PROCESSING' : 'READY'),
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Atomic Like counter increment using Redis Distributed Counter with single-user restriction.
 */
postsRouter.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.body.userId || req.user?.uid || (req.headers['x-user-id'] as string) || 'u1';
    const requestedDelta = req.body.delta !== undefined ? req.body.delta : undefined;

    const result = await counterService.toggleLike(postId, userId, requestedDelta);

    res.json({
      postId,
      userId,
      liked: result.liked,
      likeCount: result.likeCount,
      delta: result.delta,
      mechanism: 'Atomic Redis INCR (Flushed to Firestore in micro-batches)',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

postsRouter.get('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await DataService.getComments(req.params.id as string);
    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

postsRouter.post('/:id/comment', async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const { userId, content } = req.body;
    if (!userId || !content) {
      res.status(400).json({ error: 'userId and content are required' });
      return;
    }

    const comment = await DataService.addComment(postId, userId, content);
    res.status(201).json({ comment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a post (Restricted to post owner only).
 */
postsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = (req.headers['x-user-id'] as string) || req.user?.uid || (req.query.userId as string) || 'u1';

    const result = await DataService.deletePost(postId, userId);
    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
      res.status(statusCode).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Post deleted successfully',
      postId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
