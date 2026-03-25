/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#FF6B00',
                    600: '#E55F00',
                    700: '#C2410C',
                },
                surface: '#F5F5F7',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                card: '0 2px 8px rgba(0,0,0,0.06)',
                modal: '0 -4px 24px rgba(0,0,0,0.12)',
                nav: '0 2px 8px rgba(0,0,0,0.04)',
                fab: '0 4px 16px rgba(255,107,0,0.3)',
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '20px',
            },
        },
    },
    plugins: [],
};
