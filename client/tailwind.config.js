/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0B12',
          800: '#14141F',
          700: '#1F1F2E',
        },
        primary: {
          400: '#8A2BE2', // BlueViolet
          500: '#6A0DAD', // Purple
          600: '#4B0082', // Indigo
        },
        accent: {
          400: '#00F0FF', // Cyan
          500: '#00B8D4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #6A0DAD 0%, #00F0FF 100%)',
      },
      backdropBlur: {
        'md': '10px',
      }
    },
  },
  plugins: [],
}
