/**
 * The holdings journey (the owner's audit of 2026-10-06): lives run through
 * what they own and hold, the Land screen, Home, Belongings, Vehicles, Your
 * Bank, People and the guide, by the same commands those screens run, each
 * step reading what the one before it left.
 *
 * - **Farmland upstate**: an offer at the asking price, its deposit and
 *   searches paid, walked away from inside the thirty days for the deposit
 *   back; offered again and closed on at the quote. Let to a farmer, a year's
 *   rent ahead and the next a year on; the lease ended at its year's end and
 *   no rent after. Split for the town's fee, joined again, and sold after the
 *   days land takes, for its value less the seller's tax.
 * - **A flat of one's own in New York**: a shared room's locks refused as the
 *   landlord's; moved into a flat, an alarm fitted, its monitoring charged on
 *   the first and the renter's premium cut 5%, then switched off and charged no
 *   more; window locks and timers at The Home Depot's price with the tax. A bed
 *   bought, its mattress worn out (set back six years) and replaced, and the
 *   night better by what a worn one cost. A portable washer broken, its repair
 *   booked at Angi's price, and washing at home again the morning after. A
 *   computer and a speaker, each what a games lover and a music lover unwind
 *   with. Moved out in a rented U-Haul at its price, the locks left behind;
 *   back by the movers at theirs.
 * - **A friend's meal**: asked, said yes to, and paid for at its price.
 * - **A house with a charger**: fitted at the place's price; an electric car
 *   charged three-quarters at home costs less than its twin's at the public
 *   chargers.
 * - **Winter tires in Toronto**: a set at Discount Tire's middle, and the car
 *   insurance 3.5% less the next month.
 * - **IKEA in London**: a BILLY put together by hand and sold back for the
 *   Family member's tier, the credit spent on the next piece.
 * - **Banking in New York**: Bank of America's round-ups, the change on each
 *   day's groceries moved into savings each night; switched to Chase, the
 *   accounts and the standing order moved with it, round-ups refused there; a
 *   plan on the card for its fee.
 * - **A NatWest card**: a money transfer at 3% and the transfer rate; then a
 *   hardship plan: the interest frozen and the payment that clears it in four
 *   years taken on the due day.
 * - **An overrun in Paris**: three months past the limit, BNP Paribas offers
 *   the loan the law has it offer, and it's taken.
 * - **The guide and the Decision Center**: chapters read in order; the clock
 *   started once "The Clock" is read; a notice that the bank will hand an
 *   account to the state, dismissed, and the money handed over anyway.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance; money comes and goes by postings. What is set directly is said
 * where it's set: a house owned (buying one is `journey-homes`), a license to
 * drive, a mattress's years, a machine's breakdown and an account's untouched
 * years, which the day's draws and the calendar bring when they bring them;
 * and the interests a life loves, with the console and speaker a quick save
 * may hold taken away so that what's bought is what's read. Five things the
 * game gets wrong are kept apart at the end, skipped, as defects: a financed
 * parcel split into two halves that each owe the whole loan; a financed parcel
 * joined to another and its loan dropped; a piece bought with IKEA credit sold
 * back on what the bank paid, not its price; a time speed that isn't one
 * saved; and a question dismissed twice, its day moved.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { LAND_DEAL, LAND_MARKETS, LAND_SEARCHES, SPLIT_FEES, DAYS_TO_SELL } from '@/engine/content/land';
import { HOME_CHARGING_SHARE } from '@/engine/content/evcatalog';
import { WORN_NIGHT } from '@/engine/content/furniture';
import { CHAPTERS } from '@/engine/content/tutorial';
import { homeOf } from '@/engine/systems/earnings';
import { landQuote, landValue, listingsFor, parcelsOf, saleProceeds } from '@/engine/systems/land';
import { yearRent } from '@/engine/systems/landlease';
import { alarmed } from '@/engine/systems/alarm';
import { devicesOf, securityFactor } from '@/engine/systems/homesecurity';
import { rentersPremium, homePlace } from '@/engine/systems/dwelling';
import { chargerQuote, homeShareOf } from '@/engine/systems/charging';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { bedAtHome, mattressCost, mattressWorn, moversCost, owns, truckFor } from '@/engine/systems/furniture';
import { sleepQuality } from '@/engine/systems/life';
import { REPAIRS, faultsOf, machinesDay } from '@/engine/systems/appliancefaults';
import { buybackShare, pieceById } from '@/engine/systems/furnishings';
import { itemsOf } from '@/engine/systems/items';
import { computerCatalog, computerForGames } from '@/engine/systems/computers';
import { speakerCatalog } from '@/engine/systems/speakers';
import { COMPUTER_PRODUCTS } from '@/engine/content/computercatalog';
import { lovedIn } from '@/engine/systems/enjoyment';
import { documentsOf } from '@/engine/systems/documents';
import { monthKm, upkeepCost, vehiclesOf } from '@/engine/systems/vehicles';
import { everydayFuel } from '@/engine/systems/fueltank';
import { WINTER_TIRES, tireFactor, tiresRefusal } from '@/engine/systems/tires';
import { roundUpOf, idleAccounts } from '@/engine/systems/accountlife';
import { bankAccountsOf } from '@/engine/systems/banking';
import { paymentsOf } from '@/engine/systems/payments';
import { FRANCE, monthlyPayment } from '@/engine/systems/lending';
import { STATEMENT_KIND, DUE_KIND, cardOf, cardTerms, stateOf } from '@/engine/systems/credit';
import { planRoom } from '@/engine/systems/cardoffers';
import { contactsOf, knowTheClass, type Contact } from '@/engine/systems/people';
import { diningQuote, restaurantById } from '@/engine/systems/dining';
import { READ_KIND, nextChapter } from '@/engine/world/tutorial';

const NY = 'us-ny-newyork';
const YEAR = 365.2425 * MS_DAY;

const life = (seed: string, city = NY, extra: Record<string, unknown> = {}) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy', ...extra }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** A published figure in cents, in the save's money. */
const inSave = (sim: Simulation, cents: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur)!; };
const memo = (sim: Simulation, m: string | RegExp, since = 0) => sim.universe.transactions.filter((t) => t.at >= since && (typeof m === 'string' ? t.memo === m : m.test(t.memo)));
/** What a transaction put into the life's own accounts, or took out of them. */
const into = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id && !sim.universe.accounts[p.accountId]?.nominal).reduce((s, p) => s + p.amount, 0);
/** What a transaction did to one account. */
const on = (t: { postings: { accountId: string; amount: number }[] }, id: string) => t.postings.filter((p) => p.accountId === id).reduce((a, p) => a + p.amount, 0);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** Money arriving the way it arrives: a posting against the opening balances, never a balance typed in. */
const gift = (sim: Simulation, accountId: string, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
/** A license to drive where they live: the papers a life begins with, made known. */
const licensed = (sim: Simulation, issuer: string) => documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 10 * YEAR });

