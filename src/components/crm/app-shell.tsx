'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { NAV_GROUPS } from '@/components/crm/nav-config';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Menu, ChevronDown, LogOut, User, Search, Bell, Sun, Moon, Settings as SettingsIcon, Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

type MeResponse = {
  user: {
    id: string; name: string; email: string; roles: string[]; permissions: string[];
    officeId?: string; officeName?: string; employeeId?: string; designation?: string;
  };
  unreadNotifications: number;
};

export function AppShell({ initialView, onNavigate, children }: {
  initialView: string;
  onNavigate: (view: string) => void;
  children: (props: { view: string; user: MeResponse['user'] | null; officeId?: string }) => React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentView, setCurrentView] = useState(initialView);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (status === 'authenticated') {
      api.me().then(res => { if (res.success && res.data) setMe(res.data as MeResponse); });
    }
  }, [status]);

  // Keep currentView in sync with URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) setCurrentView(hash);
    const onHash = () => setCurrentView(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (view: string) => {
    setCurrentView(view);
    window.location.hash = view;
    onNavigate(view);
    setSidebarOpen(false);
  };

  // Debounced global search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      const res = await api.search(searchQuery);
      if (res.success) setSearchResults(res.data?.results || []);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== 'authenticated' || !session) return null;

  const user = me?.user || (session.user as any);
  const hasPermission = (perm?: string[]) => {
    if (!perm || perm.length === 0) return true;
    if (user.roles.includes('Super Admin')) return true;
    return perm.some(p => user.permissions.includes(p));
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="rounded-lg bg-emerald-600 text-white p-1.5">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">Educare Skill Academy</div>
          <div className="text-xs text-muted-foreground truncate">CRM Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(item => hasPermission(item.permissions));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</div>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.id === 'notifications' && me && me.unreadNotifications > 0 && (
                        <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{me.unreadNotifications}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.roles?.[0]}</div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r bg-card flex-col fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center gap-2 px-3">
          <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9 p-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Global search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads, students, payments, companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(r.entity === 'lead' ? 'leads' : r.entity === 'student' ? 'students' : r.entity); setSearchQuery(''); setSearchResults([]); }}
                    className="w-full flex items-start gap-2 px-3 py-2 hover:bg-muted text-left"
                  >
                    <Badge variant="outline" className="text-xs font-normal">{r.type}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.label}</div>
                      {r.sub && <div className="text-xs text-muted-foreground truncate">{r.sub}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchLoading && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-card border rounded-md shadow-lg px-3 py-2 z-50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {user.officeName && (
              <Badge variant="outline" className="hidden sm:inline-flex text-xs">{user.officeName}</Badge>
            )}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative" onClick={() => navigate('notifications')}>
              <Bell className="h-4 w-4" />
              {me && me.unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('settings')}>
                  <SettingsIcon className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children({ view: currentView, user, officeId: user?.officeId })}
        </main>
      </div>
    </div>
  );
}
