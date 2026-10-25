/**
 * Brief 27, K5 (2026-10-25): a weather day on location, Part 11's "Weather should affect production when circumstances
 * justify it" and loop 28 ("A schedule change ... occurs → determine its cause and relevant contractual rules →
 * communicate the issue → ... reschedule ... → update calendar, pay, condition, permissions, and history"). Held here: which
 * days are out on location, by the venue; the sky that stops one (`WEATHER_DAY`); a SAG-AFTRA day performer's day on
 * location called off the evening before, the rest slipped a working day each and played by the clock, the day off paid
 * as N13 Schedule A §4.E pays a day engaged and not used; a non-union part's day off unpaid; a day that can't slip shot
 * without the actor, its scenes cut; and the flight home moved for a part away from home.
 *
 * PLAYER JOURNEYS: a graduate played by the clock (tests/fakes/career-world.ts), the offer accepted through the command.
 * TEST SETUP, said where it's done: the offer on the record as casting's draws would leave one, and another booking where a
 * test needs one. The weather is the save's own, read as the game reads it, never forced: each part is found where its
 * own days' skies make the case.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { MARKETS } from '@/engine/content/slate';
import { PROJECTS, type ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { weatherOn } from '@/engine/systems/weather';
import type { Engagement, Opportunity } from '@/engine/systems/pro';
import { OFFER_KIND, WEATHER_DAY, WORK_DAY_KIND, datesOf, locationShare, onLocation, overtimeHours, payTermsOf, stoppingSky, travels, writtenFor } from '@/engine/systems/projobs';
import { overtimeOf } from '@/engine/systems/contracts';
import { stepOf } from '@/engine/systems/workflow';
import { graduate, notices, played, reload } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;

/** The first day on location of a part posted that week whose own sky stops it, by index, or none. */
function stormyDay(sim: Sim, t: ProjectTemplate, week: number): number | undefined {
  const city = CITIES.get(t.place.cityId)!;
  const days = datesOf({ projectId: t.id, postedAt: week });
  const i = days.findIndex((d, k) => onLocation(t, k) && stoppingSky(weatherOn(sim, city, d.from)) !== undefined);
  return i < 0 ? undefined : i;
}

/** A slate part of the kind wanted, the first whose own days on location meet a stopping sky, and none before it. */
function stormyPart(sim: Sim, pick: (t: ProjectTemplate) => boolean): { t: ProjectTemplate; week: number; day: number } {
  for (let w = 1; w < 300; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      // A production the slate makes, so nothing but the weather moves its days.
      if (!pick(t) || !writtenFor(t, sim.player) || (t.slate && t.slate.fate.kind !== 'made')) continue;
      keepProject(sim.player, t);
      const day = stormyDay(sim, t, week);
      // The day on location to be called off, with none before it, so it's the first the part meets.
      if (day !== undefined && day > 0 && payTermsOf({ projectId: t.id, postedAt: week }).each !== undefined) return { t, week, day };
    }
  }
  throw new Error('no such part');
}

