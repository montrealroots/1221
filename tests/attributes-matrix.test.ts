/**
 * The connected attributes' matrix (`docs/ATTRIBUTES-MATRIX.md`) is the
 * tables' own output (`attributesMatrix`), and every item in it is wired:
 * every interest and genre has its definition, every ability its saved
 * place and reader. Rewrite it with `npx vite-node tools/attributes-matrix.ts`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { attributesMatrix } from '@/engine/content/attributes-matrix';

describe('the itemized matrix', () => {
  it('is what the tables say, row for row, with no item left unwired', () => {
    const doc = readFileSync('docs/ATTRIBUTES-MATRIX.md', 'utf8');
    const built = attributesMatrix();
    expect(doc).toBe(built);
    expect(built).toContain('## Abilities: 12 of 12');
    expect(built).toContain('## Techniques: 17 of 17');
    expect(built).toContain('## Interests: 64 of 64');
    expect(built).toContain('## Genres: 149 of 149');
    expect(built).not.toMatch(/\| none \| none \| none \|/);
  });
});
