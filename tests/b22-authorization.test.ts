/**
 * Brief 22, section 1 (docs/verification/career-genre-2026-10-22/criteria.md, A1 to A13): permission to work read where
 * the work happens, and OPT's days counted by the day from what the record holds.
 *
 * The rule under test (`systems/permission.ts`, `systems/projobs.ts`): each New York day of OPT is one with employment
 * when it falls inside an engagement that has begun and hasn't ended, its hours averaging at least 20 a week, and one
 * without otherwise, the days before booked work begins among them; more than 90 without ends OPT at the end of the
 * 91st; work booked past the end is released then, and a work day reads permission for the whole day before it
 * happens. Pay for days worked stays owed.
 *
 * PLAYER JOURNEYS: b20-4's own life (British, at Yale on an F-1, then OPT), opened from three saves made on brief 22's
 * starting commit (`tests/fixtures/b22/`): 1 September 2029, before its OPT ended; 4 September 2029 at 7 AM, the run's
 * first day, its weekly count three days behind; and 1 October 2029, after the old count had ended it in the middle of
 * The Winter Ledger. And new graduates, played by the clock and the commands the
 * screens send.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`played`); a graduate made
 * by the School's own handlers with Commencement brought forward, as tests/b20-papers-work.test.ts makes one; OPT
 * applied for through Apply For OPT with its decision brought to a minute on (`onOpt`); an offer standing as casting's
 * draw writes one (`offered`); and, where a case can't be reached in play, the change made by hand, named.
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, addDays, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { answerStop } from '@/engine/world/clock';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '@/engine/systems/school';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { PERMISSION_KIND, employedOn, employmentSpan, f1Of, optRunsOut, weeklyHours, workAuthorizedFor } from '@/engine/systems/permission';
import { WORK_DAY_KIND, acceptWarning, datesOf, payTermsOf, projectOf } from '@/engine/systems/projobs';
import { ensurePro, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { PAY_KIND } from '@/engine/systems/propay';
import { PROJECTS } from '@/engine/content/careerwork';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const midnight = (year: number, month: number, day: number) => at(year, month, day, 0);
const LONDON: Partial<NewSaveConfig> = { homeRegionId: 'uk-eng-london' };
const life = (seed: string, more: Partial<NewSaveConfig> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const opened = (name: string) => loadSave(deserialise(gunzipSync(readFileSync(`tests/fixtures/b22/${name}.json.gz`)).toString('utf8')) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const optOf = (sim: Simulation) => documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
const engagementFor = (sim: Simulation, projectId: string) => sim.player.pro!.engagements.find((e) => e.projectId === projectId)!;
const worked = (e: Engagement) => (e.log ?? []).filter((l) => l.status === 'worked');
const workItems = (sim: Simulation, e: Engagement) => sim.universe.scheduled.filter((i) => i.kind === WORK_DAY_KIND && i.payload.engagementId === e.id);
/** An engagement's paydays on the clock, by the week each pays (its payment's key ends in the week). */
const paydays = (sim: Simulation, e: Engagement) => sim.universe.scheduled.filter((i) => i.kind === PAY_KIND && i.payload.engagementId === e.id).map((i) => ({ week: String(i.payload.key).split(':').at(-1), status: i.status, resolvedAt: i.resolvedAt, label: i.label }));

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time, Go pressed at every stop. */
function played(sim: Simulation, until: number): void {
  const tend = () => {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
  };
  while (sim.now < until) {
    tend();
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend();
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
}

/**
 * TEST SETUP: a graduate of the class of 2029 by the School's own evaluation and Commencement handlers, Commencement
 * brought forward to 3 September 2026, the F-1's program end moved to 1 October 2026 with sixty days' grace after it,
 * as tests/b20-papers-work.test.ts makes one.
 */
function graduate(seed: string): Simulation {
  const sim = life(seed, LONDON);
  played(sim, at(2026, 9, 1, 18));
  f1Of(sim.player)!.expiresAt = at(2026, 10, 1, 12) + 60 * MS_DAY;
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  played(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/**
 * A graduate on OPT from Thursday 1 October 2026, its first day: applied for through Apply For OPT at the program's
 * end, as What Needs You offers it. TEST SETUP: the decision, 90 days on, brought to a minute on; it's decided by the
 * game's own handler.
 */
function onOpt(seed: string): Simulation {
  const sim = graduate(seed);
  played(sim, at(2026, 10, 1, 13));
  sim.must({ kind: 'documents.apply_opt', payload: {} });
  const doc = optOf(sim);
  const item = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === PERMISSION_KIND && i.payload.documentId === doc.id)!;
  sim.timeline.cancel(item.id, sim.now);
  doc.readyAt = sim.now + 60_000;
  sim.schedule({ at: doc.readyAt, kind: PERMISSION_KIND, label: 'OPT Decided', category: 'system', priority: 20, payload: item.payload });
  played(sim, sim.now + 5 * 60_000);
  expect(doc.status).toBe('valid');
  expect(formatDate(doc.issuedAt!, NY)).toBe('October 1, 2026');
  return sim;
}

/** TEST SETUP: an offer standing for a role, posted at noon on a day, as casting's draw writes one after the last round. */
function offered(sim: Simulation, projectId: string, postedAt: number): Opportunity {
  const t = projectOf({ projectId });
  const terms = payTermsOf({ projectId, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  return o;
}
const accept = (sim: Simulation, o: Opportunity) => sim.execute<{ engagementId: string; days: number }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });

describe('A1: b20-4, the life that worked 47 days after its OPT ended, opened from its save of 1 September 2029', () => {
  it('PLAYER JOURNEY: its OPT ends at the end of 1 September, its 91st day without work, the days before The Winter Ledger began counting as days without work; the run is released that midnight, before its first day, and not one day of it is worked, judged, practiced, paid or credited', () => {
    const sim = opened('b20-4-opt-2029-09-01');
    const opt = optOf(sim);
    // The save's count, as the weekly count left it: 88 days without work and Paper Moons' 3 days worked, to 29 August.
    expect([opt.status, opt.idleDays, opt.workedDays, opt.countedTo]).toEqual(['valid', 88, 3, undefined]);
    const run = engagementFor(sim, 'winter-ledger-hester');
    expect([run.status, run.days.length, worked(run).length, run.pay.length]).toEqual(['booked', 50, 0, 9]);
    expect(paydays(sim, run).map((d) => d.status)).toEqual(Array(9).fill('pending'));
    expect(formatDate(run.days[0]!.from, NY)).toBe('September 4, 2029');
    const practice = JSON.stringify(sim.player.engagement);
    const credits = sim.player.pro!.credits.length;

    played(sim, at(2029, 11, 6, 12));
    // Counted on from the day its weeks reached, 30 August, nothing counted twice: 30 and 31 August and 1 September,
    // the 89th, 90th and 91st days without work.
    expect([opt.status, opt.idleDays, opt.workedDays]).toEqual(['cancelled', 91, 3]);
    expect(opt.endedAt).toBe(midnight(2029, 9, 2));
    expect(sim.player.usOutOfStatus).toBe(midnight(2029, 9, 2));
    expect(titled(sim, 'OPT Ended').map((n) => [n.at, n.body])).toEqual([[midnight(2029, 9, 2), 'You’d had more than 90 days without work since your OPT began, so it ended at the end of September 1, 2029, and with it your permission to work in the United States. A day counts as one with work only once a job has begun, so the days waiting for booked work to start counted against it. Your US status ends with it, with no grace period.']]);

    // Released at that midnight, said, its fifty days off the calendar, nothing worked or owed, no credit.
    expect(run.status).toBe('canceled');
    expect(run.finishedAt).toBe(midnight(2029, 9, 2));
    expect(titled(sim, 'Released As Hester Vane').map((n) => [n.at, n.body])).toEqual([[midnight(2029, 9, 2), 'Your OPT ended on September 1, 2029, after more than 90 days without work, and without it you can’t work in the United States. So Harrow Point Repertory Theater can’t start you as Hester Vane in The Winter Ledger, and has released you. You hadn’t worked a day of it, so nothing is owed, and its days are off your calendar. There’s no credit for it.']]);
    expect(run.history.map((h) => h.words)).toContain('Harrow Point Repertory Theater released you as Hester Vane on September 2, 2029: your OPT ended on September 1, 2029, after more than 90 days without work, and without it you can’t work in the United States.');
    expect(workItems(sim, run).every((i) => i.status === 'cancelled')).toBe(true);
    expect([run.log ?? [], run.pay, run.creditId]).toEqual([[], [], undefined]);
    // Its nine paydays off the clock with it, at that midnight: until 2026-10-22 they stayed on it, so Home and the
    // calendar said "Payday: The Winter Ledger" for weeks owed nothing, and each fired and paid nothing.
    expect(paydays(sim, run).map((d) => [d.status, d.resolvedAt])).toEqual(Array(9).fill(['cancelled', midnight(2029, 9, 2)]));
    expect(sim.player.pro!.credits).toHaveLength(credits);
    // The defect's own measure: no engagement has a day worked after OPT ended.
    for (const e of sim.player.pro!.engagements) expect(worked(e).filter((l) => l.at >= opt.endedAt!)).toEqual([]);
    // Nothing practiced in the run's genres: no day of it happened.
    expect(JSON.stringify(sim.player.engagement)).toBe(practice);
  }, 120_000);
});

describe('A12, an older save: b20-4 opened from its save of 4 September 2029 at 7 AM, written by the build before brief 22, its weekly count three days behind', () => {
  it('PLAYER JOURNEY: the run’s first day, at 10 AM before any midnight, counts OPT’s days first, finds it ended at the end of 1 September, and releases the run then; not one day of it worked', () => {
    const sim = opened('b20-4-opt-2029-09-04');
    const opt = optOf(sim);
    // As the old weekly count left it on the 4th: 88 days without work to 29 August, its next week to end on the 6th.
    expect([opt.status, opt.idleDays, opt.workedDays, opt.countedTo]).toEqual(['valid', 88, 3, undefined]);
    const run = engagementFor(sim, 'winter-ledger-hester');
    expect([run.status, worked(run).length]).toEqual(['booked', 0]);
    const first = run.days[0]!;
    expect([formatDate(first.from, NY), first.from - sim.now]).toEqual(['September 4, 2029', 3 * MS_HOUR]);

    played(sim, at(2029, 9, 6, 12));
    // The work day counted 30 and 31 August and 1 September before it read permission: the end where the daily count puts
    // it, three days back, said and released at the work day's own hour. Until the guard counted first (it read
    // permission as the old count left it), this day was worked and the run released at the next midnight.
    expect([opt.status, opt.idleDays, opt.endedAt]).toEqual(['cancelled', 91, midnight(2029, 9, 2)]);
    expect([run.status, run.finishedAt, worked(run).length, run.creditId]).toEqual(['canceled', first.from, 0, undefined]);
    expect(titled(sim, 'Released As Hester Vane').map((n) => n.at)).toEqual([first.from]);
    for (const e of sim.player.pro!.engagements) expect(worked(e).filter((l) => l.at >= opt.endedAt!)).toEqual([]);
  }, 120_000);
});

describe('An older save’s paydays: b20-4 opened from its save of 2 September 2029 at 9 AM, written by the build before 2026-10-22, the run released at midnight', () => {
  it('PLAYER JOURNEY: the nine paydays that build left on the clock for The Winter Ledger, owed nothing, come off it on opening; nothing says "Payday: The Winter Ledger" any more, and a second opening changes nothing', () => {
    const text = gunzipSync(readFileSync('tests/fixtures/b22/b20-4-released-2029-09-02.json.gz')).toString('utf8');
    const kept = deserialise(text) as { scheduled: { kind: string; status: string; payload: Record<string, unknown> }[] };
    expect(kept.scheduled.filter((i) => i.kind === PAY_KIND && i.status === 'pending')).toHaveLength(9);
    const sim = loadSave(kept as never);
    const run = engagementFor(sim, 'winter-ledger-hester');
    expect([run.status, run.pay]).toEqual(['canceled', []]);
    expect(paydays(sim, run).map((d) => [d.status, d.resolvedAt])).toEqual(Array(9).fill(['cancelled', sim.now]));
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.label === 'Payday: The Winter Ledger')).toEqual([]);
    const once = serialise(sim.universe);
    expect(serialise(loadSave(deserialise(once) as never).universe)).toBe(once);
  }, 120_000);
});

