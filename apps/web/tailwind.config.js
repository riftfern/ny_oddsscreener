/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			display: ['"Archivo Narrow"', 'sans-serif'],
  			sans: ['"Archivo Narrow"', 'ui-sans-serif', 'sans-serif'],
  			mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
  			data: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
  		},
  		colors: {
  			bg: 'var(--bg)',
  			'bg-2': 'var(--bg-2)',
  			line: 'var(--line)',
  			ink: 'var(--ink)',
  			'ink-dim': 'var(--ink-dim)',
  			moss: 'var(--moss)',
  			'moss-2': 'var(--moss-2)',
  			lichen: 'var(--lichen)',
  			pin: 'var(--pin)',
  			warn: 'var(--warn)',
  			bad: 'var(--bad)',
  			// Remap leftover SaaS chrome so pages look concrete+moss
  			// before every component is rewritten onto named tokens.
  			gray: {
  				50: '#e6e4dc',
  				100: '#e6e4dc',
  				200: '#c4c2b8',
  				300: '#8a8d84',
  				400: '#8a8d84',
  				500: '#8a8d84',
  				600: '#2a2e28',
  				700: '#2a2e28',
  				800: '#1a1d19',
  				900: '#121411',
  				950: '#121411',
  			},
  			blue: {
  				400: '#9cb89a',
  				500: '#3f7a4c',
  				600: '#2f5d3a',
  				700: '#2f5d3a',
  			},
  			fanduel: '#8a8d84',
  			draftkings: '#8a8d84',
  			betmgm: '#8a8d84',
  			caesars: '#8a8d84',
  			betrivers: '#8a8d84',
  			fanatics: '#8a8d84',
  			ballybet: '#8a8d84',
  			bet365: '#8a8d84',
  			thescore: '#8a8d84',
  			positive: '#9cb89a',
  			negative: '#8f3d32',
  			neutral: '#8a8d84',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			none: '0',
  			sm: '0',
  			DEFAULT: '0',
  			md: '0',
  			lg: '0',
  			xl: '0',
  			'2xl': '0',
  			'3xl': '0',
  			full: '0',
  		},
  		boxShadow: {
  			sm: 'none',
  			DEFAULT: 'none',
  			md: 'none',
  			lg: 'none',
  			xl: 'none',
  			'2xl': 'none',
  			inner: 'none',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
