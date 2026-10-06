/**
 * The cars journey (the owner's audit of 2026-10-06): a driving life run
 * through the same commands the Cars screen runs, each step reading what the
 * one before left.
 *
 * - **A used car, from the forecourt to its buyer**: a Camry on offer this
 *   month test-driven and inspected, the bank found short and nothing taken,
 *   bought broken on liability cover; breakdown cover joined, the repair
 *   booked ahead at the dealer and booked once, saved and loaded while it
 *   waits, taken in with the tow past the club's three free miles paid; the
 *   car refused while it's in and the dealer's loaner driven, the car gaining
 *   nothing. Then its days burn the tank and its month moves the odometer,
 *   the fill-up setting stops and starts that, a fill paid at the pump's price
 *   and a second refused full, the cover raised and the next month billed at
 *   it. Serviced, a second service refused while it's in; shod, a stereo and
 *   speakers fitted (which the insurer's payout then counts), wrapped, run
 *   dry and filled, tinted (which stretches the range), a roof box put on
 *   (which shortens it) and taken off, kept on the street, the wheel
 *   retrimmed; the license lost, which keeps it home for its month, and
 *   replaced. Listed, unlisted (and so not sold), listed again, and sold
 *   privately at its value, its insurance ending with it.
 * - **London**: a car bought from a private seller isn't taken on an errand
 *   until it's transferred; a wrap and legal tint declared, which raise the
 *   month's premium by Britain's loadings, the wrap taken off, which lowers it
 *   again; liability cover refused, no fee charged; the RAC joined and left,
 *   its renewals stopping.
 * - **Leases**: a leased Camry that can't be sold, modified, retrimmed or put
 *   on liability, shod only in its own size, billed its payments, bought out
 *   early and then sold; a second returned early, its payments ending.
 * - **Behind on the loan**: a financed car's payments missed for three months
 *   and the car taken, a redemption the bank can't pay refused, saved and
 *   loaded in the lender's yard, then redeemed, its sale called off.
 * - **A caravan, a pickup and a boat**: a caravan the bank can't cover
 *   refused, then bought; a towbar refused on a car rated to tow nothing and
 *   fitted to one too light for the caravan; a pickup ordered from the
 *   factory that isn't driven before it comes, and then tows it; the caravan
 *   insured monthly and sold, its months ending; a boat bought, its
 *   certificate bought once, insured monthly, and sold.
 * - **Defects**, kept as skipped cases: a roof box sold with the car it's on,
 *   a British private sale driven every day before its transfer, and a fill
 *   nobody can pay for put into arrears.
 *
 * Every case ends with every law of the world holding.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { serialise, deserialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { documentsOf, licenseOf, mayDrive } from '@/engine/systems/documents';
import { kept, modelById, monthlyInsurance, quote, valueOf, vehiclesOf, dayKm, type OwnedVehicle, type Quote } from '@/engine/systems/vehicles';
import { usedFault, usedListings, inspectionPrice } from '@/engine/systems/usedcars';
import { burnOf, capacityOf, levelOf, rangeKm } from '@/engine/systems/fueltank';
import { faultCost, inShopNow, REPAIR_DUE_KIND } from '@/engine/systems/repairs';
import { repairShare, serviceCost } from '@/engine/systems/carcare';
import { duesOf, membershipOf, tierById, towPrice } from '@/engine/systems/roadside';
import { LEG_KM } from '@/engine/content/errandtrips';
import { rentalsOf } from '@/engine/systems/rentals';
import { odometerOf, sizesFor, tireCatalog, tireSetCost } from '@/engine/systems/tires';
import { stereoCover, stereoQuote } from '@/engine/systems/caraudio';
import { wrapCost, wrapShopById } from '@/engine/systems/wraps';
import { TINT } from '@/engine/systems/tint';
import { boxOn, roofCatalog } from '@/engine/systems/roofbox';
import { itemsOf } from '@/engine/systems/items';
import { interiorQuote } from '@/engine/systems/interiors';
import { PRIVATE_SALE_KIND, dealerOffer, listingQuote } from '@/engine/systems/carsale';
import { overdraftHeadroom } from '@/engine/systems/lending';
import { cardRoom } from '@/engine/systems/credit';
import { MOD_LOADING, modLoading } from '@/engine/systems/mods';
import { earlyEnd, leaseQuote } from '@/engine/systems/leasing';
import { redemption, repoFees } from '@/engine/systems/repossession';
import { caravanQuote, caravansOf, caravanValue, towFor } from '@/engine/systems/caravans';
import { CARAVAN_YEAR, HITCH_FIT } from '@/engine/content/caravans';
import { boatQuote, certified } from '@/engine/systems/boats';
import { BOAT_RULES } from '@/engine/content/boats';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { TIRE_PRODUCTS } from '@/engine/content/tirecatalog';

const NY = 'us-ny-newyork';
const LDN = 'uk-eng-london';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
const carOf = (sim: Simulation, id: string): OwnedVehicle => vehiclesOf(sim.player).find((v) => v.id === id)!;
/** What was charged to the ledger's expense lines under memos matching, each transaction's on its own. */
const charged = (sim: Simulation, re: RegExp): number[] => Object.values(sim.universe.transactions).filter((t) => re.test(t.memo)).map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.kind === 'expense' && p.amount > 0).reduce((a, p) => a + p.amount, 0));
const pending = (sim: Simulation, kind: string, vehicleId: string) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === kind && i.payload.vehicleId === vehicleId);

/**
 * Everything in the bank given to the family, posted, so the ledger's law
 * holds; with `overdraft`, the current account's overdraft spent too. What
 * was given, to give back.
 */
function giveAway(sim: Simulation, overdraft = false): { accountId: string; amount: number }[] {
  const given: { accountId: string; amount: number }[] = [];
  const out = (accountId: string, amount: number) => {
    given.push({ accountId, amount });
    sim.post({ memo: 'Given to the family', category: 'transfer', postings: [{ accountId, amount: -amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount }] });
  };
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    out(a.id, a.balance);
  }
  const room = overdraft ? overdraftHeadroom(sim, sim.player) : 0;
  if (room > 0) out(sim.player.primaryAccountId!, room);
  return given;
}
function giveBack(sim: Simulation, given: { accountId: string; amount: number }[]): void {
  for (const g of given) sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: g.accountId, amount: g.amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -g.amount }] });
}

