/**
 * SLATE — practice briefs over a sustained stretch of the School (from 2026-10-12): a student played through the term by
 * the attentive policy (`tools/policy.ts`: classes, coursework, calls, sleep, meals), who spends free afternoon and
 * evening hours on briefs and on training, through the public commands only. Each run says what was met and done, so
 * variety and continuity are counted as situations, not as text.
 *
 *   npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120
 *
 * Profiles (the starting levels are TEST SETUP): `beginner` (a new student as made), `developing` (abilities and
 * techniques raised to 55), `specialist` (the feeling abilities at 90, the rest at 49, techniques as made), `mastered`
 * (everything full).
 *
 * The brief policy, an hour at a time: a callback waiting comes first, its note followed; then the brief in hand,
 * prepared a step at a time until every part is complete (studying its genre if it's short), then taped; then a new
 * brief, the one the record suggests for the weakness recent work names, else the next untaped genre in a seeded
 * order, read the way the preview shows this actor best, or, back on a brief, a reading not yet taped. Every other free
 * hour is training on what recent work names (`practiceHour`).
 */
import { writeFileSync } from 'node:fs';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY } from '../src/engine/core/time';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '../src/engine/content/briefs';
import { FILM_GENRES } from '../src/engine/content/film-genres';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { evenCraft } from '../src/engine/systems/school';
import { abilityFull, abilityOf, levelOf } from '../src/engine/systems/attributes';
import { practicedDaysAgo, recommendations } from '../src/engine/systems/experience';
import { identityOf } from '../src/engine/systems/artistry';
import { exerciseFor } from '../src/engine/content/practice';
import { matchedTier } from '../src/engine/systems/practice';
import { breaches } from '../src/engine/core/invariants';
import { loadSave } from '../src/engine';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { forecast, prepareRefusal, preview, recordOf, requiredOf, suggestions, tapeRefusal } from '../src/engine/systems/briefs';
import { studyRefusal } from '../src/engine/systems/engagement';
import { attentiveHour, life, practiceHour } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const PROFILE = arg('profile', 'beginner');
const SEED = arg('seed', 'bj-0');
const DAYS = Number(arg('days', '120'));
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);

function setUp(sim: Simulation) {
  const p = sim.player;
  if (PROFILE === 'developing') {
    p.craft = Object.fromEntries(Object.entries(p.craft!).map(([k, v]) => [k, Math.max(v, 55)])) as typeof p.craft;
    p.attrs = Object.fromEntries(Object.entries(p.attrs ?? {}).map(([k, v]) => [k, Math.max(v as number, 55)])) as unknown as typeof p.attrs;
  } else if (PROFILE === 'specialist') {
    for (const k of ['emotion'] as const) p.craft![k] = 90;
    p.attrs = { ...(p.attrs ?? {}), composure: 90, imagination: 90, presence: 90, listening: 49, focus: 49, adaptability: 49, discipline: 49 } as typeof p.attrs;
    p.craft!.memorization = 49; p.craft!.voice = 49; p.craft!.movement = 49;
  } else if (PROFILE === 'mastered') {
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
  }
}

let sim = life(SEED, { homeRegionId: 'us-ny-newyork' });
setUp(sim);
const order = [...FILM_GENRES.map((g) => g.id)].sort((a, b) => { const h = (s: string) => [...`${SEED}:${s}`].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7); return h(a) - h(b); });
let current: string | undefined;
const studied = new Map<string, number>();
const log = { hours: { brief: 0, training: 0, study: 0 }, takes: [] as { day: number; brief: string; genre: string; reading: string; sides: string; purpose: string; overall: number; chief?: string }[], recs: [] as { day: number; target: string; level: number }[] };
const day0 = sim.now;
const dayOf = () => Math.floor((sim.now - day0) / MS_DAY);

/** The reading this actor would show best, preferring one not yet taped on this brief. */
function pickReading(b: Brief): string {
  const tried = new Set(recordOf(sim.player, b.id).takes.map((t) => t.reading));
  const fresh = b.readings.filter((r) => !tried.has(r.id));
  const pool = fresh.length ? fresh : b.readings;
  return pool.map((r) => ({ id: r.id, s: preview(sim, sim.player, b, r.id, {}).overall })).sort((x, y) => y.s - x.s)[0]!.id;
}

