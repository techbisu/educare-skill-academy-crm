// Specialized business action endpoints.
// POST /api/v1/actions/[action] with JSON body.

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, applyOfficeScope, officeScope, hasPermission } from '@/lib/auth-utils';
import { auditLog, createNotification, addLeadActivity } from '@/lib/audit';
import { generateCode } from '@/lib/code-generator';
import { ok, fail, unauthorized, forbidden, notFound, serverError } from '@/lib/api';
import { sendEmiReminder, sendInvoice, dispatchNotification } from '@/lib/notification-providers';

// Action → required permission. 'none' = any authenticated user. Super Admin bypasses.
const ACTION_PERMISSIONS: Record<string, string> = {
  'lead.assign': 'lead.assign',
  'lead.call': 'lead.edit',
  'lead.followup': 'followup.create',
  'lead.appointment': 'appointment.create',
  'lead.counselling': 'counselling.create',
  'lead.convert': 'lead.edit',
  'lead.bulk-assign': 'lead.assign',
  'lead.update-status': 'lead.edit',
  'lead.quick-create': 'lead.create',
  'student.enroll': 'enrollment.create',
  'enrollment.add-payment': 'payment.create',
  'enrollment.generate-emi': 'emi.edit',
  'attendance.mark': 'attendance.create',
  'college-app.add-semester-payment': 'collegeadmission.edit',
  'placement.complete': 'placement.edit',
  'job-application.advance': 'jobapplication.edit',
  'invoice.generate': 'invoice.create',
  'invoice.send': 'invoice.view',
  'emi.send-reminder': 'emi.view',
  'notification.send': 'notification.view',  // will be tightened to Admin+ below
  'user.change-password': 'none',           // own password only
  'notification.mark-read': 'none',          // own notifications only
  'duplicate-check': 'lead.view',
};

async function handler(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  try {
    const user = await requireUser();
    const { action } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    // ===== Permission enforcement =====
    if (!user.roles.includes('Super Admin')) {
      const requiredPerm = ACTION_PERMISSIONS[action];
      if (requiredPerm && requiredPerm !== 'none') {
        // Special tightening: notification.send (broadcast) is admin-only
        if (action === 'notification.send' && !user.roles.includes('Admin')) {
          return forbidden('Only administrators can broadcast notifications');
        }
        if (!hasPermission(user, requiredPerm)) {
          return forbidden(`Missing permission: ${requiredPerm}`);
        }
      } else if (!requiredPerm) {
        // Unknown actions are blocked by default
        return forbidden(`Action not permitted: ${action}`);
      }
    }

    switch (action) {
      case 'lead.assign': return await leadAssign(user, body);
      case 'lead.call': return await leadCall(user, body);
      case 'lead.followup': return await leadFollowUp(user, body);
      case 'lead.appointment': return await leadAppointment(user, body);
      case 'lead.counselling': return await leadCounselling(user, body);
      case 'lead.convert': return await leadConvert(user, body);
      case 'lead.bulk-assign': return await leadBulkAssign(user, body);
      case 'lead.update-status': return await leadUpdateStatus(user, body);
      case 'lead.quick-create': return await leadQuickCreate(user, body);
      case 'student.enroll': return await studentEnroll(user, body);
      case 'enrollment.add-payment': return await enrollmentAddPayment(user, body);
      case 'enrollment.generate-emi': return await enrollmentGenerateEmi(user, body);
      case 'attendance.mark': return await markAttendance(user, body);
      case 'college-app.add-semester-payment': return await addSemesterPayment(user, body);
      case 'placement.complete': return await completePlacement(user, body);
      case 'job-application.advance': return await advanceJobApplication(user, body);
      case 'invoice.generate': return await generateInvoice(user, body);
      case 'invoice.send': return await invoiceSend(user, body);
      case 'emi.send-reminder': return await emiSendReminder(user, body);
      case 'notification.send': return await notificationSend(user, body);
      case 'user.change-password': return await changePassword(user, body);
      case 'notification.mark-read': return await markNotificationsRead(user, body);
      case 'duplicate-check': return await duplicateCheck(user, body);
      default: return fail(`Unknown action: ${action}`, 404);
    }
  } catch (e: any) {
    console.error('Action API error:', e);
    if (e?.message === 'Unauthorized') return unauthorized();
    if (e?.message === 'Forbidden') return forbidden();
    return serverError(e?.message);
  }
}

