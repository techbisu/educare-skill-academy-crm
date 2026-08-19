// Seed script — populates the CRM with realistic demo data.
// Run with: bun run scripts/seed.ts
//
// Creates:
// - 2 Offices (Bardhaman, Magra)
// - 8 Roles + Permissions catalogue
// - 8 Users (one per role) with bcrypt-hashed passwords
// - 8 Employees (linked to users)
// - 5 Courses + semesters + subjects
// - 10 Colleges
// - 10 Companies + 20 Job Openings
// - 50 Leads (across offices/sources/statuses)
// - 25 Students
// - 25 Enrollments
// - 35 Payments
// - 20 EMI schedules
// - Batches, attendance, follow-ups, appointments, counselling
// - 5 College applications with semester payments
// - 15 Job applications + interviews + offers + placements
// - Incomes & expenses for finance dashboard
// - Employee targets + incentive rules
// - Audit logs & notifications

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSION_GROUPS, PERMISSION_ACTIONS, ROLE_PERMISSIONS, ROLE_NAMES } from '../src/lib/constants';

const db = new PrismaClient();

// Deterministic RNG so re-runs produce stable data
let seed = 42;
function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    result.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return result;
}
function rndInt(min: number, max: number) { return Math.floor(rng() * (max - min + 1)) + min; }
function rndDate(daysAgoMin: number, daysAgoMax: number) {
  const now = Date.now();
  const offset = rndInt(daysAgoMin, daysAgoMax) * 86400000;
  return new Date(now - offset);
}
function futureDate(daysAheadMin: number, daysAheadMax: number) {
  const now = Date.now();
  const offset = rndInt(daysAheadMin, daysAheadMax) * 86400000;
  return new Date(now + offset);
}

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sourav', 'Anjali', 'Rohit', 'Suman', 'Debasish', 'Sandip', 'Moumita', 'Raju', 'Sneha', 'Tania', 'Avijit', 'Subho', 'Koyel', 'Dipak', 'Ananya', 'Bikash', 'Puja', 'Gourab', 'Rimi', 'Tirtha', 'Lopa', 'Arnab', 'Mitali', 'Soumen', 'Jayita'];
const LAST_NAMES = ['Das', 'Roy', 'Banerjee', 'Ghosh', 'Mondal', 'Chatterjee', 'Sarkar', 'Bhattacharya', 'Patra', 'Sen', 'Paul', 'Dasgupta', 'Kar', 'Mukherjee', 'Samanta', 'Pal', 'Dutta', 'Bhowmick', 'Saha', 'Biswas'];
const DISTRICTS = ['Bardhaman', 'Kolkata', 'Hooghly', 'Nadia', 'Birbhum', 'Purulia', 'Bankura', 'Midnapore', 'Howrah', 'Malda'];
const QUALIFICATIONS = ['10th Pass', '12th Pass (Science)', '12th Pass (Arts)', '12th Pass (Commerce)', 'Diploma', 'B.Tech', 'B.Sc', 'B.Com', 'B.A.', 'M.A.', 'ITI'];
const BRANCHES = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics', 'IT', 'Fitter', 'Welder', 'Electrician'];
const LOCATIONS_WB = ['Bardhaman', 'Kolkata', 'Durgapur', 'Asansol', 'Hooghly'];

