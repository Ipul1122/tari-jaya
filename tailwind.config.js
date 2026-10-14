/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          border: '#EAE5DC',
          hover: '#F4EFE6',
          muted: '#78716C',
        },
        primary: {
          DEFAULT: '#EA580C', // Orange
          hover: '#C2410C',
          light: '#FFF7ED',
          border: '#FDBA74',
        },
        sub: {
          DEFAULT: '#DC2626', // Red
          hover: '#B91C1C',
          light: '#FEF2F2',
          border: '#FCA5A5',
        },
        btn: {
          add: '#16A34A',    // Green
          save: '#2563EB',   // Blue
          delete: '#DC2626', // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
