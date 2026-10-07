/**
 * The visit an application waits on (`systems/papervisits.ts`, from
 * 2026-10-06): a US visa's interview, the green card's biometrics, Britain's
 * enrolment and Canada's biometrics, each booked on the calendar where the
 * applicant lives, the decision waiting on it, and a miss ending or delaying
 * the application as its authority says.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { careerOf } from '@/engine/systems/career';
import { VISIT_KIND, VISIT_LEAD_DAYS } from '@/engine/systems/papervisits';

function citizen(city: string, citizenship: string, seed: string): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.citizenshipId = citizenship;
  for (const d of documentsOf(sim.player)) if (d.kind === 'passport') d.status = 'cancelled';
  documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: citizenship.toUpperCase(), name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  return sim;
}
/** Out of town through a visit, and back: away on the day, as a trip would leave them. */
function awayFor(sim: Simulation, doc: PersonDocument): void {
  const home = sim.player.currentLocationId;
  sim.advanceTo(doc.visit!.at - MS_HOUR);
  sim.player.currentLocationId = home === 'us-ny-newyork' ? 'us-ca-losangeles' : 'us-ny-newyork';
  sim.advanceTo(doc.visit!.at + MS_HOUR);
  sim.player.currentLocationId = home;
}
const record = (sim: Simulation) => { careerOf(sim.player).credits.push(...['broadway', 'lort-b', 'guest-hour'].map((roleId) => ({ roleId, year: 2026, cityId: 'us-ny-newyork' as const }))); };
const visits = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === VISIT_KIND && i.status === 'pending');

describe('a US visa’s interview', () => {
  it('is booked at the consulate where they live, the visa issued its week after; missed, a no-show closes it', () => {
    const kept = citizen('mx-cmx-mexicocity', 'mx', 'visit-us-kept');
    const r = kept.must<{ readyAt: number }>({ kind: 'documents.apply_visa', payload: { destination: 'US' } });
    const visa = documentsOf(kept.player).find((d) => d.kind === 'visa')!;
    expect(visits(kept)).toHaveLength(1);
    expect(visits(kept)[0]).toMatchObject({ label: 'Visa Interview At The Consulate', locationId: 'mx-cmx-mexicocity', requiresPlayer: true, at: visa.visit!.at });
    kept.advanceTo(r.readyAt + MS_HOUR);
    expect(visa.status).toBe('valid');
    expect(visa.visit!.keptAt).toBe(visa.visit!.at);

    const missed = citizen('mx-cmx-mexicocity', 'mx', 'visit-us-missed');
    const m = missed.must<{ readyAt: number }>({ kind: 'documents.apply_visa', payload: { destination: 'US' } });
    const no = documentsOf(missed.player).find((d) => d.kind === 'visa')!;
    awayFor(missed, no);
    missed.advanceTo(m.readyAt + MS_HOUR);
    expect(no.status).toBe('cancelled');
    expect(missed.universe.notifications.at(-1)?.body).toMatch(/no-show closes the application/);
    // Applied for again, from the start.
    expect(missed.execute({ kind: 'documents.apply_visa', payload: { destination: 'US' } }).ok).toBe(true);
  });
});

describe('the green card’s biometrics', () => {
  it('missed, USCIS treats the case as abandoned and denies it; kept, it’s decided at its time', () => {
    const run = (seed: string, miss: boolean) => {
      const sim = citizen('us-ny-newyork', 'uk', seed);
      documentsOf(sim.player).push({ id: 'o1', kind: 'permit', issuer: 'US', name: 'O-1B Status', number: 'O1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3 * 365 * MS_DAY, destination: 'US' });
      record(sim);
      sim.must({ kind: 'documents.residence', payload: { country: 'US', premium: true } });
      const card = documentsOf(sim.player).find((d) => d.route === 'us-green-card')!;
      expect(card.visit).toMatchObject({ rule: 'us-biometrics', cityId: 'us-ny-newyork' });
      expect(card.visit!.at - sim.now).toBeGreaterThanOrEqual((VISIT_LEAD_DAYS - 1) * MS_DAY);
      if (miss) awayFor(sim, card); else sim.advanceTo(card.visit!.at + MS_HOUR);
      return { sim, card };
    };
    const missed = run('visit-gc-missed', true);
    expect(missed.card.status).toBe('cancelled');
    expect(missed.sim.universe.notifications.at(-1)?.body).toMatch(/abandoned and denies it/);
    const kept = run('visit-gc-kept', false);
    expect(kept.card.status).toBe('pending');
    kept.sim.advanceTo(kept.card.readyAt! + MS_HOUR);
    expect(kept.card.status).toBe('valid');
  });
});

describe('Britain’s enrolment for the Global Talent visa', () => {
  it('in Britain, missed once, booked again at the warning’s tenth day; missed again, rejected as not made; kept, granted', () => {
    const run = (seed: string, misses: number) => {
      const sim = citizen('uk-eng-london', 'us', seed);
      record(sim);
      sim.must({ kind: 'documents.residence', payload: { country: 'GB' } });
      const gt = documentsOf(sim.player).find((d) => d.route === 'global-talent')!;
      expect(gt.visit!.rule).toBe('uk-enrolment-home');
      const first = gt.visit!.at;
      if (misses >= 1) awayFor(sim, gt);
      if (misses >= 1) {
        expect(gt.status).toBe('pending');
        expect(gt.visit!.at).toBeGreaterThan(first);
        expect(gt.visit!.at).toBeLessThanOrEqual(first + MS_HOUR + 10 * MS_DAY);
      }
      if (misses >= 2) awayFor(sim, gt); else sim.advanceTo(gt.visit!.at + MS_HOUR);
      return { sim, gt };
    };
    const twice = run('visit-gt-twice', 2);
    expect(twice.gt.status).toBe('cancelled');
    expect(twice.sim.universe.notifications.at(-1)?.body).toMatch(/treated as not made/);
    const once = run('visit-gt-once', 1);
    expect(once.gt).toMatchObject({ status: 'valid', issuedAt: once.gt.visit!.keptAt });
    const none = run('visit-gt-none', 0);
    expect(none.gt.status).toBe('valid');
    // Abroad, a first miss ends it.
    const abroad = citizen('us-ny-newyork', 'us', 'visit-gt-abroad');
    record(abroad);
    abroad.must({ kind: 'documents.residence', payload: { country: 'GB' } });
    const ab = documentsOf(abroad.player).find((d) => d.route === 'global-talent')!;
    expect(ab.visit!.rule).toBe('uk-enrolment-abroad');
    awayFor(abroad, ab);
    expect(ab.status).toBe('cancelled');
  });
});

describe('Canada’s biometrics', () => {
  it('for a visitor visa: missed, booked again inside the letter’s 30 days, and the 18 days run from the day given', () => {
    const sim = citizen('mx-cmx-mexicocity', 'mx', 'visit-ca');
    const applied = sim.now;
    sim.must({ kind: 'documents.apply_visa', payload: { destination: 'CA' } });
    const visa = documentsOf(sim.player).find((d) => d.kind === 'visa' && d.destination === 'CA')!;
    awayFor(sim, visa);
    expect(visa.status).toBe('pending');
    expect(visa.visit!.at).toBeLessThanOrEqual(applied + 30 * MS_DAY);
    sim.advanceTo(visa.visit!.at + MS_HOUR);
    expect(visa.visit!.keptAt).toBe(visa.visit!.at);
    expect(visa.readyAt).toBe(visa.visit!.at + 18 * MS_DAY);
    sim.advanceTo(visa.readyAt! + MS_HOUR);
    expect(visa.status).toBe('valid');
  });
});