function fullName() { return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
function phone() { return `9${rndInt(800000000, 999999999)}`; }

async function main() {
  console.log('Resetting database...');
  // Wipe in dependency order (children first)
  const tables = ['auditLog','notification','incentiveCalculation','incentiveRule','employeeTarget','expense','income','placement','offer','interview','jobApplication','jobOpening','company','semesterPayment','collegeApplication','college','invoice','emiSchedule','payment','attendance','batchStudent','batch','subject','courseSemester','enrollment','studentDocument','student','counsellingSession','appointment','followUp','call','leadActivity','leadAssignment','lead','permission','rolePermission','permission','role','userRole','employee','user','office','setting','counter'];
  for (const t of tables) {
    try { await (db as any)[t].deleteMany({}); } catch {}
  }

  console.log('Seeding offices...');
  const offices = await Promise.all([
    db.office.create({ data: { officeCode: 'BRD', officeName: 'Bardhaman', officeType: 'Head Office', address: 'B.C. Road, Bardhaman', district: 'Bardhaman', state: 'West Bengal', phone: '0342-123456', email: 'bardhaman@educare.com', status: 'Active' } }),
    db.office.create({ data: { officeCode: 'MGR', officeName: 'Magra', officeType: 'Branch', address: 'Station Road, Magra', district: 'Hooghly', state: 'West Bengal', phone: '03211-234567', email: 'magra@educare.com', status: 'Active' } }),
  ]);

  console.log('Seeding permissions catalogue...');
  const permissionMap = new Map<string, string>();
  for (const group of PERMISSION_GROUPS) {
    for (const action of PERMISSION_ACTIONS) {
      const name = `${group.toLowerCase()}.${action}`;
      const p = await db.permission.create({ data: { name, group, description: `${action} ${group}` } });
      permissionMap.set(name, p.id);
    }
  }

  console.log('Seeding roles...');
  const roleMap = new Map<string, string>();
  for (const roleName of ROLE_NAMES) {
    const role = await db.role.create({ data: { name: roleName, description: `${roleName} role` } });
    roleMap.set(roleName, role.id);
    const grants = (ROLE_PERMISSIONS as any)[roleName] || [];
    if (roleName === 'Super Admin') {
      for (const p of permissionMap.values()) {
        await db.rolePermission.create({ data: { roleId: role.id, permissionId: p } });
      }
    } else {
      for (const grant of grants) {
        for (const action of grant.actions) {
          const name = `${grant.group.toLowerCase()}.${action}`;
          const pId = permissionMap.get(name);
          if (pId) await db.rolePermission.create({ data: { roleId: role.id, permissionId: pId } });
        }
      }
    }
  }

  console.log('Seeding users & employees...');
  const passwordHash = await bcrypt.hash('Password@123', 10);
  type EmployeeSeed = { role: string; name: string; email: string; designation: string; officeIdx: number; };
  const employeeSeeds: EmployeeSeed[] = [
    { role: 'Super Admin', name: 'Sujit Roy', email: 'admin@educare.com', designation: 'Director', officeIdx: 0 },
    { role: 'Admin',       name: 'Sourav Banerjee', email: 'office.admin@educare.com', designation: 'Office Admin', officeIdx: 0 },
    { role: 'HR',          name: 'Rini Das', email: 'hr@educare.com', designation: 'HR Manager', officeIdx: 0 },
    { role: 'Caller',      name: 'Pallab Ghosh', email: 'caller@educare.com', designation: 'Telecaller', officeIdx: 0 },
    { role: 'Counsellor',  name: 'Moumita Sen', email: 'counsellor@educare.com', designation: 'Senior Counsellor', officeIdx: 0 },
    { role: 'Accounts',    name: 'Dipak Pal', email: 'accounts@educare.com', designation: 'Accountant', officeIdx: 0 },
    { role: 'Placement Executive', name: 'Avijit Dutta', email: 'placement@educare.com', designation: 'Placement Executive', officeIdx: 0 },
    { role: 'Trainer',     name: 'Bikash Saha', email: 'trainer@educare.com', designation: 'Senior Trainer', officeIdx: 0 },
    { role: 'Caller',      name: 'Jayita Paul', email: 'caller2@educare.com', designation: 'Telecaller', officeIdx: 1 },
    { role: 'Counsellor',  name: 'Soumen Kar', email: 'counsellor2@educare.com', designation: 'Counsellor', officeIdx: 1 },
    { role: 'Trainer',     name: 'Gourab Samanta', email: 'trainer2@educare.com', designation: 'Trainer', officeIdx: 1 },
    { role: 'Accounts',    name: 'Lopa Bhowmick', email: 'accounts2@educare.com', designation: 'Accountant', officeIdx: 1 },
    { role: 'Placement Executive', name: 'Arnab Biswas', email: 'placement2@educare.com', designation: 'Placement Executive', officeIdx: 1 },
  ];

  const employees: { id: string; officeId: string; designation: string }[] = [];
  for (const s of employeeSeeds) {
    const empCode = `EDU-EMP-${String(employees.length + 1).padStart(4, '0')}`;
    const emp = await db.employee.create({
      data: {
        employeeCode: empCode,
        name: s.name,
        email: s.email,
        mobile: phone(),
        designation: s.designation,
        department: s.role === 'Trainer' ? 'Academics' : s.role === 'Accounts' ? 'Finance' : 'Operations',
        officeId: offices[s.officeIdx].id,
        joiningDate: rndDate(120, 600),
        status: 'Active',
      },
    });
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash,
        mobile: emp.mobile,
        status: 'Active',
        employeeId: emp.id,
      },
    });
    await db.userRole.create({ data: { userId: user.id, roleId: roleMap.get(s.role)! } });
    employees.push({ id: emp.id, officeId: emp.officeId, designation: s.designation });
  }

  console.log('Seeding courses, semesters, subjects...');
  const courseDefs: { code: string; name: string; category: string; duration: string; fee: number; semesters: { name: string; subjects: string[] }[] }[] = [
    { code: 'BTech-CSE', name: 'B.Tech Computer Science Coaching', category: 'B.Tech', duration: '4 Years', fee: 80000, semesters: [
      { name: '1st Semester', subjects: ['Mathematics I', 'Physics I', 'Programming in C', 'Engineering Graphics'] },
      { name: '2nd Semester', subjects: ['Mathematics II', 'Physics II', 'Data Structures', 'Basic Electronics'] },
    ]},
    { code: 'DIP-CS', name: 'Diploma in Computer Science Coaching', category: 'Diploma', duration: '3 Years', fee: 50000, semesters: [
      { name: '1st Semester', subjects: ['Computer Fundamentals', 'Mathematics', 'Communication Skills'] },
      { name: '2nd Semester', subjects: ['C Programming', 'Digital Electronics', 'Workshop Practice'] },
    ]},
    { code: 'ITI-FIT', name: 'ITI Fitter Trade', category: 'ITI', duration: '2 Years', fee: 25000, semesters: [
      { name: '1st Semester', subjects: ['Workshop Calculation', 'Engineering Drawing', 'Fitting Tools'] },
    ]},
    { code: 'INT-WEB', name: 'Web Development Internship', category: 'Internship', duration: '6 Months', fee: 15000, semesters: [
      { name: 'Module 1', subjects: ['HTML/CSS', 'JavaScript Basics', 'React Fundamentals'] },
    ]},
    { code: 'COA-GEN', name: 'Career Counselling Package', category: 'Coaching', duration: '1 Month', fee: 5000, semesters: [
      { name: 'Module 1', subjects: ['Aptitude Test', 'Career Mapping', 'Interview Skills'] },
    ]},
  ];
  const courses: { id: string; code: string; fee: number; name: string; category: string; semesters: { id: string }[] }[] = [];
  for (const c of courseDefs) {
    const course = await db.course.create({ data: { courseCode: c.code, courseName: c.name, category: c.category, description: `Comprehensive coaching for ${c.name}`, duration: c.duration, fee: c.fee, status: 'Active' } });
    const semesters = [];
    for (let i = 0; i < c.semesters.length; i++) {
      const sem = await db.courseSemester.create({ data: { courseId: course.id, name: c.semesters[i].name, order: i + 1 } });
      for (const subj of c.semesters[i].subjects) {
        await db.subject.create({ data: { semesterId: sem.id, name: subj } });
      }
      semesters.push({ id: sem.id });
    }
    courses.push({ id: course.id, code: c.code, fee: c.fee, name: c.name, category: c.category, semesters });
  }

  console.log('Seeding colleges...');
  const collegeDefs = [
    { name: 'Bardhaman University', university: 'Bardhaman University', location: 'Bardhaman' },
    { name: 'Kalyani University', university: 'Kalyani University', location: 'Kalyani' },
    { name: 'MAKAUT', university: 'Maulana Abul Kalam Azad University of Technology', location: 'Kolkata' },
    { name: 'JIS College of Engineering', university: 'MAKAUT', location: 'Kalyani' },
    { name: 'BC Roy Engineering College', university: 'MAKAUT', location: 'Durgapur' },
    { name: 'Hooghly Engineering & Technology College', university: 'MAKAUT', location: 'Hooghly' },
    { name: 'Narula Institute of Technology', university: 'MAKAUT', location: 'Kolkata' },
    { name: 'Bengal College of Engineering', university: 'MAKAUT', location: 'Durgapur' },
    { name: 'Asansol Engineering College', university: 'MAKAUT', location: 'Asansol' },
    { name: 'Techno India College', university: 'Techno India University', location: 'Kolkata' },
  ];
  const colleges = [];
  for (const c of collegeDefs) {
    colleges.push(await db.college.create({ data: { collegeName: c.name, university: c.university, location: c.location, contactPerson: fullName(), phone: phone(), email: `admission@${c.name.split(' ')[0].toLowerCase()}.edu`, website: `www.${c.name.split(' ')[0].toLowerCase()}.edu`, status: 'Active' } }));
  }

  console.log('Seeding companies & job openings...');
  const companyDefs = [
    { name: 'TCS', industry: 'IT Services', location: 'Kolkata' },
    { name: 'Wipro', industry: 'IT Services', location: 'Kolkata' },
    { name: 'Infosys', industry: 'IT Services', location: 'Bangalore' },
    { name: 'Cognizant', industry: 'IT Services', location: 'Kolkata' },
    { name: 'Capgemini', industry: 'IT Services', location: 'Pune' },
    { name: 'Accenture', industry: 'Consulting', location: 'Bangalore' },
    { name: 'Larsen & Toubro', industry: 'Construction', location: 'Bardhaman' },
    { name: 'Jindal Steel', industry: 'Manufacturing', location: 'Asansol' },
    { name: 'Bhushan Power', industry: 'Manufacturing', location: 'Kolkata' },
    { name: 'Sify Technologies', industry: 'IT Services', location: 'Bangalore' },
  ];
  const companies = [];
  const jobs: { id: string; companyId: string; title: string; min: number; max: number }[] = [];
  for (const cd of companyDefs) {
    const co = await db.company.create({ data: { companyName: cd.name, industry: cd.industry, location: cd.location, hrName: fullName(), hrMobile: phone(), hrEmail: `hr@${cd.name.toLowerCase().replace(/[^a-z]/g,'')}.com`, website: `www.${cd.name.toLowerCase().replace(/[^a-z]/g,'')}.com`, salaryRange: '₹2,50,000 - ₹8,00,000', status: 'Active', notes: 'Active partner for placement.' } });
    companies.push(co);
    const numJobs = rndInt(2, 3);
    for (let i = 0; i < numJobs; i++) {
      const title = pick(['Junior Developer', 'Software Engineer', 'Graduate Trainee', 'IT Support', 'Junior Technician', 'Field Engineer', 'Data Entry Operator', 'Production Engineer']);
      const min = pick([2.5, 3.0, 3.5, 4.0]) * 100000;
      const max = min + pick([50000, 100000, 150000, 200000]);
      const j = await db.jobOpening.create({
        data: {
          jobCode: await nextCounter('job_opening'),
          companyId: co.id,
          jobTitle: title,
          location: cd.location,
          qualification: pick(QUALIFICATIONS),
          branch: pick(BRANCHES),
          experience: pick(['Fresher', '0-1 year', '1-2 years']),
          salaryMin: min,
          salaryMax: max,
          vacancy: rndInt(1, 5),
          genderRequirement: 'Any',
          joiningDate: futureDate(30, 90),
          interviewDate: futureDate(15, 45),
          status: 'Open',
        },
      });
      jobs.push({ id: j.id, companyId: co.id, title, min, max });
    }
  }

  console.log('Seeding leads (50)...');
  const leadSources = ['Facebook','YouTube','Instagram','WhatsApp','Website','Google','Reference','Walk-in','Job Portal','Other'];
  const leadTypes = ['Job','Coaching','Internship','College Admission','Diploma','B.Tech','ITI','Other'];
  const leadStatuses = ['New','Call Pending','Contacted','Interested','Follow-up','Appointment Booked','Appointment Completed','Counselling Done','Enrollment Pending','Enrolled','Payment Pending','Not Interested','Wrong Number','Duplicate','Lost','Converted'];

  const leads = [];
  for (let i = 0; i < 50; i++) {
    const officeIdx = i < 30 ? 0 : 1;
    const office = offices[officeIdx];
    const assignedEmp = pick(employees.filter(e => e.officeId === office.id));
    const name = fullName();
    const lead = await db.lead.create({
      data: {
        leadCode: await nextCounter('lead'),
        studentName: name,
        fatherName: fullName(),
        motherName: fullName(),
        mobile: phone(),
        whatsapp: phone(),
        email: `${name.split(' ')[0].toLowerCase()}${i}@gmail.com`,
        address: `${rndInt(1,99)} ${pick(['Main St','Station Rd','College St','Park Rd'])}, ${pick(DISTRICTS)}`,
        district: pick(DISTRICTS),
        qualification: pick(QUALIFICATIONS),
        passingYear: String(rndInt(2018, 2025)),
        branchTrade: pick(BRANCHES),
        experience: pick(['Fresher','0-1 year','1-2 years','3+ years']),
        source: pick(leadSources),
        leadType: pick(leadTypes),
        status: i < 10 ? 'Converted' : pick(leadStatuses),
        officeId: office.id,
        assignedEmployeeId: assignedEmp.id,
        createdAt: rndDate(60, 5),
        remarks: rng() > 0.7 ? 'Interested in scholarship options.' : null,
      },
    });
    leads.push({ id: lead.id, status: lead.status, officeId: lead.officeId, mobile: lead.mobile, name: lead.studentName, lead: lead });
    await db.leadAssignment.create({
      data: { leadId: lead.id, employeeId: assignedEmp.id, assignedById: (await db.user.findFirst({ where: { employeeId: assignedEmp.id } }))!.id, assignmentReason: 'Initial assignment', assignedAt: lead.createdAt },
    });
    await db.leadActivity.create({ data: { leadId: lead.id, action: 'Lead Created', description: `Lead created via ${lead.source}`, createdAt: lead.createdAt, createdByUserId: null } });
    await db.leadActivity.create({ data: { leadId: lead.id, action: 'Assigned to Employee', description: 'Auto-assigned', createdAt: new Date(lead.createdAt.getTime() + 5 * 60000) } });
  }

  console.log('Seeding students (25)...');
  const students = [];
  for (let i = 0; i < 25; i++) {
    const officeIdx = i < 15 ? 0 : 1;
    const office = offices[officeIdx];
    const name = fullName();
    const leadForStudent = i < 10 ? leads[i] : null;
    const student = await db.student.create({
      data: {
        studentCode: await nextCounter('student'),
        name: name,
        fatherName: fullName(),
        motherName: fullName(),
        mobile: phone(),
        whatsapp: phone(),
        email: `${name.split(' ')[0].toLowerCase()}${100 + i}@gmail.com`,
        dob: rndDate(7000, 9000),
        gender: rng() > 0.5 ? 'Male' : 'Female',
        address: `${rndInt(1,99)} ${pick(['Main St','Station Rd','College St','Park Rd'])}, ${pick(DISTRICTS)}`,
        district: pick(DISTRICTS),
        qualification: pick(QUALIFICATIONS),
        passingYear: String(rndInt(2018, 2025)),
        branch: pick(BRANCHES),
        experience: pick(['Fresher','0-1 year','1-2 years']),
        officeId: office.id,
        status: i < 20 ? 'Active' : pick(['Graduated','Placed','Dropped']),
        leadId: leadForStudent?.id,
        createdAt: rndDate(60, 5),
      },
    });
    students.push({ id: student.id, officeId: student.officeId, mobile: student.mobile, name: student.name });
    if (leadForStudent) {
      await db.lead.update({ where: { id: leadForStudent.id }, data: { status: 'Converted' } });
    }
  }

  console.log('Seeding enrollments (25)...');
  const enrollments = [];
  for (let i = 0; i < 25; i++) {
    const student = students[i];
    const course = pick(courses);
    const office = offices.find(o => o.id === student.officeId)!;
    const counsellor = employees.find(e => e.officeId === office.id && e.designation.toLowerCase().includes('counsellor'))!;
    const totalFee = course.fee;
    const discount = rng() > 0.7 ? Math.round(totalFee * 0.1) : 0;
    const finalFee = totalFee - discount;
    const paidAmount = i % 4 === 0 ? 0 : i % 4 === 1 ? Math.round(finalFee / 2) : i % 4 === 2 ? finalFee : Math.round(finalFee * 0.75);
    const dueAmount = finalFee - paidAmount;
    const enr = await db.enrollment.create({
      data: {
        enrollmentCode: await nextCounter('enrollment'),
        studentId: student.id,
        courseId: course.id,
        semesterId: course.semesters[0]?.id,
        enrollmentDate: rndDate(50, 5),
        counsellorId: counsellor.id,
        officeId: office.id,
        totalFee, discount, finalFee, paidAmount, dueAmount,
        paymentStatus: paidAmount === 0 ? 'Unpaid' : paidAmount >= finalFee ? 'Paid' : 'Partial',
        status: i % 10 === 0 ? 'Completed' : 'Active',
        remarks: rng() > 0.8 ? 'Special discount approved' : null,
      },
    });
    enrollments.push({ id: enr.id, student, course, finalFee, paidAmount, dueAmount, paymentStatus: enr.paymentStatus, office });
  }

  console.log('Seeding batches...');
  const batches: { id: string; courseId: string; trainerId: string; officeId: string }[] = [];
  for (const course of courses) {
    for (const office of offices) {
      const trainer = employees.find(e => e.officeId === office.id && e.designation.toLowerCase().includes('trainer'))!;
      const b = await db.batch.create({
        data: {
          batchCode: `BAT-${course.code}-${office.officeCode}`,
          courseId: course.id,
          semesterId: course.semesters[0]?.id,
          branch: pick(BRANCHES),
          startDate: rndDate(40, 10),
          endDate: futureDate(120, 200),
          classTime: pick(['09:00-11:00', '11:00-01:00', '02:00-04:00', '04:00-06:00']),
          trainerId: trainer.id,
          officeId: office.id,
          mode: pick(['Offline', 'Online', 'Hybrid']),
          maximumStudents: 25,
          status: 'Active',
        },
      });
      batches.push({ id: b.id, courseId: course.id, trainerId: trainer.id, officeId: office.id });
    }
  }
  // Assign students to batches in same office
  for (const enr of enrollments) {
    const officeBatches = batches.filter(b => b.officeId === enr.office.id && b.courseId === enr.course.id);
    if (officeBatches.length > 0) {
      const b = pick(officeBatches);
      try {
        await db.batchStudent.create({ data: { batchId: b.id, studentId: enr.student.id } });
        await db.enrollment.update({ where: { id: enr.id }, data: { batchId: b.id } });
      } catch {}
    }
  }

  console.log('Seeding attendance (last 7 days for each batch student)...');
  const batchStudents = await db.batchStudent.findMany();
  for (const bs of batchStudents) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.now() - d * 86400000);
      try {
        await db.attendance.create({ data: { batchId: bs.batchId, studentId: bs.studentId, date, status: pick(['Present','Present','Present','Absent','Late','Leave']) } });
      } catch {}
    }
  }

  console.log('Seeding payments (35)...');
  const payments = [];
  for (let i = 0; i < 35; i++) {
    const enr = enrollments[i % enrollments.length];
    const office = offices.find(o => o.id === enr.office.id)!;
    const accountsEmp = employees.find(e => e.officeId === office.id && e.designation.toLowerCase().includes('accountant'))!;
    const amount = pick([5000, 10000, 15000, 20000, 25000]);
    const receipt = await nextCounter('payment');
    const payment = await db.payment.create({
      data: {
        receiptNo: receipt,
        studentId: enr.student.id,
        enrollmentId: enr.id,
        amount,
        paymentDate: rndDate(40, 0),
        paymentMode: pick(['Cash','UPI','Bank Transfer','Card']),
        referenceNo: `REF${rndInt(100000, 999999)}`,
        receivedById: accountsEmp.id,
        officeId: office.id,
        remarks: 'Installment payment',
        status: 'Valid',
      },
    });
    payments.push(payment);
  }

  console.log('Recomputing enrollment financials (single source of truth: backend)...');
  for (const enr of enrollments) {
    const totalPaid = await db.payment.aggregate({ where: { enrollmentId: enr.id, status: 'Valid' }, _sum: { amount: true } });
    const paid = totalPaid._sum.amount ?? 0;
    const due = enr.finalFee - paid;
    await db.enrollment.update({ where: { id: enr.id }, data: { paidAmount: paid, dueAmount: due, paymentStatus: due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid' } });
  }

  console.log('Seeding EMI schedules (20)...');
  for (let i = 0; i < 20; i++) {
    const enr = enrollments[i];
    const enrDate = (await db.enrollment.findUnique({ where: { id: enr.id } }))!;
    const numInst = 5;
    const instAmount = Math.round(enr.finalFee / numInst);
    for (let k = 1; k <= numInst; k++) {
      const due = new Date(enrDate.enrollmentDate.getTime() + (k - 1) * 30 * 86400000);
      const paid = k <= 2 ? instAmount : 0;
      await db.emiSchedule.create({
        data: {
          enrollmentId: enr.id,
          installmentNumber: k,
          dueDate: due,
          amount: instAmount,
          paidAmount: paid,
          status: paid >= instAmount ? 'Paid' : due < new Date() ? 'Overdue' : 'Upcoming',
          paidDate: paid > 0 ? new Date(due.getTime() - 5 * 86400000) : null,
        },
      });
    }
  }

  console.log('Seeding follow-ups, calls, appointments, counselling...');
  for (const lead of leads.slice(0, 30)) {
    const emp = await db.employee.findFirst({ where: { id: lead.lead.assignedEmployeeId } });
    if (!emp) continue;
    const callResult = pick(['Connected','Not Connected','Busy','Interested','Call Later']);
    await db.call.create({
      data: {
        leadId: lead.id, employeeId: emp.id,
        callDate: rndDate(20, 0), callTime: '10:30', duration: rndInt(30, 300),
        direction: 'Outbound', result: callResult,
        remarks: callResult === 'Interested' ? 'Discussed course options.' : 'No response.',
        nextFollowupDate: rng() > 0.5 ? futureDate(1, 5) : null,
      },
    });
    await db.leadActivity.create({ data: { leadId: lead.id, action: 'Call Attempted', description: `Result: ${callResult}`, createdAt: rndDate(20, 0) } });

    await db.followUp.create({
      data: {
        entityType: 'Lead', entityId: lead.id, leadId: lead.id,
        assignedToId: emp.id,
        dueDate: futureDate(1, 7),
        priority: pick(['Low','Medium','High']),
        status: 'Pending',
        remarks: 'Discuss course details.',
      },
    });

    if (rng() > 0.6) {
      const counsellor = employees.find(e => e.designation.toLowerCase().includes('counsellor'))!;
      await db.counsellingSession.create({
        data: {
          leadId: lead.id, counsellorId: counsellor.id, date: rndDate(15, 0),
          currentQualification: pick(QUALIFICATIONS), careerInterest: pick(['Software','Hardware','Networking','Civil','Mechanical']),
          skills: 'Basic computer, MS Office', preferredCourse: pick(courses).name,
          preferredLocation: pick(LOCATIONS_WB), expectedSalary: pick([2.5, 3.5, 4.5, 5.5]) * 100000,
          recommendation: 'Enroll in suitable batch',
          remarks: 'Student is motivated.',
          nextFollowup: futureDate(3, 10),
        },
      });
      await db.leadActivity.create({ data: { leadId: lead.id, action: 'Counselling Done', createdAt: rndDate(15, 0) } });
    }

    if (rng() > 0.5) {
      const empForAppt = emp;
      const userForAppt = await db.user.findFirst({ where: { employeeId: empForAppt.id } });
      if (userForAppt) {
        await db.appointment.create({
          data: {
            appointmentCode: await nextCounter('appointment'),
            leadId: lead.id, employeeId: empForAppt.id, officeId: empForAppt.officeId,
            date: futureDate(1, 10), time: '11:00',
            type: pick(['Office Visit','Online','Phone','Video Call']),
            purpose: 'Course discussion',
            status: pick(['Scheduled','Confirmed','Completed','Rescheduled']),
            createdById: userForAppt.id,
          },
        });
      }
    }
  }

  console.log('Seeding college applications (5)...');
  for (let i = 0; i < 5; i++) {
    const student = students[i];
    const office = offices.find(o => o.id === student.officeId)!;
    const counsellor = employees.find(e => e.officeId === office.id && e.designation.toLowerCase().includes('counsellor'))!;
    const college = pick(colleges);
    const cap = await db.collegeApplication.create({
      data: {
        applicationCode: await nextCounter('college_application'),
        studentId: student.id,
        collegeId: college.id,
        university: college.university,
        courseId: pick(['B.Tech CSE', 'B.Tech ECE', 'B.Com', 'B.Sc Computer Science']),
        branch: pick(BRANCHES),
        admissionYear: String(rndInt(2024, 2026)),
        applicationDate: rndDate(30, 5),
        applicationFee: 1500,
        status: pick(['Interested','Application Started','Application Submitted','Admission Confirmed','Completed']),
        counsellorId: counsellor.id,
        officeId: office.id,
        remarks: 'Family support available.',
      },
    });
    // Semester payments: Admission Fee + 2 semesters
    const admFee = 25000;
    const sem1 = 35000;
    const sem2 = 35000;
    await db.semesterPayment.create({ data: { applicationId: cap.id, semesterName: 'Admission Fee', totalFee: admFee, paidAmount: admFee, dueAmount: 0, status: 'Paid', dueDate: cap.applicationDate } });
    await db.semesterPayment.create({ data: { applicationId: cap.id, semesterName: 'Semester 1', totalFee: sem1, paidAmount: i % 2 === 0 ? sem1 : 0, dueAmount: i % 2 === 0 ? 0 : sem1, status: i % 2 === 0 ? 'Paid' : 'Pending', dueDate: futureDate(30, 60) } });
    await db.semesterPayment.create({ data: { applicationId: cap.id, semesterName: 'Semester 2', totalFee: sem2, paidAmount: 0, dueAmount: sem2, status: 'Pending', dueDate: futureDate(180, 210) } });
  }

  console.log('Seeding job applications, interviews, offers, placements (15)...');
  for (let i = 0; i < 15; i++) {
    const student = students[i];
    const job = pick(jobs);
    const company = companies.find(c => c.id === job.companyId)!;
    const placementExec = employees.find(e => e.designation.toLowerCase().includes('placement'))!;
    const status = pick(['Eligible','Job Shared','Applied','Interview Scheduled','Interview Attended','Selected','Offer Received','Joining Pending','Joined']);
    const japp = await db.jobApplication.create({
      data: {
        applicationCode: await nextCounter('job_application'),
        studentId: student.id,
        jobId: job.id,
        companyId: company.id,
        appliedDate: rndDate(20, 0),
        status,
        remarks: 'Recommended by counsellor.',
      },
    });
    if (status === 'Interview Scheduled' || status === 'Interview Attended' || status === 'Selected' || status === 'Offer Received' || status === 'Joining Pending' || status === 'Joined') {
      await db.interview.create({
        data: {
          applicationId: japp.id, companyId: company.id, studentId: student.id,
          round: 1, roundType: 'HR', date: rndDate(15, 0), time: '10:00',
          mode: 'In-person', location: company.location,
          result: status === 'Interview Scheduled' ? 'Pending' : 'Selected',
          remarks: 'First round completed.',
        },
      });
    }
    if (status === 'Offer Received' || status === 'Joining Pending' || status === 'Joined') {
      await db.offer.create({
        data: {
          applicationId: japp.id, offerDate: rndDate(10, 0),
          salary: job.min + (job.max - job.min) / 2,
          designation: job.title,
          joiningDate: futureDate(15, 45),
          status: status === 'Joined' ? 'Accepted' : 'Pending',
        },
      });
    }
    if (status === 'Joined') {
      await db.placement.create({
        data: {
          placementCode: await nextCounter('placement'),
          studentId: student.id,
          applicationId: japp.id,
          companyId: company.id,
          qualification: student.qualification,
          branch: pick(BRANCHES),
          experience: 'Fresher',
          preferredLocation: pick(LOCATIONS_WB),
          expectedSalary: job.min,
          skills: 'Programming, Communication',
          designation: job.title,
          salary: job.min + (job.max - job.min) / 2,
          joiningDate: rndDate(5, 0),
          placementExecutiveId: placementExec.id,
          verifiedById: null,
          verificationDate: new Date(),
          status: 'Placement Completed',
        },
      });
    } else if (status === 'Eligible' || status === 'Applied' || status === 'Job Shared' || status === 'Interview Scheduled' || status === 'Selected' || status === 'Offer Received' || status === 'Joining Pending') {
      await db.placement.create({
        data: {
          placementCode: await nextCounter('placement'),
          studentId: student.id,
          applicationId: japp.id,
          companyId: company.id,
          qualification: student.qualification,
          branch: pick(BRANCHES),
          experience: 'Fresher',
          preferredLocation: pick(LOCATIONS_WB),
          expectedSalary: job.min,
          skills: 'Programming, Communication',
          placementExecutiveId: placementExec.id,
          status,
        },
      });
    }
  }

  console.log('Seeding income & expense records...');
  for (let i = 0; i < 20; i++) {
    const office = pick(offices);
    await db.income.create({
      data: {
        incomeCode: await nextCounter('income'),
        category: pick(['Course Fee','Coaching Fee','Placement Revenue','Admission Consultancy','Internship Fee']),
        amount: pick([5000, 10000, 15000, 20000, 25000]),
        incomeDate: rndDate(40, 0),
        officeId: office.id,
        reference: `REF-I-${rndInt(1000,9999)}`,
        remarks: 'Batch income',
      },
    });
  }
  for (let i = 0; i < 15; i++) {
    const office = pick(offices);
    await db.expense.create({
      data: {
        expenseCode: await nextCounter('expense'),
        category: pick(['Employee Salary','Office Rent','Electricity','Internet','Marketing','Advertisement','Travel','Vendor Payment']),
        amount: pick([3000, 5000, 8000, 12000, 25000]),
        expenseDate: rndDate(40, 0),
        officeId: office.id,
        vendor: pick(['Vendor A','Vendor B','Owner','Electricity Board','ISP Co']),
        reference: `REF-E-${rndInt(1000,9999)}`,
        remarks: 'Monthly expense',
      },
    });
  }

  console.log('Seeding employee targets...');
  for (const emp of employees) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const createdById = (await db.user.findFirst({ where: { employeeId: employees[0].id } }))?.id;
    await db.employeeTarget.create({
      data: {
        employeeId: emp.id,
        period: 'Monthly',
        periodStart: monthStart,
        periodEnd: monthEnd,
        leadTarget: 50, callTarget: 100, appointmentTarget: 20,
        enrollmentTarget: 10, collectionTarget: 100000,
        salesTarget: 100000, placementTarget: 5,
        createdById,
      },
    });
  }

  console.log('Seeding incentive rules...');
  await db.incentiveRule.create({
    data: {
      name: 'Default Slab on Collection',
      basis: 'Collected Payment',
      ruleType: 'slab',
      slabConfig: JSON.stringify([
        { min: 0, max: 50000, rate: 1 },
        { min: 50001, max: 100000, rate: 2 },
        { min: 100001, max: null, rate: 3 },
      ]),
      status: 'Active',
    },
  });
  await db.incentiveRule.create({
    data: {
      name: 'Enrollment Value 1% (Counsellor)',
      basis: 'Enrollment Value',
      ruleType: 'percentage',
      percentage: 1,
      serviceType: 'Coaching',
      status: 'Active',
    },
  });

  console.log('Seeding settings (GST config)...');
  await db.setting.create({ data: { key: 'gst.cgst_rate', value: '9', group: 'GST', description: 'CGST rate %' } });
  await db.setting.create({ data: { key: 'gst.sgst_rate', value: '9', group: 'GST', description: 'SGST rate %' } });
  await db.setting.create({ data: { key: 'gst.igst_rate', value: '18', group: 'GST', description: 'IGST rate %' } });
  await db.setting.create({ data: { key: 'org.name', value: 'Educare Skill Academy', group: 'Organization' } });
  await db.setting.create({ data: { key: 'org.address', value: 'B.C. Road, Bardhaman, West Bengal', group: 'Organization' } });
  await db.setting.create({ data: { key: 'org.gstin', value: '19ABCDE1234F1Z5', group: 'Organization' } });
  await db.setting.create({ data: { key: 'org.phone', value: '0342-123456', group: 'Organization' } });
  await db.setting.create({ data: { key: 'org.email', value: 'info@educare.com', group: 'Organization' } });

  console.log('Seeding notifications...');
  for (const emp of employees.slice(0, 5)) {
    const user = await db.user.findFirst({ where: { employeeId: emp.id } });
    if (user) {
      await db.notification.create({ data: { userId: user.id, type: 'Follow-up Due', title: 'Today follow-up', message: 'You have 3 follow-ups due today.', entityType: 'FollowUp' } });
      await db.notification.create({ data: { userId: user.id, type: 'Lead Assignment', title: 'New lead assigned', message: 'A new lead has been assigned to you.', entityType: 'Lead' } });
    }
  }

  console.log('Seed completed successfully.');
}

// Simple counter helper that mirrors the production code-generator
async function nextCounter(name: string): Promise<string> {
  const counter = await db.counter.upsert({
    where: { name },
    update: { value: { increment: 1 } },
    create: { name, value: 1, prefix: 'EDU-X-' },
  });
  const cfg: Record<string, { prefix: string; pad: number }> = {
    lead: { prefix: 'EDU-LEAD-', pad: 6 },
    student: { prefix: 'EDU-STU-', pad: 6 },
    enrollment: { prefix: 'EDU-ENR-', pad: 6 },
    payment: { prefix: 'EDU-RCP-', pad: 6 },
    appointment: { prefix: 'EDU-APT-', pad: 6 },
    invoice: { prefix: 'EDU-INV-', pad: 6 },
    job_opening: { prefix: 'EDU-JOB-', pad: 6 },
    job_application: { prefix: 'EDU-JAP-', pad: 6 },
    college_application: { prefix: 'EDU-CAP-', pad: 6 },
    placement: { prefix: 'EDU-PLT-', pad: 6 },
    income: { prefix: 'EDU-INC-', pad: 6 },
    expense: { prefix: 'EDU-EXP-', pad: 6 },
  };
  const c = cfg[name] || { prefix: 'EDU-X-', pad: 6 };
  return `${c.prefix}${String(counter.value).padStart(c.pad, '0')}`;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
