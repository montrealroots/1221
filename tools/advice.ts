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
 *
 *   npx vite-node tools/advice.ts -- --cases tuning [--out file.json]
 *   npx vite-node tools/advice.ts -- --cases adv-h-0..9 --held-out --out docs/verification/decisions-2026-10-16/advice/h-000.json
 *   npx vite-node tools/advice.ts -- --summarize a.json b.json … [--out summary.json]
 *
 * A held-out seed is refused without `--held-out`; with it, the commit and whether the tracked tree was clean are written
 * into the output, so a held-out run says what it ran on.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { MASTERED, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import { BRIEF_BY_ID } from '../src/engine/content/briefs';
import type { Skill } from '../src/engine/content/school';
import { exerciseFor } from '../src/engine/content/practice';
import type { Simulation } from '../src/engine/core/simulation';
import type { WorkRecord } from '../src/engine/systems/evaluation';
import { adviceFor } from '../src/engine/systems/next-steps';
import { trainingForecast, type Forecast } from '../src/engine/systems/advice';
import { abilityFull, isAbility, levelOf } from '../src/engine/systems/attributes';
import type { Recommendation } from '../src/engine/systems/experience';
import { RECENT, caseOf, candidatesOf, clone, buildCase, f2aCase, isFull, live, setLevel, worthOf, type CaseSpec } from './advice-harness';

const argv = process.argv.slice(2);
const arg = (n: string, d = '') => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1]! : d; };

/** A forecast's figure at full precision where the advice keeps one, its hundredth otherwise. */
const pointsOf = (f: Forecast | undefined): number | undefined => (f ? ((f as Forecast & { exact?: number }).exact ?? f.points) : undefined);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const median = (xs: readonly number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };

/** The cases a `--cases` list names: `tuning`, `held-out`, a seed, or a range `adv-h-0..9`. */
function casesOf(list: string): CaseSpec[] {
  const out: string[] = [];
  for (const item of list.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (item === 'tuning') out.push(...Array.from({ length: 10 }, (_, i) => `adv-${i}`), ...Array.from({ length: 20 }, (_, i) => `adv-t-${i}`));
    else if (item === 'held-out') out.push(...Array.from({ length: 30 }, (_, i) => `adv-${i + 10}`), ...Array.from({ length: 120 }, (_, i) => `adv-h-${i}`));
    else {
      const m = /^(.*-)(\d+)\.\.(\d+)$/.exec(item);
      if (m) for (let n = Number(m[2]); n <= Number(m[3]); n += 1) out.push(`${m[1]}${n}`);
      else out.push(item);
    }
  }
  return out.map((seed) => { const c = caseOf(seed); if (!c) throw new Error(`${seed} is no case of F2-A or F2-A10`); return c; });
}

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

