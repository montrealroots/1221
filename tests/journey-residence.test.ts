/**
 * The residence journey (the owner's audit of 2026-10-06): lives run through
 * the Papers screen's documents, work permission and residence abroad, by the
 * same commands those screens run, each step reading what the one before it
 * left.
 *
 * - **An American to Mexico City**: a New York license renewed in its last
 *   months, REAL ID at the renewal; the move refused until Mexico's temporary
 *   residence is granted on savings, then made. The New York license doesn't
 *   drive there and isn't exchanged; the city's theory exam and its Tipo A
 *   license earned, and it does. The residence renewed in its last 30 days and
 *   not before; settled into permanent residence; naturalized on the artistic
 *   record, not on four years alone; and the INE, refused to a foreigner,
 *   issued to the new citizen.
 * - **A Mexican graduate in New York**: OPT applied for in its window, waited
 *   on and approved, and work with it; an O-1 petitioned for once an agency
 *   represents them, decided on the record. A production in Toronto: Canada's
 *   visitor visa and the production's work permit, each applied for, waited on,
 *   and the job taken once both are in. A New York non-driver ID issued, lost,
 *   and replaced at the DMV's fee and weeks.
 * - **A Connecticut native to New York**: a standard license, not taken at the
 *   TSA's checkpoint, upgraded to REAL ID; moved to New York, the license
 *   exchanged without tests where the path's first step is refused.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance. What is set directly is said where it's set: the documents a life
 * begins with, where a step needs a known one; the years of residence that
 * settling and naturalizing ask, which a test can't play; and a career's
 * credits, earnings, agency and an offer in Toronto, which the week's draw
 * brings when it brings them. Four steps the game gets wrong are kept apart,
 * skipped, as defects: a Mexico City license that doesn't drive in Mexico City
 * beside a New York one; Mexican temporary residence renewed, and paid for,
 * after it was given up for permanent residence; a New York City license
 * renewed at the price outside the MCTD; and a second ID card issued while the
 * replacement for a lost one is in the post.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LICENSES } from '@/engine/content/licenses';
import { WORK_RULES } from '@/engine/content/workrules';
import { UNION_HEALTH } from '@/engine/content/career';
import { acceptRefusal, beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { addYears, citizenOf, citizenshipsOf, documentsOf, licenseOf, mayDrive, mayEnter, residenceRefusal, type PersonDocument } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { jobSpan, programEnd, workRefusal } from '@/engine/systems/permission';
import { MEXICAN_RESIDENCE, residenceIn } from '@/engine/systems/residence';
import { NATURALIZE } from '@/engine/systems/citizenship';
import { tsaAccepts } from '@/engine/systems/identity';

const NYC = 'us-ny-newyork' as const;
const NEW_HAVEN = 'us-ct-newhaven';
const CDMX = 'mx-cmx-mexicocity' as const;
const YEAR = 365.2425 * MS_DAY;

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** A published figure in cents, in the save's money. */
const inSave = (sim: Simulation, cents: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur)!; };
/** What the life's own accounts paid out for papers since a point in the ledger. */
const papersSince = (sim: Simulation, from: number) => -sim.universe.transactions.slice(from).filter((t) => t.category === 'documents').flatMap((t) => t.postings).filter((q) => sim.universe.accounts[q.accountId]?.ownerId === sim.player.id && !sim.universe.accounts[q.accountId]?.nominal).reduce((s, q) => s + q.amount, 0);
const walk = (sim: Simulation, to: number) => { for (let guard = 0; sim.now < to && guard < 20_000; guard += 1) sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** Lives to a moment as a person does, asleep from eleven each night for eight hours: a step at the DMV is kept awake. */
function liveTo(sim: Simulation, target: number): void {
  for (let guard = 0; sim.now < target && guard < 10_000; guard += 1) {
    const zone = sim.universe.currentZone;
    const p = zonedParts(sim.now, zone);
    let night = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, zone);
    if (night <= sim.now) night = instantFromZoned({ ...normalDate(p.year, p.month, p.day + 1), hour: 23 }, zone);
    if (night >= target) { sim.advanceBy(target - sim.now); return; }
    sim.advanceBy(night - sim.now);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
  }
}
/** Takes a license step to done, as the Papers screen books it, a failed test taken again after its wait; what each booking cost. */
function take(sim: Simulation, step: string): number[] {
  const fees: number[] = [];
  for (let tries = 0; tries < 20; tries += 1) {
    const a = sim.execute<{ at: number[]; fee: number }>({ kind: 'documents.license_step', payload: { step } });
    if (!a.ok) {
      if (/^Again from/.test(a.error ?? '')) { liveTo(sim, sim.now + 2 * MS_DAY); continue; }
      throw new Error(`${step}: ${a.error}`);
    }
    fees.push(a.value!.fee);
    liveTo(sim, a.value!.at.at(-1)! + 3 * MS_HOUR);
    if (sim.player.licensing!.done[step] !== undefined) return fees;
  }
  throw new Error(`${step} never passed`);
}

