/**
 * The Actor Showcase, DRAM 793b (brief 19, `docs/verification/career-2026-10-20/criteria.md` W1, W2, the School's side of
 * A1, A5 and V4; `systems/proshowcase.ts`).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York, played
 * by the clock from Monday 24 August 2026 to her last term and through it, every commitment stopped at and gone to as the
 * top bar's Go carries the jump on (`jump`), and the commands a player sends. Three years play in a few seconds, so each
 * journey is a played life, not a made one.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and steady as the clock moves (`tended`); a student who does
 * the coursework, every part of every open piece prepared each midnight, as tests/school.test.ts plays one (`working`),
 * and for the showcase's scenes where a test says so; a course made Incomplete as the term review leaves one, and given
 * its month more; the location set to New York, or a stay in hospital, where a showcase day is to be missed or excused;
 * and a save given back the shape a build before 2026-10-21 wrote (no showcase, no `showcase.begun`).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { answerStop } from '@/engine/world/clock';
import { PREP_DIMS, sceneById } from '@/engine/content/coursework';
import { YALE_DRAMA } from '@/engine/content/school';
import { courseworkOf, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { journeyOf } from '@/engine/systems/evaluation';
import { pathwayOf } from '@/engine/systems/pro';
import {
  EARLY_DEGREE, LOS_ANGELES, NEW_YORK, SHOWCASE, SHOWCASE_CHECK_KIND, SHOWCASE_COURSE, SHOWCASE_KIND, choiceRefusal, showcaseCalendar, showcaseOptions,
  showcasePieces,
} from '@/engine/systems/proshowcase';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'overview' }));

// The screens' kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key.startsWith('tab:') ? h.tab : initial) as T, () => undefined] as const };
});

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

const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** TEST SETUP: a student who does the coursework, as tests/school.test.ts plays one: every part of every open piece prepared each midnight; the showcase's scenes too where `showcase` says so. */
function working(sim: Simulation, showcase = false): Simulation {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if ((a.status !== 'open' && a.status !== 'revising') || (a.course === SHOWCASE_COURSE && !showcase)) continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  return sim;
}
/** TEST SETUP: rested, fed and steady each time the clock moves. */
const tend = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
/** Played by the clock six hours at a time, passing commitments as a jump with no player passes them. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** Played as a player plays: each jump six hours at most, every commitment on the way stopped at and gone to with Go. */
function jump(sim: Simulation, until: number): ScheduledItem[] {
  const stops: ScheduledItem[] = [];
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    while (r.interruptedBy) {
      stops.push(r.interruptedBy);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
  return stops;
}
const reload = (sim: Simulation, showcase = false): Simulation => working(loadSave(deserialise(serialise(sim.universe)) as never), showcase);
const titles = (sim: Simulation, from: number) => sim.universe.notifications.filter((n) => n.at >= from).map((n) => n.title);
const notice = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).at(-1);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind).sort((a, b) => a.at - b.at);
const course793 = (sim: Simulation, term = 5) => sim.player.school!.courses![`${term}:${SHOWCASE_COURSE}`]!;
/** The table work answered the way the text supports, through the command a player presses. */
function answer(sim: Simulation, a: Assignment): void {
  for (const { q, options } of questionsFor(a)) {
    const ok = sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
    expect(ok.ok, `${q.id}: ${ok.error}`).toBe(true);
  }
}

/** The screen at a route and tab: the words a player sees, every tooltip taken out before the tags. */
function shown(sim: Simulation, route: string, tab: string): string {
  h.sim = sim;
  h.tab = tab;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route })).replace(/<!-- -->/g, '');
  return html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

// One life played to the morning its last term began (Monday 8 January 2029, the School's term handler at nine), kept,
// and opened afresh for each journey that starts there: the same life, so each is one choice apart.
let FINAL = '';
let PLAYED_TO = 0;
beforeAll(() => {
  const sim = working(life('showcase-final'));
  play(sim, at(2029, 1, 8, 12));
  PLAYED_TO = sim.now;
  FINAL = serialise(sim.universe);
}, 120_000);
const finalTerm = (showcase = false) => working(loadSave(deserialise(FINAL) as never), showcase);

