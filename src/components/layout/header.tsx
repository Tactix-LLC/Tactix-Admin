"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useAuthStore, useUIStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { SidebarToggle } from "./sidebar"
import {
  Bell,
  Search,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  Filter,
} from "lucide-react"

export function Header() {
  const { user } = useAuthStore()
  const { notifications } = useUIStore()
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()

  // Get page title based on current route
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Welcome back! Here\'s what\'s happening with your fantasy football platform.',
        }
      case '/users':
        return {
          title: 'User Management',
          subtitle: 'Manage user accounts, permissions, and agent statuses.',
        }
      case '/game-weeks':
        return {
          title: 'Game Weeks',
          subtitle: 'Create and manage fantasy football game weeks.',
        }
      case '/competitions':
        return {
          title: 'Competitions',
          subtitle: 'Manage competitions and tournaments.',
        }
      case '/teams':
        return {
          title: 'Team Management',
          subtitle: 'View and manage user teams and formations.',
        }
      case '/players':
        return {
          title: 'Player Statistics',
          subtitle: 'Manage player data and performance statistics.',
        }
      case '/financial':
        return {
          title: 'Financial Dashboard',
          subtitle: 'Track transactions, credits, and commissions.',
        }
      case '/content':
        return {
          title: 'Content Management',
          subtitle: 'Manage FAQs, terms, and platform content.',
        }
      case '/analytics':
        return {
          title: 'Analytics & Reports',
          subtitle: 'View platform analytics and generate reports.',
        }
      case '/settings':
        return {
          title: 'Settings',
          subtitle: 'Configure platform settings and preferences.',
        }
      default:
        return {
          title: 'Admin Dashboard',
          subtitle: 'Tactix Fantasy Football Platform',
        }
    }
  }

  const { title, subtitle } = getPageTitle()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <SidebarToggle />
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, teams, competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-80 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-500 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all duration-200"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 border-gray-200 hover:border-primary-300 hover:bg-primary-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-10 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-10 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
          >
            <Sun className="h-5 w-5" />
          </Button>

          {/* User Profile Indicator */}
          <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || "Admin User"}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Subtitle */}
      <div className="hidden lg:block border-t border-gray-100 bg-gray-50 px-6 py-3">
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </header>
  )
} 