describe('residence: an American makes a home in Mexico City', () => {
  it('renews the New York license, moves on temporary residence, earns a Mexico City license, renews, settles, naturalizes, and is issued the INE', () => {
    let sim = quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-mx');
    const p = () => sim.player;
    // The papers a New Yorker begins with, made known: a passport, and a New York license in its last four months.
    sim.player.documents = [
      { id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: sim.now + 8 * YEAR },
      { id: 'lic', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: sim.now - 8 * YEAR + 120 * MS_DAY, expiresAt: sim.now + 120 * MS_DAY, realId: false },
    ];

    // The license renewed: eight years from its old end, not from today, and REAL ID at the same fee.
    expect(sim.execute({ kind: 'documents.real_id', payload: {} }).error).toBe('Connecticut upgrades its own license before renewal; New York and California make it REAL ID at the renewal.');
    expect(tsaAccepts(p(), sim.now)?.kind).toBe('passport');
    let b0 = banked(sim);
    const renewed = sim.must<{ expiresAt: number; fee: number }>({ kind: 'documents.renew_license', payload: {} });
    expect(b0 - banked(sim)).toBe(renewed.fee);
    expect(renewed.fee).toBe(inSave(sim, Math.round((LICENSES['us-ny']!.renewalFee! + 16) * 100), 'USD'));
    expect(renewed.expiresAt).toBe(addYears(sim.now + 120 * MS_DAY, 8));
    const nyLicense = licenseOf(p(), sim.now)!;
    expect(nyLicense).toMatchObject({ issuer: 'us-ny', realId: true, expiresAt: renewed.expiresAt });
    expect(documentsOf(p()).find((d) => d.id === 'lic')!.status).toBe('cancelled');
    expect(sim.execute({ kind: 'documents.renew_license', payload: {} }).error).toBe('A license renews within 6 months of running out.');

    // The move refused without the right to live there, and nothing paid for the flight.
    const txns = sim.universe.transactions.length;
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: CDMX, kind: 'shared' } }).error).toBe('Living in Mexico needs permission to live there, which you don’t hold: see Papers for a route to residence, where there is one.');
    expect(sim.universe.transactions.length).toBe(txns);

    // Temporary residence on savings past 11,460 UMA: the card's year and the consulate's visa, paid once.
    b0 = banked(sim);
    const granted = sim.must<{ paid: number }>({ kind: 'documents.residence', payload: { country: 'MX' } });
    expect(granted.paid).toBe(inSave(sim, Math.round(MEXICAN_RESIDENCE.temporary * 100), 'MXN') + inSave(sim, MEXICAN_RESIDENCE.consularVisaUsd * 100, 'USD'));
    expect(b0 - banked(sim)).toBe(granted.paid);
    expect(sim.execute({ kind: 'documents.residence', payload: { country: 'MX' } }).error).toBe('You hold residence there.');
    const card = residenceIn(p(), 'MX', sim.now)!;
    expect(card).toMatchObject({ route: 'mx-temporary', name: 'Residente Temporal', kind: 'visa' });
    expect(card.expiresAt).toBe(sim.now + YEAR);
    expect(residenceRefusal(p(), CDMX, sim.now)).toBeUndefined();
    // Living there is what it grants, not working: an actor's job in Mexico is refused on it.
    expect(workRefusal(p(), CDMX, sim.now, sim.now + MS_DAY)).toBeDefined();
    sim.must({ kind: 'career.relocate', payload: { cityId: CDMX, kind: 'shared' } });
    expect(p().home?.cityId).toBe(CDMX);

    // The New York license doesn't drive in Mexico City, isn't exchanged there, and renews only for someone living in America.
    expect(mayDrive(p(), CDMX, sim.now).ok).toBe(false);
    expect(sim.execute({ kind: 'documents.exchange_license', payload: {} }).error).toMatch(/^SLATE couldn’t confirm that .* exchanges a license from elsewhere: the path is the way\.$/);
    // Mexico City's own: the theory exam, free, then the Tipo A license at the office's fee.
    expect(sim.execute({ kind: 'documents.license_step', payload: { step: 'license' } }).error).toBe('Theory Exam first.');
    const exam = take(sim, 'exam');
    expect(exam.every((f) => f === 0)).toBe(true);
    // The days at the office are lived, and spend on their own; what the papers took is read from the documents' postings.
    const t0 = sim.universe.transactions.length;
    const office = take(sim, 'license');
    expect(office).toEqual([inSave(sim, 1_142_00, 'MXN')]);
    expect(papersSince(sim, t0)).toBe(office[0]);
    expect(documentsOf(p()).filter((d) => d.kind === 'license' && d.issuer === 'mx-cmx' && d.status === 'valid')).toHaveLength(1);
    const cdmxLicense = documentsOf(p()).find((d) => d.kind === 'license' && d.issuer === 'mx-cmx')!;
    expect(cdmxLicense).toMatchObject({ name: 'Licencia Tipo A', stage: 'full' });
    expect(cdmxLicense.expiresAt).toBe(addYears(cdmxLicense.issuedAt!, 3));
    // Whether it lets them drive there, beside the New York one, is kept apart below, as a defect.
    expect(sim.execute({ kind: 'documents.license_step', payload: { step: 'exam' } }).error).toBe(`You hold ${LICENSES['mx-cmx']!.name} already.`);
    // The New York one is still theirs, and kept: Mexico doesn't take it.
    expect(documentsOf(p()).find((d) => d.id === nyLicense.id)!.status).toBe('valid');

    // Renewed in its last 30 days, not before; saved and loaded on the way.
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).error).toBe('It’s renewed within its last 30 days.');
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'GB' } }).error).toBe('Only Mexican temporary residence is renewed, a year at a time.');
    walk(sim, card.expiresAt! - 40 * MS_DAY);
    sim = reload(sim);
    const kept = residenceIn(p(), 'MX', sim.now)!;
    expect(kept.expiresAt).toBe(card.expiresAt);
    expect(breaches(sim.universe)).toEqual([]);
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).error).toBe('It’s renewed within its last 30 days.');
    walk(sim, card.expiresAt! - 20 * MS_DAY);
    // Unrenewed, it would end on its day.
    expect(residenceIn(p(), 'MX', card.expiresAt! + MS_DAY)).toBeUndefined();
    b0 = banked(sim);
    const renewal = sim.must<{ paid: number }>({ kind: 'documents.renew_residence', payload: { country: 'MX' } });
    expect(renewal.paid).toBe(inSave(sim, Math.round(MEXICAN_RESIDENCE.temporary * 100), 'MXN'));
    expect(b0 - banked(sim)).toBe(renewal.paid);
    expect(kept.expiresAt).toBe(card.expiresAt! + YEAR);
    expect(residenceIn(p(), 'MX', card.expiresAt! + MS_DAY)?.id).toBe(kept.id);
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).error).toBe('It’s renewed within its last 30 days.');

    // Settling asks four years' temporary; the three more aren't played, and the card's first day is put four years back.
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'MX' } }).error).toBe('Permanent residence comes after four years’ temporary.');
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'GB' } }).error).toBe('You hold no residence there to settle from.');
    kept.issuedAt = sim.now - MEXICAN_RESIDENCE.permanentAfter * YEAR;
    b0 = banked(sim);
    const settled = sim.must<{ paid: number }>({ kind: 'documents.settle', payload: { country: 'MX' } });
    expect(settled.paid).toBe(inSave(sim, Math.round(MEXICAN_RESIDENCE.permanent * 100), 'MXN'));
    expect(b0 - banked(sim)).toBe(settled.paid);
    expect(kept.status).toBe('cancelled');
    const permanent = residenceIn(p(), 'MX', sim.now)!;
    expect(permanent).toMatchObject({ route: 'mx-permanent', name: 'Residente Permanente' });
    expect(permanent.expiresAt).toBeUndefined();
    expect(residenceIn(p(), 'MX', sim.now + 30 * YEAR)?.id).toBe(permanent.id);
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'MX' } }).error).toBe('You’re settled there.');

    // Naturalizing: four years' residence isn't five; the artistic record makes it two. The record is pushed, as the week's draw would bring it.
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('The Credencial Para Votar (INE) is for a citizen.');
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).error).toBe('It asks five years’ residence in Mexico, or two for outstanding artistic work.');
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'US' } }).error).toBe('You’re a citizen there.');
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'CA' } }).error).toBe('SLATE keeps naturalizing in Britain, Mexico and the United States, where a route to residence reaches.');
    careerOf(p()).credits.push(...['broadway', 'lort-b', 'guest-hour'].map((roleId) => ({ roleId, year: 2026, cityId: NYC })));
    b0 = banked(sim);
    const applied = sim.must<{ paid: number; readyAt: number }>({ kind: 'documents.naturalize', payload: { country: 'MX' } });
    expect(applied.paid).toBe(inSave(sim, Math.round(NATURALIZE.MX.fee * 100), 'MXN'));
    expect(b0 - banked(sim)).toBe(applied.paid);
    expect(applied.readyAt).toBe(sim.now + NATURALIZE.MX.days * MS_DAY);
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).error).toBe('An application is being decided.');

    // Saved and loaded mid-wait: the application and its day survive; not a citizen until it's decided.
    walk(sim, applied.readyAt - MS_DAY);
    sim = reload(sim);
    expect(p().naturalizing).toEqual({ iso: 'MX', readyAt: applied.readyAt });
    expect(citizenOf(p(), 'MX')).toBe(false);
    expect(breaches(sim.universe)).toEqual([]);
    walk(sim, applied.readyAt + MS_HOUR);
    expect(citizenOf(p(), 'MX')).toBe(true);
    expect(citizenshipsOf(p())).toEqual(['US', 'MX']);
    expect(p().naturalizing).toBeUndefined();
    expect(sim.universe.notifications.filter((n) => n.title === 'A Citizen')).toHaveLength(1);
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).error).toBe('You’re a citizen there.');

    // The INE, a citizen's: free, issued, and not twice.
    b0 = banked(sim);
    const ine = sim.must<{ fee: number; expiresAt?: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(ine.fee).toBe(0);
    expect(banked(sim)).toBe(b0);
    expect(documentsOf(p()).find((d) => d.kind === 'idcard')).toMatchObject({ issuer: 'mx-cmx', status: 'valid', name: 'Credencial Para Votar (INE)' });
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('You hold one in force.');
    // Paid once each.
    const fees = sim.universe.transactions.filter((t) => t.category === 'documents');
    expect(fees.filter((t) => t.memo === 'Mexican temporary residence, the card and the visa')).toHaveLength(1);
    expect(fees.filter((t) => t.memo === 'Mexican temporary residence, renewed')).toHaveLength(1);
    expect(fees.filter((t) => t.memo === 'Mexican permanent residence')).toHaveLength(1);
    expect(fees.filter((t) => t.memo === 'Naturalization, the application')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  // Found by this journey on 2026-10-06 and fixed: a Mexico City license didn't let its holder drive in Mexico City
  // beside a New York one, because `mayDrive` read the first license in force, not the one issued where they are.
  it('lets a Mexico City license drive in Mexico City beside a New York one', () => {
    const sim = quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-drive');
    sim.player.documents = [
      { id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: sim.now + 8 * YEAR },
      { id: 'lic', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: sim.now + 6 * YEAR },
    ];
    sim.must({ kind: 'documents.residence', payload: { country: 'MX' } });
    sim.must({ kind: 'career.relocate', payload: { cityId: CDMX, kind: 'shared' } });
    take(sim, 'exam');
    take(sim, 'license');
    expect(documentsOf(sim.player).some((d) => d.kind === 'license' && d.issuer === 'mx-cmx' && d.status === 'valid')).toBe(true);
    expect(mayDrive(loadSave(deserialise(serialise(sim.universe)) as never).player, CDMX, sim.now)).toEqual({ ok: true });
    // In New York, the New York one is read.
    expect(licenseOf(sim.player, sim.now, 'car', 'us-ny')?.issuer).toBe('us-ny');
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  // Found by this journey on 2026-10-06 and fixed: temporary residence given up for permanent residence was renewed
  // and paid for, because the renewal read a canceled card.
  it('doesn’t renew temporary residence given up for permanent residence', () => {
    const sim = quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-settled');
    sim.must({ kind: 'documents.residence', payload: { country: 'MX' } });
    const card = residenceIn(sim.player, 'MX', sim.now)!;
    walk(sim, card.expiresAt! - 20 * MS_DAY);
    // Four years' temporary isn't played: its first day is put back.
    card.issuedAt = sim.now - MEXICAN_RESIDENCE.permanentAfter * YEAR;
    sim.must({ kind: 'documents.settle', payload: { country: 'MX' } });
    const b0 = banked(sim);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(again.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).error).toBe('Only Mexican temporary residence is renewed, a year at a time.');
    expect(banked(again)).toBe(b0);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  // Found by this journey on 2026-10-06 and fixed: a New York City license renewed at $64.50, the price outside the
  // MCTD; it's $80.50 for someone living inside it, the MCTD's $1 a half-year on eight years (`district`).
  it('renews a New York City license at the MCTD’s price', () => {
    const sim = quickSave({ startLocationId: NYC, homeRegionId: NYC, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-mctd');
    sim.player.documents = [{ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: sim.now - 8 * YEAR + 120 * MS_DAY, expiresAt: sim.now + 120 * MS_DAY }];
    expect(sim.must<{ fee: number }>({ kind: 'documents.renew_license', payload: {} }).fee).toBe(inSave(sim, 80_50, 'USD'));
    // Living outside it, in Hudson, the price outside it.
    const hudson = quickSave({ startLocationId: 'us-ny-hudson', homeRegionId: 'us-ny-hudson', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-mctd-out');
    hudson.player.documents = [{ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: hudson.now - 8 * YEAR + 120 * MS_DAY, expiresAt: hudson.now + 120 * MS_DAY }];
    expect(loadSave(deserialise(serialise(hudson.universe)) as never).must<{ fee: number }>({ kind: 'documents.renew_license', payload: {} }).fee).toBe(inSave(hudson, 64_50, 'USD'));
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('residence: a Mexican graduate works in New York and Toronto', () => {
  it('applies for OPT in its window, petitions for an O-1, takes a Toronto job on a visa and a permit, and replaces a lost ID card', () => {
    let sim = quickSave({ startLocationId: NYC, homeRegionId: CDMX, livesWhereBorn: false, wealth: 'wealthy' }, 'journey-residence-grad');
    const p = () => sim.player;
    beginCareer(sim, p());
    // A life begins at Yale, its degree years off; this one's program ends in a hundred days, its F-1 with the 60 days' grace after.
    const end = sim.now + 100 * MS_DAY;
    p().documents = [
      { id: 'pp', kind: 'passport', issuer: 'MX', name: 'Pasaporte', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 9 * YEAR },
      { id: 'f1', kind: 'visa', issuer: 'US', name: 'F-1 Student Visa', number: 'F1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: end + 60 * MS_DAY, destination: 'US', passportId: 'pp' },
    ];
    if (p().school) p().school!.standing = 'graduated';
    expect(programEnd(p())).toBe(end);
    expect(sim.execute({ kind: 'documents.apply_opt', payload: {} }).error).toMatch(/^It opens .*, 90 days before the program ends\.$/);
    expect(workRefusal(p(), NYC, end + MS_DAY, end + 2 * MS_DAY)).toBe('Work in the United States needs permission: apply for OPT, which runs twelve months from your degree.');

    // OPT: applied for in the window, $470, ninety days; not twice; no work while it's decided.
    walk(sim, end - 89 * MS_DAY);
    let b0 = banked(sim);
    const opt = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: {} });
    expect(opt.fee).toBe(inSave(sim, WORK_RULES.opt.fee * 100, 'USD'));
    expect(b0 - banked(sim)).toBe(opt.fee);
    expect(opt.readyAt).toBe(sim.now + WORK_RULES.opt.standardDays * MS_DAY);
    expect(sim.execute({ kind: 'documents.apply_opt', payload: {} }).error).toBe('You’ve applied for OPT already.');
    expect(workRefusal(p(), NYC, sim.now, sim.now + MS_DAY)).toBe('Your application is being decided: no work until it’s approved.');
    // Represented by an agency, the days count as work, a performer in business; the signing is the week's draw, set here.
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toBe('A US employer or agent petitions for an O-1, not the actor: sign with an agency first.');
    careerOf(p()).agencyId = 'gersh';
    walk(sim, opt.readyAt - MS_HOUR);
    const optDoc = documentsOf(p()).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
    expect(optDoc.status).toBe('pending');
    walk(sim, opt.readyAt + MS_HOUR);
    expect(optDoc.status).toBe('valid');
    expect(optDoc.issuedAt).toBe(Math.max(end, opt.readyAt));
    expect(optDoc.expiresAt).toBe(addYears(optDoc.issuedAt!, 1));
    expect(sim.universe.notifications.some((n) => n.title === 'OPT Approved')).toBe(true);
    expect(workRefusal(p(), NYC, sim.now, sim.now + 30 * MS_DAY)).toBeUndefined();
    expect(workRefusal(p(), NYC, optDoc.expiresAt! + MS_DAY, optDoc.expiresAt! + 2 * MS_DAY)).toMatch(/O-1/);

    // The O-1, on three kinds of evidence: a lead, a critical role, and a year's pay at SAG-AFTRA's threshold, pushed as the draw would bring them.
    careerOf(p()).credits.push({ roleId: 'series-hour', year: 2026, cityId: NYC }, { roleId: 'guest-hour', year: 2026, cityId: NYC });
    earningsOf(p()).years['2026'] = { ...(earningsOf(p()).years['2026'] ?? {}), acting: Math.max(...UNION_HEALTH.sagThreshold.map(([, amount]) => amount)) } as never;
    b0 = banked(sim);
    const o1 = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.petition_o1', payload: {} });
    const r = WORK_RULES.o1;
    expect(o1.fee).toBe(inSave(sim, (r.fee + r.asylumFee + r.opinionFee) * 100, 'USD'));
    expect(b0 - banked(sim)).toBe(o1.fee);
    expect(o1.readyAt).toBe(sim.now + (r.opinionDays + r.standardDays) * MS_DAY);
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toBe('A petition is being decided.');
    sim = reload(sim);
    expect(documentsOf(p()).find((d) => d.kind === 'permit' && d.name.startsWith('O-1'))).toMatchObject({ status: 'pending', readyAt: o1.readyAt });
    expect(breaches(sim.universe)).toEqual([]);
    walk(sim, o1.readyAt + MS_HOUR);
    const o1Doc = documentsOf(p()).find((d) => d.kind === 'permit' && d.name.startsWith('O-1'))!;
    expect(o1Doc.status).toBe('valid');
    expect(o1Doc.expiresAt).toBe(addYears(o1Doc.issuedAt!, r.years));
    expect(workRefusal(p(), NYC, sim.now, sim.now + 2 * YEAR)).toBeUndefined();
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toMatch(/^Your O-1 runs to .*; it’s extended in its last six months\.$/);

    // A production in Toronto, offered: Canada's visitor visa and the production's permit, both needed.
    const span = { starts: sim.now + 60 * MS_DAY };
    const toronto: Booking = { id: 'tor', roleId: 'costar', cityId: NYC, location: 'ca-on-toronto', starts: span.starts, units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 50 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(p()).bookings.push(toronto);
    expect(mayEnter(p(), 'CA', sim.now).ok).toBe(false);
    expect(acceptRefusal(sim, p(), toronto)).toBe('A visa for Canada: Visitor Visa (Canada), applied for on Papers.');
    expect(sim.execute({ kind: 'documents.apply_visa', payload: { destination: 'GB' } }).error).toBe('Your citizenship doesn’t need a visa there, or SLATE doesn’t have that one.');
    b0 = banked(sim);
    const visa = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_visa', payload: { destination: 'CA' } });
    expect(visa.fee).toBe(inSave(sim, 185_00, 'CAD'));
    // Its 18 days run from the biometrics, at a visa application center where they live two weeks on (from 2026-10-06,
    // `systems/papervisits.ts`; until then from the day it was applied for, with no biometrics given).
    const trv = documentsOf(p()).find((d) => d.kind === 'visa' && d.destination === 'CA')!;
    expect(trv.visit).toMatchObject({ rule: 'ca-biometrics', cityId: NYC });
    expect(trv.visit!.at - sim.now).toBeGreaterThanOrEqual(13 * MS_DAY);
    expect(visa.readyAt).toBe(trv.visit!.at + 18 * MS_DAY);
    expect(sim.execute({ kind: 'documents.apply_visa', payload: { destination: 'CA' } }).error).toBe('One is being decided.');
    expect(sim.execute({ kind: 'documents.apply_work_permit', payload: { bookingId: 'nope' } }).error).toBe('That isn’t a job you’ve been offered or taken.');
    const permit = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_work_permit', payload: { bookingId: 'tor' } });
    expect(permit.fee).toBe(inSave(sim, (WORK_RULES.caC14.fee + WORK_RULES.caC14.biometricsFee) * 100, 'CAD'));
    expect(permit.readyAt).toBe(sim.now + WORK_RULES.caC14.standardDays * MS_DAY);
    expect(b0 - banked(sim)).toBe(visa.fee + permit.fee);
    expect(sim.execute({ kind: 'documents.apply_work_permit', payload: { bookingId: 'tor' } }).error).toBe('You’ve applied for it.');
    // From 2026-10-06 the permit, its biometrics given the day after the visa's, comes first at its 30 days, and the
    // visa its 18 days after its own biometrics; until then the visa came first.
    walk(sim, permit.readyAt + MS_HOUR);
    const c14 = documentsOf(p()).find((d) => d.kind === 'permit' && d.destination === 'CA')!;
    expect(c14).toMatchObject({ status: 'valid', bookingId: 'tor', expiresAt: jobSpan(toronto).to + 2 * MS_DAY });
    expect(c14.visit!.keptAt).toBeLessThan(permit.readyAt);
    expect(acceptRefusal(sim, p(), toronto)).toMatch(/A visa for Canada/);
    walk(sim, visa.readyAt + MS_HOUR);
    expect(mayEnter(p(), 'CA', sim.now).ok).toBe(true);
    expect(sim.execute({ kind: 'documents.apply_visa', payload: { destination: 'CA' } }).error).toBe('You hold one in force already.');
    expect(acceptRefusal(sim, p(), toronto)).toBeUndefined();
    sim.must({ kind: 'career.accept', payload: { bookingId: 'tor' } });
    expect(careerOf(p()).bookings.find((b) => b.id === 'tor')!.status).toBe('accepted');

    // A New York non-driver ID, $14, REAL ID, for eight years; lost, replaced at $8, in the post three weeks.
    b0 = banked(sim);
    const id = sim.must<{ fee: number; expiresAt?: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(id.fee).toBe(inSave(sim, 14_00, 'USD'));
    expect(b0 - banked(sim)).toBe(id.fee);
    expect(id.expiresAt).toBe(addYears(sim.now, 8));
    const card = documentsOf(p()).find((d) => d.kind === 'idcard')!;
    expect(card).toMatchObject({ issuer: 'us-ny', realId: true, status: 'valid' });
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('You hold one in force.');
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } }).error).toBe('It isn’t lost: report it lost first.');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: 'pp' } }).error).toBe('That isn’t an ID card of yours.');
    b0 = banked(sim);
    const replaced = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    expect(replaced.fee).toBe(inSave(sim, 8_00, 'USD'));
    expect(b0 - banked(sim)).toBe(replaced.fee);
    expect(replaced.readyAt).toBe(sim.now + 21 * MS_DAY);
    expect(card.status).toBe('cancelled');
    expect(sim.execute({ kind: 'documents.replace_idcard', payload: { documentId: card.id } }).error).toBe('It isn’t lost: report it lost first.');
    const coming = documentsOf(p()).find((d) => d.kind === 'idcard' && d.status === 'pending')!;
    expect(coming.number).not.toBe(card.number);
    expect(coming.expiresAt).toBe(card.expiresAt);
    sim = reload(sim);
    expect(documentsOf(p()).find((d) => d.id === coming.id)!.status).toBe('pending');
    walk(sim, replaced.readyAt - MS_HOUR);
    expect(documentsOf(p()).some((d) => d.kind === 'idcard' && d.status === 'valid')).toBe(false);
    walk(sim, replaced.readyAt + MS_HOUR);
    expect(documentsOf(p()).find((d) => d.id === coming.id)).toMatchObject({ status: 'valid', issuedAt: replaced.readyAt });
    expect(documentsOf(p()).filter((d) => d.kind === 'idcard' && d.status === 'valid')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  // Found by this journey on 2026-10-06 and fixed: a second ID card was issued and charged for while a lost one's
  // replacement was in the post, and they held two when it came.
  it('doesn’t issue a second ID card while the replacement is in the post', () => {
    let sim = quickSave({ startLocationId: NYC, homeRegionId: CDMX, livesWhereBorn: false, wealth: 'wealthy' }, 'journey-residence-idcard');
    sim.player.documents = [];
    sim.must({ kind: 'documents.apply_idcard', payload: {} });
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    const replaced = sim.must<{ readyAt: number }>({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    const b0 = banked(sim);
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('One is on its way.');
    expect(banked(sim)).toBe(b0);
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    walk(sim, replaced.readyAt + MS_HOUR);
    expect(documentsOf(sim.player).filter((d) => d.kind === 'idcard' && d.status === 'valid')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('residence: a Connecticut native moves to New York', () => {
  it('upgrades a standard license to REAL ID, moves, and exchanges it without the tests', () => {
    let sim = quickSave({ startLocationId: NEW_HAVEN, homeRegionId: NEW_HAVEN, livesWhereBorn: true, wealth: 'wealthy' }, 'journey-residence-ct');
    const p = () => sim.player;
    // A standard Connecticut license and no passport, as about a quarter of Connecticut's licenses and half of Americans are (`content/identity.ts`, `STARTING`).
    p().documents = [{ id: 'ct', kind: 'license', issuer: 'us-ct', name: 'Class D Operator’s License', number: 'C1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: sim.now + 4 * YEAR, realId: false } satisfies PersonDocument];
    expect(tsaAccepts(p(), sim.now)).toBeUndefined();
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('You hold a license here. It serves as your ID.');
    expect(sim.execute({ kind: 'documents.renew_license', payload: {} }).error).toBe('A license renews within 6 months of running out.');

    // The upgrade: the duplicate's $30, and the checkpoint takes it.
    let b0 = banked(sim);
    const upgrade = sim.must<{ fee: number }>({ kind: 'documents.real_id', payload: {} });
    expect(upgrade.fee).toBe(inSave(sim, 30_00, 'USD'));
    expect(b0 - banked(sim)).toBe(upgrade.fee);
    expect(tsaAccepts(p(), sim.now)?.id).toBe('ct');
    expect(sim.execute({ kind: 'documents.real_id', payload: {} }).error).toBe('It’s REAL ID already.');
    sim = reload(sim);
    expect(documentsOf(p()).find((d) => d.id === 'ct')!.realId).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);

    // To New York: the Connecticut license drives there, and the path's first step is refused for the exchange.
    sim.must({ kind: 'career.relocate', payload: { cityId: NYC, kind: 'shared' } });
    expect(p().home?.cityId).toBe(NYC);
    expect(mayDrive(p(), NYC, sim.now).ok).toBe(true);
    expect(sim.execute({ kind: 'documents.license_step', payload: { step: 'permit' } }).error).toMatch(/exchanges here without the tests: Exchange It\.$/);
    b0 = banked(sim);
    const swapped = sim.must<{ expiresAt: number; fee: number }>({ kind: 'documents.exchange_license', payload: {} });
    // The exchange’s fee and the MCTD’s $1 a half-year on its eight years: they live in New York City.
    expect(swapped.fee).toBe(inSave(sim, 80_25, 'USD'));
    expect(b0 - banked(sim)).toBe(swapped.fee);
    expect(swapped.expiresAt).toBe(addYears(sim.now, 8));
    expect(documentsOf(p()).find((d) => d.id === 'ct')!.status).toBe('cancelled');
    const ny = licenseOf(p(), sim.now)!;
    expect(ny).toMatchObject({ issuer: 'us-ny', stage: 'full', realId: true, expiresAt: swapped.expiresAt });
    expect(tsaAccepts(p(), sim.now)?.id).toBe(ny.id);
    expect(sim.execute({ kind: 'documents.exchange_license', payload: {} }).error).toBe('You hold this license already.');
    expect(sim.execute({ kind: 'documents.license_step', payload: { step: 'permit' } }).error).toBe(`You hold ${LICENSES['us-ny']!.name} already.`);
    expect(sim.execute({ kind: 'documents.real_id', payload: {} }).error).toBe('Connecticut upgrades its own license before renewal; New York and California make it REAL ID at the renewal.');
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('You hold a license here. It serves as your ID.');
    expect(mayDrive(p(), NYC, sim.now).ok).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});
