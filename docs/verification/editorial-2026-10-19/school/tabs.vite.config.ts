/** Vite's resolution for `school-tabs.mts`: the project's `@` alias, with the kept-state hook read for a server render. */
import { fileURLToPath } from 'node:url';

export default {
  resolve: {
    alias: [
      { find: /^@\/ui\/kept$/, replacement: fileURLToPath(new URL('./kept-ssr.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('../../../../src', import.meta.url)) },
    ],
  },
};
