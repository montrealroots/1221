/**
 * SLATE — ways of spending the same hours on practice briefs, compared on matched and held-out seeds (from 2026-10-12).
 * A first-year student (as made), with the calendar's commitments cleared and rested each morning (TEST SETUP: what's
 * measured is the hours, not the School around them), spends three hours a day for eight days, 24 in all, one way:
 *
 * - `tape-only`: a reading chosen, then taped every hour, no preparation;
 * - `prepare`: one brief prepared until every part is complete, taped, then the next;
 * - `train`: the same, with every other hour on practice of what recent work names (`practice.exercise`);
 * - `breadth`: a different brief every take, each prepared only by one Break It Down;
 * - `repeat`: one brief prepared once, then the same take every hour after (the exploit check).
 *
 * Measured at the end: the best take, the target brief's expected result fully prepared, the mean over 20 held-out briefs
 * fully prepared (transfer), the abilities' total gain, the genre practice credited, the hours by kind.
 *
 *   npx vite-node tools/brief-strategies.ts -- --seeds bs-0,bs-1,bs-2
 */
import { writeFileSync } from 'node:fs';
import { createSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '../src/engine/core/time';
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { ABILITY_DEFS } from '../src/engine/content/abilities';
import { abilityOf } from '../src/engine/systems/attributes';


import { exerciseFor } from '../src/engine/content/practice';
import { practiceRefusal } from '../src/engine/systems/practice';
import { preview, prepareRefusal, recordOf, requiredOf } from '../src/engine/systems/briefs';
import { adviceFor } from '../src/engine/systems/next-steps';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SEEDS = arg('seeds', 'bs-0,bs-1,bs-2').split(',');
const STRATS = ['tape-only', 'prepare', 'train', 'breadth', 'repeat'] as const;
type Strat = (typeof STRATS)[number];
const TARGET = 'brief-drama';
const HELD = BRIEFS.filter((b) => b.id !== TARGET).filter((_, i) => i % 7 === 3).slice(0, 20);

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'they/them' });
  sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 6, hour: 15 }, 'America/New_York'));
  return sim;
}
const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const morning = (sim: Simulation) => { clear(sim); Object.assign(sim.player.wellbeing, { energy: 90, stress: 20, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };
const best = (sim: Simulation, id: string) => { const b = BRIEF_BY_ID[id]!; return Math.max(...b.readings.map((r) => preview(sim, sim.player, b, r.id, {}).overall)); };
const bestReading = (sim: Simulation, id: string) => { const b = BRIEF_BY_ID[id]!; return b.readings.map((r) => ({ id: r.id, s: preview(sim, sim.player, b, r.id, {}).overall })).sort((x, y) => y.s - x.s)[0]!.id; };
const abilitySum = (sim: Simulation) => ABILITY_DEFS.reduce((s, d) => s + abilityOf(sim, sim.player, d.id), 0);

function complete(sim: Simulation, id: string): boolean {
  const rec = recordOf(sim.player, id);
  const req = requiredOf(BRIEF_BY_ID[id]!);
  return rec.prep.interpretation >= req.interpretation! && rec.prep.memorization >= req.memorization! && rec.prep.rehearsal >= req.rehearsal!;
}
/** One step on the part furthest from complete, or nothing. */
function step(sim: Simulation, id: string): boolean {
  const rec = recordOf(sim.player, id);
  const req = requiredOf(BRIEF_BY_ID[id]!);
  const short = (s: 'read' | 'lines' | 'rehearse') => 1 - rec.prep[s === 'read' ? 'interpretation' : s === 'lines' ? 'memorization' : 'rehearsal'] / (req[s === 'read' ? 'interpretation' : s === 'lines' ? 'memorization' : 'rehearsal'] ?? 1);
  const s = (['read', 'lines', 'rehearse'] as const).filter((x) => short(x) > 0 && !prepareRefusal(sim, sim.player, BRIEF_BY_ID[id]!, x)).sort((x, y) => short(y) - short(x))[0];
  return Boolean(s && sim.execute({ kind: 'brief.prepare', payload: { brief: id, step: s } }).ok);
}
function tape(sim: Simulation, id: string, takes: number[]): void {
  const b = BRIEF_BY_ID[id]!;
  if (!recordOf(sim.player, id).reading) sim.execute({ kind: 'brief.choose', payload: { brief: id, reading: bestReading(sim, id) } });
  const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: id } });
  if (r.ok) takes.push(r.value!.overall);
}
function train(sim: Simulation): boolean {
  const p = sim.player;
  const r = adviceFor(sim, p).find((x) => x.exercise);
  const e = r ? exerciseFor(r.target as never) : undefined;
  return Boolean(e && !practiceRefusal(sim, p, e) && sim.execute({ kind: 'practice.exercise', payload: { exercise: e.id } }).ok);
}

