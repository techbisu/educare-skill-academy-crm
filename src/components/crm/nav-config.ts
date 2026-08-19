// Sidebar navigation config — group based, role-aware.
import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, UserPlus, FileText, Calendar, Phone, MessageSquare,
  GraduationCap, BookOpen, Layers, CalendarClock, Wallet, CreditCard, FileSignature,
  Building2, Briefcase, FileBadge, ClipboardCheck, Trophy, BarChart3,
  Target, Coins, Bell, ScrollText, Settings, ShieldCheck, Search,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  permissions?: string[]; // any of these required; empty = everyone
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'search', label: 'Global Search', icon: Search },
      { id: 'followups', label: "Today's Tasks", icon: CalendarClock },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: 'leads', label: 'Leads', icon: UserPlus, permissions: ['lead.view'] },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'calls', label: 'Call Log', icon: Phone },
      { id: 'counselling', label: 'Counselling', icon: MessageSquare },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'students', label: 'Students', icon: Users, permissions: ['student.view'] },
      { id: 'courses', label: 'Courses', icon: BookOpen },
      { id: 'enrollments', label: 'Enrollments', icon: FileText, permissions: ['enrollment.view'] },
      { id: 'batches', label: 'Batches', icon: Layers },
      { id: 'attendance', label: 'Attendance', icon: GraduationCap },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payments', icon: Wallet, permissions: ['payment.view'] },
      { id: 'emi', label: 'EMI Schedule', icon: CreditCard },
      { id: 'invoices', label: 'Invoices', icon: FileSignature },
      { id: 'income', label: 'Income', icon: Coins },
      { id: 'expenses', label: 'Expenses', icon: BarChart3 },
    ],
  },
  {
    label: 'College Admissions',
    items: [
      { id: 'colleges', label: 'Colleges', icon: Building2 },
      { id: 'collegeApplications', label: 'Applications', icon: FileText },
    ],
  },
  {
    label: 'Placement',
    items: [
      { id: 'companies', label: 'Companies', icon: Building2 },
      { id: 'jobOpenings', label: 'Job Openings', icon: Briefcase },
      { id: 'jobApplications', label: 'Job Applications', icon: FileBadge },
      { id: 'placements', label: 'Placements', icon: Trophy },
    ],
  },
  {
    label: 'HR & Performance',
    items: [
      { id: 'employees', label: 'Employees', icon: Users },
      { id: 'targets', label: 'Targets', icon: Target },
      { id: 'incentiveRules', label: 'Incentive Rules', icon: Coins },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'offices', label: 'Offices', icon: Building2 },
      { id: 'auditLogs', label: 'Audit Logs', icon: ScrollText },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];
