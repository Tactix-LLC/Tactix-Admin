"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { notificationAPI, usersAPI } from "@/lib/api"
import { User as UserType } from "@/types"
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
  TestTube,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Search
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'tracking' | 'test'>('send')
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

  // Fetch all notifications for tracking
  const { data: allNotificationsData, refetch: refetchAllNotifications } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: () => notificationAPI.getAllNotifications(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch notification templates
  const { data: templatesData } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: () => notificationAPI.getNotificationTemplates(),
  })

  // Fetch users for user selection (only when "users" notification type is selected)
  const { data: usersData } = useQuery({
    queryKey: ["users-for-notifications"],
    queryFn: async () => {
      const result = await usersAPI.getAll({ limit: 10000 })
      return result.data?.data || []
    },
    enabled: notificationType === 'users', // Only fetch when "users" type is selected
  })

  const [userSearchTerm, setUserSearchTerm] = useState("")
  const allUsers: UserType[] = usersData || []
  const filteredUsers = allUsers.filter((user) => {
    const searchLower = userSearchTerm.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    )
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

  // Send notification to specific users mutation
  const sendNotificationToUsersMutation = useMutation({
    mutationFn: (data: SendToUsersData) => notificationAPI.sendNotificationToUsers(data),
    onSuccess: (data) => {
      const successCount = data.data?.successCount || 0
      const failureCount = data.data?.failureCount || 0
      const totalUsers = data.data?.totalUsers || 0
      
      if (successCount === 0 && failureCount === 0) {
        // No notifications were sent
        addNotification({
          id: Date.now().toString(),
          type: 'warning',
          title: 'No Notifications Sent',
          message: data.message || 'None of the selected users have FCM tokens registered or are in a different environment. Make sure users have the app installed and have logged in.'
        })
      } else {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Success',
          message: `Notification sent successfully! Success: ${successCount}, Failed: ${failureCount} (out of ${totalUsers} eligible users)`
        })
        // Clear selected users only on success
        setUsersNotification(prev => ({ ...prev, user_ids: [] }))
      }
      refetchStats()
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to send notification'
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
    } else if (notificationType === 'users') {
      if (!usersNotification.title || !usersNotification.body) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Error',
          message: 'Title and body are required'
        })
        return
      }
      if (!usersNotification.user_ids || usersNotification.user_ids.length === 0) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Error',
          message: 'Please select at least one user'
        })
        return
      }
      
      // Check if any selected users can receive notifications
      const selectedUsers = allUsers.filter(user => usersNotification.user_ids?.includes(user._id))
      const eligibleUsers = selectedUsers.filter(user => user.canReceiveNotifications === true)
      
      if (eligibleUsers.length === 0) {
        addNotification({
          id: Date.now().toString(),
          type: 'warning',
          title: 'Warning',
          message: `None of the ${selectedUsers.length} selected user(s) can receive notifications. They may not have FCM tokens registered or are in a different environment. Do you want to send anyway?`,
        })
        // Still allow sending - the backend will handle it properly
      }
      
      sendNotificationToUsersMutation.mutate(usersNotification)
    } else if (notificationType === 'topic') {
      // Handle topic notifications if needed
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Topic notifications are not yet implemented'
      })
    }
  }

  const handleUserToggle = (userId: string) => {
    setUsersNotification(prev => {
      const userIds = prev.user_ids || []
      const isSelected = userIds.includes(userId)
      return {
        ...prev,
        user_ids: isSelected
          ? userIds.filter(id => id !== userId)
          : [...userIds, userId]
      }
    })
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
              onClick={() => setActiveTab('tracking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tracking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Tracking
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

                  {notificationType === 'users' && (
                    <div>
                      <Label>Select Users ({usersNotification.user_ids?.length || 0} selected)</Label>
                      
                      {/* Search input */}
                      <div className="relative mt-2 mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search users by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* User list with checkboxes */}
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                        {filteredUsers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {userSearchTerm ? 'No users found' : 'Loading users...'}
                          </p>
                        ) : (
                          filteredUsers.map((user) => {
                            const isSelected = usersNotification.user_ids?.includes(user._id) || false
                            return (
                              <div
                                key={user._id}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => handleUserToggle(user._id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleUserToggle(user._id)}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                  {user.canReceiveNotifications !== undefined && (
                                    <div className="text-xs mt-1">
                                      {user.canReceiveNotifications ? (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          <Bell className="w-3 h-3 mr-1 inline" />
                                          Can receive
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                                          <X className="w-3 h-3 mr-1 inline" />
                                          Cannot receive
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {usersNotification.user_ids && usersNotification.user_ids.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {usersNotification.user_ids.length} user(s) selected
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendNotification}
                      disabled={
                        sendCustomNotificationMutation.isPending || 
                        sendNotificationToUsersMutation.isPending
                      }
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {(sendCustomNotificationMutation.isPending || sendNotificationToUsersMutation.isPending) 
                        ? 'Sending...' 
                        : 'Send Notification'}
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

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notification Tracking</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAllNotifications()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {allNotificationsData?.data?.notifications && allNotificationsData.data.notifications.length > 0 ? (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-blue-600">{allNotificationsData.data.scheduled}</div>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-yellow-600">{allNotificationsData.data.pending}</div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">{allNotificationsData.data.completed}</div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Notifications Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game Week</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule/Execute Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Deadline</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {allNotificationsData.data.notifications.map((notification) => {
                            const formatDate = (dateStr: string | null) => {
                              if (!dateStr) return 'N/A';
                              return new Date(dateStr).toLocaleString();
                            };

                            const formatTimeUntil = (minutes: number | null) => {
                              if (minutes === null) return 'N/A';
                              if (minutes < 0) return 'Overdue';
                              if (minutes < 60) return `${Math.round(minutes)} min`;
                              const hours = Math.floor(minutes / 60);
                              const mins = Math.round(minutes % 60);
                              return `${hours}h ${mins}m`;
                            };

                            const getStatusBadge = (status: string) => {
                              switch (status) {
                                case 'scheduled':
                                  return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
                                case 'pending':
                                  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
                                case 'completed':
                                  return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
                                default:
                                  return <Badge>{status}</Badge>;
                              }
                            };

                            return (
                              <tr key={notification.gameWeekId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{notification.gameWeek}</div>
                                  <div className="text-xs text-gray-500">{notification.gameWeekId.slice(-8)}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {getStatusBadge(notification.status)}
                                  {notification.status === 'scheduled' && notification.timeUntilNotification !== null && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatTimeUntil(notification.timeUntilNotification)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {notification.status === 'completed' && notification.executedAt ? (
                                    <div>
                                      <div>{formatDate(typeof notification.executedAt === 'string' ? notification.executedAt : notification.executedAt.toString())}</div>
                                    </div>
                                  ) : notification.nextInvocation ? (
                                    <div>
                                      <div>{formatDate(notification.nextInvocation)}</div>
                                    </div>
                                  ) : (
                                    'N/A'
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(notification.transferDeadline)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {notification.successCount !== null ? (
                                    <span className="text-green-600 font-medium">{notification.successCount}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {notification.failureCount !== null ? (
                                    <span className="text-red-600 font-medium">{notification.failureCount}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {notification.totalUsers !== null ? notification.totalUsers : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No notifications found</p>
                    <p className="text-sm mt-2">Scheduled notifications will appear here once game weeks are created</p>
                  </div>
                )}
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
