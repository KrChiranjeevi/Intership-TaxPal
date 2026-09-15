# TaxPal — Technical Deep-Dive Interview Q&A

This document contains in-depth, interview-ready answers covering architectural decisions, security implementations, database design, and real engineering challenges encountered during development.

---

## 1. Architecture & Design

### Q: Why did you choose Angular for the frontend?
**A:** Angular provides a comprehensive, opinionated framework ideal for structured financial applications. It offers built-in TypeScript support, robust form validation, and powerful HTTP interceptors out of the box. Using standalone components in Angular 20 keeps the architecture modular and cleanly separated without legacy NgModule overhead.

### Q: Why Node.js and Express for the backend?
**A:** Node.js with Express provides a lightweight, non-blocking I/O event-driven environment that handles concurrent HTTP requests efficiently. Its modular middleware pipeline made it easy to plug in Helmet, CORS, rate limiting, and JWT authentication. Combined with TypeScript, it provides full type-safety across both ends of the wire.

### Q: Why TypeScript throughout the entire stack?
**A:** Using TypeScript across both the frontend and backend eliminates entire classes of runtime errors through static type-checking. Data contracts (such as transaction filters, report preview schemas, and tax calculation inputs) are strongly typed, ensuring that changes to backend models immediately alert the frontend developer during compilation.

### Q: How is the frontend connected to the backend?
**A:** The frontend communicates with the backend exclusively over REST APIs using JSON payloads. All frontend services use relative `/api` paths. In development, Angular's `proxy.conf.json` transparently proxies requests to `http://localhost:5000`. In production, the single-origin deployment or reverse proxy routes `/api` to the Express server, eliminating CORS preflight overhead.

---

## 2. Authentication & Security

### Q: How does authentication work in TaxPal?
**A:** When a user logs in, their password is verified against the stored bcrypt hash (10 salt rounds). If valid, the server issues two tokens:
1. **Access Token**: A signed JWT containing user ID and email with a short 15-minute expiration time.
2. **Refresh Token**: A cryptographically random JWT with a 7-day expiration time.

The server computes a SHA-256 hash of the refresh token and stores the hash in the `RefreshToken` PostgreSQL table. On subsequent API calls, an HTTP interceptor attaches the access token. If the access token expires (401 response), the interceptor automatically calls `/api/auth/refresh-token` with the refresh token to receive a fresh access token without interrupting the user.

### Q: Why do you store the SHA-256 hash of the refresh token instead of the token itself?
**A:** If the database were ever compromised, storing raw refresh tokens would allow an attacker to forge sessions and impersonate users for up to 7 days. Storing only a one-way cryptographic SHA-256 hash prevents offline token theft while still allowing the server to verify valid presented tokens by hashing them upon arrival.

### Q: How do you prevent Insecure Direct Object References (IDOR)?
**A:** Every database query in the application strictly filters by the authenticated user's ID (`req.user.id`). For example, updating a transaction uses:
```typescript
await prisma.transaction.updateMany({
  where: { id: transactionId, userId: req.user.id },
  data: { ... }
});
```
Even if User A knows the UUID of User B's transaction, budget, or report, the query affects 0 rows and returns a `404 Not Found`.

### Q: How did you secure physical report downloads?
**A:** When generating a PDF or CSV report, the server stores the file in a private directory (`server/generated_reports/`) and records metadata in the `Report` table with `userId`. Downloads are routed through `/api/reports/:id/download`, which verifies `report.userId === req.user.id` before executing `res.download()`. Files are never exposed via public static directories.

### Q: Why did you use Helmet and body parser payload limits?
**A:** `helmet` applies security headers including `Cross-Origin-Resource-Policy` and disables vulnerable browser features. Body parser payload limits (`express.json({ limit: '1mb' })`) prevent denial-of-service memory exhaustion attacks caused by malicious clients sending excessively large JSON payloads.

---

## 3. Database & Query Optimization

