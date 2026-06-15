/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './src/popup/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design token'ları (index.css'teki CSS değişkenleri) → semantik sınıflar.
      // Tema/accent <html data-theme/data-accent> ile değiştiğinde otomatik güncellenir.
      colors: {
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        rail: 'var(--rail)',
        // metin
        fg: { DEFAULT: 'var(--text)', 2: 'var(--text-2)', 3: 'var(--text-3)', faint: 'var(--text-faint)' },
        // hairline ayraçlar
        line: { DEFAULT: 'var(--border)', 2: 'var(--border-2)', strong: 'var(--border-strong)' },
        // vurgu
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          text: 'var(--accent-text)',
          weak: 'var(--accent-weak)',
          'weak-2': 'var(--accent-weak-2)',
        },
        'on-accent': 'var(--on-accent)',
        danger: { DEFAULT: 'var(--danger)', weak: 'var(--danger-weak)' },
        warn: 'var(--warn-text)',
        hl: { bg: 'var(--hl-bg)', text: 'var(--hl-text)' },

        // Eski brand paleti — göç tamamlanana dek geriye dönük uyumluluk için tutuldu.
        brand: {
          50: '#f0fbfb', 100: '#ddf4f4', 200: '#c2e9ea', 300: '#98dadb', 400: '#6fcccd',
          500: '#5cc0c1', 600: '#49b4b5', 700: '#40aead', 800: '#338e8f', 900: '#28706f',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', '-apple-system', 'sans-serif'],
        ui: ['Geist Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        read: ['Source Serif 4', 'Georgia', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