function weakness() {
  const p = sim.player;
  // An ability or technique only, as the brief pane takes it (from 2026-10-12: until then only a preparation was passed
  // over, so a day's condition or a fit could be the weakness a brief was suggested for, at 0% of the work).
  const r = recommendations((id) => levelOf(sim, p, id as never), (id) => (isAbility(id) ? abilityFull(sim, p, id as AbilityId) : MASTERED), p.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(p, sim.now, sim.homeZone), identityOf(p).recurring).find((x) => !x.target.includes(':'));
  return r ? { target: r.target, label: r.label, level: levelOf(sim, p, r.target as never), full: isAbility(r.target) ? abilityFull(sim, p, r.target as AbilityId) : MASTERED } : undefined;
}

function nextBrief(): string | undefined {
  const p = sim.player;
  const cb = Object.entries(p.briefs ?? {}).find(([, r]) => r.callback);
  if (cb) return cb[0];
  // Every third take goes back to a brief already taped, for a purpose: a reading not yet tried, else one whose
  // forecast has risen two points or more since its last take (better able or better prepared).
  if (log.takes.length % 3 === 2) {
    const taped = Object.entries(p.briefs ?? {}).filter(([, r]) => r.takes.length).map(([id]) => BRIEF_BY_ID[id]!);
    const another = taped.find((b) => b.readings.some((r) => !recordOf(p, b.id).takes.some((t) => t.reading === r.id)));
    if (another) return another.id;
    const better = taped.find((b) => forecast(sim, p, b).overall >= recordOf(p, b.id).takes.at(-1)!.expected + 2);
    if (better) return better.id;
  }
  const w = weakness();
  const s = suggestions(p, w).find((x) => !x.why.startsWith('A callback'));
  // A suggestion the record makes, taken one time in two, so the run meets the catalog too.
  if (s && (log.takes.length % 2 === 0)) return s.brief;
  const g = order.find((id) => !BRIEFS.some((b) => b.kinds[0] === id && (p.briefs?.[b.id]?.takes.length ?? 0) > 0));
  return g ? BRIEFS.find((b) => b.kinds[0] === g)!.id : s?.brief;
}

function briefHour(): boolean {
  const p = sim.player;
  if (!current) current = nextBrief();
  if (!current) return false;
  const b = BRIEF_BY_ID[current]!;
  const rec = recordOf(p, b.id);
  const genre = b.kinds[0]!;
  // The reading, and a callback's note followed.
  if (!rec.reading || (rec.takes.length && rec.takes.at(-1)!.reading === rec.reading && !rec.callback)) {
    sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: pickReading(b) } });
  }
  if (rec.callback && rec.playing?.[rec.callback.axis] !== rec.callback.side) sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: rec.reading, [rec.callback.axis]: rec.callback.side } });
  const req = requiredOf(b);
  const known = Math.max(0, ...b.kinds.map((g) => p.engagement?.byGenre[g]?.familiarity ?? 0)) / 100;
  // Two sessions of study a brief at most: past that the take shows what knowing the genre still costs, and taping builds it.
  if (known < req.genre! && (studied.get(b.id) ?? 0) < 2 && !studyRefusal(sim, p, genre)) { if (sim.execute({ kind: 'genre.study', payload: { genre } }).ok) { studied.set(b.id, (studied.get(b.id) ?? 0) + 1); log.hours.study += 1.5; return true; } }
  // The part furthest from complete, as a player works: not one part finished before the next is begun.
  const short = (s: 'read' | 'lines' | 'rehearse') => {
    const part = s === 'read' ? 'interpretation' : s === 'lines' ? 'memorization' : 'rehearsal';
    const approach = s === 'rehearse' && rec.playing && rec.playing.prep < 0.9 ? 1 - rec.playing.prep : 0;
    return Math.max(1 - rec.prep[part] / (req[part] ?? 1), approach);
  };
  const need = (['read', 'lines', 'rehearse'] as const).filter((s) => short(s) > 0 && !prepareRefusal(sim, p, b, s)).sort((x, y) => short(y) - short(x))[0];
  if (need) { const r = sim.execute<{ minutes: number }>({ kind: 'brief.prepare', payload: { brief: b.id, step: need } }); if (r.ok) { log.hours.brief += r.value!.minutes / 60; return true; } }
  if (!tapeRefusal(sim, p, genre, b)) {
    const r = sim.execute<{ overall: number; purpose: string }>({ kind: 'practice.self_tape', payload: { genre, brief: b.id } });
    if (r.ok) {
      const t = recordOf(p, b.id).takes.at(-1)!;
      log.takes.push({ day: dayOf(), brief: b.id, genre, reading: t.reading, sides: t.sides.join('+'), purpose: t.purpose, overall: t.overall, ...(t.chief ? { chief: t.chief } : {}) });
      log.hours.brief += 1;
      if (!recordOf(p, b.id).callback) current = undefined;
      return true;
    }
  }
  return false;
}

