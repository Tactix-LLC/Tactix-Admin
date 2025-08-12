import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AdminUser } from '@/types'

// Types
export interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthActions {
  login: (user: AdminUser, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: AdminUser) => void
}

export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
}

export interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

// Auth Store
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),
      
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      
      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),
      
      updateUser: (user) =>
        set({
          user,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// UI Store
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
      
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
      
      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),
      
      setTheme: (theme) =>
        set({
          theme,
        }),
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      clearNotifications: () =>
        set({
          notifications: [],
        }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
)

// Data Store for caching API responses
export interface DataState {
  users: User[]
  gameWeeks: unknown[]
  competitions: unknown[]
  teams: unknown[]
  players: unknown[]
  transactions: unknown[]
  stats: unknown
  lastUpdated: Record<string, number>
}

export interface DataActions {
  setUsers: (users: User[]) => void
  setGameWeeks: (gameWeeks: unknown[]) => void
  setCompetitions: (competitions: unknown[]) => void
  setTeams: (teams: unknown[]) => void
  setPlayers: (players: unknown[]) => void
  setTransactions: (transactions: unknown[]) => void
  setStats: (stats: unknown) => void
  updateLastUpdated: (key: string) => void
  clearData: () => void
}

export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set, get) => ({
      users: [],
      gameWeeks: [],
      competitions: [],
      teams: [],
      players: [],
      transactions: [],
      stats: {},
      lastUpdated: {},
      
      setUsers: (users) =>
        set({
          users,
          lastUpdated: { ...get().lastUpdated, users: Date.now() },
        }),
      
      setGameWeeks: (gameWeeks) =>
        set({
          gameWeeks,
          lastUpdated: { ...get().lastUpdated, gameWeeks: Date.now() },
        }),
      
      setCompetitions: (competitions) =>
        set({
          competitions,
          lastUpdated: { ...get().lastUpdated, competitions: Date.now() },
        }),
      
      setTeams: (teams) =>
        set({
          teams,
          lastUpdated: { ...get().lastUpdated, teams: Date.now() },
        }),
      
      setPlayers: (players) =>
        set({
          players,
          lastUpdated: { ...get().lastUpdated, players: Date.now() },
        }),
      
      setTransactions: (transactions) =>
        set({
          transactions,
          lastUpdated: { ...get().lastUpdated, transactions: Date.now() },
        }),
      
      setStats: (stats) =>
        set({
          stats,
          lastUpdated: { ...get().lastUpdated, stats: Date.now() },
        }),
      
      updateLastUpdated: (key) =>
        set((state) => ({
          lastUpdated: { ...state.lastUpdated, [key]: Date.now() },
        })),
      
      clearData: () =>
        set({
          users: [],
          gameWeeks: [],
          competitions: [],
          teams: [],
          players: [],
          transactions: [],
          stats: {},
          lastUpdated: {},
        }),
    }),
    {
      name: 'data-storage',
      partialize: (state) => ({
        stats: state.stats,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
) 