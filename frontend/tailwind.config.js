/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Soft Purple / Violet Brand Palette
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Warm Sunshine Golden Yellow Accent
        accent: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Bright Neumorphic Surfaces
        neu: {
          bg:      '#f4f3f9',
          surface: '#f9f8fc',
          card:    '#f9f8fc',
          inset:   '#eeedf5',
          text:    '#1e1b4b',
          muted:   '#64748b',
          light:   '#ffffff',
          dark:    '#a6a0c3',
        },
        // Severity colours (WCAG-compliant on light backgrounds)
        severity: {
          critical: '#e11d48',
          serious:  '#ea580c',
          moderate: '#d97706',
          minor:    '#7c3aed',
        },
      },
      boxShadow: {
        'neu-sm':       '3px 3px 8px rgba(166, 160, 195, 0.25), -3px -3px 8px rgba(255, 255, 255, 0.9)',
        'neu':          '6px 6px 14px rgba(166, 160, 195, 0.32), -6px -6px 14px rgba(255, 255, 255, 0.95)',
        'neu-lg':       '10px 10px 24px rgba(166, 160, 195, 0.38), -10px -10px 24px rgba(255, 255, 255, 1)',
        'neu-inset-sm': 'inset 2px 2px 4px rgba(166, 160, 195, 0.25), inset -2px -2px 4px rgba(255, 255, 255, 0.9)',
        'neu-inset':    'inset 3px 3px 6px rgba(166, 160, 195, 0.35), inset -3px -3px 6px rgba(255, 255, 255, 0.95)',
        'neu-inset-lg': 'inset 5px 5px 12px rgba(166, 160, 195, 0.4), inset -5px -5px 12px rgba(255, 255, 255, 1)',
        'neu-purple':   '0 8px 24px -4px rgba(124, 58, 237, 0.32), 4px 4px 10px rgba(166, 160, 195, 0.25)',
        'neu-yellow':   '0 8px 24px -4px rgba(234, 179, 8, 0.4), 4px 4px 10px rgba(166, 160, 195, 0.25)',
      },
      animation: {
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'pulse-soft':  'pulse-soft 2s ease-in-out infinite',
        'float-slow':  'float-slow 3s ease-in-out infinite',
        'spin-slow':   'spin 10s linear infinite',
      },
      keyframes: {
        'radar-sweep': {
          'from': { transform: 'rotate(0deg)' },
          'to':   { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.02)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
