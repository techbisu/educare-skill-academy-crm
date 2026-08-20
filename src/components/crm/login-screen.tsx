'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  GraduationCap, Loader2, Lock, Mail, ArrowRight, ShieldCheck, Zap,
  Phone, BookOpen, Users, Trophy, TrendingUp, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { email: 'admin@educare.com', role: 'Super Admin', description: 'Full system access' },
  { email: 'office.admin@educare.com', role: 'Admin', description: 'Business administration' },
  { email: 'hr@educare.com', role: 'HR', description: 'Employees & performance' },
  { email: 'caller@educare.com', role: 'Caller', description: 'Leads & follow-ups' },
  { email: 'counsellor@educare.com', role: 'Counsellor', description: 'Counselling & enrollments' },
  { email: 'accounts@educare.com', role: 'Accounts', description: 'Payments & finance' },
  { email: 'placement@educare.com', role: 'Placement Executive', description: 'Companies & placements' },
  { email: 'trainer@educare.com', role: 'Trainer', description: 'Batches & attendance' },
];

const FEATURES = [
  { icon: Users, title: 'Lead Lifecycle', description: 'Capture, assign, counsel, convert' },
  { icon: BookOpen, title: 'Course Coaching', description: 'B.Tech, Diploma, ITI, Internship' },
  { icon: TrendingUp, title: 'Finance Engine', description: 'Auto EMI, GST invoices, audit trail' },
  { icon: Trophy, title: 'Placement Pipeline', description: 'Interview, offer, joining verified' },
];

export function LoginScreen() {
  const [email, setEmail] = useState('admin@educare.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid credentials. Try a demo account below.');
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: branding / hero */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl -ml-32 -mb-32" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-emerald-300/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl bg-white/15 backdrop-blur p-2.5 shadow-lg ring-1 ring-white/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Educare Skill Academy</h1>
            <p className="text-xs sm:text-sm text-emerald-100">Production CRM Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 my-8 lg:my-0">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur ring-1 ring-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
            <Zap className="h-3 w-3" />
            Complete Customer Lifecycle Management
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
            From <span className="text-emerald-200">Lead</span> to <span className="text-amber-200">Placement</span>,<br />
            all in one place.
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-md leading-relaxed">
            Multi-office CRM with role-based access, backend-computed financials,
            immutable audit trails, and real-time dashboards built for production.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 mb-2 text-emerald-100" />
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-emerald-100/80">{f.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-4 text-xs text-emerald-100/80">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>RBAC + Office isolation</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Audit-ready</span>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="rounded-xl bg-emerald-600 text-white p-2">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-lg">Educare Skill Academy</div>
              <div className="text-xs text-muted-foreground">Production CRM Platform</div>
            </div>
          </div>

          <Card className="shadow-xl border-border/60">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access the CRM.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="you@educare.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <button type="button" className="text-xs text-emerald-600 hover:underline" onClick={() => toast.info('Contact your administrator to reset password.')}>
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-11"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign in <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 pt-5 border-t">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Demo Accounts</div>
                  <div className="text-xs text-muted-foreground">Password: <code className="bg-muted px-1.5 py-0.5 rounded text-emerald-700 font-mono">Password@123</code></div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1 -mr-1">
                  {DEMO_ACCOUNTS.map(a => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => quickLogin(a.email)}
                      className={`text-left px-2.5 py-1.5 rounded-md border text-xs transition-colors ${email === a.email ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:bg-muted'}`}
                    >
                      <div className="font-semibold flex items-center gap-1">
                        {email === a.email && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {a.role}
                      </div>
                      <div className="text-muted-foreground truncate text-[10px]">{a.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to the internal usage policy of Educare Skill Academy.
          </p>
        </div>
      </div>
    </div>
  );
}
