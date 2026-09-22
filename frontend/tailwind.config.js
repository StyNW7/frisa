/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        /* Room for the pitch, the phone and the character side by side. */
        stage: '1180px',
      },
      colors: {
        frisa: {
          50: '#EAF8F1',
          100: '#D8F3E6',
          200: '#B7E8D0',
          300: '#84D9B2',
          400: '#4AC894',
          500: '#25B877',
          600: '#1CA167',
          700: '#168653',
          800: '#116945',
          900: '#0D4E34',
        },
        ember: {
          50: '#FFF1E3',
          100: '#FFE2C6',
          200: '#FFCC9B',
          300: '#FFB16A',
          400: '#FE9A3B',
          500: '#FC8612',
          600: '#EC7607',
          700: '#D96900',
          800: '#A85200',
          900: '#7B3D02',
        },
        ink: {
          DEFAULT: '#18211C',
          soft: '#3A463F',
          muted: '#66736B',
          faint: '#8D998F',
        },
        canvas: '#F7F9F8',
        surface: '#FFFFFF',
        mist: '#F0F3F1',
        line: '#E4EAE6',
        danger: {
          50: '#FDF0EF',
          100: '#F9DCD9',
          500: '#C0453C',
          600: '#A93A32',
          700: '#8C2F28',
        },
        info: {
          50: '#EAF3FB',
          100: '#D3E6F6',
          500: '#2E86C9',
          600: '#2371AC',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,33,28,0.04), 0 10px 24px -16px rgba(24,33,28,0.20)',
        lift: '0 2px 6px rgba(24,33,28,0.05), 0 18px 36px -20px rgba(24,33,28,0.28)',
        sheet: '0 -12px 40px -12px rgba(24,33,28,0.24)',
        nav: '0 -1px 0 #E4EAE6, 0 -12px 28px -22px rgba(24,33,28,0.30)',
        pill: '0 6px 16px -8px rgba(37,184,119,0.55)',
        device: '0 24px 60px -30px rgba(13,78,52,0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'sheet-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-14px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scan-sweep': {
          '0%': { transform: 'translateY(-8%)' },
          '50%': { transform: 'translateY(108%)' },
          '100%': { transform: 'translateY(-8%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.65' },
          '70%': { transform: 'scale(1.35)', opacity: '0' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        'wave-bar': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'draw-in': {
          from: { strokeDashoffset: '260' },
          to: { strokeDashoffset: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.72)', opacity: '0' },
          '60%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        'bubble-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.94)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        /* The hub's status light while it waits to be paired. */
        'led-blink': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(252,134,18,0.55)' },
          '50%': { opacity: '0.3', boxShadow: '0 0 0 7px rgba(252,134,18,0)' },
        },
        /* A packet travelling along the link between two devices. */
        'link-travel': {
          '0%': { left: '0%', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'fade-up': 'fade-up 260ms cubic-bezier(0.22,1,0.36,1) both',
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.22,1,0.36,1) both',
        'sheet-down': 'sheet-down 220ms cubic-bezier(0.4,0,1,1) both',
        'toast-in': 'toast-in 220ms cubic-bezier(0.22,1,0.36,1) both',
        'scan-sweep': 'scan-sweep 2.4s ease-in-out infinite',
        'wave-bar': 'wave-bar 900ms ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'draw-in': 'draw-in 1.1s ease-out both',
        shake: 'shake 420ms cubic-bezier(0.36,0.07,0.19,0.97) both',
        'pop-in': 'pop-in 380ms cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 4.2s ease-in-out infinite',
        'bubble-in': 'bubble-in 320ms cubic-bezier(0.22,1,0.36,1) both',
        'led-blink': 'led-blink 1.4s ease-in-out infinite',
        'link-travel': 'link-travel 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
