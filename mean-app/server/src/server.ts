import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './config/prisma.client.js';
import { initRecurringCron } from './jobs/recurring.cron.js';
import { startReminderScheduler } from './api/modules/email/reminder.cron.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB Connection at startup
prisma.$connect()
  .then(async () => {
    console.log('✅ Database connection established successfully.');
    try {
      // Ensure role and isActive columns exist in User table for cloud databases
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;`);
    } catch (e: any) {
      console.warn('Safe column sync notice:', e?.message || e);
    }
    // Start background jobs once DB connects
    initRecurringCron();
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message || err);
  });

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});