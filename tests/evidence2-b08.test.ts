/**
 * The second round of 2026-10-13 (verification batch b08): six rows the first round left partial, each describe a row
 * by its id in docs/verification/audit/*.json. Each action is reached as a player reaches it, by the command its entry
 * runs (`sim.execute`, `sim.must`) or by the clock that fires its scheduled kind (`sim.advanceTo`), and each consequence
 * is read where the row says it's read, against figures worked here by hand from the rule's own numbers and written as
 * literals or as the rule's arithmetic on the life's own inputs, never asked of the helper the engine computes them with.
 *
 * - school.stipend: the first round held an F-1 student's stipend to nothing withheld, a figure worked on a resident's
 *   standard deduction beside a 1040-NR that allows none. Here the first Friday's $375 is held to the 1040-NR's own 10%
 *   from the first dollar, $37.50, and the next February's return to the work-study's 10% left to pay. It failed when
 *   written, on a defect (see its comment). And the resident's 2027 return, made by the clock, is read whole: the
 *   federal tax, Connecticut's line, the payroll tax, every week's withholding, the balance and its split between the
 *   IRS and Connecticut, which the first round left unread.
 * - abilities+techniques: reachOf was read by no played test, and the whole of a showing was never shown to rise from
 *   a grown ability, only one dimension. Here a play read by command grows imagination toward its reach, the mean of
 *   character's and script's ceilings, in the rule's ratio between two twins and not at all in a third at it, and the
 *   Profile prints that reach; four abilities practised by command lift the next showing's whole, every dimension that
 *   reads them and none that doesn't; and a Rep understudy's night, which the Rep's company reads for voice and
 *   movement, is judged on them once, as abilities, by the clock, where the first round replayed a record by hand.
 * - genre demands: a Summer Cabaret night of A Marriage Proposal, a farce, by the clock, reads its own techniques and
 *   not the clown its farce demands, and comes out the same with clown mastered. The farce's look says work in it
 *   reads Clown And Mask, which a farce's night doesn't: that test failed when written, on a defect (see its comment).
 * - casting (castFit/castScore): each Carlotta night's delivery is worked from its own record by the rule (each
 *   dimension's least part against what completes it, times the day, which a readiness under 60 costs the five
 *   dimensions fatigue reaches), where the first round compared the run's sums with themselves; with the closing night's
 *   growth given to the twin who slept through it, the chair reads one fit for both, and the reads differ by a fifth of
 *   it times the delivery between them; and the real term's parts are checked by partsFor's own rule, by title, not by
 *   an observation that no lead was read below a featured part.
 * - standing/term evaluation: the first round's fall come to class spent fell short on its coursework too, so its
 *   concern couldn't fail on the pace alone. Here the same worked fall is weighed against a class three times as
 *   driven: the player's growth, attendance and coursework the same to the figure, and standing a concern for the pace
 *   alone, in its words, that holds back the Rep and the Summer Cabaret, and is drawn on the Standing tab.
 * - preparation dims: the first round's Learn Lines grew the lines' craft in one twin only. Here Read The Scene, which
 *   grows no technique and focus by under a hundredth a read, is done four times against twice: the craft the same,
 *   the showing's interpretation lower in the twin by the prepared factor the rule gives its familiarity (0.35 + 0.65 ×
 *   part ÷ need), the dimensions that don't read it the same, the whole higher, and the Coursework tab's figure drawn
 *   for each.
 *
 * PLAYER JOURNEY: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) or, for the F-1 student, in London, an actor at Yale in New
 * Haven from Monday 24 August 2026, played by the clock and through the commands a screen sends. Twins are forks of one
 * played save (`loadSave` of its serialisation) at the moment before the choice that parts them. The seeds were chosen
 * for what the clock draws on them: g22-stipend and g22-stipend-wages (the summer company joined), g18-probe (Acting I's
 * first scene, The Cherry Orchard's fourth act with Theo Patel, due Tuesday 8 September), g24-c (a Carlotta lead, then
 * Major Barbara), g22-summer (A Marriage Proposal, The Bear and Riders To The Sea in the summer company) and g24-probe (a
 * fall worked). Screens are rendered with react-dom/server, as the first round's files render them.
 *
 * TEST SETUP, said again where it's done: a student who does the coursework, its every part prepared to 0.95 each
 * midnight, where a row is about what follows from work done; $40,000 of wages earlier in a year, recorded as a job's
 * pay is; the day's dials, alike in twins compared, before a read, a showing or a step, and kept rested through days
 * of practice as a player who looks after themselves keeps them; an ability's level set at or
 * under its reach before a read; a scene's other parts at 0.95 where the part under test is another; clown set mastered
 * in one twin before a night; the closing night's growth given to the twin who slept through it; and every classmate's
 * drive set at 3, a class three times as driven as an ordinary one, before a fall.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import { STIPEND_KIND, SUMMER_KIND } from '@/engine/systems/school';
import { courseworkOf, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { developmentOf } from '@/engine/systems/attributes';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';
import { startRefusal } from '@/engine/systems/life';
import type { WorkRecord } from '@/engine/systems/evaluation';
import { TECHNIQUE_LABEL } from '@/engine/content/abilities';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import { DEMAND_TECHNIQUE, genreTags } from '@/engine/content/demands';
import type { Skill } from '@/engine/content/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
}));

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { CourseworkPane } = await import('@/ui/components/CourseworkPane');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
type Looked = import('@/ui/looks/registry').Looked;

// ---------------------------------------------------------------------------------------------------------------------
// The lives, the clock, and the screens over them
// ---------------------------------------------------------------------------------------------------------------------

const zone = 'America/New_York';
const ACTING_I = 'DRAM 103a/b';
const CARLOTTA = 'Carlotta Festival Of New Plays';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const onDay = (key: string, hour: number, minute = 0) => { const [y, m, d] = key.split('-').map(Number); return at(y!, m!, d!, hour, minute); };
const life = (seed: string, born = 'us-ny-newyork'): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: born, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const round3 = (x: number) => Math.round(x * 1000) / 1000;

/** TEST SETUP: a student who does the coursework, its every part prepared to 0.95, as tests/casting.test.ts plays one. */
const doTheWork = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); };
/** TEST SETUP: the work done each midnight, through however the test moves the clock (a load drops the listener; it's added again). */
const working = (sim: Simulation): Simulation => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => doTheWork(s)); return sim; };
/** Played by the clock, six hours at a time. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); };
/** TEST SETUP: the same seven dials, so the readiness a step, a showing or a class day reads is alike wherever two are compared. */
const dials = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
/** TEST SETUP: played by somebody who looks after themselves, rested and awake through the evening. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** The player waits, rested, for the first quarter-hour with nothing on their calendar for so many minutes. */
const freeFor = (sim: Simulation, minutes: number) => { while (startRefusal(sim, sim.player, minutes)) tended(sim, sim.now + 15 * 60_000); };
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);

