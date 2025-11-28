import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCollection } from '@/hooks/useCollections'
import { useContent } from '@/hooks/useContent'
import { formatDistance } from 'date-fns'

export default function CollectionDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ from: '/admin/collections/$collectionId' })
  const collectionId = params.collectionId
  const { data: collection, isLoading, error } = useCollection(collectionId || null)
  const { data: collectionContent } = useContent({ collectionId: collectionId || '' })

  if (!collectionId) {
    return <div className="text-white">Collection not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/collections' })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Collection Details</h1>
          <p className="text-gray-400 mt-2">View collection information and content</p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-red-400">Failed to load collection</p>
          </CardContent>
        </Card>
      )}

      {isLoading || !collection ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
                  <p className="text-sm text-gray-400">/{collection.slug}</p>
                </div>
              </div>

              {collection.description && <p className="text-gray-300 text-sm">{collection.description}</p>}

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Content items</span>
                  <span className="text-white font-medium">{collection.contentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{formatDistance(new Date(collection.createdAt), new Date(), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>{formatDistance(new Date(collection.updatedAt), new Date(), { addSuffix: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              {collectionContent && collectionContent.data.length > 0 ? (
                <div className="space-y-3">
                  {collectionContent.data.map((content) => (
                    <Link
                      key={content.id}
                      to="/admin/content/$contentId/edit"
                      params={{ contentId: content.id }}
                      className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{content.title}</h3>
                          <Badge variant="secondary">{content.status}</Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDistance(new Date(content.updatedAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{content.content}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No content items in this collection yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
