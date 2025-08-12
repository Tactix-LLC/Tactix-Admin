"use client"

import { useEffect } from "react"
import { useUIStore } from "@/lib/store"
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toast() {
  const { notifications, removeNotification } = useUIStore()

  useEffect(() => {
    notifications.forEach((notification) => {
      // Don't auto-dismiss error notifications - let user dismiss them manually
      if (notification.type === 'error') {
        return
      }
      
      const timer = setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    })
  }, [notifications, removeNotification])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-error-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning-600" />
      case 'info':
        return <Info className="h-5 w-5 text-primary-600" />
      default:
        return <Info className="h-5 w-5 text-primary-600" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50 text-success-800'
      case 'error':
        return 'border-error-200 bg-error-50 text-error-800'
      case 'warning':
        return 'border-warning-200 bg-warning-50 text-warning-800'
      case 'info':
        return 'border-primary-200 bg-primary-50 text-primary-800'
      default:
        return 'border-primary-200 bg-primary-50 text-primary-800'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex w-96 items-start space-x-3 rounded-lg border p-4 shadow-lg animate-slide-up",
            getStyles(notification.type)
          )}
        >
          {getIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">{notification.title}</h4>
            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}