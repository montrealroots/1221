/**
 * SLATE — variety and continuity, measured (integration pass, 2026-10-10). A student played through the School by the
 * practicing policy (\`tools/policy.ts\`: classes, coursework, calls, sleep, meals, and spare hours on what the Player
 * Profile recommends), saved and opened every thirty days, and what they met recorded as situations, not as text: a
 * paraphrase isn't a new situation. The checks, each a number with its limit:
 *
 * - **Consecutive repetition**: the longest run of the same scene set in a row, in a course or anywhere; the share of
 *   scenes met again, and of those, the share that asked something new of them (\`revisitOf\`).
 * - **Partners**: the longest run of the same partner in a course; how many of the class were partnered.
 * - **Recommendations**: the longest the same target stayed top while it didn't grow a point (an unresolved
 *   recommendation, ignored or stuck); a target recommended at full (history ignored).
 * - **Practice situations**: the same exercise, tier, focus and gap band met in a row, and the same feedback in a row.
 * - **Direction and notes**: productions whose director asked for a way to play it; notes given again on the same thing
 *   after it was taken.
 * - **Choices**: weeks with no decision the player could make about how to do the work (a choice of playing, a focus, a
 *   moment to answer), out of all.
 *
 *   npx vite-node tools/variety.ts -- --seed v-0 --years 2
 */
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { breaches } from '../src/engine/core/invariants';
import { abilityFull, levelOf } from '../src/engine/systems/attributes';
import { courseworkOf } from '../src/engine/systems/coursework';
import { momentsOf } from '../src/engine/systems/classmates';



import { exerciseFor } from '../src/engine/content/practice';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { SCENE_MATERIAL, PLAY_MATERIAL } from '../src/engine/content/material';
import { EXERCISES } from '../src/engine/content/practice';
import { attentiveHour, life, practiceHour } from './policy';
import { adviceFor } from '../src/engine/systems/next-steps';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SEED = arg('seed', 'v-0');
const YEARS = Number(arg('years', '2'));

let sim = life(SEED, { homeRegionId: 'us-ny-newyork', pronouns: 'they/them' });
const start = sim.now;
const end = start + YEARS * 365 * MS_DAY;
const practice: { at: number; exercise: string; tier: number; focus: string; gapBand: string; feedback: string }[] = [];
const weekly: { week: number; top?: string; level?: number; full?: number; choices: number; practisedTop: number; practised: number }[] = [];
// Every production met, by its name, as the weeks found it: its director's request and its notes.
const seenProductions = new Map<string, { direction: string; notes: { focus: string; text: string; taken?: boolean }[] }>();
let lastReload = sim.now;
let lastWeek = -1;
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);
const full = (s: Simulation, id: string) => (isAbility(id) ? abilityFull(s, s.player, id as AbilityId) : MASTERED);

/** The policy's commands, watched: each practice hour's situation and feedback. */
function watch(s: Simulation) {
  const exec = s.execute.bind(s);
  s.execute = ((cmd: { kind: string; payload: Record<string, unknown> }) => {
    const before = cmd.kind === 'practice.exercise' ? s.player.experience?.exercises?.[String(cmd.payload.exercise)]?.lastDay : undefined;
    const r = exec(cmd as never);
    if (cmd.kind === 'practice.exercise' && r.ok) {
      const v = r.value as { tier: number; focus: string; feedback: string };
      const p = zonedParts(s.now, s.zone);
      const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
      const gap = before ? Math.round((Date.parse(today) - Date.parse(before)) / MS_DAY) : undefined;
      practice.push({ at: s.now, exercise: String(cmd.payload.exercise), tier: v.tier, focus: v.focus, gapBand: gap === undefined ? 'first' : gap === 0 ? 'same day' : gap <= 7 ? 'within a week' : 'longer', feedback: v.feedback });
    }
    return r;
  }) as typeof s.execute;
}
watch(sim);

while (sim.now < end && sim.universe.meta.endedAt === undefined) {
  attentiveHour(sim, (hour, weekend) => hour >= (weekend ? 10 : 15) && hour < 22 && practiceHour(sim));
  const week = Math.floor((sim.now - start) / (7 * MS_DAY));
  if (week !== lastWeek) {
    lastWeek = week;
    const recs = adviceFor(sim, sim.player);
    const top = recs.find((r) => r.exercise);
    const cw = courseworkOf(sim, sim.player);
    // A decision about how to do the work open this week: a moment to answer, open work with a way of playing to choose.
    const choices = (cw ? momentsOf(cw).filter((m) => m.status === 'open').length : 0) + (cw?.assignments.filter((a) => (a.status === 'open' || a.status === 'revising') && a.sceneId).length ?? 0);
    const prevTop = weekly.at(-1)?.top;
    const ex = prevTop ? exerciseFor(prevTop as never)?.id : undefined;
    const practisedTop = ex ? practice.filter((p) => p.exercise === ex && p.at > sim.now - 7 * MS_DAY).length : 0;
    const practised = practice.filter((p) => p.at > sim.now - 7 * MS_DAY).length;
    weekly.push({ week, ...(top ? { top: top.target, level: levelOf(sim, sim.player, top.target as never), full: full(sim, top.target) } : {}), choices, practisedTop, practised });
    for (const c of [sim.player.school?.casting, sim.player.school?.rep]) {
      const p = (c as { process?: { direction?: Record<string, string>; notes?: { focus: unknown; text: string; taken?: boolean }[] } } | undefined)?.process;
      const name = (c as { production?: string; play?: string } | undefined)?.play ?? (c as { production?: string } | undefined)?.production;
      if (p && name) seenProductions.set(name, { direction: JSON.stringify(p.direction ?? {}), notes: (p.notes ?? []).map((n) => ({ focus: JSON.stringify(n.focus), text: n.text, ...(n.taken !== undefined ? { taken: n.taken } : {}) })) });
    }
  }
  if (sim.now - lastReload >= 30 * MS_DAY && zonedParts(sim.now, sim.zone).hour === 12) {
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    watch(sim);
    lastReload = sim.now;
  }
}

