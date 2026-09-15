# TaxPal — Technical Architecture

This document describes the technical architecture, component design, data flow, and security mechanisms of the TaxPal application.

---

## 1. System Overview

TaxPal follows a standard multi-tier client-server architecture:

```
[Angular 20 Single Page Application]
                 │
                 │ HTTP / REST API (Relative '/api' endpoints with JWT)
                 ▼
[Express 5 + TypeScript Backend Server]
   ├── Security Middleware (Helmet, CORS, Rate Limiters, Payload Limits)
   ├── Authentication Layer (JWT Access & Refresh Token Validation)
   ├── Domain Modules (Auth, Dashboard, Transactions, Budgets, Tax, Reports, AI)
   └── Centralized Error Handling & Logging
                 │
                 │ Type-Safe Queries & Database Aggregations
                 ▼
[Prisma ORM Client v6]
                 │
                 │ Indexed SQL (PostgreSQL Connection Pooling)
                 ▼
[PostgreSQL Database]
```

In addition, an external REST integration connects the backend to Google Gemini 1.5 Flash via native `fetch` with an 8-second `AbortController` timeout for optional assistive capabilities.

---

## 2. Frontend Architecture (Angular 20)

The frontend is an Angular Single Page Application built using standalone components, TypeScript, and SCSS.

- **Standalone Component Structure**: Components do not rely on NgModules, reducing boilerplate and enabling granular lazy-loading of feature bundles.
- **Directory Layout**:
  - `src/app/core/`: Application-wide singleton services, auth guards, and HTTP interceptors.
  - `src/app/features/`: Feature modules including `dashboard`, `transactions`, `budgets`, `tax-estimator`, `reports`, `settings`, and `auth`.
  - `src/app/layouts/`: Shell layout containing persistent sidebar navigation and top-level user headers.
- **State & Service Layer**: Angular services encapsulate all backend HTTP interactions. Data is managed with standard reactive RxJS streams and Angular Signals for reactive UI bindings without external state management overhead.
- **HTTP Interceptors**:
  - `auth.interceptor.ts`: Automatically attaches `Authorization: Bearer <token>` to outgoing requests. Intercepts 401 Unauthorized responses to transparently trigger token refresh via `/api/auth/refresh-token`, queue failed requests, and retry seamlessly.
- **User Interface & Styling**:
  - Responsive dark-theme design implemented with SCSS custom properties (`--bg-primary: #0f172a`, `--card-bg: #1e293b`, etc.).
  - UI components from Angular Material (`MatDialog`, `MatSnackBar`, `MatSelect`).
  - Charts powered by `Chart.js` and `ng2-charts`.

---

## 3. Backend Architecture (Express 5 + TypeScript)

The backend is built with Node.js and Express 5 using strict TypeScript compilation.

- **Modular Domain Design**: Code is grouped into cohesive domain modules under `src/api/modules/`:
  - `auth` / `user`: User credentials, profile, registration, token issuance.
  - `dashboard`: Multi-period financial metrics and chart aggregations.
  - `transactions`: CRUD, search, filtering, pagination, and database aggregations.
  - `budget`: Monthly category limits and actual spend aggregations.
  - `tax`: Deterministic tax bracket computation and deduction calculations.
  - `reports`: PDFKit and JSON2CSV report generation and file streaming.
  - `ai`: External LLM client, prompt sanitization, response parsing, and fallbacks.
  - `categories` & `notifications`: User preferences and taxonomy.
- **Middleware Pipeline**:
  1. `helmet`: Sets secure HTTP headers (`crossOriginResourcePolicy`, disabling risky inline directives).
  2. `cors`: Restricts origins to configured client addresses (`localhost:4200`, `process.env.CORS_ORIGIN`, `*.vercel.app`) with credentials support.
  3. `express.json({ limit: '1mb' })` & `express.urlencoded({ extended: true, limit: '1mb' })`: Guards against payload DOS.
  4. Universal no-cache middleware (`Cache-Control: no-store`): Prevents browser caching of sensitive financial data.
  5. Route-level rate limiters (`express-rate-limit`): Throttles auth and AI endpoints.
- **Validation**: Schema-based validation guards user inputs before reaching business logic.
- **Centralized Error Handling**: In production mode (`NODE_ENV === 'production'`), generic 500 errors are sanitized to `'Internal server error'`, preventing leakages of stack traces, file system paths, or database internals.

---

## 4. Database Architecture (PostgreSQL + Prisma ORM)

Relational data is stored in PostgreSQL and managed through Prisma ORM v6.

