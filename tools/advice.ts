/**
 * SLATE — What To Improve Next against what training actually brings, played (from 2026-10-16; F2-A,
 * docs/verification/advice-2026-10-16/criteria.md; from brief 10, later that day, F2-A10, docs/verification/decisions-2026-10-16/criteria.md
 * section 2, each clause measured as docs/verification/remaining-10/advice-checklist.json set it down before this was
 * first run).
 *
 * Each case is a student who tapes briefs through the game's commands: F2-A's three (`setUp`), or F2-A10's band and stage
 * (`buildCase`). The advice is read (`adviceFor`). Then, for every input the work read that a player could train
 * (`candidatesOf`: an exercise, and not at full by the game's own rule), a copy of the save plays twenty sessions of it,
 * one a day, through `practice.exercise`; a baseline copy lives the same days without them. What each copy's training
 * brought is its forecast of the takes the advice reads, at full precision, less the baseline's (`worthOf`). Abilities are
 * drawn from the seed (TEST SETUP), and every hour a calendar item would take is cleared, so every copy lives the same
 * days. Beside F2-A's pass, every clause of F2-A10: the median and the random alternative on the same sessions (c), what's
 * named against full and against a way to train it (d), the forecast against what was realized (e), diminishing returns
 * near mastery and the take read as prepared (f), the reason given (g), the advice once it's been followed (h), and the
 * case renamed (i).
 *
 * Until brief 10 it ran F2-A's adv-N alone and read each brief's shown tenth; and it imported `writeFileSync` twice.
 * From brief 11 (2026-10-17) it also measures (f) and (h) as clarified (docs/verification/completion-2026-10-16/
 * clarifications.md): preparation's own figure against the judge's replay, and the trained input's forecast at the
 * discipline it had, beside each as written. From brief 12, later that day, every clause of (f) and (h) as the owner
 * resolved them (docs/verification/resolution-2026-10-17/advice-criteria.md, F1 to F6 and H1 to H6, `f12` and `h12`),
 * on each case as built, on a copy that tapes one more brief cold, and on every copy read after its twenty days; each
 * brief 11 and brief 10 figure is kept beside them as it was.
 *
 *   npx vite-node tools/advice.ts -- --cases tuning [--out file.json]
 *   npx vite-node tools/advice.ts -- --cases adv-h-0..9 --held-out --out docs/verification/decisions-2026-10-16/advice/h-000.json
 *   npx vite-node tools/advice.ts -- --cases adv-v-0..9 --fresh --out <file.json>
 *   npx vite-node tools/advice.ts -- --summarize a.json b.json … [--out summary.json]
 *
 * A held-out seed is refused without `--held-out`, and from brief 12 (2026-10-17) a fresh one (adv-v-0 to 119) without
 * `--fresh`; every run writes its commit and whether the tracked tree was clean into its output, so it says what it ran
 * on. From brief 12 the held-out set is regression coverage, its groups named `regression` in a summary, and the fresh
 * set is the unseen validation (`SET_ROLE`, tools/advice-harness.ts).
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { MASTERED, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import { BRIEF_BY_ID } from '../src/engine/content/briefs';
import type { Skill } from '../src/engine/content/school';
import { exerciseFor } from '../src/engine/content/practice';
import type { Simulation } from '../src/engine/core/simulation';
import { performerOf, replayAs, type WorkRecord } from '../src/engine/systems/evaluation';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { adviceFor } from '../src/engine/systems/next-steps';
import { forecastWork, genreNow, trainingForecast, type Forecast } from '../src/engine/systems/advice';
import { abilityFull, abilityOf, isAbility, levelOf } from '../src/engine/systems/attributes';
import type { Recommendation } from '../src/engine/systems/experience';
import { BRIEFS } from '../src/engine/content/briefs';
import { adviceFor as readAdvice, attentionOf } from '../src/engine/systems/next-steps';
import { assumedOf, forecastChange, preparationWorth } from '../src/engine/systems/advice';
import { RECENT, SET_LABEL, SET_ROLE, assumedByRecords, attentionByRecords, casesOf, candidatesOf, changesOf, clone, buildCase, f2aCase, forecastByRecords, go, growthLadder, heldOutRefusal, isFull, likeForLike, live, preparationByRecords, rest, rng, setLevel, staleOf, tapeWaiting, worthOf, type CaseSpec } from './advice-harness';

const argv = process.argv.slice(2);
const arg = (n: string, d = '') => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1]! : d; };

/** A forecast's figure at full precision where the advice keeps one, its hundredth otherwise. */
const pointsOf = (f: Forecast | undefined): number | undefined => (f ? ((f as Forecast & { exact?: number }).exact ?? f.points) : undefined);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const median = (xs: readonly number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };

// The cases a `--cases` list names (`casesOf`) and the held-out refusal (`heldOutRefusal`) moved to
// tools/advice-harness.ts on 2026-10-17 (brief 11), unchanged, so a gate test reads what this runs.

/** The work the advice and the realized gain read: the latest `RECENT` pieces. */
const recentWork = (sim: Simulation): WorkRecord[] => [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-RECENT);

