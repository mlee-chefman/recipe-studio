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
        // RecipeiQ brand colors from icon
        cream: {
          DEFAULT: '#ebe8d4',
          light: '#f5f3e4',
          dark: '#e0dcc8',
        },
        brand: {
          50: '#e6f2ee',
          100: '#cce5dd',
          200: '#99cbbb',
          300: '#66b199',
          400: '#349777',
          500: '#02533a',  // Main green from icon
          600: '#024332',
          700: '#013229',
          800: '#012221',
          900: '#011118',
        },
        // Override default green with brand green
        green: {
          50: '#e6f2ee',
          100: '#cce5dd',
          200: '#99cbbb',
          300: '#66b199',
          400: '#349777',
          500: '#02533a',  // Main green from icon
          600: '#024332',
          700: '#013229',
          800: '#012221',
          900: '#011118',
        },
      },
      backgroundColor: {
        DEFAULT: '#ebe8d4',  // Cream as default background
      },
    },
  },
  plugins: [],
};
