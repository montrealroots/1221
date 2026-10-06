/**
 * The homes journey (the owner's audit of 2026-10-06): two lives run through
 * the Home page and the Homes screen by the same commands the screens run,
 * each step reading what the one before it left.
 *
 * A renter in New York leaves a shared room for a one-bedroom of their own,
 * the old deposit back and the new one held to the cent, and a second move
 * into the same kind refused with nothing charged. They pay February's rent
 * ahead, and on the day it's taken from what was paid ahead and not from the
 * bank. Spectrum chosen for the internet is what the bills charge, not the
 * Verizon the place came with; renters insurance is charged on the first and,
 * stopped, isn't the month after. A cleaner with a key comes weekly at the
 * town's price, and let go comes no more. A portable washer of their own
 * takes the laundry home, and with it the laundry room's price off the wash.
 * The post held and the hold ended; a sitter booked once, not twice for a
 * second press, and sent home. Saved and loaded with all of it standing; and
 * with the bank emptied, a sitter and the landlord both refused with nothing
 * taken.
 *
 * A buyer in Los Angeles offers on a house with a yard (pressed again, it's
 * off the market and nothing more is held), calls it off inside the
 * inspection for the earnest money back, offers again, and closes on a
 * mortgage. The first payment's interest, principal and escrow are what the
 * loan says; a payment by hand comes off the principal to the cent. Central
 * air fitted adds 72.1% of its cost to the value; a sofa and paint are bought;
 * a front door is renovated for California's capped deposit and the rest on
 * completion, and its value is added; a floor refinish canceled inside the
 * cooling-off is refunded whole and never finishes. A gardener keeps the lawn
 * at the town's price a cut. A lodger pays the room's rent on moving in and
 * monthly, and ended pays no more. Saved and loaded. Refinanced for 3% of the
 * balance; borrowed against. Moved out to a rented flat, the house let through
 * PMI Los Angeles for its fees, the lawn now the tenant's, so the gardener is
 * refused and paid nothing while it's let. The notice that a tenant moved in
 * marked read, once. Notice given; in February the return with the rent on it
 * is raised on Home and filed by its button; at the lease's end the tenant
 * goes and the rent with them. Moved back in, listed and taken off (nothing
 * closes on the day), listed again and sold, the loans paid off from the sale.
 *
 * Every law of the world holds at the end of each. Money comes into the bank
 * by a posting, never by setting a balance. Two things a quick save doesn't
 * have are written in for the buyer: the two years of income a lender reads,
 * as tests/homes.test.ts does, and their tax returns begun (`armTaxes`), as a
 * career's start begins them; without it a quick save's landlord is never
 * sent a return at all.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { depositFor, rentOf } from '@/engine/systems/household';
import { cleanerCost, homePlace, laundryCost, rentersPremium } from '@/engine/systems/dwelling';
import { telecomOf } from '@/engine/systems/telecom';
import { sitterFee } from '@/engine/systems/away';
import { CENTRAL_AIR_RECOVERED, applianceCost, portableCost } from '@/engine/systems/appliances';
import { HOME, askingPrice, equityRoom, homeById, homeValue, homesOf, listingsIn, livingIn, loanBalance, marketRent, owedOn, projectBids, worksDeposit } from '@/engine/systems/homes';
import { PROPERTY_MANAGERS } from '@/engine/content/propertymanagers';
import { lettingFee } from '@/engine/systems/propertymanagers';
import { armTaxes, returnsOf } from '@/engine/systems/taxreturn';
import { yearOf } from '@/engine/systems/earnings';
import { MOWN_CM, gardenerPrice, lawnOf } from '@/engine/systems/lawns';
import { roomRent } from '@/engine/systems/lodgers';
import { PROJECTS } from '@/engine/content/homes';
import { paintCatalog } from '@/engine/systems/paint';

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
/** Money in, as a gift posted against the opening balances, so the ledger still sums. */
const gift = (sim: Simulation, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
/** All their money out of the bank, as a posting. */
const emptyBank = (sim: Simulation) => {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    sim.post({ memo: 'Moved to a relative', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
  }
};
/** The transactions after a mark (`mark`) whose memo matches. */
const mark = (sim: Simulation) => sim.universe.transactions.length;
const posted = (sim: Simulation, re: RegExp, from = 0) => sim.universe.transactions.slice(from).filter((t) => re.test(t.memo));
/** What a transaction did to one account. */
const on = (t: { postings: { accountId: string; amount: number }[] }, id: string) => t.postings.filter((p) => p.accountId === id).reduce((a, p) => a + p.amount, 0);

describe('a renter in New York', () => {
  it('moves into a flat of their own, pays ahead, sets the place up, holds the post, books a sitter, and is refused when the bank is empty', () => {
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-homes-renter');
    const start = mark(sim);
    const me = sim.player.primaryAccountId!;
    expect(sim.player.home?.kind).toBe('shared');

    // A one-bedroom of their own: the shared room's deposit back, the new one held, and the rest of January paid.
    const oldDeposit = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'deposit')!;
    const back = oldDeposit.balance;
    const deposit = depositFor(sim, sim.player, 'own');
    let c0 = checking(sim);
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    expect(sim.player.home?.kind).toBe('own');
    expect(sim.player.home?.unit?.beds).toBe(1);
    const moving = posted(sim, /^Deposit and the rest of the month$/, start)[0]!;
    const rest = on(moving, sim.nominalAccount('expense', 'Rent').id);
    expect(rest).toBeGreaterThan(0);
    expect(oldDeposit.balance).toBe(deposit);
    expect(checking(sim)).toBe(c0 + back - deposit - rest);
    // Asked again, the same kind of home is refused and nothing moves.
    c0 = checking(sim);
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).error).toBe('You live in one already.');
    expect(checking(sim)).toBe(c0);

    // February's rent paid ahead, by hand; past what the account holds, refused with nothing taken.
    const rent = rentOf(sim, sim.player);
    sim.must({ kind: 'home.pay_landlord', payload: { amount: rent } });
    expect(checking(sim)).toBe(c0 - rent);
    expect(sim.player.payments?.rentCredit).toBe(rent);
    c0 = checking(sim);
    expect(sim.execute({ kind: 'home.pay_landlord', payload: { amount: c0 + 1 } }).ok).toBe(false);
    expect(checking(sim)).toBe(c0);

    // The internet from Spectrum, and not chosen twice.
    sim.must({ kind: 'home.internet', payload: { planId: 'spectrum-100-ny' } });
    expect(sim.execute({ kind: 'home.internet', payload: { planId: 'spectrum-100-ny' } }).error).toBe('You have it already.');
    // Renters insurance; a cleaner on Wednesdays, given a key.
    const premium = sim.must<{ premium: number }>({ kind: 'home.renters_insurance', payload: { on: true } }).premium;
    expect(premium).toBe(rentersPremium(sim, sim.player));
    const visit = sim.must<{ cost: number }>({ kind: 'home.cleaner', payload: { on: true, day: 3 } }).cost;
    expect(visit).toBe(cleanerCost(sim, sim.player));
    expect(sim.must<{ key: boolean }>({ kind: 'home.cleaner_key', payload: { give: true } }).key).toBe(true);

    // A portable washer of their own: the laundry room's price off the wash, and not bought twice.
    expect(homePlace(sim, sim.player)!.fixtures.laundry).toBe('building');
    // A twin of this life that doesn't buy one, for the falsifiability test.
    const twin = reload(sim);
    c0 = checking(sim);
    const washer = sim.must<{ cost: number }>({ kind: 'home.buy_portable', payload: { kind: 'washer' } }).cost;
    expect(washer).toBe(portableCost(sim, 'us-ny-newyork', 'washer'));
    expect(checking(sim)).toBe(c0 - washer);
    expect(homePlace(sim, sim.player)!.fixtures.laundry).toBe('washer-only');
    expect(sim.execute({ kind: 'home.buy_portable', payload: { kind: 'washer' } }).error).toBe('You have one.');
    expect(checking(sim)).toBe(c0 - washer);
    // The flat has its own cooling, so units of their own are refused.
    expect(sim.execute({ kind: 'home.buy_units', payload: {} }).error).toBe('Your home is cooled already.');
    // Four days of clothes worn: the twin's wash is priced at the laundry room, this one's is done at home for nothing.
    sim.advanceBy(4 * MS_DAY);
    twin.advanceBy(4 * MS_DAY);
    const without = laundryCost(twin, twin.player);
    const withWasher = laundryCost(sim, sim.player);
    expect(without.loads).toBeGreaterThan(0);
    expect(withWasher.loads).toBe(without.loads);
    expect(without.cost).toBeGreaterThan(0);
    expect(withWasher.cost).toBe(0);

    // Saved and loaded: all of it stands.
    sim = reload(sim);
    expect(sim.player.home?.kind).toBe('own');
    expect(sim.player.payments?.rentCredit).toBe(rent);
    expect(telecomOf(sim.player).internet?.planId).toBe('spectrum-100-ny');
    expect(sim.player.living?.rentersInsurance).toBe(true);
    expect(sim.player.living?.cleaner).toMatchObject({ day: 3, key: true });
    expect(sim.player.portables?.washer).toBeDefined();

    // Into February: the rent taken from what was paid ahead, the bills with Spectrum's line, the premium, and the cleaner weekly.
    const jan = mark(sim);
    sim.advanceBy(26 * MS_DAY);
    const feb = posted(sim, /./, jan);
    const ahead = feb.filter((t) => t.memo === 'Rent, paid ahead');
    expect(ahead).toHaveLength(1);
    expect(on(ahead[0]!, sim.nominalAccount('expense', 'Rent').id)).toBe(rent);
    expect(feb.filter((t) => t.memo === 'Rent' && on(t, me) < 0)).toEqual([]);
    expect(sim.player.payments?.rentCredit ?? 0).toBe(0);
    const internet = feb.filter((t) => /^Internet, /.test(t.memo));
    expect(internet.map((t) => t.memo)).toEqual(['Internet, Spectrum']);
    expect(feb.filter((t) => t.memo === 'Renters insurance').map((t) => on(t, me))).toEqual([-premium]);
    const cleans = feb.filter((t) => t.memo === 'The cleaner');
    expect(cleans.length).toBeGreaterThanOrEqual(3);
    expect(cleans.every((t) => on(t, me) === -visit)).toBe(true);

    // The cleaner let go and the insurance stopped: neither is charged in March.
    sim.must({ kind: 'home.cleaner', payload: { on: false } });
    sim.must({ kind: 'home.renters_insurance', payload: { on: false } });
    expect(sim.execute({ kind: 'home.cleaner_key', payload: { give: true } }).error).toBe('You have no cleaner.');
    const stopped = mark(sim);
    sim.advanceBy(30 * MS_DAY);
    expect(posted(sim, /^The cleaner$|^Renters insurance$/, stopped)).toEqual([]);

    // The post held for ten days and the hold ended early; ended twice, refused.
    sim.must({ kind: 'home.hold_mail', payload: { days: 10 } });
    expect(sim.player.mailHold).toBeDefined();
    sim.advanceBy(3 * MS_DAY);
    sim.must({ kind: 'home.end_hold', payload: {} });
    sim.advanceBy(2 * MS_DAY);
    expect(sim.execute({ kind: 'home.end_hold', payload: {} }).error).toBe('The post isn’t held.');

    // A sitter for three nights at the town's price; a second press isn't a second booking or a second charge.
    c0 = checking(sim);
    const sitter = sim.must<{ paid: number }>({ kind: 'home.sitter', payload: { nights: 3 } }).paid;
    expect(sitter).toBe(sitterFee(sim, sim.player, 3));
    expect(checking(sim)).toBe(c0 - sitter);
    expect(sim.execute({ kind: 'home.sitter', payload: { nights: 3 } }).error).toBe('A sitter’s already staying.');
    expect(checking(sim)).toBe(c0 - sitter);
    sim.must({ kind: 'home.end_sitter', payload: {} });
    expect(sim.execute({ kind: 'home.end_sitter', payload: {} }).error).toBe('No sitter’s staying.');

    // The bank emptied: a sitter and the landlord are both refused, and nothing is taken.
    emptyBank(sim);
    expect(checking(sim)).toBe(0);
    expect(sim.execute({ kind: 'home.sitter', payload: { nights: 2 } }).error).toMatch(/is more than the bank can cover\.$/);
    expect(sim.execute({ kind: 'home.pay_landlord', payload: { amount: 100_00 } }).ok).toBe(false);
    expect(checking(sim)).toBe(0);
    expect(sim.player.sitter!.until).toBeLessThanOrEqual(sim.now);
    gift(sim, 10_000_00);

    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});



describe('a buyer in Los Angeles', () => {
  it('offers, calls it off, buys, pays, fits, renovates, keeps a lawn and a lodger, refinances, borrows, lets, files, and sells', () => {
    let sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-homes-3');
    const start = mark(sim);
    const me = sim.player.primaryAccountId!;
    // Two years at $40,000 a month before the save begins, on the record a lender reads.
    const months: Record<string, number> = {};
    for (let n = 1; n <= 24; n += 1) { const d = new Date(Date.UTC(2026, -n, 15)); months[`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`] = 40_000_00; }
    sim.player.earnings = { years: {}, quarters: {}, equityWeeks: [], months, ukYears: {} } as never;
    // Their returns begun, as a career's start begins them (`beginCareer`); a quick save begins none.
    armTaxes(sim, sim.player);

    // A four-bedroom house with a yard, cooled by window units.
    const listing = listingsIn(sim, 'us-ca-losangeles').find((l) => l.type === 'house' && l.features.includes('yard') && l.fixtures?.cooling === 'units' && l.beds >= 3)!;
    expect(listing).toBeDefined();
    const price = askingPrice(sim, listing);
    gift(sim, price);

    // Offered on at its asking; pressed again, it's off the market and nothing more is held.
    let c0 = checking(sim);
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price, down: 0.2, live: true, inspect: true } }).answer).toBe('accepted');
    const earnest = Math.round(price * HOME.earnest);
    const escrow = sim.universe.accounts[sim.player.buying!.escrowAccountId]!;
    expect(escrow.balance).toBe(earnest);
    expect(checking(sim)).toBe(c0 - earnest);
    expect(sim.execute({ kind: 'home.offer', payload: { listingId: listing.id, price, down: 0.2, live: true, inspect: true } }).error).toBe('That home isn’t for sale any more.');
    expect(checking(sim)).toBe(c0 - earnest);
    // Called off inside the inspection: the earnest back, whole; called off twice, refused.
    sim.must({ kind: 'home.cancel', payload: {} });
    expect(checking(sim)).toBe(c0);
    expect(escrow.balance).toBe(0);
    expect(sim.player.buying).toBeUndefined();
    expect(sim.execute({ kind: 'home.cancel', payload: {} }).error).toBe('There’s no purchase under way to call off.');
    // Nothing closes on the day the canceled one would have.
    expect(sim.universe.scheduled.filter((s) => s.status === 'pending' && s.kind === 'home.closing')).toEqual([]);

    // Offered again, and closed thirty days on: the mortgage the price less a fifth down.
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price, down: 0.2, live: true, inspect: true } }).answer).toBe('accepted');
    sim.advanceBy((HOME.closingDays + 1) * MS_DAY);
    const house = homesOf(sim.player).find((h) => h.listingId === listing.id)!;
    expect(house).toBeDefined();
    expect(livingIn(sim.player)?.id).toBe(house.id);
    const down = Math.round(price * 0.2);
    expect(loanBalance(sim, house)).toBe(price - down);
    expect(posted(sim, /^Home inspection$/, start)).toHaveLength(1);
    expect(sim.universe.notifications.some((n) => n.title === 'The Keys Are Yours')).toBe(true);

    // The first payment on the first of the month: the interest on the balance, the rest off the principal, and the escrow beside it.
    const owed0 = loanBalance(sim, house);
    const m = house.mortgage!;
    for (let d = 0; d < 31 && posted(sim, /^Mortgage payment, /, start).length === 0; d += 1) sim.advanceBy(MS_DAY);
    const payment = posted(sim, /^Mortgage payment, /, start)[0]!;
    const interest = Math.round(owed0 * m.rate / 12);
    expect(on(payment, sim.nominalAccount('expense', 'Mortgage Interest').id)).toBe(interest);
    expect(on(payment, m.accountId)).toBe(m.payment - interest);
    const escrowed = on(payment, sim.nominalAccount('expense', 'Property Tax').id) + on(payment, sim.nominalAccount('expense', 'Home Insurance').id);
    expect(escrowed).toBeGreaterThan(0);
    expect(on(payment, me)).toBe(-(m.payment + escrowed));
    expect(loanBalance(sim, house)).toBe(owed0 - (m.payment - interest));

    // $10,000 paid down by hand, off the principal to the cent.
    let owed = loanBalance(sim, house);
    c0 = checking(sim);
    sim.must({ kind: 'home.pay_mortgage', payload: { homeId: house.id, amount: 10_000_00 } });
    expect(loanBalance(sim, house)).toBe(owed - 10_000_00);
    expect(checking(sim)).toBe(c0 - 10_000_00);

    // Central air in place of the units: the cooling changes, and 72.1% of its cost goes on the value.
    const v0 = homeValue(sim, house);
    c0 = checking(sim);
    const air = sim.must<{ cost: number }>({ kind: 'home.fit', payload: { homeId: house.id, kind: 'central-air' } }).cost;
    expect(air).toBe(applianceCost(sim, house.cityId, 'central-air'));
    expect(checking(sim)).toBe(c0 - air);
    expect(homePlace(sim, sim.player)!.fixtures.cooling).toBe('central');
    expect(Math.abs(homeValue(sim, house) - v0 - Math.round(air * CENTRAL_AIR_RECOVERED))).toBeLessThanOrEqual(1);
    expect(sim.execute({ kind: 'home.fit', payload: { homeId: house.id, kind: 'central-air' } }).error).toBe('It has one.');

    // A sofa delivered, and a can of paint put by for the repaint.
    c0 = checking(sim);
    const sofa = sim.must<{ paid: number }>({ kind: 'home.furnish', payload: { piece: 'sofa' } }).paid;
    expect(checking(sim)).toBe(c0 - sofa);
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'sofa' } }).error).toBe('You have one.');
    const can = paintCatalog(sim, sim.player)[0]!;
    c0 = checking(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.buy_paint', payload: { offerId: can.offer.id } }).paid).toBe(can.price);
    expect(checking(sim)).toBe(c0 - can.price);
    expect(house.painting!.liters).toBe(Number(can.product.attrs.liters));

    // A new front door: California's capped deposit now, with any permit, and the rest when it's done.
    const door = PROJECTS.find((p) => p.id === 'door-steel')!;
    const doorBid = projectBids(sim, house, door)[0]!;
    let since = mark(sim);
    c0 = checking(sim);
    const started = sim.must<{ doneAt: number; paid: number }>({ kind: 'home.renovate', payload: { homeId: house.id, projectId: 'door-steel' } });
    expect(started.paid).toBe(worksDeposit(house.cityId, doorBid, sim));
    expect(started.paid).toBeLessThan(doorBid);
    const permits = posted(sim, /./, since).reduce((a, t) => a + on(t, sim.nominalAccount('expense', 'Permits').id), 0);
    expect(checking(sim)).toBe(c0 - started.paid - permits);
    // A floor refinish begun and canceled inside the cooling-off: its deposit back, whole.
    const floors = PROJECTS.find((p) => p.id === 'floors-refinish')!;
    since = mark(sim);
    c0 = checking(sim);
    const refinish = sim.must<{ doneAt: number; paid: number }>({ kind: 'home.renovate', payload: { homeId: house.id, projectId: 'floors-refinish' } });
    const floorPermits = posted(sim, /./, since).reduce((a, t) => a + on(t, sim.nominalAccount('expense', 'Permits').id), 0);
    expect(sim.must<{ refunded: number }>({ kind: 'home.cancel_works', payload: { homeId: house.id, projectId: 'floors-refinish' } }).refunded).toBe(refinish.paid);
    expect(checking(sim)).toBe(c0 - floorPermits);
    expect(sim.execute({ kind: 'home.cancel_works', payload: { homeId: house.id, projectId: 'floors-refinish' } }).error).toBe('There’s no such work under way.');
    // The door done, however late it runs: the balance paid, and its worth on the value.
    const afterCancel = mark(sim);
    for (let d = 0; d < 60 && house.works.length > 0; d += 1) sim.advanceBy(MS_DAY);
    expect(house.works).toEqual([]);
    const doorDone = house.improvements.find((i) => i.projectId === 'door-steel')!;
    expect(doorDone.value).toBeGreaterThan(0);
    const balance = sim.universe.transactions.slice(afterCancel).filter((t) => t.memo.startsWith(`${door.label}, the balance, `));
    expect(balance.map((t) => on(t, me))).toEqual([-(doorBid - started.paid)]);
    const withoutDoor = homeValue(sim, { ...house, improvements: house.improvements.filter((i) => i !== doorDone) });
    expect(Math.abs(homeValue(sim, house) - withoutDoor - doorDone.value)).toBeLessThanOrEqual(Math.ceil(doorDone.value * 0.01));
    // The canceled refinish never finishes: past when it would have, nothing of it on the home or the bank.
    sim.advanceTo(Math.max(sim.now, refinish.doneAt) + 10 * MS_DAY);
    expect(house.improvements.some((i) => i.projectId === floors.id)).toBe(false);
    expect(sim.universe.transactions.slice(afterCancel).filter((t) => t.memo.startsWith(floors.label))).toEqual([]);

    // Into the growing season, a gardener: a cut a week at the town's price, the lawn kept short.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 4, day: 6, hour: 12 }, 'America/Los_Angeles'));
    expect(sim.must<{ on: boolean }>({ kind: 'home.gardener', payload: { homeId: house.id, on: true } }).on).toBe(true);
    since = mark(sim);
    sim.advanceBy(28 * MS_DAY);
    const cuts = posted(sim, /, the lawn$/, since);
    expect(cuts.length).toBeGreaterThanOrEqual(4);
    expect(cuts.every((t) => on(t, me) === -gardenerPrice(sim, house.cityId))).toBe(true);
    expect(lawnOf(house)!.cm).toBeLessThan(MOWN_CM + 1.01);

    // A lodger in a spare bedroom: the room's rent on moving in, and each month after.
    c0 = checking(sim);
    const room = sim.must<{ rent: number }>({ kind: 'home.take_lodger', payload: { homeId: house.id } }).rent;
    expect(room).toBe(roomRent(sim, house.cityId));
    expect(checking(sim)).toBe(c0 + room);
    since = mark(sim);
    sim.advanceBy(31 * MS_DAY);
    expect(posted(sim, /^A lodger’s rent, /, since).map((t) => on(t, me))).toEqual([room]);

    // Saved and loaded: the home, its loan, its lodger, its lawn and its gardener stand.
    const owedBefore = loanBalance(sim, house);
    sim = reload(sim);
    const home = homeById(sim.player, house.id)!;
    expect(livingIn(sim.player)?.id).toBe(home.id);
    expect(loanBalance(sim, home)).toBe(owedBefore);
    expect(home.lodgers).toHaveLength(1);
    expect(lawnOf(home)!.gardener).toBe(true);
    expect(home.improvements.some((i) => i.projectId === 'door-steel')).toBe(true);

    // The lodger leaves: past two months, no more of the room's rent.
    expect(sim.must<{ left: number }>({ kind: 'home.end_lodger', payload: { homeId: home.id } }).left).toBe(0);
    expect(sim.execute({ kind: 'home.end_lodger', payload: { homeId: home.id } }).error).toBe('No lodger lives there.');
    since = mark(sim);
    sim.advanceBy(65 * MS_DAY);
    expect(posted(sim, /^A lodger’s rent, /, since)).toEqual([]);

    // Refinanced: the balance moved to a new loan, the old one closed, and 3% of it in closing costs.
    owed = loanBalance(sim, home);
    const oldLoan = home.mortgage!.accountId;
    c0 = checking(sim);
    sim.must({ kind: 'home.refinance', payload: { homeId: home.id } });
    expect(home.mortgage!.accountId).not.toBe(oldLoan);
    expect(sim.universe.accounts[oldLoan]!.balance).toBe(0);
    expect(sim.universe.accounts[oldLoan]!.closedAt).toBe(sim.now);
    expect(loanBalance(sim, home)).toBe(owed);
    expect(checking(sim)).toBe(c0 - Math.round(owed * HOME.refinanceCost));

    // Borrowed against: $30,000 into the bank, owed on a home equity loan, and paid monthly.
    expect(equityRoom(sim, home)).toBeGreaterThanOrEqual(30_000_00);
    c0 = checking(sim);
    sim.must({ kind: 'home.borrow', payload: { homeId: home.id, amount: 30_000_00 } });
    expect(checking(sim)).toBe(c0 + 30_000_00);
    expect(owedOn(sim, home.equity)).toBe(30_000_00);
    expect(sim.execute({ kind: 'home.borrow', payload: { homeId: home.id, amount: 10_000_00 } }).error).toBe('There’s a home equity loan on it already.');
    sim.advanceBy(31 * MS_DAY);
    expect(owedOn(sim, home.equity)).toBeLessThan(30_000_00);

    // Moved out to a rented flat, the house left empty; an agent takes it on, and it's let at the market's rent.
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    expect(livingIn(sim.player)).toBeUndefined();
    expect(sim.must<{ manager?: string }>({ kind: 'home.manager', payload: { homeId: home.id, on: true } }).manager).toBe('pmi-los-angeles');
    const rent = marketRent(sim, home, 'main');
    sim.must({ kind: 'home.let', payload: { homeId: home.id, rent } });
    expect(sim.execute({ kind: 'home.let', payload: { homeId: home.id, rent } }).error).toBe('It’s let or offered already.');
    since = mark(sim);
    for (let d = 0; d < 90 && home.tenancies[0]!.status !== 'let'; d += 1) sim.advanceBy(MS_DAY);
    const tenancy = home.tenancies[0]!;
    expect(tenancy.status).toBe('let');
    const letIn = mark(sim);
    const agent = PROPERTY_MANAGERS.find((x) => x.id === 'pmi-los-angeles')!;
    expect(posted(sim, /^A tenant’s deposit$/, since).map((t) => on(t, me))).toEqual([rent]);
    expect(sim.universe.accounts[tenancy.depositAccountId!]!.balance).toBe(-rent);
    expect(posted(sim, /^PMI Los Angeles, letting it, /, since).map((t) => on(t, me))).toEqual([-lettingFee(sim, agent, tenancy)]);
    // The lawn is the tenant's now: the gardener can't be asked, and isn't paid.
    expect(lawnOf(home)).toBeUndefined();
    expect(sim.execute({ kind: 'home.gardener', payload: { homeId: home.id, on: true } }).error).toBe('It has no lawn of yours to keep.');
    // The notice that the tenant moved in, marked read once, and not again.
    const moved = sim.universe.notifications.find((n) => n.title === 'A Tenant Moved In')!;
    expect(moved.read).toBeFalsy();
    expect(sim.must<{ read: number }>({ kind: 'world.mark_read', payload: { notificationIds: [moved.id] } }).read).toBe(1);
    expect(moved.read).toBe(true);
    expect(sim.must<{ read: number }>({ kind: 'world.mark_read', payload: { notificationIds: [moved.id] } }).read).toBe(0);
    expect(sim.universe.notifications.filter((n) => n.id !== moved.id).some((n) => !n.read)).toBe(true);

    // Notice given: the tenant stays to the lease's end.
    const letAt = mark(sim);
    expect(sim.must<{ ends: number }>({ kind: 'home.end_tenancy', payload: { homeId: home.id } }).ends).toBe(tenancy.leaseEnds);
    // February: the year's return, with the rent on it, raised on Home and filed by its button.
    sim.advanceTo(instantFromZoned({ year: 2027, month: 2, day: 2, hour: 12 }, 'America/Los_Angeles'));
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'return' && d.refId === '2026')!;
    expect(decision).toBeDefined();
    expect(decision.resolvedAt).toBeUndefined();
    expect(sim.must<{ ok: boolean }>({ kind: 'world.take_decision_action', payload: { decisionId: decision.id, actionIndex: 0 } }).ok).toBe(true);
    expect(decision.resolvedAt).toBe(sim.now);
    expect(returnsOf(sim.player)['2026']!.filedAt).toBe(sim.now);
    // The rent and the lodger's rent are on it, set against the house's costs and its depreciation.
    expect(yearOf(sim.player, 2026).rentalRent ?? 0).toBeGreaterThanOrEqual(room * 2 + rent);
    expect(returnsOf(sim.player)['2026']!.figures.income).not.toBe(0);
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: decision.id, actionIndex: 0 } }).ok).toBe(false);

    // To the lease's end: the rent each month with the agent's fee, and no gardener; then the tenant gone and the rent with them.
    const leaseEnds = tenancy.leaseEnds!;
    sim.advanceTo(leaseEnds + 2 * MS_DAY);
    expect(home.tenancies).toEqual([]);
    const rents = posted(sim, new RegExp(`^Rent, ${home.facts.address}$`), letAt);
    expect(rents.length).toBeGreaterThanOrEqual(10);
    expect(rents.every((t) => on(t, me) === rent)).toBe(true);
    expect(posted(sim, /^PMI Los Angeles, managing it, /, letAt).length).toBe(rents.length);
    // No gardener while it was let.
    expect(posted(sim, /, the lawn$/, letIn).filter((t) => t.at < leaseEnds)).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Tenant Moved Out')).toBe(true);
    const gone = mark(sim);
    sim.advanceBy(40 * MS_DAY);
    expect(posted(sim, new RegExp(`^Rent, ${home.facts.address}$`), gone)).toEqual([]);

    // Moved back in: the flat's lease ended, the house theirs to live in again.
    sim.must({ kind: 'home.move_in', payload: { homeId: home.id } });
    expect(livingIn(sim.player)?.id).toBe(home.id);
    expect(sim.execute({ kind: 'home.move_in', payload: { homeId: home.id } }).error).toBe('You live in it.');

    // Listed, and taken off: past the day it would have closed, still theirs.
    const listed = sim.must<{ closesAt: number }>({ kind: 'home.sell', payload: { homeId: home.id, then: 'own' } });
    sim.must({ kind: 'home.cancel', payload: { homeId: home.id } });
    expect(sim.execute({ kind: 'home.cancel', payload: { homeId: home.id } }).error).toBe('It isn’t listed.');
    sim.advanceTo(listed.closesAt + 2 * MS_DAY);
    expect(homeById(sim.player, home.id)).toBeDefined();
    expect(livingIn(sim.player)?.id).toBe(home.id);

    // Listed again and sold: the mortgage and the equity loan paid off from it, the rest to the bank, and a flat rented after.
    const mortgage = home.mortgage!.accountId;
    const equity = home.equity!.accountId;
    const sale = sim.must<{ closesAt: number }>({ kind: 'home.sell', payload: { homeId: home.id, then: 'own' } });
    const selling = mark(sim);
    sim.advanceTo(sale.closesAt + MS_DAY);
    expect(homesOf(sim.player)).toEqual([]);
    expect(sim.player.home?.kind).toBe('own');
    expect(sim.universe.accounts[mortgage]!.balance).toBe(0);
    expect(sim.universe.accounts[equity]!.balance).toBe(0);
    expect(sim.universe.accounts[mortgage]!.closedAt).toBeDefined();
    const sold = posted(sim, new RegExp(`^Sold ${home.facts.address}$`), selling);
    expect(sold).toHaveLength(1);
    expect(on(sold[0]!, me)).toBeGreaterThan(0);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Home Is Sold')).toBe(true);

    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});