describe('the Actor Showcase, on the calendar', () => {
  it('PLAYER JOURNEY: the last term begins its showcase: the fourth week’s check, eight rehearsal calls and the three days, at 2029’s own dates, each a School call from New Haven with its trip inside its hours', () => {
    const sim = finalTerm();
    expect(sim.player.school!.termsBegun).toBe(6);
    const sc = sim.player.pro!.showcase!;
    expect(sc.term).toBe(5);
    expect(sc.eligible).toBeUndefined();
    expect(sc.options).toHaveLength(2 * SHOWCASE.offered);
    const [check] = pending(sim, SHOWCASE_CHECK_KIND);
    // The term began on Monday January 8, 2029: its fourth week's Friday at five.
    expect(check!.at).toBe(at(2029, 2, 2, 17));
    expect(check!.requiresPlayer).toBe(false);
    const calls = pending(sim, SHOWCASE_KIND);
    const rehearsals = calls.filter((i) => i.payload.call === 'rehearsal');
    expect(rehearsals.map((i) => i.at)).toEqual([17, 18, 19, 20, 24, 25, 26, 27].map((d) => at(2029, 4, d, 15)));
    expect(rehearsals.every((i) => i.durationMinutes === 180 && i.label === 'Actor Showcase Rehearsal')).toBe(true);
    const days = calls.filter((i) => i.payload.call === 'showcase');
    // Spring classes end Friday April 27, 2029; Commencement is Monday May 21.
    expect(days.map((i) => [i.label, i.at, i.durationMinutes])).toEqual([
      ['The Actor Showcase In New York', at(2029, 4, 30, 13), 600],
      ['The Actor Showcase In New York', at(2029, 5, 1, 9), 480],
      ['The Actor Showcase In Los Angeles', at(2029, 5, 8, 7), 1440],
    ]);
    expect(days.map((i) => i.payload.city)).toEqual([NEW_YORK, NEW_YORK, LOS_ANGELES]);
    for (const i of calls) {
      expect(i.requiresPlayer).toBe(true);
      expect(i.travelMinutes).toBe(0);
      expect(i.locationId).toBe(YALE_DRAMA.cityId);
      expect(i.category).toBe('school');
    }
    expect(notice(sim, 'The Actor Showcase')!.body).toBe('Your last term ends with the Actor Showcase: two scenes you choose and rehearse, which the Bulletin says are presented to agents, managers and casting directors. You play them in New York on April 30 and May 1, and in Los Angeles on May 8. Choose your two scenes by Friday, February 2, 2029, under The Actor Showcase on the School’s Coursework tab. To take part, you need every Incomplete made up by then.');
  });

  it('PLAYER JOURNEY: a student a year behind after a year’s leave has the showcase at 2030’s own dates, from that year’s calendar, after its classes and before its Commencement', () => {
    const sim = working(life('showcase-2030'));
    play(sim, at(2027, 5, 3, 10));
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'personal', terms: 2 } }).ok).toBe(true);
    play(sim, at(2028, 6, 1, 10));
    expect(sim.execute({ kind: 'school.return_notice', payload: {} }).ok).toBe(true);
    play(sim, at(2028, 8, 28, 10));
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).ok).toBe(true);
    play(sim, at(2030, 1, 7, 12));
    const school = sim.player.school!;
    expect(school.offset).toBe(2);
    expect(school.termsBegun).toBe(8);
    expect(sim.player.pro!.showcase!.term).toBe(7);
    expect(pending(sim, SHOWCASE_CHECK_KIND).map((i) => i.at)).toEqual([at(2030, 2, 1, 17)]);
    const calls = pending(sim, SHOWCASE_KIND);
    expect(calls.filter((i) => i.payload.call === 'rehearsal').map((i) => i.at)).toEqual([16, 17, 18, 19, 23, 24, 25, 26].map((d) => at(2030, 4, d, 15)));
    expect(calls.filter((i) => i.payload.call === 'showcase').map((i) => i.at)).toEqual([at(2030, 4, 29, 13), at(2030, 4, 30, 9), at(2030, 5, 7, 7)]);
    // The rule is the calendar's, not a year's: 2029's and 2030's from the same terms.
    expect(showcaseCalendar(5).days.map((d) => d.key)).toEqual(['2029-04-30', '2029-05-01', '2029-05-08']);
    expect(showcaseCalendar(7).days.map((d) => d.key)).toEqual(['2030-04-29', '2030-04-30', '2030-05-07']);
    play(sim, at(2030, 5, 21, 12));
    expect(school.standing).toBe('graduated');
    // After the last class (April 26) and before Commencement (May 20).
    expect(school.endedAt).toBe(at(2030, 5, 20, 10));
    expect(sim.player.pro!.showcase!.performed.map((p) => p.at)).toEqual([at(2030, 4, 29, 13), at(2030, 4, 29, 13), at(2030, 4, 30, 9), at(2030, 4, 30, 9), at(2030, 5, 7, 7), at(2030, 5, 7, 7)]);
  }, 120_000);
});

