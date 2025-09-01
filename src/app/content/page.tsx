"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { contentAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { FAQ } from "@/types"

export default function ContentPage() {
  const qc = useQueryClient()
  const [terms, setTerms] = useState("")
  const [privacy, setPrivacy] = useState("")
  const [about, setAbout] = useState("")

  const { data: faqData } = useQuery({ queryKey: ["faqs"], queryFn: () => contentAPI.getFAQs({ limit: 100 }) })
  const { data: termsData } = useQuery({ queryKey: ["terms"], queryFn: contentAPI.getTerms })
  const { data: privacyData } = useQuery({ queryKey: ["privacy"], queryFn: contentAPI.getPrivacy })
  const { data: aboutData } = useQuery({ queryKey: ["about"], queryFn: contentAPI.getAbout })

  // Initialize editors when data arrives
  const t = termsData?.data?.content ?? ""
  const p = privacyData?.data?.content ?? ""
  const a = aboutData?.data?.content ?? ""

  // Keep controlled values synced on first load
  // (simple guard – if empty and has server data, prime it)
  if (!terms && t) setTerms(t)
  if (!privacy && p) setPrivacy(p)
  if (!about && a) setAbout(a)

  const saveTerms = useMutation({
    mutationFn: () => contentAPI.updateTerms({ content: terms }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["terms"] }),
  })
  const savePrivacy = useMutation({
    mutationFn: () => contentAPI.updatePrivacy({ content: privacy }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy"] }),
  })
  const saveAbout = useMutation({
    mutationFn: () => contentAPI.updateAbout({ content: about }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["about"] }),
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Content</h1>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(faqData?.data?.data ?? []).map((f: FAQ) => (
                <div key={f._id} className="border rounded-md p-3">
                  <div className="font-medium">{f.question}</div>
                  <div className="text-sm text-gray-600">{f.answer}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea className="w-full min-h-[160px] border rounded-md p-3" value={terms} onChange={(e) => setTerms(e.target.value)} />
            <div className="mt-2">
              <Button onClick={() => saveTerms.mutate()} disabled={saveTerms.isPending}>Save Terms</Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea className="w-full min-h-[160px] border rounded-md p-3" value={privacy} onChange={(e) => setPrivacy(e.target.value)} />
            <div className="mt-2">
              <Button onClick={() => savePrivacy.mutate()} disabled={savePrivacy.isPending}>Save Privacy</Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About Us</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea className="w-full min-h-[160px] border rounded-md p-3" value={about} onChange={(e) => setAbout(e.target.value)} />
            <div className="mt-2">
              <Button onClick={() => saveAbout.mutate()} disabled={saveAbout.isPending}>Save About</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}