describe('A7, during: b20-4 opened from its save of 1 October 2029, The Winter Ledger in rehearsal after the old count had ended its OPT', () => {
  it('PLAYER JOURNEY: the next work day reads permission, finds none, and releases the run then; the twenty rehearsal days stand, their four weeks paid, the five weeks not worked dropped, and no performance or credit follows', () => {
    const sim = opened('b20-4-opt-ended-2029-10-01');
    const opt = optOf(sim);
    expect([opt.status, opt.endedAt]).toEqual(['cancelled', Date.UTC(2029, 8, 6, 14, 25)]);
    const run = engagementFor(sim, 'winter-ledger-hester');
    expect([run.status, worked(run).length, run.pay.length, run.pay.filter((p) => p.received).length, run.creditId]).toEqual(['working', 20, 9, 3, undefined]);
    const logBefore = JSON.stringify(run.log);
    const firstNight = run.days[20]!;
    expect(formatDate(firstNight.from, NY)).toBe('October 2, 2029');

    played(sim, at(2029, 10, 20, 12));
    expect(run.status).toBe('canceled');
    expect(run.finishedAt).toBe(firstNight.from);
    expect(JSON.stringify(run.log)).toBe(logBefore);
    // Weeks one to four, each with days worked, still owed and the fourth paid on Thursday 4 October; five to nine gone.
    expect(run.pay.map((p) => p.key.split(':')[1])).toEqual(['1', '2', '3', '4']);
    expect(run.pay.every((p) => p.received)).toBe(true);
    // The paydays of weeks five to nine off the clock at the release, the four worked weeks' fired as they came (until
    // 2026-10-22 the five stayed on it and fired, paying nothing).
    const dropped = paydays(sim, run).filter((d) => Number(d.week) > 4);
    expect(dropped.map((d) => [d.week, d.status, d.resolvedAt])).toEqual(['5', '6', '7', '8', '9'].map((w) => [w, 'cancelled', firstNight.from]));
    expect(paydays(sim, run).filter((d) => Number(d.week) <= 4).every((d) => d.status !== 'pending' && d.status !== 'cancelled')).toBe(true);
    expect(run.creditId).toBeUndefined();
    expect(titled(sim, 'Released As Hester Vane').map((n) => [n.at, n.body])).toEqual([[firstNight.from, 'Your OPT ended on September 6, 2029, after more than 90 days without work, and without it you can’t work in the United States. So Harrow Point Repertory Theater can’t keep you on as Hester Vane in The Winter Ledger, and has released you. The 20 days you worked are still paid on their paydays, and the rest are called off. There’s no credit for it.']]);
    // The night it was released at ran and did nothing; every one after it is off the calendar.
    expect(workItems(sim, run).filter((i) => i.at > firstNight.from).every((i) => i.status === 'cancelled')).toBe(true);
  }, 120_000);
});

