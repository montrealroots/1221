/**
 * Evidence for seven School rows the review of 2026-10-13 left partial (verification group g21-school). Each row's
 * action is reached the way a player reaches it, through the clock that fires the School's calendar (`planWeek`'s week,
 * a class day, a shift, a payday, a call, an evaluation, Commencement) or the command a player sends; each consequence
 * is read where the row says it is read, against figures set down here from the rule's own numbers, never asked of the
 * helper the engine computes them with.
 *
 * - `school.week`: a second year played whole books 25 class-week Saturdays, the dates counted here off the estimated
 *   2027–28 calendar, to Yale's 150 assigned hours, and the twenty-sixth, Saturday 22 April 2028, isn't booked; the first
 *   year's 24 come to 144, under it. Four elective evenings taken on the Sunday before a week is planned (16 hours) leave
 *   its Saturday unbooked, 16 + 6 being past Yale's 19 a week, where a twin who took none has it; both have the next.
 * - `school.classes`: a week of fall classes grows each classmate's abilities by the courses' kin (listening by Acting
 *   I's scene work, imagination by its character work, focus by Text And Context's script, adaptability by Play's
 *   improv) and never composure, and the chair's read of a classmate (`classmatePerformer`) takes the grown figures, across
 *   a save and a load. A piece due at a meeting is shown there, and the meeting grows its course's skill by the band's
 *   weight (0.85 unready, 1 working, 1.1 strong, 1.2 exceptional), worked out here against an unprepared twin.
 * - `school.shift`: registration slept through, the first assigned Saturday is counted and not worked, said once in
 *   its words, nothing owed or bought, and the Standing tab counts 0 of 1 assigned shifts; registered on the School
 *   screen, the next Saturday is worked. A worked Saturday takes 4 energy beyond the clock's against a twin away. The
 *   crew's injury roll comes up at a shift (a seed found for it): a sprain at work, its weekly wage the week's hours at
 *   $23, $138 for the Saturday alone and $230 after a Thursday evening, with no FICA. A Saturday over the week's cap is
 *   missed with its notice, not held against them (no `if` around it).
 * - `school.payday`: a Saturday worked is paid the Friday after, $138, into the year's earnings and its return, once
 *   across a save and a load; a withdrawal with hours owed pays them a minute on and calls the Friday's off; a change of
 *   direct deposit reaches Yale's payroll a week on.
 * - `school.call`: the first spring's Carlotta, three nights played, then its last night missed in hospital: the run
 *   closed at the last curtain, the director's note opened by the nights' mean and naming what cost the nights most
 *   (both worked out here from the night records), one run milestone at the mean of the nights' overall, the process
 *   looked back on, no breach, once across a save; missed away in New York instead, a breach, the run's record a missed
 *   night, the same closing, and the next casting reading the run as delivered at 3 of 4; missed in hospital every night,
 *   the run went on without them and no milestone. The Casting tab shows a played run's nights and its note. Found here,
 *   and failing when written until the screen was fixed on 2026-10-13: a run no night of which was played showed no
 *   director’s note on the Casting tab, where the note sat under the nights (`SchoolWorkspace.tsx`,
 *   `casting.nights && …`), so the words `closeRun` writes for it reached only the notice; the tab shows it now.
 * - `school.evaluation`: a student at the reach of every skill who grows nothing in the spring is in line with the class
 *   and in good standing; a twin with room who grows nothing is behind, at a concern the Summer Cabaret refuses. A
 *   Carlotta played weak reaches the next fall's evaluation, its work the mean of both runs' nights, and falls short. Two
 *   missed rehearsal calls before a good evaluation are forgiven by it and the chair casts them next term; after it, they
 *   aren't. A fall of coursework never prepared, every piece shown unready, is short; a twin who prepares isn't. A
 *   performance missed in a term holds its evaluation at warning, said, and doesn't step it to dismissal. A student on
 *   warning short at the evaluation is dismissed and the School's calendar lets go of them. The Evaluations table shows
 *   each review.
 * - `school.commencement`: the last term's evaluation on the clock books Commencement for Monday 21 May 2029; brought
 *   forward, it graduates a student with nothing outstanding (standing, end, the calendar let go, the last run's credit,
 *   Yale Health to 31 July, no library copy after); an Incomplete whose month runs out before it is withheld there.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York,
 * starting Monday 24 August 2026 at 7:30 AM, played by the clock six hours at a time to where each row is read. The
 * School screen is drawn with react-dom/server, `useGame` standing in for the provider and the kept tab answered from
 * `h.tab`, as tests/whynot-school.test.ts draws it.
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake as the clock moves (`tended`); the
 * coursework prepared each midnight (`working`); a stay in hospital, a day in New York, academic warning, one piece's
 * parts prepared, and a craft held still or set at its reach or low, as preconditions; a week's fixture shifts over the
 * cap, which booking never allows; the last
 * term's state (its course, its last run played) and its evaluation put on the clock, and Commencement brought forward,
 * since three years can't be played here.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import {
  CALL_KIND, COMMENCEMENT_KIND, EVALUATION_KIND, PAYDAY_KIND, SHIFT_KIND, WEEK_KIND, classmatePerformer, coursesOn, mateAbilities, type Casting,
} from '@/engine/systems/school';
import { coverOn, healthOf } from '@/engine/systems/health';
import { journeyOf } from '@/engine/systems/evaluation';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { COURSES } from '@/engine/content/school';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { bankAccountsOf } from '@/engine/systems/banking';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'standing' }));

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
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// --- the life and the clock --------------------------------------------------------------------------------------------

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: the coursework prepared each midnight, every open piece's every part, as tests/school.test.ts has it. */
const working = (sim: Simulation) => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** A save written and read back, as the adapter keeps it; the test's own midnight hook put back on when asked. */
const reload = (sim: Simulation, work = false) => { const s = loadSave(deserialise(serialise(sim.universe)) as never); return work ? working(s) : s; };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const itemsOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.payload.personId === sim.player.id);
const dayKey = (when: number) => { const p = zonedParts(when, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const assignedDays = (sim: Simulation, from: number, to: number) => itemsOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === false && i.at >= from && i.at < to).map((i) => dayKey(i.at)).sort();
const wages = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Work-study wages'));
const NEW_YORK = 'us-ny-newyork';
const NEW_HAVEN = 'us-ct-newhaven';
const DAVID_GEFFEN = 'David Geffen School of Drama at Yale University';

/** The School screen at a tab, in the words a player sees, every tooltip taken out before the tags. */
function drawn(sim: Simulation, tab: string): string {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(SchoolWorkspace)).replace(/<!-- -->/g, '');
  return html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** Played once, its saves kept as text for each test to load its own. */
const once = <T,>(make: () => T) => { let v: T | undefined; return () => (v ??= make()); };

// --- a night's worth, the director's words and the chair's weights, as the rules state them ---------------------------

/** What a night is worth in a run's mean: off −1, solid 0, strong 1, remarkable 2 (`NIGHT_VALUE`'s rule). */
const WORTH: Record<string, number> = { off: -1, solid: 0, strong: 1, remarkable: 2 };
const meanOf = (...runs: Partial<Record<string, number>>[]) => {
  let n = 0, sum = 0;
  for (const r of runs) for (const [b, c] of Object.entries(r)) { n += c!; sum += WORTH[b]! * c!; }
  return n ? sum / n : 0;
};
/** The director's note's opening, by the run's mean: 1.25 and up, 0.5, −0.25, and under. */
const opening = (mean: number) => mean >= 1.25 ? 'Remarkable work: you held the house night after night, and it’s been noticed.'
  : mean >= 0.5 ? 'Strong, reliable work. The part was yours by the second night.'
    : mean >= -0.25 ? 'Solid, sound nights. The next step is to risk more in them.'
      : 'Uneven. Some nights got away from you: come in rested, and have the part in your body before the house does.';
/** What a run's work is weighted by at the next casting: its nights to eight, a School or Rep run whole, a Cabaret or Summer play half. */
const RUN_WEIGHT: Record<string, number> = { school: 1, rep: 1, cabaret: 0.5, summer: 0.5 };
/** A run as closeRun leaves it: the moment it closed, and the process looked back on. */
type Closed = Casting & { closed?: number; process?: { reflection?: unknown } };
const RUN_GONE = 'The run went on without you: the nights you missed are in the record, and the work you did in the room isn’t lost.';

// =======================================================================================================================

describe('school.week', () => {
  it('PLAYER JOURNEY: books the first year’s 24 class-week Saturdays and the second year’s 25 to Yale’s 150 assigned hours, never the twenty-sixth, 22 April 2028', () => {
    let sim = working(student('g21-week-year'));
    tended(sim, at(2027, 8, 20, 12));
    // The first year's: the fall's class weeks from 31 August to 11 December 2026 without Saturday 24 October (the work
    // period) and 28 November (the fall recess); the spring's from 11 January to 23 April 2027 without 6 and 13 March.
    expect(assignedDays(sim, at(2026, 8, 24, 0), at(2027, 8, 1, 0))).toEqual([
      '2026-09-05', '2026-09-12', '2026-09-19', '2026-09-26', '2026-10-03', '2026-10-10', '2026-10-17', '2026-10-31', '2026-11-07', '2026-11-14', '2026-11-21', '2026-12-05',
      '2027-01-16', '2027-01-23', '2027-01-30', '2027-02-06', '2027-02-13', '2027-02-20', '2027-02-27', '2027-03-20', '2027-03-27', '2027-04-03', '2027-04-10', '2027-04-17',
    ]);
    // 24 × 6 = 144 hours, short of 150: the cap didn't bite in the first year.
    expect(sim.player.school!.workStudy.assignedBooked).toBe(144);

    // Kept across a save and a load, one week's plan on the calendar, not two.
    sim = reload(sim, true);
    expect(itemsOf(sim, WEEK_KIND).filter((i) => i.status === 'pending')).toHaveLength(1);
    tended(sim, at(2028, 4, 23, 12));
    // The second year's, by the estimated calendar: classes from 30 August to 10 December 2027 without Saturday 27
    // November (Thanksgiving's), and from 10 January to 28 April 2028 without 4 and 11 March (the spring recess): 26
    // Saturdays, 156 hours. Six hours each to 150 is 25 of them.
    expect(assignedDays(sim, at(2027, 8, 1, 0), at(2028, 5, 1, 0))).toEqual([
      '2027-09-04', '2027-09-11', '2027-09-18', '2027-09-25', '2027-10-02', '2027-10-09', '2027-10-16', '2027-10-23', '2027-10-30', '2027-11-06', '2027-11-13', '2027-11-20', '2027-12-04',
      '2028-01-15', '2028-01-22', '2028-01-29', '2028-02-05', '2028-02-12', '2028-02-19', '2028-02-26', '2028-03-18', '2028-03-25', '2028-04-01', '2028-04-08', '2028-04-15',
    ]);
    expect(sim.player.school!.workStudy.assignedBooked).toBe(150);
    // The Saturday never booked isn't a shift missed: the spring's tally counts the twelve booked and worked.
    expect(sim.player.school!.tally).toMatchObject({ shifts: 12, worked: 12 });
    expect(sim.universe.notifications.filter((n) => n.title === 'You Missed A Work-Study Shift' && n.at > at(2028, 4, 22, 0))).toEqual([]);
    // And the Shifts And Pay tab says so.
    expect(drawn(sim, 'work')).toContain('Assigned Hours Booked 150 of 150');
  }, 60_000);

  it('PLAYER JOURNEY: leaves a week’s Saturday unbooked after four elective evenings taken the Sunday before its plan, 16 + 6 past Yale’s 19; a twin who took none has it', () => {
    const sim = student('g21-week-cap');
    tended(sim, at(2026, 8, 30, 12));
    const twin = reload(sim);
    // Four evenings asked for on the Sunday afternoon, before the week ahead is planned at six.
    const evenings = [1, 2, 3, 4].map(() => sim.must<{ at: number }>({ kind: 'school.take_shift', payload: {} }).at);
    expect(evenings).toEqual([at(2026, 8, 31, 19), at(2026, 9, 1, 19), at(2026, 9, 2, 19), at(2026, 9, 3, 19)]);
    for (const s of [sim, twin]) tended(s, at(2026, 8, 30, 18, 1));
    expect(assignedDays(sim, at(2026, 9, 5, 0), at(2026, 9, 6, 0))).toEqual([]);
    expect(assignedDays(twin, at(2026, 9, 5, 0), at(2026, 9, 6, 0))).toEqual(['2026-09-05']);
    expect(sim.player.school!.workStudy.assignedBooked ?? 0).toBe(0);
    expect(twin.player.school!.workStudy.assignedBooked).toBe(6);
    // The week played: 16 hours worked in it, within the 19; no assigned shift counted, so none held against them.
    for (const s of [sim, twin]) tended(s, at(2026, 9, 6, 18, 1));
    expect(sim.player.school!.tally).toMatchObject({ shifts: 0, worked: 0 });
    expect(twin.player.school!.tally).toMatchObject({ shifts: 1, worked: 1 });
    expect(titled(sim, 'You Missed A Work-Study Shift')).toEqual([]);
    // The next week's Saturday is booked for both: the cap is the week's.
    for (const s of [sim, twin]) expect(assignedDays(s, at(2026, 9, 12, 0), at(2026, 9, 13, 0))).toEqual(['2026-09-12']);
    // Paid on the Friday at $23 an hour: 16 hours is $368, the twin's 6 hours $138.
    for (const s of [sim, twin]) tended(s, at(2026, 9, 11, 17, 1));
    expect(wages(sim).map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount)).toEqual([368_00]);
    expect(wages(twin).map((t) => t.postings.find((p) => p.accountId === twin.player.primaryAccountId)!.amount)).toEqual([138_00]);
  });
});

