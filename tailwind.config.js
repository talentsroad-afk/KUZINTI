/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        forest: 'rgb(var(--forest) / <alpha-value>)',
        leaf: 'rgb(var(--leaf) / <alpha-value>)',
        apricot: 'rgb(var(--apricot) / <alpha-value>)',
        cream: 'rgb(var(--cream) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / .04), 0 8px 24px -12px rgb(var(--shadow) / .25)',
        lift: '0 2px 4px rgb(0 0 0 / .04), 0 18px 40px -18px rgb(var(--shadow) / .45)',
      },
    },
  },
  plugins: [],
}
