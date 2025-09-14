"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { advertisementAPI, adCompanyAPI, adPackageAPI } from "@/lib/api"
import { Advertisement, CreateAdvertisementData, AdCompany, CreateAdCompanyData, AdPackage, CreateAdPackageData } from "@/types"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Edit3, Plus, Trash2, RefreshCw, Monitor, X, Building2, Package, Upload, Image as ImageIcon } from "lucide-react"

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

export default function AdvertisementsPage() {
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [originalAd, setOriginalAd] = useState<Advertisement | null>(null)
  const [activeTab, setActiveTab] = useState<'ads' | 'companies' | 'packages'>('ads')
  const [newAd, setNewAd] = useState<CreateAdvertisementData>({
    ad_company: "",
    ad_package: "",
    start_date: "",
    link: "",
    is_active: true,
    img: {
      cloudinary_secure_url: "",
      cloudinary_public_id: ""
    }
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  // Company management states
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<AdCompany | null>(null)
  const [newCompany, setNewCompany] = useState<CreateAdCompanyData>({
    comp_name: "",
    comp_tin: "",
    comp_addr: "",
    comp_contact: {
      phone_number: [""],
      email: ""
    },
    business_type: "",
    website: ""
  })
  
  // Package management states
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null)
  const [newPackage, setNewPackage] = useState<CreateAdPackageData>({
    pack_name: "",
    price: 0,
    duration: 1
  })
  const { addNotification } = useUIStore()
  const queryClient = useQueryClient()

  // Fetch advertisements
  const { data: adsData, isLoading, error, refetch } = useQuery({
    queryKey: ["advertisements", search],
    queryFn: () => advertisementAPI.getAll({ search }),
  })

  // Fetch companies and packages for dropdowns
  const { data: companiesData, refetch: refetchCompanies } = useQuery({
    queryKey: ["adCompanies"],
    queryFn: () => adCompanyAPI.getAll({ limit: 1000 }),
  })

  const { data: packagesData } = useQuery({
    queryKey: ["adPackages"],
    queryFn: () => adPackageAPI.getAll({ limit: 1000 }),
  })

  // Create advertisement mutation
  const createAdMutation = useMutation({
    mutationFn: advertisementAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Advertisement created successfully'
      })
      setShowCreateModal(false)
      setNewAd({
        ad_company: "",
        ad_package: "",
        start_date: "",
        link: "",
        is_active: true,
        img: {
          cloudinary_secure_url: "",
          cloudinary_public_id: ""
        }
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create advertisement'
      })
    }
  })

  // Update advertisement basic info mutation
  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { ad_company?: string; ad_package?: string; link?: string } }) => 
      advertisementAPI.update(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Advertisement updated successfully'
      })
      setEditingAd(null)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update advertisement'
      })
    }
  })

  // Update advertisement status mutation
  const updateAdStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      advertisementAPI.updateStatus(id, is_active),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Advertisement status updated successfully'
      })
      setEditingAd(null)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update advertisement status'
      })
    }
  })

  // Update advertisement calendar mutation
  const updateAdCalendarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { start_date: string; end_date: string } }) => 
      advertisementAPI.updateCalendar(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Advertisement calendar updated successfully'
      })
      setEditingAd(null)
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update advertisement calendar'
      })
    }
  })

  // Delete advertisement mutation
  const deleteAdMutation = useMutation({
    mutationFn: advertisementAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Advertisement deleted successfully'
      })
      refetch()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete advertisement'
      })
    }
  })

  const advertisements = useMemo(() => (adsData?.data as { ads?: Advertisement[] })?.ads ?? [], [adsData])
  const companies = useMemo(() => {
    // The API returns data.adCompanies, not data.data
    return companiesData?.data?.adCompanies ?? []
  }, [companiesData])
  const packages = useMemo(() => {
    // Check if packages API has similar structure
    const data = packagesData?.data as { adPackages?: AdPackage[] } & { data?: AdPackage[] }
    return data?.adPackages ?? data?.data ?? []
  }, [packagesData])

  // Company mutations
  const createCompanyMutation = useMutation({
    mutationFn: adCompanyAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Company created successfully'
      })
      setShowCreateCompanyModal(false)
      setNewCompany({
        comp_name: "",
        comp_tin: "",
        comp_addr: "",
        comp_contact: { phone_number: [""], email: "" },
        business_type: "",
        website: ""
      })
      // Force refetch the companies data
      queryClient.invalidateQueries({ queryKey: ["adCompanies"] })
      refetchCompanies()
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create company'
      })
    }
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAdCompanyData> }) => 
      adCompanyAPI.update(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Company updated successfully'
      })
      setEditingCompany(null)
      queryClient.invalidateQueries({ queryKey: ["adCompanies"] })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update company'
      })
    }
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: adCompanyAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Company deleted successfully'
      })
      queryClient.invalidateQueries({ queryKey: ["adCompanies"] })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete company'
      })
    }
  })

  // Package mutations
  const createPackageMutation = useMutation({
    mutationFn: adPackageAPI.create,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Package created successfully'
      })
      setShowCreatePackageModal(false)
      setNewPackage({ pack_name: "", price: 0, duration: 1 })
      queryClient.invalidateQueries({ queryKey: ["adPackages"] })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create package'
      })
    }
  })

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAdPackageData> }) => 
      adPackageAPI.update(id, data),
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Package updated successfully'
      })
      setEditingPackage(null)
      queryClient.invalidateQueries({ queryKey: ["adPackages"] })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update package'
      })
    }
  })

  const deletePackageMutation = useMutation({
    mutationFn: adPackageAPI.delete,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Package deleted successfully'
      })
      queryClient.invalidateQueries({ queryKey: ["adPackages"] })
    },
    onError: (error: ApiError) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete package'
      })
    }
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this advertisement?')) {
      deleteAdMutation.mutate(id)
    }
  }

  const handleDeleteCompany = (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteCompanyMutation.mutate(id)
    }
  }

  const handleDeletePackage = (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      deletePackageMutation.mutate(id)
    }
  }

  // Cloudinary upload function
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    try {
      const data = await uploadToCloudinaryViaServer(file, 'tactix/advertisements')
      
      // Update the advertisement with the uploaded image data
      setNewAd(prev => ({
        ...prev,
        img: {
          cloudinary_secure_url: data.data.secure_url,
          cloudinary_public_id: data.data.public_id
        }
      }))

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
    }
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load advertisements</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
            <p className="text-gray-600">Manage app advertisements, companies, and packages</p>
          </div>
          {activeTab === 'ads' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Advertisement
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ads')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="h-4 w-4 inline mr-2" />
              Advertisements
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'packages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Packages
            </button>
          </nav>
        </div>

        {/* Advertisements Tab */}
        {activeTab === 'ads' && (
          <>
            {/* Search and Actions */}
            <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search advertisements..."
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

        {/* Advertisements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Advertisements
              </div>
              {advertisements.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {advertisements.length} advertisements
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : advertisements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Monitor className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No advertisements found</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create First Advertisement
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {advertisements.map((ad: Advertisement, idx: number) => {
                      // The API response already includes the full objects
                      const company = (ad as Advertisement & { ad_company?: AdCompany }).ad_company || companies.find((c: AdCompany) => c._id === ad.ad_company)
                      const packageInfo = (ad as Advertisement & { ad_package?: AdPackage }).ad_package || packages.find((p: AdPackage) => p._id === ad.ad_package)
                      
                      return (
                      <tr key={ad._id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {company?.comp_name || 'Unknown Company'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Badge variant="outline">{packageInfo?.pack_name || 'Unknown Package'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ad.link ? (
                            <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {ad.link.length > 30 ? `${ad.link.substring(0, 30)}...` : ad.link}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <Badge 
                            variant={ad.is_active ? "default" : "secondary"}
                            className={ad.is_active ? "bg-green-100 text-green-800" : ""}
                          >
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '-'}
                        </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setEditingAd(ad)
                                    setOriginalAd(ad)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                            <Button
                              onClick={() => handleDelete(ad._id)}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              disabled={deleteAdMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Advertisement Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Advertisement</h2>
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
                  <Label htmlFor="ad_company">Company</Label>
                  <select
                    id="ad_company"
                    value={newAd.ad_company}
                    onChange={(e) => setNewAd(prev => ({ ...prev, ad_company: e.target.value }))}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company: AdCompany) => (
                      <option key={company._id} value={company._id}>
                        {company.comp_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="ad_package">Package</Label>
                  <select
                    id="ad_package"
                    value={newAd.ad_package}
                    onChange={(e) => setNewAd(prev => ({ ...prev, ad_package: e.target.value }))}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg: AdPackage) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.pack_name} - ${pkg.price} ({pkg.duration} days)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    value={newAd.link || ""}
                    onChange={(e) => setNewAd(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="Enter advertisement link"
                  />
                </div>
                
                <div>
                  <Label>Advertisement Image</Label>
                  <div className="mt-2">
                    {newAd.img.cloudinary_secure_url ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Image uploaded successfully</span>
                        </div>
                        <Image 
                          src={newAd.img.cloudinary_secure_url} 
                          alt="Advertisement preview" 
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <div className="text-xs text-gray-500">
                          <div>URL: {newAd.img.cloudinary_secure_url}</div>
                          <div>Public ID: {newAd.img.cloudinary_public_id}</div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setNewAd(prev => ({ 
                            ...prev, 
                            img: { cloudinary_secure_url: "", cloudinary_public_id: "" } 
                          }))}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload advertisement image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                            isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isUploadingImage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Choose Image
                            </>
                          )}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Supports JPG, PNG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newAd.start_date}
                    onChange={(e) => setNewAd(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newAd.is_active}
                    onChange={(e) => setNewAd(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
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
                  onClick={() => createAdMutation.mutate(newAd)}
                  disabled={createAdMutation.isPending || !newAd.ad_company || !newAd.ad_package || !newAd.start_date || !newAd.img.cloudinary_secure_url || !newAd.img.cloudinary_public_id}
                >
                  {createAdMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AD Companies</h2>
                <p className="text-gray-600">Manage advertising companies</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => refetchCompanies()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowCreateCompanyModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Company
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Companies ({companies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {companies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No companies found</p>
                    <Button
                      onClick={() => setShowCreateCompanyModal(true)}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Company
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companies.map((company: AdCompany, idx: number) => (
                          <tr key={company._id || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {company.comp_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{company.comp_tin}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <Badge variant="outline">{company.business_type}</Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div>
                                <div>{company.comp_contact.email}</div>
                                <div className="text-xs text-gray-500">
                                  {company.comp_contact.phone_number.join(', ')}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => setEditingCompany(company)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteCompany(company._id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                  disabled={deleteCompanyMutation.isPending}
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
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AD Packages</h2>
                <p className="text-gray-600">Manage advertising packages and pricing</p>
              </div>
              <Button
                onClick={() => setShowCreatePackageModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Package
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Packages ({packages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {packages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Package className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No packages found</p>
                    <Button
                      onClick={() => setShowCreatePackageModal(true)}
                      className="mt-4 flex items-center gap-2"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Package
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {packages.map((pkg: AdPackage, idx: number) => (
                          <tr key={pkg._id || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {pkg.pack_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span className="font-semibold">${pkg.price}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {pkg.duration} days
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <Badge 
                                variant={pkg.status === 'Active' ? "default" : "secondary"}
                                className={pkg.status === 'Active' ? "bg-green-100 text-green-800" : ""}
                              >
                                {pkg.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => setEditingPackage(pkg)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeletePackage(pkg._id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                  disabled={deletePackageMutation.isPending}
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
          </div>
        )}

        {/* Create Company Modal */}
        {showCreateCompanyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create AD Company</h2>
                <Button
                  onClick={() => setShowCreateCompanyModal(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="comp_name">Company Name *</Label>
                    <Input
                      id="comp_name"
                      value={newCompany.comp_name}
                      onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ ...prev, comp_name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="comp_tin">TIN *</Label>
                    <Input
                      id="comp_tin"
                      value={newCompany.comp_tin}
                      onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ ...prev, comp_tin: e.target.value }))}
                      placeholder="Enter TIN number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="comp_addr">Address *</Label>
                  <Input
                    id="comp_addr"
                    value={newCompany.comp_addr}
                      onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ ...prev, comp_addr: e.target.value }))}
                    placeholder="Enter company address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_type">Business Type *</Label>
                    <Input
                      id="business_type"
                      value={newCompany.business_type}
                      onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ ...prev, business_type: e.target.value }))}
                      placeholder="e.g., Technology, Retail, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newCompany.website || ""}
                      onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCompany.comp_contact.email}
                    onChange={(e) => setNewCompany((prev: CreateAdCompanyData) => ({ 
                      ...prev, 
                      comp_contact: { ...prev.comp_contact, email: e.target.value } 
                    }))}
                    placeholder="company@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Numbers *</Label>
                  <div className="space-y-2">
                    {newCompany.comp_contact.phone_number.map((phone: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            const newPhones = [...newCompany.comp_contact.phone_number]
                            newPhones[index] = e.target.value
                            setNewCompany((prev: CreateAdCompanyData) => ({ 
                              ...prev, 
                              comp_contact: { ...prev.comp_contact, phone_number: newPhones } 
                            }))
                          }}
                          placeholder="Enter phone number"
                        />
                        {newCompany.comp_contact.phone_number.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => {
                              const newPhones = newCompany.comp_contact.phone_number.filter((_: string, i: number) => i !== index)
                              setNewCompany((prev: CreateAdCompanyData) => ({ 
                                ...prev, 
                                comp_contact: { ...prev.comp_contact, phone_number: newPhones } 
                              }))
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => setNewCompany((prev: CreateAdCompanyData) => ({ 
                        ...prev, 
                        comp_contact: { 
                          ...prev.comp_contact, 
                          phone_number: [...prev.comp_contact.phone_number, ""] 
                        } 
                      }))}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Phone
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowCreateCompanyModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createCompanyMutation.mutate(newCompany)}
                  disabled={createCompanyMutation.isPending || !newCompany.comp_name.trim() || !newCompany.comp_tin.trim() || !newCompany.comp_addr.trim() || !newCompany.business_type.trim() || !newCompany.comp_contact.email.trim() || !newCompany.comp_contact.phone_number[0]?.trim()}
                >
                  {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Package Modal */}
        {showCreatePackageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create AD Package</h2>
                <Button
                  onClick={() => setShowCreatePackageModal(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pack_name">Package Name *</Label>
                  <Input
                    id="pack_name"
                    value={newPackage.pack_name}
                      onChange={(e) => setNewPackage((prev: CreateAdPackageData) => ({ ...prev, pack_name: e.target.value }))}
                    placeholder="e.g., Basic, Premium, Enterprise"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage((prev: CreateAdPackageData) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newPackage.duration}
                      onChange={(e) => setNewPackage((prev: CreateAdPackageData) => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setShowCreatePackageModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createPackageMutation.mutate(newPackage)}
                  disabled={createPackageMutation.isPending || !newPackage.pack_name.trim() || newPackage.price <= 0 || newPackage.duration <= 0}
                >
                  {createPackageMutation.isPending ? 'Creating...' : 'Create Package'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Company Modal */}
        {editingCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit AD Company</h2>
                <Button
                  onClick={() => setEditingCompany(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_comp_name">Company Name *</Label>
                    <Input
                      id="edit_comp_name"
                      value={editingCompany.comp_name}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, comp_name: e.target.value } : null)}
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_comp_tin">TIN *</Label>
                    <Input
                      id="edit_comp_tin"
                      value={editingCompany.comp_tin}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, comp_tin: e.target.value } : null)}
                      placeholder="Enter TIN number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_comp_addr">Address *</Label>
                  <Input
                    id="edit_comp_addr"
                    value={editingCompany.comp_addr}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, comp_addr: e.target.value } : null)}
                    placeholder="Enter company address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_business_type">Business Type *</Label>
                    <Input
                      id="edit_business_type"
                      value={editingCompany.business_type}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, business_type: e.target.value } : null)}
                      placeholder="e.g., Technology, Retail, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_website">Website</Label>
                    <Input
                      id="edit_website"
                      value={editingCompany.website || ""}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, website: e.target.value } : null)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editingCompany.comp_contact.email}
                    onChange={(e) => setEditingCompany(prev => prev ? ({ 
                      ...prev, 
                      comp_contact: { ...prev.comp_contact, email: e.target.value } 
                    }) : null)}
                    placeholder="company@example.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setEditingCompany(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingCompany) {
                      // Only send the fields that are allowed by the API
                      const updateData = {
                        comp_name: editingCompany.comp_name,
                        comp_tin: editingCompany.comp_tin,
                        comp_addr: editingCompany.comp_addr,
                        comp_contact: editingCompany.comp_contact,
                        business_type: editingCompany.business_type,
                        website: editingCompany.website
                      }
                      updateCompanyMutation.mutate({ id: editingCompany._id, data: updateData })
                    }
                  }}
                  disabled={updateCompanyMutation.isPending || !editingCompany?.comp_name.trim() || !editingCompany?.comp_tin.trim() || !editingCompany?.comp_addr.trim() || !editingCompany?.business_type.trim() || !editingCompany?.comp_contact.email.trim()}
                >
                  {updateCompanyMutation.isPending ? 'Updating...' : 'Update Company'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Package Modal */}
        {editingPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit AD Package</h2>
                <Button
                  onClick={() => setEditingPackage(null)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_pack_name">Package Name (Read-only)</Label>
                  <Input
                    id="edit_pack_name"
                    value={editingPackage.pack_name}
                    disabled
                    placeholder="e.g., Basic, Premium, Enterprise"
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Package name cannot be changed after creation</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_price">Price ($) *</Label>
                    <Input
                      id="edit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPackage.price}
                      onChange={(e) => setEditingPackage(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_duration">Duration (days) *</Label>
                    <Input
                      id="edit_duration"
                      type="number"
                      min="1"
                      value={editingPackage.duration}
                      onChange={(e) => setEditingPackage(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 1 } : null)}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setEditingPackage(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingPackage) {
                      // Only send the fields that are allowed by the API validation
                      const updateData = {
                        price: editingPackage.price,
                        duration: editingPackage.duration
                      }
                      updatePackageMutation.mutate({ id: editingPackage._id, data: updateData })
                    }
                  }}
                  disabled={updatePackageMutation.isPending || editingPackage?.price <= 0 || editingPackage?.duration <= 0}
                >
                  {updatePackageMutation.isPending ? 'Updating...' : 'Update Package'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Advertisement Modal */}
        {editingAd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Advertisement</h2>
                <Button
                  onClick={() => {
                    setEditingAd(null)
                    setOriginalAd(null)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_ad_company">Company</Label>
                  <select
                    id="edit_ad_company"
                    value={typeof editingAd.ad_company === 'string' ? editingAd.ad_company : (editingAd.ad_company as AdCompany)?._id || ''}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, ad_company: e.target.value } : null)}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company: AdCompany) => (
                      <option key={company._id} value={company._id}>
                        {company.comp_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit_ad_package">Package</Label>
                  <select
                    id="edit_ad_package"
                    value={typeof editingAd.ad_package === 'string' ? editingAd.ad_package : (editingAd.ad_package as AdPackage)?._id || ''}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, ad_package: e.target.value } : null)}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg: AdPackage) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.pack_name} - ${pkg.price} ({pkg.duration} days)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit_link">Link (Optional)</Label>
                  <Input
                    id="edit_link"
                    value={editingAd.link || ""}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, link: e.target.value } : null)}
                    placeholder="Enter advertisement link"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_start_date">Start Date</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={editingAd.start_date ? new Date(editingAd.start_date).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={editingAd.is_active}
                    onChange={(e) => setEditingAd(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                    className="rounded"
                  />
                  <Label htmlFor="edit_is_active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => {
                    setEditingAd(null)
                    setOriginalAd(null)
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (editingAd) {
                      try {
                        // Update basic info (company, package, link)
                        const basicData = {
                          ad_company: typeof editingAd.ad_company === 'string' ? editingAd.ad_company : (editingAd.ad_company as AdCompany)?._id,
                          ad_package: typeof editingAd.ad_package === 'string' ? editingAd.ad_package : (editingAd.ad_package as AdPackage)?._id,
                          link: editingAd.link
                        }
                        
                        if (basicData.ad_company && basicData.ad_package) {
                          await updateAdMutation.mutateAsync({ id: editingAd._id, data: basicData })
                        }

                        // Update status if changed
                        if (originalAd && editingAd.is_active !== originalAd.is_active) {
                          await updateAdStatusMutation.mutateAsync({ id: editingAd._id, is_active: editingAd.is_active })
                        }

                        // Update calendar if start_date changed
                        if (editingAd.start_date) {
                          // Calculate end_date based on package duration
                          const packageInfo = typeof editingAd.ad_package === 'string' 
                            ? packages.find((p: AdPackage) => p._id === editingAd.ad_package)
                            : editingAd.ad_package as AdPackage
                          
                          if (packageInfo?.duration) {
                            const startDate = new Date(editingAd.start_date)
                            const endDate = new Date(startDate)
                            endDate.setDate(startDate.getDate() + packageInfo.duration)
                            
                            await updateAdCalendarMutation.mutateAsync({ 
                              id: editingAd._id, 
                              data: { 
                                start_date: editingAd.start_date,
                                end_date: endDate.toISOString().split('T')[0]
                              } 
                            })
                          }
                        }

                        addNotification({
                          id: Date.now().toString(),
                          type: 'success',
                          title: 'Success',
                          message: 'Advertisement updated successfully'
                        })
                        setEditingAd(null)
                        setOriginalAd(null)
                        refetch()
                      } catch (error) {
                        console.error('Update error:', error)
                      }
                    }
                  }}
                  disabled={updateAdMutation.isPending || updateAdStatusMutation.isPending || updateAdCalendarMutation.isPending || !editingAd?.ad_company || !editingAd?.ad_package || !editingAd?.start_date}
                >
                  {(updateAdMutation.isPending || updateAdStatusMutation.isPending || updateAdCalendarMutation.isPending) ? 'Updating...' : 'Update Advertisement'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
