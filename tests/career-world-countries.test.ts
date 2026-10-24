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
/**
 * Brief 27's research register (from 2026-10-24): the pages that build read, brief 25's unread ones among them under their
 * `b25-` ids, each as a source here with its facts. A route read then cites one of these.
 */
interface Read { id: string; url: string; status: string; retrieved?: string; updated?: string | null; establishes: { fact: string; quote: string }[] }
const READ: Read[] = JSON.parse(readFileSync('docs/verification/career-universe-2026-10-24/research/register.json', 'utf8')).sources;
const sourceOf = (id: string): Source | undefined => SOURCES.find((x) => x.id === id) ?? (() => {
  const r = READ.find((x) => x.id === id);
  return r ? { id: r.id, url: r.url, status: r.status, retrieved: r.retrieved?.slice(0, 10) ?? null, published: r.updated ?? null, facts: r.establishes.map((f) => ({ field: '', value: f.fact, quote: f.quote })) } : undefined;
})();
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('W1: the registry, held to its sources', () => {
  it('names only sources in the register; a verified country has a route, a partly researched one sources and no route', () => {
    // Brief 25's register, or brief 27's (from 2026-10-24), where a source brief 27 read is a page read with its facts.
    const ids = new Set([...SOURCES.map((s) => s.id), ...READ.map((r) => r.id)]);
    for (const j of Object.values(JURISDICTIONS)) {
      for (const id of j.sources) expect(ids.has(id), `${j.name}: ${id}`).toBe(true);
      for (const id of j.sources.filter((x) => x.startsWith('b27-'))) expect([sourceOf(id)!.status, sourceOf(id)!.facts.length > 0], `${j.name}: ${id}`).toEqual(['read', true]);
      expect(COUNTRIES.get(j.country)?.iso2, j.name).toBe(j.iso);
      expect(j.gaps.length, j.name).toBeGreaterThan(0);
      if (j.research === 'verified') expect(j.routes.length).toBeGreaterThan(0);
      else expect([j.routes.length, j.sources.length > 0]).toEqual([0, true]);
    }
  });

  it('reads every route from a page this build read, on the day the register says, at its address', () => {
    for (const j of Object.values(JURISDICTIONS)) for (const r of j.routes) {
      const s = sourceOf(r.source.id)!;
      expect(s, r.id).toBeDefined();
      expect([s.status, s.url, s.retrieved, s.published]).toEqual(['read', r.source.url, r.source.read, r.source.updated ?? null]);
      // A brief 25 route's page is among its country's sources; a brief 27 one (`b27-`, `b25-` re-read) is the register's.
      if (SOURCES.some((x) => x.id === r.source.id)) expect(j.sources).toContain(r.source.id);
    }
  });

  it('gives each verified condition words its source recorded, and each assumption none', () => {
    for (const j of Object.values(JURISDICTIONS)) for (const r of j.routes) {
      for (const c of r.conditions) {
        if (c.basis === 'assumption') { expect(c.quote, `${r.id} ${c.id}`).toBeUndefined(); continue; }
        expect(c.quote, `${r.id} ${c.id}`).toBeDefined();
        // From its route's page, or the page it names (`from`, brief 27).
        const quotes = sourceOf(c.from ?? r.source.id)!.facts.map((f) => squash(f.quote));
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
    // The UK verified from 2026-10-24 (brief 27): until then one verified and six partly researched.
    expect(counts).toEqual({ verified: 2, partial: 5, unsupported: COUNTRIES.all().length - 8 });
    expect(readFileSync(PAGE as string, 'utf8')).toBe(text);
  });
});
