"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gameWeeksAPI } from "@/lib/api"
import { GameWeek } from "@/types"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Activity,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Clock,
  Settings,
  BarChart3,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface AutoJoinLog {
  _id: string
  game_week: string
  game_week_id: string
  executed_at: string
  trigger_type: 'automatic' | 'manual'
  status: 'success' | 'partial' | 'failed'
  successful_joins: number
  failed_joins: number
  already_joined: number
  execution_time_ms: number
  error_details: Array<{
    user_id?: string
    user_name?: string
    user_contact?: string
    error_message: string
  }>
}

interface AutoJoinStatistics {
  total_executions: number
  total_successful: number
  total_partial: number
  total_failed: number
  total_users_joined: number
  average_execution_time: number
}


export default function AutoJoinPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AutoJoinLog | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch auto join status
  const { data: autoJoinStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["auto-join-status"],
    queryFn: () => gameWeeksAPI.getAutoJoinStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch all game weeks for context
  const { data: gameWeeksData } = useQuery({
    queryKey: ["game-weeks-for-auto-join"],
    queryFn: () => gameWeeksAPI.getAll({ limit: 100 }),
  })

  // Fetch auto-join logs
  const { data: logsData } = useQuery({
    queryKey: ["auto-join-logs"],
    queryFn: () => gameWeeksAPI.getAutoJoinLogs({ limit: 50 }),
    refetchInterval: 60000, // Refresh every minute
  })

  // Fetch auto-join statistics
  const { data: statsData } = useQuery({
    queryKey: ["auto-join-statistics"],
    queryFn: () => gameWeeksAPI.getAutoJoinStatistics(),
  })

  // Reschedule all jobs mutation
  const rescheduleMutation = useMutation({
    mutationFn: () => gameWeeksAPI.rescheduleAutoJoinJobs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-join-status"] })
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      alert("Auto-join jobs rescheduled successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error rescheduling auto-join jobs:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error rescheduling auto-join jobs: " + errorMessage)
    },
  })

  // Manual trigger mutation
  const triggerAutoJoinMutation = useMutation({
    mutationFn: (gameWeekId: string) => gameWeeksAPI.triggerAutoJoin(gameWeekId),
    onSuccess: (data) => {
      const results = data.data?.results
      if (results) {
        let message = `Auto-join completed!\n\n✅ Successfully joined: ${results.success}\n❌ Failed: ${results.failed}\n📊 Total processed: ${results.totalProcessed}`
        
        if (results.errors && results.errors.length > 0) {
          message += `\n\n━━━━━━━━━━━━━━━━━━━━━━\n📋 Failed Users Details:\n━━━━━━━━━━━━━━━━━━━━━━\n\n`
          results.errors.forEach((error: string, index: number) => {
            message += `${index + 1}. ${error}\n`
          })
        }
        
        alert(message)
      }
      queryClient.invalidateQueries({ queryKey: ["auto-join-status"] })
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      queryClient.invalidateQueries({ queryKey: ["auto-join-logs"] })
      queryClient.invalidateQueries({ queryKey: ["auto-join-statistics"] })
    },
    onError: (error: unknown) => {
      console.error("Error triggering auto-join:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error triggering auto-join: " + errorMessage)
    },
  })

  const gameWeeks = gameWeeksData?.data?.data || []
  const scheduledJobs = autoJoinStatus?.data?.scheduledJobs || []
  const logs = logsData?.data?.logs || []
  const statistics: AutoJoinStatistics = statsData?.data?.statistics || {
    total_executions: 0,
    total_successful: 0,
    total_partial: 0,
    total_failed: 0,
    total_users_joined: 0,
    average_execution_time: 0,
  }

  // Filter game weeks based on search and status
  const filteredGameWeeks = gameWeeks.filter((gw: GameWeek) => {
    const matchesSearch = gw.game_week?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gw.week_number?.toString().includes(searchTerm) ||
                         gw._id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "scheduled" && scheduledJobs.some(job => job.gameWeekId === gw._id)) ||
                         (statusFilter === "not-scheduled" && !scheduledJobs.some(job => job.gameWeekId === gw._id)) ||
                         (statusFilter === "active" && gw.is_active && !gw.is_done) ||
                         (statusFilter === "completed" && gw.is_done)
    
    return matchesSearch && matchesStatus
  })

  // Helper functions
  const getTimeUntilExecution = (nextInvocation: string | null) => {
    if (!nextInvocation) return "Unknown"
    
    const now = new Date()
    const executionTime = new Date(nextInvocation)
    const diffMs = executionTime.getTime() - now.getTime()
    
    if (diffMs <= 0) return "Overdue"
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ${diffMinutes % 60}m`
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  const getStatusBadge = (nextInvocation: string | null) => {
    if (!nextInvocation) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Not Scheduled
        </span>
      )
    }
    
    const now = new Date()
    const executionTime = new Date(nextInvocation)
    const diffMs = executionTime.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </span>
      )
    } else if (diffMs <= 5 * 60 * 1000) { // 5 minutes
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Soon
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Scheduled
        </span>
      )
    }
  }

  const getGameWeekStatusBadge = (gameWeek: GameWeek) => {
    if (gameWeek.is_done) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      )
    } else if (gameWeek.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Play className="h-3 w-3 mr-1" />
          Active
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="h-3 w-3 mr-1" />
          Draft
        </span>
      )
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading auto-join data</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auto-Join Monitor</h1>
            <p className="text-gray-600">Monitor and manage auto-join jobs for game weeks</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => rescheduleMutation.mutate()}
              variant="outline"
              disabled={rescheduleMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reschedule All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Jobs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledJobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Game Weeks</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameWeeks.filter((gw: GameWeek) => gw.is_active && !gw.is_done).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameWeeks.filter((gw: GameWeek) => gw.is_done).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameWeeks.reduce((sum: number, gw: GameWeek) => sum + (gw.participants_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Game Weeks</CardTitle>
            <CardDescription>Search and filter game weeks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search game weeks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Game Weeks</option>
                <option value="scheduled">Scheduled for Auto-Join</option>
                <option value="not-scheduled">Not Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Game Weeks Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto-Join Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Execution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGameWeeks.map((gameWeek: GameWeek) => {
                    const autoJoinJob = scheduledJobs.find(job => job.gameWeekId === gameWeek._id)
                    return (
                      <tr key={gameWeek._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {gameWeek.game_week ? `Game Week ${gameWeek.game_week}` : 'Unknown Game Week'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {gameWeek._id.slice(-8)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getGameWeekStatusBadge(gameWeek)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(autoJoinJob?.nextInvocation || null)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {autoJoinJob?.nextInvocation ? formatDateTime(autoJoinJob.nextInvocation) : 'Not scheduled'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {autoJoinJob?.nextInvocation ? getTimeUntilExecution(autoJoinJob.nextInvocation) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {gameWeek.participants_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!gameWeek.is_done && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => triggerAutoJoinMutation.mutate(gameWeek._id)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Trigger Auto-Join Now"
                                disabled={triggerAutoJoinMutation.isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Execution History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-2 h-6 w-6" />
              Execution History
            </h2>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_executions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statistics.total_executions > 0 
                    ? Math.round((statistics.total_successful / statistics.total_executions) * 100) 
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users Joined</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_users_joined || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.average_execution_time 
                    ? `${(statistics.average_execution_time / 1000).toFixed(1)}s` 
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Execution Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 50 auto-join executions with detailed results</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Game Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Executed At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trigger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success/Failed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No execution history yet. Auto-join executions will appear here.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: AutoJoinLog) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Game Week {log.game_week}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.game_week_id?.slice?.(-8) || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(log.executed_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.trigger_type === 'automatic' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🤖 Automatic
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                👤 Manual
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.status === 'success' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </span>
                            )}
                            {log.status === 'partial' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Partial
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="text-green-600 font-medium">{log.successful_joins}</span> / 
                              <span className="text-red-600 font-medium ml-1">{log.failed_joins}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.already_joined > 0 && `${log.already_joined} already joined`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(log.execution_time_ms / 1000).toFixed(2)}s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {log.error_details && log.error_details.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log)
                                  setShowErrorModal(true)
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="View Errors"
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                View Errors ({log.error_details.length})
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Details Modal */}
        {showErrorModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
              <CardHeader className="border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Error Details - Game Week {selectedLog.game_week}</CardTitle>
                    <CardDescription>
                      {selectedLog.failed_joins} failed joins • Executed {formatDateTime(selectedLog.executed_at)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowErrorModal(false)
                      setSelectedLog(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto p-6 flex-1">
                <div className="space-y-4">
                  {selectedLog.error_details.map((error, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {error.user_name || 'Unknown User'}
                              </h4>
                              <p className="text-sm text-gray-600">{error.user_contact}</p>
                            </div>
                            {error.user_id && (
                              <span className="text-xs text-gray-500 font-mono">{error.user_id.slice(-8)}</span>
                            )}
                          </div>
                          <p className="text-sm text-red-700 mt-2">
                            <strong>Error:</strong> {error.error_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                <Button
                  onClick={() => {
                    setShowErrorModal(false)
                    setSelectedLog(null)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Auto-Join Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">How Auto-Join Works</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-join jobs are automatically scheduled when game weeks are created</li>
                  <li>• Jobs execute 2 hours before the transfer deadline by default</li>
                  <li>• Only clients with complete teams (15 players) are auto-joined</li>
                  <li>• Clients who already joined are skipped</li>
                  <li>• Jobs are automatically cancelled after execution</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Status Indicators</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <span className="text-green-600">Scheduled</span> - Job is scheduled and waiting</li>
                  <li>• <span className="text-yellow-600">Soon</span> - Job will execute within 5 minutes</li>
                  <li>• <span className="text-red-600">Overdue</span> - Job should have executed already</li>
                  <li>• <span className="text-gray-600">Not Scheduled</span> - No auto-join job for this game week</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
