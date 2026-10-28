/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
      colors: { ink: '#17221c', muted: '#78827b', line: '#e7ebe6', canvas: '#f7f8f6', forest: '#285c42', lime: '#d9f36a' },
      boxShadow: { soft: '0 8px 30px rgba(34, 53, 40, .06)', float: '0 18px 45px rgba(34, 53, 40, .14)' },
      borderRadius: { '2xl': '1.25rem' },
      keyframes: { 'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } } },
      animation: { 'fade-up': 'fade-up .24s ease-out both' },
    },
  },
  plugins: [],
}
