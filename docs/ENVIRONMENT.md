# TaxPal — Environment Configuration Guide

This document describes all environment variables used by the TaxPal application across backend and frontend environments.

---

## 1. Backend Variables (`mean-app/server/.env`)

These variables configure the Node.js/Express server and Prisma ORM.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Runtime mode. Set to `production` in live deployments to sanitize 500 errors. |
| `PORT` | No | `5000` | Port number on which the Express server listens. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public` |
| `CORS_ORIGIN` | Yes | `http://localhost:4200` | Allowed client origin. Supports custom domains and `*.vercel.app`. |
| `JWT_SECRET` | Yes | — | Secret string used to sign short-lived access tokens (15m). |
| `JWT_REFRESH_SECRET` | Yes | — | Secret string used to sign long-lived refresh tokens (7d). |
| `JWT_EXPIRES_IN` | No | `15m` | Token expiry duration for access tokens. |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Expiry duration for refresh tokens. |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Salt rounds for password hashing. |
| `PASSWORD_RESET_EXPIRES_MINUTES`| No | `15` | Expiry window for password reset tokens. |
| `AI_API_KEY` | Optional | — | Google Gemini API key. If omitted, AI endpoints gracefully return default notices. |

### Sample Backend `.env`
```ini
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taxpal_db?schema=public"
CORS_ORIGIN="http://localhost:4200"
JWT_SECRET="dev-jwt-access-secret-key-minimum-32-chars-long"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-key-minimum-32-chars-long"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10
PASSWORD_RESET_EXPIRES_MINUTES=15
AI_API_KEY="AIzaSyYourActualKeyHere"
```

---

## 2. Frontend Configuration (`mean-app/client/src/environments`)

The Angular client uses environment files replaced at build time via `angular.json`:

- **Development (`src/environments/environment.ts`)**:
```typescript
export const environment = {
  production: false,
  apiUrl: '/api'
};
```
- **Production (`src/environments/environment.prod.ts`)**:
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'
};
```

Because `apiUrl: '/api'` uses a relative path:
1. In local development, `proxy.conf.json` transparently forwards `/api` requests to `http://localhost:5000`.
2. In production deployments (e.g. Vercel monolithic deployment), `/api/*` is routed directly to serverless endpoints without CORS cross-origin complexities.

---

## 3. Security Rules
- **Never commit `.env` files**: All `.env`, `*.env`, and `.env.local` files are strictly excluded by `.gitignore`.
- **Use `.env.example` as a template**: Placeholders must be used when documenting variables.
- **Rotate secrets**: Keep access and refresh token secrets distinct and random (at least 256 bits of entropy in production).
