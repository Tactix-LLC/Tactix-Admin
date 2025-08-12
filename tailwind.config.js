/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tactix Brand Colors
        primary: {
          50: '#f0f9fa',
          100: '#daf2f4',
          200: '#bae8ec',
          300: '#89d7de',
          400: '#51bcc7',
          500: '#1E727E', // Main brand color
          600: '#1a6570',
          700: '#1a555e',
          800: '#1c484f',
          900: '#1b3e44',
          950: '#0d2629',
        },
        // Modern Gray Scale
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Semantic Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
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
        // Football-themed colors
        field: {
          50: '#f7fef7',
          100: '#ecfcec',
          200: '#d1f7d1',
          300: '#a6eda6',
          400: '#72db72',
          500: '#4ade80',
          600: '#22c55e',
          700: '#16a34a',
          800: '#15803d',
          900: '#14532d',
        },
      },
      borderRadius: {
        'tactix': '10px',
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        'tactix': '0 4px 6px -1px rgba(30, 114, 126, 0.1), 0 2px 4px -1px rgba(30, 114, 126, 0.06)',
        'tactix-lg': '0 10px 15px -3px rgba(30, 114, 126, 0.1), 0 4px 6px -2px rgba(30, 114, 126, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}