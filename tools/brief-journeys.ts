/**
 * SLATE — practice briefs over a sustained stretch of the School (from 2026-10-12): a student played through the term by
 * the attentive policy (`tools/policy.ts`: classes, coursework, calls, sleep, meals), who spends free afternoon and
 * evening hours on briefs and on training, through the public commands only. Each run says what was met and done, so
 * variety and continuity are counted as situations, not as text.
 *
 *   npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120
 *
 * Profiles (the starting levels are TEST SETUP): `beginner` (a new student as made), `developing` (abilities and
 * techniques raised to 55), `specialist` (the feeling abilities at 90, the rest at 49, techniques as made), `generalist`
 * (from 2026-10-16, brief 10: the specialist's eleven at their mean, 63.9 each), `mastered` (everything full).
 *
 * The brief policy, an hour at a time: a callback waiting comes first, its note followed; then the brief in hand,
 * prepared a step at a time until every part is complete (studying its genre if it's short), then taped; then a new
 * brief, the one the record suggests for the weakness recent work names, else the next untaped genre in a seeded
 * order, read the way the preview shows this actor best, or, back on a brief, a reading not yet taped. Every other free
 * hour is training on what recent work names (`practiceHour`).
 *
 * From brief 11 (2026-10-17) the week's advice is kept with what it said (`recommendations.longestSameMessage`,
 * `longestSameState`, `longRuns`), which L1 as clarified reads beside the run of one target as written.
 */
import { writeFileSync } from 'node:fs';
import { CONCERN_STRENGTH } from '../src/engine/content/concerns';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY } from '../src/engine/core/time';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '../src/engine/content/briefs';
import { FILM_GENRES } from '../src/engine/content/film-genres';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { evenCraft } from '../src/engine/systems/school';
import { abilityFull, abilityOf, levelOf } from '../src/engine/systems/attributes';




import { breaches } from '../src/engine/core/invariants';
import { loadSave } from '../src/engine';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { forecast, prepareRefusal, preview, recordOf, requiredOf, suggestions, tapeRefusal } from '../src/engine/systems/briefs';
import { studyRefusal } from '../src/engine/systems/engagement';
import { attentiveHour, life, practiceHour } from './policy';
import { adviceFor } from '../src/engine/systems/next-steps';
import { replayAs, type Performer, type WorkRecord } from '../src/engine/systems/evaluation';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { TECHNIQUES } from '../src/engine/content/abilities';
import type { Evaluation } from '../src/engine/systems/evaluation';
import { fixedPieces } from './pieces';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const PROFILE = arg('profile', 'beginner');
/** `--no-register` (TEST SETUP, from 2026-10-16): the genres' registers set to nothing for the run, as before them. */
if (process.argv.includes('--no-register')) { CONCERN_STRENGTH.lean = 0; CONCERN_STRENGTH.draw = 0; }
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
  } else if (PROFILE === 'generalist') {
    // From 2026-10-16, brief 10 (L3-R (b)): the eleven abilities the specialist sets, each at their mean (four at 90 and
    // seven at 49, 703 / 11), techniques as made, so the two spend the same budget, the one evenly.
    const at = 703 / 11;
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft![k] = at;
    p.attrs = { ...(p.attrs ?? {}), composure: at, imagination: at, presence: at, listening: at, focus: at, adaptability: at, discipline: at } as typeof p.attrs;
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
const log = { hours: { brief: 0, training: 0, study: 0 }, takes: [] as { day: number; brief: string; genre: string; reading: string; sides: string; purpose: string; overall: number; chief?: string; concern?: string }[], recs: [] as { day: number; target: string; level: number; message: string; state: string }[] };
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
  const r = adviceFor(sim, p).find((x) => !x.target.includes(':'));
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
      log.takes.push({ day: dayOf(), brief: b.id, genre, reading: t.reading, sides: t.sides.join('+'), purpose: t.purpose, overall: t.overall, ...(t.chief ? { chief: t.chief } : {}), ...(t.concern ? { concern: t.concern } : {}) });
      if (TRACE) traced.push({ day: dayOf(), brief: b.id, purpose: t.purpose, record: structuredClone(p.work!.at(-1)!) });
      log.hours.brief += 1;
      if (!recordOf(p, b.id).callback) current = undefined;
      return true;
    }
  }
  return false;
}

