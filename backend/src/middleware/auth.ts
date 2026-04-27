import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth';
import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export default function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ error: 'Server auth configuration is missing' });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
