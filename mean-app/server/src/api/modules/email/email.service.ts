// src/api/modules/email/email.service.ts
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Email not configured; graceful fallback — log and skip
    console.warn('[EmailService] SMTP not configured. Email sending is disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`[EmailService] Skipped email to ${options.to}: "${options.subject}" (SMTP not configured)`);
    return false;
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@taxpal.app';
    await t.sendMail({
      from: `TaxPal <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send email:', err);
    return false;
  }
}

// ── HTML EMAIL TEMPLATES ─────────────────────────────────────────────

export function budgetAlertTemplate(userName: string, budgetName: string, spent: number, limit: number, percentage: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Budget Alert</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#111827;border-radius:16px;border:1px solid #1e2847;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#ff5252,#ff9800);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">⚠️ Budget Alert</h1>
    </div>
    <p style="color:#9ca3af;margin-bottom:16px;">Hi <strong style="color:#e2e8f0;">${userName}</strong>,</p>
    <p style="color:#9ca3af;">Your <strong style="color:#ff9800;">${budgetName}</strong> budget has reached <strong style="color:#ff5252;">${percentage}%</strong> of its limit.</p>
    <div style="background:#1a2035;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Spent vs Limit</div>
      <div style="font-size:24px;font-weight:800;color:#ff5252;">₹${spent.toFixed(2)} / ₹${limit.toFixed(2)}</div>
      <div style="background:#0a0f1e;border-radius:8px;height:10px;margin-top:12px;overflow:hidden;">
        <div style="height:100%;background:linear-gradient(90deg,#ff9800,#ff5252);width:${Math.min(100, percentage)}%;border-radius:8px;"></div>
      </div>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center;margin-top:24px;">Log in to TaxPal to review your budget and spending.</p>
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL || 'https://taxpal.app'}/budget" style="background:linear-gradient(135deg,#00d2ff,#a855f7);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">View Budget</a>
    </div>
  </div>
</body>
</html>`;
}

export function taxReminderTemplate(userName: string, daysUntilDue: number, estimatedTax: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Tax Reminder</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#111827;border-radius:16px;border:1px solid #1e2847;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d2ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">📋 Tax Reminder</h1>
    </div>
    <p style="color:#9ca3af;">Hi <strong style="color:#e2e8f0;">${userName}</strong>,</p>
    <p style="color:#9ca3af;">Your estimated tax payment is due in <strong style="color:#00d2ff;">${daysUntilDue} days</strong>.</p>
    <div style="background:#1a2035;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Estimated Tax Due</div>
      <div style="font-size:32px;font-weight:900;color:#00d2ff;">₹${estimatedTax.toFixed(2)}</div>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL || 'https://taxpal.app'}/tax-estimator" style="background:linear-gradient(135deg,#00d2ff,#a855f7);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">View Tax Estimator</a>
    </div>
  </div>
</body>
</html>`;
}

export function weeklySummaryTemplate(
  userName: string,
  weekIncome: number,
  weekExpense: number,
  netSavings: number,
  topCategory: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Weekly Summary</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#111827;border-radius:16px;border:1px solid #1e2847;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00e676,#00d2ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">📊 Weekly Summary</h1>
    </div>
    <p style="color:#9ca3af;">Hi <strong style="color:#e2e8f0;">${userName}</strong>, here's your financial recap for this week:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
      <div style="background:#1a2035;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Income</div>
        <div style="font-size:20px;font-weight:800;color:#00e676;">₹${weekIncome.toFixed(2)}</div>
      </div>
      <div style="background:#1a2035;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Expenses</div>
        <div style="font-size:20px;font-weight:800;color:#ff5252;">₹${weekExpense.toFixed(2)}</div>
      </div>
      <div style="background:#1a2035;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Net Savings</div>
        <div style="font-size:20px;font-weight:800;color:${netSavings >= 0 ? '#00e676' : '#ff5252'};">₹${netSavings.toFixed(2)}</div>
      </div>
      <div style="background:#1a2035;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Top Category</div>
        <div style="font-size:14px;font-weight:700;color:#a855f7;">${topCategory || 'N/A'}</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${process.env.FRONTEND_URL || 'https://taxpal.app'}/dashboard" style="background:linear-gradient(135deg,#00d2ff,#a855f7);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">View Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}
