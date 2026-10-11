/**
 * SLATE — practice strategies played against each other (from 2026-10-10; widened in the integration pass the same
 * day). The same student, the same seed, the same days and the same hours of practice, through \`practice.exercise\` and
 * nothing else, inside the School's own week (classes, calls, coursework, sleep and meals, played by \`tools/policy.ts\`):
 * only the way the hours are spent changes. Common random numbers: every strategy on a seed meets the same classes,
 * calls, illnesses and nights, so a difference is the strategy's.
 *
 * What a run is (each a flag, each said in the output):
 * - \`--profile\` who's practising, TEST SETUP of their levels at the start: \`beginner\` (abilities and techniques about
 *   30), \`developing\` (the game's own new student, untouched), \`specialist\` (the plan's targets at 85, the rest 40),
 *   \`uneven\` (the plan's targets 30, the rest 80), \`mastered\` (everything full).
 * - \`--tired\` each practice hour taken on a tired day, TEST SETUP of the night before (eight hours of sleep owed and
 *   energy at 30): the condition precision costs on and spacing doesn't care about.
 * - \`--plan\` what's practised: \`three\` abilities (the first comparison's), \`one\` exercise only (concentrated), \`six\`
 *   (broad), \`craft\` three techniques a material asks for.
 * - \`--every N\` practice on one day in N; \`--per-day H\` hours on a practice day.
 * - \`--scale group.key=f\` multiplies one of \`FOCUS_RATE\`'s or \`TIER\`'s numbers; \`--set group.key=v\` sets it.
 *
 * What's measured, for every run: the levels gained on the plan's own targets and by carry-over (each command's own
 * answer), and what the training did for work: a scene from The Importance of Being Earnest and one from Richard III,
 * each judged as a night would expect it (prepared, a sufficient day, no draw) before and after. Points on a target the
 * work doesn't read don't move it. Reported per strategy: n, mean, standard deviation, least and most, and the
 * difference from steady on each seed.
 *
 *   npx vite-node tools/strategies.ts -- --days 30 --seeds matched --profile beginner --plan three
 */
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, zonedParts } from '../src/engine/core/time';
import { abilityFull, attributesOf, developmentOf, levelOf, targetId } from '../src/engine/systems/attributes';
import { focusAt } from '../src/engine/systems/school';
import { evaluate } from '../src/engine/systems/evaluation';
import { materialContext } from '../src/engine/systems/material';
import { matchedTier, practiceRefusal, practicedToday } from '../src/engine/systems/practice';
import { EXERCISE_BY_ID, FOCUS_RATE, TIER, type PracticeFocus } from '../src/engine/content/practice';
import { MATERIAL_BY_ID } from '../src/engine/content/material';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import type { Skill } from '../src/engine/content/school';
import { attentiveHour, life } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '30'));
const SEEDSET = arg('seeds', 'matched') as 'matched' | 'held-out';
const SEEDS = { matched: ['st-0', 'st-1', 'st-2'], 'held-out': ['st-10', 'st-11', 'st-12'] }[SEEDSET];
const ONLY = arg('only', '');
const PROFILE = arg('profile', 'developing');
const TIRED = process.argv.includes('--tired');
const PLAN_NAME = arg('plan', 'three');
const EVERY = Number(arg('every', '1'));
const PER_DAY = Number(arg('per-day', '2'));
const FROM = Number(arg('from', '0'));
const PLANS: Record<string, readonly string[]> = {
  three: ['given-circumstances', 'adjustments', 'voice-work'],
  one: ['scene-work'],
  six: ['given-circumstances', 'adjustments', 'voice-work', 'scene-work', 'comic-timing', 'verse-speaking'],
  craft: ['scene-work', 'comic-timing', 'verse-speaking'],
  // What a scene reads most, practised directly: the check on whether live practice's carry-over is a shortcut.
  scene: ['repetition', 'adjustments', 'scene-work'],
};
const PLAN = PLANS[PLAN_NAME]!;
if (!PLAN) throw new Error(`No plan ${PLAN_NAME}`);

// A parameter moved for a sensitivity run: by a factor, or to a value.
const tableOf = (path: string) => { const [group, key] = path.split('.'); const t = (group === 'tier' ? TIER : (FOCUS_RATE as Record<string, Record<string, number>>)[group!]) as Record<string, number>; if (typeof t?.[key!] !== 'number') throw new Error(`No such number: ${path}`); return [t, key!] as const; };
const SCALE = arg('scale', '');
const SET = arg('set', '');
if (SCALE) { const [path, f] = SCALE.split('='); const [t, k] = tableOf(path!); t[k] = t[k]! * Number(f); }
if (SET) { const [path, v] = SET.split('='); const [t, k] = tableOf(path!); t[k] = Number(v); }

