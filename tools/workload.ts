/**
 * SLATE — a student's term, in hours (from 2026-10-16, the owner's brief "Finish School Workload Balance"): what the
 * school schedules, what the work set asks to be prepared, and what the student actually did with each hour, played by
 * the policy `tools/lives.ts` plays (`tools/policy.ts`), one life, through the public commands.
 *
 * Supply: every hour of the life, by what took it: sleep (`life.sleep`), each kind of scheduled item the student had to
 * be at (classes, calls, shifts, partner rehearsals, performances), each command that took time (preparation by its
 * part, practice, looking after yourself), and what was left (idle, inside the policy's working hours or outside them).
 * Demand: each class piece set in the term, the hours its parts take to reach what completes them from nothing, at a
 * day's full focus, by the template's cheapest step for each part (the partner part by a rehearsal with the partner, or
 * by a reader where there's none). And at each showing, each part's level against what completes it.
 *
 *   npx vite-node tools/workload.ts -- --seed lives-0 --profile london --years 1.4 [--policy attentive|neglect] [--out f.json]
 */
import { writeFileSync } from 'node:fs';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts } from '../src/engine/core/time';
import { templateById } from '../src/engine/content/coursework';
import { courseworkOf, workContext, READER, type Assignment } from '../src/engine/systems/coursework';
import { suggestedSleep } from '../src/engine/systems/life';
import { breaches } from '../src/engine/core/invariants';
import { life, evening, freeHour, keepCovered, lookAfter } from './policy';

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
const SEED = arg('seed', 'lives-0');
const YEARS = Number(arg('years', '1.4'));
const POLICY = arg('policy', 'attentive');
const PROFILES: Record<string, Record<string, unknown>> = {
  'new-york': { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' },
  'mexico-city': { homeRegionId: 'mx-cmx-mexicocity', pronouns: 'he/him' },
  london: { homeRegionId: 'uk-eng-london', pronouns: 'they/them', personalityTraits: ['early_riser', 'curious'] },
  scraping: { homeRegionId: 'us-ca-losangeles', pronouns: 'he/him', wealth: 'scraping', family: undefined },
};
const PROFILE = arg('profile', 'london');

const sim0 = life(SEED, PROFILES[PROFILE] as never);
const sim: Simulation = sim0;
const end = sim.now + YEARS * 365 * MS_DAY;
const r1 = (x: number) => Math.round(x * 10) / 10;
type Bucket = Record<string, number>;
const byTerm = new Map<number, Bucket>();
const termNow = () => sim.player.school?.termsBegun ?? 0;
const add = (k: string, h: number) => { const b = byTerm.get(termNow()) ?? {}; b[k] = (b[k] ?? 0) + h; byTerm.set(termNow(), b); };
// What a command did with the time: its kind, and a step of preparation by its part.
const exec = sim.execute.bind(sim);
sim.execute = ((c: { kind: string; payload?: Record<string, unknown> }) => {
  const before = sim.now;
  const r = exec(c as never);
  const h = (sim.now - before) / MS_HOUR;
  if (h > 0) {
    let k = c.kind;
    if (c.kind === 'school.prepare') {
      const a = courseworkOf(sim, sim.player)?.assignments.find((x) => x.id === c.payload?.assignmentId);
      const act = a ? templateById(a.template)?.activities.find((x) => x.id === c.payload?.activity) : undefined;
      k = `prepare:${c.payload?.activity === READER.id ? 'reader' : act?.dim ?? '?'}`;
    }
    add(k, h);
  }
  return r;
}) as typeof sim.execute;
// Scheduled items the student was at, as each is done: by kind (and a call's own kind), counted once.
const seen = new Set<string>();
const scanItems = () => {
  for (const it of sim.universe.scheduled) {
    if (seen.has(it.id) || !it.requiresPlayer || !it.durationMinutes || (it.status !== 'done' && it.status !== 'missed')) continue;
    seen.add(it.id);
    if (it.payload.personId !== undefined && it.payload.personId !== sim.player.id) continue;
    const kind = `${it.status === 'missed' ? 'missed ' : ''}${it.kind}${typeof it.payload.call === 'string' ? `:${it.payload.call}` : ''}`;
    add(`at:${kind}`, it.durationMinutes / 60);
  }
};
for (const it of sim.universe.scheduled) if (it.status === 'done' || it.status === 'missed') seen.add(it.id);

let hours = 0;
while (sim.now < end && sim.universe.meta.endedAt === undefined && !['dismissed', 'graduated', 'withdrawn'].includes(sim.player.school?.standing ?? '')) {
  const hour = zonedParts(sim.now, sim.zone).hour;
  const before = sim.now;
  if (POLICY === 'attentive') {
    lookAfter(sim);
    if (hour === 12) keepCovered(sim);
    if (hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
    const weekend = [0, 6].includes(new Date(sim.now).getUTCDay());
    if (hour >= (weekend ? 10 : 15) && hour < 22 && freeHour(sim)) { scanItems(); hours += (sim.now - before) / MS_HOUR; continue; }
  } else {
    // The control: looked after, the evening's answers given, nothing prepared and no part worked.
    lookAfter(sim);
    if (hour === 12) keepCovered(sim);
  }
  if ((hour >= 23 || hour < 5) && (sim.player.awakeSince ?? 0) <= sim.now) {
    const r = sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } });
    if (r.ok) { scanItems(); hours += (sim.now - before) / MS_HOUR; continue; }
  }
  sim.advanceTo(sim.now + MS_HOUR);
  scanItems();
  const step = (sim.now - before) / MS_HOUR;
  hours += step;
  // An hour nothing took: inside the policy's working hours or outside them.
  const w = [0, 6].includes(new Date(before).getUTCDay());
  if (!sim.universe.scheduled.some((it) => it.requiresPlayer && it.durationMinutes && it.at < sim.now && it.at + it.durationMinutes * 60_000 > before && (it.status === 'done'))) add(hour >= (w ? 10 : 15) && hour < 22 ? 'idle:working-hours' : 'idle:other', step);
}

