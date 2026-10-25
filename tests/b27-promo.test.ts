/**
 * Brief 27, K6 (2026-10-25): a promotional film for a release, loop 34's "Applicable invitation or obligation → check
 * agreement and availability → prepare → attend or respond → complete the activity → apply justified visibility,
 * relationship, or contractual consequences → record the event", and "Publicity should influence exposure where
 * appropriate, not directly manufacture artistic merit or guarantee awards" (`PROMO`). Held here: which parts are called to
 * one and what the contract says it pays (N13 §18.B(3), (5)); a part called, set on a weekday before its release clear of
 * other work, made with the actor by the clock, paid a day performer's minimum, the actor a little more visible and the
 * work's judged quality as it was; one missed, unpaid, and the casting office's direct offer on its strength gone, its twin
 * made and the offer standing; and a film held back, its promotional film set before the later date and none before the first.
 *
 * PLAYER JOURNEYS: a graduate played by the clock (tests/fakes/career-world.ts), the offer accepted through the command, then
 * the clock to the promotional film. TEST SETUP, said where it's done: the offer on the record as casting's draws would leave
 * one; a skilled actor's levels, as years of work would leave them, where the work must be judged Strong; and the fracture
 * that lays the actor up, set by hand as the clock's own draw would leave one. Each part is found where its own draws give
 * the case, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, dateKey, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { PROJECTS, RATES, minimumOn, type ProjectTemplate } from '@/engine/content/careerwork';
import { PROMO } from '@/engine/content/workflows';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { weatherOn } from '@/engine/systems/weather';
import { healthOf } from '@/engine/systems/health';
import { VISIBILITY, visibilityOf } from '@/engine/systems/awards';
import type { Engagement, Opportunity } from '@/engine/systems/pro';
import { DIRECT, OFFER_KIND, RELEASE_KIND, bookedClash, datesOf, directOfferFor, onLocation, payTermsOf, releaseFate, stoppingSky, travels, writtenFor } from '@/engine/systems/projobs';
import { PROMO_KIND, afterWrap, formatOf, loopDrawn, promoDrawn, promoFor, promoPay, promoTerm, voiceOnly, workKey } from '@/engine/systems/workflow';
import { graduate, notices, played, prepareAll, skilled } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
const NY = 'America/New_York';
type Sim = ReturnType<typeof graduate>;
type Fate = NonNullable<ReturnType<typeof releaseFate>>['kind'];

/**
 * A slate part near New Haven a promotional film can be called for, on SAG-AFTRA's day rate, made, its sky letting every day
 * stand, whose release's way out is one of those wanted and whose work's own draw calls it to a promotional film.
 */
function part(sim: Sim, fates: readonly Fate[]): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (!promoFor(t) || t.pay !== 'sag-tv-day' || travels(sim.player, t) || !writtenFor(t, sim.player) || t.slate!.fate.kind !== 'made') continue;
      if (!fates.includes(releaseFate(sim, t).kind)) continue;
      keepProject(sim.player, t);
      const days = datesOf({ projectId: t.id, postedAt: week });
      const city = CITIES.get(t.place.cityId)!;
      if (days.length < 2 || !days.every((d, i) => !onLocation(t, i) || !stoppingSky(weatherOn(sim, city, d.from)))) continue;
      if (!promoDrawn(sim, workKey({ projectId: t.id, days }), t.role.size)) continue;
      if (payTermsOf({ projectId: t.id, postedAt: week }).each !== undefined) return { t, week };
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

