/**
 * Brief 27, offers and auditions (2026-10-25): negotiation through representation, the supplement's loop 18 ("Initial
 * terms → player and representative identify negotiable items → propose changes → other party responds → terms may
 * improve, remain unchanged, trade off, expire, or be withdrawn → player reviews the latest coherent version → signs or
 * declines ... Negotiation is not unlimited rerolling for better pay") and Part 10 ("negotiation through representation").
 * Held here: the agent asks about the term the player chooses, once; each answer the loop names changes what books and
 * pays the work: another guaranteed episode books and pays its days, a trade-off books one fewer for more a day, no raise
 * on the option renews the next season at the same rate, the promotional film bargained is paid, and an offer withdrawn
 * can't be accepted. Without an agent nobody asks.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: the agreement (`represent`), an offer put on the record as casting's draws would leave
 * one, the option's day brought to the clock, and the promotional film's release set so its call falls before the shoot.
 * Each fixture's draw is read as the game reads it, never forced. The twin is the same save, reloaded, that doesn't
 * negotiate.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, formatDate } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { seriesById } from '@/engine/content/series';
import { PROMO } from '@/engine/content/workflows';
import { keepProject, slatePartsAt } from '@/engine/systems/slate';
import type { Engagement, Opportunity } from '@/engine/systems/pro';
import { NEGOTIATE, OFFER_KIND, askMoreRefusal, callPromo, datesOf, payTermsOf, travels, writtenFor } from '@/engine/systems/projobs';
import { TERMS, askShare, offerEstimate, ownDay, promoMinimum, withdrawChance } from '@/engine/systems/offers';
import { OPTION_RAISE, clauseOf } from '@/engine/systems/contracts';
import { OPTION_KIND, seasonMade } from '@/engine/systems/series';
import { promoDrawn, promoFor, workKey } from '@/engine/systems/workflow';
import { negotiatedAmount } from '@/engine/systems/propay';
import { graduate, notices, played, reload } from './fakes/career-world';
import { represent } from './fakes/b20-career';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;
type Item = 'pay' | 'episodes' | 'promo';

/** The game's own draws for an ask, read as `answerAsk` reads them for an offer with no round judged and no work before. */
const draws = (sim: Sim, t: ProjectTemplate, week: number, item: Item) => ({
  yes: (item === 'pay' ? sim.rng('pro.negotiate', t.id, week) : sim.rng('pro.negotiate', t.id, week, item)).next() < NEGOTIATE.yes.working,
  trade: sim.rng('pro.trade', t.id, week, item).next() < TERMS.trade,
  withdraw: sim.rng('pro.withdraw', t.id, week, item).next(),
});

/** TEST SETUP: an offer for a part put on the record as `makeOffer` would leave one, represented at scale plus ten, standing three days. */
function offered(sim: Sim, t: ProjectTemplate, postedAt: number): Opportunity {
  keepProject(sim.player, t, t.series ? seriesById(t.series) : undefined);
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const agreement = sim.player.pro!.agreements.find((a) => a.status === 'accepted');
  const o: Opportunity = {
    id: `test-${t.id}`, projectId: t.id, via: agreement ? 'agent' : 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    ...(agreement ? { agentId: agreement.agentId, agreementId: agreement.id } : {}),
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: negotiatedAmount(terms.each, t.union, agreement !== undefined) } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** A recurring part near New Haven on a series in production, with its guaranteed episodes' days to come, matching. */
function recurring(sim: Sim, pick: (t: ProjectTemplate, week: number) => boolean): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 160; w += 1) {
    const week = sim.now + w * WEEK;
    for (const t of slatePartsAt(sim, week)) {
      if (t.schedule.kind !== 'episodes' || travels(sim.player, t) || !writtenFor(t, sim.player)) continue;
      const s = seriesById(t.series!)!;
      // Room in the season for one more guaranteed episode than the part's own.
      if (datesOf({ projectId: t.id, postedAt: week, offer: { episodes: t.schedule.guaranteed + 1 } }).length < (t.schedule.guaranteed + 1) * s.daysEach) continue;
      if (pick(t, week)) return { t, week };
    }
  }
  throw new Error('no such part');
}

const accept = (sim: Sim, o: Opportunity): Engagement => {
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  return sim.player.pro!.engagements.find((e) => e.id === id)!;
};
const ask = (sim: Sim, o: Opportunity, item: Item) => sim.must<{ asked: number; answerAt: number }>({ kind: 'pro.ask_more', payload: { opportunityId: o.id, item } });

