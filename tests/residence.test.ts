/**
 * The right to live in another country (`systems/residence.ts`, from
 * 2026-09-30): Britain's Global Talent visa, its NHS and its settlement;
 * Mexico's temporary residence by solvency and its permanent residence; and
 * no route in Canada, Ireland or, for a green card, the United States.
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { residenceRefusal } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { MEXICAN_RESIDENCE,residenceIn,routeRefusal,settleRefusal } from '@/engine/systems/residence';
import { describe,expect,it } from 'vitest';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** An American living in New York, wealthy. */
const american = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a route to residence', () => {
  it('is refused where none is open to an actor, with the reason', () => {
    const sim = american('res-none');
    expect(routeRefusal(sim, sim.player, 'CA')).toMatch(/Self-Employed Persons Program is paused/);
    expect(routeRefusal(sim, sim.player, 'IE')).toMatch(/employer’s offer/);
    expect(routeRefusal(sim, sim.player, 'US')).toMatch(/citizen/);
    expect(residenceRefusal(sim.player, 'uk-eng-london', sim.now)).toMatch(/route to residence/);
  });

  it('gives Mexican temporary residence on the solvency test, and permanent residence after four years', () => {
    const sim = american('res-mx');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(routeRefusal(sim, sim.player, 'MX')).toMatch(/savings of MXN 1,344,373/);
    // Six months' income past 680 UMA a month.
    const d = new Date(sim.now);
    for (let i = 1; i <= 6; i += 1) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); earningsOf(sim.player).months[`${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, '0')}`] = inSave(sim, 80_000_00, 'MXN'); }
    expect(routeRefusal(sim, sim.player, 'MX')).toBeUndefined();
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = inSave(sim, 50_000_00, 'MXN');
    const r = sim.execute<{ paid: number }>({ kind: 'documents.residence', payload: { country: 'MX' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, 11_140_74, 'MXN') + inSave(sim, 56_00, 'USD'));
    expect(residenceRefusal(sim.player, 'mx-cmx-mexicocity', sim.now)).toBeUndefined();
    // A year on it lapses, unless renewed in its last 30 days.
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).error).toMatch(/last 30 days/);
    const card = residenceIn(sim.player, 'MX', sim.now)!;
    card.expiresAt = sim.now + 10 * MS_DAY;
    expect(sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } }).ok).toBe(true);
    expect(residenceIn(sim.player, 'MX', sim.now + 300 * MS_DAY)).toBeDefined();
    expect(settleRefusal(sim, sim.player, 'MX')).toMatch(/four years/);
    card.issuedAt! -= MEXICAN_RESIDENCE.permanentAfter * YEAR;
    expect(settleRefusal(sim, sim.player, 'MX')).toBeUndefined();
  });
});
