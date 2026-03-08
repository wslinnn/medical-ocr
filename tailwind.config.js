/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./medical-ocr-pro.html",
    "./js/**/*.js",
    "./css/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0891B2',
        primaryLight: '#22D3EE',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}
