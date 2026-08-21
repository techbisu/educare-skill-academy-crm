'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { DataTable, useTableState, type Column } from '@/components/crm/data-table';
import { PageHeader, formatINR, formatDate } from '@/components/crm/layout';
import { StatusBadge } from '@/components/crm/status-badge';
import { FormModal } from '@/components/crm/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LucideIcon, Bell, Loader2, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  COURSE_CATEGORIES, BATCH_MODES, BATCH_STATUSES, PAYMENT_MODES, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  JOB_OPENING_STATUSES, JOB_LOCATIONS, ENROLLMENT_STATUSES, OFFICE_TYPES,
} from '@/lib/constants';

// Generic configurable list view, used for simpler entities.
export function GenericListView({
  entity, title, description, icon: Icon, columns, createFields, filterFields, defaultSort = 'createdAt',
  allowCreate = true, actions,
}: {
  entity: string;
  title: string;
  description: string;
  icon: LucideIcon;
  columns: Column<any>[];
  createFields?: { key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'textarea'; required?: boolean; options?: { value: string; label: string }[]; colSpan?: 1 | 2 }[];
  filterFields?: { key: string; label: string; options: { value: string; label: string }[] }[];
  defaultSort?: string;
  allowCreate?: boolean;
  actions?: React.ReactNode;
}) {
  const table = useTableState({ pageSize: 20, sortBy: defaultSort, sortDir: 'desc' });
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params: Record<string, any> = {
      page: table.page, pageSize: table.pageSize, search: table.search,
      sortBy: table.sortBy, sortDir: table.sortDir,
    };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const res = await api.list(entity, params);
    if (res.success) {
      setData(res.data);
      if (res.meta) setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
    } else {
      setData([]);
      setMeta({ total: 0, totalPages: 0 });
      setError(res.message || 'Failed to load data');
    }
  }, [entity, table.page, table.pageSize, table.search, table.sortBy, table.sortDir, filters]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const res = await api.create(entity, form);
    if (res.success) { toast.success(`${entity} created`); setCreateOpen(false); setForm({}); load(); }
    else toast.error(res.message || 'Failed');
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={<Icon className="h-5 w-5" />}
        actions={<>
          {actions}
          {allowCreate && createFields && <Button size="sm" onClick={() => setCreateOpen(true)}>New</Button>}
        </>}
      />
      {error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 mb-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-amber-900">Permission Required</div>
              <div className="text-sm text-amber-700 mt-1">{error}</div>
              <div className="text-xs text-amber-600 mt-2">
                You don't have permission to access this module. Contact your administrator if you believe this is an error.
              </div>
            </div>
          </div>
        </div>
      )}
      <DataTable
        data={data}
        columns={columns}
        loading={!data.length && table.page === 1}
        search={{ value: table.search, onChange: v => { table.setSearch(v); table.reset(); }, placeholder: 'Search...' }}
        sortBy={table.sortBy} sortDir={table.sortDir} onSortChange={(s, d) => { table.setSortBy(s); table.setSortDir(d); table.reset(); }}
        filters={filterFields && filterFields.length > 0 ? (
          <div className="flex items-center gap-2">
            {filterFields.map(f => (
              <Select key={f.key} value={filters[f.key] || 'all'} onValueChange={v => { setFilters({ ...filters, [f.key]: v === 'all' ? '' : v }); table.reset(); }}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder={f.label} /></SelectTrigger>
                <SelectContent><SelectItem value="all">All {f.label}</SelectItem>{f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            ))}
          </div>
        ) : undefined}
        pagination={{
          page: table.page, pageSize: table.pageSize, total: meta.total, totalPages: meta.totalPages,
          onPageChange: table.setPage, onPageSizeChange: n => { table.setPageSize(n); table.reset(); },
        }}
        emptyMessage="No records found."
      />

      {createOpen && createFields && (
        <FormModal open={createOpen} onOpenChange={setCreateOpen} title={`Create ${title}`} size="md" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-3">
            {createFields.map(f => (
              <div key={f.key} className={`space-y-1.5 ${f.colSpan === 2 ? 'col-span-2' : ''}`}>
                <Label>{f.label}{f.required ? ' *' : ''}</Label>
                {f.type === 'select' && f.options ? (
                  <Select value={form[f.key] || ''} onValueChange={v => setForm({ ...form, [f.key]: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : f.type === 'textarea' ? (
                  <Textarea value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                ) : (
                  <Input type={f.type} value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} />
                )}
              </div>
            ))}
          </div>
        </FormModal>
      )}
    </div>
  );
}

// === Pre-configured views ===

export function CoursesView() {
  return (
    <GenericListView
      entity="course"
      title="Course Management"
      description="Manage course catalog with fees, durations, and semesters"
      icon={require('lucide-react').BookOpen}
      defaultSort="createdAt"
      columns={[
        { key: 'courseCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.courseCode}</span> },
        { key: 'courseName', header: 'Course Name', cell: r => (
          <div><div className="font-medium text-sm">{r.courseName}</div><div className="text-xs text-muted-foreground">{r.duration}</div></div>
        ) },
        { key: 'category', header: 'Category', cell: r => <StatusBadge status={r.category} /> },
        { key: 'fee', header: 'Fee', cell: r => <span className="text-sm font-semibold">{formatINR(r.fee)}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
        { key: '_count', header: 'Enrollments', cell: r => <span className="text-xs">{r._count?.enrollments || 0} enrollments, {r._count?.batches || 0} batches</span> },
      ]}
      createFields={[
        { key: 'courseCode', label: 'Course Code', type: 'text', required: true },
        { key: 'courseName', label: 'Course Name', type: 'text', required: true, colSpan: 2 },
        { key: 'category', label: 'Category', type: 'select', options: COURSE_CATEGORIES.map(c => ({ value: c, label: c })) },
        { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 6 months' },
        { key: 'fee', label: 'Fee (₹)', type: 'number' },
        { key: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
      ]}
      filterFields={[
        { key: 'category', label: 'Categories', options: COURSE_CATEGORIES.map(c => ({ value: c, label: c })) },
        { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
      ]}
    />
  );
}

export function BatchesView() {
  return (
    <GenericListView
      entity="batch"
      title="Batch Management"
      description="Manage batches, trainers, and capacity"
      icon={require('lucide-react').Layers}
      defaultSort="startDate"
      columns={[
        { key: 'batchCode', header: 'Batch Code', cell: r => <span className="font-mono text-xs">{r.batchCode}</span> },
        { key: 'course', header: 'Course', cell: r => <span className="text-sm">{r.course?.courseName}</span> },
        { key: 'trainer', header: 'Trainer', cell: r => <span className="text-xs">{r.trainer?.name || '—'}</span> },
        { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
        { key: 'mode', header: 'Mode', cell: r => <StatusBadge status={r.mode} /> },
        { key: 'startDate', header: 'Start', cell: r => <span className="text-xs">{formatDate(r.startDate)}</span> },
        { key: '_count', header: 'Students', cell: r => <span className="text-xs">{r._count?.students || 0} / {r.maximumStudents}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: BATCH_STATUSES.map(s => ({ value: s, label: s })) },
        { key: 'mode', label: 'Mode', options: BATCH_MODES.map(m => ({ value: m, label: m })) },
      ]}
    />
  );
}

export function PaymentsView() {
  return (
    <GenericListView
      entity="payment"
      title="Payments"
      description="Every payment is auditable — soft-deletes only (no hard delete)"
      icon={require('lucide-react').Wallet}
      defaultSort="paymentDate"
      columns={[
        { key: 'receiptNo', header: 'Receipt #', cell: r => <span className="font-mono text-xs">{r.receiptNo}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="text-sm">{r.student?.name}</span> },
        { key: 'amount', header: 'Amount', cell: r => <span className="font-semibold">{formatINR(r.amount)}</span> },
        { key: 'paymentMode', header: 'Mode', cell: r => <StatusBadge status={r.paymentMode} /> },
        { key: 'referenceNo', header: 'Ref #', cell: r => <span className="text-xs font-mono">{r.referenceNo || '—'}</span> },
        { key: 'paymentDate', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.paymentDate)}</span> },
        { key: 'receivedBy', header: 'Received By', cell: r => <span className="text-xs">{r.receivedBy?.name || '—'}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'paymentMode', label: 'Modes', options: PAYMENT_MODES.map(m => ({ value: m, label: m })) },
        { key: 'status', label: 'Status', options: [{ value: 'Valid', label: 'Valid' }, { value: 'Reversed', label: 'Reversed' }, { value: 'Refunded', label: 'Refunded' }] },
      ]}
      allowCreate={false}
    />
  );
}

export function EmiView() {
  const [sending, setSending] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const sendReminder = async (emiId: string) => {
    setSending(emiId);
    try {
      const res = await api.action('emi.send-reminder', { emiId, channel: 'all' });
      if (res.success) {
        toast.success(res.message || 'Reminder sent');
      } else {
        toast.error(res.message || 'Failed to send reminder');
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <GenericListView
      key={reloadKey}
      entity="emi"
      title="EMI Schedule"
      description="EMI installments with auto-overdue detection — click Send Reminder to notify student"
      icon={require('lucide-react').CreditCard}
      defaultSort="dueDate"
      columns={[
        { key: 'installmentNumber', header: 'Installment', cell: r => <span className="text-sm">#{r.installmentNumber}</span> },
        { key: 'enrollment', header: 'Enrollment', cell: r => <span className="text-xs">{r.enrollment?.student?.name}</span> },
        { key: 'amount', header: 'Amount', cell: r => <span className="text-sm">{formatINR(r.amount)}</span> },
        { key: 'paidAmount', header: 'Paid', cell: r => <span className="text-sm text-emerald-700">{formatINR(r.paidAmount)}</span> },
        { key: 'dueDate', header: 'Due Date', cell: r => <span className="text-xs">{formatDate(r.dueDate)}</span> },
        { key: 'paidDate', header: 'Paid Date', cell: r => <span className="text-xs">{formatDate(r.paidDate)}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
        { key: '_actions', header: 'Actions', cell: r => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={sending === r.id || r.status === 'Paid' || r.status === 'Cancelled'}
            onClick={(e) => { e.stopPropagation(); sendReminder(r.id); }}
          >
            {sending === r.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Bell className="h-3 w-3 mr-1" />}
            <span className="hidden sm:inline">Send Reminder</span>
            <span className="sm:hidden">Remind</span>
          </Button>
        ) },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Upcoming','Due Today','Paid','Overdue','Partially Paid','Cancelled'].map(s => ({ value: s, label: s })) },
      ]}
      allowCreate={false}
    />
  );
}

export function CompaniesView() {
  return (
    <GenericListView
      entity="company"
      title="Companies"
      description="Hiring partner companies"
      icon={require('lucide-react').Building2}
      defaultSort="createdAt"
      columns={[
        { key: 'companyName', header: 'Company', cell: r => <span className="font-medium text-sm">{r.companyName}</span> },
        { key: 'industry', header: 'Industry', cell: r => <StatusBadge status={r.industry || 'Other'} /> },
        { key: 'location', header: 'Location', cell: r => <span className="text-xs">{r.location}</span> },
        { key: 'hrName', header: 'HR Contact', cell: r => <div className="text-xs"><div>{r.hrName}</div><div className="text-muted-foreground">{r.hrMobile}</div></div> },
        { key: '_count', header: 'Jobs', cell: r => <span className="text-xs">{r._count?.jobOpenings || 0} jobs, {r._count?.jobApplications || 0} applications</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      createFields={[
        { key: 'companyName', label: 'Company Name', type: 'text', required: true, colSpan: 2 },
        { key: 'industry', label: 'Industry', type: 'text' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'hrName', label: 'HR Name', type: 'text' },
        { key: 'hrMobile', label: 'HR Mobile', type: 'text' },
        { key: 'hrEmail', label: 'HR Email', type: 'text' },
        { key: 'website', label: 'Website', type: 'text' },
        { key: 'salaryRange', label: 'Salary Range', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
      ]}
    />
  );
}

export function JobOpeningsView() {
  return (
    <GenericListView
      entity="jobOpening"
      title="Job Openings"
      description="Active job postings from partner companies"
      icon={require('lucide-react').Briefcase}
      defaultSort="createdAt"
      columns={[
        { key: 'jobCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.jobCode}</span> },
        { key: 'jobTitle', header: 'Title', cell: r => <span className="font-medium text-sm">{r.jobTitle}</span> },
        { key: 'company', header: 'Company', cell: r => <span className="text-xs">{r.company?.companyName}</span> },
        { key: 'location', header: 'Location', cell: r => <span className="text-xs">{r.location}</span> },
        { key: 'salaryMin', header: 'Salary Range', cell: r => <span className="text-xs">{formatINR(r.salaryMin)} - {formatINR(r.salaryMax)}</span> },
        { key: 'vacancy', header: 'Vacancy', cell: r => <span className="text-xs">{r.vacancy}</span> },
        { key: '_count', header: 'Applications', cell: r => <span className="text-xs">{r._count?.applications || 0}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: JOB_OPENING_STATUSES.map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function JobApplicationsView() {
  return (
    <GenericListView
      entity="jobApplication"
      title="Job Applications"
      description="Track student job applications from Eligible through Joined"
      icon={require('lucide-react').FileBadge}
      defaultSort="appliedDate"
      columns={[
        { key: 'applicationCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.applicationCode}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="font-medium text-sm">{r.student?.name}</span> },
        { key: 'company', header: 'Company', cell: r => <span className="text-xs">{r.company?.companyName}</span> },
        { key: 'job', header: 'Job', cell: r => <span className="text-xs">{r.job?.jobTitle}</span> },
        { key: 'appliedDate', header: 'Applied', cell: r => <span className="text-xs">{formatDate(r.appliedDate)}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Eligible','Job Shared','Applied','Interview Scheduled','Interview Attended','Selected','Offer Received','Joining Pending','Joined','Rejected','Not Interested'].map(s => ({ value: s, label: s })) },
      ]}
      allowCreate={false}
    />
  );
}

export function PlacementsView() {
  return (
    <GenericListView
      entity="placement"
      title="Placement Management"
      description="Track complete placement pipeline including verification"
      icon={require('lucide-react').Trophy}
      defaultSort="createdAt"
      columns={[
        { key: 'placementCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.placementCode}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="font-medium text-sm">{r.student?.name}</span> },
        { key: 'company', header: 'Company', cell: r => <span className="text-xs">{r.company?.companyName || '—'}</span> },
        { key: 'designation', header: 'Designation', cell: r => <span className="text-xs">{r.designation || '—'}</span> },
        { key: 'salary', header: 'Salary', cell: r => <span className="text-sm font-semibold">{r.salary ? formatINR(r.salary) : '—'}</span> },
        { key: 'joiningDate', header: 'Joining', cell: r => <span className="text-xs">{formatDate(r.joiningDate)}</span> },
        { key: 'placementExecutive', header: 'Executive', cell: r => <span className="text-xs">{r.placementExecutive?.name || '—'}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Placement Pending','Eligible','Job Shared','Applied','Interview Scheduled','Interview Attended','Selected','Offer Letter','Joining Pending','Joined','Placement Completed','Rejected','Not Interested'].map(s => ({ value: s, label: s })) },
      ]}
      allowCreate={false}
    />
  );
}

export function CollegeApplicationsView() {
  return (
    <GenericListView
      entity="collegeApplication"
      title="College Admissions"
      description="Track college admission applications and semester payments"
      icon={require('lucide-react').Building2}
      defaultSort="applicationDate"
      columns={[
        { key: 'applicationCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.applicationCode}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="font-medium text-sm">{r.student?.name}</span> },
        { key: 'college', header: 'College', cell: r => <span className="text-xs">{r.college?.collegeName}</span> },
        { key: 'branch', header: 'Branch', cell: r => <span className="text-xs">{r.branch || '—'}</span> },
        { key: 'admissionYear', header: 'Year', cell: r => <span className="text-xs">{r.admissionYear}</span> },
        { key: 'applicationFee', header: 'App Fee', cell: r => <span className="text-xs">{formatINR(r.applicationFee)}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Interested','Application Started','Documents Pending','Application Submitted','Under Review','Selected','Admission Confirmed','Cancelled','Rejected','Completed'].map(s => ({ value: s, label: s })) },
      ]}
      allowCreate={false}
    />
  );
}

export function IncomeView() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.dashboard().then(res => {
      if (res.success && res.data?.finance) setSummary(res.data.finance);
    });
  }, []);

  return (
    <div>
      {summary && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <FinanceCard label="Total Revenue" value={summary.totalRevenue} color="emerald" />
          <FinanceCard label="Total Collection" value={summary.totalCollection} color="blue" />
          <FinanceCard label="Total Expense" value={summary.totalExpense} color="red" />
          <FinanceCard label="Net Profit" value={summary.netProfit} color="amber" />
        </div>
      )}
      <GenericListView
        entity="income"
        title="Income Records"
        description="Auto-generated when payments are received — also supports manual income entry"
        icon={require('lucide-react').Coins}
        defaultSort="incomeDate"
        columns={[
          { key: 'incomeCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.incomeCode}</span> },
          { key: 'category', header: 'Category', cell: r => <StatusBadge status={r.category} /> },
          { key: 'amount', header: 'Amount', cell: r => <span className="font-semibold text-emerald-700">{formatINR(r.amount)}</span> },
          { key: 'incomeDate', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.incomeDate)}</span> },
          { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
          { key: 'source', header: 'Source', cell: r => <span className="text-xs">{r.source || '—'}</span> },
          { key: 'reference', header: 'Reference', cell: r => <span className="text-xs font-mono">{r.reference || '—'}</span> },
        ]}
        createFields={[
          { key: 'category', label: 'Category', type: 'select', options: INCOME_CATEGORIES.map(c => ({ value: c, label: c })), colSpan: 2 },
          { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { key: 'incomeDate', label: 'Date', type: 'date' },
          { key: 'reference', label: 'Reference', type: 'text' },
          { key: 'source', label: 'Source', type: 'text' },
          { key: 'remarks', label: 'Remarks', type: 'textarea', colSpan: 2 },
        ]}
        filterFields={[
          { key: 'category', label: 'Categories', options: INCOME_CATEGORIES.map(c => ({ value: c, label: c })) },
        ]}
      />
    </div>
  );
}

export function ExpensesView() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.dashboard().then(res => {
      if (res.success && res.data?.finance) setSummary(res.data.finance);
    });
  }, []);

  return (
    <div>
      {summary && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <FinanceCard label="Total Expense" value={summary.totalExpense} color="red" />
          <FinanceCard label="Total Revenue" value={summary.totalRevenue} color="emerald" />
          <FinanceCard label="Net Profit" value={summary.netProfit} color="amber" />
          <FinanceCard label="Outstanding" value={summary.totalOutstanding} color="orange" />
        </div>
      )}
      <GenericListView
        entity="expense"
        title="Expense Records"
        description="Track all expenses by category and office — manual entry supported"
        icon={require('lucide-react').ReceiptIndianRupee}
        defaultSort="expenseDate"
        columns={[
          { key: 'expenseCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.expenseCode}</span> },
          { key: 'category', header: 'Category', cell: r => <StatusBadge status={r.category} /> },
          { key: 'amount', header: 'Amount', cell: r => <span className="font-semibold text-red-700">{formatINR(r.amount)}</span> },
          { key: 'expenseDate', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.expenseDate)}</span> },
          { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
          { key: 'vendor', header: 'Vendor', cell: r => <span className="text-xs">{r.vendor || '—'}</span> },
        ]}
        createFields={[
          { key: 'category', label: 'Category', type: 'select', options: EXPENSE_CATEGORIES.map(c => ({ value: c, label: c })), colSpan: 2 },
          { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { key: 'expenseDate', label: 'Date', type: 'date' },
          { key: 'vendor', label: 'Vendor', type: 'text' },
          { key: 'reference', label: 'Reference', type: 'text' },
          { key: 'remarks', label: 'Remarks', type: 'textarea', colSpan: 2 },
        ]}
        filterFields={[
          { key: 'category', label: 'Categories', options: EXPENSE_CATEGORIES.map(c => ({ value: c, label: c })) },
        ]}
      />
    </div>
  );
}

// Finance summary card component
function FinanceCard({ label, value, color }: { label: string; value: number; color: 'emerald' | 'red' | 'amber' | 'blue' | 'orange' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="text-xs uppercase tracking-wide font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{formatINR(value)}</div>
    </div>
  );
}

export function OfficesView() {
  return (
    <GenericListView
      entity="office"
      title="Offices"
      description="Multi-office support — Bardhaman, Magra, and unlimited future offices"
      icon={require('lucide-react').Building2}
      defaultSort="createdAt"
      columns={[
        { key: 'officeCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.officeCode}</span> },
        { key: 'officeName', header: 'Office', cell: r => <span className="font-medium text-sm">{r.officeName}</span> },
        { key: 'officeType', header: 'Type', cell: r => <StatusBadge status={r.officeType} /> },
        { key: 'district', header: 'District', cell: r => <span className="text-xs">{r.district}</span> },
        { key: 'phone', header: 'Phone', cell: r => <span className="text-xs">{r.phone}</span> },
        { key: '_count', header: 'Stats', cell: r => <span className="text-xs">{r._count?.employees || 0} emp · {r._count?.students || 0} stu</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      createFields={[
        { key: 'officeCode', label: 'Office Code', type: 'text', required: true },
        { key: 'officeName', label: 'Office Name', type: 'text', required: true, colSpan: 2 },
        { key: 'officeType', label: 'Office Type', type: 'select', options: OFFICE_TYPES.map(t => ({ value: t, label: t })) },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'district', label: 'District', type: 'text' },
        { key: 'state', label: 'State', type: 'text' },
        { key: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
      ]}
    />
  );
}

export function EmployeesView() {
  return (
    <GenericListView
      entity="employee"
      title="Employees"
      description="Manage employees across offices with designations"
      icon={require('lucide-react').Users}
      defaultSort="createdAt"
      columns={[
        { key: 'employeeCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.employeeCode}</span> },
        { key: 'name', header: 'Name', cell: r => <span className="font-medium text-sm">{r.name}</span> },
        { key: 'designation', header: 'Designation', cell: r => <StatusBadge status={r.designation || 'Employee'} /> },
        { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
        { key: 'mobile', header: 'Mobile', cell: r => <span className="text-xs">{r.mobile}</span> },
        { key: 'joiningDate', header: 'Joined', cell: r => <span className="text-xs">{formatDate(r.joiningDate)}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Suspended', label: 'Suspended' }] },
      ]}
    />
  );
}

export function AuditLogsView() {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Helper: format old/new values for display
  const formatChanges = (oldValues?: string, newValues?: string) => {
    try {
      const oldV = oldValues ? JSON.parse(oldValues) : null;
      const newV = newValues ? JSON.parse(newValues) : null;
      const changes: { field: string; from: any; to: any }[] = [];
      const allKeys = new Set([...Object.keys(oldV || {}), ...Object.keys(newV || {})]);
      for (const k of Array.from(allKeys)) {
        if (['id', 'createdAt', 'updatedAt', 'passwordHash'].includes(k)) continue;
        const o = oldV?.[k];
        const n = newV?.[k];
        if (JSON.stringify(o) !== JSON.stringify(n)) {
          changes.push({ field: k, from: o, to: n });
        }
      }
      return changes;
    } catch {
      return [];
    }
  };

  return (
    <>
      <GenericListView
        entity="auditLog"
        title="Audit Logs"
        description="Immutable record of all sensitive actions — click a row to see full details including who completed/converted each item"
        icon={require('lucide-react').ScrollText}
        defaultSort="createdAt"
        allowCreate={false}
        columns={[
          { key: 'createdAt', header: 'Timestamp', cell: r => <span className="text-xs font-mono">{new Date(r.createdAt).toLocaleString('en-IN')}</span> },
          { key: 'action', header: 'Action', cell: r => {
            const isConversion = r.action === 'lead.convert' || (r.action === 'lead.update_status' && r.newValues && JSON.parse(r.newValues)?.status === 'Converted');
            const isCompletion = r.action === 'placement.complete';
            return (
              <span className="text-xs font-medium flex items-center gap-1">
                {r.action}
                {isConversion && <StatusBadge status="Converted" />}
                {isCompletion && <StatusBadge status="Placement Completed" />}
              </span>
            );
          } },
          { key: 'entityType', header: 'Entity', cell: r => <span className="text-xs">{r.entityType}:{r.entityId.slice(-6)}</span> },
          { key: 'actionUser', header: 'Performed By', cell: r => (
            <div className="min-w-0">
              <div className="text-xs font-medium">{r.actionUser?.name || 'System'}</div>
              {r.actionUser?.email && <div className="text-[10px] text-muted-foreground truncate">{r.actionUser.email}</div>}
            </div>
          ) },
          { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName || '—'}</span> },
          { key: '_changes', header: 'Changes', cell: r => {
            const changes = formatChanges(r.oldValues, r.newValues);
            if (changes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
            return (
              <span className="text-xs text-muted-foreground">{changes.length} field{changes.length > 1 ? 's' : ''} changed</span>
            );
          } },
        ]}
        actions={undefined}
      />
      {/* Click-to-view detail */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedLog(null)} />
          <div className="w-full max-w-2xl bg-card shadow-xl overflow-y-auto max-h-screen">
            <div className="sticky top-0 bg-card border-b px-4 py-3 z-10 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{selectedLog.action}</div>
                <div className="text-xs text-muted-foreground font-mono">{selectedLog.entityType}:{selectedLog.entityId}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs uppercase text-muted-foreground">Performed by</span><div className="font-medium">{selectedLog.actionUser?.name || 'System'}</div></div>
                <div><span className="text-xs uppercase text-muted-foreground">Timestamp</span><div>{new Date(selectedLog.createdAt).toLocaleString('en-IN')}</div></div>
                <div><span className="text-xs uppercase text-muted-foreground">Office</span><div>{selectedLog.office?.officeName || '—'}</div></div>
                <div><span className="text-xs uppercase text-muted-foreground">IP Address</span><div className="font-mono text-xs">{selectedLog.ipAddress || '—'}</div></div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Field Changes</div>
                <div className="space-y-2">
                  {formatChanges(selectedLog.oldValues, selectedLog.newValues).map((c, i) => (
                    <div key={i} className="p-2 rounded-md bg-muted/30 text-xs">
                      <div className="font-medium mb-1">{c.field}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">From:</span> <span className="font-mono break-all">{c.from == null ? '∅' : typeof c.from === 'object' ? '…' : String(c.from)}</span></div>
                        <div><span className="text-muted-foreground">To:</span> <span className="font-mono break-all text-emerald-700">{c.to == null ? '∅' : typeof c.to === 'object' ? '…' : String(c.to)}</span></div>
                      </div>
                    </div>
                  ))}
                  {formatChanges(selectedLog.oldValues, selectedLog.newValues).length === 0 && (
                    <div className="text-xs text-muted-foreground">No field-level changes recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function InvoicesView() {
  const [sending, setSending] = useState<string | null>(null);
  const sendInvoice = async (invoiceId: string) => {
    setSending(invoiceId);
    try {
      const res = await api.action('invoice.send', { invoiceId, channel: 'all' });
      if (res.success) toast.success(res.message || 'Invoice sent');
      else toast.error(res.message || 'Failed to send');
    } finally {
      setSending(null);
    }
  };
  return (
    <GenericListView
      entity="invoice"
      title="Invoices"
      description="GST-compliant invoices with configurable tax rates — click Send to email/SMS/WhatsApp"
      icon={require('lucide-react').FileSignature}
      defaultSort="invoiceDate"
      allowCreate={false}
      columns={[
        { key: 'invoiceNumber', header: 'Invoice #', cell: r => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
        { key: 'customerName', header: 'Customer', cell: r => <span className="font-medium text-sm">{r.customerName}</span> },
        { key: 'serviceName', header: 'Service', cell: r => <span className="text-xs">{r.serviceName}</span> },
        { key: 'taxableAmount', header: 'Taxable', cell: r => <span className="text-xs">{formatINR(r.taxableAmount)}</span> },
        { key: 'totalAmount', header: 'Total', cell: r => <span className="font-semibold">{formatINR(r.totalAmount)}</span> },
        { key: 'invoiceDate', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.invoiceDate)}</span> },
        { key: 'paymentStatus', header: 'Status', cell: r => <StatusBadge status={r.paymentStatus} /> },
        { key: '_actions', header: 'Actions', cell: r => (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={sending === r.id} onClick={(e) => { e.stopPropagation(); sendInvoice(r.id); }}>
            {sending === r.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            <span className="hidden sm:inline">Send</span>
          </Button>
        ) },
      ]}
      filterFields={[
        { key: 'paymentStatus', label: 'Status', options: [{ value: 'Unpaid', label: 'Unpaid' }, { value: 'Partial', label: 'Partial' }, { value: 'Paid', label: 'Paid' }] },
      ]}
    />
  );
}

export function AppointmentsView() {
  return (
    <GenericListView
      entity="appointment"
      title="Appointments"
      description="Office visits, online calls, and follow-up meetings"
      icon={require('lucide-react').Calendar}
      defaultSort="date"
      allowCreate={false}
      columns={[
        { key: 'appointmentCode', header: 'Code', cell: r => <span className="font-mono text-xs">{r.appointmentCode}</span> },
        { key: 'lead', header: 'Lead', cell: r => <span className="text-xs">{r.lead?.studentName || '—'}</span> },
        { key: 'employee', header: 'Employee', cell: r => <span className="text-xs">{r.employee?.name}</span> },
        { key: 'type', header: 'Type', cell: r => <StatusBadge status={r.type} /> },
        { key: 'date', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.date)} {r.time}</span> },
        { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Scheduled','Confirmed','Completed','Rescheduled','Cancelled','No Show'].map(s => ({ value: s, label: s })) },
        { key: 'type', label: 'Type', options: ['Office Visit','Online','Phone','Video Call'].map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function CallsView() {
  return (
    <GenericListView
      entity="call"
      title="Call Log"
      description="Every call recorded as an immutable activity"
      icon={require('lucide-react').Phone}
      defaultSort="callDate"
      allowCreate={false}
      columns={[
        { key: 'callDate', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.callDate)} {r.callTime}</span> },
        { key: 'lead', header: 'Lead', cell: r => <span className="font-medium text-sm">{r.lead?.studentName}</span> },
        { key: 'employee', header: 'Caller', cell: r => <span className="text-xs">{r.employee?.name}</span> },
        { key: 'direction', header: 'Direction', cell: r => <StatusBadge status={r.direction} /> },
        { key: 'result', header: 'Result', cell: r => <StatusBadge status={r.result} /> },
        { key: 'duration', header: 'Duration', cell: r => <span className="text-xs">{r.duration ? `${Math.floor(r.duration/60)}m ${r.duration%60}s` : '—'}</span> },
        { key: 'remarks', header: 'Remarks', cell: r => <span className="text-xs">{r.remarks}</span> },
      ]}
      filterFields={[
        { key: 'result', label: 'Result', options: ['Connected','Not Connected','Busy','Switched Off','Wrong Number','Interested','Not Interested','Call Later','Appointment Fixed'].map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function CounsellingView() {
  return (
    <GenericListView
      entity="counselling"
      title="Counselling Sessions"
      description="Career counselling records — multiple sessions per student supported"
      icon={require('lucide-react').MessageSquare}
      defaultSort="date"
      allowCreate={false}
      columns={[
        { key: 'date', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.date)}</span> },
        { key: 'lead', header: 'Lead', cell: r => <span className="font-medium text-sm">{r.lead?.studentName}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="text-sm">{r.student?.name}</span> },
        { key: 'counsellor', header: 'Counsellor', cell: r => <span className="text-xs">{r.counsellor?.name}</span> },
        { key: 'currentQualification', header: 'Qualification', cell: r => <span className="text-xs">{r.currentQualification}</span> },
        { key: 'preferredCourse', header: 'Preferred Course', cell: r => <span className="text-xs">{r.preferredCourse}</span> },
        { key: 'expectedSalary', header: 'Expected Salary', cell: r => <span className="text-xs">{formatINR(r.expectedSalary)}</span> },
      ]}
    />
  );
}

export function IncentiveRulesView() {
  return (
    <GenericListView
      entity="incentiveRule"
      title="Incentive Rules"
      description="Configurable incentive rules — slabs, percentages, fixed amounts"
      icon={require('lucide-react').Coins}
      defaultSort="createdAt"
      columns={[
        { key: 'name', header: 'Rule Name', cell: r => <span className="font-medium text-sm">{r.name}</span> },
        { key: 'basis', header: 'Basis', cell: r => <StatusBadge status={r.basis} /> },
        { key: 'ruleType', header: 'Type', cell: r => <StatusBadge status={r.ruleType} /> },
        { key: 'percentage', header: '%', cell: r => <span className="text-xs">{r.percentage ? `${r.percentage}%` : '—'}</span> },
        { key: 'fixedAmount', header: 'Fixed', cell: r => <span className="text-xs">{r.fixedAmount ? formatINR(r.fixedAmount) : '—'}</span> },
        { key: 'serviceType', header: 'Service', cell: r => <span className="text-xs">{r.serviceType || 'All'}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}

export function TargetsView() {
  return (
    <GenericListView
      entity="employeeTarget"
      title="Employee Targets"
      description="Daily/Weekly/Monthly targets for performance tracking"
      icon={require('lucide-react').Target}
      defaultSort="periodStart"
      allowCreate={false}
      columns={[
        { key: 'employee', header: 'Employee', cell: r => <span className="font-medium text-sm">{r.employee?.name}</span> },
        { key: 'period', header: 'Period', cell: r => <StatusBadge status={r.period} /> },
        { key: 'periodStart', header: 'Start', cell: r => <span className="text-xs">{formatDate(r.periodStart)}</span> },
        { key: 'periodEnd', header: 'End', cell: r => <span className="text-xs">{formatDate(r.periodEnd)}</span> },
        { key: 'leadTarget', header: 'Leads', cell: r => <span className="text-xs">{r.leadTarget}</span> },
        { key: 'callTarget', header: 'Calls', cell: r => <span className="text-xs">{r.callTarget}</span> },
        { key: 'enrollmentTarget', header: 'Enroll', cell: r => <span className="text-xs">{r.enrollmentTarget}</span> },
        { key: 'collectionTarget', header: 'Collection', cell: r => <span className="text-xs">{formatINR(r.collectionTarget)}</span> },
      ]}
    />
  );
}

export function FollowUpsView() {
  return (
    <GenericListView
      entity="followUp"
      title="Follow-ups & Tasks"
      description="Centralized task engine across all entity types"
      icon={require('lucide-react').CalendarClock}
      defaultSort="dueDate"
      allowCreate={false}
      columns={[
        { key: 'dueDate', header: 'Due', cell: r => <span className="text-xs">{formatDate(r.dueDate)} {r.dueTime || ''}</span> },
        { key: 'entityType', header: 'Type', cell: r => <StatusBadge status={r.entityType} /> },
        { key: 'lead', header: 'Lead', cell: r => <span className="text-sm">{r.lead?.studentName || r.student?.name || '—'}</span> },
        { key: 'assignedTo', header: 'Assigned To', cell: r => <span className="text-xs">{r.assignedTo?.name}</span> },
        { key: 'priority', header: 'Priority', cell: r => <StatusBadge status={r.priority} /> },
        { key: 'remarks', header: 'Remarks', cell: r => <span className="text-xs">{r.remarks}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Pending','Completed','Cancelled','Overdue'].map(s => ({ value: s, label: s })) },
        { key: 'priority', label: 'Priority', options: ['Low','Medium','High'].map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function NotificationsView() {
  return (
    <GenericListView
      entity="notification"
      title="Notifications"
      description="In-app notifications — SMS/Email/WhatsApp ready"
      icon={require('lucide-react').Bell}
      defaultSort="createdAt"
      allowCreate={false}
      columns={[
        { key: 'type', header: 'Type', cell: r => <StatusBadge status={r.type} /> },
        { key: 'title', header: 'Title', cell: r => <span className="font-medium text-sm">{r.title}</span> },
        { key: 'message', header: 'Message', cell: r => <span className="text-xs">{r.message}</span> },
        { key: 'createdAt', header: 'Created', cell: r => <span className="text-xs">{formatDate(r.createdAt)}</span> },
        { key: 'isRead', header: 'Read', cell: r => r.isRead ? <StatusBadge status="Verified" /> : <StatusBadge status="Pending" /> },
      ]}
      filterFields={[
        { key: 'type', label: 'Type', options: ['Follow-up Due','Appointment Reminder','EMI Due','Payment Received','Interview Reminder','Joining Reminder','Task Assignment','Lead Assignment'].map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function CollegesView() {
  return (
    <GenericListView
      entity="college"
      title="Colleges"
      description="Partner colleges & universities"
      icon={require('lucide-react').Building2}
      defaultSort="createdAt"
      columns={[
        { key: 'collegeName', header: 'College', cell: r => <span className="font-medium text-sm">{r.collegeName}</span> },
        { key: 'university', header: 'University', cell: r => <span className="text-xs">{r.university}</span> },
        { key: 'location', header: 'Location', cell: r => <span className="text-xs">{r.location}</span> },
        { key: 'contactPerson', header: 'Contact', cell: r => <span className="text-xs">{r.contactPerson || '—'}</span> },
        { key: 'phone', header: 'Phone', cell: r => <span className="text-xs">{r.phone}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
      ]}
      createFields={[
        { key: 'collegeName', label: 'College Name', type: 'text', required: true, colSpan: 2 },
        { key: 'university', label: 'University', type: 'text' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'contactPerson', label: 'Contact Person', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'website', label: 'Website', type: 'text' },
      ]}
    />
  );
}

export function AttendanceView() {
  return (
    <GenericListView
      entity="attendance"
      title="Attendance"
      description="Daily attendance records per batch per student"
      icon={require('lucide-react').GraduationCap}
      defaultSort="date"
      allowCreate={false}
      columns={[
        { key: 'date', header: 'Date', cell: r => <span className="text-xs">{formatDate(r.date)}</span> },
        { key: 'batch', header: 'Batch', cell: r => <span className="text-xs">{r.batch?.batchCode || '—'}</span> },
        { key: 'student', header: 'Student', cell: r => <span className="text-xs">{r.student?.name || '—'}</span> },
        { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
        { key: 'remarks', header: 'Remarks', cell: r => <span className="text-xs">{r.remarks || '—'}</span> },
      ]}
      filterFields={[
        { key: 'status', label: 'Status', options: ['Present', 'Absent', 'Late', 'Leave'].map(s => ({ value: s, label: s })) },
      ]}
    />
  );
}

export function IncentiveCalculationsView() {
  return (
    <GenericListView
      entity="incentiveCalculation"
      title="Incentive History"
      description="Calculated incentive payouts per employee per period"
      icon={require('lucide-react').Coins}
      defaultSort="periodStart"
      allowCreate={false}
      columns={[
        { key: 'employee', header: 'Employee', cell: r => <span className="font-medium text-sm">{r.employee?.name || '—'}</span> },
        { key: 'periodStart', header: 'Period', cell: r => <span className="text-xs">{formatDate(r.periodStart)} → {formatDate(r.periodEnd)}</span> },
        { key: 'basisAmount', header: 'Basis Amount', cell: r => <span className="text-xs">{formatINR(r.basisAmount)}</span> },
        { key: 'incentiveAmount', header: 'Incentive', cell: r => <span className="text-sm font-bold text-emerald-700">{formatINR(r.incentiveAmount)}</span> },
        { key: 'rule', header: 'Rule', cell: r => <span className="text-xs">{r.rule?.name || '—'}</span> },
      ]}
      filterFields={[]}
    />
  );
}
