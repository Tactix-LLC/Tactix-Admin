"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pollAPI } from "@/lib/api"
import { Poll, CreatePollData, UpdatePollData } from "@/types"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Edit3, Plus, Trash2, RefreshCw, MessageSquare, X, BarChart3, Users } from "lucide-react"

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}
import { useUIStore } from "@/lib/store"

export default function PollsPage() {
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null)
  const [newPoll, setNewPoll] = useState<CreatePollData>({
    question: "",
    choices: [{ choice: "" }, { choice: "" }],
    close_date: ""
  })
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Fetch polls
  const { data: pollsData, isLoading, error, refetch } = useQuery({
    queryKey: ["polls", search],
    queryFn: () => pollAPI.getAll({ 
      ...(search && { search }), 
      limit: 100 
    }),
  })

  // Create poll mutation
  const createPollMutation = useMutation({
    mutationFn: pollAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Poll created successfully'
      })
      setShowCreateModal(false)
      resetNewPoll()
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create poll'
      })
    }
  })

  // Update poll mutation
  const updatePollMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePollData }) => 
      pollAPI.update(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Poll updated successfully'
      })
      setEditingPoll(null)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update poll'
      })
    }
  })

  // Update poll status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Open' | 'Closed' }) => 
      pollAPI.updateStatus(id, { status }),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Poll status updated successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update poll status'
      })
    }
  })

  // Delete poll mutation
  const deletePollMutation = useMutation({
    mutationFn: pollAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Poll deleted successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete poll'
      })
    }
  })

  const polls = useMemo(() => pollsData?.data?.polls ?? [], [pollsData])

  const resetNewPoll = () => {
    setNewPoll({
      question: "",
      choices: [{ choice: "" }, { choice: "" }],
      close_date: ""
    })
  }

  const addChoice = () => {
    setNewPoll(prev => ({
      ...prev,
      choices: [...prev.choices, { choice: "" }]
    }))
  }

  const removeChoice = (index: number) => {
    if (newPoll.choices.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index)
      }))
    }
  }

  const updateChoice = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { choice: value } : choice
      )
    }))
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this poll?')) {
      deletePollMutation.mutate(id)
    }
  }

  const handleStatusToggle = (poll: Poll) => {
    const newStatus = poll.status === 'Open' ? 'Closed' : 'Open'
    updateStatusMutation.mutate({ id: poll._id, status: newStatus })
  }

  const getTotalVotes = (poll: Poll): number => {
    return poll.choices.reduce((total, choice) => total + choice.selected_by, 0)
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load polls</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Poll Management</h1>
            <p className="text-gray-600">Create and manage user polls and surveys</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Poll
          </Button>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search polls..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
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

        {/* Polls Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Polls
              </div>
              {polls.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {polls.length} polls
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : polls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No polls found</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create First Poll
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Choices</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Votes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {polls.map((poll: Poll) => (
                      <tr key={poll._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="max-w-xs truncate" title={poll.question}>
                            {poll.question}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1">
                            {poll.choices.slice(0, 3).map((choice, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {choice.choice} ({choice.selected_by})
                              </Badge>
                            ))}
                            {poll.choices.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{poll.choices.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Badge 
                            variant={poll.status === 'Open' ? "default" : "secondary"}
                            className={poll.status === 'Open' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {poll.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {getTotalVotes(poll)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(poll.close_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setEditingPoll(poll)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleStatusToggle(poll)}
                              size="sm"
                              variant="outline"
                              className={`flex items-center gap-1 ${
                                poll.status === 'Open' 
                                  ? 'text-red-600 hover:text-red-700' 
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                              disabled={updateStatusMutation.isPending}
                            >
                              <BarChart3 className="h-3 w-3" />
                              {poll.status === 'Open' ? 'Close' : 'Open'}
                            </Button>
                            <Button
                              onClick={() => handleDelete(poll._id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              disabled={deletePollMutation.isPending}
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

        {/* Create Poll Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Poll</h2>
                <Button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetNewPoll()
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question *</Label>
                  <Input
                    id="question"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter poll question..."
                  />
                </div>

                <div>
                  <Label>Choices *</Label>
                  <div className="space-y-2 mt-2">
                    {newPoll.choices.map((choice, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={choice.choice}
                          onChange={(e) => updateChoice(index, e.target.value)}
                          placeholder={`Choice ${index + 1}`}
                        />
                        {newPoll.choices.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => removeChoice(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addChoice}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Choice
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="close_date">Close Date *</Label>
                  <Input
                    id="close_date"
                    type="date"
                    value={newPoll.close_date}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, close_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetNewPoll()
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createPollMutation.mutate(newPoll)}
                  disabled={
                    createPollMutation.isPending || 
                    !newPoll.question.trim() || 
                    !newPoll.close_date ||
                    newPoll.choices.some(choice => !choice.choice.trim())
                  }
                >
                  {createPollMutation.isPending ? 'Creating...' : 'Create Poll'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Poll Modal */}
        {editingPoll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Poll</h2>
                <Button
                  onClick={() => setEditingPoll(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_question">Question *</Label>
                  <Input
                    id="edit_question"
                    value={editingPoll.question}
                    onChange={(e) => setEditingPoll(prev => prev ? { ...prev, question: e.target.value } : null)}
                    placeholder="Enter poll question..."
                  />
                </div>

                <div>
                  <Label>Current Choices (Read-only)</Label>
                  <div className="space-y-2 mt-2">
                    {editingPoll.choices.map((choice, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={`${choice.choice} (${choice.selected_by} votes)`}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Choices cannot be modified after creation to preserve vote integrity
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit_close_date">Close Date *</Label>
                  <Input
                    id="edit_close_date"
                    type="date"
                    value={editingPoll.close_date ? new Date(editingPoll.close_date).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingPoll(prev => prev ? { ...prev, close_date: e.target.value } : null)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setEditingPoll(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingPoll) {
                      updatePollMutation.mutate({
                        id: editingPoll._id,
                        data: {
                          question: editingPoll.question,
                          close_date: editingPoll.close_date
                        }
                      })
                    }
                  }}
                  disabled={updatePollMutation.isPending || !editingPoll?.question.trim() || !editingPoll?.close_date}
                >
                  {updatePollMutation.isPending ? 'Updating...' : 'Update Poll'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
