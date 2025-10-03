"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gameWeeksAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Activity,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface AutoJoinJob {
  gameWeekId: string
  nextInvocation: string | null
  status?: 'scheduled' | 'completed'
  executedAt?: string
  results?: {
    success: number
    failed: number
    errors: string[]
  }
  gameWeek?: string
}

interface AutoJoinStatus {
  scheduledJobs: AutoJoinJob[]
}

export function AutoJoinMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  // Fetch auto join status
  const { data: autoJoinStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["auto-join-status"],
    queryFn: () => gameWeeksAPI.getAutoJoinStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
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

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Get game week details for each scheduled job
  const { data: gameWeeksData } = useQuery({
    queryKey: ["game-weeks-for-auto-join"],
    queryFn: () => gameWeeksAPI.getAll({ limit: 100 }),
  })

  const gameWeeks = gameWeeksData?.data?.data || []
  const rawScheduledJobs = autoJoinStatus?.data?.scheduledJobs || []
  
  // Convert raw API response to our interface, handling both old and new formats
  const scheduledJobs: AutoJoinJob[] = rawScheduledJobs.map((job: Record<string, unknown>) => ({
    gameWeekId: job.gameWeekId as string,
    nextInvocation: job.nextInvocation as string | null,
    status: (job.status as 'scheduled' | 'completed') || (job.nextInvocation ? 'scheduled' : 'not-scheduled'),
    executedAt: job.executedAt as string | undefined,
    results: job.results as { success: number; failed: number; errors: string[] } | undefined,
    gameWeek: job.gameWeek as string | undefined
  }))

  // Helper function to get game week details by ID
  const getGameWeekDetails = (gameWeekId: string) => {
    return gameWeeks.find((gw: unknown) => (gw as { _id: string })._id === gameWeekId)
  }

  // Helper function to calculate time until execution
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

  // Helper function to get status badge
  const getStatusBadge = (job: AutoJoinJob) => {
    if (job.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      )
    }
    
    if (!job.nextInvocation) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Not Scheduled
        </span>
      )
    }
    
    const now = new Date()
    const executionTime = new Date(job.nextInvocation)
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Auto-Join Monitor
          </CardTitle>
          <CardDescription>Loading auto-join job status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Auto-Join Monitor
          </CardTitle>
          <CardDescription>Error loading auto-join status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">Failed to load auto-join status</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Auto-Join Monitor
            </CardTitle>
            <CardDescription>
              Monitor scheduled auto-join jobs for game weeks
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => rescheduleMutation.mutate()}
              variant="outline"
              size="sm"
              disabled={rescheduleMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reschedule All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scheduledJobs.length === 0 ? (
          <div className="text-center py-8">
            <Pause className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No auto-join jobs scheduled</p>
            <p className="text-sm text-gray-400 mt-2">
              Auto-join jobs are automatically created when game weeks are created
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {scheduledJobs.map((job, index) => {
                const gameWeek = getGameWeekDetails(job.gameWeekId)
                return (
                  <div
                    key={job.gameWeekId}
                    className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {job.gameWeek || (gameWeek ? (
                              `Game Week ${gameWeek.game_week || 'Unknown'}`
                            ) : (
                              `Game Week ${job.gameWeekId.slice(-8)}`
                            ))}
                          </h4>
                          {getStatusBadge(job)}
                        </div>
                        
                        {(job.status === 'completed' || job.executedAt) ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>
                                  Executed: {job.executedAt ? formatDateTime(job.executedAt) : 'Unknown'}
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>
                                  Success: {job.results?.success || 0}
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 mr-2" />
                                <span>
                                  Failed: {job.results?.failed || 0}
                                </span>
                              </div>
                            </div>
                            
                            {job.results?.errors && job.results.errors.length > 0 && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                <p className="font-medium text-red-800 mb-1">Errors:</p>
                                <ul className="text-red-700 space-y-1">
                                  {job.results.errors.slice(0, 3).map((error: string, idx: number) => (
                                    <li key={idx}>• {error}</li>
                                  ))}
                                  {job.results.errors.length > 3 && (
                                    <li>• ... and {job.results.errors.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>
                                {job.nextInvocation ? formatDateTime(job.nextInvocation) : 'Not scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>
                                {job.nextInvocation ? getTimeUntilExecution(job.nextInvocation) : 'Unknown'}
                              </span>
                            </div>
                            
                            {gameWeek && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <span>
                                  {gameWeek.participants_count || 0} participants
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {gameWeek && !(job.status === 'completed' || job.executedAt) && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Transfer Deadline: {formatDateTime(gameWeek.transfer_deadline)}</p>
                            <p>Purchase Deadline: {formatDateTime(gameWeek.purchase_deadline)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Auto-Join Information:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Auto-join jobs are automatically scheduled when game weeks are created</li>
                    <li>• Jobs execute 2 hours before the transfer deadline by default</li>
                    <li>• Use &quot;Reschedule All&quot; if jobs were lost due to server restart</li>
                    <li>• Status updates every 30 seconds automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
