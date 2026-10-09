/**
 * The visit an application waits on (`systems/papervisits.ts`, from
 * 2026-10-06): a US visa's interview, the green card's biometrics, Britain's
 * enrolment and Canada's biometrics, each booked on the calendar where the
 * applicant lives, the decision waiting on it, and a miss ending or delaying
 * the application as its authority says.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,MS_HOUR } from '@/engine/core/time';
import { documentsOf,type PersonDocument } from '@/engine/systems/documents';
import { VISIT_KIND } from '@/engine/systems/papervisits';
import { describe,expect,it } from 'vitest';

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
