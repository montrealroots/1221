/**
 * The school's seven rows the review of 2026-10-13 left partial, closed where play reaches them (evidence group 23).
 * Each describe is a row, by its id in docs/verification/audit/school.json.
 *
 * - school.study_session: until now an invitation was made by hand, kept, and checked as "not missed". Here the class
 *   brings it, and it's kept (the shared scene's lines a fifth of what was left, trust 2, bond 2, once, through a
 *   reload, read by the scene's showing), missed in New York or asleep (trust 6 and bond 3 down, the incident, "Waited
 *   For You", and a second evening missed lets the class bring a boundary), excused in hospital or laid up, and drawn on
 *   the School screen.
 * - abilities+techniques: the history under a source rested on a direct `grewFrom` call. Here a lab, the Cabaret's and
 *   the spring festival's rehearsal calls and nights, played by the clock, and a coursework step, by command, keep each
 *   rise under its source, summing to what the craft moved; an ability practised by command lifts the dimension that
 *   reads it in the next showing judged; and a played night replayed with the skills kept as abilities added to its
 *   reads comes out the same (they count once).
 * - development ledger: the Profile's history is rendered after each kind of change, the bound of 400 is played past,
 *   and a rehearsal call's words are held, the festival's and the Cabaret's. The Cabaret’s failed when written, on a
 *   defect (see its comment), until it was fixed on 2026-10-13.
 * - work records + journey: the Cabaret run's milestone, its note's named skill worked out from the nights kept, What To
 *   Work On from the played work, the strengths read by the rule (and its edge, 4 over the mean against 3.9), Range,
 *   work together counted, and direction counted from the festival's notes.
 * - genre familiarity/practice: a genre studied makes a scene's step and a part's lines move further, by the
 *   familiarity it left; a night of a play practises each of its kinds.
 * - genre demands: what the review found stands. No brief, play or scene gains a technique from a demand at run time:
 *   every brief stages what its genres demand, and every play and scene has a material profile. These tests hold that
 *   (a future brief that misses a demand fails them) and the one place a demand shows, the Genres panel's It Asks For.
 * - classmates abilities/craft: a class meeting grows the listening and focus of each classmate in the room and of
 *   none away; the class's Cabaret grows its members' composure; the Cabaret's company casts by fit; a partner's
 *   listening and focus are their timing in the scene together; and the term's class median is the middle classmate's.
 *
 * PLAYER JOURNEY: the life a new player lives (Ada Cole, born in New York, a first-year at Yale in New Haven), played by
 * the clock and the commands. `newLifeConfig` names no birthplace, which `createSave` requires, so New York is given, as
 * the other school tests give it; `personalityTraits: []` is the default spelled out, so a bond moves by the rule's own
 * figure (`bondMove`'s warmth and wound are 1 with no trait). TEST SETUP: the day kept rested (`tended`); and where a
 * test says so, a precondition set by hand: the player in New York, in hospital, laid up or asleep for an evening (this
 * build has no travel command, and nothing admits, injures or puts a player to sleep on cue), classmates' craft and
 * abilities for a casting, a partner's abilities, the same rested day for twins, and a strength's edge on the work
 * kept. The action and its readers always run through the engine. A FIXTURE on a played record says so where it is one.
 * Screens are rendered with react-dom/server, as tests/rehearsal-notes-history.test.ts renders them.
 */
import { trainingForecast } from '@/engine/systems/advice';
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { STUDY_KIND, momentsOf, personOf, sharedWork, type Moment } from '@/engine/systems/classmates';
import { courseworkOf, trustOf, type Assignment } from '@/engine/systems/coursework';
import { SCENES, sceneById } from '@/engine/content/coursework';
import { CABARET_KIND, CALL_KIND, CLASSES_KIND, COMPANY_KIND, EVALUATION_KIND, LAB_KIND, castingReads, classmatesIn, coursesFor, evenCraft, mateAbilities } from '@/engine/systems/school';
import { developmentOf, levelOf } from '@/engine/systems/attributes';
import { EXERCISES } from '@/engine/content/practice';
import { journeyOf, replay, type WorkRecord } from '@/engine/systems/evaluation';
import { DIMENSION_LABEL, TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { ABILITY_DEFS, ABILITY_KIN, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS, genresOfPlay } from '@/engine/content/plays';
import { processOf } from '@/engine/systems/production';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { tapeReadsOf } from '@/engine/systems/briefs';
import { DEMAND_TECHNIQUE, genreTags } from '@/engine/content/demands';
import { materialOf } from '@/engine/systems/material';
import { healthOf } from '@/engine/systems/health';
import { startRefusal } from '@/engine/systems/life';
import type { Skill } from '@/engine/content/school';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// The School screen at its Casting tab: the store a tab is kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? 'casting' : initial) as T, () => undefined] as const };
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

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { ClassMoments } = await import('@/ui/components/ClassMoments');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
type Looked = import('@/ui/looks/registry').Looked;

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const config = () => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [] as string[] });
const student = (seed: string) => createSave(1, seed, config());
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** TEST SETUP: played by somebody who looks after themselves, rested and awake through the evening. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** The player waits, rested, for the first quarter-hour with nothing on their calendar for so many minutes, as a player picks a free afternoon. */
const freeFor = (sim: Simulation, minutes: number) => { while (startRefusal(sim, sim.player, minutes)) tended(sim, sim.now + 15 * 60_000); };
/** A screen's words as the player reads them: the markup without its tags and tooltips. */
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const shown = (sim: Simulation, screen: FunctionComponent) => { h.sim = sim; return words(renderToStaticMarkup(createElement(screen))); };
const r1 = (x: number) => Math.round(x * 10) / 10;

/** A played save kept once and loaded fresh for each test that starts from it, so no test sees another's moves. */
const keptSaves = new Map<string, string>();
function from(key: string, play: () => Simulation): Simulation {
  if (!keptSaves.has(key)) keptSaves.set(key, serialise(play().universe));
  return loadSave(deserialise(keptSaves.get(key)!) as never);
}
/** The first fall, the afternoon of the second day of classes, a Cabaret show joined (`school.cabaret`). */
const fall = () => from('fall', () => {
  const sim = student('g23-probe');
  tended(sim, at(2026, 9, 2, 16));
  sim.must({ kind: 'school.cabaret', payload: {} });
  return sim;
});
/** The same, played through the Cabaret show's closing night. */
const afterCabaret = () => from('after-cabaret', () => { const sim = fall(); tended(sim, at(2026, 9, 27, 2)); return sim; });

/** Plays a quarter-day at a time until the class has brought a moment that's open and matches, by a date. */
function untilOpen(sim: Simulation, match: (m: Moment) => boolean, by: number): Moment {
  const find = () => momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.status === 'open' && match(m));
  while (!find() && sim.now < by) tended(sim, Math.min(by, sim.now + 6 * MS_HOUR));
  const m = find();
  expect(m, 'the class brought it in time').toBeDefined();
  return m!;
}
/** The first fall, an hour before the first evening of running lines the class asked for and the player said yes to. */
const studyEve = () => from('study-eve', () => {
  const sim = student('g23-probe');
  const m = untilOpen(sim, (x) => x.kind === 'study', at(2026, 10, 1));
  sim.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } });
  tended(sim, m.when! - MS_HOUR);
  return sim;
});
const booked = (sim: Simulation) => sim.universe.scheduled.find((i) => i.kind === STUDY_KIND && i.status === 'pending')!;
/** The first spring, the festival cast, before its first rehearsal call. */
const spring = () => from('spring', () => { const sim = student('g23-probe'); tended(sim, at(2027, 1, 25, 8)); return sim; });
/** The School production's calls ahead (not the Rep's), soonest first. */
const schoolCalls = (sim: Simulation, call: string) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.which !== 'rep' && i.payload.call === call).sort((a, b) => a.at - b.at);
const assignment = (sim: Simulation, id: string): Assignment => courseworkOf(sim, sim.player)!.assignments.find((a) => a.id === id)!;
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

