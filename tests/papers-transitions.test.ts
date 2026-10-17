/**
 * Papers across the school's transitions (from 2026-10-10): a Connecticut ID card for an F-1 student, held to lawful
 * presence, enrollment and a Social Security number, mailed after SAVE's check (from 2026-10-17), and running to the
 * end of their status; and the F-1's end moving
 * with a repeated year. PLAYER JOURNEYS play forward through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of, programEnd } from '@/engine/systems/permission';
import { idCardRefusal } from '@/engine/systems/identity';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('PLAYER JOURNEY: a Connecticut ID card on an F-1', () => {
  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'waits for the Social Security
  // number, then for SAVE’s ten business days, and runs only to the end of the program', when it came on SAVE's day.
  it('waits for the Social Security number, then for SAVE’s ten business days and the mail’s twenty, and runs only to the end of the program', () => {
    const sim = student('pt-ctid', { homeRegionId: 'uk-eng-london' });
    tended(sim, at(2026, 9, 8, 19));
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/Social Security number/);
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    tended(sim, ssn.arrivesAt + MS_HOUR);
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
    const applied = sim.must<{ expiresAt: number }>({ kind: 'documents.apply_idcard', payload: {} });
    // Limited to their lawful presence, not the card's seven years to a birthday (six from the day until 2026-10-17).
    expect(applied.expiresAt).toBe(programEnd(sim.player));
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect(card.status).toBe('pending');
    expect(card.name).toMatch(/Limited Term/);
    expect(idCardRefusal(sim.player, sim.now)).toBe('One is already on its way.');
    // SAVE's ten federal workdays are past in fifteen days, and the card is still in the mail; it has come thirty days
    // later, the mail's twenty business days being past (from 2026-10-17: until then it was in force on SAVE's day).
    tended(sim, sim.now + 15 * MS_DAY);
    expect(card.status).toBe('pending');
    tended(sim, sim.now + 30 * MS_DAY);
    expect(card.status).toBe('valid');
  });

  it('is refused out of school, as the DMV asks for proof of enrollment', () => {
    const sim = student('pt-ctid-out', { homeRegionId: 'uk-eng-london' });
    tended(sim, at(2026, 9, 8, 11));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/proof that you’re enrolled/);
  });
});

describe('the F-1 through a repeated year', () => {
  it('runs a year longer, and the program’s end with it', () => {
    const sim = student('pt-f1-repeat', { homeRegionId: 'uk-eng-london' });
    tended(sim, at(2027, 5, 10));
    const before = f1Of(sim.player)!.expiresAt!;
    const end = programEnd(sim.player)!;
    // FIXTURE: one spring course failed, as unexcused absences fail one.
    const r = Object.values(sim.player.school!.courses ?? {}).find((x) => x.term === 1 && x.result === 'pass')!;
    r.result = 'fail';
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_repeat', payload: {} });
    tended(sim, asked.decideAt + MS_HOUR);
    expect(f1Of(sim.player)!.expiresAt! - before).toBeGreaterThan(360 * MS_DAY);
    expect(programEnd(sim.player)! - end).toBeGreaterThan(360 * MS_DAY);
  });
});