describe('farmland upstate', () => {
  it('offers, walks away for the deposit back, buys at the quote, lets it, ends the lease, splits, joins and sells it', () => {
    let sim = life('jhold-land');
    const p = () => sim.player;
    const listing = listingsFor(sim, p(), homeOf(p())).filter((l) => LAND_MARKETS[l.market]!.label === 'Farmland Upstate').sort((a, b) => a.acres - b.acres)[0]!;
    const m = LAND_MARKETS[listing.market]!;
    expect(m.place).toBe('ny-state');
    const deposit = Math.round(listing.asking * LAND_DEAL.deposit['ny-state'].share);
    const searches = LAND_SEARCHES['ny-state']!.reduce((a, s) => a + s.amount * 100, 0);
    expect(searches).toBe(100_00);
    expect(sim.execute({ kind: 'land.withdraw', payload: {} }).error).toBe('You have no offer accepted.');

    // At the asking price it's always accepted: the deposit and the percolation test's application, from the bank.
    let b0 = banked(sim);
    expect(sim.must<{ answer: string }>({ kind: 'land.offer', payload: { listingId: listing.id, price: listing.asking } }).answer).toBe('accepted');
    expect(b0 - banked(sim)).toBe(deposit + searches);
    const escrow = sim.universe.accounts[p().landBuying!.deal!.escrowAccountId!]!;
    expect(escrow.balance).toBe(deposit);
    // Walked away inside the thirty days: the deposit back, the searches not.
    sim.advanceBy(10 * MS_DAY);
    b0 = banked(sim);
    expect(sim.must<{ depositBack: boolean }>({ kind: 'land.withdraw', payload: {} }).depositBack).toBe(true);
    expect(banked(sim) - b0).toBe(deposit);
    expect(escrow.closedAt).toBe(sim.now);
    expect(sim.execute({ kind: 'land.withdraw', payload: {} }).error).toBe('You have no offer accepted.');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && (i.kind === 'land.exchange' || i.kind === 'land.closing'))).toBe(false);

    // Offered again, and closed on the forty-fifth day: all the buying cost, the quote's total to the cent.
    const quote = landQuote(listing.market, listing.acres, sim.now, listing.asking);
    const since = sim.now;
    sim.must({ kind: 'land.offer', payload: { listingId: listing.id, price: listing.asking } });
    const closesAt = p().landBuying!.deal!.closesAt;
    expect(closesAt).toBe(sim.now + LAND_DEAL.closingDays * MS_DAY);
    sim.advanceTo(closesAt + MS_HOUR);
    const parcel = parcelsOf(p()).find((x) => x.listingId === listing.id)!;
    expect(parcel).toMatchObject({ market: listing.market, acres: listing.acres, paid: listing.asking });
    expect(memo(sim, /.*/, since).filter((t) => t.category === 'land').reduce((a, t) => a + into(sim, t), 0)).toBe(-quote.total);
    expect(titled(sim, 'Land Bought')).toHaveLength(1);
    expect(p().landBuying!.deal).toBeUndefined();

    // Let to a farmer: NASS's $83.50 an acre, a year ahead, into the bank whole (Schedule E takes it at the return).
    const rentMemo = 'A year’s farm rent, Farmland Upstate';
    const rent = sim.must<{ rent: number }>({ kind: 'land.lease_out', payload: { parcelId: parcel.id } }).rent;
    expect(rent).toBe(Math.round(83.5 * listing.acres * 100));
    expect(rent).toBe(yearRent(parcel, sim.now));
    expect(memo(sim, rentMemo).map((t) => into(sim, t))).toEqual([rent]);
    const letAt = sim.now;
    expect(sim.execute({ kind: 'land.lease_out', payload: { parcelId: parcel.id } }).error).toBe('It’s let already.');
    expect(sim.execute({ kind: 'land.lease_out', payload: { parcelId: 'nowhere' } }).error).toBe('That isn’t land you own.');
    expect(sim.execute({ kind: 'land.split', payload: { parcelId: parcel.id } }).error).toBe('It’s let to a farmer: end the lease first.');
    expect(sim.execute({ kind: 'land.end_lease', payload: { parcelId: 'nowhere' } }).error).toBe('It isn’t let.');

    sim = reload(sim);
    expect(parcelsOf(p())[0]!.lease).toEqual({ since: letAt });
    expect(breaches(sim.universe)).toEqual([]);
    // A year on, the next year's rent.
    sim.advanceTo(letAt + YEAR + MS_HOUR);
    expect(memo(sim, rentMemo).map((t) => [t.at - letAt, into(sim, t)])).toEqual([[0, rent], [Math.round(YEAR), rent]]);
    // Ended: at the end of the year paid for, and nothing after.
    const ends = sim.must<{ endsAt: number }>({ kind: 'land.end_lease', payload: { parcelId: parcel.id } }).endsAt;
    expect(ends).toBe(letAt + 2 * YEAR);
    expect(sim.execute({ kind: 'land.end_lease', payload: { parcelId: parcel.id } }).error).toBe('It ends at the year’s end already.');
    sim.advanceTo(ends + MS_DAY);
    expect(memo(sim, rentMemo)).toHaveLength(2);
    expect(parcelsOf(p())[0]!.lease).toBeUndefined();
    expect(titled(sim, 'The Farm Lease Ended')).toHaveLength(1);

    // Split for New York's fee, each half its share of the price; joined again into the one parcel.
    const own = parcelsOf(p())[0]!;
    b0 = banked(sim);
    const parts = sim.must<{ parts: string[] }>({ kind: 'land.split', payload: { parcelId: own.id } }).parts;
    expect(b0 - banked(sim)).toBe(SPLIT_FEES['ny-state']! * 100);
    expect(memo(sim, 'Splitting Farmland Upstate, the authority’s fee')).toHaveLength(1);
    const [a, b] = parts.map((id) => parcelsOf(p()).find((x) => x.id === id)!);
    expect([a!.acres, b!.acres]).toEqual([listing.acres / 2, listing.acres / 2]);
    expect(a!.paid + b!.paid).toBe(listing.asking);
    expect(sim.execute({ kind: 'land.combine', payload: { a: a!.id, b: a!.id } }).error).toBe('Two parcels you own, neither for sale.');
    expect(sim.must<{ parcelId: string }>({ kind: 'land.combine', payload: { a: a!.id, b: b!.id } }).parcelId).toBe(a!.id);
    expect(a).toMatchObject({ acres: listing.acres, paid: listing.asking });
    expect(b!.soldAt).toBe(sim.now);
    expect(parcelsOf(p()).filter((x) => x.soldAt === undefined)).toHaveLength(1);

    // Sold after the 125 days land takes: its value then, less New York's 0.4%, into the bank.
    const selling = sim.must<{ closesAt: number }>({ kind: 'land.sell', payload: { parcelId: a!.id } }).closesAt;
    expect(selling).toBe(sim.now + DAYS_TO_SELL * MS_DAY);
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: a!.id } }).error).toBe('It’s for sale already.');
    expect(sim.execute({ kind: 'land.split', payload: { parcelId: a!.id } }).error).toBe('It’s being sold.');
    expect(sim.execute({ kind: 'land.lease_out', payload: { parcelId: a!.id } }).error).toBe('It’s for sale.');
    sim = reload(sim);
    expect(parcelsOf(p()).find((x) => x.id === a!.id)!.selling).toEqual({ closesAt: selling });
    sim.advanceTo(selling + MS_HOUR);
    const sale = saleProceeds(m, landValue(m, listing.acres, selling));
    expect(sale.taxes.map((t) => t.amount)).toEqual([Math.round(landValue(m, listing.acres, selling) * 0.004)]);
    const sold = memo(sim, /^Sold: Farmland Upstate/);
    expect(sold.map((t) => on(t, p().primaryAccountId!))).toEqual([sale.net]);
    expect(parcelsOf(p()).every((x) => x.soldAt !== undefined)).toBe(true);
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: a!.id } }).error).toBe('That isn’t land you own.');
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);
});

