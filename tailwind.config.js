/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#720e1e', // Premium Maroon
          50: '#fdf2f3',
          100: '#fce7e9',
          200: '#f8d2d7',
          300: '#f2aeb7',
          400: '#e87d8d',
          500: '#d64c62',
          600: '#b82b43',
          700: '#720e1e', // Main Brand
          800: '#801325',
          900: '#6b1423',
        },
        dark: {
          background: '#0f0f0f', // Richer Dark
          card: '#161616',
          border: '#333333',
        },
        accent: {
          DEFAULT: '#a31526',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

