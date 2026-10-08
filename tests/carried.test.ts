/**
 * The last of what was built in on 2026-09-27: work abroad and its taxes,
 * Connecticut's income tax, the states' job-expense deductions, meal
 * penalties, and the body's own: conditions carried, the pharmacy, the
 * dentist and the optician (`systems/career.ts`, `systems/health.ts`,
 * `systems/taxreturn.ts`).
 */
import { documentsOf, passportOf } from '@/engine/systems/documents';
import { describe, expect, it } from 'vitest';
import { evenCraft } from '@/engine/systems/school';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { exchange } from '@/engine/content/currency';
import { computeAnnualTax } from '@/engine/content/tax';
import { MEAL_PENALTY } from '@/engine/content/career';
import { ABROAD, CARE, CHRONIC, DENTAL_VISION, PHARMACY, STATE_DEDUCTIONS } from '@/engine/content/safetynet';
import { afterlife, beginCareer, careerOf, expectedGross, foreignWithholding, mealPenalty, paycheck, roleById, t1287Quote, unitRate, type Booking } from '@/engine/systems/career';
import { earningsOf, recordInterest, recordWages, yearOf } from '@/engine/systems/earnings';
import { grown, healthOf, keepUp, fillMedicine, rxShareOf, shareOf, teethAndEyesShareOf, illnessWeek } from '@/engine/systems/health';
import { canadaElected, connecticutTax, figuresFor, settleUkYears, ukAllowed, ukTaxOn } from '@/engine/systems/taxreturn';
import type { Simulation } from '@/engine/core/simulation';
import { TURNS } from '@/engine/systems/enjoyment';
import { occupiedAt } from '@/engine/systems/life';
import { payeeAccount } from '@/engine/systems/cash';
import { catching } from '@/engine/systems/health';
import { costsAt, foodOf, mealOf, rentOf } from '@/engine/systems/household';
import { personalityOf } from '@/engine/systems/personality';

const NY = 'America/New_York';
const instantParts = (t: number) => new Date(t).getUTCFullYear();
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  beginCareer(sim, sim.player);
  // An actor sent abroad holds a passport, and nothing here is about papers (docs/WORLD.md, stage 1b).
  if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 86_400_000, expiresAt: sim.now + 3650 * 86_400_000 });
  return sim;
}

describe('Canada’s Form T1287', () => {
  it('lowers what a job there withholds to the tax on its net, filed before the work, and only for work in Canada', () => {
    const sim = pro('t1287');
    const job = { id: 'b-tor', roleId: 'guest-hour', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: sim.now + 30 * 86_400_000, units: 5, rehearsalWeeks: 0, status: 'accepted', dueAt: 0, offeredAt: 0, worked: 0, owed: 0 } as unknown as Booking;
    careerOf(sim.player).bookings.push(job);
    const quote = t1287Quote(sim, sim.player, job);
    expect('rate' in quote && quote.rate).toBeLessThan(ABROAD.canada.rate);
    sim.must({ kind: 'career.t1287', payload: { bookingId: 'b-tor' } });
    expect(job.t1287Rate).toBe((quote as { rate: number }).rate);
    expect(foreignWithholding(sim.player, 'ca-on-toronto', 10_000_00, at(2027, 3, 1), 'USD', { id: 'b-tor', expected: 0 })).toBe(Math.round(10_000_00 * job.t1287Rate!));
    // Once filed, not again; a job at home has nothing to file; nor one begun.
    expect(sim.execute({ kind: 'career.t1287', payload: { bookingId: 'b-tor' } }).ok).toBe(false);
    const home = { ...job, id: 'b-ny', location: undefined, t1287Rate: undefined } as unknown as Booking;
    expect(t1287Quote(sim, sim.player, home)).toEqual({ refused: 'It’s for work in Canada.' });
    const begun = { ...job, id: 'b-begun', starts: sim.now - 1, t1287Rate: undefined } as unknown as Booking;
    expect(t1287Quote(sim, sim.player, begun)).toMatchObject({ refused: expect.stringMatching(/before the work/) });
  });
});

