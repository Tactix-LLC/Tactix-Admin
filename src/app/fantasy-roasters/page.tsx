'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/lib/store'
import { fantasyRoasterAPI } from '@/lib/api'
import { 
  FantasyRoaster, 
  FantasyPlayer, 
  CreateFantasyRoasterData,
  UpdatePlayerRatingData,
  UpdateRoasterStatusData,
  AddPlayerData,
  RemovePlayerData
} from '@/types'
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  RefreshCw,
  Users
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
  const [newSeasonName, setNewSeasonName] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<{ pid: string; rating: string } | null>(null)
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
  }, [])

  const fetchRoasters = async () => {
    try {
      const response = await fantasyRoasterAPI.getFantasyRoasters()
      const list = Array.isArray(response.data) ? response.data : []
      setRoasters(list)
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to fetch roasters' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoaster = async () => {
    if (!newSeasonName.trim()) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Please enter a season name' })
      return
    }

    try {
      setLoading(true)
      const data: CreateFantasyRoasterData = {
        season_name: newSeasonName,
        players: []
      }
      const response = await fantasyRoasterAPI.createFantasyRoaster(data)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Fantasy roaster created successfully' })
        setNewSeasonName('')
        setIsCreating(false)
        fetchRoasters()
      }
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to create roaster' })
    } finally {
      setLoading(false)
    }
  }

  const handlePopulatePlayers = async () => {
    try {
      setLoading(true)
      const response = await fantasyRoasterAPI.populatePlayersFromAPI()
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Players populated successfully' })
        fetchRoasters()
      }
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to populate players' })
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
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to update roaster status' })
    }
  }

  const handleUpdatePlayerRating = async (roasterId: string, pid: string, rating: string) => {
    try {
      const data: UpdatePlayerRatingData = {
        pid,
        rating: parseFloat(rating)
      }
      const response = await fantasyRoasterAPI.updatePlayerRating(roasterId, data)
      if (response.status === 'SUCCESS') {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Success', message: 'Player rating updated successfully' })
        setEditingPlayer(null)
        fetchRoasters()
      }
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to update player rating' })
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Error', message: 'Failed to delete roaster' })
    }
  }

  const filteredRoasters = (Array.isArray(roasters) ? roasters : []).filter((roaster) =>
    (roaster?.season_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && roasters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading roasters...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Fantasy Roasters</h1>
        <div className="flex gap-3">
          <Button 
            onClick={handlePopulatePlayers}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Populate Players
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Roaster
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search roasters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Create New Roaster Modal */}
      {isCreating && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">Create New Fantasy Roaster</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season Name
              </label>
              <Input
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Enter season name..."
              />
            </div>
            <Button onClick={handleCreateRoaster} disabled={loading}>
              <Check className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreating(false)
                setNewSeasonName('')
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Roasters List */}
      <div className="grid gap-4">
        {filteredRoasters.map((roaster) => (
          <Card key={roaster._id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{roaster.season_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    roaster.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {roaster.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Players: {roaster.players?.length ?? 0}</p>
                  <p>Created: {new Date(roaster.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(roaster.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRoaster(roaster)
                    setShowPlayers(!showPlayers || selectedRoaster?._id !== roaster._id)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPlayers && selectedRoaster?._id === roaster._id ? 'Hide' : 'View'} Players
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(roaster)}
                  className={roaster.is_active ? 'text-red-600' : 'text-green-600'}
                >
                  {roaster.is_active ? 'Deactivate' : 'Activate'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRoaster(roaster._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Players Section */}
            {showPlayers && selectedRoaster?._id === roaster._id && (
              <div className="mt-6 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Players ({roaster.players?.length ?? 0})</h4>
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? 'Done Editing' : 'Edit Players'}
                  </Button>
                </div>

                {/* Add New Player */}
                {isEditing && (
                  <Card className="p-4 mb-4 bg-gray-50">
                    <h5 className="font-medium mb-3">Add New Player</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Player ID"
                        value={newPlayer.pid}
                        onChange={(e) => setNewPlayer({...newPlayer, pid: e.target.value})}
                      />
                      <Input
                        placeholder="Player Name"
                        value={newPlayer.pname}
                        onChange={(e) => setNewPlayer({...newPlayer, pname: e.target.value})}
                      />
                      <Input
                        placeholder="Position"
                        value={newPlayer.role}
                        onChange={(e) => setNewPlayer({...newPlayer, role: e.target.value})}
                      />
                      <Input
                        placeholder="Rating"
                        type="number"
                        value={newPlayer.rating || ''}
                        onChange={(e) => setNewPlayer({...newPlayer, rating: parseFloat(e.target.value) || 0})}
                      />
                      <Input
                        placeholder="Team ID"
                        value={newPlayer.tid}
                        onChange={(e) => setNewPlayer({...newPlayer, tid: e.target.value})}
                      />
                      <Input
                        placeholder="Team Name"
                        value={newPlayer.tname}
                        onChange={(e) => setNewPlayer({...newPlayer, tname: e.target.value})}
                      />
                      <Input
                        placeholder="Team Abbr"
                        value={newPlayer.abbr}
                        onChange={(e) => setNewPlayer({...newPlayer, abbr: e.target.value})}
                      />
                      <Button 
                        onClick={() => handleAddPlayer(roaster._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Players Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {isEditing && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(roaster.players ?? []).map((player, idx) => (
                        <tr key={`${player?.pid ?? 'pid-missing'}-${player?.team?.tid ?? 'team-missing'}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {player.pname}
                              </div>
                              <div className="text-sm text-gray-500">ID: {player.pid}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {player.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {player.team.tname}
                              </div>
                              <div className="text-sm text-gray-500">{player.team.abbr}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingPlayer?.pid === player.pid ? (
                              <div className="flex gap-2">
                                <Input
                                  className="w-20"
                                  value={editingPlayer.rating}
                                  onChange={(e) => setEditingPlayer({
                                    ...editingPlayer,
                                    rating: e.target.value
                                  })}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePlayerRating(
                                    roaster._id, 
                                    player.pid, 
                                    editingPlayer.rating
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPlayer(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{player.rating}</span>
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingPlayer({
                                      pid: player.pid,
                                      rating: player.rating
                                    })}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              {player.is_new && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              )}
                              {player.is_injuried && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Injured
                                </span>
                              )}
                              {player.is_banned && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Banned
                                </span>
                              )}
                              {player.transfer_radar && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Transfer
                                </span>
                              )}
                            </div>
                          </td>
                          {isEditing && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemovePlayer(roaster._id, player.pid)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredRoasters.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No fantasy roasters found.</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Roaster
          </Button>
        </Card>
      )}
    </div>
  )
}