describe('A4 to A9: OPT counted by the day, a graduate on OPT from 1 October 2026', () => {
  it('PLAYER JOURNEY, before: a run booked to begin on 5 January is warned of at acceptance, and released at the end of 30 December, the 91st day without work, the days waiting for it counted against OPT; nothing of it worked, paid or credited, and the status ends with it', () => {
    const sim = onOpt('b22-auth-before');
    played(sim, at(2026, 12, 1, 12));
    const o = offered(sim, 'calder-street', at(2026, 12, 1, 12));
    expect(formatDate(datesOf(o)[0]!.from, NY)).toBe('January 5, 2027');
    // Projected at acceptance: the days to 5 January are days without work, a booking not being one.
    expect(optRunsOut(sim.player)).toBe(midnight(2026, 12, 31));
    expect(acceptWarning(sim, sim.player, o)).toBe('Your OPT’s 90 days without work run out on December 30, 2026, before this work begins on January 5, 2027, and a job counts as work only from its first day. Unless other work begins first, your OPT ends then, and with it this part.');
    expect(accept(sim, o).ok).toBe(true);
    const run = engagementFor(sim, 'calder-street');

    played(sim, at(2026, 12, 30, 23, 30));
    expect([optOf(sim).status, optOf(sim).idleDays]).toEqual(['valid', 90]);
    played(sim, at(2027, 1, 20, 12));
    const opt = optOf(sim);
    expect([opt.status, opt.idleDays, opt.workedDays ?? 0, opt.endedAt]).toEqual(['cancelled', 91, 0, midnight(2026, 12, 31)]);
    expect([run.status, run.finishedAt, worked(run).length, run.pay, run.creditId]).toEqual(['canceled', midnight(2026, 12, 31), 0, [], undefined]);
    expect(titled(sim, 'Released As Nell').map((n) => n.at)).toEqual([midnight(2026, 12, 31)]);
    expect(workItems(sim, run).every((i) => i.status === 'cancelled')).toBe(true);
    expect(sim.player.usOutOfStatus).toBe(midnight(2026, 12, 31));
    expect(titled(sim, 'Out Of Status')).toHaveLength(1);
  }, 180_000);

  it('PLAYER JOURNEY, authorized work and after: a run beginning on 29 December, the 90th day, is worked whole, every day of its ten weeks counted as a day with work; OPT ends after it, at the end of 9 March, and the run’s last week, paid on the 11th, is still paid; its credit stands', () => {
    const sim = onOpt('b22-auth-after');
    played(sim, at(2026, 11, 24, 12));
    const o = offered(sim, 'calder-street', at(2026, 11, 24, 12));
    const days = datesOf(o);
    expect([formatDate(days[0]!.from, NY), formatDate(days.at(-1)!.from, NY)]).toEqual(['December 29, 2026', 'March 7, 2027']);
    expect(acceptWarning(sim, sim.player, o)).toBeUndefined();
    expect(accept(sim, o).ok).toBe(true);
    const run = engagementFor(sim, 'calder-street');

    played(sim, at(2027, 3, 8, 12));
    const opt = optOf(sim);
    // Eighty-nine days waiting, then the run from its first day to its last, dark Mondays included: 69 days with work.
    expect([opt.status, opt.idleDays, opt.workedDays]).toEqual(['valid', 89, 69]);
    expect([run.status, worked(run).length]).toEqual(['finished', 56]);
    expect(run.creditId).toBeDefined();
    const last = run.pay.find((p) => p.key.endsWith(':10'))!;
    expect([formatDate(last.due, NY), last.received]).toEqual(['March 11, 2027', undefined]);

    played(sim, at(2027, 3, 12, 12));
    expect([opt.status, opt.idleDays, opt.endedAt]).toEqual(['cancelled', 91, midnight(2027, 3, 10)]);
    // A stop on work to come, not a claim on work done: the last week paid on its day after the end, the credit kept.
    expect(last.received).toBeDefined();
    expect(run.pay.every((p) => p.received)).toBe(true);
    expect(sim.player.pro!.credits.some((c) => c.id === run.creditId)).toBe(true);
    expect(titled(sim, 'Released As Nell')).toEqual([]);
  }, 240_000);

  it('PLAYER JOURNEY, during: a two-day shoot whose second day falls after OPT’s end date (TEST SETUP: the end moved to the first day’s evening) works the first day, refuses the second at its hour, and pays the one day worked; no screen credit for a shoot not finished', () => {
    const sim = onOpt('b22-auth-during');
    played(sim, at(2026, 11, 2, 12));
    const o = offered(sim, 'eastview', at(2026, 11, 2, 12));
    const [one, two] = datesOf(o);
    expect([formatDate(one!.from, NY), formatDate(two!.from, NY)]).toEqual(['December 7, 2026', 'December 8, 2026']);
    expect(accept(sim, o).ok).toBe(true);
    const shoot = engagementFor(sim, 'eastview');
    const each = shoot.pay[0]!.promised;
    // TEST SETUP: OPT's end date moved to 8 PM on the first day, as a corrected card would carry it.
    const end = at(2026, 12, 7, 20);
    optOf(sim).expiresAt = end;
    expect(workAuthorizedFor(sim.player, one!)).toBe(true);
    expect(workAuthorizedFor(sim.player, two!)).toBe(false);

    played(sim, at(2026, 12, 20, 12));
    expect(worked(shoot).map((l) => l.day)).toEqual([0]);
    expect([shoot.status, shoot.finishedAt, shoot.creditId]).toEqual(['canceled', two!.from, undefined]);
    expect(shoot.pay.map((p) => [p.promised, Boolean(p.received)])).toEqual([[Math.round(each / 2), true]]);
    expect(titled(sim, 'Released As Robin').map((n) => n.body)).toEqual(['Your OPT ran out on December 7, 2026, and without it you can’t work in the United States. So Ferrous Pictures can’t keep you on as Robin in Last Bus To Eastview, and has released you. The one day you worked is still paid on its payday, and the rest are called off. There’s no credit for it.']);
  }, 180_000);

  it('PLAYER JOURNEY, inside a day: OPT’s end within the first shoot day’s hours (TEST SETUP: moved there; approval sets the end at the hour OPT began, a year on, Commencement’s 2 PM or the decision’s own hour) refuses the offer while it stands, and once taken releases the shoot at that day’s start, not an hour of it worked or paid', () => {
    const sim = onOpt('b22-auth-midday');
    played(sim, at(2026, 11, 2, 12));
    const o = offered(sim, 'eastview', at(2026, 11, 2, 12));
    const [one] = datesOf(o);
    const card = optOf(sim);
    const was = card.expiresAt;
    const end = one!.from + Math.round((one!.to - one!.from) / 2 / MS_HOUR) * MS_HOUR;
    card.expiresAt = end;
    // Permission at the day's start and none at its end: the day is read whole, at acceptance as at the work day.
    expect([one!.from < end, end < one!.to, workAuthorizedFor(sim.player, one!)]).toEqual([true, true, false]);
    expect(accept(sim, o).ok).toBe(false);
    card.expiresAt = was;
    expect(accept(sim, o).ok).toBe(true);
    const shoot = engagementFor(sim, 'eastview');
    card.expiresAt = end;
    played(sim, at(2026, 12, 20, 12));
    expect([worked(shoot).length, shoot.status, shoot.finishedAt, shoot.pay.length, shoot.creditId]).toEqual([0, 'canceled', one!.from, 0, undefined]);
    expect(titled(sim, 'Released As Robin')).toHaveLength(1);
  }, 180_000);

  it('A12: one long advance, six-hour steps and a save opened the day before the end come to the same end, the same released work, the same notices and, saved and opened against straight, the same state to the byte', () => {
    const start = onOpt('b22-auth-ways');
    played(start, at(2026, 12, 1, 12));
    expect(accept(start, offered(start, 'calder-street', at(2026, 12, 1, 12))).ok).toBe(true);
    const long = reload(start);
    const steps = reload(start);
    const target = at(2027, 1, 10, 12);
    long.advanceTo(target);
    while (steps.now < target) steps.advanceTo(Math.min(target, steps.now + 6 * MS_HOUR));
    const half = reload(start);
    half.advanceTo(at(2026, 12, 30, 12));
    const reopened = reload(half);
    reopened.advanceTo(target);
    half.advanceTo(target);
    const read = (sim: Simulation) => ({
      opt: optOf(sim), run: engagementFor(sim, 'calder-street'),
      notices: sim.universe.notifications.filter((n) => ['OPT Ended', 'Released As Nell', 'Out Of Status'].includes(n.title)).map((n) => [n.at, n.title, n.body]),
    });
    for (const sim of [steps, half, reopened]) expect(JSON.stringify(read(sim))).toBe(JSON.stringify(read(long)));
    expect(read(long).opt.endedAt).toBe(midnight(2026, 12, 31));
    expect(serialise(reopened.universe)).toBe(serialise(half.universe));
  }, 240_000);

  it('A11: after the breach, no route reopens the released run; a green card (TEST SETUP: held from 1 February 2027, as an older save could hold one) lets casting’s next offer be taken and worked, and the run stays released', () => {
    const sim = onOpt('b22-auth-recover');
    played(sim, at(2026, 12, 1, 12));
    expect(accept(sim, offered(sim, 'calder-street', at(2026, 12, 1, 12))).ok).toBe(true);
    played(sim, at(2027, 2, 1, 12));
    const run = engagementFor(sim, 'calder-street');
    expect(run.status).toBe('canceled');
    // Refused while there's no permission, in the words acceptance gives.
    const early = offered(sim, 'eastview', at(2027, 2, 1, 12));
    expect(accept(sim, early).ok).toBe(false);
    documentsOf(sim.player).push({ id: sim.nextId('document'), kind: 'permit', issuer: 'US', name: 'Permanent Resident Card', number: 'GC-B22', status: 'valid', issuedAt: sim.now, destination: 'US', route: 'us-green-card' } as PersonDocument);
    const later = offered(sim, 'eastview', at(2027, 2, 1, 12));
    expect(accept(sim, later).ok).toBe(true);
    played(sim, at(2027, 3, 20, 12));
    const shoot = sim.player.pro!.engagements.find((e) => e.opportunityId === later.id)!;
    expect([shoot.status, worked(shoot).length]).toEqual(['finished', 2]);
    expect([run.status, worked(run).length]).toEqual(['canceled', 0]);
    expect(workItems(sim, run).every((i) => i.status === 'cancelled')).toBe(true);
  }, 240_000);
});