/** Every input the recent work read, whether it can be trained or not: what (d)'s every-input-at-full reads. */
function readInputs(sim: Simulation): string[] {
  const ids = new Set<string>();
  for (const w of recentWork(sim)) {
    for (const a of Object.keys(w.inputs.abilities)) ids.add(a);
    for (const [s, x] of Object.entries(w.inputs.techniques)) if ((x ?? 0) > 0 && TECHNIQUES.includes(s as Skill)) ids.add(s);
  }
  return [...ids].sort();
}

/** Each part of the chosen takes' preparation complete, their segments' own parts too: the takes as prepared, for (f). */
const asPrepared = (work: readonly WorkRecord[], which: (w: WorkRecord) => boolean, keep: readonly string[] = []): WorkRecord[] => work.map((w) => {
  if (!which(w)) return w;
  const done = (prep: Record<string, number>) => Object.fromEntries(Object.entries(prep).map(([k, x]) => [k, keep.includes(k) ? x : 1]));
  return { ...w, inputs: { ...w.inputs, prep: done(w.inputs.prep), ...(w.inputs.piece ? { piece: { ...w.inputs.piece, ...(w.inputs.piece.own ? { own: w.inputs.piece.own.map((o) => (o?.prep ? { ...o, prep: done(o.prep) } : o)) } : {}) } } : {}) } };
});

/** An input's full for the work: an ability's own, a technique's `MASTERED`, past which no piece reads more. */
const fullFor = (sim: Simulation, id: string) => (isAbility(id as never) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED);

