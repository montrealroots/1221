/**
 * The everyday journey, continued (the owner's audit of 2026-10-06): lives run
 * through the nine commands added that day, by the same commands the Career,
 * Food, Home, Homes, Routines and Belongings screens run, each step reading
 * what the one before it left.
 *
 * - **An actor's season, and a night in Los Angeles**: the week's breakdowns
 *   submitted for, once a part, and Monday's auditions the parts chosen, with
 *   the genre and demands they were posted with. Clippers bought at Walmart's
 *   $19.99 and the hair cut at home. A nominee going to the Emmys, on the
 *   calendar in Los Angeles; flown there, a suit bought in a store there and
 *   put on, and the result told in the room. An iPhone sent while away, held by
 *   FedEx for want of a signature; nothing done at home can be done from Los
 *   Angeles, the hair, the nails, the lawn or the parcel; home again, the
 *   parcel collected once.
 * - **A house in New York**: a recipe stopped by a power cut and finished
 *   when the power's back, once. A bed bought, and IKEA's queen set for it at
 *   $39.99, a second set kept in the drawers while the first is slept on; the
 *   toenails trimmed, the fingernails due from when the life began. In May
 *   the lawn watered, the inch onto the month's water, and the 1 June bill
 *   that much more than an unwatered twin's, to the cent.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance. What is set directly is said where it's set: a craft and a career
 * begun, which school gives; a guest part worked and nominated, which a
 * season's work and July's vote give; a house owned and lived in (buying one
 * is `journey-homes`'s); and a power cut, which the day's draw brings when it
 * brings it. Three things the game gets wrong are kept apart at the end,
 * skipped, as defects: a duvet set and clippers charged New York's shelf
 * price without its sales tax, and nails it doesn't know trimmed as fingers.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { BEDDING_SETS } from '@/engine/content/bedding';
import { NAILS } from '@/engine/content/homegrooming';
import { CAREER_WEEK_KIND, beginCareer, breakdownsOf, careerOf, weekOfAuditions, type Booking } from '@/engine/systems/career';
import { bindCeiling, ceilingFrom, evenCraft } from '@/engine/systems/school';
import { CEREMONY_KIND, ceremonyOf, dressedForCeremony, entriesOf, awardChances } from '@/engine/systems/awards';
import { inSaveMoney } from '@/engine/systems/banking';
import { GROOMING, groomingLift } from '@/engine/systems/hygiene';
import { clipperOffer, hasClippers, nailsDue } from '@/engine/systems/homegrooming';
import { beddingOf, beddingOffers, onTheBed } from '@/engine/systems/bedding';
import { bedAtHome } from '@/engine/systems/furniture';
import { itemsOf } from '@/engine/systems/items';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { inchOf, lawnOf } from '@/engine/systems/lawns';
import { litersUsed } from '@/engine/systems/water';
import { RENT_KIND, waterOf } from '@/engine/systems/household';
import { salesTaxRate } from '@/engine/content/tax';
import { livingOf } from '@/engine/systems/dwelling';
import { orderStage, ordersOf } from '@/engine/systems/orders';
import { PHONE_DAYS, phoneById, phonePrice, phonesOf } from '@/engine/systems/phones';
import { sizeFor } from '@/engine/systems/tailoring';
import { buyRefusal } from '@/engine/systems/clothing';
import { cookingLeft } from '@/engine/systems/kitchen';
import { mealsReady } from '@/engine/systems/pantry';
import { journeysOf } from '@/engine/systems/journey';

const NY = 'us-ny-newyork';
const LA = 'us-ca-losangeles';
const LA_ZONE = 'America/Los_Angeles';
const NY_ZONE = 'America/New_York';
const MONTH = (365.2425 / 12) * MS_DAY;

const life = (seed: string) => quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
const memo = (sim: Simulation, m: string) => sim.universe.transactions.filter((t) => t.memo === m);
/** What a transaction put into the life's own accounts, or took out of them. */
const into = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id && !sim.universe.accounts[p.accountId]?.nominal).reduce((s, p) => s + p.amount, 0);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** An hour of a date, in a zone. */
const on = (year: number, month: number, day: number, hour: number, zone: string) => instantFromZoned({ ...normalDate(year, month, day), hour }, zone);

