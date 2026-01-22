/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Gemini-esque palette
                slate: {
                    850: '#1e293b', // Deep sidebar
                    900: '#0f172a', // Darker
                },
                primary: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    500: '#0071DC', // Walmart Blue
                    600: '#004f9a', // Darker Blue
                    700: '#003d7a',

                    // Accents
                    warning: '#FFC220', // Spark Yellow
                    dark: '#2E2F32'
                }
            },
            boxShadow: {
                'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
                'glow': '0 0 20px rgba(14, 165, 233, 0.15)',
            }
        },
    },
    plugins: [],
}
