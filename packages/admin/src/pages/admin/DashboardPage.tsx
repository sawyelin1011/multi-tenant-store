import { FileText, FolderOpen, Image, Users, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard'
import { formatDistance } from 'date-fns'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity()

  const statItems = [
    {
      label: 'Total Content',
      value: stats?.totalContent || 0,
      icon: FileText,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Collections',
      value: stats?.totalCollections || 0,
      icon: FolderOpen,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Media Files',
      value: stats?.totalMedia || 0,
      icon: Image,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content':
        return FileText
      case 'user':
        return Users
      case 'collection':
        return FolderOpen
      case 'media':
        return Image
      default:
        return Activity
    }
  }

  const getActivityBadgeVariant = (action: string) => {
    switch (action) {
      case 'created':
        return 'success'
      case 'updated':
        return 'default'
      case 'deleted':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's what's happening with your CMS.</p>
      </div>

      {statsError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <p className="text-red-400">Failed to load dashboard statistics</p>
          </CardContent>
        </Card>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-white/5 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {statItems.map((stat, index) => (
            <Card key={index} className="hover:border-indigo-500/20 transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm font-medium block mb-1">{stat.label}</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stat.value.toLocaleString()}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityError && <p className="text-red-400 text-sm">Failed to load recent activity</p>}

          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div
                    key={activity.id}
                    className="flex gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex-col sm:flex-row"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium leading-snug">{activity.description}</p>
                        <Badge variant={getActivityBadgeVariant(activity.action)}>{activity.action}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{activity.user.name}</span>
                        <span>•</span>
                        <span>{formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