/** A house with a yard in New York, owned and lived in: buying one is `journey-homes`'s, so it's built here as `journey-holdings` builds one. */
function house(sim: Simulation): void {
  const facts: HomeFacts = { type: 'house', address: '12 Elm Street', beds: 3, baths: 2, size: 1_200, lot: 5_000, built: 1990, features: ['yard'], parts: {}, hoaUsd: 0 };
  const owned = ownBuilt(sim, sim.player, { cityId: NY, facts, price: 600_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: NY, homeId: owned.id, since: sim.now };
}

/** An actor in New York with the business begun, as school leaves them (`journey-career`'s), in a house of their own. */
function actor(seed: string): Simulation {
  const sim = life(seed);
  sim.player.craft = evenCraft(80);
  sim.player.craftCeiling = ceilingFrom(sim.player.craft);
  bindCeiling(sim.player.craft, sim.player.craftCeiling);
  beginCareer(sim, sim.player);
  house(sim);
  return sim;
}

/** Monday's career week, as it's on the calendar. */
const careerWeek = (sim: Simulation) => sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === CAREER_WEEK_KIND && i.payload.personId === sim.player.id)!;
/** The week's auditions as Monday will draw them, from what's been submitted. */
const predicted = (sim: Simulation, at: number) => weekOfAuditions(sim, sim.player, at, undefined, NY, careerOf(sim.player).submitted, false, careerOf(sim.player).chosen ?? []);

