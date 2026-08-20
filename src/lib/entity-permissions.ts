// Maps an entity name (used in /api/v1/data/[entity] URL) to the permission group
// that controls access to it. Used by the data API to enforce RBAC.
//
// If an entity is NOT in this map, access defaults to "Super Admin / Admin only".
// This is the safe default — entities must be explicitly opted in to non-admin access.

export const ENTITY_PERMISSION_GROUP: Record<string, string> = {
  // CRM
  lead: 'Lead',
  appointment: 'Appointment',
  call: 'Lead',               // calls are part of lead management
  followUp: 'FollowUp',
  counselling: 'Counselling',

  // Academics
  student: 'Student',
  course: 'Course',
  enrollment: 'Enrollment',
  batch: 'Batch',
  attendance: 'Attendance',

  // Finance
  payment: 'Payment',
  emi: 'EMI',
  invoice: 'Invoice',
  income: 'Finance',
  expense: 'Finance',

  // College Admissions
  college: 'CollegeAdmission',
  collegeApplication: 'CollegeAdmission',

  // Placement
  company: 'Company',
  jobOpening: 'JobOpening',
  jobApplication: 'JobApplication',
  placement: 'Placement',

  // HR
  employee: 'Employee',
  employeeTarget: 'Employee',
  incentiveRule: 'Finance',
  incentiveCalculation: 'Finance',

  // System — these default to admin-only via the fallback below
  office: 'Office',
  auditLog: 'AuditLog',
  notification: 'Notification',
  setting: 'Setting',

  // Colleges standalone (master data)
  // Already covered above
};

// Returns the permission group for an entity, or null if access should be
// restricted to Super Admin / Admin only.
export function getPermissionGroup(entity: string): string | null {
  return ENTITY_PERMISSION_GROUP[entity] || null;
}

// Maps an HTTP method to the permission action required.
export function methodToAction(method: string): 'view' | 'create' | 'edit' | 'delete' {
  switch (method) {
    case 'GET': return 'view';
    case 'POST': return 'create';
    case 'PUT':
    case 'PATCH': return 'edit';
    case 'DELETE': return 'delete';
    default: return 'view';
  }
}