describe('taking part', () => {
  /** TEST SETUP: the fall's Acting III made Incomplete, as its review leaves one ill for too much of it, and given its month more. */
  const incomplete = (sim: Simulation) => {
    const r = Object.values(sim.player.school!.courses!).find((x) => x.term === 4 && x.code === 'DRAM 303a')!;
    Object.assign(r, { result: 'incomplete', owed: 2, madeUp: 0, dueBy: at(2029, 2, 9, 17), extended: true });
    return r;
  };

  it('PLAYER JOURNEY: an Incomplete still open at the end of the fourth week keeps her out, said in the notice, the refusal and the showcase panel; made up in time, the same student is in, her scenes the faculty’s first two', () => {
    const out = finalTerm();
    incomplete(out);
    const inn = reload(out);
    // Out: the Incomplete left open.
    expect(shown(out, '/workspace/school', 'coursework')).toContain('To take part, make up every Incomplete by Friday, February 2, 2029, the end of the term’s fourth week. Acting III is still incomplete: make it up on the Standing And Craft tab.');
    play(out, at(2029, 2, 3, 9));
    const sc = out.player.pro!.showcase!;
    expect(sc.eligible).toBe(false);
    expect(sc.outstanding).toEqual(['Acting III']);
    expect(pending(out, SHOWCASE_KIND)).toEqual([]);
    expect(notice(out, 'Not In The Actor Showcase')!.body).toBe('Acting III was still incomplete at the end of the term’s fourth week, and the Bulletin keeps a student with an Incomplete outstanding out of the Actor Showcase. Its calls are off your calendar, and Actor Showcase is settled at the term review with your other courses. Make up what’s still incomplete on the Standing And Craft tab: an Incomplete still open at Commencement keeps you out of it too, and holds the degree.');
    expect(choiceRefusal(out, out.player)).toBe('You can’t take part in the Actor Showcase: Acting III was still incomplete at the end of the term’s fourth week.');
    expect(out.execute({ kind: 'school.choose_showcase', payload: { options: sc.options!.slice(0, 3).filter((_, i) => i !== 1).map((o) => `${o.scene}:${o.role}`) } }).error).toBe('You can’t take part in the Actor Showcase: Acting III was still incomplete at the end of the term’s fourth week.');
    expect(shown(out, '/workspace/school', 'coursework')).toContain('You’re not in it. Acting III was still incomplete at the end of the term’s fourth week, and the Bulletin keeps a student with an Incomplete outstanding out of the Actor Showcase. Its calls are off your calendar.');
    // Kept out, the course is settled at the term review with the rest, not held for a showcase she isn't in.
    play(out, at(2029, 4, 28, 9));
    expect(course793(out).result).toBe('pass');

    // In: the same student makes it up, two sessions with its teachers, before the end of the fourth week.
    play(inn, at(2029, 1, 21, 10));
    for (let n = 0; n < 2; n += 1) { const r = inn.execute({ kind: 'school.make_up', payload: { key: '4:DRAM 303a' } }); expect(r.ok, r.error).toBe(true); }
    play(inn, at(2029, 2, 3, 9));
    const sc2 = inn.player.pro!.showcase!;
    expect(sc2.eligible).toBe(true);
    expect(sc2.scenes.map((s) => [s.id, s.role, s.by])).toEqual(sc2.options!.filter((o, i, all) => all.findIndex((x) => x.scene === o.scene) === i).slice(0, 2).map((o) => [o.scene, o.role, 'faculty']));
    expect(pending(inn, SHOWCASE_KIND)).toHaveLength(11);
    const pieces = showcasePieces(inn, inn.player);
    expect(notice(inn, 'You’re In The Actor Showcase')!.body).toBe(`No course was incomplete at the end of the term’s fourth week, so you take part in the Actor Showcase. You hadn’t chosen your scenes, so the faculty chose the two their notes put first. Your scenes: ${pieces.map((a) => `${sceneById(a.sceneId!)!.roles[a.role!].name} in ${sceneById(a.sceneId!)!.play}`).join(' and ')}. Prepare them on the Coursework tab: they’re due in New York on April 30. The course’s rehearsal calls begin on April 17.`);
  }, 120_000);
});

