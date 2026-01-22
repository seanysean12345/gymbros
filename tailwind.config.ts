import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // WWE Raw 2006 / SmackDown vs Raw inspired palette
        'raw-red': '#CC0000',
        'raw-red-dark': '#990000',
        'raw-red-glow': '#FF0000',
        // Chrome/silver metal colors (the actual WWE 2000s look)
        'chrome-light': '#E8E8E8',
        'chrome-mid': '#C0C0C0',
        'chrome-dark': '#A0A0A0',
        'chrome-shadow': '#707070',
        'chrome-edge': '#F5F5F5',
        // Dark backgrounds
        'steel-dark': '#1A1A1A',
        'steel-mid': '#2A2A2A',
        'arena-black': '#0A0A0A',
        'arena-dark': '#0F0F0F',
        // Keep brand colors for compatibility
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        // MS Gothic - the MGS Japanese game font
        sans: ['"MS Gothic"', '"MS PGothic"', '"Hiragino Kaku Gothic Pro"', 'Meiryo', '"Yu Gothic"', '"Courier New"', 'monospace'],
        // WWE headers
        wwe: ['Impact', 'Haettenschweiler', '"Arial Narrow Bold"', 'sans-serif'],
      },
      skew: {
        '6': '6deg',
        '8': '8deg',
        '12': '12deg',
      },
      boxShadow: {
        'chrome-bevel': 'inset 0 2px 0 #FFFFFF, inset 0 -2px 0 #606060, inset 2px 0 0 #D0D0D0, inset -2px 0 0 #808080',
        'chrome-pressed': 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.2)',
        'red-glow': '0 0 15px rgba(255, 0, 0, 0.6), 0 0 30px rgba(204, 0, 0, 0.4)',
        'red-glow-sm': '0 0 8px rgba(255, 0, 0, 0.5)',
      },
      backgroundImage: {
        'arena-spotlight': 'radial-gradient(ellipse at top, rgba(255,255,255,0.1) 0%, transparent 50%)',
        'steel-gradient': 'linear-gradient(180deg, #4A4A4A 0%, #2A2A2A 50%, #1A1A1A 100%)',
        'steel-plate': 'linear-gradient(135deg, #4A4A4A 0%, #3A3A3A 25%, #2A2A2A 50%, #3A3A3A 75%, #4A4A4A 100%)',
      },
    },
  },
  plugins: [
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.font-wwe': {
          'font-family': 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
          'font-style': 'italic',
          'text-transform': 'uppercase',
          'letter-spacing': '0.02em',
        },
      })
    },
  ],
}

export default config
