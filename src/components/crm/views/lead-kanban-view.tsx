'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/crm/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormModal } from '@/components/crm/form-modal';
import { LEAD_SOURCES, LEAD_TYPES, LEAD_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor,
  useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { Plus, Phone, GripVertical, User, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { formatINR, formatDate } from '@/components/crm/layout';

// Kanban-style lead board with drag-and-drop status transitions
// Ideal for Callers — quickly triage and move leads through the pipeline.

type Lead = {
  id: string; leadCode: string; studentName: string; mobile: string; whatsapp?: string;
  source: string; leadType: string; status: string; office?: { officeName: string };
  assignedEmployee?: { name: string }; createdAt: string;
};

const COLUMN_CONFIG: { status: string; label: string; color: string; accent: string }[] = [
  { status: 'New', label: 'New', color: 'bg-blue-50 border-blue-200', accent: 'border-l-blue-500' },
  { status: 'Call Pending', label: 'Call Pending', color: 'bg-amber-50 border-amber-200', accent: 'border-l-amber-500' },
  { status: 'Contacted', label: 'Contacted', color: 'bg-cyan-50 border-cyan-200', accent: 'border-l-cyan-500' },
  { status: 'Interested', label: 'Interested', color: 'bg-emerald-50 border-emerald-200', accent: 'border-l-emerald-500' },
  { status: 'Follow-up', label: 'Follow-up', color: 'bg-purple-50 border-purple-200', accent: 'border-l-purple-500' },
  { status: 'Appointment Booked', label: 'Appt Booked', color: 'bg-violet-50 border-violet-200', accent: 'border-l-violet-500' },
  { status: 'Counselling Done', label: 'Counselled', color: 'bg-teal-50 border-teal-200', accent: 'border-l-teal-500' },
  { status: 'Enrolled', label: 'Enrolled', color: 'bg-green-100 border-green-300', accent: 'border-l-green-600' },
  { status: 'Converted', label: 'Converted', color: 'bg-emerald-100 border-emerald-300', accent: 'border-l-emerald-600' },
  { status: 'Not Interested', label: 'Not Interested', color: 'bg-red-50 border-red-200', accent: 'border-l-red-500' },
  { status: 'Wrong Number', label: 'Wrong Number', color: 'bg-gray-100 border-gray-300', accent: 'border-l-gray-500' },
  { status: 'Lost', label: 'Lost', color: 'bg-red-100 border-red-300', accent: 'border-l-red-600' },
];

export function LeadKanbanView({ user, onViewLead }: { user: any; onViewLead: (lead: any) => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.list('lead', { pageSize: 200, sortBy: 'createdAt', sortDir: 'desc' });
    if (res.success && res.data) setLeads(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = COLUMN_CONFIG.map(col => ({
    ...col,
    leads: leads.filter(l => l.status === col.status),
  }));

  const handleDragStart = (e: DragStartEvent) => {
    const lead = leads.find(l => l.id === e.active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveLead(null);
    const leadId = String(e.active.id);
    const targetStatus = String(e.over?.id);
    if (!targetStatus) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === targetStatus) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: targetStatus } : l));

    const res = await api.action('lead.update-status', { leadId, status: targetStatus });
    if (res.success) {
      toast.success(`Lead moved to "${targetStatus}"`);
    } else {
      toast.error(res.message || 'Failed to update status');
      // Revert on failure
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: lead.status } : l));
    }
  };

  const handleQuickCreate = async (form: any) => {
    const res = await api.action('lead.quick-create', form);
    if (res.success) {
      toast.success('Lead created');
      setQuickCreateOpen(false);
      load();
    } else {
      toast.error(res.message || 'Failed');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" /> Lead Pipeline (Kanban)
          </h2>
          <p className="text-xs text-muted-foreground">Drag leads between columns to update status. Click a lead card to open the 360° view.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => onViewLead({ id: '__list__' })}>
            <List className="h-4 w-4 mr-1" /> Table View
          </Button>
          <Button size="sm" onClick={() => setQuickCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Quick Add Lead
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Horizontal scroll container for columns */}
        <div className="overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max">
            {grouped.map(col => (
              <KanbanColumn key={col.status} col={col} leads={col.leads} onViewLead={onViewLead} onCall={(lead) => setCallModalLead(lead)} />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} dragging onView={() => {}} onCall={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {quickCreateOpen && <QuickCreateModal open={quickCreateOpen} onOpenChange={setQuickCreateOpen} onSubmit={handleQuickCreate} user={user} />}
    </div>
  );
}

function KanbanColumn({ col, leads, onViewLead, onCall }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });
  return (
    <div className={`flex flex-col w-[280px] shrink-0 rounded-lg border ${col.color} ${isOver ? 'ring-2 ring-emerald-400' : ''}`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${col.accent} border-l-4`}>
        <div className="font-semibold text-sm">{col.label}</div>
        <span className="text-xs font-medium bg-white/70 rounded-full px-2 py-0.5">{leads.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-220px)]">
        {leads.length === 0 && (
          <div className="text-xs text-muted-foreground/70 text-center py-4 border-2 border-dashed border-muted/30 rounded-md">
            Drop leads here
          </div>
        )}
        {leads.map((lead: Lead) => (
          <LeadCard key={lead.id} lead={lead} onView={() => onViewLead(lead)} onCall={() => onCall(lead)} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead, onView, onCall, dragging }: { lead: Lead; onView: () => void; onCall: () => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`bg-card rounded-md border shadow-sm p-2.5 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-30' : ''} ${dragging ? 'rotate-2' : ''}`}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{lead.studentName}</div>
          <div className="text-xs text-muted-foreground font-mono">{lead.leadCode}</div>
        </div>
        <button
          {...listeners}
          className="text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing p-0.5"
          onClick={e => e.stopPropagation()}
          aria-label="Drag to change status"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <a href={`tel:${lead.mobile}`} onClick={e => e.stopPropagation()} className="hover:text-emerald-600 hover:underline">{lead.mobile}</a>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{lead.assignedEmployee?.name || 'Unassigned'}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">{lead.source}</span>
        <span className="text-[10px] text-muted-foreground">{formatDate(lead.createdAt)}</span>
      </div>
      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs" onClick={(e) => { e.stopPropagation(); onCall(); }}>
        <Phone className="h-3 w-3 mr-1" /> Log Call
      </Button>
    </div>
  );
}

function QuickCreateModal({ open, onOpenChange, onSubmit, user }: any) {
  const [form, setForm] = useState<any>({ source: 'Walk-in', leadType: 'Coaching' });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Quick Add Lead" description="Just name & mobile — fill in details later" size="md" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name || ''} onChange={e => set('name', e.target.value)} required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Mobile *</Label>
          <Input value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="Same as mobile" />
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select value={form.source} onValueChange={v => set('source', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Lead Type</Label>
          <Select value={form.leadType} onValueChange={v => set('leadType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>District</Label>
          <Input value={form.district || ''} onChange={e => set('district', e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
        </div>
      </div>
      <div className="text-xs bg-emerald-50 p-2 rounded text-emerald-800">
        Lead will be auto-assigned to you (<strong>{user.name}</strong>) and assigned code will be generated automatically.
      </div>
    </FormModal>
  );
}