describe('an actor’s season, and a night in Los Angeles', () => {
  it('submits for the week’s breakdowns, cuts their own hair, goes to the Emmys dressed for them, and collects a parcel FedEx held while they were away', () => {
    // The seed is the first of jem-0 on whose first Monday a breakdown chosen comes back; each submission is a draw at a free submission's odds.
    let sim!: Simulation;
    for (let i = 0; i < 40; i += 1) {
      sim = actor(`jem-${i}`);
      const week = careerWeek(sim);
      for (const b of breakdownsOf(sim, sim.player)) sim.must({ kind: 'career.submit_for', payload: { roleId: b.roleId } });
      if (predicted(sim, week.at).some((a) => a.chosen)) break;
    }
    const p = () => sim.player;
    const parts = breakdownsOf(sim, p());
    const career = () => careerOf(p());

    // Each part once, and the week's submissions spent on them; another part, or one not posted here, refused.
    expect(career().chosen).toEqual(parts);
    expect(career().submitted).toBe(parts.length);
    expect(sim.execute({ kind: 'career.submit_for', payload: { roleId: parts[0]!.roleId } }).error).toBe('You’ve submitted for it this week.');
    expect(sim.execute({ kind: 'career.submit_for', payload: { roleId: 'broadway' } }).error).toBe('That part isn’t taking submissions here this week.');
    expect(sim.execute({ kind: 'career.submit_for', payload: { roleId: 'no-such-part' } }).error).toBe('That part isn’t taking submissions here this week.');
    // The fifth, Submit Yourself's, and then none left.
    expect(sim.must<{ submitted: number }>({ kind: 'career.self_submit', payload: {} }).submitted).toBe(parts.length + 1);
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).error).toBe(`You’ve made this week’s ${parts.length + 1} submissions.`);

    sim = reload(sim);
    expect(career().chosen).toEqual(parts);
    expect(career().submitted).toBe(parts.length + 1);

    // Monday: the auditions are the parts chosen that came back, each as it was posted, and the week starts afresh.
    const week = careerWeek(sim);
    sim.advanceTo(week.at - 60_000);
    const expected = predicted(sim, week.at);
    const chosenBack = expected.filter((a) => a.chosen);
    expect(chosenBack.length).toBeGreaterThan(0);
    for (const a of chosenBack) expect(parts.find((b) => b.roleId === a.roleId)).toEqual({ roleId: a.roleId, ...(a.genre ? { genre: a.genre } : {}), ...(a.demands ? { demands: a.demands } : {}) });
    sim.advanceTo(week.at + 60_000);
    expect(career().auditions.filter((a) => a.self).map(({ roleId, at, mode, chosen, genre, demands }) => ({ roleId, at, mode, chosen, genre, demands }))).toEqual(expected.map(({ roleId, at, mode, chosen, genre, demands }) => ({ roleId, at, mode, chosen, genre, demands })));
    expect(career().chosen).toBeUndefined();
    expect(career().submitted).toBe(0);

    // Clippers at Walmart's quote, from the bank; not twice. (The quote is the $19.99 shelf price without New York's tax: a defect, kept apart below.)
    expect(sim.execute({ kind: 'hygiene.cut_hair', payload: {} }).error).toBe('You need clippers of your own.');
    let b0 = banked(sim);
    const clippers = clipperOffer(sim, p())!.cost;
    expect(clipperOffer(sim, p())!.kit).toMatchObject({ retailer: 'Walmart', price: 19.99 });
    expect(sim.must<{ paid: number }>({ kind: 'hygiene.buy_clippers', payload: {} }).paid).toBe(clippers);
    expect(b0 - banked(sim)).toBe(clippers);
    expect(memo(sim, 'Walmart, Wahl Chrome Pro Hair Clipper Kit').map((t) => -into(sim, t))).toEqual([clippers]);
    expect(itemsOf(p()).find((i) => i.clippers)!.at).toMatchObject({ kind: 'home', spot: 'bathroom' });
    expect(sim.execute({ kind: 'hygiene.buy_clippers', payload: {} }).error).toBe('You have clippers already.');
    expect(b0 - banked(sim)).toBe(clippers);

    // A haircut at home: a salon's 45 minutes, and the next one due from it, so another straight after lifts nothing.
    const start = sim.now;
    expect(groomingLift(p(), start)).toBeGreaterThan(0);
    const cut = sim.must<{ doneAt: number }>({ kind: 'hygiene.cut_hair', payload: {} });
    expect(cut.doneAt - start).toBe(GROOMING.minutes * 60_000);
    expect(p().groomedAt).toBe(cut.doneAt);
    expect(groomingLift(p(), sim.now)).toBe(0);

    // A guest part worked and nominated for this year's Emmys: the season's work and July's vote, given here.
    const booking: Booking = { id: 'w0', roleId: 'guest-hour', cityId: NY, starts: sim.now, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 1, owed: 0 };
    career().bookings.push(booking);
    entriesOf(p()).push({ bookingId: 'w0', body: 'emmys', year: 2026, category: 'guest-drama', entered: sim.now, byThem: true, nominated: true });

    // Going: a part not nominated, or another body's ceremony, refused; the Emmys on the calendar in Los Angeles; not twice.
    expect(sim.execute({ kind: 'career.attend_ceremony', payload: { bookingId: 'w9', body: 'emmys' } }).error).toBe('Only a nominee is asked.');
    expect(sim.execute({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'tonys' } }).error).toBe('Only a nominee is asked.');
    const emmys = ceremonyOf('emmys', 2026);
    expect(zonedParts(emmys.at, LA_ZONE)).toMatchObject({ year: 2026, month: 9, day: 14, hour: 12 });
    expect(sim.must<{ at: number }>({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'emmys' } }).at).toBe(emmys.at);
    expect(sim.execute({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'emmys' } }).error).toBe('You’re going.');
    const ceremonies = () => sim.universe.scheduled.filter((i) => i.kind === CEREMONY_KIND && i.status === 'pending');
    expect(ceremonies()).toHaveLength(1);
    expect(ceremonies()[0]).toMatchObject({ at: emmys.at, locationId: LA, stopsClock: true });

    sim = reload(sim);
    expect(hasClippers(p())).toBe(true);
    expect(p().groomedAt).toBe(cut.doneAt);
    expect(entriesOf(p())[0]).toMatchObject({ attending: true, nominated: true });
    expect(ceremonies()).toHaveLength(1);

    // An iPhone ordered the Sunday before, to come on the Sunday they're in Los Angeles; flown out on the Saturday, home on the Tuesday.
    sim.advanceTo(on(2026, 9, 6, 10, NY_ZONE));
    const iphone = phoneById('us-apple-iphone-16-128')!;
    const price = phonePrice(sim, p(), iphone);
    b0 = banked(sim);
    const orderId = sim.must<{ orderId: string }>({ kind: 'phone.buy', payload: { phoneId: iphone.id, color: iphone.colors[0] } }).orderId;
    expect(b0 - banked(sim)).toBe(price);
    const order = () => ordersOf(p()).find((o) => o.id === orderId)!;
    expect(order().arrivesAt).toBe(sim.now + PHONE_DAYS * MS_DAY);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day: on(2026, 9, 12, 12, NY_ZONE), slot: 1, returnDay: on(2026, 9, 15, 12, LA_ZONE), returnSlot: 1 } });
    const back = journeysOf(p()).find((j) => j.id === booked.returnId)!;

    // In Los Angeles when it comes: nobody home to sign, and FedEx holds it 7 days.
    sim.advanceTo(order().arrivesAt + MS_HOUR);
    expect(p().currentLocationId).toBe(LA);
    expect(order().held).toEqual({ carrier: 'FedEx', from: order().arrivesAt, until: order().arrivesAt + 7 * MS_DAY });
    expect(orderStage(p(), order(), sim.now)).toBe('Held For Collection');
    expect(titled(sim, 'A Delivery Was Missed')).toHaveLength(1);
    expect(phonesOf(p())[0]!.at.kind).toBe('order');

    // Nothing kept at home is done from here: the clippers, the nails, the lawn, the parcel.
    expect(sim.execute({ kind: 'hygiene.cut_hair', payload: {} }).error).toBe('Your clippers are at home.');
    expect(sim.execute({ kind: 'hygiene.trim_nails', payload: { which: 'fingers' } }).error).toBe('Nails are trimmed at home.');
    expect(sim.execute({ kind: 'home.water_lawn', payload: {} }).error).toBe('You’re away from home.');
    expect(sim.execute({ kind: 'orders.collect', payload: { orderId } }).error).toBe('It’s collected from FedEx where you live.');
    expect(order().held).toBeDefined();

    // The morning of the ceremony, a suit bought in a store there, sized to them, and put on.
    sim.advanceTo(on(2026, 9, 14, 9, LA_ZONE));
    // J.Crew's Crosby suit trousers, the one suit sold in a store here whose run their size is read off (Banana Republic's runs by the inch with no chart).
    const suit = CLOTHING_PRODUCTS.find((x) => x.id === 'us-j-crew-crosby-classic-fit-suit-pant-in-italian-wool-flannel')!;
    const size = sizeFor(sim, p(), suit.sizes, suit)!;
    expect(buyRefusal(p(), { productId: suit.id, how: 'store', size, color: suit.colors[0] })).toBeUndefined();
    expect(dressedForCeremony(p())).toBe(false);
    sim.must({ kind: 'clothes.buy', payload: { productId: suit.id, how: 'store', size, color: suit.colors[0] } });
    const worn = itemsOf(p()).find((i) => i.kind === suit.id)!;
    expect(worn.at.kind).toBe('person');
    sim.must({ kind: 'clothes.change', payload: { itemIds: [worn.id] } });
    expect(dressedForCeremony(p())).toBe(true);

    // At noon there, the vote's draw at its own odds, told in the room, the result the draw's.
    const e = () => entriesOf(p())[0]!;
    const won = sim.rng('awards.vote', p().id, 'w0-won').next() < awardChances(p(), booking, 'emmys', 'guest-drama').won;
    sim.advanceTo(emmys.at + MS_HOUR);
    expect(e()).toMatchObject({ won, there: true });
    expect(titled(sim, 'You Weren’t There')).toEqual([]);
    expect(titled(sim, won ? 'You Won' : 'Not This Time').map((n) => n.body.startsWith('At Los Angeles'))).toEqual([true]);
    expect(sim.execute({ kind: 'career.attend_ceremony', payload: { bookingId: 'w0', body: 'emmys' } }).error).toBe('Its ceremony has been held.');

    sim = reload(sim);
    expect(order().held!.carrier).toBe('FedEx');

    // Home the next day, inside FedEx's 7: a parcel not theirs refused; theirs collected, the phone home, once.
    sim.advanceTo(Math.max(back.arriveAt ?? back.leaveAt, sim.now) + 12 * MS_HOUR);
    expect(p().currentLocationId).toBe(NY);
    expect(sim.now).toBeLessThan(order().held!.until);
    expect(sim.execute({ kind: 'orders.collect', payload: { orderId: 'order-none' } }).error).toBe('No parcel of yours is held for collection.');
    expect(sim.must<{ collected: number }>({ kind: 'orders.collect', payload: { orderId } }).collected).toBe(1);
    expect(order()).toMatchObject({ status: 'delivered', deliveredAt: sim.now });
    expect(orderStage(p(), order(), sim.now)).toBe('Delivered');
    expect(phonesOf(p())[0]!.at.kind).toBe('home');
    expect(sim.execute({ kind: 'orders.collect', payload: { orderId } }).error).toBe('No parcel of yours is held for collection.');
    // Collected, it isn't sent back on the seventh day, nor refunded.
    sim.advanceTo(order().held!.until + MS_DAY);
    expect(order().status).toBe('delivered');
    expect(memo(sim, 'Apple: not collected from FedEx, refunded')).toEqual([]);

    // Home, the clippers are to hand again.
    expect(sim.execute({ kind: 'hygiene.cut_hair', payload: {} }).error).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);
});

