import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { API_CONFIG } from './constants'
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  AdminUser,
  GameWeek, 
  Season,
  Competition, 
  Team, 
  Player, 
  PlayerStat,
  Transaction, 
  FAQ, 
  Content, 
  DashboardStats,
  ApiParams,
  CreateGameWeekData,
  UpdateGameWeekDeadlinesData,
  CreateCompetitionData,
  CreateSeasonData,
  UpdateCompetitionData,
  UpdateUserData,
  FantasyRoaster,
  FantasyPlayer,
  CreateFantasyRoasterData,
  UpdatePlayerRatingData,
  UpdatePlayerInfoData,
  UpdateRoasterStatusData,
  AddPlayerData,
  Coach,
  CreateCoachData,
  UpdateCoachData,
  UpdateCoachImageData,
  UpdateCoachStatusData,
  SwapMajorCoachData,
  RemovePlayerData,
  Advertisement,
  CreateAdvertisementData,
  AdCompany,
  CreateAdCompanyData,
  AdPackage,
  CreateAdPackageData,
  AppVersion,
  CreateAppVersionData,
  UpdateAppVersionData,
  UpdateAppVersionSeverityData,
  Award,
  CreateAwardData,
  Poll,
  CreatePollData,
  UpdatePollData,
  UpdatePollStatusData,
  PollResponse
} from '@/types'

// Auto-join log types
interface AutoJoinLog {
  _id: string
  game_week: string
  game_week_id: string
  executed_at: string
  trigger_type: 'automatic' | 'manual'
  status: 'success' | 'partial' | 'failed'
  successful_joins: number
  failed_joins: number
  already_joined: number
  execution_time_ms: number
  error_details: Array<{
    user_id?: string
    user_name?: string
    user_contact?: string
    error_message: string
  }>
}

interface AutoJoinStatistics {
  total_executions: number
  total_successful: number
  total_partial: number
  total_failed: number
  total_users_joined: number
  average_execution_time: number
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Debug: Log the API configuration
console.log('🔧 API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  TIMEOUT: API_CONFIG.TIMEOUT,
  ENV_VAR: process.env.NEXT_PUBLIC_API_URL
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // Don't redirect on login page 401 errors
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Token expired or invalid - only redirect if not on login page
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email_or_phone: string, password: string): Promise<ApiResponse<{ admin: AdminUser; token: string }>> => {
    console.log('🔐 Login request to:', api.defaults.baseURL + '/api/v1/admins/login')
    const response = await api.post('/api/v1/admins/login', { email_or_phone, password })
    return response.data
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/api/v1/admins/logout')
    return response.data
  },
  
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/v1/admins/profile')
    return response.data
  },
}

// Users API
export const usersAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get('/api/v1/client', { params })
    // Normalize the response to match our expected structure
    const normalizedData = {
      ...response.data,
      data: {
        data: response.data.data.clients || [],
        total: response.data.results || 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: Math.ceil((response.data.results || 0) / (params?.limit || 10))
      }
    }
    return normalizedData
  },
  
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/api/v1/client/${id}`)
    return response.data
  },
  
  update: async (id: string, data: UpdateUserData): Promise<ApiResponse<User>> => {
    const response = await api.put(`/api/v1/client/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/client/${id}`)
    return response.data
  },
  
  changeStatus: async (id: string, status: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/api/v1/client/${id}/status`, { status })
    return response.data
  },
  
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/client/stats')
    return response.data
  },

  getCount: async (): Promise<{ status: string; allClients: number }> => {
    const response = await api.get('/api/v1/client/count')
    return response.data
  },

  // Join user to active game week (admin only)
  joinUserToGameWeek: async (clientId: string): Promise<ApiResponse<{ gameWeekTeam: unknown; alreadyJoined?: boolean }>> => {
    const response = await api.post(`/api/v1/gameweekteam/admin/join/${clientId}`)
    return response.data
  },
}

