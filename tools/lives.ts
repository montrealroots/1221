/**
 * SLATE — lives played through, many at once, by public commands (from the connected world of 2026-10-09).
 *
 * The probe scripts of the line before were throwaway and lived in the git-ignored `probe/`; this is kept, so a
 * long run can be repeated and its numbers checked against what the handoff says. Each life is a profile (who they
 * are, where from, with what) and a way of playing:
 *
 * - `attentive`: what a player who looks after themselves does, every hour through the public commands only: sleeps
 *   the hours the game suggests (`life.sleep`), eats, washes and unwinds when the Look After Yourself menu puts it
 *   first and urgent (`lookAfterOptions`, `life.look_after`), and each evening in New Haven reads feedback, answers
 *   partners and classmates, chooses at the table and prepares the work (`school.*`).
 * - `autopilot`: the clock only, a day at a time, as a player pressing on to the next morning does: the nights the
 *   engine gives somebody who plans none. Not an hour at a time: a step of an hour or less is the player there, kept
 *   up until they choose to sleep (`LONGEST_STEP_WITH_THE_PLAYER`), and played that way every dial falls to its floor
 *   in a month, which is a player who never sleeps, not a player who isn't there. Measured on 2026-10-09.
 *
 * A profile's money and family other than a new life's are TEST SETUP, said in its name: the game's own new life is
 * the wealthy family's (`newLifeFrom`), and these ask what the school, the bank and the papers do with less.
 *
 * What it reports, a line a life: whether it graduated, the parts it was cast in by size, its standing, the dials at
 * the end, the money and the debt, the breaches of the save's laws (`breaches`) and an unbalanced ledger, and
 * anything that threw. `--pairs` plays each seed twice, as an actor and as an actress and otherwise the same, and
 * reports what casting gave each: the falsifiability test on the pronouns.
 *
 *   npx vite-node tools/lives.ts -- --seeds 6 --years 3
 *   npx vite-node tools/lives.ts -- --seeds 20 --pairs
 */
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import type { NewSaveConfig } from '../src/engine/world/bootstrap';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { readiness, suggestedSleep } from '../src/engine/systems/life';
import { inTheBank } from '../src/engine/systems/spending';
import { careFor, coverOn } from '../src/engine/systems/health';
import { CARE } from '../src/engine/content/safetynet';
import { mayHurt } from '../src/engine/systems/injury';
import { journeyOf } from '../src/engine/systems/evaluation';
import { abilitiesOf, developmentOf } from '../src/engine/systems/attributes';

const arg = (name: string, d: number) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const flag = (name: string) => process.argv.includes(`--${name}`);
const SEEDS = arg('seeds', 4);
const YEARS = arg('years', 3);

interface Profile { name: string; config: Partial<NewSaveConfig>; play: 'attentive' | 'autopilot' | 'practicing'; adverse?: boolean }

