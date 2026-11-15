/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design System Tokens
        primary: '#0037b0',
        'primary-container': '#1d4ed8',
        'primary-fixed': '#dce1ff',
        'primary-fixed-dim': '#b7c4ff',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#001551',
        'on-primary-container': '#cad3ff',
        secondary: '#006c4a',
        'secondary-container': '#82f5c1',
        'secondary-fixed': '#85f8c4',
        'on-secondary': '#ffffff',
        'on-secondary-fixed': '#002114',
        'on-secondary-container': '#00714e',
        tertiary: '#8e0026',
        'tertiary-container': '#ba0035',
        'on-tertiary': '#ffffff',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        surface: '#f8f9ff',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'surface-dim': '#cbdbf5',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#434655',
        outline: '#747686',
        'outline-variant': '#c4c5d7',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        // Existing brand & MeLi tokens preserved for modals/legacy utilities
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#025aa1',
          800: '#064d84',
          900: '#0b416e',
          950: '#072a4a',
        },
        meli: {
          yellow: '#ffe600',
          blue: '#2d3277',
          dark: '#333333'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
