# TaxPal

TaxPal is a full-stack personal finance and tax management application for managing transactions, budgets, tax estimates, financial reports, and selected AI-assisted financial insights.

---

## Overview

Managing personal finances often involves juggling multiple disjointed spreadsheets, expense trackers, and manual tax estimation calculators. TaxPal provides an integrated, self-contained solution tailored for individuals, freelancers, and small business owners who want clear visibility into their financial health and estimated tax liabilities.

Key capabilities provided:
- **Transaction Management**: Search, filter, categorize, paginate, edit, and track income and expenses.
- **Dynamic Budget Tracking**: Budget limits automatically compute spent and remaining amounts derived directly from actual expense transactions without manual duplicate entries.
- **Financial Period Dashboard**: Real-time visual metrics, income vs. expense breakdowns, and category distributions across monthly, quarterly, and yearly windows.
- **Tax Estimation**: Server-side mathematical estimation based on standard tax brackets, itemized business deductions, and filing status.
- **Comprehensive Financial Reports**: Instant filtered report previews with on-demand physical PDF and CSV file generation and secured, user-isolated downloads.
- **Assistive AI Guidance**: Three targeted, non-intrusive AI features (smart transaction categorization, financial health summaries, and tax deduction recommendations) that assist the user without altering financial math or replacing professional advice.

---

## Architecture

TaxPal is architected as a clean, decoupled client-server web application using standard layered design patterns.

- **Angular Frontend**: Modern single-page application built with standalone components, Angular Material components, Chart.js for data visualization, and reactive RxJS streams. All network calls use relative `/api` paths with auth interceptors.
- **Express + TypeScript Backend**: Strict TypeScript REST API structured into domain modules (`auth`, `transactions`, `dashboard`, `budgets`, `tax`, `reports`, `ai`). Handles authentication, input validation, role/user ownership authorization, rate limiting, and security headers.
- **Prisma ORM Layer**: Type-safe database queries and migrations. Uses composite indexes (`userId` + `date`, `type`, `category`, `month`, `year`) and database-native `groupBy` and `_sum` aggregations.
- **PostgreSQL Database**: Relational database storing users, hashed credentials, refresh tokens, transactions, categories, budgets, notification preferences, tax estimates, and report metadata.
- **External AI Provider**: Google Gemini REST API invoked via native `fetch` with an 8-second `AbortController` timeout for resilient, non-blocking suggestions.

### Architecture Diagram

