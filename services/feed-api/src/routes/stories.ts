import { Router, Request, Response } from 'express';
import { DataService } from '../services/firestore.js';

export const storiesRouter = Router();

/**
 * Returns active ephemeral stories (within 24-hour expiration window).
 */
storiesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const stories = await DataService.getActiveStories();
    
    // Group stories by author for the Stories Tray UI
    const groupedStories = new Map<string, { user: any; stories: any[] }>();
    
    for (const story of stories) {
      if (!story.author) continue;
      const authorId = story.author.id;
      if (!groupedStories.has(authorId)) {
        groupedStories.set(authorId, {
          user: story.author,
          stories: [],
        });
      }
      groupedStories.get(authorId)!.stories.push({
        ...story,
        remainingHours: Math.max(0, parseFloat(((story.expiresAt - Date.now()) / (1000 * 60 * 60)).toFixed(1))),
      });
    }

    const viewerId = (req.query.viewerId as string) || 'u1';
    const viewer = await DataService.getUser(viewerId);
    const following = viewer?.following || [];

    const sortedCreators = Array.from(groupedStories.values()).sort((a, b) => {
      if (a.user.id === viewerId) return -1;
      if (b.user.id === viewerId) return 1;
      const aFollowing = following.includes(a.user.id);
      const bFollowing = following.includes(b.user.id);
      if (aFollowing && !bFollowing) return -1;
      if (!aFollowing && bFollowing) return 1;
      return 0;
    });

    res.json({
      activeStoriesCount: stories.length,
      creatorsWithStories: sortedCreators,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Creates an ephemeral story with 24-hour TTL expiration.
 */
storiesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorId, mediaUrl, mediaType } = req.body;
    if (!authorId || !mediaUrl) {
      res.status(400).json({ error: 'authorId and mediaUrl are required' });
      return;
    }

    const story = await DataService.createStory({
      authorId,
      mediaUrl,
      mediaType: mediaType || 'image',
    });

    res.status(201).json({
      message: 'Ephemeral story published. Expires in 24 hours.',
      story,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