describe('working abroad', () => {
  it('withholds Canada’s 23% from every check, and the UK’s 20% from a payer expected past £12,570', () => {
    const sim = pro('abroad');
    const threshold = exchange(ABROAD.uk.payerThresholdGbp, 'GBP', 'USD')!;
    expect(foreignWithholding(sim.player, 'ca-bc-vancouver', 10_000_00, at(2027, 3, 1), 'USD')).toBe(2_300_00);
    // A payer expected under the threshold takes nothing; one expected past it, 20% from the first payment.
    expect(foreignWithholding(sim.player, 'uk-eng-london', 5_000_00, at(2027, 3, 1), 'USD', { id: 'p1', expected: threshold - 100_00 })).toBe(0);
    expect(foreignWithholding(sim.player, 'uk-eng-london', 5_000_00, at(2027, 3, 1), 'USD', { id: 'p2', expected: threshold + 100_00 })).toBe(1_000_00);
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: threshold - 1_000_00, where: 'uk-eng-london', employer: 'p1' });
    // Paid past it after all: the next payment is withheld.
    expect(foreignWithholding(sim.player, 'uk-eng-london', 5_000_00, at(2027, 3, 8), 'USD', { id: 'p1', expected: threshold - 100_00 })).toBe(1_000_00);
    // Another payer's is its own.
    expect(foreignWithholding(sim.player, 'uk-eng-london', 5_000_00, at(2027, 3, 8), 'USD', { id: 'p3', expected: 6_000_00 })).toBe(0);
    expect(foreignWithholding(sim.player, 'us-ga-atlanta', 10_000_00, at(2027, 4, 1), 'USD')).toBe(0);
    // Work abroad is the country's, not a state's.
    expect(yearOf(sim.player, 2027).foreign).toEqual({ uk: { gross: threshold - 1_000_00, withheld: 0 } });
    expect(yearOf(sim.player, 2027).elsewhere).toEqual({});
  });

  it('credits the foreign tax against the US’s on that income, and has Canada’s back under CAD 15,000', () => {
    const sim = pro('ftc');
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: 60_000_00 });
    recordWages(sim.player, at(2027, 5, 1), NY, { gross: 40_000_00, where: 'ca-on-toronto', foreignWithheld: 9_200_00 });
    const federal = computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12)).federal;
    // Filed late, the 216.1 election is lost and the 23% stands, all of it credited as far as the US tax on that income.
    const late = figuresFor(sim.player, 2027, 'USD', at(2028, 5, 15));
    expect(late.foreignRefund).toBe(0);
    expect(late.foreignCredit).toBe(Math.min(9_200_00, Math.round(federal * 0.4)));
    expect(late.federal).toBe(federal - late.foreignCredit);
    // Filed by 30 April, Canada's graduated tax is what stands, and the rest comes back.
    // Worked in Toronto: Ontario's tax, not the 48% surtax.
    const elected = canadaElected(40_000_00, 0, 100_000_00, 'USD', { 'ca-08': 40_000_00 });
    const f = figuresFor(sim.player, 2027, 'USD', at(2028, 4, 15));
    expect(f.foreignRefund).toBe(9_200_00 - elected);
    expect(f.foreignCredit).toBe(Math.min(elected, Math.round(federal * 0.4)));
    // The agent's share of the Canadian work comes off its net.
    const agented = pro('ftc-agent');
    recordWages(agented.player, at(2027, 3, 1), NY, { gross: 60_000_00, commission: 6_000_00 });
    recordWages(agented.player, at(2027, 5, 1), NY, { gross: 40_000_00, where: 'ca-on-toronto', foreignWithheld: 9_200_00, commission: 4_000_00 });
    expect(figuresFor(agented.player, 2027, 'USD', at(2028, 4, 15)).foreignRefund).toBe(9_200_00 - canadaElected(40_000_00, 4_000_00, 100_000_00, 'USD', { 'ca-08': 40_000_00 }));
    const small = pro('ftc-small');
    const under = (exchange(ABROAD.canada.treatyCad, 'CAD', 'USD') ?? 0) - 100_00;
    recordWages(small.player, at(2027, 5, 1), NY, { gross: under, where: 'ca-on-toronto', foreignWithheld: Math.round(under * 0.23) });
    expect(figuresFor(small.player, 2027)).toMatchObject({ foreignRefund: Math.round(under * 0.23), foreignCredit: 0 });
  });
});

