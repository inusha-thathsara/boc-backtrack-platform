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
    const rawPosts = await DataService.getPosts();

    // Filter only READY posts (exclude those still being transcoded or flagged)
    const readyPosts = rawPosts.filter(p => p.status === 'READY');

    // Run Algorithmic Heuristic Ranking Engine
    const rankedPosts = FeedRankingEngine.rankPosts(readyPosts, viewerId);

    res.json({
      viewerId,
      totalCount: rankedPosts.length,
      rankingFormula: 'Score = ( (Likes * 1.0) + (Comments * 2.5) + AffinityBonus ) / ( (HoursElapsed + 2) ^ 1.5 )',
      feed: rankedPosts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
