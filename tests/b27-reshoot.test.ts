/**
 * Brief 27, K5 (2026-10-25): a reshoot day or a voice pickup session after the wrap, Part 10's "pickups, ADR, and
 * reshoots", Part 11's and loop 29's ("ADR, pickups, or reshoots: request arrives → check contract and availability →
 * schedule and complete the work → update compensation and project status"). Held here: a feature's reshoot, drawn by the
 * work, set on a weekday clear of other work, played by the clock, its scenes taken again and the better take kept, the
 * credit's band read again, paid a day; one slept through, its scenes done without the actor and cut, unpaid; a voice part's
 * pickup session in a booth near home; none for a part shot away from home; and a reshoot day holding the actor's date.
 *
 * PLAYER JOURNEYS: a graduate played by the clock (tests/fakes/career-world.ts), the offer accepted through the command.
 * TEST SETUP, said where it's done: the offer on the record as casting's draws would leave one, the skilled actor's levels.
 * Each part is found where the game's own draw for its work gives the case, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { AFTER_WRAP, FORMATS } from '@/engine/content/workflows';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { weatherOn } from '@/engine/systems/weather';
import type { Engagement, Opportunity } from '@/engine/systems/pro';
import { OFFER_KIND, bookedClash, datesOf, onLocation, payTermsOf, stoppingSky, travels, writtenFor } from '@/engine/systems/projobs';
import { FURTHER_KIND, furtherDrawn, furtherHours, keptBand, workKey } from '@/engine/systems/workflow';
import { graduate, notices, played, skilled } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;

/** No day of the part's on location meets a stopping sky, so its days stand as booked and its work's key with them. */
function clearSky(sim: Sim, t: ProjectTemplate, week: number): boolean {
  const city = CITIES.get(t.place.cityId)!;
  return datesOf({ projectId: t.id, postedAt: week }).every((d, i) => !onLocation(t, i) || !stoppingSky(weatherOn(sim, city, d.from)));
}

/** A slate part of the kind wanted, made, its sky clear, whose work's own draw after the wrap gives a further day (or none, `want` false). */
function partWith(sim: Sim, pick: (t: ProjectTemplate) => boolean, want = true): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 300; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (!pick(t) || !writtenFor(t, sim.player) || (t.slate && t.slate.fate.kind !== 'made')) continue;
      keepProject(sim.player, t);
      if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined || !clearSky(sim, t, week)) continue;
      const key = workKey({ projectId: t.id, days: datesOf({ projectId: t.id, postedAt: week }) });
      if ((furtherDrawn(sim, key) !== undefined) === want) return { t, week };
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

