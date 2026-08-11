import type { Config } from 'tailwindcss';

/**
 * RuMax design system.
 *
 * Colour is expressed as CSS custom properties (see src/app/globals.css) so a single
 * token set drives both light and dark themes plus the high-contrast accessibility
 * mode, without duplicating the Tailwind palette three times.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--rx-bg) / <alpha-value>)',
        surface: 'rgb(var(--rx-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--rx-surface-2) / <alpha-value>)',
        border: 'rgb(var(--rx-border) / <alpha-value>)',
        fg: 'rgb(var(--rx-fg) / <alpha-value>)',
        muted: 'rgb(var(--rx-muted) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--rx-brand) / <alpha-value>)',
          fg: 'rgb(var(--rx-brand-fg) / <alpha-value>)',
          soft: 'rgb(var(--rx-brand-soft) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--rx-accent) / <alpha-value>)',
          soft: 'rgb(var(--rx-accent-soft) / <alpha-value>)',
        },
        success: 'rgb(var(--rx-success) / <alpha-value>)',
        warning: 'rgb(var(--rx-warning) / <alpha-value>)',
        danger: 'rgb(var(--rx-danger) / <alpha-value>)',
        info: 'rgb(var(--rx-info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgb(0 0 0 / 0.18), inset 0 1px 0 0 rgb(255 255 255 / 0.08)',
        lift: '0 20px 45px -20px rgb(0 0 0 / 0.35)',
        ring: '0 0 0 1px rgb(var(--rx-border) / 1)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, rgb(var(--rx-brand)) 0%, rgb(var(--rx-accent)) 100%)',
        'mesh':
          'radial-gradient(at 12% 18%, rgb(var(--rx-brand) / 0.22) 0px, transparent 55%), radial-gradient(at 84% 8%, rgb(var(--rx-accent) / 0.20) 0px, transparent 50%), radial-gradient(at 62% 88%, rgb(var(--rx-info) / 0.16) 0px, transparent 55%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