const end = sim.now + DAYS * MS_DAY;
let lastReload = sim.now;
let reloads = 0;
let lastRecDay = -1;
while (sim.now < end && sim.universe.meta.endedAt === undefined) {
  attentiveHour(sim, (hour, weekend) => {
    if (hour === 7) return false;
    const free = weekend ? hour >= 10 && hour < 21 : hour >= 15 && hour < 21;
    if (!free) return false;
    if (hour % 2 === 0) return briefHour();
    if (practiceHour(sim)) { log.hours.training += 1; return true; }
    return briefHour();
  });
  if (dayOf() !== lastRecDay && dayOf() % 7 === 0) { lastRecDay = dayOf(); const w = weakness(); if (w) log.recs.push({ day: dayOf(), target: w.target, level: Math.round(w.level) }); }
  if (sim.now - lastReload >= 30 * MS_DAY) { sim = loadSave(deserialise(serialise(sim.universe)) as never); reloads += 1; lastReload = sim.now; }
}

const t = log.takes;
const purposes: Record<string, number> = {};
for (const x of t) purposes[x.purpose] = (purposes[x.purpose] ?? 0) + 1;
const months: Record<string, number[]> = {};
for (const x of t) (months[`m${Math.floor(x.day / 30)}`] ??= []).push(x.overall);
const spread = [...new Set(t.map((x) => x.brief))].map((id) => { const b = BRIEF_BY_ID[id]!; const xs = b.readings.map((r) => preview(sim, sim.player, b, r.id, {}).overall); return Math.max(...xs) - Math.min(...xs); });
const result = {
  profile: PROFILE, seed: SEED, days: DAYS, reloads,
  hours: Object.fromEntries(Object.entries(log.hours).map(([k, v]) => [k, Math.round(v * 10) / 10])),
  takes: t.length, briefs: new Set(t.map((x) => x.brief)).size, readings: new Set(t.map((x) => `${x.brief}:${x.reading}`)).size, genres: new Set(t.map((x) => x.genre)).size,
  purposes,
  sameTakeTwiceInARow: t.filter((x, i) => i > 0 && x.brief === t[i - 1]!.brief && x.reading === t[i - 1]!.reading && x.sides === t[i - 1]!.sides && x.purpose === 'again').length,
  quality: Object.fromEntries(Object.entries(months).map(([m, xs]) => [m, { n: xs.length, mean: Math.round(xs.reduce((a, x) => a + x, 0) / xs.length * 10) / 10, min: Math.min(...xs), max: Math.max(...xs) }])),
  readingSpreadAtEnd: spread.length ? { n: spread.length, mean: Math.round(spread.reduce((a, x) => a + x, 0) / spread.length * 100) / 100, max: Math.round(Math.max(...spread) * 100) / 100, over1: spread.filter((x) => x > 1).length } : undefined,
  recommendations: { weeks: log.recs.length, distinctTargets: new Set(log.recs.map((r) => r.target)).size, longestSameTarget: log.recs.reduce((acc, r, i) => { const run = i > 0 && r.target === log.recs[i - 1]!.target ? acc.run + 1 : 1; return { run, best: Math.max(acc.best, run) }; }, { run: 0, best: 0 }).best, sequence: log.recs.map((r) => `${r.day}:${r.target}@${r.level}`).slice(0, 30) },
  abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, Math.round(abilityOf(sim, sim.player, d.id))])),
  breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length,
  lastTakes: t.slice(-6),
};
console.log(JSON.stringify(result));
if (process.argv.includes("--debug")) console.log(JSON.stringify({ current, recs: Object.fromEntries(Object.entries(sim.player.briefs ?? {}).map(([k, r]) => [k, { prep: r.prep, reading: r.reading, takes: r.takes.length, req: requiredOf(BRIEF_BY_ID[k]!) }])), known: current ? Math.max(...BRIEF_BY_ID[current]!.kinds.map((g) => sim.player.engagement?.byGenre[g]?.familiarity ?? 0)) : 0 }));
if (process.argv.includes('--write')) writeFileSync(arg('write', ''), JSON.stringify(result, null, 1));
