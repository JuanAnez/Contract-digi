/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'claro-red': {
          DEFAULT: '#E60000',
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF3333',
          500: '#E60000',
          600: '#CC0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
      },
    },
  },
  plugins: [],
}

