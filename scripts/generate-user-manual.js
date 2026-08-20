// Educare Skill Academy — User Manual generator
// Generates a professional .docx user manual covering all modules.
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType,
  HeadingLevel, PageNumber, PageBreak, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, LevelFormat, Tab, TabStopType,
  TabStopPosition,
} = require('docx');
const fs = require('fs');

// ============== Palette ==============
const P = {
  primary: '#0F766E',      // teal-700
  secondary: '#475569',     // slate-600
  body: '#1F2937',          // slate-800
  accent: '#F59E0B',        // amber-500
  muted: '#94A3B8',          // slate-400
  bgLight: '#F0FDFA',        // teal-50
  border: '#CBD5E1',         // slate-300
};
const c = (hex) => hex.replace('#', '');

// ============== Builders ==============
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: 'Calibri' })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, color: c(P.secondary), font: 'Calibri' })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, color: c(P.secondary), font: 'Calibri' })],
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 100 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: 'Calibri' })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: 'Calibri' })],
  });
}
function callout(label, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 200, bottom: 200, left: 240, right: 240 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent) },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent) },
      left: { style: BorderStyle.SINGLE, size: 24, color: c(P.accent) },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.bgLight) },
        children: [
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: label, bold: true, size: 22, color: c(P.primary), font: 'Calibri' })],
          }),
          new Paragraph({
            spacing: { line: 312 },
            children: [new TextRun({ text, size: 22, color: c(P.body), font: 'Calibri' })],
          }),
        ],
      })],
    })],
  });
}

// Simple 2-column table for shortcuts
function shortcutTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: c(P.border) },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c(P.border) },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: c(P.border) },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: rows.map((row, i) => new TableRow({
      tableHeader: i === 0,
      cantSplit: true,
      children: row.map((cell, j) => new TableCell({
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: c(P.bgLight) } : undefined,
        children: [new Paragraph({
          spacing: { line: 280 },
          children: [new TextRun({ text: cell, bold: i === 0, size: 20, color: c(P.body), font: 'Calibri' })],
        })],
        width: { size: j === 0 ? 35 : 65, type: WidthType.PERCENTAGE },
      })),
    })),
  });
}

// ============== Cover ==============
function buildCover() {
  return [
    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'EDUCARE SKILL ACADEMY', bold: true, size: 28, color: c(P.muted), font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: 'User Manual', bold: true, size: 72, color: c(P.primary), font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Production CRM Platform', size: 28, color: c(P.secondary), font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [new TextRun({ text: 'Complete Customer Lifecycle Management System', size: 22, color: c(P.muted), font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Version 1.0', size: 22, color: c(P.body), font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 22, color: c(P.muted), font: 'Calibri' })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============== Body ==============
