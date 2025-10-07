// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';

// // import transactionRoutes from './api/modules/transaction/transaction.routes';

// import userRoutes from './api/modules/user/user.routes.js';
// import transactionRoutes from './api/modules/transactions/transaction.routes.js';
// import dashboardRoutes from './api/modules/dashboard/dashboard.routes.js';

// dotenv.config();

// const app = express();

// // middleware
// app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
// app.use(express.json());

// // routes
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/auth', userRoutes);
// app.use('/api/transactions', transactionRoutes); 
// app.use('/api/dashboard', dashboardRoutes);

// // test route
// app.get('/api/health', (_req, res) => {
//   res.json({ success: true, message: 'Server is running 🚀' });
// });

// export default app;


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import all routes. Make sure the file paths are correct.
import userRoutes from './api/modules/user/user.routes.js';
import transactionRoutes from './api/modules/transactions/transaction.routes.js';
import dashboardRoutes from './api/modules/dashboard/dashboard.routes.js';

dotenv.config();

const app = express();

// Middleware: ye sabse upar hona chahiye.
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Routes: har route ko sirf ek baar use karein.
app.use('/api/auth', userRoutes); // User authentication routes (login/signup)
app.use('/api/transactions', transactionRoutes); // Transaction routes (income/expense)
app.use('/api/dashboard', dashboardRoutes); // Dashboard data routes

// Test route to check server health
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running! 🚀' });
});

// Root route for initial server check
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Server is up!' });
});

export default app;