/**
 * Replacing a lost ID card (`documents.replace_idcard` in
 * `systems/identity.ts`, from 2026-10-02): reported lost, it's replaced by
 * its issuer for someone living there, at the issuer's fee, and comes after
 * its published time.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { idReplaceFee, idReplaceRefusal } from '@/engine/systems/identity';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a lost ID card', () => {
  it('is replaced in New York for $8 and comes in three weeks', () => {
    const sim = life('us-ny-newyork', 'id-replace');
    const p = sim.player;
    // An ID card of theirs, issued there.
    documentsOf(p).push({ id: 'idc', kind: 'idcard', issuer: 'us-ny', name: 'ID Card', number: 'I1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3e11 });
    const card = documentsOf(p).find((d) => d.id === 'idc')!;
    expect(idReplaceRefusal(p, card.id)).toBe('It isn’t lost: report it lost first.');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    expect(idReplaceFee(sim, p, 'us-ny')).toBe(inSaveMoney(sim, 8_00, 'USD'));
    const r = sim.must<{ readyAt: number }>({ kind: 'documents.replace_idcard', payload: { documentId: card.id } });
    expect(r.readyAt - sim.now).toBe(21 * MS_DAY);
    const fresh = documentsOf(p).find((d) => d.kind === 'idcard' && d.status === 'pending')!;
    expect(card.status).toBe('cancelled');
    sim.advanceTo(r.readyAt + MS_DAY);
    expect(fresh.status).toBe('valid');
  });

  it('is free from 62 in California, and replaced only where it was issued', () => {
    const sim = life('us-ca-losangeles', 'id-replace-ca');
    const p = sim.player;
    expect(idReplaceFee(sim, p, 'us-ca')).toBe(inSaveMoney(sim, 40_00, 'USD'));
    p.birthInstant = sim.now - 63 * 365.25 * MS_DAY;
    expect(idReplaceFee(sim, p, 'us-ca')).toBe(0);
    // An ID card of theirs, issued there.
    documentsOf(p).push({ id: 'idc', kind: 'idcard', issuer: 'us-ca', name: 'ID Card', number: 'I1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3e11 });
    const card = documentsOf(p).find((d) => d.id === 'idc')!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    p.home = { ...p.home!, cityId: 'us-ny-newyork' };
    expect(idReplaceRefusal(p, card.id)).toBe('It’s replaced where it was issued, for someone living there.');
    expect(idReplaceRefusal(p, 'nothing')).toBe('That isn’t an ID card of yours.');
  });
});