// Game Weeks API  
export const gameWeeksAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<GameWeek>>> => {
    const response = await api.get('/api/v1/gameweek', { params })
    // Normalize the response to match our expected structure
    const normalizedData = {
      ...response.data,
      data: {
        data: response.data.data?.gameWeeks || [],
        total: response.data.results || 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: Math.ceil((response.data.results || 0) / (params?.limit || 10))
      }
    }
    return normalizedData
  },
  
  getById: async (id: string): Promise<ApiResponse<GameWeek>> => {
    const response = await api.get(`/api/v1/gameweek/${id}`)
    return response.data
  },
  
  create: async (data: CreateGameWeekData): Promise<ApiResponse<GameWeek>> => {
    // Create fetches matches from Entity Sport (can be 5–10+ pages). Use 60s timeout.
    const response = await api.post('/api/v1/gameweek', data, { timeout: 60000 })
    return response.data
  },

  getMatches: async (id: string): Promise<ApiResponse<{
    game_week: string;
    matches: Array<{
      mid: string; round: string; status: string; date: string; venue: string | null;
      home: { name: string; abbr: string; logo: string };
      away: { name: string; abbr: string; logo: string };
      result: { home: string; away: string; winner: string } | null;
      is_rescheduled: boolean;
    }>;
    total: number; total_stored_ids: number; missing: number;
  }>> => {
    const response = await api.get(`/api/v1/gameweek/${id}/matches`, { timeout: 60000 })
    return response.data
  },

  removeMatch: async (id: string, matchId: string): Promise<ApiResponse<{ matchId: string }>> => {
    const response = await api.delete(`/api/v1/gameweek/${id}/matches/${matchId}`)
    return response.data
  },

  browseMatches: async (id: string, page: number): Promise<ApiResponse<{
    matches: Array<{
      mid: string; round: string; status: string; date: string; venue: string | null;
      home: { name: string; abbr: string; logo: string };
      away: { name: string; abbr: string; logo: string };
      result: { home: string; away: string; winner: string } | null;
      already_added: boolean;
    }>;
    page: number; has_more: boolean;
  }>> => {
    const response = await api.get(`/api/v1/gameweek/${id}/browse-matches?page=${page}`, { timeout: 30000 })
    return response.data
  },

  addMatch: async (id: string, matchId: string): Promise<ApiResponse<unknown>> => {
    const response = await api.patch(`/api/v1/gameweek/${id}/matchid`, { match_id: matchId })
    return response.data
  },
  
  update: async (id: string, data: Partial<CreateGameWeekData>): Promise<ApiResponse<GameWeek>> => {
    const response = await api.put(`/api/v1/gameweek/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/gameweek/${id}`)
    return response.data
  },
  
  changeStatus: async (id: string, status: string): Promise<ApiResponse<GameWeek>> => {
    const response = await api.patch(`/api/v1/gameweek/${id}/status`, { status })
    return response.data
  },

  updateDeadlines: async (id: string, data: UpdateGameWeekDeadlinesData): Promise<ApiResponse<GameWeek>> => {
    const response = await api.patch(`/api/v1/gameweek/${id}/deadline`, data)
    return response.data
  },

  // Mark game week as done
  markDone: async (id: string, is_done: boolean = true): Promise<ApiResponse<GameWeek>> => {
    console.log('🔍 [API] Calling markDone:', { id, is_done, url: `/api/v1/gameweek/done/${id}` })
    const response = await api.patch(`/api/v1/gameweek/done/${id}`, { is_done })
    console.log('✅ [API] markDone response:', response.data)
    return response.data
  },

  // Get game week completion job status
  getCompletionStatus: async (id: string): Promise<ApiResponse<{ jobStatus: {
    gameWeekId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: {
      current: number
      total: number
      percentage: number
    }
    startedAt?: string
    completedAt?: string
    error?: string
  } }>> => {
    const response = await api.get(`/api/v1/gameweek/${id}/completion-status`)
    return response.data
  },

  // Get all completion jobs
  getAllCompletionJobs: async (): Promise<ApiResponse<{ jobs: Array<{
    gameWeekId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: {
      current: number
      total: number
      percentage: number
    }
    startedAt?: string
    completedAt?: string
    error?: string
  }> }>> => {
    const response = await api.get(`/api/v1/gameweek/completion-jobs/all`)
    return response.data
  },

  // Fetch player stats for a game week
  fetchPlayerStats: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('🔍 [API] Calling fetchPlayerStats:', { id, url: `/api/v1/gameweek/${id}/fetchplayerstat` })
    // Use longer timeout for fetchPlayerStats as it makes multiple external API calls
    const response = await api.get(`/api/v1/gameweek/${id}/fetchplayerstat`, {
      timeout: 1200000, // 120 seconds timeout for fetching player stats
    })
    console.log('✅ [API] fetchPlayerStats response:', response.data)
    return response.data
  },

  // Auto-join functionality
  triggerAutoJoin: async (id: string): Promise<ApiResponse<{ gameWeekId: string; results: { success: number; failed: number; totalProcessed: number; errors: string[] } }>> => {
    console.log('🔍 [API] Calling triggerAutoJoin:', { id, url: `/api/v1/gameweek/${id}/auto-join` })
    // Use longer timeout for auto-join (120 seconds) as it processes all users
    const response = await api.post(`/api/v1/gameweek/${id}/auto-join`, {}, {
      timeout: 120000, // 120 seconds
    })
    console.log('✅ [API] triggerAutoJoin response:', response.data)
    return response.data
  },

  getAutoJoinStatus: async (): Promise<ApiResponse<{ scheduledJobs: Array<{ gameWeekId: string; nextInvocation: string | null }> }>> => {
    console.log('🔍 [API] Calling getAutoJoinStatus:', { url: `/api/v1/gameweek/auto-join/status` })
    const response = await api.get('/api/v1/gameweek/auto-join/status')
    console.log('✅ [API] getAutoJoinStatus response:', response.data)
    return response.data
  },

  rescheduleAutoJoinJobs: async (): Promise<ApiResponse<{ rescheduledJobs: number; scheduledJobs: Array<{ gameWeekId: string; nextInvocation: string | null }> }>> => {
    console.log('🔍 [API] Calling rescheduleAutoJoinJobs:', { url: `/api/v1/gameweek/auto-join/reschedule` })
    const response = await api.post('/api/v1/gameweek/auto-join/reschedule')
    console.log('✅ [API] rescheduleAutoJoinJobs response:', response.data)
    return response.data
  },

  // Get joined users for a game week
  getJoinedUsers: async (gameWeekId: string): Promise<ApiResponse<{ gameWeekTeam: Array<{ client_id: { first_name: string; last_name: string; phone_number?: string; email?: string; _id: string } | string; team_id: string; total_point: number; players: unknown[] }> }>> => {
    const response = await api.get(`/api/v1/gameweekteam?game_week_id=${gameWeekId}`)
    return response.data
  },

  // Get all auto-join logs
  getAutoJoinLogs: async (params?: { game_week_id?: string; trigger_type?: string; status?: string; limit?: number; skip?: number }): Promise<ApiResponse<{ logs: AutoJoinLog[] }>> => {
    const response = await api.get('/api/v1/auto-join-logs', { params })
    return response.data
  },

  // Get auto-join statistics
  getAutoJoinStatistics: async (): Promise<ApiResponse<{ statistics: AutoJoinStatistics }>> => {
    const response = await api.get('/api/v1/auto-join-logs/statistics')
    return response.data
  },

  // Get auto-join logs for a specific game week
  getAutoJoinLogsByGameWeek: async (gameWeekId: string): Promise<ApiResponse<{ logs: AutoJoinLog[] }>> => {
    const response = await api.get(`/api/v1/auto-join-logs/game-week/${gameWeekId}`)
    return response.data
  },
}

