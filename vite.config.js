import path from 'node:path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
// import devtools from 'solid-devtools/vite';

export default defineConfig({
    root: './src',
    plugins: [
        // devtools(),
        solidPlugin(),
    ],
    server: {
        port: 3000,
    },
    build: {
        outDir: '../dist',
        target: 'esnext',
    },
    resolve: {
        alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
            scopeBehaviour: 'local',
        },
    },
});
