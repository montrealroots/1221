/**
 * The countries' rules for screen work, held to their sources and to the page that lists them (brief 25,
 * `docs/verification/career-world-2026-10-23/criteria.md`, W1 and W2; the register's GEO-01, GEO-02, GEO-03 and GEO-12).
 * Every route's source is one this build read, at the address the source register holds, on the day it says; every
 * condition called verified carries words the source register recorded from that page, and every assumption carries
 * none; and the countries page is what `tools/countries.mjs` writes from the registry today.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '@/engine/content/geography';
import { JURISDICTIONS, gapWords, jurisdictionOf } from '@/engine/content/jurisdictions';
import { routeSourceWords } from '@/engine/systems/worktrip';
// @ts-expect-error: a tool in JavaScript, run by vite-node; vitest loads it the same way.
import { PAGE, render } from '../tools/countries.mjs';

interface Fact { field: string; value: string; quote: string }
interface Source { id: string; url: string; status: string; retrieved: string | null; published: string | null; facts: Fact[] }
const SOURCES: Source[] = JSON.parse(readFileSync('docs/verification/career-world-2026-10-23/sources.json', 'utf8')).sources;
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('W1: the registry, held to its sources', () => {
  it('names only sources in the register; a verified country has a route, a partly researched one sources and no route', () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    for (const j of Object.values(JURISDICTIONS)) {
      for (const id of j.sources) expect(ids.has(id), `${j.name}: ${id}`).toBe(true);
      expect(COUNTRIES.get(j.country)?.iso2, j.name).toBe(j.iso);
      expect(j.gaps.length, j.name).toBeGreaterThan(0);
      if (j.research === 'verified') expect(j.routes.length).toBeGreaterThan(0);
      else expect([j.routes.length, j.sources.length > 0]).toEqual([0, true]);
    }
  });

  it('reads every route from a page this build read, on the day the register says, at its address', () => {
    for (const j of Object.values(JURISDICTIONS)) for (const r of j.routes) {
      const s = SOURCES.find((x) => x.id === r.source.id)!;
      expect(s, r.id).toBeDefined();
      expect([s.status, s.url, s.retrieved, s.published]).toEqual(['read', r.source.url, r.source.read, r.source.updated ?? null]);
      expect(j.sources).toContain(r.source.id);
    }
  });

  it('gives each verified condition words its source recorded, and each assumption none', () => {
    for (const j of Object.values(JURISDICTIONS)) for (const r of j.routes) {
      const quotes = SOURCES.find((x) => x.id === r.source.id)!.facts.map((f) => squash(f.quote));
      for (const c of r.conditions) {
        if (c.basis === 'assumption') { expect(c.quote, `${r.id} ${c.id}`).toBeUndefined(); continue; }
        expect(c.quote, `${r.id} ${c.id}`).toBeDefined();
        expect(quotes.some((q) => q.includes(squash(c.quote!))), `${r.id} ${c.id}: “${c.quote}”`).toBe(true);
      }
    }
  });

  it('says where a route comes from, and what isn’t in the game, in sentences', () => {
    const au = JURISDICTIONS.au!;
    expect(routeSourceWords(au.routes[0]!)).toBe('From the department’s page as the game read it on October 23, 2026, last updated September 24, 2026.');
    expect(gapWords(au)).toBe('Not in the game yet: Australian tax on pay for work there; the agreements of MEAA, the Australian actors’ union, that a production there would use; and permanent residence and the other visas that let you work in Australia.');
    expect(gapWords(jurisdictionOf('br', 'Brazil'))).toBe('Not in the game yet: any of the rules for working there.');
  });
});

describe('W1: the countries page', () => {
  it('is what tools/countries.mjs writes from the registry (npx vite-node tools/countries.mjs --write)', () => {
    const { text, counts } = render() as { text: string; counts: Record<string, number> };
    expect(counts).toEqual({ verified: 1, partial: 6, unsupported: COUNTRIES.all().length - 8 });
    expect(readFileSync(PAGE as string, 'utf8')).toBe(text);
  });
});
