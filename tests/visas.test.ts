/**
 * Visitor visas (`content/visas.ts`, from 2026-09-29): applied for, paid,
 * decided after the published wait, and entry granted on them.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { VISAS } from '@/engine/content/visas';
import { documentsOf, mayEnter, passportOf, visaRefusal } from '@/engine/systems/documents';

function citizen(city: string, citizenship: string, seed: string) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.citizenshipId = citizenship;
  const iso = citizenship.toUpperCase();
  for (const d of documentsOf(sim.player)) if (d.kind === 'passport') d.status = 'cancelled';
  documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: iso, name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  return sim;
}

describe('a visitor visa', () => {
  it('lets a Mexican apply for the US’s B-1/B-2 at $185, decided after the interview’s wait, and then enter', () => {
    const sim = citizen('mx-cmx-mexicocity', 'mx', 'visa-us');
    expect(mayEnter(sim.player, 'US', sim.now).ok).toBe(false);
    expect(mayEnter(sim.player, 'US', sim.now).missing.join(' ')).toMatch(/B-1\/B-2 Visitor Visa, applied for on Papers/);
    const r = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_visa', payload: { destination: 'US' } });
    expect(r.ok, r.error).toBe(true);
    const cur = saveCurrency(sim.universe);
    expect(r.value!.fee).toBe(cur === 'USD' ? 185_00 : exchange(185_00, 'USD', cur));
    // From 2026-10-06 the interview is booked on the calendar at the wait's end, the first business morning from it,
    // and the visa decided its week after; until then the decision came at the wait's end with no interview.
    const visa = documentsOf(sim.player).find((d) => d.kind === 'visa' && d.destination === 'US')!;
    expect(visa.visit!.at - sim.now).toBeGreaterThanOrEqual((VISAS['US<MX']!.days - 7) * MS_DAY - 24 * 3_600_000);
    expect(visa.visit!.at - sim.now).toBeLessThan((VISAS['US<MX']!.days - 7 + 4) * MS_DAY);
    expect(r.value!.readyAt).toBe(visa.visit!.at + 7 * MS_DAY);
    expect(visaRefusal(sim.player, 'US', sim.now)).toMatch(/being decided/);
    sim.advanceTo(r.value!.readyAt + 60_000);
    expect(visa.status).toBe('valid');
    // Ten years, but no longer than the passport's nine and a half left.
    expect(visa.expiresAt).toBe(passportOf(sim.player, sim.now)!.expiresAt);
    expect(mayEnter(sim.player, 'US', sim.now).ok).toBe(true);
  });

  it('issues Mexico’s electronic visa to a Brazilian for 180 days', () => {
    const sim = citizen('br-27-saopaulo', 'br', 'visa-mx');
    const r = sim.execute<{ readyAt: number }>({ kind: 'documents.apply_visa', payload: { destination: 'MX' } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceTo(r.value!.readyAt + 60_000);
    const visa = documentsOf(sim.player).find((d) => d.kind === 'visa' && d.destination === 'MX')!;
    expect(visa.expiresAt! - visa.issuedAt!).toBe(180 * MS_DAY);
  });

  it('refuses a visa to a citizenship that needs none, and without a passport', () => {
    const sim = citizen('uk-eng-london', 'uk', 'visa-none');
    expect(visaRefusal(sim.player, 'US', sim.now)).toMatch(/doesn’t need a visa there/);
    const mx = citizen('mx-cmx-mexicocity', 'mx', 'visa-nopass');
    for (const d of documentsOf(mx.player)) d.status = 'cancelled';
    expect(visaRefusal(mx.player, 'US', mx.now)).toMatch(/none in force/);
  });
});
