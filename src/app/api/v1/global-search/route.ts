// GET /api/v1/global-search?q=...
// Searches across leads, students, enrollments, payments, companies, etc.
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, applyOfficeScope } from '@/lib/auth-utils';
import { ok, unauthorized, serverError } from '@/lib/api';

async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    if (!q || q.length < 2) return ok({ results: [] });

    const scope = applyOfficeScope(user, {});
    const officeFilter = scope ? { officeId: scope } : {};

    const [leads, students, enrollments, payments, companies, jobApps, placements, colleges, collegeApps] = await Promise.all([
      db.lead.findMany({ where: { ...officeFilter, OR: [{ studentName: { contains: q } }, { mobile: { contains: q } }, { whatsapp: { contains: q } }, { email: { contains: q } }, { leadCode: { contains: q } }] }, take: 5, include: { office: true } }),
      db.student.findMany({ where: { ...officeFilter, OR: [{ name: { contains: q } }, { mobile: { contains: q } }, { whatsapp: { contains: q } }, { email: { contains: q } }, { studentCode: { contains: q } }] }, take: 5, include: { office: true } }),
      db.enrollment.findMany({ where: { ...officeFilter, enrollmentCode: { contains: q } }, take: 5, include: { student: true, course: true } }),
      db.payment.findMany({ where: { ...officeFilter, OR: [{ receiptNo: { contains: q } }, { referenceNo: { contains: q } }] }, take: 5, include: { student: true } }),
      db.company.findMany({ where: { OR: [{ companyName: { contains: q } }, { industry: { contains: q } }] }, take: 5 }),
      db.jobApplication.findMany({ where: { applicationCode: { contains: q } }, take: 5, include: { student: true, company: true } }),
      db.placement.findMany({ where: { placementCode: { contains: q } }, take: 5, include: { student: true, company: true } }),
      db.college.findMany({ where: { OR: [{ collegeName: { contains: q } }, { university: { contains: q } }] }, take: 5 }),
      db.collegeApplication.findMany({ where: { ...officeFilter, applicationCode: { contains: q } }, take: 5, include: { student: true, college: true } }),
    ]);

    const results = [
      ...leads.map(l => ({ type: 'Lead', id: l.id, label: `${l.studentName} - ${l.leadCode}`, sub: l.mobile, entity: 'lead' })),
      ...students.map(s => ({ type: 'Student', id: s.id, label: `${s.name} - ${s.studentCode}`, sub: s.mobile, entity: 'student' })),
      ...enrollments.map(e => ({ type: 'Enrollment', id: e.id, label: `${e.enrollmentCode} - ${e.student?.name}`, sub: e.course?.courseName, entity: 'enrollment' })),
      ...payments.map(p => ({ type: 'Payment', id: p.id, label: `${p.receiptNo} - ${p.student?.name}`, sub: `₹${p.amount}`, entity: 'payment' })),
      ...companies.map(c => ({ type: 'Company', id: c.id, label: c.companyName, sub: c.industry, entity: 'company' })),
      ...jobApps.map(j => ({ type: 'Job Application', id: j.id, label: `${j.applicationCode} - ${j.student?.name}`, sub: j.company?.companyName, entity: 'jobApplication' })),
      ...placements.map(p => ({ type: 'Placement', id: p.id, label: `${p.placementCode} - ${p.student?.name}`, sub: p.company?.companyName, entity: 'placement' })),
      ...colleges.map(c => ({ type: 'College', id: c.id, label: c.collegeName, sub: c.university, entity: 'college' })),
      ...collegeApps.map(c => ({ type: 'College Application', id: c.id, label: `${c.applicationCode} - ${c.student?.name}`, sub: c.college?.collegeName, entity: 'collegeApplication' })),
    ];

    return ok({ results });
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
