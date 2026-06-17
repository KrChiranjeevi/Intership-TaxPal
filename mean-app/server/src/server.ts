import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './config/prisma.client.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB Connection at startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connection established successfully.');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message || err);
  });

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});