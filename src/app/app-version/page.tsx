"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { appVersionAPI } from "@/lib/api"
import { AppVersion, CreateAppVersionData, UpdateAppVersionData, UpdateAppVersionSeverityData } from "@/types"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Edit3, Plus, Trash2, RefreshCw, Smartphone, X, AlertTriangle, CheckCircle } from "lucide-react"

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}
import { useUIStore } from "@/lib/store"

export default function AppVersionPage() {
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null)
  const [newVersion, setNewVersion] = useState<CreateAppVersionData>({
    latest_version: "",
    os: "Android",
    url: "",
    highly_severe: false
  })
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Fetch app versions
  const { data: versionsData, isLoading, error, refetch } = useQuery({
    queryKey: ["appVersions", search],
    queryFn: () => appVersionAPI.getAll({ search }),
  })

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: appVersionAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'App version created successfully'
      })
      setShowCreateModal(false)
      setNewVersion({
        latest_version: "",
        os: "Android",
        url: "",
        highly_severe: false
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create app version'
      })
    }
  })

  // Update version mutation
  const updateVersionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppVersionData }) => 
      appVersionAPI.update(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'App version updated successfully'
      })
      setEditingVersion(null)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update app version'
      })
    }
  })

  // Update severity mutation
  const updateSeverityMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppVersionSeverityData }) => 
      appVersionAPI.updateSeverity(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Severity updated successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update severity'
      })
    }
  })

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: appVersionAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'App version deleted successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete app version'
      })
    }
  })

  // Delete all versions mutation
  const deleteAllVersionsMutation = useMutation({
    mutationFn: (deleteKey: string) => appVersionAPI.deleteAll(deleteKey),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'All app versions deleted successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete all versions'
      })
    }
  })

  const versions = useMemo(() => {
    // Debug: Log the actual response structure
    console.log('🔍 [DEBUG] versionsData:', versionsData)
    console.log('🔍 [DEBUG] versionsData.data:', versionsData?.data)
    
    // Handle both possible response structures
    const data = versionsData?.data as { appVersions?: AppVersion[] } & { data?: AppVersion[] }
    const result = data?.appVersions ?? data?.data ?? []
    console.log('🔍 [DEBUG] extracted versions:', result)
    return result
  }, [versionsData])

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this app version?')) {
      deleteVersionMutation.mutate(id)
    }
  }

  const handleDeleteAll = () => {
    const deleteKey = prompt('Enter delete key to confirm deletion of all versions:')
    if (deleteKey) {
      if (confirm('Are you sure you want to delete ALL app versions? This action cannot be undone.')) {
        deleteAllVersionsMutation.mutate(deleteKey)
      }
    }
  }

  const toggleSeverity = (version: AppVersion) => {
    updateSeverityMutation.mutate({
      id: version._id,
      data: { highly_severe: !version.highly_severe }
    })
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load app versions</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">App Version Management</h1>
            <p className="text-gray-600">Manage mobile app versions and updates</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDeleteAll}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
              disabled={deleteAllVersionsMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Version
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search versions..."
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

        {/* App Versions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                App Versions
              </div>
              {versions.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {versions.length} versions
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No app versions found</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create First Version
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {versions.map((version: AppVersion, idx: number) => (
                      <tr key={version._id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-blue-500" />
                            {version.latest_version}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Badge variant="outline">{version.os}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {version.url ? (
                            <a href={version.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {version.url.length > 30 ? `${version.url.substring(0, 30)}...` : version.url}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Button
                            onClick={() => toggleSeverity(version)}
                            variant={version.highly_severe ? "destructive" : "outline"}
                            size="sm"
                            className="flex items-center gap-1"
                            disabled={updateSeverityMutation.isPending}
                          >
                            {version.highly_severe ? (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Critical
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Normal
                              </>
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setEditingVersion(version)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(version._id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              disabled={deleteVersionMutation.isPending}
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

        {/* Create Version Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create App Version</h2>
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
                  <Label htmlFor="latest_version">Version Number *</Label>
                  <Input
                    id="latest_version"
                    value={newVersion.latest_version}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, latest_version: e.target.value }))}
                    placeholder="e.g., 1.0.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="os">Operating System *</Label>
                  <select
                    id="os"
                    value={newVersion.os}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, os: e.target.value as 'Android' | 'iOS' }))}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="url">Download URL *</Label>
                  <Input
                    id="url"
                    value={newVersion.url}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://playstore.google.com or https://appstore.apple.com"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="highly_severe"
                    checked={newVersion.highly_severe}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, highly_severe: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="highly_severe">Critical Update (Highly Severe)</Label>
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
                  onClick={() => createVersionMutation.mutate(newVersion)}
                  disabled={createVersionMutation.isPending || !newVersion.latest_version || !newVersion.url}
                >
                  {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Version Modal */}
        {editingVersion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit App Version</h2>
                <Button
                  onClick={() => setEditingVersion(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_latest_version">Version Number *</Label>
                  <Input
                    id="edit_latest_version"
                    value={editingVersion.latest_version}
                    onChange={(e) => setEditingVersion(prev => prev ? { ...prev, latest_version: e.target.value } : null)}
                    placeholder="e.g., 1.0.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_url">Download URL *</Label>
                  <Input
                    id="edit_url"
                    value={editingVersion.url}
                    onChange={(e) => setEditingVersion(prev => prev ? { ...prev, url: e.target.value } : null)}
                    placeholder="https://playstore.google.com or https://appstore.apple.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setEditingVersion(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingVersion) {
                      updateVersionMutation.mutate({
                        id: editingVersion._id,
                        data: {
                          latest_version: editingVersion.latest_version,
                          url: editingVersion.url
                        }
                      })
                    }
                  }}
                  disabled={updateVersionMutation.isPending || !editingVersion?.latest_version || !editingVersion?.url}
                >
                  {updateVersionMutation.isPending ? 'Updating...' : 'Update Version'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