describe('a flat of one’s own in New York', () => {
  it('fits an alarm and locks, buys a bed and replaces its mattress, has a washer mended, buys a computer and a speaker, and moves out and back', () => {
    let sim = life('jhold-home');
    const p = () => sim.player;
    sim.advanceBy(MS_HOUR);
    // In a shared room: the landlord's windows and doors, no bed of one's own, and no home owned for a charger.
    expect(p().home!.kind).toBe('shared');
    expect(sim.execute({ kind: 'home.security', payload: { device: 'windows' } }).error).toBe('A shared home’s windows and doors are the landlord’s to fit.');
    expect(sim.execute({ kind: 'home.replace_mattress', payload: {} }).error).toBe('You have no bed of your own.');
    expect(sim.execute({ kind: 'home.charger', payload: {} }).error).toBe('A charger goes on a home you own.');
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });

    // An alarm: Ring's kit from the bank, and the renter's premium 5% less.
    const premium = rentersPremium(sim, p());
    let b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.alarm', payload: { on: true } }).paid).toBe(inSave(sim, 199_99, 'USD'));
    expect(b0 - banked(sim)).toBe(inSave(sim, 199_99, 'USD'));
    expect(alarmed(p())).toBe(true);
    expect(rentersPremium(sim, p())).toBe(Math.round(premium * 0.95));
    expect(sim.execute({ kind: 'home.alarm', payload: { on: true } }).error).toBe('Your home has one.');

    // Window locks on the flat's four windows, and two timers, at The Home Depot's shelf and New York's tax.
    expect(sim.execute({ kind: 'home.security', payload: { device: 'bars' } }).error).toBe('No such device.');
    const tax = 1 + salesTaxRate(NY, sim.now, 'goods');
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.security', payload: { device: 'windows' } }).paid).toBe(inSave(sim, Math.round(4 * 2_93 * tax), 'USD'));
    expect(sim.must<{ paid: number }>({ kind: 'home.security', payload: { device: 'timers' } }).paid).toBe(inSave(sim, Math.round(2 * 5_96 * tax), 'USD'));
    expect(b0 - banked(sim)).toBe(inSave(sim, Math.round(4 * 2_93 * tax), 'USD') + inSave(sim, Math.round(2 * 5_96 * tax), 'USD'));
    expect(sim.execute({ kind: 'home.security', payload: { device: 'windows' } }).error).toBe('Your home has them.');
    expect(sim.execute({ kind: 'home.security', payload: { device: 'lights' } }).error).toBe('An outside light goes on a house, not a flat.');
    // Window locks without an outside light: Tseloni's 2.8 in 12.54 of the risk; the timers, a set the study didn't measure, add nothing.
    expect(securityFactor(p())).toBeCloseTo(2.8 / 12.54, 10);

    // A bed of their own, then its mattress worn: six years no test can live, set back.
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed' } });
    expect(owns(p(), 'bed')).toBe(true);
    const bed = itemsOf(p()).find((i) => i.kind === 'furniture:bed')!;
    expect(mattressWorn(p(), sim.now)).toBe(false);
    bed.acquiredAt = sim.now - 6 * YEAR - MS_DAY;
    expect(mattressWorn(p(), sim.now)).toBe(true);
    const worn = sleepQuality(sim, p());
    const mattress = mattressCost(sim, NY, bedAtHome(p())!.size)!;
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.replace_mattress', payload: {} }).paid).toBe(mattress);
    expect(b0 - banked(sim)).toBe(mattress);
    expect(mattressWorn(p(), sim.now)).toBe(false);
    expect(sleepQuality(sim, p()) - worn).toBeCloseTo(WORN_NIGHT, 10);

    // A portable washer of their own, broken (the day's draw forced, as the decider's sweep does), mended at Angi's $220.
    sim.must({ kind: 'home.buy_portable', payload: { kind: 'washer' } });
    expect(homePlace(sim, p())!.fixtures.laundry).not.toBe('none');
    expect(sim.execute({ kind: 'home.repair_machine', payload: { machine: 'washer' } }).error).toBe('The washing machine isn’t broken.');
    machinesDay(sim, p(), 1);
    expect(faultsOf(p()).washer).toBeDefined();
    expect(faultsOf(p()).fridge!.landlord).toBe(true);
    expect(homePlace(sim, p())!.fixtures.laundry).toBe('none');
    expect(sim.execute({ kind: 'home.repair_machine', payload: { machine: 'fridge' } }).error).toBe('The landlord is having it mended.');
    expect(sim.execute({ kind: 'home.repair_machine', payload: { machine: 'toaster' } }).error).toBe('No such machine.');
    const tech = 'A technician, the washing machine';
    const repair = sim.must<{ paid: number; fixAt: number }>({ kind: 'home.repair_machine', payload: { machine: 'washer' } });
    expect(repair.paid).toBe(inSave(sim, (REPAIRS.us!.callout + REPAIRS.us!.items.washer) * 100, 'USD'));
    expect(memo(sim, tech).map((t) => t.postings.find((q) => q.amount > 0)!.amount)).toEqual([repair.paid]);
    expect(zonedParts(repair.fixAt, 'America/New_York').hour).toBe(10);
    expect(sim.execute({ kind: 'home.repair_machine', payload: { machine: 'washer' } }).error).toBe('The technician is booked.');

    sim = reload(sim);
    expect(alarmed(p())).toBe(true);
    expect(devicesOf(p())).toEqual(['windows', 'timers']);
    expect(faultsOf(p()).washer!.fixAt).toBe(repair.fixAt);
    expect(breaches(sim.universe)).toEqual([]);
    // Mended the next morning, and the washing's at home again.
    sim.advanceTo(repair.fixAt + MS_DAY);
    expect(faultsOf(p()).washer).toBeUndefined();
    expect(homePlace(sim, p())!.fixtures.laundry).not.toBe('none');
    expect(memo(sim, tech)).toHaveLength(1);

    // The alarm's monitoring each first of the month; switched off, none after, and the premium back.
    const monitored = memo(sim, 'Alarm monitoring');
    const firstOf = instantFromZoned({ year: zonedParts(sim.now, 'America/New_York').year, month: zonedParts(sim.now, 'America/New_York').month + 1 > 12 ? 1 : zonedParts(sim.now, 'America/New_York').month + 1, day: 1, hour: 12 }, 'America/New_York');
    sim.advanceTo(firstOf);
    expect(memo(sim, 'Alarm monitoring').length).toBe(monitored.length + 1);
    expect(memo(sim, 'Alarm monitoring').map((t) => -into(sim, t))).toEqual(memo(sim, 'Alarm monitoring').map(() => inSave(sim, 19_99, 'USD')));
    expect(sim.must<{ paid: number }>({ kind: 'home.alarm', payload: { on: false } }).paid).toBe(0);
    expect(sim.execute({ kind: 'home.alarm', payload: { on: false } }).error).toBe('Your home has none.');
    expect(rentersPremium(sim, p())).toBe(premium);
    const count = memo(sim, 'Alarm monitoring').length;
    sim.advanceTo(firstOf + 32 * MS_DAY);
    expect(memo(sim, 'Alarm monitoring')).toHaveLength(count);

    // A computer, any of which plays a games lover's games at home; a speaker, what a music lover unwinds with.
    // The interests are the life's own, set: a quick save draws none in particular.
    p().interests = ['games', 'music'];
    p().items = itemsOf(p()).filter((i) => i.kind !== 'furniture:console' && i.kind !== 'furniture:speaker');
    delete p().furniture;
    expect(lovedIn(p(), 'unwind')).not.toContain('games');
    expect(lovedIn(p(), 'unwind')).not.toContain('music');
    const pc = computerCatalog(sim, p())[0]!;
    const abroad = COMPUTER_PRODUCTS.flatMap((x) => x.offers).find((o) => o.market === 'uk')!;
    expect(sim.execute({ kind: 'computer.buy', payload: { offerId: 'nothing' } }).error).toBe('That isn’t on sale.');
    expect(sim.execute({ kind: 'computer.buy', payload: { offerId: abroad.id } }).error).toBe('It’s sold in another country.');
    b0 = banked(sim);
    const bought = sim.must<{ paid: number; itemId: string }>({ kind: 'computer.buy', payload: { offerId: pc.offer.id } });
    expect(bought.paid).toBe(pc.price);
    expect(b0 - banked(sim)).toBe(pc.price);
    expect(computerForGames(p())).toBe(true);
    expect(lovedIn(p(), 'unwind')).toContain('games');
    const spk = speakerCatalog(sim, p())[0]!;
    expect(sim.execute({ kind: 'speaker.buy', payload: { offerId: spk.offer.id, color: 'Plaid' } }).error).toBe('It isn’t offered in that color.');
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'speaker.buy', payload: { offerId: spk.offer.id } }).paid).toBe(spk.price);
    expect(b0 - banked(sim)).toBe(spk.price);
    expect(owns(p(), 'speaker')).toBe(true);
    expect(lovedIn(p(), 'unwind')).toContain('music');

    // Moving out in a U-Haul they drive (a license, the papers a life begins with, made known): its day, miles and fuel.
    licensed(sim, 'us-ny');
    expect(sim.must<{ by: string }>({ kind: 'home.move_by', payload: { by: 'truck' } }).by).toBe('truck');
    expect(p().moveBy).toBe('truck');
    const truck = truckFor(sim, p(), NY, NY);
    expect(typeof truck).toBe('number');
    sim.must({ kind: 'home.move', payload: { kind: 'shared' } });
    expect(memo(sim, 'U-Haul’s 15-foot truck, your bed and sofa moved yourself').map((t) => -into(sim, t))).toEqual([truck]);
    expect(memo(sim, 'Movers, your bed and sofa')).toHaveLength(0);
    // The locks stay with the rented flat; the bed comes along.
    expect(devicesOf(p())).toEqual([]);
    expect(owns(p(), 'bed')).toBe(true);
    // And back, by the movers this time, at a one-bedroom's local price.
    expect(sim.must<{ by: string }>({ kind: 'home.move_by', payload: { by: 'movers' } }).by).toBe('movers');
    expect(p().moveBy).toBeUndefined();
    const movers = moversCost(sim, p(), NY, NY);
    expect(movers).toBe(inSave(sim, 475_00, 'USD'));
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    expect(memo(sim, 'Movers, your bed and sofa').map((t) => -into(sim, t))).toEqual([movers]);
    expect(memo(sim, /^U-Haul/)).toHaveLength(1);
    sim = reload(sim);
    expect(owns(p(), 'bed')).toBe(true);
    expect(owns(p(), 'speaker')).toBe(true);
    expect(computerForGames(p())).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('is asked to a meal by a close friend, says yes, and pays for it at its price', () => {
    let sim = life('jhold-meal');
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }]);
    const maya = (): Contact => contactsOf(sim.player).find((c) => c.name === 'Maya Okafor')!;
    expect(sim.execute({ kind: 'social.answer', payload: { contactId: maya().id, yes: true } }).error).toBe('Maya hasn’t asked you to anything.');
    expect(sim.execute({ kind: 'social.answer', payload: { contactId: 'nobody', yes: true } }).error).toBe('You don’t know them.');
    // A meal asked for, here; from 2026-10-06 a friend may ask to other things too (tests/reaching-out.test.ts).
    for (let d = 0; d < 120 && !maya().ask; d += 1) { sim.advanceBy(MS_DAY); if (maya().ask && maya().ask!.what !== 'meal') { delete maya().ask; delete maya().askedAt; } }
    const ask = maya().ask!;
    expect(ask).toBeDefined();
    sim = reload(sim);
    expect(maya().ask).toEqual(ask);
    expect(sim.must<{ at: number }>({ kind: 'social.answer', payload: { contactId: maya().id, yes: true } }).at).toBe(ask.at);
    expect(sim.execute({ kind: 'social.answer', payload: { contactId: maya().id, yes: false } }).error).toBe('Maya hasn’t asked you to anything.');
    const r = restaurantById(ask.restaurantId!)!;
    sim.advanceTo(ask.at - MS_HOUR);
    const b0 = banked(sim);
    const price = diningQuote(sim, r, [ask.item!], 'in')!.total;
    sim.advanceTo(ask.at + 4 * MS_HOUR);
    expect(b0 - banked(sim)).toBe(price);
    expect(maya().memory.some((x) => x.what === `A meal at ${r.name}, 7:00 PM`)).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('a house with a charger', () => {
  /** A house owned and lived in, with its own parking: buying one is `journey-homes`'s, so it's built here as tests/evs.test.ts builds it. */
  const house = (seed: string) => {
    const sim = life(seed);
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, lot: 5_000, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: NY, facts, price: 600_000_00, closing: 0 });
    sim.player.home = { kind: 'owned', cityId: NY, homeId: owned.id, since: sim.now };
    licensed(sim, 'us-ny');
    return sim;
  };

  it('fits a charger at the place’s price, and drives an electric car for less than its twin at the public chargers', () => {
    let sim = house('jhold-charger');
    const twin = house('jhold-charger');
    const q = chargerQuote(sim, sim.player);
    if (typeof q === 'string') throw new Error(q);
    const b0 = banked(sim);
    expect(sim.must<{ paid: number; grant: number }>({ kind: 'home.charger', payload: {} })).toEqual({ paid: q.cost, grant: q.grant });
    expect(b0 - banked(sim)).toBe(q.cost);
    expect(homeShareOf(sim.player)).toBe(HOME_CHARGING_SHARE);
    expect(sim.execute({ kind: 'home.charger', payload: {} }).error).toBe('Your home has one.');
    sim = reload(sim);
    expect(homeShareOf(sim.player)).toBe(HOME_CHARGING_SHARE);
    for (const s of [sim, twin]) s.must({ kind: 'vehicle.buy', payload: { modelId: 'us-tesla-model-y', fillUp: 'auto' } });
    sim.advanceBy(40 * MS_DAY);
    twin.advanceBy(40 * MS_DAY);
    const fuel = (s: Simulation) => memo(s, 'Fuel and upkeep, the Tesla Model Y')[0]!;
    const v = vehiclesOf(sim.player)[0]!;
    // The month's kWh three-quarters at the home's price, from a full battery, and the month's upkeep.
    expect(-into(sim, fuel(sim))).toBe(everydayFuel(sim, { ...v, fuelLevel: 1 }, monthKm(v), HOME_CHARGING_SHARE)!.cost + upkeepCost(sim, v, monthKm(v)));
    // The twin, no charger: all of it at the public chargers, and more.
    expect(-into(twin, fuel(twin))).toBeGreaterThan(-into(sim, fuel(sim)));
    // And Con Edison's SmartCharge for the kWh charged at home, the twin none.
    expect(memo(sim, 'Charging rewards, the month').length).toBeGreaterThan(0);
    expect(memo(twin, 'Charging rewards, the month')).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
    expect(breaches(twin.universe)).toEqual([]);
  }, 120_000);
});

