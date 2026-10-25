/**
 * Brief 27, K8 (2026-10-25): Productions And People, the industry reference (Part 16; loop 48: "Player opens a project,
 * person, company, season, or episode → sees verified information and clearly marked simulation developments → follows
 * relationships to related records → sees the player's involvement and relevant history → reaches legitimate available
 * actions where appropriate → returns without losing navigation context. Keep public information separate from
 * confidential casting access").
 *
 * Held here: a real production's page says each field its official pages gave, tagged Verified, and what they didn't as Not
 * Given with why, and links to its companies and people, whose pages link back; a part the game drew from a real production
 * is on its page only once it's posted to the player, and said to be the game's; a project nobody posted to the player has
 * no page, and a production's page names only the player's own part, never another the slate is casting; the player's part,
 * its work, its credit and its history on its project's page, with the series, the season and the episode its shoot fell on
 * a link away; a season's audience shown only once the season has finished, a published chart's week only once it's ended,
 * and a shelved release only once the player's been told; an agent the game invents only once the player has met them;
 * Find; and on the Career screen, the trail of pages kept while another tab is open, and an action that opens that tab.
 *
 * PLAYER JOURNEY: a graduate played by the clock, the Desk Clerk on The Calloway Files accepted through the command, prepared
 * and played (tests/fakes/b27-awards.ts), and the clock moved on. TEST SETUP, said where it's done: a posting written as
 * an agent's office posts one; a release's fate written as a slate production's draw writes one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CATALOG, productionById } from '@/engine/content/catalog';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { SERIES, addSeries, episodeDays, type SeriesTemplate } from '@/engine/content/series';
import { audienceWords, decisionWords, decisionsTo, seasonAudience } from '@/engine/systems/series';
import { productionsOf } from '@/engine/systems/slate';
import type { Opportunity } from '@/engine/systems/pro';
import { CHARTED, creditWords, metParts, pageOf, refFind, refIndex, type RefKey, type RefPage } from '@/engine/systems/reference';
import { at, graduate, played, reload } from './fakes/career-world';
import { clerk, submitted } from './fakes/b27-awards';
import { actorRecapWords } from '@/engine/systems/actorawards';
import { recapWords } from '@/engine/systems/awards';

// The Career screen drawn over a save, as tests/b27-audience.test.ts draws it: `useGame` standing in for the provider, and
// the kept values read from the real store the screens keep them in, so a tab and a trail set by one control are what
// the next drawing reads.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(real.kept<T>(key) ?? initial), (v: T) => real.keep(key, v)] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const { STACK_KEY, openReference } = await import('@/ui/career/ReferencePane');
const { keep, kept } = await import('@/ui/kept');
const { tabKey } = await import('@/ui/shell/sections');
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
function career(sim: Simulation): string {
  h.sim = sim;
  return words(renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })));
}

/** A page's words, every section's facts and each fact's tag, as one string to search. */
const text = (p: RefPage | undefined): string => (p ? [p.title, p.what, ...p.sections.flatMap((s) => [s.title, ...s.facts.map((f) => `${f.label}: ${f.words}`)])].join(' | ') : '');
const section = (p: RefPage | undefined, title: string) => p?.sections.find((s) => s.title === title);
const factOf = (p: RefPage | undefined, title: string, label: string) => section(p, title)?.facts.find((f) => f.label === label);
const same = (a: RefKey | undefined, b: RefKey) => !!a && a.kind === b.kind && a.id === b.id && a.season === b.season && a.episode === b.episode;

