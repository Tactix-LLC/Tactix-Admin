"use client"

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { playerPointsAPI } from '@/lib/api'
import { PlayerStat } from '@/types'
import { useUIStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Save, Users } from 'lucide-react'

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}

interface BulkEditModalProps {
  players: PlayerStat[]
  gameWeekId: string
  onClose: () => void
  onUpdate: () => void
}

interface BulkUpdateData {
  minutesplayed?: number
  goalscored?: number
  assist?: number
  cleansheet?: number
  shotssaved?: number
  penaltysaved?: number
  yellowcard?: number
  redcard?: number
  owngoal?: number
  goalsconceded?: number
  penaltymissed?: number
}

interface BulkUpdateItem extends BulkUpdateData {
  pid: string
}

export function BulkEditModal({ players, gameWeekId, onClose, onUpdate }: BulkEditModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [updateData, setUpdateData] = useState<BulkUpdateData>({})
  const [activeFields, setActiveFields] = useState<Set<keyof BulkUpdateData>>(new Set())
  const { addNotification } = useUIStore()

  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: BulkUpdateItem[]) => 
      playerPointsAPI.bulkUpdate(gameWeekId, updates),
    onSuccess: (response) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: `${response.data?.updatedCount || 0} players updated successfully`
      })
      onUpdate()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update players'
      })
    }
  })

  const handlePlayerToggle = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers)
    if (checked) {
      newSelected.add(playerId)
    } else {
      newSelected.delete(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(new Set(players.map(p => p.pid)))
    } else {
      setSelectedPlayers(new Set())
    }
  }

  const handleFieldToggle = (field: keyof BulkUpdateData, checked: boolean) => {
    const newActiveFields = new Set(activeFields)
    if (checked) {
      newActiveFields.add(field)
    } else {
      newActiveFields.delete(field)
      const newUpdateData = { ...updateData }
      delete newUpdateData[field]
      setUpdateData(newUpdateData)
    }
    setActiveFields(newActiveFields)
  }

  const handleInputChange = (field: keyof BulkUpdateData, value: string) => {
    const numValue = parseInt(value) || 0
    setUpdateData(prev => ({ ...prev, [field]: numValue }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedPlayers.size === 0) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Please select at least one player'
      })
      return
    }

    if (activeFields.size === 0) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Please select at least one field to update'
      })
      return
    }

    // Create updates array
    const updates = Array.from(selectedPlayers).map(pid => ({
      pid,
      ...Object.fromEntries(
        Array.from(activeFields).map(field => [field, updateData[field]])
      )
    }))

    bulkUpdateMutation.mutate(updates)
  }

  const fieldLabels: Record<keyof BulkUpdateData, string> = {
    minutesplayed: 'Minutes Played',
    goalscored: 'Goals Scored',
    assist: 'Assists',
    cleansheet: 'Clean Sheets',
    shotssaved: 'Saves',
    penaltysaved: 'Penalty Saves',
    yellowcard: 'Yellow Cards',
    redcard: 'Red Cards',
    owngoal: 'Own Goals',
    goalsconceded: 'Goals Conceded',
    penaltymissed: 'Penalties Missed',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Bulk Edit Player Stats
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Update multiple players at once
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Select Players</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedPlayers.size === players.length && players.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select All ({players.length})
                  </Label>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="grid gap-2 p-4">
                  {players.map((player) => (
                    <div key={player.pid} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`player-${player.pid}`}
                        checked={selectedPlayers.has(player.pid)}
                        onCheckedChange={(checked) => handlePlayerToggle(player.pid, checked as boolean)}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <Label htmlFor={`player-${player.pid}`} className="font-medium">
                            {player.full_name}
                          </Label>
                          <p className="text-sm text-gray-500">{player.tname}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.position}</Badge>
                          <span className="text-sm font-medium">{player.fantasy_point || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                {selectedPlayers.size} of {players.length} players selected
              </p>
            </div>

            {/* Field Updates */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Select Fields to Update</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field}`}
                        checked={activeFields.has(field as keyof BulkUpdateData)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field as keyof BulkUpdateData, checked as boolean)
                        }
                      />
                      <Label htmlFor={`field-${field}`}>{label}</Label>
                    </div>
                    
                    {activeFields.has(field as keyof BulkUpdateData) && (
                      <Input
                        type="number"
                        min="0"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        value={updateData[field as keyof BulkUpdateData] || ''}
                        onChange={(e) => handleInputChange(field as keyof BulkUpdateData, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedPlayers.size > 0 && activeFields.size > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Update Summary</h4>
                <p className="text-sm text-blue-800">
                  Will update <strong>{selectedPlayers.size}</strong> players with{' '}
                  <strong>{activeFields.size}</strong> field(s)
                </p>
                <div className="mt-2 text-sm text-blue-700">
                  Fields: {Array.from(activeFields).map(field => fieldLabels[field]).join(', ')}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={bulkUpdateMutation.isPending || selectedPlayers.size === 0 || activeFields.size === 0}
                className="flex-1 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {bulkUpdateMutation.isPending ? 'Updating...' : `Update ${selectedPlayers.size} Players`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
