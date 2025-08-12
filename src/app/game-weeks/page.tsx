"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gameWeeksAPI } from "@/lib/api"
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
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { gameWeekStatusOptions } from "@/lib/constants"
import { GameWeek } from "@/types"

export default function GameWeeksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const gameWeeks = gameWeeksData?.data?.data || []
  const totalGameWeeks = gameWeeksData?.data?.total || 0
  const totalPages = Math.ceil(totalGameWeeks / pageSize)

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
                        {formatDateTime(gameWeek.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(gameWeek.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(gameWeek.status)}
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

        {/* Create/Edit Modal would go here */}
        {/* For now, we'll add a simple form */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Game Week</CardTitle>
                <CardDescription>Add a new game week</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <Input placeholder="Game Week Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Week Number</label>
                    <Input type="number" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <Input type="datetime-local" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <Input type="datetime-local" />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      onClick={() => setShowCreateModal(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 