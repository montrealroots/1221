/**
 * The health journey (the owner's audit of 2026-10-06): lives run through the
 * Papers screen's health and benefits, the Routines screen's gym and trainer,
 * and the Career screen's public pensions, by the same commands those screens
 * run, each step reading what the one before it left.
 *
 * - **Care in New York**: a dental plan bought, and a $144 cleaning falls to
 *   nothing; the conditions it found let go and kept up again, a supply filled
 *   for the one kept; medicine at the median, then at Walmart's $4 once it's
 *   the pharmacy; eight sessions of CBT billed at The Center for CBT's price,
 *   the depression not lifted, as the course's draw says, and another course
 *   begun; a wheelchair, a free permit and free meters; the dental plan
 *   dropped, its premiums stopping and the cleaning's price back.
 * - **A claim denied in Connecticut**: a marketplace plan enrolled in, a
 *   visit denied and billed as if uninsured, paid when due, appealed, and
 *   overturned as its draw says, what was paid over the plan's share back; an
 *   emergency's hospital bill cut two-thirds by Yale New Haven's charity on
 *   application.
 * - **COBRA**: a union plan run out, COBRA elected back to the day, the months
 *   since paid at New York's quarter, a month's premium each month, dropped,
 *   and no premium after.
 * - **A gym in New York**: joined at its fees and New York City's tax, billed
 *   each month, left inside its term for the months left of it, and billed no
 *   more; a trainer's sessions paid two a week and building more than the gym
 *   alone, and stopped.
 * - **Benefits**: SNAP onto an EBT card three months and then held by the time
 *   limit; Ontario Works for a Torontonian with little, and not once savings
 *   pass its limit; EI registered, once (its sickness benefit asks a sick week
 *   no command brings on, and isn't reached); Dublin's Housing Assistance
 *   Payment paying the landlord its part of the rent.
 * - **Pensions at their ages**: the UK State Pension every four weeks at the
 *   year's rate and the next's; Ireland's weekly; the IMSS pension monthly and
 *   the Pensión para el Bienestar every two months; the CPP and Old Age
 *   Security with the GIS and GAINS monthly.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance; Ontario's limit is passed by a gift posted against the opening
 * balances. What is set directly is said where it's set: a pension's
 * contribution record and age, and a December's pay, which no command can
 * give a life at twenty-four; union cover, which is earned by SAG work this
 * journey doesn't play, and the health it arms; and the illness that sends a
 * life to the doctor, which the week's draw brings when it brings it. None of
 * the public pensions is taxed as it's paid, as SLATE has them. One step the
 * game gets wrong is kept apart, skipped, as a defect: a monthly dental plan
 * covers the days to its first month's end and never charges for them.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { COBRA, DENTAL_PLANS } from '@/engine/content/safetynet';
import { DENIALS, armHealth, careFor, careQuote, coverOn, healthOf, rxShareOf } from '@/engine/systems/health';
import { THERAPY, THERAPISTS, sessionPrice as therapyPrice, therapyLifts } from '@/engine/systems/therapy';
import { meterFree } from '@/engine/systems/access';
import { meterCost } from '@/engine/systems/trips';
import { gymById } from '@/engine/content/gyms';
import { joiningCost, leavingCost, taxed } from '@/engine/systems/gyms';
import { SUPERVISED, TRAINERS, sessionPrice as trainerPrice } from '@/engine/systems/trainers';
import { provincialMonth } from '@/engine/systems/assistance';
import { rentOf } from '@/engine/systems/household';
import { eiWeekly } from '@/engine/systems/eiself';
import { hapSplit, netWeeklyEur } from '@/engine/systems/homebenefits';
import { earningsOf, recordWages, yearOf } from '@/engine/systems/earnings';
import { contribute, imssMonthly } from '@/engine/systems/imss';
import { canadaPensionsOf, cppMonthly, oasMonthly, oasRecovery, supplements } from '@/engine/systems/capensions';

type Wealth = 'scraping' | 'wealthy';
const NY = 'us-ny-newyork';
const NEW_HAVEN = 'us-ct-newhaven';
const TORONTO = 'ca-on-toronto';
const DUBLIN = 'ie-lei-dublin';
const LONDON = 'uk-eng-london';
const CDMX = 'mx-cmx-mexicocity';
const YEAR = 365.2425 * MS_DAY;

const life = (seed: string, city = NY, wealth: Wealth = 'wealthy') => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** An hour of a day some days on, in the life's zone. */
const dayAt = (sim: Simulation, days: number, hour: number) => { const p = zonedParts(sim.now + days * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour }, sim.zone); };
const memo = (sim: Simulation, m: string) => sim.universe.transactions.filter((t) => t.memo === m);
/** What a transaction put into the life's own accounts, or took out of them. */
const into = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id && !sim.universe.accounts[p.accountId]?.nominal).reduce((s, p) => s + p.amount, 0);
const gift = (sim: Simulation, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

describe('care in New York', () => {
  it('buys a dental plan, keeps its conditions up, fills them at Walmart, has a course of CBT, gets a permit, and drops the plan', () => {
    // This seed's life carries depression and high blood pressure, drawn when its health is first armed.
    let sim = life('jh-us-ny-newyork-0');
    sim.advanceTo(dayAt(sim, 1, 10));
    const p = () => sim.player;

    // A cleaning at the named practice's price, and nothing on the plan.
    const cleaning = careQuote(sim, p(), 'cleaning');
    expect(cleaning).toBe(144_00);
    expect(sim.must<{ plan: string }>({ kind: 'health.dental', payload: { on: true } }).plan).toBe('ny');
    expect(careQuote(sim, p(), 'cleaning')).toBe(0);
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } }).error).toBe('You have a dental plan.');
    expect(coverOn(p(), sim.now)).toBeUndefined();

    // What it carries, kept up, let go, and kept up again.
    expect(Object.keys(healthOf(p()).chronic ?? {}).sort()).toEqual(['depression', 'hypertension']);
    expect(sim.execute({ kind: 'health.treat', payload: { condition: 'asthma', on: true } }).error).toBe('You don’t have that.');
    // Uninsured, a generic at the median. With the depression let go, a supply is filled for the blood pressure alone.
    const median = rxShareOf(p(), false, sim.now, 'USD');
    expect(median).toBeGreaterThan(4_00);
    expect(sim.must<{ treated: boolean }>({ kind: 'health.treat', payload: { condition: 'depression', on: false } }).treated).toBe(false);
    let b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 30 } }).paid).toBe(median);
    expect(b0 - banked(sim)).toBe(median);
    expect(healthOf(p()).chronic!.depression!.supplyUntil).toBeUndefined();
    expect(sim.must<{ treated: boolean }>({ kind: 'health.treat', payload: { condition: 'depression', on: true } }).treated).toBe(true);

    // At Walmart, its own $4: three fills' worth of each, ninety days.
    expect(sim.execute({ kind: 'health.choose_pharmacy', payload: { chain: 'nowhere' } }).error).toBe('There’s no such pharmacy.');
    expect(sim.must<{ chain: string }>({ kind: 'health.choose_pharmacy', payload: { chain: 'walmart' } }).chain).toBe('walmart');
    expect(rxShareOf(p(), false, sim.now, 'USD')).toBe(4_00);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 90 } }).paid).toBe(2 * 3 * 4_00);
    expect(b0 - banked(sim)).toBe(24_00);
    expect(healthOf(p()).chronic!.depression!.supplyUntil).toBe(sim.now + 90 * MS_DAY);
    expect(healthOf(p()).chronic!.hypertension!.supplyUntil).toBe(sim.now + 120 * MS_DAY);
    expect(sim.execute({ kind: 'health.extra_supply', payload: { days: 91 } }).error).toBe('At most 90 days at once here.');
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 12 } }).error).toBe('It’s England’s, for its prescription charge.');

    // A course of CBT where they live.
    expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'Priory' } }).error).toBe('Choose a therapist where you live.');
    const course = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    expect(course.first).toBe(sim.now + 7 * MS_DAY);
    expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } }).error).toBe('You’re in a course already.');

    // A wheelchair: New York's permit, free, and its meters free with it.
    expect(sim.execute({ kind: 'health.parking_permit', payload: {} }).error).toBe('A permit is for a wheelchair user.');
    expect(sim.must<{ wheelchair: boolean }>({ kind: 'health.mobility', payload: { wheelchair: true } }).wheelchair).toBe(true);
    const meter = meterCost(sim, NY, 60);
    expect(meter).toBeGreaterThan(0);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'health.parking_permit', payload: {} }).paid).toBe(0);
    expect(banked(sim)).toBe(b0);
    expect(sim.execute({ kind: 'health.parking_permit', payload: {} }).error).toBe('You have one.');

    sim = reload(sim);
    expect(healthOf(p())).toMatchObject({ pharmacy: 'walmart', dental: { plan: 'ny' } });
    expect(p().therapy).toMatchObject({ therapist: 'The Center for CBT', done: 0 });
    expect(meterFree(p(), NY)).toBe(true);
    expect(meterCost(sim, NY, 60, p())).toBe(0);

    // Eight weekly sessions, each at the practice's price, and the course's draw on the last.
    const cbt = THERAPISTS.find((t) => t.name === 'The Center for CBT')!;
    const last = course.first + (THERAPY.sessions - 1) * 7 * MS_DAY;
    sim.advanceTo(last + MS_DAY);
    const sessions = memo(sim, 'The Center for CBT, a session');
    expect(sessions.map((t) => -into(sim, t))).toEqual(Array(THERAPY.sessions).fill(therapyPrice(sim, cbt)));
    expect(p().therapy).toBeUndefined();
    // This life's draw on the last session, at a private course's 36%, doesn't lift it: it stays, and another course can be had.
    expect(therapyLifts(sim, p(), false, last)).toBe(false);
    expect(healthOf(p()).chronic!.depression).toBeDefined();
    expect(titled(sim, 'The Course Is Done')).toHaveLength(1);
    expect(titled(sim, 'The Depression Has Lifted')).toEqual([]);
    expect(sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } }).first).toBe(sim.now + 7 * MS_DAY);

    // The dental plan’s premium when bought, for January, then each first of the month; dropped at the month’s end, and none after.
    const premium = `${DENTAL_PLANS.ny.label} premium`;
    expect(memo(sim, premium).map((t) => -into(sim, t))).toEqual([DENTAL_PLANS.ny.premium, DENTAL_PLANS.ny.premium, DENTAL_PLANS.ny.premium]);
    const dropped = sim.must<{ until: number }>({ kind: 'health.dental', payload: { on: false } });
    expect(zonedParts(dropped.until, 'America/New_York')).toMatchObject({ month: 4, day: 1, hour: 0 });
    sim.advanceTo(dropped.until + 40 * MS_DAY);
    expect(memo(sim, premium)).toHaveLength(3);
    expect(sim.execute({ kind: 'health.dental', payload: { on: false } }).error).toBe('You have no dental plan.');
    expect(careQuote(sim, p(), 'cleaning')).toBe(cleaning);

    // Out of the chair, the permit goes with it.
    sim.must({ kind: 'health.mobility', payload: { wheelchair: false } });
    expect(p().parkingPermit).toBeUndefined();
    expect(meterCost(sim, NY, 60, p())).toBe(meterCost(sim, NY, 60));
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

