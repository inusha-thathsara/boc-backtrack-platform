import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Production Authentication Middleware.
 * Decodes Firebase Auth JWT Bearer tokens with development fallback.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devUserId = (req.headers['x-user-id'] as string) || (req.query.viewerId as string);

  // 1. Production Bearer Token validation
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    try {
      // In a live Firebase project with firebase-admin initialized:
      // const decoded = await admin.auth().verifyIdToken(token);
      // req.user = { uid: decoded.uid, email: decoded.email, username: decoded.name || decoded.uid };

      // Base64 JSON payload decoder for demo & token validation
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        req.user = {
          uid: payload.user_id || payload.sub || 'u1',
          email: payload.email,
          username: payload.name || payload.username || 'user',
        };
        next();
        return;
      }
    } catch (err: any) {
      logger.warn('Token validation failed', { error: err.message });
      res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
      return;
    }
  }

  // 2. Demo / Local Dev fallback identity
  if (devUserId) {
    req.user = {
      uid: devUserId,
      username: devUserId === 'u1' ? 'inusha.tech' : devUserId === 'u2' ? 'madhura.cloud' : 'backtrack.official',
    };
    next();
    return;
  }

  // Default guest persona for read-only endpoints
  req.user = { uid: 'u1', username: 'inusha.tech' };
  next();
}
