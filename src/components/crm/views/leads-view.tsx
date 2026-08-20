'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { DataTable, useTableState, type Column } from '@/components/crm/data-table';
import { PageHeader, SectionCard, DataItem, Timeline, formatINR, formatDate, formatDateTime } from '@/components/crm/layout';
import { StatusBadge } from '@/components/crm/status-badge';
import { FormModal } from '@/components/crm/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LEAD_SOURCES, LEAD_TYPES, LEAD_STATUSES, CALL_RESULTS, APPOINTMENT_TYPES, APPOINTMENT_STATUSES, FOLLOWUP_PRIORITIES } from '@/lib/constants';
import { toast } from 'sonner';
import {
  UserPlus, Phone, Calendar, MessageSquare, FileText, UserCheck, AlertTriangle,
  Plus, ArrowRight, Search, Filter, LayoutGrid, List,
} from 'lucide-react';
import { LeadKanbanView } from '@/components/crm/views/lead-kanban-view';

export function LeadsView({ user }: { user: any }) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('leads-view-mode') as 'table' | 'kanban' || 'table';
    }
    return 'table';
  });
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [counsellingOpen, setCounsellingOpen] = useState(false);
  const [duplicateWarn, setDuplicateWarn] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [actionLead, setActionLead] = useState<any>(null);
  const [lead360Data, setLead360Data] = useState<any>(null);
  const [lead360Loading, setLead360Loading] = useState(false);

  const table = useTableState({ pageSize: 20, sortBy: 'createdAt', sortDir: 'desc' });
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterLeadType, setFilterLeadType] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const load = useCallback(async () => {
    const params: Record<string, any> = {
      page: table.page, pageSize: table.pageSize, search: table.search,
      sortBy: table.sortBy, sortDir: table.sortDir,
    };
    if (filterStatus) params.status = filterStatus;
    if (filterSource) params.source = filterSource;
    if (filterLeadType) params.leadType = filterLeadType;
    if (filterOffice) params.officeId = filterOffice;
    if (filterEmployee) params.assignedEmployeeId = filterEmployee;
    const res = await api.list('lead', params);
    if (res.success && res.data) {
      setData(res.data);
      if (res.meta) setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
    }
  }, [table.page, table.pageSize, table.search, table.sortBy, table.sortDir, filterStatus, filterSource, filterLeadType, filterOffice, filterEmployee]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.options('employees').then(res => { if (res.success && res.data) setEmployees(res.data); });
    api.options('offices').then(res => { if (res.success && res.data) setOffices(res.data); });
  }, []);

  const openLead360 = async (lead: any) => {
    setSelectedLead(lead);
    setDetailOpen(true);
    setLead360Loading(true);
    const res = await api.lead360(lead.id);
    if (res.success && res.data) setLead360Data(res.data);
    setLead360Loading(false);
  };

  const refreshLead360 = async () => {
    if (!selectedLead) return;
    const res = await api.lead360(selectedLead.id);
    if (res.success && res.data) {
      setLead360Data(res.data);
      setSelectedLead(res.data);
    }
  };

  const checkDuplicate = async (mobile?: string, whatsapp?: string, email?: string) => {
    if (!mobile && !whatsapp && !email) return;
    const res = await api.action('duplicate-check', { mobile, whatsapp, email });
    if (res.success && res.data?.hasDuplicates) {
      setDuplicateWarn([...(res.data.leads || []), ...(res.data.students || [])]);
    } else {
      setDuplicateWarn([]);
    }
  };

  const handleCreate = async (formData: any) => {
    const officeId = formData.officeId || user.officeId;
    const res = await api.create('lead', { ...formData, officeId });
    if (res.success) {
      toast.success('Lead created successfully');
      setCreateOpen(false);
      load();
    } else {
      toast.error(res.message || 'Failed to create lead');
    }
  };

  const handleAssign = async (employeeId: string, reason?: string) => {
    if (!actionLead) return;
    const res = await api.action('lead.assign', { leadId: actionLead.id, employeeId, reason });
    if (res.success) {
      toast.success('Lead assigned');
      setAssignOpen(false);
      load();
      if (detailOpen) refreshLead360();
    } else {
      toast.error(res.message || 'Failed');
    }
  };

  const handleBulkAssign = async (employeeId: string) => {
    if (selectedLeadIds.length === 0) return;
    const res = await api.action('lead.bulk-assign', { leadIds: selectedLeadIds, employeeId });
    if (res.success) {
      toast.success(`Assigned ${selectedLeadIds.length} leads`);
      setSelectedLeadIds([]);
      load();
    }
  };

  const handleCall = async (formData: any) => {
    if (!actionLead) return;
    const res = await api.action('lead.call', { leadId: actionLead.id, ...formData });
    if (res.success) {
      toast.success('Call recorded');
      setCallOpen(false);
      load();
      if (detailOpen) refreshLead360();
    } else { toast.error(res.message || 'Failed'); }
  };

  const handleFollowUp = async (formData: any) => {
    if (!actionLead) return;
    const res = await api.action('lead.followup', { leadId: actionLead.id, ...formData });
    if (res.success) {
      toast.success('Follow-up scheduled');
      setFollowUpOpen(false);
      load();
      if (detailOpen) refreshLead360();
    }
  };

  const handleAppointment = async (formData: any) => {
    if (!actionLead) return;
    const res = await api.action('lead.appointment', { leadId: actionLead.id, ...formData });
    if (res.success) {
      toast.success('Appointment created');
      setAppointmentOpen(false);
      load();
      if (detailOpen) refreshLead360();
    }
  };

  const handleCounselling = async (formData: any) => {
    if (!actionLead) return;
    const res = await api.action('lead.counselling', { leadId: actionLead.id, ...formData });
    if (res.success) {
      toast.success('Counselling session saved');
      setCounsellingOpen(false);
      load();
      if (detailOpen) refreshLead360();
    }
  };

  const handleConvert = async (lead: any) => {
    if (!confirm(`Convert lead "${lead.studentName}" into a Student?`)) return;
    const res = await api.action('lead.convert', { leadId: lead.id });
    if (res.success) {
      toast.success('Lead converted to Student');
      load();
      if (detailOpen) refreshLead360();
    } else {
      toast.error(res.message || 'Failed');
    }
  };

  const columns: Column<any>[] = [
    { key: 'leadCode', header: 'Lead ID', sortable: true, cell: (r) => <span className="font-mono text-xs">{r.leadCode}</span> },
    { key: 'studentName', header: 'Name', sortable: true, cell: (r) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{r.studentName}</div>
        <div className="text-xs text-muted-foreground">{r.mobile}</div>
      </div>
    ) },
    { key: 'source', header: 'Source', sortable: true, cell: (r) => <Badge variant="outline" className="text-xs">{r.source}</Badge> },
    { key: 'leadType', header: 'Type', cell: (r) => <span className="text-xs">{r.leadType}</span> },
    { key: 'office', header: 'Office', cell: (r) => <span className="text-xs">{r.office?.officeName}</span> },
    { key: 'assignedEmployee', header: 'Assigned To', cell: (r) => <span className="text-xs">{r.assignedEmployee?.name || '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Created', sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span> },
  ];

  const filterDef = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filterStatus || 'all'} onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); table.reset(); }}>
        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Status</SelectItem>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filterSource || 'all'} onValueChange={v => { setFilterSource(v === 'all' ? '' : v); table.reset(); }}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Sources</SelectItem>{LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filterLeadType || 'all'} onValueChange={v => { setFilterLeadType(v === 'all' ? '' : v); table.reset(); }}>
        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Types</SelectItem>{LEAD_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      {(user.roles.includes('Super Admin') || user.roles.includes('Admin') || user.roles.includes('HR')) && (
        <Select value={filterOffice || 'all'} onValueChange={v => { setFilterOffice(v === 'all' ? '' : v); table.reset(); }}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Office" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Offices</SelectItem>{offices.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      )}
      <Select value={filterEmployee || 'all'} onValueChange={v => { setFilterEmployee(v === 'all' ? '' : v); table.reset(); }}>
        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Employee" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Employees</SelectItem>{employees.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Lead Management"
        description="Capture, assign, call, counsel and convert leads into students"
        icon={<UserPlus className="h-5 w-5" />}
        actions={
          <>
            <div className="flex items-center rounded-md border bg-card p-0.5">
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                className="h-8"
                onClick={() => { setViewMode('table'); localStorage.setItem('leads-view-mode', 'table'); }}
              >
                <List className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                className="h-8"
                onClick={() => { setViewMode('kanban'); localStorage.setItem('leads-view-mode', 'kanban'); }}
              >
                <LayoutGrid className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Pipeline</span>
              </Button>
            </div>
            {viewMode === 'table' && selectedLeadIds.length > 0 && (
              <Select onValueChange={(v) => handleBulkAssign(v)}>
                <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder={`Bulk assign ${selectedLeadIds.length}`} /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button onClick={() => { setActionLead(null); setCreateOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Lead
            </Button>
          </>
        }
      />

      {viewMode === 'kanban' ? (
        <LeadKanbanView user={user} onViewLead={(lead) => { if (lead.id === '__list__') { setViewMode('table'); localStorage.setItem('leads-view-mode', 'table'); } else { openLead360(lead); } }} />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          loading={!data.length && table.page === 1}
          search={{ value: table.search, onChange: (v) => { table.setSearch(v); table.reset(); }, placeholder: 'Search by name, mobile, email...' }}
          sortBy={table.sortBy}
          sortDir={table.sortDir}
          onSortChange={(s, d) => { table.setSortBy(s); table.setSortDir(d); table.reset(); }}
          filters={filterDef}
          pagination={{
            page: table.page, pageSize: table.pageSize, total: meta.total, totalPages: meta.totalPages,
            onPageChange: table.setPage, onPageSizeChange: (n) => { table.setPageSize(n); table.reset(); },
          }}
          selectedIds={selectedLeadIds}
          onSelectionChange={setSelectedLeadIds}
          getRowId={(r) => r.id}
          onRowClick={openLead360}
          emptyMessage="No leads found. Create a new lead to get started."
        />
      )}

      {/* Detail Drawer */}
      {detailOpen && selectedLead && (
        <Lead360Drawer
          lead={selectedLead}
          lead360Data={lead360Data}
          loading={lead360Loading}
          onClose={() => { setDetailOpen(false); setSelectedLead(null); setLead360Data(null); }}
          onRefresh={refreshLead360}
          onAssign={() => { setActionLead(selectedLead); setAssignOpen(true); }}
          onCall={() => { setActionLead(selectedLead); setCallOpen(true); }}
          onFollowUp={() => { setActionLead(selectedLead); setFollowUpOpen(true); }}
          onAppointment={() => { setActionLead(selectedLead); setAppointmentOpen(true); }}
          onCounselling={() => { setActionLead(selectedLead); setCounsellingOpen(true); }}
          onConvert={() => handleConvert(selectedLead)}
        />
      )}

      {/* Create Modal */}
      {createOpen && <LeadCreateModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} offices={offices} employees={employees} user={user} duplicateWarn={duplicateWarn} checkDuplicate={checkDuplicate} />}

      {/* Action Modals */}
      {assignOpen && actionLead && <AssignModal open={assignOpen} onOpenChange={setAssignOpen} onSubmit={handleAssign} employees={employees} />}
      {callOpen && actionLead && <CallModal open={callOpen} onOpenChange={setCallOpen} onSubmit={handleCall} />}
      {followUpOpen && actionLead && <FollowUpModal open={followUpOpen} onOpenChange={setFollowUpOpen} onSubmit={handleFollowUp} employees={employees} defaultAssignee={actionLead.assignedEmployeeId} />}
      {appointmentOpen && actionLead && <AppointmentModal open={appointmentOpen} onOpenChange={setAppointmentOpen} onSubmit={handleAppointment} employees={employees} offices={offices} />}
      {counsellingOpen && actionLead && <CounsellingModal open={counsellingOpen} onOpenChange={setCounsellingOpen} onSubmit={handleCounselling} employees={employees} />}
    </div>
  );
}

function Lead360Drawer({ lead, lead360Data, loading, onClose, onRefresh, onAssign, onCall, onFollowUp, onAppointment, onCounselling, onConvert }: any) {
  const displayLead = lead360Data || lead;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-4xl sm:max-w-4xl bg-card shadow-xl overflow-y-auto max-h-screen">
        <div className="sticky top-0 bg-card border-b px-4 sm:px-6 py-3 sm:py-4 z-10 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold truncate">{displayLead.studentName}</h2>
              <StatusBadge status={displayLead.status} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-mono">{displayLead.leadCode}</div>
          </div>
          <Button variant="ghost" onClick={onClose} className="shrink-0">Close</Button>
        </div>

        <div className="p-3 sm:p-6 space-y-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button size="sm" variant="outline" onClick={onAssign}><UserCheck className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Assign</span></Button>
            <Button size="sm" variant="outline" onClick={onCall}><Phone className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Log Call</span></Button>
            <Button size="sm" variant="outline" onClick={onFollowUp}><Calendar className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Follow-up</span></Button>
            <Button size="sm" variant="outline" onClick={onAppointment}><Calendar className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Appointment</span></Button>
            <Button size="sm" variant="outline" onClick={onCounselling}><MessageSquare className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Counselling</span></Button>
            {displayLead.status !== 'Converted' && (
              <Button size="sm" onClick={onConvert}><ArrowRight className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Convert to Student</span></Button>
            )}
          </div>

          {loading ? <Skeleton className="h-64" /> : (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="calls">Calls ({displayLead.calls?.length || 0})</TabsTrigger>
                <TabsTrigger value="counselling">Counselling ({displayLead.counsellingSessions?.length || 0})</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SectionCard title="Personal Details">
                    <div className="grid grid-cols-2 gap-3">
                      <DataItem label="Father" value={displayLead.fatherName} />
                      <DataItem label="Mother" value={displayLead.motherName} />
                      <DataItem label="Mobile" value={displayLead.mobile} />
                      <DataItem label="WhatsApp" value={displayLead.whatsapp} />
                      <DataItem label="Email" value={displayLead.email} />
                      <DataItem label="District" value={displayLead.district} />
                      <DataItem label="Address" value={displayLead.address} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Lead Details">
                    <div className="grid grid-cols-2 gap-3">
                      <DataItem label="Source" value={<Badge variant="outline">{displayLead.source}</Badge>} />
                      <DataItem label="Lead Type" value={displayLead.leadType} />
                      <DataItem label="Office" value={displayLead.office?.officeName} />
                      <DataItem label="Assigned To" value={displayLead.assignedEmployee?.name || 'Unassigned'} />
                      <DataItem label="Qualification" value={displayLead.qualification} />
                      <DataItem label="Passing Year" value={displayLead.passingYear} />
                      <DataItem label="Branch/Trade" value={displayLead.branchTrade} />
                      <DataItem label="Experience" value={displayLead.experience} />
                    </div>
                  </SectionCard>
                </div>
              </TabsContent>
              <TabsContent value="timeline">
                <SectionCard title="Activity Timeline (Immutable)">
                  <Timeline items={(displayLead.activities || []).map((a: any) => ({
                    time: formatDateTime(a.createdAt),
                    title: a.action,
                    description: a.description,
                  }))} />
                </SectionCard>
              </TabsContent>
              <TabsContent value="calls">
                <SectionCard title="Call History">
                  <div className="space-y-2">
                    {(displayLead.calls || []).map((c: any) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 p-3 rounded-md bg-muted/30">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{c.result}</div>
                          <div className="text-xs text-muted-foreground">{c.remarks}</div>
                          <div className="text-xs text-muted-foreground mt-1">{formatDateTime(c.callDate)} · {c.employee?.name}</div>
                        </div>
                        <StatusBadge status={c.result} />
                      </div>
                    ))}
                    {(displayLead.calls || []).length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No calls recorded.</div>}
                  </div>
                </SectionCard>
              </TabsContent>
              <TabsContent value="counselling">
                <SectionCard title="Counselling Sessions">
                  <div className="space-y-3">
                    {(displayLead.counsellingSessions || []).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-md bg-muted/30 space-y-1">
                        <div className="flex justify-between"><span className="font-medium text-sm">Session on {formatDate(c.date)}</span><span className="text-xs text-muted-foreground">{c.counsellor?.name}</span></div>
                        <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div><span className="text-muted-foreground">Qualification:</span> {c.currentQualification}</div>
                          <div><span className="text-muted-foreground">Career Interest:</span> {c.careerInterest}</div>
                          <div><span className="text-muted-foreground">Preferred Course:</span> {c.preferredCourse}</div>
                          <div><span className="text-muted-foreground">Expected Salary:</span> {formatINR(c.expectedSalary)}</div>
                        </div>
                        {c.recommendation && <div className="text-xs mt-1"><span className="text-muted-foreground">Recommendation:</span> {c.recommendation}</div>}
                      </div>
                    ))}
                    {(displayLead.counsellingSessions || []).length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No counselling sessions yet.</div>}
                  </div>
                </SectionCard>
              </TabsContent>
              <TabsContent value="assignments">
                <SectionCard title="Assignment History (Audit)">
                  <div className="space-y-2">
                    {(displayLead.assignments || []).map((a: any) => (
                      <div key={a.id} className="flex items-start justify-between gap-2 p-3 rounded-md bg-muted/30">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{a.employee?.name}</div>
                          <div className="text-xs text-muted-foreground">Reason: {a.assignmentReason || '—'}</div>
                          <div className="text-xs text-muted-foreground">Assigned by: {a.assignedBy?.name || 'System'}</div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">{formatDateTime(a.assignedAt)}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadCreateModal({ open, onOpenChange, onSubmit, offices, employees, user, duplicateWarn, checkDuplicate }: any) {
  const [form, setForm] = useState<any>({ source: 'Website', leadType: 'Coaching', status: 'New' });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Create New Lead" description="Capture lead details — system will check for duplicates" size="lg"
      onSubmit={() => onSubmit(form)}>
      {duplicateWarn.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-amber-800">Possible duplicate detected ({duplicateWarn.length})</div>
            <div className="text-amber-700 mt-1">
              {duplicateWarn.slice(0, 3).map((d: any, i: number) => (
                <div key={i}>• {d.studentName || d.name} · {d.mobile} · {d.studentCode || d.leadCode}</div>
              ))}
            </div>
            <div className="text-amber-600 mt-1">Continue anyway?</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Student Name *</Label><Input value={form.studentName || ''} onChange={e => set('studentName', e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Father's Name</Label><Input value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>Mobile *</Label>
          <Input value={form.mobile || ''} onChange={e => { set('mobile', e.target.value); checkDuplicate(e.target.value, form.whatsapp, form.email); }} required />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp || ''} onChange={e => { set('whatsapp', e.target.value); checkDuplicate(form.mobile, e.target.value, form.email); }} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email || ''} onChange={e => { set('email', e.target.value); checkDuplicate(form.mobile, form.whatsapp, e.target.value); }} />
        </div>
        <div className="space-y-1.5"><Label>District</Label><Input value={form.district || ''} onChange={e => set('district', e.target.value)} /></div>
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
        <div className="space-y-1.5"><Label>Qualification</Label><Input value={form.qualification || ''} onChange={e => set('qualification', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Passing Year</Label><Input value={form.passingYear || ''} onChange={e => set('passingYear', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Branch/Trade</Label><Input value={form.branchTrade || ''} onChange={e => set('branchTrade', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Experience</Label><Input value={form.experience || ''} onChange={e => set('experience', e.target.value)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Address</Label><Textarea value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
        {(user.roles.includes('Super Admin') || user.roles.includes('Admin')) && (
          <div className="space-y-1.5">
            <Label>Office</Label>
            <Select value={form.officeId || user.officeId || 'all'} onValueChange={v => set('officeId', v === 'all' ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Auto (my office)</SelectItem>{offices.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Assign To</Label>
          <Select value={form.assignedEmployeeId || 'none'} onValueChange={v => set('assignedEmployeeId', v === 'none' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{employees.map((e: any) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </FormModal>
  );
}

function AssignModal({ open, onOpenChange, onSubmit, employees }: any) {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Assign Lead" size="sm" onSubmit={() => onSubmit(employeeId, reason)}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Assign To *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>{employees.map((e: any) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Assignment reason..." />
        </div>
      </div>
    </FormModal>
  );
}

function CallModal({ open, onOpenChange, onSubmit }: any) {
  const [form, setForm] = useState<any>({ direction: 'Outbound', result: 'Connected', callDate: new Date().toISOString().slice(0, 16) });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Log Call" size="md" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Direction</Label><Select value={form.direction} onValueChange={v => set('direction', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Outbound">Outbound</SelectItem><SelectItem value="Inbound">Inbound</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Result *</Label><Select value={form.result} onValueChange={v => set('result', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALL_RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Date & Time</Label><Input type="datetime-local" value={form.callDate} onChange={e => set('callDate', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Duration (sec)</Label><Input type="number" value={form.duration || ''} onChange={e => set('duration', parseInt(e.target.value) || 0)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Next Follow-up Date</Label><Input type="date" value={form.nextFollowupDate || ''} onChange={e => set('nextFollowupDate', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}

function FollowUpModal({ open, onOpenChange, onSubmit, employees, defaultAssignee }: any) {
  const [form, setForm] = useState<any>({ priority: 'Medium', assignedToId: defaultAssignee || '', dueDate: new Date().toISOString().slice(0, 10) });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Schedule Follow-up" size="sm" onSubmit={() => onSubmit(form)}>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Assigned To *</Label><Select value={form.assignedToId} onValueChange={v => set('assignedToId', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{employees.map((e: any) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Due Time</Label><Input type="time" value={form.dueTime || ''} onChange={e => set('dueTime', e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Priority</Label><Select value={form.priority} onValueChange={v => set('priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FOLLOWUP_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}

function AppointmentModal({ open, onOpenChange, onSubmit, employees, offices }: any) {
  const [form, setForm] = useState<any>({ type: 'Office Visit', status: 'Scheduled', date: new Date().toISOString().slice(0, 10) });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Book Appointment" size="md" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={v => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPOINTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPOINTMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={form.time || ''} onChange={e => set('time', e.target.value)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Purpose</Label><Input value={form.purpose || ''} onChange={e => set('purpose', e.target.value)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}

function CounsellingModal({ open, onOpenChange, onSubmit, employees }: any) {
  const [form, setForm] = useState<any>({ date: new Date().toISOString().slice(0, 10) });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Record Counselling Session" size="lg" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Current Qualification</Label><Input value={form.currentQualification || ''} onChange={e => set('currentQualification', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Career Interest</Label><Input value={form.careerInterest || ''} onChange={e => set('careerInterest', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Skills</Label><Input value={form.skills || ''} onChange={e => set('skills', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Preferred Course</Label><Input value={form.preferredCourse || ''} onChange={e => set('preferredCourse', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Preferred Location</Label><Input value={form.preferredLocation || ''} onChange={e => set('preferredLocation', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Expected Salary (₹)</Label><Input type="number" value={form.expectedSalary || ''} onChange={e => set('expectedSalary', parseFloat(e.target.value) || 0)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Recommendation</Label><Textarea value={form.recommendation || ''} onChange={e => set('recommendation', e.target.value)} /></div>
        <div className="space-y-1.5 col-span-2"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}
