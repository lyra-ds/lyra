import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['integration/csp-runtime.test.mjs'],
  },
});
