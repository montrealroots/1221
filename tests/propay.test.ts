/**
 * The pay for professional work (brief 19, `docs/verification/career-2026-10-20/criteria.md` D7, D8, V11's payment half,
 * V13, V14, V15's pay transitions): each payment promised and received once, into the right account, its commission only
 * where owed and to the cent, wages reported as wages with where the work was done, permission to work read for each
 * engagement's dates, OPT's days counted from the engagements, and the unions' money.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, played by the clock.
 * TEST SETUP, said where it's done, since the work loop that books engagements is built apart (the coordinator wires its
 * acceptance to `schedulePay`): the stand-ins in tests/fakes/career-work.ts, an engagement written as the work system
 * writes one on accepting an offer, an agreement as the agent's system writes one signed, a graduate made through the
 * School's own Commencement handler, the body kept fed and rested; and an F-1's end moved earlier so its OPT can be
 * played in months rather than years.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { loadSave } from '@/engine';
import { breaches } from '@/engine/core/invariants';
import { PROJECTS, RATES, UNIONS, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import {
  BILLS_KEPT, DUES_KIND, PAY_KIND, RELEASE_KIND, commissionOn, coveredWork, eligibilityRead, joinSagRefusal, keepBills, negotiatedAmount, sagWorkRefusal, schedulePay,
  workEligibilityRefusal, withholdingOn,
} from '@/engine/systems/propay';
import { yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of, usWorkAuthorized } from '@/engine/systems/permission';
import { formatMoney } from '@/engine/core/money';
import { at, booked, graduate, reload, runDays, signed, student, tended } from './fakes/career-work';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const txn = (sim: Simulation, id: string) => sim.universe.transactions.find((t) => t.id === id)!;
const nominal = (sim: Simulation, name: string) => Object.values(sim.universe.accounts).find((a) => a.nominal && a.name === name);
const posted = (sim: Simulation, id: string, accountId: string) => txn(sim, id).postings.filter((p) => p.accountId === accountId).reduce((n, p) => n + p.amount, 0);
const trust = (sim: Simulation) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'escrow' && a.category === 'trust');

describe('a payment promised and received once', () => {
  it('PLAYER JOURNEY: an unsigned graduate’s three weeks Off-Broadway are promised on booking, nothing posted, then each week paid on its Thursday, once, straight to checking, as wages with where the work was done', () => {
    const sim = graduate('pay-weeks');
    const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 14), 3), amount: 1_051_00, per: 'week' });
    const before = { txns: sim.universe.transactions.length, balance: checking(sim).balance };
    expect(schedulePay(sim, sim.player, e)).toEqual({ scheduled: 3, deferred: 0 });
    // Promised money is never posted until it's paid.
    expect(sim.universe.transactions.length).toBe(before.txns);
    expect(e.pay.map((p) => p.due)).toEqual([at(2026, 9, 24, 12), at(2026, 10, 1, 12), at(2026, 10, 8, 12)]);
    // Called twice, it schedules nothing new.
    expect(schedulePay(sim, sim.player, e)).toEqual({ scheduled: 0, deferred: 0 });
    tended(sim, at(2026, 9, 24, 11));
    expect(e.pay[0]!.received).toBeUndefined();
    tended(sim, at(2026, 9, 24, 13));
    const r = e.pay[0]!.received!;
    expect(r).toMatchObject({ gross: 1_051_00, commission: 0, via: 'direct' });
    // Equity's working dues, 2.5% of an Equity contract's gross, from the graduate's membership: $26.28.
    expect(r.dues).toBe(Math.round(1_051_00 * UNIONS.equity.workingDues));
    expect(r.net).toBe(r.gross - r.withheld - r.dues!);
    expect(posted(sim, r.txnId!, checking(sim).id)).toBe(r.net);
    expect(posted(sim, r.txnId!, nominal(sim, 'Wages')!.id)).toBe(-1_051_00);
    expect(txn(sim, r.txnId!).category).toBe('salary');
    expect(txn(sim, r.txnId!).memo).toBe('Wages, 48 hours: Marrow Lane Theater Company, A House On Calder Street, the week of September 13, 2026');
    expect(titled(sim, 'Paid For A House On Calder Street').map((n) => n.body)).toEqual([`Marrow Lane Theater Company paid $1,051.00 for the week of September 13, 2026, less $${(r.withheld / 100).toFixed(2)} withheld for tax and $26.28 in Equity’s working dues, so $${(r.net / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} went into your ${checking(sim).name}.`]);
    // Reported as wages, the work in New York for a New Haven resident.
    const y = yearOf(sim.player, 2026);
    expect(y.employers['Marrow Lane Theater Company']).toBe(1_051_00);
    expect(y.elsewhere['us-ct>us-ny-newyork']).toBe(1_051_00);
    expect(y.dues).toBe(r.dues);
    // A long jump past both other paydays: each paid once, in order.
    tended(sim, at(2026, 10, 12));
    expect(e.pay.map((p) => p.received?.at)).toEqual([at(2026, 9, 24, 12), at(2026, 10, 1, 12), at(2026, 10, 8, 12)]);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Wages') && t.memo.includes('Calder Street'))).toHaveLength(3);
    expect(yearOf(sim.player, 2026).elsewhere['us-ct>us-ny-newyork']).toBe(3 * 1_051_00);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  }, 90_000);

  it('GUARD: no payment twice, across a reload mid-week, a jump past several due dates, and the payday fired twice', () => {
    const sim = graduate('pay-guard');
    const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 14), 3), amount: 1_051_00, per: 'week' });
    schedulePay(sim, sim.player, e);
    // TEST SETUP: a second payday item for the first week, as a payment scheduled twice would leave.
    sim.schedule({ at: e.pay[0]!.due + 60_000, kind: PAY_KIND, label: 'Payday', category: 'career', payload: { personId: sim.player.id, engagementId: e.id, key: e.pay[0]!.key } });
    tended(sim, at(2026, 9, 21, 15));
    // Saved and opened mid-week, between the promise and the payment.
    const again = reload(sim);
    tended(again, at(2026, 10, 20));
    const pay = again.player.pro!.engagements.find((x) => x.id === e.id)!.pay;
    expect(pay.every((p) => p.received !== undefined)).toBe(true);
    const wages = again.universe.transactions.filter((t) => t.category === 'salary' && t.memo.includes('Calder Street'));
    expect(wages).toHaveLength(3);
    expect(new Set(wages.map((t) => t.id))).toEqual(new Set(pay.map((p) => p.received!.txnId)));
    // Each week's gross counted once in the year's wages.
    expect(yearOf(again.player, 2026).employers['Marrow Lane Theater Company']).toBe(3 * 1_051_00);
    // A reload after: nothing more paid.
    const later = reload(again);
    tended(later, at(2026, 11, 1));
    expect(later.universe.transactions.filter((t) => t.category === 'salary' && t.memo.includes('Calder Street'))).toHaveLength(3);
    expect(breaches(later.universe, later.now)).toEqual([]);
  }, 90_000);

  it('shows deferred pay as deferred and never posts it: a student film', () => {
    const sim = graduate('pay-deferred');
    const e = booked(sim, { project: 'paper-moons', days: [at(2026, 9, 14), at(2026, 9, 15), at(2026, 9, 16)], amount: 0, per: 'day' });
    expect(schedulePay(sim, sim.player, e)).toEqual({ scheduled: 0, deferred: 1 });
    const n = sim.universe.transactions.length;
    tended(sim, at(2026, 10, 1));
    expect(e.pay[0]).toMatchObject({ deferred: true });
    expect(e.pay[0]!.received).toBeUndefined();
    expect(sim.universe.transactions.slice(n).filter((t) => t.memo.includes('Paper Moons'))).toEqual([]);
  }, 90_000);
});

describe('commission, only when owed, checked to the cent against the postings', () => {
  it('PLAYER JOURNEY: represented SAG-AFTRA scale work, offered at scale plus ten, pays the agent the ten: into the trust account on Thursday, on to checking three business days later less exactly $256.60', () => {
    const sim = graduate('pay-sag');
    const a = signed(sim, at(2026, 9, 8));
    // The offer an agent negotiates for SAG-AFTRA scale: $1,283 a day plus ten percent.
    const day = negotiatedAmount(RATES['sag-tv-day'].amount!, 'sag-aftra', true);
    expect(day).toBe(1_411_30);
    const e = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21), at(2026, 9, 22)], amount: day, per: 'day', via: 'agent', agreementId: a.id });
    schedulePay(sim, sim.player, e);
    tended(sim, at(2026, 10, 1, 13));
    const p = e.pay[0]!;
    expect(p.inTrust).toMatchObject({ agency: 'Stewart Talent', gross: 2_822_60, commission: 256_60 });
    expect(p.received).toBeUndefined();
    // Held for the player, in an account of theirs at the agency: the gross less what was withheld (no dues: not a member).
    const held = trust(sim)!;
    expect(held.balance).toBe(2_822_60 - p.inTrust!.withheld);
    expect(titled(sim, 'Pay Held For You At Stewart Talent')[0]!.body).toContain('Stewart Talent passes it on to you by October 6, 2026, less $256.60 commission.');
    // What you're worth says where it is while it's held, in whole dollars beside a worth of six figures.
    expect((resolveLook(sim, subject('networth', sim.player.id)) as Looked).summary).toContain(`${formatMoney(held.balance, 'USD', { cents: false })} held for you in your agency’s client trust account`);
    // Three business days from Thursday 1 October: Tuesday 6 October.
    expect(p.inTrust!.releaseAt).toBe(at(2026, 10, 6, 12));
    // TEST SETUP: a second pass-on item for the same payment, as one scheduled twice would leave; then saved and opened
    // while the pay is held.
    sim.schedule({ at: p.inTrust!.releaseAt + 60_000, kind: RELEASE_KIND, label: 'Pay From Stewart Talent', category: 'home', payload: { personId: sim.player.id, engagementId: e.id, key: p.key } });
    const kept = reload(sim);
    tended(kept, at(2026, 10, 7));
    const passedOn = kept.universe.transactions.filter((t) => t.memo.includes('paid on from Stewart Talent’s client trust account'));
    expect(passedOn).toHaveLength(1);
    expect(trust(kept)!.balance).toBe(0);
    tended(sim, at(2026, 10, 6, 13));
    const r = p.received!;
    // Scale is $2,566.00 for the two days; the commission is what's over it, $256.60, which is 9.09% of the gross, not
    // 10%: the actor keeps scale.
    expect(r).toMatchObject({ gross: 2_822_60, commission: 256_60, via: 'trust' });
    expect(r.net).toBe(2_822_60 - r.withheld - 256_60);
    expect(posted(sim, r.txnId!, checking(sim).id)).toBe(r.net);
    expect(posted(sim, r.txnId!, nominal(sim, 'Agent’s Commission')!.id)).toBe(256_60);
    expect(posted(sim, r.txnId!, held.id)).toBe(-(2_822_60 - r.withheld));
    expect(trust(sim)!.balance).toBe(0);
    expect(yearOf(sim.player, 2026).commission).toBe(256_60);
    expect(titled(sim, 'Paid On From Stewart Talent')[0]!.body).toBe(`Stewart Talent passed on your pay for The Calloway Files, the week of September 20, 2026: $${((2_822_60 - r.withheld) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} held for you, less $256.60 commission, so $${(r.net / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} went into your ${checking(sim).name}.`);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  }, 90_000);

  it('takes none on SAG-AFTRA work at scale, and the full 10% where the pay is far over it', () => {
    const sim = graduate('pay-sag-scale');
    const a = signed(sim, at(2026, 9, 8));
    const atScale = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21)], amount: 1_283_00, per: 'day', via: 'agent', agreementId: a.id });
    expect(commissionOn(sim, sim.player, atScale, atScale.pay[0]!, 1_283_00)).toMatchObject({ amount: 0, rule: 'sag-scale' });
    const over = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 23)], amount: 3_000_00, per: 'day', via: 'agent', agreementId: a.id });
    expect(commissionOn(sim, sim.player, over, over.pay[0]!, 3_000_00)).toMatchObject({ amount: 300_00, rule: 'sag', rate: 0.1 });
  }, 90_000);

  it('PLAYER JOURNEY: Equity work at both sides of $525 a week: 10% of $1,051.00 is $105.10; 5% of a $500.00 salary is $25.00, each to the cent in the postings', () => {
    const sim = graduate('pay-equity');
    const a = signed(sim, at(2026, 9, 8));
    const over = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 14), 1), amount: 1_051_00, per: 'week', via: 'agent', agreementId: a.id });
    // TEST SETUP: a weekly salary of $500, Equity's lower tier, which no project in the game pays: the same project's
    // engagement with its offer written at $500.
    const under = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 21), 1), amount: 500_00, per: 'week', via: 'agent', agreementId: a.id });
    schedulePay(sim, sim.player, over);
    schedulePay(sim, sim.player, under);
    tended(sim, at(2026, 10, 8, 13));
    const r1 = over.pay[0]!.received!;
    const r2 = under.pay[0]!.received!;
    expect(r1).toMatchObject({ gross: 1_051_00, commission: 105_10, via: 'trust' });
    expect(r2).toMatchObject({ gross: 500_00, commission: 25_00, via: 'trust' });
    for (const r of [r1, r2]) {
      expect(posted(sim, r.txnId!, nominal(sim, 'Agent’s Commission')!.id)).toBe(r.commission);
      expect(posted(sim, r.txnId!, checking(sim).id)).toBe(r.gross - r.withheld - r.dues! - r.commission);
    }
    expect(commissionOn(sim, sim.player, over, over.pay[0]!, 1_051_00).words).toBe('10% of $1,051.00 gross, Equity’s rate on a weekly salary of $1,051.00, over $525.00.');
    expect(commissionOn(sim, sim.player, under, under.pay[0]!, 500_00).words).toBe('5% of $500.00 gross, Equity’s rate on a weekly salary of $500.00, at or under $525.00.');
    expect(yearOf(sim.player, 2026).commission).toBe(105_10 + 25_00);
  }, 90_000);

  it('PLAYER JOURNEY: unrepresented work, a contract made before the agreement was signed, pays straight to checking with no commission, though the work comes after the signing', () => {
    const sim = graduate('pay-unsigned');
    const e = booked(sim, { project: 'eastview', days: [at(2026, 9, 14), at(2026, 9, 15)], amount: 125_00, per: 'day' });
    schedulePay(sim, sim.player, e);
    tended(sim, at(2026, 9, 8, 12));
    signed(sim, at(2026, 9, 8, 12));
    tended(sim, at(2026, 9, 24, 13));
    const r = e.pay[0]!.received!;
    expect(r).toMatchObject({ gross: 250_00, commission: 0, via: 'direct' });
    expect(txn(sim, r.txnId!).postings.some((p) => p.accountId === nominal(sim, 'Agent’s Commission')?.id)).toBe(false);
    expect(trust(sim)).toBeUndefined();
    expect(commissionOn(sim, sim.player, e, e.pay[0]!, 250_00).words).toBe('No commission: you weren’t represented when you made this contract.');
    // The same work contracted after the signing, the player's own submission and no agreement named on it, carries it:
    // the agreement in force on the day the contract was made.
    const after = booked(sim, { project: 'eastview', days: [at(2026, 10, 5)], amount: 125_00, per: 'day' });
    expect(commissionOn(sim, sim.player, after, after.pay[0]!, 125_00)).toMatchObject({ how: 'term', rule: 'ny', amount: 12_50 });
  }, 90_000);

  it('PLAYER JOURNEY: continuing commission: a contract made while the agreement ran is still commissioned after it ends by agreement, through the trust account, and the Work tab’s words say why', () => {
    const sim = graduate('pay-continuing');
    const a = signed(sim, at(2026, 9, 8));
    const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 21), 2), amount: 1_051_00, per: 'week', via: 'agent', agreementId: a.id });
    schedulePay(sim, sim.player, e);
    tended(sim, at(2026, 9, 25));
    // TEST SETUP: the agreement ended by agreement, as the agent's system ends one.
    Object.assign(a, { status: 'ended', endedAt: sim.now, endedHow: 'agreement' });
    tended(sim, at(2026, 10, 14, 13));
    expect(e.pay.map((p) => [p.received?.commission, p.received?.via])).toEqual([[105_10, 'trust'], [105_10, 'trust']]);
    const c = commissionOn(sim, sim.player, e, e.pay[1]!, 1_051_00);
    expect(c.how).toBe('continuing');
    expect(c.words).toContain('It’s still owed after your agreement with Stewart Talent ended, because you made the contract while it ran.');
  }, 90_000);

  it('owes commission on Equity’s tail, an offer conveyed in the term and accepted within 60 days after it, and none on one accepted later, or on work the agreement doesn’t cover', () => {
    const sim = graduate('pay-tail');
    const a = signed(sim, at(2026, 9, 5));
    Object.assign(a, { status: 'ended', endedAt: at(2026, 9, 7), endedHow: 'agreement' });
    tended(sim, at(2026, 9, 8, 12));
    const within = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 21), 1), amount: 1_051_00, per: 'week', via: 'agent', offerAt: at(2026, 9, 6) });
    expect(commissionOn(sim, sim.player, within, within.pay[0]!, 1_051_00)).toMatchObject({ how: 'tail', amount: 105_10 });
    const late = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 21), 1), amount: 1_051_00, per: 'week', via: 'agent', offerAt: at(2026, 7, 1) });
    expect(commissionOn(sim, sim.player, late, late.pay[0]!, 1_051_00)).toMatchObject({ how: 'unrepresented', amount: 0 });
    expect(coveredWork({ medium: 'stage', place: { city: 'London', cityId: 'uk-eng-london', venue: 'a theater' } })).toBe(false);
    expect(coveredWork(projectById('calder-street')!)).toBe(true);
    // TEST SETUP: a project in London, which no project in the game is, outside the agreement's United States.
    const abroad = { ...projectById('calder-street')!, id: 'test-abroad', place: { city: 'London', cityId: 'uk-eng-london', venue: 'a theater in the West End' } };
    (PROJECTS as ProjectTemplate[]).push(abroad);
    try {
      const away = booked(sim, { project: 'test-abroad', days: runDays(at(2026, 9, 21), 1), amount: 1_051_00, per: 'week', via: 'agent', agreementId: a.id });
      expect(commissionOn(sim, sim.player, away, away.pay[0]!, 1_051_00)).toMatchObject({ how: 'uncovered', amount: 0, words: 'No commission: your agreement with Stewart Talent covers stage, film and television work in the US, and this isn’t that.' });
    } finally {
      (PROJECTS as ProjectTemplate[]).pop();
    }
  }, 90_000);
});

describe('wages, as the tax return counts them', () => {
  it('withholds New York’s tax on New York work by a New Haven resident and no New York City tax, and the return taxes it in New York with Connecticut’s credit', () => {
    const sim = graduate('pay-tax');
    // Withheld on the year's wages so far, as the Summer Cabaret's paychecks are: a first week under New York's standard
    // deduction withholds none of its tax; one past it does.
    expect(withholdingOn(sim, sim.player, 1_051_00, sim.now, 'us-ny-newyork').byState['us-ny']).toBeUndefined();
    // TEST SETUP: a weekly performer's offer, $4,456 a week, on the network drama's part, for four weeks.
    const e = booked(sim, { project: 'calloway-files', days: runDays(at(2026, 9, 14), 4), amount: 4_456_00, per: 'week' });
    schedulePay(sim, sim.player, e);
    tended(sim, at(2026, 10, 30));
    expect(e.pay.every((p) => p.received)).toBe(true);
    const w = withholdingOn(sim, sim.player, 4_456_00, sim.now, 'us-ny-newyork');
    expect(w.byState['us-ny']).toBeGreaterThan(0);
    expect(w.byState['us-ct']).toBeUndefined();
    const y = yearOf(sim.player, 2026);
    expect(y.elsewhere['us-ct>us-ny-newyork']).toBe(4 * 4_456_00);
    expect(y.withheldBy!['us-ny']).toBeGreaterThan(0);
    const f = figuresFor(sim.player, 2026);
    const ny = f.states.find((s) => s.state === 'us-ny')!;
    const ct = f.states.find((s) => s.state === 'us-ct')!;
    expect(ny.tax).toBeGreaterThan(0);
    expect(ct.credit).toBeGreaterThan(0);
    // A nonresident of the city owes none of New York City's tax.
    expect(f.local).toBe(0);
  }, 90_000);

  it('withholds New York City’s tax from a resident of the city on top of the state’s, and only the state’s from a New Haven resident on the same wages', () => {
    const sim = graduate('pay-nyc');
    const y = yearOf(sim.player, 2026);
    const before = { acting: y.acting, elsewhere: { ...y.elsewhere } };
    // TEST SETUP: a year's New York wages so far past the standard deductions, as weeks of work there would leave them.
    y.acting = 30_000_00;
    y.elsewhere['us-ct>us-ny-newyork'] = 30_000_00;
    const visiting = withholdingOn(sim, sim.player, 4_456_00, sim.now, 'us-ny-newyork');
    // TEST SETUP: the same graduate living in New York City, which no life moves to in play.
    sim.player.currentLocationId = 'us-ny-newyork';
    const resident = withholdingOn(sim, sim.player, 4_456_00, sim.now, 'us-ny-newyork');
    expect(visiting.byState['us-ny']).toBeGreaterThan(0);
    expect(resident.byState['us-ny']).toBeGreaterThan(visiting.byState['us-ny']!);
    Object.assign(y, { acting: before.acting, elsewhere: before.elsewhere });
  }, 90_000);
});

describe('permission to work, for each engagement’s dates', () => {
  it('PLAYER JOURNEY: an F-1 student in session can’t accept outside acting work, and signing with an agent changes nothing of it; a citizen can, signed or not', () => {
    const sim = student('elig-f1', { homeRegionId: 'uk-eng-london' });
    expect(f1Of(sim.player)).toBeDefined();
    const days = [{ from: at(2026, 10, 5, 10), to: at(2026, 10, 5, 18) }];
    const before = eligibilityRead(sim.player, days, sim.now);
    expect(before).toMatchObject({ authorized: false, basis: 'student', refusedFrom: at(2026, 10, 5, 12) });
    expect(workEligibilityRefusal(sim.player, days, sim.now)).toBe('You can’t accept this work. On an F-1 you can work only on campus while you’re a student. Yale grants CPT, permission for outside work during a degree, only for training the whole program requires, and the Acting program has none, so outside acting work, paid or unpaid, has to wait for OPT after your degree.');
    signed(sim, sim.now);
    expect(usWorkAuthorized(sim.player, days[0]!.from)).toBe(false);
    expect(eligibilityRead(sim.player, days, sim.now)).toEqual(before);
    const citizen = student('elig-us');
    expect(eligibilityRead(citizen.player, days, citizen.now)).toMatchObject({ authorized: true, basis: 'citizen' });
    signed(citizen, citizen.now);
    expect(eligibilityRead(citizen.player, days, citizen.now)).toMatchObject({ authorized: true, basis: 'citizen' });
  });

  it('counts a green card, a permit of its own, as permission to work, and says it’s the green card', () => {
    const sim = student('elig-green', { homeRegionId: 'uk-eng-london' });
    // TEST SETUP: a green card in force, as a save from before 2026-10-09 could hold one.
    documentsOf(sim.player).push({ id: sim.nextId('document'), kind: 'permit', issuer: 'US', name: 'Permanent Resident Card', number: 'X', status: 'valid', issuedAt: sim.now - MS_DAY, destination: 'US', route: 'us-green-card' });
    expect(usWorkAuthorized(sim.player, sim.now)).toBe(true);
    expect(eligibilityRead(sim.player, [{ from: sim.now + MS_DAY, to: sim.now + MS_DAY + MS_HOUR }], sim.now)).toMatchObject({ authorized: true, basis: 'green-card' });
  });

  it('PLAYER JOURNEY: OPT counts each engagement’s days as days worked, so twelve days of work move its end two of its weekly counts later than none, and once its days without work run out a later engagement is refused, said where it bites', () => {
    const play = (seed: string, work: boolean) => {
      const sim = student(seed, { homeRegionId: 'uk-eng-london' });
      const f1 = f1Of(sim.player)!;
      // TEST SETUP: the degree conferred on 1 September 2026 and the F-1's program ending 1 October, so OPT is played
      // in months: the F-1's end moved to sixty days past the program's.
      f1.expiresAt = at(2026, 10, 1, 12) + 60 * MS_DAY;
      Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2026, 9, 1, 12) });
      tended(sim, at(2026, 9, 2, 10));
      expect(sim.execute({ kind: 'documents.apply_opt', payload: { premium: true } }).ok).toBe(true);
      tended(sim, at(2026, 10, 20, 10));
      const opt = documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
      expect(opt.status).toBe('valid');
      expect(titled(sim, 'OPT Approved')[0]!.body).toBe(`You may work in the United States from October 16, 2026 to October 16, 2027. Each day of professional work you’re booked for counts as a day worked, and OPT ends once you’ve had more than 90 days without work in total.`);
      if (work) {
        // Two weeks of six days, read as authorized for each date.
        const e = booked(sim, { project: 'calder-street', days: runDays(at(2026, 10, 26), 2), amount: 1_051_00, per: 'week' });
        schedulePay(sim, sim.player, e);
        expect(e.eligibility).toMatchObject({ authorized: true, basis: 'opt' });
      }
      tended(sim, at(2027, 2, 1));
      return { sim, opt };
    };
    const idle = play('opt-idle', false);
    const worked = play('opt-worked', true);
    const ended = (s: Simulation) => titled(s, 'OPT Ended')[0]!.at;
    expect(worked.opt.workedDays).toBe(12);
    expect(ended(worked.sim) - ended(idle.sim)).toBe(14 * MS_DAY);
    // Past its days without work, the next engagement's dates aren't covered, said in its words.
    const later = [{ from: at(2027, 2, 8, 10), to: at(2027, 2, 8, 18) }];
    expect(eligibilityRead(worked.sim.player, later, worked.sim.now)).toMatchObject({ authorized: false });
    expect(workEligibilityRefusal(worked.sim.player, later, worked.sim.now)).toBe('You can’t accept this work. There’s no permission to work in the US among your papers for these dates. Papers, under Permission To Work, shows what you hold.');
  }, 120_000);
});

describe('the unions’ money', () => {
  it('PLAYER JOURNEY: the degree makes the graduate a member of Equity and charges $600 down once, then each part and half-year’s dues on its day, never twice across a reload', () => {
    const sim = graduate('union-equity');
    const bills = sim.player.pro!.unionBills!;
    expect(bills.find((b) => b.key === 'equity:initiation:1')).toMatchObject({ amount: 600_00, settled: { how: 'paid' } });
    const down = sim.universe.transactions.filter((t) => t.memo === 'Actors’ Equity Association: Initiation fee, $600.00 down of $1,800.00');
    expect(down).toHaveLength(1);
    expect(down[0]!.at).toBe(at(2026, 9, 3, 10));
    expect(titled(sim, 'Your Equity Initiation Fee')[0]!.body).toBe('You’re a member of Actors’ Equity Association from your degree. Its initiation fee is $1,800.00, paid within three years: $600.00 down is due now, then $600.00 on September 3, 2027 and $600.00 on September 3, 2028. Basic dues are $88.00 each May and November, from November 1, 2026.');
    const again = reload(sim);
    tended(again, at(2026, 11, 2));
    expect(again.universe.transactions.filter((t) => t.memo.startsWith('Actors’ Equity Association'))).toHaveLength(2);
    expect(again.universe.transactions.filter((t) => t.memo === 'Actors’ Equity Association: Basic dues, half a year')).toHaveLength(1);
    expect(again.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === DUES_KIND).map((i) => i.payload.key).sort()).toEqual(['equity:dues:2027-05', 'equity:initiation:2', 'equity:initiation:3']);
  }, 90_000);

  it('PLAYER JOURNEY: an older graduate’s save, its Equity membership from before the fees were charged, is told what’s owed and charged nothing for a past date', () => {
    const sim = graduate('union-older');
    // TEST SETUP: the save as the core's build wrote it, Equity dated at the degree and no bills, and not yet opened under
    // the step that bills it.
    const u = deserialise(serialise(sim.universe)) as typeof sim.universe;
    delete u.people[u.playerId]!.pro!.unionBills;
    u.transactions = u.transactions.filter((t) => !t.memo.startsWith('Actors’ Equity'));
    u.scheduled = u.scheduled.filter((i) => i.kind !== DUES_KIND);
    u.opened = u.opened!.filter((x) => x !== 'pro.unions');
    for (const a of Object.values(u.accounts)) a.balance = 0;
    for (const t of u.transactions) for (const p of t.postings) u.accounts[p.accountId]!.balance += p.amount;
    const opened = loadSave(u);
    const n = opened.universe.transactions.length;
    expect(opened.universe.opened).toContain('pro.unions');
    expect(titled(opened, 'What You Owe Actors’ Equity')[0]!.body).toBe('You joined Actors’ Equity Association with your degree on September 3, 2026. Your save is from before the game charged the union’s fees, so nothing was charged for that day. Its initiation fee is $1,800.00, paid within three years: $600.00 is taken on November 1, 2026, then $600.00 on September 3, 2027 and $600.00 on September 3, 2028. Basic dues are $88.00 each May and November, from November 1, 2026.');
    expect(opened.universe.transactions.length).toBe(n);
    // A second opening tells it again no more.
    const second = reload(opened);
    expect(titled(second, 'What You Owe Actors’ Equity')).toHaveLength(1);
    tended(second, at(2026, 11, 2));
    expect(second.universe.transactions.filter((t) => t.memo.startsWith('Actors’ Equity')).map((t) => [t.memo, t.at])).toEqual([
      ['Actors’ Equity Association: Initiation fee, $600.00 down of $1,800.00', at(2026, 11, 1, 9)],
      ['Actors’ Equity Association: Basic dues, half a year', at(2026, 11, 1, 9)],
    ]);
    expect(breaches(second.universe, second.now)).toEqual([]);
  }, 90_000);

  it('PLAYER JOURNEY: a first SAG-AFTRA principal job makes the actor eligible on its first day; SAG-AFTRA work from the 30th day after needs membership; Join SAG-AFTRA charges its fees once and lifts it', () => {
    const sim = graduate('union-sag');
    const e = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21), at(2026, 9, 22)], amount: 1_283_00, per: 'day' });
    schedulePay(sim, sim.player, e);
    expect(sim.execute({ kind: 'pro.join_sag', payload: {} })).toMatchObject({ ok: false, error: 'You can join SAG-AFTRA once you’ve worked a SAG-AFTRA principal role: a TV, theatrical or Low Budget film part. Ultra Low Budget and student films don’t count toward it.' });
    tended(sim, at(2026, 9, 21, 12));
    expect(sim.player.pro!.sag).toEqual({ eligibleSince: at(2026, 9, 21, 10) });
    expect(titled(sim, 'You Can Join SAG-AFTRA')).toHaveLength(1);
    const soon = [{ from: at(2026, 10, 15, 10), to: at(2026, 10, 15, 18) }];
    const past = [{ from: at(2026, 10, 22, 10), to: at(2026, 10, 22, 18) }];
    expect(sagWorkRefusal(sim.player, soon)).toBeUndefined();
    expect(sagWorkRefusal(sim.player, past)).toBe('SAG-AFTRA work from October 21, 2026 needs you to be a member: that’s the 30th day after your first SAG-AFTRA job began. Press Join SAG-AFTRA on the Career screen’s Work tab first.');
    const before = checking(sim).balance;
    expect(sim.execute({ kind: 'pro.join_sag', payload: {} })).toMatchObject({ ok: true, value: { fee: 3_244_07 } });
    expect(before - checking(sim).balance).toBe(3_244_07);
    expect(sagWorkRefusal(sim.player, past)).toBeUndefined();
    expect(sim.execute({ kind: 'pro.join_sag', payload: {} })).toMatchObject({ ok: false, error: 'You’re already a member of SAG-AFTRA, since September 21, 2026.' });
    expect(reload(sim).player.pro!.sag!.memberSince).toBe(sim.player.pro!.sag!.memberSince);
  }, 90_000);

  it('keeps every unsettled bill and the last twelve settled, so years of dues don’t grow the save', () => {
    const sim = student('union-bounded');
    // TEST SETUP: twenty half-years of dues settled and one still to come.
    const pro = sim.player.pro!;
    pro.unionBills = Array.from({ length: 21 }, (_, i) => ({ key: `equity:dues:${2030 + Math.floor(i / 2)}-${i % 2 ? '11' : '05'}`, union: 'equity' as const, what: 'Basic dues, half a year', amount: 88_00, due: at(2030, 5, 1) + i * 180 * MS_DAY, ...(i < 20 ? { settled: { at: at(2030, 5, 1) + i * 180 * MS_DAY, how: 'paid' as const } } : {}) }));
    keepBills(sim.player);
    expect(pro.unionBills.filter((b) => b.settled)).toHaveLength(BILLS_KEPT);
    expect(pro.unionBills.filter((b) => !b.settled)).toHaveLength(1);
    expect(pro.unionBills[0]!.key).toBe('equity:dues:2034-05');
  });

  it('refuses Join SAG-AFTRA where the bank can’t cover it, and nothing is charged', () => {
    const sim = graduate('union-sag-poor');
    const e = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21)], amount: 1_283_00, per: 'day' });
    schedulePay(sim, sim.player, e);
    tended(sim, at(2026, 9, 21, 12));
    // TEST SETUP: the money taken out of every account the bank would pay from.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'Taken out', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }] });
    const n = sim.universe.transactions.length;
    // Said beside the button before it's pressed, with the amount; once pressed, what didn't happen.
    expect(joinSagRefusal(sim, sim.player)).toBe('Your bank can’t cover the $3,244.07 to join.');
    expect(sim.execute({ kind: 'pro.join_sag', payload: {} })).toMatchObject({ ok: false, error: 'Your bank can’t cover $3,244.07, so nothing was charged.' });
    expect(sim.universe.transactions.length).toBe(n);
    expect(sim.player.pro!.sag!.memberSince).toBeUndefined();
  }, 90_000);
});
