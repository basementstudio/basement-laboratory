/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{jsx,tsx,js}'],
  theme: {
    extend: {
      backdropBlur: {
        DEFAULT: '10px'
      },
      colors: {
        brand: {
          500: '#262626',
          DEFAULT: '#262626',
          200: '#0f0f0f50'
        }
      },
      borderRadius: {
        DEFAULT: '10px'
      }
    }
  },
  plugins: [require('./src/lib/plugins/toemTailwindPlugin')]
}
