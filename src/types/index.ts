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
  game_week: string
  sid: string
  cid: string
  season_id: string
  competition_id: string
  transfer_deadline: string
  purchase_deadline: string
  is_free: boolean
  is_done: boolean
  is_active: boolean
  first_match_start_date: string
  last_match_end_date: string
  match_ids: string[]
  time_interval?: string
  is_double_gameweek: boolean
  double_gameweek_first_match?: string
  double_gameweek_transfer_deadline?: string
  double_gameweek_teams?: string[]
  createdAt: string
  updatedAt: string
  // Legacy fields for backward compatibility
  name?: string
  week_number?: number
  start_date?: string
  end_date?: string
  status?: string
  participants_count?: number
  created_at?: string
  updated_at?: string
}

// Season Types  
export interface Season {
  _id: string
  name: string
  season_id: string
  is_active: boolean
  createdAt: string
  updatedAt: string
  competitions?: Competition[]
}

// Competition Types
export interface Competition {
  _id: string
  competition_name: string
  competition_slug: string
  cid: string
  sid: string
  logo?: string
  is_active: boolean
  start_date: string
  end_date: string
  status: number // 1=active, 2=completed, 3=cancelled
  season: string
  createdAt: string
  updatedAt: string
  participants_count?: number
  prize_pool?: number
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

// Fantasy Roaster Types
export interface FantasyPlayer {
  pid: string
  pname: string
  role: string
  rating: string
  prev_rating?: string
  transfer_radar?: boolean
  is_new?: boolean
  is_injuried?: boolean
  is_banned?: boolean
  team: {
    tid: string
    tname: string
    fullname: string
    abbr: string
    logo: string
  }
}

export interface FantasyRoaster {
  _id: string
  season_name: string
  is_active: boolean
  players: FantasyPlayer[]
  createdAt: string
  updatedAt: string
}

export interface CreateFantasyRoasterData {
  season_name: string
  players: FantasyPlayer[]
}

export interface UpdatePlayerRatingData {
  pid: string
  rating: number
}

export interface UpdateRoasterStatusData {
  is_active: boolean
}

export interface AddPlayerData {
  pid: string
  pname: string
  rating: number
  role: string
  tid: string
  tname: string
  logo: string
  fullname: string
  abbr: string
}

export interface RemovePlayerData {
  pid: string
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
  game_week: string
  season_id: string
  competition_id: string
  is_free?: boolean
}

export interface UpdateGameWeekDeadlinesData {
  transfer_deadline: string
  purchase_deadline: string
  first_match_start_date: string
  last_match_end_date: string
  time_interval?: string
}

export interface CreateCompetitionData {
  cid: string
  season: string
}

export interface UpdateCompetitionData {
  cid: string
}

export interface CreateSeasonData {
  name: string
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