/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './src/popup/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marka rengi: Yargıtay Karar Arama sitesinin ana rengi #40aead (teal).
        // brand-700 = #40aead → primary butonlar, header ve linkler bu renge döner.
        brand: {
          50:  '#f0fbfb',
          100: '#ddf4f4',
          200: '#c2e9ea',
          300: '#98dadb',
          400: '#6fcccd',
          500: '#5cc0c1',
          600: '#49b4b5',
          700: '#40aead',
          800: '#338e8f',
          900: '#28706f',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
