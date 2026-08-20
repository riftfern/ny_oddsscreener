/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			display: ['Nunito', 'ui-sans-serif', 'sans-serif'],
  			sans: ['Nunito', 'ui-sans-serif', 'sans-serif'],
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
  				50: '#fff6d4',
  				100: '#fff6d4',
  				200: '#e8d9a8',
  				300: '#5e4b86',
  				400: '#5e4b86',
  				500: '#5e4b86',
  				600: '#3d2a78',
  				700: '#3d2a78',
  				800: '#2a1854',
  				900: '#2a1854',
  				950: '#2a1854',
  			},
  			blue: {
  				400: '#4aa3d8',
  				500: '#3b8fc4',
  				600: '#3d2a78',
  				700: '#2a1854',
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
  			sm: '0.5rem',
  			DEFAULT: '0.85rem',
  			md: '1rem',
  			lg: '1.15rem',
  			xl: '1.35rem',
  			'2xl': '1.6rem',
  			'3xl': '2rem',
  		},
  		boxShadow: {
  			glass: '4px 4px 0 #3d2a78',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
