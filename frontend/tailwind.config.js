/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070F1E',
          900: '#0B192C',
          800: '#142740',
          700: '#1E3E62',
          600: '#2A5584',
        },
        audit: {
          dark: '#0F172A',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
          bg: '#F8FAFC',
        },
        risk: {
          critical: '#DC2626',
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
          high: '#EA580C',
          'high-bg': '#FFF7ED',
          'high-border': '#FFEDD5',
          medium: '#D97706',
          'medium-bg': '#FFFBEB',
          'medium-border': '#FEF3C7',
          low: '#16A34A',
          'low-bg': '#F0FDF4',
          'low-border': '#DCFCE7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

