# TaxPal — Behavioral & Technical STAR Stories

This document provides seven concrete interview answers structured in the **STAR method** (Situation, Task, Action, Result) based on actual engineering experiences during the TaxPal project.

---

## 1. A Difficult Bug You Fixed
- **Situation**: During pagination and filtering testing in the Transactions module, typing rapidly in the search box or clicking pagination buttons rapidly occasionally caused older search results to overwrite newer results on the screen.
- **Task**: Eliminate the race condition and ensure the UI strictly displays the response corresponding to the user's latest interaction.
- **Action**: I investigated network logs and confirmed that multiple asynchronous HTTP requests were firing in parallel; a slower query with a broad search term was resolving after a faster query with a specific term. To fix this, I added a 300ms `debounceTime` and `distinctUntilChanged` on the search input Subject. Crucially, I stored the active HTTP subscription in `loadTxSubscription` and added logic to explicitly call `this.loadTxSubscription?.unsubscribe()` before dispatching any new request.
- **Result**: Completely eliminated the UI flicker and out-of-order race conditions, guaranteeing 100% display consistency during fast user interactions.

---

## 2. A Security Problem You Identified & Resolved
- **Situation**: While reviewing the authentication implementation, I noticed that refresh tokens were stored directly in plain text in the PostgreSQL database.
- **Task**: Prevent potential session hijacking and token theft in the event of an unauthorized database read or SQL leak.
- **Action**: I refactored the token issuance and verification pipeline. Instead of storing the raw JWT refresh token, the server now computes a deterministic cryptographic SHA-256 hash of the token (`hashToken(refreshToken)`) and stores only the `tokenHash` in the `RefreshToken` table. When the user requests a token renewal at `/api/auth/refresh-token`, the presented token is hashed on arrival and compared against the stored hash.
- **Result**: Even if the database were compromised, attackers cannot obtain usable refresh tokens to forge sessions. I also verified this security enhancement with 7 automated Jest tests.

---

## 3. A Performance Bottleneck You Optimized
- **Situation**: The transactions summary endpoint was taking noticeable processing time when calculating total income, total expenses, and net balance across filtered sets.
- **Task**: Optimize query execution time and reduce backend memory overhead.
- **Action**: When profiling `getAllTransactions()`, I found the code was querying all matching transaction rows into Node.js heap memory using `findMany({ select: { type: true, amount: true } })` and looping over them with JavaScript `.filter()` and `.reduce()`. I refactored this to use PostgreSQL's native aggregation:
  ```typescript
  const summaryAgg = await prisma.transaction.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
  });
  ```
  Additionally, I added composite indexes to `schema.prisma`: `@@index([userId, date])`, `@@index([userId, type])`, and `@@index([userId, category])`.
- **Result**: Offloaded arithmetic computation directly to the PostgreSQL database kernel, returning only 2 summary rows to Node.js and eliminating full table scans.

---

## 4. A Feature You Designed Yourself
- **Situation**: Most basic budgeting applications require users to manually enter how much they spent against each budget, which leads to outdated balances and high friction.
- **Task**: Design an automated budget module where budget limits dynamically reflect actual transaction expenditures.
- **Action**: I designed a dynamic calculation engine in `budget.model.ts`. When a user requests their budgets, the server looks up the user's category limits for the selected calendar month and queries the database for the sum of all matching `expense` transactions occurring between the start and end of that month. It dynamically computes `spent`, `remaining = Math.max(0, amount - spent)`, and `percentage = (spent / amount) * 100`.
- **Result**: Users never have to manually enter spent balances. As soon as a transaction is added, edited, or deleted anywhere in the app, their budgets instantly reflect their true financial standing.

---

## 5. A Time You Learned a New Technology
- **Situation**: In building the modern Angular 20 frontend, I transitioned from traditional NgModule-based architecture to Angular standalone components.
- **Task**: Master the standalone component API, new application builders (`@angular/build:application`), and reactive signal integrations to keep the client modern and lean.
- **Action**: I studied the Angular 20 documentation, replaced module declarations with explicit `@Component({ standalone: true, imports: [...] })` structures, and configured `angular.json` with production `fileReplacements` and route-level lazy loading. When the compiler flagged an `NG8113` unused import warning on dynamically opened dialogs, I researched the compiler rules and cleanly separated template imports from dynamic TypeScript `MatDialog` invocations.
- **Result**: Produced a lightweight, modern production bundle (504 kB initial raw size) that compiles with zero warnings and leverages granular lazy loading.

---

## 6. A Mistake You Made and How You Corrected It
- **Situation**: In an early version of `package.json`, the backend build script was set to `"npx prisma generate && npx prisma db push --accept-data-loss && tsc"`.
- **Task**: Identify the deployment risk and establish safe production build hygiene.
- **Action**: During a deployment readiness review, I realized that running `prisma db push --accept-data-loss` as part of a build script is dangerous—it could inadvertently mutate schemas or drop columns in production environments without a controlled migration plan. I corrected the build script to `"npx prisma generate && tsc"`, moving database migrations to an explicit, controlled `npx prisma migrate deploy` command.
- **Result**: Decoupled software compilation from database state mutations, ensuring safe, idempotent deployments that protect production data.

---

## 7. A Situation Where You Used AI Responsibly
- **Situation**: We wanted to add AI-driven capabilities to TaxPal without compromising financial mathematical accuracy or user trust.
- **Task**: Integrate LLM capabilities in a safe, advisory capacity that enhances user experience while preventing hallucinations and protecting privacy.
- **Action**: I implemented three targeted, non-intrusive AI features using Google Gemini 1.5 Flash: expense categorization, financial health summaries, and tax deduction recommendations. I established three architectural guardrails:
  1. **Strict Separation**: All financial calculations (taxes, totals, budgets) are strictly computed by deterministic TypeScript/SQL code; the AI is never allowed to compute or alter financial numbers.
  2. **Data Minimization**: Prompts receive only high-level aggregates (e.g. total income, category names) without sensitive user credentials or account numbers.
  3. **Graceful Degradation**: All calls have an 8-second timeout. If the API key is absent or the external provider fails, the app returns controlled fallbacks and remains 100% operational.
- **Result**: Provided genuine utility to users without compromising the integrity, speed, or reliability of core financial data.