### Data Models & Relationships
- **User**: Root account entity containing email (unique), hashed password, profile attributes, and relation to all user records.
- **RefreshToken**: Stores long-lived session tokens linked to `User`. Enforces cascade deletion when a user is removed.
- **Transaction**: Records financial transactions with `type` (income/expense), `amount`, `category`, `date`, `description`, `notes`, and a foreign key `userId`.
- **Budget**: Defines spending caps per category for a given `month` with foreign key `userId`.
- **Category**: Custom categories created by users.
- **TaxEstimate**: Saved tax calculation results linked to `User`.
- **Report**: Metadata records of generated PDF/CSV files linked to `User`.

### Indexing Strategy
To optimize high-volume queries and prevent full table scans, composite indexes are placed on:
- `Transaction`: `@@index([userId, date])`, `@@index([userId, type])`, `@@index([userId, category])`
- `Budget`: `@@index([userId, month])`
- `TaxEstimate`: `@@index([userId, year])`
- `RefreshToken`: `@@index([userId])`, `@@index([tokenHash])`

### Database-Native Aggregations
Rather than fetching entire recordsets into Node.js memory to compute totals, aggregations delegate computation directly to PostgreSQL:
- Transaction summaries use `prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } })`.
- Budget spending uses `prisma.transaction.aggregate({ where: { userId, type: 'expense', category, date: { gte, lte } }, _sum: { amount: true } })`.

---

## 5. Authentication & Security Flow

The system employs a dual-token JWT architecture:

```
1. Client -> POST /api/auth/login (email + password)
2. Backend verifies bcrypt hash (10 salt rounds)
3. Backend generates:
   - Access Token: Short-lived (15 minutes), signed with JWT_SECRET
   - Refresh Token: Long-lived (7 days), signed with JWT_REFRESH_SECRET
4. Backend stores SHA-256 hash of the Refresh Token in PostgreSQL (never plain text)
5. Client stores access token in memory/localStorage and attaches it via HTTP interceptor
6. Protected routes execute `authMiddleware`:
   - Verifies JWT signature and expiry
   - Attaches decoded `req.user = { id: payload.id, email: payload.email }`
7. When access token expires:
   - Interceptor catches 401 and calls POST /api/auth/refresh-token with refresh token
   - Backend computes SHA-256 hash of presented token, verifies match in database, and verifies expiry
   - Issues a fresh 15-minute access token
8. Logout: Deletes the refresh token record from database, preventing further token renewals
```

### Multi-Tenant Data Isolation
Every database query in the application strictly includes `where: { userId: req.user.id }`. Even if a malicious actor guesses another user's transaction ID, budget ID, or report ID, Prisma queries return `null` or `404 Not Found` because the query condition requires ownership match.

---

## 6. Reports & Export Engine

Financial reporting provides audit-ready physical documentation while maintaining performance and security:
- **Filtered Summary Calculations**: The server computes total income, total expenses, net savings, largest single expense, and top spending category across selected date ranges.
- **PDF Generation**: Built using `pdfkit`. The server constructs a vector document with company headers, date stamps, user metadata, summary metrics, and a tabular listing of filtered transactions.
- **CSV Generation**: Built using `json2csv`. Converts transaction objects into formatted comma-separated values with clear column headers and summary footer rows.
- **Protected File Downloads**: Files are generated in `server/generated_reports/`. Downloads pass through `/api/reports/:id/download`, which queries Prisma to ensure `report.userId === req.user.id` before calling `res.download()`.

---

## 7. Assistive AI Integration

TaxPal integrates Google Gemini 1.5 Flash via REST for three specific advisory functions:
1. **Smart Expense Categorization**: Takes a transaction description and amount, returning the most probable category name and confidence score.
2. **Financial Health Summary**: Takes pre-aggregated totals (income, expenses, net savings rate) and returns an educational 3-4 sentence assessment and up to 3 priority insights.
3. **Tax-Saving & Deduction Suggestions**: Reviews reported income and zero-value deduction items to provide up to 3 common tax deduction areas for user review.

### Why AI is Separated from Financial Calculations
- **Deterministic Math**: Financial computations (tax liabilities, budget remaining, dashboard totals) are executed exclusively by deterministic mathematical logic in TypeScript and SQL.
- **Hallucination Prevention**: The AI model is never allowed to compute tax amounts, change transaction amounts, or auto-apply deductions.
- **Resilience & Privacy**: Financial summaries send only high-level aggregates (no bank account numbers, passwords, or personal names). All AI calls run with an 8-second timeout and provide safe, deterministic fallbacks if the API key is missing or the external service is unavailable.
