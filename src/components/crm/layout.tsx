'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions, icon }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-2 border-b">
      <div className="flex items-center gap-3">
        {icon && <div className="rounded-lg bg-primary/10 text-primary p-2">{icon}</div>}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, action, children, className }: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('shadow-sm', className)}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(!title && 'pt-6')}>{children}</CardContent>
    </Card>
  );
}

export function DataItem({ label, value, className }: {
  label: string;
  value?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value ?? '—'}</div>
    </div>
  );
}

export function Timeline({ items }: { items: { time: string; title: string; description?: string; icon?: ReactNode }[] }) {
  return (
    <ol className="relative border-l border-muted-foreground/20 ml-2 space-y-4">
      {items.map((item, i) => (
        <li key={i} className="ml-4">
          <div className="absolute -left-2 mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          <div className="text-xs text-muted-foreground">{item.time}</div>
          <div className="text-sm font-medium mt-0.5">{item.title}</div>
          {item.description && <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>}
        </li>
      ))}
    </ol>
  );
}

export function formatINR(n: number | null | undefined): string {
  if (n == null) return '—';
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}
