// Comprehensive entity audit — check record counts for every module
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const entities = [
    ['Office', 'office'],
    ['User', 'user'],
    ['Employee', 'employee'],
    ['Lead', 'lead'],
    ['LeadAssignment', 'leadAssignment'],
    ['LeadActivity', 'leadActivity'],
    ['Call', 'call'],
    ['FollowUp', 'followUp'],
    ['Appointment', 'appointment'],
    ['CounsellingSession', 'counsellingSession'],
    ['Student', 'student'],
    ['StudentDocument', 'studentDocument'],
    ['Course', 'course'],
    ['CourseSemester', 'courseSemester'],
    ['Subject', 'subject'],
    ['Enrollment', 'enrollment'],
    ['Batch', 'batch'],
    ['BatchStudent', 'batchStudent'],
    ['Attendance', 'attendance'],
    ['Payment', 'payment'],
    ['EmiSchedule', 'emiSchedule'],
    ['Invoice', 'invoice'],
    ['College', 'college'],
    ['CollegeApplication', 'collegeApplication'],
    ['SemesterPayment', 'semesterPayment'],
    ['Company', 'company'],
    ['JobOpening', 'jobOpening'],
    ['JobApplication', 'jobApplication'],
    ['Interview', 'interview'],
    ['Offer', 'offer'],
    ['Placement', 'placement'],
    ['Income', 'income'],
    ['Expense', 'expense'],
    ['EmployeeTarget', 'employeeTarget'],
    ['IncentiveRule', 'incentiveRule'],
    ['IncentiveCalculation', 'incentiveCalculation'],
    ['Notification', 'notification'],
    ['AuditLog', 'auditLog'],
    ['Setting', 'setting'],
  ];

  console.log('Entity                              Count   Status');
  console.log('──────────────────────────────────  ──────  ──────');
  for (const [label, prop] of entities) {
    try {
      const count = await (db as any)[prop].count();
      const status = count === 0 ? '⚠️  EMPTY' : count < 3 ? '⚠️  LOW' : '✓';
      console.log(`${label.padEnd(35)} ${String(count).padStart(6)}   ${status}`);
    } catch (e) {
      console.log(`${label.padEnd(35)}   ERROR  ✗`);
    }
  }
}

main().catch(console.error).finally(() => db.$disconnect());
