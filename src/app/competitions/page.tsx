"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { competitionsAPI, seasonsAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Trophy,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { competitionStatusOptions } from "@/lib/constants"
import { Competition, CreateCompetitionData, UpdateCompetitionData } from "@/types"

export default function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateCompetitionData>({
    cid: "",
    season: ""
  })
  const [editFormData, setEditFormData] = useState<UpdateCompetitionData>({
    cid: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const { data: competitionsData, isLoading, error } = useQuery({
    queryKey: ["competitions", currentPage, pageSize, searchTerm, statusFilter],
    queryFn: () => competitionsAPI.getAll({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  })

  // Fetch seasons for the form
  const { data: seasonsData } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonsAPI.getAll({ limit: 100 }),
  })

  const createCompetitionMutation = useMutation({
    mutationFn: competitionsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] })
      setShowCreateModal(false)
      resetForm()
      alert("Competition created successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error creating competition:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error creating competition: " + errorMessage)
    },
  })

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompetitionData }) => 
      competitionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] })
      setShowEditModal(false)
      setEditingCompetition(null)
      resetEditForm()
      alert("Competition updated successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error updating competition:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error updating competition: " + errorMessage)
    },
  })

  const deleteCompetitionMutation = useMutation({
    mutationFn: competitionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] })
    },
  })

  const competitions = competitionsData?.data?.data || []
  const totalCompetitions = competitionsData?.data?.total || 0
  const totalPages = Math.ceil(totalCompetitions / pageSize)
  
  const seasons = seasonsData?.data?.data || []

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      1: { color: "bg-green-100 text-green-800", label: "Active" },
      2: { color: "bg-gray-100 text-gray-800", label: "Completed" },
      3: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: "bg-blue-100 text-blue-800", label: "Unknown" }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleDeleteCompetition = (id: string) => {
    if (confirm("Are you sure you want to delete this competition?")) {
      deleteCompetitionMutation.mutate(id)
    }
  }

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition)
    setEditFormData({ cid: competition.cid })
    setShowEditModal(true)
  }

  // Form helper functions
  const resetForm = () => {
    setFormData({
      cid: "",
      season: ""
    })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const resetEditForm = () => {
    setEditFormData({
      cid: ""
    })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.cid.trim()) {
      errors.cid = "Competition ID is required"
    }

    if (!formData.season) {
      errors.season = "Please select a season"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof CreateCompetitionData, value: string) => {
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
      await createCompetitionMutation.mutateAsync(formData)
    } catch (error) {
      console.error("Error in form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editFormData.cid.trim()) {
      setFormErrors({ cid: "Competition ID is required" })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCompetition) {
        await updateCompetitionMutation.mutateAsync({ 
          id: editingCompetition._id, 
          data: editFormData 
        })
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingCompetition(null)
    resetForm()
    resetEditForm()
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
          <p className="text-red-500">Error loading competitions data</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
            <p className="text-gray-600">Manage fantasy football competitions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Competition
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompetitions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitions.filter((comp: Competition) => comp.status === 1).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitions.filter((comp: Competition) => comp.status === 2).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitions.filter((comp: Competition) => comp.status === 3).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Competition Management</CardTitle>
            <CardDescription>Search and filter competitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search competitions..."
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
                {competitionStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Competitions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CID
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
                        Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {competitions.map((competition: Competition) => (
                    <tr key={competition._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {competition.competition_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {competition.competition_slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {competition.cid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(competition.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(competition.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(competition.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          competition.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {competition.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCompetition(competition)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCompetition(competition._id)}
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
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCompetitions)} of {totalCompetitions} results
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Competition</CardTitle>
                <CardDescription>Add a new competition from EntitySport</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competition ID (CID) *
                    </label>
                    <Input 
                      placeholder="e.g., 992"
                      value={formData.cid}
                      onChange={(e) => handleInputChange("cid", e.target.value)}
                    />
                    {formErrors.cid && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.cid}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      EntitySport Competition ID
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Season *
                    </label>
                    <select
                      value={formData.season}
                      onChange={(e) => handleInputChange("season", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a season</option>
                      {seasons.map(season => (
                        <option key={season._id} value={season._id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.season && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.season}</p>
                    )}
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
                      {isSubmitting ? "Creating..." : "Create Competition"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Competition Modal */}
        {showEditModal && editingCompetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Competition</CardTitle>
                <CardDescription>Update the competition CID from EntitySport</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competition ID (CID) *
                    </label>
                    <Input 
                      placeholder="e.g., 992"
                      value={editFormData.cid}
                      onChange={(e) => setEditFormData({ cid: e.target.value })}
                    />
                    {formErrors.cid && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.cid}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      EntitySport Competition ID
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Details:</p>
                    <p className="text-sm font-medium text-gray-900">{editingCompetition.competition_name}</p>
                    <p className="text-xs text-gray-500">Current CID: {editingCompetition.cid}</p>
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
                      {isSubmitting ? "Updating..." : "Update Competition"}
                    </Button>
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