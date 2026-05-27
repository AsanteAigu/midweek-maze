/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/games/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        duo: {
          green: '#58CC02',
          'green-dark': '#3D8F01',
          'green-light': '#E8FFD4',
          yellow: '#FFC800',
          'yellow-dark': '#E6AC00',
          blue: '#1CB0F6',
          'blue-dark': '#0F8FC0',
          'blue-light': '#DFF4FF',
          red: '#FF4B4B',
          pink: '#FF86D0',
          purple: '#CE82FF',
          orange: '#FF9600',
        },
        surface: {
          white: '#FFFFFF',
          off: '#F7F7F7',
          card: '#FFFFFF',
          hover: '#F0F0F0',
          border: '#E5E5E5',
          'border-strong': '#AFAFAF',
        },
        text: {
          dark: '#3C3C3C',
          mid: '#777777',
          muted: '#AFAFAF',
          white: '#FFFFFF',
        },
        rank: {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
        },
      },
      fontFamily: {
        display: ['"Nunito"', '"Fredoka One"', 'sans-serif'],
        body: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
        green: '0 4px 0 #0F8FC0',
        'green-active': '0 0 0 #0F8FC0',
        yellow: '0 4px 0 #E6AC00',
        blue: '0 4px 0 #0F8FC0',
      },
      animation: {
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'xp-pop': 'xp-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
        'xp-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '80%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
