/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f0c29',
                card: 'rgba(255, 255, 255, 0.06)',
                primary: '#a78bfa',
                secondary: '#60a5fa',
                accent: '#34d399',
            },
        },
    },
    plugins: [],
}
