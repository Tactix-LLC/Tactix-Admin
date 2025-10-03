'use client'

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainLayout } from "@/components/layout/main-layout"
import { Plus, Search, Edit, Trash2, Upload, Crown, Users, Star, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { coachAPI } from "@/lib/api"
import { Coach, CreateCoachData, UpdateCoachData, UpdateCoachImageData, UpdateCoachStatusData, SwapMajorCoachData } from "@/types"

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}

import { useUIStore } from "@/lib/store"
import { uploadToCloudinaryViaServer } from "@/lib/cloudinary"
import Image from "next/image"

export default function CoachesPage() {
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null)
  const [originalCoach, setOriginalCoach] = useState<Coach | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<Coach | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [showSwapMajorDialog, setShowSwapMajorDialog] = useState(false)
  const [swapCoachData, setSwapCoachData] = useState<{ newMajor: Coach | null, existing: Coach | null }>({ newMajor: null, existing: null })
  const [deleteKey, setDeleteKey] = useState("")
  const [newCoach, setNewCoach] = useState<CreateCoachData>({
    coach_name: "",
    image_public_id: "",
    image_secure_url: ""
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadingImageFor, setUploadingImageFor] = useState<'create' | 'edit'>('create')
  
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Fetch coaches
  const { data: coachesData, isLoading, error, refetch } = useQuery({
    queryKey: ["coaches", search],
    queryFn: () => coachAPI.getAllCoaches({ search }),
  })

  // Create coach mutation
  const createCoachMutation = useMutation({
    mutationFn: coachAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      setShowCreateModal(false)
      resetNewCoach()
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Coach created successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create coach'
      })
    }
  })

  // Update coach mutation
  const updateCoachMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachData }) => 
      coachAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      setEditingCoach(null)
      setOriginalCoach(null)
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Coach updated successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update coach'
      })
    }
  })

  // Update coach image mutation
  const updateCoachImageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachImageData }) => 
      coachAPI.updateImage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Coach image updated successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update coach image'
      })
    }
  })

  // Update coach status mutation
  const updateCoachStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachStatusData }) => 
      coachAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Coach status updated successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update coach status'
      })
    }
  })

  // Swap major coach mutation
  const swapMajorCoachMutation = useMutation({
    mutationFn: coachAPI.swapMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      setShowSwapMajorDialog(false)
      setSwapCoachData({ newMajor: null, existing: null })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Major coach swapped successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to swap major coach'
      })
    }
  })

  // Delete coach mutation
  const deleteCoachMutation = useMutation({
    mutationFn: coachAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      setShowDeleteDialog(null)
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Coach deleted successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete coach'
      })
    }
  })

  // Delete all coaches mutation
  const deleteAllCoachesMutation = useMutation({
    mutationFn: coachAPI.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] })
      setShowDeleteAllDialog(false)
      setDeleteKey("")
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'All non-major coaches deleted successfully'
      })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete coaches'
      })
    }
  })

  const resetNewCoach = () => {
    setNewCoach({
      coach_name: "",
      image_public_id: "",
      image_secure_url: ""
    })
  }

  const handleCreateCoach = () => {
    if (!newCoach.coach_name.trim()) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Coach name is required'
      })
      return
    }
    
    if (!newCoach.image_secure_url || !newCoach.image_public_id) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Coach image is required'
      })
      return
    }

    createCoachMutation.mutate(newCoach)
  }

  const handleEditCoach = (coach: Coach) => {
    setEditingCoach({ ...coach })
    setOriginalCoach({ ...coach })
  }

  const handleSaveEdit = () => {
    if (!editingCoach) return

    const hasNameChanged = editingCoach.coach_name !== originalCoach?.coach_name
    const hasImageChanged = editingCoach.image_secure_url !== originalCoach?.image_secure_url || 
                            editingCoach.image_public_id !== originalCoach?.image_public_id

    if (hasNameChanged) {
      updateCoachMutation.mutate({
        id: editingCoach._id,
        data: { coach_name: editingCoach.coach_name }
      })
    }

    if (hasImageChanged) {
      updateCoachImageMutation.mutate({
        id: editingCoach._id,
        data: {
          image_public_id: editingCoach.image_public_id,
          image_secure_url: editingCoach.image_secure_url
        }
      })
    }

    if (!hasNameChanged && !hasImageChanged) {
      setEditingCoach(null)
      setOriginalCoach(null)
      addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'Info',
        message: 'No changes detected'
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingCoach(null)
    setOriginalCoach(null)
  }

  const handleToggleStatus = (coach: Coach) => {
    updateCoachStatusMutation.mutate({
      id: coach._id,
      data: { is_active: !coach.is_active }
    })
  }

  const handleDeleteCoach = (id: string) => {
    deleteCoachMutation.mutate(id)
  }

  const handleDeleteAllCoaches = () => {
    if (!deleteKey.trim()) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Delete key is required'
      })
      return
    }
    deleteAllCoachesMutation.mutate(deleteKey)
  }

  const handleSwapMajor = () => {
    if (!swapCoachData.newMajor || !swapCoachData.existing) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Please select both coaches for swap'
      })
      return
    }

    swapMajorCoachMutation.mutate({
      newMajorCoachId: swapCoachData.newMajor._id,
      existingCoachId: swapCoachData.existing._id
    })
  }

  // Cloudinary upload function
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'create' | 'edit') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Please select a valid image file'
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'File size must be less than 10MB'
      })
      return
    }

    setIsUploadingImage(true)
    setUploadingImageFor(type)
    
    try {
      const data = await uploadToCloudinaryViaServer(file, 'tactix/coaches')
      
      // Update the appropriate state with the uploaded image data
      if (type === 'create') {
        setNewCoach(prev => ({
          ...prev,
          image_public_id: data.data.public_id,
          image_secure_url: data.data.secure_url
        }))
      } else if (type === 'edit' && editingCoach) {
        setEditingCoach(prev => prev ? ({
          ...prev,
          image_public_id: data.data.public_id,
          image_secure_url: data.data.secure_url
        }) : null)
      }

      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Image uploaded successfully'
      })
    } catch (error) {
      console.error('Upload error:', error)
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to upload image'
      })
    } finally {
      setIsUploadingImage(false)
      setUploadingImageFor('create')
    }
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">Failed to load coaches</p>
            <Button onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const coaches = coachesData?.data?.coaches || []
  const filteredCoaches = coaches.filter((coach) =>
    coach.coach_name.toLowerCase().includes(search.toLowerCase())
  )
  
  const majorCoaches = filteredCoaches.filter(coach => coach.is_major)
  const nonMajorCoaches = filteredCoaches.filter(coach => !coach.is_major)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Management</h1>
            <p className="text-gray-600">Manage football coaches and their status</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSwapMajorDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Swap Major
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Coach
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coaches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            onClick={() => setShowDeleteAllDialog(true)}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Non-Major
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Coaches</p>
                <p className="text-2xl font-bold">{coaches.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Crown className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Major Coaches</p>
                <p className="text-2xl font-bold">{majorCoaches.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{coaches.filter(c => c.is_active).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold">{coaches.filter(c => !c.is_active).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coaches Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoaches.map((coach) => (
              <Card key={coach._id} className="overflow-hidden">
                <div className="relative h-48">
                  {coach.image_secure_url ? (
                    <Image
                      src={coach.image_secure_url}
                      alt={coach.coach_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {coach.is_major && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Major
                      </Badge>
                    )}
                    <Badge variant={coach.is_active ? "default" : "secondary"}>
                      {coach.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{coach.coach_name}</h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(coach.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Switch
                        checked={coach.is_active}
                        onCheckedChange={() => handleToggleStatus(coach)}
                        disabled={updateCoachStatusMutation.isPending}
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCoach(coach)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(coach)}
                          disabled={coach.is_major}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCoaches.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
            <p className="text-gray-500">
              {search ? "Try adjusting your search criteria" : "Get started by adding your first coach"}
            </p>
          </div>
        )}

        {/* Create Coach Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Coach</DialogTitle>
              <DialogDescription>
                Create a new coach profile with name and image.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coach_name">Coach Name</Label>
                <Input
                  id="coach_name"
                  value={newCoach.coach_name}
                  onChange={(e) => setNewCoach(prev => ({ ...prev, coach_name: e.target.value }))}
                  placeholder="Enter coach name"
                />
              </div>
              
              <div>
                <Label htmlFor="coach_image">Coach Image</Label>
                <div className="space-y-2">
                  <Input
                    id="coach_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'create')}
                    disabled={isUploadingImage && uploadingImageFor === 'create'}
                  />
                  {isUploadingImage && uploadingImageFor === 'create' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading image...
                    </div>
                  )}
                  {newCoach.image_secure_url && (
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden">
                      <Image
                        src={newCoach.image_secure_url}
                        alt="Coach preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false)
                resetNewCoach()
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCoach}
                disabled={createCoachMutation.isPending || isUploadingImage}
              >
                {createCoachMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Coach'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Coach Modal */}
        <Dialog open={!!editingCoach} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Coach</DialogTitle>
              <DialogDescription>
                Update coach information and image.
              </DialogDescription>
            </DialogHeader>
            {editingCoach && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_coach_name">Coach Name</Label>
                  <Input
                    id="edit_coach_name"
                    value={editingCoach.coach_name}
                    onChange={(e) => setEditingCoach(prev => prev ? ({ ...prev, coach_name: e.target.value }) : null)}
                    placeholder="Enter coach name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_coach_image">Coach Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="edit_coach_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      disabled={isUploadingImage && uploadingImageFor === 'edit'}
                    />
                    {isUploadingImage && uploadingImageFor === 'edit' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading image...
                      </div>
                    )}
                    {editingCoach.image_secure_url && (
                      <div className="relative h-32 w-32 rounded-lg overflow-hidden">
                        <Image
                          src={editingCoach.image_secure_url}
                          alt="Coach preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateCoachMutation.isPending || updateCoachImageMutation.isPending || isUploadingImage}
              >
                {(updateCoachMutation.isPending || updateCoachImageMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Swap Major Coach Modal */}
        <Dialog open={showSwapMajorDialog} onOpenChange={setShowSwapMajorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Swap Major Coach</DialogTitle>
              <DialogDescription>
                Select coaches to swap major status. The new major coach will become major, and the existing major will become regular.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Major Coach (currently non-major)</Label>
                <Select
                  value={swapCoachData.newMajor?._id || ""}
                  onValueChange={(value) => {
                    const coach = nonMajorCoaches.find(c => c._id === value)
                    setSwapCoachData(prev => ({ ...prev, newMajor: coach || null }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select coach to make major" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonMajorCoaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        {coach.coach_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Existing Major Coach (to demote)</Label>
                <Select
                  value={swapCoachData.existing?._id || ""}
                  onValueChange={(value) => {
                    const coach = majorCoaches.find(c => c._id === value)
                    setSwapCoachData(prev => ({ ...prev, existing: coach || null }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select major coach to demote" />
                  </SelectTrigger>
                  <SelectContent>
                    {majorCoaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        <div className="flex items-center gap-2">
                          <Crown className="h-3 w-3" />
                          {coach.coach_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSwapMajorDialog(false)
                setSwapCoachData({ newMajor: null, existing: null })
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSwapMajor}
                disabled={swapMajorCoachMutation.isPending}
              >
                {swapMajorCoachMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Swapping...
                  </>
                ) : (
                  'Swap Major Status'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Coach Dialog */}
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coach</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{showDeleteDialog?.coach_name}&rdquo;? This action cannot be undone.
                {showDeleteDialog?.is_major && (
                  <div className="mt-2 p-2 bg-red-50 text-red-800 rounded text-sm">
                    <strong>Note:</strong> Major coaches cannot be deleted. Please demote this coach first.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && handleDeleteCoach(showDeleteDialog._id)}
                disabled={showDeleteDialog?.is_major || deleteCoachMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteCoachMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete All Coaches Dialog */}
        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Non-Major Coaches</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all non-major coaches. Major coaches will not be affected. 
                Please enter the delete key to confirm this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <Label htmlFor="delete_key">Delete Key</Label>
              <Input
                id="delete_key"
                type="password"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                placeholder="Enter delete key"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteKey("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllCoaches}
                disabled={deleteAllCoachesMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteAllCoachesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete All Non-Major'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}