// Send EMI reminder via configured channels
async function emiSendReminder(user: any, body: any) {
  const { emiId, channel } = body;
  if (!emiId) return fail('emiId required', 400);
  const emi = await db.emiSchedule.findUnique({ where: { id: emiId }, include: { enrollment: { include: { student: true } } } });
  if (!emi) return notFound('EMI not found');
  const scope = officeScope(user);
  if (scope && emi.enrollment?.officeId !== scope) return forbidden();
  const { results } = await sendEmiReminder(emiId, channel || 'all');
  return ok({ results }, `EMI reminder sent via ${results.filter(r => r.success).length}/${results.length} channels`);
}

// Send invoice via configured channels
async function invoiceSend(user: any, body: any) {
  const { invoiceId, channel } = body;
  if (!invoiceId) return fail('invoiceId required', 400);
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { student: true } });
  if (!inv) return notFound('Invoice not found');
  const scope = officeScope(user);
  if (scope && inv.officeId !== scope) return forbidden();
  const { results } = await sendInvoice(invoiceId, channel || 'email');
  return ok({ results }, `Invoice sent via ${results.filter(r => r.success).length}/${results.length} channels`);
}

// Generic notification send (admin/HR can broadcast)
async function notificationSend(user: any, body: any) {
  const { userId, channel, to, type, subject, body: messageBody } = body;
  if (!subject || !messageBody) return fail('subject and body required', 400);
  const { results } = await dispatchNotification({
    userId, channel: channel || 'in-app', to: to || {}, type: type || 'Custom',
    subject, body: messageBody,
  });
  return ok({ results }, 'Notification dispatched');
}

// Quick-create a lead with minimal fields (for Caller mobile UX)
async function leadQuickCreate(user: any, body: any) {
  const { name, mobile, source, leadType, officeId } = body;
  if (!name || !mobile) return fail('name and mobile required', 400);
  const targetOffice = officeId || user.officeId;
  const scope = officeScope(user);
  if (scope && targetOffice !== scope) return forbidden();

  const leadCode = await generateCode('lead');
  const lead = await db.lead.create({
    data: {
      leadCode,
      studentName: name,
      mobile,
      whatsapp: body.whatsapp || mobile,
      email: body.email || null,
      source: source || 'Walk-in',
      leadType: leadType || 'Coaching',
      status: 'New',
      officeId: targetOffice,
      assignedEmployeeId: user.employeeId || null,
      fatherName: body.fatherName || null,
      district: body.district || null,
      qualification: body.qualification || null,
      branchTrade: body.branchTrade || null,
    },
  });
  if (user.employeeId) {
    await db.leadAssignment.create({ data: { leadId: lead.id, employeeId: user.employeeId, assignedById: user.id, assignmentReason: 'Quick-create by caller' } });
  }
  await addLeadActivity({ leadId: lead.id, action: 'Lead Created', description: `Quick-created by ${user.name}`, createdByUserId: user.id });
  await auditLog({ actionUserId: user.id, officeId: targetOffice, action: 'lead.quick_create', entityType: 'Lead', entityId: lead.id, newValues: lead });
  return ok(lead, 'Lead created');
}

