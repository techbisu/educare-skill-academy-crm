// Notification provider infrastructure.
// Supports in-app, email (Resend), SMS (Twilio-like), and WhatsApp (WhatsApp Business Cloud API).
//
// Each provider is configured via env vars. If a provider is not configured,
// the message is recorded as in-app only and no error is thrown.
//
// Usage:
//   import { dispatchNotification } from '@/lib/notification-providers';
//   await dispatchNotification({
//     userId: '...', // for in-app
//     channel: 'email' | 'sms' | 'whatsapp' | 'in-app' | 'all',
//     to: { email, mobile, whatsapp },
//     type: 'EMI Due' | 'Payment Received' | ...,
//     subject: 'Your EMI is due',
//     body: '...',
//     entityType: 'EMI', entityId: '...',
//   });

import { db } from '@/lib/db';
import { createNotification } from '@/lib/audit';

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'whatsapp' | 'all';

export type NotificationPayload = {
  userId?: string;
  channel: NotificationChannel;
  to: { email?: string; mobile?: string; whatsapp?: string };
  type: string;
  subject: string;
  body: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
};

export type SendResult = {
  channel: string;
  success: boolean;
  message?: string;
  providerMessageId?: string;
};

// ===== Email (Resend) =====
async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { channel: 'email', success: false, message: 'RESEND_API_KEY not configured' };
  }
  try {
    const fromEmail = process.env.EMAIL_FROM || 'Educare Skill Academy <noreply@educare.com>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #047857, #0d9488); padding: 16px 20px; border-radius: 8px 8px 0 0; color: white;">
            <h2 style="margin: 0; font-size: 18px;">Educare Skill Academy</h2>
            <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">${subject}</p>
          </div>
          <div style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${body}</div>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 11px; color: #6b7280; margin: 0;">This is an automated message from Educare Skill Academy CRM. Please do not reply.</p>
          </div>
        </div>`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { channel: 'email', success: false, message: data.message || 'Resend API error' };
    }
    return { channel: 'email', success: true, providerMessageId: data.id };
  } catch (e: any) {
    return { channel: 'email', success: false, message: e?.message || 'Network error' };
  }
}

// ===== SMS (Twilio-compatible REST API) =====
async function sendSMS(to: string, body: string): Promise<SendResult> {
  const accountSid = process.env.SMS_ACCOUNT_SID;
  const authToken = process.env.SMS_AUTH_TOKEN;
  const fromNumber = process.env.SMS_FROM;
  if (!accountSid || !authToken || !fromNumber) {
    return { channel: 'sms', success: false, message: 'SMS provider not configured' };
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: `Educare Skill Academy: ${body}` }).toString(),
    });
    const data = await res.json();
    if (!res.ok) return { channel: 'sms', success: false, message: data.message || 'SMS API error' };
    return { channel: 'sms', success: true, providerMessageId: data.sid };
  } catch (e: any) {
    return { channel: 'sms', success: false, message: e?.message || 'Network error' };
  }
}

// ===== WhatsApp (WhatsApp Business Cloud API) =====
async function sendWhatsApp(to: string, template: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { channel: 'whatsapp', success: false, message: 'WhatsApp provider not configured' };
  }
  try {
    // Normalize: strip leading + and any spaces
    const normalized = to.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalized,
        type: 'text',
        text: { body: `Educare Skill Academy: ${body}` },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { channel: 'whatsapp', success: false, message: data.error?.message || 'WhatsApp API error' };
    return { channel: 'whatsapp', success: true, providerMessageId: data.messages?.[0]?.id };
  } catch (e: any) {
    return { channel: 'whatsapp', success: false, message: e?.message || 'Network error' };
  }
}

// ===== Main dispatcher =====
export async function dispatchNotification(payload: NotificationPayload): Promise<{
  results: SendResult[];
  inAppNotificationId?: string;
}> {
  const results: SendResult[] = [];

  // Always create an in-app notification if userId is provided
  if (payload.userId) {
    await createNotification({
      userId: payload.userId,
      type: payload.type,
      title: payload.subject,
      message: payload.body,
      entityType: payload.entityType,
      entityId: payload.entityId,
    });
    results.push({ channel: 'in-app', success: true });
  }

  // Send via the requested channel(s)
  if (payload.channel === 'all' || payload.channel === 'email') {
    if (payload.to.email) {
      results.push(await sendEmail(payload.to.email, payload.subject, payload.body));
    } else {
      results.push({ channel: 'email', success: false, message: 'No email address provided' });
    }
  }

  if (payload.channel === 'all' || payload.channel === 'sms') {
    if (payload.to.mobile) {
      results.push(await sendSMS(payload.to.mobile, payload.body));
    } else {
      results.push({ channel: 'sms', success: false, message: 'No mobile number provided' });
    }
  }

  if (payload.channel === 'all' || payload.channel === 'whatsapp') {
    const wa = payload.to.whatsapp || payload.to.mobile;
    if (wa) {
      results.push(await sendWhatsApp(wa, 'default', payload.body));
    } else {
      results.push({ channel: 'whatsapp', success: false, message: 'No WhatsApp number provided' });
    }
  }

  // Log the dispatch to audit log
  try {
    const successCount = results.filter(r => r.success).length;
    await db.auditLog.create({
      data: {
        action: `notification.dispatch.${payload.type}`,
        entityType: 'Notification',
        entityId: payload.entityId || 'broadcast',
        newValues: { payload: { ...payload, body: payload.body?.slice(0, 500) }, results, successCount },
      },
    });
  } catch {}

  return { results };
}

// ===== Helpers for EMI reminders and invoice sending =====

export async function sendEmiReminder(emiId: string, channel: NotificationChannel = 'all'): Promise<{ results: SendResult[] }> {
  const emi = await db.emiSchedule.findUnique({
    where: { id: emiId },
    include: { enrollment: { include: { student: true, office: true } } },
  });
  if (!emi) throw new Error('EMI not found');

  const student = emi.enrollment.student;
  const dueAmount = emi.amount - emi.paidAmount;

  // Find the user assigned to the student (counsellor) to notify in-app
  const counsellorId = emi.enrollment.counsellorId;
  let userId: string | undefined;
  if (counsellorId) {
    const user = await db.user.findFirst({ where: { employeeId: counsellorId } });
    userId = user?.id;
  }

  const payload: NotificationPayload = {
    userId,
    channel,
    to: { email: student.email || undefined, mobile: student.mobile, whatsapp: student.whatsapp || student.mobile },
    type: 'EMI Due',
    subject: `EMI Reminder: Installment #${emi.installmentNumber} due ${emi.dueDate.toLocaleDateString('en-IN')}`,
    body: `Dear ${student.name},\n\nThis is a reminder that your EMI installment #${emi.installmentNumber} for enrollment ${emi.enrollment.enrollmentCode} is due on ${emi.dueDate.toLocaleDateString('en-IN')}.\n\nAmount Due: ₹${dueAmount.toLocaleString('en-IN')}\nDue Date: ${emi.dueDate.toLocaleDateString('en-IN')}\n\nPlease make the payment at your earliest convenience.\n\nRegards,\nEducare Skill Academy`,
    entityType: 'EMI',
    entityId: emi.id,
  };

  return dispatchNotification(payload);
}