function measure(spec: CaseSpec) {
  const { seed } = spec;
  const built = spec.design === 'F2-A' ? { ...f2aCase(seed), full: [] as string[] } : buildCase(seed, spec.band!, spec.stage!);
  const { sim, takes } = built;
  const advice = adviceFor(sim, sim.player);
  const training = advice.filter((x) => x.forecast);
  const first = training[0];
  const said = first ? [first.target, ...advice.filter((x) => x !== first && x.forecast && first.tiedWith?.includes(x.label)).map((x) => x.target)] : [];
  const predicted = trainingForecast(sim, sim.player);
  const candidates = candidatesOf(sim);
  const played = [...new Set([...candidates, ...(first ? [first.target] : [])])];
  const last = recentWork(sim);
  const chief = sim.player.work!.at(-1)!.limits.find((l) => l.kind === 'ability' || l.kind === 'technique')?.what;

  // The realized gains, and (h): the advice read again on the copy that followed it.
  const base = clone(sim);
  live(base, undefined);
  const baseWorth = worthOf(base, takes);
  const realized: Record<string, number> = {};
  let h: Record<string, unknown> = {};
  // Brief 12: each read the measure makes of the advice, and what it says of the first-named's training (F3, H1 to H4).
  const reads: { who: string; stale: string[]; changes: ReturnType<typeof changesOf> }[] = [];
  const readOf = (who: string, x: Simulation) => { const recs = readAdvice(x, x.player); reads.push({ who, stale: staleOf(x, recs), changes: changesOf(x, recs) }); return recs; };
  readOf('as built', sim);
  readOf('ignored', base);
  let followed: Record<string, unknown> = {};
  for (const id of played) {
    const c = clone(sim);
    live(c, id);
    realized[id] = worthOf(c, takes) - baseWorth;
    const again12 = readOf(first && id === first.target ? 'followed' : `trained ${id}`, c);
    if (first && id === first.target) {
      // H1 to H4 on the player who followed it; F3 on what the sessions brought, under the forecast's own assumptions.
      const was = c.player.experience?.advised;
      const after = trainingForecast(c, c.player).get(id);
      const before = pointsOf(predicted.get(id))!;
      const mine = reads.at(-1)!;
      // The change since the note made as the sessions began (the first hour notes it), worked out by the engine whatever the
      // standing speaks of: with no work since, the work's and the genres' parts are 0.
      const sinceSessions = was && was.target === id && after !== undefined ? forecastChange(c, c.player, id, was.last) : undefined;
      const firstAfter = again12.find((x) => x.forecast)?.target;
      const leader = [...trainingForecast(c, c.player)].filter(([k, x]) => k !== id && (x.own ?? pointsOf(x)!) >= 0.1).sort((a, b) => pointsOf(b[1])! - pointsOf(a[1])!)[0];
      const leads = leader !== undefined && (after === undefined || pointsOf(leader[1])! > pointsOf(after)! + 1e-12);
      const like = likeForLike(sim, c, base);
      followed = {
        notStale: mine.stale.length === 0, stale: mine.stale,
        moved: after === undefined ? isFull(c, id) : Math.abs(pointsOf(after)! - before) > 1e-12,
        stayed: firstAfter === id, leads, changedWhereLed: !leads || firstAfter !== id,
        rose: after !== undefined && pointsOf(after)! > before + 1e-12,
        noted: was?.target === id, change: sinceSessions ? { residual: sinceSessions.residual, parts: Object.fromEntries(Object.entries(sinceSessions.parts).map(([k, v]) => [k, Math.round(v * 1e6) / 1e6])) } : null,
        attributed: after === undefined || (sinceSessions !== undefined && Math.abs(sinceSessions.residual) < 1e-9 && Math.abs(sinceSessions.parts.work) < 1e-12 && Math.abs(sinceSessions.parts.genre) < 1e-12),
        // Every rise the standing speaks of is said in its parts.
        explained: mine.changes.every((x) => !x.rose || x.said),
        like: { predicted: r3(before), realized: r3(like), within: Math.abs(before - like) <= Math.max(0.3, 0.25 * Math.abs(like)) },
      };
    }
    if (first && id === first.target) {
      const again = adviceFor(c, c.player);
      const fNow = trainingForecast(c, c.player);
      const before = pointsOf(predicted.get(id))!;
      const after = pointsOf(fNow.get(id));
      const others = [...fNow].filter(([k]) => k !== id).map(([k, f]) => ({ k, p: pointsOf(f)! })).sort((a, b) => b.p - a.p);
      const leader = others[0];
      const leads = leader !== undefined && (after === undefined ? leader.p >= 0.1 : leader.p > after);
      const firstAfter = again.find((x) => x.forecast)?.target;
      h = { before: r3(before), after: after === undefined ? null : r3(after), atFullAfter: isFull(c, id), fell: after === undefined ? isFull(c, id) : after < before, leader: leader?.k, leaderPoints: leader ? r3(leader.p) : undefined, leads, firstAfter, ok: !leads || firstAfter !== id, tieLead: leads && after !== undefined && leader!.p - after <= 0.1 };
      // (h) as clarified (from brief 11, 2026-10-17; docs/verification/completion-2026-10-16/clarifications.md): the
      // trained input's forecast at the discipline it had before the sessions (`ownFell`), a rise no more than what
      // discipline's lift adds (`withinLift`), and where it rose since the advice's own note, the advice saying so.
      if (after !== undefined) {
        const held = clone(c);
        setLevel(held, 'discipline', abilityOf(sim, sim.player, 'discipline'));
        const atBefore = pointsOf(trainingForecast(held, held.player).get(id))!;
        const mine = again.find((x) => x.target === id);
        const noted = c.player.experience?.advised;
        const roseSinceNote = noted?.target === id && noted.last.forecast !== undefined && after > noted.last.forecast;
        h = { ...h, atBeforeDiscipline: r3(atBefore), ownFell: atBefore < before, rose: after > before, withinLift: after - before <= after - atBefore + 1e-12, roseSinceNote, explained: roseSinceNote ? Boolean(mine?.standing?.includes('of the change is discipline’s')) : undefined };
      }
    }
  }
  const ranked = Object.entries(realized).filter(([k]) => candidates.includes(k)).sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  const firstGain = first ? realized[first.target] : undefined;
  // F2-A's pass, as defined; a case that names nothing passes only where nothing realized a tenth (the checklist's rule).
  const pass = first ? (best ? firstGain! >= best[1] - 0.1 || said.includes(best[0]) : true) : !best || best[1] < 0.1;

  // (c) the alternatives on the same sessions.
  const others = candidates.filter((k) => k !== first?.target).map((k) => realized[k]!);
  const c = first ? { medianOthers: others.length ? r3(median(others)) : null, atOrAboveMedian: others.length ? firstGain! >= median(others) : true, randomMean: r3(candidates.reduce((t, k) => t + realized[k]!, 0) / Math.max(1, candidates.length)), firstGain: r3(firstGain!) } : {};

  // (d) nothing at full and nothing with no way to train it named; and every read input at full, said.
  const violations = advice.filter((x) => (x.exercise ? isFull(sim, x.target) || !exerciseFor(x.target as never) : !x.target.includes(':'))).map((x) => x.target);
  const all = clone(sim);
  for (const id of readInputs(all)) setLevel(all, id, 'full');
  const allAdvice = adviceFor(all, all.player);
  const d = { violations, allFull: { named: allAdvice.filter((x) => x.exercise).map((x) => x.target), says: allAdvice.some((x) => x.target === 'full:all') } };

  // (e) the forecast against what was realized.
  const pf = first ? pointsOf(predicted.get(first.target)) : undefined;
  const e = first && pf !== undefined ? { predicted: r3(pf), realized: r3(firstGain!), within: Math.abs(pf - firstGain!) <= Math.max(0.3, 0.25 * Math.abs(firstGain!)) } : {};

  // (f) diminishing returns: each input's predicted gain at its level, a third and two thirds of the way to full.
  // At full precision: compared exact, shown to a thousandth (until brief 10's tuning they were compared shown, and
  // three equal thousandths read as not falling).
  const ladderOf = (id: string): number[] => {
    const from = levelOf(sim, sim.player, id as never);
    const to = fullFor(sim, id);
    return [0, 1, 2].map((k) => { if (k === 0) return pointsOf(predicted.get(id)) ?? 0; const x = clone(sim); setLevel(x, id, from + ((to - from) * k) / 3); return pointsOf(trainingForecast(x, x.player).get(id)) ?? 0; });
  };
  const falling = (l: number[]) => l.every((x, i) => i === 0 || x < l[i - 1]!);
  const drop = (l: number[]) => Math.min(...l.slice(1).map((x, i) => l[i]! - x));
  const exactLadder = first ? ladderOf(first.target) : undefined;
  const ladder = exactLadder?.map(r3);
  const exactEvery = spec.band === 'nearMastery' ? Object.fromEntries([...predicted.keys()].filter((k) => !isFull(sim, k)).map((k) => [k, ladderOf(k)])) : undefined;
  const everyLadder = exactEvery;
  // Two readings of "where a take's preparation, not an ability, held it back": the criterion's words, where what held
  // the take back most (its chief limit, `limits[0]`) is preparation (`chief`), which the advice implements; and the
  // checklist's first, broader reading, any take with a preparation limit at all (`any`), kept and reported beside it.
  const gap = (a: Map<string, Forecast>, b: Map<string, Forecast>) => Math.max(0, ...[...new Set([...a.keys(), ...b.keys()])].map((k) => Math.abs((pointsOf(a.get(k)) ?? 0) - (pointsOf(b.get(k)) ?? 0))));
  const prepChief = last.some((w) => w.limits[0]?.kind === 'preparation');
  const chiefGap = gap(predicted, trainingForecast(sim, sim.player, asPrepared(sim.player.work ?? [], (w) => w.limits[0]?.kind === 'preparation')));
  // And the reading the advice implements (from brief 10's tuning): where a step of the take's own preparation held it
  // back most, the forecast the same as with those steps complete, knowing the genre as it stood.
  const ownStep = (w: WorkRecord) => w.limits[0]?.kind === 'preparation' && w.limits[0].what !== 'genre';
  const prepSteps = last.some(ownStep);
  const stepsGap = gap(predicted, trainingForecast(sim, sim.player, asPrepared(sim.player.work ?? [], ownStep, ['genre'])));
  const prepAny = last.some((w) => w.limits.some((l) => l.kind === 'preparation'));
  const anyGap = gap(predicted, trainingForecast(sim, sim.player, asPrepared(sim.player.work ?? [], () => true)));
  // (f) as clarified (from brief 11): preparation's own figure (`Forecast.preparation`) against the judge's replay of each
  // recent piece its own preparation held back, as prepared less as taped, weighted to the latest; and never in training's.
  const read = forecastWork(sim.player.work ?? []).map(genreNow(sim.player));
  const W = read.reduce((t, _w, i) => t + (i + 1) / read.length, 0);
  const me = performerOf(sim, sim.player);
  const judged = (w: WorkRecord) => { const x = replayAs(w, TASK_PROFILES[w.task]!, me); return x ? x.exact ?? x.overall : 0; };
  const worked = read.reduce((t, w, i) => (ownStep(w) ? t + ((judged(asPrepared([w], () => true, ['genre'])[0]!) - judged(w)) * (i + 1)) / read.length / W : t), 0);
  const prepSaid = first?.forecast?.preparation;
  const preparation = { pieces: read.filter(ownStep).length, said: prepSaid === undefined ? null : r3(prepSaid), worked: r3(worked), same: read.some(ownStep) ? prepSaid !== undefined && Math.abs(prepSaid - worked) < 1e-9 : prepSaid === undefined, apart: [...predicted.values()].every((x) => Math.abs((x.exact ?? x.points) - ((x.own ?? 0) + (x.days ?? 0))) < 1e-12) };
  const f = { ladder, falls: exactLadder ? falling(exactLadder) : undefined, leastDrop: exactLadder ? drop(exactLadder) : undefined, every: everyLadder ? { n: Object.keys(everyLadder).length, falling: Object.values(everyLadder).filter(falling).length, rising: Object.entries(everyLadder).filter(([, l]) => !falling(l)).map(([k, l]) => `${k} ${l.map((x) => x.toFixed(5)).join(' → ')}`) } : undefined, prep: { limited: prepChief, largest: r3(chiefGap), same: chiefGap < 1e-9, stepsLimited: prepSteps, stepsLargest: r3(stepsGap), stepsSame: stepsGap < 1e-9, anyLimited: prepAny, anyLargest: r3(anyGap), anySame: anyGap < 1e-9, preparation } };

  // (g) the reason: the gain it expects, how many of the pieces it read, and a piece by name. One piece read is said as
  // “your last piece” (from 2026-10-17, brief 14): until then “1 of your last 1 piece”, which the count's match found. All
  // of several is “your last 6 pieces all call on it” (from 2026-10-19, brief 15): until then “6 of your last 6 pieces”.
  const titles = [...new Set(takes.slice(-RECENT).map((t) => BRIEF_BY_ID[t.brief]!.title))];
  const counted = (x: Recommendation) => (x.forecast!.of === 1 && x.forecast!.pieces === 1 ? x.why.includes('(your last piece calls on it') : x.forecast!.pieces === x.forecast!.of ? x.why.includes(`(your last ${x.forecast!.of} pieces all call on it`) : x.why.includes(`${x.forecast!.pieces} of `));
  const says = (x: Recommendation) => x.why.includes(String(x.points)) && counted(x) && titles.some((t) => x.why.includes(t));
  const g = { recs: training.length, ok: training.filter(says).length, missing: training.filter((x) => !says(x)).map((x) => x.target) };

  // (i) the case renamed: the save's seed and every piece's, the same advice.
  const renamed = clone(sim);
  renamed.universe.meta.seed = `${seed}~renamed`;
  for (const w of renamed.player.work ?? []) w.inputs.seed = `${seed}~renamed`;
  const i = { same: JSON.stringify(adviceFor(renamed, renamed.player)) === JSON.stringify(advice) };

  // Brief 12, (f) as the owner resolved it: F1, F2, F4 and F5 on the case as built and on a copy that tapes one more brief
  // cold, a camera brief it hasn't taped drawn from the seed; F6 on the first-named's ladder; F3 above, on the followed copy.
  const fOn = (x: Simulation) => {
    const recs = readAdvice(x, x.player);
    const top = recs.find((r) => r.forecast);
    const fx = trainingForecast(x, x.player);
    const apart = [...fx.values()].every((y) => Math.abs((y.exact ?? y.points) - ((y.own ?? 0) + (y.days ?? 0))) < 1e-12 && y.hours === 20);
    const prepBy = preparationByRecords(x);
    const prepSaid = [...fx.values()][0]?.preparation;
    const prepWorked = prepSaid === undefined ? Math.abs(prepBy) < 1e-12 : [...fx.values()].every((y) => Math.abs((y.preparation ?? 0) - prepBy) < 1e-9);
    const a = assumedOf(x.player);
    const byRecords = assumedByRecords(x);
    const assumedMatch = a !== undefined && a.pieces === byRecords.pieces && a.complete === byRecords.complete && a.short === byRecords.short && a.genreCount === byRecords.genreCount && a.genreShort === byRecords.genreShort && a.genreBetter === byRecords.genreBetter && JSON.stringify(a.prepared.map((p) => p.what)) === JSON.stringify(byRecords.prepared);
    const says = top?.assumes ?? '';
    const assumedSaid = top !== undefined && says.startsWith(`What the forecast assumes of your last ${byRecords.pieces === 1 ? 'piece' : `${byRecords.pieces} pieces`}:`) && (byRecords.genreCount === 0 || (says.includes(byRecords.genreCount === 1 ? `counted as you know it today: it’s ${byRecords.genreShort ? 'short of complete' : 'complete'}${byRecords.genreBetter ? ', and you know it better than when you taped it' : ''}.` : `${byRecords.genreShort} ${byRecords.genreShort === 1 ? 'is' : 'are'} short of complete and ${byRecords.genreBetter} ${byRecords.genreBetter === 1 ? 'is' : 'are'} known better than when you taped them`)));
    // F4: each piece read as prepared named, what the first-named's figure would be read as taped (the forecast's own,
    // checked against the measure's reading), and no other piece read better prepared than its record.
    const taped = top ? forecastByRecords(x, top.target, true) : undefined;
    const tapedEngine = top ? (trainingForecast(x, x.player, x.player.work ?? [], [top.target], true).get(top.target)) : undefined;
    // Read exactly as said: every input's forecast is the one worked from the records with only the named pieces as prepared.
    const exactly = [...fx].every(([k, y]) => Math.abs((y.exact ?? y.points) - forecastByRecords(x, k)) < 1e-9);
    const counterfactual = { pieces: byRecords.prepared.length, named: byRecords.prepared.every((w) => says.includes(`In ${w}, `)), taped: byRecords.prepared.length === 0 || (taped !== undefined && tapedEngine !== undefined && Math.abs(taped - (tapedEngine.exact ?? tapedEngine.points)) < 1e-9 && says.includes(`would be worth about ${taped.toFixed(2)} a piece, not ${(pointsOf(top!.forecast)!).toFixed(2)}`)), readAsSaid: exactly };
    // F5: the verdict and its figures, the engine's against the records'.
    const att = attentionOf(x, x.player, top);
    const byRec = attentionByRecords(x, top ? pointsOf(top.forecast) : undefined);
    const worth = preparationWorth(x, x.player);
    const verdictWords = { both: 'Both ', preparation: 'Preparation is worth your time now', training: 'Training is worth your time now', neither: 'Neither preparation nor training' } as const;
    const lead = top ?? recs[0];
    const attention = { verdict: att?.verdict ?? null, own: worth ? r3(worth.own) : null, genres: worth ? r3(worth.genre) : null, matches: att !== undefined && worth !== undefined && Math.abs(worth.own - byRec.own) < 1e-9 && Math.abs(worth.genre - byRec.genre) < 1e-9 && att.verdict === byRec.verdict, said: att !== undefined && (lead?.attention ?? '').startsWith(verdictWords[att.verdict]) };
    return { apart, prepWorked, assumedMatch, assumedSaid, counterfactual, attention, ok: { F1: apart && prepWorked, F2: assumedMatch && assumedSaid, F4: counterfactual.named && counterfactual.taped && counterfactual.readAsSaid, F5: attention.matches && attention.said } };
  };
  const asBuilt = fOn(sim);
  const cold = clone(sim);
  const cr = rng(`${seed}:cold`);
  const untaped = BRIEFS.filter((b) => b.medium === 'camera' && !cold.player.briefs?.[b.id]);
  const coldBrief = untaped[Math.floor(cr() * untaped.length)]!;
  const tapeCold = () => go(cold, 'practice.self_tape', { genre: coldBrief.kinds[0], brief: coldBrief.id });
  go(cold, 'brief.choose', { brief: coldBrief.id, reading: coldBrief.readings[0]!.id });
  tapeWaiting(cold, `${seed} ${coldBrief.id} cold`, () => { go(cold, 'brief.choose', { brief: coldBrief.id, reading: coldBrief.readings[0]!.id }); }, tapeCold);
  rest(cold);
  const coldF = fOn(cold);
  readOf('cold take', cold);
  const ladder12 = first ? growthLadder(sim, first.target) : undefined;
  const f12 = {
    asBuilt, cold: { brief: coldBrief.id, chief: cold.player.work!.at(-1)!.limits[0] ? `${cold.player.work!.at(-1)!.limits[0]!.kind}:${cold.player.work!.at(-1)!.limits[0]!.what}` : null, ...coldF },
    like: followed.like ?? null, growth: ladder12 ? { growth: ladder12.growth.map((x) => Math.round(x * 1e6) / 1e6), ok: ladder12.ok } : null,
    ok: { F1: asBuilt.ok.F1 && coldF.ok.F1, F2: asBuilt.ok.F2 && coldF.ok.F2, F3: Boolean((followed.like as { within?: boolean } | undefined)?.within), F4: asBuilt.ok.F4 && coldF.ok.F4, F5: asBuilt.ok.F5 && coldF.ok.F5, F6: ladder12?.ok ?? false },
  };
  // Brief 12, (h) as the owner resolved it: the follower (H1 to H4) and every read (H5, H6).
  const allChanges = reads.flatMap((x) => x.changes);
  const h12 = {
    followed, reads: reads.map((x) => ({ who: x.who, stale: x.stale, changes: x.changes.map((y) => ({ since: y.since, rose: y.rose, by: Math.round(y.by * 1e6) / 1e6, residual: y.residual ?? null, said: y.said, unexplained: y.unexplained })) })),
    staleReads: reads.filter((x) => x.stale.length).length, changes: allChanges.length, unexplained: allChanges.filter((x) => x.unexplained).length, rises: allChanges.filter((x) => x.rose).length,
    ok: {
      H1: Boolean(followed.notStale && followed.moved && followed.attributed),
      H2: Boolean(followed.notStale && followed.changedWhereLed),
      H3: !followed.rose || Boolean(followed.attributed),
      H4: !followed.rose || Boolean(followed.explained),
      H5: reads.every((x) => x.stale.length === 0) && allChanges.every((x) => !x.unexplained),
      H6: reads.every((x) => !x.stale.some((y) => y.startsWith('S1'))),
    },
  };

  const levels = Object.fromEntries([...candidates, ...built.full].map((k) => [k, r3(levelOf(sim, sim.player, k as never))]));
  return {
    seed, set: spec.set, design: spec.design, ...(spec.band ? { band: spec.band, stage: spec.stage } : {}),
    takes: takes.map((t) => `${t.brief}:${t.reading}${t.again ? ' (again)' : ''}`), genres: new Set(takes.map((t) => t.genre)).size, atFull: built.full, levels,
    advice: advice.map((x) => ({ target: x.target, points: x.points, ...(x.forecast ? { forecast: pointsOf(x.forecast) } : {}), ...(x.tiedWith ? { tiedWith: x.tiedWith } : {}), why: x.why })),
    first: first?.target, said, chief, chiefIsFirst: chief !== undefined && chief === first?.target,
    predicted: Object.fromEntries([...predicted].map(([k, v]) => [k, r3(pointsOf(v)!)])), candidates,
    realized: Object.fromEntries(Object.entries(realized).map(([k, v]) => [k, r3(v)])), best: best?.[0], bestGain: best ? r3(best[1]) : undefined, firstGain: firstGain !== undefined ? r3(firstGain) : undefined,
    pass, noAdvice: !first, c, d, e, f, g, h, i, f12, h12,
  };
}

