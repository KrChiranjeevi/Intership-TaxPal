import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

const getJwtSecret = (): Secret => process.env.JWT_SECRET || 'taxpal-access-token-secret-default-2026';
const getJwtRefreshSecret = (): Secret => process.env.JWT_REFRESH_SECRET || 'taxpal-refresh-token-secret-default-2026';

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';

export function generateAccessToken(payload: { userId: string }): string {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES_IN as any };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function generateRefreshToken(payload: { userId: string }): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_IN as any };
  return jwt.sign(payload, getJwtRefreshSecret(), options);
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getJwtRefreshSecret()) as { userId: string };
  } catch {
    return null;
  }
}