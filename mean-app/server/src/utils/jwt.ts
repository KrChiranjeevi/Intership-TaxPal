import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret123';

export function generateAccessToken(payload: object) {
  const options: SignOptions = { 
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '15m'
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(payload: object) {
  const options: SignOptions = { 
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as any) || '7d'
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