// =======================================================================================================================

describe('school.classes', () => {
  it('PLAYER JOURNEY: grows the abilities of each classmate in the room by the courses’ kin, never composure, and the chair reads them grown, across a save', () => {
    let sim = working(student('g21-mates'));
    tended(sim, at(2026, 8, 30, 12));
    const n = sim.player.school!.classmates.length;
    const abilities = (s: Simulation) => Array.from({ length: n }, (_, i) => ({ ...mateAbilities(s, s.player, i) }));
    const crafts = (s: Simulation) => s.player.school!.classmates.map((m) => ({ ...m.craft }));
    const before = abilities(sim);
    const craftBefore = crafts(sim);
    // The first class week, Monday 31 August to Friday 4 September.
    tended(sim, at(2026, 9, 4, 18));
    const after = abilities(sim);
    const craftAfter = crafts(sim);
    const everyone = Array.from({ length: n }, (_, i) => i);
    // Who was in each course's room that week, by the skill it grew in them.
    const grewIn = (skill: 'scene' | 'script' | 'improv') => everyone.filter((i) => craftAfter[i]![skill] > craftBefore[i]![skill]);
    const [inScene, inScript, inImprov] = [grewIn('scene'), grewIn('script'), grewIn('improv')];
    // Most of the class was in each, as most days most of them are.
    expect(inScene.length).toBeGreaterThanOrEqual(12);
    expect(inScript.length).toBeGreaterThanOrEqual(12);
    expect(inImprov.length).toBeGreaterThanOrEqual(10);
    // Composure has no kin among the skills: no class grows it.
    for (const i of everyone) expect(after[i]!.composure, `classmate ${i} composure`).toBe(before[i]!.composure);
    // In Acting I (scene, character): listening by scene, imagination by character.
    for (const i of inScene) { expect(after[i]!.listening).toBeGreaterThan(before[i]!.listening); expect(after[i]!.imagination).toBeGreaterThan(before[i]!.imagination); }
    // In Text And Context (script): focus by script.
    for (const i of inScript) expect(after[i]!.focus).toBeGreaterThan(before[i]!.focus);
    // In Play (improv): adaptability by improv; untouched in anyone not there, as no other fall course trains improv.
    for (const i of inImprov) expect(after[i]!.adaptability).toBeGreaterThan(before[i]!.adaptability);
    for (const i of everyone.filter((x) => !inImprov.includes(x))) expect(after[i]!.adaptability).toBe(before[i]!.adaptability);
    // The chair's read of a classmate (`castFit` through `classmatePerformer`) takes the grown figures.
    for (let i = 0; i < n; i += 1) {
      const perf = classmatePerformer(sim, sim.player, i);
      expect(perf.ability('listening')).toBe(after[i]!.listening);
      expect(perf.ability('imagination')).toBe(after[i]!.imagination);
    }
    // Kept across a save and a load, not drawn again.
    sim = reload(sim);
    expect(abilities(sim)).toEqual(after);
  });

  it('shows a piece due at its meeting, and grows the course’s skill there by the band’s weight against an unprepared twin', () => {
    const base = student('g21-showing');
    tended(base, at(2026, 8, 30, 12));
    // The first practice of Acting Intimacy And Combat For The Stage, set at orientation: its intimacy no other first-year
    // course trains, so the meeting's growth of it is that course's alone. (The first scene of Acting I, due 8 September,
    // shows unready however its parts are prepared, its reading unanswered: no band to set against another.)
    const piece = courseworkOf(base, base.player)!.assignments.find((a) => a.status === 'open' && a.course === 'DRAM 403a/b')!;
    expect(piece.dueOn).toBe('2026-09-25');
    const [y, m, d] = piece.dueOn!.split('-').map(Number);
    const course = COURSES.find((c) => c.code === piece.course)!;
    const skill = 'intimacy' as const;
    expect(coursesOn({ year: y!, month: m!, day: d! }).filter((c) => c.skills.includes(skill)).map((c) => c.code)).toEqual(['DRAM 403a/b']);
    tended(base, at(y!, m!, d!, 8));
    const prepared = reload(base);
    const unprepared = reload(base);
    const away = reload(base);
    // TEST SETUP: the piece prepared in its every part, as a student who worked on it has it.
    const mine = courseworkOf(prepared, prepared.player)!.assignments.find((a) => a.id === piece.id)!;
    for (const dim of PREP_DIMS) mine.prep[dim] = 0.95;
    // TEST SETUP: away in New York that morning.
    away.player.currentLocationId = NEW_YORK;
    const start = prepared.player.craft![skill];
    expect(unprepared.player.craft![skill]).toBe(start);
    for (const s of [prepared, unprepared, away]) { Object.assign(s.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); s.advanceTo(at(y!, m!, d!, 9, 1)); }
    const shownOf = (s: Simulation) => courseworkOf(s, s.player)!.assignments.find((a) => a.id === piece.id)!;
    const bandA = shownOf(prepared).shown!.band;
    const bandB = shownOf(unprepared).shown!.band;
    expect(bandA).not.toBe(bandB);
    // The meeting's growth of the skill, weighted by the band shown: 0.85 unready, 1 working, 1.1 strong, 1.2 exceptional.
    const W: Record<string, number> = { unready: 0.85, working: 1, strong: 1.1, exceptional: 1.2 };
    const grewA = prepared.player.craft![skill] - start;
    const grewB = unprepared.player.craft![skill] - start;
    expect(grewB).toBeGreaterThan(0);
    expect(grewA / grewB).toBeCloseTo(W[bandA]! / W[bandB]!, 6);
    expect(titled(prepared, `Not Shown: ${course.name}`)).toEqual([]);
    // Away: not shown, not taken later, and the skill not grown.
    expect(shownOf(away).status).toBe('missed');
    expect(titled(away, `Not Shown: ${course.name}`)).toHaveLength(1);
    expect(away.player.craft![skill]).toBe(start);
  });
});

