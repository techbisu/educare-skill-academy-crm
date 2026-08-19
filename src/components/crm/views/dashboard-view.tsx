'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { KpiCard } from '@/components/crm/kpi-card';
import { PageHeader, SectionCard, formatINR, formatDate, relativeTime } from '@/components/crm/layout';
import { StatusBadge } from '@/components/crm/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Phone, CalendarCheck, FileText, Wallet, AlertCircle, UserCheck, Trophy,
  TrendingUp, TrendingDown, DollarSign, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function DashboardView({ officeId }: { officeId?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officeFilter, setOfficeFilter] = useState(officeId || '');
  const [offices, setOffices] = useState<{ value: string; label: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await api.dashboard(officeFilter ? { officeId: officeFilter } : {});
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    api.options('offices').then(res => { if (res.success && res.data) setOffices(res.data); });
  }, []);

  useEffect(() => { load(); }, [officeFilter]);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Real-time KPIs from your database" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  const { kpis, finance, charts, tables } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time KPIs from your database"
        actions={
          <Select value={officeFilter || 'all'} onValueChange={v => setOfficeFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Offices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offices</SelectItem>
              {offices.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard title="Total Leads" value={kpis.totalLeads} icon={Users} color="info" />
        <KpiCard title="Today's Calls" value={kpis.todayCalls} icon={Phone} color="info" />
        <KpiCard title="Today's Follow-ups" value={kpis.todayFollowups} icon={CalendarCheck} color="warning" />
        <KpiCard title="Today's Enrollments" value={kpis.todayEnrollments} icon={FileText} color="success" />
        <KpiCard title="Today's Collection" value={formatINR(kpis.todayCollection)} icon={Wallet} color="success" />
        <KpiCard title="Total Outstanding" value={formatINR(kpis.todayDue)} icon={AlertCircle} color="danger" hint="Across all due enrollments" />
        <KpiCard title="Active Students" value={kpis.activeStudents} icon={UserCheck} color="success" />
        <KpiCard title="Placement Pending" value={kpis.placementPending} icon={Trophy} color="warning" />
      </div>

      {/* Finance summary */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(finance.totalRevenue)}</div>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Total Expense</div>
                <div className="text-xl font-bold text-red-700 mt-1">{formatINR(finance.totalExpense)}</div>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Net Profit</div>
                <div className="text-xl font-bold text-blue-700 mt-1">{formatINR(finance.netProfit)}</div>
              </div>
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Total Collection</div>
                <div className="text-xl font-bold text-amber-700 mt-1">{formatINR(finance.totalCollection)}</div>
              </div>
              <Wallet className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SectionCard title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.monthlyRevenue}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatINR(Number(v))} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Monthly Enrollments">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.monthlyEnrollments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="enrollments" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Lead Sources">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`}>
                {charts.leadSources.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Lead Status Funnel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.leadStatusFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Office performance */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SectionCard title="Office Performance">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.officePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar yAxisId="left" dataKey="enrollments" fill="#10b981" radius={[4, 4, 0, 0]} name="Enrollments" />
              <Bar yAxisId="right" dataKey="collection" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Collection ₹" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Placement Funnel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.placementFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="value" fill="#ec4899" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Recent activity tables */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SectionCard title="Today's Follow-ups">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.todayFollowups.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No follow-ups due today.</div> : tables.todayFollowups.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.lead?.studentName || f.student?.name}</div>
                  <div className="text-xs text-muted-foreground">Due: {formatDate(f.dueDate)} {f.dueTime || ''}</div>
                </div>
                <div className="text-xs text-muted-foreground">{f.assignedTo?.name}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Enrollments">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.recentEnrollments.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No recent enrollments.</div> : tables.recentEnrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.student?.name} <span className="text-xs text-muted-foreground">({e.student?.studentCode})</span></div>
                  <div className="text-xs text-muted-foreground">{e.course?.courseName}</div>
                </div>
                <StatusBadge status={e.paymentStatus} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Payments">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.recentPayments.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No recent payments.</div> : tables.recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.student?.name}</div>
                  <div className="text-xs text-muted-foreground">{p.receiptNo} · {formatDate(p.paymentDate)} · {p.paymentMode}</div>
                </div>
                <div className="text-sm font-bold text-emerald-700">{formatINR(p.amount)}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Overdue EMI">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.overdueEmi.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No overdue EMIs.</div> : tables.overdueEmi.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-red-50/40">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.enrollment?.student?.name}</div>
                  <div className="text-xs text-muted-foreground">Installment #{e.installmentNumber} · Due {formatDate(e.dueDate)}</div>
                </div>
                <StatusBadge status="Overdue" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Pending Placements">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.pendingPlacements.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No pending placements.</div> : tables.pendingPlacements.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.student?.name}</div>
                  <div className="text-xs text-muted-foreground">{p.company?.companyName || 'No company yet'}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Employees">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tables.topEmployees.length === 0 ? <div className="text-sm text-muted-foreground py-4 text-center">No employee data.</div> : tables.topEmployees.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.calls} calls · {e.enrollments} enrollments</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-700">{formatINR(e.collection)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
