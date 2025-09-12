"use client"

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { playerPointsAPI } from '@/lib/api'
import { PlayerStat } from '@/types'
import { useUIStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Save, Calculator } from 'lucide-react'

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}

interface PlayerWithStat extends PlayerStat {
  stat?: {
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
}

interface EditPlayerModalProps {
  player: PlayerWithStat
  gameWeekId: string
  onClose: () => void
  onUpdate: () => void
}

export function EditPlayerModal({ player, gameWeekId, onClose, onUpdate }: EditPlayerModalProps) {
  // Edit raw stats from the stat object (actual performance data)
  const [formData, setFormData] = useState<Partial<PlayerStat>>({
    minutesplayed: player.stat?.minutesplayed || 0,
    goalscored: player.stat?.goalscored || 0,
    assist: player.stat?.assist || 0,
    cleansheet: player.stat?.cleansheet || 0,
    shotssaved: player.stat?.shotssaved || 0,
    penaltysaved: player.stat?.penaltysaved || 0,
    yellowcard: player.stat?.yellowcard || 0,
    redcard: player.stat?.redcard || 0,
    owngoal: player.stat?.owngoal || 0,
    goalsconceded: player.stat?.goalsconceded || 0,
    penaltymissed: player.stat?.penaltymissed || 0,
  })

  const [calculatedPoints, setCalculatedPoints] = useState<number>(player.fantasy_point || 0)
  const { addNotification } = useUIStore()

  // Recalculate points when form data changes
  useEffect(() => {
    const points = calculateEstimatedPoints()
    setCalculatedPoints(points)
  }, [formData])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PlayerStat>) => 
      playerPointsAPI.updatePlayer(gameWeekId, player.pid.toString(), data),
    onSuccess: (response) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: `${player.full_name}'s stats updated successfully`
      })
      setCalculatedPoints(response.data?.recalculatedFantasyPoints || 0)
      onUpdate()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update player stats'
      })
    }
  })

  const handleInputChange = (field: keyof PlayerStat, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({ ...prev, [field]: numValue }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const calculateEstimatedPoints = () => {
    // Simple FPL point estimation based on the form data
    let points = 0
    const minutes = formData.minutesplayed || 0
    const goals = formData.goalscored || 0
    const assists = formData.assist || 0
    const cleanSheets = formData.cleansheet || 0
    const saves = formData.shotssaved || 0
    const penaltySaves = formData.penaltysaved || 0
    const yellows = formData.yellowcard || 0
    const reds = formData.redcard || 0
    const ownGoals = formData.owngoal || 0
    const goalsConceded = formData.goalsconceded || 0
    const penaltyMissed = formData.penaltymissed || 0

    // Playing time points
    if (minutes >= 60) points += 2
    else if (minutes > 0) points += 1

    // Goals (position-based)
    if (player.position === 'Goalkeeper') points += goals * 10
    else if (player.position === 'Defender') points += goals * 6
    else if (player.position === 'Midfielder') points += goals * 5
    else if (player.position === 'Forward') points += goals * 4

    // Assists
    points += assists * 3

    // Clean sheets
    if (player.position === 'Goalkeeper' || player.position === 'Defender') {
      points += cleanSheets * 4
    } else if (player.position === 'Midfielder') {
      points += cleanSheets * 1
    }

    // Goalkeeper saves (per 3)
    points += Math.floor(saves / 3)

    // Penalty saves
    points += penaltySaves * 5

    // Negative points
    points -= yellows * 1
    points -= reds * 3
    points -= ownGoals * 2
    points -= penaltyMissed * 2
    
    // Goals conceded (GK/DEF only, per 2 goals)
    if (player.position === 'Goalkeeper' || player.position === 'Defender') {
      points -= Math.floor(goalsConceded / 2)
    }

    return points
  }

  useEffect(() => {
    calculateEstimatedPoints()
  }, [formData])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                Edit Player Stats
                <Badge variant="outline">{player.position}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {player.full_name} • {player.tname}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current vs Estimated Points */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Current Points</p>
                  <p className="text-2xl font-bold text-gray-900">{player.fantasy_point || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimated Points</p>
                  <p className={`text-2xl font-bold ${
                    calculatedPoints > (player.fantasy_point || 0) 
                      ? 'text-green-600' 
                      : calculatedPoints < (player.fantasy_point || 0) 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                  }`}>
                    {calculatedPoints}
                  </p>
                </div>
              </div>
            </div>

            {/* Playing Time */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Playing Time</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="minutesplayed">Minutes Played</Label>
                  <Input
                    id="minutesplayed"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.minutesplayed || 0}
                    onChange={(e) => handleInputChange('minutesplayed', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Goals and Assists */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Goals & Assists</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalscored">Goals Scored</Label>
                  <Input
                    id="goalscored"
                    type="number"
                    min="0"
                    value={formData.goalscored || 0}
                    onChange={(e) => handleInputChange('goalscored', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="assist">Assists</Label>
                  <Input
                    id="assist"
                    type="number"
                    min="0"
                    value={formData.assist || 0}
                    onChange={(e) => handleInputChange('assist', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Defensive Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Defensive Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cleansheet">Clean Sheets</Label>
                  <Input
                    id="cleansheet"
                    type="number"
                    min="0"
                    max="1"
                    value={formData.cleansheet || 0}
                    onChange={(e) => handleInputChange('cleansheet', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="goalsconceded">Goals Conceded</Label>
                  <Input
                    id="goalsconceded"
                    type="number"
                    min="0"
                    value={formData.goalsconceded || 0}
                    onChange={(e) => handleInputChange('goalsconceded', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Goalkeeper Stats */}
            {player.position === 'Goalkeeper' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Goalkeeper Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shotssaved">Saves</Label>
                    <Input
                      id="shotssaved"
                      type="number"
                      min="0"
                      value={formData.shotssaved || 0}
                      onChange={(e) => handleInputChange('shotssaved', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="penaltysaved">Penalty Saves</Label>
                    <Input
                      id="penaltysaved"
                      type="number"
                      min="0"
                      value={formData.penaltysaved || 0}
                      onChange={(e) => handleInputChange('penaltysaved', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Disciplinary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Disciplinary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yellowcard">Yellow Cards</Label>
                  <Input
                    id="yellowcard"
                    type="number"
                    min="0"
                    value={formData.yellowcard || 0}
                    onChange={(e) => handleInputChange('yellowcard', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="redcard">Red Cards</Label>
                  <Input
                    id="redcard"
                    type="number"
                    min="0"
                    max="1"
                    value={formData.redcard || 0}
                    onChange={(e) => handleInputChange('redcard', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Negative Events */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Negative Events</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owngoal">Own Goals</Label>
                  <Input
                    id="owngoal"
                    type="number"
                    min="0"
                    value={formData.owngoal || 0}
                    onChange={(e) => handleInputChange('owngoal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="penaltymissed">Penalties Missed</Label>
                  <Input
                    id="penaltymissed"
                    type="number"
                    min="0"
                    value={formData.penaltymissed || 0}
                    onChange={(e) => handleInputChange('penaltymissed', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="flex-1 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
