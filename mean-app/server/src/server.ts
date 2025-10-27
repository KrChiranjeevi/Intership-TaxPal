import dotenv from 'dotenv';
import app from './app.js';
import { PrismaClient } from '@prisma/client';


dotenv.config();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});