'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LoginScreen } from '@/components/crm/login-screen';
import { AppShell } from '@/components/crm/app-shell';
import { DashboardView } from '@/components/crm/views/dashboard-view';
import { LeadsView } from '@/components/crm/views/leads-view';
import { StudentsView } from '@/components/crm/views/students-view';
import {
  CoursesView, BatchesView, PaymentsView, EmiView, CompaniesView, JobOpeningsView,
  JobApplicationsView, PlacementsView, CollegeApplicationsView, IncomeView, ExpensesView,
  OfficesView, EmployeesView, AuditLogsView, InvoicesView, AppointmentsView, CallsView,
  CounsellingView, IncentiveRulesView, TargetsView, FollowUpsView, NotificationsView, CollegesView,
} from '@/components/crm/views/generic-views';
import { SettingsView } from '@/components/crm/views/settings-view';
import { ReportsView } from '@/components/crm/views/reports-view';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { data: session, status } = useSession();
  const [view, setView] = useState('dashboard');

  // Sync view from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) setView(hash);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (status !== 'authenticated' || !session) {
    return <LoginScreen />;
  }

  return (
    <AppShell initialView={view} onNavigate={setView}>
      {({ view, user }) => {
        if (!user) return <div className="p-6">Loading...</div>;
        return <ViewRouter view={view} user={user} />;
      }}
    </AppShell>
  );
}

function ViewRouter({ view, user }: { view: string; user: any }) {
  switch (view) {
    case 'dashboard': return <DashboardView officeId={user.officeId} />;
    case 'leads': return <LeadsView user={user} />;
    case 'students': return <StudentsView user={user} />;
    case 'courses': return <CoursesView />;
    case 'enrollments': return <EnrollmentsView />;
    case 'batches': return <BatchesView />;
    case 'payments': return <PaymentsView />;
    case 'emi': return <EmiView />;
    case 'invoices': return <InvoicesView />;
    case 'companies': return <CompaniesView />;
    case 'jobOpenings': return <JobOpeningsView />;
    case 'jobApplications': return <JobApplicationsView />;
    case 'placements': return <PlacementsView />;
    case 'collegeApplications': return <CollegeApplicationsView />;
    case 'colleges': return <CollegesView />;
    case 'income': return <IncomeView />;
    case 'expenses': return <ExpensesView />;
    case 'offices': return <OfficesView />;
    case 'employees': return <EmployeesView />;
    case 'auditLogs': return <AuditLogsView />;
    case 'appointments': return <AppointmentsView />;
    case 'calls': return <CallsView />;
    case 'counselling': return <CounsellingView />;
    case 'incentiveRules': return <IncentiveRulesView />;
    case 'targets': return <TargetsView />;
    case 'followups': return <FollowUpsView />;
    case 'notifications': return <NotificationsView />;
    case 'reports': return <ReportsView user={user} />;
    case 'settings': return <SettingsView user={user} />;
    case 'search': return <SearchLandingView />;
    default: return <DashboardView officeId={user.officeId} />;
  }
}

function SearchLandingView() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold mb-2">Global Search</h2>
      <p className="text-muted-foreground">Use the search bar at the top to find leads, students, payments, companies, and more.</p>
    </div>
  );
}

// Add the missing EnrollmentsView — using generic list
function EnrollmentsView() {
  // Lazy import to avoid circular deps
  const GenericListView = require('@/components/crm/views/generic-views').GenericListView;
  const { formatINR, formatDate } = require('@/components/crm/layout');
  const { StatusBadge } = require('@/components/crm/status-badge');
  const { FileText } = require('lucide-react');

  return (
    <GenericListView
      entity="enrollment"
      title="Enrollments"
      description="Course enrollments with backend-computed financials"
      icon={FileText}
      defaultSort="enrollmentDate"
      allowCreate={false}
      columns={[
        { key: 'enrollmentCode', header: 'Code', cell: (r: any) => <span className="font-mono text-xs">{r.enrollmentCode}</span> },
        { key: 'student', header: 'Student', cell: (r: any) => <span className="font-medium text-sm">{r.student?.name}</span> },
        { key: 'course', header: 'Course', cell: (r: any) => <span className="text-xs">{r.course?.courseName}</span> },
        { key: 'finalFee', header: 'Final Fee', cell: (r: any) => <span className="text-xs">{formatINR(r.finalFee)}</span> },
        { key: 'paidAmount', header: 'Paid', cell: (r: any) => <span className="text-xs text-emerald-700">{formatINR(r.paidAmount)}</span> },
        { key: 'dueAmount', header: 'Due', cell: (r: any) => <span className="text-xs text-red-700">{formatINR(r.dueAmount)}</span> },
        { key: 'enrollmentDate', header: 'Date', cell: (r: any) => <span className="text-xs">{formatDate(r.enrollmentDate)}</span> },
        { key: 'paymentStatus', header: 'Status', cell: (r: any) => <StatusBadge status={r.paymentStatus} /> },
      ]}
      filterFields={[
        { key: 'paymentStatus', label: 'Payment', options: [{ value: 'Unpaid', label: 'Unpaid' }, { value: 'Partial', label: 'Partial' }, { value: 'Paid', label: 'Paid' }] },
        { key: 'status', label: 'Status', options: [{ value: 'Active', label: 'Active' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }, { value: 'Suspended', label: 'Suspended' }] },
      ]}
    />
  );
}
