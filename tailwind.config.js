/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f8f5',
          100: '#e2ede7',
          200: '#c5dbd0',
          300: '#9ebfb0',
          400: '#739c8a',
          500: '#4f7a69',
          600: '#3d5f51',
          700: '#324e43',
          800: '#1e352c',
          900: '#12211b',
          950: '#070e0b',
        },
        gold: {
          50: '#fcfbf7',
          100: '#f6f3e8',
          200: '#ece7d1',
          300: '#dbd2ad',
          400: '#c5b882',
          500: '#b0a05e',
          600: '#978749',
          700: '#7c6f3c',
          800: '#645a33',
          900: '#534a2c',
          950: '#2f2a17',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