type Pick = (sim: Simulation, exercise: string, gap: number | undefined) => { focus: PracticeFocus; tier?: 0 | 1 | 2 };

/** The strategies: one focus throughout, a tier off the matched one, and the adaptive choice the hour's own feedback points to. */
const STRATEGIES: Record<string, Pick> = {
  steady: () => ({ focus: 'steady' }),
  precision: () => ({ focus: 'precision' }),
  spaced: () => ({ focus: 'spaced' }),
  variation: () => ({ focus: 'variation' }),
  live: () => ({ focus: 'live' }),
  'tier-above': (sim, id) => ({ focus: 'steady', tier: Math.min(2, matchedTier(levelOf(sim, sim.player, EXERCISE_BY_ID[id]!.trains)) + 1) as 0 | 1 | 2 }),
  'tier-below': (sim, id) => ({ focus: 'steady', tier: Math.max(0, matchedTier(levelOf(sim, sim.player, EXERCISE_BY_ID[id]!.trains)) - 1) as 0 | 1 | 2 }),
  adaptive: (sim, _id, gap) => ({ focus: focusAt(sim, sim.player, sim.now) >= FOCUS_RATE.precision.restedAt ? 'precision' : gap !== undefined && gap >= FOCUS_RATE.spaced.fromDays && gap <= FOCUS_RATE.spaced.toDays ? 'spaced' : 'steady' }),
};