```mermaid
flowchart TD
    U([User / Browser]) <--> F[Angular 20 Frontend]

    subgraph Client Architecture
        F --> AUTH_INT[HTTP Auth Interceptor]
        AUTH_INT --> SVC[Feature Services]
        SVC --> UI[Material + Chart.js Views]
    end

    F <-->|REST API / HTTPS| API[Express 5 Server]

    subgraph Backend Architecture
        API --> SEC[Helmet + CORS + Rate Limiter]
        SEC --> AUTH[JWT Auth & Token Verification]
        AUTH --> MOD[Modular Controllers & Services]
        
        MOD --> DASH[Dashboard Module]
        MOD --> TX[Transactions Module]
        MOD --> BUD[Budget Module]
        MOD --> TAX[Tax Estimator Engine]
        MOD --> REP[PDFKit & CSV Report Service]
        MOD --> AI[AI Assistance Service]
    end

    MOD <-->|Type-safe Queries| P[Prisma ORM Client]
    P <-->|Indexed SQL| DB[(PostgreSQL Database)]

    AI <-->|Native REST / 8s Timeout| LLM[Google Gemini 1.5 Flash]
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Angular | `^20.3.0` | Standalone component UI framework |
| **UI Component Library** | Angular Material + CDK | `^20.2.3` | Accessible dialogs, buttons, form controls |
| **Data Visualization** | Chart.js + ng2-charts | `^4.5.0` / `^5.0.4` | Interactive doughnut, bar, and financial charts |
| **Reactive Programming** | RxJS | `~7.8.0` | Asynchronous event handling and search debouncing |
| **Styling** | Vanilla SCSS | CSS3 | Custom dark-theme tokens and responsive grid layouts |
| **Backend Runtime** | Node.js + Express | `^5.1.0` | REST API application framework |
| **Backend Language** | TypeScript | `^5.9.3` | Type-safe development across frontend & backend |
| **Database ORM** | Prisma | `^6.16.2` | Schema migrations and type-safe database queries |
| **Database Engine** | PostgreSQL | 15+ / 16+ | Relational data storage |
| **Authentication** | JWT (`jsonwebtoken`) | `^9.0.2` | Short-lived access tokens + long-lived refresh tokens |
| **Credential Hashing** | `bcrypt` | `^6.0.0` | Salted password hashing |
| **API Security** | `helmet` + `express-rate-limit` | `^8.3.0` / `^8.7.0` | Security headers, request throttling, payload limits |
| **Report Generation** | `pdfkit` + `json2csv` | `^0.17.2` / `^6.0.0` | Server-side PDF and CSV document generation |
| **Validation** | Zod | `^4.1.12` | Schema-based payload validation |
| **Unit Testing** | Jest + `ts-jest` | `^30.2.0` | Automated test runner with VM ES modules support |
| **AI Integration** | Google Gemini REST API | `v1beta` | 3 targeted assistive AI features via native `fetch` |

---

## Key Features

### 1. Authentication & Security
- **Dual-Token JWT Architecture**: 15-minute access tokens paired with 7-day refresh tokens stored as SHA-256 hashes in the database.
- **Password Security**: Strong bcrypt salting (10 rounds) and secure password reset token flows with time-based expiration.
- **Ownership Scoping**: Strict multi-tenant data isolation; every query filters on `userId` to ensure users cannot view or manipulate other users' data.
- **Production Hardening**: `helmet` security headers, 1MB JSON/URL-encoded body parser limits, and generic 500 error message sanitization in production mode.
- **Rate Limiting**: Throttles brute-force attempts on authentication and AI endpoints.

### 2. Dashboard
- **Financial Metric Cards**: Real-time Total Income, Total Expenses, Net Savings, and Savings Rate percentage.
- **Interactive Period Selector**: Instant toggle between **Monthly**, **Quarterly**, and **Yearly** aggregations.
- **Visual Analytics**: Interactive doughnut and bar charts depicting category spending distribution and historical income vs. expense balance.
- **Recent Transactions**: Quick access list showing recent transactions with category badges.

### 3. Transactions
- **CRUD Operations**: Create, view, edit, and delete transactions with confirmation dialogs.
- **Search & Multi-Filter**: Real-time 300ms debounced search on description/category, transaction type (income/expense), category dropdown, and start/end date range.
- **Server Pagination**: Fast pagination with configurable limit (10, 25, 50 per page).
- **Race Condition Guarding**: Frontend actively cancels in-flight HTTP requests before initiating new queries.

### 4. Budgets
- **Automated Spending Computation**: Budgets dynamically query and sum actual transaction records for the active calendar month.
- **Visual Progress**: Color-coded progress indicators displaying amount spent, amount remaining, and percentage of budget consumed.
- **Over-Budget Alerts**: Clear warning status and clamped remaining calculations when expenses exceed budgeted amounts.
- **Category Isolation**: Budgets mapped to user-defined categories.

### 5. Tax Estimator
- **Server-Side Calculation Engine**: Computes taxable income, estimated federal/state tax, effective tax rate, and quarterly estimated payments based on filing status and itemized business expenses.
- **Mathematical Integrity**: AI does **not** calculate taxes; tax computations are strictly deterministic.
- **Informational Disclaimers**: Clear guidance that estimates are educational and not binding tax advice.

### 6. Reports & Export
- **Live Preview**: Filtered summary cards (total income, expenses, net savings, largest expense, top spending category) and paginated transaction breakdown.
- **PDF Generation**: Styled PDF generation via PDFKit with professional headers, metadata, and transaction tables.
- **CSV Export**: Clean CSV exports with headers and summary rows formatted for spreadsheet analysis.
- **Secure Downloads**: Dedicated endpoint (`/api/reports/:id/download`) verifying user ownership before streaming files.

### 7. Assistive AI Features
TaxPal contains **exactly 3 targeted AI features** powered by Google Gemini:
1. **Smart Expense Categorization**: Suggests appropriate categories for newly entered or edited transactions based on description and amount.
2. **Financial Health Summary**: Generates high-level educational observations, actionable financial insights (max 3), and priority ratings based on aggregated monthly, quarterly, or yearly figures.
3. **Tax-Saving & Deduction Suggestions**: Evaluates reported income and deduction entries to suggest up to 3 common tax deduction areas the user may review with their accountant.

> **AI Design Principles**:
> - AI suggestions are purely advisory and never modify financial records without user confirmation.
> - Sensitive credentials and raw database records are never transmitted to the model.
> - When `AI_API_KEY` is missing or the external API is unreachable, features gracefully fall back without impacting core functionality.

---

## Project Structure

```
taxpal-full-stack/
├── mean-app/
│   ├── client/                               # Angular Frontend Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/                     # Auth interceptors, guards, singleton services
│   │   │   │   │   ├── interceptors/
│   │   │   │   │   └── services/
│   │   │   │   ├── features/                 # Standalone feature modules
│   │   │   │   │   ├── auth/                 # Login, Register, Forgot Password
│   │   │   │   │   ├── dashboard/            # Overview metrics, charts, period filters
│   │   │   │   │   ├── transactions/         # Transactions table, search, modals
│   │   │   │   │   ├── budgets/              # Budget cards, progress bars, dialogs
│   │   │   │   │   ├── tax-estimator/        # Tax calculator and AI suggestions
│   │   │   │   │   ├── reports/              # Report previews, PDF/CSV generation
│   │   │   │   │   └── settings/             # Profile, categories, security, notifications
│   │   │   │   ├── layouts/                  # Main navigation layout and header
│   │   │   │   └── app.routes.ts             # Route definitions with auth guards
│   │   │   ├── environments/                 # Environment configurations (environment.prod.ts)
│   │   │   └── styles.scss                   # Global design tokens and styles
│   │   ├── angular.json                      # Angular build configuration with fileReplacements
│   │   ├── proxy.conf.json                   # Local development proxy (/api -> localhost:5000)
│   │   └── package.json
│   │
│   ├── server/                               # Node.js + Express Backend Application
│   │   ├── prisma/
│   │   │   └── schema.prisma                 # Database schema with composite indexes
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── modules/                  # Feature domain modules
│   │   │   │       ├── ai/                   # Gemini client, categorization, health summary
│   │   │   │       ├── auth/ / user/         # Registration, login, JWT refresh
│   │   │   │       ├── budget/               # Budget model, dynamic expense calculation
│   │   │   │       ├── categories/           # User transaction categories
│   │   │   │       ├── dashboard/            # Multi-period aggregation metrics
│   │   │   │       ├── notifications/        # User notification settings
│   │   │   │       ├── reports/              # PDFKit & CSV generator, preview service
│   │   │   │       ├── security/             # Password changes, 2FA toggle, token hashing
│   │   │   │       ├── tax/                  # Tax estimation calculations and history
│   │   │   │       └── transactions/         # DB groupBy aggregations, pagination, filters
│   │   │   ├── config/                       # Prisma client and environment setup
│   │   │   ├── middlewares/                  # Auth middleware, rate limiters
│   │   │   ├── utils/                        # JWT helpers, token hashing
│   │   │   ├── app.ts                        # Express middleware, CORS, error handling
│   │   │   └── server.ts                     # HTTP listener and DB connection check
│   │   ├── .env.example                      # Template for backend environment variables
│   │   └── package.json
│   │
│   ├── api/                                  # Vercel serverless entry point
│   │   └── index.ts                          # Exports Express app for serverless execution
│   ├── vercel.json                           # Monorepo deployment routing and build rules
│   └── package.json                          # Monorepo scripts
├── .gitignore
└── README.md
```

---

## API Reference

All protected endpoints require an `Authorization: Bearer <access_token>` header.

### System & Health
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns service status, uptime, and timestamp |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns access & refresh tokens |
| `POST` | `/api/auth/refresh-token` | Public | Exchange valid refresh token for a new access token |
| `POST` | `/api/auth/logout` | Protected | Invalidate user refresh token |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid reset token |
| `GET` | `/api/auth/me` | Protected | Get authenticated user profile |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard?period=monthly` | Protected | Aggregate financial summary for `monthly`, `quarterly`, or `yearly` periods |

