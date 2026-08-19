// Centralized constants — single source of truth for statuses, types, categories
// Used by both server (services) and client (UI selects, filters, badges).

export const LEAD_SOURCES = [
  'Facebook', 'YouTube', 'Instagram', 'WhatsApp', 'Website',
  'Google', 'Reference', 'Walk-in', 'Job Portal', 'Other'
] as const;

export const LEAD_TYPES = [
  'Job', 'Coaching', 'Internship', 'College Admission',
  'Diploma', 'B.Tech', 'ITI', 'Other'
] as const;

export const LEAD_STATUSES = [
  'New', 'Call Pending', 'Contacted', 'Interested', 'Follow-up',
  'Appointment Booked', 'Appointment Completed', 'Counselling Done',
  'Enrollment Pending', 'Enrolled', 'Payment Pending', 'Not Interested',
  'Wrong Number', 'Duplicate', 'Lost', 'Converted'
] as const;

export const CALL_RESULTS = [
  'Connected', 'Not Connected', 'Busy', 'Switched Off',
  'Wrong Number', 'Interested', 'Not Interested', 'Call Later',
  'Appointment Fixed'
] as const;

export const FOLLOWUP_STATUSES = ['Pending', 'Completed', 'Cancelled', 'Overdue'] as const;
export const FOLLOWUP_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export const APPOINTMENT_TYPES = ['Office Visit', 'Online', 'Phone', 'Video Call'] as const;
export const APPOINTMENT_STATUSES = [
  'Scheduled', 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled', 'No Show'
] as const;

export const STUDENT_STATUSES = ['Active', 'Inactive', 'Graduated', 'Placed', 'Dropped'] as const;

export const COURSE_CATEGORIES = ['Diploma', 'B.Tech', 'ITI', 'Internship', 'Coaching', 'Other'] as const;
export const COURSE_STATUSES = ['Active', 'Inactive'] as const;

export const BATCH_MODES = ['Offline', 'Online', 'Hybrid'] as const;
export const BATCH_STATUSES = ['Upcoming', 'Active', 'Completed', 'Cancelled'] as const;

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Leave'] as const;

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'] as const;
export const PAYMENT_STATUSES = ['Valid', 'Reversed', 'Refunded', 'Correction'] as const;
export const ENROLLMENT_PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid'] as const;
export const ENROLLMENT_STATUSES = ['Active', 'Completed', 'Cancelled', 'Suspended'] as const;

export const EMI_STATUSES = ['Upcoming', 'Due Today', 'Paid', 'Overdue', 'Partially Paid', 'Cancelled'] as const;

export const COLLEGE_APPLICATION_STATUSES = [
  'Interested', 'Application Started', 'Documents Pending', 'Application Submitted',
  'Under Review', 'Selected', 'Admission Confirmed', 'Cancelled', 'Rejected', 'Completed'
] as const;
export const SEMESTER_PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid', 'Overdue'] as const;

export const JOB_OPENING_STATUSES = ['Open', 'Closed', 'On Hold'] as const;
export const JOB_LOCATIONS = ['West Bengal', 'Kolkata', 'Bardhaman', 'Pune', 'Bangalore', 'Other'] as const;
export const JOB_APPLICATION_STATUSES = [
  'Eligible', 'Job Shared', 'Applied', 'Interview Scheduled', 'Interview Attended',
  'Selected', 'Offer Received', 'Joining Pending', 'Joined', 'Rejected', 'Not Interested'
] as const;

export const INTERVIEW_RESULTS = ['Pending', 'Selected', 'Rejected', 'On Hold'] as const;

export const OFFER_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Withdrawn'] as const;

export const PLACEMENT_STATUSES = [
  'Placement Pending', 'Eligible', 'Job Shared', 'Applied', 'Interview Scheduled',
  'Interview Attended', 'Selected', 'Offer Letter', 'Joining Pending', 'Joined',
  'Placement Completed', 'Rejected', 'Not Interested'
] as const;

export const INCOME_CATEGORIES = [
  'Course Fee', 'Coaching Fee', 'Placement Revenue',
  'Admission Consultancy', 'Internship Fee', 'Other Income'
] as const;

export const EXPENSE_CATEGORIES = [
  'Employee Salary', 'Office Rent', 'Electricity', 'Internet',
  'Marketing', 'Advertisement', 'Travel', 'Vendor Payment', 'Other Expense'
] as const;

export const DOCUMENT_TYPES = [
  'Aadhaar', 'Photo', 'Signature', '10th Certificate', '12th Certificate',
  'ITI Certificate', 'Diploma Certificate', 'B.Tech Documents', 'Resume',
  'Offer Letter', 'Joining Letter', 'Payment Receipt', 'Other'
] as const;
export const DOCUMENT_STATUSES = ['Pending', 'Uploaded', 'Verified', 'Rejected'] as const;

export const NOTIFICATION_TYPES = [
  'Follow-up Due', 'Appointment Reminder', 'EMI Due', 'Payment Received',
  'Interview Reminder', 'Joining Reminder', 'Task Assignment', 'Lead Assignment'
] as const;

export const ROLE_NAMES = [
  'Super Admin', 'Admin', 'HR', 'Caller', 'Counsellor',
  'Accounts', 'Placement Executive', 'Trainer'
] as const;

