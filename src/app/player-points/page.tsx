"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { playerPointsAPI, gameWeeksAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit3, Save, X, RefreshCw, Calculator } from "lucide-react"
import { PlayerStat, GameWeek } from "@/types"

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}
import { useUIStore } from "@/lib/store"
import { EditPlayerModal } from "@/components/player-points/edit-player-modal"
import { BulkEditModal } from "@/components/player-points/bulk-edit-modal"

export default function PlayerPointsPage() {
  const [search, setSearch] = useState("")
  const [selectedGameWeek, setSelectedGameWeek] = useState<string>("")
  const [editingPlayer, setEditingPlayer] = useState<PlayerStat | null>(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Fetch game weeks for selection
  const { data: gameWeeksData } = useQuery({
    queryKey: ["gameWeeks"],
    queryFn: () => gameWeeksAPI.getAll(),
  })

  // Fetch player stats for selected game week
  const { data: playerStatsData, isLoading, error, refetch } = useQuery({
    queryKey: ["playerStats", selectedGameWeek, search],
    queryFn: () => selectedGameWeek ? playerPointsAPI.getByGameWeek(selectedGameWeek, search) : null,
    enabled: !!selectedGameWeek,
  })

  // Generate player stats mutation
  const generateStatsMutation = useMutation({
    mutationFn: playerPointsAPI.generatePlayerStats,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Player stats generated successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to generate player stats'
      })
    }
  })

  // Recalculate points mutation
  const recalculateMutation = useMutation({
    mutationFn: playerPointsAPI.recalculateGameWeek,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'All team points recalculated successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to recalculate points'
      })
    }
  })

  // Recalculate team points mutation
  const recalculateTeamsMutation = useMutation({
    mutationFn: playerPointsAPI.recalculateTeamPoints,
    onSuccess: (data) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: `Team points recalculated successfully. Updated ${data.data?.updatedTeams || 0} out of ${data.data?.totalTeams || 0} teams.`
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to recalculate team points'
      })
    }
  })

  const gameWeeks = useMemo(() => gameWeeksData?.data?.data ?? [], [gameWeeksData])
  const selectedGameWeekData = useMemo(() => 
    gameWeeks.find((gw: GameWeek) => gw._id === selectedGameWeek), 
    [gameWeeks, selectedGameWeek]
  )

  const allPlayers = useMemo(() => playerStatsData?.data?.playerStat ?? [], [playerStatsData])
  const players = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allPlayers
    return allPlayers.filter((p: PlayerStat) =>
      (p.full_name || "").toLowerCase().includes(term) ||
      (p.tname || "").toLowerCase().includes(term) ||
      (p.position || "").toLowerCase().includes(term)
    )
  }, [allPlayers, search])

  const handleRecalculate = async () => {
    if (!selectedGameWeek) return
    recalculateMutation.mutate(selectedGameWeek)
  }

  const handlePlayerUpdate = () => {
    refetch()
    setEditingPlayer(null)
  }

  const handleBulkUpdate = () => {
    refetch()
    setShowBulkEdit(false)
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load player stats</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Player Points Management</h1>
            <p className="text-gray-600">Edit player statistics and points for each game week</p>
          </div>
        </div>

        {/* Game Week Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Game Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedGameWeek} onValueChange={setSelectedGameWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game week" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameWeeks.map((gameWeek: GameWeek) => (
                      <SelectItem key={gameWeek._id} value={gameWeek._id}>
                        Game Week {gameWeek.game_week}
                        {gameWeek.is_done && <Badge className="ml-2" variant="secondary">Done</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedGameWeekData?.is_done && (
                <Button 
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate All Points'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedGameWeek && (
          <>
            {/* Search and Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search players, teams, or positions..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={() => generateStatsMutation.mutate(selectedGameWeek)}
                    disabled={generateStatsMutation.isPending || !selectedGameWeek}
                    className="flex items-center gap-2"
                  >
                    <Calculator className={`h-4 w-4 ${generateStatsMutation.isPending ? 'animate-spin' : ''}`} />
                    Generate Player Stats
                  </Button>
                  <Button
                    onClick={() => recalculateTeamsMutation.mutate(selectedGameWeek)}
                    disabled={recalculateTeamsMutation.isPending || !selectedGameWeek}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Calculator className={`h-4 w-4 ${recalculateTeamsMutation.isPending ? 'animate-spin' : ''}`} />
                    {recalculateTeamsMutation.isPending ? 'Recalculating...' : 'Recalculate Team Points'}
                  </Button>
                  <Button
                    onClick={() => setShowBulkEdit(true)}
                    disabled={players.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Bulk Edit
                  </Button>
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Player Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    Player Statistics - Game Week {selectedGameWeekData?.game_week}
                    {selectedGameWeekData?.is_done && (
                      <Badge className="ml-2" variant="secondary">Completed</Badge>
                    )}
                  </div>
                  {players.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {players.length} players
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </div>
                ) : players.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No player stats found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fantasy Points</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {players.map((player: PlayerStat, idx: number) => (
                          <tr key={`${player.pid || idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {player.full_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{player.tname}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <Badge variant="outline">{player.position}</Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{player.minutesplayed || 0}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{player.goalscored || 0}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{player.assist || 0}</td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              <span className={`${
                                (player.fantasy_point || 0) > 0 
                                  ? 'text-green-600' 
                                  : (player.fantasy_point || 0) < 0 
                                    ? 'text-red-600' 
                                    : 'text-gray-900'
                              }`}>
                                {player.fantasy_point || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <Button
                                onClick={() => setEditingPlayer(player)}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Edit3 className="h-3 w-3" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Edit Player Modal */}
        {editingPlayer && (
          <EditPlayerModal
            player={editingPlayer}
            gameWeekId={selectedGameWeek}
            onClose={() => setEditingPlayer(null)}
            onUpdate={handlePlayerUpdate}
          />
        )}

        {/* Bulk Edit Modal */}
        {showBulkEdit && (
          <BulkEditModal
            players={players}
            gameWeekId={selectedGameWeek}
            onClose={() => setShowBulkEdit(false)}
            onUpdate={handleBulkUpdate}
          />
        )}
      </div>
    </MainLayout>
  )
}
