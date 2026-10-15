/**
 * SLATE — freshness, measured as gameplay (from 2026-10-12; the owner's brief of that day, section 14).
 *
 * Four students played through school months by the attentive policy (`tools/policy.ts`), each also working practice
 * briefs in their free hours the way the screen offers them: the first suggestion beside a brief, its steps, a reading,
 * the workbook's worst problem and its first way, and the take. Then what repeats, by explicit criteria:
 *
 * - repeated material: takes of a brief already taped, scenes set again, the share of each;
 * - notes that ignore completed work: a coursework note given again straight after the work put it right, which every
 *   coursework note's gate (`mayGive`, `systems/learning.ts`) allows only when the part has slipped back under
 *   `LEARNING.slipped` (on 2026-10-12 each one found was a new assignment's own part, at 0 or 0.275); and a director's
 *   note given again, on the same problem, after an earlier one on it was taken;
 * - recommendations that fail to adapt: the top recommendation kept after its input reached full;
 * - callback loops: callbacks earned in a row on one brief;
 * - identical optimal choices across unrelated work: across the briefs taped, the reading the forecast puts best, and
 *   how often the best one leans the same way (its heaviest dimension);
 * - content exhausted: the briefs a student could still be offered that they haven't taped;
 * - whether history changes later experience: identity lines that changed between the first half and the end, and
 *   suggestions that came from the record (an untried material, a habit, a recurring weakness).
 *
 * The students (TEST SETUP, levels set at the start; everything after is played through public commands):
 * a beginner (a new life as made), a developing one (every ability and technique at 60), a body specialist
 * (physical, vocal and stamina at 90, the rest at 50) and a mastered one (all full).
 *
 *   npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1
 *   npx vite-node tools/freshness.ts -- --months 9 --seeds fr-b --profiles mastered --merge   # adds to the last run's
 *
 * Writes docs/verification/connected-journey/FRESHNESS.md and freshness.json. The content is finite and said so: two
 * briefs a genre, the scenes in the scene catalog, the plays in the play catalog.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY } from '../src/engine/core/time';
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { MASTERED, TECHNIQUES } from '../src/engine/content/abilities';
import { attributesOf, abilityFull, levelOf } from '../src/engine/systems/attributes';
import { courseworkOf, notesOf } from '../src/engine/systems/coursework';
import { identityOf } from '../src/engine/systems/artistry';



import { ABILITY_DEFS, type AbilityId } from '../src/engine/content/abilities';
import { BRIEF, forecast, prepareRefusal, suggestions, tapeRefusal } from '../src/engine/systems/briefs';
import { optionsOf, problemsOf } from '../src/engine/systems/workbook';
import { workPiece } from '../src/engine/systems/workpieces';
import { hasProcess, type DirectorNote, type NoteFocus } from '../src/engine/systems/production';
import { attentiveHour, life } from './policy';
import { adviceFor } from '../src/engine/systems/next-steps';

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1]! : fallback; };
const MONTHS = Number(arg('months', '4'));
const SEEDS = arg('seeds', 'fr-0,fr-1').split(',');

type Profile = 'beginner' | 'developing' | 'specialist' | 'mastered';
const PROFILES: Profile[] = (arg('profiles', 'beginner,developing,specialist,mastered').split(',') as Profile[]);

function setUp(sim: Simulation, p: Profile): void {
  if (p === 'beginner') return;
  const person = sim.player;
  const a = attributesOf(sim, person) as unknown as Record<string, number>;
  const craft = person.craft as unknown as Record<string, number>;
  if (p === 'developing') { for (const k of Object.keys(a)) a[k] = 60; for (const k of Object.keys(craft)) craft[k] = 60; }
  if (p === 'specialist') { for (const k of Object.keys(a)) a[k] = 50; for (const k of Object.keys(craft)) craft[k] = 50; craft.movement = 90; craft.voice = 90; person.wellbeing.fitness = abilityFull(sim, person, 'stamina'); }
  if (p === 'mastered') { for (const k of Object.keys(a)) a[k] = 100; for (const k of Object.keys(craft)) craft[k] = 100; person.wellbeing.fitness = abilityFull(sim, person, 'stamina'); }
}

const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);

/** A free hour on a brief, as the screen offers it: the brief in hand or the first suggestion, then its next step. */
function briefHour(sim: Simulation, state: { brief?: string; log: string[] }): boolean {
  const person = sim.player;
  const recs = adviceFor(sim, person);
  const top = recs.find((r) => !r.target.includes(':'));
  if (!state.brief) {
    const ideas = suggestions(person, top ? { target: top.target, label: top.label, level: levelOf(sim, person, top.target as never), full: isAbility(top.target) ? abilityFull(sim, person, top.target as AbilityId) : MASTERED } : undefined, identityOf(person));
    const pick = ideas[0] ?? { brief: BRIEFS[(person.work?.length ?? 0) % BRIEFS.length]!.id, why: 'none' };
    state.brief = pick.brief;
    state.log.push(`offered ${pick.brief}: ${pick.why.slice(0, 60)}`);
  }
  const b = BRIEF_BY_ID[state.brief]!;
  const rec = person.briefs?.[b.id];
  if (!rec?.reading) return sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[(person.work?.length ?? 0) % b.readings.length]!.id } }).ok;
  for (const step of ['read', 'lines', 'rehearse'] as const) {
    const need = step === 'read' ? BRIEF.complete.interpretation : step === 'lines' ? BRIEF.complete.memorization : BRIEF.complete.rehearsal;
    if ((rec.prep[step === 'read' ? 'interpretation' : step === 'lines' ? 'memorization' : 'rehearsal'] ?? 0) < need && !prepareRefusal(sim, person, b, step)) return sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step } }).ok;
  }
  const k = `brief:${b.id}`;
  const piece = workPiece(sim, person, k);
  if (piece && rec.book?.tries.some((t) => t.verdict === 'pending')) return sim.execute({ kind: 'work.settle', payload: { piece: k, keep: true } }).ok;
  if (piece && !rec.book?.problem) { const p = problemsOf(piece).find((x) => optionsOf(piece, x).length); if (p && (rec.takes.length === 0 || rec.callback)) return sim.execute({ kind: 'work.identify', payload: { piece: k, problem: p.id } }).ok; }
  if (piece && rec.book?.problem) { const o = optionsOf(piece, rec.book.problem)[0]; if (o) { const r = sim.execute({ kind: 'work.try', payload: { piece: k, adjustment: o.adjustment, ...(o.option ? { option: o.option } : {}) } }); if (r.ok) return true; } }
  if (rec.callback) sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: rec.reading, [rec.callback.axis]: rec.callback.side } });
  if (!tapeRefusal(sim, person, b.kinds[0]!, b)) {
    const ok = sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } }).ok;
    // A callback earned keeps the brief in hand; otherwise the next free hour takes the next suggestion.
    if (ok && !person.briefs?.[b.id]?.callback) delete state.brief;
    return ok;
  }
  return false;
}