// Competitions API
export const competitionsAPI = {
  getAll: async (params?: ApiParams & { season_id?: string }): Promise<ApiResponse<PaginatedResponse<Competition>>> => {
    const response = await api.get('/api/v1/competitions', { params })
    // Normalize the response to match our expected structure
    const normalizedData = {
      ...response.data,
      data: {
        data: response.data.data?.competetions || [], // Note: API has typo "competetions"
        total: response.data.results || 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: Math.ceil((response.data.results || 0) / (params?.limit || 10))
      }
    }
    return normalizedData
  },
  
  getById: async (id: string): Promise<ApiResponse<Competition>> => {
    const response = await api.get(`/api/v1/competitions/${id}`)
    return response.data
  },
  
  create: async (data: CreateCompetitionData): Promise<ApiResponse<Competition>> => {
    // Add query param to allow completed competitions for testing
    const response = await api.post('/api/v1/competitions?allow_completed=true', data)
    return response.data
  },
  
  update: async (id: string, data: UpdateCompetitionData): Promise<ApiResponse<Competition>> => {
    const response = await api.patch(`/api/v1/competitions/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/competitions/${id}`)
    return response.data
  },
}

// Seasons API
export const seasonsAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Season>>> => {
    const response = await api.get('/api/v1/season/all', { params })
    // Normalize the response to match our expected structure
    const normalizedData = {
      ...response.data,
      data: {
        data: response.data.data?.season || [],
        total: response.data.results || 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: Math.ceil((response.data.results || 0) / (params?.limit || 10))
      }
    }
    return normalizedData
  },
  
  getById: async (id: string): Promise<ApiResponse<Season>> => {
    const response = await api.get(`/api/v1/season/${id}`)
    return response.data
  },

  create: async (data: CreateSeasonData): Promise<ApiResponse<Season>> => {
    const response = await api.post('/api/v1/season', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateSeasonData>): Promise<ApiResponse<Season>> => {
    const response = await api.patch(`/api/v1/season/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, is_active: boolean): Promise<ApiResponse<Season>> => {
    const response = await api.patch(`/api/v1/season/status/${id}`, { is_active })
    return response.data
  },

  delete: async (delete_key: string): Promise<ApiResponse> => {
    const response = await api.delete('/api/v1/season', { data: { delete_key } })
    return response.data
  },
}

// Teams API
export const teamsAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Team>>> => {
    const response = await api.get('/api/v1/team', { params })
    // API shape: { status, results, data: { teams } }
    const total = response.data?.results ?? (response.data?.data?.teams?.length ?? 0)
    const page = params?.page || 1
    const limit = params?.limit || 10
    const totalPages = Math.ceil(total / limit)
    return {
      ...response.data,
      data: {
        data: response.data?.data?.teams ?? [],
        total,
        page,
        limit,
        totalPages,
      },
    }
  },
  
  getById: async (id: string): Promise<ApiResponse<Team>> => {
    const response = await api.get(`/api/v1/team/${id}`)
    return response.data
  },
  
  update: async (id: string, data: Partial<Team>): Promise<ApiResponse<Team>> => {
    const response = await api.put(`/api/v1/team/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/team/${id}`)
    return response.data
  },
  
  getByClientId: async (clientId: string): Promise<ApiResponse<{ team: Team }>> => {
    const response = await api.get(`/api/v1/team/${clientId}/clientteam`)
    return response.data
  },
}

// Players API
export const playersAPI = {
  getAll: async (): Promise<ApiResponse<PaginatedResponse<Player>>> => {
    // Admin-friendly list of all-time player stats
    const response = await api.get('/api/v1/playerstat/all')
    // API shape: { status, data: { playerStat } }
    const arr = response.data?.data?.playerStat ?? []
    return {
      status: response.data?.status ?? 'SUCCESS',
      message: 'OK',
      data: {
        data: arr,
        total: arr.length,
        page: 1,
        limit: arr.length || 1,
        totalPages: 1,
      },
    }
  },
  
  getById: async (id: string): Promise<ApiResponse<Player>> => {
    const response = await api.get(`/api/v1/playerstat/${id}`)
    return response.data
  },
  
  update: async (id: string, data: Partial<Player>): Promise<ApiResponse<Player>> => {
    const response = await api.put(`/api/v1/playerstat/${id}`, data)
    return response.data
  },
  
  getStats: async (params?: ApiParams): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/playerstat/stats', { params })
    return response.data
  },
}

// Financial API
export const financialAPI = {
  getTransactions: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
    const response = await api.get('/api/v1/transaction', { params })
    return response.data
  },
  
  getCredits: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
    const response = await api.get('/api/v1/credit', { params })
    return response.data
  },
  
  getCommissions: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
    const response = await api.get('/api/v1/commission', { params })
    return response.data
  },
  
  getPackages: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<unknown>>> => {
    const response = await api.get('/api/v1/packages', { params })
    return response.data
  },
  
  getFinancialStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/dashboard/financial')
    return response.data
  },
}

// Content API
export const contentAPI = {
  // FAQs
  getFAQs: async (params?: ApiParams): Promise<ApiResponse<{ faqs: FAQ[] }>> => {
    const response = await api.get('/api/v1/faq', { params })
    return response.data
  },
  
  createFAQ: async (data: Omit<FAQ, '_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<FAQ>> => {
    const response = await api.post('/api/v1/faq', data)
    return response.data
  },
  
  updateFAQ: async (id: string, data: Partial<FAQ>): Promise<ApiResponse<FAQ>> => {
    const response = await api.put(`/api/v1/faq/${id}`, data)
    return response.data
  },
  
  deleteFAQ: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/faq/${id}`)
    return response.data
  },
  
  // Terms
  getTerms: async (): Promise<ApiResponse<{ termsAndConditions: Content[] }>> => {
    // Use admin endpoint to get all terms, including unpublished
    const response = await api.get('/api/v1/terms/all')
    return response.data
  },
  
  createTerms: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    const response = await api.post('/api/v1/terms', data)
    return response.data
  },
  
  updateTerms: async (id: string, data: Partial<Content>): Promise<ApiResponse<Content>> => {
    const response = await api.patch(`/api/v1/terms/${id}`, data)
    return response.data
  },
  
  deleteTerms: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/terms/${id}`)
    return response.data
  },
  
  // Privacy
  getPrivacy: async (): Promise<ApiResponse<{ privacy: Content[] }>> => {
    // Use admin endpoint to get all privacy policies, including unpublished
    const response = await api.get('/api/v1/privacy/all')
    return response.data
  },
  
  updatePrivacy: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    // First try to get existing privacy (use admin endpoint to get all, including unpublished)
    try {
      const existing = await api.get('/api/v1/privacy/all')
      if (existing.data?.data?.privacy?.length > 0) {
        // Update existing
        const id = existing.data.data.privacy[0]._id
        const response = await api.patch(`/api/v1/privacy/${id}`, data)
        return response.data
      }
    } catch (error) {
      // If no existing privacy, create new
    }
    // Create new privacy
    const response = await api.post('/api/v1/privacy', data)
    return response.data
  },
  
  // About
  getAbout: async (): Promise<ApiResponse<{ aboutUs: Content[] }>> => {
    const response = await api.get('/api/v1/aboutus')
    return response.data
  },
  
  updateAbout: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    // First try to get existing about
    try {
      const existing = await api.get('/api/v1/aboutus')
      if (existing.data?.data?.aboutUs?.length > 0) {
        // Update existing
        const id = existing.data.data.aboutUs[0]._id
        const response = await api.patch(`/api/v1/aboutus/${id}`, data)
        return response.data
      }
    } catch (error) {
      // If no existing about, create new
    }
    // Create new about
    const response = await api.post('/api/v1/aboutus', data)
    return response.data
  },
}

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/dashboard')
    return response.data
  },
  
  getUserStats: async (params?: ApiParams): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/dashboard/users', { params })
    return response.data
  },
  
  getGameWeekStats: async (params?: ApiParams): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/dashboard/gameweeks', { params })
    return response.data
  },
  
  getFinancialStats: async (params?: ApiParams): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/v1/dashboard/financial', { params })
    return response.data
  },
}

// Fantasy Roaster API
export const fantasyRoasterAPI = {
  getFantasyRoasters: async (params?: ApiParams): Promise<ApiResponse<FantasyRoaster[]>> => {
    const response = await api.get('/api/v1/fantasyroaster/all', { params })
    const raw = response.data as unknown as {
      data?: { fantasyRoasters?: FantasyRoaster[] } | FantasyRoaster[]
      fantasyRoasters?: FantasyRoaster[]
      status?: string
      results?: number
    }
    let list: FantasyRoaster[] = []
    const d = raw?.data
    if (Array.isArray(d)) {
      list = d
    } else if (d && Array.isArray((d as { fantasyRoasters?: FantasyRoaster[] }).fantasyRoasters)) {
      list = (d as { fantasyRoasters?: FantasyRoaster[] }).fantasyRoasters as FantasyRoaster[]
    } else if (Array.isArray(raw?.fantasyRoasters)) {
      list = raw.fantasyRoasters as FantasyRoaster[]
    }
    const status: 'SUCCESS' | 'ERROR' = raw?.status === 'ERROR' ? 'ERROR' : 'SUCCESS'
    return { status, message: 'OK', data: list }
  },

  getActiveFantasyRoaster: async (): Promise<ApiResponse<FantasyRoaster[]>> => {
    const response = await api.get('/api/v1/fantasyroaster')
    const raw = response.data as unknown as {
      data?: { fantasyRoaster?: FantasyRoaster[] } | FantasyRoaster[]
      fantasyRoaster?: FantasyRoaster[]
      status?: string
      results?: number
    }
    let list: FantasyRoaster[] = []
    const d = raw?.data
    if (Array.isArray(d)) {
      list = d
    } else if (d && Array.isArray((d as { fantasyRoaster?: FantasyRoaster[] }).fantasyRoaster)) {
      list = (d as { fantasyRoaster?: FantasyRoaster[] }).fantasyRoaster as FantasyRoaster[]
    } else if (Array.isArray(raw?.fantasyRoaster)) {
      list = raw.fantasyRoaster as FantasyRoaster[]
    }
    const status: 'SUCCESS' | 'ERROR' = raw?.status === 'ERROR' ? 'ERROR' : 'SUCCESS'
    return { status, message: 'OK', data: list }
  },

  getFantasyRoaster: async (id: string): Promise<ApiResponse<FantasyRoaster>> => {
    const response = await api.get(`/api/v1/fantasyroaster/${id}`)
    return response.data
  },

  createFantasyRoaster: async (data: CreateFantasyRoasterData): Promise<ApiResponse<FantasyRoaster>> => {
    const response = await api.post('/api/v1/fantasyroaster', data)
    return response.data
  },

  populatePlayersFromAPI: async (seasonId: string, competitionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.get(`/api/v1/fantasyroaster/populate-players/${seasonId}/${competitionId}`, {
      timeout: 300000 // 5 minutes timeout for player population
    })
    return response.data
  },

  updateRoasterStatus: async (id: string, data: UpdateRoasterStatusData): Promise<ApiResponse<FantasyRoaster>> => {
    const response = await api.patch(`/api/v1/fantasyroaster/${id}/status`, data)
    return response.data
  },

  updatePlayerRating: async (id: string, data: UpdatePlayerRatingData): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/api/v1/fantasyroaster/${id}/price`, data)
    return response.data
  },

  updatePlayerInfo: async (id: string, data: UpdatePlayerInfoData): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/api/v1/fantasyroaster/${id}/player`, data)
    return response.data
  },

  getTeamsFromRoaster: async (id: string): Promise<ApiResponse<{ teams: Array<{ tid: string; tname: string; logo: string; fullname: string; abbr: string }> }>> => {
    const response = await api.get(`/api/v1/fantasyroaster/${id}/teams`)
    return response.data
  },

  addPlayerToRoaster: async (id: string, data: AddPlayerData): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/api/v1/fantasyroaster/${id}/addplayer`, data)
    return response.data
  },

  removePlayerFromRoaster: async (id: string, data: RemovePlayerData): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch(`/api/v1/fantasyroaster/${id}/removeplayer`, data)
    return response.data
  },

  deleteFantasyRoaster: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/fantasyroaster/${id}`)
    return response.data
  },

  deleteAllFantasyRoasters: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/fantasyroaster', { 
      data: { delete_key: deleteKey } 
    })
    return response.data
  },
}

// System Settings API
export const systemSettingsAPI = {
  // Get system settings
  getSystemSettings: async () => {
    const response = await api.get("/api/v1/system-settings");
    return response.data;
  },

  // Update system settings
  updateSystemSettings: async (updates: Record<string, unknown>) => {
    const response = await api.patch("/api/v1/system-settings", updates);
    return response.data;
  },

  // Reset to default settings
  resetToDefaultSettings: async () => {
    const response = await api.post("/api/v1/system-settings/reset");
    return response.data;
  },

  // Get point system
  getPointSystem: async () => {
    const response = await api.get("/api/v1/system-settings/point-system");
    return response.data;
  },

  // Update point system
  updatePointSystem: async (updates: Record<string, unknown>) => {
    const response = await api.patch("/api/v1/system-settings/point-system", updates);
    return response.data;
  },
};

// Player Points API for admin
export const playerPointsAPI = {
  // Get all player stats with pagination
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<PlayerStat>>> => {
    const response = await api.get('/api/v1/playerstat/admin/all', { params })
    return response.data
  },

  // Get player stats by game week
  getByGameWeek: async (gameWeekId: string, search?: string): Promise<ApiResponse<{ playerStat: PlayerStat[] }>> => {
    const params = { 
      ...(search ? { search } : {}),
      limit: 10000 // Load all players by default
    }
    const response = await api.get(`/api/v1/playerstat/admin/gameweek/${gameWeekId}`, { params })
    return response.data
  },

  // Update individual player stats
  updatePlayer: async (gameWeekId: string, playerId: string, updateData: Partial<PlayerStat>): Promise<ApiResponse<{ recalculatedFantasyPoints: number }>> => {
    const response = await api.put(`/api/v1/playerstat/admin/gameweek/${gameWeekId}/player/${playerId}`, updateData)
    return response.data
  },

  // Bulk update player stats
  bulkUpdate: async (gameWeekId: string, updates: Array<{ pid: string } & Partial<PlayerStat>>): Promise<ApiResponse<{ updatedCount: number }>> => {
    const response = await api.put(`/api/v1/playerstat/admin/gameweek/${gameWeekId}/bulk`, { updates })
    return response.data
  },

  // Generate player stats for a game week
  generatePlayerStats: async (gameWeekId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/api/v1/playerstat/admin/gameweek/${gameWeekId}/generate`)
    return response.data
  },

  // Recalculate all points for a game week
  recalculateGameWeek: async (gameWeekId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/api/v1/playerstat/admin/gameweek/${gameWeekId}/recalculate`)
    return response.data
  },

  // Recalculate team points for a game week
  recalculateTeamPoints: async (gameWeekId: string): Promise<ApiResponse<{ updatedTeams: number, totalTeams: number, updates?: Array<{ teamId: string, oldTotal: number, newTotal: number }> }>> => {
    const response = await api.post(`/api/v1/playerstat/admin/gameweek/${gameWeekId}/recalculate-teams`, {}, {
      timeout: 120000 // 2 minutes timeout for this operation
    })
    return response.data
  },
};


// Advertisement API
export const advertisementAPI = {
  // Get all advertisements
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Advertisement>>> => {
    const response = await api.get('/api/v1/advertisement', { params })
    return response.data
  },

  // Get advertisement by ID
  getById: async (id: string): Promise<ApiResponse<Advertisement>> => {
    const response = await api.get(`/api/v1/advertisement/${id}`)
    return response.data
  },

  // Create new advertisement
  create: async (data: CreateAdvertisementData): Promise<ApiResponse<Advertisement>> => {
    const response = await api.post('/api/v1/advertisement', data)
    return response.data
  },

  // Update advertisement basic info (company, package, link)
  update: async (id: string, data: { ad_company?: string; ad_package?: string; link?: string }): Promise<ApiResponse<Advertisement>> => {
    const response = await api.patch(`/api/v1/advertisement/${id}`, data)
    return response.data
  },

  // Update advertisement status
  updateStatus: async (id: string, is_active: boolean): Promise<ApiResponse<Advertisement>> => {
    const response = await api.patch(`/api/v1/advertisement/updatestatus/${id}`, { is_active })
    return response.data
  },

  // Update advertisement calendar (start_date, end_date)
  updateCalendar: async (id: string, data: { start_date: string; end_date: string }): Promise<ApiResponse<Advertisement>> => {
    const response = await api.patch(`/api/v1/advertisement/updatecalendar/${id}`, data)
    return response.data
  },

  // Delete advertisement
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/advertisement/${id}`)
    return response.data
  },

  // Delete all advertisements
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/advertisement', { data: { delete_key: deleteKey } })
    return response.data
  },

  // Get active advertisements
  getActive: async (): Promise<ApiResponse<Advertisement[]>> => {
    const response = await api.get('/api/v1/advertisement/active')
    return response.data
  }
};


