import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import userRoutes from './api/modules/user/user.routes.js';
import transactionRoutes from './api/modules/transactions/transaction.routes.js';
import dashboardRoutes from './api/modules/dashboard/dashboard.routes.js';
import budgetRoutes from './api/modules/budget/budget.routes.js';
import categoriesRouter from './api/modules/categories/categories.routes.js';
import notificationsRouter from "./api/modules/notifications/notifications.routes.js";
import securityRouter from './api/modules/security/security.routes.js';
import taxEstimatorRoutes from './api/modules/tax/taxEstimator.routes.js';
import reportsRoutes from './api/modules/reports/reports.routes.js';

dotenv.config();

const app = express();

// ✅ CORS setup for both localhost (dev) and Render (prod)
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://taxpal-full-stack-frontend.onrender.com'
  ],
  credentials: true
}));

app.use(express.json());
app.disable('etag');

// ✅ Universal no-cache middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ✅ Routes
app.use('/api/auth', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/budgets', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
}, budgetRoutes);

app.use('/api/categories', categoriesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/security', securityRouter);
app.use('/api/tax-estimator', taxEstimatorRoutes);
app.use('/api/reports', reportsRoutes);

// ✅ Static reports
app.use('/generated_reports', express.static(path.join(process.cwd(), 'generated_reports'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store');
    }
    if (filePath.endsWith('.csv')) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// ✅ Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running 🚀' });
});

export default app;
