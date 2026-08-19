'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { email: 'admin@educare.com', role: 'Super Admin' },
  { email: 'office.admin@educare.com', role: 'Admin' },
  { email: 'caller@educare.com', role: 'Caller' },
  { email: 'counsellor@educare.com', role: 'Counsellor' },
  { email: 'accounts@educare.com', role: 'Accounts' },
  { email: 'placement@educare.com', role: 'Placement Executive' },
  { email: 'trainer@educare.com', role: 'Trainer' },
  { email: 'hr@educare.com', role: 'HR' },
];

export function LoginScreen() {
  const [email, setEmail] = useState('admin@educare.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid credentials');
    } else {
      toast.success('Welcome to Educare CRM');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const quickLogin = (acct: string) => {
    setEmail(acct);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: branding */}
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 text-white p-3">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Educare Skill Academy</h1>
              <p className="text-sm text-muted-foreground">Production CRM Platform</p>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Complete Customer Lifecycle Management</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Lead → Calling → Counselling → Enrollment → Payment</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Batch & Training with Attendance tracking</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> EMI schedules with auto-overdue detection</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Placement pipeline from Job → Interview → Offer → Joining</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Multi-office data isolation with RBAC</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Real-time KPIs computed from backend</li>
            </ul>
          </div>
        </div>

        {/* Right: login card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Use any demo account below to explore role-based access.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Demo Accounts (password: Password@123)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => quickLogin(a.email)}
                    className="text-left px-2.5 py-1.5 rounded-md border text-xs hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{a.role}</div>
                    <div className="text-muted-foreground truncate">{a.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