/** Each part of every take's preparation complete, its segments' own parts too: the takes as prepared, for (f). */
const asPrepared = (work: readonly WorkRecord[]): WorkRecord[] => work.map((w) => ({
  ...w,
  inputs: {
    ...w.inputs,
    prep: Object.fromEntries(Object.keys(w.inputs.prep).map((k) => [k, 1])),
    ...(w.inputs.piece ? { piece: { ...w.inputs.piece, ...(w.inputs.piece.own ? { own: w.inputs.piece.own.map((o) => (o?.prep ? { ...o, prep: Object.fromEntries(Object.keys(o.prep).map((k) => [k, 1])) } : o)) } : {}) } } : {}),
  },
}));

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
  for (const id of played) {
    const c = clone(sim);
    live(c, id);
    realized[id] = worthOf(c, takes) - baseWorth;
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
  const ladderOf = (id: string): number[] => {
    const from = levelOf(sim, sim.player, id as never);
    const to = fullFor(sim, id);
    return [0, 1, 2].map((k) => { if (k === 0) return r3(pointsOf(predicted.get(id)) ?? 0); const x = clone(sim); setLevel(x, id, from + ((to - from) * k) / 3); return r3(pointsOf(trainingForecast(x, x.player).get(id)) ?? 0); });
  };
  const falling = (l: number[]) => l.every((x, i) => i === 0 || x < l[i - 1]!);
  const ladder = first ? ladderOf(first.target) : undefined;
  const everyLadder = spec.band === 'nearMastery' ? Object.fromEntries([...predicted.keys()].filter((k) => !isFull(sim, k)).map((k) => [k, ladderOf(k)])) : undefined;
  const prepLimited = last.some((w) => w.limits.some((l) => l.kind === 'preparation'));
  const prepared = trainingForecast(sim, sim.player, asPrepared(sim.player.work ?? []));
  const prepGap = Math.max(0, ...[...new Set([...predicted.keys(), ...prepared.keys()])].map((k) => Math.abs((pointsOf(predicted.get(k)) ?? 0) - (pointsOf(prepared.get(k)) ?? 0))));
  const f = { ladder, falls: ladder ? falling(ladder) : undefined, every: everyLadder ? { n: Object.keys(everyLadder).length, falling: Object.values(everyLadder).filter(falling).length, rising: Object.entries(everyLadder).filter(([, l]) => !falling(l)).map(([k, l]) => `${k} ${l.join(' → ')}`) } : undefined, prep: { limited: prepLimited, largest: r3(prepGap), same: prepGap < 1e-9 } };

  // (g) the reason: the gain it expects, how many of the pieces it read, and a piece by name.
  const titles = [...new Set(takes.slice(-RECENT).map((t) => BRIEF_BY_ID[t.brief]!.title))];
  const says = (x: Recommendation) => x.why.includes(String(x.points)) && x.why.includes(`${x.forecast!.pieces} of `) && titles.some((t) => x.why.includes(t));
  const g = { recs: training.length, ok: training.filter(says).length, missing: training.filter((x) => !says(x)).map((x) => x.target) };

  // (i) the case renamed: the save's seed and every piece's, the same advice.
  const renamed = clone(sim);
  renamed.universe.meta.seed = `${seed}~renamed`;
  for (const w of renamed.player.work ?? []) w.inputs.seed = `${seed}~renamed`;
  const i = { same: JSON.stringify(adviceFor(renamed, renamed.player)) === JSON.stringify(advice) };

  const levels = Object.fromEntries([...candidates, ...built.full].map((k) => [k, r3(levelOf(sim, sim.player, k as never))]));
  return {
    seed, set: spec.set, design: spec.design, ...(spec.band ? { band: spec.band, stage: spec.stage } : {}),
    takes: takes.map((t) => `${t.brief}:${t.reading}${t.again ? ' (again)' : ''}`), genres: new Set(takes.map((t) => t.genre)).size, atFull: built.full, levels,
    advice: advice.map((x) => ({ target: x.target, points: x.points, ...(x.forecast ? { forecast: pointsOf(x.forecast) } : {}), ...(x.tiedWith ? { tiedWith: x.tiedWith } : {}), why: x.why })),
    first: first?.target, said, chief, chiefIsFirst: chief !== undefined && chief === first?.target,
    predicted: Object.fromEntries([...predicted].map(([k, v]) => [k, r3(pointsOf(v)!)])), candidates,
    realized: Object.fromEntries(Object.entries(realized).map(([k, v]) => [k, r3(v)])), best: best?.[0], bestGain: best ? r3(best[1]) : undefined, firstGain: firstGain !== undefined ? r3(firstGain) : undefined,
    pass, noAdvice: !first, c, d, e, f, g, h, i,
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
    f: { nearMastery: near.length, ladderFalls: near.filter((x) => x.f.falls).length, everyCandidate: near.reduce((t, x) => t + (x.f.every?.falling ?? 0), 0), ofCandidates: near.reduce((t, x) => t + (x.f.every?.n ?? 0), 0), prepLimited: cases.filter((x) => x.f.prep.limited).length, prepSame: cases.filter((x) => x.f.prep.limited && x.f.prep.same).length },
    g: { recs: cases.reduce((t, x) => t + x.g.recs, 0), ok: cases.reduce((t, x) => t + x.g.ok, 0) },
    h: { cases: hs.length, fell: hs.filter((x) => (x.h as { fell: boolean }).fell).length, leads: leads.length, changedWhereLed: leads.filter((x) => (x.h as { ok: boolean }).ok).length, leadsWithinATie: leads.filter((x) => (x.h as { tieLead: boolean }).tieLead).length },
    i: { same: cases.filter((x) => x.i.same).length },
  };
}

