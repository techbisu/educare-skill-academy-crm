// Sidebar navigation config — group based, role-aware.
// Every item has a required permission. Items without a permission grant for the
// current user's role are hidden from the sidebar AND blocked on the backend.
import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, UserPlus, FileText, Calendar, Phone, MessageSquare,
  GraduationCap, BookOpen, Layers, CalendarClock, Wallet, CreditCard, FileSignature,
  Building2, Briefcase, FileBadge, Trophy, BarChart3,
  Target, Coins, Bell, ScrollText, Settings, Search,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  // Required permission(s). User must have AT LEAST ONE to see this nav item.
  // Format: '<group>.<action>' (case-insensitive, e.g. 'lead.view').
  permissions: string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: ['dashboard.view'] },
      { id: 'search', label: 'Global Search', icon: Search, permissions: ['dashboard.view'] },
      { id: 'followups', label: "Today's Tasks", icon: CalendarClock, permissions: ['followup.view'] },
      { id: 'notifications', label: 'Notifications', icon: Bell, permissions: ['notification.view'] },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: 'leads', label: 'Leads', icon: UserPlus, permissions: ['lead.view'] },
      { id: 'appointments', label: 'Appointments', icon: Calendar, permissions: ['appointment.view', 'lead.view'] },
      { id: 'calls', label: 'Call Log', icon: Phone, permissions: ['lead.view'] },
      { id: 'counselling', label: 'Counselling', icon: MessageSquare, permissions: ['lead.view', 'counselling.view'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'students', label: 'Students', icon: Users, permissions: ['student.view'] },
      { id: 'courses', label: 'Courses', icon: BookOpen, permissions: ['course.view'] },
      { id: 'enrollments', label: 'Enrollments', icon: FileText, permissions: ['enrollment.view'] },
      { id: 'batches', label: 'Batches', icon: Layers, permissions: ['batch.view'] },
      { id: 'attendance', label: 'Attendance', icon: GraduationCap, permissions: ['attendance.view', 'batch.view'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payments', icon: Wallet, permissions: ['payment.view'] },
      { id: 'emi', label: 'EMI Schedule', icon: CreditCard, permissions: ['emi.view'] },
      { id: 'invoices', label: 'Invoices', icon: FileSignature, permissions: ['invoice.view'] },
      { id: 'income', label: 'Income', icon: Coins, permissions: ['finance.view'] },
      { id: 'expenses', label: 'Expenses', icon: BarChart3, permissions: ['finance.view'] },
    ],
  },
  {
    label: 'College Admissions',
    items: [
      { id: 'colleges', label: 'Colleges', icon: Building2, permissions: ['collegeadmission.view'] },
      { id: 'collegeApplications', label: 'Applications', icon: FileText, permissions: ['collegeadmission.view'] },
    ],
  },
  {
    label: 'Placement',
    items: [
      { id: 'companies', label: 'Companies', icon: Building2, permissions: ['company.view'] },
      { id: 'jobOpenings', label: 'Job Openings', icon: Briefcase, permissions: ['jobopening.view'] },
      { id: 'jobApplications', label: 'Job Applications', icon: FileBadge, permissions: ['jobapplication.view'] },
      { id: 'placements', label: 'Placements', icon: Trophy, permissions: ['placement.view'] },
    ],
  },
  {
    label: 'HR & Performance',
    items: [
      { id: 'employees', label: 'Employees', icon: Users, permissions: ['employee.view'] },
      { id: 'targets', label: 'Targets', icon: Target, permissions: ['employee.view'] },
      { id: 'incentiveRules', label: 'Incentive Rules', icon: Coins, permissions: ['finance.view'] },
      { id: 'incentiveCalculations', label: 'Incentive History', icon: Coins, permissions: ['finance.view', 'employee.view'] },
    ],
  },
  {
    label: 'System',
    items: [
      // Offices — Admin+ only. Callers/Counsellors/Trainers never see this.
      { id: 'offices', label: 'Offices', icon: Building2, permissions: ['office.view'] },
      // Audit Logs — Admin+ only. Frontline staff never see this.
      { id: 'auditLogs', label: 'Audit Logs', icon: ScrollText, permissions: ['auditlog.view'] },
      // Reports — Admin, HR, Accounts only (not Caller/Trainer/Counsellor/Placement).
      { id: 'reports', label: 'Reports', icon: BarChart3, permissions: ['report.view'] },
      // Settings — Admin+ only (or own profile via dedicated My Account page).
      { id: 'settings', label: 'Settings', icon: Settings, permissions: ['setting.view'] },
    ],
  },
];