function buildBody() {
  const out = [];

  // 1. Introduction
  out.push(h1('1. Introduction'));
  out.push(body('Welcome to the Educare Skill Academy CRM. This user manual documents every module, role, workflow, and shortcut you need to operate the platform effectively. The system is a production-ready, multi-office customer relationship management platform designed for coaching institutes, placement agencies, and college admission consultancies.'));
  out.push(body('This document is organised by module. Each section explains what the module does, who can use it, and the typical workflows. A separate Roles & Permissions chapter at the end details exactly what each role can do.'));
  out.push(callout('Audience', 'This manual is written for all CRM users: Super Admins, Office Admins, HR, Callers, Counsellors, Accounts staff, Placement Executives, and Trainers. Each chapter highlights role-specific considerations.'));

  out.push(h2('1.1 Platform Overview'));
  out.push(body('The CRM manages the complete customer lifecycle from lead capture to placement completion. There are two parallel business workflows:'));
  out.push(bullet('Lead → Calling → Counselling → Appointment → Enrollment → Payment → Course → Batch → Training → Job Eligibility → Job Matching → Interview → Selection → Offer → Joining → Placement Completed.'));
  out.push(bullet('Lead → Counselling → College/Course Selection → Application → Admission → Payment → Semester Payment → Admission Completed.'));
  out.push(body('Both workflows share a unified audit trail, role-based access control, office-level data isolation, and backend-computed financials.'));

  out.push(h2('1.2 Login'));
  out.push(body('Navigate to the application URL in any modern browser (Chrome, Firefox, Safari, Edge). The login screen presents a split view: branding on the left and the sign-in form on the right. Demo accounts are listed below the form for one-click access.'));
  out.push(body('Enter your email and password. Click "Sign in". On success, you will be redirected to the dashboard. On failure, an error toast appears. If you forgot your password, contact your administrator.'));
  out.push(callout('Tip', 'For the best mobile experience, add the app to your home screen. The UI is fully responsive and works on phones, tablets, and desktops.'));

  // 2. Navigation
  out.push(h1('2. Navigation & Layout'));
  out.push(body('After login, the main interface consists of a sidebar (left), a top bar (top), and a content area (centre).'));
  out.push(h3('2.1 Sidebar'));
  out.push(body('The sidebar organises modules into eight groups: Overview, CRM, Academics, Finance, College Admissions, Placement, HR & Performance, and System. Click any item to navigate to that module.'));
  out.push(body('On mobile, the sidebar is collapsed by default. Tap the hamburger menu icon (top-left) to open it as a slide-out drawer. Items that you do not have permission to access are automatically hidden.'));
  out.push(h3('2.2 Top Bar'));
  out.push(body('The top bar contains the global search box (centre), office name badge (right), theme toggle (sun/moon), notifications bell, and user menu.'));
  out.push(body('Global search lets you find any record by ID, name, mobile, or email across Leads, Students, Enrollments, Payments, Companies, Job Applications, Placements, Colleges, and College Applications. Results appear as a dropdown below the search box; click any result to jump to that record.'));
  out.push(h3('2.3 Content Area'));
  out.push(body('Each module opens as a page in the content area. Pages share a consistent layout: a header with title and action buttons, a search/filter row, a data table, and pagination. Click any row to open the detail drawer.'));

  // 3. Dashboard
  out.push(h1('3. Dashboard'));
  out.push(body('The dashboard is the landing page after login. It shows real-time KPIs computed from your database — every number you see is a live aggregate, not a hardcoded value.'));
  out.push(h2('3.1 KPI Cards (Top Row)'));
  out.push(bullet('Total Leads: All leads in your visible scope.'));
  out.push(bullet('Today\'s Calls: Calls logged today.'));
  out.push(bullet('Today\'s Follow-ups: Pending follow-ups due today.'));
  out.push(bullet('Today\'s Enrollments: Enrollments created today.'));
  out.push(bullet('Today\'s Collection: Sum of valid payments collected today.'));
  out.push(bullet('Total Outstanding: Sum of all unpaid enrollment dues.'));
  out.push(bullet('Active Students: Students with status "Active".'));
  out.push(bullet('Placement Pending: Placements not yet completed.'));
  out.push(h2('3.2 Finance Summary'));
  out.push(body('Four gradient cards display Total Revenue, Total Expense, Net Profit (Revenue − Expense), and Total Collection. These figures are office-scoped based on the office filter.'));
  out.push(h2('3.3 Charts'));
  out.push(body('Six charts visualise your data: Monthly Revenue (area chart), Monthly Enrollments (bar chart), Lead Sources (pie chart), Lead Status Funnel (horizontal bar chart), Office Performance (multi-axis bar chart), and Placement Funnel (horizontal bar chart).'));
  out.push(h2('3.4 Activity Tables'));
  out.push(body('Six tables show recent activity: Today\'s Follow-ups, Recent Enrollments, Recent Payments, Overdue EMI, Pending Placements, and Top Employees by collection.'));
  out.push(h2('3.5 Office Filter'));
  out.push(body('In the top-right of the dashboard, use the office dropdown to filter all KPIs and charts. Super Admins and Office Admins can switch between "All Offices", "Bardhaman", and "Magra". Other roles are automatically restricted to their own office.'));

  // 4. Lead Management
  out.push(h1('4. Lead Management'));
  out.push(body('The Lead module is the entry point for every prospective student. Leads can come from Facebook, YouTube, Instagram, WhatsApp, Website, Google, Reference, Walk-in, Job Portal, or Other sources.'));
  out.push(h2('4.1 Lead List View (Table)'));
  out.push(body('The default view is a paginated table. Use the search box to find leads by name, mobile, email, or lead code. Filter by Status, Source, Lead Type, Office, and Assigned Employee using the dropdowns above the table.'));
  out.push(body('Click any row to open the Lead 360° view (described below). Use the "New Lead" button to create a lead via the full form. Use the row checkboxes to select multiple leads, then choose "Bulk assign" to assign them to one employee.'));
  out.push(h2('4.2 Lead Pipeline (Kanban) View'));
  out.push(body('Click the "Pipeline" toggle in the page header to switch to a Kanban-style board. Leads are grouped into columns by status: New, Call Pending, Contacted, Interested, Follow-up, Appointment Booked, Counselling Done, Enrolled, Converted, Not Interested, Wrong Number, Lost.'));
  out.push(callout('Drag-and-drop', 'Drag any lead card from one column to another to instantly update its status. The change is saved to the backend automatically and recorded in the audit log. If the save fails (e.g. network error), the card reverts to its original column.'));
  out.push(body('Each card shows the lead name, code, mobile (tap to call), assigned employee, source, and creation date. Tap the "Log Call" button on any card to record a call without leaving the Kanban view. Tap the card itself to open the full Lead 360° view.'));
  out.push(body('Use the "Quick Add Lead" button to create a lead with just a name and mobile number — ideal for Callers on the phone who need to capture a lead in seconds. Optional fields (WhatsApp, source, lead type, district, email) can be filled later.'));
  out.push(h2('4.3 Lead 360° View'));
  out.push(body('Click any lead (from table or Kanban) to open the Lead 360° drawer. It contains five tabs:'));
  out.push(bullet('Overview: Personal details (father/mother, mobile, WhatsApp, email, address) and lead details (source, type, office, assigned employee, qualification, branch, experience).'));
  out.push(bullet('Timeline: Immutable activity log — every action (created, assigned, called, status changed, follow-up scheduled, counselled, converted) is recorded chronologically. This log cannot be edited or deleted.'));
  out.push(bullet('Calls: Full call history with date, employee, direction, result, remarks, and next follow-up date.'));
  out.push(bullet('Counselling: All counselling sessions recorded for this lead. Multiple sessions are preserved (not overwritten).'));
  out.push(bullet('Assignments: Full assignment history with employee, reason, assigned by, and timestamp.'));
  out.push(body('Six action buttons appear above the tabs: Assign, Log Call, Follow-up, Appointment, Counselling, and Convert to Student. Each opens a modal with the relevant form.'));
  out.push(h2('4.4 Converting a Lead to a Student'));
  out.push(body('When a lead is qualified and ready to enroll, click "Convert to Student". The system creates a Student record automatically, copying the lead\'s name, mobile, WhatsApp, email, address, qualification, branch, and experience. You do not need to re-enter any data. The lead status changes to "Converted" and the activity timeline records the conversion.'));
  out.push(h2('4.5 Duplicate Detection'));
  out.push(body('When creating a lead, the system checks for existing leads or students with the same mobile, WhatsApp, or email. If a potential duplicate is found, a yellow warning banner appears with the existing records listed. You can still proceed with creation after acknowledging the warning — the action is logged to the audit trail.'));

  // 5. Student Management
  out.push(h1('5. Student Management'));
  out.push(body('A Student is a converted lead. Students can have multiple enrollments (one student might be enrolled in B.Tech coaching AND a Diploma course AND a College Admission case simultaneously).'));
  out.push(h2('5.1 Student 360° View'));
  out.push(body('Click any student row to open the Student 360° drawer with seven tabs:'));
  out.push(bullet('Overview: Personal, contact, and academic details.'));
  out.push(bullet('Enrollments: All course enrollments with financial summary (Total Fee, Discount, Final Fee, Paid, Due) and batch assignment.'));
  out.push(bullet('Payments: All payments received from this student with receipt number, mode, date, and amount.'));
  out.push(bullet('College: College admission applications and semester payments.'));
  out.push(bullet('Jobs: Job applications with interviews and offer details.'));
  out.push(bullet('Placement: Placement records with company, designation, salary, joining date, and verification status.'));
  out.push(bullet('Docs: Uploaded documents with status (Pending/Uploaded/Verified/Rejected).'));
  out.push(body('Two action buttons appear above the tabs: Enroll (create a new enrollment for this student) and Payment (record a new payment against an existing enrollment).'));

  // 6. Course, Enrollment, Batch
  out.push(h1('6. Course & Enrollment'));
  out.push(h2('6.1 Course Master'));
  out.push(body('Courses are organised by category: Diploma, B.Tech, ITI, Internship, Coaching, Other. Each course has a code, name, duration, fee, and an optional list of semesters and subjects. Create new courses from the Courses module.'));
  out.push(h2('6.2 Enrollment'));
  out.push(body('An enrollment links a student to a course with financial terms. When creating an enrollment, the system computes:'));
  out.push(bullet('Final Fee = Total Fee − Discount'));
  out.push(bullet('Paid = SUM(valid payments) — recomputed after every payment'));
  out.push(bullet('Due = Final Fee − Paid'));
  out.push(bullet('Payment Status = Unpaid / Partial / Paid (auto-derived from Due)'));
  out.push(callout('Important', 'Paid and Due amounts are NEVER entered manually. They are always computed by the backend from valid payment records. This prevents data inconsistency and fraud.'));
  out.push(body('During enrollment creation, you can opt to auto-generate an EMI schedule. Choose the number of installments (e.g. 5) and the system creates that many EMI records with 30-day intervals, each for an equal share of the final fee.'));
  out.push(h2('6.3 Batch'));
  out.push(body('A batch groups students taking the same course at the same office with the same trainer. Batches have a start date, end date, class time, mode (Offline/Online/Hybrid), and maximum capacity. The system shows current occupancy and available seats.'));
  out.push(body('Trainers can see only the batches assigned to them. Attendance is recorded per batch per student per day with status Present/Absent/Late/Leave.'));

  // 7. Finance
  out.push(h1('7. Finance & Payments'));
  out.push(h2('7.1 Payments'));
  out.push(body('Every payment generates a unique receipt number (e.g. EDU-RCP-000001). Payments can be made via Cash, UPI, Bank Transfer, Card, Cheque, or Other. A reference number (e.g. UPI transaction ID) can be recorded.'));
  out.push(body('When a payment is recorded against an enrollment:'));
  out.push(bullet('The enrollment\'s Paid and Due amounts are automatically recomputed.'));
  out.push(bullet('If the enrollment has an EMI schedule, the payment is automatically allocated to outstanding EMIs in FIFO order (oldest first).'));
  out.push(bullet('Each affected EMI\'s status updates (Paid / Partially Paid / Overdue) automatically.'));
  out.push(bullet('The action is recorded in the audit log with old and new values.'));
  out.push(callout('No Hard Delete', 'Payments cannot be hard-deleted. Use the reverse/refund/correction workflow to maintain audit integrity. This is a critical financial control.'));
  out.push(h2('7.2 EMI Schedule'));
  out.push(body('The EMI module shows all installments across all enrollments. Filter by status (Upcoming, Due Today, Paid, Overdue, Partially Paid, Cancelled). Each row shows installment number, student name, amount, paid amount, due date, paid date, and status.'));
  out.push(callout('Send Reminder', 'Click the "Send Reminder" button on any EMI row to send a notification to the student via in-app, email, SMS, and WhatsApp. The notification channel depends on which providers are configured (see Settings).'));
  out.push(h2('7.3 Invoices'));
  out.push(body('Invoices are GST-compliant with configurable CGST/SGST/IGST rates (set in Settings → GST Configuration). When you generate an invoice, the system calculates tax amounts and the total. Click the "Send" button on any invoice to dispatch it to the student via email/SMS/WhatsApp.'));
  out.push(h2('7.4 Income & Expenses'));
  out.push(body('Track all income (Course Fee, Coaching Fee, Placement Revenue, Admission Consultancy, Internship Fee, Other Income) and expenses (Employee Salary, Office Rent, Electricity, Internet, Marketing, Advertisement, Travel, Vendor Payment, Other Expense). Each record is office-scoped and dated.'));

  // 8. College Admissions
  out.push(h1('8. College Admission Module'));
  out.push(body('College admissions run as a parallel workflow to coaching enrollments. The College master stores partner colleges with contact details. College Applications track the admission pipeline:'));
  out.push(bullet('Interested → Application Started → Documents Pending → Application Submitted → Under Review → Selected → Admission Confirmed → Completed.'));
  out.push(bullet('Or: Cancelled / Rejected.'));
  out.push(body('Each application can have multiple Semester Payments (Admission Fee, Semester 1, Semester 2, ...). Each semester payment tracks Total Fee, Paid, Due, Due Date, and Status.'));

  // 9. Placement
  out.push(h1('9. Placement Pipeline'));
  out.push(body('The Placement module connects students to job openings at partner companies. The pipeline has 13 stages:'));
  out.push(bullet('Placement Pending → Eligible → Job Shared → Applied → Interview Scheduled → Interview Attended → Selected → Offer Letter → Joining Pending → Joined → Placement Completed.'));
  out.push(bullet('Or: Rejected / Not Interested.'));
  out.push(h2('9.1 Company Master'));
  out.push(body('Maintain a directory of hiring partners with industry, location, HR contact, and salary range. Historical hiring stats (total applied, selected, joined, placed) are computed from placement records.'));
  out.push(h2('9.2 Job Openings'));
  out.push(body('Job Openings represent specific positions at companies with job title, location, qualification, experience, salary range, vacancy count, and joining/interview dates.'));
  out.push(h2('9.3 Interviews'));
  out.push(body('A single job application can have multiple interview rounds (HR, Technical, Management). Each round records date, time, mode (in-person/phone/video), location, result (Pending/Selected/Rejected/On Hold), and remarks.'));
  out.push(h2('9.4 Offers & Joining'));
  out.push(body('When a candidate is selected, an Offer record captures salary, designation, joining date, and offer document URL. Placement status only becomes "Placement Completed" after the joining is verified by a Placement Executive.'));

  // 10. HR
  out.push(h1('10. HR & Performance'));
  out.push(h2('10.1 Employees'));
  out.push(body('The Employee master stores all staff with their office, designation, department, joining date, and contact details. Each employee can be linked to a user account for login.'));
  out.push(h2('10.2 Targets'));
  out.push(body('Set daily, weekly, or monthly targets for employees across six dimensions: leads, calls, appointments, enrollments, collection (₹), sales (₹), and placements (count). The dashboard computes achievement % automatically.'));
  out.push(h2('10.3 Incentive Rules'));
  out.push(body('Configure incentive calculations using three rule types:'));
  out.push(bullet('Percentage: e.g. 1% of enrollment value for counsellors.'));
  out.push(bullet('Fixed Amount: e.g. ₹500 per placement.'));
  out.push(bullet('Slab: e.g. 0-50K → 1%, 50K-1L → 2%, 1L+ → 3% (configurable via JSON).'));
  out.push(body('Incentive basis can be Enrollment Value, Collected Payment, or Other. Rules can be service-specific (e.g. only Coaching enrollments) or employee-specific.'));

  // 11. System
  out.push(h1('11. System Modules'));
  out.push(h2('11.1 Offices'));
  out.push(body('The CRM supports unlimited offices. Initial offices are Bardhaman and Magra. Each office has a code, name, type (Branch/Head Office/Franchise), address, district, state, phone, email, and status.'));
  out.push(callout('Data Isolation', 'Users see only the data for their own office. Super Admins and Office Admins can switch to "All Offices" view via the dashboard filter or office selector. Backend APIs enforce this scope — frontend filtering alone is never trusted.'));
  out.push(h2('11.2 Audit Logs'));
  out.push(body('Every sensitive action (create, update, delete, status change) is logged immutably. Each log entry records: timestamp, action user, office, action type, entity type and ID, old values, new values, IP address, and user agent.'));
  out.push(h2('11.3 Notifications'));
  out.push(body('In-app notifications appear with a badge count on the bell icon in the top bar. Click to view all notifications, mark as read, or navigate to the related entity.'));
  out.push(h2('11.4 Settings'));
  out.push(body('Three settings tabs:'));
  out.push(bullet('Organization: Name, GSTIN, phone, email, address.'));
  out.push(bullet('GST Configuration: CGST, SGST, IGST rates (used by invoice generation).'));
  out.push(bullet('Account & Security: Change your password (requires current password).'));
  out.push(h2('11.5 Reports'));
  out.push(body('Seven report types with date range, office, and status filters: Leads, Enrollments, Payments, Placements, Income, Expenses, Students. Each report shows summary KPIs, charts, and a data table. Click "Export CSV" to download the filtered data.'));

  // 12. Roles & Permissions
  out.push(h1('12. Roles & Permissions'));
  out.push(body('The CRM implements granular Role-Based Access Control (RBAC). Eight default roles are configured. Permissions are grouped by entity (lead, student, payment, etc.) and action (view, create, edit, delete, assign, export).'));
  out.push(h3('12.1 Super Admin'));
  out.push(body('Full system access. Can view, create, edit, and delete all records across all offices. Can manage users, roles, offices, and system settings. Sees "All Offices" by default.'));
  out.push(h3('12.2 Admin'));
  out.push(body('Business administration. Same as Super Admin but typically scoped to their office. Can manage employees, users, leads, students, payments, and reports.'));
  out.push(h3('12.3 HR'));
  out.push(body('Manages employees, targets, performance. Can view offices and users. Cannot access financial records or leads.'));
  out.push(h3('12.4 Caller (Telecaller)'));
  out.push(body('Frontline lead management. Can view, create, edit, and assign leads. Can log calls and schedule follow-ups. Ideal workflow: open the Kanban Pipeline view, drag leads through status columns, log calls inline, and convert qualified leads.'));
  out.push(h3('12.5 Counsellor'));
  out.push(body('Manages the counselling-to-enrollment flow. Can view and edit leads, create students, manage enrollments, view courses and batches. Records counselling sessions and converts qualified leads.'));
  out.push(h3('12.6 Accounts'));
  out.push(body('Owns the finance module. Can view students and enrollments, create and edit payments, manage EMI schedules, generate invoices, track income and expenses, and export financial reports.'));
  out.push(h3('12.7 Placement Executive'));
  out.push(body('Manages the placement pipeline. Can view and edit students, companies, job openings, job applications, interviews, and placements. Marks placements as completed after joining verification.'));
  out.push(h3('12.8 Trainer'));
  out.push(body('Manages batches and attendance. Sees only the batches assigned to them. Can view students in their batches and record daily attendance.'));

  // 13. Shortcuts & Tips
  out.push(h1('13. Shortcuts & Tips'));
  out.push(h2('13.1 Keyboard'));
  out.push(shortcutTable([
    ['Action', 'How'],
    ['Open menu (mobile)', 'Tap hamburger icon (top-left)'],
    ['Search globally', 'Click search box, type query'],
    ['Toggle dark mode', 'Click sun/moon icon in top bar'],
    ['View notifications', 'Click bell icon'],
    ['Sign out', 'Click avatar → Sign out'],
    ['Close drawer', 'Click backdrop or Close button, or press Escape'],
    ['Switch Lead view (Table/Pipeline)', 'Click the Table/Pipeline toggle in the page header'],
  ]));
  out.push(h2('13.2 Caller Quick Workflow'));
  out.push(body('For Callers, the fastest workflow is:'));
  out.push(bullet('Open Leads → switch to Pipeline view (remembers your preference).'));
  out.push(bullet('Click "Quick Add Lead" — enter just name and mobile, save.'));
  out.push(bullet('Drag the new lead from "New" to "Call Pending" or "Contacted".'));
  out.push(bullet('Click "Log Call" on the card, record the result, optionally set next follow-up.'));
  out.push(bullet('If interested, drag to "Interested" then "Appointment Booked".'));
  out.push(bullet('When ready for counselling, reassign to a Counsellor via "Assign".'));
  out.push(h2('13.3 Bulk Operations'));
  out.push(body('In the table view, use the row checkboxes to select multiple records. A bulk-assign dropdown appears in the page header — select an employee to assign all selected leads at once.'));

  // 14. Troubleshooting
  out.push(h1('14. Troubleshooting'));
  out.push(h2('14.1 Cannot see a module'));
  out.push(body('Your role may not have permission. Check with your administrator. Super Admins can edit role permissions in the Settings → Roles (visible only to Super Admin).'));
  out.push(h2('14.2 Cannot see data from another office'));
  out.push(body('This is intentional. Office-level data isolation is enforced on the backend. If you need cross-office access, ask an admin to upgrade your role to Super Admin or Office Admin.'));
  out.push(h2('14.3 Payment not updating enrollment'));
  out.push(body('Payments must have status "Valid" to count toward enrollment totals. If a payment was reversed or refunded, it is excluded from the Paid amount. Check the payment status in the Payments module.'));
  out.push(h2('14.4 EMI reminder not sent'));
  out.push(body('EMI reminders require at least one notification provider to be configured (Resend for email, Twilio for SMS, or WhatsApp Business API). Contact your administrator to verify provider settings. Even if no provider is configured, the in-app notification is still created.'));
  out.push(h2('14.5 Forgot password'));
  out.push(body('Contact your administrator. They can reset your password from the Users module.'));

  // 15. Appendix
  out.push(h1('15. Appendix'));
  out.push(h2('15.1 Status Reference'));
  out.push(body('Lead Statuses: New, Call Pending, Contacted, Interested, Follow-up, Appointment Booked, Appointment Completed, Counselling Done, Enrollment Pending, Enrolled, Payment Pending, Not Interested, Wrong Number, Duplicate, Lost, Converted.'));
  out.push(body('Enrollment Payment Status: Unpaid, Partial, Paid.'));
  out.push(body('EMI Statuses: Upcoming, Due Today, Paid, Overdue, Partially Paid, Cancelled.'));
  out.push(body('Placement Statuses: Placement Pending, Eligible, Job Shared, Applied, Interview Scheduled, Interview Attended, Selected, Offer Letter, Joining Pending, Joined, Placement Completed, Rejected, Not Interested.'));
  out.push(h2('15.2 Code Patterns'));
  out.push(body('All entity codes follow the pattern EDU-XXX-NNNNNN where XXX identifies the entity type:'));
  out.push(shortcutTable([
    ['Code', 'Entity'],
    ['EDU-LEAD-000001', 'Lead'],
    ['EDU-STU-000001', 'Student'],
    ['EDU-ENR-000001', 'Enrollment'],
    ['EDU-RCP-000001', 'Payment Receipt'],
    ['EDU-APT-000001', 'Appointment'],
    ['EDU-INV-000001', 'Invoice'],
    ['EDU-JOB-000001', 'Job Opening'],
    ['EDU-JAP-000001', 'Job Application'],
    ['EDU-CAP-000001', 'College Application'],
    ['EDU-PLT-000001', 'Placement'],
    ['EDU-INC-000001', 'Income'],
    ['EDU-EXP-000001', 'Expense'],
  ]));
  out.push(h2('15.3 Support'));
  out.push(body('For technical support, contact your system administrator. For feature requests or bug reports, please provide:'));
  out.push(bullet('Your role and office'));
  out.push(bullet('The module name and page URL'));
  out.push(bullet('Steps to reproduce the issue'));
  out.push(bullet('Expected vs. actual behaviour'));
  out.push(bullet('Screenshots if applicable'));

  return out;
}

// ============== Assemble Document ==============
const doc = new Document({
  creator: 'Educare Skill Academy CRM',
  title: 'Educare Skill Academy — User Manual',
  description: 'Complete user manual for the Educare Skill Academy CRM platform',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Cover section (no header/footer, no margins)
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: buildCover(),
    },
    // Body section
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Educare Skill Academy CRM — User Manual', size: 18, color: c(P.muted), font: 'Calibri' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.muted), font: 'Calibri' })],
          })],
        }),
      },
      children: buildBody(),
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = '/home/z/my-project/download/Educare-CRM-User-Manual.docx';
  fs.writeFileSync(outPath, buf);
  console.log('✓ User Manual generated:', outPath);
  console.log('  Size:', (buf.length / 1024).toFixed(1), 'KB');
});
