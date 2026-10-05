/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iujo: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc3fd',
          400: '#36a3fa',
          500: '#0c87eb',
          600: '#006ac8',
          700: '#0154a2',
          800: '#064785',
          900: '#0a3d6f',
          950: '#062648',
          navy: '#0A2540',
          dark: '#081726'
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(10, 37, 64, 0.08)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'premium': '0 20px 40px -15px rgba(0, 84, 162, 0.15)',
      }
    },
  },
  plugins: [],
}
