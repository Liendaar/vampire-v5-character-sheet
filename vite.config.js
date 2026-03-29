import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/vampire-v5-character-sheet/' : '/',
  build: {
    outDir: 'dist',
  },
}));
