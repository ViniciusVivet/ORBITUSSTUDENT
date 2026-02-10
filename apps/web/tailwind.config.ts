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
          dark: '#1a1625',
          card: '#252030',
          accent: '#8b5cf6',
          xp: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
export default config;