// Update lead status only (drag-drop in kanban)
async function leadUpdateStatus(user: any, body: any) {
  const { leadId, status } = body;
  if (!leadId || !status) return fail('leadId and status required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound('Lead not found');
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const updated = await db.lead.update({ where: { id: leadId }, data: { status } });
  await addLeadActivity({ leadId, action: 'Status Changed', description: `${lead.status} → ${status}`, metadata: { from: lead.status, to: status }, createdByUserId: user.id });
  await auditLog({ actionUserId: user.id, action: 'lead.update_status', entityType: 'Lead', entityId: leadId, oldValues: { status: lead.status }, newValues: { status } });
  return ok(updated, 'Lead status updated');
}

async function leadAssign(user: any, body: any) {
  const { leadId, employeeId, reason } = body;
  if (!leadId || !employeeId) return fail('leadId and employeeId required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound('Lead not found');
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const assignment = await db.leadAssignment.create({
    data: { leadId, employeeId, assignedById: user.id, assignmentReason: reason || 'Reassigned' },
  });
  await db.lead.update({ where: { id: leadId }, data: { assignedEmployeeId: employeeId, status: lead.status === 'New' ? 'Call Pending' : lead.status } });
  await addLeadActivity({ leadId, action: 'Assigned to Employee', description: `Employee ID ${employeeId} assigned`, createdByUserId: user.id });
  await auditLog({ actionUserId: user.id, action: 'lead.assign', entityType: 'Lead', entityId: leadId, newValues: { employeeId, reason } });
  const emp = await db.employee.findUnique({ where: { id: employeeId }, include: { user: true } });
  if (emp?.user) {
    await createNotification({ userId: emp.user.id, type: 'Lead Assignment', title: 'New lead assigned', message: `Lead ${lead.leadCode} has been assigned to you.`, entityType: 'Lead', entityId: leadId });
  }
  return ok(assignment, 'Lead assigned successfully');
}

async function leadCall(user: any, body: any) {
  const { leadId, employeeId, callDate, callTime, duration, direction, result, remarks, nextFollowupDate } = body;
  if (!leadId) return fail('leadId required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound('Lead not found');
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const empId = employeeId || lead.assignedEmployeeId || user.employeeId;
  if (!empId) return fail('employeeId required', 400);
  const call = await db.call.create({
    data: { leadId, employeeId: empId, callDate: callDate ? new Date(callDate) : new Date(), callTime, duration, direction: direction || 'Outbound', result, remarks, nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : null },
  });
  let newStatus = lead.status;
  if (result === 'Connected') newStatus = (lead.status === 'New' || lead.status === 'Call Pending') ? 'Contacted' : lead.status;
  if (result === 'Interested') newStatus = 'Interested';
  if (result === 'Not Interested') newStatus = 'Not Interested';
  if (result === 'Wrong Number') newStatus = 'Wrong Number';
  if (result === 'Appointment Fixed') newStatus = 'Appointment Booked';
  if (result === 'Call Later' && nextFollowupDate) newStatus = 'Follow-up';
  await db.lead.update({ where: { id: leadId }, data: { status: newStatus } });
  await addLeadActivity({ leadId, action: 'Call Attempted', description: `Result: ${result}`, metadata: { callId: call.id }, createdByUserId: user.id });
  if (nextFollowupDate) {
    await db.followUp.create({
      data: { entityType: 'Lead', entityId: leadId, leadId, assignedToId: empId, dueDate: new Date(nextFollowupDate), priority: 'Medium', status: 'Pending', remarks: `Follow-up after call: ${remarks || ''}` },
    });
    await addLeadActivity({ leadId, action: 'Follow-up scheduled', description: `Due: ${nextFollowupDate}`, createdByUserId: user.id });
  }
  return ok(call, 'Call recorded');
}

async function leadFollowUp(user: any, body: any) {
  const { leadId, dueDate, dueTime, priority, remarks, assignedToId } = body;
  if (!leadId || !dueDate) return fail('leadId and dueDate required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound('Lead not found');
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const f = await db.followUp.create({
    data: { entityType: 'Lead', entityId: leadId, leadId, assignedToId: assignedToId || lead.assignedEmployeeId || user.employeeId!, dueDate: new Date(dueDate), dueTime, priority: priority || 'Medium', status: 'Pending', remarks },
  });
  await addLeadActivity({ leadId, action: 'Follow-up scheduled', description: `Due: ${dueDate}`, createdByUserId: user.id });
  return ok(f, 'Follow-up created');
}

async function leadAppointment(user: any, body: any) {
  const { leadId, employeeId, officeId, date, time, type, purpose, status, remarks } = body;
  if (!leadId || !date) return fail('leadId and date required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound();
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const apptCode = await generateCode('appointment');
  const appt = await db.appointment.create({
    data: { appointmentCode: apptCode, leadId, employeeId: employeeId || lead.assignedEmployeeId || user.employeeId!, officeId: officeId || lead.officeId, date: new Date(date), time, type: type || 'Office Visit', purpose, status: status || 'Scheduled', remarks, createdById: user.id },
  });
  await db.lead.update({ where: { id: leadId }, data: { status: 'Appointment Booked' } });
  await addLeadActivity({ leadId, action: 'Appointment Booked', description: `${type} on ${date}`, createdByUserId: user.id });
  return ok(appt, 'Appointment created');
}

async function leadCounselling(user: any, body: any) {
  const { leadId, counsellorId, date, currentQualification, careerInterest, skills, preferredCourse, preferredLocation, expectedSalary, recommendation, remarks, nextFollowup } = body;
  if (!leadId) return fail('leadId required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound();
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();
  const session = await db.counsellingSession.create({
    data: { leadId, counsellorId: counsellorId || user.employeeId!, date: date ? new Date(date) : new Date(), currentQualification, careerInterest, skills, preferredCourse, preferredLocation, expectedSalary, recommendation, remarks, nextFollowup: nextFollowup ? new Date(nextFollowup) : null },
  });
  await db.lead.update({ where: { id: leadId }, data: { status: 'Counselling Done' } });
  await addLeadActivity({ leadId, action: 'Counselling Done', description: 'Counselling session recorded', createdByUserId: user.id });
  return ok(session, 'Counselling session saved');
}

async function leadConvert(user: any, body: any) {
  const { leadId } = body;
  if (!leadId) return fail('leadId required', 400);
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return notFound();
  const scope = officeScope(user);
  if (scope && lead.officeId !== scope) return forbidden();

  const studentCode = await generateCode('student');
  const student = await db.student.create({
    data: {
      studentCode,
      name: lead.studentName,
      fatherName: lead.fatherName,
      motherName: lead.motherName,
      mobile: lead.mobile,
      whatsapp: lead.whatsapp,
      email: lead.email,
      address: lead.address,
      district: lead.district,
      qualification: lead.qualification,
      passingYear: lead.passingYear,
      branch: lead.branchTrade,
      experience: lead.experience,
      officeId: lead.officeId,
      leadId: lead.id,
      status: 'Active',
    },
  });
  await db.lead.update({ where: { id: leadId }, data: { status: 'Converted' } });
  await addLeadActivity({ leadId, action: 'Converted to Student', description: `Created student ${studentCode}`, metadata: { studentId: student.id }, createdByUserId: user.id });
  await auditLog({ actionUserId: user.id, officeId: lead.officeId, action: 'lead.convert', entityType: 'Lead', entityId: leadId, newValues: { studentId: student.id, studentCode } });
  return ok(student, 'Lead converted to student successfully');
}

async function leadBulkAssign(user: any, body: any) {
  const { leadIds, employeeId, reason } = body;
  if (!Array.isArray(leadIds) || !employeeId) return fail('leadIds[] and employeeId required', 400);
  for (const leadId of leadIds) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) continue;
    const scope = officeScope(user);
    if (scope && lead.officeId !== scope) continue;
    await db.leadAssignment.create({ data: { leadId, employeeId, assignedById: user.id, assignmentReason: reason || 'Bulk assigned' } });
    await db.lead.update({ where: { id: leadId }, data: { assignedEmployeeId: employeeId } });
    await addLeadActivity({ leadId, action: 'Assigned to Employee', description: `Bulk assignment to employee ${employeeId}`, createdByUserId: user.id });
  }
  return ok({ count: leadIds.length }, 'Bulk assignment complete');
}

async function studentEnroll(user: any, body: any) {
  const { studentId, courseId, semesterId, batchId, totalFee, discount, counsellorId, remarks, generateEmi, emiInstallments } = body;
  if (!studentId || !courseId) return fail('studentId and courseId required', 400);
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return notFound('Student not found');
  const scope = officeScope(user);
  if (scope && student.officeId !== scope) return forbidden();
  const finalFee = (totalFee || 0) - (discount || 0);
  const enrCode = await generateCode('enrollment');
  const enr = await db.enrollment.create({
    data: {
      enrollmentCode: enrCode,
      studentId, courseId, semesterId, batchId,
      enrollmentDate: new Date(),
      counsellorId: counsellorId || user.employeeId,
      officeId: student.officeId,
      totalFee: totalFee || 0,
      discount: discount || 0,
      finalFee,
      paidAmount: 0,
      dueAmount: finalFee,
      paymentStatus: finalFee <= 0 ? 'Paid' : 'Unpaid',
      status: 'Active',
      remarks,
    },
  });
  await auditLog({ actionUserId: user.id, officeId: student.officeId, action: 'enrollment.create', entityType: 'Enrollment', entityId: enr.id, newValues: enr });
  if (batchId) {
    try { await db.batchStudent.create({ data: { batchId, studentId } }); } catch {}
  }
  if (generateEmi && emiInstallments && emiInstallments > 0 && finalFee > 0) {
    const instAmount = Math.round(finalFee / emiInstallments);
    for (let k = 1; k <= emiInstallments; k++) {
      const due = new Date();
      due.setDate(due.getDate() + (k - 1) * 30);
      await db.emiSchedule.create({
        data: { enrollmentId: enr.id, installmentNumber: k, dueDate: due, amount: instAmount, paidAmount: 0, status: 'Upcoming' },
      });
    }
  }
  return ok(enr, 'Enrollment created successfully');
}

async function enrollmentAddPayment(user: any, body: any) {
  const { enrollmentId, amount, paymentMode, referenceNo, paymentDate, remarks } = body;
  if (!enrollmentId || !amount || !paymentMode) return fail('enrollmentId, amount, paymentMode required', 400);
  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enr) return notFound('Enrollment not found');
  const scope = officeScope(user);
  if (scope && enr.officeId !== scope) return forbidden();
  const receiptNo = await generateCode('payment');
  const payment = await db.payment.create({
    data: {
      receiptNo,
      studentId: enr.studentId,
      enrollmentId: enr.id,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode,
      referenceNo,
      receivedById: user.employeeId,
      receivedByUserId: user.id,
      officeId: enr.officeId,
      remarks,
      status: 'Valid',
    },
  });
  await recomputeEnrollmentFinancials(enr.id);
  const emis = await db.emiSchedule.findMany({ where: { enrollmentId: enr.id, status: { in: ['Upcoming','Due Today','Overdue','Partially Paid'] } }, orderBy: { installmentNumber: 'asc' } });
  let remaining = amount;
  for (const emi of emis) {
    if (remaining <= 0) break;
    const pay = Math.min(remaining, emi.amount - emi.paidAmount);
    await db.emiSchedule.update({
      where: { id: emi.id },
      data: { paidAmount: emi.paidAmount + pay, paidDate: new Date(), status: emi.paidAmount + pay >= emi.amount ? 'Paid' : 'Partially Paid', paymentId: payment.id },
    });
    remaining -= pay;
  }
  await auditLog({ actionUserId: user.id, officeId: enr.officeId, action: 'payment.create', entityType: 'Payment', entityId: payment.id, newValues: payment });
  return ok(payment, 'Payment recorded and financials updated');
}

async function recomputeEnrollmentFinancials(enrollmentId: string) {
  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enr) return;
  const totalPaid = await db.payment.aggregate({ where: { enrollmentId, status: 'Valid' }, _sum: { amount: true } });
  const paid = totalPaid._sum.amount ?? 0;
  // Due should never be negative (overpayment is tracked in paidAmount but due clamped to 0)
  const due = Math.max(0, enr.finalFee - paid);
  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { paidAmount: paid, dueAmount: due, paymentStatus: due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid' },
  });
}

async function enrollmentGenerateEmi(user: any, body: any) {
  const { enrollmentId, installments, amountPerInstallment, startDate, intervalDays } = body;
  if (!enrollmentId || !installments || !amountPerInstallment) return fail('enrollmentId, installments, amountPerInstallment required', 400);
  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enr) return notFound();
  const scope = officeScope(user);
  if (scope && enr.officeId !== scope) return forbidden();
  const start = startDate ? new Date(startDate) : new Date();
  const interval = intervalDays || 30;
  for (let k = 1; k <= installments; k++) {
    const due = new Date(start);
    due.setDate(due.getDate() + (k - 1) * interval);
    await db.emiSchedule.create({
      data: { enrollmentId, installmentNumber: k, dueDate: due, amount: amountPerInstallment, paidAmount: 0, status: due < new Date() ? 'Overdue' : 'Upcoming' },
    });
  }
  return ok({ count: installments }, 'EMI schedule generated');
}

