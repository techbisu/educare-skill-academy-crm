// Unified data API: /api/v1/data/[entity]  and  /api/v1/data/[entity]/[id]
//
// GET    /api/v1/data/leads               -> list with pagination/search/filter
// GET    /api/v1/data/leads/[id]          -> detail
// POST   /api/v1/data/leads               -> create
// PUT    /api/v1/data/leads/[id]          -> update
// DELETE /api/v1/data/leads/[id]          -> soft delete (where applicable)
//
// All operations enforce office scope & audit logging.

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ENTITY_MAP, getModel, type EntityName } from '@/lib/entity-map';
import { applyOfficeScope, officeScope, requireUser, hasPermission } from '@/lib/auth-utils';
import { auditLog } from '@/lib/audit';
import { generateCode } from '@/lib/code-generator';
import { ok, fail, unauthorized, forbidden, notFound, serverError, parsePagination } from '@/lib/api';
import { getPermissionGroup, methodToAction } from '@/lib/entity-permissions';

// Mapping: entity -> code field name + counter name
const CODE_FIELDS: Record<string, { field: string; counter: Parameters<typeof generateCode>[0] }> = {
  lead:               { field: 'leadCode',         counter: 'lead' },
  student:            { field: 'studentCode',      counter: 'student' },
  enrollment:         { field: 'enrollmentCode',   counter: 'enrollment' },
  payment:            { field: 'receiptNo',       counter: 'payment' },
  appointment:        { field: 'appointmentCode', counter: 'appointment' },
  invoice:            { field: 'invoiceNumber',   counter: 'invoice' },
  jobOpening:         { field: 'jobCode',         counter: 'job_opening' },
  jobApplication:     { field: 'applicationCode', counter: 'job_application' },
  collegeApplication: { field: 'applicationCode', counter: 'college_application' },
  placement:          { field: 'placementCode',   counter: 'placement' },
  income:             { field: 'incomeCode',      counter: 'income' },
  expense:            { field: 'expenseCode',     counter: 'expense' },
};