describe('a real production’s page', () => {
  it('says each field its official pages gave, tagged Verified, and what they didn’t as Not Given; its companies and people link to pages that link back', () => {
    const sim = graduate('b27-reference-catalog');
    for (const p of CATALOG) {
      const page = pageOf(sim, sim.player, { kind: 'production', id: p.id })!;
      expect(page.known, p.id).toBe('verified');
      const stands = factOf(page, 'From Its Official Pages', 'Where It Stands')!;
      expect(stands.words, p.id).toBe(p.status.kind === 'unknown' ? p.status.why : String(p.status.value));
      expect(stands.known, p.id).toBe(p.status.kind === 'unknown' ? 'not-given' : 'verified');
      for (const [label, f] of [['Language', p.languages], ['Running Time', p.runtime], ['Where It’s Filmed', p.filming]] as const) {
        if (f.kind === 'unknown') expect(factOf(page, 'From Its Official Pages', label), `${p.id} ${label}`).toMatchObject({ words: f.why, known: 'not-given' });
      }
      for (const c of p.cast) {
        const f = section(page, 'Cast')!.facts.find((x) => x.label === c.performer)!;
        expect(f.known, `${p.id} ${c.performer}`).toBe(c.character.kind === 'unknown' ? 'not-given' : 'verified');
        if (c.character.kind !== 'unknown') expect(f.words).toContain(`As ${String(c.character.value)}`);
        // Followed: the person's page lists this production, and links back to it.
        const person = pageOf(sim, sim.player, f.to!)!;
        expect(person.sections[0]!.facts.some((x) => same(x.to, { kind: 'production', id: p.id })), `${c.performer} → ${p.id}`).toBe(true);
      }
      for (const c of p.companies) {
        const f = section(page, 'Companies')!.facts.find((x) => same(x.to, { kind: 'company', id: `catalog:${c.company}` }))!;
        expect(f.known).toBe('verified');
        const company = pageOf(sim, sim.player, f.to!)!;
        expect(company.sections[0]!.facts.some((x) => x.words === p.title && same(x.to, { kind: 'production', id: p.id })), `${c.company} → ${p.id}`).toBe(true);
      }
      // Its pages are the only thing it's said to hold.
      expect(page.what).toContain('The game holds only what those pages say');
    }
    expect(pageOf(sim, sim.player, { kind: 'production', id: 'not-a-production' })).toBeUndefined();
  });

  it('shows a published chart’s week only once that week has ended', () => {
    const sim = graduate('b27-reference-chart');
    const key: RefKey = { kind: 'production', id: Object.keys(CHARTED)[0]! };
    expect(section(pageOf(sim, sim.player, key), 'Published Charts')!.facts.map((f) => f.label)).toEqual(['Not Yet']);
    // Box Office Mojo's week of October 9 to 15, 2026 ends at its Thursday's close in New York.
    sim.advanceTo(at(2026, 10, 16, 9));
    const charts = section(pageOf(sim, sim.player, key), 'Published Charts')!.facts;
    expect(charts.map((f) => `${f.label}: ${f.words}`)).toContain('Domestic Weekly Box Office, October 9, 2026 to October 15, 2026: No. 2 in the United States and Canada: $17,501,351, as Box Office Mojo by IMDbPro published it');
    expect(charts.every((f) => f.known === 'verified')).toBe(true);
  }, 120_000);

  it('names a part the game drew from it only once that part is posted to the player, and says it’s the game’s own', () => {
    const sim = graduate('b27-reference-drawn');
    const key: RefKey = { kind: 'production', id: 'nine-one-one' };
    const t = projectById('nine-one-one-guest')!;
    expect(section(pageOf(sim, sim.player, key), 'In The Game')).toBeUndefined();
    expect(text(pageOf(sim, sim.player, key))).not.toContain(t.role.part);
    expect(refIndex(sim, sim.player)[0]!.entries.some((e) => same(e.key, key))).toBe(false);
    // TEST SETUP: the part posted to the player, as an agent's office posts one.
    const o: Opportunity = { id: sim.nextId('pro'), projectId: t.id, via: 'agent', status: 'open', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, history: [], counts: {} };
    sim.player.pro!.opportunities.push(o);
    const page = pageOf(sim, sim.player, key)!;
    expect(section(page, 'In The Game')!.facts).toEqual([{ label: t.role.part, words: `The game’s own character, in ${t.drawn!.season}. It isn’t a real casting notice, and no one at the real production is casting it.`, known: 'simulated' }]);
    expect(factOf(page, 'Your Part', 'The Posting')!.words).toContain('Posted to you, open until');
    expect(page.actions.map((a) => a.tab)).toEqual(['opportunities']);
    expect(refIndex(sim, sim.player)[0]!.entries.some((e) => same(e.key, key))).toBe(true);
  });
});

