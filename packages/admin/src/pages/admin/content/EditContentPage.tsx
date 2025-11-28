import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContentItem, updateContent } from '@/hooks/useContent'
import { useCollections } from '@/hooks/useCollections'
import type { ContentPayload } from '@/types'

export default function EditContentPage() {
  const navigate = useNavigate()
  const params = useParams({ from: '/admin/content/$contentId/edit' })
  const contentId = params.contentId
  const { data: content, isLoading, error } = useContentItem(contentId || null)
  const { data: collectionsData } = useCollections({ limit: 100 })
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ContentPayload | null>(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        slug: content.slug,
        content: content.content,
        status: content.status,
        collectionId: content.collection?.id,
      })
    }
  }, [content])

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault()
    if (!formData || !contentId) return
    setFormError('')
    setIsSaving(true)

    try {
      await updateContent(contentId, { ...formData, status })
      navigate({ to: '/admin/content' })
    } catch (err) {
      setFormError('Failed to update content. Please try again.')
      setIsSaving(false)
    }
  }

  if (!contentId) {
    return <div className="text-white">Invalid content</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Content</h1>
          <p className="text-gray-400 mt-1">Update your content</p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-red-400">Failed to load content</p>
          </CardContent>
        </Card>
      )}

      {isLoading || !formData ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <form className="space-y-6">
          {formError && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <p className="text-red-400">{formError}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="content-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <select
                  id="collection"
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-[#181a25] px-3 py-2 text-sm text-white ring-offset-[#0b0c15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  value={formData.collectionId || ''}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value || undefined })}
                >
                  <option value="">No collection</option>
                  {collectionsData?.data.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link to="/admin/content">
              <Button variant="ghost" disabled={isSaving}>
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={isSaving}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
