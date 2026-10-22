/**
 * The clock at a stop, Tomorrow Morning, the Sleep dialog's suggestion and On The Way's foresight, in the engine (from
 * 2026-10-20, the owner's brief 19, D1, D2, D3 and D5, which are brief 18's S1, S2, S3 and S5; the record is
 * `docs/verification/career-2026-10-20/time/`).
 *
 * - D1: a stop's choices beyond Go and Stand Here are its kind's own (`stopChoices`, `world/clock.ts`), and what each does
 *   to the jump is one rule (`carryOnTo`, `answerStop`): Go goes through the commitment and carries the jump on, a choice
 *   that goes through carries it on to where it was headed, Stand Here ends it at the stop, and a refusal changes
 *   nothing. Played on jumps with two commitments, one across midnight, for each answer at each stop, Call It Off on a
 *   partner's rehearsal among them; and a kind declared here for the test, as a career appointment would declare Ask To
 *   Move, offers its own choice and the jump stops again where it was moved to.
 * - D2: Tomorrow Morning is the next seven o'clock (`nextAtHour`): at 2 AM the same date's.
 * - D3: the suggestion reads whether the day's night is behind it, the energy, the hour and the next commitment with its
 *   own trip (`suggestedSleep`, `systems/life.ts`).
 * - D5: On The Way lists the stops a jump will make that aren't on the calendar yet (`onTheWay`, `foresight.ts`): a week
 *   from a Friday evening, the next week's classes, the stops the jump then makes, and nothing in the save touched.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM, played by the clock with every stop gone to (Go) as the top bar's own
 * jumps go, and plans put on the calendar with `calendar.schedule`, as the Calendar's form puts them. TEST SETUP is said
 * where it's used.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, MS_MINUTE, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { PLAN_KIND } from '@/engine/world/plans';
import { PARTNER_KIND, courseworkOf, trustOf, type Assignment, type PartnerAsk } from '@/engine/systems/coursework';
import { ADVANCE_HOURS, answerStop, carryOnTo, defineStop, nextAtHour, nextMondayAt, refusalOf, stopChoices, stopCommands, type Stop } from '@/engine/world/clock';
import { onTheWay } from '@/engine/foresight';
import { suggestedSleep, SHORTEST_SLEEP, SPENT } from '@/engine/systems/life';
import { GETTING_UP_MINUTES, IN_TOWN_MINUTES, travelMinutesOf } from '@/engine/world/calendar';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';

const NY = 'America/New_York';
const at = (month: number, day: number, hour: number, minute = 0) => instantFromZoned({ year: 2026, month, day, hour, minute }, NY);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A jump to `wanted`, every stop gone to, as the top bar's Go carries it on. */
function jump(sim: Simulation, wanted: number): ScheduledItem[] {
  const stops: ScheduledItem[] = [];
  let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  while (r.interruptedBy) {
    stops.push(r.interruptedBy);
    r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
  }
  return stops;
}
const plan = (sim: Simulation, title: string, when: number, minutes: number) => sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title, at: when, durationMinutes: minutes } }).id;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/**
 * Thursday, August 27, 2026, at 9:00 PM, with two plans on the way to Tomorrow Morning: one from 11:30 PM to 12:30 AM,
 * across midnight, and one at 2:00 AM; Friday's first commitment is at 10:00 AM, after where the jump is headed.
 */
function twoPlans(seed: string) {
  const sim = life(seed);
  jump(sim, at(8, 27, 21));
  const late = plan(sim, 'Meet Sam At The Station', at(8, 27, 23, 30), 60);
  const call = plan(sim, 'Call Home', at(8, 28, 2), 30);
  const wanted = nextAtHour(sim.now, sim.zone, ADVANCE_HOURS.morning);
  expect(wanted).toBe(at(8, 28, 7));
  const first = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  expect(first.interruptedBy?.id).toBe(late);
  expect(sim.now).toBe(at(8, 27, 23, 30));
  const stop: Stop = { item: first.interruptedBy!, wanted, sentFrom: first.sentFrom };
  return { sim, late, call, wanted, stop };
}
const skipIt = () => stopChoices(PLAN_KIND)[0]!;

