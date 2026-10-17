/**
 * A passport's page and Papers said you travel on it, until 2026-10-12. Nothing in SLATE has crossed a border since the
 * scope reset of 2026-10-09, and applying for a visa or a travel authorization went that day, yet the passport's page
 * (`ui/looks/papers.tsx`) said "It’s the passport you travel on" and, of a second one in force, "another passport is the
 * one you travel on"; a visa's or an authorization's page said "It lets you into" its country; and Papers'
 * Your Passport (`ui/papers/Documents.tsx`) said a passport is "Needed to cross a border", Going Abroad answered "You may
 * go.", and Residence Abroad said a naturalized life travels on its birth passport. They now say what reads it:
 * the passport is the one in force in your name, its entry count is a reading, a visa would let you in, and what asks
 * for a passport is a new bank (`photoIdOf`, read by `bank.switch`) and the Social Security office (`ssnRefusal`).
 *
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand, and say so. The Papers screen is rendered to
 * markup (react-dom/server) over a real save, with `useGame` standing in for the provider, which needs a browser.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { documentsOf, mayEnter, passportOf, photoIdOf, type PersonDocument } from '@/engine/systems/documents';
import { ssnRefusal } from '@/engine/systems/taxid';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { PassportPane, WorkPane } = await import('@/ui/papers/Documents');

const YEAR = 365.25 * MS_DAY;
/** A New Yorker with no papers yet, so each test hands it exactly the ones it means. */
const life = (seed: string) => { const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
};