// =======================================================================================================================

describe('school.shift', () => {
  it('PLAYER JOURNEY: registration slept through, counts the first assigned Saturday and doesn’t work it, says so once, owes and buys nothing; registered, the next is worked', () => {
    let sim = student('g21-shift-i9');
    // Asleep from the first morning to noon, through Registration And Your Account at ten, by the command a player uses.
    sim.must({ kind: 'life.sleep', payload: { hours: (at(2026, 8, 24, 12) - sim.now) / MS_HOUR } });
    expect(sim.player.school!.registeredAt).toBeUndefined();
    tended(sim, at(2026, 9, 5, 9, 59));
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const saturday = itemsOf(sim, SHIFT_KIND).find((i) => i.at === at(2026, 9, 5, 10))!;
    expect(saturday.payload.elective).toBe(false);
    const shiftsBefore = sim.player.school!.tally.shifts;
    sim.advanceTo(at(2026, 9, 5, 10, 1));
    expect(sim.universe.scheduled.find((i) => i.id === saturday.id)!.status).toBe('missed');
    expect(sim.player.school!.tally.shifts - shiftsBefore).toBe(1);
    expect(sim.player.school!.tally.worked).toBe(0);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    const told = titled(sim, 'A Shift You Couldn’t Work');
    expect(told).toHaveLength(1);
    expect(told[0]!.body).toBe('Work-study starts with registration, when the I-9 is done. Register on the School screen.');
    expect(titled(sim, 'You Missed A Work-Study Shift')).toEqual([]);
    // Nothing bought for it, nothing to pay.
    expect(sim.player.school!.ppe).toBeUndefined();
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(bank);
    expect(itemsOf(sim, PAYDAY_KIND).filter((i) => i.status === 'pending')).toEqual([]);
    // The evaluation's attendance reads it: an assigned shift asked of them and not worked.
    expect(drawn(sim, 'standing')).toContain(' and 0 of 1 assigned shifts.');

    // Registered on the School screen, late; the next Saturday is worked, and its equipment bought there.
    sim.must({ kind: 'school.orientation', payload: { task: 'register' } });
    expect(sim.player.school!.registeredAt).toBeDefined();
    sim = reload(sim);
    tended(sim, at(2026, 9, 12, 17));
    expect(sim.player.school!.tally).toMatchObject({ shifts: 2, worked: 1 });
    expect(sim.player.school!.workStudy.owedHours).toBe(6);
    expect(sim.player.school!.ppe?.cost).toBe(150_00);
    expect(titled(sim, 'A Shift You Couldn’t Work')).toHaveLength(1);
  });

  it('takes 4 energy for a worked Saturday, beyond what the clock takes from a twin away from it', () => {
    const sim = student('g21-shift-tire');
    tended(sim, at(2026, 9, 5, 9, 30));
    const away = reload(sim);
    // TEST SETUP: the twin in New York that morning.
    away.player.currentLocationId = NEW_YORK;
    for (const s of [sim, away]) { s.player.wellbeing.energy = 90; s.advanceTo(at(2026, 9, 5, 10, 1)); }
    expect(sim.player.school!.tally).toMatchObject({ worked: 1 });
    expect(away.player.school!.tally).toMatchObject({ shifts: 1, worked: 0 });
    expect(titled(away, 'You Missed A Work-Study Shift')).toHaveLength(1);
    expect(away.player.wellbeing.energy - sim.player.wellbeing.energy).toBeCloseTo(4, 6);
  });

  it('rolls the crew’s risk at a worked shift: a sprain at work, its weekly wage the week’s hours at $23 with no FICA, $138 alone and $230 after a Thursday evening', () => {
    // The seed was found by searching save seeds for a crew roll on Saturday 5 September 2026 at ten that comes up: the
    // chance of six hours in the shops is 1 − e^(−2.95 × 6 / 1000), 1.75%.
    const sim = student('g21-crew-161');
    tended(sim, at(2026, 9, 2, 12));
    const evening = reload(sim);
    const away = reload(sim);
    expect(evening.must<{ at: number }>({ kind: 'school.take_shift', payload: {} }).at).toBe(at(2026, 9, 3, 19));
    tended(away, at(2026, 9, 5, 9));
    // TEST SETUP: the twin in New York on the Saturday.
    away.player.currentLocationId = NEW_YORK;
    const bills = healthOf(sim.player).bills.length;
    for (const s of [sim, evening, away]) tended(s, at(2026, 9, 5, 12));
    const injury = healthOf(sim.player).injury!;
    expect(injury).toMatchObject({ kind: 'sprain', at: at(2026, 9, 5, 10), atWork: { stateId: 'us-ct', weeklyWage: 6 * 23_00, paidDays: 0, noFica: true } });
    expect(titled(sim, 'A Sprained Ankle')).toHaveLength(1);
    // At work, the care is the employer's cover's: no Yale Health bill for it.
    expect(healthOf(sim.player).bills.length).toBe(bills);
    // A Thursday evening worked first: the week's wage is ten hours.
    expect(healthOf(evening.player).injury).toMatchObject({ kind: 'sprain', at: at(2026, 9, 5, 10), atWork: { weeklyWage: (4 + 6) * 23_00 } });
    // Not at the shift, nothing rolled.
    expect(healthOf(away.player).injury).toBeUndefined();
  });

  it('misses a Saturday that comes to a week worked to its cap, with its notice, and doesn’t hold it against them', () => {
    let sim = student('g21-shift-over');
    tended(sim, at(2026, 10, 5, 8));
    const sat = itemsOf(sim, SHIFT_KIND).find((i) => i.payload.elective === false && i.at === at(2026, 10, 10, 10));
    expect(sat).toBeDefined();
    // TEST SETUP: 18 hours of shifts worked Monday to Wednesday and a 4-hour evening Thursday, as a save from before the
    // booking checked the cap (2026-10-10) can hold: booking now refuses past 19 hours.
    for (const d of [5, 6, 7]) sim.schedule({ at: at(2026, 10, d, 10), kind: SHIFT_KIND, label: 'Shift', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 360, payload: { personId: sim.player.id, hours: 6, elective: true } });
    sim.schedule({ at: at(2026, 10, 8, 19), kind: SHIFT_KIND, label: 'Shift', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 240, payload: { personId: sim.player.id, hours: 4, elective: true } });
    sim = reload(sim);
    const tally = { ...sim.player.school!.tally };
    // Owed by Thursday evening: the 6 of Saturday 3 October, still to be paid, and the 18 of this week.
    tended(sim, at(2026, 10, 8, 18));
    expect(sim.player.school!.workStudy.owedHours).toBe(6 + 18);
    // The evening worked to the cap of 19: one hour of its four.
    tended(sim, at(2026, 10, 8, 23));
    expect(sim.player.school!.workStudy.owedHours).toBe(6 + 18 + 1);
    // Friday's pay, 25 hours at $23; then the Saturday finds the week's 19 worked, and adds nothing to be paid.
    tended(sim, at(2026, 10, 10, 17));
    expect(wages(sim).at(-1)!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(25 * 23_00);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    expect(sim.universe.scheduled.find((i) => i.id === sat!.id)!.status).toBe('missed');
    expect(titled(sim, 'A Shift Over The Weekly Cap')).toHaveLength(1);
    expect(titled(sim, 'A Shift Over The Weekly Cap')[0]!.body).toBe('Yale caps a student’s hours at 19 a week across its jobs, and the week’s are worked. The shift is off, and not held against you.');
    expect(titled(sim, 'You Missed A Work-Study Shift')).toEqual([]);
    expect(sim.player.school!.tally.shifts).toBe(tally.shifts);
    expect(sim.player.school!.tally.worked).toBe(tally.worked);
  });
});

// =======================================================================================================================

describe('school.payday', () => {
  it('PLAYER JOURNEY: pays a Saturday’s six hours the Friday after, $138 of wages into checking, onto the year’s return, once across a save and a load', () => {
    let sim = student('g21-pay');
    tended(sim, at(2026, 9, 5, 18));
    expect(sim.player.school!.workStudy.owedHours).toBe(6);
    expect(itemsOf(sim, PAYDAY_KIND).filter((i) => i.status === 'pending').map((i) => i.at)).toEqual([at(2026, 9, 11, 17)]);
    const income = figuresFor(sim.player, 2026).income;
    expect(yearOf(sim.player, 2026).workStudy).toBe(0);
    sim = reload(sim);
    tended(sim, at(2026, 9, 11, 17, 1));
    const paid = wages(sim);
    expect(paid).toHaveLength(1);
    expect(paid[0]!.memo).toBe(`Work-study wages, 6 hours: ${DAVID_GEFFEN}`);
    expect(paid[0]!.category).toBe('salary');
    expect(paid[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(138_00);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    // The year's earnings and its return: $138 of work-study wages, and the income up by exactly that.
    expect(yearOf(sim.player, 2026).workStudy).toBe(138_00);
    expect(figuresFor(sim.player, 2026).workStudy).toBe(138_00);
    expect(figuresFor(sim.player, 2026).income - income).toBe(138_00);
    // A save and a load after: not paid again.
    sim = reload(sim);
    tended(sim, at(2026, 9, 11, 23));
    expect(wages(sim)).toHaveLength(1);
    expect(yearOf(sim.player, 2026).workStudy).toBe(138_00);
  });

  it('PLAYER JOURNEY: pays the hours owed a minute after a withdrawal, and calls off the Friday’s payday', () => {
    const sim = student('g21-pay-leave');
    tended(sim, at(2026, 9, 5, 18));
    const friday = itemsOf(sim, PAYDAY_KIND).find((i) => i.status === 'pending')!;
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(titled(sim, 'You Withdrew From The School')[0]!.body).toContain('Hours you worked are still paid.');
    expect(sim.universe.scheduled.find((i) => i.id === friday.id)!.status).toBe('cancelled');
    sim.advanceTo(sim.now + MS_HOUR);
    expect(wages(sim).map((t) => t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount)).toEqual([138_00]);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    expect(yearOf(sim.player, 2026).workStudy).toBe(138_00);
    sim.advanceTo(at(2026, 9, 19, 12));
    expect(wages(sim)).toHaveLength(1);
  });

  it('PLAYER JOURNEY: pays into the account Yale’s payroll is told of a week on: Friday’s wages into checking, the next Friday’s into Chase Savings', () => {
    const sim = student('g21-pay-move');
    tended(sim, at(2026, 9, 5, 18));
    const checking = sim.player.primaryAccountId!;
    const savings = bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings')!.id;
    // Yale's payroll takes a pay cycle, seven days: from Saturday 12 September at six.
    sim.must({ kind: 'bank.redirect_deposits', payload: { accountId: savings } });
    tended(sim, at(2026, 9, 18, 17, 1));
    const paid = wages(sim).map((t) => ({ at: t.at, into: t.postings.find((p) => p.amount > 0)!.accountId, amount: t.postings.find((p) => p.amount > 0)!.amount }));
    expect(paid).toEqual([
      { at: at(2026, 9, 11, 17), into: checking, amount: 138_00 },
      { at: at(2026, 9, 18, 17), into: savings, amount: 138_00 },
    ]);
  });
});

// =======================================================================================================================

/** The first spring's Carlotta, played to the morning before its first night and to the evening of its last. */
const carlotta = once(() => {
  const sim = working(student('g21-call'));
  tended(sim, at(2027, 5, 3, 12));
  const beforeRun = serialise(sim.universe);
  tended(sim, at(2027, 5, 12, 18));
  return { beforeRun, beforeLast: serialise(sim.universe) };
});
const fromText = (text: ReturnType<typeof serialise>) => working(loadSave(deserialise(text) as never));
const shows = (sim: Simulation) => itemsOf(sim, CALL_KIND).filter((i) => i.payload.which !== 'rep' && i.payload.call === 'performance').sort((a, b) => a.at - b.at);
const CARLOTTA = 'Carlotta Festival Of New Plays';
/** The director's note as the rule reads it from the nights played: the mean's words, and what cost the nights most. */
function noteFrom(sim: Simulation, lastAt: number): { note: string; overall: number; nights: number } {
  const records = (sim.player.work ?? []).filter((w) => w.task === 'performance' && w.what === CARLOTTA && w.at > lastAt - 120 * MS_DAY);
  const bands: Record<string, number> = {};
  for (const r of records) bands[r.band!] = (bands[r.band!] ?? 0) + 1;
  const held = new Map<string, { label: string; whole: number }>();
  for (const r of records) for (const l of r.limits) if (l.kind === 'ability' || l.kind === 'technique') { const e = held.get(l.what) ?? { label: l.label, whole: 0 }; e.whole += l.whole ?? l.by / 4; held.set(l.what, e); }
  const top = [...held.values()].sort((a, b) => b.whole - a.whole)[0];
  const workOn = top && top.whole / records.length >= 0.5 ? ` Work on your ${top.label.toLowerCase()}: it held the nights back most.` : '';
  return { note: `${opening(meanOf(bands))}${workOn}`, overall: Math.round(records.reduce((a, r) => a + r.overall, 0) / records.length * 10) / 10, nights: records.length };
}

describe('school.call', () => {
  it('closes a run whose last night is missed in hospital: the note from the three nights played, one run milestone, the process looked back on, no breach, once across a save', () => {
    let sim = fromText(carlotta().beforeLast);
    const last = shows(sim).at(-1)!;
    expect(last.payload.last).toBe(true);
    expect(last.at).toBe(at(2027, 5, 12, 20));
    // TEST SETUP: in hospital over the last curtain.
    healthOf(sim.player).inHospitalUntil = last.at + 4 * MS_HOUR;
    tended(sim, last.at + 5 * MS_HOUR);
    const c = sim.player.school!.casting! as Closed;
    expect(sim.universe.scheduled.find((i) => i.id === last.id)!.status).toBe('missed');
    expect(c.performed).toBe(3);
    expect(c.closed).toBe(last.at);
    const want = noteFrom(sim, last.at);
    expect(want.nights).toBe(3);
    expect(c.note).toBe(want.note);
    // On this seed, three solid nights held back most by the emotional depth the part asked.
    expect(c.note).toBe('Solid, sound nights. The next step is to risk more in them. Work on your emotional depth: it held the nights back most.');
    const runs = journeyOf(sim.player).milestones.filter((m) => m.kind === 'run');
    expect(runs).toEqual([{ at: last.at, kind: 'run', what: `A Leading Part In A New Play, ${CARLOTTA}`, overall: want.overall, detail: Object.entries(c.nights!).map(([b, n]) => `${n} ${b}`).join(', ') }]);
    expect(c.process?.reflection).toBeDefined();
    expect(sim.player.school!.tally.breaches).toBe(0);
    expect(sim.player.school!.standing).toBe('good');
    expect(titled(sim, `The Director’s Note: ${CARLOTTA}`).map((n) => n.body)).toEqual([c.note]);
    // The Casting tab: the nights and the note, the run over.
    const tab = drawn(sim, 'casting');
    expect(tab).toContain(`Your nights: Solid 3. The director’s note: ${c.note}`);
    expect(tab).toContain('Calls Ahead None The run is over');
    // A save and a load, and a day on: closed once.
    sim = reload(sim, true);
    tended(sim, sim.now + MS_DAY);
    expect(journeyOf(sim.player).milestones.filter((m) => m.kind === 'run')).toHaveLength(1);
    expect(titled(sim, `The Director’s Note: ${CARLOTTA}`)).toHaveLength(1);
  });

  it('counts a last night missed in New York as a breach and a missed night on the run’s record, closes the run the same, and the next casting reads it as delivered at 3 of 4', () => {
    const hosp = fromText(carlotta().beforeLast);
    const away = fromText(carlotta().beforeLast);
    const last = shows(away).at(-1)!;
    // TEST SETUP: one twin in hospital over the last curtain, the other in New York for it.
    healthOf(hosp.player).inHospitalUntil = last.at + 4 * MS_HOUR;
    tended(hosp, last.at + 5 * MS_HOUR);
    tended(away, last.at - 2 * MS_HOUR);
    away.player.currentLocationId = NEW_YORK;
    away.advanceTo(last.at + 5 * MS_HOUR);
    away.player.currentLocationId = NEW_HAVEN;
    const school = away.player.school!;
    expect(school.tally.breaches).toBe(1);
    expect(school.standing).toBe('warning');
    expect(titled(away, 'Academic Warning')[0]!.body).toContain(`You missed a performance of ${CARLOTTA}, which the School treats as a grave breach of professionalism.`);
    expect(school.runs!.find((r) => r.production === CARLOTTA)).toMatchObject({ source: 'school', nights: 4, missed: 1 });
    expect(hosp.player.school!.runs!.find((r) => r.production === CARLOTTA)).toMatchObject({ nights: 3, missed: 0 });
    // Closed the same: the note from the three played, one milestone.
    const closed = school.casting as Closed;
    expect(closed.closed).toBe(last.at);
    expect(closed.note).toBe(noteFrom(away, last.at).note);
    expect(journeyOf(away.player).milestones.filter((m) => m.kind === 'run')).toHaveLength(1);
    // The fall's casting, on 23 August 2027, reads the run: the missed night delivered at nothing.
    for (const s of [hosp, away]) tended(s, at(2027, 8, 23, 12));
    const read = (s: Simulation) => s.player.school!.lastWork!.from!.find((f) => f.what === CARLOTTA)!;
    expect(read(hosp)).toMatchObject({ source: 'school', nights: 3 });
    expect(read(away)).toMatchObject({ source: 'school', nights: 4 });
    expect(read(away).delivery).toBeCloseTo(read(hosp).delivery * 3 / 4, 3);
    // And the delivery the chair reads, each run weighted by its nights to eight and its kind.
    for (const s of [hosp, away]) {
      const lw = s.player.school!.lastWork!;
      const parts = lw.from!.map((f) => ({ d: f.delivery, w: f.source === 'before' ? f.weight : Math.min(f.nights!, 8) * RUN_WEIGHT[f.source]! }));
      expect(lw.delivery!).toBeCloseTo(parts.reduce((a, p) => a + p.d * p.w, 0) / parts.reduce((a, p) => a + p.w, 0), 3);
    }
    expect(away.player.school!.lastWork!.delivery!).toBeLessThan(hosp.player.school!.lastWork!.delivery!);
  });

  it('closes a run missed in hospital every night: the run went on without them, no milestone, no breach, the note said', () => {
    const sim = fromText(carlotta().beforeRun);
    const nights = shows(sim);
    expect(nights.map((n) => n.at)).toEqual([at(2027, 5, 4, 20), at(2027, 5, 6, 20), at(2027, 5, 9, 20), at(2027, 5, 12, 20)]);
    // TEST SETUP: in hospital over each curtain.
    for (const n of nights) { healthOf(sim.player).inHospitalUntil = n.at + 4 * MS_HOUR; tended(sim, n.at + 5 * MS_HOUR); }
    const c = sim.player.school!.casting! as Closed;
    expect(c.performed).toBe(0);
    expect(c.nights).toBeUndefined();
    expect(c.closed).toBe(nights.at(-1)!.at);
    expect(c.note).toBe(RUN_GONE);
    expect(journeyOf(sim.player).milestones.filter((m) => m.kind === 'run')).toEqual([]);
    expect(c.process?.reflection).toBeDefined();
    expect(sim.player.school!.tally.breaches).toBe(0);
    expect(titled(sim, `The Director’s Note: ${CARLOTTA}`).map((n) => n.body)).toEqual([RUN_GONE]);
  });

  it('shows the director’s note of a run played without them on the Casting tab, as it shows one with nights', () => {
    const sim = fromText(carlotta().beforeRun);
    // TEST SETUP: in hospital over each curtain, as above.
    for (const n of shows(sim)) { healthOf(sim.player).inHospitalUntil = n.at + 4 * MS_HOUR; tended(sim, n.at + 5 * MS_HOUR); }
    expect(sim.player.school!.casting!.note).toBe(RUN_GONE);
    const tab = drawn(sim, 'casting');
    // The run's panel is there, finished.
    expect(tab).toContain('Calls Ahead None The run is over');
    expect(tab).toContain(`The director’s note: ${RUN_GONE}`);
  });
});

// =======================================================================================================================

describe('school.evaluation', () => {
  it('PLAYER JOURNEY: keeps a student at the reach of every skill who grows nothing in good standing, in line with the class; a twin with room who grows nothing is behind, at a concern the Summer Cabaret refuses', () => {
    const base = working(student('g21-eval'));
    tended(base, at(2027, 1, 3, 12));
    const reach = reload(base, true);
    const held = reload(base, true);
    const every = (v: number) => Object.fromEntries(Object.keys(base.player.craft!).map((k) => [k, v]));
    // TEST SETUP, before the spring term's tally is taken on 4 January: every skill at 100 and its reach 100; the twin's
    // at 40 with its reach at 100, held there.
    Object.assign(reach.player.craft!, every(100));
    Object.assign(reach.player.craftCeiling!, every(100));
    Object.assign(held.player.craft!, every(40));
    Object.assign(held.player.craftCeiling!, every(100));
    tended(reach, at(2027, 4, 23, 17, 1));
    while (held.now < at(2027, 4, 23, 17, 1)) { Object.assign(held.player.craft!, every(40)); tended(held, Math.min(at(2027, 4, 23, 17, 1), held.now + 6 * MS_HOUR)); }
    // The spring's evaluation, at the end of its classes, Friday 23 April 2027 at five.
    const spring = (s: Simulation) => s.player.school!.history.find((r) => r.term === 1)!;
    expect(spring(reach).growth).toBe(0);
    expect(spring(reach).standing).toBe('good');
    expect(spring(reach).reason).toContain('your craft grew 0.0 against the class’s');
    expect(spring(reach).reason).toContain('for the room each of you had to grow, in line with the class.');
    expect(reach.player.school!.standing).toBe('good');
    expect(spring(held).standing).toBe('concern');
    expect(spring(held).reason).toContain('for the room each of you had to grow, behind the class.');
    expect(held.player.school!.standing).toBe('concern');
    expect(titled(held, 'A Notice Of Academic Concern')[0]!.body).toContain('Remedy it by the end of next term, or it becomes an academic warning.');
    // The standing read: the Summer Cabaret's company takes a student in good standing, by 30 April.
    expect(held.execute({ kind: 'school.summer_cabaret', payload: {} }).error).toBe('The Summer Cabaret’s company takes a student in good standing.');
    expect(reach.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    // The Evaluations table on the Standing tab.
    expect(drawn(held, 'standing')).toContain(`Spring Term 2027 Academic Concern 100% 0.0 ${spring(held).classGrowth.toFixed(1)} ${spring(held).reason}`);
    expect(drawn(reach, 'standing')).toContain(`Spring Term 2027 Good Standing 100% 0.0 ${spring(reach).classGrowth.toFixed(1)} ${spring(reach).reason}`);
  }, 60_000);

  it('reads a first-year Carlotta played weak at the second fall’s evaluation: its work the mean of both runs’ nights, falling short; a twin at their own craft doesn’t', () => {
    const base = working(student('g21-weak'));
    tended(base, at(2027, 5, 3, 12));
    const weak = reload(base, true);
    // TEST SETUP: every skill and ability at 10 from the morning before the festival's first night.
    const tens = (o: object) => Object.fromEntries(Object.keys(o).map((k) => [k, 10]));
    Object.assign(weak.player.craft!, tens(weak.player.craft!));
    Object.assign(weak.player.attrs!, tens(weak.player.attrs!));
    for (const s of [base, weak]) tended(s, at(2027, 5, 13, 12));
    const festival = (s: Simulation) => ({ ...s.player.school!.casting!.nights });
    const [festBase, festWeak] = [festival(base), festival(weak)];
    expect(festWeak).toEqual({ off: 4 });
    // The second fall's evaluation, at the end of its classes, Friday 10 December 2027 at five.
    for (const s of [base, weak]) tended(s, at(2027, 12, 10, 17, 1));
    /** The term's review, and what the rule makes of its runs of three or more nights: the festival carried over, and the fall's own. */
    const read = (s: Simulation, fest: Partial<Record<string, number>>) => {
      const fall = [s.player.school!.casting, s.player.school!.rep].filter((c) => c && Object.values(c.nights ?? {}).reduce((a, b) => a + b, 0) >= 3);
      return { review: s.player.school!.history.find((r) => r.term === 2)!, mean: meanOf(fest, ...fall.map((c) => c!.nights!)), plays: [CARLOTTA, ...fall.map((c) => c!.play ?? c!.production)].join(' and ') };
    };
    const [b, w] = [read(base, festBase), read(weak, festWeak)];
    expect(b.review.work).toBeCloseTo(b.mean, 9);
    expect(w.review.work).toBeCloseTo(w.mean, 9);
    // Mostly off, a mean of −0.5 or under, falls short; the twin's doesn't.
    expect(w.mean).toBeLessThanOrEqual(-0.5);
    expect(w.review.reason).toContain(`Your work in ${w.plays} fell short of what the program asks.`);
    expect(w.review.standing).toBe('concern');
    expect(b.mean).toBeGreaterThan(-0.5);
    expect(b.review.reason).not.toContain('fell short');
    expect(b.review.standing).toBe('good');
  }, 60_000);

  it('PLAYER JOURNEY: forgives two missed rehearsal calls at a good evaluation, and the chair casts them next term; missed after it, they’re out of the next casting', () => {
    const base = working(student('g21-pool'));
    tended(base, at(2027, 4, 12, 12));
    const calls = itemsOf(base, CALL_KIND).filter((i) => i.payload.which !== 'rep' && i.payload.call === 'rehearsal' && i.status === 'pending').sort((a, b) => a.at - b.at);
    let before = reload(base, true);
    let after = reload(base, true);
    // TEST SETUP: in New York for the afternoon of a call.
    const miss = (s: Simulation, when: number) => { tended(s, when - MS_HOUR); s.player.currentLocationId = NEW_YORK; s.advanceTo(when + 4 * MS_HOUR); s.player.currentLocationId = NEW_HAVEN; };
    const early = calls.filter((c) => c.at < at(2027, 4, 23, 17)).slice(0, 2);
    const late = calls.filter((c) => c.at > at(2027, 4, 23, 17)).slice(0, 2);
    expect(early.map((c) => c.at)).toEqual([at(2027, 4, 13, 15), at(2027, 4, 14, 15)]);
    expect(late.map((c) => c.at)).toEqual([at(2027, 4, 27, 15), at(2027, 4, 28, 15)]);
    for (const c of early) miss(before, c.at);
    expect(before.player.school!.castable).toBe(false);
    expect(titled(before, 'Out Of The Casting Pool')).toHaveLength(1);
    for (const s of [before, after]) tended(s, at(2027, 4, 23, 17, 1));
    for (const s of [before, after]) expect(s.player.school!.history.find((r) => r.term === 1)!.standing).toBe('good');
    expect(before.player.school!.castable).toBe(true);
    for (const c of late) miss(after, c.at);
    expect(after.player.school!.castable).toBe(false);
    // Kept across a save and a load, into the summer.
    [before, after] = [reload(before, true), reload(after, true)];
    expect([before.player.school!.castable, after.player.school!.castable]).toEqual([true, false]);
    // The fall term's casting, Monday 23 August 2027.
    for (const s of [before, after]) tended(s, at(2027, 8, 23, 12));
    expect(before.player.school!.casting).toMatchObject({ term: 2 });
    expect(before.universe.notifications.some((n) => n.title.startsWith('Cast: ') && n.at >= at(2027, 8, 23, 0))).toBe(true);
    expect(after.player.school!.casting).toBeUndefined();
    expect(after.universe.notifications.some((n) => n.title.startsWith('Cast: ') && n.at >= at(2027, 8, 23, 0))).toBe(false);
  }, 60_000);

  it('PLAYER JOURNEY: reads a fall of coursework never prepared as short at the clock’s evaluation, every piece due counted; a twin who prepares each piece stays in good standing', () => {
    // Ada as a player who never prepares a piece: no test setup but the tended body.
    const lazy = student('g21-bands');
    const keen = working(student('g21-bands'));
    for (const s of [lazy, keen]) tended(s, at(2026, 12, 11, 17, 1));
    /** The fall's pieces as the rule counts them: shown or missed unexcused, and of those, unready (a piece shown again at its second band; one not there to be shown again, unready) or not shown. */
    const counted = (s: Simulation) => {
      const work = courseworkOf(s, s.player)!.assignments.filter((a) => a.term === 0);
      const notShown = work.filter((a) => a.status === 'missed' && !a.shown).length;
      const band = (a: (typeof work)[number]) => (a.revision?.missed ? 'unready' : a.revision?.band ?? a.shown!.band);
      const shown = work.filter((a) => a.shown);
      return { shown: shown.length + notShown, unready: shown.filter((a) => band(a) === 'unready').length + notShown };
    };
    const [l, k] = [counted(lazy), counted(keen)];
    const fall = (s: Simulation) => s.player.school!.history.find((r) => r.term === 0)!;
    // Three or more shown, and half or more of them unready: short.
    expect(l.shown).toBeGreaterThanOrEqual(3);
    expect(l.unready * 2).toBeGreaterThanOrEqual(l.shown);
    expect(fall(lazy).coursework).toMatchObject({ shown: l.shown, unready: l.unready });
    expect(fall(lazy).reason).toContain(`${l.unready} of the ${l.shown} pieces due in class were unready or not shown, short of what the program asks.`);
    expect(fall(lazy).standing).toBe('concern');
    expect(k.unready * 2).toBeLessThan(k.shown);
    expect(fall(keen).coursework).toMatchObject({ shown: k.shown, unready: k.unready });
    expect(fall(keen).reason).not.toContain('unready or not shown');
    expect(fall(keen).standing).toBe('good');
  });

  it('PLAYER JOURNEY: holds a student at warning, not dismissed, at the evaluation of the term a performance was missed in, saying why; the twin who played it is in good standing', () => {
    const missed = working(student('g21-breach'));
    tended(missed, at(2027, 8, 24, 12));
    const shows = itemsOf(missed, CALL_KIND).filter((i) => i.payload.which !== 'rep' && i.payload.call === 'performance' && i.status === 'pending').sort((a, b) => a.at - b.at);
    expect(shows[0]!.at).toBe(at(2027, 10, 9, 20));
    const played = reload(missed, true);
    // TEST SETUP: in New York for the thesis production's first night.
    tended(missed, shows[0]!.at - 2 * MS_HOUR);
    missed.player.currentLocationId = NEW_YORK;
    missed.advanceTo(shows[0]!.at + 4 * MS_HOUR);
    missed.player.currentLocationId = NEW_HAVEN;
    expect(missed.player.school!.standing).toBe('warning');
    expect(missed.player.school!.tally.breaches).toBe(1);
    // The second fall's evaluation, Friday 10 December 2027 at five: the breach keeps the term from good standing, and
    // isn't stepped on again (until 2026-10-12 it was, to dismissal).
    for (const s of [missed, played]) tended(s, at(2027, 12, 10, 17, 1));
    const review = (s: Simulation) => s.player.school!.history.find((r) => r.term === 2)!;
    expect(review(missed).standing).toBe('warning');
    expect(review(missed).reason).toMatch(/ A grave breach of professionalism this term keeps you from good standing\.$/);
    expect(missed.player.school!.standing).toBe('warning');
    expect(review(played).standing).toBe('good');
    expect(review(played).reason).not.toContain('grave breach');
    expect(played.player.school!.standing).toBe('good');
  }, 60_000);

  it('dismisses a student on warning who falls short at the clock’s evaluation, and lets the School’s calendar go: no spring, Yale Health thirty days on', () => {
    const sim = working(student('g21-dismiss'));
    tended(sim, at(2026, 9, 1, 12));
    // TEST SETUP: on academic warning, as a missed performance leaves a student; no first-year fall has one to miss.
    sim.player.school!.standing = 'warning';
    tended(sim, at(2026, 11, 1, 12));
    // TEST SETUP: in New York for two weeks of November.
    sim.player.currentLocationId = NEW_YORK;
    sim.advanceTo(at(2026, 11, 15, 12));
    sim.player.currentLocationId = NEW_HAVEN;
    tended(sim, at(2026, 12, 11, 17, 1));
    const school = sim.player.school!;
    const review = school.history.find((r) => r.term === 0)!;
    expect(review.standing).toBe('dismissed');
    expect(review.attendance).toBeLessThan(0.9);
    expect(school.standing).toBe('dismissed');
    expect(school.endedAt).toBe(at(2026, 12, 11, 17));
    expect(titled(sim, 'Dismissed From The School')[0]!.body).toMatch(/^The warning wasn’t met\. You were at \d+% of what was asked of you/);
    // Nothing of the School's left for them on the calendar but the class going on without them.
    const left = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.') && i.payload.personId === sim.player.id);
    expect(left.map((i) => i.kind)).toEqual(['school.former_class']);
    // The spring doesn't begin for them; Yale Health holds thirty days, to 10 January 2027 at five.
    tended(sim, at(2027, 1, 11, 12));
    expect(school.termsBegun).toBe(1);
    expect(coverOn(sim.player, at(2027, 1, 10, 16))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 1, 10, 18))).not.toBe('yale');
    const tab = drawn(sim, 'standing');
    expect(tab).toContain('Left the school.');
    expect(tab).toContain(`Fall Term 2026 Dismissed ${Math.round(review.attendance * 100)}%`);
  });
});

// =======================================================================================================================

/** TEST SETUP: a student in the last term, the program's sixth, with a course of it recorded, and its evaluation on the clock. */
function lastTerm(seed: string, attended: number) {
  const sim = student(seed);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended, excused: 20 - attended } } as never;
  // TEST SETUP: the last run of the degree, four nights of it played.
  school.casting = { production: 'Shakespeare Repertory Project I', play: 'Twelfth Night', by: 'William Shakespeare', role: 'Viola', kind: 'shakespeare', term: 5, performed: 4, size: 'lead' };
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  return sim;
}
/** TEST SETUP: Commencement brought forward from May 2029 to a moment, as tests/leave.test.ts brings it. */
function commencementAt(sim: Simulation, when: number) {
  const booked = itemsOf(sim, COMMENCEMENT_KIND).filter((i) => i.status === 'pending');
  expect(booked.map((i) => i.at)).toEqual([at(2029, 5, 21, 10)]);
  sim.timeline.cancel(booked[0]!.id, sim.now);
  return sim.schedule({ at: when, kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
}

describe('school.commencement', () => {
  it('graduates a student with nothing outstanding at Commencement: the degree, its end, the calendar let go, the last run’s credit, Yale Health to 31 July, no library copy after', () => {
    let sim = lastTerm('g21-grad', 20);
    const school = () => sim.player.school!;
    // The last term's evaluation: good, every course passed, and Commencement on the Monday before Memorial Day 2029.
    expect(school().history.at(-1)).toMatchObject({ term: 5, standing: 'good' });
    expect(school().courses!['5:DRAM 393b']!.result).toBe('pass');
    const day = at(2026, 9, 3, 10);
    commencementAt(sim, day);
    // A copy of a play could be read from the library the day before.
    const play = CONTEMPORARY_PLAYS[0]!.id;
    const twin = reload(sim);
    expect(twin.execute({ kind: 'plays.read', payload: { playId: play } }).ok).toBe(true);
    sim = reload(sim);
    tended(sim, at(2026, 9, 3, 13));
    expect(school().standing).toBe('graduated');
    expect(school().endedAt).toBe(day);
    const told = titled(sim, 'Your MFA Is Conferred');
    expect(told.map((n) => n.body)).toEqual([`You graduate from the ${DAVID_GEFFEN} with an MFA in Acting, class of 2029.`]);
    // Every one of the School's items for them let go.
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.') && i.payload.personId === sim.player.id)).toEqual([]);
    // The last run's credit kept, dated by its term's year.
    expect(school().credits).toEqual([{ production: 'Shakespeare Repertory Project I', role: 'Viola', kind: 'shakespeare', year: 2029, wentOn: 4, size: 'lead' }]);
    // Yale Health covers a graduate through 31 July; graduated in September, the July of the year after.
    expect(coverOn(sim.player, at(2027, 7, 31, 12))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 8, 1, 12))).not.toBe('yale');
    // The library lends to students: after the degree, no copy.
    expect(sim.execute({ kind: 'plays.read', payload: { playId: play } }).error).toBe('A copy is borrowed from the Haas Arts Library, which lends to students.');
    // The Standing tab.
    const tab = drawn(sim, 'standing');
    expect(tab).toContain('class of 2029. Graduated.');
    expect(tab).toContain('Standing Graduated');
    // Once: a save, a load and a week on, conferred once.
    sim = reload(sim);
    tended(sim, at(2026, 9, 10, 12));
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(school().endedAt).toBe(day);
  });

  it('withholds the degree at Commencement from a student whose last-term Incomplete ran out its month before it', () => {
    const sim = lastTerm('g21-grad-late', 12);
    const record = sim.player.school!.courses!['5:DRAM 393b']!;
    // Ill for 8 of its 20 meetings: an Incomplete, its month from the evaluation.
    expect(record.result).toBe('incomplete');
    expect(record.dueBy).toBe(at(2026, 9, 1, 18, 1) + 30 * MS_DAY);
    expect(sim.player.school!.history.at(-1)).toMatchObject({ term: 5, standing: 'good' });
    const day = record.dueBy! + MS_DAY;
    commencementAt(sim, day);
    tended(sim, record.dueBy! + MS_HOUR);
    // Its month out: a Permanent Incomplete, and nothing yet to withhold.
    expect(record.result).toBe('permanent');
    expect(sim.player.school!.standing).toBe('good');
    tended(sim, day + 3 * MS_HOUR);
    expect(sim.player.school!.standing).toBe('withheld');
    expect(sim.player.school!.endedAt).toBe(day);
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual(['The degree needs every course passed, and Acting VI wasn’t. The faculty didn’t recommend the degree, and your terms at the School are over.']);
    expect(titled(sim, 'Your MFA Is Conferred')).toEqual([]);
    expect(sim.player.school!.awaitingDegree).toBeUndefined();
  });
});
