import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/authService';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
  token?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // First try JWT token
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (token) {
    const validation = jwtService.validateAccessToken(token);

    if (validation.valid && validation.payload) {
      req.user = {
        id: validation.payload.userId,
        email: validation.payload.email,
        username: validation.payload.username,
      };
      req.token = token;
      return next();
    }

    // Token is invalid or expired
    if (validation.expired) {
      return res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid access token',
      code: 'INVALID_TOKEN',
    });
  }

  // Fallback to session-based auth for backward compatibility
  const userId = (req.session as any)?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  // Add user info from session
  req.user = { id: userId } as any;
  next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Try JWT token first
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (token) {
    const validation = jwtService.validateAccessToken(token);

    if (validation.valid && validation.payload) {
      req.user = {
        id: validation.payload.userId,
        email: validation.payload.email,
        username: validation.payload.username,
      };
      req.token = token;
    }
  } else {
    // Fallback to session
    const userId = (req.session as any)?.userId;
    if (userId) {
      req.user = { id: userId } as any;
    }
  }

  next();
}

export function requireRefreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token required',
      code: 'REFRESH_TOKEN_REQUIRED',
    });
  }

  const validation = jwtService.validateRefreshToken(refreshToken);

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: validation.error || 'Invalid refresh token',
      code: validation.expired
        ? 'REFRESH_TOKEN_EXPIRED'
        : 'INVALID_REFRESH_TOKEN',
    });
  }

  req.user = {
    id: validation.payload!.userId,
    email: validation.payload!.email,
    username: validation.payload!.username,
  };

  next();
}
