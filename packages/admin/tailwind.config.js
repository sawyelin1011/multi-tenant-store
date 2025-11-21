const config = {
    darkMode: ['class'],
    content: ['index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: 'var(--brand-color)',
                    foreground: '#ffffff',
                },
            },
            boxShadow: {
                brand: '0 10px 25px -5px rgba(37, 99, 235, 0.35)',
            },
        },
    },
    plugins: [],
};
export default config;
