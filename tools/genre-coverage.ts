/**
 * Writes docs/GENRE-COVERAGE.md from the tables (`genreCoverage`), from 2026-10-10. Run: npx vite-node tools/genre-coverage.ts
 */

import { writeFileSync } from 'node:fs';
import { genreCoverage } from '../src/engine/content/genre-coverage';

writeFileSync('docs/GENRE-COVERAGE.md', genreCoverage());
console.log('Wrote docs/GENRE-COVERAGE.md.');
