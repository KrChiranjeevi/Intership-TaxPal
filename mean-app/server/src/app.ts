import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// import transactionRoutes from './api/modules/transaction/transaction.routes';
import transactionRoutes from './api/modules/transaction/transaction.routes.js';

import userRoutes from './api/modules/user/user.routes.js';

dotenv.config();

const app = express();

// middleware
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', userRoutes);

// test route
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running 🚀' });
});

export default app;