/**
 * `--trace <file>` (from 2026-10-16, the integration pass; L3's trace): each take's own record (its difficulty, its
 * preparation, the day's readiness, the draw), the take again with no draw, and the same take as the actor's levels at
 * the start of the run and at its end would have played it, so a month's mean can be put down to what was taped, how
 * it was prepared, and how far the actor had come.
 */
const TRACE = process.argv.includes('--trace') ? arg('trace', '') : '';
const snap = (): Performer => {
  const p = sim.player;
  const ab = Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, abilityOf(sim, p, d.id)]));
  const fu = Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, abilityFull(sim, p, d.id)]));
  const te = Object.fromEntries(TECHNIQUES.map((k) => [k, p.craft?.[k] ?? 0]));
  return { ability: (id) => ab[id] ?? 0, full: (id) => fu[id] ?? 100, technique: (k) => te[k] ?? 0 };
};
const atStart = TRACE ? snap() : undefined;
const traced: { day: number; brief: string; purpose: string; record: WorkRecord }[] = [];
/**
 * The levels at the start of each month of the run (from 2026-10-16, brief 09): every take is judged again at each, so
 * the controlled measure is a curve, the same work at each month's levels, and not two points.
 */
const monthLevels: { month: number; day: number; levels: Performer; abilities: Record<string, number> }[] = [];
const levelsNow = () => Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, Math.round(abilityOf(sim, sim.player, d.id) * 10) / 10]));
const startAbilities = TRACE ? levelsNow() : {};
let snapped = 0;
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
  // The week's advice (from brief 11, 2026-10-17: L1 as clarified, docs/verification/completion-2026-10-16/clarifications.md):
  // its target and level as before, and what it said, whole (`message`: the reason, the standing and the next action) and
  // as the player's state (`state`: the standing without how long ago, which moves with the clock alone).
  if (dayOf() !== lastRecDay && dayOf() % 7 === 0) {
    lastRecDay = dayOf();
    const r = adviceFor(sim, sim.player).find((x) => !x.target.includes(':'));
    if (r) log.recs.push({ day: dayOf(), target: r.target, level: Math.round(levelOf(sim, sim.player, r.target as never)), message: [r.why, r.standing, r.next].filter(Boolean).join(' '), state: `${r.target}: ${(r.standing ?? '').replace(/, \d+ (?:days?|weeks) ago/, '')}` });
  }
  if (sim.now - lastReload >= 30 * MS_DAY) { sim = loadSave(deserialise(serialise(sim.universe)) as never); reloads += 1; lastReload = sim.now; }
  if (TRACE && Math.floor(dayOf() / 30) > snapped) { snapped = Math.floor(dayOf() / 30); monthLevels.push({ month: snapped, day: dayOf(), levels: snap(), abilities: levelsNow() }); }
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
  // The take's note in repeated practice (from 2026-10-16): what held each take back, without its figure, and the
  // concern behind it; how many different notes there were, the longest run of one, and how many times one note came
  // again on a take of another genre.
  notes: (() => {
    const note = (t: (typeof log.takes)[number]) => (t.chief ?? 'Nothing').replace(/ by (?:\d+ points? out of 100|less than a point)$/, '').replace(/ (?:\d+ points? out of 100|less than a point)$/, '');
    const ns = log.takes.map(note);
    let run = 0; let best = 0; let acrossGenres = 0;
    ns.forEach((n, i) => { run = i > 0 && n === ns[i - 1] ? run + 1 : 1; best = Math.max(best, run); if (i > 0 && n === ns[i - 1] && log.takes[i]!.genre !== log.takes[i - 1]!.genre) acrossGenres += 1; });
    // The note as the screen shows it: with the genre's concern behind it where one asked for it, and with no register
    // (`--no-register`) the limit alone, as the screen showed it before 2026-10-16.
    const shown = log.takes.map((t, i) => (t.concern && !process.argv.includes('--no-register') ? `${ns[i]}: ${t.genre}’s ${t.concern}` : ns[i]!));
    let sRun = 0; let sBest = 0; let sAcross = 0;
    shown.forEach((n, i) => { sRun = i > 0 && n === shown[i - 1] ? sRun + 1 : 1; sBest = Math.max(sBest, sRun); if (i > 0 && n === shown[i - 1] && log.takes[i]!.genre !== log.takes[i - 1]!.genre) sAcross += 1; });
    return { takes: ns.length, distinct: new Set(ns).size, longestSame: best, sameAgainInAnotherGenre: acrossGenres, withConcern: log.takes.filter((t) => t.concern).length, concerns: [...new Set(log.takes.map((t) => t.concern).filter(Boolean))], asShown: { distinct: new Set(shown).size, longestSame: sBest, sameAgainInAnotherGenre: sAcross }, sequence: log.takes.map((t, i) => `d${t.day} ${t.genre} ${t.purpose} ${t.overall}: ${shown[i]}`) };
  })(),
  recommendations: (() => {
    const longest = (same: (a: (typeof log.recs)[number], b: (typeof log.recs)[number]) => boolean) => log.recs.reduce((acc, r, i) => { const run = i > 0 && same(r, log.recs[i - 1]!) ? acc.run + 1 : 1; return { run, best: Math.max(acc.best, run) }; }, { run: 0, best: 0 }).best;
    // Each run of one target past L1's four weeks (from brief 11): its weeks, how far its input rose, and how many of its
    // weeks' messages and states were new against the week before.
    const runs: { from: number; to: number; target: string; weeks: number; rose: number; newMessages: number; newStates: number }[] = [];
    log.recs.forEach((r, i) => {
      const open = runs.at(-1);
      if (open && open.target === r.target && open.to === log.recs[i - 1]?.day) { open.to = r.day; open.weeks += 1; open.rose = r.level - log.recs.find((x) => x.day === open.from)!.level; if (r.message !== log.recs[i - 1]!.message) open.newMessages += 1; if (r.state !== log.recs[i - 1]!.state) open.newStates += 1; }
      else runs.push({ from: r.day, to: r.day, target: r.target, weeks: 1, rose: 0, newMessages: 0, newStates: 0 });
    });
    return {
      weeks: log.recs.length, distinctTargets: new Set(log.recs.map((r) => r.target)).size,
      longestSameTarget: longest((a, b) => a.target === b.target),
      longestSameMessage: longest((a, b) => a.message === b.message),
      longestSameState: longest((a, b) => a.state === b.state),
      longRuns: runs.filter((x) => x.weeks > 4),
      sequence: log.recs.map((r) => `${r.day}:${r.target}@${r.level}`).slice(0, 30),
    };
  })(),
  abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, Math.round(abilityOf(sim, sim.player, d.id))])),
  breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length,
  lastTakes: t.slice(-6),
};
console.log(JSON.stringify(result));
if (process.argv.includes("--debug")) console.log(JSON.stringify({ current, recs: Object.fromEntries(Object.entries(sim.player.briefs ?? {}).map(([k, r]) => [k, { prep: r.prep, reading: r.reading, takes: r.takes.length, req: requiredOf(BRIEF_BY_ID[k]!) }])), known: current ? Math.max(...BRIEF_BY_ID[current]!.kinds.map((g) => sim.player.engagement?.byGenre[g]?.familiarity ?? 0)) : 0 }));
if (process.argv.includes('--write')) writeFileSync(arg('write', ''), JSON.stringify(result, null, 1));
if (TRACE) {
  const atEnd = snap();
  const r1 = (x: number | undefined) => (x === undefined ? undefined : Math.round(x * 10) / 10);
  const rows = traced.map(({ day, brief, purpose, record: w }) => {
    const profile = TASK_PROFILES[w.task]!;
    return {
      day, month: Math.floor(day / 30), brief, purpose, task: w.task, overall: w.overall,
      noDraw: r1(replayAs(w, profile, { ability: (id) => w.inputs.abilities[id] ?? 0, full: (id) => w.inputs.fulls?.[id] ?? 100, technique: (k) => w.inputs.levels?.[k] ?? 0 })?.overall),
      atStartLevels: r1(replayAs(w, profile, atStart!)?.overall), atEndLevels: r1(replayAs(w, profile, atEnd)?.overall),
      atMonthLevels: Object.fromEntries(monthLevels.map((m) => [`m${m.month}`, replayAs(w, profile, m.levels)?.exact])),
      startExact: replayAs(w, profile, atStart!)?.exact, endExact: replayAs(w, profile, atEnd)?.exact,
      size: BRIEF_BY_ID[brief]?.size, stakes: BRIEF_BY_ID[brief]?.stakes ?? 1, beats: BRIEF_BY_ID[brief]?.beats.length,
      difficulty: w.inputs.difficulty, readiness: Math.round(w.inputs.condition.readiness), prep: w.inputs.prep, required: w.inputs.required,
      limits: w.limits.map((l) => `${l.label} (${l.kind}, ${l.dimension}) ${l.whole ?? l.by}`),
    };
  });
  const byMonth: Record<string, Record<string, number>> = {};
  for (const m of [...new Set(rows.map((x) => x.month))]) {
    const xs = rows.filter((x) => x.month === m);
    const mean = (f: (x: (typeof rows)[number]) => number | undefined) => Math.round((xs.reduce((a, x) => a + (f(x) ?? 0), 0) / xs.length) * 100) / 100;
    byMonth[`m${m}`] = { n: xs.length, overall: mean((x) => x.overall), noDraw: mean((x) => x.noDraw), atStartLevels: mean((x) => x.atStartLevels), atEndLevels: mean((x) => x.atEndLevels), difficulty: mean((x) => x.difficulty), readiness: mean((x) => x.readiness), callbacks: xs.filter((x) => x.purpose === 'callback').length };
  }
  // The controlled measure (from 2026-10-16, brief 09): every take of the run, the same work, interpretation,
  // preparation and day, judged at the levels of the run's start, of each month's start and of its end. Apart from it,
  // the mix of what was taped each month: what for, how hard, how long and how much rode on it.
  const points = [{ at: 'start', day: 0, abilities: startAbilities, of: (x: (typeof rows)[number]) => x.startExact }, ...monthLevels.map((m) => ({ at: `m${m.month}`, day: m.day, abilities: m.abilities, of: (x: (typeof rows)[number]) => x.atMonthLevels[`m${m.month}`] })), { at: 'end', day: DAYS, abilities: levelsNow(), of: (x: (typeof rows)[number]) => x.endExact }];
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const controlled = points.map((pt) => ({ at: pt.at, day: pt.day, meanOfEveryTake: r2(rows.reduce((a, x) => a + (pt.of(x) ?? 0), 0) / Math.max(1, rows.length)), abilities: pt.abilities }));
  const falls = rows.flatMap((x) => points.slice(1).map((pt, i) => ({ take: `${x.brief} day ${x.day}`, from: points[i]!.at, to: pt.at, by: (pt.of(x) ?? 0) - (points[i]!.of(x) ?? 0) })).filter((f) => f.by < -1e-9));
  const mix = Object.fromEntries([...new Set(rows.map((x) => x.month))].map((m) => {
    const xs = rows.filter((x) => x.month === m);
    const count = (f: (x: (typeof rows)[number]) => string) => xs.reduce((o, x) => { const k = f(x); o[k] = (o[k] ?? 0) + 1; return o; }, {} as Record<string, number>);
    return [`m${m}`, { takes: xs.length, purposes: count((x) => x.purpose), difficulty: count((x) => String(x.difficulty)), size: count((x) => String(x.size)), stakes: count((x) => String(x.stakes)), beats: count((x) => String(x.beats)), genres: new Set(xs.map((x) => x.brief.replace(/^brief-/, '').replace(/-\d+$/, ''))).size }];
  }));
  // L3-R (from 2026-10-16, brief 10; docs/verification/decisions-2026-10-16/criteria.md): the fixed set of 24
  // (`tools/pieces.ts`, named before it was measured) judged at the levels of the start, of each month's start and of
  // the end, fully prepared, every axis left open, readiness 100, no draw; and every fall between two points, of a
  // fixed piece or of a replayed take, put to the abilities it reads that fell (each held at the point before's level
  // and full) and judged again. A fall is explained where it then comes out at or over the point before's.
  const perf = [{ at: 'start', p: atStart! }, ...monthLevels.map((m) => ({ at: `m${m.month}`, p: m.levels })), { at: 'end', p: atEnd }];
  const nOf = (p: Performer, id: AbilityId) => p.ability(id) / Math.max(1e-9, p.full(id));
  const held = (cur: Performer, prev: Performer, ids: readonly AbilityId[]): Performer => ({ ability: (id) => (ids.includes(id) ? prev.ability(id) : cur.ability(id)), full: (id) => (ids.includes(id) ? prev.full(id) : cur.full(id)), technique: (k) => cur.technique(k) });
  const fixed = fixedPieces();
  type Judged = { what: string; at: (p: Performer) => Evaluation | undefined };
  const judged: Judged[] = [
    ...fixed.map((pc): Judged => ({ what: `fixed ${pc.kind}:${pc.id}`, at: (p) => pc.judge(p) })),
    ...traced.map(({ day, brief, record: w }): Judged => ({ what: `take ${brief} day ${day}`, at: (p) => replayAs(w, TASK_PROFILES[w.task]!, p) })),
  ];
  const stepFalls: { what: string; from: string; to: string; by: number; fell: string[]; held?: number; explained: boolean }[] = [];
  for (const j of judged) {
    for (let k = 1; k < perf.length; k += 1) {
      const prev = perf[k - 1]!, cur = perf[k]!;
      const a = j.at(prev.p), b = j.at(cur.p);
      if (!a || !b) continue;
      const by = b.exact! - a.exact!;
      if (by >= -1e-9) continue;
      const reads = Object.keys(b.inputs.abilities) as AbilityId[];
      const fell = reads.filter((id) => nOf(cur.p, id) < nOf(prev.p, id) - 1e-12);
      const again = fell.length ? j.at(held(cur.p, prev.p, fell))!.exact! - a.exact! : undefined;
      stepFalls.push({ what: j.what, from: prev.at, to: cur.at, by, fell, ...(again !== undefined ? { held: again } : {}), explained: again !== undefined && again >= -1e-9 });
    }
  }
  const fixedAt = perf.map((pt) => ({ at: pt.at, mean: fixed.reduce((t, pc) => t + pc.judge(pt.p).exact!, 0) / fixed.length }));
  const monthsOf = Object.entries(result.quality);
  const l3r = {
    fixedSet: { pieces: fixed.length, byPoint: fixedAt.map((x) => ({ at: x.at, mean: Math.round(x.mean * 1000) / 1000 })), growth: fixedAt.at(-1)!.mean - fixedAt[0]!.mean, perPiece: fixed.map((pc) => ({ piece: `${pc.kind}:${pc.id}`, byPoint: perf.map((pt) => Math.round(pc.judge(pt.p).exact! * 1000) / 1000) })) },
    falls: { steps: judged.length * (perf.length - 1), falls: stepFalls.length, unexplained: stepFalls.filter((f) => !f.explained).length, list: stepFalls },
    journeyMetric: { firstMonth: monthsOf[0]?.[1], lastMonth: monthsOf.at(-1)?.[1], l3AsWritten: monthsOf.length ? (monthsOf.at(-1)![1].mean >= monthsOf[0]![1].mean ? 'meets' : 'fails') : 'no takes' },
    mix: Object.fromEntries([...new Set(rows.map((x) => x.month))].map((m) => { const xs = rows.filter((x) => x.month === m); const ds = xs.map((x) => x.difficulty); return [`m${m}`, { takes: xs.length, purposes: xs.reduce((o, x) => { o[x.purpose] = (o[x.purpose] ?? 0) + 1; return o; }, {} as Record<string, number>), difficulty: { mean: Math.round((ds.reduce((t, x) => t + x, 0) / ds.length) * 1000) / 1000, min: Math.min(...ds), max: Math.max(...ds) }, stakes: xs.reduce((o, x) => { o[String(x.stakes)] = (o[String(x.stakes)] ?? 0) + 1; return o; }, {} as Record<string, number>), genres: [...new Set(xs.map((x) => BRIEF_BY_ID[x.brief]?.kinds[0] ?? x.brief))] }]; })),
  };
  writeFileSync(TRACE, JSON.stringify({ profile: PROFILE, seed: SEED, days: DAYS, byMonth, controlled, falls, mix, takes: rows, l3r }, null, 1));
}
