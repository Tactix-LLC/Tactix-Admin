"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore, useUIStore } from "@/lib/store"
import { authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Trophy, Users, BarChart3, Shield } from "lucide-react"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()
  const { addNotification } = useUIStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    console.log("Attempting login with:", { email_or_phone: data.email_or_phone })
    try {
      const response = await authAPI.login(data.email_or_phone, data.password)
      console.log("Login response:", response)
      
      if (response.status === "SUCCESS" && response.data?.admin && response.token) {
        login(response.data.admin, response.token)
        localStorage.setItem("admin_token", response.token)
        
        addNotification({
          id: Date.now().toString(),
          type: "success",
          title: "Login Successful",
          message: "Welcome to Tactix Admin Dashboard",
        })
        
        router.push("/dashboard")
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      let errorMessage = "Invalid credentials";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as { response?: { data?: { message?: string } }, message?: string };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Login Failed",
        message: errorMessage,
        duration: 6000, // 6 seconds for errors
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700">
        <div className="text-white">
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tactix</h1>
              <p className="text-primary-100">Fantasy Football Platform</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Welcome to your<br />
              <span className="text-primary-200">Admin Dashboard</span>
            </h2>
            
            <p className="text-xl text-primary-100 leading-relaxed">
              Manage your fantasy football platform with powerful tools and real-time analytics.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-primary-100">User & Team Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-primary-100">Real-time Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-primary-100">Secure & Reliable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden mb-8">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Tactix Admin
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Fantasy Football Platform
            </p>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
              <p className="mt-2 text-gray-600">
                Enter your credentials to access the admin dashboard
              </p>
            </div>

            <Card className="border-0 shadow-tactix">
              <CardContent className="p-8">
                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit(onSubmit)(e)
                }} className="space-y-6">
                  <div>
                    <label htmlFor="email_or_phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email or Phone Number
                    </label>
                    <Input
                      id="email_or_phone"
                      type="text"
                      {...register("email_or_phone")}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                      placeholder="admin@tactix.com or +1234567890"
                    />
                    {errors.email_or_phone && (
                      <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-error-100 flex items-center justify-center text-xs">!</span>
                        <span>{errors.email_or_phone.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-error-100 flex items-center justify-center text-xs">!</span>
                        <span>{errors.password.message}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Signing you in...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-3 h-5 w-5" />
                        Sign In to Dashboard
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Secured by <span className="font-semibold text-primary-600">Tactix Security</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 