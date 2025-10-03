"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationItems } from "@/lib/constants"
import { useUIStore, useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Users2,
  Calendar,
  Trophy,
  Shield,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Activity,
  Monitor,
  Smartphone,
  Award,
  MessageSquare,
  MessageCircle,
} from "lucide-react"
import { useState } from "react"

const iconMap = {
  LayoutDashboard,
  Users,
  Users2,
  Calendar,
  Trophy,
  Shield,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Activity,
  Monitor,
  Smartphone,
  Award,
  MessageSquare,
  MessageCircle,
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform bg-white shadow-tactix-lg transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between bg-gradient-to-r from-primary-600 to-primary-500 px-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Tactix</h1>
              <p className="text-xs text-primary-100">Admin Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto min-h-0">
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Main Navigation
            </p>
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-500"
                  )} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>

          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Management
            </p>
            {navigationItems.slice(4, 8).map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-500"
                  )} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              System
            </p>
            {navigationItems.slice(8).map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-500"
                  )} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex w-full items-center space-x-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin User"}</p>
                <p className="text-xs text-gray-500">{user?.email || "admin@tactix.com"}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-white shadow-lg border border-gray-200">
                <div className="p-2">
                  <button className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function SidebarToggle() {
  const { setSidebarOpen } = useUIStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-gray-600 hover:bg-gray-100 hover:text-primary-600 lg:hidden"
      onClick={() => setSidebarOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
} 