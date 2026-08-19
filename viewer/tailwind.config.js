/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#e50914',
          600: '#b81d24',
        }
      }
    },
  },
  plugins: [],
}
