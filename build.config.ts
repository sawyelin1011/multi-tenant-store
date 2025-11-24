import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      'index': 'src/index.ts',
      'worker/index': 'src/worker/index.ts',
    },
    format: ['esm'],
    target: 'es2020',
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    shims: true,
    external: ['better-sqlite3', 'pg', '@cloudflare/workers-types'],
    dts: {
      resolve: true,
    },
  },
]);
