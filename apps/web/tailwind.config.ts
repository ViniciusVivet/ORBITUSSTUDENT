import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orbitus: {
          dark: '#0a0e1a',
          surface: '#111527',
          card: '#141832',
          'card-hover': '#1a1f3a',
          border: '#1a2040',
          accent: '#8b5cf6',
          'accent-bright': '#a78bfa',
          'accent-glow': '#7c3aed',
          xp: '#f59e0b',
          'xp-dark': '#b45309',
          cyan: '#06b6d4',
          success: '#10b981',
          danger: '#ef4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'radial-gradient(ellipse at 50% 0%, #2d1b6b 0%, #0a0e1a 60%)',
        'gradient-card': 'linear-gradient(135deg, #1e1a30 0%, #1a1628 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-accent-lg': '0 0 40px rgba(139, 92, 246, 0.2)',
        'glow-xp': '0 0 16px rgba(245, 158, 11, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
