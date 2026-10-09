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
import { createSave, loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '../src/engine/world/bootstrap';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { templateById } from '../src/engine/content/coursework';
import { courseworkOf, prepareRefusal, questionsFor } from '../src/engine/systems/coursework';
import { CHOICES, momentsOf } from '../src/engine/systems/classmates';
import { lookAfterOptions, readiness, suggestedSleep } from '../src/engine/systems/life';
import { inTheBank } from '../src/engine/systems/spending';

const arg = (name: string, d: number) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const flag = (name: string) => process.argv.includes(`--${name}`);
const SEEDS = arg('seeds', 4);
const YEARS = arg('years', 3);

interface Profile { name: string; config: Partial<NewSaveConfig>; play: 'attentive' | 'autopilot' }

const PROFILES: Profile[] = [
  { name: 'new-york, attentive', config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' }, play: 'attentive' },
  { name: 'mexico-city, attentive', config: { homeRegionId: 'mx-cmx-mexicocity', pronouns: 'he/him' }, play: 'attentive' },
  { name: 'london, early riser and curious, attentive', config: { homeRegionId: 'uk-eng-london', pronouns: 'they/them', personalityTraits: ['early_riser', 'curious'] }, play: 'attentive' },
  { name: 'reykjavik, autopilot', config: { homeRegionId: 'is-39-reykjavik', pronouns: 'she/her' }, play: 'autopilot' },
  // TEST SETUP: a student without the wealthy family behind them, which the game's own new life always has.
  { name: 'test setup: scraping, no family money, attentive', config: { homeRegionId: 'us-ca-losangeles', pronouns: 'he/him', wealth: 'scraping', family: undefined }, play: 'attentive' },
];

function life(seed: string, p: Partial<NewSaveConfig>): Simulation {
  return createSave(1, seed, { ...newLifeConfig(), firstName: 'Ada', lastName: 'Cole', pronouns: 'they/them', ...p });
}

/** One evening's work, as `tests/journey-school-year.test.ts` plays it, the careful way. */
function evening(sim: Simulation) {
  const cw = courseworkOf(sim, sim.player);
  if (!cw) return;
  for (const m of momentsOf(cw).filter((x) => x.status === 'open')) {
    const choice = ({ disagreement: 'both', study: 'yes', help: 'help', apology: 'accept', boundary: 'respect', encouragement: '' } as Record<string, string>)[m.kind] ?? CHOICES[m.kind][0]!.id;
    sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice } });
  }
  for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) {
    if (a.feedback && !a.feedback.seen) sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: a.id } });
    for (const k of a.asks ?? []) if (k.status === 'open') sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    for (const { q, options } of questionsFor(a)) {
      if (a.answers[q.id]) continue;
      const pick = options.find((o) => o.supported) ?? options[0]!;
      sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: pick.id } });
    }
    const t = templateById(a.template)!;
    for (let n = 0; n < Number(process.env.LIVES_STEPS ?? 2); n += 1) {
      const act = t.activities.find((x) => x.dim !== 'partner' && !prepareRefusal(sim, sim.player, a, x.id));
      if (!act || sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } }).error) break;
    }
  }
}

/** What the menu puts first and urgent, done; nothing done that isn't. */
function lookAfter(sim: Simulation) {
  for (let n = 0; n < 3; n += 1) {
    const top = lookAfterOptions(sim)[0];
    if (!top || top.refused || !top.urgent) return;
    if (sim.execute({ kind: 'life.look_after', payload: { action: top.action } }).error) return;
  }
}

interface Result { profile: string; seed: string; graduated: boolean; standing: string; parts: Record<string, number>; wellbeing: Record<string, number>; bank: number; breaches: number; unbalanced: number; reloads: number; error?: string }

function play(profile: Profile, seed: string): Result {
  let sim: Simulation;
  try { sim = life(seed, profile.config); } catch (e) { return { profile: profile.name, seed, graduated: false, standing: 'none', parts: {}, wellbeing: {}, bank: 0, breaches: 0, unbalanced: 0, reloads: 0, error: String((e as Error).message ?? e) }; }
  const end = sim.now + YEARS * 365 * MS_DAY;
  let reloads = 0;
  const ready: number[][] = [];
  let error: string | undefined;
  try {
    while (sim.now < end && sim.universe.meta.endedAt === undefined) {
      const hour = zonedParts(sim.now, sim.zone).hour;
      if (flag('why') && hour === 9) { const w = sim.player.wellbeing; ready.push([readiness(sim.player), w.energy, w.stress, w.sleepDebt, w.nourishment, w.morale, w.condition]); }
      if (profile.play === 'attentive') {
        lookAfter(sim);
        if (hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
        // To bed at eleven, or when the night's call lets them go: a player whose rehearsal runs late goes to bed after it.
        if ((hour >= 23 || hour < 5) && (sim.player.awakeSince ?? 0) <= sim.now) {
          const r = sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } });
          if (r.ok) continue;
        }
      }
      sim.advanceTo(sim.now + (profile.play === 'autopilot' ? MS_DAY : MS_HOUR));
      // Saved and opened again each new year, as a player would between sessions.
      const p = zonedParts(sim.now, sim.zone);
      if (p.month === 1 && p.day === 1 && (profile.play === 'autopilot' || p.hour === 12)) {
        sim = loadSave(deserialise(serialise(sim.universe)) as never);
        reloads += 1;
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
  return {
    profile: profile.name, seed, graduated: school?.standing === 'graduated', standing: school?.standing ?? 'none', parts,
    wellbeing: { energy: Math.round(w.energy), stress: Math.round(w.stress), morale: Math.round(w.morale), condition: Math.round(w.condition), nourishment: Math.round(w.nourishment) },
    bank: Math.round(inTheBank(sim, sim.player) / 100), breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads, ...(error ? { error } : {}),
  };
}

if (flag('why')) {
  const at = process.argv.indexOf('--seed');
  const seed = at > 0 ? process.argv[at + 1]! : 'lives-0';
  const he = flag('he');
  const r = play(he ? { name: 'actor', config: { homeRegionId: 'us-ny-newyork', pronouns: 'he/him' }, play: 'attentive' } : PROFILES[0]!, seed);
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