### Transactions (`/api/transactions`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | Protected | Query paginated transactions with search, type, category, date filters |
| `POST` | `/api/transactions` | Protected | Create a new transaction |
| `PUT` | `/api/transactions/:id` | Protected | Update existing transaction (enforces ownership) |
| `DELETE` | `/api/transactions/:id` | Protected | Delete transaction (enforces ownership) |

### Budgets (`/api/budgets`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/budgets` | Protected | List budgets with dynamic spend calculations from transactions |
| `POST` | `/api/budgets` | Protected | Create a budget limit for a category |
| `PUT` | `/api/budgets/:id` | Protected | Update budget amount or category |
| `DELETE` | `/api/budgets/:id` | Protected | Delete budget entry |

### Tax Estimator (`/api/tax-estimator`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tax-estimator/calculate` | Protected | Deterministically calculate tax liability and effective rate |
| `POST` | `/api/tax-estimator/save` | Protected | Persist tax estimate record |
| `GET` | `/api/tax-estimator/history` | Protected | Retrieve user's previous tax estimate records |

### Reports (`/api/reports`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reports/preview` | Protected | Generate real-time preview metrics across custom filters |
| `POST` | `/api/reports/generate` | Protected | Generate physical PDF or CSV file on server |
| `GET` | `/api/reports` | Protected | List generated reports |
| `GET` | `/api/reports/:id/download` | Protected | Stream report file to authenticated owner |

