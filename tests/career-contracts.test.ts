/**
 * Brief 25's Module 4 (from 2026-10-24; `docs/verification/career-world-2026-10-23/criteria.md`, D1 to D9): contracts,
 * where each payment stands, overtime, the producer's contribution, residuals, the per diem, a recurring part's episodes
 * and option, and a series' seasons renewed, canceled and revived. Each played through the commands and the clock, from
 * an offer written as casting writes one (TEST SETUP, said where it's made), with the seeds a premise needs named and
 * their premise held.
 */
import { describe, expect, it } from 'vitest';
import { FORMATS } from '@/engine/content/workflows';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { RATES, projectById } from '@/engine/content/careerwork';
import { SERIES, decisionAt, episodeDays } from '@/engine/content/series';
import { ensurePro, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { payTermsOf, datesOf, seriesPosts, episodesPending, termsWords } from '@/engine/systems/projobs';
import { PAY_KIND, negotiatedAmount } from '@/engine/systems/propay';
import {
  CONTRIBUTION, OVERTIME, PER_DIEM, RERUN_CEILING, RESIDUALS, RESIDUAL_PAY_KIND, askRefusal, clauseOf, contributionRate, daysAway, lateDays, notOwed, overtimeOf,
  payPerDiem, payState, rerunAmount, rerunDrawn, totalActualCompensation,
} from '@/engine/systems/contracts';
import { decisionsTo, inProduction, seasonMade, seasonNumber, EPISODE_CALL_KIND, OPTION_KIND } from '@/engine/systems/series';
import { tripOf } from '@/engine/systems/worktrip';
import { yearOf } from '@/engine/systems/earnings';
import { at, graduate, notices, played, playRound, portfolio, prepareAll, reload, skilled, tend, tended, zone } from './fakes/career-world';
import { signed } from './fakes/career-work';

const CALLOWAY = SERIES[0]!;

/** TEST SETUP: an offer for a part, written as casting writes one, for work worked out from `postedAt`, at the rate's scale or `amount`. */
function offerFor(sim: Simulation, projectId: string, postedAt: number, amount?: number, via: 'agent' | 'open' = 'open'): Opportunity {
  const t = projectById(projectId)!;
  const terms = payTermsOf({ projectId, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via, status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(amount ?? terms.each) !== undefined ? { amount: amount ?? terms.each } : {}, per: terms.per, units: terms.units },
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  return o;
}

/** Accepted by the Work tab's command, and the engagement it made. */
function accept(sim: Simulation, o: Opportunity): Engagement {
  sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  return sim.player.pro!.engagements.find((e) => e.opportunityId === o.id)!;
}

/** What the player holds across their own accounts, in the save's money. */
const held = (sim: Simulation): number => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.closedAt).reduce((n, a) => n + a.balance, 0);

describe('D1: every engagement carries its contract, with only the clauses that apply', () => {
  it('makes each kind of work’s contract at acceptance, its estimate never cash', () => {
    const sim = graduate('contracts-d1');
    const before = held(sim);
    // Each offered a week apart, so their days don't meet.
    const clerk = accept(sim, offerFor(sim, 'calloway-files', at(2026, 9, 14)));
    const short = accept(sim, offerFor(sim, 'eastview', at(2026, 9, 21)));
    const film = accept(sim, offerFor(sim, 'paper-moons', at(2026, 9, 28)));
    const play = accept(sim, offerFor(sim, 'calder-street', at(2026, 11, 2)));
    // CON-03: a contract's estimate is no money: nothing in any account moved when four were made.
    expect(held(sim)).toBe(before);
    const c = clerk.contract!;
    expect(c).toMatchObject({
      version: 1, classification: 'SAG-AFTRA Day Performer', billing: 'a co-star', format: 'network television drama', agreement: 'SAG-AFTRA TV/Theatrical',
      place: 'a studio in Queens, New York', basis: 'day', per: 'day', units: 2, rate: RATES['sag-tv-day'].amount, series: { id: 'calloway-files', year: 2026, season: 8 },
    });
    expect(c.service).toEqual({ from: clerk.days[0]!.from, to: clerk.days[1]!.to });
    expect(c.madeAt).toBe(sim.now);
    expect(c.estimate).toBe(clerk.pay.reduce((n, p) => n + p.promised, 0));
    expect(c.payKeys).toEqual(clerk.pay.map((p) => p.key));
    // Only the clauses that apply: SAG-AFTRA television's overtime, residuals and contribution; nothing of a trip it has none of.
    // From 2026-10-24 (brief 25's Module 5) a procedural's recall to loop too, within four months (N13 Schedule A §28.A).
    expect(c.clauses.map((x) => x.kind)).toEqual(['overtime', 'residuals', 'contributions', 'rule']);
    expect(c.clauses.at(-1)).toMatchObject({ kind: 'rule', id: 'looping' });
    expect(short.contract!.clauses).toEqual([]);
    expect(short.contract!).toMatchObject({ classification: 'Non-Union Day Rate', agreement: 'Non-Union', basis: 'day' });
    expect(film.contract!.clauses).toEqual([{ kind: 'deferred' }]);
    expect(film.contract!).toMatchObject({ basis: 'deferred', estimate: 0 });
    expect(film.contract!.rate).toBeUndefined();
    expect(play.contract!.clauses).toEqual([]);
    expect(play.contract!).toMatchObject({ basis: 'week', per: 'week', units: 10, classification: 'Off-Broadway Weekly Salary', billing: 'a supporting part' });
    // Kept with the save.
    expect(reload(sim).player.pro!.engagements.find((e) => e.id === clerk.id)!.contract).toEqual(c);
  });

  it('invents no participation: no contract the game makes carries a share of profits, and every clause is one the rules name', () => {
    const sim = graduate('contracts-none');
    const kinds = new Set<string>();
    const posted = [['calloway-files', at(2026, 9, 14)], ['calloway-files-whitlock', at(2026, 10, 19)], ['eastview', at(2027, 3, 1)], ['nine-one-one-guest', at(2027, 5, 3)], ['winter-ledger', at(2027, 8, 2)], ['route-nine', at(2028, 1, 3)]] as const;
    for (const [id, when] of posted) for (const x of accept(sim, offerFor(sim, id, when)).contract!.clauses) kinds.add(x.kind);
    // A workflow's rule from 2026-10-24 (brief 25's Module 5): the agreements' words for a recall to loop, a dub's pay, a stunt's consent.
    expect([...kinds].every((k) => ['deferred', 'overtime', 'residuals', 'contributions', 'trip', 'per-diem', 'episodes', 'option', 'rule'].includes(k))).toBe(true);
    expect(JSON.stringify(sim.player.pro!.engagements.map((e) => e.contract))).not.toMatch(/participation|profit|backend|points/i);
  });
});

describe('D3: a day performer’s overtime', () => {
  it('pays the ninth and tenth hours of each eleven-hour day at time and one-half, an hour an eighth of the day, as the agreement’s own example', () => {
    // N13, Schedule A §9: "$880.00 per day … Two hours at time and one-half….. $330.00".
    expect(overtimeOf(880_00)).toBe(330_00);
    expect(OVERTIME.workHours - OVERTIME.straightHours).toBe(2);
    const sim = graduate('contracts-d3');
    const day = negotiatedAmount(RATES['sag-tv-day'].amount!, 'sag-aftra', true);
    const e = accept(sim, offerFor(sim, 'calloway-files', at(2026, 9, 14), day));
    expect(e.pay).toHaveLength(1);
    expect(e.pay[0]!.overtime).toBe(2 * overtimeOf(day));
    expect(e.pay[0]!.promised).toBe(2 * (day + overtimeOf(day)));
    expect(clauseOf(e.contract, 'overtime')).toEqual({ kind: 'overtime', hourly: Math.round(day / 8), hours: 2, premium: 1.5, perDay: overtimeOf(day) });
    // Said in the offer, with the pay.
    // And how the work is done, from 2026-10-24 (brief 25's Module 5): the format's words.
    expect(termsWords(projectById('calloway-files')!, day)).toBe(` Each shoot day runs eleven hours with an hour for lunch, so its last two hours of work are overtime at time and one-half, $${(overtimeOf(day) / 100).toFixed(2)} more a day. ${FORMATS.procedural.words}`);
    // None where the overtime terms weren't read: Low Budget's, a weekly performer's, a stage run's.
    for (const [id, posted] of [['gull-season', at(2027, 1, 4)], ['harbor-line', at(2027, 4, 5)], ['calder-street', at(2027, 8, 2)]] as const) {
      const o = accept(sim, offerFor(sim, id, posted));
      expect([id, o.pay.some((p) => p.overtime !== undefined), clauseOf(o.contract, 'overtime')]).toEqual([id, false, undefined]);
    }
  });
});

describe('D2 and D4: where each payment stands, and the producer’s contribution beside the pay', () => {
  it('reads estimated, earned, due and settled from the record and the clock, and keeps the contribution off the player’s money', () => {
    const sim = graduate('contracts-d2');
    skilled(sim);
    const e = accept(sim, offerFor(sim, 'calloway-files', at(2026, 9, 14)));
    const p = e.pay[0]!;
    expect(payState(p, sim.now, zone)).toBe('estimated');
    played(sim, e.days[1]!.to + MS_HOUR);
    expect(e.log!.map((l) => l.status)).toEqual(['worked', 'worked']);
    expect(payState(p, sim.now, zone)).toBe('earned');
    const morning = at(zonedParts(p.due, zone).year, zonedParts(p.due, zone).month, zonedParts(p.due, zone).day, 9);
    played(sim, morning);
    expect(payState(p, sim.now, zone)).toBe('due');
    played(sim, p.due + MS_HOUR);
    expect(payState(p, sim.now, zone)).toBe('settled');
    // D4: the contribution on SAG-AFTRA pay, the rate of the day, and none of it from the pay: net is gross less tax and dues.
    const r = p.received!;
    expect(p.contribution).toEqual({ rate: 0.205, amount: Math.round(r.gross * 0.205) });
    expect(CONTRIBUTION).toMatchObject({ rate: 0.195, healthAdd: 0.01 });
    expect(r.net).toBe(r.gross - r.withheld - (r.dues ?? 0) - r.commission);
    const txn = sim.universe.transactions.find((x) => x.id === r.txnId)!;
    expect(txn.postings.map((x) => sim.universe.accounts[x.accountId]!.name).sort()).toEqual([sim.universe.accounts[txn.postings[0]!.accountId]!.name, 'Tax Withheld', 'Wages'].sort());
    expect(Object.values(sim.universe.accounts).some((a) => /pension|health plan/i.test(a.name))).toBe(false);
    expect([contributionRate(at(2026, 9, 5, 12)), contributionRate(at(2026, 9, 6, 12))]).toEqual([0.195, 0.205]);
  });

  it('pays an Equity run with no contribution shown, the agreement’s terms not read', () => {
    const sim = graduate('contracts-d4');
    const e = accept(sim, offerFor(sim, 'calder-street', at(2026, 9, 14)));
    tended(sim, e.pay[0]!.due + MS_HOUR);
    expect(e.pay[0]!.received).toBeDefined();
    expect(e.pay[0]!.contribution).toBeUndefined();
  });

  it('T43: marks a non-union producer’s late payment overdue, disputed once asked, and pays it once by the answer', () => {
    const sim = graduate('contracts-late');
    skilled(sim);
    // TEST SETUP: ten offers for the short a week apart, until one's pay comes late (three in ten).
    let late: Engagement | undefined;
    for (let n = 0; n < 10 && !late; n += 1) {
      const e = accept(sim, offerFor(sim, 'eastview', at(2026, 9, 14) + n * 7 * MS_DAY));
      if (e.pay[0]!.late) late = e;
    }
    expect(late).toBeDefined();
    const p = late!.pay[0]!;
    expect(p.late!.days).toBe(lateDays(sim, p.key));
    expect(p.late!.days).toBeGreaterThanOrEqual(7);
    // The payday is on the clock that many days after it's due.
    expect(sim.universe.scheduled.find((i) => i.kind === PAY_KIND && i.payload.key === p.key && i.status === 'pending')!.at).toBe(p.due + p.late!.days * MS_DAY);
    expect(askRefusal(sim, late, p)).toBe('You can ask about a payment once it’s past its payday and unpaid.');
    played(sim, p.due + MS_DAY);
    expect(payState(p, sim.now, zone)).toBe('overdue');
    expect(askRefusal(sim, late, p)).toBeUndefined();
    const { answer } = sim.must<{ answer: number }>({ kind: 'pro.ask_pay', payload: { engagementId: late!.id, key: p.key } });
    expect(payState(p, sim.now, zone)).toBe('disputed');
    expect(askRefusal(sim, late, p)).toMatch(/^You asked about it on /);
    const twin = reload(sim);
    played(sim, Math.min(answer, p.due + p.late!.days * MS_DAY) + MS_HOUR);
    expect(payState(p, sim.now, zone)).toBe('settled');
    expect(p.received!.at).toBe(Math.min(answer, p.due + p.late!.days * MS_DAY));
    const into = sim.universe.transactions.find((x) => x.id === p.received!.txnId)!.postings.find((x) => sim.universe.accounts[x.accountId]!.ownerId === sim.player.id)!;
    expect(into.amount).toBe(p.received!.net);
    // Paid once: the twin loaded before it pays the same, and nothing more comes after.
    played(twin, sim.now);
    expect(twin.player.pro!.engagements.find((x) => x.id === late!.id)!.pay[0]!.received).toEqual(p.received);
    const paid = sim.universe.transactions.filter((x) => x.memo.startsWith('Wages') && x.memo.includes('Eastview')).length;
    played(sim, sim.now + 30 * MS_DAY);
    expect(sim.universe.transactions.filter((x) => x.memo.startsWith('Wages') && x.memo.includes('Eastview')).length).toBe(paid);
  });
});

describe('D5: residuals, four records, paid once', () => {
  /** The first seed whose Desk Clerk is rerun, its premise held: a rerun drawn for the engagement. */
  function rerunLife(): { sim: Simulation; e: Engagement } {
    for (let n = 0; n < 8; n += 1) {
      const sim = graduate(`contracts-rerun-${n}`);
      skilled(sim);
      const e = accept(sim, offerFor(sim, 'calloway-files', at(2026, 9, 14)));
      if (rerunDrawn(sim, e.id)) return { sim, e };
    }
    throw new Error('No seed drew a rerun.');
  }

  it('T42, T43, T96: makes the entitlement when the work is done, pays nothing for the first telecast, and pays a rerun’s residual once by its key', () => {
    const { sim, e } = rerunLife();
    played(sim, e.days[1]!.to + MS_HOUR);
    expect(e.status).toBe('finished');
    const r = sim.player.pro!.residuals!.find((x) => x.engagementId === e.id)!;
    // The entitlement: the work's pay for its time, overtime at straight time, against the hour program's ceiling.
    expect(r.base).toBe(totalActualCompensation(e));
    expect(r.base).toBe(e.pay[0]!.promised - e.pay[0]!.overtime! + Math.round(e.pay[0]!.overtime! / OVERTIME.premium));
    expect(r).toMatchObject({ program: 'hour', ceiling: RERUN_CEILING.hour, calculations: [], settlements: [] });
    expect(r.exploitations).toEqual([{ key: `${e.id}:first`, kind: 'first-telecast', at: r.exploitations[0]!.at, status: 'planned' }]);
    expect(Math.round((r.exploitations[0]!.at - e.finishedAt!) / MS_DAY)).toBeGreaterThanOrEqual(RESIDUALS.firstAfterDays - 1);
    // The first telecast pays nothing (N14 §18(a)): no account moves.
    tended(sim, r.exploitations[0]!.at - MS_HOUR);
    const before = held(sim);
    tended(sim, r.exploitations[0]!.at + MS_HOUR);
    expect(held(sim)).toBe(before);
    expect(r.calculations).toEqual([{ key: `${e.id}:first`, at: r.exploitations[0]!.at, base: r.base, share: 0, ceiling: r.ceiling, amount: 0 }]);
    expect(r.exploitations[1]).toMatchObject({ kind: 'network-rerun', status: 'planned' });
    tended(sim, r.exploitations[1]!.at + MS_HOUR);
    const amount = Math.min(r.base, RERUN_CEILING.hour);
    // Up to the ceiling: a recurring part's four days and more come to more than an hour program's $3,668.
    expect([rerunAmount({ base: 7_056_52, ceiling: RERUN_CEILING.hour }), rerunAmount({ base: 2_000_00, ceiling: RERUN_CEILING['half-hour'] })]).toEqual([3_668_00, 2_000_00]);
    expect(r.calculations[1]).toMatchObject({ share: 1, amount });
    const st = r.settlements[0]!;
    expect(Math.round((st.due - r.exploitations[1]!.at) / MS_DAY)).toBe(RESIDUALS.payWithinDays);
    // Saved before it's paid, and a replayed notice of it: one payment, the same in both.
    const twin = reload(sim);
    tended(sim, st.due + MS_HOUR);
    expect(st.paid!.gross).toBe(amount);
    sim.schedule({ at: sim.now + 60_000, kind: RESIDUAL_PAY_KIND, label: 'replayed', category: 'home', priority: 30, payload: { personId: sim.player.id, residualId: r.id, key: st.key } });
    tended(sim, sim.now + MS_DAY);
    tended(twin, sim.now);
    expect(sim.universe.transactions.filter((x) => x.memo.startsWith('Residual:'))).toHaveLength(1);
    expect(twin.player.pro!.residuals![0]!.settlements[0]!.paid).toEqual(st.paid);
    expect(notices(sim).some((n) => n.startsWith('Residual For The Calloway Files'))).toBe(true);
  });
});

describe('D6: a per diem, apart from wages', () => {
  it('T45: pays $60 a day away once home, with nothing withheld, not as wages, and not in a residual’s base', () => {
    const sim = graduate('contracts-d6');
    skilled(sim);
    const e = accept(sim, offerFor(sim, 'nine-one-one-guest', at(2026, 9, 14)));
    const trip = tripOf(sim.player, e)!;
    expect(clauseOf(e.contract, 'per-diem')).toEqual({ kind: 'per-diem', perDay: PER_DIEM.perDay, days: daysAway(trip, zone) });
    const twin = reload(sim);
    played(sim, trip.legs[trip.legs.length - 1]!.arrives + MS_HOUR);
    played(twin, sim.now);
    expect(trip.status).toBe('home');
    const a = e.allowances![0]!;
    expect(a).toMatchObject({ kind: 'per-diem', days: daysAway(trip, zone), perDay: 60_00, amount: 60_00 * daysAway(trip, zone) });
    const txn = sim.universe.transactions.find((x) => x.id === a.txnId)!;
    expect(txn.category).toBe('reimbursement');
    // Not wages: the year's acting wages are the pay's gross alone.
    expect(yearOf(sim.player, 2026).acting).toBe(e.pay.reduce((n, p) => n + (p.received?.gross ?? p.inTrust?.gross ?? 0), 0));
    // Not twice: the twin loaded before it pays the same once.
    expect(twin.player.pro!.engagements.find((x) => x.id === e.id)!.allowances).toEqual(e.allowances);
    played(sim, sim.now + 3 * MS_DAY);
    // Paid by its key: asked again, it pays nothing more.
    payPerDiem(sim, sim.player, e, trip);
    expect(sim.universe.transactions.filter((x) => x.memo.startsWith('Per diem:'))).toHaveLength(1);
    expect(sim.player.pro!.residuals!.find((r) => r.engagementId === e.id)!.base).toBe(totalActualCompensation(e));
  });
});

describe('D7: a recurring part, guaranteed some episodes of the season, expected in more, and an option on the next', () => {
  it('pays the guaranteed episodes, never the season’s order, and a further episode only where it’s called for', () => {
    const sim = graduate('contracts-d7');
    skilled(sim);
    const t = projectById('calloway-files-whitlock')!;
    // Posted September 14, 2026: the season's next episodes from five weeks on are its sixth and seventh.
    const o = offerFor(sim, t.id, at(2026, 9, 14));
    expect(datesOf(o).map((d) => d.label)).toEqual(['6', '6', '7', '7'].map((n, k) => `The Calloway Files: Episode ${n}, Shoot Day ${(k % 2) + 1}`));
    const e = accept(sim, o);
    const ep = clauseOf(e.contract, 'episodes')!;
    expect(ep).toMatchObject({ ordered: 13, guaranteed: 2, expected: 5, daysEach: 2, numbers: [6, 7], further: [8, 9, 10].map((n) => ({ n, status: 'pending' })) });
    expect(e.contract!.basis).toBe('episode');
    // CON-04, T86: paid for the two guaranteed, not the thirteen ordered or the five expected.
    expect(e.pay).toHaveLength(2);
    expect(e.contract!.estimate).toBe(4 * (o.offer!.amount! + overtimeOf(o.offer!.amount!)));
    expect(clauseOf(e.contract, 'option')).toMatchObject({ season: 9, year: 2027, raise: 0.05, status: 'open' });
    // The word on each further episode is on the clock, two weeks before it.
    expect(sim.universe.scheduled.filter((i) => i.kind === EPISODE_CALL_KIND && i.payload.engagementId === e.id).map((i) => Math.round((episodeDays(CALLOWAY, 2026, Number(i.payload.n))[0]! - i.at) / MS_DAY))).toEqual([14, 14, 14]);
    played(sim, at(2026, 9, 19, 18));
    prepareAll(sim, { engagementId: e.id });
    // Its first day makes the actor eligible for SAG-AFTRA, and its work from the thirtieth day on needs them to join.
    played(sim, e.days[0]!.to + MS_HOUR);
    sim.must({ kind: 'pro.join_sag', payload: {} });
    // Not over at its last guaranteed day while the production's word on more is to come.
    played(sim, e.days[3]!.to + MS_HOUR);
    expect(e.status).toBe('working');
    expect(episodesPending(e)).toBe(true);
    played(sim, at(2027, 1, 30));
    expect(episodesPending(e)).toBe(false);
    const called = ep.further.filter((f) => f.status === 'called').map((f) => f.n);
    const not = ep.further.filter((f) => f.status === 'not-called').map((f) => f.n);
    expect(called.length + not.length).toBe(3);
    // Each called episode's days added and paid; one not called paid nothing.
    expect(e.days).toHaveLength(4 + 2 * called.length);
    expect(e.pay).toHaveLength(2 + called.length);
    // The seed's premise: the production called the part for all three (one not called is in T89 and T90's seeds).
    expect([called, not]).toEqual([[8, 9, 10], []]);
    for (const n of not) expect(notices(sim).some((x) => x.startsWith(`Not In Episode ${n} | `) && x.includes('An episode you aren’t called for isn’t paid'))).toBe(true);
    for (const n of called) expect(notices(sim).some((x) => x.startsWith(`Called For Episode ${n} | `))).toBe(true);
    expect(e.status).toBe('finished');
    expect(e.pay.every((p) => p.received || p.inTrust)).toBe(true);
    expect(sim.player.pro!.residuals!.some((r) => r.engagementId === e.id)).toBe(true);
  });

  /** A recurring part's first season played, to just past its option's last day, for a seed. */
  function season(seed: string): { sim: Simulation; e: Engagement } {
    const sim = graduate(seed);
    skilled(sim);
    const e = accept(sim, offerFor(sim, 'calloway-files-whitlock', at(2026, 9, 14)));
    // The part prepared as a player prepares it, on a free evening, so its days are judged as the work of someone ready for them.
    played(sim, at(2026, 9, 5, 18));
    prepareAll(sim, { engagementId: e.id });
    // A member of SAG-AFTRA from the first day on, as its work from the thirtieth day after the first job needs.
    played(sim, e.days[0]!.to + MS_HOUR);
    sim.must({ kind: 'pro.join_sag', payload: {} });
    played(sim, at(2027, 1, 30));
    tended(sim, at(2027, 6, 30, 13));
    return { sim, e };
  }

  it('T89 and T90: takes up its option into the next version of the contract, or lets it lapse once', () => {
    const outcomes: string[] = [];
    const further = new Set<string>();
    // Seeds taken in turn until each branch has run and a further episode was called and one wasn't (from 2026-10-24,
    // brief 25's Module 5, when a day's takes moved the bands the production's call reads, and the first four seeds'
    // further episodes were all called).
    for (const seed of Array.from({ length: 12 }, (_, k) => `contracts-opt-${k}`)) {
      if (new Set(outcomes).size === 2 && further.has('called') && further.has('not-called')) break;
      const { sim, e } = season(seed);
      const option = clauseOf(e.contract, 'option')!;
      outcomes.push(option.status);
      for (const f of clauseOf(e.contract, 'episodes')!.further) further.add(f.status);
      expect(e.log!.every((l) => l.band !== 'unready')).toBe(true);
      expect(sim.universe.scheduled.some((i) => i.kind === OPTION_KIND && i.status === 'pending' && i.payload.engagementId === e.id)).toBe(false);
      const next = sim.player.pro!.engagements.find((x) => x.contract?.renews === e.id);
      if (option.status === 'exercised') {
        // T89: version 2, the raise on the last day rate and never under the new year's scale, the next season's first episodes.
        expect(next).toBeDefined();
        expect(option.settled!.engagementId).toBe(next!.id);
        const rate = sim.player.pro!.opportunities.find((x) => x.id === next!.opportunityId)!.offer!.amount!;
        const old = sim.player.pro!.opportunities.find((x) => x.id === e.opportunityId)!.offer!.amount!;
        expect(rate).toBe(Math.max(Math.round(old * 1.05), 1_321_00));
        expect(next!.contract).toMatchObject({ version: 2, series: { year: 2027, season: 9 }, rate });
        expect(clauseOf(next!.contract, 'episodes')!.numbers).toEqual([1, 2]);
        expect(next!.days[0]!.from).toBe(episodeDays(CALLOWAY, 2027, 1)[0]);
        expect(clauseOf(next!.contract, 'option')).toMatchObject({ year: 2028, status: 'open' });
      } else {
        // T90, T58: lapsed once, said once, and no contract or engagement comes of the renewal.
        expect(option.status).toBe('expired');
        expect(next).toBeUndefined();
        const said = notices(sim).filter((n) => n.startsWith('No Ninth Season For Assistant DA Whitlock'));
        expect(said).toHaveLength(1);
        const twin = reload(sim);
        tended(twin, at(2027, 9, 1));
        expect(clauseOf(twin.player.pro!.engagements.find((x) => x.id === e.id)!.contract, 'option')).toEqual(option);
        expect(twin.player.pro!.engagements.filter((x) => x.projectId === 'calloway-files-whitlock')).toHaveLength(1);
      }
    }
    // Both ways among the seeds, so each branch above ran; and a further episode called and one not.
    expect(new Set(outcomes)).toEqual(new Set(['exercised', 'expired']));
    expect(further).toEqual(new Set(['called', 'not-called']));
  });
});

describe('D8: a series’ seasons, decided by the world', () => {
  it('orders the seasons through 2029, then decides each May by the series and the year, the same on every reload', () => {
    const sim = graduate('contracts-4');
    for (let y = 2026; y <= 2029; y += 1) expect(seasonMade(sim, CALLOWAY, y)).toBe(true);
    expect(seasonNumber(sim, CALLOWAY, 2026)).toBe(8);
    // The seed's premise: canceled in May 2030 and back in May 2032.
    expect(decisionsTo(sim, CALLOWAY, 2032).map((d) => `${d.year}:${d.what}`)).toEqual(['2030:canceled', '2032:revived']);
    expect(decisionsTo(reload(sim), CALLOWAY, 2032)).toEqual(decisionsTo(sim, CALLOWAY, 2032));
    expect(decisionsTo(graduate('contracts-0'), CALLOWAY, 2030).map((d) => d.what)).toEqual(['renewed']);
    // Every episode of a season is shot before the network's word in May, so no guaranteed episode is ever cut short.
    for (let y = 2026; y <= 2040; y += 1) expect(episodeDays(CALLOWAY, y, CALLOWAY.episodes).at(-1)! < decisionAt(CALLOWAY, y + 1)).toBe(true);
    // Nothing of it is cast in the hiatus, or in a year it's off.
    const t = projectById('calloway-files')!;
    expect(seriesPosts(sim, t, datesOf({ projectId: t.id, postedAt: at(2027, 5, 17) }), at(2027, 5, 17))).toBe(false);
    expect(seriesPosts(sim, t, datesOf({ projectId: t.id, postedAt: at(2027, 9, 6) }), at(2027, 9, 6))).toBe(true);
    expect(inProduction(sim, t.id, [{ from: at(2031, 3, 3) }], at(2031, 2, 1))).toBe(false);
    expect(inProduction(sim, t.id, [{ from: at(2032, 10, 4) }], at(2032, 9, 1))).toBe(true);
  });

  it('T10, T91, T90, T59, T93, T100: canceled, it closes a casting, calls off work not yet done, keeps what was earned, lapses the option once; revived, it casts again with the old work as it was', () => {
    const sim = graduate('contracts-4');
    skilled(sim);
    // TEST SETUP: the clock on to 2030, the body tended a month at a time.
    while (sim.now < at(2029, 12, 31)) { tend(sim); sim.advanceTo(Math.min(at(2029, 12, 31), sim.now + 30 * MS_DAY)); }
    tended(sim, at(2030, 1, 7, 8));
    // T91: a Desk Clerk worked in February. A recurring part for the season's last two episodes, its option on the next.
    const worked = accept(sim, offerFor(sim, 'calloway-files', at(2030, 1, 7)));
    const whitlock = accept(sim, offerFor(sim, 'calloway-files-whitlock', at(2030, 1, 21)));
    expect(clauseOf(whitlock.contract, 'episodes')!.numbers).toEqual([12, 13]);
    played(sim, at(2030, 4, 22));
    expect(worked.status).toBe('finished');
    expect(whitlock.status).toBe('finished');
    // A second Desk Clerk booked for May 20 and 21, and a casting still open. A member of SAG-AFTRA by then, as its work
    // from the thirtieth day after the first job needs.
    tended(sim, at(2030, 4, 29, 9));
    sim.must({ kind: 'pro.join_sag', payload: {} });
    const booked = accept(sim, offerFor(sim, 'calloway-files', at(2030, 4, 15)));
    expect(booked.days[0]!.from).toBe(at(2030, 5, 20, 7));
    const open: Opportunity = { ...offerFor(sim, 'calloway-files', at(2030, 4, 29)), status: 'open', submitBy: at(2030, 5, 30) };
    delete open.offer;
    sim.player.pro!.opportunities.splice(-1, 1, open);
    const before = JSON.stringify(worked);
    const paidBefore = worked.pay.map((p) => p.received);
    const twin = reload(sim);
    tended(sim, at(2030, 5, 16));
    tended(twin, at(2030, 5, 16));
    // T10: the casting closed, with nothing owed.
    const closed = sim.player.pro!.opportunities.find((x) => x.id === open.id)!;
    expect([closed.status, closed.outcome]).toEqual(['withdrawn', 'The Calloway Files was canceled on May 15, 2030, so casting for Desk Clerk stopped.']);
    // The booked work called off: no day worked, so nothing owed and no payday left on the clock.
    expect(booked.status).toBe('canceled');
    expect(booked.pay).toEqual([]);
    expect(notOwed(booked)).toEqual(booked.contract!.payKeys);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.engagementId === booked.id)).toBe(false);
    // T91: the work done before, its pay and its history, as they were.
    expect(JSON.stringify(worked)).toBe(before);
    expect(worked.pay.map((p) => p.received)).toEqual(paidBefore);
    // T90: the option lapsed with the series, once; its last day does nothing more.
    const option = clauseOf(whitlock.contract, 'option')!;
    expect(option).toMatchObject({ status: 'expired', year: 2030 });
    expect(option.settled!.why).toBe('The Calloway Files was canceled, so there’s no next season to take it up for.');
    tended(sim, at(2030, 7, 2));
    expect(clauseOf(whitlock.contract, 'option')).toEqual(option);
    expect(sim.player.pro!.engagements.filter((x) => x.contract?.renews === whitlock.id)).toEqual([]);
    // T100: the twin loaded before the decision made the same of it.
    expect(twin.player.pro!.engagements.map((x) => [x.id, x.status, x.pay.length])).toEqual(sim.player.pro!.engagements.map((x) => [x.id, x.status, x.pay.length]));
    expect(twin.player.pro!.opportunities.find((x) => x.id === open.id)!.outcome).toBe(closed.outcome);
    // T59, T93: back in May 2032, cast again, the old work unchanged. Read from June 2031, once the old work's releases and
    // any recall to loop are past (from 2026-10-24, brief 25's Module 5, when a release could cut a scene and a wrap bring
    // a looping session, each a change of its own, not the revival's).
    while (sim.now < at(2031, 6, 1)) { tend(sim); sim.advanceTo(Math.min(at(2031, 6, 1), sim.now + 30 * MS_DAY)); }
    const old = JSON.stringify(sim.player.pro!.engagements.filter((x) => x.projectId.startsWith('calloway')));
    while (sim.now < at(2032, 5, 1)) { tend(sim); sim.advanceTo(Math.min(at(2032, 5, 1), sim.now + 30 * MS_DAY)); }
    const t = projectById('calloway-files')!;
    expect(seriesPosts(sim, t, datesOf({ projectId: t.id, postedAt: at(2031, 9, 1) }), at(2031, 9, 1))).toBe(false);
    tended(sim, at(2032, 5, 16));
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Is Back | On May 15, 2032, the network brought The Calloway Files back for a season beginning in July, its twelfth.'))).toBe(true);
    expect(seriesPosts(sim, t, datesOf({ projectId: t.id, postedAt: at(2032, 9, 6) }), at(2032, 9, 6))).toBe(true);
    expect(JSON.stringify(sim.player.pro!.engagements.filter((x) => x.projectId.startsWith('calloway')))).toBe(old);
    // Cast again through an agent's breakdowns: a Desk Clerk in the revived season, a new engagement beside the old.
    signed(sim, sim.now);
    let again: Opportunity | undefined;
    for (let w = 0; w < 40 && !again; w += 1) { tended(sim, sim.now + 7 * MS_DAY); again = sim.player.pro!.opportunities.find((x) => x.projectId.startsWith('calloway') && x.postedAt > at(2032, 5, 16)); }
    expect(again).toBeDefined();
    expect(seasonNumber(sim, CALLOWAY, 2032)).toBe(12);
  });

  it('T62 and T85: a renewal brings no engagement by itself', () => {
    const sim = graduate('contracts-0');
    while (sim.now < at(2029, 9, 1)) { tend(sim); sim.advanceTo(Math.min(at(2029, 9, 1), sim.now + 30 * MS_DAY)); }
    tended(sim, at(2029, 9, 3, 8));
    const e = accept(sim, offerFor(sim, 'calloway-files', at(2029, 9, 3)));
    played(sim, e.days[1]!.to + MS_HOUR);
    const count = sim.player.pro!.engagements.length;
    while (sim.now < at(2030, 5, 1)) { tend(sim); sim.advanceTo(Math.min(at(2030, 5, 1), sim.now + 30 * MS_DAY)); }
    tended(sim, at(2030, 5, 16));
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Is Renewed | ') && n.endsWith('That doesn’t bring you back by itself: a part in it comes only through an option or a new casting.'))).toBe(true);
    expect(sim.player.pro!.engagements).toHaveLength(count);
  });
});

