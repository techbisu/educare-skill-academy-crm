import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Session } from 'next-auth';

export type AppSession = Session & {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: string[];
    permissions: string[];
    employeeId?: string;
    officeId?: string;
    officeName?: string;
  };
};

export async function getSession(): Promise<AppSession | null> {
  return (await getServerSession(authOptions)) as AppSession | null;
}

export async function requireUser(): Promise<AppSession['user']> {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export async function requirePermission(permission: string): Promise<AppSession['user']> {
  const user = await requireUser();
  if (user.roles.includes('Super Admin')) return user;
  if (!user.permissions.includes(permission)) throw new Error('Forbidden');
  return user;
}

export function hasPermission(user: { roles: string[]; permissions: string[] }, permission: string): boolean {
  if (user.roles.includes('Super Admin')) return true;
  return user.permissions.includes(permission);
}

// Office-scoped data isolation helper.
// If user is not Super Admin and not Admin, restrict to their office.
// Returns the officeId filter or null (= no restriction).
export function officeScope(user: { roles: string[]; officeId?: string }): string | null {
  if (user.roles.includes('Super Admin') || user.roles.includes('Admin')) return null;
  return user.officeId ?? null;
}

// Apply office scope to a Prisma where clause
export function applyOfficeScope<T extends Record<string, any>>(
  user: { roles: string[]; officeId?: string },
  where: T = {} as T
): T {
  const scope = officeScope(user);
  if (scope) return { ...where, officeId: scope } as T;
  return where;
}
