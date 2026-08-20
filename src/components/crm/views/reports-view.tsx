'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { PageHeader, SectionCard, formatINR, formatDate } from '@/components/crm/layout';
import { StatusBadge } from '@/components/crm/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { LEAD_SOURCES, LEAD_TYPES } from '@/lib/constants';
import { BarChart3, Download, TrendingUp, Users, Wallet, Trophy, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsView({ user }: { user: any }) {
  const [reportType, setReportType] = useState('leads');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.options('offices').then(res => { if (res.success && res.data) setOffices(res.data); });
  }, []);

  const load = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (officeId) params.officeId = officeId;
    if (reportType === 'leads') params.dateField = 'createdAt';
    if (reportType === 'payments') params.dateField = 'paymentDate';
    if (reportType === 'enrollments') params.dateField = 'enrollmentDate';
    if (reportType === 'income') params.dateField = 'incomeDate';
    if (reportType === 'expenses') params.dateField = 'expenseDate';

    let entity = reportType;
    if (reportType === 'leads') entity = 'lead';
    if (reportType === 'enrollments') entity = 'enrollment';
    if (reportType === 'payments') entity = 'payment';
    if (reportType === 'placements') entity = 'placement';
    if (reportType === 'students') entity = 'student';
    if (reportType === 'income') entity = 'income';
    if (reportType === 'expenses') entity = 'expense';

    const res = await api.list(entity, { ...params, pageSize: 1000 });
    if (res.success && res.data) {
      setData(res.data);
      // Compute summary
      if (reportType === 'leads') {
        const bySource: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        res.data.forEach((l: any) => {
          bySource[l.source] = (bySource[l.source] || 0) + 1;
          byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        });
        const converted = res.data.filter((l: any) => l.status === 'Converted').length;
        setSummary({
          total: res.data.length, converted,
          conversionRate: res.data.length > 0 ? ((converted / res.data.length) * 100).toFixed(1) : '0',
          bySource, byStatus,
        });
      } else if (reportType === 'payments') {
        const total = res.data.reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const byMode: Record<string, number> = {};
        res.data.forEach((p: any) => { byMode[p.paymentMode] = (byMode[p.paymentMode] || 0) + (p.amount || 0); });
        setSummary({ total, byMode, count: res.data.length });
      } else if (reportType === 'enrollments') {
        const total = res.data.reduce((s: number, e: any) => s + (e.finalFee || 0), 0);
        const collected = res.data.reduce((s: number, e: any) => s + (e.paidAmount || 0), 0);
        const due = res.data.reduce((s: number, e: any) => s + (e.dueAmount || 0), 0);
        setSummary({ total, collected, due, count: res.data.length });
      } else if (reportType === 'income' || reportType === 'expenses') {
        const total = res.data.reduce((s: number, r: any) => s + (r.amount || 0), 0);
        const byCategory: Record<string, number> = {};
        res.data.forEach((r: any) => { byCategory[r.category] = (byCategory[r.category] || 0) + (r.amount || 0); });
        setSummary({ total, byCategory, count: res.data.length });
      } else if (reportType === 'placements') {
        const byStatus: Record<string, number> = {};
        res.data.forEach((p: any) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
        const completed = byStatus['Placement Completed'] || 0;
        setSummary({ total: res.data.length, completed, byStatus });
      } else {
        setSummary({ count: res.data.length });
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [reportType]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_') && typeof data[0][k] !== 'object');
    const rows = data.map(r => headers.map(h => {
      const v = r[h];
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'object' && v !== null) return JSON.stringify(v);
      return String(v ?? '').replace(/"/g, '""');
    }).map(c => `"${c}"`).join(','));
    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Filter, analyze, and export data" icon={<BarChart3 className="h-5 w-5" />} />

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto">
          <TabsTrigger value="leads"><Users className="h-3 w-3 mr-1" /> Leads</TabsTrigger>
          <TabsTrigger value="enrollments"><FileText className="h-3 w-3 mr-1" /> Enrollments</TabsTrigger>
          <TabsTrigger value="payments"><Wallet className="h-3 w-3 mr-1" /> Payments</TabsTrigger>
          <TabsTrigger value="placements"><Trophy className="h-3 w-3 mr-1" /> Placements</TabsTrigger>
          <TabsTrigger value="income"><TrendingUp className="h-3 w-3 mr-1" /> Income</TabsTrigger>
          <TabsTrigger value="expenses"><TrendingUp className="h-3 w-3 mr-1" /> Expenses</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-3 w-3 mr-1" /> Students</TabsTrigger>
        </TabsList>

        <div className="mt-4 mb-4 flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-[150px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-[150px]" />
          </div>
          {(user.roles.includes('Super Admin') || user.roles.includes('Admin')) && (
            <div className="space-y-1.5">
              <Label className="text-xs">Office</Label>
              <Select value={officeId || 'all'} onValueChange={v => setOfficeId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="All Offices" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Offices</SelectItem>{offices.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={load} disabled={loading}>Generate</Button>
          <Button variant="outline" onClick={exportCSV} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>

        <TabsContent value={reportType}>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {reportType === 'leads' && (
                  <>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Leads</div><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Converted</div><div className="text-2xl font-bold text-emerald-600">{summary.converted}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Conversion Rate</div><div className="text-2xl font-bold">{summary.conversionRate}%</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Lost/Not Interested</div><div className="text-2xl font-bold text-red-600">{(summary.byStatus['Lost'] || 0) + (summary.byStatus['Not Interested'] || 0)}</div></CardContent></Card>
                  </>
                )}
                {reportType === 'payments' && (
                  <>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Collection</div><div className="text-2xl font-bold text-emerald-600">{formatINR(summary.total)}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Transactions</div><div className="text-2xl font-bold">{summary.count}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Avg Transaction</div><div className="text-2xl font-bold">{formatINR(summary.count > 0 ? summary.total / summary.count : 0)}</div></CardContent></Card>
                  </>
                )}
                {reportType === 'enrollments' && (
                  <>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Enrollment Value</div><div className="text-2xl font-bold">{formatINR(summary.total)}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Collected</div><div className="text-2xl font-bold text-emerald-600">{formatINR(summary.collected)}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Outstanding</div><div className="text-2xl font-bold text-red-600">{formatINR(summary.due)}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Enrollments</div><div className="text-2xl font-bold">{summary.count}</div></CardContent></Card>
                  </>
                )}
                {reportType === 'placements' && (
                  <>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Placements</div><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Completed</div><div className="text-2xl font-bold text-emerald-600">{summary.completed}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Success Rate</div><div className="text-2xl font-bold">{summary.total > 0 ? ((summary.completed / summary.total) * 100).toFixed(1) : 0}%</div></CardContent></Card>
                  </>
                )}
                {(reportType === 'income' || reportType === 'expenses') && (
                  <>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total {reportType === 'income' ? 'Income' : 'Expense'}</div><div className={`text-2xl font-bold ${reportType === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(summary.total)}</div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Records</div><div className="text-2xl font-bold">{summary.count}</div></CardContent></Card>
                  </>
                )}
                {reportType === 'students' && (
                  <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Students</div><div className="text-2xl font-bold">{summary.count}</div></CardContent></Card>
                )}
              </div>

              {/* Charts */}
              {summary.bySource && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SectionCard title="Leads by Source">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={Object.entries(summary.bySource).map(([k, v]) => ({ name: k, value: v }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e: any) => `${e.name}: ${e.value}`}>
                          {Object.entries(summary.bySource).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Lead Status Breakdown">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(summary.byStatus).map(([k, v]) => ({ name: k, value: v }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
              )}

              {summary.byMode && (
                <SectionCard title="Payments by Mode">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(summary.byMode).map(([k, v]) => ({ name: k, value: v }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                      <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}

              {summary.byCategory && (
                <SectionCard title={`${reportType === 'income' ? 'Income' : 'Expense'} by Category`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(summary.byCategory).map(([k, v]) => ({ name: k, value: v }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                      <Bar dataKey="value" fill={reportType === 'income' ? '#10b981' : '#ef4444'} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}

              {summary.byStatus && reportType === 'placements' && (
                <SectionCard title="Placement Status Breakdown">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(summary.byStatus).map(([k, v]) => ({ name: k, value: v }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ec4899" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No data. Click Generate to run the report.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
