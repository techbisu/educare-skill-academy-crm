import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { ok, serverError, unauthorized } from '@/lib/api';

async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const employee = user.employeeId ? await db.employee.findUnique({ where: { id: user.employeeId }, include: { office: true } }) : null;
    const unreadNotifications = await db.notification.count({ where: { userId: user.id, isRead: false } });
    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        officeId: user.officeId,
        officeName: user.officeName,
        employeeId: user.employeeId,
        designation: employee?.designation,
      },
      unreadNotifications,
    });
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