describe('a house in New York', () => {
  it('finishes a recipe a power cut stopped, buys a bed and sets for it, trims the toenails, and waters the lawn onto the water bill', () => {
    let sim = life('jem-house');
    house(sim);
    const p = () => sim.player;

    // A recipe stopped by a power cut ten minutes in (the day's draw, given here), finished once it's back.
    expect(sim.execute({ kind: 'food.resume_cooking', payload: {} }).error).toBe('There’s no cooking left partway.');
    for (const [id, n] of [['thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag', 1], ['thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', 2], ['thefreshgrocer-bowl-basket-grape-tomatoes-pint', 4], ['thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz', 1], ['thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag', 1]] as const) sim.must({ kind: 'food.buy_groceries', payload: { productId: id, quantity: n } });
    const cookAt = sim.now;
    p().powerCut = { from: cookAt + 10 * 60_000, until: cookAt + 70 * 60_000, by: 'Con Edison' };
    expect(sim.must<{ left: number; stopped?: string }>({ kind: 'food.cook', payload: { recipeId: 'chicken-and-tomato-jacket-potato' } })).toEqual({ left: 0, stopped: 'The power went off' });
    expect(sim.now - cookAt).toBe(10 * 60_000);
    expect(cookingLeft(sim, p())).toMatchObject({ recipeId: 'chicken-and-tomato-jacket-potato', minutes: 30, minutesDone: 10, why: 'The power went off' });
    expect(mealsReady(sim, p())).toEqual([]);
    expect(sim.execute({ kind: 'food.resume_cooking', payload: {} }).error).toMatch(/^The power’s off until /);
    sim = reload(sim);
    expect(cookingLeft(sim, p())).toMatchObject({ minutes: 30, minutesDone: 10 });
    // Back on: the twenty minutes left, three portions in the fridge, and nothing more to finish.
    sim.advanceTo(cookAt + 70 * 60_000);
    const resumed = sim.now;
    expect(sim.must<{ left: number; stopped?: string }>({ kind: 'food.resume_cooking', payload: {} })).toEqual({ left: 3 });
    expect(sim.now - resumed).toBe(20 * 60_000);
    expect(p().cooking).toBeUndefined();
    expect(mealsReady(sim, p())[0]!.food).toMatchObject({ key: 'dish', left: 3 });
    expect(sim.execute({ kind: 'food.resume_cooking', payload: {} }).error).toBe('There’s no cooking left partway.');

    // No bed in the house yet, so nothing to fit.
    const queen = BEDDING_SETS.find((s) => s.id === 'us-slanhostmal')!;
    expect(sim.execute({ kind: 'home.buy_bedding', payload: { setId: queen.id } }).error).toBe('You have no bed at home.');
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed' } });
    expect(bedAtHome(p())!.size).toBe('queen');
    // The twin's set and one never sold refused; a queen set at IKEA's quote, from the bank, into the drawers. (The quote is the $39.99 shelf price without New York's tax: a defect, kept apart below.)
    expect(beddingOffers(sim, p()).map((o) => o.set.id)).toEqual([queen.id]);
    expect(sim.execute({ kind: 'home.buy_bedding', payload: { setId: 'us-angslilja-twin' } }).error).toBe('SLATE has no published price here for a set to fit a queen bed.');
    expect(sim.execute({ kind: 'home.buy_bedding', payload: { setId: 'no-such-set' } }).error).toBe('SLATE has no published price here for a set to fit a queen bed.');
    const set = beddingOffers(sim, p())[0]!.cost;
    const b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.buy_bedding', payload: { setId: queen.id } }).paid).toBe(set);
    expect(b0 - banked(sim)).toBe(set);
    expect(memo(sim, `IKEA, ${queen.name}`).map((t) => -into(sim, t))).toEqual([set]);
    expect(beddingOf(p())).toHaveLength(1);
    expect(beddingOf(p())[0]!).toMatchObject({ at: { kind: 'home', spot: 'drawers' }, bedding: { size: 'queen', nights: 0 } });

    // Three nights slept on it.
    sim.advanceBy(3 * MS_DAY);
    const first = beddingOf(p())[0]!;
    expect(first.bedding.nights).toBeGreaterThan(0);
    expect(first.bedding.nights).toBeLessThanOrEqual(3);
    // A second set: in the drawers, while the one slept in stays on the bed.
    sim.must({ kind: 'home.buy_bedding', payload: { setId: queen.id } });
    expect(beddingOf(p())).toHaveLength(2);
    expect(onTheBed(p())!.id).toBe(first.id);

    // The toenails trimmed at home: due again by their 1.62 mm a month to the 2 a trim takes; the fingernails still from when the life began.
    const toes = sim.must<{ due: number }>({ kind: 'hygiene.trim_nails', payload: { which: 'toes' } });
    expect(toes.due).toBe(sim.now + (NAILS.trimMm.toes / NAILS.growthMmMonth.toes) * MONTH);
    expect(p().nailsAt).toEqual({ toes: sim.now });
    expect(nailsDue(p(), 'fingers')).toBe(p().createdAt + (NAILS.trimMm.fingers / NAILS.growthMmMonth.fingers) * MONTH);
    // Without saying which, the fingernails.
    const fingers = sim.must<{ due: number }>({ kind: 'hygiene.trim_nails', payload: {} });
    expect(fingers.due).toBe(sim.now + (NAILS.trimMm.fingers / NAILS.growthMmMonth.fingers) * MONTH);
    expect(p().nailsAt).toEqual({ toes: sim.now, fingers: sim.now });
    expect(sim.execute({ kind: 'hygiene.cut_hair', payload: {} }).error).toBe('You need clippers of your own.');

    sim = reload(sim);
    expect(beddingOf(p())).toHaveLength(2);
    expect(onTheBed(p())!.id).toBe(first.id);
    expect(p().nailsAt!.toes).toBe(toes.due - (NAILS.trimMm.toes / NAILS.growthMmMonth.toes) * MONTH);

    // May: the inch over the lawn, 25.4 liters a square meter of the lot less the house, onto the month's water; a twin, saved and loaded from this moment, not watered.
    sim.advanceTo(on(2026, 5, 20, 9, NY_ZONE));
    const twin = reload(sim);
    const owned = sim.player.homes![0]!;
    const inch = inchOf(owned)!;
    expect(inch).toBeCloseTo((5_000 - 1_200) * 0.09290304 * 25.4, 6);
    const used = litersUsed(p(), NY, 5);
    expect(sim.must<{ liters: number }>({ kind: 'home.water_lawn', payload: {} }).liters).toBe(Math.round(inch));
    expect(lawnOf(owned)!.wetAt).toBe(sim.now);
    expect(litersUsed(p(), NY, 5) - used).toBeCloseTo(inch, 6);
    expect(livingOf(p()).lawnL).toBeCloseTo(inch, 6);
    expect(waterOf(sim, p())).toBeGreaterThan(waterOf(twin, twin.player));
    sim = reload(sim);
    expect(livingOf(p()).lawnL).toBeCloseTo(inch, 6);

    // The bills on the evening of 1 June: the watered house's more than the twin's by the water's difference a minute before, to the cent; and its liters billed once.
    const due = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === RENT_KIND && i.at > sim.now)!.at;
    expect(zonedParts(due, NY_ZONE)).toMatchObject({ month: 6, day: 1 });
    for (const s of [sim, twin]) s.advanceTo(due - 60_000);
    const extra = waterOf(sim, p()) - waterOf(twin, twin.player);
    expect(extra).toBeGreaterThan(0);
    for (const s of [sim, twin]) s.advanceTo(due + MS_HOUR);
    const bills = (s: Simulation) => s.universe.transactions.filter((t) => t.memo === 'Bills' && t.at >= due).reduce((a, t) => a - into(s, t), 0);
    expect(bills(sim) - bills(twin)).toBe(extra);
    expect(livingOf(p()).lawnL).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
    expect(breaches(twin.universe)).toEqual([]);
  }, 300_000);
});

