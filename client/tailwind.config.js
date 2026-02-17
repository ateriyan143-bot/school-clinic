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
          50: '#ecfdf3',
          100: '#d1fae3',
          200: '#a7f3c7',
          300: '#6ee7a5',
          400: '#34d27f',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0f3f22'
        },
        accent: {
          50: '#fffceb',
          100: '#fff7c2',
          200: '#ffeb86',
          300: '#fddc4b',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12'
        },
        medical: {
          blue: '#87CEEB',
          green: '#5cb85c',
          red: '#d9534f'
        }
      }
    },
  },
  plugins: [],
}
