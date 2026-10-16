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
    // An ended life's clock asked forward again and again throws, naming the death (from 2026-10-16, brief 09's journeys:
    // until then a test looping to a later time hung for good once mortality's draw ended its life).
    setupFiles: ['tests/setup/ended-life.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