describe('D2: work called off before its days is owed nothing, and says so', () => {
  it('drops a recurring part’s payments when it’s replaced at its first day, each one the contract promised listed as not owed', () => {
    const sim = graduate('contracts-off');
    const e = accept(sim, offerFor(sim, 'calloway-files-whitlock', at(2026, 9, 14)));
    // Asleep through the first call: a screen job replaces the actor at a missed day.
    tended(sim, e.days[0]!.from - 3 * MS_HOUR);
    sim.player.awakeSince = e.days[0]!.from + MS_HOUR;
    sim.advanceTo(e.days[0]!.from + 2 * MS_HOUR);
    expect(e.status).toBe('canceled');
    expect(e.pay).toEqual([]);
    expect(notOwed(e)).toEqual(e.contract!.payKeys);
    expect(clauseOf(e.contract, 'episodes')!.further.map((f) => f.status)).toEqual(['off', 'off', 'off']);
    expect(clauseOf(e.contract, 'option')).toMatchObject({ status: 'expired', settled: { why: 'The work was called off, and the option with it.' } });
  });
});

describe('D9: a recurring part played', () => {
  /** The first seed whose represented, skilled graduate is offered the recurring part through the agent's breakdowns. */
  function offeredWhitlock(): { sim: Simulation; o: Opportunity } {
    for (let n = 0; n < 20; n += 1) {
      const sim = graduate(`contracts-journey-${n}`);
      skilled(sim);
      portfolio(sim);
      signed(sim, sim.now); // TEST SETUP: an agreement in force, as the agent's system writes one
      for (let w = 0; w < 20; w += 1) {
        const o = sim.player.pro!.opportunities.find((x) => x.projectId === 'calloway-files-whitlock' && (x.status === 'audition' || x.status === 'callback'));
        if (o) {
          while (o.status === 'audition' || o.status === 'callback') playRound(sim, o);
          if (o.status === 'offered') return { sim, o };
          break;
        }
        played(sim, sim.now + 7 * MS_DAY);
      }
    }
    throw new Error('No seed reached an offer for the recurring part.');
  }

  it('PLAYER JOURNEY: put up by the agent, offered the part with its terms, accepted, worked with overtime, called or not for more, paid less commission, its option decided, its episode on the air; saved and loaded at each stage', () => {
    const { sim, o } = offeredWhitlock();
    const t = projectById('calloway-files-whitlock')!;
    expect(o.via).toBe('agent');
    // The offer says the contract's terms with its pay: the overtime, the guarantee, the further episodes and the option.
    const q = Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain(termsWords(t, o.offer!.amount).trim());
    expect(q.detail).toContain('The contract guarantees two episodes of the season’s 13 episodes, two shoot days each, and expects you in up to five');
    const e = accept(sim, o);
    expect(e.contract).toMatchObject({ version: 1, basis: 'episode', series: { id: 'calloway-files' } });
    // Saved once accepted, and that save played the same way: the same preparation and the same joining.
    const accepted = reload(sim);
    const play = (x: Simulation) => {
      prepareAll(x, { engagementId: e.id });
      played(x, e.days[0]!.to + MS_HOUR);
      x.must({ kind: 'pro.join_sag', payload: {} });
      played(x, e.days[3]!.to + MS_HOUR);
    };
    play(sim);
    play(accepted);
    const saves = [accepted, reload(sim)];
    // Worked with its overtime, paid through the agency's trust account less commission.
    expect(e.log!.slice(0, 4).every((l) => l.status === 'worked')).toBe(true);
    played(sim, e.days[3]!.to + 21 * MS_DAY);
    const first = e.pay[0]!;
    expect(first.overtime).toBe(2 * overtimeOf(o.offer!.amount!));
    expect(first.received).toMatchObject({ via: 'trust' });
    expect(first.received!.commission).toBeGreaterThan(0);
    expect(first.contribution!.rate).toBe(0.205);
    // The season's word on each further episode, and the work over once it's all come.
    const year = e.contract!.series!.year;
    played(sim, at(year + 1, 4, 30));
    expect(episodesPending(e)).toBe(false);
    expect(e.status).toBe('finished');
    expect(e.pay.every((p) => p.received)).toBe(true);
    saves.push(reload(sim));
    // The option, taken up or let go on its last day, once.
    tended(sim, at(year + 1, 6, 30, 13));
    const option = clauseOf(e.contract, 'option')!;
    expect(['exercised', 'expired']).toContain(option.status);
    const next = sim.player.pro!.engagements.find((x) => x.contract?.renews === e.id);
    expect(next !== undefined).toBe(option.status === 'exercised');
    // Its episode on the air: the first telecast paid for by the salary.
    const r = sim.player.pro!.residuals!.find((x) => x.engagementId === e.id)!;
    expect(r.exploitations[0]!.status).toBe('aired');
    expect(r.calculations[0]!.amount).toBe(0);
    // Each save, played on to the same moment, comes to the same contracts, payments and residuals.
    for (const twin of saves) {
      played(twin, sim.now);
      const a = twin.player.pro!;
      expect(a.engagements.map((x) => [x.id, x.status, x.contract, x.pay.map((p) => [p.key, p.promised, p.received?.net])])).toEqual(sim.player.pro!.engagements.map((x) => [x.id, x.status, x.contract, x.pay.map((p) => [p.key, p.promised, p.received?.net])]));
      expect(a.residuals).toEqual(sim.player.pro!.residuals);
    }
  });
});
