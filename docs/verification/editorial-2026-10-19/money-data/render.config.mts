// Brief 15, money-data: runs this folder's render harness alone, never in the suite (`vitest.config.ts` includes only
// tests/). `npx vitest run --config docs/verification/editorial-2026-10-19/money-data/render.config.mts`.
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('../../../../', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../../../src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['docs/verification/editorial-2026-10-19/money-data/render-*.test.ts'],
    setupFiles: ['tests/setup/ended-life.ts'],
    testTimeout: 600_000,
  },
});
