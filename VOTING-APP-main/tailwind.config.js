/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // use class strategy so we can toggle theme manually
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 40s linear infinite",
      },
    },
  },
  plugins: [],
};