const PROFILES: Profile[] = [
  { name: 'new-york, attentive', config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' }, play: 'attentive' },
  { name: 'mexico-city, attentive', config: { homeRegionId: 'mx-cmx-mexicocity', pronouns: 'he/him' }, play: 'attentive' },
  { name: 'london, early riser and curious, attentive', config: { homeRegionId: 'uk-eng-london', pronouns: 'they/them', personalityTraits: ['early_riser', 'curious'] }, play: 'attentive' },
  { name: 'reykjavik, autopilot', config: { homeRegionId: 'is-39-reykjavik', pronouns: 'she/her' }, play: 'autopilot' },
  // From 2026-10-09: attentive, and the hours left over spent as the Player Profile suggests (`practiceHour`).
  { name: 'new-york, practicing', config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her', genres: ['comedy', 'tragedy'] }, play: 'practicing' },
  // TEST SETUP: a student without the wealthy family behind them, which the game's own new life always has.
  // TEST SETUP: a student without the wealthy family behind them, and from 2026-10-10 under pressure: the flu mid-term
  // each term and an everyday injury each spring (`adverse`), so illness, injury and the recovery from them are played.
  // Until the second pass of 2026-10-10 the flu came on 1 September and 1 January, a holiday, written straight onto the
  // record without its toll on the body, and the student never called in sick: one life lost no counted work to any of
  // it, which was the wrong measure. What's reported now is each event, and the work judged ill or hurt against the rest.
  { name: 'pressure: scraping, the flu and an injury, attentive', config: { homeRegionId: 'us-ca-losangeles', pronouns: 'he/him', wealth: 'scraping', family: undefined }, play: 'attentive', adverse: true },
];

import { life, evening, freeHour, practiceHour, keepCovered, lookAfter } from './policy';

interface Result { journey?: Record<string, unknown>; cast?: Record<string, unknown>; work?: Record<string, unknown>; abilities?: Record<string, number>; profile: string; seed: string; graduated: boolean; standing: string; usStatus?: string; cover?: string; planEnded?: boolean; parts: Record<string, number>; wellbeing: Record<string, number>; bank: number; breaches: number; unbalanced: number; reloads: number; error?: string }

function play(profile: Profile, seed: string): Result {
  let sim: Simulation;
  try { sim = life(seed, profile.config); } catch (e) { return { profile: profile.name, seed, graduated: false, standing: 'none', parts: {}, wellbeing: {}, bank: 0, breaches: 0, unbalanced: 0, reloads: 0, error: String((e as Error).message ?? e) }; }
  const end = sim.now + YEARS * 365 * MS_DAY;
  let reloads = 0;
  let lastReload = sim.now;
  const struck = new Set<string>();
  const adverse: { at: string; what: string; days: number }[] = [];
  const ready: number[][] = [];
  let error: string | undefined;
  try {
    while (sim.now < end && sim.universe.meta.endedAt === undefined) {
      const hour = zonedParts(sim.now, sim.zone).hour;
      if (flag('why') && hour === 9) { const w = sim.player.wellbeing; ready.push([readiness(sim.player), w.energy, w.stress, w.sleepDebt, w.nourishment, w.morale, w.condition]); }
      if (profile.play === 'attentive' || profile.play === 'practicing') {
        lookAfter(sim);
        if (hour === 12) keepCovered(sim);
        if (hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
        // Free hours from the end of classes to ten, and the weekend's from ten.
        const weekend = [0, 6].includes(new Date(sim.now).getUTCDay());
        if (hour >= (weekend ? 10 : 15) && hour < 22 && freeHour(sim)) continue;
        if (profile.play === 'practicing' && hour >= (weekend ? 10 : 15) && hour < 22 && practiceHour(sim)) continue;
        // To bed at eleven, or when the night's call lets them go: a player whose rehearsal runs late goes to bed after it.
        if ((hour >= 23 || hour < 5) && (sim.player.awakeSince ?? 0) <= sim.now) {
          const r = sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } });
          if (r.ok) continue;
        }
      }
      sim.advanceTo(sim.now + (profile.play === 'autopilot' ? MS_DAY : MS_HOUR));
      const p = zonedParts(sim.now, sim.zone);
      // Under pressure: the flu through the game's own care (its toll and its days) mid-term, on 15 October and 15
      // February, and an everyday injury on 1 March, each at the first hour seen that day or after (a night's sleep
      // passes hours unseen).
      if (profile.adverse) {
        const key = (m: number, d: number) => (p.month === m && p.day >= d) || (p.month === m + 1 && p.day < d) ? `${p.year}-${m}` : undefined;
        const flu = key(10, 15) ?? key(2, 15);
        if (flu && !struck.has(`flu ${flu}`)) {
          struck.add(`flu ${flu}`);
          careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
          adverse.push({ at: `${p.year}-${p.month}-${p.day}`, what: 'flu', days: CARE.fluDays });
        }
        const hurt = key(3, 1);
        if (hurt && !struck.has(`hurt ${hurt}`)) {
          struck.add(`hurt ${hurt}`);
          const i = mayHurt(sim, sim.player, 'fall', 1, sim.now);
          adverse.push({ at: `${p.year}-${p.month}-${p.day}`, what: i ? i.kind : 'already hurt', days: i ? Math.round((i.until - i.at) / MS_DAY) : 0 });
        }
      }
      // Saved and opened again every thirty days (from 2026-10-10; each new year until then), as a player would between sessions.
      if (sim.now - lastReload >= 30 * MS_DAY && (profile.play === 'autopilot' || p.hour === 12)) {
        sim = loadSave(deserialise(serialise(sim.universe)) as never);
        reloads += 1;
        lastReload = sim.now;
      }
    }
  } catch (e) {
    error = String((e as Error).message ?? e);
  }
  if (flag('why')) { const avg = (k: number) => Math.round(ready.reduce((a, r) => a + r[k]!, 0) / Math.max(1, ready.length)); console.log('AT NINE', ['readiness', 'energy', 'stress', 'debt', 'nourishment', 'morale', 'condition'].map((n, k) => n + ' ' + avg(k)).join(', ')); }
  if (flag('why')) for (const h of sim.player.school?.history ?? []) console.log('TERM', h.term, h.standing, h.reason.slice(0, 260), Math.round(h.attendance * 100), h.growth.toFixed(2), h.classGrowth.toFixed(2), h.work ?? '', JSON.stringify(sim.player.school?.tally));
  const school = sim.player.school;
  const parts: Record<string, number> = {};
  for (const c of school?.credits ?? []) parts[c.size ?? 'unsized'] = (parts[c.size ?? 'unsized'] ?? 0) + 1;
  const w = sim.player.wellbeing;
  // What the evaluation made of the work (from 2026-10-09): each kind's mean whole by school year, the bands, and how
  // much the development history recorded.
  const work = sim.player.work ?? [];
  const first = work[0]?.at ?? sim.now;
  const byYear: Record<string, { n: number; mean: number }> = {};
  for (const x of work) {
    const k = `${x.task} y${1 + Math.floor((x.at - first) / (365 * MS_DAY))}`;
    const b = (byYear[k] ??= { n: 0, mean: 0 });
    b.mean = (b.mean * b.n + x.overall) / (b.n + 1);
    b.n += 1;
  }
  const bands: Record<string, number> = {};
  for (const x of work) if (x.band) bands[`${x.task}:${x.band}`] = (bands[`${x.task}:${x.band}`] ?? 0) + 1;
  // What held each kind of work back most, summed: the reasons as the evaluation gave them.
  const held: Record<string, number> = {};
  for (const x of work) for (const l of x.limits) held[`${x.task} ${l.kind}:${l.what}`] = (held[`${x.task} ${l.kind}:${l.what}`] ?? 0) + l.by;
  const top = Object.fromEntries(Object.entries(held).sort((p, q) => q[1] - p[1]).slice(0, 10).map(([k, v]) => [k, Math.round(v)]));
  const ab = abilitiesOf(sim, sim.player);
  return {
    // A lifetime's figures from the journey's lasting counts (from 2026-10-10), and whether they agree with themselves.
    journey: (() => {
      const j = journeyOf(sim.player);
      const termN = Object.values(j.byTerm).reduce((s, t) => s + Object.values(t).reduce((a, x) => a + (x?.n ?? 0), 0), 0);
      const totalN = Object.values(j.totals).reduce((a, x) => a + (x?.n ?? 0), 0);
      return {
        totals: Object.fromEntries(Object.entries(j.totals).map(([k, x]) => [k, `${x!.n} @ ${(x!.sum / x!.n).toFixed(1)}, best ${x!.best}, ${JSON.stringify(x!.bands)}`])),
        terms: Object.fromEntries(Object.entries(j.byTerm).map(([t, by]) => [t, Object.fromEntries(Object.entries(by).map(([k, x]) => [k, `${x!.n} @ ${(x!.sum / x!.n).toFixed(1)}`]))])),
        runs: j.milestones.filter((m) => m.kind === 'run').map((m) => `${m.what}: ${m.overall} (${m.detail})`),
        firsts: j.milestones.filter((m) => m.kind !== 'run').map((m) => `${m.kind} ${m.overall}`),
        consistent: termN === totalN, total: totalN, keptInDetail: work.length,
      };
    })(),
    cast: (() => {
      const r = sim.player.school?.castRead;
      if (!r) return undefined;
      const me = r.rows.find((x) => x.you);
      const order = [...r.rows].sort((a, b) => b.score - a.score);
      return me ? { play: r.play, fit: me.fit, delivery: me.delivery, part: me.part, rank: `${order.indexOf(me) + 1} of ${order.length}`, best: order[0]!.fit } : undefined;
    })(),
    work: { n: work.length, mastery: work.filter((x) => x.mastery).length, byYear: Object.fromEntries(Object.entries(byYear).map(([k, v]) => [k, `${v.n} @ ${v.mean.toFixed(1)}`])), bands, history: developmentOf(sim.player).history.length, held: top },
    abilities: Object.fromEntries(Object.entries(ab).map(([k, v]) => [k, Math.round(v)])),
    profile: profile.name, seed, graduated: school?.standing === 'graduated', standing: school?.standing ?? 'none', parts,
    wellbeing: { energy: Math.round(w.energy), stress: Math.round(w.stress), morale: Math.round(w.morale), condition: Math.round(w.condition), nourishment: Math.round(w.nourishment) },
    // An international graduate's status and cover at the end (from 2026-10-09: the marketplace asks lawful presence).
    usStatus: sim.player.usOutOfStatus !== undefined ? 'out of status' : 'in status or a citizen', cover: coverOn(sim.player, sim.now) ?? 'none',
    planEnded: sim.universe.notifications.some((n) => n.title === 'Your Marketplace Plan Has Ended'),
    // The work judged ill, hurt or concussed against the rest, from the detail kept; and the days excused.
    ...(profile.adverse ? { adverse, condition: (() => {
      const of = (f: (c: Record<string, unknown>) => boolean) => { const xs = work.filter((x) => f(x.inputs.condition as never)); return { n: xs.length, mean: xs.length ? Math.round(xs.reduce((a, x) => a + x.overall, 0) / xs.length * 10) / 10 : null, tasks: [...new Set(xs.map((x) => x.task))] }; };
      return { ill: of((c) => Boolean(c.ill)), injured: of((c) => Boolean(c.injured)), concussed: of((c) => Boolean(c.concussed)), well: of((c) => !c.ill && !c.injured && !c.concussed), days: { classDays: school?.tally?.classDays, attended: school?.tally?.attended, excused: school?.tally?.excused } };
    })() } : {}),
    bank: Math.round(inTheBank(sim, sim.player) / 100), breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads, ...(error ? { error } : {}),
  };
}

