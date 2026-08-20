// GET /api/v1/dashboard?officeId=&dateFrom=&dateTo=
// Returns KPI cards + chart data + recent activity, all computed from real DB queries.

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, officeScope, applyOfficeScope } from '@/lib/auth-utils';
import { ok, serverError, unauthorized } from '@/lib/api';

async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const officeFilter = url.searchParams.get('officeId');
    const scope = officeScope(user);
    const officeId = officeFilter || scope || undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // ===== KPIs =====
    const [
      totalLeads, todayCalls, todayFollowups, todayEnrollments,
      todayCollection, todayDue, activeStudents, placementPending
    ] = await Promise.all([
      db.lead.count({ where: applyOfficeScope(user, officeId ? { officeId } : {}) }),
      db.call.count({ where: { callDate: { gte: today, lt: todayEnd }, lead: { officeId: officeId ? officeId : undefined } } }),
      db.followUp.count({ where: { dueDate: { gte: today, lt: todayEnd }, status: 'Pending' } }),
      db.enrollment.count({ where: { enrollmentDate: { gte: today, lt: todayEnd }, officeId: officeId ? officeId : undefined } }),
      db.payment.aggregate({ where: { paymentDate: { gte: today, lt: todayEnd }, status: 'Valid', officeId: officeId ? officeId : undefined }, _sum: { amount: true } }),
      db.enrollment.aggregate({ where: { dueAmount: { gt: 0 }, officeId: officeId ? officeId : undefined }, _sum: { dueAmount: true } }),
      db.student.count({ where: { status: 'Active', officeId: officeId ? officeId : undefined } }),
      db.placement.count({ where: { status: { notIn: ['Placement Completed', 'Rejected', 'Not Interested'] } } }),
    ]);

    // ===== Lead source breakdown =====
    const leadSourcesRaw = await db.lead.groupBy({
      by: ['source'],
      where: applyOfficeScope(user, officeId ? { officeId } : {}),
      _count: true,
    });
    const leadSources = leadSourcesRaw.map(s => ({ name: s.source, value: s._count }));

    // ===== Lead status funnel =====
    const leadStatusRaw = await db.lead.groupBy({
      by: ['status'],
      where: applyOfficeScope(user, officeId ? { officeId } : {}),
      _count: true,
    });
    const leadStatusFunnel = leadStatusRaw.map(s => ({ name: s.status, value: s._count }));

    // ===== Monthly revenue (last 6 months) =====
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const paymentsForRevenue = await db.payment.findMany({
      where: { paymentDate: { gte: sixMonthsAgo }, status: 'Valid', officeId: officeId ? officeId : undefined },
      select: { amount: true, paymentDate: true },
    });
    const monthMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const p of paymentsForRevenue) {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + p.amount);
    }
    const monthlyRevenue = Array.from(monthMap.entries())
      .map(([k, v]) => {
        const [y, m] = k.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return { name: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`, revenue: v };
      })
      .reverse();

    // ===== Monthly enrollments (last 6 months) =====
    const enrollmentsForChart = await db.enrollment.findMany({
      where: { enrollmentDate: { gte: sixMonthsAgo }, officeId: officeId ? officeId : undefined },
      select: { enrollmentDate: true },
    });
    const enrMonthMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      enrMonthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const e of enrollmentsForChart) {
      const key = `${e.enrollmentDate.getFullYear()}-${String(e.enrollmentDate.getMonth() + 1).padStart(2, '0')}`;
      enrMonthMap.set(key, (enrMonthMap.get(key) || 0) + 1);
    }
    const monthlyEnrollments = Array.from(enrMonthMap.entries())
      .map(([k, v]) => {
        const [y, m] = k.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return { name: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`, enrollments: v };
      })
      .reverse();

    // ===== Office performance =====
    const offices = await db.office.findMany({ include: { _count: { select: { leads: true, enrollments: true, payments: true, students: true } } } });
    const officePerformance = await Promise.all(offices.map(async (o) => {
      const collection = await db.payment.aggregate({ where: { officeId: o.id, status: 'Valid' }, _sum: { amount: true } });
      return { name: o.officeName, leads: o._count.leads, enrollments: o._count.enrollments, students: o._count.students, collection: collection._sum.amount || 0 };
    }));

    // ===== Placement funnel =====
    const placementStatusRaw = await db.placement.groupBy({ by: ['status'], _count: true });
    const placementFunnel = placementStatusRaw.map(s => ({ name: s.status, value: s._count }));

    // ===== Recent activity tables =====
    const [todayFollowupsList, recentEnrollments, recentPayments, overdueEmi, pendingPlacements, topEmployees] = await Promise.all([
      db.followUp.findMany({
        where: { dueDate: { gte: today, lt: todayEnd }, status: 'Pending' },
        include: { lead: { select: { studentName: true, leadCode: true } }, assignedTo: { select: { name: true } }, student: { select: { name: true, studentCode: true } } },
        take: 10, orderBy: { dueDate: 'asc' },
      }),
      db.enrollment.findMany({
        where: officeId ? { officeId } : {},
        include: { student: { select: { name: true, studentCode: true } }, course: { select: { courseName: true } } },
        take: 5, orderBy: { enrollmentDate: 'desc' },
      }),
      db.payment.findMany({
        where: officeId ? { officeId } : {},
        include: { student: { select: { name: true, studentCode: true } } },
        take: 5, orderBy: { paymentDate: 'desc' },
      }),
      db.emiSchedule.findMany({
        where: { status: 'Overdue', enrollment: { officeId: officeId ? officeId : undefined } },
        include: { enrollment: { include: { student: { select: { name: true, studentCode: true } } } } },
        take: 10, orderBy: { dueDate: 'asc' },
      }),
      db.placement.findMany({
        where: { status: { notIn: ['Placement Completed', 'Rejected', 'Not Interested'] } },
        include: { student: { select: { name: true, studentCode: true } }, company: { select: { companyName: true } } },
        take: 10, orderBy: { createdAt: 'desc' },
      }),
      db.employee.findMany({
        where: applyOfficeScope(user, {}),
        include: { _count: { select: { calls: true, enrollments: true, payments: true } } },
        take: 5,
      }),
    ]);
    // Calculate collection per top employee
    const topEmployeesWithCollection = await Promise.all(topEmployees.map(async (e) => {
      const collection = await db.payment.aggregate({ where: { receivedById: e.id, status: 'Valid' }, _sum: { amount: true } });
      return { name: e.name, calls: e._count.calls, enrollments: e._count.enrollments, collection: collection._sum.amount || 0 };
    }));

    // ===== Finance summary =====
    const [totalRevenue, totalExpense, totalOutstanding, totalCollection] = await Promise.all([
      db.income.aggregate({ where: officeId ? { officeId } : {}, _sum: { amount: true } }),
      db.expense.aggregate({ where: officeId ? { officeId } : {}, _sum: { amount: true } }),
      db.enrollment.aggregate({ where: { dueAmount: { gt: 0 }, officeId: officeId ? officeId : undefined }, _sum: { dueAmount: true } }),
      db.payment.aggregate({ where: { status: 'Valid', officeId: officeId ? officeId : undefined }, _sum: { amount: true } }),
    ]);

    return ok({
      kpis: {
        totalLeads,
        todayCalls,
        todayFollowups,
        todayEnrollments,
        todayCollection: todayCollection._sum.amount || 0,
        todayDue: todayDue._sum.dueAmount || 0,
        activeStudents,
        placementPending,
      },
      finance: {
        totalRevenue: totalRevenue._sum.amount || 0,
        totalExpense: totalExpense._sum.amount || 0,
        netProfit: (totalRevenue._sum.amount || 0) - (totalExpense._sum.amount || 0),
        totalOutstanding: totalOutstanding._sum.dueAmount || 0,
        totalCollection: totalCollection._sum.amount || 0,
      },
      charts: {
        leadSources,
        leadStatusFunnel,
        monthlyRevenue,
        monthlyEnrollments,
        officePerformance,
        placementFunnel,
      },
      tables: {
        todayFollowups: todayFollowupsList,
        recentEnrollments,
        recentPayments,
        overdueEmi,
        pendingPlacements,
        topEmployees: topEmployeesWithCollection,
      },
    });
  } catch (e: any) {
    console.error('Dashboard API error:', e);
    if (e?.message === 'Unauthorized') return unauthorized();
    return serverError(e?.message);
  }
}

export { GET };
