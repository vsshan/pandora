/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0A2342',
        secondary: '#5A6D7C',
        accent: '#A98F5B',
        'background-light': '#F5F7FA',
        'background-dark': '#101922',
        'card-light': '#FFFFFF',
        'card-dark': '#1D2939',
        'text-light-primary': '#1D2939',
        'text-dark-primary': '#F5F7FA',
        'text-light-secondary': '#5A6D7C',
        'text-dark-secondary': '#A9BFD4',
        'border-light': '#E2E8F0',
        'border-dark': '#334155',
        positive: '#16A34A',
        'positive-bg': '#F0FDF4',
        'dark-positive': '#4ADE80',
        'dark-positive-bg': '#152E22',
        'accent-positive': '#008080',
        'accent-negative': '#D9534F',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
