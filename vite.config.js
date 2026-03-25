import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
        strictPort: true,
        allowedHosts: [
            'searches-cloth-width-prospect.trycloudflare.com',
            '.trycloudflare.com'
        ],
        hmr: {
            clientPort: 443,
        },
        proxy: {
            '/api': 'http://localhost:4000',
            '/uploads': 'http://localhost:4000',
        },
    },
});