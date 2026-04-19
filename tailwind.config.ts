import type { Config } from 'tailwindcss'

// Burnt orange palette derived from #e04e1a
// Replaces Tailwind's default orange so all existing orange-* classes
// automatically use the Nvoyce brand color.
const brandOrange = {
  50:  '#fff3ee',
  100: '#ffe3d1',
  200: '#ffc3a0',
  300: '#ff9a66',
  400: '#f26b38',
  500: '#e04e1a',  // ← primary brand color
  600: '#c23d10',
  700: '#a02f0b',
  800: '#832609',
  900: '#6d1f07',
  950: '#3d0d02',
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      colors: {
        orange: brandOrange,
      },
    },
  },
  plugins: [],
}
export default config