describe('negotiating a term through the agent', () => {
  it('PLAYER JOURNEY: another guaranteed episode asked for and given by its draw books and pays its days; the twin who doesn’t ask books two episodes and is promised less', () => {
    const sim = graduate('b27-terms-episodes');
    represent(sim);
    const { t, week } = recurring(sim, (x, wk) => { const d = draws(sim, x, wk, 'episodes'); return d.yes && d.withdraw >= TERMS.withdraw.most; });
    played(sim, week);
    const twin = reload(sim);
    const s = seriesById(t.series!)!;
    const g = t.schedule.kind === 'episodes' ? t.schedule.guaranteed : 0;
    const o = offered(sim, t, week);
    // TEST SETUP: its decision in What Needs You, as `makeOffer` raises one.
    sim.requireDecision({ urgency: 80, category: 'career', title: `An Offer For ${t.role.part}`, dueAt: o.offer!.until, refType: 'pro.offer', refId: o.id, detail: `The offer guarantees ${g} episodes.` });
    const r = ask(sim, o, 'episodes');
    expect(r.asked).toBe(g + 1);
    expect(o.history.find((h) => h.key === 'asked')!.words).toMatch(new RegExp(`asked .* to guarantee ${g + 1 === 3 ? 'three' : g + 1} episodes of the season, one more than (its|their) offer\\.$`));
    // Once an offer: not rerolling.
    expect(askMoreRefusal(sim, sim.player, o, 'pay')).toMatch(/has asked; the answer comes on /);
    played(sim, r.answerAt + MS_HOUR);
    expect([o.offer!.episodes, o.offer!.version, o.offer!.asked!.answer, o.status]).toEqual([g + 1, 2, 'raised', 'offered']);
    expect(notices(sim).some((n) => n.startsWith(`The Offer For ${t.role.part} Is Improved | `))).toBe(true);
    // What Needs You says the latest version, not only the first.
    const q = Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain(`Since then: ${o.history.find((h) => h.key === 'answered')!.words}`);
    expect(q.dueAt).toBe(o.offer!.until);
    const e = accept(sim, o);
    expect(e.days).toHaveLength((g + 1) * s.daysEach);
    expect(clauseOf(e.contract, 'episodes')!.guaranteed).toBe(g + 1);
    expect(clauseOf(e.contract, 'episodes')!.numbers).toHaveLength(g + 1);
    // The falsifiability twin: the same save, no ask, books the part's own two and is promised less for them.
    const e2 = accept(twin, offered(twin, t, week));
    expect(e2.days).toHaveLength(g * s.daysEach);
    expect(clauseOf(e2.contract, 'episodes')!.guaranteed).toBe(g);
    expect(e.contract!.estimate).toBeGreaterThan(e2.contract!.estimate);
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBeGreaterThan(e2.pay.reduce((n, p) => n + p.promised, 0));
  }, 240_000);

  it('PLAYER JOURNEY: the pay refused by its draw comes back as a trade-off, more a day for one guaranteed episode fewer, and the booking and contract are that version', () => {
    const sim = graduate('b27-terms-trade-pay');
    represent(sim);
    const { t, week } = recurring(sim, (x, wk) => { const d = draws(sim, x, wk, 'pay'); return !d.yes && d.trade && d.withdraw >= TERMS.withdraw.most; });
    played(sim, week);
    const s = seriesById(t.series!)!;
    const o = offered(sim, t, week);
    const before = o.offer!.amount!;
    const r = ask(sim, o, 'pay');
    played(sim, r.answerAt + MS_HOUR);
    expect([o.offer!.amount, o.offer!.episodes, o.offer!.version, o.offer!.asked!.answer]).toEqual([r.asked, 1, 2, 'traded']);
    expect(r.asked).toBeGreaterThan(before);
    expect(notices(sim).some((n) => n.startsWith(`A Trade-Off On ${t.role.part} | `) && n.includes('the pay is raised, and the contract guarantees one episode fewer'))).toBe(true);
    const e = accept(sim, o);
    expect(e.days).toHaveLength(s.daysEach);
    expect(e.contract!.rate).toBe(r.asked);
    expect(clauseOf(e.contract, 'episodes')!.guaranteed).toBe(1);
  }, 240_000);

  it('PLAYER JOURNEY: another episode traded for no raise on the option: three episodes booked, and the next season renewed at the same day rate where the twin who didn’t ask is renewed at the raise', () => {
    // A part whose ask is traded, and whose series makes its next season (`seasonMade`), so the option can be taken up: the
    // first life of a few whose slate has one.
    let fixture: { base: Sim; t: ProjectTemplate; week: number } | undefined;
    for (let n = 0; n < 12 && !fixture; n += 1) {
      const base = graduate(`b27-terms-trade-option-${n}`);
      represent(base);
      try {
        fixture = { base, ...recurring(base, (x, wk) => {
          const d = draws(base, x, wk, 'episodes');
          return !d.yes && d.trade && d.withdraw >= TERMS.withdraw.most && seasonMade(base, seriesById(x.series!)!, seriesById(x.series!)!.firstSeason + 1);
        }) };
      } catch { /* none in this life's slate */ }
    }
    expect(fixture).toBeDefined();
    const { base, t, week } = fixture!;
    played(base, week);
    const run = (negotiate: boolean) => {
      const sim = reload(base);
      const o = offered(sim, t, week);
      if (negotiate) played(sim, ask(sim, o, 'episodes').answerAt + MS_HOUR);
      const e = accept(sim, o);
      // TEST SETUP: a day of the work judged Strong, as the shoot would leave one, and the option's day brought to the clock.
      e.log = [{ day: 0, at: e.days[0]!.from, status: 'worked', band: 'strong' }];
      const item = sim.universe.scheduled.find((i) => i.kind === OPTION_KIND && i.payload.engagementId === e.id && i.status === 'pending')!;
      sim.timeline.reschedule(item.id, sim.now + MS_HOUR);
      played(sim, sim.now + 2 * MS_HOUR);
      return { sim, o, e };
    };
    const traded = run(true);
    expect([traded.o.offer!.asked!.answer, traded.o.offer!.episodes, traded.o.offer!.optionRaise]).toEqual(['traded', 3, 0]);
    expect(clauseOf(traded.e.contract, 'option')!.raise).toBe(0);
    expect(traded.e.days).toHaveLength(3 * seriesById(t.series!)!.daysEach);
    const kept = run(false);
    expect(clauseOf(kept.e.contract, 'option')!.raise).toBe(OPTION_RAISE);
    const next = (x: typeof traded) => {
      const opt = clauseOf(x.e.contract, 'option')!;
      return opt.status === 'exercised' ? x.sim.player.pro!.opportunities.find((o) => o.engagementId === opt.settled?.engagementId)?.offer?.amount : undefined;
    };
    // Taken up in both, the option's draw being the engagement's own and the same in each: the next season's day rate is the
    // old one raised for the twin who didn't negotiate, and only the next season's scale plus ten for the one who traded it.
    expect([clauseOf(traded.e.contract, 'option')!.status, clauseOf(kept.e.contract, 'option')!.status]).toEqual(['exercised', 'exercised']);
    const old = traded.o.offer!.amount!;
    expect(next(kept)).toBe(Math.round(old * (1 + OPTION_RAISE)));
    expect(next(traded)).toBeLessThan(next(kept)!);
    expect(next(traded)).toBeGreaterThanOrEqual(old);
  }, 300_000);

  it('PLAYER JOURNEY: the promotional film asked to be paid at your own day, given by its draw, is paid as bargained when it’s made; the twin who didn’t ask is paid the agreement’s minimum for it', () => {
    const base = graduate('b27-terms-promo');
    represent(base);
    // A SAG-AFTRA part with a promotional film, paid under $25,000 (as every part the game offers is) at a day above the
    // minimum the agreement pays the film, whose ask is given by its draw.
    let found: { t: ProjectTemplate; week: number } | undefined;
    for (let w = 1; w < 200 && !found; w += 1) {
      const week = base.now + w * WEEK;
      for (const t of slatePartsAt(base, week)) {
        if (!promoFor(t) || t.union !== 'sag-aftra' || travels(base.player, t) || !writtenFor(t, base.player)) continue;
        if (datesOf({ projectId: t.id, postedAt: week }).length === 0) continue;
        const d = draws(base, t, week, 'promo');
        if (!d.yes || d.withdraw < TERMS.withdraw.most) continue;
        // And whose production calls the actor to a promotional film by its own draw (`promoDrawn`, keyed by the work).
        if (!promoDrawn(base, workKey({ projectId: t.id, days: datesOf({ projectId: t.id, postedAt: week }) }), t.role.size)) continue;
        const terms = payTermsOf({ projectId: t.id, postedAt: week });
        const probe = { id: 'probe', projectId: t.id, postedAt: week, offer: { amount: negotiatedAmount(terms.each ?? 0, t.union, true), per: terms.per, rate: t.pay } } as unknown as Opportunity;
        keepProject(base.player, t, t.series ? seriesById(t.series) : undefined);
        if (terms.each !== undefined && offerEstimate(probe) < PROMO.bargained && ownDay(probe) > promoMinimum(probe)) { found = { t, week }; break; }
      }
    }
    expect(found).toBeDefined();
    const { t, week } = found!;
    played(base, week);
    const run = (negotiate: boolean) => {
      const sim = reload(base);
      const o = offered(sim, t, week);
      if (negotiate) {
        expect(askMoreRefusal(sim, sim.player, o, 'promo')).toBeUndefined();
        played(sim, ask(sim, o, 'promo').answerAt + MS_HOUR);
      }
      const e = accept(sim, o);
      // The production's call to the promotional film, made by the function the wrap and a late release call (`callPromo`).
      // TEST SETUP: its release a fortnight and a day off, so the call falls before the shoot, clear of the days booked.
      const from = sim.universe.notifications.length;
      callPromo(sim, sim.player, e, t, addDays(sim.now, PROMO.before + 1, 'America/New_York'));
      const call = sim.universe.notifications.slice(from).find((n) => n.title === `${t.project} Calls You For A Promotional Film`)!.body;
      played(sim, e.promo!.at + PROMO.hours * MS_HOUR + MS_HOUR);
      return { o, e, call };
    };
    const asked = run(true);
    // The call says what the agent bargained; the twin's says the agreement's minimum.
    expect(asked.call).toContain(`It pays ${formatMoney(ownDay(asked.o), 'USD')}, as your agent bargained.`);
    expect([asked.o.offer!.asked!.answer, asked.o.offer!.promo]).toEqual(['raised', ownDay(asked.o)]);
    expect(asked.e.contract!.promo).toBe(ownDay(asked.o));
    expect(asked.e.contract!.clauses.find((c) => c.kind === 'rule' && c.id === 'promo')).toMatchObject({ words: expect.stringContaining('your agent bargained') });
    expect(asked.e.promo!.status).toBe('done');
    expect(asked.e.pay.find((p) => p.key === `${asked.e.id}:promo`)?.promised).toBe(ownDay(asked.o));
    const plain = run(false);
    expect(plain.e.promo!.status).toBe('done');
    // The falsifiability twin: the agreement's minimum for it, less than the day bargained.
    expect(plain.e.contract!.promo).toBeUndefined();
    expect(plain.e.pay.find((p) => p.key === `${plain.e.id}:promo`)?.promised).toBe(promoMinimum(plain.o));
    expect(plain.call).toContain(`It pays a day performer’s minimum, ${formatMoney(promoMinimum(plain.o), 'USD')}.`);
    expect(promoMinimum(plain.o)).toBeLessThan(ownDay(asked.o));
  }, 300_000);

  it('PLAYER JOURNEY: an ask the production answers by withdrawing its offer, by its draw: said, the part gone, and nothing to accept', () => {
    const sim = graduate('b27-terms-withdrawn');
    represent(sim);
    const { t, week } = recurring(sim, (x, wk) => draws(sim, x, wk, 'episodes').withdraw < withdrawChance(1 / (x.schedule.kind === 'episodes' ? x.schedule.guaranteed : 1)));
    played(sim, week);
    const o = offered(sim, t, week);
    expect(withdrawChance(askShare(o, 'episodes'))).toBe(TERMS.withdraw.most);
    const r = ask(sim, o, 'episodes');
    played(sim, r.answerAt + MS_HOUR);
    expect([o.status, o.offer!.asked!.answer]).toEqual(['withdrawn', 'withdrawn']);
    expect(o.outcome).toMatch(/withdrew its offer for .* instead of negotiating\. The part goes to another actor\.$/);
    expect(notices(sim).some((n) => n.startsWith(`The Offer For ${t.role.part} Is Withdrawn | `))).toBe(true);
    expect(sim.execute({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).error).toBe('There’s no offer to accept.');
    expect(sim.player.pro!.engagements).toEqual([]);
  }, 240_000);

  it('PLAYER JOURNEY: the pay asked for and raised by its draw: What Needs You brought up to that version too', () => {
    const sim = graduate('b27-terms-pay-decision');
    represent(sim);
    const { t, week } = recurring(sim, (x, wk) => { const d = draws(sim, x, wk, 'pay'); return d.yes && d.withdraw >= TERMS.withdraw.most; });
    played(sim, week);
    const o = offered(sim, t, week);
    // TEST SETUP: its decision in What Needs You, as `makeOffer` raises one.
    sim.requireDecision({ urgency: 80, category: 'career', title: `An Offer For ${t.role.part}`, dueAt: o.offer!.until, refType: 'pro.offer', refId: o.id, detail: 'The first offer.' });
    played(sim, ask(sim, o, 'pay').answerAt + MS_HOUR);
    expect([o.offer!.asked!.answer, o.offer!.version]).toEqual(['raised', 2]);
    const q = Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toBe(`The first offer. Since then: ${o.history.find((h) => h.key === 'answered')!.words}`);
  }, 240_000);

  it('refuses each term where it doesn’t apply, with nobody to ask, and a second ask; the asks are kept through a save and answered the same', () => {
    const sim = graduate('b27-terms-refusals');
    const { t, week } = recurring(sim, (x, wk) => { const d = draws(sim, x, wk, 'episodes'); return d.yes && d.withdraw >= TERMS.withdraw.most; });
    played(sim, week);
    const alone = offered(sim, t, week);
    expect(askMoreRefusal(sim, sim.player, alone, 'episodes')).toBe('An agent asks for more on your behalf, and none represents you, so the offer is as it stands.');
    sim.player.pro!.opportunities = sim.player.pro!.opportunities.filter((x) => x.id !== alone.id);
    represent(sim);
    const o = offered(sim, t, week);
    // A one-off part has no guaranteed episodes; a recurring part on a series is paid under $25,000 for two, so its promotional film is already paid.
    const oneOff = slatePartsAt(sim, week + WEEK).find((x) => x.schedule.kind !== 'episodes' && !travels(sim.player, x))!;
    expect(askMoreRefusal(sim, sim.player, offered(sim, oneOff, week + WEEK), 'episodes')).toBe('Only a recurring part on a series has guaranteed episodes to ask about.');
    expect(askMoreRefusal(sim, sim.player, o, 'promo')).toBe('This work has no promotional film in its contract.');
    // A SAG-AFTRA part whose own day is no more than the minimum the agreement pays a promotional film has nothing to ask.
    let low: { t: ProjectTemplate; week: number } | undefined;
    for (let w = 2; w < 200 && !low; w += 1) {
      const wk = week + w * WEEK;
      for (const x of slatePartsAt(sim, wk)) {
        if (!promoFor(x) || x.union !== 'sag-aftra' || travels(sim.player, x) || datesOf({ projectId: x.id, postedAt: wk }).length === 0) continue;
        const terms = payTermsOf({ projectId: x.id, postedAt: wk });
        const probe = { id: 'probe', projectId: x.id, postedAt: wk, offer: { amount: negotiatedAmount(terms.each ?? 0, x.union, true), per: terms.per, rate: x.pay } } as unknown as Opportunity;
        if (terms.each !== undefined && ownDay(probe) <= promoMinimum(probe)) { low = { t: x, week: wk }; break; }
      }
    }
    const lo = offered(sim, low!.t, low!.week);
    expect(askMoreRefusal(sim, sim.player, lo, 'promo')).toBe(`The agreement already pays the promotional film a day performer’s minimum, ${formatMoney(promoMinimum(lo), 'USD')}, at least your own day.`);
    // A further episode whose days would clash with work booked isn't asked for: a yes would leave an offer the clash made
    // impossible to accept. TEST SETUP: a day of other work booked on the further episode's first day.
    const own = datesOf(o).map((d) => d.from);
    const extra = datesOf({ ...o, offer: { ...o.offer!, episodes: (o.offer!.episodes ?? (t.schedule.kind === 'episodes' ? t.schedule.guaranteed : 0)) + 1 } }).find((d) => !own.includes(d.from))!;
    sim.player.pro!.engagements.push({ id: 'test-clash', opportunityId: 'test-clash-o', projectId: oneOff.id, role: oneOff.role.part, status: 'booked', days: [{ from: extra.from, to: extra.to, label: 'Another Job' }], pay: [], history: [], counts: {} });
    expect(askMoreRefusal(sim, sim.player, o, 'episodes')).toBe(`A further episode’s days would clash with Another Job on ${formatDate(extra.from, 'America/New_York')}, so there’s no episode you could take on.`);
    sim.player.pro!.engagements = sim.player.pro!.engagements.filter((e) => e.id !== 'test-clash');
    const r = ask(sim, o, 'episodes');
    const twin = reload(sim);
    expect(sim.execute({ kind: 'pro.ask_more', payload: { opportunityId: o.id, item: 'pay' } }).error).toMatch(/has asked; the answer comes on /);
    played(sim, r.answerAt + MS_HOUR);
    played(twin, r.answerAt + MS_HOUR);
    const o2 = twin.player.pro!.opportunities.find((x) => x.id === o.id)!;
    expect([o2.offer!.asked!.item, o2.offer!.asked!.answer, o2.offer!.episodes]).toEqual(['episodes', o.offer!.asked!.answer, o.offer!.episodes]);
    expect(sim.execute({ kind: 'pro.ask_more', payload: { opportunityId: o.id, item: 'promo' } }).error).toMatch(/asked once already/);
  }, 240_000);
});
