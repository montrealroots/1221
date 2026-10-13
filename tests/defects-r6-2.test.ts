/**
 * What `liabilityFor` reads (`systems/security.ts`), group r6, from 2026-10-12.
 *
 * Group g17 put each US debit tier on its own clock: the $50 tier in business days from learning of the use, the $500
 * tier in days from the statement. `liabilityFor` still took a bare number of days, which stood for every clock and
 * counted each tier from the one day, so 70 days from learning of a use left all of it where the use's own record,
 * its statement 42 days back, leaves $500. Only tests passed a number. It reads the use's record (`FraudClocks`) and
 * nothing else now.
 *
 * The type is the fix, so this test's red is the typecheck's: with the bare number taken again, the directive below
 * has no error to expect, and `npm run typecheck` fails on it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { FRAUD_LAW, type FraudLaw } from '@/engine/content/security';
import { cardAccount, liabilityFor } from '@/engine/systems/security';

const laws = FRAUD_LAW as Record<string, FraudLaw>;
const kept = new Map<string, FraudLaw>();
function withLaw(iso: string, change: Partial<FraudLaw>) { if (!kept.has(iso)) kept.set(iso, laws[iso]!); laws[iso] = { ...laws[iso]!, ...change }; }
afterEach(() => { for (const [k, v] of kept) laws[k] = v; kept.clear(); });

describe('liabilityFor', () => {
  it('reads the use’s own clocks, and takes no bare number of days', () => {
    withLaw('US', { fraudRate: 0 });
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId: 'us-chase' }, 'r6-clocks');
    const debit = cardAccount(sim, sim.player, 'debit')!;
    // Learned of by an alert 70 days ago, its statement 42 days ago: inside the $500 tier's 60 days from the statement.
    expect(liabilityFor(sim, debit, 'debit', 900_00, { learnedAt: sim.now - 70 * MS_DAY, statedAt: sim.now - 42 * MS_DAY })).toBe(500_00);
    // Until 2026-10-12 this was taken, and counted the $500 tier 70 days from learning of it: all of it.
    // @ts-expect-error A bare number of days isn't a use's clocks.
    const bare = () => liabilityFor(sim, debit, 'debit', 900_00, 70);
    expect(typeof bare).toBe('function');
  });
});