interface Result {
  seed: string; profile: Profile; months: number;
  takes: number; briefsTaped: number; takeRepeatShare: number;
  scenesSet: number; sceneRepeatShare: number;
  courseNotesGiven: number; courseNotesAgainAfterSlip: number;
  directorNotes: number; directorNotesAfterAnswered: number;
  callbacksEarned: number; longestCallbackRun: number;
  recsKeptAfterFull: number;
  bestLeanShare: number;
  briefsLeftToOffer: number;
  identityChanged: number; suggestionsFromRecord: number;
}

function play(seed: string, profile: Profile): Result {
  const sim = life(`${seed}-${profile}`, { homeRegionId: 'us-ny-newyork' });
  setUp(sim, profile);
  const state: { brief?: string; log: string[] } = { log: [] };
  const end = sim.now + MONTHS * 30 * MS_DAY;
  let half: ReturnType<typeof identityOf> | undefined;
  let recsAfterFull = 0;
  // The school's productions are replaced term by term, so their notes are read as the run goes, by production.
  const productions = new Map<string, DirectorNote[]>();
  const readProductions = () => {
    const school = sim.player.school as unknown as Record<string, unknown> | undefined;
    if (!school) return;
    for (const k of ['casting', 'rep', 'cabaret']) {
      const h = school[k] as { production?: string; play?: string; term?: string } | undefined;
      if (h && hasProcess(h)) productions.set(`${k}:${h.production ?? h.play}:${h.term ?? ''}`, h.process.notes);
    }
  };
  while (sim.now < end) {
    if (sim.now % MS_DAY < 3_600_000) readProductions();
    if (!half && sim.now >= end - (MONTHS * 30 * MS_DAY) / 2) half = identityOf(sim.player);
    attentiveHour(sim, () => briefHour(sim, state));
    // A recommendation of an input already at full: one that fails to adapt.
    if (sim.now % (7 * MS_DAY) < 3_600_000) {
      const person = sim.player;
      const recs = adviceFor(sim, person);
      for (const r of recs) if (!r.target.includes(':') && levelOf(sim, person, r.target as never) >= (isAbility(r.target) ? abilityFull(sim, person, r.target as AbilityId) : MASTERED)) recsAfterFull += 1;
    }
  }
  const person = sim.player;
  const takes = Object.values(person.briefs ?? {}).flatMap((r) => r.takes);
  const briefsTaped = Object.values(person.briefs ?? {}).filter((r) => r.takes.length).length;
  const cw = courseworkOf(sim, person);
  const scenes = (cw?.assignments ?? []).filter((a) => a.sceneId).map((a) => a.sceneId!);
  const notes = cw ? notesOf(cw) : [];
  // Given again straight after it was put right: an 'applied' entry followed by the note.
  const afterResolved = notes.reduce((a, n) => a + n.history.filter((h, i) => i > 0 && h.kind !== 'applied' && n.history[i - 1]!.kind === 'applied').length, 0);
  readProductions();
  const subject = (f: NoteFocus) => (f.kind === 'craft' ? `craft:${f.problem}` : f.kind === 'skill' ? `skill:${f.skill}` : f.kind === 'direction' ? `direction:${f.axis}` : f.kind);
  const procs = [...productions.values()];
  const dNotes = procs.flat();
  const dAfter = procs.reduce((a, ns) => a + ns.filter((n, i) => ns.slice(0, i).some((m) => m.taken && subject(m.focus) === subject(n.focus))).length, 0);
  let longest = 0;
  for (const r of Object.values(person.briefs ?? {})) { let run = 0; for (const t of r.takes) { run = t.purpose === 'callback' ? run + 1 : 0; longest = Math.max(longest, run); } }
  const leans = Object.keys(person.briefs ?? {}).filter((id) => person.briefs![id]!.takes.length && BRIEF_BY_ID[id]).map((id) => {
    const b = BRIEF_BY_ID[id]!;
    const best = b.readings.map((r) => ({ r, q: forecast(sim, person, b, { reading: r.id }).overall })).sort((x, y) => y.q - x.q || x.r.id.localeCompare(y.r.id))[0]!.r;
    return Object.entries(best.lean as Record<string, number>).sort((a, c) => c[1] - a[1])[0]?.[0] ?? 'even';
  });
  const leanCounts = leans.reduce<Record<string, number>>((m, l) => { m[l] = (m[l] ?? 0) + 1; return m; }, {});
  const end2 = identityOf(person);
  const lines = (i: ReturnType<typeof identityOf>) => new Set([...i.strengths, ...i.weaknesses, ...i.habits, ...i.familiar].map((x) => x.label));
  const changed = half ? [...lines(end2)].filter((l) => !lines(half!).has(l)).length + [...lines(half)].filter((l) => !lines(end2).has(l)).length : 0;
  const fromRecord = state.log.filter((l) => /never met|usually play|keeps coming back|another reading|knows least|callback/.test(l)).length;
  return {
    seed, profile, months: MONTHS,
    takes: takes.length, briefsTaped, takeRepeatShare: takes.length ? Math.round((1 - briefsTaped / takes.length) * 1000) / 1000 : 0,
    scenesSet: scenes.length, sceneRepeatShare: scenes.length ? Math.round((1 - new Set(scenes).size / scenes.length) * 1000) / 1000 : 0,
    courseNotesGiven: notes.reduce((a, n) => a + n.given, 0), courseNotesAgainAfterSlip: afterResolved,
    directorNotes: dNotes.length, directorNotesAfterAnswered: dAfter,
    callbacksEarned: takes.filter((t) => t.purpose === 'callback').length, longestCallbackRun: longest,
    recsKeptAfterFull: recsAfterFull,
    bestLeanShare: leans.length ? Math.round((Math.max(...Object.values(leanCounts)) / leans.length) * 1000) / 1000 : 0,
    briefsLeftToOffer: BRIEFS.length - Object.keys(person.briefs ?? {}).length,
    identityChanged: changed, suggestionsFromRecord: fromRecord,
  };
}