// ---------------------------------------------------------------------------------------------------------------------

describe('school.study_session', () => {
  it('PLAYER JOURNEY: an invitation the class brought, said yes to and kept, moves the shared scene’s lines a fifth of what was left, trust 2 and bond 2, once through a reload, and the scene’s showing reads those lines', () => {
    // Seed s11: the first invitation from a classmate you share an open scene with comes on 10 November.
    let sim = student('s11');
    const m = untilOpen(sim, (x) => x.kind === 'study' && sharedWork(sim, sim.player, x.mate).length > 0, at(2026, 12, 1));
    const mateOf = () => sim.player.school!.classmates[m.mate]!;
    const first = mateOf().name.split(' ')[0]!;
    // The least secure scene shared with them, which is what runs when none is named.
    const scene = sharedWork(sim, sim.player, m.mate)[0]!;
    const play = sceneById(scene.sceneId!)!.play;
    expect(sim.must<{ done: string }>({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } }).done).toBe(`It’s on your calendar: ${play}, with ${first}.`);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: 'no' } }).error).toBe('You’ve answered it.');
    sim = reload(sim);
    tended(sim, m.when! - 60_000);
    const lines = assignment(sim, scene.id).prep.memorization;
    const trust = trustOf(mateOf());
    const bond = mateOf().bond ?? 0;
    tended(sim, m.when! + 2 * MS_HOUR);
    const item = sim.universe.scheduled.find((i) => i.kind === STUDY_KIND && i.payload.momentId === m.id)!;
    expect(item.status).toBe('done');
    // A fifth of what was left (`CLASS.study.memorization` 0.2), as a step of learning lines would move it.
    const after = assignment(sim, scene.id).prep.memorization;
    expect(after).toBeCloseTo(lines + 0.2 * (1 - lines), 12);
    expect(trustOf(mateOf())).toBe(trust + 2);
    expect(mateOf().bond).toBe(bond + 2);
    expect(personOf(mateOf()).log![0]!.what).toBe('Ran lines with you');
    expect(notices(sim, `Ran Lines With ${first}`).map((n) => n.body)).toEqual([`Your lines for ${play} went from ${Math.round(lines * 100)}% to ${Math.round(after * 100)}%.`]);
    // Once: a reload and a night on, nothing is run again.
    sim = reload(sim);
    tended(sim, sim.now + 12 * MS_HOUR);
    expect(sim.universe.scheduled.filter((i) => i.kind === STUDY_KIND && i.payload.momentId === m.id)).toHaveLength(1);
    expect(notices(sim, `Ran Lines With ${first}`)).toHaveLength(1);
    // The showing's preparation: the scene shown in class is judged with the lines the evening left.
    const shownBy = at(2026, 12, 12);
    while (!assignment(sim, scene.id).shown && sim.now < shownBy) tended(sim, sim.now + 6 * MS_HOUR);
    const a = assignment(sim, scene.id);
    expect(a.shown, 'the scene was shown in class').toBeDefined();
    const record = (sim.player.work ?? []).find((w) => w.at === a.shown!.at && w.task === 'scene')!;
    expect(record.inputs.prep.memorization).toBeCloseTo(after, 12);
  });

  it('PLAYER JOURNEY: said yes and in New York that evening, it’s missed: trust 6 and bond 3 down, an incident to make right, and “Waited For You”; a second such evening lets the class bring a boundary', () => {
    let sim = student('g23-probe');
    const m = untilOpen(sim, (x) => x.kind === 'study', at(2026, 10, 1));
    const i = m.mate;
    const mateOf = () => sim.player.school!.classmates[i]!;
    const first = mateOf().name.split(' ')[0]!;
    const away = (when: number) => {
      tended(sim, when - MS_HOUR);
      // TEST SETUP: in New York for the evening, by hand: this build has no travel command.
      sim.player.currentLocationId = 'us-ny-newyork';
      sim.advanceTo(when + 2 * MS_HOUR);
      // TEST SETUP: and back in New Haven.
      sim.player.currentLocationId = 'us-ct-newhaven';
    };
    sim.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } });
    tended(sim, m.when! - MS_HOUR);
    const trust = trustOf(mateOf());
    const bond = mateOf().bond ?? 0;
    away(m.when!);
    expect(sim.universe.scheduled.find((x) => x.kind === STUDY_KIND && x.payload.momentId === m.id)!.status).toBe('missed');
    expect(trustOf(mateOf())).toBe(trust - 6);
    expect(mateOf().bond).toBe(bond - 3);
    expect(personOf(mateOf()).incidents).toEqual([{ at: m.when, kind: 'missed' }]);
    expect(personOf(mateOf()).log![0]!.what).toBe('You didn’t come to run lines');
    expect(notices(sim, `${first} Waited For You`).map((n) => n.body)).toEqual([`You didn’t come to run lines, and ${first} waited for you. It cost some of their trust, and they’ll remember it. You can make amends under Your Partners.`]);
    // Kept through a reload, and one incident is not a boundary: none comes before the second evening missed.
    sim = reload(sim);
    expect(personOf(mateOf()).incidents).toHaveLength(1);
    const again = untilOpen(sim, (x) => x.kind === 'study' && x.mate === i, at(2026, 12, 15));
    expect(momentsOf(courseworkOf(sim, sim.player)!).some((x) => x.kind === 'boundary' && x.mate === i)).toBe(false);
    sim.must({ kind: 'school.respond', payload: { momentId: again.id, choice: 'yes' } });
    away(again.when!);
    expect(personOf(mateOf()).incidents!.map((x) => x.kind)).toEqual(['missed', 'missed']);
    const b = untilOpen(sim, (x) => x.kind === 'boundary' && x.mate === i, at(2026, 12, 20));
    // In their voice and with what happened, counted (from 2026-10-20, brief 17: until then "after the last few times").
    expect(b.text).toBe(`${first} says the scene can’t keep losing evenings. After you didn’t come twice, they’ll rehearse with you only if you ask a day ahead.`);
    const before = trustOf(mateOf());
    sim.must({ kind: 'school.respond', payload: { momentId: b.id, choice: 'respect' } });
    expect(personOf(mateOf()).boundary).toMatchObject({ keptSince: 0, accepted: true });
    expect(trustOf(mateOf())).toBe(before + 2);
  });

  it('in hospital or laid up that evening, it’s excused: missed, with trust, bond and incidents as they were and no “Waited For You”', () => {
    const excused = (why: (sim: Simulation) => void) => {
      const sim = studyEve();
      const item = booked(sim);
      const mate = sim.player.school!.classmates[Number(item.payload.mate)]!;
      const [trust, bond] = [trustOf(mate), mate.bond ?? 0];
      why(sim);
      sim.advanceTo(item.at + 2 * MS_HOUR);
      expect(sim.universe.scheduled.find((x) => x.id === item.id)!.status).toBe('missed');
      expect(trustOf(mate)).toBe(trust);
      expect(mate.bond ?? 0).toBe(bond);
      expect(personOf(mate).incidents ?? []).toEqual([]);
      expect(personOf(mate).log![0]!.what).toBe('You were ill and couldn’t run lines');
      expect(notices(sim, `${mate.name.split(' ')[0]} Waited For You`)).toHaveLength(0);
    };
    // TEST SETUP: admitted for the evening, by hand: nothing admits a player on cue.
    excused((sim) => { healthOf(sim.player).inHospitalUntil = booked(sim).at + 3 * MS_HOUR; });
    // TEST SETUP: a broken bone keeping them off work, by hand: nothing injures a player on cue.
    excused((sim) => { healthOf(sim.player).injury = { kind: 'fracture', at: sim.now, until: sim.now + 60 * MS_DAY, offWorkUntil: sim.now + 40 * MS_DAY }; });
  });

  it('asleep through that evening, it’s missed as being away is: trust 6 and bond 3 down, and an incident', () => {
    const sim = studyEve();
    const item = booked(sim);
    const mate = sim.player.school!.classmates[Number(item.payload.mate)]!;
    const [trust, bond] = [trustOf(mate), mate.bond ?? 0];
    // TEST SETUP: asleep until an hour after it began, by hand: the clock has nobody nap on cue.
    sim.player.awakeSince = item.at + MS_HOUR;
    sim.advanceTo(item.at + 2 * MS_HOUR);
    expect(sim.universe.scheduled.find((x) => x.id === item.id)!.status).toBe('missed');
    expect(trustOf(mate)).toBe(trust - 6);
    expect(mate.bond).toBe(bond - 3);
    expect(personOf(mate).incidents).toEqual([{ at: item.at, kind: 'missed' }]);
  });

  it('on the School screen, as the player has it: the invitation in its words with Say Yes and Say No and the scene it would run, then the answer given', () => {
    const sim = student('s11');
    const m = untilOpen(sim, (x) => x.kind === 'study' && sharedWork(sim, sim.player, x.mate).length > 0, at(2026, 12, 1));
    const mate = sim.player.school!.classmates[m.mate]!;
    const shared = sharedWork(sim, sim.player, m.mate);
    const text = shown(sim, ClassMoments);
    expect(text).toContain(`${mate.name}: Run Lines Together?. ${m.text}`);
    expect(text).toContain('Say Yes');
    expect(text).toContain('Say No');
    // One scene shared is named; more are offered to choose from.
    expect(text).toContain(shared.length === 1 ? `You’d run ${sceneById(shared[0]!.sceneId!)!.play}, the scene you share.` : 'Which Scene You Share');
    sim.must({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } });
    const after = shown(sim, ClassMoments);
    expect(after).toContain(`${mate.name}: Run Lines Together? · Say Yes`);
    expect(after).not.toContain(`${mate.name}: Run Lines Together?. ${m.text}`);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

/** What each craft skill is recorded under on the history: the ability it is, or itself. */
const TARGET: Partial<Record<Skill, string>> = { emotion: 'emotionalDepth', memorization: 'memory', voice: 'vocal', movement: 'physical' };
/** What the history kept since a moment: the entries that weren't there then (it keeps 400, so its length can't tell). */
const keptSince = (sim: Simulation) => {
  const was = new Set(developmentOf(sim.player).history);
  return () => developmentOf(sim.player).history.filter((x) => !was.has(x));
};
/** Plays across one scheduled item: the craft before and after, and what the history kept in that span. */
function across(sim: Simulation, when: number) {
  tended(sim, when - 60_000);
  const before = { ...sim.player.craft! };
  const kept = keptSince(sim);
  sim.advanceTo(when + 60_000);
  return { before, after: { ...sim.player.craft! }, kept: kept() };
}
/** Every craft skill's rise across the span, and what the history kept for it under a source. */
function risesUnder(span: ReturnType<typeof across>, source: string) {
  return (Object.keys(span.before) as Skill[]).map((k) => ({
    skill: k,
    rose: span.after[k] - span.before[k],
    kept: span.kept.filter((x) => x.source === source && x.id === (TARGET[k] ?? k)).reduce((s, x) => s + x.delta, 0),
  }));
}

describe('abilities+techniques', () => {
  it('PLAYER JOURNEY: a lab, a Cabaret rehearsal call and a Cabaret night, played by the clock, keep each rise under its source, and what they keep is what the craft moved', () => {
    const sim = fall();
    const pending = (kind: string, call?: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && (call === undefined || i.payload.call === call)).sort((a, b) => a.at - b.at)[0]!;
    const cases = [
      // A lab works the scene, the character, the script and the lines (`LAB_KIND`).
      { when: pending(LAB_KIND).at, source: 'lab', grows: ['scene', 'character', 'script', 'memorization'] },
      // A rehearsal call the same four (`rehearse`).
      { when: pending(CABARET_KIND, 'rehearsal').at, source: 'rehearsal:cabaret', grows: ['scene', 'character', 'script', 'memorization'] },
      // A night the scene, the feeling and the voice, and what a new piece reads: script, character, cold reading (`playNight`).
      { when: pending(CABARET_KIND, 'performance').at, source: 'night:cabaret', grows: ['scene', 'emotion', 'voice', 'script', 'character', 'coldReading'] },
    ];
    for (const c of cases) {
      const span = across(sim, c.when);
      const rises = risesUnder(span, c.source);
      // Every rise in the span is kept under the source, and nothing is kept that didn't rise.
      for (const r of rises) expect(r.kept, `${c.source}: ${r.skill}`).toBeCloseTo(r.rose, 2);
      // And only what the rule grows rose, the scene among it.
      const rose = rises.filter((r) => r.rose > 0).map((r) => r.skill);
      expect(c.grows, c.source).toEqual(expect.arrayContaining(rose));
      expect(rose, c.source).toContain('scene');
    }
  });

  it('PLAYER JOURNEY: the first spring’s festival, its rehearsal call and its night played by the clock, keeps each rise under the production’s name', () => {
    const sim = spring();
    const production = sim.player.school!.casting!.production;
    expect(production).toBe('Carlotta Festival Of New Plays');
    const cases = [
      { when: schoolCalls(sim, 'rehearsal')[0]!.at, source: `rehearsal:${production}`, grows: ['scene', 'character', 'script', 'memorization'] },
      { when: schoolCalls(sim, 'performance')[0]!.at, source: `night:${production}`, grows: ['scene', 'emotion', 'voice', 'script', 'character', 'coldReading'] },
    ];
    for (const c of cases) {
      const rises = risesUnder(across(sim, c.when), c.source);
      for (const r of rises) expect(r.kept, `${c.source}: ${r.skill}`).toBeCloseTo(r.rose, 2);
      const rose = rises.filter((r) => r.rose > 0).map((r) => r.skill);
      expect(c.grows, c.source).toEqual(expect.arrayContaining(rose));
      expect(rose, c.source).toContain('scene');
    }
  });

  it('PLAYER JOURNEY: a coursework step that trains (Learn Lines) keeps its rise under coursework:learn, and Read The Scene, which trains nothing, keeps none', () => {
    const sim = fall();
    tended(sim, at(2026, 9, 5, 8));
    freeFor(sim, 180);
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'scene-study' && x.status === 'open')!;
    const step = (activity: string) => {
      const kept = keptSince(sim);
      const lines = sim.player.craft!.memorization;
      sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } });
      return { kept: kept(), rose: sim.player.craft!.memorization - lines };
    };
    const read = step('read');
    expect(read.kept.filter((x) => x.source.startsWith('coursework:'))).toEqual([]);
    expect(read.rose).toBe(0);
    const learn = step('learn');
    // The lines are memory, grown twice by the step: its training (`coursework:learn`) and the preparation it is practice in.
    expect(learn.kept.filter((x) => x.source === 'coursework:learn').map((x) => x.id)).toEqual(['memory']);
    expect(learn.kept.filter((x) => x.id === 'memory').reduce((s, x) => s + x.delta, 0)).toBeCloseTo(learn.rose, 2);
    expect(learn.rose).toBeGreaterThan(0);
    expect(assignment(sim, a.id).trained).toBe(1);
  });

  it('PLAYER JOURNEY: an ability practised by command is read by the next showing judged in class, and lifts the dimension that reads it', () => {
    const base = fall();
    tended(base, at(2026, 9, 5, 8));
    const save = serialise(base.universe);
    const practised = loadSave(deserialise(save) as never);
    const plain = loadSave(deserialise(save) as never);
    // The weekend: one twin practises The Given Circumstances, which trains imagination, three hours a day; the other
    // lets the hours go by. Both have the same calendar, so they're free at the same hour.
    for (const day of [5, 6]) {
      for (const sim of [practised, plain]) { tended(sim, at(2026, 9, day, 8)); freeFor(sim, 180); }
      expect(practised.now).toBe(plain.now);
      for (let k = 0; k < 3; k += 1) practised.must({ kind: 'practice.exercise', payload: { exercise: 'given-circumstances' } });
      tended(plain, practised.now);
    }
    const gained = developmentOf(practised.player).history.filter((x) => x.source === 'practice:given-circumstances' && x.id === 'imagination').reduce((s, x) => s + x.delta, 0);
    expect(gained).toBeGreaterThan(0);
    for (const sim of [practised, plain]) tended(sim, at(2026, 9, 8, 12));
    const scene = (sim: Simulation) => (sim.player.work ?? []).find((w) => w.task === 'scene' && w.what === 'Scene Study')!;
    const [p, q] = [scene(practised), scene(plain)];
    expect(p.at).toBe(q.at);
    // The showing read the imagination as it stood, ahead by the hours practised, less what the classes since gave the
    // twin with more room to grow toward its reach; and the same techniques, the same preparation.
    const ahead = p.inputs.abilities.imagination! - q.inputs.abilities.imagination!;
    expect(ahead).toBeGreaterThan(0);
    expect(ahead).toBeLessThanOrEqual(gained + 1e-9);
    expect(p.inputs.levels).toEqual(q.inputs.levels);
    expect(p.inputs.prep).toEqual(q.inputs.prep);
    // Interpretation is the dimension that reads imagination in a scene (`TASK_PROFILES.scene`): it comes out higher. The
    // whole, kept to a tenth, moves less than that here, the scene shown unprepared, and is never lower for it.
    expect(p.dims.interpretation!).toBeGreaterThan(q.dims.interpretation!);
    expect(p.overall).toBeGreaterThanOrEqual(q.overall);
  });

  it('counts voice, movement, emotion and memorization once, as abilities: a played night replayed with them added to its reads comes out the same, and with a technique added it doesn’t', () => {
    // FIXTURE on a played record: the night is played by the clock; its replay (`replay`) is the evaluation's own.
    const sim = afterCabaret();
    const night = (sim.player.work ?? []).find((w) => w.task === 'performance')!;
    const again = (techniques: Partial<Record<Skill, number>>) => replay({ ...night, inputs: { ...night.inputs, techniques: { ...night.inputs.techniques, ...techniques } } }, TASK_PROFILES[night.task]!)!.overall;
    expect(again({})).toBe(night.overall);
    expect(again({ voice: 1, movement: 1, emotion: 1, memorization: 1 })).toBe(night.overall);
    // The probe is live: a learned technique the night didn't read, at the level the night holds it (none), costs it.
    expect(again({ singing: 1 })).not.toBe(night.overall);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

const labelOf = (id: string) => ABILITY_DEFS.find((d) => d.id === id)?.label ?? TECHNIQUE_LABEL[id as Skill];
/** The Development History's lines for the latest changes, as the Profile prints them: label, rise and source. */
const historyLine = (h: { id: string; delta: number }) => `${labelOf(h.id)} +${h.delta.toFixed(3)},`;

describe('development ledger', () => {
  it('PLAYER JOURNEY: the Profile’s Development History says where each played change came from: practice, a coursework step, a lab and a night', () => {
    const sim = fall();
    tended(sim, at(2026, 9, 5, 8));
    freeFor(sim, 240);
    const newest = () => developmentOf(sim.player).history.at(-1)!;
    sim.must({ kind: 'practice.exercise', payload: { exercise: 'repetition' } });
    // The practice-day's discipline comes after the hour's own rise.
    const hour = developmentOf(sim.player).history.filter((x) => x.source === 'practice:repetition').at(-1)!;
    expect(shown(sim, ProfileWorkspace)).toContain(`${historyLine(hour)} The Repetition Exercise`);
    expect(shown(sim, ProfileWorkspace)).toContain(`${historyLine(newest())} A day of practice kept`);
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'scene-study' && x.status === 'open')!;
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'learn' } });
    const learned = developmentOf(sim.player).history.filter((x) => x.source === 'coursework:learn').at(-1)!;
    expect(shown(sim, ProfileWorkspace)).toContain(`${historyLine(learned)} Coursework: Learn Lines`);
    const lab = sim.universe.scheduled.filter((i) => i.kind === LAB_KIND && i.status === 'pending').sort((x, y) => x.at - y.at)[0]!;
    across(sim, lab.at);
    expect(newest().source).toBe('lab');
    expect(shown(sim, ProfileWorkspace)).toContain(`${historyLine(newest())} A lab`);
    const night = sim.universe.scheduled.filter((i) => i.kind === CABARET_KIND && i.status === 'pending' && i.payload.call === 'performance').sort((x, y) => x.at - y.at)[0]!;
    const span = across(sim, night.at);
    const onStage = span.kept.filter((x) => x.source === 'night:cabaret').at(-1)!;
    expect(shown(sim, ProfileWorkspace)).toContain(`${historyLine(onStage)} A night on stage`);
    // No line of the history prints a source's bare key.
    const text = shown(sim, ProfileWorkspace);
    const history = text.slice(text.indexOf('Development History The latest'));
    expect(history.length).toBeLessThan(text.length);
    for (const bare of [', rehearsal ', ', lab ', ', coursework ', ', night ', ', practice ', ', prepare ']) expect(history).not.toContain(bare);
  });

  it('PLAYER JOURNEY: a School production’s rehearsal call is said with the production’s name', () => {
    const sim = spring();
    const span = across(sim, schoolCalls(sim, 'rehearsal')[0]!.at);
    const kept = span.kept.filter((x) => x.source === 'rehearsal:Carlotta Festival Of New Plays');
    expect(kept.length).toBeGreaterThan(0);
    const text = shown(sim, ProfileWorkspace);
    for (const x of kept) expect(text).toContain(`${historyLine(x)} A rehearsal call: Carlotta Festival Of New Plays`);
  });

  it('PLAYER JOURNEY: a Cabaret rehearsal call is said as the Cabaret’s, not by the bare key “cabaret”', () => {
    // A defect until 2026-10-13: `sourceWords` (src/ui/looks/actor.tsx) named a rehearsal call by what follows the
    // colon, and worded only the Summer Cabaret’s key (`rehearsal:summer`); the Cabaret’s calls are kept as
    // `rehearsal:cabaret` (src/engine/systems/school.ts, CABARET_KIND), so the History printed “A rehearsal call:
    // cabaret”. Fixed that day.
    const sim = fall();
    const call = sim.universe.scheduled.filter((i) => i.kind === CABARET_KIND && i.status === 'pending' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at)[0]!;
    const span = across(sim, call.at);
    const kept = span.kept.filter((x) => x.source === 'rehearsal:cabaret');
    expect(kept.length).toBeGreaterThan(0);
    const text = shown(sim, ProfileWorkspace);
    for (const x of kept) expect(text).toContain(`${historyLine(x)} A rehearsal call: the Yale Cabaret`);
    expect(text).not.toContain('A rehearsal call: cabaret');
  });

  it('PLAYER JOURNEY: keeps the latest 400 changes, dropping the oldest as new ones come, says so on the Profile, and a reload keeps them', () => {
    const sim = fall();
    const history = () => developmentOf(sim.player).history;
    while (history().length < 400 && sim.now < at(2026, 12, 1)) tended(sim, sim.now + MS_DAY);
    expect(history()).toHaveLength(400);
    const was = [...history()];
    tended(sim, sim.now + 3 * MS_DAY);
    const now = history();
    expect(now).toHaveLength(400);
    // The ones that came since are at the end, and as many of the oldest went from the front, in order.
    const came = now.filter((x) => !was.includes(x)).length;
    expect(came).toBeGreaterThan(0);
    expect(now.slice(0, 400 - came)).toEqual(was.slice(came));
    expect(now.slice(0, 400 - came).every((x, k) => x === was[came + k])).toBe(true);
    expect(now.at(-1)!.at).toBeGreaterThanOrEqual(was.at(-1)!.at);
    expect(shown(sim, ProfileWorkspace)).toContain('Development History Your last 400 changes, newest first');
    const back = reload(sim);
    expect(developmentOf(back.player).history).toEqual(now);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

const CABARET_SHOW = 'Yale Cabaret, Season 59';
/** A night's band as a number, for a run's mean (`NIGHT_VALUE`: off -1, solid 0, strong 1, remarkable 2). */
const NIGHT = { off: -1, solid: 0, strong: 1, remarkable: 2 } as const;
/** The director's note's first sentence for a run's mean, by its edges: 1.25, 0.5 and -0.25. */
const noteFor = (mean: number) => (mean >= 1.25 ? 'Remarkable work, night after night.' : mean >= 0.5 ? 'Strong, reliable work across the run.' : mean >= -0.25 ? 'Solid, sound nights. The next step is to take more risks in them.' : 'Uneven: some nights got away from you. Come in rested, and have the part in your body before the house does.');

describe('work records + journey', () => {
  it('PLAYER JOURNEY: a Cabaret run played through keeps its nights, and at the last a run milestone averaged from them and a note naming what cost them most, once through a reload, on the Profile', () => {
    let sim = afterCabaret();
    const cab = sim.player.school!.cabaret!;
    const nights = (sim.player.work ?? []).filter((w) => w.task === 'performance' && w.what === CABARET_SHOW).sort((a, b) => a.at - b.at);
    expect(nights).toHaveLength(5);
    expect(journeyOf(sim.player).totals.performance!.n).toBe(5);
    // The milestone: the part and the show, the mean of the nights to a tenth, and the nights by band in the order met.
    const bands = new Map<string, number>();
    for (const w of nights) bands.set(w.band!, (bands.get(w.band!) ?? 0) + 1);
    const mean = Math.round(nights.reduce((s, w) => s + w.overall, 0) / nights.length * 10) / 10;
    const runs = journeyOf(sim.player).milestones.filter((x) => x.kind === 'run');
    expect(runs).toEqual([{ at: nights.at(-1)!.at, kind: 'run', what: `${cab.role}, ${CABARET_SHOW}`, overall: mean, detail: [...bands].map(([b, n]) => `${n} ${b}`).join(', ') }]);
    // The note: the nights' mean in words, and the ability or technique whose limits cost the whole most across them.
    const held = new Map<string, { label: string; whole: number }>();
    for (const w of nights) for (const l of w.limits) if (l.kind === 'ability' || l.kind === 'technique') { const x = held.get(l.what) ?? { label: l.label, whole: 0 }; x.whole += l.whole ?? l.by / 4; held.set(l.what, x); }
    const top = [...held.values()].sort((a, b) => b.whole - a.whole)[0];
    const workOn = top && top.whole / nights.length >= 0.5 ? ` Work on your ${top.label.toLowerCase()}: it held your nights back most.` : '';
    const nightsMean = nights.reduce((s, w) => s + NIGHT[w.band as keyof typeof NIGHT], 0) / nights.length;
    expect(cab.note).toBe(`${noteFor(nightsMean)}${workOn}`);
    expect(workOn, 'something held this run back').not.toBe('');
    expect(notices(sim, `The Director’s Note: ${CABARET_SHOW}`).map((n) => n.body)).toEqual([cab.note]);
    // On the Profile's School Journey.
    expect(shown(sim, ProfileWorkspace)).toContain(`${cab.role}, ${CABARET_SHOW}, the run averaged ${mean.toFixed(1)} (${runs[0]!.detail})`);
    // Once: a reload and days on, the run is closed and counted once.
    sim = reload(sim);
    tended(sim, sim.now + 2 * MS_DAY);
    expect(journeyOf(sim.player).milestones.filter((x) => x.kind === 'run')).toHaveLength(1);
    expect(notices(sim, `The Director’s Note: ${CABARET_SHOW}`)).toHaveLength(1);
  });

  it('PLAYER JOURNEY: Your Work So Far names a strength by the rule, a dimension 4 or more over the whole’s mean across 6 or more of the latest 40 pieces, with its 3 best as evidence', () => {
    const sim = afterCabaret();
    const work = [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-40);
    expect(work.length).toBeGreaterThanOrEqual(6);
    const mean = work.reduce((s, w) => s + w.overall, 0) / work.length;
    const byDim = new Map<Dimension, { q: number; what: string }[]>();
    for (const w of work) for (const [d, q] of Object.entries(w.dims) as [Dimension, number][]) byDim.set(d, [...(byDim.get(d) ?? []), { q, what: w.what }]);
    const text = shown(sim, ProfileWorkspace);
    const avg = (xs: { q: number }[]) => xs.reduce((s, x) => s + x.q, 0) / xs.length;
    const strong = [...byDim].filter(([, xs]) => xs.length >= 6 && avg(xs) - mean >= 4);
    const not = [...byDim].filter(([d]) => !strong.some(([s]) => s === d));
    expect(strong.length, 'the played fall has a strength to name').toBeGreaterThan(0);
    for (const [d, xs] of strong) {
      const best = [...xs].sort((a, b) => b.q - a.q).slice(0, 3).map((b) => `${b.what}: ${r1(b.q)}`).join('; ');
      expect(text).toContain(`Your ${DIMENSION_LABEL[d].toLowerCase()} runs ahead of the rest: ${r1(avg(xs))} on average across ${xs.length} pieces, against ${r1(mean)} overall. From: ${best}.`);
    }
    for (const [d] of not) expect(text).not.toContain(`Your ${DIMENSION_LABEL[d].toLowerCase()} runs ahead of the rest`);
  });

  it('PLAYER JOURNEY: a night of the run opens on its look with what it was judged, its band in words, and each dimension’s figure', () => {
    const sim = afterCabaret();
    h.sim = sim;
    const night = (sim.player.work ?? []).find((w) => w.task === 'performance' && w.what === CABARET_SHOW)!;
    const look = resolveLook(sim, { kind: 'work', id: night.inputs.key }) as Looked;
    expect(look.name).toBe(CABARET_SHOW);
    expect(look.kind).toBe('A Night On Stage');
    // A night's band in words: off, solid, strong, remarkable.
    const band = ({ off: 'An Off Night', solid: 'Solid', strong: 'Strong', remarkable: 'Remarkable' } as Record<string, string>)[night.band!];
    expect(look.summary).toContain(`Judged ${night.overall.toFixed(1)} of 100, ${band}, on `);
    const body = words(renderToStaticMarkup(createElement('div', null, look.body)));
    for (const [d, q] of Object.entries(night.dims) as [Dimension, number][]) expect(body).toContain(`${DIMENSION_LABEL[d]} ${q.toFixed(1)}`);
  });

  it('PLAYER JOURNEY: What To Work On reads the played work: the ability or technique twenty hours of practice would pay most for on the latest pieces is named with its forecast', () => {
    const sim = afterCabaret();
    // Until 2026-10-16 this worked out the rule of that day by hand (each limit's cost to the whole across the latest
    // twelve pieces, scaled by the room left) and found it named. From then What To Work On Next is forecast
    // (`systems/advice.ts`): the hours of each input's own exercise, replayed on the latest pieces with you as you are now.
    // That it names what the hours really pay most for is played in tests/advice.test.ts; here, that the Profile names
    // the forecast's first, an input the played work read and that has room, in the forecast's own figures.
    const latest = [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-12);
    const read = new Set(latest.flatMap((w) => [...Object.keys(w.inputs.abilities), ...Object.keys(w.inputs.techniques)]));
    const f = trainingForecast(sim, sim.player);
    const [what, top] = [...f].sort((x, y) => y[1].points - x[1].points)[0]!;
    expect(read.has(what)).toBe(true);
    // Forecast from the level as it is now, which has room.
    expect(top.from).toBeCloseTo(levelOf(sim, sim.player, what as Skill), 6);
    expect(top.to).toBeGreaterThan(top.from);
    expect(top.points).toBeGreaterThanOrEqual(0.1);
    const exercise = EXERCISES.find((e) => e.trains === what)!;
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const each = r1(top.points);
    // Short, with its estimate said as one (from 2026-10-20, brief 16's `adviceSummary`): until then the whole forecast
    // inline, "N hours of its exercise … would take it from … that’s forecast to be worth about …".
    // First, or under Other Things Worth Your Time where preparation comes first, as here.
    const drawn = shown(sim, ProfileWorkspace);
    expect(drawn).toMatch(new RegExp(`What To Work On Next .*(?:${esc(exercise.label)} at the \\w+ tier, with Focus on \\w+\\. .*Estimate: ${top.hours} hours(?:, an hour a day,)? would take it from ${Math.round(top.from)} to about ${Math.round(top.to)}, worth about ${esc(String(each))} points? a piece on your recent work\\.|, ${esc(exercise.label)} at the \\w+ tier: an estimated ${esc(String(each))} points? a piece for ${top.hours} hours, from ${Math.round(top.from)} to about ${Math.round(top.to)}\\.)`));
  });

  it('PLAYER JOURNEY: Taking Direction reads, for life, the notes on the craft a run gave and those the work answered', () => {
    const sim = spring();
    // Played as tests/rehearsal-notes-history.test.ts plays it: after each call, the part learned and the blocking caught
    // up where they're short, so the notes come on the craft rather than the lines.
    for (const call of schoolCalls(sim, 'rehearsal')) {
      tended(sim, call.at + 6 * MS_HOUR + 30 * 60_000);
      const proc = processOf(sim.player.school!.casting!);
      if (proc.lines < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      if (proc.blockingMissed > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
      // And the latest note worked, its first way kept where it offers one.
      const last = proc.notes.at(-1);
      if (last && last.taken === undefined && !last.worked) {
        const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        if (r.ok && r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
      }
    }
    tended(sim, schoolCalls(sim, 'performance').at(-1)!.at + MS_HOUR);
    // The notes the directors gave, kept on each process (at most 30 each; fewer here), of which a craft note or a
    // request is what direction counts, and taken where the next call found it answered.
    const notes = [sim.player.school!.casting, sim.player.school!.rep].filter((x) => x !== undefined).flatMap((x) => processOf(x as never).notes);
    expect(notes.length).toBeLessThan(30);
    const onCraft = notes.filter((n) => n.focus.kind === 'craft' || n.focus.kind === 'direction');
    const answered = onCraft.filter((n) => n.taken === true).length;
    expect(onCraft.length).toBeGreaterThanOrEqual(3);
    expect(journeyOf(sim.player).direction).toMatchObject({ given: onCraft.length, answered });
    expect(shown(sim, ProfileWorkspace)).toContain(`Of ${onCraft.length} notes and requests on your craft, you answered ${answered || 'none'}`);
  });

  it('names a strength at 4 over the mean and not at 3.9', () => {
    const sim = afterCabaret();
    const work = [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-40);
    const mean = work.reduce((s, w) => s + w.overall, 0) / work.length;
    // A dimension the played work reads in 6 or more pieces.
    const counts = new Map<string, number>();
    for (const w of work) for (const d of Object.keys(w.dims)) counts.set(d, (counts.get(d) ?? 0) + 1);
    const d = [...counts].filter(([, n]) => n >= 6).sort((a, b) => b[1] - a[1])[0]![0] as Dimension;
    const say = `Your ${DIMENSION_LABEL[d].toLowerCase()} runs ahead of the rest`;
    const edge = (over: number) => {
      // TEST SETUP: the dimension's every result in the kept work set to the mean of the whole and this much over.
      for (const w of work as WorkRecord[]) if (w.dims[d] !== undefined) w.dims[d] = mean + over;
      return shown(sim, ProfileWorkspace);
    };
    expect(edge(4 + 1e-9)).toContain(say);
    expect(edge(3.9)).not.toContain(say);
  });

  it('PLAYER JOURNEY: Range counts the kinds of work kept for life, and a scene shown with a partner is counted together once, which Playing With Others reads', () => {
    const sim = fall();
    const scene = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'scene-study' && x.status === 'open')!;
    tended(sim, at(2026, 9, 8, 8));
    const before = { ...(journeyOf(sim.player).together ?? { n: 0, sum: 0, slips: 0, covered: 0 }) };
    tended(sim, at(2026, 9, 8, 12));
    const together = assignment(sim, scene.id).shown!.together!;
    expect(journeyOf(sim.player).together!.n).toBe(before.n + 1);
    expect(journeyOf(sim.player).together!.sum).toBeCloseTo(before.sum + together.overall, 6);
    tended(sim, at(2026, 9, 27, 2));
    const kinds = new Set((sim.player.work ?? []).map((w) => w.task)).size;
    const practised = Object.values(sim.player.engagement?.byGenre ?? {}).filter((g) => g.practice > 0).length;
    const text = shown(sim, ProfileWorkspace);
    expect(text).toContain(`${kinds} kinds of work judged, ${practised} genres worked in,`);
    const tog = journeyOf(sim.player).together!;
    expect(tog.n).toBeGreaterThanOrEqual(3);
    expect(text).toContain(`${tog.n} pieces played with a partner, a reader or a company came to ${r1(tog.sum / tog.n)} together on average`);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

/** TEST SETUP: twins put to the same rested day, awake the same two hours, so an hour's focus is the same in both. */
const sameDay = (sim: Simulation) => { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = sim.now - 2 * MS_HOUR; };
/** Familiarity after studies on the given days from none: 8% of what's left, half again for each before it that day (`r2`). */
const studiedOn = (days: readonly string[]) => { let f = 0; days.forEach((d, k) => { const n = days.slice(0, k).filter((x) => x === d).length; f = Math.round((f + 100 * 0.08 * 0.5 ** n * (1 - f / 100)) * 100) / 100; }); return f; };
const studied = (n: number) => studiedOn(Array.from({ length: n }, () => 'one day'));
/** Studies a genre three times by command, as a player would one after another, and says on which days. */
const studyThrice = (sim: Simulation, genre: string) => Array.from({ length: 3 }, () => { const p = zonedParts(sim.now, zone); sim.must({ kind: 'genre.study', payload: { genre } }); return `${p.year}-${p.month}-${p.day}`; });
/** The second year, its first thesis cast, the Saturday before its calls begin. */
const secondYear = () => from('second-year', () => { const sim = student('g23-probe'); tended(sim, at(2027, 9, 18, 8)); return sim; });

describe('genre familiarity/practice', () => {
  it('PLAYER JOURNEY: a genre studied three times makes Read The Scene of a scene from a play of that kind move further, by a sixth of the familiarity it left', () => {
    const base = fall();
    tended(base, at(2026, 9, 5, 8));
    freeFor(base, 330);
    const save = serialise(base.universe);
    const [known, plain] = [loadSave(deserialise(save) as never), loadSave(deserialise(save) as never)];
    const a = courseworkOf(known, known.player)!.assignments.find((x) => x.template === 'scene-study' && x.status === 'open')!;
    const genre = genresOfPlay(sceneById(a.sceneId!)!.play)![0]!;
    for (let k = 0; k < 3; k += 1) known.must({ kind: 'genre.study', payload: { genre } });
    expect(known.player.engagement!.byGenre[genre]!.familiarity).toBe(studied(3));
    tended(plain, known.now);
    const moved = (sim: Simulation) => {
      sameDay(sim);
      return sim.must<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).moved;
    };
    expect(moved(known) / moved(plain)).toBeCloseTo(1 + studied(3) / 100 / 6, 9);
  });

  it('PLAYER JOURNEY: a genre studied makes Learn The Part of a play of that kind move the lines further, by the same sixth', () => {
    const base = secondYear();
    freeFor(base, 330);
    const save = serialise(base.universe);
    const [known, plain] = [loadSave(deserialise(save) as never), loadSave(deserialise(save) as never)];
    const casting = known.player.school!.casting!;
    const genre = genresOfPlay(casting.play)?.[0];
    expect(genre, `${casting.play ?? casting.production} is a play of a kind`).toBeDefined();
    const familiarity = studiedOn(studyThrice(known, genre!));
    expect(known.player.engagement!.byGenre[genre!]!.familiarity).toBe(familiarity);
    tended(plain, known.now);
    const moved = (sim: Simulation) => {
      sameDay(sim);
      const before = processOf(sim.player.school!.casting!).lines;
      return sim.must<{ lines: number }>({ kind: 'school.learn_part', payload: {} }).lines - before;
    };
    expect(moved(known) / moved(plain)).toBeCloseTo(1 + familiarity / 100 / 6, 9);
  });

  it('PLAYER JOURNEY: a genre studied makes a note on the lines, worked, move them further, by the same sixth', () => {
    const base = secondYear();
    // The calls played until the director gives a note on the lines (`school.work_note` works one as an hour on the part).
    const last = () => processOf(base.player.school!.casting!).notes.at(-1);
    for (const call of schoolCalls(base, 'rehearsal')) {
      if (last()?.focus.kind === 'lines' && last()!.taken === undefined) break;
      tended(base, call.at + 6 * MS_HOUR);
    }
    expect(last()?.focus.kind).toBe('lines');
    freeFor(base, 330);
    const save = serialise(base.universe);
    const [known, plain] = [loadSave(deserialise(save) as never), loadSave(deserialise(save) as never)];
    const genre = genresOfPlay(known.player.school!.casting!.play)![0]!;
    // The evening can run past midnight, where a study is a new day's and isn't halved: the days are read as they come.
    const familiarity = studiedOn(studyThrice(known, genre));
    expect(known.player.engagement!.byGenre[genre]!.familiarity).toBe(familiarity);
    tended(plain, known.now);
    const moved = (sim: Simulation) => {
      sameDay(sim);
      const proc = processOf(sim.player.school!.casting!);
      const before = proc.lines;
      sim.must({ kind: 'school.work_note', payload: {} });
      return proc.lines - before;
    };
    expect(moved(known) / moved(plain)).toBeCloseTo(1 + familiarity / 100 / 6, 9);
  });

  it('PLAYER JOURNEY: a night of a play practises each of its kinds, one night’s worth shared between them, half again of what’s left the next', () => {
    const sim = secondYear();
    const casting = sim.player.school!.casting!;
    const kinds = genresOfPlay(casting.play)!;
    expect(kinds.length).toBe(2);
    const practice = () => kinds.map((g) => sim.player.engagement?.byGenre[g]?.practice ?? 0);
    expect(practice()).toEqual([0, 0]);
    const shows = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep').sort((a, b) => a.at - b.at);
    tended(sim, shows[0]!.at + MS_HOUR);
    // 10% of a session, shared by two kinds: 5 each from none.
    expect(practice()).toEqual([5, 5]);
    tended(sim, shows[1]!.at + MS_HOUR);
    expect(practice()).toEqual([9.75, 9.75]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

/** What a medium's take reads of its own (`BRIEF.base`), and what a technique the scene stages weighs: twice its level. */
const MEDIUM: Record<string, Partial<Record<Skill, number>>> = { camera: { screen: 2, scene: 1 }, voice: { voiceover: 2, scene: 1 } };
const stagedReads = (b: (typeof BRIEFS)[number]) => {
  const out: Partial<Record<Skill, number>> = { ...MEDIUM[b.medium] };
  for (const [k, w] of Object.entries(b.techniques ?? {}) as [Skill, number][]) out[k] = Math.max(out[k] ?? 0, w * 2);
  return out;
};

describe('genre demands', () => {
  it('adds nothing to any brief’s take today: every brief already stages what its genres demand, and a take reads the medium’s and the brief’s own', () => {
    for (const b of BRIEFS) {
      const own = stagedReads(b);
      for (const tag of b.kinds.flatMap(genreTags)) expect(Object.keys(own), `${b.id}: ${tag}`).toContain(DEMAND_TECHNIQUE[tag]);
      expect(tapeReadsOf(b), b.id).toEqual(own);
    }
  });

  it('PLAYER JOURNEY: a brief taped in a genre that demands fights reads them at the brief’s own weight, not the demand’s', () => {
    const sim = fall();
    tended(sim, at(2026, 9, 5, 8));
    freeFor(sim, 360);
    const b = BRIEF_BY_ID['brief-action']!;
    expect(genreTags('action')).toContain('stunt');
    const go = (kind: string, payload: Record<string, unknown>) => { Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, morale: 60 }); return sim.execute({ kind, payload }); };
    expect(go('brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
    for (const step of ['read', 'lines', 'rehearse']) go('brief.prepare', { brief: b.id, step });
    const taped = go('practice.self_tape', { genre: 'action', brief: b.id });
    expect(taped.ok, taped.error).toBe(true);
    const take = (sim.player.work ?? []).at(-1)!;
    expect(take.inputs.techniques.combat).toBe(2 * b.techniques!.combat!);
    expect(take.inputs.techniques).toEqual(Object.fromEntries(Object.entries(stagedReads(b)).filter(([k]) => k !== 'voice' && k !== 'movement' && k !== 'emotion' && k !== 'memorization')));
  });

  it('every play and every class scene has a material profile, so what a casting reads is the play’s own and its material’s, and no genre tag adds to it', () => {
    for (const p of [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS]) {
      const m = materialOf(p.title);
      expect(m, p.title).toBeDefined();
      const own: Partial<Record<Skill, number>> = { ...p.reads };
      for (const [k, w] of Object.entries(m!.techniques ?? {}) as [Skill, number][]) if (own[k] === undefined) own[k] = w;
      expect(castingReads({ play: p.title }), p.title).toEqual(own);
    }
    for (const s of SCENES) expect(materialOf(s.id), s.id).toBeDefined();
  });

  it('the Player Profile’s Genres say what each asks for: Action fights and stunts at the player’s combat, and a demand on one example as not established', () => {
    const sim = fall();
    const text = shown(sim, ProfileWorkspace);
    const combat = `${TECHNIQUE_LABEL.combat} ${sim.player.craft!.combat.toFixed(1)} of 90`;
    expect(text).toContain(`Action Fights And Stunts (${combat})`);
    expect(text).toContain(`Action Comedy Fights And Stunts (${combat}); Comic Timing (${TECHNIQUE_LABEL.comedy} ${sim.player.craft!.comedy.toFixed(1)} of 90)`);
    // Until 2026-10-17 this said “the research rests on one example”, false of many low genres (brief 14's json area, D1).
    expect(text).toContain('Absurdist Not established: the research holds it with low confidence');
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe('classmates abilities/craft', () => {
  it('PLAYER JOURNEY: a class meeting grows, in each classmate in the room, the abilities whose kin its courses train (listening and focus among them), and nothing of anyone who stayed away', () => {
    const sim = student('g23-probe');
    tended(sim, at(2026, 8, 31, 8));
    const mates = sim.player.school!.classmates;
    const kept = ['composure', 'listening', 'imagination', 'focus', 'adaptability'] as const;
    // What a day's courses train, from the timetable, and the abilities those skills are kin to (`ABILITY_KIN`).
    const growsOn = (key: string) => {
      const [year, month, date] = key.split('-').map(Number) as [number, number, number];
      const skills = new Set(coursesFor(sim.player.school, { year, month, day: date }).flatMap((c) => c.skills));
      return kept.filter((id) => (ABILITY_KIN[id as AbilityId] ?? []).some((k) => skills.has(k)));
    };
    // The first class day with somebody away whose courses train the kin of both listening and focus, played on to.
    const fits = (key: string) => classmatesIn(sim, sim.player, key).includes(false) && growsOn(key).includes('listening') && growsOn(key).includes('focus');
    // A week's meetings go on the calendar a week at a time (`planWeek`), so between weeks there may be none yet.
    const next = () => sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.status === 'pending').sort((a, b) => a.at - b.at)[0];
    while (!(next() && fits(String(next()!.payload.day))) && sim.now < at(2026, 10, 15)) tended(sim, next() ? next()!.at + MS_HOUR : sim.now + 12 * MS_HOUR);
    const day = next()!;
    expect(day && fits(String(day.payload.day)), 'such a day by mid-October').toBe(true);
    const grows = growsOn(String(day.payload.day));
    tended(sim, day.at - 60_000);
    const inClass = classmatesIn(sim, sim.player, String(day.payload.day));
    const before = mates.map((_m, i) => ({ ...mateAbilities(sim, sim.player, i) }));
    sim.advanceTo(day.at + 60_000);
    const present = mates.map((_m, i) => i).filter((i) => inClass[i]);
    const away = mates.map((_m, i) => i).filter((i) => !inClass[i]);
    const still = kept.filter((id) => !(grows as readonly string[]).includes(id));
    expect(present.length).toBeGreaterThan(0);
    expect(away.length).toBeGreaterThan(0);
    for (const i of away) expect(mateAbilities(sim, sim.player, i), `${i} stayed away`).toEqual(before[i]);
    for (const i of present) {
      const now = mateAbilities(sim, sim.player, i);
      for (const id of grows) expect(now[id], `${i} ${id}`).toBeGreaterThan(before[i]![id]);
      for (const id of still) expect(now[id], `${i} ${id}`).toBe(before[i]![id]);
      for (const id of kept) expect(now[id]).toBeLessThanOrEqual(100);
    }
  });

  it('PLAYER JOURNEY: the class’s own Cabaret show, run out by the clock, grows each member’s composure by a two-hundredth of what was left a night, five nights, and nobody else’s', () => {
    const sim = student('g23-probe');
    tended(sim, at(2026, 9, 1, 8));
    const run = sim.universe.scheduled.find((i) => i.kind === COMPANY_KIND && i.status === 'pending')!;
    const members = run.payload.mates as number[];
    expect(run.payload.performances).toBe(5);
    tended(sim, run.at - 60_000);
    const before = sim.player.school!.classmates.map((_m, i) => mateAbilities(sim, sim.player, i).composure);
    sim.advanceTo(run.at + 60_000);
    const mates = sim.player.school!.classmates;
    expect(members.length).toBeGreaterThan(0);
    for (const i of members) {
      expect(mateAbilities(sim, sim.player, i).composure, `member ${i}`).toBeCloseTo(100 - (100 - before[i]!) * 0.995 ** 5, 9);
      expect(mates[i]!.shown).toMatchObject({ production: CABARET_SHOW, runs: 1 });
    }
    for (const i of mates.map((_m, k) => k).filter((k) => !members.includes(k))) expect(mateAbilities(sim, sim.player, i).composure, `not in it ${i}`).toBe(before[i]);
  });

  it('PLAYER JOURNEY: the Cabaret’s company casts by fit: three classmates who out-fit the player leave them a lead, a fourth makes it a supporting part, and the School screen says which', () => {
    const save = (() => { const sim = student('g23-probe'); tended(sim, at(2026, 9, 2, 16)); return serialise(sim.universe); })();
    const join = (strong: number) => {
      const sim = loadSave(deserialise(save) as never);
      sim.player.school!.classmates.forEach((m, i) => {
        // TEST SETUP: the class's craft and abilities by hand, the first `strong` far above the player, the rest far under.
        const level = i < strong ? 95 : 10;
        m.craft = evenCraft(level);
        Object.assign(mateAbilities(sim, sim.player, i), { composure: level, listening: level, imagination: level, focus: level, adaptability: level });
      });
      sim.must({ kind: 'school.cabaret', payload: {} });
      return sim;
    };
    const three = join(3);
    expect(three.player.school!.cabaret).toMatchObject({ role: 'A Leading Part In A New Piece', size: 'lead' });
    expect(shown(three, SchoolWorkspace)).toContain('Your Part A Leading Part In A New Piece');
    const four = join(4);
    expect(four.player.school!.cabaret).toMatchObject({ role: 'A Supporting Part In A New Piece', size: 'supporting' });
    expect(shown(four, SchoolWorkspace)).toContain('Your Part A Supporting Part In A New Piece');
  });

  it('PLAYER JOURNEY: a scene partner’s listening and focus are their timing in the scene shown together: with all of both, their part in it is twice what none of either gives', () => {
    const base = student('g23-probe');
    tended(base, at(2026, 9, 7, 20));
    const save = serialise(base.universe);
    const scene = courseworkOf(base, base.player)!.assignments.find((x) => x.template === 'scene-study' && x.status === 'open')!;
    const showing = (level: number) => {
      const sim = loadSave(deserialise(save) as never);
      // TEST SETUP: the partner's listening and focus by hand.
      Object.assign(mateAbilities(sim, sim.player, scene.partner!), { listening: level, focus: level });
      tended(sim, at(2026, 9, 8, 12));
      const a = mateAbilities(sim, sim.player, scene.partner!);
      return { together: assignment(sim, scene.id).shown!.together!, timing: 0.5 + 0.5 * (a.listening + a.focus) / 200 };
    };
    const [all, none] = [showing(100), showing(0)];
    expect(all.timing).toBe(1);
    // The partner at none grew a little in that morning's class before the showing; their timing is read from that.
    // Timing is 0.5 and half the mean of listening and focus out of 100, and the contribution is in proportion to it,
    // each kept to three places: so the one is the other times their timings' ratio, within the two roundings.
    const ratio = all.timing / none.timing;
    expect(ratio).toBeGreaterThan(1.95);
    expect(Math.abs(all.together.contribution - none.together.contribution * ratio)).toBeLessThanOrEqual(0.0005 * (1 + ratio) + 1e-9);
    expect(all.together.overall).toBeGreaterThan(none.together.overall);
  });

  it('PLAYER JOURNEY: the class’s growth a term is weighed against is the middle classmate’s, from the term’s start to its evaluation', () => {
    const sim = student('g23-probe');
    tended(sim, at(2026, 8, 31, 8));
    const mean = (c: Record<string, number>) => Object.values(c).reduce((s, x) => s + x, 0) / Object.values(c).length;
    const start = sim.player.school!.classmates.map((m) => mean(m.craft));
    expect(sim.player.school!.tally.classAtStart).toEqual(start);
    const review = sim.universe.scheduled.find((i) => i.kind === EVALUATION_KIND && i.status === 'pending')!;
    tended(sim, review.at - 60_000);
    const gains = sim.player.school!.classmates.map((m, i) => mean(m.craft) - start[i]!).sort((a, b) => a - b);
    sim.advanceTo(review.at + 60_000);
    // Fifteen classmates: the eighth.
    expect(gains).toHaveLength(15);
    expect(sim.player.school!.history[0]!.classGrowth).toBeCloseTo(gains[7]!, 9);
  });
});
