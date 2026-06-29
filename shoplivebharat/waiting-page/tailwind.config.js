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
                ivory: '#FAF8F5',
                espresso: '#2C241B',
                maroon: '#7B3F2A',
                rust: '#A85D4F',
                blush: '#D9BFAD',
                sage: '#9B9B7F',
                gold: '#C9A878',
            },
            animation: {
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
