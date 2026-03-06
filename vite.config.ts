import { defineConfig } from 'vite';
import { resolve } from 'path';
import { piratesDebugPlugin } from './vite-debug-plugin';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [piratesDebugPlugin()],
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