describe('choosing the scenes', () => {
  it('refuses a choice before the last term, of the wrong count, of a scene the course didn’t offer and of one scene twice, leaving the save as it was; takes two of its options as pieces of the course due in New York; and refuses a second choice', () => {
    const first = life('showcase-first-year');
    expect(first.execute({ kind: 'school.choose_showcase', payload: { options: [] } }).error).toBe('The Actor Showcase is in your last spring term.');
    const sim = finalTerm();
    const options = sim.player.pro!.showcase!.options!.map((o) => `${o.scene}:${o.role}`);
    const before = serialise(sim.universe);
    const refused: [string[], string][] = [
      [[], 'Choose two scenes.'],
      [[options[0]!], 'Choose two scenes: you’ve chosen one.'],
      [[options[0]!, options[2]!, options[4]!], 'Choose two scenes: you’ve chosen three.'],
      [[options[0]!, 'not-a-scene:0'], 'That scene isn’t one of the course’s options.'],
      [[options[0]!, 'seagull-4:2'], 'That scene isn’t one of the course’s options.'],
      [[options[0]!, options[1]!], 'Choose two different scenes.'],
    ];
    for (const [picks, why] of refused) {
      // The words the panel says under its button before it's pressed are the command's own.
      expect(choiceRefusal(sim, sim.player, picks)).toBe(why);
      const r = sim.execute({ kind: 'school.choose_showcase', payload: { options: picks } });
      expect(r.ok).toBe(false);
      expect(r.error).toBe(why);
      expect(serialise(sim.universe)).toBe(before);
    }
    const r = sim.execute({ kind: 'school.choose_showcase', payload: { options: [options[0]!, options[3]!] } });
    expect(r.ok, r.error).toBe(true);
    const pieces = showcasePieces(sim, sim.player);
    expect(pieces.map((a) => a.id)).toEqual((r.value as { assignments: string[] }).assignments);
    expect(pieces.map((a) => `${a.sceneId}:${a.role}`)).toEqual([options[0], options[3]]);
    for (const a of pieces) {
      expect(a).toMatchObject({ course: SHOWCASE_COURSE, template: 'showcase-scene', term: 5, dueOn: '2029-04-30', status: 'open' });
      expect(a.partner).toBeDefined();
    }
    expect(pieces[0]!.partner).not.toBe(pieces[1]!.partner);
    expect(sim.player.pro!.showcase!.scenes.map((s) => [s.id, s.role, s.by, s.assignmentId])).toEqual(pieces.map((a) => [a.sceneId, a.role, 'you', a.id]));
    const again = sim.execute({ kind: 'school.choose_showcase', payload: { options: [options[4]!, options[6]!] } });
    expect(again.error).toBe(`Your scenes are chosen: ${pieces.map((a) => sceneById(a.sceneId!)!.play).join(' and ')}.`);
  });

  it('shows the faculty’s options on the Coursework tab, each scene with its note and each part with what the record holds of it, and Choose These Scenes with the reason it can’t be pressed yet', () => {
    const sim = finalTerm();
    const text = shown(sim, '/workspace/school', 'coursework');
    expect(text).toContain('The Actor Showcase');
    expect(text).toContain('Monday, April 30, 2029, from 1 PM to 11 PM, for the showings at 5 PM and 7:30 PM; and Tuesday, May 1, 2029, from 9 AM to 5 PM, for the showing at 1 PM.');
    expect(text).toContain('Tuesday, May 8, 2029, from 7 AM to the next morning, for the showings at 1 PM, 4:30 PM and 7 PM Pacific time.');
    expect(text).toContain('Tuesday to Friday from 3 PM for three hours, April 17 to April 27, 2029.');
    for (const o of showcaseOptions(sim, sim.player)) {
      expect(text).toContain(o.sceneNote);
      expect(text).toContain(`You play ${o.part}, opposite ${o.other}.`);
      if (o.partNote) expect(text).toContain(o.partNote);
    }
    expect(text).toContain('Choose These Scenes');
    expect(text).toContain('Choose These Scenes Not now: Choose two scenes.');
  });

  it('GUARD: the faculty’s options follow the record: comedy known well moves a comedy onto the shortlist, and its note says so', () => {
    // TEST SETUP: the same life the morning before its last term began, once knowing no comedy and once knowing it well.
    const sim = working(life('showcase-final'));
    play(sim, at(2029, 1, 8, 8));
    const knows = reload(sim);
    sim.player.engagement!.byGenre.comedy = { familiarity: 0, practice: 0 };
    knows.player.engagement!.byGenre.comedy = { familiarity: 100, practice: 0 };
    play(sim, at(2029, 1, 8, 12));
    play(knows, at(2029, 1, 8, 12));
    const comedies = (s: Simulation) => showcaseOptions(s, s.player).filter((o) => o.scene.genre === 'comedy');
    expect(comedies(sim)).toEqual([]);
    expect(comedies(knows).length).toBeGreaterThan(0);
    expect(comedies(knows)[0]!.sceneNote).toMatch(/is a comedy, a genre you know well\. Fully prepared, it would come to about \d+ of 100 for you, (Unready|Working|Strong|Exceptional)\./);
  }, 120_000);
});