/** TEST SETUP: an offer for a part on the record as casting's draws would leave one, standing three days. */
function offered(sim: Sim, t: ProjectTemplate, postedAt: number): Opportunity {
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const o: Opportunity = {
    id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** Booked through the command, as a player accepts it. */
function booked(sim: Sim, t: ProjectTemplate, week: number): Engagement {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  return sim.player.pro!.engagements.find((e) => e.id === id)!;
}

/** What the work's weeks promise: a recall to loop after the wrap is paid apart, by its own key. */
const weeks = (e: Engagement) => e.pay.filter((p) => !p.key.endsWith(':loop'));
const promised = (e: Engagement) => weeks(e).reduce((n, p) => n + p.promised, 0);
const near = (t: ProjectTemplate) => t.medium !== 'stage';

describe('which days are out on location, and the sky that stops one', () => {
  it('reads the venue: a venue all on location sends every shoot day out, a stage with locations every other, a studio, a booth or a stage play none', () => {
    const venues = MARKETS.flatMap((m) => [...(m.venues.film ?? []), ...(m.venues.television ?? [])]);
    const read = Object.fromEntries(venues.map((v) => [v, locationShare(v)]));
    expect(read).toMatchObject({
      'locations in Brooklyn and Queens': 1, 'a stage in Long Island City and locations upstate': 0.5, 'a studio in Queens': 0, 'a studio lot in Culver City': 0,
      'locations in the Blue Mountains': 1, 'a sound stage in Moore Park and locations on the harbor': 0.5,
    });
    expect(Object.values(read).every((x) => [0, 0.5, 1].includes(x))).toBe(true);
    // A booth, a dub and a stage play are never out, whatever their venue says.
    for (const t of PROJECTS) {
      const days = datesOf({ projectId: t.id, postedAt: 0 });
      const out = days.map((_, i) => onLocation(t, i));
      if (t.medium === 'stage' || locationShare(t.place.venue) === 0) expect(out.every((x) => !x), t.id).toBe(true);
      out.forEach((x, i) => { if (x) expect(WEATHER_DAY.steps, `${t.id} ${i}`).toContain(stepOf(t, i)); });
    }
    // Every other shoot day, from the first, on a venue half on location.
    const half = PROJECTS.find((t) => locationShare(t.place.venue) === 0.5 && t.medium !== 'stage' && datesOf({ projectId: t.id, postedAt: 0 }).length > 2)!;
    const shoots = datesOf({ projectId: half.id, postedAt: 0 }).map((_, i) => i).filter((i) => WEATHER_DAY.steps.includes(stepOf(half, i)));
    expect(shoots.map((i) => onLocation(half, i))).toEqual(shoots.map((_, k) => k % 2 === 0));
  });

  it('stops a day for a thunderstorm, fog or wind at 40 km/h or more, and never for rain, a drizzle or a clear sky', () => {
    expect([stoppingSky({ condition: 'Thunderstorm', windKph: 10 }), stoppingSky({ condition: 'Fog', windKph: 5 }), stoppingSky({ condition: 'Windy', windKph: 40 })]).toEqual(['thunderstorms', 'thick fog', 'high winds']);
    expect([stoppingSky({ condition: 'Rain', windKph: 20 }), stoppingSky({ condition: 'Drizzle', windKph: 10 }), stoppingSky({ condition: 'Clear', windKph: 39 })]).toEqual([undefined, undefined, undefined]);
  });
});

describe('a weather day', () => {
  it('PLAYER JOURNEY: a SAG-AFTRA day performer’s day on location is called off the evening before, the rest slip a working day each and are worked, and the day off is paid', () => {
    const sim = graduate('b27-weather-sag');
    const { t, week, day } = stormyPart(sim, (x) => near(x) && !travels(sim.player, x) && x.pay === 'sag-tv-day');
    const e = booked(sim, t, week);
    const before = e.days.map((d) => d.from);
    const pay = promised(e);
    const rate = e.contract!.rate!;
    // Saved and opened the morning before: the twin meets the same sky and does the same.
    played(sim, before[day]! - 2 * MS_DAY);
    const twin = reload(sim);
    played(sim, before[day]! - MS_HOUR);
    played(twin, before[day]! - MS_HOUR);
    const te = twin.player.pro!.engagements.find((x) => x.id === e.id)!;
    expect([te.weather, te.days, te.pay.map((p) => [p.key, p.promised, p.due])]).toEqual([e.weather, e.days, e.pay.map((p) => [p.key, p.promised, p.due])]);
    // Called off, said, the day it was kept.
    expect(e.weather).toEqual([expect.objectContaining({ day, was: before[day], slipped: true })]);
    expect(notices(sim).some((n) => n.startsWith(`A Weather Day On ${t.project} | `) && n.includes('called off your day on location and slipped the rest of your days a working day each'))).toBe(true);
    // The days before it stand; it and each after it a working day later, on the calendar too.
    expect(e.days.slice(0, day).map((d) => d.from)).toEqual(before.slice(0, day));
    for (let i = day; i < before.length; i += 1) expect(e.days[i]!.from, String(i)).toBeGreaterThan(before[i]!);
    const items = sim.universe.scheduled.filter((x) => x.kind === WORK_DAY_KIND && x.payload.engagementId === e.id && x.status === 'pending');
    expect(items.map((x) => x.at).sort((a, b) => a - b)).toEqual(e.days.slice(day).map((d) => d.from));
    // The day off paid as a day (N13 Schedule A §4.E), no overtime on it: one day's rate more.
    expect(promised(e) - pay).toBe(rate);
    // Every day worked, by the clock, and the pay received.
    played(sim, e.days[e.days.length - 1]!.to + 21 * MS_DAY);
    expect(e.log!.filter((l) => l.status === 'worked').length).toBe(before.length);
    expect(e.status).toBe('finished');
    expect(weeks(e).every((p) => p.received)).toBe(true);
    expect(weeks(e).reduce((n, p) => n + p.received!.gross, 0)).toBe(pay + rate);
  }, 240_000);

  it('PLAYER JOURNEY: the falsifiability test: the same kind of part on days the sky allows has no weather day, and its pay is what was promised', () => {
    const sim = graduate('b27-weather-clear');
    let found: { t: ProjectTemplate; week: number } | undefined;
    for (let w = 1; w < 60 && !found; w += 1) {
      const week = sim.now + w * WEEK;
      for (const p of productionsOf(sim, week)) for (const t of p.parts) {
        if (found || !near(t) || travels(sim.player, t) || t.pay !== 'sag-tv-day' || !writtenFor(t, sim.player) || (t.slate && t.slate.fate.kind !== 'made')) continue;
        keepProject(sim.player, t);
        const days = datesOf({ projectId: t.id, postedAt: week });
        if (days.some((_, i) => onLocation(t, i)) && stormyDay(sim, t, week) === undefined) found = { t, week };
      }
    }
    const e = booked(sim, found!.t, found!.week);
    const before = e.days.map((d) => d.from);
    const pay = promised(e);
    played(sim, e.days[e.days.length - 1]!.to + 21 * MS_DAY);
    expect([e.weather, e.days.map((d) => d.from), promised(e)]).toEqual([undefined, before, pay]);
  }, 240_000);

  it('PLAYER JOURNEY: a non-union part’s day off isn’t paid: every day worked, and the pay what was promised', () => {
    const sim = graduate('b27-weather-nonunion');
    const { t, week, day } = stormyPart(sim, (x) => near(x) && !travels(sim.player, x) && x.union === 'none' && x.pay === 'non-union-day');
    const e = booked(sim, t, week);
    const pay = promised(e);
    played(sim, e.days[day]!.from - MS_HOUR);
    expect(e.weather?.[0]?.slipped).toBe(true);
    expect(promised(e)).toBe(pay);
    expect(notices(sim).find((n) => n.startsWith(`A Weather Day On ${t.project} | `))).toContain('This work pays the days you work, so the day off isn’t paid; every day you work still is.');
  }, 240_000);

  it('PLAYER JOURNEY: a day that can’t slip, another booking on the day it would need, is shot without the actor: its scenes cut, the day paid on SAG-AFTRA’s day rate without overtime, and the work finished on time', () => {
    const sim = graduate('b27-weather-lost');
    const { t, week, day } = stormyPart(sim, (x) => near(x) && !travels(sim.player, x) && x.pay === 'sag-tv-day');
    const e = booked(sim, t, week);
    const last = e.days[e.days.length - 1]!;
    // TEST SETUP: another booking on each of the five days after the last, as an accepted offer would leave it.
    const other: Engagement = { id: 'other', opportunityId: 'other-o', projectId: t.id, role: 'Another Part', status: 'booked', days: Array.from({ length: 5 }, (_, k) => ({ from: last.from + (k + 1) * MS_DAY, to: last.to + (k + 1) * MS_DAY, label: 'Another Job' })), pay: [], history: [], counts: {} };
    sim.player.pro!.engagements.push(other);
    const before = e.days.map((d) => d.from);
    const overtime = overtimeOf(e.contract!.rate!, overtimeHours(e.days[day]!));
    const pay = promised(e);
    played(sim, before[day]! - MS_HOUR);
    expect(e.weather).toEqual([expect.objectContaining({ day, slipped: false })]);
    expect(e.days.map((d) => d.from)).toEqual(before);
    expect((e.units ?? []).filter((u) => u.day === day).every((u) => u.cut)).toBe(true);
    // The day's rate stands; its overtime goes, since no hour of it was worked.
    expect(pay - promised(e)).toBe(overtime);
    expect(notices(sim).find((n) => n.startsWith(`A Weather Day On ${t.project} | `))).toContain('It couldn’t slip your days, since you’re booked on a day it would need');
    sim.player.pro!.engagements.splice(sim.player.pro!.engagements.indexOf(other), 1);
    played(sim, last.to + 2 * MS_HOUR);
    expect(e.log!.some((l) => l.day === day)).toBe(false);
    expect(e.status).toBe('finished');
  }, 240_000);

  it('PLAYER JOURNEY: away from home, the flight home moves with the slipped days', () => {
    const sim = graduate('b27-weather-away');
    const { t, week, day } = stormyPart(sim, (x) => near(x) && travels(sim.player, x) && CITIES.get(x.place.cityId)!.countryId === 'us');
    const e = booked(sim, t, week);
    const trip = sim.player.pro!.trips!.find((x) => x.id === e.tripId)!;
    const home = trip.legs.find((l) => l.way === 'back')!.departs;
    played(sim, e.days[day]!.from - MS_HOUR);
    expect(e.weather?.[0]?.slipped).toBe(true);
    const back = trip.legs.filter((l) => l.way === 'back' && l.status === 'booked');
    expect(back[0]!.departs).toBeGreaterThan(home);
    expect(back[0]!.departs).toBeGreaterThan(e.days[e.days.length - 1]!.to);
    expect(trip.stay.to).toBe(back[0]!.departs);
    expect(notices(sim).find((n) => n.startsWith(`A Weather Day On ${t.project} | `))).toContain('Your flight home moves with them');
    // And home after the last day, not before, however many weather days the part meets (`WEATHER_DAY.most`).
    for (let n = 0; n <= WEATHER_DAY.most; n += 1) played(sim, e.days[e.days.length - 1]!.to + 3 * MS_DAY);
    expect(e.log!.filter((l) => l.status === 'worked').length).toBe(e.days.length);
    const flown = trip.legs.filter((l) => l.way === 'back' && l.status === 'done');
    expect(flown[0]!.departs).toBeGreaterThan(e.days[e.days.length - 1]!.to);
    expect(trip.status).toBe('home');
  }, 240_000);
});

describe('a flight home missed', () => {
  it('PLAYER JOURNEY: asleep for the car to the airport, the way home is booked again a day later, and flown: the trip ends at home', () => {
    const sim = graduate('b27-missed-home');
    let found: { t: ProjectTemplate; week: number } | undefined;
    for (let w = 1; w < 120 && !found; w += 1) {
      const week = sim.now + w * WEEK;
      for (const p of productionsOf(sim, week)) for (const t of p.parts) {
        if (found || !near(t) || !travels(sim.player, t) || CITIES.get(t.place.cityId)!.countryId !== 'us' || !writtenFor(t, sim.player) || (t.slate && t.slate.fate.kind !== 'made')) continue;
        keepProject(sim.player, t);
        if (payTermsOf({ projectId: t.id, postedAt: week }).each !== undefined) found = { t, week };
      }
    }
    const e = booked(sim, found!.t, found!.week);
    const trip = sim.player.pro!.trips!.find((x) => x.id === e.tripId)!;
    for (let n = 0; n <= WEATHER_DAY.most; n += 1) played(sim, e.days[e.days.length - 1]!.to + MS_HOUR);
    const car = trip.legs.find((l) => l.way === 'back' && l.status === 'booked')!;
    // TEST SETUP: asleep from an hour before the car, as a body that hasn't woken is.
    played(sim, car.departs - MS_HOUR);
    sim.player.awakeSince = car.departs + 3 * MS_HOUR;
    sim.advanceTo(car.departs + 2 * MS_HOUR);
    expect(car.status).toBe('missed');
    expect(notices(sim).some((n) => n.startsWith('You Missed Your Flight Home | '))).toBe(true);
    const again = trip.legs.filter((l) => l.way === 'back' && l.status === 'booked');
    expect(again[0]!.departs).toBe(car.departs + MS_DAY);
    played(sim, again[again.length - 1]!.arrives + MS_HOUR);
    // Until 2026-10-25 the way home booked again waited on the canceled leg before it, canceled itself, and left the trip there.
    expect(again.every((l) => l.status === 'done')).toBe(true);
    expect(trip.status).toBe('home');
  }, 240_000);
});