async function handler(req: NextRequest, ctx: { params: Promise<{ entity: string; id?: string }> }) {
  try {
    const user = await requireUser();
    const { entity, id } = await ctx.params;
    if (!(entity in ENTITY_MAP)) return fail(`Unknown entity: ${entity}`, 404);
    const entityName = entity as EntityName;
    const model = getModel(entityName);
    const cfg = ENTITY_MAP[entityName];

    // ===== Permission enforcement =====
    // Super Admin bypasses all checks. Otherwise the user must have the required
    // permission: '<group>.<action>' where group comes from ENTITY_PERMISSION_GROUP
    // and action comes from the HTTP method.
    if (!user.roles.includes('Super Admin')) {
      const group = getPermissionGroup(entityName);
      if (group) {
        const action = methodToAction(req.method || 'GET');
        const permission = `${group.toLowerCase()}.${action}`;
        // 'edit' also requires 'view' implicit, but we check the exact action.
        // For audit logs we also accept 'auditlog.view' for GET only.
        if (!hasPermission(user, permission)) {
          // Special case: notification list is allowed for any authenticated user
          // (they will only see their own — see below).
          if (!(entityName === 'notification' && action === 'view')) {
            return forbidden(`Missing permission: ${permission}`);
          }
        }
      } else {
        // Entities not in the map default to admin-only
        if (!user.roles.includes('Admin')) {
          return forbidden(`Access to ${entityName} is restricted to administrators`);
        }
      }
    }

    // Special scoping for notification: users only see their own notifications
    const isPersonalEntity = entityName === 'notification';

    if (req.method === 'GET') {
      if (id) {
        const rec = await model.findUnique({ where: { id }, include: cfg.include });
        if (!rec) return notFound();
        // For personal entities, ensure the user owns the record
        if (isPersonalEntity && rec.userId !== user.id && !user.roles.includes('Super Admin')) {
          return forbidden();
        }
        return ok(rec);
      }
      const { page, pageSize, search, sortBy: rawSortBy, sortDir, skip, take } = parsePagination(req);
      // Use entity-configured orderBy as default (some entities like Call/FollowUp/Counselling
      // don't have a `createdAt` field, so defaulting to createdAt breaks).
      const sortBy = rawSortBy === 'createdAt' ? (cfg.orderBy || 'createdAt') : rawSortBy;
      const url = new URL(req.url);
      // Personal entities are always scoped to the current user (except Super Admin)
      const where: any = isPersonalEntity && !user.roles.includes('Super Admin')
        ? { userId: user.id }
        : applyOfficeScope(user, {});
      if (search && cfg.searchable.length) {
        where.OR = cfg.searchable.map((field: string) => ({ [field]: { contains: search } }));
      }
      const FILTER_KEYS = ['status','officeId','source','leadType','paymentStatus','paymentMode','gender','category','mode','result','priority','entityType','assignedToId','assignedEmployeeId','studentId','leadId','enrollmentId','batchId','courseId','collegeId','jobId','companyId','placementExecutiveId','employeeId','period','ruleType','basis','documentType','isRead','type','verificationDate'];
      for (const key of FILTER_KEYS) {
        const v = url.searchParams.get(key);
        if (v) where[key] = v;
      }
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');
      const dateField = url.searchParams.get('dateField') || defaultDateField(entityName);
      if (dateFrom && dateField) {
        where[dateField] = { ...(where[dateField] || {}), gte: new Date(dateFrom) };
      }
      if (dateTo && dateField) {
        where[dateField] = { ...(where[dateField] || {}), lte: new Date(dateTo) };
      }
      const [records, total] = await Promise.all([
        model.findMany({ where, include: cfg.include, orderBy: { [sortBy]: sortDir }, skip, take }),
        model.count({ where }),
      ]);
      return ok(records, 'Success', { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if ('officeId' in body && !body.officeId) body.officeId = user.officeId;
      if ('officeId' in body) {
        const scope = officeScope(user);
        if (scope && body.officeId !== scope) return forbidden('Cannot create record for another office');
      }
      // Auto-generate code field if needed
      const codeCfg = CODE_FIELDS[entityName];
      if (codeCfg && !body[codeCfg.field]) {
        body[codeCfg.field] = await generateCode(codeCfg.counter);
      }
      const rec = await model.create({ data: body, include: cfg.include });
      await auditLog({ actionUserId: user.id, officeId: rec.officeId ?? user.officeId, action: `${entityName}.create`, entityType: entityName, entityId: rec.id, newValues: rec });
      return ok(rec, `${entityName} created successfully`);
    }

    if (req.method === 'PUT') {
      if (!id) return fail('ID required for update', 400);
      const existing = await model.findUnique({ where: { id } });
      if (!existing) return notFound();
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
      if (!id) return fail('ID required for delete', 400);
      const existing = await model.findUnique({ where: { id } });
      if (!existing) return notFound();
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

    return fail('Method not allowed', 405);
  } catch (e: any) {
    console.error('Data API error:', e);
    if (e?.message === 'Unauthorized') return unauthorized();
    if (e?.message === 'Forbidden') return forbidden();
    return serverError(e?.message);
  }
}

function defaultDateField(entity: EntityName): string {
  switch (entity) {
    case 'lead': return 'createdAt';
    case 'student': return 'createdAt';
    case 'enrollment': return 'enrollmentDate';
    case 'payment': return 'paymentDate';
    case 'emi': return 'dueDate';
    case 'invoice': return 'invoiceDate';
    case 'appointment': return 'date';
    case 'call': return 'callDate';
    case 'followUp': return 'dueDate';
    case 'income': return 'incomeDate';
    case 'expense': return 'expenseDate';
    case 'counselling': return 'date';
    default: return 'createdAt';
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
