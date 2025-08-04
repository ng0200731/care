import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: 'ADMIN' | 'USER';
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin-only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Resource ownership middleware (for user-specific resources)
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins can access all resources
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // For regular users, we'll check ownership in the route handler
    // This middleware just ensures they're authenticated
    next();
  };
};
