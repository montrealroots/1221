/**
 * SLATE — illness and injury against the same piece of work (from 2026-10-10): matched twins of one save, alike in
 * everything but the condition put on them, played to the same coursework showing by the same attentive student
 * (`tools/policy.ts`), through public commands and the clock.
 *
 * The save is played until a showing of the chosen template is set at least nine days ahead; from there each variant
 * is a twin of it. What's put on a twin is TEST SETUP, as `tools/lives.ts`'s pressure profile's is: the flu through
 * the game's own care (`careFor`, its toll on the body and its days), an injury of a named kind written onto the
 * record with its middle number of days. What follows from it, the refusals, the absence, the showing's judgement and
 * the recovery, is the game's. What it reports for each: whether the work was shown, when, its whole and each
 * dimension, the condition limits the evaluation named, readiness at the showing, what was refused that morning, and
 * the abilities against the healthy twin's afterwards.
 *
 *   npx vite-node tools/condition.ts -- --template movement-score --seed cond-0
 */
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { courseworkOf } from '../src/engine/systems/coursework';
import { careFor, healthOf } from '../src/engine/systems/health';
import { lookAfterRefusal } from '../src/engine/systems/life';
import { practiceRefusal } from '../src/engine/systems/practice';
import { abilitiesOf } from '../src/engine/systems/attributes';
import { EXERCISE_BY_ID } from '../src/engine/content/practice';
import { INJURY_KIND, type InjuryKind } from '../src/engine/content/injury';
import { attentiveHour, life } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const TEMPLATE = arg('template', 'movement-score');
const SEED = arg('seed', 'cond-0');

type When = 'start' | 'sixBefore' | 'eve' | 'morning';
interface Variant { name: string; when?: When; put?: 'flu' | InjuryKind; sick?: boolean; endsBeforeShowing?: boolean }
const VARIANTS: Variant[] = [
  { name: 'healthy' },
  { name: 'flu at the showing', when: 'eve', put: 'flu' },
  { name: 'flu, called in sick', when: 'eve', put: 'flu', sick: true },
  { name: 'flu, recovering (over the day before)', when: 'sixBefore', put: 'flu' },
  { name: 'flu, recovered (nine days before)', when: 'start', put: 'flu' },
  { name: 'sprain at the showing', when: 'eve', put: 'sprain' },
  { name: 'sprain, called in sick', when: 'eve', put: 'sprain', sick: true },
  { name: 'back strain at the showing', when: 'eve', put: 'back' },
  { name: 'a deep cut at the showing', when: 'eve', put: 'cut' },
  { name: 'concussion at the showing', when: 'eve', put: 'concussion' },
  { name: 'sprain, recovered (nine days before)', when: 'start', put: 'sprain' },
];