describe('D1: what each answer at a stop does to the jump', () => {
  it('declares Skip It on a plan of your own and Call It Off on a partner’s rehearsal, and nothing more on the world’s own', () => {
    expect(stopChoices(PLAN_KIND).map((c) => [c.label, c.command, c.then])).toEqual([['Skip It', 'calendar.skip', 'carry-on']]);
    expect(stopChoices(PARTNER_KIND).map((c) => [c.label, c.command, c.then])).toEqual([['Call It Off', 'school.cancel_rehearsal', 'carry-on']]);
    expect(stopChoices('school.classes')).toEqual([]);
    expect(stopCommands()).toEqual(expect.arrayContaining(['calendar.skip', 'school.cancel_rehearsal']));
    expect(() => defineStop(PLAN_KIND, [])).toThrow(/already declared/);
  });

  it('PLAYER JOURNEY: Go at each of two stops, one across midnight: each is kept, the jump carries on to the second and then to seven, the same jump, and the night is slept', () => {
    const { sim, late, call, wanted, stop } = twoPlans('time-go-go');
    const second = answerStop(sim, stop, 'go').result!;
    expect(sim.timeline.get(late)!.status).toBe('done');
    expect(second.interruptedBy?.id).toBe(call);
    expect(sim.now).toBe(at(8, 28, 2));
    // The jump it carries on is the one sent at 9:00 PM.
    expect(second.sentFrom).toBe(stop.sentFrom);
    const end = answerStop(sim, { item: second.interruptedBy!, wanted, sentFrom: second.sentFrom }, 'go').result!;
    expect(end.interruptedBy).toBeUndefined();
    expect(sim.now).toBe(wanted);
    expect(sim.timeline.get(call)!.status).toBe('done');
    // A night was slept on the way, as for a jump with no stop.
    expect(sim.player.lastSleptAt).toBeGreaterThanOrEqual(at(8, 28, 0));
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('PLAYER JOURNEY: Skip It at each: the plan is missed and said once, nothing else is skipped, and the jump carries on to the next stop and then to seven', () => {
    const { sim, late, call, wanted, stop } = twoPlans('time-skip-skip');
    const second = answerStop(sim, stop, skipIt());
    expect(second.refused).toBeUndefined();
    expect(sim.timeline.get(late)!.status).toBe('missed');
    expect(titled(sim, 'You Didn’t Go To Meet Sam At The Station')).toHaveLength(1);
    // Not the second commitment: the jump stops at it, still waiting.
    expect(second.result!.interruptedBy?.id).toBe(call);
    expect(sim.timeline.get(call)!.status).toBe('pending');
    expect(sim.now).toBe(at(8, 28, 2));
    const end = answerStop(sim, { item: second.result!.interruptedBy!, wanted, sentFrom: second.result!.sentFrom }, skipIt());
    expect(end.result!.interruptedBy).toBeUndefined();
    expect(sim.now).toBe(wanted);
    expect(sim.timeline.get(call)!.status).toBe('missed');
    // Nothing on Friday morning was touched: its first commitment, at ten, is still ahead.
    expect(sim.timeline.next(sim.now - 1, (i) => i.requiresPlayer === true)?.at).toBe(at(8, 28, 10));
    expect(sim.player.lastSleptAt).toBeGreaterThanOrEqual(at(8, 28, 0));
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('PLAYER JOURNEY: Stand Here ends the jump at the stop: the clock stays at 11:30 PM, both plans wait, and so it does at the second after Go', () => {
    const { sim, late, call, wanted, stop } = twoPlans('time-stand');
    expect(answerStop(sim, stop, 'stand')).toEqual({});
    expect(sim.now).toBe(at(8, 27, 23, 30));
    expect(sim.timeline.get(late)!.status).toBe('pending');
    expect(sim.timeline.get(call)!.status).toBe('pending');

    const other = twoPlans('time-go-stand');
    const second = answerStop(other.sim, other.stop, 'go').result!;
    expect(answerStop(other.sim, { item: second.interruptedBy!, wanted, sentFrom: second.sentFrom }, 'stand')).toEqual({});
    expect(other.sim.now).toBe(at(8, 28, 2));
    expect(other.sim.timeline.get(other.call)!.status).toBe('pending');
  });

  it('a Skip It that’s refused changes nothing: the refusal is said, the clock and the jump stay at the stop', () => {
    const { sim, late, stop } = twoPlans('time-refused');
    // TEST SETUP: the plan settled before the press, as a second tab or a stale dialog would find it.
    sim.timeline.get(late)!.status = 'done';
    const before = serialise(sim.universe);
    const answer = answerStop(sim, stop, skipIt());
    expect(answer).toEqual({ refused: 'That’s already over: it was kept, missed or called off.' });
    expect(sim.now).toBe(at(8, 27, 23, 30));
    expect(serialise(sim.universe)).toBe(before);
  });

  it('reads a refusal alike from a command that throws and one that answers no, and none from one that went through', () => {
    expect(refusalOf({ ok: false, error: 'No.', events: [] } as never)).toBe('No.');
    expect(refusalOf({ ok: true, value: { ok: false, error: 'Not that.' }, events: [] } as never)).toBe('Not that.');
    expect(refusalOf({ ok: true, value: { ok: true }, events: [] } as never)).toBeUndefined();
    expect(refusalOf({ ok: true, value: { late: true }, events: [] } as never)).toBeUndefined();
  });

  it('carries a choice on only as far as the jump was headed: a stop the live clock made, a second on, stays where it is', () => {
    const item = { at: 1_000_000, durationMinutes: 60 } as ScheduledItem;
    expect(carryOnTo({ item, wanted: item.at + 5 * MS_HOUR, sentFrom: 0 }, skipIt())).toBe(item.at + 5 * MS_HOUR);
    expect(carryOnTo({ item, wanted: item.at + 1_000, sentFrom: 0 }, skipIt())).toBe(item.at + 1_000);
    // Go through the commitment's hours where they end later.
    expect(carryOnTo({ item, wanted: item.at + 1_000, sentFrom: 0 }, 'go')).toBe(item.at + 60 * MS_MINUTE);
    expect(carryOnTo({ item, wanted: item.at + 5 * MS_HOUR, sentFrom: 0 }, 'stand')).toBeUndefined();
    expect(carryOnTo({ item, wanted: item.at + 5 * MS_HOUR, sentFrom: 0 }, { ...skipIt(), then: 'stay' })).toBeUndefined();
  });

  it('PLAYER JOURNEY: Call It Off on a partner’s rehearsal: it’s called off at a cost to their trust, and the jump carries on to a plan across midnight and on to seven', () => {
    const sim = life('pa-yes');
    const asked = (): { a: Assignment; k: PartnerAsk } | undefined => {
      for (const a of courseworkOf(sim, sim.player)!.assignments) { const k = a.asks?.find((x) => x.status === 'open'); if (k) return { a, k }; }
      return undefined;
    };
    // TEST SETUP: the body kept fed and rested a day at a time until a partner asks, as tests/partners.test.ts keeps it.
    for (let d = 31; !asked() && d < 61; d += 1) {
      const until = at(8, 1, 16) + (d - 1) * 24 * MS_HOUR;
      while (sim.now < until) {
        Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
        sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
        sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
      }
    }
    const { a, k } = asked()!;
    sim.must({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    jump(sim, k.at - MS_HOUR);
    const mate = sim.player.school!.classmates[a.partner!]!;
    const trust = trustOf(mate);
    // A plan of the player's own that night, across midnight.
    const day = zonedParts(k.at, NY);
    const late = plan(sim, 'Meet Sam At The Station', instantFromZoned({ year: day.year, month: day.month, day: day.day, hour: 23, minute: 30 }, NY), 60);
    const wanted = nextAtHour(sim.now, sim.zone, ADVANCE_HOURS.morning);
    const first = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    expect(first.interruptedBy?.kind).toBe(PARTNER_KIND);
    expect(sim.now).toBe(k.at);
    const callOff = stopChoices(PARTNER_KIND)[0]!;
    let next = answerStop(sim, { item: first.interruptedBy!, wanted, sentFrom: first.sentFrom }, callOff);
    expect(next.refused).toBeUndefined();
    expect(first.interruptedBy!.status).toBe('cancelled');
    expect(trustOf(mate)).toBeLessThan(trust);
    // Carried on, not ended: past the rehearsal's hour, through every later stop gone to, to seven, the plan across
    // midnight among them.
    expect(sim.now).toBeGreaterThan(k.at);
    const later: string[] = [];
    while (next.result?.interruptedBy) {
      later.push(next.result.interruptedBy.id);
      next = answerStop(sim, { item: next.result.interruptedBy, wanted, sentFrom: next.result.sentFrom }, 'go');
    }
    expect(later).toContain(late);
    expect(sim.now).toBe(wanted);
    expect(sim.timeline.get(late)!.status).toBe('done');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a kind declared elsewhere offers its own choice, as a career appointment’s Ask To Move would: moved, the jump carries on and stops at it again at its new hour', () => {
    const sim = life('time-ask-to-move');
    jump(sim, at(8, 27, 21));
    // TEST SETUP: a kind of commitment and its command, declared here as a career system would declare its own.
    sim.onSchedule('test.meeting', () => undefined);
    sim.onCommand<{ id: string }, { ok: boolean }>('test.ask_to_move', ({ id }, { sim: s }) => {
      const item = s.timeline.get(id)!;
      const moved = s.schedule({ at: item.at + 2 * MS_HOUR, kind: 'test.meeting', label: item.label, category: 'personal', requiresPlayer: true, durationMinutes: 30 });
      s.timeline.cancel(id, s.now);
      return { ok: Boolean(moved) };
    });
    defineStop('test.meeting', [{ label: 'Ask To Move', command: 'test.ask_to_move', payload: (item) => ({ id: item.id }), then: 'carry-on', does: 'asks to move the meeting two hours on', ahead: 'ask to move a meeting' }]);
    expect(stopChoices('test.meeting').map((c) => c.label)).toEqual(['Ask To Move']);
    expect(stopCommands()).toContain('test.ask_to_move');
    const meeting = sim.schedule({ at: at(8, 27, 22), kind: 'test.meeting', label: 'A Meeting', category: 'personal', requiresPlayer: true, durationMinutes: 30 });
    const wanted = nextAtHour(sim.now, sim.zone, ADVANCE_HOURS.morning);
    const first = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    expect(first.interruptedBy?.id).toBe(meeting.id);
    const next = answerStop(sim, { item: first.interruptedBy!, wanted, sentFrom: first.sentFrom }, stopChoices('test.meeting')[0]!);
    expect(next.result!.interruptedBy?.label).toBe('A Meeting');
    expect(sim.now).toBe(at(8, 28, 0));
    expect(sim.timeline.get(meeting.id)!.status).toBe('cancelled');
  });
});

describe('D2: where Tomorrow Morning and the other lines land', () => {
  it('goes to the next seven o’clock: from 2 AM the same date’s, from seven on the next date’s', () => {
    expect(nextAtHour(at(8, 28, 2), NY, ADVANCE_HOURS.morning)).toBe(at(8, 28, 7));
    expect(nextAtHour(at(8, 28, 6, 59), NY, ADVANCE_HOURS.morning)).toBe(at(8, 28, 7));
    expect(nextAtHour(at(8, 28, 7), NY, ADVANCE_HOURS.morning)).toBe(at(8, 29, 7));
    expect(nextAtHour(at(8, 27, 23), NY, ADVANCE_HOURS.morning)).toBe(at(8, 28, 7));
    // The night the clocks go back, 1 November 2026: the same date's seven, eight hours on, by the town's clock.
    const fallBack = instantFromZoned({ year: 2026, month: 11, day: 1, hour: 0, minute: 30 }, NY);
    expect(formatDateTime(nextAtHour(fallBack, NY, ADVANCE_HOURS.morning), NY)).toBe('November 1, 2026 at 7:00 AM');
    // This Evening and Tonight by the same rule.
    expect(nextAtHour(at(8, 28, 2), NY, ADVANCE_HOURS.evening)).toBe(at(8, 28, 18));
    expect(nextAtHour(at(8, 28, 23), NY, ADVANCE_HOURS.tonight)).toBe(at(8, 29, 22));
    // Next Monday: from a Friday the coming one, from a Monday a week on.
    expect(nextMondayAt(at(8, 28, 2), NY)).toBe(at(8, 31, 9));
    expect(nextMondayAt(at(8, 31, 8), NY)).toBe(at(9, 7, 9));
  });

  it('PLAYER JOURNEY: at 2 AM, after a stop, Tomorrow Morning lands that morning and stops at nothing of the day after', () => {
    const { sim, call, wanted, stop } = twoPlans('time-2am');
    const second = answerStop(sim, stop, 'go').result!;
    answerStop(sim, { item: second.interruptedBy!, wanted, sentFrom: second.sentFrom }, 'stand');
    expect(sim.now).toBe(at(8, 28, 2));
    const morning = nextAtHour(sim.now, sim.zone, ADVANCE_HOURS.morning);
    // Until 2026-10-20 it was the next date's seven, past Friday's ten o'clock: the jump stopped there.
    expect(morning).toBe(at(8, 28, 7));
    const r = sim.advanceTo(morning, { stopOnPlayerRequired: true });
    // Standing at the 2 AM call, the next move runs it, and stops at nothing else on the way to seven.
    expect(r.interruptedBy).toBeUndefined();
    expect(sim.timeline.get(call)!.status).toBe('done');
    expect(sim.now).toBe(at(8, 28, 7));
  });
});

describe('D3: the Sleep dialog’s suggestion', () => {
  /** Up at 7:15 AM on Saturday from eight hours slept from 11:15 PM, nothing on the calendar before Sunday at nine. */
  function morning(seed: string) {
    const sim = life(seed);
    jump(sim, at(8, 28, 23, 15));
    sim.must({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(sim.now).toBe(at(8, 29, 7, 15));
    plan(sim, 'Run Lines With Sam', at(8, 30, 9), 60);
    return sim;
  }

  it('PLAYER JOURNEY: at 7:15 AM, up from a night, suggests no more sleep and says why; at 11 PM before a morning commitment, a normal night', () => {
    const sim = morning('time-sleep-morning');
    expect(suggestedSleep(sim)).toEqual({
      hours: SHORTEST_SLEEP,
      // Until 2026-10-21 it went on "A sleep under six hours adds to the sleep you owe, so it’s best kept for the night.": a
      // sleep after the night adds no short night's debt since (brief 20's D3, `applySleep`).
      reason: `You’ve already slept since midnight, and with your energy at ${Math.round(sim.player.wellbeing.energy)} you don’t need more sleep yet.`,
    });
    // The same life that evening, the night ahead of it: a night, as at any bedtime.
    jump(sim, at(8, 29, 23));
    expect(suggestedSleep(sim)).toEqual({ hours: 8, reason: 'A normal night.' });
    // As How This Works and the chapter say it.
    expect(GUIDE_BY_ID['body.sleep']!.reads.find((r) => r.label === 'The Suggestion')!.value).toContain(`it’s a nap: none while your energy is at ${SPENT} or more, and below that the hours that bring it back to full`);
    expect(CHAPTER_BY_ID.sleep!.body[0]).toContain('It suggests a number, from how much sleep you owe, whether you’ve already slept since midnight and when you next need to be somewhere');
  });

  it('suggests a nap that brings energy back when the morning finds it low, cut to end in time for a commitment', () => {
    const sim = morning('time-sleep-tired');
    // TEST SETUP: a body run down by the morning, as a night of poor sleep would leave it.
    sim.player.wellbeing.energy = SPENT - 7;
    const nap = suggestedSleep(sim);
    expect(nap.hours).toBeGreaterThan(SHORTEST_SLEEP);
    expect(nap.reason).toMatch(new RegExp(`^You’ve already slept since midnight, but your energy is down to ${SPENT - 7}\\. .+ would bring it back to full`));
    // Taken, it brings energy back to full, and half an hour less doesn't.
    const twin = morning('time-sleep-tired');
    twin.player.wellbeing.energy = SPENT - 7;
    twin.must({ kind: 'life.sleep', payload: { hours: nap.hours - 0.5 } });
    sim.must({ kind: 'life.sleep', payload: { hours: nap.hours } });
    expect(sim.player.wellbeing.energy).toBeGreaterThanOrEqual(99.5);
    expect(twin.player.wellbeing.energy).toBeLessThan(99.5);

    // With a commitment three hours off, it's cut to what fits, and says both.
    const busy = morning('time-sleep-tired-busy');
    busy.player.wellbeing.energy = SPENT - 7;
    const own = suggestedSleep(busy);
    expect(own.hours).toBeGreaterThan(1.5);
    plan(busy, 'Breakfast With Sam', busy.now + 3 * MS_HOUR, 60);
    expect(suggestedSleep(busy)).toEqual({
      hours: 1.5,
      reason: `“Breakfast With Sam” is in 3 hours. Getting up and there takes an hour and a half, so there’s time for one and a half hours. ${own.reason}`,
    });
  });

  it('keeps back the commitment’s own trip, where it’s longer than across town, and an hour to get up', () => {
    expect(GETTING_UP_MINUTES + IN_TOWN_MINUTES).toBe(90);
    expect(travelMinutesOf({})).toBe(IN_TOWN_MINUTES);
    expect(travelMinutesOf({ travelMinutes: 120 })).toBe(120);
    const twin = (seed: string, travelMinutes?: number) => {
      const sim = life(seed);
      jump(sim, at(8, 29, 23));
      // TEST SETUP: a commitment that wants the player at nine the next morning, with its trip or without one.
      sim.onSchedule('test.audition', () => undefined);
      sim.schedule({ at: at(8, 30, 9), kind: 'test.audition', label: 'An Audition', category: 'personal', requiresPlayer: true, durationMinutes: 60, ...(travelMinutes !== undefined ? { travelMinutes } : {}) });
      return sim;
    };
    const here = twin('time-sleep-trip');
    // Across town, the night isn't cut: ten hours off leaves eight and a half.
    expect(suggestedSleep(here).hours).toBeGreaterThan(6.5);
    expect(suggestedSleep(here).reason).not.toContain('An Audition');
    const away = twin('time-sleep-trip', 150);
    expect(suggestedSleep(away)).toEqual({ hours: 6.5, reason: '“An Audition” is in 10 hours. Getting up takes an hour, and getting there 2 hours and 30 minutes, so there isn’t time for a full night.' });
    // Taken, the night ends in time to get up and make the trip.
    away.must({ kind: 'life.sleep', payload: { hours: suggestedSleep(away).hours } });
    expect(away.now).toBeLessThanOrEqual(at(8, 30, 9) - (60 + 150) * MS_MINUTE);
    // A trip inside the commitment's own hours keeps the hour to get up alone: nine and a half hours before it, a night
    // of eight and a half fits, and the commitment cuts nothing.
    const inside = twin('time-sleep-trip-inside', 0);
    expect(suggestedSleep(inside).reason).not.toContain('An Audition');
    inside.advanceTo(at(8, 30, 0, 30));
    expect(suggestedSleep(inside)).toEqual({ hours: 7.5, reason: '“An Audition” is in 8 hours and 30 minutes. Getting up takes an hour, so there isn’t time for a full night.' });
    // The field is kept on the item only where it's given.
    expect(Object.keys(here.universe.scheduled.find((i) => i.kind === 'test.audition')!)).not.toContain('travelMinutes');
    expect(GUIDE_BY_ID['body.sleep']!.reads.find((r) => r.label === 'The Suggestion')!.value).toContain('keeping an hour to get up and the trip there, half an hour across town');
  });

  it('PLAYER JOURNEY: in the small hours, back from a call after a short sleep, the rest of the night is still the night', () => {
    const sim = life('time-sleep-small-hours');
    jump(sim, at(8, 27, 23, 30));
    plan(sim, 'An Early Call', at(8, 28, 3), 60);
    // To bed for the hours it suggests before the call, up at 1:30, and on to the call and through it.
    const before = suggestedSleep(sim);
    expect(before.hours).toBe(2);
    sim.must({ kind: 'life.sleep', payload: { hours: before.hours } });
    expect(sim.player.lastSleptAt).toBe(at(8, 28, 1, 30));
    jump(sim, at(8, 28, 4));
    expect(sim.now).toBe(at(8, 28, 4));
    // A night, cut short by Friday's ten o'clock, not a nap: until five a sleep is the rest of the night.
    const after = suggestedSleep(sim);
    expect(after.reason).not.toMatch(/already slept since midnight/);
    expect(after).toEqual({ hours: 4.5, reason: '“The Courses And What They Ask” is in 6 hours. Getting up and there takes an hour and a half, so there isn’t time for a full night.' });
  });

  it('with real sleep debt, a morning’s sleep is still a night’s length, and says why', () => {
    const sim = morning('time-sleep-debt');
    // TEST SETUP: weeks of short nights' debt on the books.
    sim.player.wellbeing.sleepDebt = 30;
    const owed = suggestedSleep(sim);
    expect(owed.reason).toBe('You’re carrying real sleep debt.');
    expect(owed.hours).toBeGreaterThanOrEqual(8);
  });

  it('inside a night nobody chose that’s still running, the rest of the night is still the night', () => {
    const sim = life('time-sleep-night-alone');
    jump(sim, at(8, 27, 22));
    // To 2 AM with no stop: a night slept alone from midnight, paid an hour in, and running until a sound sleeper wakes.
    sim.advanceTo(at(8, 28, 2));
    expect(sim.player.nightEndsAt).toBeGreaterThan(sim.now);
    expect(sim.player.lastSleptAt).toBeGreaterThanOrEqual(at(8, 28, 0));
    expect(suggestedSleep(sim).hours).toBeGreaterThan(6);

    // And after five, where only the night still running says so: a jump to a plan at 5:15 AM inside a night slept alone
    // from midnight and paid, the plan gone to, and at 5:45 the rest of the night is a night's suggestion, not a nap's.
    const early = life('time-sleep-night-alone-early');
    jump(early, at(8, 27, 22));
    plan(early, 'An Early Run', at(8, 28, 5, 15), 30);
    const run = at(8, 28, 5, 15);
    const r = early.advanceTo(run, { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.label).toBe('An Early Run');
    answerStop(early, { item: r.interruptedBy!, wanted: run, sentFrom: r.sentFrom }, 'go');
    expect(early.now).toBe(at(8, 28, 5, 45));
    expect(early.player.nightEndsAt).toBeGreaterThan(early.now);
    expect(early.player.lastSleptAt).toBeGreaterThanOrEqual(at(8, 28, 0));
    expect(suggestedSleep(early).reason).not.toMatch(/already slept since midnight/);
  });
});

describe('D5: On The Way foresees what the jump stops at', () => {
  it('PLAYER JOURNEY: a week from a Friday evening lists the next week’s classes before they’re on the calendar, the jump stops at exactly those, and the save isn’t touched', () => {
    const sim = life('time-week');
    jump(sim, at(8, 28, 17, 30));
    const week = sim.now + 7 * 24 * MS_HOUR;
    // The calendar alone holds none of them: the School puts the week on it at six on Sunday evening.
    expect(sim.timeline.between(sim.now, week - 1, (i) => i.requiresPlayer === true)).toEqual([]);
    const before = serialise(sim.universe);
    const listed = onTheWay(sim, week);
    expect(serialise(sim.universe)).toBe(before);
    // The five days of classes, and what's booked on the way (the doctor the week books her with, from 2026-10-20 a visit
    // in the Tuesday's classes), every one foreseen.
    expect(listed.filter((w) => w.item.label === 'Classes').map((w) => formatDateTime(w.item.at, NY))).toEqual(
      [31, 1, 2, 3, 4].map((d) => formatDateTime(at(d === 31 ? 8 : 9, d, 9), NY)),
    );
    expect(listed.every((w) => w.foreseen)).toBe(true);
    // The jump itself, Go at each stop: the same stops.
    const stops = jump(sim, week);
    expect(stops.map((i) => [i.label, i.at])).toEqual(listed.map((w) => [w.item.label, w.item.at]));
  });

  it('lists what the calendar holds as it is, not foreseen, and the two together in order', () => {
    const sim = life('time-week-held');
    jump(sim, at(8, 28, 17, 30));
    const dinner = plan(sim, 'Dinner With Sam', at(8, 29, 19), 90);
    const listed = onTheWay(sim, sim.now + 7 * 24 * MS_HOUR);
    expect(listed[0]).toEqual({ item: sim.timeline.get(dinner), foreseen: false });
    expect(listed.slice(1).every((w) => w.foreseen && w.item.label === 'Classes')).toBe(true);
    // From the Monday, after the School has put the week on the calendar, nothing is foreseen in that week.
    jump(sim, at(8, 31, 8));
    const week = onTheWay(sim, at(9, 4, 23));
    expect(week.filter((w) => w.item.label === 'Classes')).toHaveLength(5);
    expect(week.some((w) => w.foreseen)).toBe(false);
  });
});
