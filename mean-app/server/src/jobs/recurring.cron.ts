// src/jobs/recurring.cron.ts
import cron from 'node-cron';
import { processDueRecurringTransactions } from '../api/modules/recurring/recurring.service.js';

/**
 * Initializes recurring transactions background cron job.
 * Runs every hour to check for due payments and automatically generates transactions.
 */
export function initRecurringCron() {
  // Run at minute 0 of every hour ('0 * * * *')
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running scheduled recurring transactions processor...');
      const result = await processDueRecurringTransactions();
      if (result.processed > 0) {
        console.log(`[CRON] Processed ${result.processed} due recurring transaction(s).`);
      }
    } catch (err: any) {
      console.error('[CRON] Error executing recurring transactions cron:', err?.message || err);
    }
  });

  console.log('[CRON] Recurring transactions cron scheduler initialized (hourly).');
}