async function markAttendance(user: any, body: any) {
  const { batchId, studentId, date, status, remarks } = body;
  if (!batchId || !studentId || !date || !status) return fail('batchId, studentId, date, status required', 400);
  const att = await db.attendance.upsert({
    where: { batchId_studentId_date: { batchId, studentId, date: new Date(date) } },
    update: { status, remarks },
    create: { batchId, studentId, date: new Date(date), status, remarks },
  });
  return ok(att, 'Attendance marked');
}

async function addSemesterPayment(user: any, body: any) {
  const { applicationId, semesterName, totalFee, dueDate } = body;
  if (!applicationId || !semesterName || totalFee == null) return fail('applicationId, semesterName, totalFee required', 400);
  const cap = await db.collegeApplication.findUnique({ where: { id: applicationId } });
  if (!cap) return notFound();
  const sp = await db.semesterPayment.create({
    data: { applicationId, semesterName, totalFee, paidAmount: 0, dueAmount: totalFee, dueDate: dueDate ? new Date(dueDate) : null, status: 'Pending' },
  });
  return ok(sp, 'Semester payment record added');
}

async function completePlacement(user: any, body: any) {
  const { placementId, joiningDate, salary, designation, verifiedById } = body;
  if (!placementId) return fail('placementId required', 400);
  const placement = await db.placement.findUnique({ where: { id: placementId } });
  if (!placement) return notFound();
  const updated = await db.placement.update({
    where: { id: placementId },
    data: {
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      salary, designation,
      verifiedById: verifiedById || user.employeeId,
      verificationDate: new Date(),
      status: 'Placement Completed',
    },
  });
  await auditLog({ actionUserId: user.id, action: 'placement.complete', entityType: 'Placement', entityId: placementId, oldValues: placement, newValues: updated });
  return ok(updated, 'Placement verified & completed');
}

