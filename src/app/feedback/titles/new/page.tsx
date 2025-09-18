"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { feedbackTitlesApi } from "@/lib/api/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MainLayout } from "@/components/layout/main-layout"
import { toast } from "sonner"
import { ArrowLeft, Save, MessageSquare, Star, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NewFeedbackTitlePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: "",
    major: false,
  })

  const createMutation = useMutation({
    mutationFn: feedbackTitlesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTitles'] })
      toast.success("Feedback title created successfully")
      router.push("/feedback")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

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

    createMutation.mutate({
      title: formData.title.trim(),
      major: formData.major,
    })
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Create New Feedback Title ✨</h1>
              <p className="text-primary-100 text-lg">Add a new feedback category for clients to select from when submitting feedback.</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Plus className="h-8 w-8" />
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
            </CardTitle>
            <CardDescription>
              Create a new feedback title that clients can choose when submitting feedback
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

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Checkbox
                    id="major"
                    checked={formData.major}
                    onCheckedChange={(checked) => handleInputChange("major", checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="major" className="text-sm font-medium text-gray-700 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-warning-500" />
                        <span>Mark as major title</span>
                      </div>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Major titles are always active and cannot be deleted. Only 3 major titles are allowed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" asChild className="px-6">
                  <Link href="/feedback">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || formData.title.length < 10}
                  className="min-w-[140px] bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Title
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