// Coach API
export const coachAPI = {
  // Get all active coaches
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Coach>>> => {
    const response = await api.get('/api/v1/coach', { params })
    return response.data
  },

  // Get all coaches (including inactive)
  getAllCoaches: async (params?: ApiParams): Promise<ApiResponse<{ coaches: Coach[] }>> => {
    const response = await api.get('/api/v1/coach/all', { params })
    return response.data
  },

  // Get coach by ID
  getById: async (id: string): Promise<ApiResponse<{ coachs: Coach[] }>> => {
    const response = await api.get(`/api/v1/coach/${id}`)
    return response.data
  },

  // Get coach by name
  getByName: async (name: string): Promise<ApiResponse<{ coach: Coach }>> => {
    const response = await api.get(`/api/v1/coach/name/${encodeURIComponent(name)}`)
    return response.data
  },

  // Create new coach
  create: async (data: CreateCoachData): Promise<ApiResponse<{ coach: Coach }>> => {
    const response = await api.post('/api/v1/coach', data)
    return response.data
  },

  // Update coach basic info (name)
  update: async (id: string, data: UpdateCoachData): Promise<ApiResponse<{ coachs: Coach }>> => {
    const response = await api.patch(`/api/v1/coach/${id}`, data)
    return response.data
  },

  // Update coach image
  updateImage: async (id: string, data: UpdateCoachImageData): Promise<ApiResponse<{ coach: Coach }>> => {
    const response = await api.patch(`/api/v1/coach/image/${id}`, data)
    return response.data
  },

  // Update coach status (active/inactive)
  updateStatus: async (id: string, data: UpdateCoachStatusData): Promise<ApiResponse<{ coachs: Coach }>> => {
    const response = await api.patch(`/api/v1/coach/status/${id}`, data)
    return response.data
  },

  // Swap major coach
  swapMajor: async (data: SwapMajorCoachData): Promise<ApiResponse<{ coaches: Coach[], message: string }>> => {
    const response = await api.patch('/api/v1/coach/swap', data)
    return response.data
  },

  // Delete coach
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/coach/${id}`)
    return response.data
  },

  // Delete all coaches (non-major only)
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/coach', { data: { deleteKey } })
    return response.data
  }
};


// Awards API (Winners)
export const awardsAPI = {
  // Get client awards
  getClientAwards: async (clientId: string): Promise<ApiResponse<{ clientAwards: Award[] }>> => {
    const response = await api.get(`/api/v1/winners/clientawards/${clientId}`)
    return response.data
  },

  // Get all winners/awards
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Award>>> => {
    const response = await api.get('/api/v1/winners', { params })
    return response.data
  },

  // Create new award/winner
  create: async (data: CreateAwardData): Promise<ApiResponse<Award>> => {
    const response = await api.post('/api/v1/winners', data)
    return response.data
  },

  // Update award/winner
  update: async (id: string, data: Partial<CreateAwardData>): Promise<ApiResponse<Award>> => {
    const response = await api.put(`/api/v1/winners/${id}`, data)
    return response.data
  },

  // Delete award/winner
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/winners/${id}`)
    return response.data
  }
};