if (flag('why')) {
  const at = process.argv.indexOf('--seed');
  const seed = at > 0 ? process.argv[at + 1]! : 'lives-0';
  const he = flag('he');
  const named = PROFILES.find((p) => p.name === process.argv[process.argv.indexOf('--profile') + 1]);
  const r = play(he ? { name: 'actor', config: { homeRegionId: 'us-ny-newyork', pronouns: 'he/him' }, play: 'attentive' } : named ?? PROFILES[0]!, seed);
  console.log(JSON.stringify(r));
} else if (flag('pairs')) {
  // The same seed as an actor and as an actress, otherwise alike: what casting gives each.
  const tally = { actor: { lead: 0, supporting: 0, featured: 0 }, actress: { lead: 0, supporting: 0, featured: 0 } } as Record<string, Record<string, number>>;
  for (let n = 0; n < SEEDS; n += 1) {
    for (const [title, pronouns] of [['actor', 'he/him'], ['actress', 'she/her']] as const) {
      const r = play({ name: title, config: { homeRegionId: 'us-ny-newyork', pronouns }, play: 'attentive' }, `pair-${n}`);
      for (const [size, k] of Object.entries(r.parts)) tally[title]![size] = (tally[title]![size] ?? 0) + k;
      console.log(JSON.stringify({ title, ...r }));
    }
  }
  console.log('PAIRS', JSON.stringify(tally));
} else {
  for (const profile of PROFILES) for (let n = 0; n < SEEDS; n += 1) console.log(JSON.stringify(play(profile, `lives-${n}`)));
}
