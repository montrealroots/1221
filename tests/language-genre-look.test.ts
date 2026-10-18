/**
 * The genre look's words about the research, from 2026-10-17 (brief 14's json area, `docs/verification/language-2026-10-17/json/defects.md`,
 * D1 to D3). Until then a genre held low for any reason said "The research found this only in single examples", false
 * of all ten it reached; the applied genres' small print was headed "in the research's words" over the game's wording
 * of it; and the small print ran as one paragraph, some forty lines at 390 wide.
 *
 * Drawn as the game draws it (`resolveLook`, `ui/looks/actor.tsx`), on a new first-year, as the json area's own
 * `render-genre-looks` printed every genre.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { GENRE_DEMANDS, applied } from '@/engine/content/demands';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const sim = createSave(1, 'lang14-genre-look', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** The look's body as markup, and its small print's paragraphs as words. */
const drawn = (id: string) => {
  const l = resolveLook(sim, at('genre', id)) as Looked;
  const html = renderToStaticMarkup(createElement('div', null, l.body)).replace(/<!-- -->/g, '');
  const small = [...html.matchAll(/<p class="xs dim">(.*?)<\/p>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, ''));
  return { text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), small };
};

describe('the genre look says how the research holds what a genre asks', () => {
  it('says a genre the research holds low is held with low confidence, never that it rests on single examples', () => {
    const low = Object.keys(GENRE_DEMANDS).filter((id) => !applied(id) && !GENRE_DEMANDS[id]!.belongsTo && GENRE_DEMANDS[id]!.tags.length);
    expect(low).toHaveLength(10);
    for (const id of low) {
      const { text } = drawn(id);
      expect(text, id).toMatch(/The research holds this \([^)]+\) with low confidence, so the game doesn’t treat it as a requirement of the genre\. The small print below says why\./);
      expect(text, id).not.toContain('single examples');
    }
  });

  it('gives the small print as three paragraphs, the applied reasons headed in the game’s own words', () => {
    const { small } = drawn('adventure');
    expect(applied('adventure')).toBe(true);
    expect(small.slice(0, 3).map((p) => p.split(':')[0])).toEqual(['Why it’s applied', 'What the research says', 'Still uncertain']);
    expect(small.join(' ')).not.toContain('in the research’s words');
    // A genre held low has no reasons applied: two paragraphs.
    expect(drawn('chase').small.slice(0, 2).map((p) => p.split(':')[0])).toEqual(['What the research says', 'Still uncertain']);
  });
});