/** The words a node shows. */
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
const look = (sim: Simulation, id: string): Looked => {
  const found = resolveLook(sim, at('document', id));
  if (!found || 'gone' in found) throw new Error(`document:${id} didn’t resolve`);
  return found;
};
const page = (sim: Simulation, id: string) => text(look(sim, id).body);
const markup = (sim: Simulation, pane: () => ReactNode) => { h.sim = sim; return renderToStaticMarkup(createElement(pane)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
const papers = (sim: Simulation) => markup(sim, PassportPane);

describe('PLAYER JOURNEY: a passport applied for and issued, and its page', () => {
  it('names it the passport in force in your name, its entry count a reading, and says nothing travels', () => {
    const sim = life('g25-passport');
    rest(sim);
    // Before it comes, Papers says what asks for a passport, not that it crosses a border.
    expect(passportOf(sim.player, sim.now)).toBeUndefined();
    const before = papers(sim);
    expect(before).not.toMatch(/cross a border/i);
    expect(before).toContain('Asked by a new bank and the Social Security office');
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    rest(sim);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const passport = passportOf(sim.player, sim.now)!;
    expect(passport).toBeDefined();
    // What the note names is what reads it: a new bank takes it as photo ID, and the Social Security office asks no
    // more of it (for a citizen, it asks nothing at all: they hold a number).
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(passport.id);
    expect(ssnRefusal(sim, sim.player) ?? '').not.toMatch(/passport/);
    const words = page(sim, passport.id);
    expect(words).not.toMatch(/you travel on/);
    expect(words).toMatch(/It’s the passport in force in your name\. Of the \d+ countries SLATE has entry rules for, \d+ would let you in on it today for a week’s visit; nothing in SLATE travels since 2026-10-09\./);
    // Once it's in force, Papers' note is its number and end, as before.
    expect(papers(sim)).toContain(passport.number);
  });

  it('names an older one, still in force, as not the one in your name', () => {
    const sim = life('g25-older');
    rest(sim);
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    rest(sim);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    // FIXTURE: an older passport of the same country, in force and running out first, as a save from before a renewal
    // replaced it can hold. A renewal through the commands cancels the old one on the new one's day.
    const older: PersonDocument = { id: 'pp-older', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P0000001', status: 'valid', issuedAt: sim.now - 9 * YEAR, expiresAt: sim.now + 30 * MS_DAY };
    documentsOf(sim.player).push(older);
    expect(passportOf(sim.player, sim.now)?.id).not.toBe(older.id);
    const words = page(sim, older.id);
    expect(words).not.toMatch(/travel on/);
    expect(words).toContain('In force, but another passport is the one in force in your name.');
  });
});

describe('FIXTURE: a travel authorization held from before 2026-10-09', () => {
  it('would let you into its country: a reading, not a door', () => {
    const sim = life('g25-eta');
    rest(sim);
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    rest(sim);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const passport = passportOf(sim.player, sim.now)!;
    // FIXTURE: an ETA a save from before 2026-10-09 holds; applying for one went with travel.
    const eta: PersonDocument = { id: 'eta', kind: 'authorization', issuer: 'GB', name: 'ETA', number: 'E1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 2 * YEAR, destination: 'GB', passportId: passport.id };
    documentsOf(sim.player).push(eta);
    const looked = look(sim, eta.id);
    const words = text(looked.body);
    expect(words).not.toMatch(/It lets you into/);
    // With its article, as `theCountry` says it (from 2026-10-12: until then this asserted "into United Kingdom", the
    // look's `where` having skipped the article; tests/defects-r7-1.test.ts holds the article).
    expect(words).toMatch(/It would let you into the United Kingdom, and nothing else is missing for a week’s visit there\./);
    // FIXTURE: issued on a passport since replaced, it's in force but isn't on the one in your name, so a visit would
    // still ask for one: a visit that's read, not made.
    eta.passportId = 'pp-replaced';
    const short = page(sim, eta.id);
    expect(short).not.toMatch(/the visit still asks/);
    expect(short).toMatch(/It’s in force for the United Kingdom, but a week’s visit there would still ask more: /);
  });

  it('on Papers, Going Abroad says the country would let you in, not that you may go', () => {
    const sim = life('g25-abroad');
    rest(sim);
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    rest(sim);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const passport = passportOf(sim.player, sim.now)!;
    // FIXTURE: Australia's ETA, held from before 2026-10-09, for the country Going Abroad opens on (the first by name).
    documentsOf(sim.player).push({ id: 'au-eta', kind: 'authorization', issuer: 'AU', name: 'ETA', number: 'E2', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, destination: 'AU', passportId: passport.id });
    expect(mayEnter(sim.player, 'AU', sim.now).ok).toBe(true);
    const shown = papers(sim);
    expect(shown).not.toContain('You may go.');
    expect(shown).toContain('It would let you in for a week’s visit.');
  });

  it('GUARD: Going Abroad says a visa or an authorization isn’t applied for here, and the rule it shows decides nothing: `mayEnter` is read by Papers and a document’s page alone, by no system of the engine (brief 11, tax.s8.visas_authorizations, 2026-10-17)', () => {
    const sim = life('g25-abroad-rule');
    rest(sim);
    expect(papers(sim)).toContain('There’s no travel in SLATE since 2026-10-09, so a visa or an authorization isn’t applied for here: what each country asks is kept as what it is.');
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []));
    const readers = files('src').filter((f) => readFileSync(f, 'utf8').split('\n').some((line) => /\bmayEnter\(/.test(line) && !/function mayEnter\(/.test(line)));
    expect(readers.sort()).toEqual(['src/ui/looks/papers.tsx', 'src/ui/papers/Documents.tsx']);
  });
});

describe('PLAYER JOURNEY: Residence Abroad, on Papers’ Permission To Work', () => {
  it('says a naturalized life’s birth passport is the one in force in its name, not the one it travels on', () => {
    const sim = life('g25-residence');
    rest(sim);
    const shown = markup(sim, WorkPane);
    expect(shown).toContain('Residence Abroad');
    expect(shown).not.toMatch(/you travel on/);
    expect(shown).toContain('Naturalizing keeps the citizenship you were born with, and its passport stays the one in force in your name.');
  });
});
