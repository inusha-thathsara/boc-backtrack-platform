import { Post } from './firestore.js';

export interface RankingFactors {
  likes: number;
  comments: number;
  hoursElapsed: number;
  affinityBonus: number;
  finalScore: number;
}

export class FeedRankingEngine {
  /**
   * Computes the algorithmic ranking score using a time-decayed engagement heuristic.
   * Score = ( (Likes * 1.0) + (Comments * 2.5) + AffinityBonus ) / ( (HoursElapsed + 2) ^ 1.5 )
   */
  static computeScore(post: Post, viewerId: string = 'u1'): RankingFactors {
    const now = Date.now();
    const hoursElapsed = Math.max(0, (now - post.createdAt) / (1000 * 60 * 60));

    // Affinity bonus (creator followed or high engagement platform account)
    let affinityBonus = 20;
    if (post.author?.isCelebrity) {
      affinityBonus = 50;
    }
    if (post.authorId === viewerId) {
      affinityBonus = 10;
    }

    const engagementNumerator = (post.likeCount * 1.0) + (post.commentCount * 2.5) + affinityBonus;
    const timeDecayDenominator = Math.pow(hoursElapsed + 2, 1.5);
    const finalScore = parseFloat((engagementNumerator / timeDecayDenominator).toFixed(2));

    return {
      likes: post.likeCount,
      comments: post.commentCount,
      hoursElapsed: parseFloat(hoursElapsed.toFixed(2)),
      affinityBonus,
      finalScore,
    };
  }

  /**
   * Sorts posts according to their algorithmic score.
   */
  static rankPosts(posts: Post[], viewerId: string = 'u1'): (Post & { rankingFactors: RankingFactors })[] {
    const scored = posts.map(post => {
      const factors = this.computeScore(post, viewerId);
      return {
        ...post,
        score: factors.finalScore,
        rankingFactors: factors,
      };
    });

    return scored.sort((a, b) => b.rankingFactors.finalScore - a.rankingFactors.finalScore);
  }
}
