/**
 * The police report as its own step (`documents.police_report`, from
 * 2026-10-03): filed online where the force takes it, and what an issuer
 * does with it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf, policeReportRefusal } from '@/engine/systems/documents';
import { replaceRefusal } from '@/engine/systems/licensing';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const licensed = (sim: Simulation, issuer: string) => { documentsOf(sim.player).splice(0, documentsOf(sim.player).length, ...documentsOf(sim.player).filter((d) => d.kind !== 'license')); documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 1500 * MS_DAY }); };
const lic = (sim: Simulation) => documentsOf(sim.player).find((d) => d.id === 'lic')!;

describe('a police report', () => {
  it('in New York, filed online, has a stolen license replaced free with the MV-78B', () => {
    const sim = life('us-ny-newyork', 'police-ny');
    licensed(sim, 'us-ny');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic', stolen: true } });
    sim.must({ kind: 'documents.police_report', payload: { documentId: 'lic' } });
    expect(policeReportRefusal(sim.player, lic(sim))).toBe('A report is filed.');
    const r = sim.must<{ fee: number }>({ kind: 'documents.replace_license', payload: { documentId: 'lic' } });
    expect(r.fee).toBe(0);
  });

  it('is asked for before Ontario replaces a license, and the Met records no lost document', () => {
    const sim = life('ca-on-toronto', 'police-on');
    licensed(sim, 'ca-on');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    expect(replaceRefusal(sim.player, 'lic')).toMatch(/asks for a police report first/);
    sim.must({ kind: 'documents.police_report', payload: { documentId: 'lic' } });
    expect(replaceRefusal(sim.player, 'lic')).toBeUndefined();
    const ldn = life('uk-eng-london', 'police-ldn');
    licensed(ldn, 'gb');
    ldn.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    expect(policeReportRefusal(ldn.player, lic(ldn))).toBe('The Met records no lost document: DVLA and the Passport Office take it.');
    const dub = life('ie-lei-dublin', 'police-ie');
    licensed(dub, 'ie');
    dub.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    expect(policeReportRefusal(dub.player, lic(dub))).toBe('Lost property is reported at a station here.');
  });
});
