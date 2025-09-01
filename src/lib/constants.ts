// Theme colors - easily changeable
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#1E727E', // Main primary color
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
}

// Navigation items
export const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Users',
    href: '/users',
    icon: 'Users',
  },
  {
    title: 'Game Weeks',
    href: '/game-weeks',
    icon: 'Calendar',
  },
  {
    title: 'Competitions',
    href: '/competitions',
    icon: 'Trophy',
  },
  {
    title: 'Seasons',
    href: '/seasons',
    icon: 'Calendar',
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: 'Shield',
  },
  {
    title: 'Players',
    href: '/players',
    icon: 'UserCheck',
  },
  {
    title: 'Fantasy Roasters',
    href: '/fantasy-roasters',
    icon: 'Users',
  },
  {
    title: 'Financial',
    href: '/financial',
    icon: 'DollarSign',
  },
  {
    title: 'Content',
    href: '/content',
    icon: 'FileText',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
]

// User status options
export const userStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'banned', label: 'Banned' },
  { value: 'pending', label: 'Pending' },
]

// Game week status options
export const gameWeekStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Competition status options
export const competitionStatusOptions = [
  { value: '1', label: 'Active' },
  { value: '2', label: 'Completed' },
  { value: '3', label: 'Cancelled' },
]

// Pagination options
export const paginationOptions = [
  { value: 10, label: '10 per page' },
  { value: 25, label: '25 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' },
] 