/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spooky Theme Colors
        'haunted': {
          'dark': '#0f0f23',
          'purple': '#1a1a2e',
          'blue': '#16213e',
          'ghost': '#a78bfa',
          'spirit': '#f97316',
          'monster': '#dc2626'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'haunted-mansion': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        'danger-mansion': 'linear-gradient(135deg, #2d1b1b 0%, #3d1a1a 50%, #4a1a1a 100%)'
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out infinite',
        'ghost-drift': 'ghost-drift 8s ease-in-out infinite',
        'monster-rage': 'monster-rage 1s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' }
        },
        'ghost-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(10px, -5px) scale(1.1)' },
          '50%': { transform: 'translate(-5px, -10px) scale(0.9)' },
          '75%': { transform: 'translate(-10px, 5px) scale(1.05)' }
        },
        'monster-rage': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.1) rotate(-2deg)' },
          '50%': { transform: 'scale(1.2) rotate(0deg)' },
          '75%': { transform: 'scale(1.1) rotate(2deg)' }
        }
      },
      boxShadow: {
        'haunted': '0 0 20px rgba(139, 92, 246, 0.3)',
        'danger': '0 0 30px rgba(220, 38, 38, 0.5)',
        'ghost': '0 0 15px rgba(167, 139, 250, 0.4)',
        'spirit': '0 0 25px rgba(249, 115, 22, 0.4)',
        'monster': '0 0 35px rgba(220, 38, 38, 0.6)'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '9998': '9998',
        '9999': '9999'
      }
    },
  },
  plugins: [],
}