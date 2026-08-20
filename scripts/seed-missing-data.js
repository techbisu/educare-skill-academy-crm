// Seed missing demo data: StudentDocument, IncentiveCalculation, more IncentiveRules
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sourav', 'Anjali', 'Rohit', 'Suman', 'Debasish', 'Sandip', 'Moumita'];
const LAST_NAMES = ['Das', 'Roy', 'Banerjee', 'Ghosh', 'Mondal', 'Chatterjee', 'Sarkar'];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log('Seeding Student Documents...');
  const students = await db.student.findMany({ take: 15 });
  const docTypes = ['Aadhaar', 'Photo', 'Signature', '10th Certificate', '12th Certificate', 'ITI Certificate', 'Diploma Certificate', 'B.Tech Documents', 'Resume', 'Offer Letter', 'Joining Letter', 'Payment Receipt'];
  const statuses = ['Uploaded', 'Uploaded', 'Uploaded', 'Verified', 'Pending'];
  let docCount = 0;
  for (const student of students) {
    // Each student gets 2-4 documents
    const numDocs = 2 + Math.floor(Math.random() * 3);
    const usedTypes = new Set();
    for (let i = 0; i < numDocs; i++) {
      let docType = pick(docTypes);
      while (usedTypes.has(docType)) docType = pick(docTypes);
      usedTypes.add(docType);
      await db.studentDocument.create({
        data: {
          studentId: student.id,
          documentType: docType,
          fileName: `${student.name.replace(/\s/g, '_')}_${docType.replace(/\s/g, '_')}.pdf`,
          fileUrl: `/uploads/${student.id}/${docType.toLowerCase().replace(/\s/g, '_')}.pdf`,
          fileSize: 100000 + Math.floor(Math.random() * 900000),
          mimeType: 'application/pdf',
          status: pick(statuses),
          uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        },
      });
      docCount++;
    }
  }
  console.log(`  ✓ Created ${docCount} student documents`);

  console.log('Seeding more Incentive Rules...');
  const existingRules = await db.incentiveRule.count();
  if (existingRules < 5) {
    await db.incentiveRule.create({
      data: {
        name: 'Fixed ₹500 per Placement',
        basis: 'Other',
        ruleType: 'fixed',
        fixedAmount: 500,
        serviceType: 'Placement',
        status: 'Active',
      },
    });
    await db.incentiveRule.create({
      data: {
        name: 'Admission Consultancy 2%',
        basis: 'Enrollment Value',
        ruleType: 'percentage',
        percentage: 2,
        serviceType: 'College Admission',
        status: 'Active',
      },
    });
    await db.incentiveRule.create({
      data: {
        name: 'Internship Revenue Slab',
        basis: 'Collected Payment',
        ruleType: 'slab',
        slabConfig: JSON.stringify([
          { min: 0, max: 10000, rate: 0.5 },
          { min: 10001, max: 25000, rate: 1 },
          { min: 25001, max: null, rate: 1.5 },
        ]),
        serviceType: 'Internship',
        status: 'Active',
      },
    });
    console.log('  ✓ Created 3 additional incentive rules');
  }

  console.log('Seeding Incentive Calculations...');
  const employees = await db.employee.findMany({ where: { designation: { in: ['Counsellor', 'Senior Counsellor', 'Accountant', 'Placement Executive'] } } });
  const rules = await db.incentiveRule.findMany();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let calcCount = 0;
  for (const emp of employees) {
    // Current month calculation
    const basisAmount = 30000 + Math.floor(Math.random() * 70000);
    const rule = pick(rules);
    let incentive = 0;
    if (rule.ruleType === 'percentage') incentive = Math.round(basisAmount * (rule.percentage / 100));
    else if (rule.ruleType === 'fixed') incentive = rule.fixedAmount || 0;
    else if (rule.ruleType === 'slab') {
      try {
        const slabs = JSON.parse(rule.slabConfig);
        for (const s of slabs) {
          if (basisAmount >= s.min && (!s.max || basisAmount <= s.max)) {
            incentive = Math.round(basisAmount * (s.rate / 100));
            break;
          }
        }
      } catch {}
    }
    await db.incentiveCalculation.create({
      data: {
        employeeId: emp.id,
        periodStart: monthStart,
        periodEnd: monthEnd,
        basisAmount,
        incentiveAmount: incentive,
        ruleId: rule.id,
        details: JSON.stringify({ employee: emp.name, designation: emp.designation, rule: rule.name }),
      },
    });
    // Previous month calculation
    const prevBasis = 25000 + Math.floor(Math.random() * 60000);
    const prevRule = pick(rules);
    let prevIncentive = 0;
    if (prevRule.ruleType === 'percentage') prevIncentive = Math.round(prevBasis * (prevRule.percentage / 100));
    else if (prevRule.ruleType === 'fixed') prevIncentive = prevRule.fixedAmount || 0;
    else if (prevRule.ruleType === 'slab') {
      try {
        const slabs = JSON.parse(prevRule.slabConfig);
        for (const s of slabs) {
          if (prevBasis >= s.min && (!s.max || prevBasis <= s.max)) {
            prevIncentive = Math.round(prevBasis * (s.rate / 100));
            break;
          }
        }
      } catch {}
    }
    await db.incentiveCalculation.create({
      data: {
        employeeId: emp.id,
        periodStart: prevMonthStart,
        periodEnd: prevMonthEnd,
        basisAmount: prevBasis,
        incentiveAmount: prevIncentive,
        ruleId: prevRule.id,
        details: JSON.stringify({ employee: emp.name, designation: emp.designation, rule: prevRule.name, period: 'previous' }),
      },
    });
    calcCount += 2;
  }
  console.log(`  ✓ Created ${calcCount} incentive calculations`);

  // Final audit
  const finalCounts = {
    studentDocument: await db.studentDocument.count(),
    incentiveRule: await db.incentiveRule.count(),
    incentiveCalculation: await db.incentiveCalculation.count(),
  };
  console.log('\nFinal counts:');
  console.log(JSON.stringify(finalCounts, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
