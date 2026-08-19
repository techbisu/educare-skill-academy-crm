// Prisma query builders per entity — keeps server-side filtering consistent
// and avoids N+1 by pre-declaring includes.
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const leadInclude = {
  office: true,
  assignedEmployee: true,
  convertedStudent: true,
  assignments: { include: { employee: true, assignedBy: true }, orderBy: { assignedAt: 'desc' } },
  _count: { select: { calls: true, followUps: true, appointments: true, counsellingSessions: true } },
} satisfies Prisma.LeadInclude;

const studentInclude = {
  office: true,
  lead: true,
  _count: { select: { enrollments: true, payments: true, documents: true, jobApplications: true, placements: true } },
} satisfies Prisma.StudentInclude;

const enrollmentInclude = {
  student: true, course: true, semester: true, batch: true, counsellor: true, office: true,
  _count: { select: { payments: true, emiSchedules: true, invoices: true } },
} satisfies Prisma.EnrollmentInclude;

const paymentInclude = {
  student: true, enrollment: true, invoice: true, receivedBy: true, office: true,
} satisfies Prisma.PaymentInclude;

const emiInclude = { enrollment: { include: { student: true } } } satisfies Prisma.EmiScheduleInclude;

const invoiceInclude = { student: true, enrollment: true, office: true, _count: { select: { payments: true } } } satisfies Prisma.InvoiceInclude;

const batchInclude = {
  course: true, semester: true, trainer: true, office: true,
  _count: { select: { students: true, attendances: true, enrollments: true } },
} satisfies Prisma.BatchInclude;

const appointmentInclude = {
  lead: true, employee: true, office: true, createdBy: true,
} satisfies Prisma.AppointmentInclude;

const callInclude = { lead: true, employee: true } satisfies Prisma.CallInclude;

const followUpInclude = {
  lead: true, student: true, enrollment: true, collegeApplication: true, jobApplication: true,
  assignedTo: true,
} satisfies Prisma.FollowUpInclude;

const counsellingInclude = {
  lead: true, student: true, counsellor: true,
} satisfies Prisma.CounsellingSessionInclude;

const collegeAppInclude = {
  student: true, college: true, counsellor: true, office: true,
  semesterPayments: true,
} satisfies Prisma.CollegeApplicationInclude;

const companyInclude = {
  _count: { select: { jobOpenings: true, jobApplications: true, placements: true } },
} satisfies Prisma.CompanyInclude;

const jobOpeningInclude = {
  company: true, _count: { select: { applications: true } },
} satisfies Prisma.JobOpeningInclude;

const jobAppInclude = {
  student: true, job: { include: { company: true } }, company: true,
  interviews: { orderBy: { round: 'asc' } },
  offer: true, placement: true,
} satisfies Prisma.JobApplicationInclude;

const placementInclude = {
  student: true, company: true, application: true, placementExecutive: true,
} satisfies Prisma.PlacementInclude;

const employeeInclude = {
  office: true, user: { select: { email: true, status: true } },
  _count: { select: { calls: true, enrollments: true, payments: true, targets: true } },
} satisfies Prisma.EmployeeInclude;

const officeInclude = {
  _count: { select: { employees: true, leads: true, students: true, enrollments: true, payments: true } },
} satisfies Prisma.OfficeInclude;

const courseInclude = {
  semesters: { include: { subjects: true } },
  _count: { select: { enrollments: true, batches: true } },
} satisfies Prisma.CourseInclude;

const auditLogInclude = {
  actionUser: true, office: true, employee: true,
} satisfies Prisma.AuditLogInclude;

const notificationInclude = {} satisfies Prisma.NotificationInclude;

const incomeInclude = { office: true } satisfies Prisma.IncomeInclude;
const expenseInclude = { office: true } satisfies Prisma.ExpenseInclude;
const targetInclude = { employee: true, createdBy: true } satisfies Prisma.EmployeeTargetInclude;
const incentiveRuleInclude = { _count: { select: { calculations: true } } } satisfies Prisma.IncentiveRuleInclude;

// Master map: entity -> { model, include, searchableFields, defaultOrderBy }
export const ENTITY_MAP = {
  lead:              { include: leadInclude,        searchable: ['studentName','mobile','whatsapp','email','leadCode','district'], orderBy: 'createdAt' },
  student:           { include: studentInclude,     searchable: ['name','mobile','whatsapp','email','studentCode','district'], orderBy: 'createdAt' },
  enrollment:        { include: enrollmentInclude,   searchable: ['enrollmentCode'], orderBy: 'enrollmentDate' },
  payment:           { include: paymentInclude,     searchable: ['receiptNo','referenceNo'], orderBy: 'paymentDate' },
  emi:               { include: emiInclude,         searchable: [], orderBy: 'dueDate' },
  invoice:           { include: invoiceInclude,      searchable: ['invoiceNumber','customerName','gstin'], orderBy: 'invoiceDate' },
  batch:             { include: batchInclude,       searchable: ['batchCode','branch'], orderBy: 'startDate' },
  appointment:       { include: appointmentInclude, searchable: ['appointmentCode','purpose'], orderBy: 'date' },
  call:              { include: callInclude,        searchable: ['remarks','result'], orderBy: 'callDate' },
  followUp:          { include: followUpInclude,    searchable: ['remarks'], orderBy: 'dueDate' },
  counselling:       { include: counsellingInclude, searchable: ['recommendation','remarks'], orderBy: 'date' },
  collegeApplication:{ include: collegeAppInclude,  searchable: ['applicationCode','branch','university'], orderBy: 'applicationDate' },
  company:           { include: companyInclude,     searchable: ['companyName','industry','location','hrName'], orderBy: 'createdAt' },
  jobOpening:        { include: jobOpeningInclude,  searchable: ['jobCode','jobTitle','location'], orderBy: 'createdAt' },
  jobApplication:    { include: jobAppInclude,      searchable: ['applicationCode'], orderBy: 'appliedDate' },
  placement:         { include: placementInclude,   searchable: ['placementCode','designation','skills'], orderBy: 'createdAt' },
  employee:          { include: employeeInclude,    searchable: ['name','email','mobile','employeeCode','designation'], orderBy: 'createdAt' },
  office:            { include: officeInclude,      searchable: ['officeCode','officeName','district'], orderBy: 'createdAt' },
  course:            { include: courseInclude,      searchable: ['courseCode','courseName','category'], orderBy: 'createdAt' },
  auditLog:          { include: auditLogInclude,    searchable: ['action','entityType','entityId'], orderBy: 'createdAt' },
  notification:      { include: notificationInclude, searchable: ['title','message','type'], orderBy: 'createdAt' },
  income:            { include: incomeInclude,      searchable: ['incomeCode','category','reference'], orderBy: 'incomeDate' },
  expense:           { include: expenseInclude,     searchable: ['expenseCode','category','vendor','reference'], orderBy: 'expenseDate' },
  employeeTarget:    { include: targetInclude,      searchable: [], orderBy: 'periodStart' },
  incentiveRule:     { include: incentiveRuleInclude, searchable: ['name','basis','ruleType'], orderBy: 'createdAt' },
  college:           { include: {},                  searchable: ['collegeName','university','location'], orderBy: 'createdAt' },
} as const;

export type EntityName = keyof typeof ENTITY_MAP;

export function getModel(name: EntityName) {
  return (db as any)[name] as any;
}
