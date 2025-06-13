import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { UserSchema } from '../../shared/schema';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import {
  requireAuth,
  requireRefreshToken,
  AuthenticatedRequest,
} from '../middleware/auth';
import { jwtService } from '../services/authService';

const router = Router();

// Registration schema
const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().default('UTC'),
  deviceInfo: z.string().optional(),
});

// Login schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceInfo: z.string().optional(),
  rememberMe: z.boolean().default(false),
});

// Refresh token schema
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/auth/register
router.post(
  '/register',
  validateRequest(RegisterSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, username, password, firstName, lastName, timezone } =
        req.body;

      // Check if user already exists
      const existingUser = await storage.users.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      const existingUsername = await storage.users.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken',
        });
      }

      // Create new user
      const user = await storage.users.createUser({
        email,
        username,
        password,
        firstName,
        lastName,
        timezone,
      } as Omit<Parameters<typeof storage.users.createUser>[0], never>);

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await storage.refreshTokens.storeRefreshToken({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry,
        revoked: false,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      });

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      // Also store user session for backward compatibility
      (req.session as any).userId = user.id;

      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: 'Bearer',
          expiresIn: 900, // 15 minutes in seconds
          refreshExpiresIn: 604800, // 7 days in seconds
        },
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validateRequest(LoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, deviceInfo, rememberMe } = req.body;

      const user = await storage.users.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      // Store refresh token with longer expiry if "remember me" is checked
      const refreshTokenExpiry = rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await storage.refreshTokens.storeRefreshToken({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: refreshTokenExpiry,
        revoked: false,
        deviceInfo: deviceInfo || 'Unknown device',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      });

      // Store user session for backward compatibility
      (req.session as any).userId = user.id;

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      res.json({
        success: true,
        data: {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: 'Bearer',
          expiresIn: 900, // 15 minutes in seconds
          refreshExpiresIn: rememberMe ? 2592000 : 604800, // 30 days or 7 days
        },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validateRequest(RefreshTokenSchema),
  requireRefreshToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.id;

      // Check if refresh token exists in database and is not revoked
      const storedToken = await storage.refreshTokens.getRefreshToken(
        refreshToken
      );
      if (
        !storedToken ||
        storedToken.revoked ||
        storedToken.expiresAt < new Date()
      ) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        });
      }

      // Get user data
      const user = await storage.users.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Generate new access token
      const newAccessToken = jwtService.generateAccessToken(user);

      // Optionally rotate refresh token (recommended for security)
      let newRefreshToken = refreshToken;
      if (jwtService.isTokenNearExpiry(refreshToken)) {
        // Generate new refresh token
        const tokens = jwtService.generateTokenPair(user);
        newRefreshToken = tokens.refreshToken;

        // Revoke old refresh token
        await storage.refreshTokens.revokeRefreshToken(refreshToken);

        // Store new refresh token
        await storage.refreshTokens.storeRefreshToken({
          userId: user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false,
          deviceInfo: storedToken.deviceInfo,
          ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        });
      }

      const { passwordHash, ...userResponse } = user;

      res.json({
        success: true,
        data: {
          user: userResponse,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenType: 'Bearer',
          expiresIn: 900, // 15 minutes in seconds
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/logout
router.post(
  '/logout',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const token = req.token;

      // If there's a refresh token in the request, revoke it
      const { refreshToken } = req.body;
      if (refreshToken) {
        await storage.refreshTokens.revokeRefreshToken(refreshToken);
      }

      // Destroy session for backward compatibility
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/logout-all
router.post(
  '/logout-all',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Revoke all refresh tokens for the user
      const revokedCount = await storage.refreshTokens.revokeAllUserTokens(
        userId
      );

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      res.clearCookie('connect.sid');
      res.json({
        success: true,
        data: { devicesLoggedOut: revokedCount },
        message: `Logged out from all devices (${revokedCount} sessions terminated)`,
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.users.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const { passwordHash, ...userResponse } = user;

      // Include token information if available
      const tokenInfo = req.token
        ? {
            tokenExpiry: jwtService.getTokenExpiration(req.token),
            tokenNearExpiry: jwtService.isTokenNearExpiry(req.token),
          }
        : null;

      res.json({
        success: true,
        data: {
          user: userResponse,
          tokenInfo,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// GET /api/auth/sessions
router.get(
  '/sessions',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const sessions = await storage.refreshTokens.getRefreshTokensByUser(
        userId
      );

      const activeSessions = sessions
        .filter((session) => !session.revoked && session.expiresAt > new Date())
        .map((session) => ({
          id: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          current: false, // Will be determined by current token
        }));

      res.json({
        success: true,
        data: {
          sessions: activeSessions,
          totalSessions: activeSessions.length,
        },
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// DELETE /api/auth/sessions/:sessionId
router.delete(
  '/sessions/:sessionId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      // Get the session to verify ownership
      const sessions = await storage.refreshTokens.getRefreshTokensByUser(
        userId
      );
      const targetSession = sessions.find((s) => s.id === sessionId);

      if (!targetSession) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      // Revoke the refresh token
      await storage.refreshTokens.revokeRefreshToken(targetSession.token);

      res.json({
        success: true,
        message: 'Session terminated successfully',
      });
    } catch (error) {
      console.error('Terminate session error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;
