/**
 * Evidence for seven School rows the review of 2026-10-13 left partial (verification group g22-school). Each row's
 * action is reached the way a player reaches it, through the command its entry runs or through the clock that fires its
 * scheduled kind, and each consequence is read where the row says it's read, against figures worked out here from the
 * rule's own numbers and written as literals, not asked of the helper that computes them.
 *
 * - `school.company`: the class's fall Cabaret show ends at 11:30 PM on Saturday 10 October 2026, by the clock. Each of
 *   its four classmates grows by its nine evenings and five nights (lines and feeling both, where only one classmate's
 *   was held before); each one's composure closes 0.5% of what's left to 100 a night, five times (`composureGain`,
 *   0.005, worked as 100 − (100 − before) × 0.995⁵), and the evaluation reads it so (`classmatePerformer`); each run is
 *   judged into `shown`, the production named, its runs counted, a classmate at an even 90 shown higher than one at an
 *   even 40 in the same run; the player's place in memorization falls behind a classmate tied with her before it; and
 *   Around The Class, rendered as the player has it, shows each one's "N in Yale Cabaret, Season 59" where the cell was
 *   empty before, and the chair's read of the weaker one for a new play rises (`castFit`). A save and a load keep it, and
 *   run nothing twice. Through the spring, the classmates in both Cabaret shows have two runs by February, and every
 *   classmate one more, its composure grown by four nights, after the Carlotta Festival.
 * - `school.lab`: a Drama 50 afternoon grows scene, character, script and memorization by one session each at the day's
 *   focus (0.42 × 1.2 × (1 − level ÷ reach)^1.5, `ESTIMATE.sessionGain` and focus's cap), each kept in the development
 *   history under 'lab', with its call and DRAM 50a's meeting counted. The third year's solo showing, booked by the
 *   clock's own term (`scheduleLabs`) for Friday 19 January 2029 at three, is judged as a lead's night: its band read
 *   from its whole at 50, 65 and 80, morale up 3 for strong or remarkable, down 3 for off, held for solid, its notice
 *   saying both, the scene grown three sessions' worth (0.42 × 3 × 1.2 × …) and kept under 'lab:showing', and DRAM
 *   363a's meeting counted.
 * - `school.cabaret (kind)`: a show joined by command, played Thursday, missed away in New York on Friday at eight and
 *   at the Saturday closing: the record of runs has five nights, two of them missed; the closing missed after shows
 *   were played still credits the three played and closes the run, its director's note the sentence its nights' mean
 *   reads (off −1, solid 0, strong 1, remarkable 2, at 1.25, 0.5 and −0.25), its look back and its open notes in the
 *   ledger, its milestone at the mean of the three nights' records; and the Casting tab and the Profile say so. A save
 *   and a load credit nothing twice.
 * - `school.summer`: the first show's closing missed in hospital after three nights is credited with the three and
 *   closed with its note and its look back (the review's defect, fixed in `SUMMER_KIND` that day); its twin who plays the
 *   closing has the same credit with a fourth night; both grew past a twin who never joined; the summer panel and the
 *   Profile say it. A performance missed away from New Haven puts the student out, notes the night missed in the record
 *   of runs, stops the stipend at the three hours of its week worked, and the fall's casting reads it at nothing
 *   delivered. The closing missed away in New York after three nights is held to the review's todo, which credits it
 *   and closes the run as the Cabaret and a School production do whether or not the miss is excused: that test failed
 *   when written, since the fix of 2026-10-13 credited and closed only an excused closing, until `SUMMER_KIND` did so
 *   too, later that day.
 * - `school.stipend`: the first Friday's stipend (4 June 2027), paid by the clock, withholds FICA's 7.65% of $375
 *   ($28.69) and nothing else for a student with no other wages; $40,000 of wages earlier in the year make it $129.38,
 *   the IRS's 12% and 7.65% ($73.69) and Connecticut's $55.69 (its exemption cut to $4,000 at $40,375, 2% and 4.5%, its
 *   10% credit); an F-1 student's has no FICA and the IRS’s 10% from the first dollar, $37.50 (until 2026-10-13 nothing,
 *   worked on a resident’s standard deduction); and the next February's return reads what the clock paid and withheld:
 *   the 1040-NR at 10% of income with no payroll tax, the resident's 1040 with the year's wages and every week's
 *   withholding.
 * - `school.orientation (kind)`: Meeting Your Class missed in New York leaves no classmate met, a partner refused in
 *   askRefusal's words, until it's caught up; The Courses And What They Ask sets the eight first-year fall courses their
 *   first work for Sunday 30 August, and missed in hospital sets none until Monday's first classes (or a catch-up); the
 *   tour missed in hospital leaves the studios and the library refused in needRefusal's and copyAt's words, grayed on the
 *   screen, until it's caught up, which a save keeps.
 * - `school.partner_rehearsal`: kept, trust 50 → 54 and bond 0 → 2, the partner part 0.4 × 1.1, listening grown and
 *   kept in the history, and the partner's words, which change with what was prepared, on the Coursework tab; the
 *   partner not coming, trust and bond held, their notice, and the apology the clock brings to class, accepted for 2;
 *   missed by you, trust 38 and bond −5; a sprain excusing the intimacy practice on its feet and not the scene study;
 *   the 'partner' approach worked once, by 0.2 of what's left, and not again.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) or, for the F-1 student, in London, an actor at Yale in New
 * Haven from Monday 24 August 2026, played by the clock six hours at a time and through the commands a screen sends.
 * Saves are twinned where a row's outcome is one choice apart, by `loadSave(deserialise(serialise(...)))` at the moment
 * before it. Screens are rendered with react-dom/server, as tests/whynot-school.test.ts renders them.
 *
 * TEST SETUP, said again where it's done: a student who does the coursework (every part prepared each midnight, as
 * tests/school.test.ts plays one) where the life is played into a later term, since a term of work shown unready falls
 * to concern and the Summer Cabaret takes a student in good standing; the day's dials set rested where a figure reads
 * the day's focus; the location set to New York, a stay in hospital or a sprain set where a call or a session is to be
 * missed or excused; a late show's student kept awake; two classmates' craft and reach set even, and one's memorization
 * tied to the player's, before the company's run ends; a third-year's every technique and ability set even at 95, 58 or
 * 30 before the solo showing; a classmate's reliability set to 1 or 0 for a rehearsal that comes or doesn't; a note
 * given three times, as three showings give it; and wages earned earlier in a year, recorded as a job's are.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import {
  CABARET_KIND, COMPANY_KIND, LAB_KIND, STIPEND_KIND, SUMMER_KIND, castFit, classmatePerformer, evenCraft, mateAbilities, rankIn,
} from '@/engine/systems/school';
import { NEW_PLAYS_READ } from '@/engine/content/plays';
import { ORIENTATION_KIND, courseworkOf, mateRecord, notesOf, preparedParts, trustOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf, personOf } from '@/engine/systems/classmates';
import { attributesOf, developmentOf } from '@/engine/systems/attributes';
import { DEVELOPMENT } from '@/engine/content/abilities';
import { journeyOf } from '@/engine/systems/evaluation';
import { hasProcess } from '@/engine/systems/production';
import { healthOf } from '@/engine/systems/health';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';
import { recordNote } from '@/engine/systems/learning';

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

const zone = 'America/New_York';
const NEW_HAVEN = 'us-ct-newhaven';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed: string, born = 'us-ny-newyork') => createSave(1, seed, { ...newLifeConfig(), homeRegionId: born, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: a student who does the coursework, its every part prepared each midnight, as tests/school.test.ts plays one. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => { for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); });
  return sim;
};
/** Played by the clock, six hours at a time. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); };
/** TEST SETUP: rested, fed and steady, every dial at its best and morale at `morale`, so the day's focus is at its 1.2 cap. */
const rested = (sim: Simulation, morale = 75) => {
  Object.assign(sim.player.wellbeing, { energy: 100, stress: 0, sleepDebt: 0, nourishment: 100, morale, hygiene: 100, condition: 100 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now - 6 * MS_HOUR);
};
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const twinOf = (snap: string): Simulation => loadSave(deserialise(snap) as never);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);
const itemIn = (sim: Simulation, id: string) => sim.universe.scheduled.find((i) => i.id === id)!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const round3 = (x: number) => Math.round(x * 1000) / 1000;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A night's band from its whole, at the evaluation's lines: 50, 65 and 80 (`EVALUATION.bands`, LAMDA's Pass, Merit, Distinction). */
const bandOf = (overall: number) => (overall >= 80 ? 'remarkable' : overall >= 65 ? 'strong' : overall >= 50 ? 'solid' : 'off');
/** The director's note's sentence for a run's nights: each worth off −1, solid 0, strong 1, remarkable 2, cut at 1.25, 0.5, −0.25. */
const noteSentence = (nights: Partial<Record<'off' | 'solid' | 'strong' | 'remarkable', number>>) => {
  const value = { off: -1, solid: 0, strong: 1, remarkable: 2 } as const;
  const all = Object.entries(nights) as [keyof typeof value, number][];
  const n = all.reduce((s, [, c]) => s + c, 0);
  const mean = all.reduce((s, [b, c]) => s + value[b] * c, 0) / n;
  return mean >= 1.25 ? 'Remarkable work: you held the house night after night, and it’s been noticed.'
    : mean >= 0.5 ? 'Strong, reliable work. The part was yours by the second night.'
      : mean >= -0.25 ? 'Solid, sound nights. The next step is to risk more in them.'
        : 'Uneven. Some nights got away from you: come in rested, and have the part in your body before the house does.';
};
/** The note in full: the sentence, and what held the nights back most where something did. */
const noteFor = (nights: Parameters<typeof noteSentence>[0]) => new RegExp(`^${escape(noteSentence(nights))}( Work on your [a-z -]+: it held the nights back most\\.)?$`);
/** The nights as the Casting tab lists them, strongest first. */
const nightsWords = (nights: Partial<Record<'off' | 'solid' | 'strong' | 'remarkable', number>>) =>
  (['remarkable', 'strong', 'solid', 'off'] as const).filter((b) => nights[b]).map((b) => `${{ remarkable: 'Remarkable', strong: 'Strong', solid: 'Solid', off: 'Off' }[b]} ${nights[b]}`).join(', ');

/** A screen as the player has it: its markup, and its words with every tooltip taken out before the tags. */
function drawn(sim: Simulation, screen: FunctionComponent, tab = 'standing'): { html: string; shown: string } {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
/** The buttons of that label, grayed with that reason as their tooltip. */
const grayed = (html: string, label: string, why: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label && m[1]!.includes('disabled=""') && m[1]!.includes(`title="${why}"`));
/** The buttons of that label that can be pressed. */
const pressable = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label && !m[1]!.includes('disabled=""'));

// ---------------------------------------------------------------------------------------------------------------------

describe('school.company', () => {
  it('PLAYER JOURNEY: the fall Cabaret show ends by the clock: four classmates grown by its 9 evenings and 5 nights, composure by 5 nights, judged into Around The Class, the stronger shown higher', () => {
    const sim = life('g22-company');
    play(sim, at(2026, 10, 10, 23));
    const school = sim.player.school!;
    const [run] = pending(sim, COMPANY_KIND);
    expect(run!.label).toBe('Yale Cabaret, Season 59: The Show Ends');
    expect(run!.at).toBe(at(2026, 10, 10, 23, 30));
    expect(run!.payload).toMatchObject({ production: 'Yale Cabaret, Season 59', rehearsals: 9, performances: 5 });
    const mates = run!.payload.mates as number[];
    expect(mates).toHaveLength(4);
    const [strong, weak, tie] = mates as [number, number, number, number];
    // TEST SETUP: one classmate at an even 90 with the scale's 100 to reach, one at an even 40, and a third's memorization
    // tied with the player's, which rankIn doesn't count as ahead of her.
    Object.assign(school.classmates[strong]!.craft, evenCraft(90));
    Object.assign(school.classmates[strong]!.ceiling!, evenCraft(100));
    Object.assign(school.classmates[weak]!.craft, evenCraft(40));
    school.classmates[tie]!.craft.memorization = sim.player.craft!.memorization;
    const before = mates.map((i) => ({ craft: { ...school.classmates[i]!.craft }, composure: mateAbilities(sim, sim.player, i).composure }));
    for (const i of mates) expect(school.classmates[i]!.shown).toBeUndefined();
    const rank = rankIn(sim.player, 'memorization');
    // How the chair would read the weaker one for a new play, on the craft and abilities they come to it with.
    const fit = () => castFit(sim, classmatePerformer(sim, sim.player, weak), NEW_PLAYS_READ, [], 'g22-fit');
    const fitBefore = fit();
    const row = (i: number, last: string) => `<td>${school.classmates[i]!.name}</td><td>Yale Cabaret, Season 59</td><td>A Part In A Cabaret Show</td><td class="mono">${last}</td>`;
    const pre = drawn(sim, SchoolWorkspace, 'casting');
    expect(pre.shown).toContain('Around The Class');
    for (const i of mates) expect(pre.html).toContain(row(i, ''));

    sim.advanceTo(run!.at + 60_000);
    expect(run!.status).toBe('done');
    mates.forEach((i, k) => {
      const m = school.classmates[i]!;
      const b = before[k]!;
      // The rehearsals' lines and the nights' feeling, every one of the four.
      expect(m.craft.memorization, m.name).toBeGreaterThan(b.craft.memorization);
      expect(m.craft.emotion, m.name).toBeGreaterThan(b.craft.emotion);
      // Five nights, each closing 0.5% of what's left to 100.
      const composure = 100 - (100 - b.composure) * 0.995 ** 5;
      expect(mateAbilities(sim, sim.player, i).composure).toBeCloseTo(composure, 9);
      expect(classmatePerformer(sim, sim.player, i).ability('composure')).toBeCloseTo(composure, 9);
      expect(m.shown).toMatchObject({ production: 'Yale Cabaret, Season 59', at: run!.at, runs: 1 });
      expect(m.shown!.quality).toBeGreaterThan(0);
      expect(m.shown!.quality).toBeLessThanOrEqual(100);
    });
    // The same run, judged on the craft each brought: 90 against 40.
    expect(school.classmates[strong]!.shown!.quality).toBeGreaterThan(school.classmates[weak]!.shown!.quality + 10);
    // The tied classmate's lines grew past the player's: one more ahead of her.
    expect(school.classmates[tie]!.craft.memorization).toBeGreaterThan(sim.player.craft!.memorization);
    expect(rankIn(sim.player, 'memorization')).toBeGreaterThan(rank);
    expect(fit()).toBeGreaterThan(fitBefore);
    const post = drawn(sim, SchoolWorkspace, 'casting');
    for (const i of mates) expect(post.html).toContain(row(i, `${Math.round(school.classmates[i]!.shown!.quality)} in Yale Cabaret, Season 59`));

    // Kept through a save, and nothing run twice.
    const back = reload(sim);
    back.advanceTo(back.now + 2 * MS_HOUR);
    mates.forEach((i, k) => {
      const m = back.player.school!.classmates[i]!;
      expect(m.shown).toEqual(school.classmates[i]!.shown);
      expect(mateAbilities(back, back.player, i).composure).toBeCloseTo(100 - (100 - before[k]!.composure) * 0.995 ** 5, 9);
      expect(m.craft.memorization).toBe(school.classmates[i]!.craft.memorization);
    });
  }, 60_000);

  it('PLAYER JOURNEY: shown counts each run and names the latest: the classmate in both Cabaret shows has two by February, and the Carlotta Festival’s four nights add one to every classmate', () => {
    const sim = life('g22-company');
    play(sim, at(2026, 10, 11, 9));
    const fall = sim.universe.scheduled.find((i) => i.kind === COMPANY_KIND && i.status === 'done')!;
    play(sim, at(2027, 2, 6, 23));
    const spring = pending(sim, COMPANY_KIND).find((i) => i.label === 'Yale Cabaret, Season 59: The Show Ends')!;
    expect(spring.at).toBe(at(2027, 2, 6, 23, 30));
    const both = (spring.payload.mates as number[]).filter((i) => (fall.payload.mates as number[]).includes(i));
    expect(both.length).toBeGreaterThan(0);
    const school = sim.player.school!;
    for (const i of both) expect(school.classmates[i]!.shown!.runs).toBe(1);
    sim.advanceTo(spring.at + 60_000);
    for (const i of both) expect(school.classmates[i]!.shown).toMatchObject({ production: 'Yale Cabaret, Season 59', at: spring.at, runs: 2 });

    play(sim, at(2027, 5, 12, 21));
    const carlotta = pending(sim, COMPANY_KIND).find((i) => i.label === 'Carlotta Festival Of New Plays: The Run Ends')!;
    expect(carlotta.at).toBe(at(2027, 5, 12, 22));
    expect(carlotta.payload).toMatchObject({ performances: 4, production: 'Carlotta Festival Of New Plays' });
    const whole = carlotta.payload.mates as number[];
    expect([...whole].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i));
    const was = whole.map((i) => ({ runs: school.classmates[i]!.shown?.runs ?? 0, composure: mateAbilities(sim, sim.player, i).composure, craft: { ...school.classmates[i]!.craft } }));
    sim.advanceTo(carlotta.at + 60_000);
    whole.forEach((i, k) => {
      const m = school.classmates[i]!;
      expect(m.shown).toMatchObject({ production: 'Carlotta Festival Of New Plays', at: carlotta.at, runs: was[k]!.runs + 1 });
      expect(mateAbilities(sim, sim.player, i).composure).toBeCloseTo(100 - (100 - was[k]!.composure) * 0.995 ** 4, 9);
      expect(m.craft.memorization, m.name).toBeGreaterThan(was[k]!.craft.memorization);
    });
    const shown = drawn(sim, SchoolWorkspace, 'casting').html;
    for (const i of whole) expect(shown).toContain(`<td class="mono">${Math.round(school.classmates[i]!.shown!.quality)} in Carlotta Festival Of New Plays</td>`);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

/** Discipline's lift on a growth (`grown`, from 2026-10-16): a tenth more at 100, a tenth less at 0. */
const lift = (sim: Simulation) => 1 + DEVELOPMENT.disciplineLift * (attributesOf(sim, sim.player).discipline - 50) / 50;

describe('school.lab', () => {
  it('PLAYER JOURNEY: a Drama 50 afternoon grows its four skills one session each at the day’s focus, kept in the development history under lab, its call and DRAM 50a’s meeting counted', () => {
    const sim = life('g22-drama50');
    play(sim, at(2026, 9, 8, 14, 59));
    const [lab] = pending(sim, LAB_KIND);
    expect(lab!.label).toBe('Drama 50: The Theatrical Event');
    expect(lab!.at).toBe(at(2026, 9, 8, 15));
    expect(lab!.payload.showing).toBe(false);
    const p = sim.player;
    rested(sim); // TEST SETUP: rested, focus at its cap.
    const craft = { ...p.craft! };
    const reach = p.craftCeiling!;
    const tally = { ...p.school!.tally };
    sim.advanceTo(lab!.at + 60_000);
    const kept = developmentOf(p).history.filter((x) => x.source === 'lab');
    for (const [skill, id] of [['scene', 'scene'], ['character', 'character'], ['script', 'script'], ['memorization', 'memory']] as const) {
      const rise = p.craft![skill] - craft[skill];
      // One session at the cap of focus, 1.2 (readiness past 96, at three o'clock nobody's hour): 0.42 × 1.2 × room^1.5,
      // and from 2026-10-16 discipline's lift, 1 + 0.1 × (discipline − 50) / 50, as every growth reads it (`grown`).
      expect(rise, skill).toBeCloseTo(0.42 * 1.2 * (1 - craft[skill] / reach[skill]) ** 1.5 * lift(sim), 9);
      expect(kept.filter((x) => x.id === id), skill).toEqual([{ at: lab!.at, id, delta: round3(rise), source: 'lab' }]);
    }
    expect(kept).toHaveLength(4);
    expect(p.craft!.emotion).toBe(craft.emotion);
    expect(p.school!.tally.calls).toBe(tally.calls + 1);
    expect(p.school!.tally.answered).toBe(tally.answered + 1);
    expect(p.school!.courses!['0:DRAM 50a']).toMatchObject({ meetings: 1, attended: 1, excused: 0 });
  }, 60_000);

  it('PLAYER JOURNEY: the third year’s solo showing, booked for Friday 19 January 2029 by the clock, judged as a lead’s night: band from its whole, morale by the band, the scene grown three sessions’ worth', () => {
    const sim = working(life('g22-showing'));
    // TEST SETUP: the day's dials kept steady each six hours, as a player who looks after herself keeps them.
    while (sim.now < at(2029, 1, 19, 14, 59)) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(at(2029, 1, 19, 14, 59), sim.now + 6 * MS_HOUR)); }
    expect(sim.player.school!.standing).toBe('good');
    expect(sim.player.school!.termsBegun).toBe(6);
    const shows = sim.universe.scheduled.filter((i) => i.kind === LAB_KIND && i.payload.showing === true);
    expect(shows).toHaveLength(1);
    const item = shows[0]!;
    expect(item.status).toBe('pending');
    expect(item.label).toBe('You Are The Creator: Your Showing');
    expect(item.at).toBe(at(2029, 1, 19, 15));
    expect(new Date(Date.UTC(2029, 0, 19)).getUTCDay()).toBe(5);
    const snap = serialise(sim.universe);
    const shown = (level: number) => {
      const twin = twinOf(snap);
      const p = twin.player;
      // TEST SETUP: every technique and ability at `level`, and the day rested, morale at 50.
      Object.assign(p.craft!, evenCraft(level));
      Object.assign(p.attrs!, { presence: level, composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level });
      rested(twin, 50); // TEST SETUP: rested, morale at 50.
      const tally = { ...p.school!.tally };
      const scene = p.craft!.scene;
      twin.advanceTo(item.at + 60_000);
      expect(itemIn(twin, item.id).status).toBe('done');
      const record = (p.work ?? []).filter((w) => w.what === 'You Are The Creator');
      expect(record).toHaveLength(1);
      const r = record[0]!;
      expect(r.at).toBe(item.at);
      expect(r.band).toBe(bandOf(r.overall));
      const word = { remarkable: 'Remarkable', strong: 'Strong', solid: 'Solid', off: 'An Off Night' }[bandOf(r.overall)];
      expect(titled(twin, `Your Solo Showing: ${word}`).map((n) => n.body)).toEqual([`You Are The Creator, shown to the class: ${Math.round(r.overall)} of 100.`]);
      expect(p.wellbeing.morale).toBe(50 + ({ remarkable: 3, strong: 3, solid: 0, off: -3 }[bandOf(r.overall)]));
      // Three sessions' worth of scene at focus's cap: 0.42 × 3 × 1.2 × room^1.5, nothing past the reach; and from
      // 2026-10-16 discipline's lift (`grown`).
      const rise = p.craft!.scene - scene;
      expect(rise).toBeCloseTo(0.42 * 3 * 1.2 * Math.max(0, 1 - level / p.craftCeiling!.scene) ** 1.5 * lift(twin), 9);
      expect(developmentOf(p).history.filter((x) => x.source === 'lab:showing')).toEqual(rise > 0 ? [{ at: item.at, id: 'scene', delta: round3(rise), source: 'lab:showing' }] : []);
      expect(p.school!.tally.calls).toBe(tally.calls + 1);
      expect(p.school!.tally.answered).toBe(tally.answered + 1);
      expect(p.school!.courses!['5:DRAM 363a']).toMatchObject({ name: 'You Are The Creator', meetings: 1, attended: 1 });
      return { band: r.band, overall: r.overall, rise };
    };
    const strong = shown(95);
    const middling = shown(58);
    const weak = shown(30);
    expect(strong.band).toBe('remarkable');
    expect(middling.band).toBe('solid');
    expect(weak.band).toBe('off');
    expect(strong.overall).toBeGreaterThan(middling.overall);
    expect(middling.overall).toBeGreaterThan(weak.overall);
    // Below the reach the scene grew; at 95, past it, it didn't.
    expect(weak.rise).toBeGreaterThan(0);
    expect(strong.rise).toBe(0);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

describe('school.cabaret (kind)', () => {
  it('PLAYER JOURNEY: played Thursday, away in New York for Friday at eight and the Saturday closing: two nights missed in the record, the closing credited with the three played, the run closed with its note, look back, ledger and milestone, and the screens saying so', () => {
    const sim = life('g22-cabaret');
    play(sim, at(2026, 9, 7, 18));
    expect(sim.must<{ week: string }>({ kind: 'school.cabaret', payload: {} }).week).toBe('2026-10-01');
    const cab = sim.player.school!.cabaret!;
    expect(cab.production).toBe('Yale Cabaret, Season 59');
    const shows = pending(sim, CABARET_KIND).filter((c) => c.payload.call === 'performance');
    expect(shows.map((s) => s.at)).toEqual([at(2026, 10, 1, 20), at(2026, 10, 2, 20), at(2026, 10, 2, 23), at(2026, 10, 3, 20), at(2026, 10, 3, 23)]);
    expect(shows.map((s) => s.payload.last)).toEqual([false, false, false, false, true]);
    const away = [1, 4];
    shows.forEach((s, k) => {
      play(sim, s.at - 60_000);
      // TEST SETUP: in New York for the two shows missed, in New Haven for the rest, and awake for the late ones.
      sim.player.currentLocationId = away.includes(k) ? 'us-ny-newyork' : NEW_HAVEN;
      sim.player.awakeSince = s.at - 8 * MS_HOUR;
      sim.advanceTo(s.at + 60_000);
    });
    sim.player.currentLocationId = NEW_HAVEN;
    expect(shows.map((s) => s.status)).toEqual(['done', 'missed', 'done', 'done', 'missed']);
    expect(cab.performed).toBe(3);
    const school = sim.player.school!;
    // The record of runs the next casting reads: five nights, the two missed delivered at nothing.
    expect(school.runs!.filter((r) => r.source === 'cabaret')).toHaveLength(1);
    expect(school.runs!.find((r) => r.source === 'cabaret')).toMatchObject({ production: 'Yale Cabaret, Season 59', role: cab.role, nights: 5, missed: 2 });
    // The closing missed after three were played: credited with the three.
    expect(school.credits).toEqual([{ production: 'Yale Cabaret, Season 59', role: cab.role, kind: 'cabaret', year: 2026, wentOn: 3 }]);
    const nights = cab.nights!;
    expect(Object.values(nights).reduce((a, b) => a + b, 0)).toBe(3);
    // One judged record a night played, in the work and the journey.
    const records = (sim.player.work ?? []).filter((w) => w.task === 'performance' && w.what === 'Yale Cabaret, Season 59');
    expect(records.map((w) => w.at)).toEqual([shows[0]!.at, shows[2]!.at, shows[3]!.at]);
    // Closed at the closing, with its note, its notice and its look back.
    const run = cab as typeof cab & { closed?: number; note?: string };
    expect(run.closed).toBe(shows[4]!.at);
    expect(run.note).toMatch(noteFor(nights));
    expect(titled(sim, 'The Director’s Note: Yale Cabaret, Season 59').map((n) => n.body)).toEqual([run.note]);
    expect(hasProcess(cab)).toBe(true);
    const proc = hasProcess(cab) ? cab.process : undefined;
    expect(proc!.reflection!.on).toBe(shows[4]!.at);
    expect(proc!.reflection!.text).toMatch(new RegExp(`^Yale Cabaret, Season 59: ${proc!.calls} calls? answered of 9; .* What’s still open goes with you into class\\.$`));
    // The open notes carried into class: the coursework ledger has them from the closing's day.
    const ledger = notesOf(courseworkOf(sim, sim.player)!).filter((n) => n.history.some((x) => x.assignmentId === 'production:Yale Cabaret, Season 59'));
    expect(ledger.length).toBeGreaterThan(0);
    for (const n of ledger) expect(n.history.filter((x) => x.assignmentId === 'production:Yale Cabaret, Season 59').map((x) => [x.on, x.course])).toEqual([['2026-10-03', 'Yale Cabaret, Season 59']]);
    // The journey's milestone, at the mean of the three nights' records.
    const mean = records.reduce((a, w) => a + w.overall, 0) / records.length;
    expect(journeyOf(sim.player).milestones.filter((m) => m.kind === 'run')).toEqual([{ at: shows[4]!.at, kind: 'run', what: `${cab.role}, Yale Cabaret, Season 59`, overall: Math.round(mean * 10) / 10, detail: Object.entries(nights).map(([b, n]) => `${n} ${b}`).join(', ') }]);

    // The Casting tab and the Profile, as the player has them.
    const tab = drawn(sim, SchoolWorkspace, 'casting').shown;
    expect(tab).toContain('Performed 3 of 5');
    expect(tab).toContain(`Your nights: ${nightsWords(nights)}. The director’s note: ${run.note}`);
    expect(drawn(sim, ProfileWorkspace).shown).toContain(`On stage: ${cab.role} in Yale Cabaret, Season 59, 2026.`);

    // Kept through a save; nothing credited or noted twice.
    const back = reload(sim);
    play(back, back.now + MS_DAY);
    expect(back.player.school!.credits).toEqual(school.credits);
    expect(titled(back, 'The Director’s Note: Yale Cabaret, Season 59')).toHaveLength(1);
    expect(journeyOf(back.player).milestones.filter((m) => m.kind === 'run')).toHaveLength(1);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

describe('school.summer', () => {
  it('PLAYER JOURNEY: the first show’s closing missed in hospital after three nights is credited with the three and closed; its twin who plays the closing has a fourth; both grew past a twin who never joined', () => {
    const sim = working(life('g22-summer'));
    play(sim, at(2027, 3, 20, 12));
    expect(sim.player.school!.standing).toBe('good');
    const never = working(twinOf(serialise(sim.universe)));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const nights = pending(sim, SUMMER_KIND).filter((c) => c.payload.call === 'performance' && c.payload.run === 0);
    // Friday 25 June at eight, the Saturday matinee and evening, Sunday the closing; dark on Monday the 28th.
    expect(nights.map((c) => c.at)).toEqual([at(2027, 6, 25, 20), at(2027, 6, 26, 14), at(2027, 6, 26, 20), at(2027, 6, 27, 20)]);
    const closing = nights[3]!;
    expect(closing.payload.last).toBe(true);
    play(sim, closing.at - 60_000);
    const summer = sim.player.school!.summer!;
    expect(summer.played[0]).toBe(3);
    const snap = serialise(sim.universe);

    // The closing played.
    sim.advanceTo(closing.at + 60_000);
    const show = summer.shows![0]! as NonNullable<typeof summer.shows>[number] & { closed?: number; note?: string };
    expect(summer.played[0]).toBe(4);
    expect(sim.player.school!.credits).toEqual([{ production: `${show.play}, Yale Summer Cabaret 2027`, role: show.role, kind: 'summer', year: 2027, wentOn: 4 }]);
    expect(Object.values(show.nights!).reduce((a, b) => a + b, 0)).toBe(4);
    expect(sim.player.school!.runs!.find((r) => r.source === 'summer')).toMatchObject({ play: show.play, nights: 4, missed: 0 });
    expect(show.closed).toBe(closing.at);
    expect(show.note).toMatch(noteFor(show.nights!));
    // Grown by its rehearsals and nights past a twin who never joined, in the scene, the feeling and the lines.
    play(never, closing.at + 60_000);
    for (const skill of ['scene', 'emotion', 'memorization'] as const) expect(sim.player.craft![skill], skill).toBeGreaterThan(never.player.craft![skill]);

    // The closing missed in hospital.
    const ward = working(twinOf(snap));
    // TEST SETUP: in hospital from the closing's curtain for three hours.
    healthOf(ward.player).inHospitalUntil = closing.at + 3 * MS_HOUR;
    ward.advanceTo(closing.at + 60_000);
    const s = ward.player.school!;
    const wshow = s.summer!.shows![0]! as typeof show;
    expect(itemIn(ward, closing.id).status).toBe('missed');
    expect(s.summer!.played[0]).toBe(3);
    expect(s.credits).toEqual([{ production: `${wshow.play}, Yale Summer Cabaret 2027`, role: wshow.role, kind: 'summer', year: 2027, wentOn: 3 }]);
    expect(wshow.closed).toBe(closing.at);
    expect(wshow.note).toMatch(noteFor(wshow.nights!));
    expect(titled(ward, `The Director’s Note: ${wshow.play}`).map((n) => n.body)).toEqual([wshow.note]);
    expect(hasProcess(wshow) ? wshow.process.reflection?.text : undefined).toMatch(new RegExp(`^${escape(wshow.play!)}: `));
    // Excused: kept in the company, the next show's calls still ahead, and the night not noted as missed.
    expect(s.summer!.out).toBeFalsy();
    expect(pending(ward, SUMMER_KIND).filter((c) => c.payload.run === 1).length).toBeGreaterThan(0);
    expect(s.runs!.find((r) => r.source === 'summer')).toMatchObject({ nights: 3, missed: 0 });

    // The summer panel and the Profile, as the player has them.
    const panel = drawn(ward, SchoolWorkspace, 'casting').shown;
    expect(panel).toContain(`${wshow.play} , by ${wshow.by}: ${wshow.role}, June 25, 2027 to June 28, 2027, played 3. Your nights: ${nightsWords(wshow.nights!)}. The director’s note: ${wshow.note}`);
    expect(panel).toContain(`Looking Back: ${hasProcess(wshow) ? wshow.process.reflection!.text : ''}`);
    // The spring's Carlotta run, closed on 12 May, is on stage beside it (from 2026-10-13: until then a closed run wasn't,
    // until the fall's casting filed its credit).
    expect(drawn(ward, ProfileWorkspace).shown).toContain(`On stage: ${wshow.role} in ${wshow.play}, Yale Summer Cabaret 2027, 2027; `);
    // And the Rep’s Seagull, closed on 27 March, where she went on once as Nina, is after it (from 2026-10-14: until then
    // an understudy’s run was never closed, and this test asserted the Carlotta run as the last on stage).
    expect(drawn(ward, ProfileWorkspace).shown).toMatch(/ in Carlotta Festival Of New Plays, 2027; Nina in The Seagull, 2027\./);

    // Kept through a save; credited once.
    const back = reload(ward);
    play(back, back.now + MS_DAY);
    expect(back.player.school!.credits).toEqual(s.credits);
    expect(titled(back, `The Director’s Note: ${wshow.play}`)).toHaveLength(1);
  }, 60_000);

  it('PLAYER JOURNEY: the first show’s closing missed away in New York after three nights: let go, and credited with the three and the run closed with its note and look back, as the Cabaret’s and a School production’s are', () => {
    const sim = working(life('g22-summer'));
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const closing = pending(sim, SUMMER_KIND).find((c) => c.payload.call === 'performance' && c.payload.run === 0 && c.payload.last === true)!;
    expect(closing.at).toBe(at(2027, 6, 27, 20));
    play(sim, closing.at - 60_000);
    const school = sim.player.school!;
    expect(school.summer!.played[0]).toBe(3);
    // TEST SETUP: in New York at the closing's curtain.
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(closing.at + 60_000);
    sim.player.currentLocationId = NEW_HAVEN;
    const show = school.summer!.shows![0]! as NonNullable<NonNullable<typeof school.summer>['shows']>[number] & { closed?: number; note?: string };
    // Unexcused: the company lets the student go, and the night is in the record as missed.
    expect(closing.status).toBe('missed');
    expect(school.summer!.out).toBe(true);
    expect(school.runs!.find((r) => r.source === 'summer')).toMatchObject({ nights: 4, missed: 1 });
    // The three nights played are on the résumé all the same, and the run is closed at its last night with its note and
    // its look back: the review's todo, closeRun's own "played or not", the Cabaret's missed closing and keepCredit's.
    expect(school.credits).toEqual([{ production: `${show.play}, Yale Summer Cabaret 2027`, role: show.role, kind: 'summer', year: 2027, wentOn: 3 }]);
    expect(show.closed).toBe(closing.at);
    expect(show.note).toMatch(noteFor(show.nights!));
    expect(hasProcess(show) ? show.process.reflection?.text : undefined).toMatch(new RegExp(`^${escape(show.play!)}: `));
  }, 60_000);

  it('PLAYER JOURNEY: a performance missed away from New Haven: out of the company, the stipend stopped at the hours worked, the night noted missed in the record of runs, and the fall’s casting reads it at nothing delivered', () => {
    const sim = working(life('g22-summer-out'));
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const first = pending(sim, SUMMER_KIND).find((c) => c.payload.call === 'performance')!;
    expect(first.at).toBe(at(2027, 6, 25, 20));
    play(sim, first.at - 60_000);
    // TEST SETUP: in New York at the curtain.
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(first.at + 60_000);
    sim.player.currentLocationId = NEW_HAVEN;
    const school = sim.player.school!;
    const show = school.summer!.shows![0]!;
    expect(first.status).toBe('missed');
    expect(school.summer!.out).toBe(true);
    expect(pending(sim, SUMMER_KIND)).toHaveLength(0);
    // The stipend stops: Friday 2 July's alone is left, for the three hours of its week worked before the curtain was
    // missed (Friday at five to eight of the 168 the week pays).
    const left = pending(sim, STIPEND_KIND);
    expect(left.map((i) => i.at)).toEqual([at(2027, 7, 2, 17)]);
    expect(left[0]!.payload.share).toBeCloseTo(3 / 168, 12);
    expect(titled(sim, 'Out Of The Summer Cabaret')).toHaveLength(1);
    expect(school.runs!.find((r) => r.source === 'summer')).toMatchObject({ production: 'Yale Summer Cabaret 2027, Show 1', play: show.play, nights: 1, missed: 1, delivered: 0 });
    expect((school.credits ?? []).filter((c) => c.kind === 'summer')).toEqual([]);
    expect(drawn(sim, SchoolWorkspace, 'casting').shown).toContain('The company let you go');

    // The fall's casting reads the run: one night, delivered at nothing, weighted half a School night's.
    play(sim, at(2027, 9, 1, 12));
    expect(school.runs!.find((r) => r.source === 'summer')!.readAtCasting).toBe(2);
    expect(school.lastWork!.from).toContainEqual({ what: show.play, source: 'summer', nights: 1, delivery: 0, weight: 0.5 });
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

describe('school.stipend', () => {
  /** A life in the summer company, played to the first Friday's stipend, the minute before it's paid. */
  const toFirstFriday = (seed: string, born?: string) => {
    const sim = working(life(seed, born));
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const pay = pending(sim, STIPEND_KIND);
    // Every Friday at five from 4 June, the first rehearsal week, to 27 August, the week after the closing: thirteen.
    const fridays: [number, number][] = [[6, 4], [6, 11], [6, 18], [6, 25], [7, 2], [7, 9], [7, 16], [7, 23], [7, 30], [8, 6], [8, 13], [8, 20], [8, 27]];
    expect(pay.map((i) => i.at)).toEqual(fridays.map(([m, d]) => at(2027, m, d, 17)));
    play(sim, pay[0]!.at - 60_000);
    return { sim, first: pay[0]! };
  };
  const stipends = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Yale Summer Cabaret stipend, the week');
  const accounts = (sim: Simulation) => ({ wages: sim.nominalAccount('income', 'Wages').id, withheld: sim.nominalAccount('expense', 'Tax Withheld').id });

  it('PLAYER JOURNEY: the first Friday’s $375, paid by the clock, withholds FICA’s 7.65% ($28.69) and nothing else, into the account and the year’s wages, once through a save', () => {
    const { sim, first } = toFirstFriday('g22-stipend');
    const y = yearOf(sim.player, 2027);
    expect(y.acting).toBe(0);
    expect(y.withheld).toBe(0);
    sim.advanceTo(first.at + 60_000);
    const [tx, ...more] = stipends(sim);
    expect(more).toEqual([]);
    const { wages, withheld } = accounts(sim);
    // $375 less 6.2% and 1.45% of it, $28.6875 to the cent; no federal income tax under the standard deduction, and
    // none of Connecticut's under its $15,000 exemption.
    expect(tx!.at).toBe(first.at);
    expect(tx!.postings.find((x) => x.accountId === wages)!.amount).toBe(-375_00);
    expect(tx!.postings.find((x) => x.accountId === withheld)!.amount).toBe(28_69);
    expect(tx!.postings.filter((x) => x.accountId !== wages && x.accountId !== withheld).map((x) => x.amount)).toEqual([346_31]);
    expect(y).toMatchObject({ acting: 375_00, withheld: 28_69, withheldBy: { us: 28_69 } });
    expect(y.withheldBy!['us-ct']).toBeUndefined();
    expect(y.employers['yale-summer-cabaret']).toBe(375_00);
    // Kept through a save, and paid once.
    const back = reload(sim);
    back.advanceTo(back.now + 6 * MS_HOUR);
    expect(stipends(back)).toHaveLength(1);
    expect(yearOf(back.player, 2027)).toMatchObject({ acting: 375_00, withheld: 28_69 });
  }, 60_000);

  it('PLAYER JOURNEY: with $40,000 of wages earlier in the year the first stipend withholds $129.38, Connecticut’s $55.69 kept as Connecticut’s, and the next February’s return reads every week the clock paid and withheld', () => {
    const { sim, first } = toFirstFriday('g22-stipend-wages');
    // TEST SETUP: $40,000 of wages from a job earlier in 2027, recorded as a job's pay is.
    recordWages(sim.player, at(2027, 1, 15, 12), zone, { gross: 40_000_00, employer: 'an earlier job' });
    sim.advanceTo(first.at + 60_000);
    const { wages, withheld } = accounts(sim);
    const [tx] = stipends(sim);
    // At $40,000 to $40,375: the IRS's 12% bracket, $45.00; FICA's 7.65%, $28.69; Connecticut's exemption cut from
    // $5,000 to $4,000 ($1,000 for each $1,000 past $30,000), so $1,375 more taxed at 4.5% on a tax of 2% to $10,000,
    // less its 10% credit: $1,192.50 to $1,248.19, $55.69.
    expect(tx!.postings.find((x) => x.accountId === withheld)!.amount).toBe(45_00 + 28_69 + 55_69);
    expect(tx!.postings.filter((x) => x.accountId !== wages && x.accountId !== withheld).map((x) => x.amount)).toEqual([375_00 - 129_38]);
    expect(yearOf(sim.player, 2027)).toMatchObject({ acting: 40_375_00, withheld: 129_38, withheldBy: { us: 73_69, 'us-ct': 55_69 } });

    // The return made on 1 February 2028, on what the clock paid and withheld all summer.
    play(sim, at(2028, 2, 1, 10));
    const paid = stipends(sim);
    expect(paid).toHaveLength(13);
    const kept = paid.reduce((sum, t) => sum + (t.postings.find((x) => x.accountId === withheld)?.amount ?? 0), 0);
    const figures = returnsOf(sim.player)['2027']!.figures;
    expect(figures.form).toBeUndefined();
    expect(figures.acting).toBe(40_000_00 + 13 * 375_00);
    expect(figures.withheld).toBe(kept);
    // FICA on the year's wages, $44,875 at 7.65%.
    expect(figures.payroll).toBe(Math.round(0.0765 * 44_875_00));
  }, 60_000);

  it('PLAYER JOURNEY: an F-1 student’s stipend bears no FICA, the IRS’s 10% of $375 ($37.50) withheld where a resident’s withholds FICA’s $28.69, and the 1040-NR reads the summer’s wages at 10% with no payroll tax', () => {
    const { sim, first } = toFirstFriday('g22-stipend', 'uk-eng-london');
    sim.advanceTo(first.at + 60_000);
    const { wages, withheld } = accounts(sim);
    const [tx] = stipends(sim);
    // Withheld as the 1040-NR taxes it, from the first dollar: the standard deduction added back to the wages, as Pub
    // 15-T has an employer do for a nonresident alien. Until 2026-10-13 this held nothing withheld, the stipend worked on
    // a resident’s standard deduction (tests/evidence2-b08.test.ts, school.stipend).
    expect(tx!.postings.find((x) => x.accountId === withheld)!.amount).toBe(37_50);
    expect(tx!.postings.find((x) => x.accountId === wages)!.amount).toBe(-375_00);
    expect(tx!.postings.filter((x) => x.accountId !== wages && x.accountId !== withheld).map((x) => x.amount)).toEqual([337_50]);
    expect(yearOf(sim.player, 2027)).toMatchObject({ acting: 375_00, withheld: 37_50 });

    play(sim, at(2028, 2, 1, 10));
    expect(stipends(sim)).toHaveLength(13);
    const figures = returnsOf(sim.player)['2027']!.figures;
    expect(figures.form).toBe('1040-NR');
    expect(figures.acting).toBe(13 * 375_00);
    expect(figures.payroll).toBe(0);
    expect(figures.withheld).toBe(13 * 37_50);
    // No standard deduction on a 1040-NR: the wages and work-study taxed from the first dollar, at 10%.
    expect(figures.income).toBe(figures.acting + figures.workStudy);
    expect(figures.federal).toBe(Math.round(0.1 * figures.income));
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

describe('school.orientation (kind)', () => {
  const session = (sim: Simulation, task: string) => sim.universe.scheduled.find((i) => i.kind === ORIENTATION_KIND && i.payload.task === task)!;

  it('PLAYER JOURNEY: Meeting Your Class missed in New York: no classmate met and a partner refused in its words until it’s caught up; a twin there met all fifteen', () => {
    const sim = life('g22-orient-class');
    const meet = session(sim, 'classmates');
    expect(meet.at).toBe(at(2026, 8, 25, 10));
    play(sim, meet.at - 60_000);
    const there = twinOf(serialise(sim.universe));
    // TEST SETUP: in New York for the session.
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(meet.at + 60_000);
    sim.player.currentLocationId = NEW_HAVEN;
    expect(meet.status).toBe('missed');
    expect(sim.player.school!.classmates.filter((m) => mateRecord(m).met !== undefined)).toEqual([]);
    expect(titled(sim, 'Meeting Your Class')).toEqual([]);
    there.advanceTo(meet.at + 60_000);
    expect(itemIn(there, meet.id).status).toBe('done');
    expect(there.player.school!.classmates.map((m) => mateRecord(m).met)).toEqual(Array.from({ length: 15 }, () => meet.at));
    expect(titled(there, 'Meeting Your Class').map((n) => n.body)).toEqual(['You met the 15 others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.']);

    play(sim, at(2026, 8, 28, 14));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.course === 'DRAM 103a/b')!;
    const first = sim.player.school!.classmates[a.partner!]!.name.split(' ')[0];
    expect(sim.execute({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(2026, 8, 29, 19) } }).error).toBe(`You haven’t met ${first} yet: you’ll meet the class at orientation, or at the first class.`);
    expect(pressable(drawn(sim, SchoolWorkspace, 'coursework').html, 'Catch Up')).toHaveLength(1);
    // Caught up by command: the session's three hours, and every classmate met.
    const t0 = sim.now;
    expect(sim.must<{ told: string }>({ kind: 'school.orientation', payload: { task: 'classmates' } }).told).toBe('You met the 15 others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.');
    expect(sim.now - t0).toBe(180 * 60_000);
    expect(sim.player.school!.classmates.map((m) => mateRecord(m).met)).toEqual(Array.from({ length: 15 }, () => sim.now));
    expect(sim.must<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(2026, 8, 29, 19) } }).accepted).toBe(true);
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'classmates' } }).error).toBe('Done on August 28, 2026.');
    const back = reload(sim);
    expect(back.player.school!.classmates.every((m) => mateRecord(m).met !== undefined)).toBe(true);
  }, 60_000);

  it('PLAYER JOURNEY: The Courses And What They Ask sets the eight first-year fall courses their first work for Sunday 30 August; missed in hospital, none until Monday’s first classes, or a catch-up', () => {
    const sim = life('g22-orient-work');
    const ex = session(sim, 'expectations');
    expect(ex.at).toBe(at(2026, 8, 28, 10));
    play(sim, ex.at - 60_000);
    const snap = serialise(sim.universe);
    const FALL = ['DRAM 103a/b', 'DRAM 113a/b', 'DRAM 123a/b', 'DRAM 133a/b', 'DRAM 143a/b', 'DRAM 153a', 'DRAM 403a/b', 'DRAM 873a/b'];
    const set = (s: Simulation) => courseworkOf(s, s.player)!.assignments.map((x) => [x.course, x.setOn]);

    sim.advanceTo(ex.at + 151 * 60_000);
    expect(ex.status).toBe('done');
    expect(set(sim)).toEqual(FALL.map((c) => [c, '2026-08-30']));
    expect(titled(sim, 'The Courses And What They Ask').map((n) => n.body)).toEqual(['Each course set out what it asks. 8 courses gave you their first work now, so you can start before classes.']);

    const ward = twinOf(snap);
    // TEST SETUP: in hospital over the session.
    healthOf(ward.player).inHospitalUntil = ex.at + 4 * MS_HOUR;
    const caught = twinOf(snap);
    healthOf(caught.player).inHospitalUntil = ex.at + 4 * MS_HOUR;
    ward.advanceTo(ex.at + 60_000);
    expect(itemIn(ward, ex.id).status).toBe('missed');
    play(ward, at(2026, 8, 30, 20));
    expect(set(ward)).toEqual([]);
    expect(courseworkOf(ward, ward.player)!.orientation.done.expectations).toBeUndefined();
    // Monday's classes set their own: Acting I, Speech And Accents I and the Alexander Technique, that day.
    play(ward, at(2026, 8, 31, 18));
    expect(set(ward)).toEqual([['DRAM 103a/b', '2026-08-31'], ['DRAM 123a/b', '2026-08-31'], ['DRAM 143a/b', '2026-08-31']]);
    // Caught up on Saturday instead: the eight, for Sunday, as the session gives them.
    play(caught, at(2026, 8, 29, 11));
    caught.must({ kind: 'school.orientation', payload: { task: 'expectations' } });
    expect(set(caught)).toEqual(FALL.map((c) => [c, '2026-08-30']));
  }, 60_000);

  it('PLAYER JOURNEY: the tour missed in hospital leaves the studios and the library refused in their words and grayed on the screen; caught up by command, both open, kept through a save', () => {
    const sim = life('g22-orient-tour');
    const tour = session(sim, 'tour');
    expect(tour.at).toBe(at(2026, 8, 27, 10));
    play(sim, tour.at - 60_000);
    // TEST SETUP: in hospital from the session's start for three hours.
    healthOf(sim.player).inHospitalUntil = tour.at + 3 * MS_HOUR;
    sim.advanceTo(tour.at + 60_000);
    expect(tour.status).toBe('missed');
    expect(courseworkOf(sim, sim.player)!.orientation.done.tour).toBeUndefined();
    expect(titled(sim, 'The Building, The Studios And The Library')).toEqual([]);
    play(sim, at(2026, 8, 28, 14));
    const work = courseworkOf(sim, sim.player)!.assignments;
    const movement = work.find((x) => x.course === 'DRAM 133a/b')!;
    const context = work.find((x) => x.course === 'DRAM 873a/b')!;
    const studios = 'You don’t know the building yet: the tour shows you the studios.';
    const library = 'You don’t know the library yet: the tour shows you it.';
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: movement.id, activity: 'devise' } }).error).toBe(studios);
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: context.id, activity: 'research' } }).error).toBe(library);
    expect(sim.execute({ kind: 'plays.read', payload: { playId: 'sweat' } }).error).toBe('The library isn’t known to you yet: the tour shows you it.');
    const before = drawn(sim, SchoolWorkspace, 'coursework');
    expect(grayed(before.html, 'Devise The Score', studios)).toHaveLength(1);
    expect(before.shown).toContain(studios);
    expect(pressable(before.html, 'Catch Up')).toHaveLength(1);

    const t0 = sim.now;
    expect(sim.must<{ told: string }>({ kind: 'school.orientation', payload: { task: 'tour' } }).told).toBe('You were shown the studios you can book to rehearse in, the theaters, and the Haas Family Arts Library.');
    expect(sim.now - t0).toBe(120 * 60_000);
    expect(courseworkOf(sim, sim.player)!.orientation.done.tour).toBe(sim.now);
    expect(sim.must<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: movement.id, activity: 'devise' } }).moved).toBeGreaterThan(0);
    const after = drawn(sim, SchoolWorkspace, 'coursework');
    expect(after.shown).not.toContain(studios);
    expect(after.shown).not.toContain(library);

    const back = reload(sim);
    expect(back.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toBe('Done on August 28, 2026.');
    // The library known: what refuses the research now is the work's own order, not the building.
    const ctx = courseworkOf(back, back.player)!.assignments.find((x) => x.id === context.id)!;
    expect(back.execute({ kind: 'school.prepare', payload: { assignmentId: ctx.id, activity: 'research' } }).error).toBe('Read the play first: research needs questions.');
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------

describe('school.partner_rehearsal', () => {
  /** A first-year after orientation, Friday 28 August at two, with Scene Study set and its partner met. */
  const partnered = (seed: string) => {
    const sim = life(seed);
    play(sim, at(2026, 8, 28, 14));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.course === 'DRAM 103a/b')!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    return { sim, a, mate, first: mate.name.split(' ')[0]! };
  };
  /** Asked by command for an evening, and played to the minute before it. */
  const booked = (sim: Simulation, a: Assignment, when: number) => {
    expect(sim.must<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: when } }).accepted).toBe(true);
    const r = a.rehearsals.find((x) => x.at === when)!;
    expect(pending(sim, 'school.partner_rehearsal').some((i) => i.payload.rehearsalId === r.id)).toBe(true);
    return r;
  };

  it('PLAYER JOURNEY: kept: trust 50 to 54, bond 0 to 2, the partner part 0.4 × 1.1, listening grown and kept, and the partner’s words, which change with what was prepared, on the Coursework tab', () => {
    const { sim, a, mate, first } = partnered('g22-partner-kept');
    // TEST SETUP: a partner who comes.
    mateRecord(mate).reliability = 1;
    const r = booked(sim, a, at(2026, 8, 29, 19));
    play(sim, at(2026, 8, 29, 14));
    const snap = serialise(sim.universe);
    play(sim, r.at - 60_000);
    rested(sim); // TEST SETUP: rested, focus held at its 1.1 for a partner's step.
    // TEST SETUP: listening at 50, where an evening goes exactly as far as its step says (`stepSpeed`, from 2026-10-16:
    // a partner's evening reads listening as it stands coming in).
    sim.player.attrs!.listening = 50;
    expect(trustOf(mate)).toBe(50);
    expect(mate.bond ?? 0).toBe(0);
    const listening = sim.player.attrs!.listening!;
    sim.advanceTo(r.at + 60_000);
    expect(r.status).toBe('kept');
    expect(trustOf(mate)).toBe(54);
    expect(mate.bond).toBe(2);
    expect(mateRecord(mate).kept).toBe(1);
    // The partner step's 0.4, at focus held to 1.1 for it, of all that was left.
    expect(a.prep.partner).toBeCloseTo(0.4 * 1.1, 12);
    expect(preparedParts(sim.player, a, a.dueOn).partner).toBeCloseTo(0.44, 12);
    const rise = sim.player.attrs!.listening! - listening;
    expect(rise).toBeGreaterThan(0);
    expect(developmentOf(sim.player).history.filter((x) => x.source === 'partner-rehearsal')).toEqual([{ at: r.at, id: 'listening', delta: round3(rise), source: 'partner-rehearsal' }]);
    // Nothing prepared but the evening: the scene not known is what holds it back.
    expect(r.said).toBe(`${first} thinks you don’t know the scene well enough yet to play it.`);
    const shown = drawn(sim, SchoolWorkspace, 'coursework').shown;
    expect(shown).toContain(`Rehearsed ${r.said} (Simulated: the game’s words.)`);
    expect(shown).toContain(`Trust 54 of 100 · Came to 1 of 1 agreed · Reliability 100%`);

    // The scene read first, by command, at the same evening: the lines are what holds it back now.
    const read = twinOf(snap);
    const ra = courseworkOf(read, read.player)!.assignments.find((x) => x.id === a.id)!;
    read.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    play(read, r.at + 60_000);
    expect(ra.rehearsals.find((x) => x.id === r.id)!.said).toBe(`${first} says you were on book most of the time, and they couldn’t catch your eye.`);

    // Kept through a save, and nothing added twice.
    const back = reload(sim);
    play(back, back.now + MS_DAY);
    const bm = back.player.school!.classmates[a.partner!]!;
    expect([trustOf(bm), bm.bond, mateRecord(bm).kept]).toEqual([54, 2, 1]);
  }, 60_000);

  it('PLAYER JOURNEY: the partner doesn’t come: trust and bond held, their notice and the screen saying so, and the apology the clock brings to class, accepted for 2', () => {
    const { sim, a, mate, first } = partnered('g22-partner-stood');
    // TEST SETUP: a partner who doesn't come.
    mateRecord(mate).reliability = 0;
    const r = booked(sim, a, at(2026, 8, 29, 19));
    play(sim, r.at + 60_000);
    expect(r.status).toBe('missedByThem');
    expect(mateRecord(mate).stoodUp).toBe(1);
    expect(trustOf(mate)).toBe(50);
    expect(mate.bond ?? 0).toBe(0);
    expect(a.prep.partner).toBe(0);
    expect(titled(sim, `${first} Didn’t Come`)).toHaveLength(1);
    expect(titled(sim, `${first} Didn’t Come`)[0]!.body).toMatch(new RegExp(`^You waited for ${first} to rehearse .+, and they didn’t come\\.$`));
    const shown = drawn(sim, SchoolWorkspace, 'coursework').shown;
    expect(shown).toContain(`${first} Didn’t Come`);
    expect(shown).toContain('Trust 50 of 100 · Came to 0 of 1 agreed · Reliability 0%');
    // In class, within the next two weeks, they apologize.
    const i = a.partner!;
    const apology = () => momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.kind === 'apology' && m.mate === i);
    while (!apology() && sim.now < at(2026, 9, 12)) play(sim, sim.now + 6 * MS_HOUR);
    const m = apology()!;
    expect(m).toBeDefined();
    expect(m.text).toMatch(new RegExp(`^${first} apologizes for not coming to rehearse: (something at home took the evening|they lost track of the day)\\.$`));
    expect(titled(sim, `${first}: An Apology`)).toHaveLength(1);
    expect(sim.must<{ done: string }>({ kind: 'school.respond', payload: { momentId: m.id, choice: 'accept' } }).done).toBe(`You told ${first} it’s fine.`);
    expect(mate.bond).toBe(2);
    expect(trustOf(mate)).toBe(50);
  }, 60_000);

  it('PLAYER JOURNEY: missed by you, away in New York: trust 50 to 38, bond 0 to −5, an incident kept, their notice and the screen saying so', () => {
    const { sim, a, mate, first } = partnered('g22-partner-missed');
    const r = booked(sim, a, at(2026, 8, 29, 19));
    play(sim, r.at - 60_000);
    // TEST SETUP: in New York for the evening.
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(r.at + 60_000);
    sim.player.currentLocationId = NEW_HAVEN;
    expect(r.status).toBe('missedByYou');
    expect(trustOf(mate)).toBe(38);
    expect(mate.bond).toBe(-5);
    expect(mateRecord(mate).missedByYou).toBe(1);
    expect(personOf(mate).incidents).toEqual([{ at: r.at, kind: 'missed' }]);
    expect(titled(sim, `${first} Waited For You`)).toHaveLength(1);
    const shown = drawn(sim, SchoolWorkspace, 'coursework').shown;
    expect(shown).toContain('You Didn’t Come');
    expect(shown).toContain('Trust 38 of 100 · Came to 0 of 0 agreed · You missed 1');
  }, 60_000);

  it('PLAYER JOURNEY: a sprained ankle excuses the intimacy practice, on its feet in a studio, trust held and the partner told; the scene study, a partner’s work alone, is kept', () => {
    const { sim, a, mate } = partnered('g22-partner-sprain');
    const work = courseworkOf(sim, sim.player)!.assignments;
    const intimacy = work.find((x) => x.course === 'DRAM 403a/b')!;
    const other = sim.player.school!.classmates[intimacy.partner!]!;
    // Its boundaries agreed first, by command, as the step asks: twice, the first not enough.
    sim.must({ kind: 'school.prepare', payload: { assignmentId: intimacy.id, activity: 'protocol' } });
    expect(intimacy.prep.familiarity).toBeLessThan(0.5);
    sim.must({ kind: 'school.prepare', payload: { assignmentId: intimacy.id, activity: 'protocol' } });
    expect(intimacy.prep.familiarity).toBeGreaterThanOrEqual(0.5);
    // TEST SETUP: partners who come.
    mateRecord(mate).reliability = 1;
    mateRecord(other).reliability = 1;
    const kept = booked(sim, a, at(2026, 8, 29, 19));
    const off = booked(sim, intimacy, at(2026, 8, 30, 19));
    play(sim, kept.at - 60_000);
    // TEST SETUP: a sprained ankle, eight days to mend, which stops training and keeps nobody off work.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 8 * MS_DAY };
    play(sim, off.at + 60_000);
    expect(kept.status).toBe('kept');
    expect(off.status).toBe('excused');
    expect(trustOf(other)).toBe(50);
    expect(other.bond ?? 0).toBe(0);
    expect(intimacy.prep.partner).toBe(0);
    const first = other.name.split(' ')[0]!;
    expect(titled(sim, `${first} Knows You’re Ill`).map((n) => n.body)).toEqual(['The rehearsal you booked is off, and they don’t hold it against you.']);
    expect(mateRecord(other).log![0]!.what).toBe('You were ill and couldn’t rehearse Consent And Intimacy Practice');
    expect(drawn(sim, SchoolWorkspace, 'coursework').shown).toContain('You Were Ill');
  }, 60_000);

  it('PLAYER JOURNEY: the partner way at the lines, chosen by command on a note given three times, works the lines by 0.2 of what’s left at the next evening kept, once; without it, the evening leaves them', () => {
    const { sim, a, mate } = partnered('g22-partner-way');
    // The scene read and some lines learned, by command.
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'learn' } });
    const lines = a.prep.memorization;
    expect(lines).toBeGreaterThan(0);
    // TEST SETUP: the lines noted three times, as three showings note them, and a partner who comes.
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    for (let i = 0; i < 3; i += 1) recordNote(notes, { kind: 'dim', dim: 'memorization' }, `2026-08-2${i + 5}`, `earlier-${i}`, 'Acting I', 0.2);
    mateRecord(mate).reliability = 1;
    const one = booked(sim, a, at(2026, 8, 29, 19));
    const two = booked(sim, a, at(2026, 8, 30, 19));
    const plain = twinOf(serialise(sim.universe));
    expect(sim.must<{ dim: string }>({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'partner' } }).dim).toBe('memorization');
    play(sim, one.at + 60_000);
    expect(one.status).toBe('kept');
    expect(a.prep.memorization).toBeCloseTo(lines + 0.2 * (1 - lines), 12);
    expect(a.partnerWorked).toBe(true);
    const once = a.prep.memorization;
    play(sim, two.at + 60_000);
    expect(two.status).toBe('kept');
    expect(a.prep.memorization).toBe(once);
    // The same evenings without the way chosen: the lines where they were.
    const pa = courseworkOf(plain, plain.player)!.assignments.find((x) => x.id === a.id)!;
    play(plain, two.at + 60_000);
    expect(pa.rehearsals.map((x) => x.status)).toEqual(['kept', 'kept']);
    expect(pa.prep.memorization).toBe(lines);
    expect(pa.partnerWorked).toBeUndefined();
  }, 60_000);
});
