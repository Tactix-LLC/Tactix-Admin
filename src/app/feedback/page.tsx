"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { feedbackApi, feedbackTitlesApi, FeedbackTitle, Feedback } from "@/lib/api/feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import { 
  MessageCircle, 
  MessageSquare, 
  Plus, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { FeedbackTitlesTable } from "@/components/feedback/feedback-titles-table"
import { FeedbackTable } from "@/components/feedback/feedback-table"

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState("titles")

  // Fetch stats for the dashboard
  const { data: titlesData } = useQuery({
    queryKey: ['feedbackTitles'],
    queryFn: feedbackTitlesApi.getAll,
  })

  const { data: feedbackData } = useQuery({
    queryKey: ['feedback'],
    queryFn: feedbackApi.getAll,
  })

  const activeTitles = titlesData?.data?.feedbackTitles?.filter((title: FeedbackTitle) => title.status === 'Active').length || 0
  const totalFeedback = feedbackData?.data?.feedbacks?.length || 0
  const unreadFeedback = feedbackData?.data?.feedbacks?.filter((feedback: Feedback) => !feedback.read_status).length || 0

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "primary"
  }: {
    title: string
    value: string | number
    description: string
    icon: React.ComponentType<{ className?: string }>
    trend?: "up" | "down"
    trendValue?: string
    color?: "primary" | "success" | "warning" | "error"
  }) => {
    const colorClasses = {
      primary: "from-primary-500 to-primary-600",
      success: "from-success-500 to-success-600", 
      warning: "from-warning-500 to-warning-600",
      error: "from-error-500 to-error-600"
    }

    return (
      <Card className="relative overflow-hidden border-0 shadow-tactix hover:shadow-tactix-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {trend && trendValue && (
                  <div className="flex items-center space-x-1">
                    {trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-error-500 rotate-180" />
                    )}
                    <span className={`text-sm font-medium ${trend === "up" ? "text-success-600" : "text-error-600"}`}>
                      {trendValue}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Feedback Management 💬</h1>
              <p className="text-primary-100 text-lg">Manage feedback titles and monitor client submissions across your platform.</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-primary-100">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <MessageCircle className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Titles"
            value={activeTitles}
            description="Available for selection"
            icon={MessageSquare}
            trend="up"
            trendValue="+2 this week"
            color="primary"
          />
          <StatCard
            title="Total Feedback"
            value={totalFeedback}
            description="All submissions"
            icon={MessageCircle}
            trend="up"
            trendValue="+15% this month"
            color="success"
          />
          <StatCard
            title="Unread Feedback"
            value={unreadFeedback}
            description="Requires attention"
            icon={AlertCircle}
            color={unreadFeedback > 0 ? "warning" : "success"}
          />
          <StatCard
            title="Response Rate"
            value="94%"
            description="Admin response rate"
            icon={CheckCircle}
            trend="up"
            trendValue="+3%"
            color="error"
          />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="titles" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback Titles</span>
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Client Feedback</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles" className="space-y-6">
            <Card className="border-0 shadow-tactix">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-primary-500" />
                      <span>Feedback Titles Management</span>
                    </CardTitle>
                    <CardDescription>Create and manage feedback categories that clients can select from</CardDescription>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg">
                    <Link href="/feedback/titles/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Title
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FeedbackTitlesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card className="border-0 shadow-tactix">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-primary-500" />
                      <span>Client Feedback</span>
                    </CardTitle>
                    <CardDescription>View and manage feedback submissions from clients</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {unreadFeedback} Unread
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FeedbackTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
