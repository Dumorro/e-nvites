import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        equinor: {
          red: '#d81e3a',
          navy: '#07364f',
          blue: '#0084C9',
          orange: '#FF6B35',
          pink: '#E91E63',
          cyan: '#00BCD4',
          bg: '#f6f6f6',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
