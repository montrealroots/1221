/**
 * Defects, group r3d part 1 (from 2026-10-12): what Connecticut's DMV tells a graduate whose Social Security number is
 * on its way.
 *
 * Group r7 split the ID card's Social Security line three ways the same day: a student at school was sent to Papers,
 * one who had applied was told the card was on its way, and anyone else was told SLATE issues the number only to an F-1
 * student at school. The "on its way" line was read only inside the at-school branch, though. A student who applied for
 * OPT early and for the number in the program's last weeks graduated before the card came, and was told SLATE wouldn't
 * issue a number that Papers (`ssnRefusal`) said was on its way, and that then came. The number applied for is now read
 * first, whoever applied for it.
 *
 * PLAYER JOURNEYS play forward through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { STARTING, documentsOf, inForce } from '@/engine/systems/documents';
import { f1Of, programEnd } from '@/engine/systems/permission';
import { idCardRefusal } from '@/engine/systems/identity';
import { ssnRefusal } from '@/engine/systems/taxid';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: money posted in, for OPT's fee with premium processing and the card's. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const optOf = (sim: Simulation) => documentsOf(sim.player).find((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT'));

const ASKED = 'The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one.';
const ON_ITS_WAY = `${ASKED} Yours is on its way.`;

describe('PLAYER JOURNEY: the ID card’s Social Security line, for a graduate whose number is on its way', () => {
  it('says it’s on its way, as Papers does, from the last weeks at school through graduation to the card', () => {
    const sim = student('r3d-ssn-on-its-way');
    tended(sim, at(2026, 9, 8, 19));
    expect(sim.player.ssn).toBeUndefined();
    // FIXTURE: the program ending on Saturday, November 7 (the F-1's end moved so, its grace after), which a played save
    // reaches only after two years.
    const end = at(2026, 11, 7, 19);
    f1Of(sim.player)!.expiresAt = end + STARTING.graceDays * MS_DAY;
    expect(programEnd(sim.player)).toBe(end);
    fund(sim, 5_000_00);
    // OPT, applied for early, 60 days before the end, and granted from the program's end.
    const asked = sim.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    expect(asked.readyAt).toBeLessThan(end);
    // The number, applied for in the last weeks at school: the card comes after the program has ended.
    tended(sim, at(2026, 11, 2, 19));
    expect(ssnRefusal(sim, sim.player)).toBeUndefined();
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    expect(ssn.arrivesAt).toBeGreaterThan(end + 2 * MS_DAY);
    expect(idCardRefusal(sim.player, sim.now)).toBe(ON_ITS_WAY);
    // FIXTURE: graduated at the program's end, as the School's own calendar does only after two years.
    tended(sim, end + MS_HOUR);
    const school = sim.player.school!;
    school.standing = 'graduated';
    school.endedAt = sim.now;
    // Two days on: OPT in force, the number still coming. Papers says it's on its way, and the counter says the same.
    tended(sim, end + 2 * MS_DAY);
    expect(inForce(optOf(sim)!, sim.now)).toBe(true);
    expect(sim.player.ssn?.status).toBe('applied');
    expect(ssnRefusal(sim, sim.player)).toBe('You’ve applied; the card is on its way.');
    expect(idCardRefusal(sim.player, sim.now)).toBe(ON_ITS_WAY);
    expect(() => sim.must({ kind: 'documents.apply_idcard', payload: {} })).toThrow(ON_ITS_WAY);
    expect(documentsOf(sim.player).some((d) => d.kind === 'idcard')).toBe(false);
    // It comes, as it said, and the card is hers, running to OPT's end.
    tended(sim, ssn.arrivesAt + MS_HOUR);
    expect(sim.player.ssn?.status).toBe('issued');
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
    const applied = sim.must<{ expiresAt: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(applied.expiresAt).toBe(optOf(sim)!.expiresAt);
  }, 180_000);
});
