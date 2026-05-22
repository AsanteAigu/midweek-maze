/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Platform light theme (matches Midweek Maze exactly) ──
        surface: {
          white:  '#FFFFFF',
          off:    '#F7F7F7',
          card:   '#FFFFFF',
          hover:  '#F0F0F0',
          border: '#E5E5E5',
          'border-strong': '#AFAFAF',
        },
        text: {
          dark:  '#3C3C3C',
          mid:   '#777777',
          muted: '#AFAFAF',
          white: '#FFFFFF',
        },
        // ── Duolingo palette ──
        duo: {
          blue:        '#1CB0F6',
          'blue-dark': '#0F8FC0',
          'blue-light':'#DFF4FF',
          green:       '#58CC02',
          'green-dark':'#3D8F01',
          yellow:      '#FFC800',
          'yellow-dark':'#E6AC00',
          red:         '#FF4B4B',
          purple:      '#CE82FF',
          orange:      '#FF9600',
        },
        // ── Night-sky scene (game board only) ──
        scene: {
          bg:     '#050D1E',
          mid:    '#0A1628',
          ground: '#071A10',
        },
      },
      fontFamily: {
        display: ['"Nunito"', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card:        '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.12)',
        blue:        '0 4px 0 #0F8FC0',
        'blue-active':'0 0 0 #0F8FC0',
      },
    },
  },
  plugins: [],
};