describe('the game’s own projects', () => {
  it('has no page for a project nobody posted to the player, and a production’s page names only the player’s part, never another the slate is casting', () => {
    const sim = graduate('b27-reference-slate');
    let found: { o: Opportunity; others: string[] } | undefined;
    for (let k = 0; k < 30 && !found; k += 1) {
      for (const o of sim.player.pro!.opportunities) {
        const t = projectById(o.projectId)!;
        if (!t.slate) continue;
        const production = productionsOf(sim, o.postedAt).find((p) => p.id === t.slate!.production);
        const posted = new Set(sim.player.pro!.opportunities.map((x) => x.projectId));
        const others = (production?.parts ?? []).filter((x) => !posted.has(x.id)).map((x) => x.role.part);
        if (others.length) { found = { o, others }; break; }
      }
      if (!found) played(sim, sim.now + 7 * MS_DAY);
    }
    expect(found, 'a slate production with a part not posted to the player').toBeDefined();
    const t = projectById(found!.o.projectId)!;
    const page = pageOf(sim, sim.player, { kind: 'project', id: t.slate!.production })!;
    expect(page.known).toBe('simulated');
    expect(text(page)).toContain(t.role.part);
    for (const other of found!.others) expect(text(page), other).not.toContain(other);
    // A fixed project the player has never been posted has no page at all.
    const never = PROJECTS.find((p) => !metParts(sim.player).some((m) => m.project === p.project) && !p.drawn)!;
    expect(pageOf(sim, sim.player, { kind: 'project', id: never.project })).toBeUndefined();
    expect(pageOf(sim, sim.player, { kind: 'company', id: `casting:${never.casting}` })).toBeUndefined();
  }, 300_000);

  it('links a company or casting office the game names, never one it only describes, such as a student film’s', () => {
    const sim = graduate('b27-reference-named');
    const t = projectById('paper-moons')!;
    // TEST SETUP: the student film posted to the player, as its call is posted.
    sim.player.pro!.opportunities.push({ id: sim.nextId('pro'), projectId: t.id, via: 'open', status: 'open', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, history: [], counts: {} });
    const page = pageOf(sim, sim.player, { kind: 'project', id: t.project })!;
    expect(factOf(page, 'The Project', 'Company')).toEqual({ label: 'Company', words: t.company, known: 'simulated' });
    expect(factOf(page, 'The Project', 'Casting')).toEqual({ label: 'Casting', words: t.casting, known: 'simulated' });
    expect(pageOf(sim, sim.player, { kind: 'company', id: `company:${t.company}` })).toBeUndefined();
    expect(pageOf(sim, sim.player, { kind: 'company', id: `casting:${t.casting}` })).toBeUndefined();
    expect(refIndex(sim, sim.player).flatMap((g) => g.entries).some((e) => e.words === t.company || e.words === t.casting)).toBe(false);
  });

  it('PLAYER JOURNEY: the Desk Clerk’s project shows the part, the work, the credit and what happened, and links to its company, its casting office, its series, the season and the episode its shoot fell on', () => {
    const { sim } = clerk('b27-reference-clerk');
    const e = sim.player.pro!.engagements[0]!;
    const key: RefKey = { kind: 'project', id: 'The Calloway Files' };
    const page = pageOf(sim, sim.player, key)!;
    expect(factOf(page, 'Your Part', 'Desk Clerk')!.known).toBe('yours');
    expect(factOf(page, 'Your Part', 'The Work')!.words).toMatch(/^Finished, October 12, 2026/);
    expect(factOf(page, 'Your Part', 'The Credit')!.words).toBe('Shot, not yet released');
    const happened = section(page, 'What Happened')!.facts.map((f) => f.words);
    expect(happened).toContain('Your first day as Desk Clerk in The Calloway Files.');
    // The posting and the work each keep the booking in the same words, said once.
    expect(happened.filter((w) => w.startsWith('You accepted Desk Clerk'))).toHaveLength(1);
    // Finished, so nothing on the Work tab; a credit on television, so its awards on Charts And Awards.
    expect(page.actions.map((a) => a.tab)).toEqual(['industry']);
    // Followed: the company, the casting office and the series.
    const company = pageOf(sim, sim.player, factOf(page, 'The Project', 'Company')!.to!)!;
    expect(company.sections[0]!.facts.some((f) => same(f.to, key))).toBe(true);
    const casting = pageOf(sim, sim.player, factOf(page, 'The Project', 'Casting')!.to!)!;
    expect(casting.title).toBe(projectById('calloway-files')!.casting);
    expect(casting.sections[0]!.facts.some((f) => same(f.to, key))).toBe(true);
    const series = pageOf(sim, sim.player, factOf(page, 'The Project', 'Series')!.to!)!;
    expect(section(series, 'Your Work In It')!.facts[0]!.words).toBe('Finished, in its eighth season');
    // The season the shoot was in, and the episode whose shoot its days fell on.
    const calloway = SERIES[0]!;
    const n = Array.from({ length: calloway.episodes }, (_, k) => k + 1).find((x) => episodeDays(calloway, 2026, x)[0]! <= e.days[0]!.from && e.days[0]!.from < episodeDays(calloway, 2026, x)[0]! + 7 * MS_DAY)!;
    const season = pageOf(sim, sim.player, section(series, 'Seasons')!.facts.find((f) => f.to?.season === 2026)!.to!)!;
    expect(section(season, 'Your Episodes')!.facts[0]!.words).toBe(`Finished: episode ${n}`);
    const episode = pageOf(sim, sim.player, section(season, 'Episodes')!.facts[n - 1]!.to!)!;
    expect(section(episode, 'You In It')!.facts[0]!.words).toBe('In it: your work days fall on its shoot.');
    expect(section(pageOf(sim, sim.player, { kind: 'episode', id: calloway.id, season: 2026, episode: n + 1 }), 'You In It')).toBeUndefined();
    // The player's own page: the credit, linking to the project.
    expect(pageOf(sim, sim.player, { kind: 'person', id: 'you' })!.sections[0]!.facts.some((f) => f.label === 'Desk Clerk, The Calloway Files' && same(f.to, key))).toBe(true);
    // Saved and loaded, the same pages: each is read from the save as it stands.
    const back = reload(sim);
    for (const k of [key, factOf(page, 'The Project', 'Series')!.to!, { kind: 'person', id: 'you' } as RefKey]) expect(text(pageOf(back, back.player, k)), k.id).toBe(text(pageOf(sim, sim.player, k)));
  }, 300_000);

  it('shows a season’s audience only once the season has finished', () => {
    const { sim } = clerk('b27-reference-audience');
    const calloway = SERIES[0]!;
    const seventh = pageOf(sim, sim.player, { kind: 'season', id: calloway.id, season: 2025 })!;
    const a = seasonAudience(sim, calloway, 2025)!;
    expect(factOf(seventh, 'The Season', 'Audience')!.words).toBe(`${audienceWords(a).replace(/^./, (c) => c.toUpperCase())}; critics ${a.critics} of 100`);
    const eighth = () => factOf(pageOf(sim, sim.player, { kind: 'season', id: calloway.id, season: 2026 }), 'The Season', 'Audience')!.words;
    expect(eighth()).toBe('Not measured until the season has finished.');
    // The eighth season ends in May 2027.
    sim.advanceTo(at(2027, 6, 2));
    const b = seasonAudience(sim, calloway, 2026)!;
    expect(eighth()).toBe(`${audienceWords(b).replace(/^./, (c) => c.toUpperCase())}; critics ${b.critics} of 100`);
    // A season not ordered and not yet renewed has no page.
    expect(pageOf(sim, sim.player, { kind: 'season', id: calloway.id, season: calloway.orderedThrough + 1 })).toBeUndefined();
  }, 300_000);

  it('lists a credit’s award entry on its project’s page in the words Charts And Awards uses, once there is one', () => {
    const { sim, c } = clerk('b27-reference-honor');
    const key: RefKey = { kind: 'project', id: 'The Calloway Files' };
    expect(section(pageOf(sim, sim.player, key), 'Awards And Festivals')).toBeUndefined();
    const g = submitted(sim, c);
    // The Emmy year's deadline passed on the way, its entry said as the Charts And Awards tab says it, beside the Actor Awards'.
    const facts = section(pageOf(sim, sim.player, key), 'Awards And Festivals')!.facts;
    expect(facts).toContainEqual({ label: 'The Actor Awards', words: actorRecapWords(sim.player, g), known: 'yours' });
    expect(sim.player.pro!.awards!.length).toBeGreaterThan(0);
    for (const a of sim.player.pro!.awards!) expect(facts).toContainEqual({ label: 'The Emmy Awards', words: recapWords(sim.player, a), known: 'yours' });
  }, 300_000);

  it('lists the network’s word once it’s said, and no season it canceled', () => {
    const sim = graduate('b27-reference-word');
    let s: SeriesTemplate | undefined;
    for (let n = 0; n < 200 && !s; n += 1) {
      const c: SeriesTemplate = { ...SERIES[0]!, id: `test-reference-word-${n}`, title: 'The Harrow Line', orderedThrough: 2021 };
      // Renewed once and canceled since, by 2026, with a word to come in May 2027: a revival's.
      const d = decisionsTo(sim, c, 2027);
      if (d.some((x) => x.what === 'canceled' && x.year <= 2026) && d.some((x) => x.what === 'renewed' && x.year <= 2026) && d.some((x) => x.year === 2027)) s = c;
    }
    // TEST SETUP: a series kept in the save, as the slate keeps one the player met (`keepProject`).
    addSeries([s!]);
    sim.player.pro!.series = { ...(sim.player.pro!.series ?? {}), [s!.id]: s! };
    const said = decisionsTo(sim, s!, 2027).filter((d) => d.at <= sim.now);
    expect(decisionsTo(sim, s!, 2027).length).toBeGreaterThan(said.length);
    const page = pageOf(sim, sim.player, { kind: 'series', id: s!.id })!;
    expect(section(page, 'The Network’s Word')!.facts.map((f) => f.words)).toEqual(said.map((d) => decisionWords(sim, s!, d)));
    const canceled = said.find((d) => d.what === 'canceled')!;
    expect(pageOf(sim, sim.player, { kind: 'season', id: s!.id, season: canceled.year })).toBeUndefined();
    expect(section(page, 'Seasons')!.facts.some((f) => f.to?.season === canceled.year)).toBe(false);
    const renewed = said.find((d) => d.what === 'renewed')!;
    expect(section(page, 'Seasons')!.facts.find((f) => f.to?.season === renewed.year)!.words).toMatch(/^Renewed; shot from /);
  });

  it('says a release is shelved only once the player has been told; the falsifiability twin on time says when it came out', () => {
    const shelved = clerk('b27-reference-shelved');
    const c = shelved.c;
    // TEST SETUP: the fate a slate production's draw writes (`RELEASE_FATE`), on the credit the wrap made.
    c.release = { kind: 'shelved' };
    expect(creditWords(shelved.sim, shelved.sim.player, c)).toBe('Shot, not yet released');
    const due = shelved.sim.universe.scheduled.find((i) => i.kind === 'pro.release' && i.refId === c.id && i.status === 'pending')!.at;
    shelved.sim.advanceTo(due + MS_HOUR);
    expect(creditWords(shelved.sim, shelved.sim.player, c)).toBe('Shot, and shelved by its distributor: it won’t be released');
    expect(factOf(pageOf(shelved.sim, shelved.sim.player, { kind: 'project', id: 'The Calloway Files' }), 'Your Part', 'The Credit')!.words).toBe('Shot, and shelved by its distributor: it won’t be released');
    const twin = clerk('b27-reference-shelved');
    const dueTwin = twin.sim.universe.scheduled.find((i) => i.kind === 'pro.release' && i.refId === twin.c.id && i.status === 'pending')!.at;
    twin.sim.advanceTo(dueTwin + MS_HOUR);
    expect(creditWords(twin.sim, twin.sim.player, twin.c)).toMatch(/^Released on /);
  }, 600_000);
});

