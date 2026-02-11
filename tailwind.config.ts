import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: 'rgba(245, 241, 234, 0.85)',
        paper: 'rgba(250, 248, 244, 0.90)',
        ink: '#2a2522',
        'ink-light': '#5c5550',
        'ink-muted': '#9a928a',
        'ink-faint': '#c8c0b8',
        rule: '#d8d0c8',
        'rule-light': '#e8e2da',
        navy: '#1e3a5f',
        'navy-light': '#3a6b9f',
        'navy-bg': 'rgba(30, 58, 95, 0.03)',
        gold: '#c4a35a',
        'gold-light': '#d4b86a',
        'gold-bg': 'rgba(196, 163, 90, 0.03)',
        'green-ink': '#2d5f3f',
        'green-bg': 'rgba(45, 95, 63, 0.03)',
        'red-ink': '#8c2d2d',
        'red-bg': 'rgba(140, 45, 45, 0.03)',
        'amber-ink': '#8a6d2f',
        'amber-bg': 'rgba(138, 109, 47, 0.03)',
      },
      fontFamily: {
        serif: ['var(--font-crimson)', 'Georgia', 'serif'],
        mono: ['var(--font-ibm-plex)', 'Menlo', 'monospace'],
        sans: ['var(--font-inter)', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',
      },
    },
  },
  plugins: [],
}

export default config
