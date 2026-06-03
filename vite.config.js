import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'Terraplot',
      fileName: 'terraplot',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // `geotiff` is an optional peer dep loaded via dynamic import() — keep it
      // external so the consumer resolves it at runtime instead of bundling it.
      external: ['three', 'geotiff'],
      output: {
        globals: { three: 'THREE' },
      },
    },
  },
});
