"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/lib/store'
import { fantasyRoasterAPI, seasonsAPI, competitionsAPI } from '@/lib/api'
import { 
  FantasyRoaster, 
  CreateFantasyRoasterData,
  UpdatePlayerInfoData,
  UpdateRoasterStatusData,
  AddPlayerData,
  RemovePlayerData,
  Season,
  Competition
} from '@/types'
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  RefreshCw,
  Users,
  Search,
  Activity,
  TrendingUp,
  Shield,
  Star,
  AlertTriangle,
  Calendar,
  User,
  Trophy,
  Filter
} from 'lucide-react'

export default function FantasyRoastersPage() {
  const [roasters, setRoasters] = useState<FantasyRoaster[]>([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useUIStore()
  const [selectedRoaster, setSelectedRoaster] = useState<FantasyRoaster | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPlayers, setShowPlayers] = useState(false)
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<{ 
    pid: string
    pname: string
    role: string
    rating: string
    team: {
      tid: string
      tname: string
      logo: string
      fullname: string
      abbr: string
    }
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [playerSearchTerm, setPlayerSearchTerm] = useState<string>('')
  const [availableTeams, setAvailableTeams] = useState<Array<{ tid: string; tname: string; logo: string; fullname: string; abbr: string }>>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [newPlayer, setNewPlayer] = useState<AddPlayerData>({
    pid: '',
    pname: '',
    rating: 0,
    role: '',
    tid: '',
    tname: '',
    logo: '',
    fullname: '',
    abbr: ''
  })

  useEffect(() => {
    fetchRoasters()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch seasons for dropdown
  const { data: seasonsData } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => seasonsAPI.getAll({ limit: 100 }),
  })

  // Fetch competitions for selected season
  const { data: competitionsData } = useQuery({
    queryKey: ['competitions', selectedSeasonId],
    queryFn: () => competitionsAPI.getAll({ season_id: selectedSeasonId, limit: 100 }),
    enabled: !!selectedSeasonId,
  })

  const fetchRoasters = async () => {
    try {
      const response = await fantasyRoasterAPI.getFantasyRoasters()
      const list = Array.isArray(response.data) ? response.data : []
      setRoasters(list)
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to fetch roasters' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoaster = async () => {
    if (!selectedSeasonId) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Please select a season' })
      return
    }
    if (!selectedCompetitionId) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Please select a competition' })
      return
    }

    try {
      setLoading(true)
      const selectedSeason = seasonsData?.data?.data?.find((season: Season) => season._id === selectedSeasonId)
      const selectedCompetition = competitionsData?.data?.data?.find((competition: Competition) => competition._id === selectedCompetitionId)
      const data: CreateFantasyRoasterData = {
        season_name: selectedSeason?.name || '',
        season_id: selectedSeasonId,
        competition_id: selectedCompetitionId,
        competition_cid: selectedCompetition?.cid || '',
        players: []
      }
      const response = await fantasyRoasterAPI.createFantasyRoaster(data)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Fantasy roaster created successfully. You can now populate players.' })
        setIsCreating(false)
        fetchRoasters()
        // Keep selectedSeasonId and selectedCompetitionId so user can immediately populate players
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to create roaster' })
    } finally {
      setLoading(false)
    }
  }

  const handlePopulatePlayers = async (roaster: FantasyRoaster) => {
    if (!roaster.season_id || !roaster.competition_id) {
      addNotification({ 
        id: Date.now().toString(), 
        type: 'error', 
        title: 'Error', 
        message: 'This roaster is missing season or competition data' 
      })
      return
    }

    try {
      setLoading(true)
      
      // Show initial loading notification
      const loadingNotificationId = Date.now().toString()
      addNotification({ 
        id: loadingNotificationId, 
        type: 'info', 
        title: 'Populating Players', 
        message: `Fetching players from competition... This may take up to 5 minutes.` 
      })

      const response = await fantasyRoasterAPI.populatePlayersFromAPI(roaster.season_id, roaster.competition_id)
      
      if (response.status === 'SUCCESS') {
        addNotification({ 
          id: Date.now().toString(), 
          type: 'success', 
          title: 'Success', 
          message: response.message || `Players populated successfully for ${roaster.season_name}` 
        })
        fetchRoasters()
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to populate players'
      addNotification({ 
        id: Date.now().toString(), 
        type: 'error', 
        title: 'Population Failed', 
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (roaster: FantasyRoaster) => {
    try {
      const data: UpdateRoasterStatusData = {
        is_active: !roaster.is_active
      }
      const response = await fantasyRoasterAPI.updateRoasterStatus(roaster._id, data)
      if (response.status === 'SUCCESS') {
        addNotification({ 
          id: Date.now().toString(), 
          type: 'success', 
          title: 'Success', 
          message: `Roaster ${roaster.is_active ? 'deactivated' : 'activated'} successfully` 
        })
        fetchRoasters()
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to update roaster status' })
    }
  }

  const fetchTeams = async (roasterId: string) => {
    setLoadingTeams(true)
    try {
      const response = await fantasyRoasterAPI.getTeamsFromRoaster(roasterId)
      if (response.status === 'SUCCESS' && response.data?.teams) {
        setAvailableTeams(response.data.teams)
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to fetch teams' })
    } finally {
      setLoadingTeams(false)
    }
  }

  const handleUpdatePlayerInfo = async (roasterId: string) => {
    if (!editingPlayer) return
    
    try {
      const data: UpdatePlayerInfoData = {
        pid: editingPlayer.pid,
      }
      
      // Only include fields that have changed or are being edited
      if (editingPlayer.pname) data.pname = editingPlayer.pname
      if (editingPlayer.role) data.role = editingPlayer.role
      if (editingPlayer.rating) data.rating = parseFloat(editingPlayer.rating)
      if (editingPlayer.team) data.team = editingPlayer.team
      
      const response = await fantasyRoasterAPI.updatePlayerInfo(roasterId, data)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Player information updated successfully' })
        setEditingPlayer(null)
        
        // Fetch updated roasters and update selected roaster
        const updatedResponse = await fantasyRoasterAPI.getFantasyRoasters()
        const updatedList = Array.isArray(updatedResponse.data) ? updatedResponse.data : []
        setRoasters(updatedList)
        
        // Update selected roaster with the updated data
        const updatedRoaster = updatedList.find(r => r._id === roasterId)
        if (updatedRoaster) {
          setSelectedRoaster(updatedRoaster)
        }
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to update player information' })
    }
  }

  const handleAddPlayer = async (roasterId: string) => {
    if (!newPlayer.pid || !newPlayer.pname || !newPlayer.role) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Please fill in required fields' })
      return
    }

    try {
      const response = await fantasyRoasterAPI.addPlayerToRoaster(roasterId, newPlayer)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Player added successfully' })
        setNewPlayer({
          pid: '',
          pname: '',
          rating: 0,
          role: '',
          tid: '',
          tname: '',
          logo: '',
          fullname: '',
          abbr: ''
        })
        fetchRoasters()
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to add player' })
    }
  }

  const handleRemovePlayer = async (roasterId: string, pid: string) => {
    try {
      const data: RemovePlayerData = { pid }
      const response = await fantasyRoasterAPI.removePlayerFromRoaster(roasterId, data)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Player removed successfully' })
        fetchRoasters()
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to remove player' })
    }
  }

  const handleDeleteRoaster = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roaster?')) return

    try {
      const response = await fantasyRoasterAPI.deleteFantasyRoaster(id)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Roaster deleted successfully' })
        fetchRoasters()
      }
    } catch {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to delete roaster' })
    }
  }

  // Computed values
  const stats = useMemo(() => {
    const totalRoasters = roasters.length
    const activeRoasters = roasters.filter(r => r.is_active).length
    const totalPlayers = roasters.reduce((sum, r) => sum + (r.players?.length || 0), 0)
    const avgPlayersPerRoaster = totalRoasters > 0 ? Math.round(totalPlayers / totalRoasters) : 0
    
    return {
      totalRoasters,
      activeRoasters,
      inactiveRoasters: totalRoasters - activeRoasters,
      totalPlayers,
      avgPlayersPerRoaster
    }
  }, [roasters])

  const filteredRoasters = useMemo(() => {
    return (Array.isArray(roasters) ? roasters : []).filter((roaster) => {
      const matchesSearch = (roaster?.season_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && roaster.is_active) ||
        (statusFilter === 'inactive' && !roaster.is_active)
      
      return matchesSearch && matchesStatus
    })
  }, [roasters, searchTerm, statusFilter])

  // Get unique teams from selected roaster's players
  const uniqueTeams = useMemo(() => {
    if (!selectedRoaster?.players || !showPlayers) return []
    const teams = new Set<string>()
    selectedRoaster.players.forEach((player) => {
      if (player?.team?.tname) {
        teams.add(player.team.tname)
      }
    })
    return Array.from(teams).sort()
  }, [selectedRoaster, showPlayers])

  // Filter players by team and name for selected roaster
  const filteredPlayers = useMemo(() => {
    if (!selectedRoaster?.players || !showPlayers) return []
    
    let filtered = selectedRoaster.players
    
    // Filter by team/club
    if (teamFilter !== 'all') {
      filtered = filtered.filter((player) => 
        player?.team?.tname === teamFilter
      )
    }
    
    // Filter by player name
    if (playerSearchTerm.trim() !== '') {
      const searchLower = playerSearchTerm.toLowerCase().trim()
      filtered = filtered.filter((player) => 
        (player?.pname || '').toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [selectedRoaster, teamFilter, playerSearchTerm, showPlayers])


  if (loading && roasters.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          <span className="ml-2">Loading roasters...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fantasy Roaster Management</h1>
            <p className="text-gray-600">Manage fantasy football rosters, players, and season data</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsCreating(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Roaster
            </Button>
          </div>
        </div>

        {/* Workflow Instructions */}
        {(selectedSeasonId || selectedCompetitionId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">Workflow Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  {!selectedSeasonId && <p>• Select a season to get started</p>}
                  {selectedSeasonId && !selectedCompetitionId && <p>• Select a competition for the chosen season</p>}
                  {selectedSeasonId && selectedCompetitionId && (
                    <div className="space-y-1">
                      <p>• <strong>Step 1:</strong> Click &quot;Create Roaster&quot; to create an empty roaster structure</p>
                      <p>• <strong>Step 2:</strong> Find your roaster below and click &quot;Populate&quot; to add ~500+ players</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Roasters</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRoasters}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeRoasters}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactiveRoasters}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Players</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgPlayersPerRoaster}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search roasters by season name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <Button
                  onClick={() => fetchRoasters()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create New Roaster Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Fantasy Roaster</h2>
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="season_select">Select Season *</Label>
                  <select
                    id="season_select"
                    value={selectedSeasonId}
                    onChange={(e) => {
                      setSelectedSeasonId(e.target.value)
                      setSelectedCompetitionId('') // Reset competition when season changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a season...</option>
                    {seasonsData?.data?.data?.map((season: Season) => (
                      <option key={season._id} value={season._id}>
                        {season.name} {season.is_active ? '(Active)' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="competition_select">Select Competition *</Label>
                  <select
                    id="competition_select"
                    value={selectedCompetitionId}
                    onChange={(e) => setSelectedCompetitionId(e.target.value)}
                    disabled={!selectedSeasonId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose a competition...</option>
                    {competitionsData?.data?.data?.map((competition: Competition) => (
                      <option key={competition._id} value={competition._id}>
                        {competition.competition_name} {competition.is_active ? '(Active)' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRoaster}
                  disabled={loading || !selectedSeasonId || !selectedCompetitionId}
                >
                  {loading ? 'Creating...' : 'Create Roaster'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Roasters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoasters.map((roaster) => (
            <Card key={roaster._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{roaster.season_name}</CardTitle>
                    </div>
                    <Badge 
                      variant={roaster.is_active ? "default" : "secondary"}
                      className={roaster.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {roaster.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoaster(roaster._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{roaster.players?.length ?? 0}</div>
                    <div className="text-xs text-gray-500">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {roaster.players?.filter(p => p.is_new).length ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {roaster.players?.filter(p => p.is_injuried || p.is_banned).length ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Issues</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(roaster.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Updated {new Date(roaster.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoaster(roaster)
                      setShowPlayers(!showPlayers || selectedRoaster?._id !== roaster._id)
                      // Reset team filter when switching roasters
                      if (!showPlayers || selectedRoaster?._id !== roaster._id) {
                        setTeamFilter('all')
                      }
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPlayers && selectedRoaster?._id === roaster._id ? 'Hide' : 'View'} Players
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePopulatePlayers(roaster)}
                    disabled={loading || !roaster.season_id || !roaster.competition_id}
                    className="text-blue-600 hover:bg-blue-50"
                    title={!roaster.season_id || !roaster.competition_id ? "Missing season/competition data" : "Populate players from competition"}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Populate
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(roaster)}
                    className={`${roaster.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {roaster.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>

              {/* Players Section */}
              {showPlayers && selectedRoaster?._id === roaster._id && (
                <div className="border-t bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-lg font-semibold">Squad Players</h4>
                        <p className="text-sm text-gray-600">
                          {filteredPlayers.length} of {roaster.players?.length ?? 0} players
                          {(teamFilter !== 'all' || playerSearchTerm.trim() !== '') && (
                            <span>
                              {' '}(Filtered{teamFilter !== 'all' ? `: ${teamFilter}` : ''}{teamFilter !== 'all' && playerSearchTerm.trim() !== '' ? ', ' : ''}{playerSearchTerm.trim() !== '' ? `search: "${playerSearchTerm}"` : ''})
                            </span>
                          )}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {isEditing ? 'Done Editing' : 'Edit Players'}
                      </Button>
                    </div>

                    {/* Player Search and Team Filter */}
                    <div className="mb-6 space-y-4">
                      {/* Player Name Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search players by name..."
                          value={playerSearchTerm}
                          onChange={(e) => setPlayerSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        {playerSearchTerm && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPlayerSearchTerm('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Team Filter */}
                      {uniqueTeams.length > 0 && (
                        <div className="flex items-center gap-3">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <Label className="text-sm font-medium text-gray-700">Filter by Team/Club:</Label>
                          <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Teams/Clubs</option>
                            {uniqueTeams.map((team) => (
                              <option key={team} value={team}>
                                {team}
                              </option>
                            ))}
                          </select>
                          {(teamFilter !== 'all' || playerSearchTerm.trim() !== '') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTeamFilter('all')
                                setPlayerSearchTerm('')
                              }}
                              className="text-xs"
                            >
                              Clear All Filters
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Add New Player */}
                    {isEditing && (
                      <Card className="p-4 mb-6 bg-white border-2 border-dashed border-gray-300">
                        <h5 className="font-semibold mb-4 flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Player
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="player_id">Player ID *</Label>
                            <Input
                              id="player_id"
                              placeholder="Enter player ID"
                              value={newPlayer.pid}
                              onChange={(e) => setNewPlayer({...newPlayer, pid: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="player_name">Player Name *</Label>
                            <Input
                              id="player_name"
                              placeholder="Enter player name"
                              value={newPlayer.pname}
                              onChange={(e) => setNewPlayer({...newPlayer, pname: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="position">Position *</Label>
                            <select
                              id="position"
                              value={newPlayer.role}
                              onChange={(e) => setNewPlayer({...newPlayer, role: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">Select position</option>
                              <option value="Goalkeeper">Goalkeeper</option>
                              <option value="Defender">Defender</option>
                              <option value="Midfielder">Midfielder</option>
                              <option value="Forward">Forward</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="rating">Rating</Label>
                            <Input
                              id="rating"
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              value={newPlayer.rating || ''}
                              onChange={(e) => setNewPlayer({...newPlayer, rating: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="team_select">Team/Club</Label>
                            <select
                              id="team_select"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              value={newPlayer.tid || ''}
                              onChange={(e) => {
                                const selectedTeamId = e.target.value
                                const selectedTeam = availableTeams.find(t => t.tid === selectedTeamId)
                                if (selectedTeam) {
                                  setNewPlayer({
                                    ...newPlayer,
                                    tid: selectedTeam.tid,
                                    tname: selectedTeam.tname,
                                    abbr: selectedTeam.abbr,
                                    fullname: selectedTeam.fullname,
                                    logo: selectedTeam.logo
                                  })
                                }
                              }}
                              disabled={loadingTeams || availableTeams.length === 0}
                              onFocus={() => {
                                // Fetch teams when focusing on the dropdown if not already loaded
                                if (availableTeams.length === 0 && selectedRoaster) {
                                  fetchTeams(selectedRoaster._id)
                                }
                              }}
                            >
                              <option value="">Select a team...</option>
                              {availableTeams.map((team) => (
                                <option key={team.tid} value={team.tid}>
                                  {team.tname} ({team.abbr})
                                </option>
                              ))}
                            </select>
                            {loadingTeams && (
                              <p className="text-xs text-gray-500 mt-1">Loading teams...</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={() => handleAddPlayer(roaster._id)}
                            disabled={!newPlayer.pid || !newPlayer.pname || !newPlayer.role}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Player
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Players Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPlayers.map((player, idx) => (
                        <Card key={`${player?.pid ?? 'pid-missing'}-${player?.team?.tid ?? 'team-missing'}-${idx}`} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {editingPlayer?.pid === player.pid ? (
                                <Input
                                  className="w-full text-sm font-semibold mb-1"
                                  value={editingPlayer.pname}
                                  onChange={(e) => setEditingPlayer({
                                    ...editingPlayer,
                                    pname: e.target.value
                                  })}
                                />
                              ) : (
                                <h6 className="font-semibold text-gray-900">{player.pname}</h6>
                              )}
                              <p className="text-xs text-gray-500">ID: {player.pid}</p>
                            </div>
                            {isEditing && !editingPlayer && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemovePlayer(roaster._id, player.pid)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2 mb-3">
                            {editingPlayer?.pid === player.pid ? (
                              <div className="space-y-2">
                                {/* Position/Role */}
                                <div>
                                  <Label className="text-xs text-gray-600">Position</Label>
                                  <select
                                    key={`role-select-${editingPlayer.pid}-${editingPlayer.role}`}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                    value={editingPlayer.role}
                                    onChange={(e) => setEditingPlayer({
                                      ...editingPlayer,
                                      role: e.target.value
                                    })}
                                  >
                                    <option value="Goalkeeper">Goalkeeper</option>
                                    <option value="Defender">Defender</option>
                                    <option value="Midfielder">Midfielder</option>
                                    <option value="Forward">Forward</option>
                                  </select>
                                </div>

                                {/* Rating */}
                                <div>
                                  <Label className="text-xs text-gray-600">Rating</Label>
                                  <Input
                                    className="w-full text-xs"
                                    type="number"
                                    step="0.1"
                                    value={editingPlayer.rating}
                                    onChange={(e) => setEditingPlayer({
                                      ...editingPlayer,
                                      rating: e.target.value
                                    })}
                                  />
                                </div>

                                {/* Team/Club */}
                                <div>
                                  <Label className="text-xs text-gray-600">Team/Club</Label>
                                  <select
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-1"
                                    value={editingPlayer.team.tid || ''}
                                    onChange={(e) => {
                                      const selectedTeamId = e.target.value
                                      const selectedTeam = availableTeams.find(t => t.tid === selectedTeamId)
                                      if (selectedTeam) {
                                        setEditingPlayer({
                                          ...editingPlayer,
                                          team: {
                                            tid: selectedTeam.tid,
                                            tname: selectedTeam.tname,
                                            abbr: selectedTeam.abbr,
                                            fullname: selectedTeam.fullname,
                                            logo: selectedTeam.logo
                                          }
                                        })
                                      }
                                    }}
                                    disabled={loadingTeams}
                                  >
                                    <option value="">Select a team...</option>
                                    {availableTeams.map((team) => (
                                      <option key={team.tid} value={team.tid}>
                                        {team.tname} ({team.abbr})
                                      </option>
                                    ))}
                                  </select>
                                  {loadingTeams && (
                                    <p className="text-xs text-gray-500 mt-1">Loading teams...</p>
                                  )}
                                  {!loadingTeams && availableTeams.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">No teams available. Populate players first.</p>
                                  )}
                                </div>
                                
                                {/* Display team details (read-only for reference) */}
                                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t">
                                  <div>ID: {editingPlayer.team.tid || '-'}</div>
                                  <div>Name: {editingPlayer.team.tname || '-'}</div>
                                  <div>Abbr: {editingPlayer.team.abbr || '-'}</div>
                                  <div>Full: {editingPlayer.team.fullname || '-'}</div>
                                  <div className="truncate">Logo: {editingPlayer.team.logo || '-'}</div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdatePlayerInfo(roaster._id)}
                                    className="flex-1 h-7 text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingPlayer(null)}
                                    className="h-7 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <Badge 
                                    variant="outline"
                                    className={`
                                      ${player.role === 'Goalkeeper' || player.role === 'GK' ? 'bg-yellow-100 text-yellow-800' : ''}
                                      ${player.role === 'Defender' || player.role === 'DEF' ? 'bg-blue-100 text-blue-800' : ''}
                                      ${player.role === 'Midfielder' || player.role === 'MID' ? 'bg-green-100 text-green-800' : ''}
                                      ${player.role === 'Forward' || player.role === 'FWD' ? 'bg-red-100 text-red-800' : ''}
                                    `}
                                  >
                                    {player.role === 'Goalkeeper' ? 'GK' : player.role === 'Defender' ? 'DEF' : player.role === 'Midfielder' ? 'MID' : player.role === 'Forward' ? 'FWD' : player.role}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span className="text-sm font-semibold">{player.rating}</span>
                                    {isEditing && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          // Get the player's role and normalize to full name format
                                          // Fantasy roaster should use: Goalkeeper, Defender, Midfielder, Forward
                                          const validRoles = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
                                          const rawRole = String(player.role || '').trim()
                                          
                                          // Map abbreviations to full names
                                          const roleMap: { [key: string]: string } = {
                                            'GK': 'Goalkeeper',
                                            'DEF': 'Defender',
                                            'MID': 'Midfielder',
                                            'FWD': 'Forward',
                                            'Goalkeeper': 'Goalkeeper',
                                            'Defender': 'Defender',
                                            'Midfielder': 'Midfielder',
                                            'Forward': 'Forward'
                                          }
                                          
                                          // Normalize the role
                                          const upperRole = rawRole.toUpperCase()
                                          let normalizedRole = roleMap[upperRole] || roleMap[rawRole] || rawRole
                                          
                                          // Final check: if not a valid full name, default to Midfielder
                                          if (!validRoles.includes(normalizedRole)) {
                                            normalizedRole = 'Midfielder'
                                          }
                                          
                                          setEditingPlayer({
                                            pid: player.pid,
                                            pname: player.pname || '',
                                            role: normalizedRole,
                                            rating: player.rating || '0',
                                            team: { 
                                              tid: player.team?.tid || '',
                                              tname: player.team?.tname || '',
                                              logo: player.team?.logo || '',
                                              fullname: player.team?.fullname || '',
                                              abbr: player.team?.abbr || ''
                                            }
                                          })
                                          
                                          // Fetch available teams when starting to edit
                                          fetchTeams(roaster._id)
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <div className="text-sm">
                                  <p className="font-medium text-gray-700">{player.team.tname}</p>
                                  <p className="text-gray-500">{player.team.abbr}</p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Player Status Badges */}
                          <div className="flex flex-wrap gap-1">
                            {player.is_new && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                New
                              </Badge>
                            )}
                            {player.is_injuried && (
                              <Badge className="text-xs bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Injured
                              </Badge>
                            )}
                            {player.is_banned && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                <Shield className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            )}
                            {player.transfer_radar && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                Transfer
                              </Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredRoasters.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center">
              <Trophy className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fantasy Roasters Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No roasters match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first fantasy roaster for the season.'
                }
              </p>
              <div className="flex gap-3">
                {(searchTerm || statusFilter !== 'all') && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Roaster
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
