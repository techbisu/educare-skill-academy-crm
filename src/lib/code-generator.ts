import { db } from '@/lib/db';

// Auto-incrementing sequence for code generation: EDU-LEAD-000001, EDU-STU-000001, etc.
// Atomic increment using a transaction so concurrent inserts never collide.

const COUNTERS: Record<string, { prefix: string; padLength: number }> = {
  lead:        { prefix: 'EDU-LEAD-', padLength: 6 },
  student:     { prefix: 'EDU-STU-',  padLength: 6 },
  enrollment:  { prefix: 'EDU-ENR-',  padLength: 6 },
  payment:     { prefix: 'EDU-RCP-',  padLength: 6 },
  appointment: { prefix: 'EDU-APT-',  padLength: 6 },
  invoice:     { prefix: 'EDU-INV-', padLength: 6 },
  job_opening: { prefix: 'EDU-JOB-',  padLength: 6 },
  job_application: { prefix: 'EDU-JAP-', padLength: 6 },
  college_application: { prefix: 'EDU-CAP-', padLength: 6 },
  placement:   { prefix: 'EDU-PLT-', padLength: 6 },
  income:      { prefix: 'EDU-INC-',  padLength: 6 },
  expense:     { prefix: 'EDU-EXP-',  padLength: 6 },
};

export async function generateCode(counterName: keyof typeof COUNTERS): Promise<string> {
  const cfg = COUNTERS[counterName];
  if (!cfg) throw new Error(`Unknown counter: ${counterName}`);
  // Use upsert pattern for atomic increment
  const counter = await db.counter.upsert({
    where: { name: counterName },
    update: { value: { increment: 1 } },
    create: { name: counterName, value: 1, prefix: cfg.prefix },
  });
  return `${cfg.prefix}${String(counter.value).padStart(cfg.padLength, '0')}`;
}
