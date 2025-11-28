import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plug, Search, Settings, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlugins, togglePlugin } from '@/hooks/usePlugins'

export default function PluginsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = usePlugins({ page, limit: 20, search })

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await togglePlugin(id, !enabled)
      refetch()
    } catch (err) {
      console.error('Failed to toggle plugin:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Plugins</h1>
          <p className="text-gray-400 mt-2">Extend your CMS functionality</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Installed Plugins</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search plugins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-400 text-sm mb-4">Failed to load plugins</p>}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.data.filter((plugin) => !search || plugin.name.toLowerCase().includes(search.toLowerCase())).map((plugin) => (
                  <Card key={plugin.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Plug className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{plugin.name}</h3>
                              <Badge variant={plugin.enabled ? 'success' : 'secondary'} className="text-xs">
                                {plugin.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">v{plugin.version}</p>
                          </div>
                        </div>
                      </div>

                      {plugin.description && (
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{plugin.description}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant={plugin.enabled ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleToggle(plugin.id, plugin.enabled)}
                          className="flex-1"
                        >
                          <Power className="w-4 h-4 mr-2" />
                          {plugin.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        {plugin.hasSettings && (
                          <Link to="/admin/plugins/$pluginId/settings" params={{ pluginId: plugin.id }}>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} plugins
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Plug className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No plugins installed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
