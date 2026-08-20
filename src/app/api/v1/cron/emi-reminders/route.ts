// GET/POST /api/v1/cron/emi-reminders?secret=...
// Protected by CRON_SECRET env var. Designed to be called by Vercel Cron / external scheduler daily.
// Idempotent: each EMI gets at most one reminder per status transition.

import { NextRequest } from 'next/server';
import { runEmiReminderJob } from '@/lib/notification-providers';
import { ok, unauthorized, serverError } from '@/lib/api';

async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
    const expected = process.env.CRON_SECRET;
    if (expected && secret !== expected) return unauthorized('Invalid cron secret');
    // If no CRON_SECRET is set, we still require some secret for safety
    if (!expected && !secret) return unauthorized('CRON_SECRET not configured');
    const result = await runEmiReminderJob();
    return ok(result, `EMI reminder job: ${result.processed} processed, ${result.successCount} sent`);
  } catch (e: any) {
    console.error('Cron EMI reminder error:', e);
    return serverError(e?.message);
  }
}

export { handler as GET, handler as POST };
