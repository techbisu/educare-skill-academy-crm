import { db } from '@/lib/db';

// Audit log helper. Records old/new values for any entity action.
export async function auditLog(params: {
  actionUserId?: string;
  officeId?: string;
  employeeId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actionUserId: params.actionUserId ?? null,
        officeId: params.officeId ?? null,
        employeeId: params.employeeId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    });
  } catch (e) {
    console.error('Notification create failed:', e);
  }
}

// Add a Lead activity timeline entry (immutable)
export async function addLeadActivity(params: {
  leadId: string;
  action: string;
  description?: string;
  metadata?: any;
  createdByUserId?: string;
}): Promise<void> {
  try {
    await db.leadActivity.create({
      data: {
        leadId: params.leadId,
        action: params.action,
        description: params.description ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        createdByUserId: params.createdByUserId ?? null,
      },
    });
  } catch (e) {
    console.error('Lead activity create failed:', e);
  }
}