// --- The checks.
const runs = <T>(xs: readonly T[], same: (a: T, b: T) => boolean) => { let best = xs.length ? 1 : 0, cur = 1; for (let i = 1; i < xs.length; i += 1) { cur = same(xs[i - 1]!, xs[i]!) ? cur + 1 : 1; best = Math.max(best, cur); } return best; };
const cw = courseworkOf(sim, sim.player);
const set = [...(cw?.assignments ?? [])].sort((a, b) => a.setOn.localeCompare(b.setOn));
const withScene = set.filter((a) => a.sceneId);
const byCourse = (xs: typeof set) => Object.values(xs.reduce<Record<string, typeof set>>((m, a) => { (m[a.course] ??= []).push(a); return m; }, {}));
const met = new Set<string>();
let again = 0, againNew = 0;
for (const a of withScene) { if (met.has(a.sceneId!)) { again += 1; if (a.revisit) againNew += 1; } met.add(a.sceneId!); }
const partnered = set.filter((a) => a.partner !== undefined && a.partnerName === undefined);
// An unresolved recommendation: top while two hours or more went on other practice that week (ignored: a week with no
// spare hour isn't the recommendation's to answer for), or practised three hours or more and not moved (stuck).
let ignored = 0, stuck = 0, ci = 0, cs = 0;
for (let i = 1; i < weekly.length; i += 1) {
  const a = weekly[i - 1]!, b = weekly[i]!;
  if (a.top && b.practisedTop === 0 && b.practised >= 2) { ci += 1; ignored = Math.max(ignored, ci); } else ci = 0;
  if (a.top && a.top === b.top && b.practisedTop >= 3 && (b.level ?? 0) - (a.level ?? 0) < 0.05) { cs += 1; stuck = Math.max(stuck, cs); } else cs = 0;
}
const stale = Math.max(ignored, stuck);
const atFull = weekly.filter((w) => w.top && (w.level ?? 0) >= (w.full ?? 100)).length;
const situations = practice.map((p) => `${p.exercise}|${p.tier}|${p.focus}|${p.gapBand}`);
const productions = [...seenProductions.values()];
// A note given again on what was just taken, with nothing said of it: history ignored.
const notesAgain = productions.reduce((n, c) => n + c.notes.filter((x, i) => i > 0 && c.notes[i - 1]!.taken && c.notes[i - 1]!.focus === x.focus && !/^Better since/.test(x.text)).length, 0);
const notesInARow = Math.max(0, ...productions.map((c) => { let best = 0, run = 0; c.notes.forEach((x, i) => { run = i > 0 && c.notes[i - 1]!.text === x.text ? run + 1 : 1; best = Math.max(best, run); }); return best; }));
if (process.argv.includes("--samples")) { const seen = new Map<string, number>(); for (const p of practice) seen.set(p.feedback, (seen.get(p.feedback) ?? 0) + 1); console.error([...seen].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, n]) => `${n}x ${f}`).join("\n")); console.error(JSON.stringify(weekly.map((w) => `${w.week}:${w.top}:${w.level?.toFixed(1)}:${w.practisedTop}`))); }
console.log(JSON.stringify({
  seed: SEED, years: YEARS, ended: new Date(sim.now).toISOString().slice(0, 10), standing: sim.player.school?.standing,
  pool: { scenes: SCENE_MATERIAL.length, plays: PLAY_MATERIAL.length, exercises: EXERCISES.length },
  coursework: {
    set: set.length, withScene: withScene.length, distinctScenes: met.size,
    longestSameSceneInARow: runs(withScene, (a, b) => a.sceneId === b.sceneId),
    longestSameSceneInACourse: Math.max(0, ...byCourse(withScene).map((xs) => runs(xs, (a, b) => a.sceneId === b.sceneId))),
    metAgain: again, metAgainAskingSomethingNew: againNew,
    longestSamePartnerInACourse: Math.max(0, ...byCourse(partnered).map((xs) => runs(xs, (a, b) => a.partner === b.partner))),
    partnersUsed: new Set(partnered.map((a) => a.partner)).size, classSize: sim.player.school?.classmates.length ?? 0,
    objectives: new Set(set.map((a) => a.objective ? JSON.stringify(a.objective) : '')).size,
  },
  recommendations: { weeks: weekly.length, weeksWithOne: weekly.filter((w) => w.top).length, distinctTops: new Set(weekly.map((w) => w.top).filter(Boolean)).size, longestIgnored: ignored, longestStuck: stuck, longestUnresolved: stale, recommendedAtFull: atFull },
  practice: { hours: practice.length, distinctSituations: new Set(situations).size, longestSameSituationInARow: runs(situations, (a, b) => a === b), longestSameFeedbackInARow: runs(practice.map((p) => p.feedback), (a, b) => a === b), distinctFeedback: new Set(practice.map((p) => p.feedback)).size },
  productions: { met: productions.length, directed: productions.filter((c) => c.direction !== '{}').length, notes: productions.reduce((n, c) => n + c.notes.length, 0), notesAgainAfterTakenUnsaid: notesAgain, sameNoteTextInARow: notesInARow },
  choices: { weeksWithNoWorkDecision: weekly.filter((w) => w.choices === 0).length, weeks: weekly.length, note: 'Practice’s exercise, tier and focus are a choice every day; this counts weeks with no moment to answer and no scene to choose a way of playing.' },
  breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length,
}, null, 1));
