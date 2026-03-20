/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f6f1eb',
        mist: '#eef4ff',
        ink: '#14213d',
        sky: '#2d6df6',
      },
      boxShadow: {
        panel: '0 24px 60px rgba(20, 33, 61, 0.12)',
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