async function advanceJobApplication(user: any, body: any) {
  const { applicationId, newStatus, interviewData, offerData } = body;
  if (!applicationId || !newStatus) return fail('applicationId and newStatus required', 400);
  const japp = await db.jobApplication.findUnique({ where: { id: applicationId } });
  if (!japp) return notFound();
  const updated = await db.jobApplication.update({ where: { id: applicationId }, data: { status: newStatus } });
  if (interviewData) {
    const lastInterview = await db.interview.findFirst({ where: { applicationId }, orderBy: { round: 'desc' } });
    const round = (lastInterview?.round ?? 0) + 1;
    await db.interview.create({ data: { applicationId, companyId: japp.companyId, studentId: japp.studentId, round, roundType: interviewData.roundType, date: new Date(interviewData.date), time: interviewData.time, mode: interviewData.mode, location: interviewData.location, result: interviewData.result, remarks: interviewData.remarks } });
  }
  if (offerData) {
    await db.offer.upsert({
      where: { applicationId },
      update: { ...offerData, offerDate: new Date() },
      create: { applicationId, ...offerData, offerDate: new Date() },
    });
  }
  return ok(updated, 'Job application advanced');
}

async function generateInvoice(user: any, body: any) {
  const { studentId, enrollmentId, serviceName, taxableAmount, cgstRate, sgstRate, igstRate } = body;
  if (!studentId || !serviceName || taxableAmount == null) return fail('studentId, serviceName, taxableAmount required', 400);
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return notFound();
  const settings = await db.setting.findMany({ where: { group: 'GST' } });
  const getSetting = (k: string, def: number) => parseFloat(settings.find(s => s.key === k)?.value ?? String(def));
  const cgst = cgstRate ?? getSetting('gst.cgst_rate', 0);
  const sgst = sgstRate ?? getSetting('gst.sgst_rate', 0);
  const igst = igstRate ?? getSetting('gst.igst_rate', 0);
  const cgstAmount = (taxableAmount * cgst) / 100;
  const sgstAmount = (taxableAmount * sgst) / 100;
  const igstAmount = (taxableAmount * igst) / 100;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
  const invoiceNumber = await generateCode('invoice');
  const inv = await db.invoice.create({
    data: {
      invoiceNumber,
      studentId,
      enrollmentId,
      customerName: student.name,
      serviceName,
      taxableAmount,
      cgstRate: cgst, sgstRate: sgst, igstRate: igst,
      cgstAmount, sgstAmount, igstAmount,
      totalAmount,
      paymentStatus: 'Unpaid',
      officeId: student.officeId,
    },
  });
  await auditLog({ actionUserId: user.id, officeId: student.officeId, action: 'invoice.generate', entityType: 'Invoice', entityId: inv.id, newValues: inv });
  return ok(inv, 'Invoice generated');
}

