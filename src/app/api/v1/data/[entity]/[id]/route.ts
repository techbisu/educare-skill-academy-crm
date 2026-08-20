import { NextRequest } from 'next/server';
import { ENTITY_MAP, getModel, type EntityName } from '@/lib/entity-map';
import { officeScope, requireUser, hasPermission } from '@/lib/auth-utils';
import { ok, forbidden, notFound, serverError, unauthorized } from '@/lib/api';
import { auditLog } from '@/lib/audit';
import { getPermissionGroup, methodToAction } from '@/lib/entity-permissions';
import { db } from '@/lib/db';

// GET/PUT/DELETE for /api/v1/data/[entity]/[id]
async function handler(req: NextRequest, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const user = await requireUser();
    const { entity, id } = await ctx.params;
    if (!(entity in ENTITY_MAP)) return notFound(`Unknown entity: ${entity}`);
    const entityName = entity as EntityName;
    const model = getModel(entityName);
    const cfg = ENTITY_MAP[entityName];

    // ===== Permission enforcement =====
    if (!user.roles.includes('Super Admin')) {
      const group = getPermissionGroup(entityName);
      const action = methodToAction(req.method || 'GET');
      if (group) {
        const permission = `${group.toLowerCase()}.${action}`;
        if (!hasPermission(user, permission)) {
          // Special case: own notification can be viewed by anyone
          if (!(entityName === 'notification' && action === 'view')) {
            return forbidden(`Missing permission: ${permission}`);
          }
        }
      } else {
        if (!user.roles.includes('Admin')) {
          return forbidden(`Access to ${entityName} is restricted to administrators`);
        }
      }
    }

    const existing = await model.findUnique({ where: { id } });
    if (!existing) return notFound();

    // For personal entities (notification), ensure ownership
    if (entityName === 'notification' && existing.userId !== user.id && !user.roles.includes('Super Admin')) {
      return forbidden();
    }

    if (req.method === 'GET') {
      if (existing.officeId) {
        const scope = officeScope(user);
        if (scope && existing.officeId !== scope) return forbidden();
      }
      const rec = await model.findUnique({ where: { id }, include: cfg.include });
      return ok(rec);
    }

    if (req.method === 'PUT') {
      if (existing.officeId) {
        const scope = officeScope(user);
        if (scope && existing.officeId !== scope) return forbidden();
      }
      const body = await req.json();
      delete body.id;
      const rec = await model.update({ where: { id }, data: body, include: cfg.include });
      await auditLog({ actionUserId: user.id, officeId: rec.officeId ?? user.officeId, action: `${entityName}.update`, entityType: entityName, entityId: id, oldValues: existing, newValues: rec });
      return ok(rec, `${entityName} updated successfully`);
    }

    if (req.method === 'DELETE') {
      if (existing.officeId) {
        const scope = officeScope(user);
        if (scope && existing.officeId !== scope) return forbidden();
      }
      if ('status' in existing && (existing.status === 'Active' || existing.status === 'Upcoming' || existing.status === 'Pending')) {
        const newStatus = existing.status === 'Active' ? 'Inactive' : 'Cancelled';
        const rec = await model.update({ where: { id }, data: { status: newStatus } });
        await auditLog({ actionUserId: user.id, action: `${entityName}.soft_delete`, entityType: entityName, entityId: id, oldValues: existing, newValues: { status: newStatus } });
        return ok(rec, `${entityName} deactivated`);
      }
      await model.delete({ where: { id } });
      await auditLog({ actionUserId: user.id, action: `${entityName}.delete`, entityType: entityName, entityId: id, oldValues: existing });
      return ok({ id }, `${entityName} deleted`);
    }

    return serverError('Method not allowed');
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return unauthorized();
    if (e?.message === 'Forbidden') return forbidden();
    return serverError(e?.message);
  }
}

export { handler as GET, handler as PUT, handler as DELETE };