describe('winter tires in Toronto', () => {
  it('fits a set at Discount Tire’s middle, and the insurance is 3.5% less the month after', () => {
    let sim = life('jhold-tires', 'ca-on-toronto');
    licensed(sim, 'ca-on');
    const v = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'ca-toyota-rav4' } }).vehicleId;
    const insurance = () => memo(sim, /^Car insurance/).map((t) => on(t, sim.player.primaryAccountId!));
    sim.advanceBy(31 * MS_DAY);
    const before = insurance().at(-1)!;
    expect(before).toBeLessThan(0);
    expect(sim.execute({ kind: 'vehicle.winter_tires', payload: { vehicleId: 'nothing' } }).error).toBe('That isn’t a vehicle you own.');
    const b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.winter_tires', payload: { vehicleId: v } }).paid).toBe(inSave(sim, WINTER_TIRES.setUsd * 100, 'USD'));
    expect(b0 - banked(sim)).toBe(inSave(sim, WINTER_TIRES.setUsd * 100, 'USD'));
    expect(sim.execute({ kind: 'vehicle.winter_tires', payload: { vehicleId: v } }).error).toBe('It has a set.');
    sim = reload(sim);
    const car = vehiclesOf(sim.player).find((x) => x.id === v)!;
    expect(car.winterTires).toMatchObject({ km: 0 });
    expect(tiresRefusal(car)).toBe('It has a set.');
    // In Quebec's season a crash injures 5% less often on them; out of it, no different.
    expect(tireFactor(car, instantFromZoned({ year: 2027, month: 1, day: 10, hour: 12 }, 'America/Toronto'))).toBe(0.95);
    expect(tireFactor(car, instantFromZoned({ year: 2026, month: 7, day: 10, hour: 12 }, 'America/Toronto'))).toBe(1);
    sim.advanceBy(31 * MS_DAY);
    expect(insurance().at(-1)).toBe(Math.round(before * (1 - WINTER_TIRES.ontarioDiscount)));
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('IKEA in London', () => {
  it('puts a BILLY together, sells it back for the Family tier’s credit, and spends it on the next piece', () => {
    let sim = life('jhold-ikea', 'uk-eng-london');
    const p = () => sim.player;
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    const billyId = 'uk-billy-59182201';
    const billy = pieceById(billyId)!;
    expect(billy.kind).toBe('bookcase');
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: billyId, quantity: 1 } });
    const item = itemsOf(p()).find((i) => i.kind === `ikea:${billyId}`)!;
    expect(sim.execute({ kind: 'home.sell_back', payload: { itemId: item.id } }).error).toBe('IKEA takes a piece back put together.');
    expect(sim.execute({ kind: 'home.sell_back', payload: { itemId: 'nothing' } }).error).toBe('Only an IKEA piece goes back to IKEA.');
    sim.must({ kind: 'items.assemble', payload: { itemId: item.id } });
    sim = reload(sim);
    // As new, 45%, and 15% more for an IKEA Family member: credit on IKEA's refund card, nothing into the bank.
    const b0 = banked(sim);
    const credit = sim.must<{ credit: number }>({ kind: 'home.sell_back', payload: { itemId: item.id } }).credit;
    expect(credit).toBe(Math.round(item.paid! * buybackShare(1)));
    expect(buybackShare(1)).toBeCloseTo(0.45 * 1.15, 12);
    expect(banked(sim)).toBe(b0);
    expect(p().ikeaCredit).toBe(credit);
    expect(itemsOf(p()).some((i) => i.id === item.id)).toBe(false);
    expect(sim.execute({ kind: 'home.sell_back', payload: { itemId: item.id } }).error).toBe('Only an IKEA piece goes back to IKEA.');
    // The next BILLY: the card first, the bank the rest.
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: billyId, quantity: 1 } });
    const next = itemsOf(p()).find((i) => i.kind === `ikea:${billyId}`)!;
    expect(b0 - banked(sim)).toBe(item.paid! - credit);
    expect(p().ikeaCredit).toBe(0);
    expect(next.id).not.toBe(item.id);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('banking in New York', () => {
  it('rounds Bank of America’s grocery purchases up into savings, switches to Chase with the standing order, and puts card purchases on a plan', () => {
    let sim = life('jhold-bank', NY, { bankId: 'us-bank-of-america' });
    const p = () => sim.player;
    const savings = () => bankAccountsOf(sim, p()).find((a) => a.kind === 'savings' && a.category !== 'term')!;
    const noon = (days: number) => { const z = zonedParts(sim.now + days * MS_DAY, 'America/New_York'); return instantFromZoned({ year: z.year, month: z.month, day: z.day, hour: 12 }, 'America/New_York'); };
    const order = () => { sim.must({ kind: 'life.look_after', payload: { action: 'order' } }); return memo(sim, 'A meal delivered').at(-1)!; };
    sim.advanceTo(noon(1));
    expect(sim.must<{ on: boolean }>({ kind: 'bank.set_round_ups', payload: { on: true } }).on).toBe(true);
    // A meal delivered on the debit card: its change to the next dollar waits for the night.
    const meal = order();
    const paid = -on(meal, p().primaryAccountId!);
    expect(roundUpOf(paid)).toBeGreaterThan(0);
    expect(p().roundUps!.pending).toBe(roundUpOf(paid));
    // The day's groceries are whole dollars, and round up nothing; the night moves the meal's change into savings.
    sim.advanceTo(noon(1));
    expect(memo(sim, 'Round-ups').map((t) => [on(t, savings().id), on(t, p().primaryAccountId!)])).toEqual([[roundUpOf(paid), -roundUpOf(paid)]]);
    expect(p().roundUps!.pending).toBe(0);
    // Off, a meal's change stays in the current account.
    expect(sim.must<{ on: boolean }>({ kind: 'bank.set_round_ups', payload: { on: false } }).on).toBe(false);
    order();
    expect(p().roundUps!.pending).toBe(0);
    sim.advanceTo(noon(1));
    expect(memo(sim, 'Round-ups')).toHaveLength(1);
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });

    // A standing order into savings on the 20th, then the switch: American banks have no switching service's days, so it's now.
    const old = { current: p().primaryAccountId!, savings: savings().id };
    const standing = sim.must<{ id: string }>({ kind: 'bank.add_standing_order', payload: { toId: old.savings, amount: 100_00, day: 20 } }).id;
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'us-bank-of-america' } }).error).toBe('You already bank with Bank of America.');
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'gb-natwest' } }).error).toBe('That isn’t a bank where you live.');
    const held = banked(sim);
    expect(sim.must<{ at: number }>({ kind: 'bank.switch', payload: { bankId: 'us-chase' } }).at).toBe(sim.now);
    expect(sim.universe.accounts[old.current]!.closedAt).toBe(sim.now);
    expect(sim.universe.accounts[old.savings]!.closedAt).toBe(sim.now);
    expect(sim.universe.accounts[p().primaryAccountId!]!.bankId).toBe('us-chase');
    expect(savings().bankId).toBe('us-chase');
    expect(banked(sim)).toBeGreaterThanOrEqual(held);
    expect(paymentsOf(p()).standingOrders.find((o) => o.id === standing)!.toId).toBe(savings().id);
    expect(titled(sim, 'Switched To Chase')).toHaveLength(1);
    expect(sim.execute({ kind: 'bank.set_round_ups', payload: { on: true } }).error).toBe('Chase doesn’t round purchases up into savings.');

    sim = reload(sim);
    // The order goes from the new current account into the new savings on its day.
    const day20 = (() => { const z = zonedParts(sim.now, 'America/New_York'); return instantFromZoned({ year: z.year, month: z.day < 20 ? z.month : z.month + 1, day: 20, hour: 12 }, 'America/New_York'); })();
    sim.advanceTo(day20);
    const went = memo(sim, /^Standing order to /);
    expect(went).toHaveLength(1);
    expect(on(went[0]!, savings().id)).toBe(100_00);
    expect(on(went[0]!, p().primaryAccountId!)).toBe(-100_00);
    // Still switched on, but Chase doesn't round up: a meal's change stays where it is.
    expect(p().roundUps!.on).toBe(true);
    order();
    expect(p().roundUps!.pending).toBe(0);
    sim.advanceTo(noon(1));
    expect(memo(sim, 'Round-ups')).toHaveLength(1);

    // The Bank of America card is still theirs: the day's groceries on it, then into a plan for 1.72% of it a month.
    const card = cardOf(sim, p())!;
    expect(card.bankId).toBe('us-bank-of-america');
    expect(sim.execute({ kind: 'card.money_transfer', payload: { amount: 100_00 } }).error).toBe(`The ${card.name} doesn’t offer money transfers.`);
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    sim.advanceBy(5 * MS_DAY);
    const room = planRoom(p(), card);
    expect(room).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'card.plan', payload: { amount: room, months: 4 } }).error).toBe('A plan runs 3, 6, 12 months.');
    expect(sim.execute({ kind: 'card.plan', payload: { amount: room + 1, months: 3 } }).error).toMatch(/^Purchases owe .* that can go into a plan\.$/);
    const terms = cardTerms(sim, card, p().credit!.score);
    const plan = sim.must<{ plan: { left: number; monthly: number; fee: number; monthsLeft: number } }>({ kind: 'card.plan', payload: { amount: room, months: 3 } }).plan;
    expect(plan).toEqual({ left: room, monthly: Math.ceil(room / 3), fee: Math.round(room * terms.planFeeShare!), monthsLeft: 3 });
    expect(planRoom(p(), card)).toBe(0);
    // At the statement: the plan's month moved into what's due with its fee.
    const statement = sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === p().id)!.at;
    sim.advanceTo(statement + MS_HOUR);
    expect(memo(sim, 'Plan fee').map((t) => -on(t, card.id))).toEqual([plan.fee]);
    expect(stateOf(p(), card).statementPlanDue).toBe(plan.monthly + plan.fee);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a NatWest card', () => {
  it('moves money into the current account for 3%, then is put on a hardship plan: no interest, and the payment that clears it in four years', () => {
    let sim = life('jhold-natwest', 'uk-eng-london', { bankId: 'gb-natwest' });
    const p = () => sim.player;
    const card = cardOf(sim, p())!;
    expect(sim.execute({ kind: 'card.request_hardship', payload: { accountId: card.id } }).error).toBe('The card owes nothing.');
    expect(sim.execute({ kind: 'card.money_transfer', payload: { amount: 0 } }).error).toBe('Say how much.');
    const current = p().primaryAccountId!;
    const transfer = sim.must<{ fee: number }>({ kind: 'card.money_transfer', payload: { amount: 500_00, accountId: card.id } });
    expect(transfer.fee).toBe(15_00);
    expect(memo(sim, `Money transfer from ${card.name}`).map((t) => on(t, current))).toEqual([500_00]);
    expect(memo(sim, 'Money transfer fee').map((t) => -on(t, card.id))).toEqual([15_00]);
    const terms = cardTerms(sim, card, p().credit!.score);
    expect(stateOf(p(), card).transfers).toEqual([{ kind: 'money', owed: 515_00, accrued: 0, apr: terms.transfer!.apr }]);
    // A day's interest at the transfer rate on it.
    sim.advanceBy(MS_DAY);
    expect(stateOf(p(), card).transfers![0]!.accrued).toBeCloseTo(515_00 * terms.transfer!.apr / 365, 0);

    // Help with payments: the interest frozen, a payment that clears what's owed in four years, and the card stopped.
    const owed = -card.balance;
    const plan = sim.must<{ payment: number }>({ kind: 'card.request_hardship', payload: { accountId: card.id } });
    expect(plan.payment).toBe(Math.ceil(owed / 48 / 100) * 100);
    expect(stateOf(p(), card).suspended).toBe('hardship');
    expect(sim.execute({ kind: 'card.request_hardship', payload: { accountId: card.id } }).error).toBe('You’re on a plan already.');
    sim = reload(sim);
    expect(stateOf(p(), cardOf(sim, p())!).hardship).toMatchObject({ payment: plan.payment });
    const accrued = stateOf(p(), cardOf(sim, p())!).transfers![0]!.accrued;
    sim.advanceBy(3 * MS_DAY);
    expect(stateOf(p(), cardOf(sim, p())!).transfers![0]!.accrued).toBe(accrued);
    // The due day after the statement takes the plan's payment, and no interest is charged.
    const due = () => sim.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === p().id)?.at;
    const statement = sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === p().id)!.at;
    sim.advanceTo(statement + MS_HOUR);
    sim.advanceTo(due()! + MS_HOUR);
    const c = cardOf(sim, p())!;
    // Only the day's interest built before the plan is charged; none after it.
    expect(memo(sim, /interest/i).filter((t) => on(t, c.id) !== 0).map((t) => [t.memo, on(t, c.id)])).toEqual([['Money transfer interest', -Math.round(accrued)]]);
    expect(stateOf(p(), c).paidSinceStatement).toBe(Math.min(stateOf(p(), c).statementBalance, plan.payment));
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});

