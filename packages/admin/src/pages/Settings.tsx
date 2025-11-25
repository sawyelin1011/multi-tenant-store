import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { adminConfig } from '@/config/admin.config';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Configure your branding settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input id="appName" defaultValue={adminConfig.branding.appName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" defaultValue={adminConfig.branding.company} />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Manage API connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API Base URL</Label>
              <Input id="apiUrl" defaultValue={adminConfig.api.baseUrl} />
            </div>
            <Button>Update API Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Tenant Management:</strong> {adminConfig.features.enableTenantManagement ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm">
                <strong>Store Management:</strong> {adminConfig.features.enableStoreManagement ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm">
                <strong>Product Management:</strong> {adminConfig.features.enableProductManagement ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm">
                <strong>Analytics:</strong> {adminConfig.features.enableAnalytics ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