async function changePassword(user: any, body: any) {
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return fail('currentPassword and newPassword required', 400);
  if (newPassword.length < 8) return fail('Password must be at least 8 characters', 400);
  const bcrypt = (await import('bcryptjs')).default;
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u) return notFound();
  const okPwd = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!okPwd) return fail('Current password incorrect', 400);
  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: u.id }, data: { passwordHash: hash } });
  await auditLog({ actionUserId: user.id, action: 'user.change_password', entityType: 'User', entityId: u.id });
  return ok({}, 'Password changed');
}

async function markNotificationsRead(user: any, body: any) {
  const { notificationIds } = body;
  if (!Array.isArray(notificationIds)) return fail('notificationIds[] required', 400);
  await db.notification.updateMany({ where: { id: { in: notificationIds }, userId: user.id }, data: { isRead: true } });
  return ok({ count: notificationIds.length }, 'Notifications marked as read');
}

async function duplicateCheck(user: any, body: any) {
  const { mobile, whatsapp, email, excludeLeadId } = body;
  if (!mobile && !whatsapp && !email) return fail('At least one of mobile/whatsapp/email required', 400);
  const scope = officeScope(user);
  const where: any = { OR: [] };
  if (mobile) where.OR.push({ mobile });
  if (whatsapp) where.OR.push({ whatsapp });
  if (email) where.OR.push({ email });
  if (excludeLeadId) where.id = { not: excludeLeadId };
  if (scope) where.officeId = scope;
  const leads = await db.lead.findMany({ where, take: 5 });
  const students = await db.student.findMany({ where, take: 5 });
  return ok({ leads, students, hasDuplicates: leads.length > 0 || students.length > 0 });
}

export { handler as POST };