describe('cars: a used car from the forecourt to its buyer', () => {
  it('test-drives, inspects, buys a broken Camry, has it towed and mended on a loaner, drives, fits it out, and sells it privately', () => {
    let sim = life('journey-cars-own');
    expect(licenseOf(sim.player, sim.now)).toBeDefined();
    const CAMRY = 'us-toyota-camry';
    const m = modelById(CAMRY)!;
    // This month's Camrys on offer: one of them broken down, as the AA's seven in ten used cars have something wrong.
    const offer = usedListings(sim, sim.player, CAMRY, NY, 'US-NY');
    const listing = offer.find((l) => usedFault(sim, sim.player, CAMRY, l.age, NY, sim.now)?.severe)!;
    expect(listing).toBeDefined();
    const age = listing.age;

    // Edge: an age not on offer this month isn't driven.
    const absent = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((a) => !offer.some((l) => l.age === a))!;
    expect(sim.execute({ kind: 'vehicle.test_drive', payload: { modelId: CAMRY, age: absent } }).error).toBe('No car of that age is on offer this month.');
    // The test drive: half an hour at the dealer, and the fault shows.
    const t0 = sim.now;
    const drove = sim.must<{ showed: boolean; severe?: boolean }>({ kind: 'vehicle.test_drive', payload: { modelId: CAMRY, age } });
    expect(sim.now - t0).toBe(30 * 60_000);
    expect(drove).toMatchObject({ showed: true, severe: true });
    // The inspection: Lemon Squad's $219.99 and no more, and a report that prices the repair.
    let before = banked(sim);
    const report = sim.must<{ fault: boolean; usd?: number; severe?: boolean }>({ kind: 'vehicle.inspect_used', payload: { modelId: CAMRY, age } });
    expect(before - banked(sim)).toBe(inspectionPrice(sim, 'US-NY'));
    expect(inspectionPrice(sim, 'US-NY')).toBe(21_999);
    expect(report).toMatchObject({ fault: true, severe: true });

    // Interruption: the bank emptied, the car refused, and nothing taken and no car kept.
    const given = giveAway(sim);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: CAMRY, age } }).error).toMatch(/is more than the bank can cover\.$/);
    expect(banked(sim)).toBe(0);
    expect(vehiclesOf(sim.player)).toHaveLength(0);
    giveBack(sim, given);

    // Bought on liability cover, at the private seller's price: no dealer's documentation fee.
    const q = quote(m, NY, sim.now, { age, person: sim.player, ...(listing.seller === 'private' ? { privateSeller: true } : {}) }) as Quote;
    before = banked(sim);
    const bought = sim.must<{ vehicleId: string; paid: number }>({ kind: 'vehicle.buy', payload: { modelId: CAMRY, age, coverage: 'liability' } });
    expect(bought.paid).toBe(q.total);
    expect(before - banked(sim)).toBe(q.total);
    const id = bought.vehicleId;
    let v = carOf(sim, id);
    expect(v.fault).toMatchObject({ severe: true, usd: report.usd });
    expect(v.odometerAtPurchase).toBe(listing.odometerKm);
    // The fault is worth its repair less to a buyer.
    expect(valueOf(v, sim.now)).toBe(valueOf({ ...v, fault: undefined }, sim.now) - faultCost(v, 'USD'));

    // Broken down, five days go by: the tank untouched and nothing on the clock, and it goes nowhere.
    sim.advanceBy(5 * MS_DAY);
    expect(levelOf(v)).toBe(1);
    expect(v.dayKm ?? 0).toBe(0);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toBe('It’s broken down, and needs a repair before it goes anywhere.');

    // AAA Northeast joined: the month's dues and the enrollment fee, once.
    before = banked(sim);
    const joined = sim.must<{ paid: number }>({ kind: 'roadside.join', payload: { tierId: 'aaa-ne-basic' } });
    expect(joined.paid).toBe(duesOf(sim, sim.player, tierById('aaa-ne-basic')!).first);
    expect(joined.paid).toBe(430 + 1_500);
    expect(before - banked(sim)).toBe(joined.paid);
    expect(sim.execute({ kind: 'roadside.join', payload: { tierId: 'aaa-ne-premier' } }).error).toBe('You’re a member of AAA Northeast already.');

    // The repair asked of Toyota of Manhattan: an American dealer's wait, nothing paid now, and booked once.
    before = banked(sim);
    const booked = sim.must<{ paid: number; bookedFor?: number }>({ kind: 'vehicle.repair', payload: { vehicleId: id, shopId: 'toyota-of-manhattan' } });
    expect(booked.paid).toBe(0);
    expect(booked.bookedFor! - sim.now).toBeGreaterThanOrEqual(5.2 * MS_DAY);
    expect(banked(sim)).toBe(before);
    expect(sim.execute({ kind: 'vehicle.repair', payload: { vehicleId: id, shopId: 'midas-w53' } }).error).toBe('It’s booked in at Toyota of Manhattan.');
    expect(pending(sim, REPAIR_DUE_KIND, id)).toHaveLength(1);

    // Saved and loaded while it waits: the booking and its appointment kept.
    sim = reload(sim);
    v = carOf(sim, id);
    expect(v.booked?.at).toBe(booked.bookedFor);
    expect(pending(sim, REPAIR_DUE_KIND, id)).toHaveLength(1);

    // Taken in at the appointment: the bill is the fault's (out of warranty at its age), the tow AAA's call.
    const bill = repairShare(sim, v, m, 'Toyota', faultCost(v, 'USD'), booked.bookedFor!).yours;
    expect(bill).toBe(faultCost(v, 'USD'));
    sim.advanceTo(booked.bookedFor! + 60_000);
    v = carOf(sim, id);
    expect(v.fault).toBeUndefined();
    expect(inShopNow(v, sim.now)).toBe(true);
    expect(charged(sim, /^Repair at Toyota of Manhattan, the Toyota Camry$/)).toEqual([bill]);
    // AAA's basic tier tows three miles free; the rest of the town's leg is paid at $3.75 a mile, well under a tow without the club.
    const towed = charged(sim, /^A tow, the Toyota Camry to Toyota of Manhattan$/);
    const freeKm = tierById('aaa-ne-basic')!.towKm!;
    expect(towed).toEqual([Math.round((LEG_KM.na.errand - freeKm) * (3.75 / 1.609344) * 100)]);
    expect(towed[0]!).toBeLessThan(towPrice(sim, 'US-NY', NY, LEG_KM.na.errand, false));
    expect(membershipOf(sim.player)?.used).toBe(1);

    // In the shop, the car is refused; the dealer's loaner, free, is driven instead, and once.
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toMatch(/^It’s at Toyota of Manhattan until /);
    before = banked(sim);
    const loaner = sim.must<{ rentalId: string; paid: number; loaner: boolean }>({ kind: 'vehicle.stand_in', payload: { vehicleId: id } });
    expect(loaner).toMatchObject({ paid: 0, loaner: true });
    expect(banked(sim)).toBe(before);
    expect(sim.execute({ kind: 'vehicle.stand_in', payload: { vehicleId: id } }).error).toBe('It has a stand-in already.');
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(v.km ?? 0).toBe(0);
    expect(levelOf(v)).toBe(1);
    // Ready three days on: the loaner goes back the hour it is, and the car is theirs to drive.
    sim.advanceTo(v.inShop!.until + MS_HOUR);
    expect(rentalsOf(sim.player).find((r) => r.id === loaner.rentalId)!.status).toBe('returned');
    expect(inShopNow(v, sim.now)).toBe(false);

    // Its days now burn the tank, a day's kilometers at a time, at its model year's economy.
    const cap = capacityOf(m)!.size;
    const daily = burnOf(m, dayKm(v), v)! / cap;
    let level = levelOf(v);
    sim.advanceBy(4 * MS_DAY);
    expect(level - levelOf(v)).toBeCloseTo(4 * daily, 9);
    // Filled by the driver as it goes, the days stop drawing on it; filled by you again, they start.
    expect(sim.must<{ fillUp: string }>({ kind: 'vehicle.set_filling', payload: { vehicleId: id, auto: true } }).fillUp).toBe('auto');
    level = levelOf(v);
    sim.advanceBy(3 * MS_DAY);
    expect(levelOf(v)).toBe(level);
    sim.must({ kind: 'vehicle.set_filling', payload: { vehicleId: id, auto: false } });
    sim.advanceBy(2 * MS_DAY + MS_HOUR);
    expect(level - levelOf(v)).toBeCloseTo(2 * daily, 9);

    // Filled at the station: what went in at the pump's price, and the bank down by it; a second fill, full, refused.
    level = levelOf(v);
    before = banked(sim);
    const fill = sim.must<{ amount: number; paid: number; level: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: id } });
    expect(fill.level).toBe(1);
    expect(fill.amount).toBeCloseTo((1 - level) * cap, 9);
    expect(before - banked(sim)).toBe(fill.paid);
    expect(fill.paid).toBeGreaterThan(0);
    before = banked(sim);
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: id } }).error).toBe('The tank is full.');
    expect(banked(sim)).toBe(before);

    // The month: its days' kilometers on the odometer, and liability's premium billed once.
    const liability = monthlyInsurance('US-NY', 'liability', m) as number;
    sim.advanceTo(v.boughtAt + 30 * MS_DAY - 60_000);
    expect(v.km ?? 0).toBe(0);
    const driven = v.dayKm!;
    expect(driven).toBeGreaterThan(0);
    sim.advanceTo(v.boughtAt + 30 * MS_DAY + 60_000);
    expect(v.km).toBeCloseTo(driven, 9);
    expect(v.dayKm).toBe(0);
    expect(odometerOf(v)).toBeCloseTo(listing.odometerKm + driven, 6);
    expect(charged(sim, /^Car insurance, the Toyota Camry$/)).toEqual([liability]);
    // Full cover taken: the next month is billed at it.
    expect(sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: id, coverage: 'liability' } }).error).toBe('It has that cover already.');
    sim.must({ kind: 'vehicle.coverage', payload: { vehicleId: id, coverage: 'full' } });
    const full = monthlyInsurance('US-NY', 'full', m) as number;
    expect(full).toBeGreaterThan(liability);
    sim.advanceTo(v.boughtAt + 60 * MS_DAY + MS_HOUR);
    expect(charged(sim, /^Car insurance, the Toyota Camry$/)).toEqual([liability, full]);
    expect(v.km!).toBeGreaterThan(driven);

    // Serviced at Midas: its price, recorded at the odometer, in for the work's hours; a second refused while it's in, and not charged.
    before = banked(sim);
    const serviced = sim.must<{ paid: number; readyAt: number }>({ kind: 'vehicle.service', payload: { vehicleId: id, shopId: 'midas-w53' } });
    expect(serviced.paid).toBe(serviceCost(sim, v));
    expect(before - banked(sim)).toBe(serviced.paid);
    expect(v.services!.at(-1)!.km).toBeCloseTo(odometerOf(v), 6);
    before = banked(sim);
    expect(sim.execute({ kind: 'vehicle.service', payload: { vehicleId: id, shopId: 'midas-w53' } }).error).toBe('It’s in a shop already.');
    expect(sim.execute({ kind: 'vehicle.wrap', payload: { vehicleId: id, shopId: 'wrp', color: 'Blue', finish: 'matte' } }).error).toBe('It’s in a shop already.');
    expect(banked(sim)).toBe(before);
    sim.advanceTo(serviced.readyAt + 60_000);

    // A new set of four at the market's price, fitted at today's odometer.
    before = banked(sim);
    const shod = sim.must<{ paid: number }>({ kind: 'vehicle.replace_tires', payload: { vehicleId: id } });
    expect(shod.paid).toBe(tireSetCost(sim, v));
    expect(before - banked(sim)).toBe(shod.paid);
    expect(v.tiresAtKm).toBeCloseTo(odometerOf(v), 6);

    // A stereo fitted, once: what full cover then pays for it if the car's lost, nothing before.
    expect(stereoCover(sim, v, valueOf(v, sim.now))).toBe(0);
    const stereoPrice = (stereoQuote(sim, v) as { price: number }).price;
    before = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.stereo', payload: { vehicleId: id } }).paid).toBe(stereoPrice);
    expect(before - banked(sim)).toBe(stereoPrice);
    expect(v.stereo).toBe(true);
    expect(stereoCover(sim, v, valueOf(v, sim.now))).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'vehicle.stereo', payload: { vehicleId: id } }).error).toBe('It has one.');
    const speakers = sim.must<{ paid: number }>({ kind: 'vehicle.audio', payload: { vehicleId: id, part: 'speakers' } });
    expect(speakers.paid).toBeGreaterThan(0);
    expect(v.audio).toEqual(['speakers']);
    expect(stereoCover(sim, v, valueOf(v, sim.now))).toBeGreaterThan(stereoPrice);

    // Wrapped at WRP in matte blue: a color the film doesn't come in refused; the shop's price, and three days in.
    expect(sim.execute({ kind: 'vehicle.wrap', payload: { vehicleId: id, shopId: 'wrp', color: 'Chartreuse', finish: 'matte' } }).error).toBe('Choose a color the film comes in.');
    before = banked(sim);
    const wrapped = sim.must<{ paid: number; readyAt: number }>({ kind: 'vehicle.wrap', payload: { vehicleId: id, shopId: 'wrp', color: 'Blue', finish: 'matte' } });
    expect(wrapped.paid).toBe(wrapCost(sim, wrapShopById('wrp')!, m));
    expect(before - banked(sim)).toBe(wrapped.paid);
    expect(wrapped.readyAt - sim.now).toBe(3 * MS_DAY);
    expect(v.wrap).toMatchObject({ color: 'Blue', finish: 'matte', shopId: 'wrp' });
    sim.advanceTo(wrapped.readyAt + 60_000);

    // A month and more of its days on one fill: it's run dry, and goes nowhere until it's filled again.
    expect(v.dry).toBe(true);
    expect(levelOf(v)).toBeLessThan(0.01);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toMatch(/^There isn’t enough in the tank to get there/);
    sim.must({ kind: 'vehicle.refuel', payload: { vehicleId: id } });
    expect(v.dry).toBeUndefined();

    // Tinted all round, darker than New York allows: its price, and a cooler cabin that stretches the range a little.
    const rangeBare = rangeKm(v)!;
    before = banked(sim);
    const tinted = sim.must<{ paid: number; legal: boolean }>({ kind: 'vehicle.tint', payload: { vehicleId: id, kind: 'full' } });
    expect(tinted).toEqual({ paid: TINT['US-NY'].kinds.full!.price * 100, legal: false });
    expect(before - banked(sim)).toBe(tinted.paid);
    expect(rangeKm(v)!).toBeGreaterThan(rangeBare);
    expect(sim.execute({ kind: 'vehicle.tint', payload: { vehicleId: id, kind: 'full' } }).error).toBe('It’s tinted.');

    // A roof box: refused before a rack; the rack, then Yakima's SkyBox 12, on the roof as a thing of theirs, and its drag shortens the range.
    expect(sim.execute({ kind: 'vehicle.roof_box', payload: { vehicleId: id, boxId: 'yakima-skybox-12' } }).error).toBe('A box goes on a roof rack: fit one first.');
    const roof = roofCatalog(sim, v);
    before = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.roof_rack', payload: { vehicleId: id } }).paid).toBe(roof.rack!.price);
    const tintedRange = rangeKm(v)!;
    const box = roof.boxes.find((b) => b.id === 'yakima-skybox-12')!;
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.roof_box', payload: { vehicleId: id, boxId: box.id } }).paid).toBe(box.cost);
    expect(before - banked(sim)).toBe(roof.rack!.price + box.cost);
    expect(boxOn(sim.player, v)?.at).toEqual({ kind: 'vehicle', vehicleId: id });
    expect(v.roofBoxL).toBe(box.liters);
    expect(rangeKm(v)!).toBeLessThan(tintedRange);
    expect(sim.execute({ kind: 'vehicle.roof_box', payload: { vehicleId: id, boxId: box.id } }).error).toBe('It has a box on.');
    // Taken off at home between trips: kept in storage, and the range back.
    expect(sim.must<{ on: boolean }>({ kind: 'vehicle.roof_box_fit', payload: { vehicleId: id, on: false } }).on).toBe(false);
    const stored = itemsOf(sim.player).find((i) => i.kind === `roofbox:${box.id}`)!;
    expect(stored.at).toMatchObject({ kind: 'home', spot: 'storage' });
    expect(v.roofBoxL).toBeUndefined();
    expect(rangeKm(v)!).toBeCloseTo(tintedRange, 9);

    // Kept on the street: the shared flat has no garage.
    expect(sim.execute({ kind: 'vehicle.keep_in', payload: { vehicleId: id, where: 'garage' } }).error).toBe('Your home has no garage.');
    expect(sim.must<{ keptIn: string }>({ kind: 'vehicle.keep_in', payload: { vehicleId: id, where: 'street' } }).keptIn).toBe('street');

    // The steering wheel retrimmed in leather at City Seat Covers: the estimate's total, and in for its days.
    const design = [{ part: 'steering' as const, material: 'leather' as const, color: 'Black', stitching: 'Red' }];
    const estimate = interiorQuote(sim, 'city-seat-covers-lic', design) as { total: number; days: number };
    before = banked(sim);
    const trimmed = sim.must<{ paid: number; readyAt: number }>({ kind: 'vehicle.interior', payload: { vehicleId: id, shopId: 'city-seat-covers-lic', design } });
    expect(trimmed.paid).toBe(estimate.total);
    expect(before - banked(sim)).toBe(estimate.total);
    expect(v.interior?.parts).toEqual(design);
    expect(inShopNow(v, sim.now)).toBe(true);
    sim.advanceTo(trimmed.readyAt + 60_000);

    // Saved and loaded with all of it fitted.
    sim = reload(sim);
    v = carOf(sim, id);
    expect(v).toMatchObject({ stereo: true, audio: ['speakers'], tint: 'full', roofRack: true, keptIn: 'street', coverage: 'full' });
    expect(v.wrap?.color).toBe('Blue');
    expect(itemsOf(sim.player).find((i) => i.kind === `roofbox:${box.id}`)?.at).toMatchObject({ kind: 'home' });

    // The license lost: the car isn't driven, not on an errand and not its month, until it's replaced.
    const card = licenseOf(sim.player, sim.now)!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: card.id } });
    expect(mayDrive(sim.player, NY, sim.now).ok).toBe(false);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).ok).toBe(false);
    const nextMonth = pending(sim, 'vehicle.month', id)[0]!.at;
    sim.advanceTo(nextMonth - 60_000);
    const kmLost = v.km!;
    const levelLost = levelOf(v);
    sim.advanceTo(nextMonth + 60_000);
    expect(v.km).toBe(kmLost);
    expect(levelOf(v)).toBe(levelLost);
    sim.must({ kind: 'documents.replace_license', payload: { documentId: card.id } });
    expect(mayDrive(sim.player, NY, sim.now).ok).toBe(true);
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(v.km!).toBeGreaterThan(kmLost);

    // Listed on Craigslist for its $5; listed once; taken down, and so not sold when its buyer would have come.
    const site = listingQuote(sim, v)!;
    before = banked(sim);
    const listed = sim.must<{ platform: string; sellsAt: number; fee: number }>({ kind: 'vehicle.list', payload: { vehicleId: id } });
    expect(listed).toMatchObject({ platform: 'Craigslist', fee: site.fee });
    expect(site.fee).toBe(500);
    expect(before - banked(sim)).toBe(500);
    expect(sim.execute({ kind: 'vehicle.list', payload: { vehicleId: id } }).error).toBe('It’s listed on Craigslist.');
    sim.must({ kind: 'vehicle.unlist', payload: { vehicleId: id } });
    expect(pending(sim, PRIVATE_SALE_KIND, id)).toHaveLength(0);
    expect(sim.execute({ kind: 'vehicle.unlist', payload: { vehicleId: id } }).error).toBe('It isn’t listed.');
    sim.advanceTo(listed.sellsAt + MS_DAY);
    expect(v.soldAt).toBeUndefined();

    // Listed again, and sold to its buyer at its value that day; its insurance and its months end with it.
    const again = sim.must<{ sellsAt: number }>({ kind: 'vehicle.list', payload: { vehicleId: id } });
    sim.advanceTo(again.sellsAt + MS_HOUR);
    expect(v.soldAt).toBeDefined();
    const sale = Object.values(sim.universe.transactions).filter((t) => t.memo === 'Sold the Toyota Camry privately');
    expect(sale).toHaveLength(1);
    expect(sale[0]!.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(valueOf(v, v.soldAt!));
    expect(valueOf(v, v.soldAt!)).toBeLessThan(Math.round(m.price * kept(age)));
    const premiums = charged(sim, /^Car insurance, the Toyota Camry$/).length;
    sim.advanceBy(61 * MS_DAY);
    expect(charged(sim, /^Car insurance, the Toyota Camry$/)).toHaveLength(premiums);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.payload.vehicleId === id)).toEqual([]);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toBe('That isn’t a car you own.');
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: id } }).error).toBe('That isn’t a car you own.');
    // The box, off the car before the sale, is still theirs at home.
    expect(itemsOf(sim.player).find((i) => i.kind === `roofbox:${box.id}`)?.at).toMatchObject({ kind: 'home' });

    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('cars: London, where the paperwork and the premium differ', () => {
  it('transfers a private sale before it’s driven, prices a wrap and tint into the premium and out again, and leaves the RAC', () => {
    let sim = life('journey-cars-london', LDN);
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'uk', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const QASHQAI = 'gb-nissan-qashqai';
    const m = modelById(QASHQAI)!;
    const listing = usedListings(sim, sim.player, QASHQAI, LDN, 'GB').find((l) => l.seller === 'private' && !usedFault(sim, sim.player, QASHQAI, l.age, LDN, sim.now))!;
    expect(listing).toBeDefined();
    const id = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: QASHQAI, age: listing.age } }).vehicleId;
    let v = carOf(sim, id);
    // Bought from a private seller, it's the DVLA's to transfer and tax before it goes anywhere.
    expect(v.transferBy).toBeDefined();
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toBe('It’s driven once it’s transferred to you and taxed.');
    const before = banked(sim);
    expect(sim.must<{ penalty: number; fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: id } })).toEqual({ penalty: 0, fee: 0 });
    expect(banked(sim)).toBe(before);
    expect(sim.execute({ kind: 'vehicle.transfer', payload: { vehicleId: id } }).error).toBe('It’s in your name.');
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(v.km!).toBeGreaterThan(0);

    // The first month at the plain premium.
    const base = monthlyInsurance('GB', 'full', m) as number;
    sim.advanceTo(v.boughtAt + 30 * MS_DAY + MS_HOUR);
    const premiums = () => charged(sim, /^Car insurance, the Nissan Qashqai$/);
    expect(premiums()).toEqual([base]);

    // Wrapped at London Tint Studio and tinted: both declared to the insurer, both loaded on the premium.
    const wrapped = sim.must<{ paid: number; readyAt: number }>({ kind: 'vehicle.wrap', payload: { vehicleId: id, shopId: 'london-tint-studio', color: 'Green', finish: 'gloss' } });
    expect(wrapped.paid).toBe(1_400_00);
    expect(wrapped.readyAt - sim.now).toBe(3 * MS_DAY);
    const tinted = sim.must<{ paid: number; legal: boolean }>({ kind: 'vehicle.tint', payload: { vehicleId: id, kind: 'rear' } });
    expect(tinted).toEqual({ paid: 160_00, legal: true });
    expect(sim.execute({ kind: 'vehicle.tint', payload: { vehicleId: id, kind: 'full' } }).error).toBe('It’s tinted.');
    expect(modLoading(v)).toBeCloseTo((1 + MOD_LOADING.respray) * (1 + MOD_LOADING.tint), 12);
    sim.advanceTo(v.boughtAt + 60 * MS_DAY + MS_HOUR);
    expect(premiums()).toEqual([base, Math.round(base * (1 + MOD_LOADING.respray) * (1 + MOD_LOADING.tint))]);

    // Saved and loaded with the wrap on.
    sim = reload(sim);
    v = carOf(sim, id);
    expect(v.wrap).toMatchObject({ color: 'Green', finish: 'gloss', shopId: 'london-tint-studio' });

    // The wrap taken off at Raccoon, its posted price and a day in; the next month's premium carries the tint alone.
    expect(sim.execute({ kind: 'vehicle.unwrap', payload: { vehicleId: id, shopId: 'london-tint-studio' } }).error).toBe('That shop posts no price for taking a wrap off.');
    const off = sim.must<{ paid: number; readyAt: number }>({ kind: 'vehicle.unwrap', payload: { vehicleId: id, shopId: 'raccoon' } });
    expect(off.paid).toBe(500_00);
    expect(off.readyAt - sim.now).toBe(MS_DAY);
    expect(v.wrap).toBeUndefined();
    expect(sim.execute({ kind: 'vehicle.unwrap', payload: { vehicleId: id, shopId: 'raccoon' } }).error).toBe('It isn’t wrapped.');
    sim.advanceTo(v.boughtAt + 90 * MS_DAY + MS_HOUR);
    expect(premiums()).toEqual([base, Math.round(base * (1 + MOD_LOADING.respray) * (1 + MOD_LOADING.tint)), Math.round(base * (1 + MOD_LOADING.tint))]);
    // Liability alone isn't published for Britain: asking for it changes nothing and charges no fee.
    expect(sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: id, coverage: 'liability' } }).error).toBe('Liability alone isn’t offered for it here.');
    expect(charged(sim, /^The insurer’s fee to change cover$/)).toEqual([]);

    // The RAC joined, a month's dues; left, and nothing more is taken.
    const rac = sim.must<{ paid: number; renewAt: number }>({ kind: 'roadside.join', payload: { tierId: 'rac-basic' } });
    expect(rac.paid).toBe(529);
    sim.must({ kind: 'roadside.leave', payload: {} });
    expect(membershipOf(sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'roadside.leave', payload: {} }).error).toBe('You aren’t a member of a club.');
    sim.advanceTo(rac.renewAt + 31 * MS_DAY);
    expect(charged(sim, /^RAC, Basic$/)).toEqual([529]);

    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('cars: a lease bought out, a lease handed back', () => {
  it('keeps a leased Camry the lessor’s until it’s bought out and sold, and ends a second’s payments when it goes back', () => {
    let sim = life('journey-cars-lease');
    const CAMRY = 'us-toyota-camry';
    // Edge: a lease on liability cover is refused before anything is paid.
    let before = banked(sim);
    expect(sim.execute({ kind: 'vehicle.lease', payload: { modelId: CAMRY, coverage: 'liability' } }).error).toBe('A lender asks for full cover on its car.');
    expect(banked(sim)).toBe(before);
    const q = leaseQuote(CAMRY, NY, sim.now, 36, sim.player) as Exclude<ReturnType<typeof leaseQuote>, string>;
    const leased = sim.must<{ vehicleId: string; paid: number; monthly: number }>({ kind: 'vehicle.lease', payload: { modelId: CAMRY, months: 36 } });
    expect(leased.paid).toBe(q.dueAtSigning);
    expect(before - banked(sim)).toBe(q.dueAtSigning);
    const id = leased.vehicleId;
    let v = carOf(sim, id);

    // The lessor's car: not sold, modified, retrimmed or put on liability.
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: id } }).error).toBe('A leased car is the lessor’s to sell: at the lease’s end it’s returned or bought out.');
    expect(sim.execute({ kind: 'vehicle.modify', payload: { vehicleId: id, mod: 'wheels' } }).error).toBe('A leased car is the lender’s, and isn’t modified.');
    expect(sim.execute({ kind: 'vehicle.interior', payload: { vehicleId: id, shopId: 'city-seat-covers-lic', design: [{ part: 'steering', material: 'leather', color: 'Black', stitching: '' }] } }).error).toBe('It’s the lessor’s car: its interior isn’t yours to change.');
    expect(sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: id, coverage: 'liability' } }).error).toBe('Its lender requires full cover while it’s owed.');

    // Shod in its own size only: a 17-inch set refused and nothing charged, a set that fits paid at its price.
    expect(sizesFor(v)).toEqual(['205/65R16']);
    const wrong = TIRE_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'us' && o.size === '215/55R17')!;
    before = banked(sim);
    expect(sim.execute({ kind: 'vehicle.replace_tires', payload: { vehicleId: id, offerId: wrong.id } }).error).toBe('It doesn’t fit: the Toyota Camry takes 205/65R16.');
    expect(banked(sim)).toBe(before);
    const fits = tireCatalog(sim, v, false)[0]!;
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.replace_tires', payload: { vehicleId: id, offerId: fits.offer.id } }).paid).toBe(fits.price);
    expect(before - banked(sim)).toBe(fits.price);
    expect(v.tires?.product).toBe(fits.product.id);

    // Its months: the payment and the insurance billed, once each.
    sim.advanceTo(v.boughtAt + 30 * MS_DAY + MS_HOUR);
    expect(charged(sim, /^Lease payment, the Toyota Camry$/)).toEqual([leased.monthly]);
    expect(charged(sim, /^Car insurance, the Toyota Camry$/)).toEqual([monthlyInsurance('US-NY', 'full', modelById(CAMRY)!)]);

    // Saved and loaded mid-lease.
    sim = reload(sim);
    v = carOf(sim, id);
    expect(v.lease?.monthsLeft).toBe(34);

    // Bought out early, at its balance with the tax: the car theirs, and then sold to a dealer at the dealer's offer.
    const early = earlyEnd(sim, v) as { buyout: number };
    before = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.lease_buyout', payload: { vehicleId: id } }).paid).toBe(early.buyout);
    expect(before - banked(sim)).toBe(early.buyout);
    expect(v.lease).toBeUndefined();
    expect(sim.execute({ kind: 'vehicle.lease_buyout', payload: { vehicleId: id } }).error).toBe('That isn’t a car you lease.');
    const offer = dealerOffer(sim, v);
    before = banked(sim);
    expect(sim.must<{ value: number }>({ kind: 'vehicle.sell', payload: { vehicleId: id } }).value).toBe(offer);
    expect(banked(sim) - before).toBe(offer);
    expect(v.soldAt).toBe(sim.now);

    // A second, a RAV4, handed back early: the charge paid, and its payments end.
    const second = sim.must<{ vehicleId: string; monthly: number }>({ kind: 'vehicle.lease', payload: { modelId: 'us-toyota-rav4', months: 36 } });
    const rav = carOf(sim, second.vehicleId);
    sim.advanceTo(rav.boughtAt + 30 * MS_DAY + MS_HOUR);
    expect(charged(sim, /^Lease payment, the Toyota RAV4$/)).toEqual([second.monthly]);
    before = banked(sim);
    const back = sim.must<{ paid: number }>({ kind: 'vehicle.lease_return', payload: { vehicleId: rav.id } });
    expect(back.paid).toBeGreaterThan(0);
    expect(before - banked(sim)).toBe(back.paid);
    expect(rav.soldAt).toBe(sim.now);
    expect(sim.execute({ kind: 'vehicle.lease_return', payload: { vehicleId: rav.id } }).error).toBe('That isn’t a car you lease.');
    sim.advanceBy(65 * MS_DAY);
    expect(charged(sim, /^Lease payment, the Toyota RAV4$/)).toEqual([second.monthly]);
    expect(charged(sim, /^Car insurance, the Toyota RAV4$/)).toHaveLength(1);

    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('cars: behind on the loan', () => {
  it('takes a financed car after three missed payments, refuses a redemption the bank can’t pay, and gives it back when it’s paid', () => {
    let sim = life('journey-cars-repo');
    // This life began without a license; given one, as most New Yorkers who drive hold.
    expect(licenseOf(sim.player, sim.now)).toBeUndefined();
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const COROLLA = 'us-toyota-corolla';
    const bought = sim.must<{ vehicleId: string; paid: number; monthly: number }>({ kind: 'vehicle.buy', payload: { modelId: COROLLA, financed: true, months: 60 } });
    const id = bought.vehicleId;
    let v = carOf(sim, id);
    expect(v.loan?.monthly).toBe(bought.monthly);
    // Edge: a financed car stays on full cover.
    expect(sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: id, coverage: 'liability' } }).error).toBe('Its lender requires full cover while it’s owed.');

    // Everything given to the family: three months of payments missed, and the lender takes it.
    const given = giveAway(sim);
    sim.advanceTo(v.boughtAt + 60 * MS_DAY + MS_HOUR);
    expect(v.loan?.missed).toBe(2);
    expect(v.repossessed).toBeUndefined();
    sim.advanceTo(v.boughtAt + 90 * MS_DAY + MS_HOUR);
    expect(v.loan?.missed).toBe(3);
    expect(v.repossessed).toBeDefined();
    expect(pending(sim, 'vehicle.repo_sale', id)).toHaveLength(1);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } }).error).toBe('The lender has the car.');
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: id } }).error).toBe('The lender has it: redeem it, or it’s sold for the loan.');
    // Redeeming with nothing in the bank is refused, and nothing moves.
    expect(sim.execute({ kind: 'vehicle.redeem', payload: { vehicleId: id } }).error).toMatch(/is more than the bank can pay\.$/);
    expect(v.repossessed).toBeDefined();

    // Saved and loaded in the lender's yard.
    sim = reload(sim);
    v = carOf(sim, id);
    expect(v.repossessed).toBeDefined();

    // The family's money back, and what redeems it lent besides: New York redeems on the whole balance, the tow and
    // the storage, and the sale is called off.
    giveBack(sim, given);
    const due = redemption(sim, v)!;
    expect(due).toBe(v.loan!.owed + v.loan!.missedAmount! + repoFees(sim, v));
    sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: due }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -due }] });
    const saleAt = v.repossessed!.saleAt;
    const before = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'vehicle.redeem', payload: { vehicleId: id } }).paid).toBe(due);
    expect(before - banked(sim)).toBe(due);
    expect(v.repossessed).toBeUndefined();
    expect(v.loan).toBeUndefined();
    expect(pending(sim, 'vehicle.repo_sale', id)).toHaveLength(0);
    expect(sim.execute({ kind: 'vehicle.redeem', payload: { vehicleId: id } }).error).toBe('That car isn’t repossessed.');
    sim.advanceTo(saleAt + MS_DAY);
    expect(v.soldAt).toBeUndefined();
    // Back, filled (its days ran it dry before the lender came) and driven: the fuel paid for with money of their own,
    // as a fill nobody can pay for is refused (from 2026-10-06).
    sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: 200_00 }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -200_00 }] });
    sim.must({ kind: 'vehicle.refuel', payload: { vehicleId: id } });
    const km = v.km ?? 0;
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(v.km!).toBeGreaterThan(km);

    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('cars: a caravan behind a pickup, and a boat', () => {
  it('fits a towbar only to a car rated to tow, waits for a factory-ordered pickup, tows the caravan with it, and sells caravan and boat', () => {
    const sim = life('journey-cars-tow');
    // A house of their own with a drive, where a caravan and a boat on its trailer are kept.
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 });
    sim.player.home = { kind: 'owned', cityId: NY, homeId: owned.id, since: sim.now };

    // Edge: a caravan the bank can't cover is refused and nothing taken.
    const given = giveAway(sim);
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).error).toMatch(/^It costs .*, taxed and registered\.$/);
    expect(caravansOf(sim.player)).toHaveLength(0);
    giveBack(sim, given);
    const cq = caravanQuote(sim, NY)!;
    let before = banked(sim);
    const caravan = sim.must<{ paid: number; caravanId: string }>({ kind: 'caravan.buy', payload: {} });
    expect(caravan.paid).toBe(cq.price + cq.tax + cq.registration);
    expect(before - banked(sim)).toBe(caravan.paid);

    // A towbar: refused on a Camry, rated to tow nothing; fitted to a RAV4, which is still too light for the Jayco.
    const camry = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).vehicleId;
    expect(sim.execute({ kind: 'vehicle.hitch', payload: { vehicleId: camry } }).error).toBe('Its maker rates it to tow nothing, or no rating was read.');
    const rav = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-rav4' } }).vehicleId;
    before = banked(sim);
    const hitched = sim.must<{ paid: number }>({ kind: 'vehicle.hitch', payload: { vehicleId: rav } });
    expect(hitched.paid).toBe(HITCH_FIT.US.amount * 100);
    expect(before - banked(sim)).toBe(hitched.paid);
    expect(sim.execute({ kind: 'vehicle.hitch', payload: { vehicleId: rav } }).error).toBe('It has one.');
    expect(towFor(sim.player, carOf(sim, rav), NY, 'us-ca-losangeles')).toMatch(/^Its maker rates it to tow \d+ kg, and the Jayco Jay Flight SLX 178DBS weighs up to \d+ kg\.$/);

    // An F-Series ordered from the factory in a paint that costs extra: on order, it isn't driven until it comes.
    const paint = 'us-ford-f-series:paint:argon-blue-metallic-e9-extra-charge-paint';
    const truck = sim.must<{ vehicleId: string; deliveredAt?: number }>({ kind: 'vehicle.buy', payload: { modelId: 'us-ford-f-series', options: [paint] } });
    expect(truck.deliveredAt! - sim.now).toBe(13 * 7 * MS_DAY);
    const f = carOf(sim, truck.vehicleId);
    expect(f.options).toEqual([paint]);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: f.id } }).error).toMatch(/^It’s on order: it comes /);
    sim.must({ kind: 'vehicle.hitch', payload: { vehicleId: f.id } });

    // Its months meanwhile: the caravan insured a twelfth of its year each.
    sim.advanceTo(truck.deliveredAt! + MS_HOUR);
    const caravanMonths = charged(sim, /^The caravan’s insurance, a month$/);
    expect(caravanMonths.length).toBeGreaterThanOrEqual(3);
    expect(new Set(caravanMonths)).toEqual(new Set([Math.round((CARAVAN_YEAR['US-NY'].insurance * 100) / 12)]));
    // Come, it's driven, and the Jayco goes behind it.
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: f.id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(towFor(sim.player, f, NY, 'us-ca-losangeles')).toMatchObject({ id: caravan.caravanId });

    // A boat: owned without a certificate, operated only with one, bought once.
    const bq = boatQuote(sim, NY)!;
    before = banked(sim);
    const boat = sim.must<{ paid: number; boatId: string }>({ kind: 'boat.buy', payload: {} });
    expect(boat.paid).toBe(bq.price + bq.tax + bq.registration);
    expect(before - banked(sim)).toBe(boat.paid);
    expect(certified(sim.player, 'US-NY')).toBe(false);
    const cert = sim.must<{ paid: number }>({ kind: 'boat.certify', payload: {} });
    expect(cert.paid).toBe(BOAT_RULES['US-NY'].certificate!.amount * 100);
    expect(certified(sim.player, 'US-NY')).toBe(true);
    expect(sim.execute({ kind: 'boat.certify', payload: {} }).error).toBe('You hold it.');
    sim.advanceBy(31 * MS_DAY);
    expect(charged(sim, /^The boat’s insurance, a month$/)).toEqual([Math.round((BOAT_RULES['US-NY'].insuranceYear * 100) / 12)]);

    // Both sold: the boat at its price, the caravan at its worth on the car curve, and their months end.
    before = banked(sim);
    expect(sim.must<{ value: number }>({ kind: 'boat.sell', payload: { boatId: boat.boatId } }).value).toBe(bq.price);
    expect(banked(sim) - before).toBe(bq.price);
    const worth = caravanValue(caravansOf(sim.player)[0]!, sim.now);
    expect(worth).toBeLessThan(cq.price);
    before = banked(sim);
    expect(sim.must<{ value: number }>({ kind: 'caravan.sell', payload: { caravanId: caravan.caravanId } }).value).toBe(worth);
    expect(banked(sim) - before).toBe(worth);
    expect(sim.execute({ kind: 'caravan.sell', payload: { caravanId: caravan.caravanId } }).error).toBe('That isn’t a caravan you own.');
    expect(sim.execute({ kind: 'boat.sell', payload: { boatId: boat.boatId } }).error).toBe('That isn’t a boat you own.');
    const insured = { caravan: charged(sim, /^The caravan’s insurance, a month$/).length, boat: charged(sim, /^The boat’s insurance, a month$/).length };
    sim.advanceBy(61 * MS_DAY);
    expect(charged(sim, /^The caravan’s insurance, a month$/)).toHaveLength(insured.caravan);
    expect(charged(sim, /^The boat’s insurance, a month$/)).toHaveLength(insured.boat);
    expect(towFor(sim.player, f, NY, 'us-ca-losangeles')).toBe('No caravan of yours is there.');

    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('cars: defects this journey found, fixed on 2026-10-06', () => {
  // A car sold with its roof box on kept the box, stranded in a car no longer theirs: `sellVehicle` moved nothing out.
  it('takes a roof box off a car before it’s sold to a dealer', () => {
    const sim = life('journey-cars-box');
    const id = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).vehicleId;
    sim.must({ kind: 'vehicle.roof_rack', payload: { vehicleId: id } });
    sim.must({ kind: 'vehicle.roof_box', payload: { vehicleId: id, boxId: 'yakima-skybox-12' } });
    sim.must({ kind: 'vehicle.sell', payload: { vehicleId: id } });
    const box = itemsOf(sim.player).find((i) => i.kind === 'roofbox:yakima-skybox-12')!;
    expect(box.at).toMatchObject({ kind: 'home' });
    expect(breaches(sim.universe)).toEqual([]);
  });

  // A British private sale was refused on an errand until transferred but driven every day: `drivenThen` never
  // checked the transfer. Measured on this seed, 871.6 km in 31 days before the fix.
  it('doesn’t drive a British private sale before it’s transferred', () => {
    const sim = life('journey-cars-london', LDN);
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'uk', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const listing = usedListings(sim, sim.player, 'gb-nissan-qashqai', LDN, 'GB').find((l) => l.seller === 'private')!;
    const id = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'gb-nissan-qashqai', age: listing.age } }).vehicleId;
    const v = carOf(sim, id);
    expect(v.transferBy).toBeDefined();
    sim.advanceBy(31 * MS_DAY);
    expect(v.km ?? 0).toBe(0);
    expect(levelOf(v)).toBe(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  // A fill nobody could pay for went through into arrears, so its own refusal never came: `vehicle.refuel` paid with
  // `spend(..., true)`.
  it('refuses a fill that neither the bank nor the card can pay', () => {
    const sim = life('journey-cars-fuelbroke');
    if (!licenseOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const id = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-corolla' } }).vehicleId;
    sim.advanceBy(10 * MS_DAY);
    giveAway(sim, true);
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card')!;
    const room = cardRoom(sim.player, card);
    sim.post({ memo: 'Spent on the card by the family', category: 'transfer', postings: [{ accountId: card.id, amount: -room }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: room }] });
    const level = levelOf(carOf(sim, id));
    expect(level).toBeLessThan(1);
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: id } }).error).toMatch(/^It comes to .*, more than you can pay\.$/);
    expect(levelOf(carOf(sim, id))).toBe(level);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