describe('the UK’s tax year, and Canada’s tax on residuals', () => {
  it('counts a payer’s total over the UK year from 6 April', () => {
    const sim = pro('uk-year');
    const threshold = exchange(ABROAD.uk.payerThresholdGbp, 'GBP', 'USD')!;
    recordWages(sim.player, at(2027, 3, 20), NY, { gross: threshold, where: 'uk-eng-london', employer: 'p' });
    expect(foreignWithholding(sim.player, 'uk-eng-london', 1_000_00, at(2027, 4, 1), 'USD', { id: 'p', expected: 0 })).toBe(200_00);
    // From 6 April the UK's year starts again.
    expect(foreignWithholding(sim.player, 'uk-eng-london', 1_000_00, at(2027, 4, 10), 'USD', { id: 'p', expected: 0 })).toBe(0);
  });

  it('expects a booking’s whole pay at its rate: days on screen, weeks with rehearsal on stage, episodes for a series', () => {
    const base = { cityId: 'us-ny-newyork' as const, starts: at(2027, 3, 1), status: 'accepted' as const, dueAt: 0, offeredAt: 0, worked: 0, owed: 0 };
    const screen: Booking = { ...base, id: 's', roleId: 'costar', units: 3, rehearsalWeeks: 0 };
    const stage: Booking = { ...base, id: 't', roleId: 'lort-b', units: 6, rehearsalWeeks: 4 };
    const series: Booking = { ...base, id: 'r', roleId: 'series-hour', units: 1, rehearsalWeeks: 0 };
    const when = at(2027, 3, 1);
    expect(expectedGross(screen, when, 'USD')).toBe(unitRate(screen, when, 'USD') * 3);
    expect(expectedGross(stage, when, 'USD')).toBe(unitRate(stage, when, 'USD') * 10);
    expect(expectedGross(series, when, 'USD')).toBe(unitRate(series, when, 'USD') * roleById('series-hour').series!.episodes);
  });

  it('takes the province’s tax where the work was done: BC’s in Vancouver, Ontario’s and its surtax in Toronto, the 48% only on what no province takes', () => {
    const cad = (usd: number) => exchange(usd, 'USD', 'CAD')!;
    const usdOf = (c: number) => exchange(c, 'CAD', 'USD')!;
    const net = cad(80_000_00);
    const federal = Math.round(0.14 * 58_523_00 + 0.205 * (net - 58_523_00));
    // About CAD 109,600: into BC's third band and Ontario's third.
    const bc = Math.round(0.056 * 50_363_00 + 0.077 * (100_728_00 - 50_363_00) + 0.105 * (net - 100_728_00));
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 80_000_00 })).toBe(usdOf(Math.round(federal + bc)));
    const on = Math.round(0.0505 * 53_891_00 + 0.0915 * (107_785_00 - 53_891_00) + 0.1116 * (net - 107_785_00));
    const onSurtax = Math.max(0, on - 5_818_00) * 0.2 + Math.max(0, on - 7_446_00) * 0.36;
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-08': 80_000_00 })).toBe(usdOf(Math.round(federal + on + onSurtax)));
    // Half in each; and half nowhere, the surtax on that half.
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 40_000_00, 'ca-08': 40_000_00 })).toBe(usdOf(Math.round(federal + bc / 2 + (on + onSurtax) / 2)));
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD', { 'ca-02': 40_000_00 })).toBe(usdOf(Math.round(federal + bc / 2 + federal * 0.48 / 2)));
    // Mostly Canadian, and the provinces' personal amounts come off too.
    expect(canadaElected(80_000_00, 0, 80_000_00, 'USD', { 'ca-02': 80_000_00 })).toBe(usdOf(Math.round(federal - Math.round(0.14 * 16_452_00) + bc - Math.round(0.056 * 13_216_00))));
  });

  it('records where abroad each dollar was earned, for the provinces', () => {
    const sim = pro('where');
    recordWages(sim.player, at(2027, 5, 1), NY, { gross: 10_000_00, where: 'ca-bc-vancouver' });
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 5_000_00, where: 'ca-on-toronto' });
    expect(yearOf(sim.player, 2027).foreignWhere).toEqual({ 'ca-bc-vancouver': 10_000_00, 'ca-on-toronto': 5_000_00 });
  });

  it('settles the UK years at tax season', () => {
    const sim = pro('uk-season');
    recordWages(sim.player, at(2024, 6, 1), NY, { gross: 10_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 2_000_00 });
    const season = sim.universe.scheduled.find((i) => i.kind === 'tax.season' && i.status === 'pending')!;
    sim.advanceTo(season.at + 60_000);
    expect(yearOf(sim.player, zonedParts(season.at, NY).year).foreign.uk!.withheld).toBe(-2_000_00);
  }, 60_000);

  it('works Canada’s elected tax on the net: the federal brackets, the surtax, and the personal amount only for mostly Canadian income', () => {
    const cad = (usd: number) => exchange(usd, 'USD', 'CAD')!;
    const net = cad(40_000_00 - 4_000_00);
    const brackets = Math.round(0.14 * Math.min(net, 58_523_00) + 0.205 * Math.max(0, net - 58_523_00));
    expect(canadaElected(40_000_00, 4_000_00, 100_000_00, 'USD')).toBe(exchange(Math.round(brackets * 1.48), 'CAD', 'USD'));
    const big = cad(80_000_00);
    expect(canadaElected(80_000_00, 0, 200_000_00, 'USD')).toBe(exchange(Math.round(Math.round(0.14 * 58_523_00 + 0.205 * (big - 58_523_00)) * 1.48), 'CAD', 'USD'));
    // All of the year's income Canadian: the basic personal amount's credit first.
    expect(canadaElected(40_000_00, 4_000_00, 40_000_00, 'USD')).toBe(exchange(Math.round((brackets - Math.round(0.14 * 16_452_00)) * 1.48), 'CAD', 'USD'));
  });

  it('settles a UK year with its return: all back under the treaty, and over it the bands on it all', () => {
    const sim = pro('uk-settle');
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 15_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 3_000_00 });
    recordWages(sim.player, at(2028, 6, 1), NY, { gross: 80_000_00, where: 'uk-eng-london', employer: 'b', foreignWithheld: 16_000_00 });
    // The 2027–28 year files by 31 January 2029; not before.
    settleUkYears(sim, sim.player, 2028);
    expect(yearOf(sim.player, 2028).foreign.uk!.withheld).toBe(16_000_00);
    settleUkYears(sim, sim.player, 2029);
    expect(yearOf(sim.player, 2029).foreign.uk).toEqual({ gross: 0, withheld: -3_000_00 });
    settleUkYears(sim, sim.player, 2029);
    expect(yearOf(sim.player, 2029).foreign.uk!.withheld).toBe(-3_000_00);
    settleUkYears(sim, sim.player, 2030);
    const tax = ukTaxOn(80_000_00, 'USD');
    const gbp = exchange(80_000_00, 'USD', 'GBP')!;
    expect(tax).toBe(exchange(Math.round(0.2 * 37_700_00 + 0.4 * (gbp - 37_700_00)), 'GBP', 'USD'));
    expect(yearOf(sim.player, 2030).foreign.uk!.withheld).toBe(tax - 16_000_00);
  });

  it('gives a British or EEA citizen the UK’s allowance, tapered past £100,000, and a US citizen none', () => {
    const gbp = (n: number) => exchange(n, 'GBP', 'USD')!;
    // £50,000: the allowance first, and the £37,430 left all at 20%.
    expect(ukTaxOn(gbp(50_000_00), 'USD', true)).toBeCloseTo(gbp(Math.round(0.2 * (50_000_00 - 12_570_00))), -2);
    expect(ukTaxOn(gbp(50_000_00), 'USD', false)).toBeGreaterThan(ukTaxOn(gbp(50_000_00), 'USD', true));
    // Gone by £125,140.
    expect(ukTaxOn(gbp(130_000_00), 'USD', true)).toBe(ukTaxOn(gbp(130_000_00), 'USD', false));
    expect(ukTaxOn(gbp(110_000_00), 'USD', true)).toBeLessThan(ukTaxOn(gbp(110_000_00), 'USD', false));
    expect(ukAllowed('uk')).toBe(true);
    expect(ukAllowed('is')).toBe(true);
    expect(ukAllowed('us')).toBe(false);
  });

  it('keeps a UK year to settle where there’s no account to settle it through', () => {
    const sim = pro('uk-no-account');
    recordWages(sim.player, at(2027, 6, 1), NY, { gross: 15_000_00, where: 'uk-eng-london', employer: 'a', foreignWithheld: 3_000_00 });
    const primary = sim.player.primaryAccountId;
    sim.player.primaryAccountId = undefined;
    settleUkYears(sim, sim.player, 2029);
    expect(earningsOf(sim.player).ukSettled ?? []).toEqual([]);
    sim.player.primaryAccountId = primary;
    settleUkYears(sim, sim.player, 2030);
    expect(earningsOf(sim.player).ukSettled).toEqual(['2027']);
    expect(yearOf(sim.player, 2030).foreign.uk!.withheld).toBe(-3_000_00);
  });

  it('withholds Canada’s 23% from a residual for work done there', () => {
    const sim = pro('ca-residual');
    const b: Booking = { id: 'can', roleId: 'guest-hour', cityId: 'us-ny-newyork', location: 'ca-bc-vancouver', starts: sim.now, units: 8, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 8, owed: 0 };
    let r = afterlife(sim, sim.player, b, sim.now)!;
    for (let n = 0; r.kind === 'network' && !r.rerun && n < 40; n += 1) r = afterlife(sim, sim.player, { ...b, id: `can${n}` }, sim.now)!;
    const first = sim.universe.scheduled.filter((i) => i.kind === 'career.residual' && i.payload.residualId === r.id).sort((x, y) => x.at - y.at)[0]!;
    sim.advanceTo(first.at + 60_000);
    const ca = yearOf(sim.player, instantParts(first.at)).foreign.ca!;
    expect(ca.gross).toBeGreaterThan(0);
    expect(ca.withheld).toBe(Math.round(ca.gross * ABROAD.canada.rate));
  });
});

