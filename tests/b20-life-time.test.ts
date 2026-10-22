/**
 * Brief 20's D1 for moving the clock (docs/verification/audit-2026-10-21/criteria.md, D1: "time skipping an obligation",
 * "impossible scheduling"; the life area's prompt: Skip, Advance and Go across a commitment, jumping against playing hour
 * by hour, and commitments that clash).
 *
 * - Every way the top bar moves the clock (a jump to a time, Choose An Event's jump to an event, and Go carrying a stopped
 *   jump on) stops at each commitment that wants the player, once, in order, whether it was on the calendar when the
 *   jump began or was put there on the way; and nothing that wants the player is passed silently: each ends kept, and
 *   what the world does without the player (the day's groceries, a statement) is done once on the way.
 * - A week jumped in one move and the same week jumped a morning at a time come to the same save, every dial, balance,
 *   record and notice alike; an afternoon awake in one move and in minute steps, as the live clock moves it, too.
 *   Played an hour at a time with no Sleep, the player keeps the character up, as the game says a player who's there
 *   does: that's where the two should differ, and do.
 * - Two commitments at once are said to clash on the calendar, and settled as the career's are: the one the clock
 *   reaches first is kept, and a plan that starts while the player is at another commitment they went to is missed, with
 *   a notice saying where they were. Until 2026-10-21 both plans were kept, and the entry said Completed of each.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM; plans put on as the Calendar's form puts them (`calendar.schedule`); the
 * clock moved as the top bar moves it, stopping at every commitment and answering Go (`answerStop`).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { answerStop, nextAtHour } from '@/engine/world/clock';
import { entriesBetween, skipTargets } from '@/engine/world/calendar';
import { PLAN_KIND } from '@/engine/world/plans';

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9, mi = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: mi }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** The clock moved to `to` as the top bar moves it: stopped at each commitment, Go pressed. Each stop is returned. */
function go(sim: Simulation, to: number): { id: string; at: number; when: number }[] {
  const stops: { id: string; at: number; when: number }[] = [];
  let r = sim.advanceTo(to, { stopOnPlayerRequired: true });
  for (let n = 0; r.interruptedBy && n < 500; n += 1) {
    stops.push({ id: r.interruptedBy.id, at: r.interruptedBy.at, when: sim.now });
    r = answerStop(sim, { item: r.interruptedBy, wanted: to, sentFrom: r.sentFrom }, 'go').result!;
  }
  return stops;
}
/** What a save holds, but the run's own bookkeeping: what two ways of moving the clock should agree on. */
const state = (sim: Simulation) => {
  const u = JSON.parse(serialise(sim.universe)) as Record<string, unknown> & { meta: Record<string, unknown> };
  delete u.meta.savedAt;
  return u;
};
const wanting = (sim: Simulation, from: number, to: number) => sim.universe.scheduled.filter((i) => i.requiresPlayer === true && i.at > from && i.at <= to);

describe('the clock stops at every commitment, and passes none silently', () => {
  it('a week, a jump to an event and a month, each moved in one press: a stop at each commitment that wants her, in order, once; each kept', () => {
    const sim = student('b20-time-stops');
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: at(2026, 8, 25, 16), durationMinutes: 60 } });
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Run Lines', at: at(2026, 8, 29, 11), durationMinutes: 90 } });
    for (const [label, to] of [['One Week', addDays(sim.now, 7, zone)], ['an event', 0], ['a month', 0]] as const) {
      const from = sim.now;
      const target = label === 'an event' ? skipTargets(sim, 14).at(-1)!.item.at : label === 'a month' ? addDays(sim.now, 30, zone) : to;
      const stops = go(sim, target);
      const due = wanting(sim, from, target);
      // Each one that came due, the School's classes put on the calendar on the way among them, stopped the clock once,
      // at its own time and in order.
      expect(stops.map((s) => s.id)).toEqual(due.sort((a, b) => a.at - b.at || a.priority - b.priority).map((i) => i.id).filter((id) => stops.some((s) => s.id === id)));
      expect(new Set(stops.map((s) => s.id)).size).toBe(stops.length);
      for (const s of stops) expect(s.when).toBe(s.at);
      // None went by unasked: what wants her and fell due is kept, not missed.
      expect(due.filter((i) => i.status === 'missed').map((i) => i.label)).toEqual([]);
      expect(due.length).toBeGreaterThan(0);
    }
    expect(sim.universe.scheduled.filter((i) => i.kind === PLAN_KIND).map((i) => i.status)).toEqual(['done', 'done']);
  });

  it('what the world does without her is done once on the way: a jump of a month buys each midnight’s groceries once, as days moved one at a time do', () => {
    const sim = student('b20-time-groceries');
    const jumped = reload(sim);
    const daily = reload(sim);
    const end = addDays(sim.now, 30, zone);
    go(jumped, end);
    while (daily.now < end) go(daily, Math.min(end, daily.now + MS_DAY));
    const groceries = (s: Simulation) => s.universe.transactions.filter((t) => /groceries/i.test(t.memo ?? '')).map((t) => t.at);
    expect(groceries(jumped).length).toBe(30);
    expect(groceries(jumped)).toEqual(groceries(daily));
  });
});

