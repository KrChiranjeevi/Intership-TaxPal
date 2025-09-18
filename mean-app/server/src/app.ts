import express from 'express';
import cors from 'cors';
import transactionRoutes from './api/modules/transaction/transaction.routes';

const app = express();

app.use(cors());
app.use(express.json());

// use the routes
app.use('/api/transactions', transactionRoutes);

// test route
app.get('/', (req, res) => {
  res.send('Server is running...');
});

export default app;



