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
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9', // Sky blue
                    600: '#0284c7',
                    700: '#0369a1',
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
