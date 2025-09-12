import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    // Node.js internal modules
    'os',
    // Third-party modules that need dynamic require
    /^supports-color/,
    /^chalk/,
    // React
    'react',
  ],
  outDir: 'dist',
})
