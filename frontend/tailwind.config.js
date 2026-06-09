export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#fdf4ff',
          100: '#fae6ff',
          200: '#f3ccff',
          300: '#e7a3fe',
          400: '#d36af8',
          500: '#be3eec',
          600: '#912EC7', // Nuevo color base solicitado
          700: '#8121af',
          800: '#6b1d91',
          900: '#571b74',
        }
      }
    },
  },
  plugins: [],
}
