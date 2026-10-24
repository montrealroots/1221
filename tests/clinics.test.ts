/**
 * Where care happens (`systems/clinics.ts`, from 2026-10-01): a named
 * practice, urgent care center or emergency department in the town they're
 * in, their own doctor where they've chosen one, and an uninsured urgent
 * visit at a provider's own published self-pay price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CARE } from '@/engine/content/safetynet';
import { clinicFor, clinicRefusal } from '@/engine/systems/clinics';
import { careFor, healthOf, planOf, shareOf } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, wealth: 'wealthy' }, seed);

describe('where care is had', () => {
  it('a doctor’s visit at a practice, urgent care at a center, an emergency at a hospital, in the town they’re in', () => {
    const sim = life('us-ny-newyork', 'cl-ny');
    expect(clinicFor(sim.player, 'visit')!.id).toBe('us-ny-onemedical-flatiron');
    expect(clinicFor(sim.player, 'urgent')!.id).toBe('us-ny-citymd-w57');
    expect(clinicFor(sim.player, 'emergency')!.id).toBe('us-ny-hh-bellevue-ed');
    // Toronto keeps a walk-in clinic for a doctor's visit; a town with none, nothing.
    const to = life('ca-on-toronto', 'cl-to');
    expect(clinicFor(to.player, 'visit')!.kind).toBe('walk-in');
    to.player.currentLocationId = 'us-tx-houston';
    expect(clinicFor(to.player, 'visit')).toBeUndefined();
  });

  it('their own doctor, chosen in the town they live in, sees them', () => {
    const sim = life('uk-eng-london', 'cl-own');
    expect(clinicRefusal(sim.player, 'uk-ldn-boots-piccadilly')).toBe('That isn’t a doctor’s practice.');
    expect(clinicRefusal(sim.player, 'us-ny-onemedical-flatiron')).toBe('Your doctor has to be in the town you live in.');
    sim.must({ kind: 'health.choose_clinic', payload: { clinicId: 'uk-ldn-bupa-gp' } });
    expect(clinicFor(sim.player, 'visit')!.id).toBe('uk-ldn-bupa-gp');
    expect(healthOf(sim.player).clinicId).toBe('uk-ldn-bupa-gp');
  });

  it('names the place on the bill', () => {
    const sim = life('us-ny-newyork', 'cl-bill');
    const bill = careFor(sim, sim.player, { care: 'emergency', what: 'The emergency room' }, sim.now);
    expect(bill?.what ?? sim.universe.notifications.at(-1)!.body).toMatch(/Bellevue/);
  });
});

describe('an uninsured urgent visit', () => {
  it('is the provider’s own self-pay price: about $237.50 at CityMD, $215 at Exer; SLATE’s average where none is published', () => {
    const ny = life('us-ny-newyork', 'cl-self-ny');
    expect(planOf(ny.player, ny.now)).toBeUndefined();
    expect(shareOf(ny.player, 'urgent', ny.now)).toBe(237_50);
    const la = life('us-ca-losangeles', 'cl-self-la');
    expect(shareOf(la.player, 'urgent', la.now)).toBe(215_00);
    const nh = life('us-ct-newhaven', 'cl-self-nh');
    expect(shareOf(nh.player, 'urgent', nh.now)).toBeGreaterThanOrEqual(Math.round(CARE.price.urgent * CARE.uninsuredMarkup));
  });
});