type CaseOut = ReturnType<typeof measure>;

/** The figures each clause reads, over a group of cases. */
function summarize(cases: readonly CaseOut[]) {
  const n = cases.length;
  const named = cases.filter((x) => x.first);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const near = cases.filter((x) => x.band === 'nearMastery');
  const firstMean = mean(named.map((x) => x.c.firstGain as number));
  const randomMean = mean(named.map((x) => x.c.randomMean as number));
  const hs = named.filter((x) => (x.h as { fell?: boolean }).fell !== undefined);
  const leads = hs.filter((x) => (x.h as { leads: boolean }).leads);
  return {
    n,
    b: { pass: cases.filter((x) => x.pass).length, share: r3(cases.filter((x) => x.pass).length / Math.max(1, n)), noAdvice: cases.filter((x) => x.noAdvice).length, exactBest: named.filter((x) => x.first === x.best).length, tieSaid: named.filter((x) => x.said.length > 1).length, chiefIsFirst: cases.filter((x) => x.chiefIsFirst).length },
    c: { named: named.length, atOrAboveMedian: named.filter((x) => x.c.atOrAboveMedian).length, share: r3(named.filter((x) => x.c.atOrAboveMedian).length / Math.max(1, named.length)), firstMean: r3(firstMean), randomMean: r3(randomMean), ratio: r3(firstMean / (randomMean || 1)) },
    d: { casesWithViolation: cases.filter((x) => x.d.violations.length).length, nearMastery: near.length, allFullSaid: near.filter((x) => x.d.allFull.says && !x.d.allFull.named.length).length, allFullSaidEveryCase: cases.filter((x) => x.d.allFull.says && !x.d.allFull.named.length).length },
    e: { named: named.length, within: named.filter((x) => (x.e as { within?: boolean }).within).length, share: r3(named.filter((x) => (x.e as { within?: boolean }).within).length / Math.max(1, named.length)), meanError: r3(mean(named.map((x) => ((x.e as { realized: number }).realized - (x.e as { predicted: number }).predicted)))) },
    f: { prepPieces: cases.filter((x) => x.f.prep.preparation.pieces > 0).length, prepSaid: cases.filter((x) => x.f.prep.preparation.pieces > 0 && x.f.prep.preparation.same).length, prepSameEvery: cases.filter((x) => x.f.prep.preparation.same).length, prepApart: cases.filter((x) => x.f.prep.preparation.apart).length, nearMastery: near.length, ladderFalls: near.filter((x) => x.f.falls).length, everyCandidate: near.reduce((t, x) => t + (x.f.every?.falling ?? 0), 0), ofCandidates: near.reduce((t, x) => t + (x.f.every?.n ?? 0), 0), prepLimited: cases.filter((x) => x.f.prep.limited).length, prepSame: cases.filter((x) => x.f.prep.limited && x.f.prep.same).length, prepStepsLimited: cases.filter((x) => x.f.prep.stepsLimited).length, prepStepsSame: cases.filter((x) => x.f.prep.stepsLimited && x.f.prep.stepsSame).length, prepAnyLimited: cases.filter((x) => x.f.prep.anyLimited).length, prepAnySame: cases.filter((x) => x.f.prep.anyLimited && x.f.prep.anySame).length },
    g: { recs: cases.reduce((t, x) => t + x.g.recs, 0), ok: cases.reduce((t, x) => t + x.g.ok, 0) },
    h: { cases: hs.length, fell: hs.filter((x) => (x.h as { fell: boolean }).fell).length, leads: leads.length, changedWhereLed: leads.filter((x) => (x.h as { ok: boolean }).ok).length, leadsWithinATie: leads.filter((x) => (x.h as { tieLead: boolean }).tieLead).length,
      // As clarified (from brief 11): the input's own part fell, a rise within discipline's lift, a rise explained.
      ownFell: hs.filter((x) => (x.h as { ownFell?: boolean }).ownFell).length, rose: hs.filter((x) => (x.h as { rose?: boolean }).rose).length, withinLift: hs.filter((x) => (x.h as { withinLift?: boolean }).withinLift).length, roseSinceNote: hs.filter((x) => (x.h as { roseSinceNote?: boolean }).roseSinceNote).length, explained: hs.filter((x) => (x.h as { explained?: boolean }).explained).length },
    i: { same: cases.filter((x) => x.i.same).length },
    // Brief 12 (advice-criteria.md): each clause of (f) and (h) as the owner resolved them, counted case by case.
    f12: {
      F1: cases.filter((x) => x.f12.ok.F1).length, F2: cases.filter((x) => x.f12.ok.F2).length, F3: cases.filter((x) => x.f12.ok.F3).length, F4: cases.filter((x) => x.f12.ok.F4).length, F5: cases.filter((x) => x.f12.ok.F5).length, F6: cases.filter((x) => x.f12.ok.F6).length,
      F3share: r3(cases.filter((x) => x.f12.ok.F3).length / Math.max(1, n)),
      readAsPrepared: { asBuilt: cases.filter((x) => x.f12.asBuilt.counterfactual.pieces > 0).length, cold: cases.filter((x) => x.f12.cold.counterfactual.pieces > 0).length },
      verdicts: Object.fromEntries(['both', 'training', 'preparation', 'neither'].map((v) => [v, cases.filter((x) => x.f12.asBuilt.attention.verdict === v).length])),
      coldVerdicts: Object.fromEntries(['both', 'training', 'preparation', 'neither'].map((v) => [v, cases.filter((x) => x.f12.cold.attention.verdict === v).length])),
    },
    h12: {
      H1: cases.filter((x) => x.h12.ok.H1).length, H2: cases.filter((x) => x.h12.ok.H2).length, H3: cases.filter((x) => x.h12.ok.H3).length, H4: cases.filter((x) => x.h12.ok.H4).length, H5: cases.filter((x) => x.h12.ok.H5).length, H6: cases.filter((x) => x.h12.ok.H6).length,
      followed: { stayed: cases.filter((x) => x.h12.followed.stayed).length, leads: cases.filter((x) => x.h12.followed.leads).length, changedWhereLed: cases.filter((x) => x.h12.followed.leads && x.h12.followed.changedWhereLed).length, rose: cases.filter((x) => x.h12.followed.rose).length, roseAttributed: cases.filter((x) => x.h12.followed.rose && x.h12.followed.attributed).length, roseExplained: cases.filter((x) => x.h12.followed.rose && x.h12.followed.explained).length },
      reads: cases.reduce((t, x) => t + x.h12.reads.length, 0), staleReads: cases.reduce((t, x) => t + x.h12.staleReads, 0), changes: cases.reduce((t, x) => t + x.h12.changes, 0), rises: cases.reduce((t, x) => t + x.h12.rises, 0), unexplained: cases.reduce((t, x) => t + x.h12.unexplained, 0),
    },
  };
}

