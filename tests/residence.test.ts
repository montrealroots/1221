/**
 * The right to live in another country (`systems/residence.ts`, from
 * 2026-09-30): Britain's Global Talent visa, its NHS and its settlement;
 * Mexico's temporary residence by solvency and its permanent residence; and
 * no route in Canada, Ireland or, for a green card, the United States.
 *
 * From 2026-10-16 (brief 09's journeys) Mexico's residence isn't granted:
 * nothing outside its own papers read it. Until then the second test here
 * bought the card on six months' income, renewed it and settled after four
 * years; from then it reads the refusal on savings or income alike, and a
 * card an older save holds, written onto the record as a FIXTURE.
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf,residenceRefusal } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { MEXICAN_RESIDENCE,MEXICO_RENEWAL,residenceIn,routeRefusal,settleRefusal } from '@/engine/systems/residence';
import { describe,expect,it } from 'vitest';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** An American living in New York, wealthy. */
const american = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, seed);

describe('a route to residence', () => {
  it('is refused where none is open to an actor, with the reason', () => {
    const sim = american('res-none');
    expect(routeRefusal(sim, sim.player, 'CA')).toMatch(/Self-Employed Persons Program is paused/);
    expect(routeRefusal(sim, sim.player, 'IE')).toMatch(/employer’s offer/);
    expect(routeRefusal(sim, sim.player, 'US')).toMatch(/citizen/);
    expect(residenceRefusal(sim.player, 'uk-eng-london', sim.now)).toBe('Living in the United Kingdom needs permission to live there, which you don’t hold. Residence Abroad, on Papers under Permission To Work, shows any route there is.');
  });

  // Renamed on 2026-10-16 (inputs/renames.json): “gives Mexican temporary residence on the solvency test, and permanent
  // residence after four years” until then, when six months' income opened the route and the card was bought for
  // MXN 11,140.74 and US$56, renewed in its last 30 days, and settled after four years.
  it('refuses Mexican temporary residence with Mexico’s rule and why SLATE grants none, on savings or income alike; a card an older save holds (FIXTURE) isn’t renewed and runs to its end, and settling says its four years, then the same reason', () => {
    const sim = american('res-mx');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    // The words by hand: 11,460 UMA and 680 UMA at MXN 117.31, rounded to the peso.
    const words = 'Mexico grants temporary residence on savings of MXN 1,344,373 or an income of MXN 79,771 a month over six months, with the card at MXN 11,140.74 a year and the consulate’s visa at US$56. Moving abroad isn’t part of the game, so you can’t get Mexico’s papers here.';
    expect(routeRefusal(sim, sim.player, 'MX')).toBe(words);
    // Six months' income past 680 UMA a month, which opened the route until 2026-10-16: the same refusal.
    const d = new Date(sim.now);
    for (let i = 1; i <= 6; i += 1) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); earningsOf(sim.player).months[`${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, '0')}`] = inSave(sim, 80_000_00, 'MXN'); }
    expect(routeRefusal(sim, sim.player, 'MX')).toBe(words);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = inSave(sim, 50_000_00, 'MXN');
    const r = sim.execute<{ paid: number }>({ kind: 'documents.residence', payload: { country: 'MX' } });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(words);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(inSave(sim, 50_000_00, 'MXN'));
    expect(residenceIn(sim.player, 'MX', sim.now)).toBeUndefined();
    expect(residenceRefusal(sim.player, 'mx-cmx-mexicocity', sim.now)).toMatch(/needs permission to live there/);
    // FIXTURE: a card an older save bought, a year from today, ten days left on it.
    documentsOf(sim.player).push({ id: 'mx-card', kind: 'visa', issuer: 'MX', name: 'Residente Temporal', number: 'R1', status: 'valid', issuedAt: sim.now - 355 * MS_DAY, expiresAt: sim.now + 10 * MS_DAY, destination: 'MX', route: 'mx-temporary' });
    expect(routeRefusal(sim, sim.player, 'MX')).toBe('You hold residence there.');
    expect(residenceRefusal(sim.player, 'mx-cmx-mexicocity', sim.now)).toBeUndefined();
    const renew = sim.execute({ kind: 'documents.renew_residence', payload: { country: 'MX' } });
    expect(renew.error).toBe(MEXICO_RENEWAL);
    expect(MEXICO_RENEWAL).toBe('Mexico renews temporary residence a year at a time, in the card’s last 30 days, for MXN 11,140.74. Moving abroad isn’t part of the game, so you can’t get Mexico’s papers here.');
    expect(residenceIn(sim.player, 'MX', sim.now + 9 * MS_DAY)).toBeDefined();
    expect(residenceIn(sim.player, 'MX', sim.now + 11 * MS_DAY)).toBeUndefined();
    expect(settleRefusal(sim, sim.player, 'MX')).toMatch(/four years/);
    const card = residenceIn(sim.player, 'MX', sim.now)!;
    card.issuedAt! -= MEXICAN_RESIDENCE.permanentAfter * YEAR;
    expect(settleRefusal(sim, sim.player, 'MX')).toBe('Mexico grants permanent residence after four years of temporary residence, for MXN 13,578.96. Moving abroad isn’t part of the game, so you can’t get Mexico’s papers here.');
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'MX' } }).ok).toBe(false);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(inSave(sim, 50_000_00, 'MXN'));
  });
});