describe('people, agencies and Find', () => {
  it('shows a real agent named on an office’s page from the start, and the agent the game invents only once the player has met them', () => {
    const sim = graduate('b27-reference-agents');
    const real = pageOf(sim, sim.player, { kind: 'person', id: 'agent:dan-patack' })!;
    expect(real.known).toBe('verified');
    expect(real.what).toContain('Whatever happens between you here is the game’s invention.');
    expect(Object.keys(sim.player.pro!.relations)).not.toContain('thomas-ashgrove');
    expect(pageOf(sim, sim.player, { kind: 'person', id: 'agent:thomas-ashgrove' })).toBeUndefined();
    expect(text(pageOf(sim, sim.player, { kind: 'company', id: 'agency:halberd-talent' }))).not.toContain('Thomas Ashgrove');
    // A real person named on a production's pages: only what the pages say, and nothing between them and the player.
    const minear = pageOf(sim, sim.player, { kind: 'person', id: 'real:Tim Minear' })!;
    expect(minear.sections[0]!.facts.map((f) => f.words)).toEqual(['Creator, for the series', 'Showrunner, for the series']);
    expect(minear.what).toContain('nothing between you and them happens in the game');
  });

  it('finds an entry by any part of its name, and nothing for what isn’t there', () => {
    const sim = graduate('b27-reference-find');
    expect(refFind(sim, sim.player, 'minear').map((e) => e.words)).toEqual(['Tim Minear']);
    expect(refFind(sim, sim.player, 'slow h').map((e) => e.key)).toEqual([{ kind: 'production', id: 'slow-horses' }]);
    expect(refFind(sim, sim.player, 'zzzz')).toEqual([]);
    expect(refFind(sim, sim.player, '   ')).toEqual([]);
    expect(productionById('slow-horses')).toBeDefined();
  });
});

