# TaxPal — Resume Bullets & Experience Descriptions

This document provides ATS-friendly, technically accurate resume bullet options tailored to different target software engineering roles.

---

## Version A: Full Stack Developer

- **Full Stack Development**: Built and deployed **TaxPal**, a full-stack personal finance and tax management web application using **Angular 20**, **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL** with **Prisma ORM**.
- **Responsive Frontend & Visual Analytics**: Developed a modular Single Page Application using Angular standalone components, SCSS dark theme, and Chart.js, featuring an interactive financial dashboard with dynamic monthly, quarterly, and yearly period filters.
- **RESTful API & Database Architecture**: Designed and implemented modular Express REST APIs managing transactions, automated budget spending calculations from actual records, deterministic tax bracket estimations, and server-side PDF/CSV report exports.
- **Authentication & Security**: Implemented a dual-token JWT authentication flow with 15-minute access tokens and SHA-256 hashed refresh tokens in PostgreSQL, enforced strict multi-tenant data isolation on all queries, and protected endpoints with Helmet security headers and rate limiting.
- **Automated Testing & Reliability**: Authored 70 automated unit and security tests in **Jest** covering token rotation, user ownership verification, dynamic budget aggregations, and graceful fallback handling for third-party AI integrations.

---

## Version B: Software Development Engineer (SDE / Backend Focused)

- **Backend Architecture & API Design**: Architected a modular REST API in **Node.js**, **Express 5**, and strict **TypeScript**, structuring domain modules for transaction management, period-based financial metrics, tax estimation, and audit report generation.
- **Database Modeling & Query Optimization**: Designed the relational schema in **PostgreSQL** using **Prisma ORM**; optimized high-volume transaction queries by shifting in-memory reductions to database-native `groupBy` and `_sum` SQL aggregations backed by composite indexes.
- **Security & Authorization**: Built a resilient authentication subsystem with bcrypt password hashing (10 rounds), dual-token JWT lifecycle management, database-backed refresh token rotation, payload size limits, and strict user ownership filtering on all database operations.
- **Resilient Third-Party Integrations**: Integrated Google Gemini 1.5 Flash REST API via native fetch with 8-second `AbortController` timeouts for advisory expense categorization and health summaries, ensuring zero impact on deterministic core calculations during provider downtime.
- **Quality Assurance**: Implemented 70 Jest unit and integration tests covering security edge cases, IDOR protection, budget spend calculations, and mock-based API validation.

---

## Version C: Data & Integrations Engineer

- **Data Pipelines & Aggregations**: Built backend aggregation workflows in **Node.js** and **PostgreSQL** calculating dynamic monthly budget expenditures directly from raw transaction records without data duplication.
- **Document & Data Export Service**: Implemented server-side export pipelines using **PDFKit** and **JSON2CSV**, generating formatted, audit-ready financial statements and CSV datasets with user ownership verification prior to file streaming.
- **API Contracts & Data Validation**: Defined strong TypeScript schemas and data transfer objects for multi-field transaction filtering (date ranges, categories, transaction types) and deterministic tax bracket computations across filing statuses.
- **LLM Data Integration**: Engineered structured prompt interfaces with Google Gemini to classify expense descriptions and summarize financial metrics, incorporating strict JSON output schemas, validation sanitization, and fallback handlers.