// AD Company API
export const adCompanyAPI = {
  // Get all ad companies
  getAll: async (params?: ApiParams): Promise<ApiResponse<{ adCompanies: AdCompany[] }>> => {
    const response = await api.get('/api/v1/adcompany', { params })
    return response.data
  },

  // Get company by ID
  getById: async (id: string): Promise<ApiResponse<AdCompany>> => {
    const response = await api.get(`/api/v1/adcompany/${id}`)
    return response.data
  },

  // Create new company
  create: async (data: CreateAdCompanyData): Promise<ApiResponse<AdCompany>> => {
    const response = await api.post('/api/v1/adcompany', data)
    return response.data
  },

  // Update company
  update: async (id: string, data: Partial<CreateAdCompanyData>): Promise<ApiResponse<AdCompany>> => {
    const response = await api.patch(`/api/v1/adcompany/${id}`, data)
    return response.data
  },

  // Delete company
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/adcompany/${id}`)
    return response.data
  },

  // Delete all companies
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/adcompany', { data: { delete_key: deleteKey } })
    return response.data
  }
};

// AD Package API
export const adPackageAPI = {
  // Get all ad packages
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<AdPackage>>> => {
    const response = await api.get('/api/v1/adpackages', { params })
    return response.data
  },

  // Get active packages only
  getActive: async (): Promise<ApiResponse<AdPackage[]>> => {
    const response = await api.get('/api/v1/adpackages/active')
    return response.data
  },

  // Get package by ID
  getById: async (id: string): Promise<ApiResponse<AdPackage>> => {
    const response = await api.get(`/api/v1/adpackages/${id}`)
    return response.data
  },

  // Create new package
  create: async (data: CreateAdPackageData): Promise<ApiResponse<AdPackage>> => {
    const response = await api.post('/api/v1/adpackages', data)
    return response.data
  },

  // Update package
  update: async (id: string, data: Partial<CreateAdPackageData>): Promise<ApiResponse<AdPackage>> => {
    const response = await api.patch(`/api/v1/adpackages/${id}`, data)
    return response.data
  },

  // Update package status
  updateStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<ApiResponse<AdPackage>> => {
    const response = await api.patch(`/api/v1/adpackages/status/${id}`, { status })
    return response.data
  },

  // Delete package
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/adpackages/${id}`)
    return response.data
  },

  // Delete all packages
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/adpackages', { data: { delete_key: deleteKey } })
    return response.data
  }
};

