/**
 * Brief 17's school area (2026-10-20, the owner's "Final Comprehensive Writing And Continuity Pass", sections 3 and 8): the
 * claims its edit added or corrected, each read where the player meets it, each run with the claim taken out and failed.
 *
 * - Several Incompletes from one review are told in one notice, and reminded in one, with each course and its sessions.
 * - The term review says what fell short first, with the minimum it fell under.
 * - The term review names the part most often left unfinished with its count of the pieces shown Unready, never "most".
 * - A part the School casts by size is said in lower case, a Rep understudy's role and play are named, and the Rep's
 *   slot isn't called "Yale Rep’s" twice; an understudy of the company goes on "at Yale Rep", and a matinee is today.
 * - A leave length's reason is said once on the panel, with what's left of the three terms.
 * - Once the School has ended, the Classes tab says so, Terms And Award lists the terms begun, and the Standing tab
 *   leaves out the rules for terms to come.
 * - A term's notice says its classes and its review before the money; the welcome says orientation is on the calendar.
 * - The missed-classes notice names Call In Sick on the Classes tab, and the hour.
 * - The Casting tab says a size of part once for the class's others in it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { coursesOf, settleCourses } from '@/engine/systems/courserecord';
import { CALL_KIND, classPeriod, evaluate, goesOn, repNamed, tonight } from '@/engine/systems/school';
import { ORIENTATION_KIND, courseworkOf, termTally } from '@/engine/systems/coursework';
import { leaveLengths } from '@/engine/systems/leave';
import { PREP_DIMS } from '@/engine/content/coursework';
import { YALE_DRAMA } from '@/engine/content/school';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { DIMENSION_LABEL } from '@/engine/content/tasks';
import { genreState } from '@/engine/systems/engagement';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
}));

// The School screen's kept tab: the store it's kept in has no server snapshot to render from.
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
const { LeavePanel } = await import('@/ui/components/StudyPlanPanels');
const { BriefPane } = await import('@/ui/components/BriefPane');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
/** TEST SETUP: a student who does the coursework, its every part prepared each midnight, so the fall review keeps them in good standing for the Rep (tests/school.test.ts's). */
const working = (sim: Simulation) => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => { for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); }); return sim; };
/** A screen as the player has it, its tags taken out. */
const drawn = (sim: Simulation, screen: FunctionComponent, tab = 'standing') => { h.sim = sim; h.tab = tab; return renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };

describe('Incompletes from one review', () => {
  it('are told in one notice with each course’s sessions and the shared date, and reminded in one, a week before it', () => {
    const sim = student('ed17-incompletes');
    tended(sim, at(2026, 9, 14, 12));
    // TEST SETUP: a term's courses written onto the record, each ill for half its meetings, settled as the review settles them.
    const courses = coursesOf(sim.player.school!);
    courses['0:DRAM 103a'] = { term: 0, academic: 0, code: 'DRAM 103a', name: 'Acting I', meetings: 8, attended: 4, excused: 4 };
    courses['0:DRAM 113a'] = { term: 0, academic: 0, code: 'DRAM 113a', name: 'Voice I', meetings: 12, attended: 6, excused: 6 };
    const before = sim.universe.notifications.length;
    settleCourses(sim, sim.player, 0, () => ({ due: 0, notShown: 0 }));
    const said = sim.universe.notifications.slice(before);
    const due = formatDate(courses['0:DRAM 103a']!.dueBy!, sim.zone);
    expect(courses['0:DRAM 103a']).toMatchObject({ result: 'incomplete', owed: 2 });
    expect(courses['0:DRAM 113a']).toMatchObject({ result: 'incomplete', owed: 3 });
    expect(said.map((n) => n.title)).toEqual(['Incompletes In Two Courses']);
    expect(said[0]!.body).toBe(`You were ill or hurt for too many of their classes to pass two courses yet, so each is an Incomplete for now. To complete them, make up five sessions with their teachers by ${due}, each covering a week of its course: Acting I (two) and Voice I (three). Press Make Up A Session beside each on the Standing And Craft tab. If you need longer for one, press Ask For A Month More beside it, once. A course not made up in time becomes a Permanent Incomplete: no credit, and the degree can’t be completed without it.`);
    // A session made up on one, after the day's classes: the week's reminder counts what's left of each, once.
    tended(sim, at(2026, 9, 14, 18));
    expect(sim.must<{ madeUp: number }>({ kind: 'school.make_up', payload: { key: '0:DRAM 113a' } }).madeUp).toBe(1);
    tended(sim, courses['0:DRAM 103a']!.dueBy! - 7 * MS_DAY + MS_HOUR);
    expect(titled(sim, 'A Week Left: Acting I')).toHaveLength(0);
    expect(titled(sim, 'A Week Left: Voice I')).toHaveLength(0);
    expect(titled(sim, 'A Week Left: Two Incompletes').map((n) => n.body)).toEqual([`You still have four make-up sessions to do, by ${due}: Acting I (two) and Voice I (two). Press Make Up A Session beside each on the Standing And Craft tab. If you need longer for one, press Ask For A Month More beside it.`]);
  }, 120_000);

  it('one alone is told as it was, ill or hurt', () => {
    const sim = student('ed17-incomplete');
    tended(sim, at(2026, 9, 14, 12));
    const courses = coursesOf(sim.player.school!);
    courses['0:DRAM 103a'] = { term: 0, academic: 0, code: 'DRAM 103a', name: 'Acting I', meetings: 8, attended: 4, excused: 4 };
    settleCourses(sim, sim.player, 0, () => ({ due: 0, notShown: 0 }));
    expect(titled(sim, 'Incomplete: Acting I').map((n) => n.body)).toEqual([`You were ill or hurt for 4 of its 8 classes, so it’s an Incomplete for now. To complete it, make up two sessions with its teachers by ${formatDate(courses['0:DRAM 103a']!.dueBy!, sim.zone)}, each covering a week of the course: press Make Up A Session on the Standing And Craft tab. If you need longer, press Ask For A Month More, once. If it isn’t made up in time, it becomes a Permanent Incomplete: no credit, and the degree can’t be completed without it.`]);
  }, 120_000);
});

describe('the term review’s words', () => {
  it('say what fell short first, with the minimum it fell under: attendance under 90%, and a grave breach', () => {
    const sim = student('ed17-review');
    // Before any piece is shown, so the coursework counts for nothing either way.
    tended(sim, at(2026, 8, 30, 12));
    const school = sim.player.school!;
    // TEST SETUP: the term's tally as staying away leaves it, then the review as the term's end runs it (tests/language-dynamic.test.ts's).
    Object.assign(school.tally, { classDays: 40, excused: 0, attended: 20, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 0 });
    evaluate(sim, sim.player, 0);
    const concern = sim.universe.notifications.at(-1)!;
    expect(concern.title).toBe('A Notice Of Academic Concern');
    expect(concern.body.startsWith('The chair of Acting has raised a concern about your work. You came to 50% of the classes, calls and shifts asked of you. That’s under the 90% the program asks. Your craft grew ')).toBe(true);
    // A grave breach with every class attended: the breach, then the attendance that met its minimum.
    const twin = student('ed17-review-breach');
    tended(twin, at(2026, 8, 30, 12));
    Object.assign(twin.player.school!, { standing: 'warning' });
    Object.assign(twin.player.school!.tally, { classDays: 40, excused: 0, attended: 40, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 1 });
    const review = evaluate(twin, twin.player, 0)!;
    expect(review.reason.startsWith('A grave breach of professionalism this term keeps you from good standing. You came to 100% of the classes, calls and shifts asked of you. Your craft grew ')).toBe(true);
    expect(review.reason).not.toContain('the program asks. Your craft');
  }, 120_000);

  it('PLAYER JOURNEY: name the part most often left unfinished with its count of the pieces shown Unready, never as what held “most of them” back', () => {
    const sim = student('ed17-review-cause');
    // TEST SETUP: every piece prepared but its rehearsal, each midnight, so the term's Unready pieces share a part short.
    sim.onEvent('world.day_rollover', 'test.allButOne', (_e, { sim: s }) => {
      for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = d === 'rehearsal' ? 0 : 0.95;
    });
    tended(sim, at(2026, 12, 12));
    const review = sim.player.school!.history[0]!;
    const unready = termTally(courseworkOf(sim, sim.player)!.assignments, 0).unreadyShown.length;
    const m = review.reason.match(/The part most often left unfinished was “[^”]+”, on (\d+) of the (\d+) you showed Unready\. To work on it: [^.]+\./);
    expect(m, review.reason).not.toBeNull();
    expect(Number(m![2])).toBe(unready);
    expect(Number(m![1])).toBeLessThanOrEqual(unready);
    expect(review.reason).not.toContain('held most of them back');
    // What fell short leads: the coursework, before the attendance and growth that met their minimums.
    expect(review.reason.indexOf('pieces due in class were Unready or not shown')).toBeLessThan(review.reason.indexOf('You came to'));
  }, 300_000);
});