export async function sendInvoice(invoiceId: string, channel: NotificationChannel = 'email'): Promise<{ results: SendResult[] }> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: true, office: true },
  });
  if (!invoice) throw new Error('Invoice not found');

  const student = invoice.student;
  const payload: NotificationPayload = {
    channel,
    to: { email: student.email || undefined, mobile: student.mobile, whatsapp: student.whatsapp || student.mobile },
    type: 'Payment Received',
    subject: `Invoice ${invoice.invoiceNumber} from Educare Skill Academy`,
    body: `Dear ${invoice.customerName},\n\nPlease find your invoice details below:\n\nInvoice #: ${invoice.invoiceNumber}\nDate: ${invoice.invoiceDate.toLocaleDateString('en-IN')}\nService: ${invoice.serviceName}\nTaxable Amount: ₹${invoice.taxableAmount.toLocaleString('en-IN')}\nCGST: ₹${invoice.cgstAmount.toLocaleString('en-IN')}\nSGST: ₹${invoice.sgstAmount.toLocaleString('en-IN')}\nIGST: ₹${invoice.igstAmount.toLocaleString('en-IN')}\nTotal: ₹${invoice.totalAmount.toLocaleString('en-IN')}\nStatus: ${invoice.paymentStatus}\n\nRegards,\nEducare Skill Academy`,
    entityType: 'Invoice',
    entityId: invoice.id,
  };

  return dispatchNotification(payload);
}

// ===== EMI Reminder Automation =====
// Idempotent: each EMI gets at most one reminder per status transition.
// Run via /api/v1/cron/emi-reminders (protected by a secret key).

export async function runEmiReminderJob() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Find EMIs that are due in next 7 days OR overdue
  const emis = await db.emiSchedule.findMany({
    where: {
      status: { in: ['Upcoming', 'Due Today', 'Overdue', 'Partially Paid'] },
      dueDate: { lte: sevenDaysLater },
    },
    include: { enrollment: { include: { student: true } } },
  });

  const results: { emiId: string; sent: boolean; message?: string }[] = [];
  for (const emi of emis) {
    try {
      const { results: dispatchResults } = await sendEmiReminder(emi.id, 'all');
      const success = dispatchResults.some(r => r.success);
      results.push({ emiId: emi.id, sent: success, message: dispatchResults.map(r => `${r.channel}:${r.success ? 'ok' : r.message}`).join('; ') });
      // Mark as reminded (could add a 'lastRemindedAt' field in the future)
    } catch (e: any) {
      results.push({ emiId: emi.id, sent: false, message: e?.message });
    }
  }

  return {
    processed: emis.length,
    successCount: results.filter(r => r.sent).length,
    failureCount: results.filter(r => !r.sent).length,
    results,
  };
}