describe('an overrun in Paris', () => {
  it('is offered a loan for what’s past the limit at three months, takes it, and pays its month', () => {
    let sim = life('jhold-paris', 'fr-idf-paris', { bankId: 'fr-bnp-paribas' });
    const p = () => sim.player;
    const acct = sim.universe.accounts[p().primaryAccountId!]!;
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).error).toBe('Your bank has offered no loan for an overrun.');
    // Everything in the bank given away, and 800 euros past the limit: postings, not a balance typed in.
    for (const a of bankAccountsOf(sim, p())) if (a.balance > 0 && a.id !== acct.id) sim.post({ memo: 'Given away', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: acct.id, amount: a.balance }] });
    const out = acct.balance + (acct.overdraftLimit ?? 0) + 800_00;
    sim.post({ memo: 'Given away', category: 'gifts', postings: [{ accountId: acct.id, amount: -out }, { accountId: sim.nominalAccount('expense', 'Gifts').id, amount: out }] });
    sim.advanceBy((FRANCE.offerAfterDays + 3) * MS_DAY);
    expect(titled(sim, 'BNP Paribas Wrote About Your Overrun')).toHaveLength(1);
    const offer = acct.creditOffered!;
    expect(offer.months).toBe(FRANCE.offerMonths);
    expect(offer.amount).toBeGreaterThan(0);
    sim = reload(sim);
    const current = sim.universe.accounts[p().primaryAccountId!]!;
    const before = current.balance;
    const taken = sim.must<{ apr: number; payment: number }>({ kind: 'bank.take_overrun_loan', payload: {} });
    expect(taken).toEqual({ apr: offer.apr, payment: monthlyPayment(offer.amount, offer.apr, FRANCE.offerMonths) });
    expect(current.balance - before).toBe(offer.amount);
    const loan = Object.values(sim.universe.accounts).find((a) => a.ownerId === p().id && a.kind === 'loan' && a.openedAt === sim.now)!;
    expect(loan.balance).toBe(-offer.amount);
    expect(current.creditOffered).toBeUndefined();
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).error).toBe('Your bank has offered no loan for an overrun.');
    // Wages in, and a month on its first payment: the month's interest, and the payment off it.
    gift(sim, current.id, 3_000_00);
    sim.advanceBy(32 * MS_DAY);
    expect(memo(sim, `Interest: ${loan.name}`).map((t) => -on(t, loan.id))).toEqual([Math.round(offer.amount * offer.apr / 12)]);
    expect(memo(sim, `Payment: ${loan.name}`).map((t) => on(t, loan.id))).toEqual([taken.payment]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('the guide and the Decision Center', () => {
  it('reads the chapters in order, starts the clock once it may, and dismisses a notice whose money still goes to the state', () => {
    let sim = life('jhold-guide', NY, { tutorial: true, bankId: 'us-chase' });
    const readTo = (id: string) => { for (const c of CHAPTERS) { if (sim.universe.tutorial!.read.includes(c.id)) continue; sim.must({ kind: READ_KIND, payload: { chapterId: c.id } }); if (c.id === id) return; } };
    const clock = CHAPTERS.find((c) => c.id === 'clock')!;
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).error).toBe(`Read “${clock.title}” in the guide first. The next chapter is “${CHAPTERS[0]!.title}”.`);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    // Pausing is always allowed.
    expect(sim.must<{ ok: boolean }>({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } }).ok).toBe(true);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: 'clock' } }).error).toBe(`Read “${CHAPTERS[0]!.title}” first; the chapters go in order.`);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: 'nothing' } }).error).toBe('There’s no such chapter.');
    expect(sim.must<{ read: string; next?: string }>({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } })).toEqual({ read: CHAPTERS[0]!.id, next: CHAPTERS[1]!.id });
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).error).toBe(`You’ve already read “${CHAPTERS[0]!.title}”.`);
    readTo('clock');
    expect(sim.must<{ ok: boolean }>({ kind: 'world.set_preferences', payload: { timeSpeed: 'fast' } }).ok).toBe(true);
    expect(sim.universe.preferences.timeSpeed).toBe('fast');
    sim = reload(sim);
    expect(sim.universe.preferences.timeSpeed).toBe('fast');
    expect(sim.universe.tutorial!.read).toEqual(CHAPTERS.slice(0, CHAPTERS.indexOf(clock) + 1).map((c) => c.id));
    expect(nextChapter(sim)?.id).toBe('advance');

    // The bank writes ninety days before an untouched account goes to the state. Its untouched years are set (`idleAccounts`'s own
    // reading of them is given), since no test lives three years without touching an account.
    const saver = bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings')!;
    const held = saver.balance;
    expect(held).toBeGreaterThan(0);
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - (3 * 365.25 - 80) * MS_DAY : sim.now));
    const notice = Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice' && d.refId === saver.id)!;
    expect(notice).toBeDefined();
    const needs = CHAPTERS.find((c) => c.id === 'needs')!;
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: notice.id } }).error).toBe(`Read “${needs.title}” in the guide first. The next chapter is “${CHAPTERS.find((c) => c.id === 'advance')!.title}”.`);
    readTo('needs');
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: 'nothing' } }).error).toBe('No such decision.');
    expect(sim.must<{ dismissed: boolean }>({ kind: 'world.dismiss_decision', payload: { decisionId: notice.id } }).dismissed).toBe(true);
    expect(notice.dismissedAt).toBe(sim.now);
    expect(notice.resolvedAt).toBeUndefined();
    sim = reload(sim);
    const kept = sim.universe.decisions[notice.id]!;
    expect(kept.dismissedAt).toBe(notice.dismissedAt);
    // Dismissed, not answered: the account isn't kept, and on its day the money goes.
    const s2 = sim.universe.accounts[saver.id]!;
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - 3.1 * 365.25 * MS_DAY : sim.now));
    expect(s2.closedAt).toBe(sim.now);
    expect(sim.player.unclaimed).toEqual([expect.objectContaining({ amount: held })]);
    expect(s2.balance).toBe(0);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  it('has no guide to read in a life begun without one', () => {
    const sim = life('jhold-unguided');
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).error).toBe('This life has no guide to read through; everything is open.');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