// App Version API
export const appVersionAPI = {
  // Get all app versions
  getAll: async (params?: ApiParams): Promise<ApiResponse<{ appVersions: AppVersion[] }>> => {
    console.log('🔍 [API] Calling getAll without query params')
    const response = await api.get('/api/v1/appversion')
    console.log('🔍 [API] Raw response:', response.data)
    
    // Handle the actual API response structure
    const rawData = response.data
    let appVersions: AppVersion[] = []
    
    if (rawData?.data?.appVersions) {
      appVersions = rawData.data.appVersions
    } else if (Array.isArray(rawData?.data)) {
      appVersions = rawData.data
    } else if (Array.isArray(rawData)) {
      appVersions = rawData
    }
    
    console.log('🔍 [API] Extracted appVersions:', appVersions)
    
    const normalizedData = {
      ...rawData,
      data: {
        appVersions
      }
    }
    console.log('🔍 [API] Normalized data:', normalizedData)
    return normalizedData
  },

  // Get latest version by OS
  getLatest: async (os: 'Android' | 'iOS'): Promise<ApiResponse<{ latestVersion: AppVersion }>> => {
    const response = await api.get(`/api/v1/appversion/latest?os=${os}`)
    return response.data
  },

  // Get version by ID
  getById: async (id: string): Promise<ApiResponse<{ appVersion: AppVersion }>> => {
    const response = await api.get(`/api/v1/appversion/${id}`)
    return response.data
  },

  // Create new app version
  create: async (data: CreateAppVersionData): Promise<ApiResponse<{ appVersion: AppVersion }>> => {
    const response = await api.post('/api/v1/appversion', data)
    return response.data
  },

  // Update app version
  update: async (id: string, data: UpdateAppVersionData): Promise<ApiResponse<{ appVersion: AppVersion }>> => {
    const response = await api.patch(`/api/v1/appversion/${id}`, data)
    return response.data
  },

  // Update app version severity
  updateSeverity: async (id: string, data: UpdateAppVersionSeverityData): Promise<ApiResponse<{ appVersion: AppVersion }>> => {
    const response = await api.patch(`/api/v1/appversion/severity/${id}`, data)
    return response.data
  },

  // Delete app version
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/appversion/${id}`)
    return response.data
  },

  // Delete all app versions
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/appversion', { data: { delete_key: deleteKey } })
    return response.data
  }
};

// Poll API
export const pollAPI = {
  // Get all polls
  getAll: async (params?: ApiParams): Promise<ApiResponse<{ polls: Poll[] }>> => {
    const response = await api.get('/api/v1/poll', { params })
    return response.data
  },

  // Get poll by ID
  getById: async (id: string): Promise<ApiResponse<{ pol: Poll }>> => {
    const response = await api.get(`/api/v1/poll/${id}`)
    return response.data
  },

  // Create new poll
  create: async (data: CreatePollData): Promise<ApiResponse<{ pol: Poll }>> => {
    const response = await api.post('/api/v1/poll', data)
    return response.data
  },

  // Update poll info (question, close_date)
  update: async (id: string, data: UpdatePollData): Promise<ApiResponse<{ poll: Poll }>> => {
    const response = await api.patch(`/api/v1/poll/${id}`, data)
    return response.data
  },

  // Update poll status (Open/Closed)
  updateStatus: async (id: string, data: UpdatePollStatusData): Promise<ApiResponse<{ poll: Poll }>> => {
    const response = await api.patch(`/api/v1/poll/status/${id}`, data)
    return response.data
  },

  // Delete poll by ID
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/v1/poll/${id}`)
    return response.data
  },

  // Delete all polls
  deleteAll: async (deleteKey: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/v1/poll', { data: { delete_key: deleteKey } })
    return response.data
  },

  // Get all poll responses
  getAllResponses: async (): Promise<ApiResponse<{ pollResponses: PollResponse[] }>> => {
    const response = await api.get('/api/v1/poll/pollresponse')
    return response.data
  },

  // Get client's poll responses
  getClientResponses: async (clientId: string, pollId: string): Promise<ApiResponse<{ polResponse: PollResponse[] }>> => {
    const response = await api.get(`/api/v1/poll/pollresponse/${clientId}/${pollId}`)
    return response.data
  },

  // Get user polls (polls a user has responded to)
  getUserPolls: async (userId: string): Promise<ApiResponse<{ polls: PollResponse[] }>> => {
    const response = await api.get(`/api/v1/poll/userpolls/${userId}`)
    return response.data
  }
};

