/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Cormorant Garamond"', 'serif'],
                sans: ['Outfit', 'system-ui', 'sans-serif'],
                display: ['"Cormorant Garamond"', 'serif'],
            },
            colors: {
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
                // Luxury Indian palette
                ivory: '#FAF8F5',
                cream: '#F1ECE3',
                champagne: '#C6A87C',
                gold: '#D4AF37',
                maroon: '#8B3A3A',
                'maroon-deep': '#6B2A2A',
                espresso: '#2C241B',
                stone: '#736B5E',
                'line-soft': '#E8E4DF',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            letterSpacing: {
                'tightest': '-0.04em',
                'widest-2': '0.25em',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                'grain': {
                    '0%, 100%': { transform: 'translate(0,0)' },
                    '10%': { transform: 'translate(-5%,-10%)' },
                    '30%': { transform: 'translate(3%,-15%)' },
                    '50%': { transform: 'translate(12%,9%)' },
                    '70%': { transform: 'translate(9%,4%)' },
                    '90%': { transform: 'translate(-1%,7%)' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(24px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down': {
                    from: { opacity: '1', transform: 'translateY(0)' },
                    to: { opacity: '0', transform: 'translateY(24px)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'blur-in': {
                    '0%': { opacity: '0', filter: 'blur(4px)' },
                    '100%': { opacity: '1', filter: 'blur(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 58, 58, 0)' },
                    '50%': { boxShadow: '0 0 20px 10px rgba(139, 58, 58, 0.1)' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'shimmer': 'shimmer 3s linear infinite',
                'float-slow': 'float-slow 6s ease-in-out infinite',
                'grain': 'grain 8s steps(10) infinite',
                'slide-up': 'slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'slide-down': 'slide-down 0.4s ease-out',
                'fade-in': 'fade-in 0.8s ease-out',
                'blur-in': 'blur-in 0.7s ease-out',
                'scale-in': 'scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'glow': 'glow 2s ease-in-out infinite',
                'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
            },
            backgroundImage: {
                'gold-shimmer': 'linear-gradient(110deg, #C6A87C 0%, #E9D6A8 50%, #C6A87C 100%)',
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                md: '8px',
                lg: '16px',
                xl: '24px',
                '2xl': '32px',
            },
            boxShadow: {
                'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
                'glass-lg': '0 8px 64px rgba(31, 38, 135, 0.2)',
                'glass-xl': '0 20px 80px rgba(31, 38, 135, 0.3)',
                'soft': '0 4px 16px rgba(0, 0, 0, 0.08)',
                'soft-lg': '0 12px 32px rgba(0, 0, 0, 0.12)',
                'maroon-glow': '0 0 32px rgba(139, 58, 58, 0.15)',
            },
        },
    },
    plugins: [require("tailwindcss-animate"), function({ addUtilities }) {
        const glassUtilities = {
            '.glass': {
                '@apply backdrop-blur-lg bg-white/30 border border-white/20 rounded-xl': {},
            },
            '.glass-dark': {
                '@apply backdrop-blur-lg bg-black/30 border border-white/10 rounded-xl': {},
            },
            '.glass-md': {
                '@apply backdrop-blur-md bg-white/20 border border-white/15 rounded-lg': {},
            },
            '.glass-sm': {
                '@apply backdrop-blur-sm bg-white/10 border border-white/10 rounded-lg': {},
            },
            '.frosted': {
                '@apply backdrop-blur-xl bg-white/40 border border-white/30': {},
            },
            '.smooth-transition': {
                '@apply transition-all duration-500 ease-out': {},
            },
            '.smooth-fast': {
                '@apply transition-all duration-300 ease-out': {},
            },
            '.smooth-slow': {
                '@apply transition-all duration-700 ease-out': {},
            },
            '.hocus\\:lift': {
                '@apply hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300': {},
            },
        };
        addUtilities(glassUtilities);
    }],
};