/** Farmland upstate bought at its asking price and closed on, financed or not. */
function buyUpstate(sim: Simulation, financed: boolean) {
  const listing = listingsFor(sim, sim.player, homeOf(sim.player)).filter((l) => LAND_MARKETS[l.market]!.label === 'Farmland Upstate').sort((a, b) => a.acres - b.acres)[0]!;
  sim.must({ kind: 'land.offer', payload: { listingId: listing.id, price: listing.asking, financed } });
  sim.advanceTo(sim.player.landBuying!.deal!.closesAt + MS_HOUR);
  return parcelsOf(sim.player).find((x) => x.listingId === listing.id)!;
}

/**
 * What the game gets wrong, kept apart and skipped. Each case asserts what
 * should happen; each fails unskipped.
 */
describe('holdings, where the game is wrong', () => {
  // Found by this journey on 2026-10-06 and fixed: splitting land on a loan gave each half the whole loan. The lender's
  // lien is on the whole parcel, and a part released needs its consent, which SLATE doesn't take: it's refused now.
  it('won’t split a financed parcel, nor give its loan to two halves', () => {
    let sim = life('jhold-split-loan');
    const parcel = buyUpstate(sim, true);
    const owed = parcel.loan!.owed;
    expect(owed).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'land.split', payload: { parcelId: parcel.id } }).error).toBe('The lender holds the whole parcel: pay the land loan off to split it.');
    sim = reload(sim);
    const loans = parcelsOf(sim.player).filter((x) => x.soldAt === undefined).reduce((a, x) => a + (x.loan?.owed ?? 0), 0);
    expect(loans).toBe(owed);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  // Found by this journey on 2026-10-06 and fixed: joining a parcel on a loan into another dropped the loan, owed on the
  // books and never paid. The joined parcel carries it now, and its payment goes on; two loans aren't joined.
  it('carries a financed parcel’s loan into the parcel it’s joined to', () => {
    let sim = life('jhold-combine-loan');
    const cash = buyUpstate(sim, false);
    const financed = buyUpstate(sim, true);
    const other = buyUpstate(sim, true);
    expect(sim.execute({ kind: 'land.combine', payload: { a: other.id, b: financed.id } }).error).toBe('Each is on its own loan: pay one off to join them.');
    // What’s owed now, the months bought through already paid on it.
    const owed = financed.loan!.owed;
    sim.must({ kind: 'land.combine', payload: { a: cash.id, b: financed.id } });
    sim = reload(sim);
    const joined = parcelsOf(sim.player).find((x) => x.id === cash.id)!;
    expect(joined.loan?.owed).toBe(owed);
    sim.advanceBy(31 * MS_DAY);
    // Its own payment goes on: the joined parcel's loan, not the other's (whose payments share the memo), comes down.
    expect(parcelsOf(sim.player).find((x) => x.id === cash.id)!.loan!.owed).toBeLessThan(owed);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  // Found by this journey on 2026-10-06 and fixed: a piece bought with IKEA's refund card was sold back for less, its
  // price kept as what the bank paid; it keeps its price as new now, as IKEA's tiers are of it.
  it('sells back a piece bought with IKEA credit at its tier of the full price', () => {
    const sim = life('jhold-ikea-credit', 'uk-eng-london');
    sim.must({ kind: 'home.move', payload: { kind: 'own' } });
    const billyId = 'uk-billy-59182201';
    const piece = () => itemsOf(sim.player).find((i) => i.kind === `ikea:${billyId}`)!;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: billyId, quantity: 1 } });
    const first = piece();
    const price = first.paid!;
    sim.must({ kind: 'items.assemble', payload: { itemId: first.id } });
    sim.must({ kind: 'home.sell_back', payload: { itemId: first.id } });
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: billyId, quantity: 1 } });
    const second = piece();
    sim.must({ kind: 'items.assemble', payload: { itemId: second.id } });
    const again = reload(sim);
    expect(again.must<{ credit: number }>({ kind: 'home.sell_back', payload: { itemId: second.id } }).credit).toBe(Math.round(price * buybackShare(1)));
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);

  // Found by this journey on 2026-10-06 and fixed: the preferences took anything given, and kept it.
  it('refuses a time speed that isn’t one', () => {
    const sim = life('jhold-prefs');
    const before = { ...sim.universe.preferences };
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'warp', junk: 1 } }).error).toBe('junk isn’t a preference.');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'warp' } }).error).toBe('The clock runs paused, live, fast or faster.');
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'fast' } });
    expect(reload(sim).universe.preferences.timeSpeed).toBe('fast');
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: before.timeSpeed } });
    expect(reload(sim).universe.preferences).toEqual(before);
    expect(breaches(sim.universe)).toEqual([]);
  });

  // Found by this journey on 2026-10-06 and fixed: a question was dismissed again, and the day its keeping counts from
  // moved.
  it('doesn’t dismiss a question twice', () => {
    const sim = life('jhold-dismiss', NY, { bankId: 'us-chase' });
    const saver = bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings')!;
    idleAccounts(sim, sim.player, (a) => (a.id === saver.id ? sim.now - (3 * 365.25 - 80) * MS_DAY : sim.now));
    const notice = Object.values(sim.universe.decisions).find((d) => d.refType === 'unclaimed-notice')!;
    sim.must({ kind: 'world.dismiss_decision', payload: { decisionId: notice.id } });
    const first = notice.dismissedAt;
    sim.advanceBy(MS_DAY);
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: notice.id } }).error).toBe('It’s dismissed already.');
    expect(reload(sim).universe.decisions[notice.id]!.dismissedAt).toBe(first);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
