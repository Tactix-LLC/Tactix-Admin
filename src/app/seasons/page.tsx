"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { seasonsAPI } from "@/lib/api"
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
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { Season, CreateSeasonData } from "@/types"

export default function SeasonsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateSeasonData>({
    name: ""
  })
  const [deleteKey, setDeleteKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const { data: seasonsData, isLoading, error } = useQuery({
    queryKey: ["seasons", currentPage, pageSize, searchTerm],
    queryFn: () => seasonsAPI.getAll({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
    }),
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: seasonsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      setShowDeleteModal(false)
      setDeleteKey("")
      alert("All seasons deleted successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error deleting seasons:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error deleting seasons: " + errorMessage)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      seasonsAPI.updateStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
    },
    onError: (error: unknown) => {
      console.error("Error updating season status:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error updating season status: " + errorMessage)
    },
  })

  const createSeasonMutation = useMutation({
    mutationFn: seasonsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      setShowCreateModal(false)
      resetForm()
      alert("Season created successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error creating season:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error creating season: " + errorMessage)
    },
  })

  const updateSeasonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSeasonData> }) => 
      seasonsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      setShowEditModal(false)
      setEditingSeason(null)
      resetForm()
      alert("Season updated successfully!")
    },
    onError: (error: unknown) => {
      console.error("Error updating season:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert("Error updating season: " + errorMessage)
    },
  })

  const seasons = seasonsData?.data?.data || []
  const totalSeasons = seasonsData?.data?.total || 0
  const totalPages = Math.ceil(totalSeasons / pageSize)

  const getStatusBadge = (is_active: boolean) => {
    return is_active ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    )
  }

  const handleStatusChange = (id: string, newStatus: boolean) => {
    updateStatusMutation.mutate({ id, is_active: newStatus })
  }

  const handleDeleteAllSeasons = () => {
    if (!deleteKey.trim()) {
      alert("Please enter the delete key")
      return
    }
    deleteSeasonMutation.mutate(deleteKey)
  }

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season)
    setFormData({ name: season.name })
    setShowEditModal(true)
  }

  // Form helper functions
  const resetForm = () => {
    setFormData({
      name: ""
    })
    setFormErrors({})
    setIsSubmitting(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Season name is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof CreateSeasonData, value: string) => {
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
      if (editingSeason) {
        await updateSeasonMutation.mutateAsync({ id: editingSeason._id, data: formData })
      } else {
        await createSeasonMutation.mutateAsync(formData)
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
    setEditingSeason(null)
    resetForm()
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
          <p className="text-red-500">Error loading seasons data</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seasons</h1>
            <p className="text-gray-600">Manage football seasons</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowCreateModal(true)}
              disabled={seasons.length > 0}
              className={seasons.length > 0 ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Season
            </Button>
            {seasons.length > 0 && (
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        {/* Important Notice */}
        {seasons.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-blue-800 font-medium">No seasons found</p>
                  <p className="text-blue-600 text-sm">Create your first season to get started. Note: Only one season can exist at a time.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seasons</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSeasons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {seasons.filter((season: Season) => season.is_active === true).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {seasons.filter((season: Season) => season.is_active === false).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {seasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Season Management</CardTitle>
              <CardDescription>Search and manage seasons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search seasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seasons Table */}
        {seasons.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Season Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Season ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competitions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {seasons.map((season: Season) => (
                      <tr key={season._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {season.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {season.season_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(season.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {season.competitions?.length || 0} competitions
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(season.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(season.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSeason(season)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <select
                              value={season.is_active ? "true" : "false"}
                              onChange={(e) => handleStatusChange(season._id, e.target.value === "true")}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSeasons)} of {totalSeasons} results
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

        {/* Create Season Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Season</CardTitle>
                <CardDescription>
                  Add a new season to the system. The season name must match a season from EntitySport.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Season Name *
                    </label>
                    <Input 
                      placeholder="e.g., English Premier League 2023-24" 
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Season name must exactly match a season available on EntitySport
                    </p>
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
                      {isSubmitting ? "Creating..." : "Create Season"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Season Modal */}
        {showEditModal && editingSeason && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Season</CardTitle>
                <CardDescription>
                  Update the season details. The season name must match a season from EntitySport.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Season Name *
                    </label>
                    <Input 
                      placeholder="e.g., English Premier League 2023-24" 
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Season name must exactly match a season available on EntitySport
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Season ID:</p>
                    <p className="text-sm font-mono text-gray-900">{editingSeason.season_id}</p>
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
                      {isSubmitting ? "Updating..." : "Update Season"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete All Seasons Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Delete All Seasons</CardTitle>
                <CardDescription>
                  This action will permanently delete all seasons. This cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delete Key *
                    </label>
                    <Input 
                      type="password"
                      placeholder="Enter delete key" 
                      value={deleteKey}
                      onChange={(e) => setDeleteKey(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact your system administrator for the delete key
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="button" 
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeleteKey("")
                      }}
                      variant="outline"
                      disabled={deleteSeasonMutation.isPending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleDeleteAllSeasons}
                      disabled={deleteSeasonMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      {deleteSeasonMutation.isPending ? "Deleting..." : "Delete All"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
