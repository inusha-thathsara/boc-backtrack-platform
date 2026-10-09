import { Post, User } from './firestore.js';

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

export class FeedRankingEngine {
  /**
   * Computes the algorithmic ranking score using normalized engagement + multi-signal user affinity heuristic.
   * Score = ( NormalizedEngagement + AffinityBonus ) / ( (HoursElapsed + 2) ^ 1.2 )
   */
  static computeScore(post: Post, viewer: User | string = 'u1'): RankingFactors {
    const now = Date.now();
    const hoursElapsed = Math.max(0, (now - post.createdAt) / (1000 * 60 * 60));

    const viewerUser: User = typeof viewer === 'object' && viewer !== null
      ? viewer
      : {
          id: typeof viewer === 'string' ? viewer : 'u1',
          username: 'user',
          displayName: 'User',
          avatarUrl: '',
          followerCount: 0,
          followingCount: 0,
          isCelebrity: false,
          interests: [],
          following: [],
        };

    // 1. Normalized non-linear engagement base score
    // Prevents extreme viral posts from completely blinding personalization signals
    const engagementScore =
      Math.log10(Math.max(1, post.likeCount) + 1) * 110 +
      Math.log10(Math.max(1, post.commentCount) + 1) * 70;

    let affinityBonus = 0;
    let personalizationReason = 'Recommended for you';
    let isOwnPost = false;
    let isFollowing = false;
    let interestMatch = false;

    // Signal A: Author's Own Post (Strongest Personalization: user sees their own creations at top of their profile/feed)
    if (post.authorId === viewerUser.id) {
      affinityBonus += 650;
      isOwnPost = true;
      personalizationReason = 'Your Post';
    }

    // Signal B: Social Graph Following Relationship
    if (viewerUser.following?.includes(post.authorId)) {
      affinityBonus += 380;
      isFollowing = true;
      personalizationReason = `Following @${post.author?.username || 'creator'}`;
    }

    // Signal C: Topic / Hashtag Interest Affinity
    const captionLower = (post.caption || '').toLowerCase();
    const matchedInterest = viewerUser.interests?.find(tag =>
      captionLower.includes(tag.toLowerCase())
    );

    if (matchedInterest) {
      affinityBonus += 300;
      interestMatch = true;
      if (isOwnPost) {
        personalizationReason = `Your Post • ${matchedInterest}`;
      } else if (isFollowing) {
        personalizationReason = `Following @${post.author?.username || 'creator'} • ${matchedInterest}`;
      } else {
        personalizationReason = `Recommended for ${matchedInterest}`;
      }
    }

    // Signal D: High-engagement Platform Verified Account
    if (post.author?.isCelebrity) {
      affinityBonus += 90;
      if (!isOwnPost && !isFollowing && !interestMatch) {
        personalizationReason = 'Trending on BackTrack';
      }
    }

    const timeDecayDenominator = Math.pow(hoursElapsed + 2, 1.2);
    const finalScore = parseFloat(
      ((engagementScore + affinityBonus) / timeDecayDenominator).toFixed(2)
    );

    return {
      likes: post.likeCount,
      comments: post.commentCount,
      hoursElapsed: parseFloat(hoursElapsed.toFixed(2)),
      affinityBonus,
      finalScore,
      personalizationReason,
      isOwnPost,
      isFollowing,
      interestMatch,
    };
  }

  /**
   * Sorts posts according to their algorithmic score for the active viewer.
   */
  static rankPosts(posts: Post[], viewer: User | string = 'u1'): (Post & { rankingFactors: RankingFactors })[] {
    const scored = posts.map(post => {
      const factors = this.computeScore(post, viewer);
      return {
        ...post,
        score: factors.finalScore,
        rankingFactors: factors,
      };
    });

    return scored.sort((a, b) => b.rankingFactors.finalScore - a.rankingFactors.finalScore);
  }
}
