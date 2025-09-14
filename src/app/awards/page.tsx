"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { awardsAPI, usersAPI } from "@/lib/api"
import { Award, CreateAwardData } from "@/types"

type NewAwardData = {
  client_id: string
  season: string
  month: string
  weekly_monthly_yearly: string
  prize: number
  total_fantasy_point: number
}
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Edit3, Plus, Trash2, RefreshCw, Award as AwardIcon, Trophy, Medal, Crown, X } from "lucide-react"

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}
import { useUIStore } from "@/lib/store"
import { Label } from "@/components/ui/label"

export default function AwardsPage() {
  const [search, setSearch] = useState("")
  const [editingAward, setEditingAward] = useState<Award | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [newAward, setNewAward] = useState<NewAwardData>({
    client_id: "",
    season: "23-24",
    month: "",
    weekly_monthly_yearly: "Monthly",
    prize: 0,
    total_fantasy_point: 0
  })
  const [selectedClient, setSelectedClient] = useState<{ _id: string; first_name: string; last_name: string; email: string } | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch awards
  const { data: awardsData, isLoading, error, refetch } = useQuery({
    queryKey: ["awards", search],
    queryFn: () => awardsAPI.getAll({ search }),
  })

  // Fetch client awards if client selected
  const { data: clientAwardsData } = useQuery({
    queryKey: ["clientAwards", selectedClientId],
    queryFn: () => selectedClientId ? awardsAPI.getClientAwards(selectedClientId) : null,
    enabled: !!selectedClientId,
  })

  // Fetch all users for client dropdown
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAll({ limit: 1000 }),
  })

  // Create award mutation
  const createAwardMutation = useMutation({
    mutationFn: awardsAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Award created successfully'
      })
      setShowCreateModal(false)
      setNewAward({
        client_id: "",
        season: "23-24",
        month: "",
        weekly_monthly_yearly: "Monthly",
        prize: 0,
        total_fantasy_point: 0
      })
      setSelectedClient(null)
      setClientSearch("")
      setShowClientDropdown(false)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create award'
      })
    }
  })

  // Delete award mutation
  const deleteAwardMutation = useMutation({
    mutationFn: awardsAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Award deleted successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete award'
      })
    }
  })

  const awards = useMemo(() => (awardsData?.data as { winners?: Award[] })?.winners ?? [], [awardsData])
  const users = useMemo(() => usersData?.data?.data ?? [], [usersData])
  
  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!clientSearch) return users
    return users.filter((user: { _id: string; first_name: string; last_name: string; email: string }) => 
      `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(clientSearch.toLowerCase())
    )
  }, [users, clientSearch])

  const handleClientSelect = (user: { _id: string; first_name: string; last_name: string; email: string }) => {
    setSelectedClient(user)
    setClientSearch(`${user.first_name} ${user.last_name} (${user.email})`)
    setNewAward(prev => ({ ...prev, client_id: user._id }))
    setShowClientDropdown(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this award?')) {
      deleteAwardMutation.mutate(id)
    }
  }

  const getAwardIcon = (type: string) => {
    const iconMap = {
      'first': <Crown className="h-4 w-4 text-yellow-500" />,
      'second': <Medal className="h-4 w-4 text-gray-400" />,
      'third': <Medal className="h-4 w-4 text-orange-500" />,
      'winner': <Trophy className="h-4 w-4 text-blue-500" />,
      'participant': <AwardIcon className="h-4 w-4 text-green-500" />
    }
    return iconMap[type as keyof typeof iconMap] || <AwardIcon className="h-4 w-4 text-gray-500" />
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-100 text-yellow-800">🥇 1st Place</Badge>
    if (position === 2) return <Badge className="bg-gray-100 text-gray-800">🥈 2nd Place</Badge>
    if (position === 3) return <Badge className="bg-orange-100 text-orange-800">🥉 3rd Place</Badge>
    return <Badge variant="outline">#{position}</Badge>
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load awards</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Awards Management</h1>
            <p className="text-gray-600">Manage player awards, achievements and rankings</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Award
          </Button>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search awards, players, or competitions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Input
                  placeholder="Client ID for specific awards..."
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-64"
                />
              </div>
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

        {/* Client Awards Section */}
        {selectedClientId && clientAwardsData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AwardIcon className="h-5 w-5" />
                Awards for Client: {selectedClientId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientAwardsData.data?.clientAwards?.map((award: Award, idx: number) => (
                  <div key={award._id || idx} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      {getAwardIcon(award.award_type)}
                      <h3 className="font-medium">{award.competition_name || 'Competition'}</h3>
                    </div>
                    {getPositionBadge(award.position || 1)}
                    <p className="text-sm text-gray-600 mt-2">
                      Game Week: {award.game_week || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Points: {award.total_point || 0}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Awards Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                All Awards
              </div>
              {awards.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {awards.length} awards
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : awards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Trophy className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No awards found</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create First Award
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prize</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(awards as (Award & Record<string, unknown>)[]).map((award: Award & Record<string, unknown>, idx: number) => (
                      <tr key={award._id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <AwardIcon className="h-4 w-4 text-blue-500" />
                            {(award.client_id as { full_name?: string; first_name?: string; last_name?: string })?.full_name || (award.client_id as { first_name?: string; last_name?: string })?.first_name + ' ' + (award.client_id as { first_name?: string; last_name?: string })?.last_name || 'Unknown Player'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {String(award.season || 'N/A')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {String(award.month || 'N/A')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Badge variant="outline">{String(award.weekly_monthly_yearly || 'N/A')}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {String(award.total_fantasy_point || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ${String(award.prize || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex flex-col gap-1">
                            <Badge variant={award.is_approved ? "default" : "secondary"} className="text-xs">
                              {award.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                            <Badge variant={award.withdrawn ? "destructive" : "outline"} className="text-xs">
                              {award.withdrawn ? 'Withdrawn' : 'Available'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setEditingAward(award)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(award._id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              disabled={deleteAwardMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Award Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Award</h2>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client_search">Client *</Label>
                  <div className="relative" ref={dropdownRef}>
                    <Input
                      id="client_search"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value)
                        setShowClientDropdown(true)
                        if (!e.target.value) {
                          setSelectedClient(null)
                          setNewAward(prev => ({ ...prev, client_id: "" }))
                        }
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Search for client..."
                    />
                    {showClientDropdown && filteredUsers.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.map((user: { _id: string; first_name: string; last_name: string; email: string }) => (
                          <div
                            key={user._id}
                            onClick={() => handleClientSelect(user)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showClientDropdown && filteredUsers.length === 0 && clientSearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-gray-500">
                        No clients found
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="season">Season *</Label>
                    <Input
                      id="season"
                      value={newAward.season}
                      onChange={(e) => setNewAward(prev => ({ ...prev, season: e.target.value }))}
                      placeholder="e.g., 23-24"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <Input
                      id="month"
                      type="month"
                      value={newAward.month}
                      onChange={(e) => setNewAward(prev => ({ ...prev, month: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="weekly_monthly_yearly">Period Type *</Label>
                  <select
                    id="weekly_monthly_yearly"
                    value={newAward.weekly_monthly_yearly}
                    onChange={(e) => setNewAward(prev => ({ ...prev, weekly_monthly_yearly: e.target.value }))}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prize">Prize Amount ($) *</Label>
                    <Input
                      id="prize"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newAward.prize}
                      onChange={(e) => setNewAward(prev => ({ ...prev, prize: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_fantasy_point">Total Fantasy Points *</Label>
                    <Input
                      id="total_fantasy_point"
                      type="number"
                      min="0"
                      value={newAward.total_fantasy_point}
                      onChange={(e) => setNewAward(prev => ({ ...prev, total_fantasy_point: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createAwardMutation.mutate(newAward as unknown as CreateAwardData)}
                  disabled={createAwardMutation.isPending || !newAward.client_id || !newAward.season || !newAward.month}
                >
                  {createAwardMutation.isPending ? 'Creating...' : 'Create Award'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