// Notification API
export const notificationAPI = {
  // Send test notification
  sendTestNotification: async (): Promise<ApiResponse<{ successCount: number; failureCount: number; totalUsers: number }>> => {
    const response = await api.get('/api/v1/notification/test')
    return response.data
  },

  // Send custom notification to all users
  sendCustomNotification: async (data: { title: string; body: string; data?: Record<string, string> }): Promise<ApiResponse<{ successCount: number; failureCount: number; totalUsers: number }>> => {
    const response = await api.post('/api/v1/notification/send/custom', data)
    return response.data
  },

  // Send notification to specific users
  sendNotificationToUsers: async (data: { title: string; body: string; user_ids: string[]; data?: Record<string, string> }): Promise<ApiResponse<{ successCount: number; failureCount: number; totalUsers: number }>> => {
    const response = await api.post('/api/v1/notification/send/users', data)
    return response.data
  },

  // Send notification to topic
  sendNotificationToTopic: async (data: { title: string; body: string; topic: string; data?: Record<string, string> }): Promise<ApiResponse<{ success: boolean; topic: string }>> => {
    const response = await api.post('/api/v1/notification/send/topic', data)
    return response.data
  },

  // Get notification templates
  getNotificationTemplates: async (): Promise<ApiResponse<{ templates: Array<{ id: string; name: string; title: string; body: string; category: string }> }>> => {
    const response = await api.get('/api/v1/notification/templates')
    return response.data
  },

  // Get notification statistics
  getNotificationStats: async (): Promise<ApiResponse<{ totalClients: number; clientsWithTokens: number; clientsWithoutTokens: number; scheduledJobs: number; completedJobs: number; lastCompletedJob: unknown }>> => {
    const response = await api.get('/api/v1/notification/stats')
    return response.data
  },

  // Get scheduled notifications
  getScheduledNotifications: async (): Promise<ApiResponse<{ scheduledJobs: Array<{ gameWeekId: string; nextInvocation: string | null }> }>> => {
    const response = await api.get('/api/v1/notification/scheduled')
    return response.data
  },

  // Get completed notifications
  getCompletedNotifications: async (): Promise<ApiResponse<{ completedJobs: Array<{ gameWeekId: string; scheduledTime: string; actualExecutionTime: string; status: string; message?: string }> }>> => {
    const response = await api.get('/api/v1/notification/completed')
    return response.data
  },

  // Get all notifications (scheduled + completed) with unified format
  getAllNotifications: async (): Promise<ApiResponse<{ 
    notifications: Array<{
      gameWeekId: string;
      gameWeek: string;
      status: 'scheduled' | 'pending' | 'completed';
      nextInvocation: string | null;
      executedAt: Date | null;
      timeUntilNotification: number | null;
      transferDeadline: string | null;
      successCount: number | null;
      failureCount: number | null;
      totalUsers: number | null;
    }>;
    count: number;
    scheduled: number;
    pending: number;
    completed: number;
  }>> => {
    const response = await api.get('/api/v1/notification/all')
    return response.data
  },

  // Reschedule all notifications
  rescheduleAllNotifications: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/api/v1/notification/reschedule')
    return response.data
  },

  // Update FCM token (for client use)
  updateFCMToken: async (fcm_token: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/api/v1/notification/fcm-token', { fcm_token })
    return response.data
  },
};

