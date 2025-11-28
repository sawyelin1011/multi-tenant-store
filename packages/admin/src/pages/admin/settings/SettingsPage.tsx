import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSettings, updateSettings } from '@/hooks/useSettings'
import type { Settings } from '@/types'
import { useThemeManager } from '@/components/theme-provider'

export default function SettingsPage() {
  const { data: settings, isLoading, error, refetch } = useSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState<Settings | null>(null)
  const { themeId, setTheme, themes, registerTheme } = useThemeManager()
  const [newThemeId, setNewThemeId] = useState('')
  const [newThemeLabel, setNewThemeLabel] = useState('')
  const [newThemeHref, setNewThemeHref] = useState('')
  const [themeFormError, setThemeFormError] = useState('')

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSaveError('')
    setSaveSuccess(false)
    setIsSaving(true)

    try {
      await updateSettings(formData)
      refetch()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError('Failed to update settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your CMS configuration</p>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-red-400">Failed to load settings</p>
          </CardContent>
        </Card>
      )}

      {isLoading || !formData ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveError && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <p className="text-red-400">{saveError}</p>
              </CardContent>
            </Card>
          )}

          {saveSuccess && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-green-400">Settings saved successfully!</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic information about your CMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={formData.siteDescription || ''}
                  onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeSelect">Admin Theme</Label>
                <select
                  id="themeSelect"
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-[#181a25] px-3 py-2 text-sm text-white ring-offset-[#0b0c15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  value={themeId}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">Applies instantly in this browser and loads any matching theme CSS file.</p>
              </div>

              <div className="space-y-2 rounded-lg border border-dashed border-white/10 p-4">
                <Label className="text-sm font-semibold text-white">Register Custom Theme</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Identifier (e.g. midnight)"
                    value={newThemeId}
                    onChange={(e) => setNewThemeId(e.target.value.trim().toLowerCase())}
                  />
                  <Input
                    placeholder="Display name"
                    value={newThemeLabel}
                    onChange={(e) => setNewThemeLabel(e.target.value)}
                  />
                  <Input
                    placeholder="/themes/midnight.css"
                    value={newThemeHref}
                    onChange={(e) => setNewThemeHref(e.target.value)}
                  />
                </div>
                {themeFormError && <p className="text-xs text-red-400">{themeFormError}</p>}
                <Button
                  type="button"
                  size="sm"
                  className="bg-indigo-500/80 hover:bg-indigo-500"
                  onClick={() => {
                    if (!newThemeId || !newThemeLabel || !newThemeHref) {
                      setThemeFormError('Provide identifier, label, and CSS path')
                      return
                    }
                    registerTheme({ id: newThemeId, label: newThemeLabel, href: newThemeHref })
                    setThemeFormError('')
                    setNewThemeId('')
                    setNewThemeLabel('')
                    setNewThemeHref('')
                  }}
                >
                  Add Theme
                </Button>
                <p className="text-xs text-gray-500">Theme CSS should define variables scoped by <code>:root[data-theme="your-id"]</code>.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>Control user registration and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableRegistration" className="text-base">
                    Enable Registration
                  </Label>
                  <p className="text-sm text-gray-500">Allow new users to register</p>
                </div>
                <input
                  id="enableRegistration"
                  type="checkbox"
                  checked={formData.enableRegistration}
                  onChange={(e) => setFormData({ ...formData, enableRegistration: e.target.checked })}
                  className="w-5 h-5 rounded border-white/10 bg-[#181a25] text-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default User Role</Label>
                <select
                  id="defaultRole"
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-[#181a25] px-3 py-2 text-sm text-white ring-offset-[#0b0c15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  value={formData.defaultRole}
                  onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Custom CSS and JavaScript</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance" className="text-base">
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-gray-500">Temporarily disable public access</p>
                </div>
                <input
                  id="maintenance"
                  type="checkbox"
                  checked={formData.maintenance}
                  onChange={(e) => setFormData({ ...formData, maintenance: e.target.checked })}
                  className="w-5 h-5 rounded border-white/10 bg-[#181a25] text-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={formData.customCSS || ''}
                  onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                  rows={6}
                  placeholder="/* Add custom CSS here */"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customJS">Custom JavaScript</Label>
                <Textarea
                  id="customJS"
                  value={formData.customJS || ''}
                  onChange={(e) => setFormData({ ...formData, customJS: e.target.value })}
                  rows={6}
                  placeholder="// Add custom JavaScript here"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
