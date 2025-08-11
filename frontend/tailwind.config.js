/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GOOD Talent Official Color Palette
        'good-dark-teal': '#004C4C',
        'good-medium-teal': '#065C5C', 
        'good-light-teal': '#0A6A6A',
        'good-soft-white': '#E6F5F7',
        'good-light-cyan': '#87E0E0',
        'good-turquoise': '#5FD3D2',
        'good-cyan': '#58BFC2',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out infinite 1.5s',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}