describe('casting and the Rep', () => {
  it('a part cast by size is said in lower case, the understudy’s role and play named, the lead given to a classmate said apart, and the Casting tab says each size once', () => {
    const sim = working(student('seagull'));
    tended(sim, at(2027, 1, 4, 9) + 60_000);
    const cast = titled(sim, 'Cast: Carlotta Festival Of New Plays')[0]!;
    const c = sim.player.school!.casting!;
    const r = sim.player.school!.rep!;
    expect(c.role).toMatch(/^A (Leading|Supporting|Featured) Part In A New Play$/);
    expect(cast.body.startsWith(`The chair of Acting has cast you in ${c.role.toLowerCase()} at the Carlotta Festival Of New Plays, from its first rehearsal call. You’ll also understudy ${r.role} in Yale Rep’s The Seagull, directed by Yura Kordonsky: be in New Haven and reachable at every performance. You play the part through the run. Both productions’ calls are on your calendar.`)).toBe(true);
    expect(cast.body).not.toMatch(/ as A /);
    const text = drawn(sim, SchoolWorkspace, 'casting');
    const others = (c.cast ?? []).filter((x) => x.part === 'A Featured Part In A New Play').length;
    expect(others).toBeGreaterThan(1);
    expect(text).toContain(' in featured parts');
    expect(text).not.toContain('a featured part in a new play;');
  }, 120_000);

  it('an understudy of the company goes on “at Yale Rep”, its slot named once, and a matinee is today', () => {
    expect(repNamed({ production: 'Yale Rep’s October Production' })).toBe('Yale Rep’s October Production');
    expect(repNamed({ production: 'Yale Rep’s October Production', play: 'An Enemy Of The People' })).toBe('Yale Rep’s An Enemy Of The People');
    expect(repNamed({ production: 'The Seagull' })).toBe('Yale Rep’s The Seagull');
    // A Sunday's curtain at two is today; the evening's at eight is tonight.
    expect(tonight(at(2027, 10, 17, 14))).toBe('today');
    expect(tonight(at(2027, 10, 16, 20))).toBe('tonight');
    // A Seagull understudy's night sent on, played with the Rep's slot and the company's part of a later season
    // (TEST SETUP: the casting's production and role given those, as a fall 2027 understudy with no named play has them).
    // The first of these seeds with a night sent on (tests/school.test.ts finds two or more among them).
    let found: { sim: Simulation; night: ReturnType<typeof pendingOf>[number] } | undefined;
    for (const seed of ['on-1', 'on-2', 'on-3', 'on-4', 'on-5', 'on-6', 'on-7', 'on-8', 'on-9']) {
      const sim = working(student(seed));
      tended(sim, at(2027, 1, 4, 9) + 60_000);
      const night = pendingOf(sim, CALL_KIND).find((i) => i.payload.call === 'oncall' && goesOn(sim, sim.player, Number(i.payload.perfAt)));
      if (night) { found = { sim, night }; break; }
    }
    expect(found).toBeDefined();
    {
      const { sim, night } = found!;
      Object.assign(sim.player.school!.rep!, { production: 'Yale Rep’s October Production', role: 'An Understudy In The Company' });
      tended(sim, night.at - MS_HOUR);
      sim.player.currentLocationId = 'us-ct-newhaven';
      tended(sim, night.at + 60_000);
      const curtain = Number(night.payload.perfAt);
      const when = zonedParts(curtain, zone).hour < 17 ? 'today' : 'tonight';
      const on = sim.universe.notifications.filter((n) => n.title.startsWith('You’re On '));
      expect(on.map((n) => n.title)).toEqual([`You’re On ${when === 'today' ? 'Today' : 'Tonight'} At Yale Rep`]);
      expect(on[0]!.body).toMatch(new RegExp(`^An actor you cover is out, so you go on in Yale Rep’s October Production ${when} at \\d{1,2}:\\d{2} [AP]M\\.$`));
    }
  }, 300_000);
});

