/**
 * SLATE — a body trained through the game's own commands (from 2026-10-10): what workouts do to fitness, which is the
 * Stamina ability, over a played school life.
 *
 * Each scenario is a student played as `tools/lives.ts` plays an attentive one (`tools/policy.ts`), who also works
 * out through `life.look_after` on a schedule: before classes at seven, or if that's refused, in the first free hour
 * of the afternoon or evening. Everything goes through public commands and the clock; nothing writes a dial. What it
 * reports is fitness and its ceiling over time, the days to reach the ceiling, how often a workout was refused and
 * why, what it cost in readiness, how the school went, and the work whose quality reads Stamina.
 *
 *   npx vite-node tools/fitness.ts -- --scenario daily --seed fit-0 --days 365 --birth 2001
 */
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { lookAfterRefusal, readiness, suggestedSleep } from '../src/engine/systems/life';
import { abilityFull } from '../src/engine/systems/attributes';
import { healthOf, careFor } from '../src/engine/systems/health';
import { INJURY_KIND, type InjuryKind } from '../src/engine/content/injury';
import { evening, freeHour, keepCovered, life, lookAfter } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SCENARIO = arg('scenario', 'daily');
const SEED = arg('seed', 'fit-0');
const DAYS = Number(arg('days', '365'));
const BIRTH = Number(arg('birth', '2001'));

/**
 * Which days a workout is planned, by the day of the life (0 the first): every day, three a week, a break, or none.
 * `return` trains every day for 150 days, rests 120, and trains again. `injured` and `ill` train daily and meet a
 * sprain or the flu on day 60 (TEST SETUP: the injury and the illness are put in, as `tools/lives.ts`'s pressure
 * profile puts them; the body's own path from them is the game's).
 */
const PLANS: Record<string, (day: number, weekday: number) => boolean> = {
  none: () => false,
  daily: () => true,
  'three-a-week': (_d, wd) => wd === 1 || wd === 3 || wd === 5,
  'two-a-week': (_d, wd) => wd === 2 || wd === 5,
  'twice-daily': () => true,
  return: (d) => d < 150 || d >= 270,
  injured: () => true,
  ill: () => true,
};

function hurt(sim: Simulation, kind: InjuryKind) {
  const spec = INJURY_KIND[kind];
  const days = Math.round((spec.days[0] + spec.days[1]) / 2);
  healthOf(sim.player).injury = { kind, at: sim.now, until: sim.now + days * MS_DAY, ...(spec.offWork ? { offWorkUntil: sim.now + days * MS_DAY } : {}) };
}

