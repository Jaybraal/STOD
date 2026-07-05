import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { checkSubscriptionAccess } from '../services/subscription';

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
}

export async function verifyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.email = decodedToken.email || '';

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireSubscription(
  action: 'read' | 'write'
) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Desarrollo local: se salta el paywall (nunca en producción, ver .env.example)
      if (process.env.DISABLE_SUBSCRIPTION_GATE === 'true') {
        next();
        return;
      }

      if (!req.uid) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const result = await checkSubscriptionAccess(req.uid, action);

      if (action === 'write' && !result.canWrite) {
        res.status(403).json({
          error: 'Subscription required for this action',
          status: result.status,
        });
        return;
      }

      if (action === 'read' && !result.canRead) {
        res.status(403).json({
          error: 'Trial expired. Subscription required.',
          status: result.status,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Subscription check failed' });
    }
  };
}