describe('the showcase, played', () => {
  // One life's last term, its two scenes chosen on its first day, each read and its table work answered, played by the
  // clock to the evening before New York: prepared by those steps and the rehearsal calls alone.
  let EVE = '';
  beforeAll(() => {
    const sim = finalTerm();
    const options = sim.player.pro!.showcase!.options!;
    expect(sim.execute({ kind: 'school.choose_showcase', payload: { options: [`${options[0]!.scene}:${options[0]!.role}`, `${options[2]!.scene}:${options[2]!.role}`] } }).ok).toBe(true);
    jump(sim, at(2029, 1, 14, 10));
    for (const a of showcasePieces(sim, sim.player)) {
      const read = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
      expect(read.ok, read.error).toBe(true);
      answer(sim, a);
    }
    jump(sim, at(2029, 4, 29, 20));
    EVE = serialise(sim.universe);
  }, 120_000);
  const eve = (showcase = false) => working(loadSave(deserialise(EVE) as never), showcase);

  it('PLAYER JOURNEY: from the last term’s first day to the morning after Commencement: chosen, in, rehearsed, held past the term review, judged in New York and Los Angeles, passed, conferred, every record carried', () => {
    const sim = finalTerm(true);
    const from = PLAYED_TO - 4 * MS_HOUR;
    const options = sim.player.pro!.showcase!.options!;
    expect(sim.execute({ kind: 'school.choose_showcase', payload: { options: [`${options[0]!.scene}:${options[0]!.role}`, `${options[2]!.scene}:${options[2]!.role}`] } }).ok).toBe(true);
    jump(sim, at(2029, 1, 16, 10));
    for (const a of showcasePieces(sim, sim.player)) answer(sim, a);
    const stops = jump(sim, at(2029, 4, 29, 20));
    // The rehearsal calls stopped the clock, and were gone to: both scenes worked on their feet with their partners.
    const called = stops.filter((i) => i.kind === SHOWCASE_KIND);
    expect(called.map((i) => i.at)).toEqual([17, 18, 19, 20, 24, 25, 26, 27].map((d) => at(2029, 4, d, 15)));
    expect(called.map((i) => i.status)).toEqual(Array(8).fill('done'));
    // The term review on April 27 settled every course but this one, held for its showcase.
    expect(sim.player.school!.history.at(-1)!.term).toBe(5);
    expect(Object.values(sim.player.school!.courses!).filter((r) => r.term === 5 && r.result === undefined).map((r) => r.code)).toEqual([SHOWCASE_COURSE]);
    const work = sim.player.work!.length;
    const tallied = journeyOf(sim.player).totals.scene!.n;
    jump(sim, at(2029, 5, 9, 12));
    const sc = sim.player.pro!.showcase!;
    const pieces = showcasePieces(sim, sim.player);
    expect(sc.eligible).toBe(true);
    // Each scene judged at each day, in the work record and the journey and on the professional record.
    expect(sc.performed.map((p) => [p.scene, p.city, p.at])).toEqual([
      [pieces[0]!.sceneId, NEW_YORK, at(2029, 4, 30, 13)], [pieces[1]!.sceneId, NEW_YORK, at(2029, 4, 30, 13)],
      [pieces[0]!.sceneId, NEW_YORK, at(2029, 5, 1, 9)], [pieces[1]!.sceneId, NEW_YORK, at(2029, 5, 1, 9)],
      [pieces[0]!.sceneId, LOS_ANGELES, at(2029, 5, 8, 7)], [pieces[1]!.sceneId, LOS_ANGELES, at(2029, 5, 8, 7)],
    ]);
    const keys = sim.player.work!.slice(-6).map((w) => w.inputs.key);
    for (const a of pieces) {
      expect(keys).toContain(`show:${sim.player.id}:${a.id}:2029-04-30`);
      expect(keys).toContain(`showcase:${sim.player.id}:${a.id}:2029-05-01`);
      expect(keys).toContain(`reshow:${sim.player.id}:${a.id}:2029-05-08`);
      // Shown with the course's note at its first day, and shown again with the note taken or not in Los Angeles.
      expect(a.feedback!.course).toBe('Actor Showcase');
      expect(a.revision!.band).toBe(sc.performed.find((p) => p.scene === a.sceneId && p.city === LOS_ANGELES)!.band);
      expect(a.status).toBe('done');
    }
    expect(sim.player.work!.length).toBe(Math.min(160, work + 6));
    expect(journeyOf(sim.player).totals.scene!.n).toBe(tallied + 6);
    for (const p of sc.performed) expect(p.overall).toBeGreaterThan(0);
    // Settled after Los Angeles, on its meetings and its pieces, and passed.
    expect(course793(sim).result).toBe('pass');
    jump(sim, at(2029, 5, 22, 9));
    // The notices, in the order the player reads them.
    const said = titles(sim, from).filter((t) => /Actor Showcase|Term \d{4} Begins|Good Standing|Academic|MFA/.test(t));
    expect(said).toEqual(['Spring Term 2029 Begins', 'The Actor Showcase', 'You’re In The Actor Showcase', 'In Good Standing', 'The Actor Showcase In New York', 'The Actor Showcase In New York', 'The Actor Showcase In Los Angeles', 'Your MFA Is Conferred']);
    const ny = sim.universe.notifications.filter((n) => n.title === 'The Actor Showcase In New York');
    expect(ny[0]!.body).toMatch(/^You played your two scenes at the showcase in New York\. .+: (Unready|Working|Strong|Exceptional), \d+ of 100\. .+: (Unready|Working|Strong|Exceptional), \d+ of 100\. The faculty’s notes are on each scene’s card on the Coursework tab\. Work on them before Los Angeles, where they’re shown again with the note taken\. You play them again in New York on May 1\.$/);
    expect(ny[1]!.body).toMatch(/You play them again in Los Angeles on May 8\.$/);
    expect(notice(sim, 'The Actor Showcase In Los Angeles')!.body).toMatch(/ You passed Actor Showcase\.$/);
    // The degree, and what carries on with it: nothing of the showcase or the School's record reset.
    expect(sim.player.school!.standing).toBe('graduated');
    expect(sim.player.pro!.equity).toEqual({ since: at(2029, 5, 21, 10), how: 'degree' });
    expect(pathwayOf(sim.player).id).toBe('graduate');
    expect(sim.player.pro!.showcase).toEqual(sc);
    expect(courseworkOf(sim, sim.player)!.assignments.filter((a) => a.course === SHOWCASE_COURSE).map((a) => a.status)).toEqual(['done', 'done']);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('PLAYER JOURNEY: the same scenes on the same seed, prepared fully against left as the rehearsal calls left them: the prepared ones come out higher in New York, and a band higher (change the preparation, the band moves)', () => {
    const left = eve(false);
    const ready = eve(false);
    // TEST SETUP: every part of both scenes prepared, as a student who did every step would have them.
    for (const a of showcasePieces(ready, ready.player)) for (const d of PREP_DIMS) a.prep[d] = 0.95;
    jump(left, at(2029, 4, 30, 23, 30));
    jump(ready, at(2029, 4, 30, 23, 30));
    const ny = (s: Simulation) => s.player.pro!.showcase!.performed.filter((p) => p.city === NEW_YORK);
    const RANK = { unready: 0, working: 1, strong: 2, exceptional: 3 } as const;
    expect(ny(left)).toHaveLength(2);
    for (let i = 0; i < 2; i += 1) {
      expect(ny(ready)[i]!.overall!).toBeGreaterThan(ny(left)[i]!.overall! + 10);
      expect(RANK[ny(ready)[i]!.band!]).toBeGreaterThan(RANK[ny(left)[i]!.band!]);
    }
    expect(ready.player.pro!.showcase!.scenes[0]!.prep!).toBeGreaterThan(left.player.pro!.showcase!.scenes[0]!.prep!);
  }, 120_000);

  it('PLAYER JOURNEY: a showcase day missed is a missed call of the course: unseen in New York, counted, played the next day and again in Los Angeles; ill, it’s excused; every day missed and the course isn’t passed, nor the degree awarded', () => {
    const one = eve();
    const tally = { ...one.player.school!.tally };
    const meetings = { ...course793(one) };
    // TEST SETUP: in New York already, away from the School's call in New Haven at one.
    play(one, at(2029, 4, 30, 12));
    one.player.currentLocationId = NEW_YORK;
    play(one, at(2029, 4, 30, 14));
    one.player.currentLocationId = YALE_DRAMA.cityId;
    expect(one.player.pro!.showcase!.missed).toEqual([{ city: NEW_YORK, at: at(2029, 4, 30, 13), excused: false }]);
    expect(notice(one, 'You Missed The Actor Showcase In New York')!.body).toBe('You weren’t at the School’s call for the showcase in New York, so your scenes weren’t seen there. It counts as a missed call, and as an unexcused absence from Actor Showcase. Your scenes are next due in New York on May 1.');
    expect(one.player.school!.tally.calls).toBe(tally.calls + 1);
    expect(one.player.school!.tally.answered).toBe(tally.answered);
    expect(course793(one).meetings).toBe(meetings.meetings + 1);
    expect(course793(one).attended).toBe(meetings.attended);
    jump(one, at(2029, 5, 9, 12));
    const sc = one.player.pro!.showcase!;
    expect(sc.performed.map((p) => p.at)).toEqual([at(2029, 5, 1, 9), at(2029, 5, 1, 9), at(2029, 5, 8, 7), at(2029, 5, 8, 7)]);
    for (const a of showcasePieces(one, one.player)) expect([a.shown!.at, a.revision!.dueOn, a.status]).toEqual([at(2029, 5, 1, 9), '2029-05-08', 'done']);
    expect(course793(one).result).toBe('pass');

    // Ill: in hospital through New York's first day (TEST SETUP), and excused.
    const ill = eve();
    play(ill, at(2029, 4, 30, 12));
    ill.player.health!.inHospitalUntil = at(2029, 4, 30, 18);
    play(ill, at(2029, 4, 30, 19));
    expect(ill.player.pro!.showcase!.missed).toEqual([{ city: NEW_YORK, at: at(2029, 4, 30, 13), excused: true }]);
    expect(notice(ill, 'Excused: The Actor Showcase In New York')!.body).toBe('You were ill, so you’re excused from the showcase in New York, and it isn’t held against you. Your scenes weren’t seen there. Your scenes are next due in New York on May 1.');
    expect(course793(ill).excused).toBe(meetings.excused + 1);

    // Every day missed (TEST SETUP: in New York at each call's hour): no scene seen anywhere, the course not passed.
    const none = eve();
    for (const d of showcaseCalendar(5).days) {
      play(none, d.at - MS_HOUR);
      none.player.currentLocationId = NEW_YORK;
      play(none, d.at + MS_HOUR);
      none.player.currentLocationId = YALE_DRAMA.cityId;
    }
    expect(none.player.pro!.showcase!.performed).toEqual([]);
    expect(showcasePieces(none, none.player).map((a) => a.status)).toEqual(['missed', 'missed']);
    expect(course793(none)).toMatchObject({ result: 'fail', why: '2 of its 2 pieces weren’t shown' });
    expect(notice(none, 'You Missed The Actor Showcase In Los Angeles')!.body).toBe('You weren’t at the School’s call for the showcase in Los Angeles, so your scenes weren’t seen there. It counts as a missed call, and as an unexcused absence from Actor Showcase. A scene played at no showcase day counts as a piece not shown, and a course with half its pieces not shown isn’t passed. You didn’t pass Actor Showcase: 2 of its 2 pieces weren’t shown. The degree needs every course passed, so it can’t be awarded at Commencement.');
    play(none, at(2029, 5, 22, 9));
    expect(none.player.school!.standing).toBe('withheld');
    expect(notice(none, 'The Degree Isn’t Recommended')!.body).toContain('Actor Showcase wasn’t.');
  }, 120_000);

  it('PLAYER JOURNEY: saved and opened again between New York and Los Angeles, the showcase goes on with nothing judged twice: the same performances, records, notes and course as a life never reopened', () => {
    const kept = eve();
    jump(kept, at(2029, 5, 2, 12));
    const reopened = reload(kept);
    const twice = reload(reopened);
    jump(kept, at(2029, 5, 9, 12));
    jump(twice, at(2029, 5, 9, 12));
    expect(twice.player.pro!.showcase).toEqual(kept.player.pro!.showcase);
    expect(twice.player.pro!.showcase!.performed).toHaveLength(6);
    expect(twice.player.work).toEqual(kept.player.work);
    const keys = twice.player.work!.map((w) => w.inputs.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(twice.player.journey).toEqual(kept.player.journey);
    expect(courseworkOf(twice, twice.player)!.notes).toEqual(courseworkOf(kept, kept.player)!.notes);
    expect(course793(twice)).toEqual(course793(kept));
    expect(twice.universe.notifications.filter((n) => n.title === 'The Actor Showcase In Los Angeles')).toHaveLength(1);
    expect(breaches(twice.universe)).toEqual([]);
  }, 120_000);
});

describe('an older save', () => {
  /** TEST SETUP: the save as a build before 2026-10-21 wrote it, at a moment of its last term: no showcase, no step for it, none of its calls. */
  const older = (sim: Simulation) => {
    const u = deserialise(serialise(sim.universe)) as typeof sim.universe;
    delete u.people[u.playerId]!.pro!.showcase;
    u.opened = (u.opened ?? []).filter((x) => x !== 'showcase.begun');
    u.scheduled = u.scheduled.filter((i) => i.kind !== SHOWCASE_KIND && i.kind !== SHOWCASE_CHECK_KIND);
    return u;
  };

  it('PLAYER JOURNEY: a save from before the showcase, in its last term, opens onto it once: before the fourth week its choice is open; after it, the School has read the Incompletes and the faculty have chosen', () => {
    const early = finalTerm();
    play(early, at(2029, 1, 22, 12));
    const opened = loadSave(older(early));
    expect(opened.universe.opened).toContain('showcase.begun');
    const sc = opened.player.pro!.showcase!;
    expect([sc.term, sc.eligible, sc.scenes, sc.options!.length]).toEqual([5, undefined, [], 2 * SHOWCASE.offered]);
    expect(pending(opened, SHOWCASE_CHECK_KIND).map((i) => i.at)).toEqual([at(2029, 2, 2, 17)]);
    expect(pending(opened, SHOWCASE_KIND)).toHaveLength(11);
    expect(notice(opened, 'The Actor Showcase')!.at).toBe(opened.now);
    expect(choiceRefusal(opened, opened.player, [])).toBe('Choose two scenes.');
    // A second opening builds nothing again.
    const again = loadSave(deserialise(serialise(opened.universe)) as never);
    expect(again.player.pro!.showcase).toEqual(sc);
    expect(again.universe.scheduled.filter((i) => i.kind === SHOWCASE_KIND || i.kind === SHOWCASE_CHECK_KIND)).toHaveLength(12);

    const late = finalTerm();
    play(late, at(2029, 3, 5, 12));
    const after = loadSave(older(late));
    const sc2 = after.player.pro!.showcase!;
    expect(sc2.eligible).toBe(true);
    expect(sc2.scenes.map((s) => s.by)).toEqual(['faculty', 'faculty']);
    expect(pending(after, SHOWCASE_CHECK_KIND)).toEqual([]);
    expect(pending(after, SHOWCASE_KIND)).toHaveLength(11);
    expect(titles(after, after.now).filter((t) => /Actor Showcase/.test(t))).toEqual(['The Actor Showcase', 'You’re In The Actor Showcase']);
    play(after, at(2029, 5, 9, 12));
    expect(after.player.pro!.showcase!.performed).toHaveLength(6);
    expect(breaches(after.universe)).toEqual([]);
  }, 120_000);
});

describe('graduating early', () => {
  it('says the Bulletin’s sentence, and that the game offers no early degree, on the School’s Terms And Award and in the Career’s The Way You’re On; and no degree comes before the sixth term', () => {
    const sim = life('showcase-early');
    play(sim, at(2026, 9, 2, 12));
    const terms = shown(sim, '/workspace/school', 'terms');
    const career = shown(sim, '/workspace/career', 'overview');
    for (const text of [terms, career]) {
      expect(text).toContain(EARLY_DEGREE.words);
      expect(text).toContain(`“${EARLY_DEGREE.quote.replace(/\.$/, '')},”`);
    }
    expect(terms).toContain('Finishing Early');
    expect(pathwayOf(sim.player).words).toBe(`Year one of the MFA: the degree comes at Commencement after your sixth term, and everything on your record goes on with you. ${EARLY_DEGREE.words}`);
    // The degree is the sixth term's: none before it.
    const final = finalTerm();
    expect(final.player.school!.standing).toBe('good');
    expect(final.universe.scheduled.filter((i) => i.kind === 'school.commencement' || i.kind === 'school.conferral')).toEqual([]);
  });
});