### Assistive AI (`/api/ai`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/categorize` | Protected | Suggest transaction category based on description and amount |
| `POST` | `/api/ai/financial-health` | Protected | Generate educational financial health summary and 3 insights |
| `POST` | `/api/ai/tax-suggestions` | Protected | Generate educational deduction opportunities (max 3) |

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+ or v10+
- **PostgreSQL**: Local instance or remote connection (e.g. Supabase, Neon, AWS RDS)

### 1. Clone Repository
```bash
git clone https://github.com/KrChiranjeevi/Intership-TaxPal.git
cd taxpal-full-stack
```

### 2. Backend Setup
```bash
cd mean-app/server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

Edit `.env` and provide your database connection and secrets:
```ini
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/taxpal_db?schema=public"
CORS_ORIGIN="http://localhost:4200"
JWT_SECRET="your-32+-character-random-secret"
JWT_REFRESH_SECRET="your-32+-character-refresh-secret"
AI_API_KEY="optional-google-gemini-api-key"
```

Initialize Prisma and compile:
```bash
# Validate schema and generate Prisma client
npx prisma validate
npx prisma generate

# Apply migrations to database
npm run db:migrate

# Run backend development server
npm run dev
```
The backend will start on `http://localhost:5000`. Verify with `curl http://localhost:5000/api/health`.

### 3. Frontend Setup
In a new terminal:
```bash
cd mean-app/client

# Install dependencies
npm install

# Start Angular development server (with proxy to localhost:5000)
npm start
```
Open `http://localhost:4200` in your browser.

---

## Testing & Quality Assurance

All unit and security tests can be executed from the server directory:

```bash
cd mean-app/server

# Run AI module test suite (34 tests)
npm test -- src/api/modules/ai/ai.test.ts

# Run Authentication & Security test suite (7 tests)
npm test -- src/api/modules/security/auth.security.test.ts

# Run Budget module test suite (13 tests)
npm test -- src/api/modules/budget/budget.test.ts

# Run Reports module test suite (16 tests)
npm test -- src/api/modules/reports/reports.test.ts

# Typecheck server without emitting files
npx tsc --noEmit
```

Frontend production build validation:
```bash
cd mean-app/client

# Build production bundle with Ahead-of-Time (AOT) compilation
npm run build
```

---

## Production Deployment

### Deployment on Vercel
The repository includes a root `vercel.json` configured for monolithic full-stack deployment:
1. Connect the GitHub repository to Vercel.
2. Set root directory to `mean-app`.
3. In Project Settings > Environment Variables, configure:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CORS_ORIGIN` (your Vercel URL)
   - `AI_API_KEY` (optional)
4. Deploy. Vercel builds the Angular application into `dist/client/browser` and deploys `api/index.ts` as serverless API routes under `/api/*`.

### Standalone Production Commands
- **Frontend Build**: `cd mean-app/client && npm install && npm run build` (outputs to `dist/client/browser`).
- **Backend Build & Start**: `cd mean-app/server && npm install && npm run build && npm start` (compiles to `dist/` and runs `node dist/server.js`).

---

## License

This project is licensed under the ISC License.