/**
 * The papers in your wallet, and the things in life that ask for them.
 *
 * Four promises. Every country in the geography issues a passport and a
 * license from a real authority, carries its metropole's, or says why not.
 * A fresh life carries what it would carry: a passport from the real office
 * and a license from the real state office. A border wants a valid passport
 * and refuses before any money moves; the wheel wants a license. And the
 * money is safe: a renewal pays once, arrives once, and a retry cannot pay
 * twice.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, addDays } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { LICENSE_EXCHANGE, NO_PASSPORT, licenseAuthorityFor, passportAuthorityFor } from '@/engine/content/documents';
import {
  EMERGENCY_DOCUMENT_FEE, NO_LICENSE, ensurePapers, exchangeOffer, licenseCheck, passportCheck, passportStatus, statusOf,
} from '@/engine/systems/documents';
import { documentsFor } from '@/engine/systems/journey';
import { driveableVehicle } from '@/engine/systems/places';
import { placesIn } from '@/engine/content/places';

beforeAll(async () => { await loadAllSections(); });

function aLife(seed = 'papers'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 200_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}
function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown>): string | undefined {
  const result = sim.execute({ kind, payload });
  return result.ok ? undefined : result.error;
}
function cityIn(countryId: string, name?: string): string {
  const found = CITIES.all().find((c) => c.countryId === countryId && (!name || c.name === name));
  expect(found, `no city ${name ?? ''} in ${countryId}`).toBeDefined();
  return found!.id;
}
const funds = (sim: Simulation) => sim.ledger.availableFunds(sim.player.primaryAccountId!);
const memos = (sim: Simulation, pattern: RegExp) => sim.ledger.history(sim.player.primaryAccountId!, 200).filter((t) => pattern.test(t.memo));
const decisions = (sim: Simulation, category: string) => Object.values(sim.universe.decisions).filter((d) => d.category === category && !d.resolvedAt && !d.dismissedAt);

describe('every country issues papers from a real authority, or says why not', () => {
  it('accounts for all of them', () => {
    for (const c of COUNTRIES.all()) {
      const passport = passportAuthorityFor(c.id);
      const license = licenseAuthorityFor(c.id);
      if (NO_PASSPORT[c.id]) { expect(passport, c.id).toBeUndefined(); continue; }
      expect(passport, `${c.id} ${c.name} has no passport authority`).toBeDefined();
      expect(passport!.authority.validityYears, c.id).toBeGreaterThan(0);
      expect(passport!.authority.fee, c.id).toBeGreaterThan(0);
      expect(passport!.authority.fee, `${c.id} passport fee looks like local currency`).toBeLessThan(600_00);
      expect(license, `${c.id} ${c.name} has no license authority`).toBeDefined();
      expect(license!.authority.tests, c.id).toContain('road');
      expect(license!.authority.fee, `${c.id} license fee looks like local currency`).toBeLessThan(4_000_00);
    }
  });

  it('a territory carries its metropole’s passport, and a state its own office', () => {
    expect(passportAuthorityFor('bm')?.issuerId).toBe('uk');
    expect(passportAuthorityFor('pr')?.authority.authority).toBe('U.S. Department of State');
    expect(licenseAuthorityFor('us', 'us-ny')?.office).toBe('New York DMV');
    expect(licenseAuthorityFor('ca', 'ca-10')?.office).toBe('SAAQ');
    expect(licenseAuthorityFor('au', 'au-07')?.office).toBe('VicRoads');
    expect(licenseAuthorityFor('fr')?.office).toBe('Agence nationale des titres sécurisés');
    // Britain swaps an Australian license; America swaps nobody's without a test.
    expect(LICENSE_EXCHANGE['uk']).toContain('au');
    expect(LICENSE_EXCHANGE['us']).toEqual([]);
  });
});

describe('a fresh life carries what it would carry', () => {
  it('a passport from the real office and a license from the real state office, both valid', () => {
    const sim = aLife();
    const papers = ensurePapers(sim, sim.player);
    expect(papers.passport?.authority).toBe('U.S. Department of State');
    expect(papers.passport?.issuerId).toBe('us');
    expect(statusOf(sim, papers.passport)).toBe('valid');
    expect(papers.passport!.expiresAt).toBeGreaterThan(sim.now);
    expect(papers.license?.authority).toBe('California DMV');
    expect(papers.license?.regionId).toBe('us-ca');
    expect(statusOf(sim, papers.license)).toBe('valid');
    expect(licenseCheck(sim, sim.player).ok).toBe(true);
    // Issued once: asking again changes nothing.
    expect(ensurePapers(sim, sim.player)).toBe(papers);
  });

  it('somebody born elsewhere carries that country’s passport, and a second one when naturalised', () => {
    const sim = quickSave({ citizenshipId: 'ng', secondCitizenshipId: 'uk' }, 'papers-two');
    const papers = ensurePapers(sim, sim.player);
    expect(papers.passport?.authority).toBe('Nigeria Immigration Service');
    expect(papers.secondPassport?.authority).toBe('HM Passport Office');
  });
});

describe('a border wants a passport', () => {
  it('a domestic flight needs none; a border refuses an expired one before any money moves', () => {
    const sim = aLife('papers-border');
    const chicago = cityIn('us', 'Chicago');
    const london = cityIn('uk', 'London');
    const departAt = sim.now + 10 * MS_DAY;
    sim.player.documents!.passport!.expiresAt = sim.now - MS_DAY;
    const before = funds(sim);
    expect(refusal(sim, 'travel.book_flight', { toCityId: london, departAt, cabin: 'economy' })).toMatch(/passport ran out/);
    expect(funds(sim)).toBe(before);
    expect(passportStatus(sim, sim.player, 'uk').ok).toBe(false);
    // Home is different: the desk wants a photo card and a boarding pass.
    const domestic = must<{ bookingId: string; documentNote?: string }>(sim, 'travel.book_flight', { toCityId: chicago, departAt, cabin: 'economy' });
    expect(domestic.documentNote).toBeUndefined();
    expect(documentsFor(sim, sim.universe.flightBookings[domestic.bookingId]!).ok).toBe(true);
  });

  it('warns under six months and never refuses for it; the warning rides on the packing note', () => {
    const sim = aLife('papers-six');
    const london = cityIn('uk', 'London');
    sim.player.documents!.passport!.expiresAt = sim.now + 100 * MS_DAY;
    const check = passportCheck(sim, sim.player, 'uk');
    expect(check.ok).toBe(true);
    expect(check.warning).toMatch(/100 days left/);
    const booked = must<{ bookingId: string; documentNote?: string }>(sim, 'travel.book_flight', { toCityId: london, departAt: sim.now + 10 * MS_DAY, cabin: 'economy' });
    expect(booked.documentNote).toMatch(/six months/);
    const papers = documentsFor(sim, sim.universe.flightBookings[booked.bookingId]!);
    expect(papers.ok).toBe(true);
    expect(papers.note).toMatch(/six months/);
    expect(sim.universe.notifications.some((n) => n.title === 'Check Your Passport Before You Go')).toBe(true);
  });

  it('the trip refuses as one thing on a dead passport, so nothing is charged', () => {
    const sim = aLife('papers-trip');
    sim.income(sim.player.primaryAccountId!, 900_000_00, 'Test funding', 'other');
    const london = cityIn('uk', 'London');
    sim.player.documents!.passport!.status = 'lost';
    const before = funds(sim);
    expect(refusal(sim, 'travel.book_trip', { toCityId: london, departAt: sim.now + 10 * MS_DAY, nights: 3, cabin: 'economy', stay: { kind: 'hotel', roomClass: 'standard' } })).toMatch(/reported lost/);
    expect(funds(sim)).toBe(before);
    expect(Object.keys(sim.universe.trips ?? {}).length).toBe(0);
  });

  it('lost abroad: the consulate issues an emergency document that gets you home and nowhere else', () => {
    const sim = aLife('papers-lost');
    const london = cityIn('uk', 'London');
    const paris = cityIn('fr', 'Paris');
    const chicago = cityIn('us', 'Chicago');
    sim.player.currentLocationId = london;
    sim.player.currentPlaceId = undefined;
    const before = funds(sim);
    const lost = must<{ emergency: boolean; fee: number; note: string }>(sim, 'doc.report_lost', { kind: 'passport' });
    expect(lost.emergency).toBe(true);
    expect(lost.fee).toBe(EMERGENCY_DOCUMENT_FEE);
    expect(funds(sim)).toBe(before - EMERGENCY_DOCUMENT_FEE);
    expect(sim.player.documents!.passport!.emergency).toBe(true);
    expect(sim.player.documents!.passport!.authority).toMatch(/^Consulate of/);
    expect(refusal(sim, 'travel.book_flight', { toCityId: paris, departAt: sim.now + 3 * MS_DAY, cabin: 'economy' })).toMatch(/gets you home/);
    expect(refusal(sim, 'travel.book_flight', { toCityId: chicago, departAt: sim.now + 3 * MS_DAY, cabin: 'economy' })).toBeUndefined();
  });

  it('lost at home is a replacement, asked for on the Decision Center', () => {
    const sim = aLife('papers-lost-home');
    const lost = must<{ emergency: boolean; fee: number }>(sim, 'doc.report_lost', { kind: 'passport' });
    expect(lost.emergency).toBe(false);
    expect(lost.fee).toBe(0);
    expect(statusOf(sim, sim.player.documents!.passport)).toBe('lost');
    expect(decisions(sim, 'papers').map((d) => d.title)).toContain('Replace Your Passport');
  });
});

describe('renewing a passport', () => {
  it('is refused with more than a year left, pays once, keeps the old book until the new one comes, and a retry cannot pay twice', () => {
    const sim = aLife('papers-renew');
    expect(refusal(sim, 'doc.apply_passport', { which: 'passport' })).toMatch(/good until/);
    const passport = sim.player.documents!.passport!;
    passport.expiresAt = sim.now + 200 * MS_DAY;
    const oldNumber = passport.number;
    const before = funds(sim);
    const applied = must<{ fee: number; readyAt: number; authority: string }>(sim, 'doc.apply_passport', { which: 'passport' }, 'renew:1');
    const again = must<{ fee: number; readyAt: number }>(sim, 'doc.apply_passport', { which: 'passport' }, 'renew:1');
    expect(again.readyAt).toBe(applied.readyAt);
    expect(applied.authority).toBe('U.S. Department of State');
    expect(applied.fee).toBe(165_00);
    expect(funds(sim)).toBe(before - 165_00);
    expect(memos(sim, /passport/).length).toBe(1);
    // Still at the office: the old book is what you travel on until then.
    expect(sim.player.documents!.passport!.status).toBe('applied');
    expect(sim.player.documents!.passport!.number).toBe(oldNumber);
    expect(refusal(sim, 'doc.apply_passport', { which: 'passport' })).toMatch(/already at the office/);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const fresh = sim.player.documents!.passport!;
    expect(fresh.status).toBe('valid');
    expect(fresh.number).not.toBe(oldNumber);
    expect(fresh.expiresAt).toBeGreaterThan(sim.now + 9 * 365 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'Your New Passport Is Here')).toBe(true);
  });

  it('expedited costs more and comes sooner, where the office offers it', () => {
    const sim = aLife('papers-fast');
    sim.player.documents!.passport!.expiresAt = sim.now + 30 * MS_DAY;
    const before = funds(sim);
    const fast = must<{ fee: number; readyAt: number }>(sim, 'doc.apply_passport', { which: 'passport', expedite: true });
    expect(fast.fee).toBe(165_00 + 60_00);
    expect(funds(sim)).toBe(before - fast.fee);
    expect(fast.readyAt).toBeLessThanOrEqual(addDays(sim.now, 21, sim.homeZone));
  });
});

describe('the wheel wants a license', () => {
  it('without one nothing drives: not between cities, not across town, and nobody quotes motor cover', () => {
    const sim = aLife('papers-wheel');
    sim.player.documents!.license = undefined;
    expect(licenseCheck(sim, sim.player).ok).toBe(false);
    expect(licenseCheck(sim, sim.player).reason).toMatch(new RegExp(NO_LICENSE.replace(/[’']/g, '.')));
    expect(driveableVehicle(sim)).toBeUndefined();
    expect(refusal(sim, 'go.to', { placeId: placesIn(sim.player.currentLocationId)[0]!.id, mode: 'drive' })).toMatch(/driver.s license/);
    expect(refusal(sim, 'ins.quote', { line: 'auto', coveredRefs: [] })).toMatch(/without a license/);
  });

  it('applying: the knowledge test today, the road test in weeks, and the pass depends on how you drive', () => {
    const sim = aLife('papers-test');
    const lic = () => sim.player.documents!.license;
    sim.player.documents!.license = undefined;
    sim.player.skills['driving'] = 100;
    const before = funds(sim);
    type Booked = { passedKnowledge: boolean; roadTestAt?: number; fee: number; office: string };
    let booked: Booked | undefined;
    for (let attempt = 0; attempt < 8 && !booked?.passedKnowledge; attempt++) {
      booked = must<Booked>(sim, 'doc.apply_license', {});
      if (!booked.passedKnowledge) sim.advanceTo(sim.now + MS_DAY);
    }
    expect(booked!.passedKnowledge).toBe(true);
    expect(booked!.office).toBe('California DMV');
    expect(funds(sim)).toBeLessThan(before);
    expect(lic()?.status).toBe('applied');
    expect(lic()?.roadTestAt).toBe(booked!.roadTestAt);
    expect(licenseCheck(sim, sim.player).reason).toMatch(/road test is on/);
    // The road test, sat when it comes; a fail is booked again until it is a pass.
    for (let attempt = 0; attempt < 8; attempt++) {
      sim.advanceTo(lic()!.roadTestAt! + MS_HOUR);
      if (lic()?.status === 'valid') break;
      expect(lic()).toBeUndefined();
      expect(decisions(sim, 'papers').map((d) => d.title)).toContain('Book The Road Test Again');
      const retake = must<{ passedKnowledge: boolean }>(sim, 'doc.apply_license', { retake: true });
      expect(retake.passedKnowledge).toBe(true);
    }
    expect(lic()?.status).toBe('valid');
    expect(lic()?.authority).toBe('California DMV');
    expect(licenseCheck(sim, sim.player).ok).toBe(true);
  });

  it('is refused under age', () => {
    const sim = quickSave({ birthYear: 2011, birthMonth: 6, birthDay: 1 }, 'papers-young');
    sim.income(sim.player.primaryAccountId!, 10_000_00, 'Test funding', 'other');
    expect(sim.player.documents!.license).toBeUndefined();
    expect(refusal(sim, 'doc.apply_license', {})).toMatch(/licenses drivers from 16/);
  });

  it('renews inside the last year, at the office, without a test', () => {
    const sim = aLife('papers-renew-license');
    expect(refusal(sim, 'doc.renew_license', {})).toMatch(/good until/);
    sim.player.documents!.license!.expiresAt = sim.now + 100 * MS_DAY;
    const renewed = must<{ fee: number; readyAt: number; office: string }>(sim, 'doc.renew_license', {});
    expect(renewed.office).toBe('California DMV');
    expect(sim.player.documents!.license!.status).toBe('applied');
    sim.advanceTo(renewed.readyAt + MS_HOUR);
    expect(sim.player.documents!.license!.status).toBe('valid');
    expect(sim.player.documents!.license!.expiresAt).toBeGreaterThan(sim.now + 7 * 365 * MS_DAY);
  });

  it('swaps without a test where the country swaps, and says so where it does not', () => {
    const sim = aLife('papers-swap');
    // Living in London on a Californian license, no home bought yet: Britain does not swap an American one.
    sim.player.residenceId = undefined;
    sim.player.homeRegionId = cityIn('uk', 'London');
    const london = exchangeOffer(sim, sim.player)!;
    expect(london.exchangeable).toBe(false);
    expect(london.note).toMatch(/does(n’t| not) swap/);
    expect(refusal(sim, 'doc.exchange_license', {})).toMatch(/does(n’t| not) swap/);
    // Your old license still drives while you sit the test.
    expect(licenseCheck(sim, sim.player).ok).toBe(true);
    // Living in Sydney: New South Wales does.
    sim.player.homeRegionId = cityIn('au', 'Sydney');
    const sydney = exchangeOffer(sim, sim.player)!;
    expect(sydney.exchangeable).toBe(true);
    expect(sydney.office).toBe('Service NSW');
    const swapped = must<{ readyAt: number; office: string }>(sim, 'doc.exchange_license', {});
    sim.advanceTo(swapped.readyAt + MS_HOUR);
    expect(sim.player.documents!.license!.issuerId).toBe('au');
    expect(sim.player.documents!.license!.authority).toBe('Service NSW');
    expect(exchangeOffer(sim, sim.player)).toBeUndefined();
  });
});

describe('the papers check', () => {
  it('asks ninety days out, and marks a passport expired the month it runs out', () => {
    const sim = aLife('papers-month');
    sim.player.documents!.passport!.expiresAt = sim.now + 70 * MS_DAY;
    sim.advanceTo(sim.now + 40 * MS_DAY);
    expect(decisions(sim, 'papers').map((d) => d.title)).toContain('Your Passport Runs Out Soon');
    sim.advanceTo(sim.now + 70 * MS_DAY);
    expect(sim.player.documents!.passport!.status).toBe('expired');
    expect(decisions(sim, 'papers').map((d) => d.title)).toContain('Your Passport Has Expired');
    expect(sim.universe.notifications.some((n) => n.title === 'Your Passport Has Expired')).toBe(true);
  });
});
