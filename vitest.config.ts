import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The Base44 functions import the SDK the way Deno does. Point that at
      // the in-memory stand-in so the real handler source can be executed.
      'npm:@base44/sdk': fileURLToPath(new URL('./tests/fakes/base44-sdk.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
