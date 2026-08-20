// GET /api/v1/student-360/[id] -> returns complete Student with all related records.
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, officeScope } from '@/lib/auth-utils';
import { ok, forbidden, notFound, unauthorized, serverError } from '@/lib/api';

async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const student = await db.student.findUnique({
      where: { id },
      include: {
        office: true,
        lead: { include: { assignedEmployee: true } },
        enrollments: { include: { course: true, semester: true, batch: true, counsellor: true, _count: { select: { payments: true, emiSchedules: true } } }, orderBy: { enrollmentDate: 'desc' } },
        payments: { include: { enrollment: true, receivedBy: true }, orderBy: { paymentDate: 'desc' }, take: 50 },
        documents: { orderBy: { uploadedAt: 'desc' } },
        batchStudents: { include: { batch: { include: { course: true, trainer: true } } } },
        counsellingSessions: { include: { counsellor: true }, orderBy: { date: 'desc' } },
        collegeApplications: { include: { college: true, counsellor: true, semesterPayments: true }, orderBy: { applicationDate: 'desc' } },
        jobApplications: { include: { job: { include: { company: true } }, company: true, interviews: true, offer: true }, orderBy: { appliedDate: 'desc' } },
        placements: { include: { company: true, application: true, placementExecutive: true }, orderBy: { createdAt: 'desc' } },
        followUps: { include: { assignedTo: true }, orderBy: { dueDate: 'desc' }, take: 30 },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        _count: { select: { enrollments: true, payments: true, documents: true, jobApplications: true } },
      },
    });
    if (!student) return notFound('Student not found');
    const scope = officeScope(user);
    if (scope && student.officeId !== scope) return forbidden();
    return ok(student);
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
