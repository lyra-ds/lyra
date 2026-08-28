import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,mjs}', 'scripts/**/*.test.mjs'],
    exclude: ['src/**/*.browser.test.*'],
  },
});