describe('on the Career screen', () => {
  it('PLAYER JOURNEY: a role’s project opened from Opportunities, followed to its series; Charts And Awards opened as its action opens it, and coming back finds the same page and trail', () => {
    const { sim } = clerk('b27-reference-screen');
    // Opened as the role's Open Its Page opens it.
    openReference({ kind: 'project', id: 'The Calloway Files' });
    expect(kept(tabKey('/workspace/career'))).toBe('reference');
    const page = career(sim);
    expect(page).toContain('Back Productions And People › The Calloway Files');
    expect(page).toContain('Desk Clerk Yours');
    expect(page).toContain('Bright Harbor Television');
    expect(page).toContain('Open Charts And Awards');
    // Followed to the series, as its link does: the trail grows.
    keep(STACK_KEY, [...kept<RefKey[]>(STACK_KEY)!, { kind: 'series', id: 'calloway-files' }]);
    expect(career(sim)).toContain('Productions And People › The Calloway Files › The Calloway Files');
    // Another tab, as an action opens it, and back: the same page, the same trail.
    keep(tabKey('/workspace/career'), 'industry');
    expect(career(sim)).toContain('Your Recognition');
    keep(tabKey('/workspace/career'), 'reference');
    const again = career(sim);
    expect(again).toContain('Productions And People › The Calloway Files › The Calloway Files');
    expect(again).toContain('The Eighth Season Simulated');
    // The front page, the trail emptied.
    keep(STACK_KEY, []);
    const front = career(sim);
    for (const g of ['Your Work', 'Series', 'Productions The Game Read', 'Companies And Agencies', 'People']) expect(front).toContain(g);
    expect(front).toContain('It holds only these, never everything another listing has.');
  }, 300_000);
});