function run(seed: string, strat: Strat) {
  const sim = student(seed);
  const a0 = abilitySum(sim);
  const takes: number[] = [];
  const hours = { prepare: 0, tape: 0, train: 0 };
  let current = TARGET;
  let next = 0;
  for (let day = 0; day < 8; day += 1) {
    morning(sim);
    for (let h = 0; h < 3; h += 1) {
      const t0 = sim.now;
      const kind = ((): keyof typeof hours => {
        if (strat === 'tape-only') { tape(sim, current, takes); return 'tape'; }
        if (strat === 'repeat') { if (!complete(sim, current) && step(sim, current)) return 'prepare'; tape(sim, current, takes); return 'tape'; }
        if (strat === 'breadth') {
          if (!recordOf(sim.player, current).prep.interpretation && step(sim, current)) return 'prepare';
          tape(sim, current, takes); current = HELD[next++ % HELD.length]!.id; return 'tape';
        }
        if (strat === 'train' && (day * 3 + h) % 2 === 1 && train(sim)) return 'train';
        if (!complete(sim, current) && step(sim, current)) return 'prepare';
        tape(sim, current, takes); current = HELD[next++ % HELD.length]!.id; return 'tape';
      })();
      hours[kind] += (sim.now - t0) / MS_HOUR;
      clear(sim);
    }
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 7 + day, hour: 15 }, 'America/New_York') + 0 * MS_DAY);
  }
  const practice = Object.values(sim.player.engagement?.byGenre ?? {}).reduce((s, g) => s + g.practice, 0);
  return { seed, strat, takes: takes.length, bestTake: takes.length ? Math.max(...takes) : 0, meanTake: takes.length ? takes.reduce((s, x) => s + x, 0) / takes.length : 0, target: best(sim, TARGET), heldOut: HELD.reduce((s, b) => s + best(sim, b.id), 0) / HELD.length, abilityGain: abilitySum(sim) - a0, practice, hours };
}

const rows = SEEDS.flatMap((seed) => STRATS.map((s) => run(seed, s)));
const stats = (xs: number[]) => { const m = xs.reduce((a, x) => a + x, 0) / xs.length; const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); return `${m.toFixed(2)} (sd ${sd.toFixed(2)}, ${Math.min(...xs).toFixed(2)}–${Math.max(...xs).toFixed(2)})`; };
const md = [`Seeds ${SEEDS.join(', ')}; n = ${SEEDS.length} a cell. 24 hours each, three a day for eight days.`, '', '| Way | Takes | Best Take | Mean Take | Target Brief, Fully Prepared | 20 Held-Out Briefs | Abilities Gained | Genre Practice Credited | Hours Preparing / Taping / Training |', '|---|---|---|---|---|---|---|---|---|'];
for (const s of STRATS) {
  const r = rows.filter((x) => x.strat === s);
  md.push(`| ${s} | ${stats(r.map((x) => x.takes))} | ${stats(r.map((x) => x.bestTake))} | ${stats(r.map((x) => x.meanTake))} | ${stats(r.map((x) => x.target))} | ${stats(r.map((x) => x.heldOut))} | ${stats(r.map((x) => x.abilityGain))} | ${stats(r.map((x) => x.practice))} | ${['prepare', 'tape', 'train'].map((k) => (r.reduce((a, x) => a + x.hours[k as 'prepare'], 0) / r.length).toFixed(1)).join(' / ')} |`);
}
console.log(md.join('\n'));
if (process.argv.includes('--write')) writeFileSync(arg('write', ''), JSON.stringify({ seeds: SEEDS, rows, table: md }, null, 1));
