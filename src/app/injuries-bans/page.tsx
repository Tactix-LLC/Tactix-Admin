"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { injuriesBansAPI, fantasyRoasterAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit3, Trash2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { FantasyPlayer } from "@/types"

interface InjuryBan {
  _id: string
  player: {
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
  }
  state: "Injury" | "Ban" | "U/A"
  injury_title?: string
  chance: number
  createdAt: string
  updatedAt: string
}

export default function InjuriesBansPage() {
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InjuryBan | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["injuries-bans"],
    queryFn: injuriesBansAPI.getAll,
  })

  const {
    data: rosterPlayersData,
    isLoading: isPlayersLoading,
    error: playersError,
  } = useQuery({
    queryKey: ["injuries-bans", "players"],
    queryFn: async () => {
      const response = await fantasyRoasterAPI.getActiveFantasyRoaster()
      const roasters = response.data ?? []
      const players = roasters.flatMap((roaster) => roaster.players ?? [])
      return players
    },
  })

  const all = useMemo(() => data?.data?.data?.injuriesBans ?? [], [data])
  
  // Get unique teams/clubs from all injuries/bans
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>()
    all.forEach((item: InjuryBan) => {
      if (item.player?.team?.tname) {
        teams.add(item.player.team.tname)
      }
    })
    return Array.from(teams).sort()
  }, [all])
  
  const injuriesBans = useMemo(() => {
    let filtered = all
    
    // Apply team/club filter
    if (teamFilter !== "all") {
      filtered = filtered.filter((item: InjuryBan) => 
        item.player?.team?.tname === teamFilter
      )
    }
    
    // Apply search filter
    const term = search.trim().toLowerCase()
    if (term) {
      filtered = filtered.filter((item: InjuryBan) =>
        item.player.pname.toLowerCase().includes(term) ||
        item.player.team.tname.toLowerCase().includes(term) ||
        item.state.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [all, search, teamFilter])

  const availablePlayers = useMemo(() => rosterPlayersData ?? [], [rosterPlayersData])

  useEffect(() => {
    if (playersError) {
      toast.error("Failed to load active roster players. Please make sure a roster is active.")
    }
  }, [playersError])

  const deleteMutation = useMutation({
    mutationFn: injuriesBansAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["injuries-bans"] })
      toast.success("Injury/Ban deleted successfully")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || "Failed to delete")
    },
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this injury/ban record?")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load injuries and bans</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Injuries & Bans</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={isPlayersLoading || !!playersError || availablePlayers.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Injury/Ban
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white text-gray-900 border border-gray-200 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Add Injury/Ban</DialogTitle>
              </DialogHeader>
              <CreateEditForm
                players={availablePlayers}
                isLoadingPlayers={isPlayersLoading}
                onSuccess={() => {
                  setIsCreateOpen(false)
                  queryClient.invalidateQueries({ queryKey: ["injuries-bans"] })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by player name, team, or status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Team/Club" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
                  <SelectItem value="all">All Teams/Clubs</SelectItem>
                  {uniqueTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chance %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {injuriesBans.map((item: InjuryBan) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{item.player.pname}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.player.team.tname}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.player.role}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.state === "Injury" ? "bg-red-100 text-red-800" :
                          item.state === "Ban" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {item.state}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.injury_title || "-"}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.chance}%</td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white text-gray-900 border border-gray-200 shadow-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Injury/Ban</DialogTitle>
                              </DialogHeader>
                              <CreateEditForm
                                players={availablePlayers}
                                isLoadingPlayers={isPlayersLoading}
                                item={item}
                                onSuccess={() => {
                                  setEditingItem(null)
                                  queryClient.invalidateQueries({ queryKey: ["injuries-bans"] })
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      </div>
    </MainLayout>
  )
}

interface CreateEditFormProps {
  item?: InjuryBan
  onSuccess: () => void
  players: FantasyPlayer[]
  isLoadingPlayers: boolean
}
function CreateEditForm({ item, onSuccess, players, isLoadingPlayers }: CreateEditFormProps) {
  type InjuryBanFormData = {
    state: "Injury" | "Ban" | "U/A"
    injury_title?: string
    chance: number
  }

  const [formData, setFormData] = useState<InjuryBanFormData>({
    state: item?.state || "Injury",
    injury_title: item?.injury_title || "",
    chance: item?.chance || 0,
  })
  const [selectedPlayerPid, setSelectedPlayerPid] = useState(item?.player.pid ?? "")
  const [playerSearch, setPlayerSearch] = useState("")
  const queryClient = useQueryClient()

  const filteredPlayers = useMemo(() => {
    const term = playerSearch.trim().toLowerCase()
    if (!term) return players
    return players.filter((player) =>
      player.pname.toLowerCase().includes(term) ||
      player.team.tname.toLowerCase().includes(term) ||
      player.role.toLowerCase().includes(term)
    )
  }, [playerSearch, players])

  const selectedPlayer = useMemo(
    () => players.find((player) => player.pid === selectedPlayerPid),
    [players, selectedPlayerPid]
  )

  const createMutation = useMutation({
    mutationFn: injuriesBansAPI.create,
    onSuccess: () => {
      toast.success("Injury/Ban created successfully")
      onSuccess()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || "Failed to create")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InjuryBanFormData> }) => injuriesBansAPI.update(id, data),
    onSuccess: () => {
      toast.success("Injury/Ban updated successfully")
      onSuccess()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || "Failed to update")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (item) {
      const payload: Partial<InjuryBanFormData> = {
        state: formData.state,
        chance: formData.chance,
      }

      if (formData.state === "Injury") {
        payload.injury_title = formData.injury_title
      }

      updateMutation.mutate({ id: item._id, data: payload })
    } else {
      if (isLoadingPlayers) {
        toast.error("Players are still loading. Please wait a moment and try again.")
        return
      }

      if (!selectedPlayer || !selectedPlayer.team) {
        toast.error("Please select a player")
        return
      }

      const payload = {
        player: {
          pid: selectedPlayer.pid,
          pname: selectedPlayer.pname,
          role: selectedPlayer.role,
          rating: selectedPlayer.rating,
          team: {
            tid: selectedPlayer.team.tid,
            tname: selectedPlayer.team.tname,
            logo: selectedPlayer.team.logo,
            fullname: selectedPlayer.team.fullname,
            abbr: selectedPlayer.team.abbr,
          },
        },
        state: formData.state,
        injury_title: formData.state === "Injury" ? formData.injury_title : undefined,
        chance: formData.chance,
      }

      createMutation.mutate(payload)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!item ? (
        <div className="space-y-2">
          <Label htmlFor="player-search">Player</Label>
          <Input
            id="player-search"
            placeholder={isLoadingPlayers ? "Loading players..." : "Search players by name, team, or position"}
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            disabled={isLoadingPlayers || createMutation.isPending}
          />
          <Select
            value={selectedPlayerPid}
            onValueChange={(value) => setSelectedPlayerPid(value)}
            disabled={isLoadingPlayers || filteredPlayers.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingPlayers
                    ? "Loading players..."
                    : filteredPlayers.length === 0
                    ? "No players available"
                    : "Select a player"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg max-h-72">
              {filteredPlayers.map((player) => (
                <SelectItem key={player.pid} value={player.pid}>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{player.pname}</span>
                    <span className="text-xs text-gray-500">
                      {player.team.tname} • {player.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {!isLoadingPlayers && filteredPlayers.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No players match your search. Try a different term.
                </div>
              )}
            </SelectContent>
          </Select>
          {!isLoadingPlayers && players.length === 0 && (
            <p className="text-sm text-error-600">
              No active roster players found. Please activate a roster or populate players first.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Player</Label>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">{item.player.pname}</div>
            <div className="text-xs text-gray-500">
              {item.player.team.tname} • {item.player.role}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="state">Status</Label>
        <Select
          value={formData.state}
          onValueChange={(value) =>
            setFormData({ ...formData, state: value as "Injury" | "Ban" | "U/A" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg">
            <SelectItem value="Injury">Injury</SelectItem>
            <SelectItem value="Ban">Ban</SelectItem>
            <SelectItem value="U/A">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.state === "Injury" && (
        <div className="space-y-2">
          <Label htmlFor="injury_title">Injury Title</Label>
          <Input
            id="injury_title"
            value={formData.injury_title}
            onChange={(e) => setFormData({ ...formData, injury_title: e.target.value })}
            placeholder="e.g., Hamstring injury"
            required={formData.state === "Injury"}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="chance">Chance of Playing (%)</Label>
        <Input
          id="chance"
          type="number"
          min="0"
          max="100"
          value={formData.chance}
          onChange={(e) => {
            const value = Number(e.target.value)
            const sanitized = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value))
            setFormData({ ...formData, chance: sanitized })
          }}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

