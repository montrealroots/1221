/**
 * Brief 27, K5 (2026-10-25): a day the actor can't work, laid up or in hospital, shot around (`ILL_DAY`), loop 28's "A
 * schedule change, illness, conflict, absence ... → determine its cause and relevant contractual rules → ... reschedule,
 * excuse, warn, replace ... Do not impose replacement automatically after one universal number of mistakes unless a
 * specific established game arrangement supports it". Held here: a lead's or a supporting part's production shoots around
 * one such day, the rest slipped a working day each and worked by the clock, the day unpaid (N13 Schedule A §4.E's
 * exception); a smaller part recast as before; a second such day recast too.
 *
 * PLAYER JOURNEYS: a graduate played by the clock (tests/fakes/career-world.ts), the offer accepted through the command.
 * TEST SETUP, said where it's done: the offer on the record as casting's draws would leave one, and the injury that lays
 * the actor up, set by hand as the clock's own draw would leave one. Each part is found where its own sky lets its days
 * stand, so only the illness moves them.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { weatherOn } from '@/engine/systems/weather';
import { healthOf } from '@/engine/systems/health';
import type { Engagement, Opportunity } from '@/engine/systems/pro';
import { ILL_DAY, OFFER_KIND, datesOf, onLocation, payTermsOf, stoppingSky, travels, writtenFor } from '@/engine/systems/projobs';
import { graduate, notices, played } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;

/** A slate part near New Haven of the size wanted, on SAG-AFTRA's day rate, made, at least three days, its sky letting every day stand. */
function part(sim: Sim, sizes: readonly string[]): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 300; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (!sizes.includes(t.role.size) || t.medium === 'stage' || t.pay !== 'sag-tv-day' || travels(sim.player, t) || !writtenFor(t, sim.player) || (t.slate && t.slate.fate.kind !== 'made')) continue;
      keepProject(sim.player, t);
      const days = datesOf({ projectId: t.id, postedAt: week });
      const city = CITIES.get(t.place.cityId)!;
      if (days.length >= 3 && days.every((d, i) => !onLocation(t, i) || !stoppingSky(weatherOn(sim, city, d.from)))) return { t, week };
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

function booked(sim: Sim, t: ProjectTemplate, week: number): Engagement {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  return sim.player.pro!.engagements.find((e) => e.id === id)!;
}

/** TEST SETUP: laid up by a fracture from an hour before a day's call to the end of it, as the clock's own draw would leave one. */
function laidUpFor(sim: Sim, e: Engagement, i: number): void {
  const d = e.days[i]!;
  played(sim, d.from - 2 * MS_HOUR);
  healthOf(sim.player).injury = { kind: 'fracture', at: d.from - MS_HOUR, until: d.to + MS_HOUR, offWorkUntil: d.to + MS_HOUR } as never;
  played(sim, d.from + MS_HOUR);
}

const promised = (e: Engagement) => e.pay.filter((p) => !p.key.endsWith(':loop') && !p.key.endsWith(':further')).reduce((n, p) => n + p.promised, 0);

describe('a day the actor can’t work, shot around', () => {
  it('PLAYER JOURNEY: a lead’s or a supporting part’s production shoots around a day laid up, the rest slipped and worked by the clock, the day unpaid', () => {
    const sim = graduate('b27-ill-shot-around');
    const { t, week } = part(sim, ILL_DAY.sizes);
    const e = booked(sim, t, week);
    const before = e.days.map((d) => d.from);
    const pay = promised(e);
    laidUpFor(sim, e, 1);
    expect(e.ill).toEqual([expect.objectContaining({ day: 1, was: before[1] })]);
    expect(e.status).not.toBe('canceled');
    expect(e.days[0]!.from).toBe(before[0]);
    for (let i = 1; i < before.length; i += 1) expect(e.days[i]!.from, String(i)).toBeGreaterThan(before[i]!);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Shoots Around You | You were laid up on `) && n.includes('A day lost to your own illness or injury isn’t paid, SAG-AFTRA’s agreement’s exception'))).toBe(true);
    // The day itself is unpaid; every day is still worked, so the work pays what it promised.
    expect(promised(e)).toBe(pay);
    for (let n = 0; n < 3 && e.status !== 'finished'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
    expect(e.status).toBe('finished');
    expect(e.log!.filter((l) => l.status === 'worked').length).toBe(before.length);
    expect(e.log!.some((l) => l.status === 'missed')).toBe(false);
  }, 300_000);

  it('PLAYER JOURNEY: the falsifiability test: a smaller part laid up the same way is recast, as it was', () => {
    const sim = graduate('b27-ill-recast');
    const { t, week } = part(sim, ['featured', 'co-star']);
    const e = booked(sim, t, week);
    laidUpFor(sim, e, 1);
    expect(e.ill).toBeUndefined();
    expect(e.status).toBe('canceled');
    expect(e.log!.find((l) => l.day === 1)?.status).toBe('missed');
  }, 300_000);

  it('PLAYER JOURNEY: a second day lost the same way is recast: the production waits once', () => {
    const sim = graduate('b27-ill-twice');
    const { t, week } = part(sim, ILL_DAY.sizes);
    const e = booked(sim, t, week);
    laidUpFor(sim, e, 1);
    expect(e.ill?.length).toBe(1);
    laidUpFor(sim, e, 2);
    expect(e.ill?.length).toBe(1);
    expect(e.status).toBe('canceled');
    // The day worked before it is still paid.
    expect(e.pay.some((p) => p.promised > 0)).toBe(true);
  }, 300_000);
});
