"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gameWeeksAPI } from "@/lib/api"
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
  Calendar,
  Clock,
  Settings,
  BarChart3,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface AutoJoinJob {
  gameWeekId: string
  nextInvocation: string | null
}

interface AutoJoinStatus {
  scheduledJobs: AutoJoinJob[]
}

interface GameWeek {
  _id: string
  game_week: string
  week_number: number
  transfer_deadline: string
  purchase_deadline: string
  first_match_start_date: string
  last_match_end_date: string
  participants_count: number
  is_done: boolean
  is_active: boolean
  status: string
}

export default function AutoJoinPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
        alert(`Auto-join completed! Success: ${results.success}, Failed: ${results.failed}, Total: ${results.totalProcessed}`)
        if (results.errors.length > 0) {
          console.warn('Auto-join errors:', results.errors)
        }
      }
      queryClient.invalidateQueries({ queryKey: ["auto-join-status"] })
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
    },
    onError: (error: unknown) => {
      console.error("Error triggering auto-join:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error triggering auto-join: " + errorMessage)
    },
  })

  const gameWeeks = gameWeeksData?.data?.data || []
  const scheduledJobs = autoJoinStatus?.data?.scheduledJobs || []

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
  const getGameWeekDetails = (gameWeekId: string) => {
    return gameWeeks.find((gw: GameWeek) => gw._id === gameWeekId)
  }

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
                              {gameWeek.game_week || `Game Week ${gameWeek.week_number}`}
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
