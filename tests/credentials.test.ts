/**
 * The boating and flying certificates held, as papers
 * (`systems/credentials.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { credentialsOf } from '@/engine/systems/credentials';

describe('certificates held', () => {
  it('lists a state’s boating certificate and the FAA’s pilot certificate with its medical', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'creds');
    const p = sim.player;
    expect(credentialsOf(p)).toEqual([]);
    p.boatCertificates = ['US-NY'];
    p.pilot = { issuedAt: sim.now, authority: 'FAA', medicalUntil: sim.now + 1000 };
    p.pilotLicences = [{ authority: 'CAA', country: 'uk', issuedAt: sim.now }];
    expect(credentialsOf(p)).toEqual([
      { name: 'Boating Safety Certificate', issuer: 'New York' },
      { name: 'Private Pilot Certificate', issuer: 'FAA', issuedAt: sim.now, medicalUntil: sim.now + 1000 },
      { name: 'Private Pilot License', issuer: 'CAA', issuedAt: sim.now },
    ]);
  });
});