const dayKey = (sim: Simulation) => { const p = zonedParts(sim.now, sim.zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const gapOf = (sim: Simulation, id: string) => {
  const last = sim.player.experience?.exercises?.[id]?.lastDay;
  if (!last) return undefined;
  return Math.round((Date.parse(dayKey(sim)) - Date.parse(last)) / MS_DAY);
};

/** TEST SETUP: a level put on a target, in place, so the craft keeps its bound ceiling. */
function put(sim: Simulation, target: string, v: number): void {
  const p = sim.player;
  const id = targetId(target as never);
  const held: Partial<Record<string, Skill>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
  if (held[id]) { p.craft![held[id]!] = v; return; }
  if (id === 'stamina') { p.wellbeing.fitness = (v / 100) * abilityFull(sim, p, 'stamina'); return; }
  if ((TECHNIQUES as readonly string[]).includes(id)) { p.craft![id as Skill] = v; return; }
  (attributesOf(sim, p) as unknown as Record<string, number>)[id] = v;
}

/** TEST SETUP of who's practising, said in the output. */
function profile(sim: Simulation): void {
  const targets = new Set(PLAN.map((e) => targetId(EXERCISE_BY_ID[e]!.trains as never) as string));
  const all = [...ABILITY_DEFS.map((d) => d.id as string), ...TECHNIQUES];
  const level = (id: string, v: number) => put(sim, id, (TECHNIQUES as readonly string[]).includes(id) ? v : Math.min(v, ABILITY_DEFS.some((d) => d.id === id) ? abilityFull(sim, sim.player, id as AbilityId) : 100));
  if (PROFILE === 'beginner') for (const id of all) level(id, 30);
  else if (PROFILE === 'specialist') for (const id of all) level(id, targets.has(id) ? 85 : 40);
  else if (PROFILE === 'uneven') for (const id of all) level(id, targets.has(id) ? 30 : 80);
  else if (PROFILE === 'mastered') for (const id of all) level(id, (TECHNIQUES as readonly string[]).includes(id) ? 100 : abilityFull(sim, sim.player, id as AbilityId));
}

/** What a night of a scene would be expected to come to, prepared and on a sufficient day: the work the training is for. */
function work(sim: Simulation, materialId: string): number {
  const m = MATERIAL_BY_ID[materialId]!;
  const task = TASK_PROFILES.scene!;
  const read = materialContext(task, m);
  const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
  return evaluate(sim, sim.player, { task, techniques: { scene: 2, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((p) => [p, 1])), required: Object.fromEntries(parts.map((p) => [p, 0.9])), difficulty: 0.3, condition: { readiness: 85 }, key: `work:${materialId}`, lean: read.lean, inputs: read.inputs, expected: true }).overall;
}
const WORKS = ['earnest-2', 'richard3-1-2'] as const;

function run(seed: string, name: string) {
  const pick = STRATEGIES[name]!;
  const sim = life(seed, { homeRegionId: 'us-ny-newyork', pronouns: 'they/them' });
  profile(sim);
  const before = Object.fromEntries(WORKS.map((w) => [w, work(sim, w)]));
  const end = sim.now + DAYS * MS_DAY;
  const start = sim.now;
  let turn = 0;
  let hours = 0;
  let refusedFocus = 0;
  const focusSeen: number[] = [];
  // What each hour moved, from the command's own answer: the development history keeps only its last 400 entries.
  const gains = { primary: 0, transfer: 0, byTarget: {} as Record<string, number> };
  const note = (id: string, g: number) => { gains.byTarget[id] = +((gains.byTarget[id] ?? 0) + g).toFixed(4); };
  const today = new Map<string, number>();
  const extra = (hour: number) => {
    if (hour < FROM) return false;
    if (Math.floor((sim.now - start) / MS_DAY) % EVERY !== 0) return false;
    const k = dayKey(sim);
    if ((today.get(k) ?? 0) >= PER_DAY || practicedToday(sim, sim.player) >= PER_DAY) return false;
    const id = PLAN[turn % PLAN.length]!;
    const e = EXERCISE_BY_ID[id]!;
    if (TIRED) Object.assign(sim.player.wellbeing, { sleepDebt: 8, energy: 30 });
    if (practiceRefusal(sim, sim.player, e)) return false;
    let how = pick(sim, id, gapOf(sim, id));
    focusSeen.push(focusAt(sim, sim.player, sim.now));
    let r = sim.execute({ kind: 'practice.exercise', payload: { exercise: id, focus: how.focus, ...(how.tier !== undefined ? { tier: how.tier } : {}) } });
    // A focus that can't be taken (live with no class, variation with nothing to carry to) falls back to steady, counted.
    if (!r.ok && /classmate|carries over/.test(r.error ?? '')) { refusedFocus += 1; how = { focus: 'steady' }; r = sim.execute({ kind: 'practice.exercise', payload: { exercise: id, focus: 'steady' } }); }
    if (!r.ok) { focusSeen.pop(); return false; }
    const v = r.value as { gained: number; carried: { target: string; gained: number }[] };
    gains.primary += v.gained;
    note(e.trains, v.gained);
    for (const c of v.carried) { gains.transfer += c.gained; note(c.target, c.gained); }
    today.set(k, (today.get(k) ?? 0) + 1);
    turn += 1;
    hours += 1;
    return true;
  };
  while (sim.now < end && sim.universe.meta.endedAt === undefined) attentiveHour(sim, extra);
  const after = Object.fromEntries(WORKS.map((w) => [w, work(sim, w)]));
  const workGain = WORKS.reduce((s, w) => s + after[w]! - before[w]!, 0) / WORKS.length;
  return {
    seed, strategy: name, hours, refusedFocus, meanFocus: +(focusSeen.reduce((a, b) => a + b, 0) / Math.max(1, focusSeen.length)).toFixed(3),
    primary: gains.primary, transfer: gains.transfer, total: gains.primary + gains.transfer, workGain: +workGain.toFixed(3),
    workBy: Object.fromEntries(WORKS.map((w) => [w, +(after[w]! - before[w]!).toFixed(3)])), byTarget: gains.byTarget, practiceDays: developmentOf(sim.player).practice?.days ?? 0,
  };
}

const stats = (xs: number[]) => {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  return { n, mean: +mean.toFixed(3), sd: +sd.toFixed(3), min: +Math.min(...xs).toFixed(3), max: +Math.max(...xs).toFixed(3) };
};
const names = ONLY ? ONLY.split(',') : Object.keys(STRATEGIES);
const rows = SEEDS.flatMap((seed) => names.map((n) => run(seed, n)));
const table = names.map((n) => {
  const mine = rows.filter((r) => r.strategy === n);
  // Paired against steady on the same seed: the difference is the strategy's alone.
  const steadyOf = (seed: string) => rows.find((x) => x.seed === seed && x.strategy === 'steady');
  const vs = (k: 'total' | 'primary' | 'workGain') => mine.map((r) => r[k] - (steadyOf(r.seed)?.[k] ?? r[k]));
  return {
    strategy: n, hours: stats(mine.map((r) => r.hours)), meanFocus: stats(mine.map((r) => r.meanFocus)).mean,
    primary: stats(mine.map((r) => r.primary)), transfer: stats(mine.map((r) => r.transfer)), total: stats(mine.map((r) => r.total)), workGain: stats(mine.map((r) => r.workGain)),
    vsSteady: { total: stats(vs('total')), primary: stats(vs('primary')), workGain: stats(vs('workGain')) },
    wonOn: { primary: vs('primary').filter((d) => d > 1e-9).length, workGain: vs('workGain').filter((d) => d > 1e-9).length },
  };
});
console.log(JSON.stringify({ days: DAYS, seeds: SEEDS, seedSet: SEEDSET, profile: PROFILE, tired: TIRED, plan: PLAN_NAME, every: EVERY, perDay: PER_DAY, from: FROM, scale: SCALE || null, set: SET || null, mastered: MASTERED, table, rows }, null, 1));
