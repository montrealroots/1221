/**
 * Writes docs/ATTRIBUTES-MATRIX.md from the tables (`attributesMatrix`), from
 * 2026-10-09. Run: npx vite-node tools/attributes-matrix.ts
 */

import { writeFileSync } from 'node:fs';
import { attributesMatrix } from '../src/engine/content/attributes-matrix';

writeFileSync('docs/ATTRIBUTES-MATRIX.md', attributesMatrix());
console.log('Wrote docs/ATTRIBUTES-MATRIX.md.');
