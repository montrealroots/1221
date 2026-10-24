/**
 * Brief 27's research register (2026-10-24, `docs/verification/career-universe-2026-10-24/research/`), and the owner's
 * word that day: "Verify previously unread sources before treating their claims as confirmed." Held here: the page is what
 * `register.mjs` writes; every entry says what came back when it was asked for, every attempt kept; a page not read
 * establishes nothing; a page read has its bytes' hash and the facts read from it, each with the page's own words; and
 * every brief 27 source the game cites is a page read with facts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JURISDICTIONS } from '@/engine/content/jurisdictions';
import { INDUSTRY_SOURCES } from '@/engine/content/industry';
// @ts-expect-error: the register's page writer, plain JavaScript without types.
import { PAGE, STATUSES, render } from '../docs/verification/career-universe-2026-10-24/research/register.mjs';

interface Entry {
  id: string; register: 'b25' | 'b27'; status: string; http: string; sha256: string; retrieved: string; url: string;
  attempts: { at: string; http: string }[]; establishes: { fact: string; quote: string }[];
}
const REG: { sources: Entry[] } = JSON.parse(readFileSync('docs/verification/career-universe-2026-10-24/research/register.json', 'utf8'));
const byId = new Map(REG.sources.map((e) => [e.id, e]));

describe('the research register', () => {
  it('is the page register.mjs writes from it', () => {
    expect(readFileSync(PAGE, 'utf8')).toBe(render(REG));
  });

  it('says what came back for each page asked for, and keeps every attempt', () => {
    expect(new Set(REG.sources.map((e) => e.id)).size).toBe(REG.sources.length);
    for (const e of REG.sources) {
      expect(STATUSES, e.id).toContain(e.status);
      expect(e.attempts.length, e.id).toBeGreaterThan(0);
      expect(e.url, e.id).toMatch(/^https?:\/\//);
    }
  });

  it('takes no claim from a page it didn’t read, and every fact from one it did, with its words and its bytes’ hash', () => {
    for (const e of REG.sources) {
      if (e.status !== 'read') { expect(e.establishes, e.id).toEqual([]); continue; }
      expect(e.http, e.id).toBe('200');
      expect(e.sha256, e.id).toMatch(/^[0-9a-f]{64}$/);
      expect(e.sha256, e.id).not.toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      for (const f of e.establishes) expect([f.fact.length > 10, f.quote.length > 5], e.id).toEqual([true, true]);
    }
  });

  it('asked again for every source brief 25 didn’t read, and says what each gave', () => {
    const b25: { sources: { id: string; status: string }[] } = JSON.parse(readFileSync('docs/verification/career-world-2026-10-23/sources.json', 'utf8'));
    for (const s of b25.sources.filter((x) => x.status !== 'read')) expect(byId.get(`b25-${s.id}`)?.status, s.id).toBeDefined();
  });

  it('holds every brief 27 source the game cites as a page read, with facts', () => {
    const cited = [
      ...Object.values(JURISDICTIONS).flatMap((j) => [...j.sources, ...j.routes.flatMap((r) => [r.source.id, ...r.conditions.flatMap((c) => (c.from ? [c.from] : []))])]),
      ...Object.values(INDUSTRY_SOURCES),
    ].filter((id) => id.startsWith('b27-') || id.startsWith('b25-'));
    expect(cited.length).toBeGreaterThan(5);
    for (const id of cited) expect([byId.get(id)?.status, (byId.get(id)?.establishes.length ?? 0) > 0], id).toEqual(['read', true]);
  });
});
