import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './api/modules/user/user.routes.js';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Mount user routes
app.use('/api/auth', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running 🚀' });
});

export default app;
