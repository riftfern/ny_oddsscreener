/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sportsbook brand colors
        fanduel: '#1493ff',
        draftkings: '#53d337',
        betmgm: '#c4a932',
        caesars: '#0a4833',
        betrivers: '#1a73e8',
        fanatics: '#000000',
        ballybet: '#e31837',
        bet365: '#027b5b',
        thescore: '#ff6b00',
        // App colors
        positive: '#22c55e',
        negative: '#ef4444',
        neutral: '#6b7280',
      },
    },
  },
  plugins: [],
};
