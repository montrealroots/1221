/**
 * Defects, group g24 part 1 (from 2026-10-12): Connecticut's ID card for somebody who isn't a citizen, once school is
 * over. Until this change `idCardRefusal` turned away anyone holding an F-1 once school had ended, OPT in force or not,
 * though OPT is lawful presence; and the card's term, had it been let through, ran to the program's end, already past
 * for a graduate. PLAYER JOURNEYS play forward through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { STARTING, documentsOf, inForce } from '@/engine/systems/documents';
import { f1Of, programEnd } from '@/engine/systems/permission';
import { idCardRefusal } from '@/engine/systems/identity';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/**
 * A British student at Yale with her Social Security number, applied for at school; then, as a FIXTURE, graduated with
 * her program ten days ended (the F-1's end moved so, its grace after), which a played save reaches only after two years.
 */
function graduate(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2026, 9, 8, 19));
  const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
  tended(sim, ssn.arrivesAt + MS_HOUR);
  expect(sim.player.ssn?.status).toBe('issued');
  const school = sim.player.school!;
  school.standing = 'graduated';
  school.endedAt = sim.now;
  f1Of(sim.player)!.expiresAt = sim.now - 10 * MS_DAY + STARTING.graceDays * MS_DAY;
  expect(programEnd(sim.player)).toBe(sim.now - 10 * MS_DAY);
  return sim;
}

/** FIXTURE: money posted in, for OPT's fee with premium processing. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const optOf = (sim: Simulation) => documentsOf(sim.player).find((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT'));

describe('PLAYER JOURNEY: Connecticut’s ID card for a graduate on OPT', () => {
  it('is issued on OPT in force, and runs to OPT’s end, not the program’s', () => {
    const sim = graduate('g24-opt');
    fund(sim, 5_000_00);
    // Without OPT, school over, the F-1 alone is no longer proof: the DMV asks for enrollment.
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/proof you’re enrolled/);
    const asked = sim.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    // Pending, it isn't lawful presence the DMV can check yet.
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/proof you’re enrolled/);
    tended(sim, asked.readyAt + MS_HOUR);
    const opt = optOf(sim)!;
    expect(inForce(opt, sim.now)).toBe(true);
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
    const applied = sim.must<{ expiresAt: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(applied.expiresAt).toBe(opt.expiresAt);
    expect(applied.expiresAt).toBeGreaterThan(sim.now + 200 * MS_DAY);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect(card.name).toMatch(/Limited Term/);
    // SAVE’s ten days are federal workdays from 2026-10-13: applied on the evening of Thursday 12 November, they are 13,
    // 16 to 20, 23 to 25 and 27 November, Thanksgiving passed, and the card comes on the evening of Friday the 27th,
    // fifteen days on. Until later that day this held seventeen: the days were counted as UTC has them, a day after New
    // Haven’s in the evening, so Sunday the 29th counted as a Monday (found by that day’s loose ends).
    expect(card.readyAt! - sim.now).toBe(15 * MS_DAY);
    tended(sim, card.readyAt! + MS_HOUR);
    expect(card.status).toBe('valid');
    expect(inForce(card, sim.now)).toBe(true);
  }, 120_000);

  it('is refused for lawful presence to somebody with neither an F-1 nor a permit, and issued on a permit alone', () => {
    const sim = graduate('g24-permit');
    // FIXTURE: the F-1 taken off the record, then an OPT card in force put on it.
    const docs = documentsOf(sim.player);
    docs.splice(docs.indexOf(f1Of(sim.player)!), 1);
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/proof of lawful presence/);
    docs.push({ id: 'opt-fixture', kind: 'permit', issuer: 'US', name: 'Employment Authorization, OPT', number: 'IOE1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 300 * MS_DAY, destination: 'US' });
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
  }, 120_000);
});