export const TARGET_PERIODS = ['Daily', 'Weekly', 'Monthly'] as const;

export const OFFICE_TYPES = ['Branch', 'Head Office', 'Franchise'] as const;

export const USER_STATUSES = ['Active', 'Inactive', 'Suspended'] as const;

export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'Suspended'] as const;

// ============================================================
// Permission catalogue — used to seed permissions
// ============================================================

export const PERMISSION_GROUPS = [
  'Lead', 'Student', 'Enrollment', 'Course', 'Batch',
  'Payment', 'EMI', 'Invoice', 'CollegeAdmission',
  'Company', 'JobOpening', 'JobApplication', 'Interview', 'Placement',
  'Finance', 'Employee', 'Office', 'User', 'Role', 'Report',
  'Notification', 'AuditLog', 'Document', 'Setting', 'Dashboard', 'FollowUp'
] as const;

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'assign', 'export'] as const;

// Role → permission mapping. Super Admin = everything.
export const ROLE_PERMISSIONS: Record<string, { group: string; actions: string[] }[]> = {
  'Super Admin': PERMISSION_GROUPS.flatMap(g => [{ group: g, actions: [...PERMISSION_ACTIONS] }]),
  'Admin': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Lead', actions: ['view', 'create', 'edit', 'delete', 'assign'] },
    { group: 'Student', actions: ['view', 'create', 'edit'] },
    { group: 'Enrollment', actions: ['view', 'create', 'edit'] },
    { group: 'Course', actions: ['view', 'create', 'edit', 'delete'] },
    { group: 'Batch', actions: ['view', 'create', 'edit'] },
    { group: 'Payment', actions: ['view', 'create', 'edit', 'export'] },
    { group: 'EMI', actions: ['view', 'edit'] },
    { group: 'Invoice', actions: ['view', 'create', 'export'] },
    { group: 'CollegeAdmission', actions: ['view', 'create', 'edit'] },
    { group: 'Company', actions: ['view', 'create', 'edit'] },
    { group: 'JobOpening', actions: ['view', 'create', 'edit'] },
    { group: 'JobApplication', actions: ['view', 'create', 'edit'] },
    { group: 'Interview', actions: ['view', 'create', 'edit'] },
    { group: 'Placement', actions: ['view', 'create', 'edit'] },
    { group: 'Finance', actions: ['view', 'create', 'edit', 'export'] },
    { group: 'Employee', actions: ['view', 'create', 'edit'] },
    { group: 'Office', actions: ['view', 'create', 'edit'] },
    { group: 'User', actions: ['view', 'create', 'edit'] },
    { group: 'Role', actions: ['view'] },
    { group: 'Report', actions: ['view', 'export'] },
    { group: 'Notification', actions: ['view'] },
    { group: 'AuditLog', actions: ['view'] },
    { group: 'Document', actions: ['view', 'create', 'edit'] },
    { group: 'Setting', actions: ['view', 'edit'] },
    { group: 'FollowUp', actions: ['view', 'create', 'edit'] },
  ],
  'HR': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Employee', actions: ['view', 'create', 'edit'] },
    { group: 'Office', actions: ['view'] },
    { group: 'User', actions: ['view', 'create', 'edit'] },
    { group: 'Report', actions: ['view'] },
    { group: 'Notification', actions: ['view'] },
  ],
  'Caller': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Lead', actions: ['view', 'create', 'edit', 'assign'] },
    { group: 'FollowUp', actions: ['view', 'create', 'edit'] },
    { group: 'Notification', actions: ['view'] },
  ],
  'Counsellor': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Lead', actions: ['view', 'edit', 'assign'] },
    { group: 'Student', actions: ['view', 'create', 'edit'] },
    { group: 'Enrollment', actions: ['view', 'create', 'edit'] },
    { group: 'Course', actions: ['view'] },
    { group: 'Batch', actions: ['view'] },
    { group: 'FollowUp', actions: ['view', 'create', 'edit'] },
    { group: 'Notification', actions: ['view'] },
  ],
  'Accounts': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Student', actions: ['view'] },
    { group: 'Enrollment', actions: ['view', 'edit'] },
    { group: 'Payment', actions: ['view', 'create', 'edit', 'export'] },
    { group: 'EMI', actions: ['view', 'edit'] },
    { group: 'Invoice', actions: ['view', 'create', 'export'] },
    { group: 'Finance', actions: ['view', 'create', 'edit', 'export'] },
    { group: 'Report', actions: ['view', 'export'] },
    { group: 'Notification', actions: ['view'] },
  ],
  'Placement Executive': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Student', actions: ['view', 'edit'] },
    { group: 'Company', actions: ['view', 'create', 'edit'] },
    { group: 'JobOpening', actions: ['view', 'create', 'edit'] },
    { group: 'JobApplication', actions: ['view', 'create', 'edit'] },
    { group: 'Interview', actions: ['view', 'create', 'edit'] },
    { group: 'Placement', actions: ['view', 'create', 'edit'] },
    { group: 'FollowUp', actions: ['view', 'create', 'edit'] },
    { group: 'Notification', actions: ['view'] },
  ],
  'Trainer': [
    { group: 'Dashboard', actions: ['view'] },
    { group: 'Batch', actions: ['view'] },
    { group: 'Student', actions: ['view'] },
    { group: 'Notification', actions: ['view'] },
  ],
};
