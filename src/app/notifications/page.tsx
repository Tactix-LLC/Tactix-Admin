"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { notificationAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Send, 
  Users, 
  Target, 
  MessageSquare, 
  Settings,
  TestTube,
  BarChart3,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"
import { useUIStore } from "@/lib/store"

interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  category: string
}

interface NotificationStats {
  totalClients: number
  clientsWithTokens: number
  clientsWithoutTokens: number
  scheduledJobs: number
  completedJobs: number
  lastCompletedJob: unknown
}

interface SendNotificationData {
  title: string
  body: string
  data?: Record<string, string>
}

interface SendToUsersData extends SendNotificationData {
  user_ids: string[]
}

interface SendToTopicData extends SendNotificationData {
  topic: string
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'stats' | 'test'>('send')
  const [notificationType, setNotificationType] = useState<'all' | 'users' | 'topic'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  
  // Notification form data
  const [customNotification, setCustomNotification] = useState<SendNotificationData>({
    title: '',
    body: '',
    data: {}
  })
  
  const [usersNotification, setUsersNotification] = useState<SendToUsersData>({
    title: '',
    body: '',
    user_ids: [],
    data: {}
  })
  
  const [topicNotification, setTopicNotification] = useState<SendToTopicData>({
    title: '',
    body: '',
    topic: 'all_users',
    data: {}
  })

  const { addNotification } = useUIStore()

  // Fetch notification statistics
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["notification-stats"],
    queryFn: () => notificationAPI.getNotificationStats(),
  })

  // Fetch notification templates
  const { data: templatesData } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationAPI.getNotificationTemplates(),
  })

  const stats: NotificationStats = statsData?.data || {
    totalClients: 0,
    clientsWithTokens: 0,
    clientsWithoutTokens: 0,
    scheduledJobs: 0,
    completedJobs: 0,
    lastCompletedJob: null
  }

  const templates: NotificationTemplate[] = templatesData?.data?.templates || []

  // Send custom notification mutation
  const sendCustomNotificationMutation = useMutation({
    mutationFn: (data: SendNotificationData) => notificationAPI.sendCustomNotification(data),
    onSuccess: (data) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: `Notification sent successfully! Success: ${data.data?.successCount || 0}, Failed: ${data.data?.failureCount || 0}`
      })
      refetchStats()
    },
    onError: (error: Error) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to send notification'
      })
    }
  })

  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: () => notificationAPI.sendTestNotification(),
    onSuccess: (data) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: `Test notification sent! Success: ${data.data?.successCount || 0}, Failed: ${data.data?.failureCount || 0}`
      })
      refetchStats()
    },
    onError: (error: Error) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to send test notification'
      })
    }
  })

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    if (notificationType === 'all') {
      setCustomNotification({
        title: template.title,
        body: template.body,
        data: {}
      })
    } else if (notificationType === 'users') {
      setUsersNotification({
        title: template.title,
        body: template.body,
        user_ids: [],
        data: {}
      })
    } else if (notificationType === 'topic') {
      setTopicNotification({
        title: template.title,
        body: template.body,
        topic: 'all_users',
        data: {}
      })
    }
  }

  const handleSendNotification = () => {
    if (notificationType === 'all') {
      if (!customNotification.title || !customNotification.body) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Error',
          message: 'Title and body are required'
        })
        return
      }
      sendCustomNotificationMutation.mutate(customNotification)
    }
    // Add handlers for users and topic notifications
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      game_week: 'bg-blue-100 text-blue-800',
      transfer: 'bg-orange-100 text-orange-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      promotion: 'bg-green-100 text-green-800',
      update: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
            <p className="text-gray-600">Send push notifications to your users</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refetchStats()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With FCM Tokens</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.clientsWithTokens}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Jobs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedJobs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="h-4 w-4 inline mr-2" />
              Send Notifications
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TestTube className="h-4 w-4 inline mr-2" />
              Test
            </button>
          </nav>
        </div>

        {/* Send Notifications Tab */}
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Notification Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target Audience</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      variant={notificationType === 'all' ? 'default' : 'outline'}
                      onClick={() => setNotificationType('all')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      All Users
                    </Button>
                    <Button
                      variant={notificationType === 'users' ? 'default' : 'outline'}
                      onClick={() => setNotificationType('users')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Specific Users
                    </Button>
                    <Button
                      variant={notificationType === 'topic' ? 'default' : 'outline'}
                      onClick={() => setNotificationType('topic')}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Topic
                    </Button>
                  </div>
                </div>

                {/* Notification Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={notificationType === 'all' ? customNotification.title : 
                             notificationType === 'users' ? usersNotification.title : 
                             topicNotification.title}
                      onChange={(e) => {
                        if (notificationType === 'all') {
                          setCustomNotification(prev => ({ ...prev, title: e.target.value }))
                        } else if (notificationType === 'users') {
                          setUsersNotification(prev => ({ ...prev, title: e.target.value }))
                        } else if (notificationType === 'topic') {
                          setTopicNotification(prev => ({ ...prev, title: e.target.value }))
                        }
                      }}
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="body">Message *</Label>
                    <textarea
                      id="body"
                      rows={4}
                      className="w-full border rounded-md p-2 mt-1"
                      value={notificationType === 'all' ? customNotification.body : 
                             notificationType === 'users' ? usersNotification.body : 
                             topicNotification.body}
                      onChange={(e) => {
                        if (notificationType === 'all') {
                          setCustomNotification(prev => ({ ...prev, body: e.target.value }))
                        } else if (notificationType === 'users') {
                          setUsersNotification(prev => ({ ...prev, body: e.target.value }))
                        } else if (notificationType === 'topic') {
                          setTopicNotification(prev => ({ ...prev, body: e.target.value }))
                        }
                      }}
                      placeholder="Enter notification message"
                    />
                  </div>

                  {notificationType === 'topic' && (
                    <div>
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={topicNotification.topic}
                        onChange={(e) => setTopicNotification(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="Enter topic name"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendNotification}
                      disabled={sendCustomNotificationMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {sendCustomNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {template.title || 'No title'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {template.body || 'No body'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Test Notification</h4>
                      <p className="text-sm text-yellow-700">
                        Send a test notification to all users with FCM tokens to verify the system is working.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => sendTestNotificationMutation.mutate()}
                    disabled={sendTestNotificationMutation.isPending}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {sendTestNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                  </Button>
                </div>

                {stats.clientsWithTokens === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-red-800">No Users with FCM Tokens</h4>
                        <p className="text-sm text-red-700">
                          No users have registered their FCM tokens yet. Notifications will only be sent to users who have the mobile app and have registered their tokens.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
