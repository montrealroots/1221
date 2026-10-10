/**
 * SLATE — practice strategies played against each other (from 2026-10-10). The same student, the same seed, the same
 * days and the same two hours of practice a day on the same three exercises, through `practice.exercise` and nothing
 * else: only the way the hours are spent changes. Common random numbers: every strategy on a seed meets the same
 * classes, calls, illnesses and sleep, so a difference is the strategy's.
 *
 * Seeds are split: the `matched` seeds were the ones looked at while the focus sizes were chosen, the `held-out`
 * seeds were not, and the ranking is reported on each separately. `--scale focus.key=f` multiplies one of
 * `FOCUS_RATE`'s or `TIER`'s numbers for a sensitivity sweep (nothing else changes).
 *
 *   npx vite-node tools/strategies.ts -- --days 90 --seeds matched
 *   npx vite-node tools/strategies.ts -- --days 90 --seeds held-out --scale precision.rested=1.2
 */
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, zonedParts } from '../src/engine/core/time';
import { developmentOf, levelOf } from '../src/engine/systems/attributes';
import { focusAt } from '../src/engine/systems/school';
import { matchedTier, practiceRefusal, practicedToday } from '../src/engine/systems/practice';
import { EXERCISE_BY_ID, FOCUS_RATE, TIER, type PracticeFocus } from '../src/engine/content/practice';
import { attentiveHour, life } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '90'));
const SEEDS = { matched: ['st-0', 'st-1', 'st-2'], 'held-out': ['st-10', 'st-11', 'st-12'] }[arg('seeds', 'matched') as 'matched' | 'held-out'];
const ONLY = arg('only', '');
const SCALE = arg('scale', '');
const PER_DAY = 2;
// Practice only from this hour (`--from 21`: the hours after a full day, tired), or whenever the day allows.
const FROM = Number(arg('from', '0'));
const PLAN = ['given-circumstances', 'adjustments', 'voice-work'] as const;

if (SCALE) {
  const [path, f] = SCALE.split('=');
  const [group, key] = path!.split('.');
  const table = (group === 'tier' ? TIER : (FOCUS_RATE as Record<string, Record<string, number>>)[group!]) as Record<string, number>;
  if (typeof table?.[key!] !== 'number') throw new Error(`No such number: ${path}`);
  table[key!] = table[key!]! * Number(f);
}

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

function run(seed: string, name: string) {
  const pick = STRATEGIES[name]!;
  const sim = life(seed, { homeRegionId: 'us-ny-newyork', pronouns: 'they/them' });
  const end = sim.now + DAYS * MS_DAY;
  let turn = 0;
  let hours = 0;
  let refusedFocus = 0;
  // What each hour moved, from the command's own answer: the development history keeps only its last 400 entries.
  const gains = { primary: 0, transfer: 0, byTarget: {} as Record<string, number> };
  const note = (id: string, g: number) => { gains.byTarget[id] = +((gains.byTarget[id] ?? 0) + g).toFixed(4); };
  const today = new Map<string, number>();
  const extra = (hour: number) => {
    if (hour < FROM) return false;
    const k = dayKey(sim);
    if ((today.get(k) ?? 0) >= PER_DAY || practicedToday(sim, sim.player) >= PER_DAY) return false;
    const id = PLAN[turn % PLAN.length]!;
    const e = EXERCISE_BY_ID[id]!;
    if (practiceRefusal(sim, sim.player, e)) return false;
    let how = pick(sim, id, gapOf(sim, id));
    let r = sim.execute({ kind: 'practice.exercise', payload: { exercise: id, focus: how.focus, ...(how.tier !== undefined ? { tier: how.tier } : {}) } });
    // A focus that can't be taken today (live with no class) falls back to steady, counted.
    if (!r.ok && /classmate|carries over/.test(r.error ?? '')) { refusedFocus += 1; how = { focus: 'steady' }; r = sim.execute({ kind: 'practice.exercise', payload: { exercise: id, focus: 'steady' } }); }
    if (!r.ok) return false;
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
  return { seed, strategy: name, hours, refusedFocus, primary: gains.primary, transfer: gains.transfer, total: gains.primary + gains.transfer, byTarget: gains.byTarget, practiceDays: developmentOf(sim.player).practice?.days ?? 0 };
}

const names = ONLY ? ONLY.split(',') : Object.keys(STRATEGIES);
const rows = SEEDS.flatMap((seed) => names.map((n) => run(seed, n)));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const table = names.map((n) => {
  const mine = rows.filter((r) => r.strategy === n);
  // Paired against steady on the same seed: the difference is the strategy's alone.
  const vsSteady = mine.map((r) => r.total - (rows.find((x) => x.seed === r.seed && x.strategy === 'steady')?.total ?? r.total));
  return { strategy: n, hours: mean(mine.map((r) => r.hours)), primary: +mean(mine.map((r) => r.primary)).toFixed(3), transfer: +mean(mine.map((r) => r.transfer)).toFixed(3), total: +mean(mine.map((r) => r.total)).toFixed(3), vsSteady: vsSteady.map((d) => +d.toFixed(3)), wonOn: vsSteady.filter((d) => d > 0).length };
});
console.log(JSON.stringify({ days: DAYS, seeds: SEEDS, from: FROM, scale: SCALE || null, table, rows }, null, 1));