### Q: What database models are used and how are they related?
**A:** The database contains 8 core models managed by Prisma:
- `User`: Primary user entity with unique `email`.
- `RefreshToken`: Stores `tokenHash` and `expiresAt`, with `onDelete: Cascade` linked to `User`.
- `Transaction`: Stores `amount`, `type`, `category`, `date`, `userId`.
- `Budget`: Stores `category`, `amount`, `month`, `userId`.
- `Category`: User custom categories with colors and types.
- `TaxEstimate`: Historical calculation snapshots linked to `User`.
- `Report`: Metadata for generated documents.
- `UserNotificationSetting`: Notification preferences per user.

### Q: Where and why did you optimize database queries?
**A:** In the Transactions module, summary metrics (total income, total expenses, net balance) were initially calculated by querying all matching transactions and reducing them in JavaScript memory. For users with thousands of transactions, this caused memory bloat and high latency. I optimized this to use database-native grouping:
```typescript
const summaryAgg = await prisma.transaction.groupBy({
  by: ['type'],
  where,
  _sum: { amount: true },
});
```
This offloads the arithmetic directly to PostgreSQL and returns just two summary rows.

### Q: What database indexes did you add and why?
**A:** I added composite indexes to support frequent query filter combinations:
- `Transaction`: `@@index([userId, date])`, `@@index([userId, type])`, `@@index([userId, category])`
- `Budget`: `@@index([userId, month])`
- `TaxEstimate`: `@@index([userId, year])`

Because every query starts with `where: { userId }`, composite indexes allow PostgreSQL to perform fast index range scans rather than full table scans.

---

## 4. Feature Implementation Details

### Q: How does transaction filtering and server-side pagination work?
**A:** The frontend sends query parameters: `page`, `limit`, `search`, `type`, `category`, `startDate`, `endDate`. The backend constructs a dynamic Prisma `where` object with case-insensitive `contains` for search and ISO date bounds for dates. It runs `prisma.transaction.count({ where })` and `prisma.transaction.findMany({ skip: (page - 1) * limit, take: limit })` concurrently, returning paginated records and metadata.

### Q: How do you prevent frontend race conditions during rapid filtering?
**A:** In `transactions.component.ts`, rapid typing or fast pagination clicking could trigger multiple asynchronous HTTP requests that might resolve out of order. I solved this by tracking `loadTxSubscription` and actively calling `this.loadTxSubscription?.unsubscribe()` before issuing a new request, guaranteeing only the latest request's response updates the UI.

### Q: How is budget spending calculated?
**A:** Rather than storing a static `spent` column that could become out of sync with transactions, budget spending is computed dynamically:
1. The budget specifies a `category` and a `month` (e.g., `2026-09-01`).
2. The server queries the sum of all `expense` transactions for that `userId` and `category` where `date` falls between the first and last millisecond of that calendar month.
3. It computes `spent`, `remaining = Math.max(0, amount - spent)`, and `percentage = (spent / amount) * 100`.

### Q: Where is tax calculation performed and why?
**A:** Tax calculation is performed strictly on the backend inside `taxEstimator.service.ts`. Tax calculations involve sensitive bracket logic and standard deduction numbers that should be centralized. Performing calculations on the backend ensures consistency, protects the logic from client-side tampering, and allows saving calculation records directly to PostgreSQL.

---

## 5. Assistive AI Implementation

### Q: Why did you choose these three specific AI features?
**A:** I selected Smart Categorization, Financial Health Summaries, and Tax Deduction Suggestions because they solve discrete friction points without introducing unnecessary complexity:
1. Categorization speeds up repetitive data entry.
2. Health summaries explain aggregated numbers in simple human terms.
3. Deduction suggestions provide educational ideas for tax season.

### Q: Does AI ever calculate financial balances or tax liabilities?
**A:** No. Financial calculations are strictly deterministic in TypeScript and SQL. The AI is used purely for text classification and summarization. AI suggestions are informational and must be reviewed and accepted by the user before anything is saved.

### Q: How do you handle AI provider failures or missing credentials?
**A:** All AI requests pass through `ai.service.ts` wrapped in an 8-second `AbortController` timeout. If the API key is not configured, the service immediately returns a controlled fallback without making network calls. If the provider returns a 500 error or malformed non-JSON output, the controller catches it and returns friendly fallback guidance without crashing the application.

