# TaxPal — Project Overview

## Project
**TaxPal — Personal Finance & Tax Management System**

## Role
**Full Stack Developer Intern / Developer**

---

## Problem Statement

Managing personal finances often involves navigating disconnected spreadsheets, fragmented mobile apps, and complicated tax forms. Users struggle to maintain a unified view of their income, recurring expenditures, budget adherence, and estimated quarterly/annual tax obligations. Additionally, small business owners and freelancers lack simple tools to preview deductions and export audit-ready financial statements without expensive accounting software.

---

## Solution

TaxPal provides an integrated, self-contained full-stack web application that consolidates financial management into a single platform. The system records income and expense transactions, dynamically calculates real-time budget spending from actual transaction data, and models tax obligations based on income brackets and business deductions. It supports instant filtered report previews with on-demand PDF and CSV generation, backed by three assistive, non-intrusive AI features for smart categorization, period summaries, and deduction suggestions.

---

## Core Modules

TaxPal is organized into eight functional modules:

### 1. Authentication & Security
- User registration and login using JWT access and refresh tokens.
- Secure refresh token rotation with SHA-256 token hashing in PostgreSQL.
- Password hashing with bcrypt (10 salt rounds).
- Password reset token flow with time-limited expirations.
- Strict multi-tenant data isolation ensuring users can access only their own data.
- Security headers with Helmet, express-rate-limit protection, and 1MB body parser payload limits.

### 2. Dashboard
- Real-time KPI metric cards: Total Income, Total Expenses, Net Savings, and Savings Rate.
- Interactive financial period filtering: switch between **Monthly**, **Quarterly**, and **Yearly** views.
- Interactive doughnut and bar charts (Chart.js / ng2-charts) showing expense category distribution and income vs. expense balance.
- Recent transactions list with type and category indicators.

### 3. Transactions
- Complete CRUD operations for income and expense records.
- Real-time 300ms debounced search on descriptions and categories.
- Multi-field filtering by transaction type (income/expense), category, and custom start/end date ranges.
- Server-side pagination with configurable limits (10, 25, 50).
- Frontend in-flight request cancellation preventing race conditions during rapid pagination.

### 4. Budgets
- Dynamic monthly budget limits per expense category.
- Automated calculation of spent amounts derived directly from transaction records without manual duplicate inputs.
- Visual progress bars showing percentage consumed and remaining balances.
- Clear over-budget warning indicators and clamped remaining amounts.

### 5. Tax Estimator
- Deterministic, server-side mathematical tax estimation based on standard tax brackets.
- Supports filing status (Single, Married Filing Jointly), income, and itemized deductions (retirement, health insurance, home office, business expenses).
- Calculation of taxable income, estimated tax, effective tax rate, and quarterly payment estimates.
- Educational disclaimers clarifying that estimates are informational and do not replace certified tax advice.

### 6. Reports & Export
- Live report preview with summary KPIs (income, expenses, net savings, largest expense, top spending category).
- Server-side PDF generation using PDFKit with styled headers, user metadata, and transaction tables.
- Formatted CSV export using JSON2CSV for spreadsheet applications.
- Secure, user-isolated file downloads (`/api/reports/:id/download`).

### 7. Settings & Profile
- User profile overview (name, email, country, income bracket).
- Custom category management with color indicators.
- Security preferences (password changes, two-factor authentication toggle).
- Notification preferences (email alerts, transaction alerts, budget warnings, tax reminders).

### 8. Assistive AI Guidance
- **Smart Expense Categorization**: Suggests appropriate categories during transaction creation/editing based on description and amount.
- **Financial Health Summary**: Generates high-level observations and up to 3 educational insights on the Dashboard.
- **Tax-Saving & Deduction Suggestions**: Recommends up to 3 common tax deduction areas to review based on reported income and deductions.
- All AI features are non-blocking, advisory-only, and gracefully degrade when API credentials are unavailable.
