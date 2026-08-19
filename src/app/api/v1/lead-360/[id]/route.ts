// GET /api/v1/lead-360/[id] -> returns complete Lead with all related records.
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, officeScope } from '@/lib/auth-utils';
import { ok, forbidden, notFound, unauthorized, serverError } from '@/lib/api';

async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        office: true,
        assignedEmployee: { include: { office: true } },
        convertedStudent: true,
        assignments: { include: { employee: true, assignedBy: true }, orderBy: { assignedAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 100 },
        calls: { include: { employee: true }, orderBy: { callDate: 'desc' } },
        followUps: { include: { assignedTo: true }, orderBy: { dueDate: 'desc' } },
        appointments: { include: { employee: true, office: true }, orderBy: { date: 'desc' } },
        counsellingSessions: { include: { counsellor: true }, orderBy: { date: 'desc' } },
      },
    });
    if (!lead) return notFound('Lead not found');
    const scope = officeScope(user);
    if (scope && lead.officeId !== scope) return forbidden();
    return ok(lead);
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
