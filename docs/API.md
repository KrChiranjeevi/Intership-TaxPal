# TaxPal — REST API Specification

This document details all endpoints provided by the TaxPal Express backend API.

**Base URL**: `/api`  
**Default Content-Type**: `application/json`  
**Authentication**: Bearer Token in `Authorization: Bearer <access_token>` header for all protected endpoints.

---

## 1. System Health

### `GET /api/health`
Checks server uptime and operational status.
- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "service": "taxpal-api",
  "timestamp": "2026-09-15T06:25:58.196Z",
  "uptime": 168,
  "success": true
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account.
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-v4",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### `POST /api/auth/login`
Authenticates user credentials and issues access & refresh tokens.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "accessToken": "jwt-access-token-15m",
  "refreshToken": "jwt-refresh-token-7d",
  "user": {
    "id": "uuid-v4",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### `POST /api/auth/refresh-token`
Exchanges a valid refresh token for a newly signed access token.
- **Access**: Public
- **Request Body**:
```json
{
  "refreshToken": "jwt-refresh-token-7d"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "accessToken": "new-jwt-access-token-15m"
}
```

### `POST /api/auth/logout`
Revokes user session by deleting the refresh token from database.
- **Access**: Protected
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### `GET /api/auth/me`
Retrieves authenticated user profile.
- **Access**: Protected
- **Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "uuid-v4",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "country": "United States",
    "incomeBracket": "50k-100k"
  }
}
```

---

## 3. Dashboard (`/api/dashboard`)

### `GET /api/dashboard`
Fetches aggregated financial KPI metrics and chart datasets.
- **Access**: Protected
- **Query Parameters**:
  - `period`: `'monthly'` | `'quarterly'` | `'yearly'` (default: `'monthly'`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "summary": {
      "totalIncome": 5200.00,
      "totalExpenses": 2450.50,
      "netSavings": 2749.50,
      "savingsRate": 52.88
    },
    "categories": [
      { "category": "Rent", "amount": 1200.00, "percentage": 48.97 },
      { "category": "Food", "amount": 550.50, "percentage": 22.46 }
    ],
    "chartData": {
      "labels": ["Income", "Expenses"],
      "datasets": [{ "data": [5200.00, 2450.50] }]
    },
    "recentTransactions": [...]
  }
}
```

---

## 4. Transactions (`/api/transactions`)

### `GET /api/transactions`
Retrieves paginated, filtered transactions.
- **Access**: Protected
- **Query Parameters**:
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 10, max: 50)
  - `search`: String (searches description & category)
  - `type`: `'income'` | `'expense'`
  - `category`: String
  - `startDate`: ISO 8601 Date
  - `endDate`: ISO 8601 Date
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx-uuid",
        "description": "Grocery Store",
        "amount": 84.50,
        "type": "expense",
        "category": "Food",
        "date": "2026-09-10T14:30:00.000Z",
        "notes": "Weekly groceries"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    },
    "summary": {
      "totalIncome": 5200.00,
      "totalExpense": 2450.50,
      "net": 2749.50
    }
  }
}
```

### `POST /api/transactions`
Creates a transaction record.
- **Access**: Protected
- **Request Body**:
```json
{
  "description": "Freelance Design",
  "amount": 1200.00,
  "type": "income",
  "category": "Freelance",
  "date": "2026-09-12T10:00:00.000Z",
  "notes": "Project milestone"
}
```
- **Response**: `201 Created`

### `PUT /api/transactions/:id`
Updates an existing transaction. Enforces ownership.
- **Access**: Protected
- **Response**: `200 OK`

### `DELETE /api/transactions/:id`
Deletes a transaction record. Enforces ownership.
- **Access**: Protected
- **Response**: `200 OK`

---

## 5. Budgets (`/api/budgets`)

### `GET /api/budgets`
Lists monthly budgets with actual transaction spending calculated on the fly.
- **Access**: Protected
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "budget-uuid",
      "category": "Food",
      "amount": 600.00,
      "spent": 550.50,
      "remaining": 49.50,
      "percentage": 91.75,
      "isOverBudget": false,
      "month": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/budgets`
Creates a budget limit for a category.
- **Access**: Protected
- **Request Body**:
```json
{
  "category": "Food",
  "amount": 600.00,
  "month": "2026-09-01"
}
```
- **Response**: `201 Created`

---

## 6. Tax Estimator (`/api/tax-estimator`)

### `POST /api/tax-estimator/calculate`
Calculates estimated tax liability deterministically.
- **Access**: Protected
- **Request Body**:
```json
{
  "income": 75000,
  "status": "Single",
  "country": "United States",
  "businessExpenses": 4500,
  "retirement": 6000,
  "healthInsurance": 2400,
  "homeOffice": 1200,
  "additionalDeductions": 500
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "income": 75000,
    "totalDeductions": 14600,
    "taxableIncome": 60400,
    "estimatedTax": 8632.00,
    "effectiveTaxRate": 11.51,
    "quarterlyEstimatedTax": 2158.00
  }
}
```

---

## 7. Reports (`/api/reports`)

### `POST /api/reports/preview`
Generates live filtered summary metrics across transactions.
- **Access**: Protected
- **Request Body**:
```json
{
  "startDate": "2026-08-01",
  "endDate": "2026-08-31",
  "type": "expense",
  "category": "all"
}
```
- **Response**: `200 OK`

### `POST /api/reports/generate`
Generates a physical PDF or CSV report on the server.
- **Access**: Protected
- **Request Body**:
```json
{
  "reportType": "Expense Report",
  "period": "Monthly",
  "format": "pdf",
  "startDate": "2026-08-01",
  "endDate": "2026-08-31"
}
```
- **Response**: `201 Created` with report ID and file metadata.

### `GET /api/reports/:id/download`
Streams the generated PDF or CSV file to the authenticated owner.
- **Access**: Protected
- **Response**: Binary file stream (`application/pdf` or `text/csv`).

---

## 8. Assistive AI (`/api/ai`)

### `POST /api/ai/categorize`
Suggests an appropriate transaction category.
- **Access**: Protected
- **Request Body**:
```json
{
  "description": "Starbucks Coffee",
  "amount": 5.75
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "category": "Food",
    "confidence": 0.95
  }
}
```

### `POST /api/ai/financial-health`
Generates educational observations and insights based on period figures.
- **Access**: Protected
- **Request Body**:
```json
{
  "period": "monthly",
  "totalIncome": 5200,
  "totalExpenses": 2450,
  "netSavings": 2750,
  "savingsRate": 52.88
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": "Your financial health is strong with a savings rate of 52.88%.",
    "insights": [
      { "title": "Maintain Emergency Buffer", "description": "Keep 3-6 months in liquid savings.", "priority": "medium" }
    ],
    "priority": "low"
  }
}
```

### `POST /api/ai/tax-suggestions`
Provides up to 3 educational tax deduction suggestions.
- **Access**: Protected
- **Request Body**:
```json
{
  "income": 75000,
  "retirement": 0,
  "homeOffice": 0
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "title": "Retirement Contributions",
        "description": "Review traditional IRA or 401(k) deduction limits.",
        "priority": "medium"
      }
    ]
  }
}
```
