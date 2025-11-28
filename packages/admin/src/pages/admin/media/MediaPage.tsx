import { useState, useRef } from 'react'
import { Upload, Search, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMedia, uploadMedia, deleteMedia } from '@/hooks/useMedia'

export default function MediaPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, error, refetch } = useMedia({ page, limit: 20, search })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      await Promise.all(Array.from(files).map((file) => uploadMedia(file)))
      refetch()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Failed to upload files:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await deleteMedia(id)
      refetch()
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400 mt-2">Manage your files and images</p>
        </div>
        <Button
          className="bg-indigo-500 hover:bg-indigo-600"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Media</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-400 text-sm mb-4">Failed to load media files</p>}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data.data.map((media) => (
                  <div
                    key={media.id}
                    className="group relative aspect-square rounded-xl border border-white/5 bg-white/5 overflow-hidden hover:border-indigo-500/30 transition-all"
                  >
                    {media.mimeType.startsWith('image/') ? (
                      <img
                        src={media.thumbnailUrl || media.url}
                        alt={media.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <ImageIcon className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleDelete(media.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80">
                      <p className="text-xs text-white truncate">{media.originalName}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(media.size)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} files
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
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No media files yet</p>
              <Button
                className="bg-indigo-500 hover:bg-indigo-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload your first file
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
