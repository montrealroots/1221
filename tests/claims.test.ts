/**
 * A marketplace claim denied and appealed (`DENIALS` in `systems/health.ts`,
 * from 2026-10-03), and a chronic condition's review at NICE's interval
 * (`REVIEW_MONTHS`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { DENIALS, NAMED_TEETH_EYES, REVIEW_MONTHS, appealRefusal, armHealth, careFor, coverOn, healthOf, reviewWhat, teethAndEyesShareOf, uninsuredPrice } from '@/engine/systems/health';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { appointmentsOf } from '@/engine/systems/appointments';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, wealth: 'wealthy' }, seed);
const onMarketplace = (sim: Simulation) => { const h = healthOf(sim.player); h.marketplace = { from: sim.now - MS_DAY, state: 'ny' }; };

/** A denied visit's bill, searching claims until one is denied. */
function denied(seed: string): { sim: Simulation; billId: string } {
  for (let i = 0; i < 40; i += 1) {
    const sim = life('us-ny-newyork', `${seed}-${i}`);
    onMarketplace(sim);
    if (coverOn(sim.player, sim.now) !== 'marketplace') continue;
    const bill = careFor(sim, sim.player, { care: 'visit', what: 'A checkup' }, sim.now);
    if (bill?.denied) return { sim, billId: bill.id };
  }
  throw new Error('none denied');
}

describe('a marketplace claim', () => {
  it('denied at KFF’s rate, is billed as if uninsured', () => {
    expect(DENIALS.rate).toBe(0.2);
    const { sim, billId } = denied('deny');
    const bill = healthOf(sim.player).bills.find((b) => b.id === billId)!;
    expect(bill.amount).toBeGreaterThanOrEqual(uninsuredPrice(sim, 'visit', bill.at));
    expect(bill.amount).toBeGreaterThan(bill.denied!.share);
    expect(sim.universe.notifications.some((n) => n.title === 'A Claim Denied')).toBe(true);
  });

  it('appealed within 180 days, is decided 60 days on: upheld, or overturned to the plan’s share', () => {
    const { sim, billId } = denied('appeal');
    const r = sim.must<{ decidedAt: number }>({ kind: 'health.appeal', payload: { billId } });
    expect(r.decidedAt - sim.now).toBe(60 * MS_DAY);
    const bill = healthOf(sim.player).bills.find((b) => b.id === billId)!;
    expect(appealRefusal(bill, sim.now)).toBe('It’s been appealed.');
    sim.advanceTo(r.decidedAt + MS_DAY);
    expect(['upheld', 'overturned']).toContain(bill.denied!.outcome);
    if (bill.denied!.outcome === 'overturned') expect(bill.amount).toBe(bill.denied!.share);
    const late = { ...bill, denied: { share: 0 } };
    expect(appealRefusal(late, bill.at + 181 * MS_DAY)).toBe('An appeal has to be filed within 180 days of the denial, and that time has passed.');
    expect(appealRefusal({ ...bill, denied: undefined }, sim.now)).toBe('That claim wasn’t denied.');
  });
});

describe('a chronic condition', () => {
  it('is reviewed at NICE’s interval: high blood pressure a year on, booked as a doctor’s visit', () => {
    const sim = life('uk-eng-london', 'review');
    armHealth(sim, sim.player);
    const h = healthOf(sim.player);
    h.chronic = { hypertension: { treated: true, reviewedAt: sim.now - 13 * 30.44 * MS_DAY } };
    expect(REVIEW_MONTHS.hypertension).toBe(12);
    sim.advanceBy(8 * MS_DAY);
    const booked = appointmentsOf(sim.player).find((a) => a.what === reviewWhat('hypertension'));
    expect(booked ?? h.owedVisit).toBeTruthy();
  });
});

describe('a dentist and an optician', () => {
  it('cost a named practice’s own price where they live: hi sonrisa’s MX$1,199 cleaning, Ópticas Devlyn’s free exam', () => {
    const sim = life('mx-cmx-mexicocity', 'teeth-mx');
    const cur = saveCurrency(sim.universe);
    expect(teethAndEyesShareOf(sim.player, 'cleaning', sim.now, cur)).toBe(cur === 'MXN' ? 1_199_00 : exchange(1_199_00, 'MXN', cur));
    expect(teethAndEyesShareOf(sim.player, 'exam', sim.now, cur)).toBe(0);
    expect(NAMED_TEETH_EYES['us-ny-newyork']!.cleaning!.price).toBe(144);
  });
});