describe('what the game got wrong, and was fixed', () => {
  // Found by this journey on 2026-10-06 and fixed: a duvet set was charged IKEA's shelf price with nothing added, where
  // New York adds its sales tax as it does to the house's furniture; `beddingOffers` now adds it in America and Canada,
  // where a shelf price is before the tax.
  it('charges New York’s sales tax on a duvet set', () => {
    let sim = life('jem-bedding-tax');
    house(sim);
    sim.must({ kind: 'home.furnish', payload: { piece: 'bed' } });
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    const taxed = inSaveMoney(sim, Math.round(39_99 * (1 + salesTaxRate(NY, sim.now, 'goods'))), 'USD');
    const b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'home.buy_bedding', payload: { setId: 'us-slanhostmal' } }).paid).toBe(taxed);
    expect(b0 - banked(sim)).toBe(taxed);
    expect(breaches(sim.universe)).toEqual([]);
  });

  // Found by this journey on 2026-10-06 and fixed: clippers were charged the shelf price with no sales tax.
  it('charges New York’s sales tax on clippers', () => {
    let sim = life('jem-clipper-tax');
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    const taxed = inSaveMoney(sim, Math.round(19_99 * (1 + salesTaxRate(NY, sim.now, 'goods'))), 'USD');
    const b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'hygiene.buy_clippers', payload: {} }).paid).toBe(taxed);
    expect(b0 - banked(sim)).toBe(taxed);
    expect(breaches(sim.universe)).toEqual([]);
  });

  // Found by this journey on 2026-10-06 and fixed: nails that weren't fingers or toes were trimmed as fingers.
  it('refuses nails it doesn’t know', () => {
    let sim = life('jem-nails');
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(sim.execute({ kind: 'hygiene.trim_nails', payload: { which: 'elbows' } }).error).toBe('Fingers or toes.');
    expect(sim.player.nailsAt).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  });
});
