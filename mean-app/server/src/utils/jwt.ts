// import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';


const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret123';

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';

export function generateAccessToken(payload: { userId: string }) {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(payload: { userId: string }) {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
