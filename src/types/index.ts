// API Response Types
export interface ApiResponse<T = unknown> {
  status: 'SUCCESS' | 'ERROR'
  message: string
  data?: T
  token?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// User Types
export interface User {
  _id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  account_status: boolean
  role: 'Client' | 'admin' | 'agent'
  createdAt: string
  updatedAt: string
  birth_date?: string
  has_team?: boolean
  agent_code?: string
  credit?: number
  // Legacy fields for backward compatibility
  name?: string
  status?: 'active' | 'inactive' | 'banned' | 'pending'
  created_at?: string
  updated_at?: string
}

export interface AdminUser {
  _id: string
  email: string
  name: string
  role: 'admin'
  status: string
  created_at: string
  updated_at: string
}

// Game Week Types
export interface GameWeek {
  _id: string
  name?: string
  week_number: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  participants_count?: number
  created_at: string
  updated_at: string
}

// Competition Types
export interface Competition {
  _id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  participants_count?: number
  prize_pool?: number
  created_at: string
  updated_at: string
}

// Team Types
export interface Team {
  _id: string
  name: string
  user_id: string
  game_week_id?: string
  players: string[]
  formation?: string
  captain_id?: string
  vice_captain_id?: string
  total_points?: number
  created_at: string
  updated_at: string
}

// Player Types
export interface Player {
  _id: string
  name: string
  team: string
  position: string
  price: number
  total_points?: number
  form?: number
  status: 'active' | 'injured' | 'suspended'
  created_at: string
  updated_at: string
}

// Transaction Types
export interface Transaction {
  _id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description?: string
  created_at: string
  updated_at: string
}

// FAQ Types
export interface FAQ {
  _id: string
  question: string
  answer: string
  category?: string
  order?: number
  created_at: string
  updated_at: string
}

// Content Types
export interface Content {
  _id: string
  title: string
  content: string
  type: 'terms' | 'privacy' | 'about'
  created_at: string
  updated_at: string
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalGameWeeks: number
  activeGameWeeks: number
  totalCompetitions: number
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  userGrowth: number
}

// Form Data Types
export interface LoginFormData {
  email: string
  password: string
}

export interface CreateGameWeekData {
  name?: string
  week_number: number
  start_date: string
  end_date: string
  status?: string
}

export interface CreateCompetitionData {
  name: string
  description?: string
  start_date: string
  end_date: string
  prize_pool?: number
  status?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  status?: string
  agent_code?: string
  commission_rate?: number
}

// API Parameters Types
export interface ApiParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// Generic Types
export type ApiFunction<T = unknown> = (params?: ApiParams) => Promise<ApiResponse<T>>
export type MutationFunction<T = unknown, R = unknown> = (data: T) => Promise<ApiResponse<R>> 