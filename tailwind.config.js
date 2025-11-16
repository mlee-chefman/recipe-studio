/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './src/**/*.{js,ts,tsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // RecipeiQ brand colors - matching Fresh & Modern theme (Option 1)
        cream: {
          DEFAULT: '#faf8f3',  // Light subtle cream
          light: '#faf8f3',
          dark: '#f5f3e4',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // Main bright emerald from Option 1
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Override default green with Fresh & Modern green
        green: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // Main bright emerald from Option 1
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      backgroundColor: {
        DEFAULT: '#faf8f3',  // Light subtle cream as default background
      },
    },
  },
  plugins: [],
};
