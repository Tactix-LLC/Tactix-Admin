"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsAPI, usersAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  Trophy,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  UserPlus,
  Play,
  Eye,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Shield,
  Globe,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: analyticsAPI.getDashboardStats,
  })

  // Fetch total users count separately
  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: () => usersAPI.getCount(),
  })

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
                      <ArrowUpRight className="h-4 w-4 text-success-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-error-500" />
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

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color = "primary" 
  }: {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    href: string
    color?: "primary" | "success" | "warning" | "error"
  }) => {
    const colorClasses = {
      primary: "hover:bg-primary-50 hover:border-primary-200 text-primary-600",
      success: "hover:bg-success-50 hover:border-success-200 text-success-600",
      warning: "hover:bg-warning-50 hover:border-warning-200 text-warning-600",
      error: "hover:bg-error-50 hover:border-error-200 text-error-600"
    }

    return (
      <Link href={href}>
        <Card className={`group cursor-pointer border-2 border-gray-100 transition-all duration-200 ${colorClasses[color]}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-white transition-colors">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-100 mx-auto mb-4">
              <Shield className="h-8 w-8 text-error-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-500 mb-4">There was an error loading your dashboard data.</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const recentActivities = [
    { 
      action: "New user registered", 
      time: "2 minutes ago", 
      type: "user",
      icon: UserPlus,
      color: "text-success-600 bg-success-100"
    },
    { 
      action: "Game week started", 
      time: "1 hour ago", 
      type: "gameweek",
      icon: Play,
      color: "text-primary-600 bg-primary-100"
    },
    { 
      action: "Payment processed", 
      time: "3 hours ago", 
      type: "payment",
      icon: DollarSign,
      color: "text-warning-600 bg-warning-100"
    },
    { 
      action: "Competition created", 
      time: "5 hours ago", 
      type: "competition",
      icon: Trophy,
      color: "text-error-600 bg-error-100"
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Admin! ⚽</h1>
              <p className="text-primary-100 text-lg">Heres whats happening with your fantasy football platform today.</p>
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
                <Calendar className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={usersCount?.allClients?.toLocaleString() || "0"}
            description="Registered players"
            icon={Users}
            trend="up"
            trendValue="+12.5%"
            color="primary"
          />
          <StatCard
            title="Active Game Weeks"
            value={stats?.data?.activeGameWeeks || "0"}
            description="Currently running"
            icon={Calendar}
            color="success"
          />
          <StatCard
            title="Total Competitions"
            value={stats?.data?.totalCompetitions || "0"}
            description="All tournaments"
            icon={Trophy}
            trend="up"
            trendValue="+3"
            color="warning"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats?.data?.monthlyRevenue?.toLocaleString() || "0"}`}
            description="This month's earnings"
            icon={DollarSign}
            trend="up"
            trendValue="+8.2%"
            color="error"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-tactix">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-primary-500" />
                      <span>Recent Activity</span>
                    </CardTitle>
                    <CardDescription>Latest updates across your platform</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const IconComponent = activity.icon
                    return (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="border-0 shadow-tactix">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary-500" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuickActionCard
                  title="Create Game Week"
                  description="Set up a new game week"
                  icon={Calendar}
                  href="/game-weeks"
                  color="primary"
                />
                <QuickActionCard
                  title="Manage Users"
                  description="View and edit user accounts"
                  icon={Users}
                  href="/users"
                  color="success"
                />
                <QuickActionCard
                  title="View Analytics"
                  description="Check platform statistics"
                  icon={BarChart3}
                  href="/analytics"
                  color="warning"
                />
                <QuickActionCard
                  title="Global Settings"
                  description="Configure platform settings"
                  icon={Globe}
                  href="/settings"
                  color="error"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-tactix">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Uptime</p>
                  <p className="text-2xl font-bold text-success-600">99.9%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100">
                  <Shield className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-tactix">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-primary-600">1,247</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-tactix">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-warning-600">145ms</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100">
                  <Zap className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-tactix">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Usage</p>
                  <p className="text-2xl font-bold text-error-600">2.4GB</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-100">
                  <BarChart3 className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 