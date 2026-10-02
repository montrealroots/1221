/**
 * A lost driving license replaced (`documents.replace_license`, from
 * 2026-10-02): at its authority's fee, driving on meanwhile where an interim
 * document or the record allows, and waiting for the card in California.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LICENSE_REPLACEMENT } from '@/engine/content/replacements';
import { documentsOf, licenseOf } from '@/engine/systems/documents';

function licensed(city: string, issuer: string, seed: string) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  documentsOf(sim.player).splice(0, documentsOf(sim.player).length, ...documentsOf(sim.player).filter((d) => d.kind !== 'license'));
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 1500 * MS_DAY });
  return sim;
}
const fee = (sim: ReturnType<typeof licensed>, issuer: string) => { const r = LICENSE_REPLACEMENT[issuer]!; const c = Math.round(r.fee * 100); const cur = saveCurrency(sim.universe); return cur === r.currency ? c : exchange(c, r.currency, cur)!; };

describe('a lost license', () => {
  it('in New York is replaced for $17.50, driven on meanwhile, the same expiry kept', () => {
    const sim = licensed('us-ny-newyork', 'us-ny', 'repl-ny');
    expect(sim.execute({ kind: 'documents.replace_license', payload: { documentId: 'lic' } }).error).toBe('It isn’t lost: report it lost first.');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    expect(licenseOf(sim.player, sim.now)).toBeUndefined();
    const r = sim.execute<{ fee: number }>({ kind: 'documents.replace_license', payload: { documentId: 'lic' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.fee).toBe(fee(sim, 'us-ny'));
    const now = licenseOf(sim.player, sim.now)!;
    expect(now.expiresAt).toBe(documentsOf(sim.player).find((d) => d.id === 'lic')!.expiresAt);
    expect(now.number).not.toBe('L1');
  });

  it('in California waits for the card, four weeks, the law asking it in hand', () => {
    const sim = licensed('us-ca-losangeles', 'us-ca', 'repl-ca');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    sim.must({ kind: 'documents.replace_license', payload: { documentId: 'lic' } });
    expect(licenseOf(sim.player, sim.now)).toBeUndefined();
    sim.advanceBy(LICENSE_REPLACEMENT['us-ca']!.days * MS_DAY + MS_DAY);
    expect(licenseOf(sim.player, sim.now)).toBeDefined();
  });

  it('isn’t replaced from another country', () => {
    const sim = licensed('uk-eng-london', 'us-ny', 'repl-abroad');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    expect(sim.execute({ kind: 'documents.replace_license', payload: { documentId: 'lic' } }).error).toMatch(/for someone living in the country/);
  });
});
