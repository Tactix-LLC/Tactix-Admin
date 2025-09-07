"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gameWeeksAPI, seasonsAPI, competitionsAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { gameWeekStatusOptions } from "@/lib/constants"
import { GameWeek, CreateGameWeekData, UpdateGameWeekDeadlinesData } from "@/types"
import { AutoJoinMonitor } from "@/components/auto-join-monitor"

export default function GameWeeksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [showJoinedUsersModal, setShowJoinedUsersModal] = useState(false)
  const [editingGameWeek, setEditingGameWeek] = useState<GameWeek | null>(null)
  const [selectedGameWeekForUsers, setSelectedGameWeekForUsers] = useState<GameWeek | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateGameWeekData>({
    game_week: "",
    season_id: "",
    competition_id: "",
    is_free: false
  })
  const [deadlineFormData, setDeadlineFormData] = useState<UpdateGameWeekDeadlinesData>({
    transfer_deadline: "",
    purchase_deadline: "",
    first_match_start_date: "",
    last_match_end_date: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const { data: gameWeeksData, isLoading, error } = useQuery({
    queryKey: ["game-weeks", currentPage, pageSize, searchTerm, statusFilter],
    queryFn: () => gameWeeksAPI.getAll({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  })

  // Fetch seasons and competitions for the form
  const { data: seasonsData } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonsAPI.getAll({ limit: 100 }),
  })

  const { data: competitionsData } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => competitionsAPI.getAll({ limit: 100 }),
  })

  const deleteGameWeekMutation = useMutation({
    mutationFn: gameWeeksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
    },
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => gameWeeksAPI.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
    },
  })

  const createGameWeekMutation = useMutation({
    mutationFn: gameWeeksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      setShowCreateModal(false)
      resetForm()
      alert("Game week created successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error creating game week:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error creating game week: " + errorMessage)
    },
  })

  const updateDeadlinesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGameWeekDeadlinesData }) => 
      gameWeeksAPI.updateDeadlines(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      setShowDeadlineModal(false)
      setEditingGameWeek(null)
      resetDeadlineForm()
      alert("Game week deadlines updated successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error updating deadlines:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error updating deadlines: " + errorMessage)
    },
  })

  const fetchPlayerStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 [ADMIN] Fetching player stats for game week:', id)
      try {
        const response = await gameWeeksAPI.fetchPlayerStats(id)
        console.log('✅ [ADMIN] Fetch player stats response:', response)
        return response
      } catch (error) {
        console.error('❌ [ADMIN] Fetch player stats error:', error)
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown; status?: number } }
          console.error('❌ [ADMIN] Error response data:', axiosError.response?.data)
          console.error('❌ [ADMIN] Error status:', axiosError.response?.status)
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      alert("Player stats fetched successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error fetching player stats:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      let detailedMessage = errorMessage
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: { statusCode?: number } } } }
        const responseData = axiosError.response?.data
        if (responseData?.message) {
          detailedMessage = `${responseData.message}`
        }
        if (responseData?.error?.statusCode) {
          detailedMessage += ` (Status: ${responseData.error.statusCode})`
        }
      }
      alert("Error fetching player stats: " + detailedMessage)
    },
  })

  const markDoneMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 [ADMIN] Marking game week as done:', id)
      try {
        const response = await gameWeeksAPI.markDone(id, true)
        console.log('✅ [ADMIN] Mark done response:', response)
        return response
      } catch (error) {
        console.error('❌ [ADMIN] Mark done error:', error)
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown; status?: number } }
          console.error('❌ [ADMIN] Error response data:', axiosError.response?.data)
          console.error('❌ [ADMIN] Error status:', axiosError.response?.status)
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
      alert("Game week marked as done. Point calculation will continue in background.")
    },
    onError: (error: unknown) => {
      console.error("Error marking as done:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      let detailedMessage = errorMessage
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: { statusCode?: number } } } }
        const responseData = axiosError.response?.data
        if (responseData?.message) {
          detailedMessage = `${responseData.message}`
        }
        if (responseData?.error?.statusCode) {
          detailedMessage += ` (Status: ${responseData.error.statusCode})`
        }
      }
      alert("Error marking as done: " + detailedMessage)
    },
  })

  // Auto-join mutations
  const triggerAutoJoinMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 [ADMIN] Triggering auto-join for game week:', id)
      try {
        const response = await gameWeeksAPI.triggerAutoJoin(id)
        console.log('✅ [ADMIN] Trigger auto-join response:', response)
        return response
      } catch (error) {
        console.error('❌ [ADMIN] Trigger auto-join error:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      const results = data.data?.results
      if (results) {
        alert(`Auto-join completed! Success: ${results.success}, Failed: ${results.failed}, Total: ${results.totalProcessed}`)
        if (results.errors.length > 0) {
          console.warn('Auto-join errors:', results.errors)
        }
      }
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
    },
    onError: (error: unknown) => {
      console.error("Error triggering auto-join:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error triggering auto-join: " + errorMessage)
    },
  })

  // Get joined users mutation
  const getJoinedUsersMutation = useMutation({
    mutationFn: async (gameWeekId: string) => {
      console.log('🔍 [ADMIN] Getting joined users for game week:', gameWeekId)
      try {
        const response = await gameWeeksAPI.getJoinedUsers(gameWeekId)
        console.log('✅ [ADMIN] Get joined users response:', response)
        return response
      } catch (error) {
        console.error('❌ [ADMIN] Get joined users error:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('✅ [ADMIN] Joined users retrieved successfully:', data)
      setShowJoinedUsersModal(true)
    },
    onError: (error: unknown) => {
      console.error('❌ [ADMIN] Get joined users failed:', error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error getting joined users: " + errorMessage)
    },
  })

  const gameWeeks = gameWeeksData?.data?.data || []
  const totalGameWeeks = gameWeeksData?.data?.total || 0
  const totalPages = Math.ceil(totalGameWeeks / pageSize)
  
  const seasons = seasonsData?.data?.data || []
  const competitions = competitionsData?.data?.data || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft", icon: Pause },
      active: { color: "bg-green-100 text-green-800", label: "Active", icon: Play },
      completed: { color: "bg-blue-100 text-blue-800", label: "Completed", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled", icon: XCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const handleDeleteGameWeek = (id: string) => {
    if (confirm("Are you sure you want to delete this game week?")) {
      deleteGameWeekMutation.mutate(id)
    }
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    changeStatusMutation.mutate({ id, status: newStatus })
  }

  const handleUpdateDeadlines = (gameWeek: GameWeek) => {
    setEditingGameWeek(gameWeek)
    // Convert dates to local datetime format for input fields
    const toLocalDateTime = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
    }
    
    setDeadlineFormData({
      transfer_deadline: toLocalDateTime(gameWeek.transfer_deadline),
      purchase_deadline: toLocalDateTime(gameWeek.purchase_deadline),
      first_match_start_date: toLocalDateTime(gameWeek.first_match_start_date),
      last_match_end_date: toLocalDateTime(gameWeek.last_match_end_date)
    })
    setShowDeadlineModal(true)
  }

  // Form helper functions
  const resetForm = () => {
    setFormData({
      game_week: "",
      season_id: "",
      competition_id: "",
      is_free: false
    })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const resetDeadlineForm = () => {
    setDeadlineFormData({
      transfer_deadline: "",
      purchase_deadline: "",
      first_match_start_date: "",
      last_match_end_date: ""
    })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.game_week.trim()) {
      errors.game_week = "Game week name is required"
    }

    if (!formData.season_id) {
      errors.season_id = "Please select a season"
    }

    if (!formData.competition_id) {
      errors.competition_id = "Please select a competition"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof CreateGameWeekData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[field as string]) {
      setFormErrors(prev => ({
        ...prev,
        [field as string]: ""
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createGameWeekMutation.mutateAsync(formData)
    } catch (error) {
      console.error("Error in form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDeadlines = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGameWeek) return

    setIsSubmitting(true)
    try {
      // Convert local datetime back to ISO string
      const dataToSubmit = {
        transfer_deadline: new Date(deadlineFormData.transfer_deadline).toISOString(),
        purchase_deadline: new Date(deadlineFormData.purchase_deadline).toISOString(),
        first_match_start_date: new Date(deadlineFormData.first_match_start_date).toISOString(),
        last_match_end_date: new Date(deadlineFormData.last_match_end_date).toISOString()
      }
      
      await updateDeadlinesMutation.mutateAsync({ id: editingGameWeek._id, data: dataToSubmit })
    } catch (error) {
      console.error("Error in deadline form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setShowDeadlineModal(false)
    setEditingGameWeek(null)
    resetForm()
    resetDeadlineForm()
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
          <p className="text-red-500">Error loading game weeks data</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Weeks</h1>
            <p className="text-gray-600">Manage fantasy football game weeks</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Game Week
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Game Weeks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGameWeeks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameWeeks.filter((gw: GameWeek) => gw.status === 'active').length}
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
                {gameWeeks.filter((gw: GameWeek) => gw.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Pause className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameWeeks.filter((gw: GameWeek) => gw.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-Join Monitor */}
        <AutoJoinMonitor />

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Game Week Management</CardTitle>
            <CardDescription>Search and filter game weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search game weeks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                {gameWeekStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {gameWeeks.map((gameWeek: GameWeek) => (
                    <tr key={gameWeek._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {gameWeek.name || `Game Week ${gameWeek.week_number}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Week {gameWeek.week_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(gameWeek.first_match_start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(gameWeek.last_match_end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(gameWeek.is_done ? 'completed' : gameWeek.is_active ? 'active' : 'draft')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {gameWeek.participants_count || 0} users
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateDeadlines(gameWeek)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Update Deadlines"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <select
                            value={gameWeek.status}
                            onChange={(e) => handleStatusChange(gameWeek._id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            {gameWeekStatusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {!gameWeek.is_done && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchPlayerStatsMutation.mutate(gameWeek._id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Fetch Player Stats"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => triggerAutoJoinMutation.mutate(gameWeek._id)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Trigger Auto-Join"
                                disabled={triggerAutoJoinMutation.isPending}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedGameWeekForUsers(gameWeek)
                                  getJoinedUsersMutation.mutate(gameWeek._id)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="View Joined Users"
                                disabled={getJoinedUsersMutation.isPending}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markDoneMutation.mutate(gameWeek._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Mark as Done"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteGameWeek(gameWeek._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalGameWeeks)} of {totalGameWeeks} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create Game Week Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Game Week</CardTitle>
                <CardDescription>Add a new game week to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Game Week Name *
                    </label>
                    <Input 
                      placeholder="e.g., Game Week 1, Matchday 15" 
                      value={formData.game_week}
                      onChange={(e) => handleInputChange("game_week", e.target.value)}
                    />
                    {formErrors.game_week && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.game_week}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Season *
                    </label>
                    <select
                      value={formData.season_id}
                      onChange={(e) => handleInputChange("season_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a season</option>
                      {seasons.map(season => (
                        <option key={season._id} value={season._id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.season_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.season_id}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competition *
                    </label>
                    <select
                      value={formData.competition_id}
                      onChange={(e) => handleInputChange("competition_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a competition</option>
                      {competitions.map(competition => (
                        <option key={competition._id} value={competition._id}>
                          {competition.competition_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.competition_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.competition_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_free}
                        onChange={(e) => handleInputChange("is_free", e.target.checked)}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Free Game Week
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      If checked, players wont be charged for participating in this game week
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="button" 
                      onClick={handleCloseModal}
                      variant="outline"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Creating..." : "Create Game Week"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Update Deadlines Modal */}
        {showDeadlineModal && editingGameWeek && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Update Game Week Deadlines</CardTitle>
                <CardDescription>
                  Extend or modify deadlines for &ldquo;{editingGameWeek.game_week}&rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitDeadlines} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer Deadline *
                      </label>
                      <Input 
                        type="datetime-local"
                        value={deadlineFormData.transfer_deadline}
                        onChange={(e) => setDeadlineFormData(prev => ({
                          ...prev,
                          transfer_deadline: e.target.value
                        }))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Last time users can make transfers
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Deadline *
                      </label>
                      <Input 
                        type="datetime-local"
                        value={deadlineFormData.purchase_deadline}
                        onChange={(e) => setDeadlineFormData(prev => ({
                          ...prev,
                          purchase_deadline: e.target.value
                        }))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Last time users can join the game week
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Match Start *
                      </label>
                      <Input 
                        type="datetime-local"
                        value={deadlineFormData.first_match_start_date}
                        onChange={(e) => setDeadlineFormData(prev => ({
                          ...prev,
                          first_match_start_date: e.target.value
                        }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Match End *
                      </label>
                      <Input 
                        type="datetime-local"
                        value={deadlineFormData.last_match_end_date}
                        onChange={(e) => setDeadlineFormData(prev => ({
                          ...prev,
                          last_match_end_date: e.target.value
                        }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Pro Tip:</strong> To extend join deadline, update the &ldquo;Purchase Deadline&rdquo; to a future time.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="button" 
                      onClick={handleCloseModal}
                      variant="outline"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Updating..." : "Update Deadlines"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Joined Users Modal */}
        {showJoinedUsersModal && selectedGameWeekForUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <CardTitle>Joined Users - {selectedGameWeekForUsers.game_week}</CardTitle>
                <CardDescription>
                  Users who have joined this game week
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                {getJoinedUsersMutation.data?.data?.joinedUsers ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Total joined users: {getJoinedUsersMutation.data.data.joinedUsers.length}
                    </div>
                    <div className="grid gap-4">
                      {getJoinedUsersMutation.data.data.joinedUsers.map((user: { client_id: string; team_id: string; total_point: number; players: unknown[] }, index: number) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">User ID: {user.client_id}</h4>
                              <p className="text-sm text-gray-600">Team ID: {user.team_id}</p>
                              <p className="text-sm text-gray-600">Total Points: {user.total_point || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Players: {user.players?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No users have joined this game week yet.</p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => {
                      setShowJoinedUsersModal(false)
                      setSelectedGameWeekForUsers(null)
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 