function run() {
  const plan = PLANS[SCENARIO];
  if (!plan) throw new Error(`no scenario ${SCENARIO}`);
  let sim = life(SEED, { homeRegionId: 'us-ny-newyork', pronouns: 'she/her', birthYear: BIRTH });
  const start = sim.now;
  const end = start + DAYS * MS_DAY;
  let lastReload = sim.now;
  let reloads = 0;
  let done = 0;
  let wanted = 0;
  const refused: Record<string, number> = {};
  const weekly: number[] = [];
  let reachedOn: number | undefined;
  let struck: { day: number; fitness: number } | undefined;
  let dayDone = '';
  let doneToday = 0;
  const ready: number[] = [];
  const fitAt: Record<string, number> = {};
  // Each day's fitness, read the first time the clock is seen on that day (a night's sleep passes midnight unseen):
  // the morning's, after the midnight's drift, which is what a day's work meets.
  let sampled = -1;
  const sample = () => {
    const d = Math.floor((sim.now - start) / MS_DAY);
    if (d === sampled) return;
    sampled = d;
    const f = sim.player.wellbeing.fitness;
    const full = abilityFull(sim, sim.player, 'stamina');
    if (reachedOn === undefined && f >= full) reachedOn = d;
    if (d % 7 === 0) weekly.push(Math.round(f * 10) / 10);
    if ([0, 30, 60, 90, 120, 150, 180, 270, 300, 365, 450, 540, 730].includes(d)) fitAt[`d${d}`] = Math.round(f * 100) / 100;
  };
  while (sim.now < end && sim.universe.meta.endedAt === undefined) {
    sample();
    const p = zonedParts(sim.now, sim.zone);
    const day = Math.floor((sim.now - start) / MS_DAY);
    const key = `${p.year}-${p.month}-${p.day}`;
    if (key !== dayDone) { dayDone = key; doneToday = 0; }
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    // The first hour seen on day 60 or after: a night's sleep passes six in the morning unseen, and until 2026-10-10 a
    // check for six o'clock exactly put nothing in, so these two scenarios played out as 'daily'.
    if (!struck && day >= 60 && (SCENARIO === 'injured' || SCENARIO === 'ill')) {
      struck = { day, fitness: Math.round(sim.player.wellbeing.fitness * 100) / 100 };
      if (SCENARIO === 'injured') hurt(sim, 'sprain');
      else careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
    }
    // The workout: at seven before classes, or the first free hour from three to nine.
    const want = plan(day, weekday) && doneToday < (SCENARIO === 'twice-daily' ? 2 : 1) && (sim.player.awakeSince ?? 0) <= sim.now && (p.hour === 7 || (p.hour >= 15 && p.hour < 21));
    if (want) {
      if (p.hour === 7 && doneToday === 0) wanted += 1;
      const no = lookAfterRefusal(sim, 'exercise');
      if (!no && sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok) { done += 1; doneToday += 1; continue; }
      if (no) refused[no.replace(/\d+/g, 'N').slice(0, 70)] = (refused[no.replace(/\d+/g, 'N').slice(0, 70)] ?? 0) + 1;
    }
    lookAfter(sim);
    if (p.hour === 12) keepCovered(sim);
    if (p.hour === 9) ready.push(readiness(sim.player));
    if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
    const weekend = weekday === 0 || weekday === 6;
    if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) continue;
    if ((p.hour >= 23 || p.hour < 5) && (sim.player.awakeSince ?? 0) <= sim.now) {
      if (sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) continue;
    }
    sim.advanceTo(sim.now + MS_HOUR);
    sample();
    const q = zonedParts(sim.now, sim.zone);
    if (sim.now - lastReload >= 30 * MS_DAY && q.hour === 12) {
      sim = loadSave(deserialise(serialise(sim.universe)) as never);
      reloads += 1;
      lastReload = sim.now;
    }
  }
  const person = sim.player;
  const work = person.work ?? [];
  // The work whose quality reads Stamina: each dimension that takes it, its mean, and the whole's.
  const reads: Record<string, { n: number; sum: number }> = {};
  for (const w of work) {
    const stamina = w.inputs.abilities.stamina;
    if (stamina === undefined) continue;
    for (const [d, v] of Object.entries(w.dims)) {
      const k = `${w.task}.${d}`;
      const r = (reads[k] ??= { n: 0, sum: 0 });
      r.n += 1;
      r.sum += v!;
    }
  }
  const school = person.school;
  return {
    scenario: SCENARIO, seed: SEED, days: DAYS, birthYear: BIRTH,
    ageAtEnd: Math.round(((sim.now - person.birthInstant) / (365.2425 * MS_DAY)) * 10) / 10,
    fitness: { start: weekly[0], end: Math.round(person.wellbeing.fitness * 100) / 100, full: abilityFull(sim, person, 'stamina'), reachedFullOnDay: reachedOn ?? null, at: fitAt, weekly },
    workouts: { done, plannedDays: wanted, refused },
    ...(struck ? { struck } : {}),
    readinessAt9: Math.round(ready.reduce((a, b) => a + b, 0) / Math.max(1, ready.length) * 10) / 10,
    school: { standing: school?.standing, attendance: school?.history?.map((h) => Math.round(h.attendance * 100)), warnings: school?.history?.filter((h) => h.standing !== 'good').length },
    staminaWork: Object.fromEntries(Object.entries(reads).filter(([, r]) => r.n >= 3).map(([k, r]) => [k, Math.round((r.sum / r.n) * 10) / 10])),
    breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads,
  };
}

console.log(JSON.stringify(run()));
