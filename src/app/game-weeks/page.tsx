"use client"

import { useState, useEffect } from "react"
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
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  RefreshCw,
  List,
  X,
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
  const [showPlayerDetailsModal, setShowPlayerDetailsModal] = useState(false)
  const [editingGameWeek, setEditingGameWeek] = useState<GameWeek | null>(null)
  const [selectedGameWeekForUsers, setSelectedGameWeekForUsers] = useState<GameWeek | null>(null)
  const [selectedUserPlayers, setSelectedUserPlayers] = useState<{ user: { client_id?: { first_name?: string; last_name?: string; phone_number?: string; email?: string; _id?: string } | string; total_point?: number; team_id?: string; players?: unknown[] }; players: { full_name?: string; position?: string; pid?: string; fantasy_point?: number; points?: number; is_captain?: boolean; is_vice_captain?: boolean; club?: string }[] } | null>(null)
  
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

  type GWMatch = {
    mid: string; round: string; status: string; date: string; venue: string | null;
    home: { name: string; abbr: string; logo: string };
    away: { name: string; abbr: string; logo: string };
    result: { home: string; away: string; winner: string } | null;
    is_rescheduled: boolean;
  }
  type BrowseMatch = Omit<GWMatch, "is_rescheduled"> & { already_added: boolean }

  const [showMatchesModal, setShowMatchesModal] = useState(false)
  const [matchesGW, setMatchesGW] = useState<GameWeek | null>(null)
  const [matchesList, setMatchesList] = useState<GWMatch[]>([])
  const [matchesMeta, setMatchesMeta] = useState<{ total: number; total_stored_ids: number; missing: number } | null>(null)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState<string | null>(null)

  // Browse & add matches state
  const [showBrowsePanel, setShowBrowsePanel] = useState(false)
  const [browsePage, setBrowsePage] = useState<string>("1")
  const [browseResults, setBrowseResults] = useState<BrowseMatch[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [selectedMids, setSelectedMids] = useState<Set<string>>(new Set())
  const [addingMids, setAddingMids] = useState(false)
  const [removingMid, setRemovingMid] = useState<string | null>(null)

  const reloadMatches = async (gw: GameWeek) => {
    setMatchesLoading(true)
    setMatchesError(null)
    try {
      const res = await gameWeeksAPI.getMatches(gw._id)
      const d = (res as { data?: { matches?: GWMatch[]; total?: number; total_stored_ids?: number; missing?: number } }).data
      setMatchesList(d?.matches ?? [])
      setMatchesMeta({ total: d?.total ?? 0, total_stored_ids: d?.total_stored_ids ?? 0, missing: d?.missing ?? 0 })
    } catch (e: unknown) {
      setMatchesError(e instanceof Error ? e.message : "Failed to load matches")
    } finally {
      setMatchesLoading(false)
    }
  }

  const handleViewMatches = async (gw: GameWeek) => {
    setMatchesGW(gw)
    setMatchesList([])
    setMatchesMeta(null)
    setMatchesError(null)
    setShowBrowsePanel(false)
    setBrowseResults([])
    setSelectedMids(new Set())
    setBrowsePage("1")
    setShowMatchesModal(true)
    await reloadMatches(gw)
  }

  const handleBrowse = async () => {
    if (!matchesGW) return
    setBrowseLoading(true)
    setBrowseError(null)
    setBrowseResults([])
    setSelectedMids(new Set())
    try {
      const res = await gameWeeksAPI.browseMatches(matchesGW._id, parseInt(browsePage) || 1)
      const d = (res as { data?: { matches?: BrowseMatch[] } }).data
      setBrowseResults(d?.matches ?? [])
    } catch (e: unknown) {
      setBrowseError(e instanceof Error ? e.message : "Browse failed")
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleAddSelected = async () => {
    if (!matchesGW || selectedMids.size === 0) return
    setAddingMids(true)
    const errors: string[] = []
    for (const mid of Array.from(selectedMids)) {
      try {
        await gameWeeksAPI.addMatch(matchesGW._id, mid)
      } catch (e: unknown) {
        errors.push(`${mid}: ${e instanceof Error ? e.message : "failed"}`)
      }
    }
    if (errors.length) alert("Some matches failed:\n" + errors.join("\n"))
    setSelectedMids(new Set())
    setBrowseResults(prev => prev.map(m => selectedMids.has(m.mid) ? { ...m, already_added: true } : m))
    await reloadMatches(matchesGW)
    setAddingMids(false)
  }

  const handleRemoveMatch = async (mid: string) => {
    if (!matchesGW) return
    if (!confirm(`Remove match ${mid} from GW${matchesGW.game_week}?`)) return
    setRemovingMid(mid)
    try {
      await gameWeeksAPI.removeMatch(matchesGW._id, mid)
      setMatchesList(prev => prev.filter(m => m.mid !== mid))
      setMatchesMeta(prev => prev ? { ...prev, total: prev.total - 1, total_stored_ids: prev.total_stored_ids - 1 } : prev)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove match")
    } finally {
      setRemovingMid(null)
    }
  }

  const [pollingGameWeekId, setPollingGameWeekId] = useState<string | null>(null)
  const [completionProgress, setCompletionProgress] = useState<{
    [key: string]: { percentage: number; current: number; total: number; status: string }
  }>({})

  // Poll for completion status
  useEffect(() => {
    if (!pollingGameWeekId) return

    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await gameWeeksAPI.getCompletionStatus(pollingGameWeekId)
        const jobStatus = statusResponse.data?.jobStatus

        if (jobStatus) {
          setCompletionProgress(prev => ({
            ...prev,
            [pollingGameWeekId]: {
              percentage: jobStatus.progress.percentage,
              current: jobStatus.progress.current,
              total: jobStatus.progress.total,
              status: jobStatus.status,
            }
          }))

          // If completed or failed, stop polling
          if (jobStatus.status === 'completed') {
            setPollingGameWeekId(null)
            queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
            alert("✅ Game week completion finished! All points have been calculated successfully.")
          } else if (jobStatus.status === 'failed') {
            setPollingGameWeekId(null)
            alert("❌ Game week completion failed: " + (jobStatus.error || "Unknown error"))
          }
        }
      } catch (error) {
        console.error("Error polling completion status:", error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [pollingGameWeekId, queryClient])

  const markDoneMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 [ADMIN] Marking game week as done:', id)
      try {
        const response = await gameWeeksAPI.markDone(id, true)
        console.log('✅ [ADMIN] Mark done response:', response)
        return { response, id }
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
    onSuccess: (data) => {
      const gameWeekId = data.id
      setPollingGameWeekId(gameWeekId)
      setCompletionProgress(prev => ({
        ...prev,
        [gameWeekId]: { percentage: 0, current: 0, total: 0, status: 'pending' }
      }))
      alert("🚀 Game week completion job started. Points calculation is running in the background.\n\nYou'll be notified when it's complete.")
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
        let message = `Auto-join completed!\n\n✅ Successfully joined: ${results.success}\n❌ Failed: ${results.failed}\n📊 Total processed: ${results.totalProcessed}`
        
        if (results.errors && results.errors.length > 0) {
          message += `\n\n━━━━━━━━━━━━━━━━━━━━━━\n📋 Failed Users Details:\n━━━━━━━━━━━━━━━━━━━━━━\n\n`
          results.errors.forEach((error: string, index: number) => {
            message += `${index + 1}. ${error}\n`
          })
        }
        
        alert(message)
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
      try {
        const response = await gameWeeksAPI.getJoinedUsers(gameWeekId)
        return response
      } catch (error) {
        throw error
      }
    },
    onSuccess: () => {
      setShowJoinedUsersModal(true)
      // Invalidate to refresh participants count
      queryClient.invalidateQueries({ queryKey: ["game-weeks"] })
    },
    onError: (error: unknown) => {
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
                            {gameWeek.game_week ? `Game Week ${gameWeek.game_week}` : 'Unknown Game Week'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Week {gameWeek.game_week || 'N/A'}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {gameWeek.participants_count || 0}
                          </span>
                          <span className="text-xs text-gray-500">users</span>
                          {(gameWeek.participants_count || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGameWeekForUsers(gameWeek)
                                getJoinedUsersMutation.mutate(gameWeek._id)
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                              disabled={getJoinedUsersMutation.isPending}
                            >
                              (view)
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateDeadlines(gameWeek)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Update Deadlines"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-500 mt-0.5">Deadlines</span>
                          </div>

                          {!gameWeek.is_done && (
                            <>
                              <div className="flex flex-col items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => fetchPlayerStatsMutation.mutate(gameWeek._id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Fetch Player Stats"
                                  disabled={fetchPlayerStatsMutation.isPending}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <span className="text-[10px] text-gray-500 mt-0.5">Fetch Stats</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewMatches(gameWeek)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="View Matches for this game week"
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                                <span className="text-[10px] text-gray-500 mt-0.5">Matches</span>
                              </div>


                              <div className="flex flex-col items-center">
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
                                <span className="text-[10px] text-gray-500 mt-0.5">Auto Join</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGameWeekForUsers(gameWeek)
                                    getJoinedUsersMutation.mutate(gameWeek._id)
                                  }}
                                  className="text-teal-600 hover:text-teal-800"
                                  title="View Joined Users"
                                  disabled={getJoinedUsersMutation.isPending}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <span className="text-[10px] text-gray-500 mt-0.5">View Users</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => markDoneMutation.mutate(gameWeek._id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Mark as Done & Calculate Points"
                                  disabled={markDoneMutation.isPending || completionProgress[gameWeek._id]?.status === 'processing'}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-[10px] text-gray-500 mt-0.5">Mark Done</span>
                              </div>

                              {completionProgress[gameWeek._id] && completionProgress[gameWeek._id].status === 'processing' && (
                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                  <div className="text-[10px] text-blue-600 font-semibold">
                                    {completionProgress[gameWeek._id].percentage}%
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${completionProgress[gameWeek._id].percentage}%` }}
                                    />
                                  </div>
                                  <div className="text-[9px] text-gray-500">
                                    {completionProgress[gameWeek._id].current}/{completionProgress[gameWeek._id].total}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex flex-col items-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteGameWeek(gameWeek._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Game Week"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] text-gray-500 mt-0.5">Delete</span>
                          </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[85vh] flex flex-col">
              <CardHeader className="border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Joined Users - Game Week {selectedGameWeekForUsers.game_week}</CardTitle>
                    <CardDescription>
                      View all users who have joined this game week and their team details
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowJoinedUsersModal(false)
                      setSelectedGameWeekForUsers(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto p-6 flex-1">
                {getJoinedUsersMutation.isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : getJoinedUsersMutation.data?.data?.gameWeekTeam && getJoinedUsersMutation.data.data.gameWeekTeam.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                          Total Participants: {getJoinedUsersMutation.data.data.gameWeekTeam.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total Points</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Players</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getJoinedUsersMutation.data.data.gameWeekTeam.map((user: { client_id?: { first_name?: string; last_name?: string; phone_number?: string; email?: string; _id?: string } | string; total_point?: number; team_id?: string; players?: unknown[]; _id?: string }, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {typeof user.client_id === 'object' && user.client_id?.first_name 
                                      ? `${user.client_id.first_name} ${user.client_id.last_name || ''}`.trim()
                                      : 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono">{typeof user.client_id === 'string' ? user.client_id : typeof user.client_id === 'object' ? user.client_id?._id : ''}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  {typeof user.client_id === 'object' && user.client_id?.phone_number && (
                                    <span className="text-sm text-gray-700">{user.client_id.phone_number}</span>
                                  )}
                                  {typeof user.client_id === 'object' && user.client_id?.email && (
                                    <span className="text-xs text-gray-500">{user.client_id.email}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                  {user.total_point || 0} pts
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm text-gray-700">{user.players?.length || 0} players</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserPlayers({ 
                                      user: { ...user }, 
                                      players: (user.players || []) as { full_name?: string; position?: string; pid?: string; fantasy_point?: number; points?: number; is_captain?: boolean; is_vice_captain?: boolean; club?: string }[]
                                    })
                                    setShowPlayerDetailsModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Team
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No users have joined this game week yet</p>
                    <p className="text-gray-400 text-sm mt-2">Users will appear here once they join this game week</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Player Details Modal */}
        {showPlayerDetailsModal && selectedUserPlayers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col">
              <CardHeader className="border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {typeof selectedUserPlayers.user.client_id === 'object' && selectedUserPlayers.user.client_id?.first_name 
                        ? `${selectedUserPlayers.user.client_id.first_name} ${selectedUserPlayers.user.client_id.last_name || ''}`.trim()
                        : 'User'}&apos;s Team
                    </CardTitle>
                    <CardDescription>
                      View the squad selected for this game week
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPlayerDetailsModal(false)
                      setSelectedUserPlayers(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto p-6 flex-1">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">User</p>
                      <p className="text-sm font-medium text-gray-900">
                        {typeof selectedUserPlayers.user.client_id === 'object' && selectedUserPlayers.user.client_id?.first_name 
                          ? `${selectedUserPlayers.user.client_id.first_name} ${selectedUserPlayers.user.client_id.last_name || ''}`.trim()
                          : 'Unknown'}
                      </p>
                      {typeof selectedUserPlayers.user.client_id === 'object' && selectedUserPlayers.user.client_id?.phone_number && (
                        <p className="text-xs text-gray-600">{selectedUserPlayers.user.client_id.phone_number}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Total Points</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedUserPlayers.user.total_point || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Squad Size</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedUserPlayers.players.length} players
                      </p>
                    </div>
                  </div>

                  {/* Players Grid */}
                  {selectedUserPlayers.players.length > 0 ? (
                    <div className="grid gap-3">
                      {selectedUserPlayers.players.map((player, idx: number) => (
                        <div 
                          key={idx} 
                          className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {player.full_name || 'Unknown Player'}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                    {player.position && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                        {player.position}
                                      </span>
                                    )}
                                    {player.club && (
                                      <span className="text-gray-500">{player.club}</span>
                                    )}
                                    {player.pid && (
                                      <span className="text-gray-400 text-[10px]">ID: {player.pid}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Points</p>
                                <p className="text-lg font-bold text-green-600">
                                  {player.fantasy_point || player.points || 0}
                                </p>
                              </div>
                              {player.is_captain && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                  Captain
                                </span>
                              )}
                              {player.is_vice_captain && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                  Vice Captain
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No players found for this team</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                <Button 
                  onClick={() => {
                    setShowPlayerDetailsModal(false)
                    setSelectedUserPlayers(null)
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
        {/* View Matches Modal */}
        {showMatchesModal && matchesGW && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-5xl max-h-[92vh] flex flex-col">
              {/* Header */}
              <CardHeader className="flex-shrink-0 border-b pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <List className="h-5 w-5 text-indigo-600" />
                      GW{matchesGW.game_week} — Fixtures
                    </CardTitle>
                    {matchesMeta && (
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium text-gray-700">{matchesMeta.total_stored_ids} match IDs stored</span>
                        <span className="text-gray-400">·</span>
                        <span>{matchesMeta.total} resolved from Entity Sport</span>
                        {matchesMeta.missing > 0 && (
                          <span className="text-amber-600 font-medium">{matchesMeta.missing} unresolved</span>
                        )}
                        {matchesList.some(m => m.is_rescheduled) && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                            Contains rescheduled fixtures
                          </span>
                        )}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 gap-1"
                      onClick={() => { setShowBrowsePanel(v => !v); setBrowseResults([]); setSelectedMids(new Set()) }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Match
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowMatchesModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Browse & Add Panel */}
              {showBrowsePanel && (
                <div className="flex-shrink-0 border-b bg-indigo-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-indigo-800">Browse Entity Sport page to find and add matches</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={browsePage}
                      onChange={e => setBrowsePage(e.target.value)}
                      placeholder="Page number"
                      className="w-28 px-3 py-1.5 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <Button size="sm" onClick={handleBrowse} disabled={browseLoading} className="gap-1">
                      {browseLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                      {browseLoading ? "Loading…" : "Browse"}
                    </Button>
                    {selectedMids.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleAddSelected}
                        disabled={addingMids}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      >
                        {addingMids ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Add {selectedMids.size} selected
                      </Button>
                    )}
                  </div>
                  {browseError && <p className="text-red-600 text-xs">{browseError}</p>}
                  {browseResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded border border-indigo-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-indigo-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left w-8"></th>
                            <th className="px-3 py-2 text-left">Match</th>
                            <th className="px-3 py-2 text-center">Round</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2 text-center">ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {browseResults.map(m => (
                            <tr key={m.mid} className={m.already_added ? "opacity-40" : "hover:bg-indigo-50"}>
                              <td className="px-3 py-2">
                                {!m.already_added && (
                                  <input
                                    type="checkbox"
                                    checked={selectedMids.has(m.mid)}
                                    onChange={e => {
                                      const next = new Set(selectedMids)
                                      e.target.checked ? next.add(m.mid) : next.delete(m.mid)
                                      setSelectedMids(next)
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                )}
                                {m.already_added && <span className="text-green-600 text-[10px] font-bold">✓</span>}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {m.home.logo && <img src={m.home.logo} alt="" className="w-4 h-4 object-contain" />}
                                  <span className="font-medium">{m.home.name}</span>
                                  <span className="text-gray-400">vs</span>
                                  <span className="font-medium">{m.away.name}</span>
                                  {m.away.logo && <img src={m.away.logo} alt="" className="w-4 h-4 object-contain" />}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-500">R{m.round}</td>
                              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                {new Date(m.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="px-3 py-2 text-center capitalize text-gray-500">{m.status}</td>
                              <td className="px-3 py-2 text-center font-mono text-gray-400">{m.mid}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!browseLoading && !browseError && browseResults.length === 0 && (
                    <p className="text-xs text-gray-500 italic">Enter a page number and click Browse</p>
                  )}
                </div>
              )}

              {/* Match List */}
              <CardContent className="overflow-y-auto flex-1 p-0">
                {matchesLoading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading fixtures from Entity Sport…</p>
                  </div>
                )}

                {matchesError && (
                  <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{matchesError}</div>
                  </div>
                )}

                {!matchesLoading && !matchesError && matchesList.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                    <List className="h-10 w-10" />
                    <p className="text-sm">No matches stored for this game week yet</p>
                  </div>
                )}

                {!matchesLoading && matchesList.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Venue</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Round</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matchesList
                        .slice()
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((match) => {
                          const statusColor =
                            match.status === "result" ? "bg-green-100 text-green-700"
                            : match.status === "cancelled" ? "bg-red-100 text-red-700"
                            : match.status === "live" || match.status === "progress" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"

                          return (
                            <tr key={match.mid} className={`hover:bg-gray-50 ${match.is_rescheduled ? "bg-purple-50" : ""}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {match.home.logo && <img src={match.home.logo} alt={match.home.abbr} className="w-6 h-6 object-contain" />}
                                  <span className="font-semibold text-gray-800">{match.home.name}</span>
                                  <span className="text-gray-400 text-xs mx-1">vs</span>
                                  <span className="font-semibold text-gray-800">{match.away.name}</span>
                                  {match.away.logo && <img src={match.away.logo} alt={match.away.abbr} className="w-6 h-6 object-contain" />}
                                  {match.is_rescheduled && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded text-[10px] font-bold" title="Rescheduled — different round number">
                                      DGW
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {match.result
                                  ? <span className="font-bold text-gray-800">{match.result.home} – {match.result.away}</span>
                                  : <span className="text-gray-400 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                {new Date(match.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{match.venue ?? "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${match.is_rescheduled ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                                  R{match.round}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                  {match.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-400 text-xs font-mono">{match.mid}</td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  title="Remove this match from the game week"
                                  disabled={removingMid === match.mid}
                                  onClick={() => handleRemoveMatch(match.mid)}
                                >
                                  {removingMid === match.mid
                                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    : <X className="h-3.5 w-3.5" />}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                )}
              </CardContent>

              <div className="border-t p-3 bg-gray-50 flex-shrink-0 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Purple rows / <span className="bg-purple-200 text-purple-700 px-1 rounded font-bold text-[10px]">DGW</span> = rescheduled fixtures (round ≠ GW{matchesGW.game_week}) &nbsp;·&nbsp; Red <span className="font-bold">×</span> to remove a match
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowMatchesModal(false)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 