/** A Connecticut life on a marketplace plan from February, by its own income: a December's pay, recorded, which no command at twenty-four has earned. */
function insuredInNewHaven(seed: string): Simulation {
  const sim = life(seed, NEW_HAVEN);
  recordWages(sim.player, instantFromZoned({ year: 2025, month: 12, day: 15, hour: 12 }, 'America/New_York'), 'America/New_York', { gross: 60_000_00, where: NEW_HAVEN });
  expect(sim.must<{ kind: string }>({ kind: 'health.enroll', payload: {} }).kind).toBe('marketplace');
  sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 2, hour: 10 }, 'America/New_York'));
  return sim;
}

describe('a claim denied in Connecticut', () => {
  it('appeals a denied visit, pays it when due, has the appeal decided by its draw, and has a hospital’s charity cut an emergency’s bill', () => {
    // The visit is had directly, as the week's illness draw has it: the seeds are tried until the plan denies one, as `claims.test.ts` does.
    let sim!: Simulation;
    let billId = '';
    for (let i = 0; i < 40 && !billId; i += 1) {
      sim = insuredInNewHaven(`jh-deny-${i}`);
      expect(coverOn(sim.player, sim.now)).toBe('marketplace');
      const bill = careFor(sim, sim.player, { care: 'visit', what: 'A checkup' }, sim.now);
      if (bill?.denied) billId = bill.id;
    }
    expect(billId).not.toBe('');
    const bill = () => healthOf(sim.player).bills.find((b) => b.id === billId)!;
    expect(bill().amount).toBeGreaterThan(bill().denied!.share);
    expect(titled(sim, 'A Claim Denied')).toHaveLength(1);

    expect(sim.execute({ kind: 'health.appeal', payload: { billId: 'm999' } }).error).toBe('That claim wasn’t denied.');
    const appeal = sim.must<{ decidedAt: number }>({ kind: 'health.appeal', payload: { billId } });
    expect(appeal.decidedAt).toBe(sim.now + DENIALS.decideDays * MS_DAY);
    expect(sim.execute({ kind: 'health.appeal', payload: { billId } }).error).toBe('It’s been appealed.');
    // A doctor's visit isn't a hospital's: the charity is for those.
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId } }).error).toBe('Only a Connecticut hospital’s bill.');

    // An emergency the same day: a hospital bill, applied for, at 3.8 times the poverty line two-thirds off.
    const er = careFor(sim, sim.player, { care: 'emergency', what: 'A fall' }, sim.now)!;
    const full = er.amount;
    expect(full).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: 'nope' } }).error).toBe('There’s no such bill.');
    expect(sim.must<{ aid: string; amount: number }>({ kind: 'health.apply_aid', payload: { billId: er.id } })).toEqual({ aid: 'discount', amount: Math.round(full * (1 - 0.67)) });
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: er.id } }).error).toBe('You’ve applied for it.');

    sim = reload(sim);
    expect(bill().denied!.appealedAt).toBeDefined();
    // Each is paid from the bank on its due day, at what it says then.
    const owed = bill().amount;
    sim.advanceTo(bill().dueAt + MS_HOUR);
    expect(memo(sim, `Medical bill: ${bill().what}`).map((t) => -into(sim, t))).toEqual([owed]);
    const erBill = healthOf(sim.player).bills.find((b) => b.id === er.id)!;
    expect(memo(sim, `Medical bill: ${erBill.what}`).map((t) => -into(sim, t))).toEqual([Math.round(full * 0.33)]);

    // Not decided a day early.
    sim.advanceTo(appeal.decidedAt - MS_DAY);
    expect(bill().denied!.outcome).toBeUndefined();
    // Decided sixty days on, as its draw says; this one's overturns it (insurers uphold 56%), and all that was paid
    // over the plan's share comes back to the bank, once.
    sim.advanceTo(appeal.decidedAt + MS_HOUR);
    expect(sim.rng('health.appeal', sim.player.id, billId).next() < DENIALS.upheld).toBe(false);
    expect(bill().denied!.outcome).toBe('overturned');
    expect(bill().amount).toBe(bill().denied!.share);
    expect(memo(sim, `Appeal won: ${bill().what}`).map((t) => into(sim, t))).toEqual([owed - bill().denied!.share]);
    expect(titled(sim, 'Appeal Won')).toHaveLength(1);
    // Past its due day, the charity can't be applied for; nor, appealed, the denial again.
    expect(sim.execute({ kind: 'health.apply_aid', payload: { billId: er.id } }).error).toBe('It’s settled or past due.');
    expect(sim.execute({ kind: 'health.appeal', payload: { billId } }).error).toBe('It’s been appealed.');
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('COBRA', () => {
  it('elects COBRA back to the day a union plan ended, pays the months since at New York’s quarter, a premium each month, and none once dropped', () => {
    let sim = life('jh-cobra');
    const NYZ = 'America/New_York';
    const on = (month: number, day: number, hour = 12) => instantFromZoned({ year: 2026, month, day, hour }, NYZ);
    // SAG-AFTRA's plan to the end of February, set directly: it's earned by four quarters of SAG work this journey doesn't play.
    // And health armed as a life's first working week arms it (`beginCareer`).
    armHealth(sim, sim.player);
    const h = () => healthOf(sim.player);
    h().sag = { from: on(1, 1, 0), until: on(3, 1, 0) };
    expect(sim.execute({ kind: 'health.elect_cobra', payload: {} }).error).toBe('You have no COBRA to elect.');
    sim.advanceTo(on(3, 2));
    expect(h().cobraOffer).toMatchObject({ plan: 'sag' });
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(titled(sim, 'You Can Keep Your Plan By COBRA')).toHaveLength(1);

    sim = reload(sim);
    sim.advanceTo(on(4, 10));
    // March and April, at New York's quarter for a month that earned nothing.
    const b0 = banked(sim);
    const elected = sim.must<{ from: number; months: number }>({ kind: 'health.elect_cobra', payload: {} });
    expect(elected.months).toBe(2);
    const quarter = Math.round(COBRA.premium.sag * (1 - COBRA.newYorkShare));
    expect(b0 - banked(sim)).toBe(Math.round(COBRA.premium.sag * (1 - COBRA.newYorkShare) * 2));
    expect(coverOn(sim.player, on(3, 15))).toBe('cobra');
    // Eighteen months from March: to the first of September 2027.
    expect(h().cobra!.until).toBe(instantFromZoned({ year: 2027, month: 9, day: 1, hour: 0 }, NYZ));
    expect(sim.execute({ kind: 'health.elect_cobra', payload: {} }).error).toBe('You have no COBRA to elect.');

    // A premium each first of the month, May and June; dropped in June, it ends with the month.
    sim.advanceTo(on(6, 10));
    expect(memo(sim, 'COBRA premium').map((t) => -into(sim, t))).toEqual([quarter, quarter]);
    const dropped = sim.must<{ until: number }>({ kind: 'health.drop', payload: {} });
    expect(dropped.until).toBe(on(7, 1, 0));
    sim.advanceTo(on(9, 2));
    expect(memo(sim, 'COBRA premium')).toHaveLength(2);
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('a gym in New York', () => {
  it('joins Planet Fitness, is billed each month, books a trainer two sessions a week, stops it, and leaves inside the term', () => {
    let sim = life('jh-gym');
    sim.advanceTo(dayAt(sim, 1, 10));
    const pf = gymById('planet-fitness-union-square')!;
    const classic = pf.tiers.find((t) => t.name === 'Classic')!;
    expect(sim.execute({ kind: 'gym.leave', payload: {} }).error).toBe('You aren’t a member of a gym.');
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'nowhere', tier: 'Classic' } }).error).toBe('There’s no such gym.');
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: pf.id, tier: 'Gold' } }).error).toBe('It has no such membership.');
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'puregym-holborn', tier: 'Core' } }).error).toBe('You join in person, in its town.');
    let b0 = banked(sim);
    const joined = sim.must<{ paid: number }>({ kind: 'gym.join', payload: { gymId: pf.id, tier: 'Classic' } });
    expect(joined.paid).toBe(joiningCost(sim, pf, classic));
    expect(joined.paid).toBe(Math.round((59 + 19 + 59) * 1.045 * 100));
    expect(b0 - banked(sim)).toBe(joined.paid);
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).error).toBe('You’re a member of Planet Fitness Union Square already.');

    // A trainer two sessions a week: the third workout's on their own.
    const equinox = TRAINERS.find((t) => t.id === 'equinox-tier-1')!;
    expect(sim.execute({ kind: 'gym.trainer', payload: { trainerId: 'north-haven-health-racquet', perWeek: 2 } }).error).toBe('That trainer isn’t in the town you’re in.');
    expect(sim.must<{ perWeek: number }>({ kind: 'gym.trainer', payload: { trainerId: equinox.id, perWeek: 2 } }).perWeek).toBe(2);
    const twin = life('jh-gym');
    twin.advanceTo(dayAt(twin, 1, 10));
    twin.must({ kind: 'gym.join', payload: { gymId: pf.id, tier: 'Classic' } });
    const fit0 = sim.player.wellbeing.fitness;
    expect(twin.player.wellbeing.fitness).toBe(fit0);
    b0 = banked(sim);
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    twin.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    // Coached, the workout builds the more; the twin at the gym alone builds less.
    expect(sim.player.wellbeing.fitness - fit0).toBeGreaterThan(twin.player.wellbeing.fitness - fit0);
    expect(sim.player.wellbeing.fitness - fit0).toBeCloseTo((twin.player.wellbeing.fitness - fit0) * SUPERVISED, 6);
    sim.advanceTo(dayAt(sim, 1, 10));
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    sim.advanceTo(dayAt(sim, 1, 10));
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(memo(sim, `${equinox.name}, a session`).map((t) => -into(sim, t))).toEqual([trainerPrice(sim, equinox), trainerPrice(sim, equinox)]);

    sim = reload(sim);
    expect(sim.player.training).toMatchObject({ trainerId: equinox.id, perWeek: 2, used: 2 });
    expect(sim.player.gym).toMatchObject({ gymId: pf.id, tier: 'Classic' });
    // Stopped, a new week's workout is the gym's alone.
    expect(sim.must<{ perWeek: number }>({ kind: 'gym.trainer', payload: {} }).perWeek).toBe(0);
    sim.advanceTo(dayAt(sim, 7, 10));
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(memo(sim, `${equinox.name}, a session`)).toHaveLength(2);

    // Billed each month on the day it was joined.
    const month = `${pf.name}, the month`;
    sim.advanceTo(dayAt(sim, 70, 10));
    expect(memo(sim, month).map((t) => -into(sim, t))).toEqual([taxed(sim, pf, 19), taxed(sim, pf, 19)]);
    // Left inside its twelve months: the months left of it, and billed no more.
    const rest = leavingCost(sim, sim.player);
    expect(rest).toBe(taxed(sim, pf, 10 * 19));
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'gym.leave', payload: {} }).paid).toBe(rest);
    expect(b0 - banked(sim)).toBe(rest);
    expect(sim.player.gym).toBeUndefined();
    sim = reload(sim);
    sim.advanceTo(dayAt(sim, 70, 10));
    expect(memo(sim, month)).toHaveLength(2);
    expect(memo(sim, `${pf.name}, the rest of the term`)).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
    expect(breaches(twin.universe)).toEqual([]);
  }, 120_000);
});

