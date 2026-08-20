'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { DataTable, useTableState, type Column } from '@/components/crm/data-table';
import { PageHeader, SectionCard, DataItem, formatINR, formatDate, formatDateTime } from '@/components/crm/layout';
import { StatusBadge } from '@/components/crm/status-badge';
import { FormModal } from '@/components/crm/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { STUDENT_STATUSES, COURSE_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import { Users, Plus, GraduationCap, Wallet, FileText, Briefcase, FileSignature, Building2 } from 'lucide-react';

export function StudentsView({ user }: { user: any }) {
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [student360Data, setStudent360Data] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [actionStudent, setActionStudent] = useState<any>(null);

  const table = useTableState({ pageSize: 20, sortBy: 'createdAt', sortDir: 'desc' });
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOffice, setFilterOffice] = useState('');

  const load = useCallback(async () => {
    const params: Record<string, any> = {
      page: table.page, pageSize: table.pageSize, search: table.search,
      sortBy: table.sortBy, sortDir: table.sortDir,
    };
    if (filterStatus) params.status = filterStatus;
    if (filterOffice) params.officeId = filterOffice;
    const res = await api.list('student', params);
    if (res.success && res.data) {
      setData(res.data);
      if (res.meta) setMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
    }
  }, [table.page, table.pageSize, table.search, table.sortBy, table.sortDir, filterStatus, filterOffice]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.options('courses').then(res => { if (res.success && res.data) setCourses(res.data); });
    api.options('batches').then(res => { if (res.success && res.data) setBatches(res.data); });
    api.options('offices').then(res => { if (res.success && res.data) setOffices(res.data); });
    api.options('employees').then(res => { if (res.success && res.data) setEmployees(res.data); });
  }, []);

  const open360 = async (s: any) => {
    setSelected(s); setDetailOpen(true); setLoading360(true);
    const res = await api.student360(s.id);
    if (res.success && res.data) setStudent360Data(res.data);
    setLoading360(false);
  };
  const refresh360 = async () => {
    if (!selected) return;
    const res = await api.student360(selected.id);
    if (res.success && res.data) { setStudent360Data(res.data); setSelected(res.data); }
  };

  const handleCreate = async (form: any) => {
    const officeId = form.officeId || user.officeId;
    const res = await api.create('student', { ...form, officeId });
    if (res.success) { toast.success('Student created'); setCreateOpen(false); load(); }
    else toast.error(res.message || 'Failed');
  };

  const handleEnroll = async (form: any) => {
    if (!actionStudent) return;
    const res = await api.action('student.enroll', { studentId: actionStudent.id, ...form });
    if (res.success) { toast.success('Enrollment created'); setEnrollOpen(false); refresh360(); load(); }
    else toast.error(res.message || 'Failed');
  };

  const handlePay = async (form: any) => {
    if (!actionStudent) return;
    const res = await api.action('enrollment.add-payment', { enrollmentId: form.enrollmentId, amount: parseFloat(form.amount), paymentMode: form.paymentMode, referenceNo: form.referenceNo, remarks: form.remarks });
    if (res.success) { toast.success('Payment recorded — financials auto-updated'); setPayOpen(false); refresh360(); load(); }
    else toast.error(res.message || 'Failed');
  };

  const columns: Column<any>[] = [
    { key: 'studentCode', header: 'Student ID', sortable: true, cell: r => <span className="font-mono text-xs">{r.studentCode}</span> },
    { key: 'name', header: 'Name', sortable: true, cell: r => (
      <div className="min-w-0">
        <div className="font-medium truncate">{r.name}</div>
        <div className="text-xs text-muted-foreground">{r.mobile}</div>
      </div>
    ) },
    { key: 'qualification', header: 'Qualification', cell: r => <span className="text-xs">{r.qualification || '—'}</span> },
    { key: 'office', header: 'Office', cell: r => <span className="text-xs">{r.office?.officeName}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: r => <StatusBadge status={r.status} /> },
    { key: '_count', header: 'Services', cell: r => <div className="flex gap-1 text-xs">
      {r._count?.enrollments ? <Badge variant="outline" className="text-xs">E: {r._count.enrollments}</Badge> : null}
      {r._count?.payments ? <Badge variant="outline" className="text-xs">P: {r._count.payments}</Badge> : null}
      {r._count?.jobApplications ? <Badge variant="outline" className="text-xs">J: {r._count.jobApplications}</Badge> : null}
    </div> },
    { key: 'createdAt', header: 'Created', sortable: true, cell: r => <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Student Management"
        description="Complete Student 360° view: enrollments, payments, EMI, documents, placements"
        icon={<Users className="h-5 w-5" />}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Student</Button>}
      />

      <DataTable
        data={data}
        columns={columns}
        loading={!data.length && table.page === 1}
        search={{ value: table.search, onChange: v => { table.setSearch(v); table.reset(); }, placeholder: 'Search by name, mobile, code...' }}
        sortBy={table.sortBy} sortDir={table.sortDir} onSortChange={(s, d) => { table.setSortBy(s); table.setSortDir(d); table.reset(); }}
        filters={
          <div className="flex items-center gap-2">
            <Select value={filterStatus || 'all'} onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); table.reset(); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{STUDENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            {(user.roles.includes('Super Admin') || user.roles.includes('Admin')) && (
              <Select value={filterOffice || 'all'} onValueChange={v => { setFilterOffice(v === 'all' ? '' : v); table.reset(); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Office" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Offices</SelectItem>{offices.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        }
        pagination={{
          page: table.page, pageSize: table.pageSize, total: meta.total, totalPages: meta.totalPages,
          onPageChange: table.setPage, onPageSizeChange: n => { table.setPageSize(n); table.reset(); },
        }}
        onRowClick={open360}
        emptyMessage="No students found."
      />

      {detailOpen && selected && (
        <Student360Drawer
          student={student360Data || selected}
          loading={loading360}
          onClose={() => { setDetailOpen(false); setSelected(null); setStudent360Data(null); }}
          onRefresh={refresh360}
          onEnroll={() => { setActionStudent(student360Data || selected); setEnrollOpen(true); }}
          onPay={() => { setActionStudent(student360Data || selected); setPayOpen(true); }}
          courses={courses}
          batches={batches}
          employees={employees}
        />
      )}

      {createOpen && <StudentCreateModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} offices={offices} user={user} />}
      {enrollOpen && actionStudent && <EnrollModal open={enrollOpen} onOpenChange={setEnrollOpen} onSubmit={handleEnroll} courses={courses} batches={batches} employees={employees} />}
      {payOpen && actionStudent && <PaymentModal open={payOpen} onOpenChange={setPayOpen} onSubmit={handlePay} student={actionStudent} />}
    </div>
  );
}

function Student360Drawer({ student, loading, onClose, onRefresh, onEnroll, onPay, courses, batches, employees }: any) {
  const s = student;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-5xl bg-card shadow-xl overflow-y-auto max-h-screen">
        <div className="sticky top-0 bg-card border-b px-4 sm:px-6 py-3 sm:py-4 z-10 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold truncate">{s.name}</h2>
              <StatusBadge status={s.status} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-mono">{s.studentCode} · {s.office?.officeName}</div>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={onEnroll}><GraduationCap className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Enroll</span></Button>
            <Button size="sm" variant="outline" onClick={onPay}><Wallet className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Payment</span></Button>
            <Button variant="ghost" onClick={onClose} className="px-2">Close</Button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4">
          {loading ? <div className="text-center py-12">Loading...</div> : (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments ({s.enrollments?.length || 0})</TabsTrigger>
                <TabsTrigger value="payments">Payments ({s.payments?.length || 0})</TabsTrigger>
                <TabsTrigger value="college">College ({s.collegeApplications?.length || 0})</TabsTrigger>
                <TabsTrigger value="jobs">Jobs ({s.jobApplications?.length || 0})</TabsTrigger>
                <TabsTrigger value="placement">Placement ({s.placements?.length || 0})</TabsTrigger>
                <TabsTrigger value="docs">Docs ({s.documents?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-4">
                  <SectionCard title="Personal Details">
                    <div className="grid grid-cols-2 gap-3">
                      <DataItem label="Father" value={s.fatherName} />
                      <DataItem label="Mother" value={s.motherName} />
                      <DataItem label="Mobile" value={s.mobile} />
                      <DataItem label="WhatsApp" value={s.whatsapp} />
                      <DataItem label="Email" value={s.email} />
                      <DataItem label="DOB" value={formatDate(s.dob)} />
                      <DataItem label="Gender" value={s.gender} />
                      <DataItem label="Address" value={s.address} />
                    </div>
                  </SectionCard>
                  <SectionCard title="Academic & Office">
                    <div className="grid grid-cols-2 gap-3">
                      <DataItem label="Qualification" value={s.qualification} />
                      <DataItem label="Passing Year" value={s.passingYear} />
                      <DataItem label="Branch" value={s.branch} />
                      <DataItem label="Experience" value={s.experience} />
                      <DataItem label="Office" value={s.office?.officeName} />
                      <DataItem label="Lead Source" value={s.lead ? `${s.lead.leadCode} (${s.lead.source})` : 'Direct'} />
                    </div>
                  </SectionCard>
                </div>
              </TabsContent>

              <TabsContent value="enrollments">
                <div className="space-y-3">
                  {(s.enrollments || []).map((e: any) => (
                    <SectionCard key={e.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{e.enrollmentCode}</div>
                          <div className="text-xs text-muted-foreground">{e.course?.courseName}</div>
                          <div className="text-xs text-muted-foreground">Enrolled: {formatDate(e.enrollmentDate)}</div>
                        </div>
                        <StatusBadge status={e.paymentStatus} />
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                        <DataItem label="Total Fee" value={formatINR(e.totalFee)} />
                        <DataItem label="Discount" value={formatINR(e.discount)} />
                        <DataItem label="Paid" value={formatINR(e.paidAmount)} />
                        <DataItem label="Due" value={formatINR(e.dueAmount)} />
                      </div>
                      {e.batch && <div className="text-xs mt-2"><span className="text-muted-foreground">Batch:</span> {e.batch.batchCode}</div>}
                    </SectionCard>
                  ))}
                  {(s.enrollments || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No enrollments yet.</div>}
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="space-y-2">
                  {(s.payments || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/30">
                      <div>
                        <div className="font-mono text-xs">{p.receiptNo}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(p.paymentDate)} · {p.paymentMode}</div>
                        {p.enrollment && <div className="text-xs text-muted-foreground">Enrollment: {p.enrollment.enrollmentCode}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700">{formatINR(p.amount)}</div>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                  {(s.payments || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No payments yet.</div>}
                </div>
              </TabsContent>

              <TabsContent value="college">
                <div className="space-y-3">
                  {(s.collegeApplications || []).map((c: any) => (
                    <SectionCard key={c.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{c.applicationCode}</div>
                          <div className="text-xs text-muted-foreground">{c.college?.collegeName} · {c.branch}</div>
                          <div className="text-xs text-muted-foreground">Year: {c.admissionYear}</div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.semesterPayments?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Semester Payments</div>
                          {c.semesterPayments.map((sp: any) => (
                            <div key={sp.id} className="flex justify-between text-xs py-1 border-t">
                              <span>{sp.semesterName}</span>
                              <span>{formatINR(sp.paidAmount)} / {formatINR(sp.totalFee)} <StatusBadge status={sp.status} /></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  ))}
                  {(s.collegeApplications || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No college applications.</div>}
                </div>
              </TabsContent>

              <TabsContent value="jobs">
                <div className="space-y-2">
                  {(s.jobApplications || []).map((j: any) => (
                    <div key={j.id} className="p-3 rounded-md bg-muted/30">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium text-sm">{j.job?.jobTitle || 'Job'}</div>
                          <div className="text-xs text-muted-foreground">{j.company?.companyName}</div>
                          <div className="text-xs text-muted-foreground">Applied: {formatDate(j.appliedDate)}</div>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                      {j.interviews?.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Interviews: </span>
                          {j.interviews.map((iv: any) => <Badge key={iv.id} variant="outline" className="text-xs mr-1">Round {iv.round}: {iv.result || 'Pending'}</Badge>)}
                        </div>
                      )}
                    </div>
                  ))}
                  {(s.jobApplications || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No job applications.</div>}
                </div>
              </TabsContent>

              <TabsContent value="placement">
                <div className="space-y-2">
                  {(s.placements || []).map((p: any) => (
                    <div key={p.id} className="p-3 rounded-md bg-muted/30">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium text-sm">{p.placementCode}</div>
                          <div className="text-xs text-muted-foreground">{p.company?.companyName}</div>
                          {p.designation && <div className="text-xs">Designation: {p.designation}</div>}
                          {p.salary && <div className="text-xs">Salary: {formatINR(p.salary)}</div>}
                          {p.joiningDate && <div className="text-xs">Joining: {formatDate(p.joiningDate)}</div>}
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                  {(s.placements || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No placement records.</div>}
                </div>
              </TabsContent>

              <TabsContent value="docs">
                <div className="space-y-2">
                  {(s.documents || []).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                      <div>
                        <div className="font-medium text-sm">{d.documentType}</div>
                        <div className="text-xs text-muted-foreground">{d.fileName} · {formatDate(d.uploadedAt)}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                  {(s.documents || []).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No documents uploaded.</div>}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentCreateModal({ open, onOpenChange, onSubmit, offices, user }: any) {
  const [form, setForm] = useState<any>({ status: 'Active', gender: 'Male' });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Create Student" size="lg" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Mobile *</Label><Input value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Father's Name</Label><Input value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Mother's Name</Label><Input value={form.motherName || ''} onChange={e => set('motherName', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>DOB</Label><Input type="date" value={form.dob || ''} onChange={e => set('dob', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Gender</Label><Select value={form.gender} onValueChange={v => set('gender', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Qualification</Label><Input value={form.qualification || ''} onChange={e => set('qualification', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Passing Year</Label><Input value={form.passingYear || ''} onChange={e => set('passingYear', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Branch</Label><Input value={form.branch || ''} onChange={e => set('branch', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Experience</Label><Input value={form.experience || ''} onChange={e => set('experience', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>District</Label><Input value={form.district || ''} onChange={e => set('district', e.target.value)} /></div>
        {(user.roles.includes('Super Admin') || user.roles.includes('Admin')) && (
          <div className="space-y-1.5"><Label>Office</Label><Select value={form.officeId || user.officeId || 'all'} onValueChange={v => set('officeId', v === 'all' ? undefined : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Auto</SelectItem>{offices.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
        )}
        <div className="space-y-1.5 col-span-2"><Label>Address</Label><Textarea value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}

function EnrollModal({ open, onOpenChange, onSubmit, courses, batches, employees }: any) {
  const [form, setForm] = useState<any>({});
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const selectedCourse = courses.find((c: any) => c.value === form.courseId);
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Create Enrollment" size="md" onSubmit={() => onSubmit(form)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2"><Label>Course *</Label><Select value={form.courseId || ''} onValueChange={v => { set('courseId', v); set('totalFee', courses.find((c: any) => c.value === v)?.fee || 0); }}><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Total Fee (₹)</Label><Input type="number" value={form.totalFee || 0} onChange={e => set('totalFee', parseFloat(e.target.value) || 0)} /></div>
        <div className="space-y-1.5"><Label>Discount (₹)</Label><Input type="number" value={form.discount || 0} onChange={e => set('discount', parseFloat(e.target.value) || 0)} /></div>
        <div className="space-y-1.5 col-span-2 text-xs bg-blue-50 p-2 rounded">Final Fee = Total − Discount = <strong>₹{(form.totalFee || 0) - (form.discount || 0)}</strong> (computed on backend)</div>
        <div className="space-y-1.5"><Label>Batch</Label><Select value={form.batchId || 'none'} onValueChange={v => set('batchId', v === 'none' ? undefined : v)}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{batches.map((b: any) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Counsellor</Label><Select value={form.counsellorId || 'none'} onValueChange={v => set('counsellorId', v === 'none' ? undefined : v)}><SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger><SelectContent><SelectItem value="none">Auto</SelectItem>{employees.map((e: any) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5 col-span-2"><Label>Generate EMI?</Label><Select value={form.generateEmi ? 'yes' : 'no'} onValueChange={v => set('generateEmi', v === 'yes')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent></Select></div>
        {form.generateEmi && <div className="space-y-1.5 col-span-2"><Label>EMI Installments</Label><Input type="number" value={form.emiInstallments || 5} onChange={e => set('emiInstallments', parseInt(e.target.value) || 5)} /></div>}
        <div className="space-y-1.5 col-span-2"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
      </div>
    </FormModal>
  );
}

function PaymentModal({ open, onOpenChange, onSubmit, student }: any) {
  const [form, setForm] = useState<any>({ paymentMode: 'Cash' });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const enrollments = student.enrollments || [];
  return (
    <FormModal open={open} onOpenChange={onOpenChange} title="Record Payment" size="md" onSubmit={() => onSubmit(form)}>
      <div className="space-y-3">
        {enrollments.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No enrollments found. Please enroll first.</div>
        ) : (
          <>
            <div className="space-y-1.5"><Label>Enrollment *</Label><Select value={form.enrollmentId || ''} onValueChange={v => set('enrollmentId', v)}><SelectTrigger><SelectValue placeholder="Select enrollment" /></SelectTrigger><SelectContent>{enrollments.map((e: any) => {
              const due = (e.finalFee || 0) - (e.paidAmount || 0);
              return <SelectItem key={e.id} value={e.id}>{e.enrollmentCode} · Due: ₹{due}</SelectItem>;
            })}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount || ''} onChange={e => set('amount', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Mode</Label><Select value={form.paymentMode} onValueChange={v => set('paymentMode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Card">Card</SelectItem><SelectItem value="Cheque">Cheque</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Reference No</Label><Input value={form.referenceNo || ''} onChange={e => set('referenceNo', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)} /></div>
            <div className="text-xs bg-emerald-50 p-2 rounded">After saving, enrollment financials will be auto-recomputed (backend-computed, single source of truth).</div>
          </>
        )}
      </div>
    </FormModal>
  );
}