const dateOf = (s: string) => { const [y, m, d] = s.split('-').map(Number); return { year: y!, month: m!, day: d! }; };
const dayKey = (sim: Simulation) => { const p = zonedParts(sim.now, sim.zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const atHour = (sim: Simulation, day: string, hour: number, plus = 0) => instantFromZoned({ ...dateOf(day), hour }, sim.zone) + plus * MS_DAY;

function put(sim: Simulation, what: 'flu' | InjuryKind) {
  if (what === 'flu') { careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now); return; }
  const spec = INJURY_KIND[what];
  const days = Math.round((spec.days[0] + spec.days[1]) / 2);
  healthOf(sim.player).injury = { kind: what, at: sim.now, until: sim.now + days * MS_DAY, ...(spec.offWork ? { offWorkUntil: sim.now + days * MS_DAY } : {}) };
}

function findStart(): { save: string; id: string; due: string } {
  const sim = life(SEED, { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' });
  const until = sim.now + 400 * MS_DAY;
  while (sim.now < until) {
    const cw = courseworkOf(sim, sim.player);
    const today = dayKey(sim);
    const a = cw?.assignments.find((x) => x.template === TEMPLATE && x.status === 'open' && (Date.parse(x.dueOn) - Date.parse(today)) / MS_DAY >= 9);
    if (a && zonedParts(sim.now, sim.zone).hour === 12) return { save: JSON.stringify(serialise(sim.universe)), id: a.id, due: a.dueOn };
    attentiveHour(sim);
  }
  throw new Error(`no ${TEMPLATE} set nine days ahead in 400 days`);
}

function playVariant(start: { save: string; id: string; due: string }, v: Variant) {
  let sim = loadSave(deserialise(JSON.parse(start.save)) as never);
  const marks: Record<When, number> = { start: sim.now, sixBefore: atHour(sim, start.due, 9, -6), eve: atHour(sim, start.due, 18, -1), morning: atHour(sim, start.due, 7) };
  let applied = false;
  const sickDays: string[] = [];
  let morning: Record<string, string | undefined> | undefined;
  const until = atHour(sim, start.due, 23) + 30 * MS_DAY;
  let reloads = 0;
  let lastReload = sim.now;
  const key = (k: string) => k.startsWith(`show:${sim.player.id}:${start.id}:`);
  while (sim.now < until) {
    if (v.put && v.when && !applied && sim.now >= marks[v.when]) {
      put(sim, v.put);
      applied = true;
    }
    // Called in sick each class morning from the showing's on, while the flu or the injury lasts.
    const h = zonedParts(sim.now, sim.zone).hour;
    if (v.sick && applied && sim.now >= marks.morning - 2 * 3600_000 && h === 7 && ((healthOf(sim.player).fluUntil ?? 0) > sim.now || (healthOf(sim.player).injury?.until ?? 0) > sim.now)) {
      const r = sim.execute({ kind: 'school.call_in_sick', payload: {} });
      sickDays.push(`${dayKey(sim)} ${r.ok ? 'excused' : r.error}`);
    }
    if (!morning && sim.now >= marks.morning && zonedParts(sim.now, sim.zone).hour >= 7) {
      morning = {
        workout: lookAfterRefusal(sim, 'exercise'),
        movementPractice: practiceRefusal(sim, sim.player, EXERCISE_BY_ID['movement-work']),
        voicePractice: practiceRefusal(sim, sim.player, EXERCISE_BY_ID['voice-work']),
        fluUntil: (healthOf(sim.player).fluUntil ?? 0) > sim.now ? 'ill' : undefined,
        injury: healthOf(sim.player).injury && healthOf(sim.player).injury!.until > sim.now ? healthOf(sim.player).injury!.kind : undefined,
      };
    }
    if ((sim.player.work ?? []).some((w) => key(w.inputs.key))) break;
    attentiveHour(sim);
    if (sim.now - lastReload >= 7 * MS_DAY) { sim = loadSave(deserialise(serialise(sim.universe)) as never); reloads += 1; lastReload = sim.now; }
  }
  const rec = (sim.player.work ?? []).find((w) => key(w.inputs.key));
  const a = courseworkOf(sim, sim.player)?.assignments.find((x) => x.id === start.id);
  return {
    variant: v.name,
    shown: rec ? rec.inputs.key.split(':').at(-1) : null,
    movedFrom: a && rec && rec.inputs.key.split(':').at(-1) !== start.due ? start.due : undefined,
    status: a?.status,
    overall: rec?.overall ?? null,
    band: rec?.band,
    dims: rec?.dims,
    conditionLimits: rec?.limits.filter((l) => l.kind === 'condition').map((l) => `${l.dimension}: ${l.label} (−${l.by})`),
    readiness: rec ? Math.round(rec.inputs.condition.readiness * 10) / 10 : null,
    prep: rec ? Object.fromEntries(Object.entries(rec.inputs.prep).map(([k, x]) => [k, Math.round(x * 100) / 100])) : null,
    sickDays,
    condition: rec?.inputs.condition,
    morning,
    days: { classDays: sim.player.school?.tally.classDays, attended: sim.player.school?.tally.attended, excused: sim.player.school?.tally.excused },
    abilities: abilitiesOf(sim, sim.player),
    breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads,
  };
}

const start = findStart();
const out = VARIANTS.map((v) => playVariant(start, v));
const healthy = out[0]!;
for (const r of out) {
  // What the condition left of the abilities against the healthy twin's, to a tenth: an illness or an injury lowers none.
  const lower = Object.entries(r.abilities).filter(([k, x]) => k !== 'stamina' && x < (healthy.abilities as Record<string, number>)[k]! - 0.1).map(([k, x]) => `${k} ${x.toFixed(2)} < ${(healthy.abilities as Record<string, number>)[k]!.toFixed(2)}`);
  console.log(JSON.stringify({ template: TEMPLATE, seed: SEED, due: start.due, ...r, abilities: undefined, staminaVsHealthy: Math.round((r.abilities.stamina - healthy.abilities.stamina) * 100) / 100, abilitiesLowerThanHealthy: lower }));
}
