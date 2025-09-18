"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { feedbackTitlesApi } from "@/lib/api/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/layout/main-layout"
import { toast } from "sonner"
import { ArrowLeft, Save, Star, MessageSquare, Edit, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function EditFeedbackTitlePage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [formData, setFormData] = useState({
    title: "",
  })

  // Fetch feedback title
  const { data: feedbackTitleData, isLoading, error } = useQuery({
    queryKey: ['feedbackTitle', id],
    queryFn: () => feedbackTitlesApi.getById(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string } }) =>
      feedbackTitlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTitles'] })
      queryClient.invalidateQueries({ queryKey: ['feedbackTitle', id] })
      toast.success("Feedback title updated successfully")
      router.push("/feedback")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update form data when feedback title is loaded
  useEffect(() => {
    if (feedbackTitleData?.data?.feedbackTitle) {
      const title = feedbackTitleData.data.feedbackTitle
      setFormData({
        title: title.title,
      })
    }
  }, [feedbackTitleData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (formData.title.length < 10) {
      toast.error("Title must be at least 10 characters long")
      return
    }

    if (formData.title.length > 500) {
      toast.error("Title must be less than 500 characters")
      return
    }

    updateMutation.mutate({
      id,
      data: {
        title: formData.title.trim(),
      },
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading feedback title...</div>
      </div>
    )
  }

  if (error || !feedbackTitleData?.data?.feedbackTitle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">Failed to load feedback title</div>
      </div>
    )
  }

  const feedbackTitle = feedbackTitleData.data.feedbackTitle

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Edit Feedback Title ✏️</h1>
              <p className="text-primary-100 text-lg">Update the feedback title details and settings.</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Edit className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feedback">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feedback
            </Link>
          </Button>
        </div>

        {/* Form */}
        <Card className="max-w-2xl border-0 shadow-tactix">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              <span>Feedback Title Details</span>
              {feedbackTitle.major && (
                <Badge variant="outline" className="flex items-center space-x-1 bg-warning-50 text-warning-700 border-warning-200">
                  <Star className="w-3 h-3" />
                  <span>Major</span>
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Update the feedback title that clients can choose when submitting feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Title *
                </Label>
                <Textarea
                  id="title"
                  placeholder="Enter feedback title (minimum 10 characters, maximum 500 characters)"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="min-h-[120px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Minimum 10 characters required</span>
                  <span className={formData.title.length > 450 ? "text-warning-600" : "text-gray-500"}>
                    {formData.title.length}/500
                  </span>
                </div>
              </div>

              {feedbackTitle.major && (
                <div className="p-4 bg-warning-50 rounded-xl border border-warning-200">
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-warning-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">
                        Major Title
                      </p>
                      <p className="text-xs text-warning-700 mt-1">
                        This is a major title. Major titles are always active and cannot be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      feedbackTitle.status === 'Active' ? 'bg-success-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-700">{feedbackTitle.status}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-600">Created</span>
                  <p className="text-sm text-gray-700">
                    {new Date(feedbackTitle.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" asChild className="px-6">
                  <Link href="/feedback">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending || formData.title.length < 10}
                  className="min-w-[140px] bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Title
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