### Q: Why didn't you build a chatbot or RAG system?
**A:** A chatbot or vector database (RAG) would add significant architectural overhead, cold-start latency, and maintenance costs without solving the user's core problem. In personal finance, users want immediate dashboard clarity, fast transaction search, and reliable math—not an open-ended conversational bot. Targeted assistive endpoints provided direct utility with minimal footprint.

---

## 6. Important Technical Challenges & Resolutions

### Challenge 1: Out-of-Sync Budget Spending
- **Problem**: In early design, updating or deleting transactions did not reflect in the budget cards unless a manual sync was run.
- **Investigation**: Storing a static `spent` balance on the Budget model caused data inconsistency whenever transactions were modified outside the budget UI.
- **Solution**: Refactored the budget retrieval logic to dynamically aggregate matching expense transactions from the `Transaction` table directly in PostgreSQL using Prisma date ranges.
- **Result**: Budgets now immediately reflect real-time spending with 100% mathematical consistency.

### Challenge 2: In-Memory Aggregation Bottleneck
- **Problem**: Dashboard load times increased as test transaction volume grew.
- **Investigation**: Found that the backend was loading all matching rows into Node.js memory via `findMany()` and running `.reduce()` loops.
- **Solution**: Migrated to Prisma's SQL-native `groupBy` and `_sum` aggregations, paired with composite indexes on `[userId, date]`.
- **Result**: Query execution time and memory overhead dropped significantly, offloading arithmetic to PostgreSQL.

### Challenge 3: In-Flight Network Race Conditions
- **Problem**: When a user rapidly clicked between pages or typed into the search filter, an older HTTP request could resolve after a newer one, displaying stale data.
- **Investigation**: Network logs showed overlapping pending transactions requests completing out of chronological order.
- **Solution**: Added RxJS subscription cancellation (`this.loadTxSubscription?.unsubscribe()`) before dispatching new queries, plus a 300ms debounce on search input.
- **Result**: Eliminates UI flicker and guarantees the visible table matches the user's latest interaction.

---

## 7. "Why This Technology?" Quick Reference

| Technology | Why We Used It (Real Engineering Rationale) |
| :--- | :--- |
| **Angular** | Opinionated structure, built-in TypeScript integration, standalone components, and enterprise-grade HTTP interceptors for transparent token refresh. |
| **TypeScript** | Shared data contracts between client and server, catching schema mismatches at compile time rather than in production. |
| **Node.js & Express** | Lightweight, fast event loop for asynchronous I/O, rich ecosystem of security middleware (Helmet, rate-limit), and simple deployment. |
| **PostgreSQL** | Strict ACID compliance, relational integrity, robust aggregation functions (`GROUP BY`, `SUM`), and proven durability for financial data. |
| **Prisma ORM** | Type-safe query generation, declarative schema migrations, automated TypeScript types, and protection against SQL injection. |
| **JWT (Dual-Token)** | Stateless authorization for scalable REST APIs, paired with secure server-side revocation through database-backed SHA-256 hashed refresh tokens. |
| **Jest** | Fast, reliable test runner supporting VM ES modules to validate authentication rules, data isolation, and service edge cases. |

---

## 8. 25+ Interviewer Follow-up Questions

### Project & Overview
1. **Q: What was your specific role in this project?**  
   *A:* I was the full-stack developer responsible for end-to-end implementation—from designing the PostgreSQL schema and Express REST APIs to building the Angular components and writing automated tests.
2. **Q: How long did it take to build?**  
   *A:* It was developed iteratively across 8 structured phases covering auth, core CRUD, dynamic budgets, reporting, assistive AI, performance, and deployment readiness.
3. **Q: How is the codebase organized?**  
   *A:* It's structured as a clean monorepo: `mean-app/client` for Angular, `mean-app/server` for Express, and `mean-app/api` for serverless deployment entry points.

### Frontend
4. **Q: How do standalone components differ from NgModule components?**  
   *A:* Standalone components directly import their dependencies (`imports: [CommonModule, MatDialogModule]`), removing the need for shared modules and enabling granular code-splitting.
5. **Q: Why did you use SCSS instead of Tailwind?**  
   *A:* Custom SCSS allowed full control over our curated dark-theme design tokens, CSS variables, and layout styles without adding large utility class compilation overhead.
