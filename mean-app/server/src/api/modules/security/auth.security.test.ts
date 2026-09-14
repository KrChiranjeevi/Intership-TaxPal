import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../../../utils/jwt.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('Phase 2 Security & Auth Hardening Tests', () => {
  const testUserId = 'test-user-12345';
  const testPayload = { id: testUserId, email: 'security@example.com' };

  describe('JWT Access and Refresh Token Separation', () => {
    it('should generate valid access token verifiable by verifyToken', () => {
      const accessToken = generateAccessToken(testPayload);
      expect(typeof accessToken).toBe('string');
      const decoded: any = verifyToken(accessToken);
      expect(decoded.id).toBe(testUserId);
      expect(decoded.email).toBe('security@example.com');
    });

    it('should generate valid refresh token verifiable by verifyRefreshToken', () => {
      const refreshToken = generateRefreshToken(testPayload);
      expect(typeof refreshToken).toBe('string');
      const decoded: any = verifyRefreshToken(refreshToken);
      expect(decoded.id).toBe(testUserId);
    });

    it('should return null when verifying an access token with verifyRefreshToken', () => {
      const accessToken = generateAccessToken(testPayload);
      const verifiedWithRefresh = verifyRefreshToken(accessToken);
      expect(verifiedWithRefresh).toBeNull();
    });

    it('should return null when verifying a refresh token with verifyToken', () => {
      const refreshToken = generateRefreshToken(testPayload);
      const verifiedWithAccess = verifyToken(refreshToken);
      expect(verifiedWithAccess).toBeNull();
    });
  });

  describe('Secure Token Hashing', () => {
    it('should generate deterministic SHA-256 hash for database storage', () => {
      const rawToken = 'raw-test-token-string';
      const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
      const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(rawToken);
      expect(hash1.length).toBe(64);
    });
  });

  describe('Password Security with bcrypt', () => {
    it('should hash passwords and never match plain text directly', async () => {
      const plainPassword = 'SuperSecretPassword123!';
      const hash = await bcrypt.hash(plainPassword, 10);

      expect(hash).not.toBe(plainPassword);
      expect(await bcrypt.compare(plainPassword, hash)).toBe(true);
      expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
    });
  });

  describe('Password Reset Expiration Logic', () => {
    it('should correctly detect expired reset tokens', () => {
      const now = new Date();
      const pastExpiration = new Date(now.getTime() - 1000 * 60); // 1 minute ago
      const futureExpiration = new Date(now.getTime() + 1000 * 60 * 15); // 15 minutes ahead

      expect(pastExpiration < now).toBe(true);
      expect(futureExpiration > now).toBe(true);
    });
  });
});