/**
 * Every group the criteria report: each set and design, and for F2-A10's cases each band and each stage. From brief 12 the
 * fresh set's too, and the held-out set's groups are named `regression` (`SET_LABEL`); until then they were `held-out`.
 */
function groups(cases: readonly CaseOut[]) {
  const out: Record<string, ReturnType<typeof summarize>> = {};
  const by = (name: string, pick: (x: CaseOut) => boolean) => { const xs = cases.filter(pick); if (xs.length) out[name] = summarize(xs); };
  for (const set of ['tuning', 'held-out', 'fresh'] as const) {
    const name = SET_LABEL[set];
    by(`${name}`, (x) => x.set === set);
    by(`${name} F2-A`, (x) => x.set === set && x.design === 'F2-A');
    by(`${name} F2-A10`, (x) => x.set === set && x.design === 'F2-A10');
    for (const band of ['beginner', 'developing', 'advanced', 'nearMastery']) by(`${name} F2-A10 ${band}`, (x) => x.set === set && x.band === band);
    for (const stage of ['firstWeek', 'midTerm', 'later']) by(`${name} F2-A10 ${stage}`, (x) => x.set === set && x.stage === stage);
  }
  return out;
}

/** What each set present is for (from brief 12): said beside the figures, so a regression run isn't read as unseen validation. */
const rolesOf = (cases: readonly CaseOut[]) => Object.fromEntries([...new Set(cases.map((x) => x.set))].map((set) => [SET_LABEL[set], SET_ROLE[set]]));