describe('benefits', () => {
  it('puts SNAP on an EBT card for three months, and holds it at the time limit without the work', () => {
    let sim = life('jh-snap');
    sim.advanceTo(dayAt(sim, 1, 10));
    const claim = sim.must<{ scheme: string; firstPaymentAt: number }>({ kind: 'benefits.assistance', payload: {} });
    expect(claim).toEqual({ scheme: 'snap', firstPaymentAt: sim.now + 7 * MS_DAY });
    expect(sim.execute({ kind: 'benefits.assistance', payload: {} }).error).toBe('You have a claim open.');
    sim = reload(sim);
    // No earnings: fiscal 2026's maximum, $298, each thirty days.
    sim.advanceTo(claim.firstPaymentAt + 95 * MS_DAY);
    const months = memo(sim, 'SNAP, the month, onto the EBT card');
    expect(months.map((t) => into(sim, t))).toEqual([298_00, 298_00, 298_00]);
    expect(months.map((t) => t.at - claim.firstPaymentAt)).toEqual([0, 30 * MS_DAY, 60 * MS_DAY]);
    expect(titled(sim, 'SNAP Time Limit Reached')).toHaveLength(1);
    sim.advanceBy(60 * MS_DAY);
    expect(memo(sim, 'SNAP, the month, onto the EBT card')).toHaveLength(3);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('refuses Ontario Works to a wealthy Torontonian, pays one with little the month, and not once savings pass its limit', () => {
    const rich = life('jh-ow-rich', TORONTO);
    expect(rich.execute({ kind: 'benefits.assistance', payload: {} }).error).toBe('Ontario Works asks liquid assets under CAD 10,000.');
    expect(breaches(rich.universe)).toEqual([]);

    let sim = life('jh-ow', TORONTO, 'scraping');
    sim.advanceTo(dayAt(sim, 1, 10));
    const claim = sim.must<{ scheme: string; firstPaymentAt: number }>({ kind: 'benefits.assistance', payload: {} });
    expect(claim).toEqual({ scheme: 'ontario-works', firstPaymentAt: sim.now + 6 * MS_DAY });
    sim = reload(sim);
    sim.advanceTo(claim.firstPaymentAt + MS_HOUR);
    const due = provincialMonth('ontario-works', rentOf(sim, sim.player), 0, 0);
    expect(memo(sim, 'Ontario Works, the month').map((t) => into(sim, t))).toEqual([due]);
    expect(due).toBe(343_00 + Math.min(rentOf(sim, sim.player), 390_00));
    // A gift of CAD 20,000: past the limit, the next month isn't paid.
    gift(sim, 20_000_00);
    sim.advanceBy(31 * MS_DAY);
    expect(memo(sim, 'Ontario Works, the month')).toHaveLength(1);
    expect(sim.player.assistance!.closedAt).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('registers a Canadian for EI’s special benefits, once, and not a New Yorker', () => {
    const ny = life('jh-ei-ny');
    expect(ny.execute({ kind: 'benefits.ei_register', payload: {} }).error).toBe('EI is for someone living in Canada.');
    expect(breaches(ny.universe)).toEqual([]);
    let sim = life('jh-ei', TORONTO);
    expect(sim.must<{ registeredAt: number }>({ kind: 'benefits.ei_register', payload: {} }).registeredAt).toBe(sim.now);
    expect(sim.execute({ kind: 'benefits.ei_register', payload: {} }).error).toBe('You’re registered.');
    sim = reload(sim);
    expect(sim.player.ei?.registeredAt).toBeDefined();
    // Its sickness benefit asks twelve months registered and a year's earnings, and a week too sick to work, which no
    // command brings on: `cabenefits.test.ts` plays it with an admission set directly. Here, registered a day, it's nothing.
    expect(eiWeekly(sim, sim.player, sim.now)).toBe(0);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('has Dublin City Council pay the landlord its part of the rent under HAP', () => {
    let sim = life('jh-hap', DUBLIN);
    expect(sim.must<{ council: number }>({ kind: 'benefits.hap', payload: {} }).council).toBe(0);
    expect(sim.execute({ kind: 'benefits.hap', payload: {} }).error).toBe('You have it.');
    sim = reload(sim);
    const rent = sim.universe.scheduled.find((i) => i.kind === 'home.rent' && i.status === 'pending')!;
    sim.advanceTo(rent.at - MS_HOUR);
    const full = rentOf(sim, sim.player);
    const split = hapSplit(full, sim.player.home?.kind === 'own', netWeeklyEur(sim, sim.player));
    sim.advanceTo(rent.at + MS_HOUR);
    const council = memo(sim, 'Housing Assistance Payment: Dublin City Council paid the landlord');
    expect(council).toHaveLength(1);
    expect(council[0]!.postings.find((p) => p.amount > 0)!.amount).toBe(Math.min(full, split.council));
    // The tenant pays the rest, from the bank.
    expect(memo(sim, 'Rent').map((t) => -into(sim, t))).toEqual([full - Math.min(full, split.council)]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('pensions at their ages', () => {
  // Each pension needs a working life's record and the age to draw it; both are set directly, said where, since no
  // command gives a life of twenty-four forty years. None of these four is taxed as it's paid: SLATE doesn't withhold
  // on them (`statepension.ts` says so of the UK's), so the whole of each payment reaches the bank.

  it('pays the UK State Pension every four weeks at the year’s rate, and the next year’s from April', () => {
    let sim = life('jh-sp', LONDON);
    const p = () => sim.player;
    expect(sim.execute({ kind: 'pension.state', payload: {} }).error).toBe('From June 14, 2069, State Pension age.');
    // Born 1 December 1959: State Pension age at 66, a month gone. Nine qualifying years, then thirty-five.
    p().birthInstant = Date.UTC(1959, 11, 1);
    earningsOf(p()).ukEarned = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(1985 + i), 10_000_00]));
    expect(sim.execute({ kind: 'pension.state', payload: {} }).error).toBe('Ten qualifying years give a pension; your National Insurance record has 9.');
    earningsOf(p()).ukEarned = Object.fromEntries(Array.from({ length: 35 }, (_, i) => [String(1985 + i), 10_000_00]));
    const claimedAt = sim.now;
    expect(sim.must<{ weekly: number }>({ kind: 'pension.state', payload: {} }).weekly).toBe(230_25);
    expect(sim.execute({ kind: 'pension.state', payload: {} }).error).toBe('You’re drawing it.');
    sim = reload(sim);
    sim.advanceTo(claimedAt + 4 * 28 * MS_DAY + MS_HOUR);
    const paid = memo(sim, 'The State Pension, four weeks');
    expect(paid.map((t) => t.at - claimedAt)).toEqual([1, 2, 3, 4].map((n) => n * 28 * MS_DAY));
    // February to March at 2025/26's £230.25 a week; the fourth, 27 April, at 2026/27's £241.30.
    expect(paid.map((t) => into(sim, t))).toEqual([921_00, 921_00, 921_00, 965_20]);
    expect(paid.every((t) => t.postings.length === 2)).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('pays Ireland’s State Pension (Contributory) weekly on twenty years’ contributions', () => {
    let sim = life('jh-ie', DUBLIN);
    const p = () => sim.player;
    expect(sim.execute({ kind: 'pension.ie_state', payload: {} }).error).toBe('From 66; more if you wait to 67, and more again to 68.');
    // Twenty years of Irish pay, from thirty, and sixty-six this past fortnight.
    p().birthInstant = sim.now - 66.05 * YEAR;
    const born = new Date(p().birthInstant).getUTCFullYear();
    for (let y = born + 30; y < born + 50; y += 1) recordWages(p(), Date.UTC(y, 6, 1), 'Europe/Dublin', { gross: 30_000_00, where: DUBLIN });
    const claimedAt = sim.now;
    // 1,040 contributions of 2,080: half the full €299.30.
    expect(sim.must<{ weekly: number }>({ kind: 'pension.ie_state', payload: {} }).weekly).toBe(149_65);
    expect(sim.execute({ kind: 'pension.ie_state', payload: {} }).error).toBe('You’re drawing it.');
    sim = reload(sim);
    sim.advanceTo(claimedAt + 15 * MS_DAY);
    const paid = memo(sim, 'The State Pension (Contributory), the week');
    expect(paid.map((t) => [t.at - claimedAt, into(sim, t)])).toEqual([[7 * MS_DAY, 149_65], [14 * MS_DAY, 149_65]]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('pays a Mexican of 65 the IMSS pension monthly and the Pensión para el Bienestar every two months', () => {
    let sim = life('jh-mx', CDMX);
    const p = () => sim.player;
    expect(sim.execute({ kind: 'pension.bienestar', payload: {} }).error).toBe('From 65.');
    expect(sim.execute({ kind: 'pension.imss', payload: {} }).error).toBe('It’s for someone with IMSS contributions: work in Mexico.');
    p().birthInstant = sim.now - 65.2 * YEAR;
    // Three days' IMSS work a month ago, and short of the weeks; then a working life's 900 weeks at MXN 500 a day,
    // registered as a Mexican payroll registers them (`contribute`), in one stroke.
    contribute(sim, p(), sim.now - 30 * MS_DAY, 3 * 500_00, 3);
    expect(sim.execute({ kind: 'pension.imss', payload: {} }).error).toBe('It takes 875 weeks this year; your IMSS record has 0. The Pensión para el Bienestar is for every Mexican from 65.');
    contribute(sim, p(), sim.now - 20 * MS_DAY, 6_300 * 500_00, 6_300);
    const quoted = imssMonthly(p().imss!, sim.now);
    const claimedAt = sim.now;
    expect(sim.must<{ monthly: number }>({ kind: 'pension.imss', payload: {} }).monthly).toBe(quoted);
    expect(sim.must<{ bimonthly: number }>({ kind: 'pension.bienestar', payload: {} }).bimonthly).toBe(6_400_00);
    expect(sim.execute({ kind: 'pension.imss', payload: {} }).error).toBe('You’re drawing it.');
    expect(sim.execute({ kind: 'pension.bienestar', payload: {} }).error).toBe('You’re drawing it.');
    sim = reload(sim);
    sim.advanceTo(claimedAt + 125 * MS_DAY);
    const c = new Date(claimedAt);
    const monthsOn = (n: number) => Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + n, c.getUTCDate(), c.getUTCHours());
    expect(memo(sim, 'IMSS pension, the month').map((t) => [t.at, into(sim, t)])).toEqual([1, 2, 3, 4].map((n) => [monthsOn(n), quoted]));
    expect(memo(sim, 'Pensión para el Bienestar, two months').map((t) => [t.at, into(sim, t)])).toEqual([2, 4].map((n) => [monthsOn(n), 6_400_00]));
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('pays a Torontonian of 66 the CPP and Old Age Security, with the GIS and GAINS, each month', () => {
    let sim = life('jh-ca', TORONTO);
    const p = () => sim.player;
    expect(sim.execute({ kind: 'pension.ca_oas', payload: {} }).error).toBe('Old Age Security is paid from 65.');
    expect(sim.execute({ kind: 'pension.cpp', payload: {} }).error).toBe('The CPP retirement pension is paid from 60.');
    // Sixty-six, and forty-five years in Toronto after eighteen.
    p().birthInstant = sim.now - 66 * YEAR;
    const born = new Date(p().birthInstant).getUTCFullYear();
    for (let y = born + 18; y < born + 63; y += 1) { const e = yearOf(p(), y); e.acting = 30_000_00; e.byResidence = { [TORONTO]: 30_000_00 }; }
    expect(sim.execute({ kind: 'pension.cpp', payload: {} }).error).toBe('You paid nothing into the CPP.');
    // And forty-five years of CPP contributions on $30,000.
    for (let y = born + 18; y < born + 63; y += 1) canadaPensionsOf(p()).years[y] = 30_000;
    const age = (sim.now - p().birthInstant) / YEAR;
    const oas = sim.must<{ monthly: number }>({ kind: 'pension.ca_oas', payload: {} });
    const factor = canadaPensionsOf(p()).oasFactor!;
    expect(factor).toBeCloseTo(1 + 0.006 * 12, 9);
    expect(oas.monthly).toBe(Math.round(oasMonthly(p(), age) * factor * 100));
    const cpp = sim.must<{ monthly: number }>({ kind: 'pension.cpp', payload: {} });
    const cppDollars = cppMonthly(p(), age);
    expect(cpp.monthly).toBe(Math.round(cppDollars * 100));
    expect(sim.execute({ kind: 'pension.ca_oas', payload: {} }).error).toBe('You’re paid it.');
    expect(sim.execute({ kind: 'pension.cpp', payload: {} }).error).toBe('You’re paid it.');
    const claimedAt = sim.now;
    sim = reload(sim);
    sim.advanceTo(claimedAt + 61 * MS_DAY);
    const paid = memo(sim, 'Canada’s pensions, the month');
    expect(paid.map((t) => t.at - claimedAt)).toEqual([30 * MS_DAY, 60 * MS_DAY]);
    // No income last year: all of OAS, a year deferred, the CPP, and the GIS and GAINS less the CPP counted against them.
    const s = supplements(sim, p(), cppDollars);
    const month = Math.round((cppDollars + Math.max(0, oasMonthly(p(), age) * factor - oasRecovery(sim, p(), cppDollars)) + s.gis + s.gains) * 100);
    expect(paid.map((t) => into(sim, t))).toEqual([month, month]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

/**
 * What the game gets wrong, kept apart and skipped. Each case asserts what
 * should happen; each fails unskipped.
 */
describe('health, where the game is wrong', () => {
  // Found by this journey on 2026-10-06 and fixed: a monthly dental plan covered from the day it was bought, but its
  // first premium came on the 1st of the next month, so the days to it were covered and never paid for.
  it('takes a monthly dental plan’s first premium for the month it starts covering', () => {
    let sim = life('jh-dental-month');
    sim.advanceTo(dayAt(sim, 1, 10));
    const b0 = banked(sim);
    sim.must({ kind: 'health.dental', payload: { on: true } });
    expect(careQuote(sim, sim.player, 'cleaning')).toBe(0);
    expect(b0 - banked(sim)).toBe(DENTAL_PLANS.ny.premium);
    // Saved and loaded, the next month's premium once, on its 1st, and no more for January.
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    const paid = (memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).length;
    const memo = sim.universe.transactions.at(-1)!.memo;
    sim.advanceTo(dayAt(sim, 32, 10));
    expect(paid(memo)).toBe(2);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
