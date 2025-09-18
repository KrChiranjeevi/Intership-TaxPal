// import { Router } from 'express';
// import { addIncome, addExpense, getDashboard } from '../controllers/transaction.controller';

// const router = Router();

// router.post('/income', addIncome);
// router.post('/expense', addExpense);
// router.get('/dashboard', getDashboard);

// export default router;


import { Router } from 'express';

const router = Router();

// Add Expense
router.post('/expense', async (req, res) => {
  try {
    const { amount, description } = req.body;
    // TODO: Save expense to DB
    console.log('Expense added:', amount, description);
    res.status(201).json({ message: 'Expense added successfully' });
  } catch (err) {
    console.error('Error in /expense:', err);
    res.status(500).json({ message: 'Error adding expense' });
  }
});

// Add Income
router.post('/income', async (req, res) => {
  try {
    const { amount, description } = req.body;
    // TODO: Save income to DB
    console.log('Income added:', amount, description);
    res.status(201).json({ message: 'Income added successfully' });
  } catch (err) {
    console.error('Error in /income:', err);
    res.status(500).json({ message: 'Error adding income' });
  }
});

// Get All Transactions
router.get('/', async (_req, res) => {
  try {
    // TODO: Fetch all transactions from DB
    res.json({ transactions: [] });
  } catch (err) {
    console.error('Error in GET /transactions:', err);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

export default router;