describe('a leave’s lengths', () => {
  it('a reason two lengths share is said once, with what’s left of the three terms', () => {
    const sim = student('ed17-leave');
    tended(sim, at(2027, 1, 20, 12));
    // TEST SETUP: two terms of leave had before, as a returned leave keeps them.
    sim.player.school!.leaves = [{ id: 'x', kind: 'personal', reason: 'personal', status: 'returned', terms: 2, requestedAt: at(2026, 9, 1), firstTerm: 0, returnTerm: 2 } as never];
    const why = 'You’ve had two terms of leave, and the Bulletin allows three in all. One more term is the most you can take.';
    expect(leaveLengths(sim, sim.player.school!, 'medical').filter((x) => x.why === why).map((x) => x.terms)).toEqual([2, 3]);
    const text = drawn(sim, LeavePanel);
    expect(text.split(why)).toHaveLength(2);
    expect(text).toContain(`Two or three terms: ${why}`);
  }, 120_000);
});

describe('once the School has ended', () => {
  it('PLAYER JOURNEY: withdrawn in the first fall, the Classes tab has no week, Terms And Award lists the terms begun, and Standing leaves out the rules for terms to come', () => {
    const sim = student('ed17-ended');
    tended(sim, at(2026, 9, 9, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    tended(sim, at(2027, 1, 12, 12));
    const classes = drawn(sim, SchoolWorkspace, 'classes');
    expect(classes).toContain('No Classes Now');
    expect(classes).toContain('You’ve left the School, so there are no classes for you. Every course you took is under Courses And The Degree, on the Standing And Craft tab.');
    expect(classes).not.toContain('Your Week');
    const terms = drawn(sim, SchoolWorkspace, 'terms');
    expect(terms).toContain('Fall Term 2026');
    expect(terms).not.toContain('Spring Term 2027');
    expect(terms).toContain(`You left the School on ${formatDate(sim.player.school!.endedAt!, zone)}, so no term after it is yours.`);
    const standing = drawn(sim, SchoolWorkspace, 'standing');
    expect(standing).not.toContain('At the term review, a term falls short');
    expect(standing).not.toContain('Missing a performance or an understudy call is a grave breach');
    expect(standing).not.toContain('Commencement confers the degree');
  }, 120_000);
});

describe('the term’s first notices', () => {
  it('the welcome says orientation’s sessions are on the calendar, and a term’s notice says its classes and its review before the money', () => {
    const sim = student('ed17-term');
    const sessions = pendingOf(sim, ORIENTATION_KIND).sort((a, b) => a.at - b.at);
    expect(sessions).toHaveLength(5);
    expect(titled(sim, 'Welcome To The Class Of 2029')[0]!.body).toContain(`Orientation’s five sessions, from ${formatDate(sessions[0]!.at, zone)}, are on your calendar. If you miss one, press Catch Up beside it under Orientation, on the School’s Coursework tab.`);
    tended(sim, at(2026, 8, 24, 10));
    const { from, to } = classPeriod(0);
    expect(formatDate(at(from.year, from.month, from.day, 12), zone)).toBe('August 31, 2026');
    expect(titled(sim, 'Fall Term 2026 Begins')[0]!.body.startsWith(`Classes run from August 31 to ${formatDate(at(to.year, to.month, to.day, 12), zone)}, when the faculty review the term. Tuition, `)).toBe(true);
  }, 120_000);

  it('a class day slept through says to press Call In Sick on the Classes tab before nine', () => {
    const sim = student('ed17-missed');
    tended(sim, at(2026, 8, 31, 7));
    // TEST SETUP: asleep through nine.
    sim.player.awakeSince = at(2026, 8, 31, 11);
    sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    expect(titled(sim, 'You Missed Classes')[0]!.body).toMatch(/ today, unexcused\. The faculty count it at the term review\. If you’re unwell, press Call In Sick on the School’s Classes tab before classes start at nine\.$/);
  }, 120_000);
});

describe('the summer’s notice', () => {
  it('tells a member of the Summer Cabaret’s company its calls are on the calendar, and a student with none that nothing calls', () => {
    const sim = student('ed17-summer');
    const twin = student('ed17-summer');
    for (const s of [sim, twin]) {
      s.advanceTo(at(2027, 3, 20, 12));
      // TEST SETUP: in good standing, which the company asks of a student (tests/defects-g8-1.test.ts's).
      s.player.school!.standing = 'good';
    }
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    for (const s of [sim, twin]) s.advanceTo(at(2027, 5, 20, 12));
    expect(titled(sim, 'The Summer Is Yours').map((n) => n.body)).toEqual(['Classes are done until the fall term. The Summer Cabaret’s rehearsals and shows are on your calendar, and nothing else at the School calls on you until then.']);
    expect(titled(twin, 'The Summer Is Yours').map((n) => n.body)).toEqual(['Classes are done until the fall term, and nothing at the School calls on you until then.']);
  }, 120_000);
});

describe('the school’s look', () => {
  it('names the chair of Acting as every notice does, and the terms in words', () => {
    const sim = student('ed17-look');
    h.sim = sim;
    const look = resolveLook(sim, { kind: 'school', id: YALE_DRAMA.id }) as unknown as { body: Parameters<typeof renderToStaticMarkup>[0] };
    const text = renderToStaticMarkup(createElement('div', null, look.body)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(text).toContain(`, over six terms. ${YALE_DRAMA.dean.name} is the dean, and ${YALE_DRAMA.actingChair.name}, the chair of Acting, casts every student.`);
  }, 120_000);
});

describe('a practice brief', () => {
  it('points its Rehearsal to the beats below by the table’s own word, and says the last take’s limits as points off, as a piece’s look does', () => {
    const sim = student('ed17-brief');
    const rest = () => Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, morale: 60, hygiene: 80, condition: 90 }); // TEST SETUP
    // TEST SETUP: far along everywhere but composure, the genre known (tests/genre-identity-screens.test.ts's).
    Object.assign(sim.player.craft!, Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 80])));
    Object.assign(sim.player.attrs!, { presence: 80, composure: 15, listening: 80, imagination: 80, focus: 80, adaptability: 80, discipline: 80 });
    genreState(sim.player, 'nordic_noir').familiarity = 90;
    sim.advanceTo(at(2026, 8, 29, 13));
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const press = (kind: string, payload: Record<string, unknown>) => { rest(); const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); };
    press('brief.choose', { brief: noir.id, reading: noir.readings[0]!.id });
    for (const step of ['read', 'lines', 'rehearse']) press('brief.prepare', { brief: noir.id, step });
    press('practice.self_tape', { genre: 'nordic_noir', brief: noir.id });
    h.sim = sim;
    const text = renderToStaticMarkup(createElement(BriefPane, { genre: 'nordic_noir', brief: noir.id, onOpen: () => undefined, practice: () => null })).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(text).toContain('More in a beat a change leads into: beat by beat below');
    expect(text).toContain('The Last Take, Beat By Beat');
    const limits = sim.player.work!.at(-1)!.limits;
    expect(limits.length).toBeGreaterThan(0);
    for (const l of limits) expect(text).toContain(`${l.label}: ${l.by} points off ${DIMENSION_LABEL[l.dimension].toLowerCase()}${l.whole !== undefined ? `, ${l.whole} off the whole` : ''}`);
  }, 120_000);
});
