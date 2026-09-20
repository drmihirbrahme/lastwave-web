/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'rgba(28, 28, 30, 0.75)',
          translucent: 'rgba(38, 38, 42, 0.65)',
          elevated: 'rgba(44, 44, 46, 0.85)',
          card: 'rgba(255, 255, 255, 0.05)',
        },
        brand: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          accent: '#C6F100',
          orange: '#FF813F',
          red: '#FF4D4D',
          lastfm: '#D51007',
        }
      },
      backdropBlur: {
        xs: '2px',
        ios: '20px',
        glass: '32px',
      },
      borderRadius: {
        '4xl': '2rem',
        'ios': '1.25rem',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