/** Booked through the command and played to the wrap. */
function wrapped(sim: Sim, t: ProjectTemplate, week: number): Engagement {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  for (let n = 0; n < 4 && e.status !== 'finished' && e.status !== 'canceled'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
  return e;
}

const feature = (sim: Sim) => (t: ProjectTemplate) => FORMATS[t.format].further === 'reshoot' && !travels(sim.player, t);

describe('a further day after the wrap', () => {
  it('is a feature’s reshoot or a voice part’s pickup session, and nothing for a play, a series episode, a dub or capture', () => {
    expect(Object.values(FORMATS).filter((f) => f.further).map((f) => [f.id, f.further])).toEqual([
      ['independent-feature', 'reshoot'], ['studio-feature', 'reshoot'], ['tv-movie', 'reshoot'], ['animated-feature', 'pickup'], ['animated-series', 'pickup'], ['action-feature', 'reshoot'],
    ]);
    expect([AFTER_WRAP.further, furtherHours('reshoot'), furtherHours('pickup')]).toEqual([0.2, 9, 4]);
  });

  it('PLAYER JOURNEY: a feature’s reshoot is called, set clear of other work, played by the clock, its weakest scenes taken again and the better take kept, and paid a day; it holds the date against another offer', () => {
    const sim = graduate('b27-reshoot-done');
    skilled(sim);
    const { t, week } = partWith(sim, feature(sim));
    const e = wrapped(sim, t, week);
    expect(e.status).toBe('finished');
    const f = e.further!;
    expect([f.kind, f.status]).toEqual(['reshoot', 'set']);
    expect(f.at - e.days.at(-1)!.to).toBeGreaterThan((AFTER_WRAP.furtherFrom - 2) * MS_DAY);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Calls You Back To Reshoot | `) && n.includes('It pays a day.'))).toBe(true);
    expect(sim.universe.scheduled.some((i) => i.kind === FURTHER_KIND && i.refId === e.id && i.status === 'pending' && i.at === f.at)).toBe(true);
    // The reshoot holds its day: another offer on it would clash.
    expect(bookedClash(sim.player, [{ from: f.at + MS_HOUR, to: f.at + 2 * MS_HOUR }])?.label).toBe(`${t.project}: Reshoot Day`);
    const weakest = [...(e.units ?? [])].filter((u) => u.takes?.length && !u.cut && u.by !== 'double').sort((a, b) => (a.best ?? 0) - (b.best ?? 0)).slice(0, 2).map((u) => ({ id: u.id, best: u.best! }));
    played(sim, f.at + furtherHours('reshoot') * MS_HOUR + MS_HOUR);
    expect(f.status).toBe('done');
    expect(f.units!.map((u) => u.id)).toEqual(weakest.map((w) => `further-${w.id}`));
    for (const w of weakest) {
      const u = e.units!.find((x) => x.id === w.id)!;
      const again = f.units!.find((x) => x.id === `further-${w.id}`)!;
      expect(u.best).toBe(Math.max(w.best, again.best!));
    }
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.band).toBe(keptBand(e));
    const p = e.pay.find((x) => x.key === `${e.id}:further`)!;
    expect(p.promised).toBe(e.contract!.per === 'week' ? Math.round(e.contract!.rate! / 5) : e.contract!.rate!);
    played(sim, p.due + 3 * MS_DAY);
    expect(p.received?.gross).toBe(p.promised);
  }, 300_000);

  it('PLAYER JOURNEY: a reshoot slept through is done without the actor: its scenes cut from the part, the credit’s band read again, and nothing paid', () => {
    const sim = graduate('b27-reshoot-missed');
    skilled(sim);
    const { t, week } = partWith(sim, feature(sim));
    const e = wrapped(sim, t, week);
    const f = e.further!;
    // TEST SETUP: asleep from an hour before the call, as a body that hasn't woken is.
    played(sim, f.at - MS_HOUR);
    sim.player.awakeSince = f.at + 12 * MS_HOUR;
    sim.advanceTo(f.at + 2 * MS_HOUR);
    expect(f.status).toBe('missed');
    expect((e.units ?? []).filter((u) => u.cut).length).toBeGreaterThan(0);
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.band).toBe(keptBand(e));
    expect(e.pay.some((x) => x.key === `${e.id}:further`)).toBe(false);
    expect(notices(sim).some((n) => n.startsWith('You Missed The Reshoot | ') && n.includes('cut from the part. It isn’t paid.'))).toBe(true);
  }, 300_000);

  it('PLAYER JOURNEY: a voice part’s pickup session, four hours in a booth near home, recorded and paid a session', () => {
    const sim = graduate('b27-pickup');
    skilled(sim);
    const { t, week } = partWith(sim, (x) => FORMATS[x.format].further === 'pickup');
    const e = wrapped(sim, t, week);
    const f = e.further!;
    expect([f.kind, f.status]).toEqual(['pickup', 'set']);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Calls You Back For Pickups | `))).toBe(true);
    played(sim, f.at + furtherHours('pickup') * MS_HOUR + MS_HOUR);
    expect(f.status).toBe('done');
    expect(f.units!.length).toBeGreaterThan(0);
    expect(e.pay.find((x) => x.key === `${e.id}:further`)?.promised).toBe(e.contract!.rate!);
  }, 300_000);

  it('PLAYER JOURNEY: the falsifiability test: a feature shot away from home, its draw giving one, has no reshoot, since it would need the actor on its set', () => {
    const sim = graduate('b27-reshoot-away');
    skilled(sim);
    const { t, week } = partWith(sim, (x) => FORMATS[x.format].further === 'reshoot' && travels(sim.player, x) && CITIES.get(x.place.cityId)!.countryId === 'us');
    const e = wrapped(sim, t, week);
    expect(e.status).toBe('finished');
    expect(e.further).toBeUndefined();
  }, 300_000);
});
