import { Router, Request, Response } from 'express';
import { DataService } from '../services/firestore.js';
import { FeedRankingEngine } from '../services/ranking.js';

export const feedRouter = Router();

/**
 * Returns algorithmically ranked timeline feed for active user.
 */
feedRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const viewerId = (req.query.viewerId as string) || 'u1';
    const viewer = (await DataService.getUser(viewerId)) || {
      id: viewerId,
      username: 'user',
      displayName: 'User',
      avatarUrl: '',
      followerCount: 0,
      followingCount: 0,
      isCelebrity: false,
      interests: [],
      following: [],
    };

    const rawPosts = await DataService.getPosts();

    // Filter only READY posts (exclude those still being transcoded or flagged)
    const readyPosts = rawPosts.filter(p => p.status === 'READY');

    // Run Algorithmic Heuristic Ranking Engine with viewer profile
    const rankedPosts = FeedRankingEngine.rankPosts(readyPosts, viewer);

    // Attach user-specific like state for the active viewer
    for (const p of rankedPosts) {
      p.isLiked = DataService.hasUserLiked(p.id, viewerId);
    }

    res.json({
      viewerId,
      totalCount: rankedPosts.length,
      rankingFormula: 'Score = ( (Log10(Likes)*110 + Log10(Comments)*70) + AffinityBonus ) / ( (HoursElapsed + 2) ^ 1.2 )',
      feed: rankedPosts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
