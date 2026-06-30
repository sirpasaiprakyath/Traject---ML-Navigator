/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0F0F0F',
        darkCard: '#161618',
        electricBlue: '#3B82F6',
        borderGray: '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}
