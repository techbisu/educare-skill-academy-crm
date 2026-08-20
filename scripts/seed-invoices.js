// Add a few invoices for demo purposes
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const students = await db.student.findMany({ take: 5 });
  const enrollments = await db.enrollment.findMany({ take: 5 });
  const settings = await db.setting.findMany({ where: { group: 'GST' } });
  const cgst = parseFloat(settings.find(s => s.key === 'gst.cgst_rate')?.value || '9');
  const sgst = parseFloat(settings.find(s => s.key === 'gst.sgst_rate')?.value || '9');

  let count = 0;
  for (let i = 0; i < Math.min(students.length, enrollments.length); i++) {
    const student = students[i];
    const enr = enrollments[i];
    const taxable = Math.round(enr.finalFee * 0.5);
    const cgstAmount = (taxable * cgst) / 100;
    const sgstAmount = (taxable * sgst) / 100;
    const total = taxable + cgstAmount + sgstAmount;
    const num = await db.counter.upsert({ where: { name: 'invoice' }, update: { value: { increment: 1 } }, create: { name: 'invoice', value: 1, prefix: 'EDU-INV-' } });
    const invoiceNumber = `EDU-INV-${String(num.value).padStart(6, '0')}`;
    await db.invoice.create({
      data: {
        invoiceNumber,
        studentId: student.id,
        enrollmentId: enr.id,
        customerName: student.name,
        serviceName: enr.course ? `Coaching - ${enr.course.courseName}` : 'Course Fee',
        taxableAmount: taxable,
        cgstRate: cgst, sgstRate: sgst, igstRate: 0,
        cgstAmount, sgstAmount, igstAmount: 0,
        totalAmount: total,
        paymentStatus: i % 3 === 0 ? 'Paid' : i % 3 === 1 ? 'Partial' : 'Unpaid',
        officeId: student.officeId,
      },
    });
    count++;
  }
  console.log(`Created ${count} invoices`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