// --merge keeps the last run's results for other seeds at the same months, so long runs go a seed at a time.
const dir0 = 'docs/verification/connected-journey/freshness.json';
const kept: Result[] = process.argv.includes('--merge') && existsSync(dir0) ? (JSON.parse(readFileSync(dir0, 'utf8')) as { months: number; results: Result[] }).results.filter((r) => r.months === MONTHS && !(SEEDS.includes(r.seed) && PROFILES.includes(r.profile))) : [];
const results: Result[] = [...kept];
for (const seed of SEEDS) for (const p of PROFILES) { const r = play(seed, p); results.push(r); console.log(JSON.stringify(r)); }
const allSeeds = [...new Set(results.map((r) => r.seed))];
const dir = 'docs/verification/connected-journey';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/freshness.json`, `${JSON.stringify({ measured: 'tools/freshness.ts', months: MONTHS, seeds: allSeeds, techniques: TECHNIQUES.length, results }, null, 1)}\n`);
const cols: (keyof Result)[] = ['seed', 'profile', 'takes', 'briefsTaped', 'takeRepeatShare', 'scenesSet', 'sceneRepeatShare', 'courseNotesGiven', 'courseNotesAgainAfterSlip', 'directorNotes', 'directorNotesAfterAnswered', 'callbacksEarned', 'longestCallbackRun', 'recsKeptAfterFull', 'bestLeanShare', 'briefsLeftToOffer', 'identityChanged', 'suggestionsFromRecord'];
writeFileSync(`${dir}/FRESHNESS.md`, `# Freshness, Played

Written by \`tools/freshness.ts\`: ${allSeeds.length} seeds (${allSeeds.join(', ')}), four students each, ${MONTHS} months of school played by the attentive policy with
practice briefs in free hours. The criteria are in the tool's header. The content is finite: ${BRIEFS.length} practice
briefs, the scene and play catalogs.

| ${cols.join(' | ')} |
|${cols.map(() => '---').join('|')}|
${results.map((r) => `| ${cols.map((c) => r[c]).join(' | ')} |`).join('\n')}
`);
console.log(`wrote ${dir}/FRESHNESS.md`);
