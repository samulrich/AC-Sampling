import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // 1. IMPORT PWA PLUGIN

// Define the name of your GitHub repository for the base path
const repoName = 'AC-Sampling'; 

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
        // 2. ADD BASE PATH FOR GITHUB PAGES DEPLOYMENT
        base: `/${repoName}/`, 

        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            // 3. ADD PWA PLUGIN CONFIGURATION
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
                manifest: {
                    name: 'AC Sampling PWA',
                    short_name: 'ACS',
                    description: 'Your PWA for AC Sampling data.',
                    theme_color: '#ffffff',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                        },
                    ],
                },
            }),
        ],
        // Your existing environment variable loading and defining
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        // Your existing custom path alias
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});