describe('A4: what counts as a day with work, from the record', () => {
  const day = (e: Partial<Engagement>): Engagement => ({ id: 'e', opportunityId: 'o', projectId: 'eastview', role: 'Robin', status: 'booked', days: [], pay: [], history: [], counts: {}, ...e }) as Engagement;
  const span = (from: number, n: number, hours: number) => Array.from({ length: n }, (_, i) => ({ from: addDays(from, i, NY), to: addDays(from, i, NY) + hours * MS_HOUR, label: 'Work' }));

  it('every engagement the game offers averages at least 20 hours a week over its span but a recurring part’s; a run of 10 weeks 25.6, a two-day shoot 22', () => {
    // A recurring part's episodes are three weeks apart (from 2026-10-24, brief 25's Module 4), so its two guaranteed
    // episodes average under 20 hours a week, and on their own aren't employment for OPT (`employmentSpan`).
    for (const t of PROJECTS) {
      const days = datesOf({ projectId: t.id, postedAt: at(2027, 1, 4, 12) });
      if (t.schedule.kind === 'episodes') expect(weeklyHours({ days }), t.id).toBeLessThan(20);
      else expect(weeklyHours({ days }), t.id).toBeGreaterThanOrEqual(20);
    }
    const whitlock = { ...day({}), days: datesOf({ projectId: 'calloway-files-whitlock', postedAt: at(2027, 1, 4, 12) }), log: [{ day: 0, at: at(2027, 2, 15, 7), status: 'worked' as const }] };
    expect(employmentSpan(whitlock)).toBeUndefined();
    expect(weeklyHours({ days: datesOf({ projectId: 'calder-street', postedAt: at(2027, 1, 4, 12) }) })).toBeCloseTo(25.6, 1);
    expect(weeklyHours({ days: datesOf({ projectId: 'eastview', postedAt: at(2027, 1, 4, 12) }) })).toBe(22);
  });

  it('a booking isn’t employment; a job begun is, to its last day, its days off included; called off, to that moment; a day missed inside it still is; under 20 hours a week it never is', () => {
    const first = at(2027, 3, 1, 10);
    const days = span(first, 10, 8);
    const person = { pro: { engagements: [] as Engagement[] } } as never as Parameters<typeof employedOn>[0];
    const on = (y: number, m: number, d: number) => employedOn(person, midnight(y, m, d), addDays(midnight(y, m, d), 1, NY));
    const e = day({ days, status: 'booked' });
    person.pro!.engagements.push(e);
    expect(employmentSpan(e)).toBeUndefined();
    expect(on(2027, 3, 1)).toBe(false);
    // Projected for Papers, the booking counts from its first day.
    expect(employmentSpan(e, true)?.from).toBe(midnight(2027, 3, 1));
    // Its first day missed, its second worked: employed from the second.
    e.status = 'working';
    e.log = [{ day: 0, at: days[0]!.from, status: 'missed' }, { day: 1, at: days[1]!.from, status: 'worked' }];
    expect([on(2027, 3, 1), on(2027, 3, 2), on(2027, 3, 10), on(2027, 3, 11)]).toEqual([false, true, true, false]);
    // A day missed later inside it stays employed.
    e.log.push({ day: 4, at: days[4]!.from, status: 'missed' });
    expect(on(2027, 3, 5)).toBe(true);
    // Called off on the 6th: employed to that moment, not after.
    Object.assign(e, { status: 'canceled', finishedAt: days[5]!.from });
    expect([on(2027, 3, 6), on(2027, 3, 7)]).toEqual([true, false]);
    // Under 20 hours a week: two hours a day for ten days, about 15 a week over its span, never employment.
    const thin = day({ days: span(first, 10, 2), status: 'working', log: [{ day: 0, at: first, status: 'worked' }] });
    person.pro!.engagements.splice(0, 1, thin);
    expect(weeklyHours(thin)).toBeCloseTo(15.4, 1);
    expect(on(2027, 3, 2)).toBe(false);
  });
});
