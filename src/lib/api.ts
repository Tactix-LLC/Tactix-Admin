import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { API_CONFIG } from './constants'
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  AdminUser,
  GameWeek, 
  Competition, 
  Team, 
  Player, 
  Transaction, 
  FAQ, 
  Content, 
  DashboardStats,
  ApiParams,
  LoginFormData,
  CreateGameWeekData,
  CreateCompetitionData,
  UpdateUserData
} from '@/types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
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
    const response = await api.post('/api/v1/gameweek', data)
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
}

// Competitions API
export const competitionsAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Competition>>> => {
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
    const response = await api.post('/api/v1/competitions', data)
    return response.data
  },
  
  update: async (id: string, data: Partial<CreateCompetitionData>): Promise<ApiResponse<Competition>> => {
    const response = await api.put(`/api/v1/competitions/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/v1/competitions/${id}`)
    return response.data
  },
}

// Teams API
export const teamsAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Team>>> => {
    const response = await api.get('/api/v1/team', { params })
    return response.data
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
}

// Players API
export const playersAPI = {
  getAll: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<Player>>> => {
    const response = await api.get('/api/v1/playerstat', { params })
    return response.data
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
  getFAQs: async (params?: ApiParams): Promise<ApiResponse<PaginatedResponse<FAQ>>> => {
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
  getTerms: async (): Promise<ApiResponse<Content>> => {
    const response = await api.get('/api/v1/terms')
    return response.data
  },
  
  updateTerms: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    const response = await api.put('/api/v1/terms', data)
    return response.data
  },
  
  // Privacy
  getPrivacy: async (): Promise<ApiResponse<Content>> => {
    const response = await api.get('/api/v1/privacy')
    return response.data
  },
  
  updatePrivacy: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    const response = await api.put('/api/v1/privacy', data)
    return response.data
  },
  
  // About
  getAbout: async (): Promise<ApiResponse<Content>> => {
    const response = await api.get('/api/v1/aboutus')
    return response.data
  },
  
  updateAbout: async (data: Partial<Content>): Promise<ApiResponse<Content>> => {
    const response = await api.put('/api/v1/aboutus', data)
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

export default api 