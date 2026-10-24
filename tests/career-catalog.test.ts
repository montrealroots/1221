/**
 * The reference catalog held to its sources and to the page that lists it (brief 25,
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 2, C1 to C7; the register's PROV-01 to PROV-03 and
 * CAT-01 to CAT-12). Every field read from a page rests on words the register recorded from that page; companies are
 * named by the role their source gives; a performer is credited for the scope the source gives; no filming location is
 * taken from where a story is set; a disagreement keeps both sources and uses the later; and CATALOG.md is what
 * `tools/catalog.mjs` writes from the records today.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATALOG, COMPANIES, PAGES_READ, READ_ON, companiesAs, productionById, productionWords, type Field } from '@/engine/content/catalog';
// @ts-expect-error: a tool in JavaScript, run by vite-node; vitest loads it the same way.
import { PAGE, fieldsOf, inventory, render } from '../tools/catalog.mjs';

interface Source { id: string; status: string; published: string | null; facts: { quote: string }[] }
const SOURCES: Source[] = JSON.parse(readFileSync('docs/verification/career-world-2026-10-23/sources.json', 'utf8')).sources;
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const holds = (source: string, words: string) => {
  const s = SOURCES.find((x) => x.id === source);
  return !!s && s.status === 'read' && s.facts.some((f) => squash(f.quote).includes(squash(words)));
};

describe('C1: every field is a reading, a conflict, an assumption or unknown, and a reading rests on its page’s words', () => {
  it('holds every read field, company, person, rating and cast line to words the register recorded from that page', () => {
    for (const p of CATALOG) {
      const cited = new Set<string>();
      const check = (what: string, source: string, words: string) => { cited.add(source); expect(holds(source, words), `${p.title}, ${what}: ${source} “${words}”`).toBe(true); };
      for (const [name, f] of fieldsOf(p) as [string, Field<unknown>][]) {
        if (f.kind === 'read' || f.kind === 'conflict') check(name, f.source, f.words);
        if (f.kind === 'conflict') check(`${name} (against)`, f.against.source, f.against.words);
        if (f.kind === 'unknown') expect(f.why.length, `${p.title}, ${name}`).toBeGreaterThan(10);
      }
      for (const c of p.companies) check(`company ${c.company}`, c.source, c.words);
      for (const x of p.people) check(`person ${x.name}`, x.source, x.words);
      for (const r of p.ratings) check(`rating ${r.rating}`, r.source, r.words);
      for (const c of p.cast) check(`cast ${c.performer}`, c.source, c.words);
      for (const s of cited) expect(p.sources, `${p.title} cites ${s}`).toContain(s);
    }
  });

  it('records each page as read or unreadable, as the register does, read on the day the catalog says', () => {
    for (const r of PAGES_READ) expect(SOURCES.find((s) => s.id === r.source)?.status, r.source).toBe(r.result);
    for (const p of CATALOG) for (const id of p.sources) {
      const s = SOURCES.find((x) => x.id === id) as Source & { retrieved: string | null };
      if (s.status === 'read') expect(s.retrieved, id).toBe(READ_ON);
    }
  });

  it('says a production to a player as its pages had it, and what they don’t give as not given', () => {
    expect(productionWords(productionById('nine-one-one')!)).toEqual([
      'On the air: season 10 premiered October 15, 2026.',
      'Made by 20th Television, in association with Ryan Murphy Television and Brad Falchuk Teley-Vision; on ABC, streaming on Hulu.',
      'Created by Ryan Murphy, Brad Falchuk and Tim Minear; Tim Minear is the showrunner.',
      'Its cast: Angela Bassett as Athena Grant, Jennifer Love Hewitt as Maddie Han, Oliver Stark as Evan “Buck” Buckley, Kenneth Choi as Howie “Chimney” Han, Aisha Hinds as Henrietta “Hen” Wilson, Ryan Guzman as Eddie Diaz, Gavin McHugh as Christopher Diaz, Corinne Messiah as May Grant and Elijah M. Cooper as Harry Grant.',
      'Where it films and how long its episodes run aren’t in the pages the game read.',
      'Read from its official pages on October 23, 2026.',
    ]);
  });
});

describe('C2: companies apart, each by its role', () => {
  it('names the producer, the broadcaster and the platform apart: See-Saw Films makes Slow Horses for Apple TV; 20th Television makes 9-1-1, which ABC airs and Hulu streams', () => {
    const ids = new Set(COMPANIES.map((c) => c.id));
    for (const p of CATALOG) for (const c of p.companies) expect(ids.has(c.company), c.company).toBe(true);
    const sh = productionById('slow-horses')!;
    expect([companiesAs(sh, 'producer'), companiesAs(sh, 'streaming-platform')]).toEqual([['See-Saw Films'], ['Apple TV']]);
    const nine = productionById('nine-one-one')!;
    expect([companiesAs(nine, 'producer'), companiesAs(nine, 'in-association'), companiesAs(nine, 'broadcaster'), companiesAs(nine, 'streaming-platform')]).toEqual([['20th Television'], ['Ryan Murphy Television', 'Brad Falchuk Teley-Vision'], ['ABC'], ['Hulu']]);
    expect(companiesAs(productionById('abbott-elementary')!, 'producer')).toEqual(['Warner Bros. Television', '20th Television']);
    // Amazon MGM Studios releases its slate; Orion Pictures and United Artists are the labels the slate names, and the
    // catalog says nothing of who owns whom.
    expect(companiesAs(productionById('highlander')!, 'studio-label')).toEqual(['United Artists']);
  });
});

describe('C3 to C5: the records, their credits and what isn’t known', () => {
  it('holds the four series and the slate’s twelve films', () => {
    expect(CATALOG.filter((p) => p.format === 'series').map((p) => p.title)).toEqual(['9-1-1', 'Slow Horses', 'Severance', 'Abbott Elementary']);
    expect(CATALOG.filter((p) => p.format === 'film')).toHaveLength(12);
  });

  it('credits a performer for the scope the page gives, and a character only where the page names it', () => {
    const sh = productionById('slow-horses')!;
    expect(sh.cast.find((c) => c.performer === 'Olivia Cooke')).toMatchObject({ scope: { kind: 'season', n: 6 }, character: { kind: 'read', value: 'Sidonie “Sid” Baker' } });
    expect(sh.cast.find((c) => c.performer === 'Kristin Scott Thomas')).toMatchObject({ scope: { kind: 'season', n: 6 }, character: { kind: 'unknown' } });
    const sev = productionById('severance')!;
    expect(sev.cast.filter((c) => c.character.kind === 'read').map((c) => c.performer)).toEqual(['Adam Scott']);
    expect(sev.cast.filter((c) => c.character.kind === 'unknown')).toHaveLength(10);
  });

  it('takes no filming location from where a story is set: every one is unknown, since no page read gives one', () => {
    for (const p of CATALOG) expect(p.filming.kind, p.title).toBe('unknown');
  });
});

describe('C6 and C7: the inventory, and a disagreement kept', () => {
  it('uses the later of two dates for I Play Rocky and keeps the earlier', () => {
    const f = productionById('i-play-rocky')!.release;
    expect(f.kind).toBe('conflict');
    if (f.kind !== 'conflict') return;
    const pub = (id: string) => SOURCES.find((s) => s.id === id)!.published!;
    expect(pub(f.source) > pub(f.against.source)).toBe(true);
    expect([f.value, f.against.value]).toEqual(['November 6, 2026 in select theaters, everywhere later in November', 'November 20, 2026']);
  });

  it('works the inventory out from the pages and the records: none of its figures typed', () => {
    const inv = inventory();
    expect(inv.imported).toEqual(inv.discovered.filter((t: string) => CATALOG.some((p) => p.title === t)));
    expect(inv.discovered.length).toBe(inv.imported.length + inv.notImported.length);
    expect(inv.unresolved.map((u: { source: string }) => u.source)).toEqual(['S88', 'S86', 'S83']);
  });

  it('is what tools/catalog.mjs writes (npx vite-node tools/catalog.mjs --write)', () => {
    expect(readFileSync(PAGE as string, 'utf8')).toBe((render() as { text: string }).text);
  });

  it('claims no more than it read: not every current production, only the four series and the one slate (CAT-04)', () => {
    const { text } = render() as { text: string };
    expect(text).toContain('It isn’t every current production: it’s the four series the brief names and the one studio slate this build read.');
    // The one slate is Amazon MGM Studios'; Universal's page loads its films only in a browser, unresolved.
    expect(new Set(CATALOG.filter((p) => p.format === 'film').flatMap((p) => p.sources))).toEqual(new Set(['S82', 'S110']));
  });
});
