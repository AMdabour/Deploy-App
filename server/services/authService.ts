import jwt from 'jsonwebtoken';
import { DbUser } from '../db';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  expired?: boolean;
  error?: string;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret =
      process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key';
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 minutes
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 days

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn(
        '⚠️  JWT secrets not configured. Using default values. THIS IS NOT SECURE FOR PRODUCTION!'
      );
    }
  }

  private convertTimeToSeconds(time: string): number {
    const match = time.match(/^(\d+)([mhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${time}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(user: DbUser): TokenPair {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
      issuer: 'scheduling-app',
      audience: 'scheduling-app-users',
    });

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
      issuer: 'scheduling-app',
      audience: 'scheduling-app-users',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate only access token (for refresh operations)
   */
  generateAccessToken(user: DbUser): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.convertTimeToSeconds(this.accessTokenExpiry),
      issuer: 'scheduling-app',
      audience: 'scheduling-app-users',
    });
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): TokenValidationResult {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'scheduling-app',
        audience: 'scheduling-app-users',
      }) as TokenPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          expired: true,
          error: 'Access token expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid access token',
        };
      }

      return {
        valid: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): TokenValidationResult {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'scheduling-app',
        audience: 'scheduling-app-users',
      }) as TokenPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          expired: true,
          error: 'Refresh token expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid refresh token',
        };
      }

      return {
        valid: false,
        error: 'Refresh token validation failed',
      };
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded?.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenNearExpiry(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration < fiveMinutesFromNow;
  }
}

// Export singleton instance
export const jwtService = new JWTService();
