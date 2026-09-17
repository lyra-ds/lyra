import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,mjs}', 'scripts/**/*.test.mjs'],
    exclude: ['src/**/*.browser.test.*'],
    // Build/bundle/process integration tests share runner resources (real Next
    // builds, Wrangler bundling, child ingest); run files serially to avoid
    // resource contention timeouts.
    fileParallelism: false,
  },
});
