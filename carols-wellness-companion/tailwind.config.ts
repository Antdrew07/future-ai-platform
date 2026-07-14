import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Blush pink brand palette
        blush: {
          50: '#FEF3F7',
          100: '#FDE7EF',
          200: '#FBD0E0',
          300: '#F9B4CD',
          400: '#F7A8C4', // primary blush pink
          500: '#F084B0',
          600: '#E15C93',
          700: '#C13E74',
          800: '#9C2F5C',
          900: '#7E294C',
        },
        rosegold: {
          light: '#EFC9B7',
          DEFAULT: '#B76E79', // rose gold accent
          dark: '#9E5A66',
        },
        charcoal: {
          DEFAULT: '#2B2530',
          soft: '#4A414F',
          muted: '#8A8290',
        },
        cream: '#FFFBFD',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(193, 62, 116, 0.25)',
        card: '0 4px 24px -8px rgba(193, 62, 116, 0.18)',
        glow: '0 0 0 4px rgba(247, 168, 196, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.9)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'pop': 'pop 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
