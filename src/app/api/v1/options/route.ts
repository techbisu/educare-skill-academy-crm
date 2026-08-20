// GET /api/v1/options?type=offices|employees|courses|colleges|companies|batches|permissions|roles
// Returns simple lists for use in dropdowns / selects on the client.
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, applyOfficeScope } from '@/lib/auth-utils';
import { ok, unauthorized, serverError } from '@/lib/api';

async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    if (!type) return ok([]);
    const scope = applyOfficeScope(user, {});
    let results: any[] = [];

    switch (type) {
      case 'offices':
        results = (await db.office.findMany({ where: { status: 'Active' }, select: { id: true, officeName: true, officeCode: true } })).map(o => ({ value: o.id, label: o.officeName, code: o.officeCode }));
        break;
      case 'employees':
        results = (await db.employee.findMany({ where: { ...scope ? { officeId: scope } : {}, status: 'Active' }, select: { id: true, name: true, designation: true, officeId: true }, orderBy: { name: 'asc' } })).map(e => ({ value: e.id, label: `${e.name} (${e.designation || ''})`, officeId: e.officeId }));
        break;
      case 'courses':
        results = (await db.course.findMany({ where: { status: 'Active' }, select: { id: true, courseName: true, courseCode: true, category: true, fee: true, duration: true } })).map(c => ({ value: c.id, label: c.courseName, code: c.courseCode, category: c.category, fee: c.fee, duration: c.duration }));
        break;
      case 'colleges':
        results = (await db.college.findMany({ where: { status: 'Active' }, select: { id: true, collegeName: true, university: true, location: true } })).map(c => ({ value: c.id, label: c.collegeName, university: c.university }));
        break;
      case 'companies':
        results = (await db.company.findMany({ where: { status: 'Active' }, select: { id: true, companyName: true, industry: true, location: true } })).map(c => ({ value: c.id, label: c.companyName, industry: c.industry }));
        break;
      case 'batches':
        results = (await db.batch.findMany({ where: { ...scope ? { officeId: scope } : {}, status: { in: ['Upcoming', 'Active'] } }, include: { course: true }, orderBy: { startDate: 'desc' } })).map(b => ({ value: b.id, label: `${b.batchCode} - ${b.course.courseName}`, courseId: b.courseId }));
        break;
      case 'jobOpenings':
        results = (await db.jobOpening.findMany({ where: { status: 'Open' }, include: { company: true } })).map(j => ({ value: j.id, label: `${j.jobTitle} @ ${j.company.companyName}`, companyId: j.companyId, salaryMin: j.salaryMin, salaryMax: j.salaryMax }));
        break;
      case 'roles':
        results = (await db.role.findMany()).map(r => ({ value: r.id, label: r.name }));
        break;
      case 'permissions':
        results = (await db.permission.findMany({ orderBy: { group: 'asc' } })).map(p => ({ value: p.id, label: p.name, group: p.group }));
        break;
      case 'students':
        results = (await db.student.findMany({ where: { ...scope ? { officeId: scope } : {}, status: 'Active' }, select: { id: true, name: true, studentCode: true, mobile: true }, take: 200, orderBy: { name: 'asc' } })).map(s => ({ value: s.id, label: `${s.name} (${s.studentCode})`, mobile: s.mobile }));
        break;
      case 'leads':
        results = (await db.lead.findMany({ where: { ...scope ? { officeId: scope } : {} }, select: { id: true, studentName: true, leadCode: true, mobile: true }, take: 200, orderBy: { createdAt: 'desc' } })).map(l => ({ value: l.id, label: `${l.studentName} (${l.leadCode})`, mobile: l.mobile }));
        break;
      case 'settings':
        // Settings options are admin-only. Frontline staff do not need this.
        if (!user.roles.includes('Super Admin') && !user.roles.includes('Admin')) {
          return ok([]);
        }
        results = (await db.setting.findMany()).map(s => ({ key: s.key, value: s.value, group: s.group }));
        break;
      default:
        return ok([]);
    }
    return ok(results);
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