// Injuries and Bans API
export const injuriesBansAPI = {
  getAll: async (): Promise<AxiosResponse> => {
    return api.get('/api/v1/injuriesban/all')
  },
  getLatest: async (): Promise<AxiosResponse> => {
    return api.get('/api/v1/injuriesban')
  },
  getById: async (id: string): Promise<AxiosResponse> => {
    return api.get(`/api/v1/injuriesban/${id}`)
  },
  create: async (data: {
    player: {
      pid: string
      pname: string
      role: string
      rating: string
      team: {
        tid: string
        tname: string
        logo: string
        fullname: string
        abbr: string
      }
    }
    state: "Injury" | "Ban" | "U/A"
    injury_title?: string
    chance: number
  }): Promise<AxiosResponse> => {
    return api.post('/api/v1/injuriesban', data)
  },
  update: async (
    id: string,
    data: Partial<{
      state: "Injury" | "Ban" | "U/A"
      injury_title?: string
      chance: number
    }>
  ): Promise<AxiosResponse> => {
    return api.patch(`/api/v1/injuriesban/${id}`, data)
  },
  delete: async (id: string): Promise<AxiosResponse> => {
    return api.delete(`/api/v1/injuriesban/${id}`)
  },
  deleteAll: async (delete_key: string): Promise<AxiosResponse> => {
    return api.delete('/api/v1/injuriesban', { data: { delete_key } })
  },
};

// Subscriptions API
export const subscriptionsAPI = {
  // Get all subscriptions with statistics
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<ApiResponse<{
    subscriptions: Array<{
      _id: string;
      full_name: string;
      email: string;
      phone_number?: string;
      subscription_status: 'active' | 'inactive';
      subscription_plan?: 'monthly' | 'yearly';
      subscription_expires_at?: string;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    statistics: {
      totalUsers: number;
      activeSubscriptions: number;
      monthlySubscriptions: number;
      yearlySubscriptions: number;
      expiredSubscriptions: number;
      revenue: {
        monthly: string;
        yearly: string;
        mrr: string;
      };
    };
  }>> => {
    const response = await api.get('/api/v1/admins/subscriptions', { params });
    return response.data;
  },

  // Get subscription analytics
  getAnalytics: async (): Promise<ApiResponse<{
    trends: Array<{
      _id: { year: number; month: number };
      count: number;
      monthly: number;
      yearly: number;
    }>;
    expiringSubscriptions: {
      count: number;
      users: Array<{
        full_name: string;
        email: string;
        subscription_plan: string;
        subscription_expires_at: string;
      }>;
    };
  }>> => {
    const response = await api.get('/api/v1/admins/subscriptions/analytics');
    return response.data;
  },

  // Get user subscription details
  getUserSubscription: async (userId: string): Promise<ApiResponse<{
    user: {
      _id: string;
      full_name: string;
      email: string;
      phone_number?: string;
      subscription_status: 'active' | 'inactive';
      subscription_plan?: 'monthly' | 'yearly';
      subscription_expires_at?: string;
      createdAt: string;
    };
  }>> => {
    const response = await api.get(`/api/v1/admins/subscriptions/${userId}`);
    return response.data;
  },

  // Expire/Cancel subscription
  expireSubscription: async (userId: string): Promise<ApiResponse<{
    userId: string;
    subscription_status: 'inactive';
  }>> => {
    const response = await api.patch(`/api/v1/admins/subscriptions/${userId}/expire`);
    return response.data;
  },

  // Sync subscription from RevenueCat
  syncSubscription: async (userId: string): Promise<ApiResponse<{
    userId: string;
    subscription_status: 'active' | 'inactive';
    subscription_plan?: 'monthly' | 'yearly';
    subscription_expires_at?: string;
    synced: boolean;
  }>> => {
    const response = await api.post(`/api/v1/admins/subscriptions/${userId}/sync`);
    return response.data;
  },
};

export default api 