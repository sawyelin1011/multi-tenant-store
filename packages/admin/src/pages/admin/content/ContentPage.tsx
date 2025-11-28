import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useContent, deleteContent } from '@/hooks/useContent'
import { formatDistance } from 'date-fns'

export default function ContentPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useContent({ page, limit: 10, search })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      await deleteContent(id)
      refetch()
    } catch (err) {
      console.error('Failed to delete content:', err)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'warning'
      case 'archived':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Content</h1>
          <p className="text-gray-400 mt-2">Manage your content items</p>
        </div>
        <Link to="/admin/content/create" className="inline-flex">
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            New Content
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Content</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-400 text-sm mb-4">Failed to load content</p>}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3 md:hidden">
                {data.data.map((content) => (
                  <div key={content.id} className="rounded-xl border border-white/5 bg-white/5/10 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white line-clamp-2">{content.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                          <Badge variant={getStatusBadgeVariant(content.status)} className="capitalize text-[11px]">
                            {content.status}
                          </Badge>
                          <span>•</span>
                          <span>{formatDistance(new Date(content.updatedAt), new Date(), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/admin/content/$contentId/edit" params={{ contentId: content.id }}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDelete(content.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Author</span>
                        <span className="text-white">{content.author.name}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Collection</span>
                        {content.collection ? (
                          <Badge variant="secondary" className="text-[11px]">
                            {content.collection.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-xs">No collection</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(content.status)}>{content.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                              {content.author.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{content.author.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {content.collection ? (
                            <Badge variant="secondary">{content.collection.name}</Badge>
                          ) : (
                            <span className="text-gray-500 text-xs">No collection</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatDistance(new Date(content.updatedAt), new Date(), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link to="/admin/content/$contentId/edit" params={{ contentId: content.id }}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleDelete(content.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.meta.totalPages > 1 && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.meta.total)} of {data.meta.total} results
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
              <p className="text-gray-400 mb-4">No content found</p>
              <Link to="/admin/content/create" className="inline-flex">
                <Button className="bg-indigo-500 hover:bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first content
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