const git = (cmd: string) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); } catch { return undefined; } };
const out = arg('out');
// A run is said by its commit, whether the tree was clean, and its command. Until its integration on 2026-10-16 it said
// the wall clock's time too, which the house's lint forbids outside the world clock; the held-out runs of brief 10 keep
// that field as they were written.
const at = { commit: git('rev-parse HEAD'), clean: git('status --porcelain --untracked-files=no') === '', command: `npx vite-node tools/advice.ts -- ${argv.join(' ')}` };

if (argv.includes('--summarize')) {
  const files = argv.slice(argv.indexOf('--summarize') + 1).filter((x) => !x.startsWith('--') && x !== out);
  const read = files.map((f) => JSON.parse(readFileSync(f, 'utf8')) as { commit?: string; cases: CaseOut[] });
  const cases = read.flatMap((x) => x.cases);
  const summary = { ...at, files, commits: [...new Set(read.map((x) => x.commit))], cases: cases.length, roles: rolesOf(cases), groups: groups(cases) };
  console.log(JSON.stringify(summary.groups, null, 1));
  if (out) writeFileSync(out, `${JSON.stringify(summary, null, 1)}\n`);
} else {
  const specs = casesOf(arg('cases', 'tuning'));
  const refused = heldOutRefusal(specs, argv.includes('--held-out'), argv.includes('--fresh'));
  if (refused) throw new Error(refused);
  const cases: CaseOut[] = [];
  for (const spec of specs) {
    const x = measure(spec);
    cases.push(x);
    console.log(`${x.seed} ${x.band ?? ''} ${x.stage ?? ''} first=${x.first} best=${x.best} (${x.bestGain}) first gained ${x.firstGain} predicted ${(x.e as { predicted?: number }).predicted} ${x.pass ? 'PASS' : 'MISS'} median=${x.c.atOrAboveMedian} e=${(x.e as { within?: boolean }).within} f=${x.f.falls} prep=${x.f.prep.limited ? x.f.prep.same : '-'} g=${x.g.ok}/${x.g.recs} h=${(x.h as { fell?: boolean }).fell}/${(x.h as { ok?: boolean }).ok} i=${x.i.same} d=${x.d.violations.length}/${x.d.allFull.says} f12=${Object.entries(x.f12.ok).filter(([, v]) => !v).map(([k]) => k).join('') || 'ok'} h12=${Object.entries(x.h12.ok).filter(([, v]) => !v).map(([k]) => k).join('') || 'ok'}`);
    if (out) writeFileSync(out, `${JSON.stringify({ ...at, cases }, null, 1)}\n`);
  }
  const summary = groups(cases);
  console.log(JSON.stringify(summary, null, 1));
  if (out) writeFileSync(out, `${JSON.stringify({ ...at, roles: rolesOf(cases), cases, summary }, null, 1)}\n`);
}
