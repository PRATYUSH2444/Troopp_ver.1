/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316', // Saffron Orange
          dark: '#EA6C0A',    // Hover/Pressed Saffron
          light: '#FED7AA',   // Background tint / disabled Saffron
        },
        secondary: {
          DEFAULT: '#166534', // Forest Green (Trusted)
        },
        bg: {
          DEFAULT: '#FAFAF8', // Warm off-white
        },
        surface: {
          DEFAULT: '#FFFFFF', // Card/Modal surface
        },
        border: {
          DEFAULT: '#E7E5E4', // Dividers / Input borders
        },
        text: {
          primary: '#1C1917',   // Main text
          secondary: '#78716C', // Meta / placeholders
          disabled: '#D6D3D1',  // Disabled inputs
        },
        badge: {
          trusted: '#166534',
          verified: '#1D4ED8',
          new: '#78716C',
          flagged: '#DC2626',
        },
        status: {
          success: '#166534',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#1D4ED8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Courier New"', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'neumorphic-outset': '4px 4px 8px rgba(0, 0, 0, 0.06), -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'neumorphic-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.06), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'neumorphic-primary-outset': '4px 4px 8px rgba(249, 115, 22, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'neumorphic-primary-inset': 'inset 4px 4px 8px rgba(249, 115, 22, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseAlert: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(220, 38, 38, 0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-alert': 'pulseAlert 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