/** Booked, prepared by its own steps where asked, as a player presses them, and played to the wrap. */
function wrapped(sim: Sim, t: ProjectTemplate, week: number, prepare = false): Engagement {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  if (prepare) prepareAll(sim, { engagementId: id });
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  for (let n = 0; n < 4 && e.status !== 'finished' && e.status !== 'canceled'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
  expect(e.status).toBe('finished');
  return e;
}

const releaseOf = (sim: Sim, e: Engagement) => sim.universe.scheduled.find((i) => i.kind === RELEASE_KIND && i.refId === e.creditId && i.status === 'pending')!.at;

describe('a promotional film for a release', () => {
  it('is for a lead or a supporting part seen on screen in work released, and the contract says what it pays', () => {
    // A voice, a stage run, a student film, a short for festivals and a smaller part have none; a lead or a supporting part on screen has.
    for (const t of PROJECTS) if (t.medium === 'stage' || voiceOnly(t) || ['student-film', 'non-union-short'].includes(t.kind) || !['lead', 'supporting'].includes(t.role.size)) expect(promoFor(t), t.id).toBe(false);
    expect(PROJECTS.filter((t) => promoFor(t)).length).toBeGreaterThan(0);
    const lead = PROJECTS.find((t) => promoFor(t) && t.pay === 'sag-tv-day')!;
    const at = Date.UTC(2027, 2, 3, 15);
    // Under $25,000 for the work, a day performer's minimum on the day; at $25,000 or more, unpaid; other work, unpaid.
    expect(promoPay(lead, PROMO.bargained - 100, at)).toBe(minimumOn(RATES['sag-tv-day'], dateKey(at, NY)));
    expect(promoPay(lead, PROMO.bargained, at)).toBeUndefined();
    expect(promoPay({ ...lead, union: 'none' }, 1_000_00, at)).toBeUndefined();
    expect(promoTerm(lead, 10_000_00)).toContain('Paid less than $25,000 for the work, you’re paid at least a day performer’s minimum for it, as the agreement sets.');
    expect(promoTerm(lead, 30_000_00)).toContain('Paid $25,000 or more for the work, its pay is yours to bargain, as the agreement sets, and this contract has it unpaid.');
    expect(promoTerm({ ...lead, pay: 'low-budget-day' }, 10_000_00)).toContain('SAG-AFTRA’s Basic Agreement’s rule, which the game applies to this agreement too, its assumption.');
    expect(promoTerm({ ...lead, union: 'none' }, 10_000_00)).toContain('It’s part of the job, unpaid.');
  });

  it('PLAYER JOURNEY: called at the wrap, set before the release on a clear weekday, made by the clock, paid, and the actor a little more visible, the work judged as it was', () => {
    const sim = graduate('b27-promo-made');
    const { t, week } = part(sim, ['on-time', 'streaming']);
    const e = wrapped(sim, t, week);
    // The contract said it, at acceptance.
    expect(e.contract!.clauses.find((c) => c.kind === 'rule' && c.id === 'promo')).toEqual({ kind: 'rule', id: 'promo', words: promoTerm(t, e.contract!.estimate) });
    expect(e.contract!.estimate).toBeLessThan(PROMO.bargained);
    const release = releaseOf(sim, e);
    expect(e.promo?.status).toBe('set');
    const at = e.promo!.at;
    expect(at).toBeGreaterThanOrEqual(addDays(release, -PROMO.before, NY) - MS_DAY);
    expect(at).toBeLessThanOrEqual(addDays(release, -PROMO.latest, NY));
    expect([zonedParts(at, NY).hour, [0, 6].includes(zonedParts(at, NY).weekday)]).toEqual([PROMO.hour, false]);
    expect(sim.universe.scheduled.some((i) => i.kind === PROMO_KIND && i.refId === e.id && i.at === at && i.status === 'pending')).toBe(true);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Calls You For A Promotional Film | `) && n.includes('It pays a day performer’s minimum'))).toBe(true);
    // Its hours are held: another booking on them is refused for it.
    expect(bookedClash(sim.player, [{ from: at + MS_HOUR, to: at + 2 * MS_HOUR }])).toEqual({ label: `${t.project}: Promotional Film`, from: at });
    const band = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.band;
    played(sim, at - MS_HOUR);
    const before = visibilityOf(sim.player, sim.now);
    played(sim, at + (PROMO.hours + 1) * MS_HOUR);
    expect(e.promo!.status).toBe('done');
    // A day performer's minimum, through the work's pay; a little more visible; the band as it was.
    expect(e.pay.find((p) => p.key === `${e.id}:promo`)?.promised).toBe(minimumOn(RATES['sag-tv-day'], dateKey(at, NY)));
    expect(visibilityOf(sim.player, sim.now) - before).toBeCloseTo(VISIBILITY.promo, 3);
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.band).toBe(band);
  }, 300_000);

  it('PLAYER JOURNEY: missed, unpaid, and the casting office’s direct offer on its strength gone; the falsifiability twin made, the offer stands', () => {
    const sim = graduate('b27-promo-missed');
    // TEST SETUP: a skilled actor's levels, so the work, prepared, is judged Strong, as the direct offer needs.
    skilled(sim);
    const { t, week } = part(sim, ['on-time', 'streaming']);
    const e = wrapped(sim, t, week, true);
    expect(['strong', 'exceptional']).toContain(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.band);
    const at = e.promo!.at;
    // TEST SETUP: laid up by a fracture over the promotional film's hours, as the clock's own draw would leave one.
    played(sim, at - 2 * MS_HOUR);
    healthOf(sim.player).injury = { kind: 'fracture', at: at - MS_HOUR, until: at + (PROMO.hours + 1) * MS_HOUR, offWorkUntil: at + (PROMO.hours + 1) * MS_HOUR } as never;
    played(sim, at + (PROMO.hours + 2) * MS_HOUR);
    expect(e.promo!.status).toBe('missed');
    expect(e.pay.some((p) => p.key === `${e.id}:promo`)).toBe(false);
    expect(notices(sim).some((n) => n.startsWith('You Missed The Promotional Film | ') && n.includes(`won’t come straight to you with a part on the strength of ${t.role.part}`))).toBe(true);
    // Another part for the same casting office, on a day its draw would make it a direct offer.
    let found: { t2: ProjectTemplate; when: number } | undefined;
    for (let w = 1; w < 600 && !found; w += 1) {
      const when = sim.now + w * WEEK;
      for (const p of productionsOf(sim, when)) for (const t2 of p.parts) {
        if (found || t2.casting !== t.casting || t2.role.size === 'lead' || t2.id === t.id) continue;
        if (sim.rng('pro.direct', dateKey(when, NY), t2.id).next() < DIRECT.chance) found = { t2, when };
      }
    }
    expect(found).toBeDefined();
    expect(directOfferFor(sim, sim.player, found!.t2, found!.when)).toBeUndefined();
    // TEST SETUP: the falsifiability twin, the same record with the promotional film made.
    e.promo!.status = 'done';
    expect(directOfferFor(sim, sim.player, found!.t2, found!.when)?.engagementId).toBe(e.id);
  }, 300_000);

  it('PLAYER JOURNEY: a film held back has none set for its first date, and one set before the later date when the hold-back is said', () => {
    const sim = graduate('b27-promo-late');
    const { t, week } = part(sim, ['late']);
    const e = wrapped(sim, t, week);
    expect(e.promo).toBeUndefined();
    const first = releaseOf(sim, e);
    played(sim, first + MS_HOUR);
    const later = releaseOf(sim, e);
    expect(later).toBeGreaterThan(first);
    expect(e.promo?.status).toBe('set');
    expect(e.promo!.at).toBeGreaterThan(first);
    expect(e.promo!.at).toBeLessThanOrEqual(addDays(later, -PROMO.latest, NY));
  }, 300_000);

  it('keeps a recall to loop off a reshoot day’s and a promotional film’s hours, where until 2026-10-25 a loop drawn after a reshoot could land on its day', () => {
    const sim = graduate('b27-promo-loop-clear');
    const t = PROJECTS.find((x) => formatOf(x).looping && x.medium !== 'stage')!;
    // TEST SETUP: a finished engagement on the record as a wrap leaves one, found where its own draw recalls it to loop.
    let e: Engagement | undefined;
    for (let n = 0; n < 200 && !e; n += 1) {
      const days = [{ from: sim.now - (n + 10) * MS_DAY, to: sim.now - (n + 10) * MS_DAY + 8 * MS_HOUR, label: 'A Day' }];
      if (loopDrawn(sim, workKey({ projectId: t.id, days })) !== undefined) e = { id: `test-wrapped-${n}`, projectId: t.id, days, status: 'finished', pay: [], history: [], counts: {} } as unknown as Engagement;
    }
    const first = addDays(sim.now, loopDrawn(sim, workKey(e!))!, NY);
    let d = first;
    while ([0, 6].includes(zonedParts(d, NY).weekday)) d = addDays(d, 1, NY);
    const p = zonedParts(d, NY);
    const ten = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 10, minute: 0 }, NY);
    const loopAt = (other: Partial<Engagement>) => {
      const x = { ...e!, history: [], counts: {} } as Engagement;
      delete x.loop;
      sim.player.pro!.engagements = [{ id: 'test-other', projectId: t.id, days: [], status: 'finished', pay: [], history: [], counts: {}, ...other } as unknown as Engagement, x];
      afterWrap(sim, sim.player, x, t, undefined, () => undefined);
      return (sim.player.pro!.engagements[1] as Engagement).loop?.at;
    };
    // The falsifiability test: nothing else set, the loop takes that weekday at ten; a reshoot or a promotional film there, the next.
    expect(loopAt({})).toBe(ten);
    expect(loopAt({ further: { kind: 'reshoot', at: ten - 3 * MS_HOUR, status: 'set' } })).toBeGreaterThan(ten);
    expect(loopAt({ promo: { at: ten, status: 'set' } })).toBeGreaterThan(ten);
  });
});
