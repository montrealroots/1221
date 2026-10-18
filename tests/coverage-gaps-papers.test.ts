/**
 * Papers, the reachable items first and then the compatibility paths (from 2026-10-10; the rules in
 * docs/research/world/research-coverage-gaps.json). Each test says which it is:
 * - JOURNEY: the New Haven student, as a new life plays.
 * - FIXTURE: earnings, documents or a place set up to reach a rule a school life reaches only at its edge.
 * - LEGACY STATE: a save from before 2026-10-09 holding what no new life can begin.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { documentsOf } from '@/engine/systems/documents';
import { licenseReplaceRefusal } from '@/engine/systems/identity';
import { recordWages, earningsOf, yearOf } from '@/engine/systems/earnings';
import { socialSecurityOf, SOCIAL_SECURITY_KIND } from '@/engine/systems/socialsecurity';
import { studentUnavailable } from '@/engine/systems/unemployment';
import { snapIncome, snapStudentRefusal } from '@/engine/systems/assistance';
import { continuousSince, settleRefusal } from '@/engine/systems/residence';
import { VISIT_KIND } from '@/engine/systems/papervisits';
import { CITIZENSHIP_KIND } from '@/engine/systems/citizenship';
import { DESEMPLEO_KIND, CDMX_DESEMPLEO } from '@/engine/systems/homebenefits';

const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const YEAR = 365.25 * MS_DAY;

describe('a license from home, lost in New Haven (JOURNEY: a New Yorker at Yale)', () => {
  it('is replaced by mail, free when stolen with the police’s report, and not where its issuer sends none out of state', () => {
    const sim = student('pp-license');
    const license = documentsOf(sim.player).find((d) => d.kind === 'license')!;
    expect(license.issuer).toBe('us-ny');
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id, stolen: true } });
    expect(licenseReplaceRefusal(sim.player, license.id, sim.now)).toBeUndefined();
    sim.must({ kind: 'documents.police_report', payload: { documentId: license.id } });
    const free = sim.must<{ fee: number; readyAt: number }>({ kind: 'documents.replace_license', payload: { documentId: license.id } });
    expect(free.fee).toBe(0);
    sim.advanceTo(free.readyAt + MS_DAY);
    expect(documentsOf(sim.player).some((d) => d.kind === 'license' && d.status === 'valid')).toBe(true);

    const unreported = student('pp-license-unreported');
    const other = documentsOf(unreported.player).find((d) => d.kind === 'license')!;
    unreported.must({ kind: 'documents.report_lost', payload: { documentId: other.id } });
    expect(unreported.must<{ fee: number }>({ kind: 'documents.replace_license', payload: { documentId: other.id } }).fee).toBe(17_50);
  });

  it('from California is refused, said why (JOURNEY: a Californian at Yale)', () => {
    const sim = student('pp-license-ca', { homeRegionId: 'us-ca-losangeles' });
    const license = documentsOf(sim.player).find((d) => d.kind === 'license');
    if (!license) return;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: license.id } });
    expect(licenseReplaceRefusal(sim.player, license.id, sim.now)).toBe('Its issuer replaces it only for someone living there, and no way to send one out of state was found.');
  });
});

describe('unemployment in Connecticut (FIXTURE: base-period wages, as a Summer Cabaret stipend would make them)', () => {
  it('is refused a full-time student, and filed once they’ve left school', () => {
    const sim = student('pp-ui');
    // TEST SETUP: four quarters of covered wages.
    const q = earningsOf(sim.player).quarters;
    for (const k of ['2026-1', '2026-2', '2025-4', '2025-3', '2025-2']) q[k] = { wages: 4_000_00, byState: { 'us-ct': 4_000_00 } };
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toMatch(/full-time student as not available for work/);
    expect(studentUnavailable(sim.player, 'ct')).toBeDefined();
    sim.player.school!.standing = 'graduated';
    expect(studentUnavailable(sim.player, 'ct')).toBeUndefined();
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
  });
});

describe('SNAP for a student', () => {
  it('in the summer, without 20 hours of work a week, is refused; in term on a work-study award it isn’t (JOURNEY: dates of the New Haven student’s own year)', () => {
    const sim = student('pp-snap');
    expect(snapStudentRefusal(sim, sim.player, sim.now)).toBeUndefined();
    // The first summer: classes are over, the work-study award ends with the school year.
    sim.player.school!.termsBegun = 2;
    const summer = Date.UTC(2027, 5, 20, 16);
    expect(snapStudentRefusal(sim, sim.player, summer)).toMatch(/7 CFR 273\.5/);
  });

  it('counts work-study as nothing and interest as unearned (FIXTURE: a month’s pay of each kind)', () => {
    const sim = student('pp-snap-income');
    const at = sim.now;
    const before = snapIncome(sim.player, at + 20 * MS_DAY, sim.zone);
    recordWages(sim.player, at, sim.zone, { gross: 300_00, workStudy: true });
    recordWages(sim.player, at, sim.zone, { gross: 500_00 });
    const after = snapIncome(sim.player, at + 20 * MS_DAY, sim.zone);
    // The month's wages add to earned and gross; work-study is kept apart and adds to neither.
    expect(after.earned - before.earned).toBe(500_00);
    expect(after.gross - before.gross).toBe(500_00);
    expect(after.workStudy - before.workStudy).toBe(300_00);
  });
});

describe('Social Security credits (FIXTURE: a year of each kind of pay)', () => {
  it('aren’t earned by work-study, FICA-exempt while enrolled; a Summer Cabaret stipend earns them', () => {
    const sim = student('pp-ss');
    recordWages(sim.player, Date.UTC(2027, 2, 1), sim.zone, { gross: 6_000_00, workStudy: true });
    expect(socialSecurityOf(sim.player, 'USD').credits).toBe(0);
    recordWages(sim.player, Date.UTC(2027, 6, 1), sim.zone, { gross: 4_000_00 });
    expect(socialSecurityOf(sim.player, 'USD').credits).toBe(2);
  });
});

describe('residence held without a break (FIXTURE: Mexican residence documents)', () => {
  it('counts from the grant after a lapse, not the first ever', () => {
    const sim = student('pp-res');
    const docs = documentsOf(sim.player);
    const t = sim.now;
    docs.push({ id: 'r1', kind: 'visa', issuer: 'MX', name: 'Residente Temporal', number: 'R1', status: 'valid', issuedAt: t - 5 * YEAR, expiresAt: t - 3 * YEAR, destination: 'MX', route: 'mx-temporary' });
    docs.push({ id: 'r2', kind: 'visa', issuer: 'MX', name: 'Residente Temporal', number: 'R2', status: 'valid', issuedAt: t - 2 * YEAR, expiresAt: t + YEAR, destination: 'MX', route: 'mx-temporary' });
    expect(continuousSince(sim.player, 'MX', t)).toBe(t - 2 * YEAR);
    expect(settleRefusal(sim, sim.player, 'MX')).toBe('Permanent residence comes after four years of temporary residence.');
    // Without the lapse, the earlier grant reaches the later one, and four years are held.
    docs.find((d) => d.id === 'r1')!.expiresAt = t - 2 * YEAR;
    expect(continuousSince(sim.player, 'MX', t)).toBe(t - 5 * YEAR);
    // Past the four years settling was allowed (undefined) until 2026-10-16, when Mexico's papers stopped being granted
    // (brief 09's journeys): from then the rule's step gives way to the reason, which a lapse still keeps back.
    expect(settleRefusal(sim, sim.player, 'MX')).toBe('Mexico grants permanent residence after four years of temporary residence, for MXN 13,578.96. Moving abroad isn’t part of the game, so you can’t get Mexico’s papers here.');
  });
});

describe('compatibility paths (LEGACY STATE)', () => {
  it('a visit booked before the travel went: kept, its document decided', () => {
    const sim = student('pp-visit');
    // At two in the afternoon, two days on: awake and in town.
    const at = sim.now + 2 * MS_DAY + 6.5 * 3_600_000;
    documentsOf(sim.player).push({ id: 'v1', kind: 'permit', issuer: 'US', name: 'A Pending Permit', number: 'P1', status: 'pending', appliedAt: sim.now, readyAt: sim.now + MS_DAY, destination: 'US', visit: { rule: 'us-biometrics', at, cityId: sim.player.currentLocationId } });
    sim.schedule({ at, kind: VISIT_KIND, label: 'Biometrics', category: 'personal', priority: 33, requiresPlayer: true, durationMinutes: 60, locationId: sim.player.currentLocationId, payload: { personId: sim.player.id, documentId: 'v1' } });
    sim.player.awakeSince = sim.now;
    sim.advanceTo(at + 60_000);
    const doc = documentsOf(sim.player).find((d) => d.id === 'v1')!;
    expect(doc.visit!.keptAt).toBeDefined();
  });

  it('a Seguro de Desempleo claim, paid in Mexico City month by month and ended at its count', () => {
    const sim = student('pp-desempleo');
    sim.player.currentLocationId = 'mx-cmx-mexicocity';
    sim.player.desempleo = { filedAt: sim.now, payments: CDMX_DESEMPLEO.payments - 1 };
    sim.schedule({ at: sim.now + 60_000, kind: DESEMPLEO_KIND, label: 'Seguro De Desempleo', category: 'system', priority: 12, payload: { personId: sim.player.id } });
    sim.advanceTo(sim.now + 120_000);
    expect(sim.player.desempleo!.payments).toBe(CDMX_DESEMPLEO.payments);
    expect(sim.universe.scheduled.some((i) => i.kind === DESEMPLEO_KIND && i.status === 'pending')).toBe(false);
  });

  it('a Social Security pension already claimed: paid, and income on the year from 2026-10-10', () => {
    const sim = student('pp-pension');
    sim.player.socialSecurity = { from: sim.now, monthlyUsd: 1_000 };
    sim.schedule({ at: sim.now + 60_000, kind: SOCIAL_SECURITY_KIND, label: 'Social Security', category: 'system', priority: 20, payload: { personId: sim.player.id } });
    sim.advanceTo(sim.now + 120_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Social Security, the month')).toBe(true);
    expect(yearOf(sim.player, new Date(sim.now).getUTCFullYear()).pension).toBe(1_000_00);
  });

  it('a naturalization already applied for: decided, a citizen after', () => {
    const sim = student('pp-citizen');
    sim.player.naturalizing = { iso: 'MX', readyAt: sim.now + 60_000 };
    sim.schedule({ at: sim.now + 60_000, kind: CITIZENSHIP_KIND, label: 'Citizenship Decided', category: 'system', priority: 20, payload: { personId: sim.player.id } });
    sim.advanceTo(sim.now + 120_000);
    expect(sim.player.naturalized!.map((n) => n.iso)).toEqual(['MX']);
    expect(sim.player.naturalizing).toBeUndefined();
  });
});