function go<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
/** A command refused: its words. */
function no(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const r = sim.execute({ kind, payload });
  expect(r.ok, `${kind} was let through`).toBe(false);
  return r.error!;
}

/** A save played once and kept, each test given its own load of it. */
const saves = new Map<string, string>();
function kept(key: string, build: () => Simulation): Simulation {
  let raw = saves.get(key);
  if (raw === undefined) { raw = serialise(build().universe); saves.set(key, raw); }
  return loadSave(deserialise(raw) as never);
}

const cwOf = (sim: Simulation) => courseworkOf(sim, sim.player)!;
const work = (sim: Simulation, id: string): Assignment => cwOf(sim).assignments.find((a) => a.id === id)!;
const actingI = (sim: Simulation): Assignment => cwOf(sim).assignments.find((a) => a.course === ACTING_I && (a.status === 'open' || a.status === 'revising'))!;
/** The showings of a piece on the record, by the key `show` judges them under. */
const shownRecords = (sim: Simulation, a: Assignment) => (sim.player.work ?? []).filter((w) => w.inputs.key.startsWith(`show:${sim.player.id}:${a.id}:`));
/** Every question at the table answered as the text supports it, through the command (ten minutes each). */
const answerAsTheTextSupports = (sim: Simulation, a: Assignment) => { for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id }); };
/** Played to a meeting's class day and past it, rested alike (TEST SETUP) at the door. */
function toMeeting(sim: Simulation, dueOn: string): void {
  sim.advanceTo(onDay(dueOn, 8, 59));
  dials(sim);
  sim.advanceTo(onDay(dueOn, 15, 30));
}
/** What the history kept since a moment: the entries that weren't there then (it keeps 400, so its length can't tell). */
const keptSince = (sim: Simulation) => {
  const was = new Set(developmentOf(sim.player).history);
  return () => developmentOf(sim.player).history.filter((x) => !was.has(x));
};
const nightsOf = (sim: Simulation, what: string): WorkRecord[] => (sim.player.work ?? []).filter((w) => w.task === 'performance' && w.what === what);

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/** A screen as the player has it: its markup, and its words with every tooltip taken out before the tags. */
function drawn(sim: Simulation, screen: FunctionComponent, tab = 'standing'): { html: string; text: string } {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: textOf(html.replace(/\stitle="[^"]*"/g, '')) };
}

/** g18-probe on Friday 28 August 2026 at two, the courses' first work set. */
const probeAug28 = () => kept('g18-probe:aug28', () => { const s = life('g18-probe'); s.advanceTo(at(2026, 8, 28, 14)); return s; });
/** g24-c, doing the work, two hours before Carlotta's closing night: Wednesday 12 May 2027 at six. */
const closingEve = () => working(kept('g24-c:closing', () => { const s = working(life('g24-c')); s.advanceTo(at(2027, 5, 12, 18)); return s; }));
/** The same, every night played, at the fall's casting: Monday 23 August 2027, a minute past nine. */
const fallCast = () => working(kept('g24-c:fall', () => { const s = closingEve(); s.advanceTo(at(2027, 8, 23, 9, 1)); return s; }));

// ---------------------------------------------------------------------------------------------------------------------
// school.stipend
// ---------------------------------------------------------------------------------------------------------------------

describe('school.stipend', () => {
  /** A life in the summer company, played to the first Friday's stipend, the minute before it's paid. */
  const toFirstFriday = (seed: string, born?: string) => {
    const sim = working(life(seed, born));
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const pay = pending(sim, STIPEND_KIND);
    // Every Friday at five from 4 June, the first rehearsal week, to 27 August, the week after the closing: thirteen.
    expect(pay).toHaveLength(13);
    expect(pay[0]!.at).toBe(at(2027, 6, 4, 17));
    play(sim, pay[0]!.at - 60_000);
    return { sim, first: pay[0]! };
  };
  const stipends = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Yale Summer Cabaret stipend, the week');
  const accounts = (sim: Simulation) => ({ wages: sim.nominalAccount('income', 'Wages').id, withheld: sim.nominalAccount('expense', 'Tax Withheld').id });

  it('PLAYER JOURNEY: an F-1 student’s first stipend withholds the 1040-NR’s own 10% of $375, $37.50, and no FICA; the next February’s 1040-NR leaves only the work-study’s 10% to pay', () => {
    // DEFECT, failed when written (2026-10-13). STIPEND_KIND (src/engine/systems/school.ts, the `taxOf` it withholds
    // by) works a nonresident's federal withholding on computeAnnualTax, which takes a resident's standard deduction, so
    // the first $375 of the year withholds nothing; the 1040-NR the same save files for the year (`figuresFor`, which
    // adds the deduction back for a nonresident: Form 1040-NR allows none) taxes those dollars at 10% from the first. A
    // paycheck's withholding is the year's tax on the wages to date less what was withheld before, as the resident's is
    // here, so the right figure is the 1040-NR's: 10% of $375, $37.50 (IRS Pub 15-T's nonresident-alien adjustment, which
    // adds an amount to the wages before the tables for the same reason, gives a positive figure too). SLATE already
    // withholds an F-1 student's scholarship at the nonresident's 14% (`NONRESIDENT_SCHOLARSHIP_RATE`). The smallest
    // fix: in the stipend's `taxOf`, add the federal standard deduction to the year's wages for a nonresident
    // (`nonresidentFor`), as `figuresFor` does. tests/evidence-g22-school.test.ts's F-1 test, which held nothing
    // withheld, is corrected with it.
    const { sim, first } = toFirstFriday('g22-stipend', 'uk-eng-london');
    sim.advanceTo(first.at + 60_000);
    const { wages, withheld } = accounts(sim);
    const [tx, ...more] = stipends(sim);
    expect(more).toEqual([]);
    expect(tx!.postings.find((x) => x.accountId === wages)!.amount).toBe(-375_00);
    // No FICA for a nonresident alien on an F-1 (IRC 3121(b)(19)), none of Connecticut's under its $15,000 exemption,
    // and the IRS's 10% of $375 from the first dollar.
    expect(tx!.postings.find((x) => x.accountId === withheld)?.amount).toBe(37_50);
    expect(tx!.postings.filter((x) => x.accountId !== wages && x.accountId !== withheld).map((x) => x.amount)).toEqual([337_50]);
    expect(yearOf(sim.player, 2027)).toMatchObject({ acting: 375_00, withheld: 37_50, withheldBy: { us: 37_50 } });
    // The return made by the clock the next February: the thirteen weeks' $37.50 against the 1040-NR's 10% of the
    // summer's wages and the work-study's, so what's left is the work-study's 10%, which no paycheck withheld.
    play(sim, at(2028, 2, 1, 10));
    const f = returnsOf(sim.player)['2027']!.figures;
    expect(f.form).toBe('1040-NR');
    expect(f.acting).toBe(13 * 375_00);
    expect(f.payroll).toBe(0);
    expect(f.withheld).toBe(13 * 37_50);
    expect(f.balance).toBe(Math.round(0.1 * f.workStudy));
  }, 60_000);

  it('PLAYER JOURNEY: with $40,000 of wages earlier in the year, the next February’s return reads the summer the clock paid whole: $3,623.96 federal, Connecticut’s $1,733.84, $3,432.94 of payroll tax, $1,357.88 withheld, a $7,432.86 balance split $6,098.96 to the IRS and $1,333.90 to Connecticut', () => {
    const { sim } = toFirstFriday('g22-stipend-wages');
    // TEST SETUP: $40,000 of wages from a job earlier in 2027, recorded as a job's pay is, nothing withheld on them.
    recordWages(sim.player, at(2027, 1, 15, 12), zone, { gross: 40_000_00, employer: 'an earlier job' });
    play(sim, at(2028, 2, 1, 10));
    const { withheld } = accounts(sim);
    expect(stipends(sim)).toHaveLength(13);
    const y = yearOf(sim.player, 2027);
    expect(y.acting).toBe(40_000_00 + 13 * 375_00);
    // What else the played year brought: the work-study's wages and the bank's interest.
    expect(y.workStudy).toBe(3_450_00);
    expect(y.interest).toBe(41_31);
    // The thirteen weeks' withholding, each the year's tax to date less what came before, so together the tax on
    // $44,875 less the tax on $40,000: the IRS's 12% of $4,875, $585.00; FICA's 7.65%, from $3,060.00 to $3,432.94,
    // $372.94; Connecticut's from $1,192.50 (its exemption $5,000 at $40,000, 2% to $10,000 and 4.5% on, less its 10%
    // credit) to $1,592.44 (no exemption left past $45,000's start, $1,769.38 less 10%), $399.94.
    const postings = stipends(sim).reduce((sum, t) => sum + (t.postings.find((x) => x.accountId === withheld)?.amount ?? 0), 0);
    expect(postings).toBe(585_00 + 372_94 + 399_94);
    expect(y.withheld).toBe(1_357_88);
    expect(y.withheldBy).toEqual({ us: 585_00 + 372_94, 'us-ct': 399_94 });

    const r = returnsOf(sim.player)['2027']!;
    const f = r.figures;
    expect(f.form).toBeUndefined();
    // Income: $44,875 of wages, $3,450 of work-study and $41.31 of interest, $48,366.31.
    expect(f.income).toBe(48_366_31);
    // Federal, 2027 on 2026's table, which the tax table holds until the IRS publishes 2027's (Rev. Proc. 2025-32):
    // $16,100 deducted, $32,266.31 taxed; 10% to $12,400 ($1,240.00) and 12% of the $19,866.31 past it ($2,383.9572,
    // $2,383.96), $3,623.96. Until 2026-10-14 this held $3,819.96, on 2024's table: $14,600 deducted, $1,160.00 and 12%
    // of $22,166.31, $2,659.96.
    expect(f.federal).toBe(3_623_96);
    // Connecticut: $18,366.31 past $30,000 takes the whole $15,000 exemption; 2% of $10,000 and 4.5% of $38,366.31,
    // $1,926.48; its credit at this income 10%: $1,733.84. Nothing credited for another state's tax.
    expect(f.states).toEqual([{ state: 'us-ct', tax: 1_733_84, credit: 0 }]);
    // Payroll tax on the acting wages alone, 7.65% of $44,875: $3,432.94.
    expect(f.payroll).toBe(3_432_94);
    expect(f.withheld).toBe(1_357_88);
    // What's owed: the federal, Connecticut's and the payroll tax, less the year's withholding.
    // $3,623.96 + $1,733.84 + $3,432.94 - $1,357.88, $7,432.86 (until 2026-10-14, $7,628.86, on 2024's table).
    expect(f.balance).toBe(3_623_96 + 1_733_84 + 3_432_94 - 1_357_88);
    expect(f.balance).toBe(7_432_86);
    // And by authority: Connecticut's own $399.94 withheld against its $1,733.84, the IRS the rest.
    // The IRS's: $3,623.96 + $3,432.94 - $957.94 withheld, $6,098.96 (until 2026-10-14, $6,294.96, on 2024's table).
    expect(f.owedTo).toEqual({ irs: 6_098_96, states: { 'us-ct': 1_333_90 } });
    expect(f.owedTo!.irs).toBe(3_623_96 + 3_432_94 - (585_00 + 372_94));
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// abilities+techniques
// ---------------------------------------------------------------------------------------------------------------------

describe('abilities+techniques', () => {
  /** g18-probe on Saturday 29 August 2026 at ten, the library known from the tour, the morning free. */
  const readDay = () => kept('g18-probe:aug29', () => { const s = life('g18-probe'); s.advanceTo(at(2026, 8, 29, 10)); return s; });

  it('PLAYER JOURNEY: a play read by command grows imagination toward its reach, the mean of character’s and script’s ceilings: twins as played and five under it rise in the rule’s ratio, one at it not at all, and the Profile prints that reach', () => {
    const base = readDay();
    const c = base.player.craftCeiling!;
    // Imagination's kin are character and script (`ABILITY_KIN`): the reach classes and the work grow it toward is the
    // mean of their ceilings.
    const R = (c.character + c.script) / 2;
    const L = base.player.attrs!.imagination!;
    expect(L).toBeLessThan(R - 5);
    const read = (level?: number) => {
      const s = readDay();
      dials(s); // TEST SETUP: the same day for every twin.
      if (level !== undefined) s.player.attrs!.imagination = level; // TEST SETUP: imagination at a level by its reach.
      const was = s.player.attrs!.imagination!;
      const script = s.player.craft!.script;
      const since = keptSince(s);
      const r = s.must<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: 'proof' } });
      expect(r.note.startsWith('You read Proof, by ')).toBe(true);
      return { s, rise: s.player.attrs!.imagination! - was, script: s.player.craft!.script - script, kept: since().filter((x) => x.source === 'read:proof') };
    };
    const asPlayed = read();
    const under = read(R - 5);
    const atReach = read(R);
    // An ordinary session's gain is the room left to the reach to the power 1.5, the same focus and weight in each: so
    // the twin as played (R − L of room) rises ((R − L) ÷ 5)^1.5 times the twin five under it.
    expect(asPlayed.rise).toBeGreaterThan(0);
    expect(under.rise).toBeGreaterThan(0);
    expect(asPlayed.rise / under.rise).toBeCloseTo(((R - L) / 5) ** 1.5, 6);
    // At the reach, nothing: no rise and nothing kept for it, while the read grew script as it did in the others.
    expect(atReach.rise).toBe(0);
    expect(atReach.kept.filter((x) => x.id === 'imagination')).toEqual([]);
    expect(atReach.script).toBeGreaterThan(0);
    expect(atReach.script).toBe(asPlayed.script);
    // Each rise kept under the read's source, at full precision from 2026-10-17 (brief 11, A5: `recordDevelopment`), where
    // until then it was kept to a thousandth.
    expect(asPlayed.kept.filter((x) => x.id === 'imagination').map((x) => x.delta)).toEqual([asPlayed.rise]);
    expect(under.kept.filter((x) => x.id === 'imagination').map((x) => x.delta)).toEqual([under.rise]);

    // The Profile, as the player has it: imagination now, full at 100, its reach, and the read as its last change; a
    // technique's reach is its own ceiling; presence, which classes don't build, has none.
    const { text } = drawn(asPlayed.s, ProfileWorkspace);
    expect(text).toContain(`Imagination ${asPlayed.s.player.attrs!.imagination!.toFixed(1)} 100.0 ${R.toFixed(1)} `);
    // Rounded once, from the rise itself (from 2026-10-17; until then from its thousandth, a second rounding).
    expect(text).toContain(`+${asPlayed.rise.toFixed(2)}, Reading a play`);
    expect(text).toContain(`${TECHNIQUE_LABEL.script} ${asPlayed.s.player.craft!.script.toFixed(1)} ${c.script.toFixed(1)} `);
    expect(text).toContain(`Presence ${asPlayed.s.player.attrs!.presence.toFixed(1)} 100.0 — `);
  }, 60_000);

  it('PLAYER JOURNEY: four abilities practised by command an hour a day for eleven days lift the next showing’s whole: every dimension that reads them higher, the two that read none of them the same, the techniques and the preparation alike', () => {
    const run = (exercises: readonly string[]) => {
      const s = probeAug28();
      const id = actingI(s).id;
      for (let i = 0; i < 2; i += 1) { dials(s); go(s, 'school.prepare', { assignmentId: id, activity: 'read' }); }
      answerAsTheTextSupports(s, work(s, id));
      // TEST SETUP: the scene's other parts at 0.95 in both, so preparation holds no dimension back far.
      Object.assign(work(s, id).prep, { memorization: 0.95, rehearsal: 0.95, partner: 0.95, familiarity: 0.95 });
      // Friday the 28th to Monday 7 September, each day's hours after five (the first day's after three).
      for (const [m, d] of [[8, 28], [8, 29], [8, 30], [8, 31], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7]] as const) {
        tended(s, at(2026, m, d, m === 8 && d === 28 ? 15 : 17));
        if (!exercises.length) continue;
        freeFor(s, 60 * exercises.length);
        for (const e of exercises) go(s, 'practice.exercise', { exercise: e });
      }
      toMeeting(s, '2026-09-08');
      const [rec, ...more] = shownRecords(s, work(s, id));
      expect(more).toEqual([]);
      return { s, rec: rec!, id };
    };
    // Sense Memory trains emotional depth, The Given Circumstances imagination, A Recall Drill memory, Voice Work the
    // voice (`EXERCISES`).
    const p = run(['sense-memory', 'given-circumstances', 'recall-drill', 'voice-work']);
    const q = run([]);
    expect(p.rec.at).toBe(q.rec.at);
    const A = (r: WorkRecord) => r.inputs.abilities;
    for (const a of ['emotionalDepth', 'imagination', 'memory', 'vocal', 'discipline'] as const) expect(A(p.rec)[a]!, a).toBeGreaterThan(A(q.rec)[a]!);
    // Kept under each exercise's source.
    for (const e of ['sense-memory', 'given-circumstances', 'recall-drill', 'voice-work']) expect(developmentOf(p.s.player).history.filter((x) => x.source === `practice:${e}`).length, e).toBeGreaterThan(0);
    // The same work otherwise: the techniques it reads to a thousandth (discipline lifts the classes' growth a little),
    // and the same preparation, day and key.
    const levels = (r: WorkRecord) => r.inputs.levels ?? {};
    expect(Object.keys(levels(p.rec)).sort()).toEqual(Object.keys(levels(q.rec)).sort());
    for (const [k, v] of Object.entries(levels(q.rec))) expect(Math.abs((levels(p.rec) as Record<string, number>)[k]! - v!), k).toBeLessThan(0.001);
    expect(p.rec.inputs.techniques).toEqual(q.rec.inputs.techniques);
    expect(p.rec.inputs.prep).toEqual(q.rec.inputs.prep);
    expect(p.rec.inputs.condition).toEqual(q.rec.inputs.condition);
    expect(p.rec.inputs.key).toBe(q.rec.inputs.key);
    // A scene's believability reads emotional depth, its interpretation imagination, its execution memory and the
    // voice, its consistency discipline (`TASK_PROFILES.scene`): each higher.
    for (const d of ['believability', 'interpretation', 'execution', 'consistency'] as const) expect(p.rec.dims[d]!, d).toBeGreaterThan(q.rec.dims[d]!);
    // Connection and responsiveness read listening, presence and adaptability, none of them practised: the same.
    for (const d of ['connection', 'responsiveness'] as const) expect(p.rec.dims[d], d).toBe(q.rec.dims[d]);
    // And the whole, kept to a tenth, and the score the class was given.
    expect(p.rec.overall).toBeGreaterThan(q.rec.overall);
    expect(work(p.s, p.id).shown!.score).toBeGreaterThan(work(q.s, q.id).shown!.score);
  }, 60_000);

  it('PLAYER JOURNEY: counts voice and movement once, as abilities, on a night that reads them: The Seagull’s understudy run-through, by the clock, judged on the Rep company’s techniques without them', () => {
    const s = closingEve();
    const [night, ...more] = nightsOf(s, 'The Seagull');
    expect(more).toEqual([]);
    // What the Rep's company asks with no play of its own in SLATE's lists (COMPANY_READ, content/plays.ts): scene 2,
    // voice 1, speech 1, character 1, movement 1, script 1. The voice and movement are kept as abilities, Vocal
    // Expression and Physical Expression, which the night's dimensions read by name: as techniques they're not read.
    expect(night!.inputs.techniques).toEqual({ scene: 2, speech: 1, character: 1, script: 1 });
    expect(Object.keys(night!.inputs.levels ?? {}).sort()).toEqual(['character', 'scene', 'script', 'speech']);
    expect(night!.inputs.abilities.vocal).toBeGreaterThan(0);
    expect(night!.inputs.abilities.physical).toBeGreaterThan(0);
    // Nothing held the night back as a technique it counts as an ability.
    expect(night!.limits.filter((l) => l.kind === 'technique' && ['voice', 'movement', 'emotion', 'memorization'].includes(l.what))).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// genre demands
// ---------------------------------------------------------------------------------------------------------------------

describe('genre demands', () => {
  /** g22-summer in the summer company, doing the work, the minute before A Marriage Proposal's first night. */
  const proposalEve = () => working(kept('g22-summer:proposal', () => {
    const s = working(life('g22-summer'));
    play(s, at(2027, 3, 20, 12));
    s.must({ kind: 'school.summer_cabaret', payload: {} });
    expect(s.player.school!.summer!.shows![0]!.play).toBe('A Marriage Proposal');
    const first = pending(s, SUMMER_KIND).find((c) => c.payload.call === 'performance')!;
    expect(first.at).toBe(at(2027, 6, 25, 20));
    play(s, first.at - 60_000);
    return s;
  }));
  const PROPOSAL = SUMMER_PLAYS.find((p) => p.title === 'A Marriage Proposal')!;

  it('PLAYER JOURNEY: a Summer Cabaret night of A Marriage Proposal, a farce, reads the play’s own techniques and not the clown its farce demands, and comes out the same with clown mastered', () => {
    // What a farce asks (content/genre-demands.json, applied at medium confidence): comic timing and physical comedy,
    // the comedy and clown techniques.
    expect(PROPOSAL.kinds).toContain('farce');
    expect(genreTags('farce')).toEqual(['comic', 'physicalComedy']);
    expect(DEMAND_TECHNIQUE.physicalComedy).toBe('clown');
    const drawnClown = proposalEve();
    const mastered = proposalEve();
    mastered.player.craft!.clown = 90; // TEST SETUP: clown mastered in one twin, the minute before the curtain.
    expect(drawnClown.player.craft!.clown).toBeLessThan(90);
    for (const s of [drawnClown, mastered]) s.advanceTo(at(2027, 6, 25, 20, 1));
    const [a, ...more] = nightsOf(drawnClown, 'A Marriage Proposal');
    const [b] = nightsOf(mastered, 'A Marriage Proposal');
    expect(more).toEqual([]);
    // The play's own reads (comedy 2, scene 1, speech 1), with no material technique to add: no clown.
    expect(PROPOSAL.reads).toEqual({ comedy: 2, scene: 1, speech: 1 });
    expect(a!.inputs.techniques).toEqual({ comedy: 2, scene: 1, speech: 1 });
    expect(Object.keys(a!.inputs.levels ?? {}).sort()).toEqual(['comedy', 'scene', 'speech']);
    // Change the input the demand names: the night doesn't change.
    expect(b!.inputs.techniques).toEqual(a!.inputs.techniques);
    expect(b!.dims).toEqual(a!.dims);
    expect(b!.overall).toBe(a!.overall);
  }, 60_000);

  it('the farce’s look says Clown And Mask is what a self-tape in a farce reads, and that a farce’s night, which by the clock reads no Clown, reads its own material’s', () => {
    // A defect, failed when written (2026-10-13). The genre look (src/ui/looks/actor.tsx, the 'Applied as requirements.'
    // paragraph) said of every applied genre "Work in it reads" each demanded technique, with the player's level beside
    // it. Of a farce it said the work reads Clown And Mask. A self-tape's brief in a farce does, since every brief stages
    // what its genres demand (tests/briefs-content.test.ts); a farce's night doesn't, since every play has a material
    // profile and reads its own techniques and its material's (`playReads`, from 2026-10-10), and the test before this
    // one played one with clown mastered and found it the same. So the look told a player that clown counted in work
    // where it changed nothing. The fix, the same day: it says the demands are what a self-tape in the genre reads ("A
    // self-tape in it reads ..."), and that a play or a class scene reads its own material's.
    const s = proposalEve();
    s.advanceTo(at(2027, 6, 25, 20, 1));
    const [night] = nightsOf(s, 'A Marriage Proposal');
    expect(Object.keys(night!.inputs.techniques)).not.toContain('clown');
    const look = resolveLook(s, { kind: 'genre', id: 'farce' }) as Looked;
    expect(look.name).toBe('Farce');
    const body = textOf(renderToStaticMarkup(createElement('div', null, look.body)));
    // The demand is shown, with the player's level beside it, as the research applies it.
    expect(body).toContain('What a self-tape in it asks.');
    expect(body).toContain(`${TECHNIQUE_LABEL.clown} (yours: ${s.player.craft!.clown.toFixed(1)} of 90)`);
    // What it says the demands are read by: a self-tape in a farce, Comedy and Clown And Mask, each with the player’s
    // level; and a farce’s night or class scene, its own material’s techniques. Until later on 2026-10-13 this looked
    // for “Work in it reads”, which the look no longer says, so it found nothing and passed whatever the look said.
    const said = body.replace(/ ([,:.)])/g, '$1').replace(/\( /g, '(');
    const level = (t: Skill) => `${TECHNIQUE_LABEL[t]} (yours: ${(s.player.craft![t] ?? 0).toFixed(1)} of 90)`;
    expect(said).toContain(`A self-tape in it calls for ${level(DEMAND_TECHNIQUE.comic)}, ${level(DEMAND_TECHNIQUE.physicalComedy)}.`);
    expect(said).toContain('A night of a play of its kind, or a class scene from one, calls for its own material’s techniques instead.');
    expect(said).not.toContain('Work in it reads');
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// casting (castFit/castScore)
// ---------------------------------------------------------------------------------------------------------------------

describe('casting (castFit/castScore)', () => {
  const runOf = (s: Simulation, production: string) => s.player.school!.runs!.find((r) => r.production === production)!;
  const you = (s: Simulation) => s.player.school!.castRead!.rows.find((r) => r.you)!;
  const row = (s: Simulation, name: string) => s.player.school!.castRead!.rows.find((r) => r.name === name)!;
  /**
   * A night's six dimensions as content/tasks.ts writes a performance: the parts of preparation each reads, and whether
   * the day's fatigue reaches it (every one but interpretation). Interpretation reads the genre too, from 2026-10-22 (the
   * owner's brief 21): this listed the notes alone until then, which held while no night here read a genre (the Carlotta's
   * new plays name none) and stopped holding when the Rep's Seagull came to read its kinds.
   */
  const NIGHT: readonly { prep: readonly string[]; fatigue: boolean }[] = [
    { prep: ['lines', 'notes'], fatigue: true }, // believability
    { prep: ['notes', 'genre'], fatigue: false }, // interpretation
    { prep: ['blocking'], fatigue: true }, // connection
    { prep: ['lines', 'blocking'], fatigue: true }, // execution
    { prep: ['lines'], fatigue: true }, // consistency
    { prep: ['notes'], fatigue: true }, // responsiveness
  ];
  /**
   * How much of themselves a night delivered, by the rule, from the night's own record: each dimension's preparation,
   * the least of its parts at 0.35 and 0.65 more by the part against what completes it, to 1 (`prepFloor`; knowing the
   * genre at 0.75 and 0.25 more, `partFloor.genre`), times the
   * day, which a readiness under 60 brings to 0.6 and 0.4 more by readiness over 60 (`fatigueFloor`) where fatigue
   * reaches; averaged over the six.
   */
  const deliveredBy = (w: WorkRecord): number => {
    const { prep, required, condition } = w.inputs;
    // Nothing else the day brought, and the play in two halves alike: no work on a half and no turn raising what one asks.
    expect(Object.keys(condition)).toEqual(['readiness']);
    expect(w.inputs.extraPrep).toBeUndefined();
    expect(w.inputs.piece).toMatchObject({ work: [], part: 'blocking', perTurn: 0, perBlend: 0 });
    expect(w.inputs.piece!.own).toBeUndefined();
    const day = condition.readiness < 60 ? 0.6 + 0.4 * (condition.readiness / 60) : 1;
    return NIGHT.reduce((sum, d) => {
      const floor = (p: string) => (p === 'genre' ? 0.75 : 0.35);
      const prepared = d.prep.filter((p) => prep[p] !== undefined).reduce((m, p) => Math.min(m, floor(p) + (1 - floor(p)) * Math.min(1, prep[p]! / (required[p] ?? 1))), 1);
      return sum + prepared * (d.fatigue ? day : 1);
    }, 0) / NIGHT.length;
  };
  const MAJOR_BARBARA = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].find((p) => p.title === 'Major Barbara')!;
  /** The parts as partsFor's rule gives them: in the order read, each the first part still open written for their title or either, else the company. */
  const partsByRule = (s: Simulation) => {
    const open = [...MAJOR_BARBARA.parts];
    return s.player.school!.castRead!.rows.map((r) => {
      const title = r.you ? s.player.performerTitle : s.player.school!.classmates.find((m) => m.name === r.name)!.title;
      const k = open.findIndex((p) => p.for === 'either' || p.for === title);
      if (k < 0) return { part: 'In The Company', size: 'featured' };
      const [p] = open.splice(k, 1);
      return { part: p!.name, size: p!.size };
    });
  };

  it('PLAYER JOURNEY: works each Carlotta night’s delivery from its record by the rule, the slept-through closing at nothing; with the twins’ craft made alike the chair reads one fit for both, and a fifth of it moved by the delivery between them, and the part with it', () => {
    const played = closingEve();
    const slept = closingEve();
    // Asleep from six for five hours, across the closing night at eight.
    go(slept, 'life.sleep', { hours: 5 });
    for (const s of [played, slept]) s.advanceTo(at(2027, 5, 12, 23));
    expect(runOf(played, CARLOTTA)).toMatchObject({ nights: 4, missed: 0 });
    expect(runOf(slept, CARLOTTA)).toMatchObject({ nights: 4, missed: 1 });
    const four = nightsOf(played, CARLOTTA);
    const three = nightsOf(slept, CARLOTTA);
    expect(four).toHaveLength(4);
    expect(three).toHaveLength(3);
    expect(three.map((w) => w.at)).toEqual(four.slice(0, 3).map((w) => w.at));
    // Every night played under a readiness of 60, so the day cost the five dimensions fatigue reaches: none is whole.
    for (const w of four) expect(w.inputs.condition.readiness).toBeLessThan(60);
    for (const w of four) expect(deliveredBy(w)).toBeLessThan(1);
    const sum = (ws: readonly WorkRecord[]) => ws.reduce((a, w) => a + deliveredBy(w), 0);
    // The run's delivery is the nights' as the rule gives them, the slept-through closing adding nothing.
    expect(runOf(played, CARLOTTA).delivered).toBeCloseTo(sum(four), 9);
    expect(runOf(slept, CARLOTTA).delivered).toBeCloseTo(sum(three), 9);

    // TEST SETUP: the closing night's growth given to the twin who slept through it (its craft, abilities and fitness),
    // so the chair's fit is the same for both and only the delivery differs.
    Object.assign(slept.player.craft!, played.player.craft);
    Object.assign(slept.player.attrs!, played.player.attrs);
    slept.player.wellbeing.fitness = played.player.wellbeing.fitness;
    const [K, M] = [working(reload(played)), working(reload(slept))];
    for (const s of [K, M]) s.advanceTo(at(2027, 8, 23, 9, 1));
    // The Seagull's understudy run-through, the one Rep night, at a readiness over 60 with its lines, blocking and notes
    // complete, and its kinds known in part: whole but for the genre. Until 2026-10-22 (the owner's brief 21) the Seagull
    // read no genre, and the night was whole; now its interpretation reads what a first year knows of tragicomedy and
    // drama, practised at its own calls, under the 90 that completes it.
    const [seagull] = nightsOf(K, 'The Seagull');
    expect(seagull!.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
    expect(seagull!.inputs.prep.genre).toBeGreaterThan(0);
    expect(seagull!.inputs.prep.genre).toBeLessThan(0.9);
    expect(deliveredBy(seagull!)).toBeLessThan(1);
    expect(deliveredBy(seagull!)).toBeCloseTo((5 + 0.75 + 0.25 * seagull!.inputs.prep.genre! / 0.9) / 6, 12);
    // A School night and a Rep night weigh one each: the share is the five nights' delivery over five.
    const dK = round3((deliveredBy(seagull!) + sum(four)) / 5);
    const dM = round3((deliveredBy(seagull!) + sum(three)) / 5);
    expect(K.player.school!.lastWork).toMatchObject({ size: 'lead', delivery: dK, weight: 5 });
    expect(M.player.school!.lastWork).toMatchObject({ size: 'lead', delivery: dM, weight: 5 });
    // One fit, the same craft read for the same play.
    for (const s of [K, M]) expect(s.player.school!.castRead!.play).toBe('Major Barbara');
    expect(you(M).fit).toBe(you(K).fit);
    // The read: four fifths of the fit whatever was delivered, a fifth by the share delivered, two points off for last
    // time's lead (`ESTIMATE.casting`), each kept to a tenth, as the fit shown is: the rounding allows 0.1 and no more.
    for (const [s, d] of [[K, dK], [M, dM]] as const) {
      expect(you(s).delivery).toBe(d);
      expect(you(s).balance).toBe(-2);
      expect(Math.abs(you(s).score - (you(s).fit * (0.8 + 0.2 * d) - 2))).toBeLessThanOrEqual(0.1);
    }
    expect(Math.abs((you(K).score - you(M).score) - 0.2 * you(K).fit * (dK - dM))).toBeLessThanOrEqual(0.1);
    // Samuel Park, read the same in both, between them: the player above him, then below.
    expect(row(M, 'Samuel Park').score).toBe(row(K, 'Samuel Park').score);
    expect(you(K).score).toBeGreaterThan(row(K, 'Samuel Park').score);
    expect(you(M).score).toBeLessThan(row(M, 'Samuel Park').score);
    // The parts as partsFor's rule gives them, by title in the order read: Barbara Undershaft, then a supporting part.
    // A featured one until brief 21 (2026-10-22), when the chair came to read the play's genres as each student knows
    // them and the reads around hers moved (`classGenres`).
    for (const s of [K, M]) expect(s.player.school!.castRead!.rows.map((r) => ({ part: r.part, size: r.size }))).toEqual(partsByRule(s));
    expect(K.player.school!.casting).toMatchObject({ play: 'Major Barbara', role: 'Barbara Undershaft', size: 'lead' });
    expect(M.player.school!.casting).toMatchObject({ play: 'Major Barbara', size: 'supporting' });
  }, 60_000);

  it('gives a real term’s parts by partsFor’s rule, by title in the order read, so a lower read can hold a bigger part, and lists the reads highest first', () => {
    const K = fallCast();
    const rows = K.player.school!.castRead!.rows;
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < rows.length; i += 1) expect(rows[i]!.score, rows[i]!.name).toBeLessThanOrEqual(rows[i - 1]!.score);
    expect(rows.map((r) => ({ part: r.part, size: r.size }))).toEqual(partsByRule(K));
    // Where the parts for a title run out before a bigger one for the other, a lower read holds the bigger part: Noah
    // Kowalski's supporting Bill Walker at a read under Hannah Bennett's featured Jenny Hill. Until 2026-10-16 it was Theo
    // Walsh's supporting Adolphus Cusins under Hannah's featured Sarah Undershaft; from then casting's read weighs a
    // night's abilities as the play demands (`BASE_INPUTS`), and Theo reads over Hannah, level with Aaliyah Osei.
    const noah = row(K, 'Noah Kowalski');
    const hannah = row(K, 'Hannah Bennett');
    expect(noah).toMatchObject({ part: 'Bill Walker', size: 'supporting' });
    expect(hannah).toMatchObject({ part: 'Jenny Hill', size: 'featured' });
    expect(noah.score).toBeLessThan(hannah.score);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// standing/term evaluation
// ---------------------------------------------------------------------------------------------------------------------

describe('standing/term evaluation', () => {
  /** g24-probe doing the work, the Sunday before the first classes. */
  const probeAug30 = () => working(kept('g24-probe:aug30', () => { const s = working(life('g24-probe')); s.advanceTo(at(2026, 8, 30, 12)); return s; }));

  it('PLAYER JOURNEY: the same worked fall weighed against a class three times as driven: the player’s growth, attendance and coursework the same, standing a concern for the pace alone, in its words, on the Standing tab, and the Rep and the Summer Cabaret held to it', () => {
    const plain = probeAug30();
    const driven = probeAug30();
    // TEST SETUP: every classmate's drive at 3 (a classmate's runs 0.75 to 1.25), so the class grows past twice the
    // player's pace while the player's own fall is played the same.
    for (const m of driven.player.school!.classmates) m.drive = 3;
    for (const s of [plain, driven]) s.advanceTo(at(2026, 12, 12, 12));
    const [a, ...more] = plain.player.school!.history;
    const [b] = driven.player.school!.history;
    expect(more).toEqual([]);
    // The player's own term, the same to the figure: every class attended, the same growth, the same pieces at the same
    // bands, under half of them unready.
    expect(a).toMatchObject({ term: 0, attendance: 1 });
    expect(b).toMatchObject({ term: 0, attendance: 1 });
    expect(b!.growth).toBe(a!.growth);
    expect(b!.coursework).toEqual(a!.coursework);
    const cw = a!.coursework!;
    expect(cw.unready * 2).toBeLessThan(cw.shown);
    expect(cw.strong * 2).toBeGreaterThanOrEqual(cw.shown);
    // The class's growth, which the pace is weighed against: past twice the player's in the driven class.
    expect(b!.classGrowth).toBeGreaterThan(2 * b!.growth);
    expect(a!.classGrowth).toBeLessThan(2 * a!.growth);
    expect(a!.standing).toBe('good');
    expect(a!.reason).toBe(`You came to 100% of the classes, calls and shifts asked of you. Your craft grew ${a!.growth.toFixed(1)} points this term, and the middle student in your class grew ${a!.classGrowth.toFixed(1)}. Allowing for how much room each of you had to grow, that’s ahead of the class. The faculty noted your coursework: ${cw.strong} of ${cw.shown} pieces were Strong or better.`);
    // Behind the class, and nothing else short: a concern for the pace alone.
    expect(b!.standing).toBe('concern');
    // The pace first, as what fell short, with its minimum (from 2026-10-20, brief 17: until then after the attendance, the
    // minimum unsaid).
    expect(b!.reason).toBe(`Your craft grew ${b!.growth.toFixed(1)} points this term, and the middle student in your class grew ${b!.classGrowth.toFixed(1)}. Allowing for how much room each of you had to grow, that’s behind the class. That’s under half its pace, short of what the program asks. You came to 100% of the classes, calls and shifts asked of you. The faculty noted your coursework: ${cw.strong} of ${cw.shown} pieces were Strong or better.`);
    expect(driven.player.school!.standing).toBe('concern');
    // The Standing tab, as the player has it.
    const { text } = drawn(driven, SchoolWorkspace, 'standing');
    expect(text).toContain('Term Reviews');
    // The Evaluations table’s Coursework column, the review’s own count, from 2026-10-16 (tests/remaining-school-term.test.ts).
    expect(text).toContain(`Fall Term 2026 Academic Concern 100% ${b!.growth.toFixed(1)} ${b!.classGrowth.toFixed(1)} ${b!.coursework ? `${b!.coursework.unready} of ${b!.coursework.shown} Unready or not shown` : 'None counted'} ${b!.reason}`);
    // The Evaluations table’s Coursework column, the review’s own count, from 2026-10-16 (tests/remaining-school-term.test.ts).
    expect(drawn(plain, SchoolWorkspace, 'standing').text).toContain(`Fall Term 2026 Good Standing 100% ${a!.growth.toFixed(1)} ${a!.classGrowth.toFixed(1)} ${a!.coursework ? `${a!.coursework.unready} of ${a!.coursework.shown} Unready or not shown` : 'None counted'} ${a!.reason}`);
    // What the standing gates: the Rep's understudy at the spring's casting, and the Summer Cabaret's company.
    for (const s of [plain, driven]) s.advanceTo(at(2027, 1, 4, 9, 1));
    expect(plain.player.school!.rep).toMatchObject({ production: 'The Seagull', role: 'Nina', kind: 'understudy' });
    expect(driven.player.school!.rep).toBeUndefined();
    for (const s of [plain, driven]) s.advanceTo(at(2027, 2, 1, 12));
    expect(no(driven, 'school.summer_cabaret')).toBe('The Summer Cabaret only takes students in good standing.');
    expect(go<{ from: number }>(plain, 'school.summer_cabaret').from).toBe(at(2027, 6, 4, 13));
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// preparation dims
// ---------------------------------------------------------------------------------------------------------------------

describe('preparation dims', () => {
  it('PLAYER JOURNEY: Read The Scene twice more, which grows no technique and focus by a hair, is read into the showing the clock gives: interpretation by the prepared factor the rule gives the familiarity, the dimensions that don’t read it the same, the whole higher, and the figure on the Coursework tab', () => {
    const run = (reads: number) => {
      const s = probeAug28();
      const id = actingI(s).id;
      const after: { craft: string; attrs: Record<string, number> }[] = [];
      const since = keptSince(s);
      for (let i = 0; i < reads; i += 1) {
        dials(s);
        go(s, 'school.prepare', { assignmentId: id, activity: 'read' });
        after.push({ craft: JSON.stringify(s.player.craft), attrs: { ...s.player.attrs! } });
      }
      const kept = since();
      answerAsTheTextSupports(s, work(s, id));
      // TEST SETUP: the lines, its time on its feet and with the partner at 0.95 in both: the part under test is another.
      Object.assign(work(s, id).prep, { memorization: 0.95, rehearsal: 0.95, partner: 0.95 });
      return { s, id, after, kept, familiarity: work(s, id).prep.familiarity };
    };
    const four = run(4);
    const two = run(2);
    // Reading the scene grows no technique: the craft after the third and fourth reads is as after the second. It's
    // practice in focus (`PREP_ABILITY`), each read's under a hundredth kept under prepare:familiarity, and nothing else.
    expect(four.after[2]!.craft).toBe(four.after[1]!.craft);
    expect(four.after[3]!.craft).toBe(four.after[1]!.craft);
    for (const k of ['presence', 'composure', 'listening', 'imagination', 'adaptability', 'discipline']) expect(four.after[3]!.attrs[k], k).toBe(four.after[1]!.attrs[k]);
    expect(four.after[3]!.attrs.focus! - four.after[1]!.attrs.focus!).toBeGreaterThan(0);
    expect(four.after[3]!.attrs.focus! - four.after[1]!.attrs.focus!).toBeLessThan(0.02);
    expect([...new Set(four.kept.map((x) => `${x.id} ${x.source}`))]).toEqual(['focus prepare:familiarity']);
    expect(four.familiarity).toBeGreaterThan(two.familiarity);
    // The Coursework tab's figure for the part, as each twin has it before the meeting.
    expect(drawn(four.s, CourseworkPane).text).toContain(`Knows The Scene ${Math.round(four.familiarity * 100)}% Note priority`);
    expect(drawn(two.s, CourseworkPane).text).toContain(`Knows The Scene ${Math.round(two.familiarity * 100)}% Note priority`);
    for (const t of [four, two]) toMeeting(t.s, '2026-09-08');
    const [f] = shownRecords(four.s, work(four.s, four.id));
    const [n] = shownRecords(two.s, work(two.s, two.id));
    expect(f!.at).toBe(n!.at);
    // What each was judged from is what the commands left, against the coursework's complete, 0.9.
    expect(f!.inputs.prep.familiarity).toBe(four.familiarity);
    expect(n!.inputs.prep.familiarity).toBe(two.familiarity);
    for (const r of [f!, n!]) expect(r.inputs.required.familiarity).toBe(0.9);
    // The same craft at the showing, to a hundredth (the reads' focus the only ability apart, and by under one), and the
    // same day.
    for (const [k, v] of Object.entries(n!.inputs.levels ?? {})) expect(Math.abs((f!.inputs.levels as Record<string, number>)[k]! - v!), k).toBeLessThan(0.01);
    for (const [k, v] of Object.entries(n!.inputs.abilities)) expect(Math.abs((f!.inputs.abilities as Record<string, number>)[k]! - v!), k).toBeLessThan(0.01);
    expect(f!.inputs.condition).toEqual(n!.inputs.condition);
    // Interpretation reads the table work and the familiarity, the least of them (`TASK_PROFILES.scene`). The table work
    // answered (1 of 0.9) and four reads (past 0.9) are complete; two reads leave the familiarity's factor at 0.35 and
    // 0.65 more by the part against 0.9. A dimension's quality is its factors times what the craft and the draw make of
    // it, the same in both; each half's figure is kept to a tenth and the mean of the two again, so the twin's is the
    // factor times the other's to within 0.1 + 0.1 × the factor.
    expect(four.familiarity).toBeGreaterThanOrEqual(0.9);
    expect(two.familiarity).toBeLessThan(0.9);
    const factor = 0.35 + 0.65 * (two.familiarity / 0.9);
    expect(n!.dims.interpretation!).toBeLessThan(f!.dims.interpretation!);
    expect(Math.abs(n!.dims.interpretation! - factor * f!.dims.interpretation!)).toBeLessThanOrEqual(0.1 + 0.1 * factor);
    // The dimensions that don't read the familiarity: the same, execution among them, which reads focus through the
    // scene's material and finds the reads' hair of it nothing at a tenth.
    for (const d of ['believability', 'connection', 'execution', 'consistency', 'responsiveness'] as const) expect(n!.dims[d], d).toBe(f!.dims[d]);
    // And the whole, and the score the class was given.
    expect(f!.overall).toBeGreaterThan(n!.overall);
    expect(work(four.s, four.id).shown!.score).toBeGreaterThan(work(two.s, two.id).shown!.score);
  }, 60_000);
});