describe('jumping and moving step by step come to the same save where they should', () => {
  it('a week jumped in one move and the same week jumped to each next morning at seven: every dial, balance, record and notice alike', () => {
    const sim = student('b20-time-same');
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: at(2026, 8, 25, 16), durationMinutes: 60 } });
    const one = reload(sim);
    const mornings = reload(sim);
    // To seven on the Monday a week on, so every move of the mornings' is over an hour. A last move of an hour or less is
    // the player's own, who's up for it (`sleepAlone`, systems/life.ts): ended at 7:30, the mornings' last half hour was
    // charged awake where the one jump left her asleep in the night to 7:30, by design.
    const end = at(2026, 8, 31, 7);
    go(one, end);
    while (mornings.now < end) go(mornings, Math.min(end, nextAtHour(mornings.now, zone, 7)));
    expect(state(mornings)).toEqual(state(one));
  });

  it('an afternoon awake in one move and in minute steps, as the live clock moves it: the same dials to the millionth', () => {
    const sim = student('b20-time-minutes');
    go(sim, at(2026, 8, 24, 12));
    const jump = reload(sim);
    const ticks = reload(sim);
    go(jump, at(2026, 8, 24, 18));
    while (ticks.now < at(2026, 8, 24, 18)) go(ticks, ticks.now + MS_MINUTE);
    for (const [k, v] of Object.entries(jump.player.wellbeing)) expect(ticks.player.wellbeing[k as keyof typeof ticks.player.wellbeing]).toBeCloseTo(v as number, 6);
  });

  it('a week moved an hour at a time with no Sleep keeps her up, as a player who’s there does, where the jump sleeps the nights alone', () => {
    const sim = student('b20-time-hourly');
    const jump = reload(sim);
    const hourly = reload(sim);
    const end = addDays(sim.now, 3, zone);
    go(jump, end);
    while (hourly.now < end) go(hourly, Math.min(end, hourly.now + MS_HOUR));
    // No night since the life began at 7:30 AM (`lastSleptAt`, which a new life sets to its first morning).
    expect(hourly.player.lastSleptAt).toBe(sim.player.lastSleptAt);
    expect(jump.player.lastSleptAt).toBeGreaterThan(sim.now);
    expect(hourly.player.wellbeing.energy).toBeLessThan(jump.player.wellbeing.energy);
    expect(hourly.player.wellbeing.sleepDebt).toBeGreaterThan(jump.player.wellbeing.sleepDebt);
    // Everything else is the clock's alike: the same things fell due and were done.
    expect(hourly.universe.scheduled.map((i) => [i.id, i.status])).toEqual(jump.universe.scheduled.map((i) => [i.id, i.status]));
  });

  it('a stop saved and opened, then Go, comes to the save the stop answered straight on comes to', () => {
    const sim = student('b20-time-saved');
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: at(2026, 8, 25, 16), durationMinutes: 60 } });
    const straight = reload(sim);
    const saved = reload(sim);
    const end = at(2026, 8, 26, 7);
    go(straight, end);
    const r = saved.advanceTo(end, { stopOnPlayerRequired: true });
    expect(r.interruptedBy).toBeDefined();
    const opened = reload(saved);
    const item = opened.timeline.get(r.interruptedBy!.id)!;
    let next = answerStop(opened, { item, wanted: end, sentFrom: r.sentFrom }, 'go').result!;
    for (let n = 0; next.interruptedBy && n < 50; n += 1) next = answerStop(opened, { item: next.interruptedBy, wanted: end, sentFrom: next.sentFrom }, 'go').result!;
    expect(state(opened)).toEqual(state(straight));
  });
});

describe('commitments that clash: said, and settled', () => {
  it('two plans at eight and a third at nine inside the first: the calendar marks all three; the first is kept, the others missed and said with where she was', () => {
    const sim = student('b20-time-clash');
    const dinner = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Dinner', at: at(2026, 8, 24, 20), durationMinutes: 120 } }).id;
    const call = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call Home', at: at(2026, 8, 24, 20), durationMinutes: 60 } }).id;
    const read = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Read', at: at(2026, 8, 24, 21), durationMinutes: 30 } }).id;
    const day = entriesBetween(sim, at(2026, 8, 24, 0), at(2026, 8, 25, 0));
    expect(day.filter((e) => [dinner, call, read].includes(e.id)).map((e) => e.conflicted)).toEqual([true, true, true]);
    const stops = go(sim, at(2026, 8, 24, 23));
    expect(stops.map((s) => s.id).filter((id) => [dinner, call, read].includes(id))).toEqual([dinner, read]);
    expect([dinner, call, read].map((id) => sim.timeline.get(id)!.status)).toEqual(['done', 'missed', 'missed']);
    const said = sim.universe.notifications.filter((n) => n.title === 'You Missed Call Home' || n.title === 'You Missed Read').map((n) => n.body);
    expect(said).toEqual([
      'You were at Dinner until 10:00 PM, and Call Home was at the same time. Missing a plan of your own costs nothing else.',
      'You were at Dinner until 10:00 PM, and Read was at the same time. Missing a plan of your own costs nothing else.',
    ]);
  });

  it('a plan after the first has ended, the same evening, is kept: only the hours they share clash', () => {
    const sim = student('b20-time-noclash');
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Dinner', at: at(2026, 8, 24, 20), durationMinutes: 60 } });
    const after = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Read', at: at(2026, 8, 24, 21), durationMinutes: 30 } }).id;
    expect(entriesBetween(sim, at(2026, 8, 24, 0), at(2026, 8, 25, 0)).find((e) => e.id === after)!.conflicted).toBeUndefined();
    go(sim, at(2026, 8, 24, 23));
    expect(sim.timeline.get(after)!.status).toBe('done');
    expect(sim.universe.notifications.some((n) => n.title === 'You Missed Read')).toBe(false);
  });
});
