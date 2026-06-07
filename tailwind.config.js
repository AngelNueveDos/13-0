/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a1628',
          deep: '#060e1c',
          800: '#0d1d35',
          700: '#13294a',
          600: '#1c3a63',
        },
        gold: {
          DEFAULT: '#c9a84c',
          soft: '#d9bd6e',
          dim: '#8f7733',
        },
        cream: '#f4f1e8',
        bluegray: '#8ea0b8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Cormorant Garamond"', 'serif'],
      },
      boxShadow: {
        gold: '0 6px 22px -6px rgba(201,168,76,0.55)',
        'gold-lg': '0 14px 40px -10px rgba(201,168,76,0.6)',
        card: '0 8px 30px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        spinReveal: {
          '0%': { transform: 'rotate(0deg) scale(0.6)', opacity: '0.2' },
          '100%': { transform: 'rotate(720deg) scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        starSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        spinReveal: 'spinReveal 1.1s cubic-bezier(0.16,1,0.3,1) both',
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        pulseGlow: 'pulseGlow 1.8s ease-in-out infinite',
        starSpin: 'starSpin 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
