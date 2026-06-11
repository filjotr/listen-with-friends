/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#080a10',
        cardBg: 'rgba(15, 22, 36, 0.4)',
        glassBg: 'rgba(255, 255, 255, 0.03)',
        glassBorder: 'rgba(255, 255, 255, 0.07)',
        spotifyGreen: '#1DB954',
        discordPurple: '#5865F2',
        brandPink: '#FF007A',
        brandCyan: '#00F0FF'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
        'neon-pink': '0 0 15px rgba(255, 0, 122, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'music-wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '28px' }
        }
      }
    },
  },
  plugins: [],
}
