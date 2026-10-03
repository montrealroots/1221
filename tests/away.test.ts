/**
 * A home kept while it's empty (`systems/away.ts`, from 2026-10-03): the
 * post held, and a house sitter, each changing what reaches the door.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { MAIL_HOLDS } from '@/engine/content/away';
import { holdQuote, someoneHome } from '@/engine/systems/away';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';
import { PARCEL_THEFT, ordersOf, placeOrder } from '@/engine/systems/orders';
import { cleanerGetsIn } from '@/engine/systems/dwelling';
import { inSaveMoney } from '@/engine/systems/banking';
import { documentsOf, licenseOf } from '@/engine/systems/documents';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const parcel = (sim: ReturnType<typeof life>, at: number, label: string) => placeOrder(sim, sim.player, { from: 'A Shop', arrivesAt: at, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, paid: 10_00 }, [{ kind: 'custom', label, quantity: 1, condition: 1 }]);
const withTheft = <T>(country: string, rate: number, f: () => T): T => {
  const was = PARCEL_THEFT[country];
  (PARCEL_THEFT as Record<string, number>)[country] = rate;
  try { return f(); } finally { if (was === undefined) delete (PARCEL_THEFT as Record<string, number>)[country]; else (PARCEL_THEFT as Record<string, number>)[country] = was; }
};

describe('the post held', () => {
  it('costs what each post charges: Canada Post by the weekdays in it, An Post by the weeks', () => {
    expect(MAIL_HOLDS.ca!.fee(14, 10)).toBe(24.25);
    expect(MAIL_HOLDS.ca!.fee(7, 5)).toBe(24.25);
    expect(MAIL_HOLDS.ca!.fee(21, 15)).toBe(36.25);
    expect(MAIL_HOLDS.ca!.fee(22, 16)).toBe(48.25);
    expect([MAIL_HOLDS.ie!.fee(27, 0), MAIL_HOLDS.ie!.fee(28, 0), MAIL_HOLDS.ie!.fee(57, 0)]).toEqual([14, 19, 24]);
    expect(MAIL_HOLDS.us!.fee(30, 22)).toBe(0);
  });

  it('is refused where there is none, and outside a post’s days', () => {
    const mx = life('mx-cmx-mexicocity', 'hold-mx');
    expect(mx.execute({ kind: 'home.hold_mail', payload: { days: 10 } }).error).toBe('Correos de México doesn’t hold a home’s delivery.');
    const ny = life('us-ny-newyork', 'hold-days');
    expect(ny.execute({ kind: 'home.hold_mail', payload: { days: 2 } }).error).toBe('USPS Hold Mail holds 3 days at the least.');
    expect(ny.execute({ kind: 'home.hold_mail', payload: { days: 31 } }).error).toBe('USPS Hold Mail holds 30 days at the most.');
  });

  it('keeps a parcel in America to its last day, where nobody takes it from the door', () => {
    const sim = life('us-ny-newyork', 'hold-ny');
    const p = sim.player;
    const h = sim.must<{ from: number; releaseAt: number; paid: number }>({ kind: 'home.hold_mail', payload: { days: 10 } });
    expect(h.paid).toBe(0);
    // Delivered on the hold's last day.
    expect(zonedParts(h.releaseAt, sim.zone).day).toBe(zonedParts(h.from + 9 * MS_DAY + 12 * MS_HOUR, sim.zone).day);
    expect(sim.execute({ kind: 'home.hold_mail', payload: { days: 5 } }).error).toMatch(/^The post’s already held, to /);
    // Before it begins, a parcel comes as ever.
    const before = parcel(sim, h.from - MS_HOUR, 'Before');
    sim.advanceTo(h.from - MS_HOUR / 2);
    expect(ordersOf(p).find((o) => o.id === before.id)!.status).toBe('delivered');
    p.currentLocationId = 'uk-eng-london';
    const order = parcel(sim, h.from + 2 * MS_DAY, 'Held Thing');
    withTheft('us', 1, () => sim.advanceTo(h.from + 3 * MS_DAY));
    expect(ordersOf(p).find((o) => o.id === order.id)!.status).toBe('placed');
    p.currentLocationId = 'us-ny-newyork';
    withTheft('us', 1, () => sim.advanceTo(h.releaseAt + MS_HOUR));
    expect(ordersOf(p).find((o) => o.id === order.id)!.status).toBe('delivered');
    expect(itemsOf(p).find((i) => i.label === 'Held Thing')!.at.kind).toBe('home');
    expect(sim.execute({ kind: 'home.end_hold', payload: {} }).error).toBe('The post isn’t held.');
  });

  it('in Canada costs C$24.25 at least, starts after three business days, and lets parcels through', () => {
    const sim = life('ca-on-toronto', 'hold-ca');
    const p = sim.player;
    const q = holdQuote(sim, p, 7)!;
    expect(q.fee).toBe(inSaveMoney(sim, 24_25, 'CAD'));
    // Three weeks are fifteen weekdays: C$12 for the five past ten.
    expect(holdQuote(sim, p, 21)!.fee).toBe(inSaveMoney(sim, 36_25, 'CAD'));
    expect(q.from - sim.now).toBeGreaterThan(3 * MS_DAY);
    sim.must({ kind: 'home.hold_mail', payload: { days: 7 } });
    const order = parcel(sim, q.from + MS_DAY, 'Through');
    sim.advanceTo(q.from + 2 * MS_DAY);
    expect(ordersOf(p).find((o) => o.id === order.id)!.status).toBe('delivered');
  });

  it('ended early, gives back what it kept the next day', () => {
    const sim = life('us-ny-newyork', 'hold-end');
    const p = sim.player;
    const h = sim.must<{ from: number; releaseAt: number }>({ kind: 'home.hold_mail', payload: { days: 20 } });
    const order = parcel(sim, h.from + MS_DAY, 'Early');
    sim.advanceTo(h.from + 2 * MS_DAY);
    expect(ordersOf(p).find((o) => o.id === order.id)!.status).toBe('placed');
    const r = sim.must<{ releaseAt: number }>({ kind: 'home.end_hold', payload: {} });
    expect(r.releaseAt).toBeLessThan(sim.now + 2 * MS_DAY);
    sim.advanceTo(r.releaseAt + MS_HOUR);
    expect(ordersOf(p).find((o) => o.id === order.id)!.status).toBe('delivered');
  });
});

describe('a card in the post', () => {
  it('waits for the hold: a replaced license in California comes when the post does', () => {
    const sim = life('us-ca-losangeles', 'hold-card');
    const p = sim.player;
    documentsOf(p).splice(0, documentsOf(p).length, ...documentsOf(p).filter((d) => d.kind !== 'license'));
    documentsOf(p).push({ id: 'lic', kind: 'license', issuer: 'us-ca', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 1500 * MS_DAY });
    const h = sim.must<{ releaseAt: number }>({ kind: 'home.hold_mail', payload: { days: 30 } });
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'lic' } });
    const r = sim.must<{ readyAt: number }>({ kind: 'documents.replace_license', payload: { documentId: 'lic' } });
    expect(r.readyAt).toBeLessThan(h.releaseAt);
    sim.advanceTo(r.readyAt + MS_DAY);
    expect(licenseOf(p, sim.now)).toBeUndefined();
    sim.advanceTo(h.releaseAt + MS_HOUR);
    expect(licenseOf(p, sim.now)).toBeDefined();
  });

  it('waits for the hold: a replaced ID card in New York', () => {
    const sim = life('us-ny-newyork', 'hold-idcard');
    const p = sim.player;
    documentsOf(p).push({ id: 'idc', kind: 'idcard', issuer: 'us-ny', name: 'ID Card', number: 'I1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3e11 });
    const h = sim.must<{ releaseAt: number }>({ kind: 'home.hold_mail', payload: { days: 30 } });
    sim.must({ kind: 'documents.report_lost', payload: { documentId: 'idc' } });
    const r = sim.must<{ readyAt: number }>({ kind: 'documents.replace_idcard', payload: { documentId: 'idc' } });
    const fresh = documentsOf(p).find((d) => d.kind === 'idcard' && d.status === 'pending')!;
    sim.advanceTo(r.readyAt + MS_DAY);
    expect(fresh.status).toBe('pending');
    sim.advanceTo(h.releaseAt + MS_HOUR);
    expect(fresh.status).toBe('valid');
  });
});

describe('a house sitter', () => {
  it('is paid by the night at the town’s price, and refused where none is published', () => {
    const sim = life('us-ny-newyork', 'sitter-ny');
    const r = sim.must<{ paid: number }>({ kind: 'home.sitter', payload: { nights: 3 } });
    expect(r.paid).toBe(inSaveMoney(sim, 65_96, 'USD') * 3);
    expect(sim.execute({ kind: 'home.sitter', payload: { nights: 1 } }).error).toBe('A sitter’s already staying.');
    const dub = life('ie-lei-dublin', 'sitter-ie');
    expect(dub.execute({ kind: 'home.sitter', payload: { nights: 3 } }).error).toBe('No sitter’s nightly price is published for Dublin.');
  });

  it('is somebody home: the parcel taken in, the cleaner let in, while you’re away', () => {
    const sim = life('us-ny-newyork', 'sitter-home');
    const p = sim.player;
    sim.must({ kind: 'home.cleaner', payload: { on: true } });
    p.currentLocationId = 'uk-eng-london';
    expect(someoneHome(sim, p, sim.now, sim.now)).toBe(false);
    expect(cleanerGetsIn(sim, p, sim.now + MS_DAY)).toBe(false);
    sim.must({ kind: 'home.sitter', payload: { nights: 5 } });
    expect(someoneHome(sim, p, sim.now, sim.now + MS_HOUR)).toBe(true);
    // Not before they came.
    expect(someoneHome(sim, p, sim.now - MS_HOUR, sim.now)).toBe(false);
    expect(cleanerGetsIn(sim, p, sim.now)).toBe(true);
    const kept = parcel(sim, sim.now + MS_DAY, 'Taken In');
    withTheft('us', 1, () => sim.advanceTo(sim.now + 2 * MS_DAY));
    expect(ordersOf(p).find((o) => o.id === kept.id)!.stolen).toBeUndefined();
    // Gone, and nobody's home again.
    sim.must({ kind: 'home.end_sitter', payload: {} });
    const left = parcel(sim, sim.now + MS_DAY, 'Left Out');
    withTheft('us', 1, () => sim.advanceTo(sim.now + 2 * MS_DAY));
    expect(ordersOf(p).find((o) => o.id === left.id)!.stolen).toBe(true);
  });
});
