/**
 * The classes a student leaves go on (limitations pass, 2026-10-11). Until then, a student who withdrew or was
 * dismissed left their class where it stood that day, its runs under way called off with the student's own calls, and a
 * first class a year ahead stopped too; and no class but the student's own had a Rep company or a Cabaret show. A life
 * withdraws in the spring of 2027, its Carlotta cast and in rehearsal, by the command, and is played on through the class's degree; nothing is put on the
 * save by hand.
 */
import { describe, expect, it } from 'vitest';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CABARET_RUN, COMPANY_KIND, actingOf, cabaretCompany, classPeriod, keyOf, meanCraft, ESTIMATE, formerProductions, repProduction } from '@/engine/systems/school';
import { FORMER_KIND } from '@/engine/systems/leave';
import { mateBusy } from '@/engine/systems/coursework';
import { life } from '../tools/policy';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);

function withdrawn(seed: string): Simulation {
  const sim = life(seed, { homeRegionId: 'us-ny-newyork' });
  sim.advanceTo(at(2027, 4, 7));
  const r = sim.execute({ kind: 'school.withdraw', payload: { confirm: true } });
  expect(r.error).toBeUndefined();
  return sim;
}

describe('the class a student leaves', () => {
  it('goes on without them through its degree, its runs under way into its record, with Cabaret shows', () => {
    let sim = withdrawn('left-1');
    const school = () => sim.player.school!;
    expect(school().standing).toBe('withdrawn');
    const c = () => school().formerClasses!.find((x) => x.leftBehind)!;
    // Kept as it was the day they left, the spring partly played: its class days from the next, its casts already made.
    expect(c().classOf).toBe(2029);
    expect(c().offset).toBe(0);
    expect(c().resume).toEqual({ term: 1, from: '2027-04-08' });
    expect(c().classmates.map((m) => m.name)).toEqual(school().classmates.map((m) => m.name));
    // Its runs under way stay on the calendar, the class's now; and its term's end, to be caught up there.
    const runs = pending(sim, COMPANY_KIND);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((i) => i.payload.classOf === 2029)).toBe(true);
    expect(pending(sim, FORMER_KIND)).toHaveLength(1);
    const before = meanCraft(c().classmates[0]!.craft);
    // The record of the class the student was in stays as they knew it.
    const known = JSON.stringify(school().classmates);

    sim = reload(sim);
    sim.advanceTo(at(2029, 6, 1));
    expect(c().graduatedAt).toBeDefined();
    expect(c().playedTo).toBe(5);
    expect(c().resume).toBeUndefined();
    expect(meanCraft(c().classmates[0]!.craft)).toBeGreaterThan(before);
    expect(JSON.stringify(school().classmates)).toBe(known);
    const prods = c().productions!;
    // The spring's runs, cast while the student was there, kept once each; then every term's own.
    expect(prods.filter((p) => p.term === 1).length).toBe(runs.length);
    for (let t = 2; t <= 5; t += 1) expect(prods.some((p) => p.term === t && !/Cabaret/.test(p.name))).toBe(true);
    // Cabaret shows, each with no more than the company's most, of classmates only.
    const shows = prods.filter((p) => /Yale Cabaret/.test(p.name));
    expect(shows.length).toBeGreaterThan(0);
    for (const s of shows) {
      expect(s.cast.length).toBeLessThanOrEqual(ESTIMATE.cabaretMates.most);
      expect(s.cast.every((m) => m.part === CABARET_RUN.part)).toBe(true);
    }
    // Said once, in the words for a class left.
    expect(sim.universe.notifications.filter((n) => n.title === 'The Class Of 2029 Graduates').map((n) => n.body)).toEqual([expect.stringMatching(/^The class you left has its degrees/)]);
    expect(pending(sim, FORMER_KIND)).toHaveLength(0);
    expect(sim.ledger.audit()).toEqual([]);
  }, 240_000);

  it('plays the same whether the years pass at once or are saved and opened on the way', () => {
    const once = withdrawn('left-2');
    once.advanceTo(at(2028, 1, 10));
    let split = withdrawn('left-2');
    for (const [y, m, d] of [[2027, 4, 20], [2027, 5, 20], [2027, 9, 20]] as const) { split.advanceTo(at(y, m, d)); split = reload(split); }
    split.advanceTo(at(2028, 1, 10));
    expect(JSON.stringify(split.player.school!.formerClasses)).toBe(JSON.stringify(once.player.school!.formerClasses));
  }, 240_000);

  it('ends the term left partway where the class a student stayed with ends it: the days had aren’t played again', () => {
    // Measured 2026-10-11 on two seeds: within 0.002 of the class a student stayed with, where playing the term's class
    // days from its start again put it about 0.8 ahead.
    const mean = (ms: { craft: Parameters<typeof meanCraft>[0] }[]) => ms.reduce((s, m) => s + meanCraft(m.craft), 0) / ms.length;
    const stayed = life('left-1', { homeRegionId: 'us-ny-newyork' });
    stayed.advanceTo(at(2027, 6, 1));
    const left = withdrawn('left-1');
    left.advanceTo(at(2027, 6, 1));
    const c = left.player.school!.formerClasses!.find((x) => x.leftBehind)!;
    expect(c.playedTo).toBe(1);
    expect(Math.abs(mean(c.classmates) - mean(stayed.player.school!.classmates))).toBeLessThan(0.1);
  }, 120_000);

  it('keeps a term left partway to the casts it had: a first fall left after its Cabaret show isn’t given another', () => {
    const sim = life('left-1', { homeRegionId: 'us-ny-newyork' });
    sim.advanceTo(at(2026, 12, 3));
    const week = sim.player.school!.around!.cabaretWeek!;
    expect(week < '2026-12-03').toBe(true);
    expect(sim.execute({ kind: 'school.withdraw', payload: { confirm: true } }).error).toBeUndefined();
    sim.advanceTo(at(2027, 2, 1));
    const c = sim.player.school!.formerClasses!.find((x) => x.leftBehind)!;
    expect(c.playedTo).toBe(0);
    expect((c.productions ?? []).filter((p) => p.term === 0)).toEqual([]);
  }, 120_000);

  it('keeps a classmate called that week out of the Cabaret show', () => {
    const sim = life('left-1', { homeRegionId: 'us-ny-newyork' });
    let shows = 0;
    for (let t = 0; t < 6; t += 1) {
      const p = classPeriod(t);
      const every = new Set<string>();
      for (let d = Date.UTC(p.from.year, p.from.month - 1, p.from.day); d <= Date.UTC(p.to.year, p.to.month - 1, p.to.day); d += 86_400_000) { const x = new Date(d); every.add(keyOf({ year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() })); }
      const cab = cabaretCompany(sim, sim.player, 'class-2029', t, 15, (i) => (i % 2 ? new Set() : every));
      if (cab) shows += 1;
      for (const i of cab?.members ?? []) expect(i % 2).toBe(1);
    }
    expect(shows).toBeGreaterThan(2);
  });

  it('plays a third-year fall’s best in the Rep’s company, out of the School’s productions, as the student’s own class does', () => {
    // No classmate of these lives reaches the Rep's bar without the student, so one is set at it, on a class of the
    // save's own: the rule, read alone.
    const sim = withdrawn('left-1');
    const c = sim.player.school!.formerClasses!.find((x) => x.leftBehind)!;
    const star = c.classmates[3]!;
    for (const k of Object.keys(star.craft) as (keyof typeof star.craft)[]) star.craft[k] = 90;
    expect(actingOf(star.craft)).toBeGreaterThanOrEqual(ESTIMATE.castAtRep);
    formerProductions(sim, sim.player, c, 4, 4);
    const four = c.productions!.filter((p) => p.term === 4);
    const rep = four.find((p) => p.name === repProduction(4).name)!;
    expect(rep.cast.map((m) => [m.name, m.part])).toEqual([[star.name, 'A Featured Part In The Company']]);
    // Not in a School production that term, and the Rep's weeks keep them out of its Cabaret show.
    for (const p of four.filter((x) => x !== rep)) expect(p.cast.some((m) => m.name === star.name)).toBe(false);
    expect(star.shown?.production).toBe(rep.name);
  }, 120_000);

  it('isn’t kept while the student is at the School, where the class at their side grows and has its Cabaret', () => {
    // The class is kept on the way out, and only then. Before it, a student in the School has no class behind them,
    // and the class at their side is the one that grows, its first fall's Cabaret show among the term's casts.
    const sim = life('left-3', { homeRegionId: 'us-ny-newyork' });
    sim.advanceTo(at(2026, 10, 14));
    expect(sim.player.school!.formerClasses ?? []).toHaveLength(0);
    const mate = sim.player.school!.classmates[0]!;
    const a = actingOf(mate.craft);
    sim.advanceTo(at(2026, 11, 14));
    expect(actingOf(sim.player.school!.classmates[0]!.craft)).toBeGreaterThan(a);
    const around = sim.player.school!.around!;
    expect(around.term).toBe(0);
    expect(around.cabaretWeek).toMatch(/^2026-/);
    const inShow = around.list.filter((x) => x.part === CABARET_RUN.part);
    expect(inShow.length).toBeGreaterThan(0);
    expect(inShow.length).toBeLessThanOrEqual(ESTIMATE.cabaretMates.most);
    expect(sim.universe.scheduled.some((i) => i.kind === COMPANY_KIND && String(i.payload.production).startsWith('Yale Cabaret'))).toBe(true);
    // A partner in the show is called its week's evenings from six, and isn't held to a cast's afternoons all term.
    const i = sim.player.school!.classmates.findIndex((m) => m.name === inShow[0]!.name);
    const [y, m, d] = around.cabaretWeek!.split('-').map(Number) as [number, number, number];
    expect(mateBusy(sim.player, i, at(y, m, d, 19), 90)).toMatch(/Cabaret show this week/);
    expect(mateBusy(sim.player, i, at(y, m, d, 16), 90)).toBeUndefined();
    expect(mateBusy(sim.player, i, at(y, m, d + 7, 19), 90)).toBeUndefined();
  }, 120_000);
});