6. **Q: How do you handle form validation?**  
   *A:* Using Angular template-driven and reactive forms with input constraints, checking date logic (e.g. `startDate <= endDate`) before making network requests.

### Backend & API
7. **Q: What is Express middleware and how is it used here?**  
   *A:* Middleware are functions that process requests in sequence. We use them for security headers (Helmet), CORS, JSON body limits (1MB), rate limiting, and JWT authentication verification.
8. **Q: Why Express 5?**  
   *A:* Express 5 natively handles rejected promises in asynchronous route handlers, simplifying error propagation without boilerplate `try/catch` wrappers.
9. **Q: How does centralized error handling work?**  
   *A:* An Express error-handling middleware (`(err, req, res, next)`) catches uncaught exceptions, logs them server-side, and returns a sanitized JSON response with appropriate HTTP status codes.

### Database
10. **Q: Why use PostgreSQL over MongoDB?**  
    *A:* Financial data requires strict relational integrity (foreign keys between Users, Transactions, and Budgets), structured schemas, and transactional consistency.
11. **Q: How does Prisma prevent SQL injection?**  
    *A:* Prisma uses parameterized queries for all database operations, separating query logic from user data inputs.
12. **Q: What is database connection pooling?**  
    *A:* Prisma maintains a pool of active database connections that are reused across incoming requests, preventing connection exhaustion under concurrent load.

### Security
13. **Q: What is the risk of storing JWTs in localStorage?**  
    *A:* LocalStorage is accessible to client-side scripts, making it vulnerable to XSS. We mitigate this with short 15-minute access token lifetimes and strict input sanitization.
14. **Q: How do you prevent brute-force attacks on login?**  
    *A:* Using `express-rate-limit` on `/api/auth/login` to restrict the number of failed attempts allowed from a single IP within a set time window.
15. **Q: Why use bcrypt instead of SHA-256 for passwords?**  
    *A:* SHA-256 is fast and vulnerable to GPU brute-forcing. Bcrypt is a slow, computationally intensive key-derivation function with configurable salt rounds (10), making rainbow table attacks infeasible.

### Testing
16. **Q: What do your unit tests cover?**  
    *A:* 70 unit tests cover AI parsing and fallbacks (34 tests), JWT validation and password hashing (7 tests), budget transaction aggregations (13 tests), and report permissions (16 tests).
17. **Q: Why mock the database in unit tests?**  
    *A:* Mocking Prisma allows testing edge cases and business logic quickly and deterministically without requiring a live external database connection in CI/CD.

### AI Integration
18. **Q: What model did you use and why?**  
    *A:* Google Gemini 1.5 Flash via REST API. It is fast, lightweight, and cost-effective for structured JSON classification and short summarizations.
19. **Q: How do you prevent prompt injection?**  
    *A:* Prompts enforce strict output schemas (`Respond ONLY in JSON`) and pass user text as data parameters rather than instruction overrides.
20. **Q: What happens if the Gemini API has an outage?**  
    *A:* The application catches the network error or timeout and immediately falls back to deterministic defaults. The core app remains 100% operational.

### Deployment & DevOps
21. **Q: How is the application deployed?**  
    *A:* Pre-configured for Vercel using `vercel.json` to deploy the Angular build to global CDNs and `/api/*` to serverless Node.js functions.
22. **Q: How do you ensure environment variables aren't leaked?**  
    *A:* `.env` files are in `.gitignore`. The client bundle contains zero API keys or secrets, and `dist/` artifacts are never committed to git.
23. **Q: What is the purpose of the `/api/health` endpoint?**  
    *A:* It provides cloud hosting platforms and uptime monitors with a lightweight HTTP 200 health check including uptime and timestamp.
24. **Q: Why use `npx prisma generate` in build scripts?**  
    *A:* It generates the TypeScript Prisma Client tailored to the current platform OS inside `node_modules/@prisma/client` prior to backend TypeScript compilation.
25. **Q: What would you do if your database grew to millions of transactions?**  
    *A:* I would introduce database read replicas, partition the `Transaction` table by date/year, implement Redis caching for historical monthly totals, and add background worker queues for PDF exports.