// Demand: each piece set in a term, the hours its parts take to complete from nothing at full focus, and where its parts
// stood at the showing.
const steps = (gain: number, need: number) => { let n = 0; let p = 0; while (p < need - 1e-9 && n < 99) { p += gain * (1 - p); n += 1; } return n; };
const demand = new Map<number, { pieces: number; hours: number; partnerHours: number; byPart: Bucket; atShowing: Bucket[] }>();
for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) {
  const t = templateById(a.template)!;
  const d = demand.get(a.term) ?? { pieces: 0, hours: 0, partnerHours: 0, byPart: {}, atShowing: [] };
  d.pieces += 1;
  const required = workContext(a as Assignment, {}, {}).required as Record<string, number>;
  const dims = [...new Set(t.activities.map((x) => x.dim))];
  for (const dim of dims) {
    const need = required[dim] ?? 0.9;
    const ways = t.activities.filter((x) => x.dim === dim).map((x) => (steps(x.gain, need) * x.minutes) / 60);
    if (dim === 'partner') ways.push((steps(READER.gain, need) * READER.minutes) / 60);
    const h = Math.min(...ways);
    d.hours += h;
    if (dim === 'partner') d.partnerHours += h;
    d.byPart[dim] = (d.byPart[dim] ?? 0) + h;
  }
  if (a.shown) d.atShowing.push(Object.fromEntries(dims.map((dim) => [dim, r1(((a.prep as Record<string, number>)[dim] ?? 0) / (required[dim] ?? 0.9))])));
  demand.set(a.term, d);
}
const out = {
  seed: SEED, profile: PROFILE, policy: POLICY, ended: new Date(sim.now).toISOString().slice(0, 10), standing: sim.player.school?.standing, hours: r1(hours),
  terms: [...byTerm.keys()].sort((a, b) => a - b).map((t) => {
    const b = byTerm.get(t)!;
    const d = demand.get(t - 1);
    const shown = (courseworkOf(sim, sim.player)?.assignments ?? []).filter((a) => a.term === t - 1 && a.shown);
    const band = (a: Assignment) => (a.revision?.missed ? 'unready' : a.revision?.band ?? a.shown!.band);
    const short = (d?.atShowing ?? []).reduce((acc, x) => { for (const [k, v] of Object.entries(x)) if (v < 1) acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Bucket);
    return {
      termsBegun: t, supply: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, r1(v)]).sort()),
      demand: d ? { pieces: d.pieces, hoursToComplete: r1(d.hours), partnerHours: r1(d.partnerHours), byPart: Object.fromEntries(Object.entries(d.byPart).map(([k, v]) => [k, r1(v)])) } : undefined,
      shown: shown.length, unready: shown.filter((a) => band(a) === 'unready').length, partsShortAtShowing: short,
    };
  }),
  breaches: breaches(sim.universe).length,
};
console.log(JSON.stringify(out, null, 1));
const o = arg('out', '');
if (o) writeFileSync(o, `${JSON.stringify(out, null, 1)}\n`);
