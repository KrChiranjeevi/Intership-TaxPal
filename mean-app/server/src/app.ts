import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import userRoutes from './api/modules/user/user.routes.js';
import transactionRoutes from './api/modules/transactions/transaction.routes.js';
import dashboardRoutes from './api/modules/dashboard/dashboard.routes.js';
import budgetRoutes from './api/modules/budget/budget.routes.js';
import categoriesRouter from './api/modules/categories/categories.routes.js';
import notificationsRouter from "./api/modules/notifications/notifications.routes.js";
import securityRouter from './api/modules/security/security.routes.js';
import taxEstimatorRoutes from './api/modules/tax/taxEstimator.routes.js';
import reportsRoutes from './api/modules/reports/reports.routes.js';
import aiRoutes from './api/modules/ai/ai.routes.js';
import recurringRoutes from './api/modules/recurring/recurring.routes.js';
import goalsRoutes from './api/modules/goals/goals.routes.js';
import adminRoutes from './api/modules/admin/admin.routes.js';

dotenv.config();

const app = express();

// ✅ Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Prevents breaking Angular dev assets/inline scripts
}));

// ✅ CORS setup — supports localhost (dev), Vercel (prod), and custom env var
const allowedOrigins = [
  'http://localhost:4200',
  'https://taxpal-full-stack-frontend.onrender.com',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or verified origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.disable('etag');

// ✅ Universal no-cache middleware
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ✅ Routes
app.use('/api/auth', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/security', securityRouter);
app.use('/api/tax-estimator', taxEstimatorRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recurring-transactions', recurringRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (_req, res) => {
  res.send("TaxPal Backend is running securely!");
});

// Health route
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'taxpal-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    success: true,
  });
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Centralized Express Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error caught:', err?.message || err);
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    status === 500 && isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
  });
});

export default app;
