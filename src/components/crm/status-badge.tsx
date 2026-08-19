'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Paid: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Valid: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Completed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Joined: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Placement Completed': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Admission Confirmed': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Selected: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Verified: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Confirmed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  New: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  Upcoming: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Scheduled: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Interested: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Eligible: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  'Job Shared': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Applied: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Unpaid: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  Partial: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Partially Paid': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Payment Pending': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Enrollment Pending': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Call Pending': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Appointment Booked': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  'Appointment Completed': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Counselling Done': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Contacted: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Enrolled: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Converted: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Follow-up': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Application Started': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  'Documents Pending': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'Application Submitted': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  'Under Review': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  'Interview Scheduled': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  'Interview Attended': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  'Offer Received': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Offer Letter': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Joining Pending': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  Open: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  Cancelled: 'bg-red-100 text-red-700 hover:bg-red-100',
  Rejected: 'bg-red-100 text-red-700 hover:bg-red-100',
  Lost: 'bg-red-100 text-red-700 hover:bg-red-100',
  'Not Interested': 'bg-red-100 text-red-700 hover:bg-red-100',
  'Wrong Number': 'bg-red-100 text-red-700 hover:bg-red-100',
  Duplicate: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  Suspended: 'bg-red-100 text-red-700 hover:bg-red-100',
  Overdue: 'bg-red-100 text-red-700 hover:bg-red-100',
  'No Show': 'bg-red-100 text-red-700 hover:bg-red-100',
  Reversed: 'bg-red-100 text-red-700 hover:bg-red-100',
  Refunded: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  Dropped: 'bg-red-100 text-red-700 hover:bg-red-100',
  Closed: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  'On Hold': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  Graduated: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Placed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Rescheduled: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  Accepted: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  Withdrawn: 'bg-red-100 text-red-700 hover:bg-red-100',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (!status) return null;
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  return (
    <Badge variant="outline" className={cn('font-medium border-0 whitespace-nowrap', colorClass, className)}>
      {status}
    </Badge>
  );
}
