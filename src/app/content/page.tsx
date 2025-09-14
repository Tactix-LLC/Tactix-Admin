"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { contentAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import type { FAQ } from "@/types"
import { Plus, Trash2, Save } from "lucide-react"
import { useUIStore } from "@/lib/store"

export default function ContentPage() {
  const qc = useQueryClient()
  const { addNotification } = useUIStore()
  const [terms, setTerms] = useState("")
  const [privacy, setPrivacy] = useState("")
  const [about, setAbout] = useState("")
  const [newFAQ, setNewFAQ] = useState({ title: "", content: "" })

  const { data: faqData, refetch: refetchFAQs, isLoading: faqLoading, error: faqError } = useQuery({ 
    queryKey: ["faqs"], 
    queryFn: () => contentAPI.getFAQs({ limit: 100 }) 
  })
  const { data: termsData, isLoading: termsLoading, error: termsError } = useQuery({ 
    queryKey: ["terms"], 
    queryFn: contentAPI.getTerms 
  })
  const { data: privacyData, isLoading: privacyLoading, error: privacyError } = useQuery({ 
    queryKey: ["privacy"], 
    queryFn: contentAPI.getPrivacy 
  })
  const { data: aboutData, isLoading: aboutLoading, error: aboutError } = useQuery({ 
    queryKey: ["about"], 
    queryFn: contentAPI.getAbout 
  })

  // Initialize editors when data arrives
  const t = termsData?.data?.termsAndConditions?.[0]?.content ?? ""
  const p = privacyData?.data?.privacy?.[0]?.content ?? ""
  const a = aboutData?.data?.aboutUs?.[0]?.content ?? ""


  // Keep controlled values synced on first load
  if (!terms && t) setTerms(t)
  if (!privacy && p) setPrivacy(p)
  if (!about && a) setAbout(a)

  const saveTerms = useMutation({
    mutationFn: () => contentAPI.updateTerms({ 
      title: "Terms and Conditions",
      content: terms
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terms"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Terms and conditions updated successfully'
      })
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update terms'
      })
    }
  })
  const savePrivacy = useMutation({
    mutationFn: () => contentAPI.updatePrivacy({ 
      title: "Privacy Policy",
      content: privacy
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Privacy policy updated successfully'
      })
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update privacy policy'
      })
    }
  })
  const saveAbout = useMutation({
    mutationFn: () => contentAPI.updateAbout({ 
      content: about,
      version_title: "About Us",
      version_content: about 
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["about"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'About us updated successfully'
      })
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update about us'
      })
    }
  })

  const createFAQ = useMutation({
    mutationFn: () => contentAPI.createFAQ(newFAQ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] })
      setNewFAQ({ title: "", content: "" })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'FAQ created successfully'
      })
    },
  })

  const deleteFAQ = useMutation({
    mutationFn: (id: string) => contentAPI.deleteFAQ(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] })
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'FAQ deleted successfully'
      })
    },
  })

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-2">Manage FAQs, terms, privacy policy, and about us content</p>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Frequently Asked Questions</span>
              <Button
                onClick={() => createFAQ.mutate()}
                disabled={!newFAQ.title.trim() || !newFAQ.content.trim() || createFAQ.isPending}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New FAQ Form */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Add New FAQ</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter the FAQ title..."
                    value={newFAQ.title}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <textarea
                    id="content"
                    placeholder="Enter the FAQ content..."
                    value={newFAQ.content}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full min-h-[100px] border rounded-md p-3 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Existing FAQs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Existing FAQs</h3>
              {faqLoading ? (
                <div className="text-center py-4">Loading FAQs...</div>
              ) : faqError ? (
                <div className="text-red-500 py-4">Error loading FAQs: {faqError.message}</div>
              ) : (faqData?.data?.faqs ?? []).length === 0 ? (
                <div className="text-gray-500 py-4">No FAQs found</div>
              ) : (
                (faqData?.data?.faqs ?? []).map((f: FAQ) => (
                <div key={f._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">{f.title}</div>
                      <div className="text-sm text-gray-600">{f.content}</div>
                    </div>
                    <Button
                      onClick={() => deleteFAQ.mutate(f._id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="terms">Content</Label>
              {termsError && (
                <div className="text-red-500 text-sm">Error loading terms: {termsError.message}</div>
              )}
              <textarea 
                id="terms"
                className="w-full min-h-[200px] border rounded-md p-4 text-sm" 
                value={terms} 
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter terms and conditions content..."
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => saveTerms.mutate()} 
                  disabled={saveTerms.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveTerms.isPending ? 'Saving...' : 'Save Terms'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="privacy">Content</Label>
              {privacyError && (
                <div className="text-red-500 text-sm">Error loading privacy: {privacyError.message}</div>
              )}
              <textarea 
                id="privacy"
                className="w-full min-h-[200px] border rounded-md p-4 text-sm" 
                value={privacy} 
                onChange={(e) => setPrivacy(e.target.value)}
                placeholder="Enter privacy policy content..."
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => savePrivacy.mutate()} 
                  disabled={savePrivacy.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savePrivacy.isPending ? 'Saving...' : 'Save Privacy Policy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About Us</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="about">Content</Label>
              {aboutError && (
                <div className="text-red-500 text-sm">Error loading about: {aboutError.message}</div>
              )}
              <textarea 
                id="about"
                className="w-full min-h-[200px] border rounded-md p-4 text-sm" 
                value={about} 
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Enter about us content..."
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => saveAbout.mutate()} 
                  disabled={saveAbout.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveAbout.isPending ? 'Saving...' : 'Save About Us'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}


