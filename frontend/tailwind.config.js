/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mentor: {
          green: '#58cc02',
          'green-dark': '#46a302',
          blue: '#1cb0f6',
          'blue-dark': '#1899d6',
          orange: '#ff9600',
          'orange-dark': '#e08300',
          red: '#ff4b4b',
          'red-dark': '#ea2b2b',
          yellow: '#ffc800',
          'yellow-dark': '#e5b200',
          purple: '#ce82ff',
          'purple-dark': '#a559d9',
          dark: '#131f24',
          card: '#ffffff',
          bg: '#f7f9fa',
          border: '#e5e5e5'
        }
      },
      boxShadow: {
        'duo': '0 4px 0 0 rgba(0, 0, 0, 0.15)',
        'duo-sm': '0 2px 0 0 rgba(0, 0, 0, 0.12)',
        'duo-lg': '0 6px 0 0 rgba(0, 0, 0, 0.18)',
        'duo-green': '0 4px 0 0 #46a302',
        'duo-blue': '0 4px 0 0 #1899d6',
        'duo-orange': '0 4px 0 0 #e08300',
        'duo-red': '0 4px 0 0 #ea2b2b',
        'duo-purple': '0 4px 0 0 #a559d9',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        flame: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
        }
      },
      animation: {
        wiggle: 'wiggle 0.4s ease-in-out',
        bounceShort: 'bounceShort 1s infinite ease-in-out',
        flame: 'flame 1.5s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