/** Every group the criteria report: each set and design, and for F2-A10's cases each band and each stage. */
function groups(cases: readonly CaseOut[]) {
  const out: Record<string, ReturnType<typeof summarize>> = {};
  const by = (name: string, pick: (x: CaseOut) => boolean) => { const xs = cases.filter(pick); if (xs.length) out[name] = summarize(xs); };
  for (const set of ['tuning', 'held-out'] as const) {
    by(`${set}`, (x) => x.set === set);
    by(`${set} F2-A`, (x) => x.set === set && x.design === 'F2-A');
    by(`${set} F2-A10`, (x) => x.set === set && x.design === 'F2-A10');
    for (const band of ['beginner', 'developing', 'advanced', 'nearMastery']) by(`${set} F2-A10 ${band}`, (x) => x.set === set && x.band === band);
    for (const stage of ['firstWeek', 'midTerm', 'later']) by(`${set} F2-A10 ${stage}`, (x) => x.set === set && x.stage === stage);
  }
  return out;
}

const git = (cmd: string) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); } catch { return undefined; } };
const out = arg('out');
const at = { commit: git('rev-parse HEAD'), clean: git('status --porcelain --untracked-files=no') === '', command: `npx vite-node tools/advice.ts -- ${argv.join(' ')}`, at: new Date().toISOString() };

if (argv.includes('--summarize')) {
  const files = argv.slice(argv.indexOf('--summarize') + 1).filter((x) => !x.startsWith('--') && x !== out);
  const read = files.map((f) => JSON.parse(readFileSync(f, 'utf8')) as { commit?: string; cases: CaseOut[] });
  const cases = read.flatMap((x) => x.cases);
  const summary = { ...at, files, commits: [...new Set(read.map((x) => x.commit))], cases: cases.length, groups: groups(cases) };
  console.log(JSON.stringify(summary.groups, null, 1));
  if (out) writeFileSync(out, `${JSON.stringify(summary, null, 1)}\n`);
} else {
  const specs = casesOf(arg('cases', 'tuning'));
  if (specs.some((x) => x.set === 'held-out') && !argv.includes('--held-out')) throw new Error('A held-out seed is run only with --held-out, once, on the code to be reported.');
  const cases: CaseOut[] = [];
  for (const spec of specs) {
    const x = measure(spec);
    cases.push(x);
    console.log(`${x.seed} ${x.band ?? ''} ${x.stage ?? ''} first=${x.first} best=${x.best} (${x.bestGain}) first gained ${x.firstGain} predicted ${(x.e as { predicted?: number }).predicted} ${x.pass ? 'PASS' : 'MISS'} median=${x.c.atOrAboveMedian} e=${(x.e as { within?: boolean }).within} f=${x.f.falls} prep=${x.f.prep.limited ? x.f.prep.same : '-'} g=${x.g.ok}/${x.g.recs} h=${(x.h as { fell?: boolean }).fell}/${(x.h as { ok?: boolean }).ok} i=${x.i.same} d=${x.d.violations.length}/${x.d.allFull.says}`);
    if (out) writeFileSync(out, `${JSON.stringify({ ...at, cases }, null, 1)}\n`);
  }
  const summary = groups(cases);
  console.log(JSON.stringify(summary, null, 1));
  if (out) writeFileSync(out, `${JSON.stringify({ ...at, cases, summary }, null, 1)}\n`);
}
