"use client"

import React, { useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { subscriptionsAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    CreditCard,
    Search,
    DollarSign,
    Users,
    TrendingUp,
    Calendar,
    Mail,
    Phone,
    RefreshCw,
    XCircle,
    RefreshCcw,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function SubscriptionsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [planFilter, setPlanFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const pageSize = 20
    const queryClient = useQueryClient()

    const { data: subscriptionsData, isLoading, error, refetch } = useQuery({
        queryKey: ["subscriptions", searchTerm, statusFilter, planFilter, currentPage],
        queryFn: async () => {
            const params: {
                page: number;
                limit: number;
                search?: string;
                status?: string;
                plan?: string;
            } = {
                page: currentPage,
                limit: pageSize,
            }

            if (searchTerm.trim()) {
                params.search = searchTerm
            }

            if (statusFilter !== "all") {
                params.status = statusFilter
            }

            if (planFilter !== "all") {
                params.plan = planFilter
            }

            const result = await subscriptionsAPI.getAll(params)
            return result
        },
    })

    const subscriptions = subscriptionsData?.data?.subscriptions || []
    const pagination = subscriptionsData?.data?.pagination
    const statistics = subscriptionsData?.data?.statistics

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
            await refetch()
        } finally {
            setIsRefreshing(false)
        }
    }

    // Expire subscription mutation
    const expireMutation = useMutation({
        mutationFn: (userId: string) => subscriptionsAPI.expireSubscription(userId),
        onSuccess: () => {
            // Invalidate and refetch subscriptions
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
            refetch()
        },
    })

    // Sync subscription mutation
    const syncMutation = useMutation({
        mutationFn: (userId: string) => subscriptionsAPI.syncSubscription(userId),
        onSuccess: () => {
            // Invalidate and refetch subscriptions
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
            refetch()
        },
    })

    const handleExpireSubscription = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to expire the subscription for ${userName}? This action cannot be undone.`)) {
            return
        }

        try {
            await expireMutation.mutateAsync(userId)
            alert("Subscription expired successfully!")
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unknown error"
            alert(`Failed to expire subscription: ${errorMessage}`)
        }
    }

    const handleSyncSubscription = async (userId: string) => {
        try {
            const result = await syncMutation.mutateAsync(userId)
            const status = result.data?.subscription_status === 'active' ? 'active' : 'inactive'
            alert(`Subscription synced successfully! Status: ${status}`)
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unknown error"
            alert(`Failed to sync subscription: ${errorMessage}`)
        }
    }

    const getStatusBadge = (status: 'active' | 'inactive') => {
        const config = {
            active: { color: "bg-green-100 text-green-800", label: "Active" },
            inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
        }

        const statusConfig = config[status] || config.inactive
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
            </span>
        )
    }

    const getPlanBadge = (plan?: 'monthly' | 'yearly') => {
        if (!plan) return <span className="text-gray-400 text-sm">N/A</span>

        const config = {
            monthly: { color: "bg-blue-100 text-blue-800", label: "Monthly" },
            yearly: { color: "bg-purple-100 text-purple-800", label: "Yearly" },
        }

        const planConfig = config[plan]
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planConfig.color}`}>
                {planConfig.label}
            </span>
        )
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
                    <p className="text-red-500">Error loading subscriptions data</p>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
                        <p className="text-gray-600">Manage premium subscriptions and revenue</p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing || isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics?.totalUsers || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {statistics?.activeSubscriptions || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">MRR</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary-600">
                                ${statistics?.revenue?.mrr || '0.00'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics?.monthlySubscriptions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Yearly</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics?.yearlySubscriptions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {statistics?.expiredSubscriptions || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Management</CardTitle>
                        <CardDescription>Search and filter subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Plans</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscriptions Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expires At
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No subscriptions found
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions.map((sub) => (
                                            <tr key={sub._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                                                            {sub.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {sub.full_name || 'N/A'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: {sub._id.slice(-8)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                                            {sub.email || 'N/A'}
                                                        </div>
                                                        {sub.phone_number && (
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                                {sub.phone_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(sub.subscription_status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPlanBadge(sub.subscription_plan)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {sub.subscription_expires_at
                                                        ? formatDate(sub.subscription_expires_at)
                                                        : <span className="text-gray-400">N/A</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(sub.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSyncSubscription(sub._id)}
                                                            disabled={syncMutation.isPending}
                                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Sync subscription from RevenueCat"
                                                        >
                                                            <RefreshCcw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                                            {syncMutation.isPending ? 'Syncing...' : 'Sync'}
                                                        </Button>
                                                        {sub.subscription_status === 'active' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleExpireSubscription(sub._id, sub.full_name || 'User')}
                                                                disabled={expireMutation.isPending}
                                                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Expire subscription"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                {expireMutation.isPending ? 'Expiring...' : 'Expire'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
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
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
