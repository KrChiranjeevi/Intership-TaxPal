<div align="center">

# 💰 TaxPal — Smart Tax & Finance Manager

[![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Prisma-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

**A full-stack MEAN-inspired web application for managing taxes, budgets, transactions, and financial reports — with a stunning dark UI and smooth animations.**

[✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Project Structure](#-project-structure) • [🚀 Getting Started](#-getting-started) • [📡 API Overview](#-api-overview) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

- 🔐 **Authentication** — Secure JWT-based login & signup
- 📊 **Dashboard** — Real-time expense breakdown with Chart.js doughnut charts
- 💳 **Transactions** — Add, view, filter, and manage all financial transactions
- 📁 **Budgets** — Set and track budgets with visual progress indicators
- 🧾 **Tax Estimator** — Estimate tax liability based on income & deductions
- 📈 **Reports** — Export reports as PDF, CSV, or Excel
- ⚙️ **Settings** — Manage profile, preferences, and security settings
- 🎨 **Dark Premium UI** — Glassmorphism design with GSAP animations
- 📱 **Responsive Design** — Mobile-friendly layout across all screen sizes

---

## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Version | Purpose |
|---|---|---|
| Angular | 20 | Core frontend framework |
| NgRx | 20 | State management (Store + Effects) |
| Angular Material | 20 | UI components |
| Chart.js + ng2-charts | 4.x | Data visualization |
| GSAP | 3.x | Smooth animations |
| TypeScript | 5.9 | Type-safe development |
| SCSS | — | Styled components |

### Backend (Server)
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 5.x | REST API server |
| TypeScript | 5.9 | Type-safe backend |
| Prisma ORM | 6.x | Database access layer |
| MySQL | — | Relational database |
| JSON Web Token | 9.x | Authentication |
| bcrypt | 6.x | Password hashing |
| PDFKit | 0.17 | PDF report generation |
| xlsx / json2csv | — | Excel & CSV exports |
| Swagger UI | 5.x | API documentation |
| Zod | 4.x | Input validation |
| Jest | 30 | Unit testing |

---

## 📁 Project Structure

```
taxpal-full-stack/
├── mean-app/
│   ├── client/                     # Angular Frontend
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── core/           # Guards, interceptors, services
│   │   │       ├── features/       # Feature modules
│   │   │       │   ├── dashboard/
│   │   │       │   ├── transactions/
│   │   │       │   ├── budgets/
│   │   │       │   ├── reports/
│   │   │       │   ├── tax-estimator/
│   │   │       │   ├── settings/
│   │   │       │   └── users/
│   │   │       ├── layouts/        # Shell layout components
│   │   │       ├── shared/         # Shared components & pipes
│   │   │       └── state/          # NgRx global state
│   │   ├── proxy.conf.json         # API proxy config
│   │   └── package.json
│   │
│   ├── server/                     # Node.js + Express Backend
│   │   ├── src/
│   │   │   ├── api/                # API layer
│   │   │   ├── config/             # App configuration
│   │   │   ├── controllers/        # Route handlers
│   │   │   ├── routes/             # Express route definitions
│   │   │   ├── utils/              # Helper utilities
│   │   │   ├── app.ts              # Express app setup
│   │   │   └── server.ts           # Server entry point
│   │   ├── prisma/                 # Prisma schema & migrations
│   │   ├── docs/                   # API documentation (Swagger)
│   │   ├── .env                    # Environment variables (not committed)
│   │   └── package.json
│   │
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://www.mysql.com/) (running locally or via Docker)
- [Angular CLI](https://angular.io/cli) v20

```bash
npm install -g @angular/cli
```

---

### 1. Clone the Repository

```bash
git clone https://github.com/KrChiranjeevi/taxpal-full-stack.git
cd taxpal-full-stack/mean-app
```

---

### 2. Setup the Backend (Server)

```bash
cd server
```

#### Install dependencies
```bash
npm install
```

#### Configure environment variables

Create a `.env` file in the `server/` folder:

```env
DATABASE_URL="mysql://username:password@localhost:3306/taxpal_db"
JWT_SECRET="your_super_secret_jwt_key"
PORT=3000
```

#### Run database migrations

```bash
npx prisma migrate dev --name init
```

#### (Optional) Seed the database

```bash
npm run db:seed
```

#### Start the server

```bash
npm run dev
```

The server will run at **http://localhost:3000**

---

### 3. Setup the Frontend (Client)

Open a new terminal:

```bash
cd mean-app/client
```

#### Install dependencies
```bash
npm install
```

#### Start the Angular dev server

```bash
npm start
```

The app will open at **http://localhost:4200**

> The Angular app is configured with a proxy (`proxy.conf.json`) to forward API calls to the backend automatically.

---

## 📡 API Overview

The backend exposes a RESTful API. Full interactive documentation is available via **Swagger UI** at:

```
http://localhost:3000/api-docs
```

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & receive JWT token |
| `GET` | `/api/transactions` | Get all transactions |
| `POST` | `/api/transactions` | Create a new transaction |
| `GET` | `/api/budgets` | Get all budgets |
| `POST` | `/api/budgets` | Create a new budget |
| `GET` | `/api/reports` | Get financial reports |
| `GET` | `/api/tax` | Estimate tax |

> All protected routes require a `Bearer <token>` in the `Authorization` header.

---

## 🧪 Running Tests

### Backend Tests (Jest)

```bash
cd mean-app/server
npm test
```

### Frontend Tests (Karma + Jasmine)

```bash
cd mean-app/client
npm test
```

---

## 🔧 Scripts Reference

### Server

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `tsx src/server.ts` | Start dev server (hot reload) |
| `npm run build` | `tsc` | Compile TypeScript |
| `npm start` | `node dist/server.js` | Start production server |
| `npm test` | `jest` | Run unit tests |
| `npm run db:migrate` | Prisma migrate | Run database migrations |
| `npm run db:seed` | Prisma seed | Seed database with test data |

### Client

| Script | Command | Description |
|---|---|---|
| `npm start` | `ng serve` | Start Angular dev server |
| `npm run build` | `ng build --prod` | Build for production |
| `npm test` | `ng test` | Run Karma tests |

---

## 🎨 UI Screenshots

> Coming soon — premium dark dashboard with glassmorphism effects, doughnut charts, and GSAP animations.

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** your changes: `git commit -m 'Add some AmazingFeature'`
4. **Push** to the branch: `git push origin feature/AmazingFeature`
5. **Open** a Pull Request

---

## 👤 Author

**Kumar Chiranjeevi**
- GitHub: [@KrChiranjeevi](https://github.com/KrChiranjeevi)

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
Made with ❤️ by Kumar Chiranjeevi
</div>