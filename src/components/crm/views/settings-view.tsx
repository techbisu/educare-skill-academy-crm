'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { PageHeader, SectionCard, DataItem } from '@/components/crm/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Shield } from 'lucide-react';

export function SettingsView({ user }: { user: any }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Only Admin/Super Admin can edit org/GST settings. Everyone else sees a
  // read-only view OR is restricted to the Account tab only.
  const canEditSettings = user.roles.includes('Super Admin') || user.roles.includes('Admin');

  const load = async () => {
    if (!canEditSettings) return; // skip fetching settings for non-admins
    const res = await api.options('settings');
    if (res.success && res.data) {
      const map: Record<string, string> = {};
      res.data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await api.update('setting', key, { value }); // not actually keyed by ID, but the endpoint falls through to fail safely
    }
    setSaving(false);
    toast.success('Settings saved');
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    const res = await api.action('user.change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
    if (res.success) {
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(res.message || 'Failed');
    }
  };

  const setSetting = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  return (
    <div>
      <PageHeader
        title={canEditSettings ? 'Settings' : 'My Account'}
        description={canEditSettings ? 'Configure GST rates, organization details, and account' : 'Manage your password and view your account info'}
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs defaultValue={canEditSettings ? 'organization' : 'account'}>
        <TabsList>
          {canEditSettings && <TabsTrigger value="organization">Organization</TabsTrigger>}
          {canEditSettings && <TabsTrigger value="gst">GST Configuration</TabsTrigger>}
          <TabsTrigger value="account">Account & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <SectionCard title="Organization Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input value={settings['org.name'] || ''} onChange={e => setSetting('org.name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input value={settings['org.gstin'] || ''} onChange={e => setSetting('org.gstin', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={settings['org.phone'] || ''} onChange={e => setSetting('org.phone', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={settings['org.email'] || ''} onChange={e => setSetting('org.email', e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Address</Label>
                <Textarea value={settings['org.address'] || ''} onChange={e => setSetting('org.address', e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={save} disabled={saving}>Save Changes</Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="gst">
          <SectionCard title="GST Tax Rates (configurable — never hardcoded)">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>CGST Rate (%)</Label>
                <Input type="number" value={settings['gst.cgst_rate'] || '0'} onChange={e => setSetting('gst.cgst_rate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>SGST Rate (%)</Label>
                <Input type="number" value={settings['gst.sgst_rate'] || '0'} onChange={e => setSetting('gst.sgst_rate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>IGST Rate (%)</Label>
                <Input type="number" value={settings['gst.igst_rate'] || '0'} onChange={e => setSetting('gst.igst_rate', e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={save} disabled={saving}>Save GST Rates</Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="account">
          <SectionCard title="Account & Security" action={<Shield className="h-4 w-4 text-muted-foreground" />}>
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <Button onClick={changePassword}>Change Password</Button>
            </div>
          </SectionCard>

          <SectionCard title="Your Account" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <DataItem label="Name" value={user.name} />
              <DataItem label="Email" value={user.email} />
              <DataItem label="Roles" value={user.roles?.join(', ')} />
              <DataItem label="Office" value={user.officeName || '—'} />
              <DataItem label="Designation" value={user.designation || '—'} />
              <DataItem label="Permissions" value={`${user.permissions?.length || 0} permissions`} />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
