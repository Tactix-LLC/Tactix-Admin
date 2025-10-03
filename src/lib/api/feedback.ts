import { API_CONFIG } from '@/lib/constants'
import { useAuthStore } from '@/lib/store'

// Helper function to get auth token
const getAuthToken = () => {
  const token = useAuthStore.getState().token
  if (!token) {
    // Clear auth state and redirect to login
    useAuthStore.getState().logout()
    window.location.href = '/login'
    throw new Error('No authentication token found. Please log in again.')
  }
  return token
}

// Types
export interface FeedbackTitle {
  _id: string
  title: string
  status: 'Active' | 'Inactive'
  major: boolean
  createdAt: string
  updatedAt: string
}

export interface Feedback {
  _id: string
  title: string
  content: string
  read_status: boolean
  first_read_by: string
  createdAt: string
  updatedAt: string
}

export interface CreateFeedbackTitleRequest {
  title: string
  major?: boolean
}

export interface UpdateFeedbackTitleRequest {
  title: string
}

export interface UpdateFeedbackTitleStatusRequest {
  status: 'Active' | 'Inactive'
}

export interface DeleteAllRequest {
  delete_key: string
}

// Feedback Titles API
export const feedbackTitlesApi = {
  // Get all feedback titles
  getAll: async (): Promise<{ status: string; results: number; data: { feedbackTitles: FeedbackTitle[] } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch feedback titles')
    }

    return response.json()
  },

  // Get all active feedback titles (for client use)
  getActive: async (): Promise<{ status: string; results: number; data: { feedbackTitles: FeedbackTitle[] } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch active feedback titles')
    }

    return response.json()
  },

  // Create feedback title
  create: async (data: CreateFeedbackTitleRequest): Promise<{ status: string; message: string; data: { feedbackTitle: FeedbackTitle } }> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.message?.includes('jwt') || response.status === 401) {
          // Token is invalid, logout and redirect
          useAuthStore.getState().logout()
          window.location.href = '/login'
          throw new Error('Session expired. Please log in again.')
        }
        throw new Error(error.message || 'Failed to create feedback title')
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.message.includes('No authentication token')) {
        throw error
      }
      throw new Error('Failed to create feedback title')
    }
  },

  // Get feedback title by ID
  getById: async (id: string): Promise<{ status: string; data: { feedbackTitle: FeedbackTitle } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch feedback title')
    }

    return response.json()
  },

  // Update feedback title
  update: async (id: string, data: UpdateFeedbackTitleRequest): Promise<{ status: string; message: string; data: { feedbackTitle: FeedbackTitle } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update feedback title')
    }

    return response.json()
  },

  // Update feedback title status
  updateStatus: async (id: string, data: UpdateFeedbackTitleStatusRequest): Promise<{ status: string; message: string; data: { feedbackTitle: FeedbackTitle } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update feedback title status')
    }

    return response.json()
  },

  // Delete feedback title
  delete: async (id: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete feedback title')
    }

    return response.json()
  },

  // Delete all feedback titles
  deleteAll: async (data: DeleteAllRequest): Promise<{ status: string; messages: string }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedbacktitle`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete all feedback titles')
    }

    return response.json()
  },
}

// Feedback API
export const feedbackApi = {
  // Get all feedback
  getAll: async (): Promise<{ status: string; results: number; data: { feedbacks: Feedback[] } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch feedback')
    }

    return response.json()
  },

  // Get feedback by ID
  getById: async (id: string): Promise<{ status: string; data: { feedback: Feedback } }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedback/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch feedback')
    }

    return response.json()
  },

  // Delete feedback
  delete: async (id: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete feedback')
    }

    return response.json()
  },

  // Delete all feedback
  deleteAll: async (data: DeleteAllRequest): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/feedback`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete all feedback')
    }

    return response.json()
  },
}