describe('US tax on work abroad', () => {
  it('is withheld as at home, not by the country’s own tables', () => {
    const sim = pro('home-withholding');
    const b: Booking = { id: 'tor', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    while (sim.now < at(2026, 10, 16, 12)) sim.advanceTo(Math.min(at(2026, 10, 16, 12), sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    const y = yearOf(sim.player, 2026);
    expect(y.foreign.ca!.gross).toBe(y.acting);
    expect(y.withheld).toBe(computeAnnualTax(y.acting, 'us-ny-newyork', at(2026, 10, 15)).total);
    expect(y.foreign.ca!.withheld).toBe(Math.round(y.acting * ABROAD.canada.rate));
  });
});

describe('home from a job, however it went', () => {
  it('brings an actor fired on location home at its end', () => {
    const sim = pro('fired-away');
    sim.player.craft = evenCraft(50);
    const b: Booking = { id: 'tor', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const call = sim.universe.scheduled.find((i) => i.kind === 'career.work' && i.status === 'pending' && i.payload.bookingId === 'tor')!;
    while (sim.now < call.at - 3_600_000) sim.advanceTo(Math.min(call.at - 3_600_000, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    expect(sim.player.currentLocationId).toBe('ca-on-toronto');
    // Asleep through the first call: replaced, and felt.
    sim.player.awakeSince = call.at + 3_600_000;
    sim.player.wellbeing.morale = 50;
    sim.advanceTo(call.at + 60_000);
    expect(b.status).toBe('fired');
    expect(sim.player.wellbeing.morale).toBeLessThan(50 + TURNS.replaced.morale / 2);
    // Home on the next day's flight (from 2026-09-29, when it lands, not the moment the job's done), not at the day the job would have ended.
    const fired = sim.now;
    while (sim.now < fired + 36 * 3_600_000) sim.advanceTo(Math.min(fired + 36 * 3_600_000, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
  }, 60_000);

  it('recasts an actor in hospital on screen without the agency dropping them, and keeps them on stage', () => {
    const sim = pro('hospital-set');
    sim.player.craft = evenCraft(50);
    const career = careerOf(sim.player);
    career.agencyId = 'caa';
    const b: Booking = { id: 'set', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    career.bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const call = sim.universe.scheduled.find((i) => i.kind === 'career.work' && i.status === 'pending' && i.payload.bookingId === 'set')!;
    while (sim.now < call.at - 3_600_000) sim.advanceTo(Math.min(call.at - 3_600_000, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    healthOf(sim.player).inHospitalUntil = call.at + 3_600_000;
    sim.player.wellbeing.morale = 50;
    sim.advanceTo(call.at + 60_000);
    expect(b.status).toBe('released');
    expect(sim.player.wellbeing.morale).toBeLessThan(50 + TURNS.recast.morale / 2);
    // Recast on location, home on the next day's flight.
    const recast = sim.now;
    while (sim.now < recast + 36 * 3_600_000) sim.advanceTo(Math.min(recast + 36 * 3_600_000, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(career.agencyId).toBe('caa');
    expect(sim.universe.scheduled.filter((i) => i.kind === 'career.work' && i.status === 'pending' && i.payload.bookingId === 'set')).toHaveLength(0);
    // On stage, the understudy covers the night and the run goes on.
    const stage = pro('hospital-stage');
    stage.player.craft = { ...sim.player.craft! };
    const run: Booking = { id: 'run', roleId: 'lort-a-plus', cityId: 'us-ny-newyork', starts: at(2026, 10, 6, 8), units: 2, rehearsalWeeks: 1, status: 'offered', dueAt: stage.now + 2 * MS_DAY, offeredAt: stage.now, worked: 0, owed: 0 };
    careerOf(stage.player).bookings.push(run);
    expect(stage.execute({ kind: 'career.accept', payload: { bookingId: run.id } }).ok).toBe(true);
    const first = stage.universe.scheduled.find((i) => i.kind === 'career.work' && i.status === 'pending' && i.payload.bookingId === 'run')!;
    while (stage.now < first.at - 3_600_000) stage.advanceTo(Math.min(first.at - 3_600_000, stage.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    healthOf(stage.player).inHospitalUntil = first.at + 3_600_000;
    stage.advanceTo(first.at + 60_000);
    expect(run.status).toBe('accepted');
    expect(run.worked).toBe(0);
    expect(first.status).toBe('missed');
  }, 60_000);
});

describe('catching the flu', () => {
  it('is likelier short of sleep and under stress, by the tempered studies', () => {
    const sim = pro('catching');
    const w = sim.player.wellbeing;
    Object.assign(w, { sleepDebt: 0, stress: 0 });
    expect(catching(sim.player)).toBe(1);
    Object.assign(w, { sleepDebt: CARE.catching.debtTo, stress: 0 });
    expect(catching(sim.player)).toBeCloseTo(CARE.catching.sleepMost, 9);
    Object.assign(w, { sleepDebt: CARE.catching.debtFrom, stress: 100 });
    expect(catching(sim.player)).toBeCloseTo(CARE.catching.stressMost, 9);
    Object.assign(w, { sleepDebt: 6, stress: 50 });
    expect(catching(sim.player)).toBeCloseTo((1 + 0.5 * (CARE.catching.sleepMost - 1)) * (1 + 0.5 * (CARE.catching.stressMost - 1)), 9);
    // Over a flu season of weeks, the worn catch it more often.
    const count = (debt: number, stress: number) => { let n = 0; for (let i = 0; i < 4000; i += 1) { Object.assign(w, { sleepDebt: debt, stress }); if (illnessWeek(sim, sim.player, at(2026, 11, 2) + i * 7 * MS_DAY).some((e) => e.flu)) n += 1; } return n; };
    expect(count(12, 100)).toBeGreaterThan(count(0, 0) * 2);
  });
});

describe('food', () => {
  it('is bought at the prices where they are, the meal allowance’s town on location', () => {
    const sim = pro('food-away');
    const home = foodOf(sim, sim.player);
    sim.player.currentLocationId = 'us-tx-houston';
    expect(foodOf(sim, sim.player)).not.toBe(home);
    expect(foodOf(sim, sim.player)).toBe(Math.round(costsAt('us-tx-houston', sim.player.home!.kind, 'USD', sim.now).day * personalityOf(sim.player, 'spending')));
    expect(mealOf(sim, sim.player)).toBe(Math.round(costsAt('us-tx-houston', sim.player.home!.kind, 'USD', sim.now).meal * personalityOf(sim.player, 'spending')));
    // The rent is still the home's.
    expect(rentOf(sim, sim.player)).toBe(costsAt('us-ny-newyork', sim.player.home!.kind, 'USD', sim.now).rent);
  });
});

describe('a day on set', () => {
  it('takes its hours: no sleep, shower, workout or unwinding in the middle of it, though a meal fits; and costs energy by them', () => {
    const sim = pro('on-set');
    sim.player.craft = evenCraft(50);
    const b: Booking = { id: 'day', roleId: 'costar', cityId: 'us-ny-newyork', starts: at(2026, 10, 5, 8), units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const call = sim.universe.scheduled.find((i) => i.kind === 'career.work' && i.status === 'pending' && i.payload.bookingId === 'day')!;
    while (sim.now < call.at - 60_000) sim.advanceTo(Math.min(call.at - 60_000, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    const before = sim.player.wellbeing.energy;
    sim.player.wellbeing.hygiene = 90;
    sim.advanceTo(call.at);
    const hours = careerOf(sim.player).days.at(-1)!.hours;
    expect(before - sim.player.wellbeing.energy).toBeCloseTo(hours, 0);
    // And soils them by the hours, under lights and in costume.
    expect(90 - sim.player.wellbeing.hygiene).toBeCloseTo(hours * 1.6 * personalityOf(sim.player, 'hygieneDrift'), 0);
    // A television job's first day: the table read, then on set (`tableRead`, from 2026-10-08).
    sim.advanceTo(call.at + 2 * 3_600_000);
    const sleep = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(sleep.ok).toBe(false);
    expect(sleep.error).toMatch(/You’re at The Table Read, Then On Set/);
    for (const action of ['wash', 'exercise', 'unwind']) expect(sim.execute({ kind: 'life.look_after', payload: { action } }).error ?? '').toMatch(/You’re at The Table Read, Then On Set/);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).error ?? '').not.toMatch(/You’re at/);
    // A sleep set for after the day is fine.
    sim.advanceTo(call.at + 12 * 3_600_000 + 60_000);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 1 } }).ok).toBe(true);
    // A call missed holds nobody, and nor does somebody else's.
    const other = { ...call, id: 'other', at: sim.now - 60_000, status: 'done' as const, payload: { ...call.payload, personId: 'someone-else' } };
    const missed = { ...call, id: 'missed', at: sim.now - 60_000, status: 'missed' as const };
    sim.universe.scheduled.push(other, missed);
    expect(occupiedAt(sim, sim.now)).toBeUndefined();
  }, 60_000);
});

describe('a paycheck', () => {
  it('withholds a city’s resident tax only from its residents', () => {
    const role = roleById('costar');
    const base = { scale: 5_000_00, role, rehearsal: false, represented: false, before: 20_000_00, cityId: 'us-ny-newyork', at: at(2027, 3, 1) };
    const resident = paycheck({ ...base, resident: true });
    const visitor = paycheck({ ...base, resident: false });
    const local = computeAnnualTax(25_000_00, 'us-ny-newyork', at(2027, 3, 1)).local - computeAnnualTax(20_000_00, 'us-ny-newyork', at(2027, 3, 1)).local;
    expect(local).toBeGreaterThan(0);
    expect(resident.withheld - visitor.withheld).toBe(local);
  });

  it('keeps New York City’s tax off a New Haven actor’s check for a job in the city', () => {
    const sim = pro('commuter');
    sim.player.craft = evenCraft(50);
    sim.player.home = { kind: 'shared', cityId: 'us-ct-newhaven', since: sim.now };
    // Earlier in the year, enough to be past the city's deduction.
    yearOf(sim.player, 2026).acting = 50_000_00;
    const b: Booking = { id: 'nyc', roleId: 'costar', cityId: 'us-ny-newyork', starts: at(2026, 10, 5, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    sim.player.currentLocationId = 'us-ny-newyork';
    while (sim.now < at(2026, 10, 16, 12)) sim.advanceTo(Math.min(at(2026, 10, 16, 12), sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    const y = yearOf(sim.player, 2026);
    expect(y.acting).toBeGreaterThan(50_000_00);
    const owing = (income: number) => { const t = computeAnnualTax(income, 'us-ny-newyork', at(2026, 10, 15)); return { all: t.total, local: t.local }; };
    const [after, prior] = [owing(y.acting), owing(50_000_00)];
    expect(after.local - prior.local).toBeGreaterThan(0);
    expect(y.withheld).toBe(after.all - after.local - (prior.all - prior.local));
  }, 60_000);

  it('comes by check into the wallet when there’s no current account open', () => {
    const sim = pro('no-account');
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    current.closedAt = sim.now;
    const into = payeeAccount(sim, sim.player);
    expect(into.kind).toBe('cash');
    expect(payeeAccount(sim, sim.player).id).toBe(into.id);
    delete current.closedAt;
    expect(payeeAccount(sim, sim.player).id).toBe(current.id);
  });
});

describe('interest', () => {
  it('reaches the return and the month’s income, as it was paid', () => {
    const sim = pro('interest');
    const interest = () => -sim.nominalAccount('income', 'Interest').balance;
    const before = interest();
    sim.advanceBy(70 * MS_DAY);
    const paid = interest() - before;
    expect(paid).toBeGreaterThan(0);
    const years = sim.player.earnings!.years;
    expect(Object.values(years).reduce((a, y) => a + (y.interest ?? 0), 0)).toBe(paid);
    const months = Object.values(sim.player.earnings!.months).reduce((a, m) => a + m, 0);
    expect(months).toBeGreaterThanOrEqual(paid);
    // It's taxed as income, and carries no payroll tax.
    const without = figuresFor(sim.player, 2027);
    recordInterest(sim.player, at(2027, 6, 1), NY, 50_000_00);
    const withInterest = figuresFor(sim.player, 2027);
    expect(withInterest.federal).toBeGreaterThan(without.federal);
    expect(withInterest.payroll).toBe(without.payroll);
    // A New Yorker's city tax on it too, by where they lived when it was paid.
    expect(withInterest.local).toBeGreaterThan(without.local);
  }, 60_000);
});

describe('Connecticut', () => {
  it('taxes as its instructions work it: nothing at $15,000, $40 at $20,000, $130 at $25,000', () => {
    expect(connecticutTax(15_000_00)).toBe(0);
    expect(connecticutTax(20_000_00)).toBe(40_00);
    expect(connecticutTax(25_000_00)).toBe(130_00);
    // Past $30,000 the exemption falls away, and past $56,500 the add-back comes.
    expect(connecticutTax(45_000_00)).toBe(Math.round((200_00 + 0.045 * 35_000_00) * 0.9));
    expect(connecticutTax(70_000_00)).toBe(Math.round(2_000_00 + 0.055 * 20_000_00 + 75_00));
  });
});

describe('the states’ job-expense deductions', () => {
  it('itemizes an actor’s commissions and dues on a New York return above 2% of income, where that beats $8,000', () => {
    const sim = pro('it196');
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 18_000_00, dues: 2_000_00 });
    const itemized = 20_000_00 - 0.02 * 100_000_00;
    const extra = itemized - STATE_DEDUCTIONS.standard['us-ny']!;
    const ny = figuresFor(sim.player, 2027).states.find((s) => s.state === 'us-ny')!;
    expect(ny.tax).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12), { deductions: extra }).regional);
    const small = pro('it196-small');
    recordWages(small.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 5_000_00 });
    expect(figuresFor(small.player, 2027).states.find((s) => s.state === 'us-ny')!.tax).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12)).regional);
  });
});

describe('meal penalties', () => {
  it('come on about a fifth of shooting days, a half hour or an hour late, at $25 and then $35', () => {
    const sim = pro('meals');
    const all = Array.from({ length: 4000 }, (_, n) => mealPenalty(sim, sim.player, `d${n}`));
    const late = all.filter((x) => x > 0);
    expect(late.length / 4000).toBeGreaterThan(MEAL_PENALTY.chance * 0.85);
    expect(late.length / 4000).toBeLessThan(MEAL_PENALTY.chance * 1.15);
    expect(new Set(late)).toEqual(new Set([25_00, 60_00]));
  });
});

describe('the pharmacy, the dentist and the optician', () => {
  it('fill a prescription at each plan’s copay, a brand after its deductible, and the uninsured at the cash price', () => {
    const sim = pro('rx');
    const when = at(2027, 3, 1);
    expect(rxShareOf(sim.player, false, when)).toBe(grown(PHARMACY.price.generic, 'rx', when));
    const h = healthOf(sim.player);
    h.sag = { from: at(2027, 1, 1, 0), until: at(2028, 1, 1, 0) };
    expect(rxShareOf(sim.player, false, when)).toBe(Math.max(10_00, Math.round(0.1 * grown(PHARMACY.price.generic, 'rx', when))));
    // SAG-AFTRA's $75 brand deductible first, the greater of $25 or 25% on top; then only the copay.
    expect(rxShareOf(sim.player, true, when)).toBe(75_00 + Math.round(0.25 * grown(PHARMACY.price.brand, 'rx', when)));
    expect(rxShareOf(sim.player, true, when)).toBe(Math.round(0.25 * grown(PHARMACY.price.brand, 'rx', when)));
  });

  it('leave dental and vision to what each plan covers, and the uninsured the price', () => {
    const sim = pro('teeth');
    const when = at(2027, 3, 1);
    // From 2026-10-03 a New Yorker's cleaning is 209 NYC Dental's own $144, not the national average (`NAMED_TEETH_EYES`).
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(144_00);
    const h = healthOf(sim.player);
    h.sag = { from: at(2027, 1, 1, 0), until: at(2028, 1, 1, 0) };
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(0);
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(Math.round(grown(DENTAL_VISION.price.filling, 'dental', when) * 0.25));
    expect(teethAndEyesShareOf(sim.player, 'exam', when)).toBe(10_00);
    expect(shareOf(sim.player, 'glasses', when)).toBe(Math.round(grown(DENTAL_VISION.price.glasses, 'vision', when) * 0.8));
  });

  it('bring the dentist to about three in five a year, and an eye exam only to those with lenses', () => {
    const sim = pro('visits');
    const h = healthOf(sim.player);
    h.lenses = false;
    let years = 0;
    let exams = 0;
    for (let y = 0; y < 120; y += 1) {
      let saw = false;
      for (let w = 0; w < 52; w += 1) {
        for (const e of illnessWeek(sim, sim.player, sim.now + (y * 52 + w) * 7 * MS_DAY)) {
          if (e.care === 'cleaning') saw = true;
          if (e.care === 'exam') exams += 1;
        }
      }
      if (saw) years += 1;
    }
    expect(years / 120).toBeGreaterThan(DENTAL_VISION.dentistShare - 0.12);
    expect(years / 120).toBeLessThan(DENTAL_VISION.dentistShare + 0.12);
    expect(exams).toBe(0);
  });
});

describe('conditions carried', () => {
  it('are drawn once, at a young adult’s rates', () => {
    let depression = 0;
    let lenses = 0;
    for (let n = 0; n < 200; n += 1) {
      const h = healthOf(pro(`c${n}`).player);
      if (h.chronic?.depression) depression += 1;
      if (h.lenses) lenses += 1;
    }
    expect(depression / 200).toBeGreaterThan(CHRONIC.share.depression * 0.6);
    expect(depression / 200).toBeLessThan(CHRONIC.share.depression * 1.4);
    expect(lenses / 200).toBeGreaterThan(DENTAL_VISION.lensShare * 0.8);
    expect(lenses / 200).toBeLessThan(DENTAL_VISION.lensShare * 1.2);
  }, 120_000);

  it('cost their care each month, at what the plan leaves; unpaid, they lapse; left alone, depression weighs on morale', () => {
    const sim = pro('keep');
    const h = healthOf(sim.player);
    h.chronic = { depression: { treated: true }, hypertension: { treated: true } };
    h.sag = { from: at(2026, 1, 1, 0), until: at(2027, 1, 1, 0) };
    const when = at(2026, 3, 1, 1);
    // The month’s care, and its fill of medicine (`fillMedicine`, from 2026-10-02).
    const cost = keepUp(sim, sim.player, when) + fillMedicine(sim, sim.player, when);
    expect(cost).toBe(2 * 25_00 + 2 * Math.max(10_00, Math.round(0.1 * PHARMACY.price.generic)));
    // With next to nothing and no card, the month's care goes unpaid.
    const poor = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'nothing' }, 'keep-poor');
    const ph = healthOf(poor.player);
    ph.chronic = { depression: { treated: true } };
    for (const acct of Object.values(poor.universe.accounts)) if (acct.ownerId === poor.player.id && acct.id === poor.player.primaryAccountId) acct.balance = -5_000_00;
    expect(keepUp(poor, poor.player, when)).toBe(0);
    expect(ph.chronic.depression!.lapsed).toBe(true);
    // Left alone, against the same life without it, a week on.
    const alone = pro('weigh');
    const well = pro('weigh');
    healthOf(alone.player).chronic = { depression: { treated: true } };
    healthOf(well.player).chronic = {};
    expect(alone.execute({ kind: 'health.treat', payload: { condition: 'depression', on: false } }).ok).toBe(true);
    const week = alone.universe.scheduled.filter((i) => i.kind === 'health.week' && i.status === 'pending').sort((x, y) => x.at - y.at)[0]!.at + 60_000;
    alone.advanceTo(week);
    well.advanceTo(week);
    expect(well.player.wellbeing.morale - alone.player.wellbeing.morale).toBeCloseTo(CHRONIC.untreated.moraleAWeek, 0);
    expect(sim.execute({ kind: 'health.treat', payload: { condition: 'asthma', on: true } })).toMatchObject({ ok: false, error: 'You don’t have that.' });
  });

  it('let asthma left alone double the emergencies', () => {
    const sim = pro('asthma');
    const h = healthOf(sim.player);
    let kept = 0;
    let left = 0;
    for (let w = 0; w < 52 * 60; w += 1) {
      h.chronic = { asthma: { treated: true } };
      kept += illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY).filter((e) => e.care === 'emergency').length;
      h.chronic = { asthma: { treated: false } };
      left += illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY).filter((e) => e.care === 'emergency').length;
    }
    expect(left / kept).toBeGreaterThan(1.5);
  });
});
