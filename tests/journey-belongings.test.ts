/**
 * The belongings journey (the owner's audit of 2026-10-06): lives run through
 * the same commands the Belongings screen runs, each step reading what the one
 * before it left.
 *
 * - **A phone**: an iPhone bought outright and not to hand until it's
 *   delivered, put on the line once at the carrier's charge, covered by
 *   AppleCare+ with Theft and Loss, saved and loaded, its month's cover billed
 *   and its screen cracked at Allstate's odds on a seed chosen for it; refused
 *   as a trade-in while cracked, repaired under the cover for $29, its battery
 *   replaced at Apple's price, and the cover dropped, after which no month
 *   bills it.
 * - **A TV**: a set bought, a program refused until Prime Video is paid for,
 *   paid for once however often it's asked, an afternoon's watching at the
 *   set's own watts reaching the month's electricity, a console that plays
 *   nothing until a game of its maker's is bought; saved and loaded, the
 *   service billed on its month, canceled, and not billed after. In London,
 *   the TV license bought once, and live TV and the BBC let in by it.
 * - **A dog**: adopted, its food refused while the bank is empty with nothing
 *   charged, bought, waited for while the dog goes unfed and unwalked, fed by
 *   hand and then by the shortcut, walked by hand and then by a walker at the
 *   town's rate a day; saved and loaded, the walker let go and not charged
 *   after; chipped once, to the vet, the groomer, and its papers for abroad.
 * - **A ring**: commissioned, refused while the bank is empty, saved and
 *   loaded while it's made, delivered, engraved, scheduled on the renters'
 *   policy, locked in a safe and taken out; pawned, and while pawned it can't
 *   be engraved, locked up or worn; redeemed at New York's 4% a month or part.
 *   A Timex's battery changed by mail and back in a week.
 * - **Things and bags**: a carry-on bought and chosen, packed, its packing
 *   list kept, saved and loaded, unpacked and packed again from the list; a
 *   library card and a book, read at home, moved into the bag and given to a
 *   friend; sports gear; a flat-pack chair put together and left for the
 *   council's collection, refused a second booking, and gone on its day.
 *
 * Every case ends with every law of the world holding.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { SERVICES } from '@/engine/content/homelife';
import { KCAL_A_DAY, RATION_KCAL_PER_KG } from '@/engine/content/petcare';
import { typicalTvKwh } from '@/engine/content/tvuse';
import { inSaveMoney } from '@/engine/systems/banking';
import { atlasBillsOf } from '@/engine/systems/household';
import { itemById, itemsOf } from '@/engine/systems/items';
import { activationCost, batteryQuote, phoneById, phonePrice, phonesOf, PHONE_DAYS } from '@/engine/systems/phones';
import { tvAtHome, tvCatalog } from '@/engine/systems/televisions';
import { consolesHere, gamesOwned, licensed, planPrice, plansHere, watchRefusal } from '@/engine/systems/homelife';
import { certificatePrice, chipPrice, foodLeftG, groomerPrice, petShop, petsOf, vetPrice, walkerDay } from '@/engine/systems/pets';
import { commissionsOf } from '@/engine/systems/commissions';
import { lockedAway, safeCatalog, scheduledPremium, valuablesOf } from '@/engine/systems/valuables';
import { owedOn, pawnsOf } from '@/engine/systems/pawn';
import { unwearable, type Garment } from '@/engine/systems/wardrobe';
import { batteryRunsOut } from '@/engine/systems/watches';
import { bagsOf, luggageCatalog, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { hasSomethingToRead, readingCatalog } from '@/engine/systems/reading';
import { gearAtHome, sportShop } from '@/engine/systems/sportsgear';
import { seatsAtHome } from '@/engine/systems/furnishings';
import { contactsOf, newContact } from '@/engine/systems/people';

const NY = 'us-ny-newyork';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** The transactions whose memo matches. */
const memos = (sim: Simulation, re: RegExp) => sim.universe.transactions.filter((t) => re.test(t.memo));
/** A memo matched as written from its start, its plus signs and brackets no pattern. */
const literally = (text: string, tail = '$') => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${tail}`);
/** An hour of a day some days on, in the life's zone. */
const dayAt = (sim: Simulation, days: number, hour: number) => { const p = zonedParts(sim.now + days * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour }, sim.zone); };

/** Everything in the bank given to the family, posted, so the ledger's law holds. What was given, to give back. */
function giveAway(sim: Simulation): { accountId: string; amount: number }[] {
  const given: { accountId: string; amount: number }[] = [];
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 0) continue;
    given.push({ accountId: a.id, amount: a.balance });
    sim.post({ memo: 'Given to the family', category: 'transfer', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
  }
  return given;
}
function giveBack(sim: Simulation, given: { accountId: string; amount: number }[]): void {
  for (const g of given) sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: g.accountId, amount: g.amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -g.amount }] });
}

const IPHONE_16 = 'us-apple-iphone-16-128';
const COVER = 'AppleCare+ with Theft and Loss';

describe('a phone of one’s own', () => {
  it('is bought, put on the line once, covered, cracked, repaired under the cover, its battery replaced, and the cover dropped', () => {
    // The seed was found by scanning the phone's month (`mishap`, `phone.risk`) over the seeds jb-0 to jb-39: on this one the screen cracks in its first month on the line (on jb-0 it's stolen in its second).
    let sim = life('jb-1');
    const iphone = phoneById(IPHONE_16)!;
    const price = phonePrice(sim, sim.player, iphone);
    let b0 = banked(sim);
    sim.must({ kind: 'phone.buy', payload: { phoneId: IPHONE_16, color: iphone.colors[0] } });
    expect(b0 - banked(sim)).toBe(price);
    // On its way, it isn't to hand to put on the line.
    let phone = phonesOf(sim.player)[0]!;
    expect(phone.at.kind).toBe('order');
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: phone.id } }).error).toBe('It isn’t to hand.');
    sim.advanceBy(PHONE_DAYS * MS_DAY + 60_000);
    phone = phonesOf(sim.player)[0]!;
    expect(phone.at.kind).toBe('home');

    // On the line at the carrier's charge, once: asked again, refused and not charged.
    const sim0 = activationCost(sim, sim.player)!;
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'phone.activate', payload: { itemId: phone.id } }).paid).toBe(sim0.cost);
    expect(b0 - banked(sim)).toBe(sim0.cost);
    expect(sim.execute({ kind: 'phone.activate', payload: { itemId: phone.id } }).error).toBe('It’s on your line already.');
    expect(b0 - banked(sim)).toBe(sim0.cost);

    // AppleCare+ with Theft and Loss, $12.99 a month; a plan it doesn't offer refused.
    expect(sim.execute({ kind: 'phone.protect', payload: { itemId: phone.id, plan: 'Pixel Care+' } }).error).toBe('That cover isn’t offered for it.');
    expect(sim.must<{ monthly: number }>({ kind: 'phone.protect', payload: { itemId: phone.id, plan: COVER } }).monthly).toBe(inSaveMoney(sim, 12_99, 'USD'));
    const coverMemo = literally(`${COVER}, the `, '');
    expect(memos(sim, coverMemo)).toHaveLength(0);

    // Saved and loaded with the phone on the line and covered.
    sim = reload(sim);
    phone = phonesOf(sim.player)[0]!;
    expect(phone.device).toMatchObject({ activated: true, protection: { plan: COVER } });

    // Its first month: the cover billed once, the battery a month worn, and the screen cracked.
    sim.advanceBy(30 * MS_DAY + MS_HOUR);
    phone = phonesOf(sim.player)[0]!;
    expect(memos(sim, coverMemo)).toHaveLength(1);
    expect(memos(sim, coverMemo)[0]!.postings.find((p) => p.amount > 0)!.amount).toBe(inSaveMoney(sim, 12_99, 'USD'));
    expect(phone.device.battery).toBeLessThan(1);
    expect(phone.device.broken).toBe('screen');
    expect(sim.universe.notifications.some((n) => n.title === 'You Cracked Your Phone’s Screen')).toBe(true);

    // Cracked, Apple won't take it in trade at a working one's value, and nothing is charged.
    const next = phoneById('us-apple-iphone-18-pro-256')!;
    b0 = banked(sim);
    expect(sim.execute({ kind: 'phone.buy', payload: { phoneId: next.id, color: next.colors[0], tradeInItemId: phone.id } }).error).toBe('Apple’s trade-in value is for one in working order.');
    expect(banked(sim)).toBe(b0);
    expect(phonesOf(sim.player)).toHaveLength(1);

    // Claimed under the cover: AppleCare+'s $29 for a screen, not Apple's $279 and tax, and once.
    expect(sim.must<{ paid: number }>({ kind: 'phone.claim', payload: { itemId: phone.id } }).paid).toBe(inSaveMoney(sim, 29_00, 'USD'));
    expect(b0 - banked(sim)).toBe(inSaveMoney(sim, 29_00, 'USD'));
    expect(phone.device.broken).toBeUndefined();
    expect(sim.execute({ kind: 'phone.claim', payload: { itemId: phone.id } }).error).toBe('It isn’t damaged.');
    expect(b0 - banked(sim)).toBe(inSaveMoney(sim, 29_00, 'USD'));

    // The battery, still above 80%, is Apple's own price, not the cover's; new, it's refused again.
    const quote = batteryQuote(sim, sim.player, phone)!;
    expect(quote).toBeGreaterThan(0);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'phone.battery', payload: { itemId: phone.id } }).paid).toBe(quote);
    expect(b0 - banked(sim)).toBe(quote);
    expect(phone.device.battery).toBe(1);
    expect(sim.execute({ kind: 'phone.battery', payload: { itemId: phone.id } }).error).toBe('The battery is as good as new.');

    // The cover dropped: the next month bills none of it, though the phone's month still wears the battery.
    expect(sim.must<{ monthly: number }>({ kind: 'phone.protect', payload: { itemId: phone.id } }).monthly).toBe(0);
    sim.advanceBy(31 * MS_DAY);
    phone = phonesOf(sim.player)[0]!;
    expect(memos(sim, coverMemo)).toHaveLength(1);
    expect(phone.device.protection).toBeUndefined();
    expect(phone.device.battery).toBeLessThan(1);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a television and what’s on it', () => {
  it('is bought, watched on a service paid for once, reaches the electricity, plays a console with a game, and stops billing when canceled', () => {
    let sim = life('journey-belongings-tv');
    // The hungriest set on sale: an afternoon on the cheapest (10.8 W) is less than the typical day the bill already holds.
    const set = tvCatalog(sim, sim.player).reduce((a, x) => ((x.product.attrs.onModeWatts as number) > (a.product.attrs.onModeWatts as number) ? x : a));
    let b0 = banked(sim);
    const bought = sim.must<{ paid: number; itemId: string }>({ kind: 'tv.buy', payload: { offerId: set.offer.id } });
    expect(bought.paid).toBe(set.price);
    expect(b0 - banked(sim)).toBe(set.price);
    const watts = tvAtHome(sim.player)!.watts!;

    // Reacher is on Prime Video: refused until it's paid for; paid for once, however often it's asked.
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: 'us-reacher' } }).error).toBe('It’s on Prime Video: you don’t subscribe to it.');
    const prime = plansHere(sim.player).find((p) => p.id === SERVICES.find((s) => s.market === 'us' && s.service === 'Amazon Prime')!.id)!;
    const monthly = planPrice(sim, sim.player, prime);
    b0 = banked(sim);
    const subscribedAt = sim.now;
    sim.must({ kind: 'home.subscribe', payload: { id: prime.id } });
    expect(sim.execute({ kind: 'home.subscribe', payload: { id: prime.id } }).error).toBe('You subscribe to it already.');
    expect(b0 - banked(sim)).toBe(monthly);
    const billed = () => memos(sim, literally(prime.label)).length;
    expect(billed()).toBe(1);

    // An afternoon of it the next day, at the set's own watts, onto the month's electricity bill.
    sim.advanceTo(dayAt(sim, 1, 10));
    const kwh0 = sim.player.living?.tvKwh ?? 0;
    const bills0 = atlasBillsOf(sim, sim.player);
    let minutes = 0;
    for (let h = 0; h < 5; h += 1) minutes += sim.must<{ watched: number }>({ kind: 'tv.watch', payload: { programmeId: 'us-reacher', to: 'hour' } }).watched;
    expect(minutes).toBe(300);
    expect((sim.player.living?.tvKwh ?? 0) - kwh0).toBeCloseTo((watts * 5) / 1000, 9);
    // Past the typical household's 2.6 hours on the days at home so far, so the month's bills come to more.
    expect((sim.player.living?.tvKwh ?? 0)).toBeGreaterThan(typicalTvKwh(sim.player.living?.homeDays ?? 0));
    expect(atlasBillsOf(sim, sim.player)).toBeGreaterThan(bills0);

    // A Switch plays nothing until a Nintendo game is bought.
    const sw = consolesHere(sim.player).find((c) => c.maker === 'Nintendo' && c.edition === 'System')!;
    b0 = banked(sim);
    const consolePaid = sim.must<{ paid: number }>({ kind: 'home.console', payload: { consoleId: sw.id } }).paid;
    expect(watchRefusal(sim, sim.player, 'games')).toBe('It needs a game of its own to play, or its maker’s subscription.');
    const gamePaid = sim.must<{ paid: number }>({ kind: 'home.buy_game', payload: { gameId: 'us-dk-bananza' } }).paid;
    expect(b0 - banked(sim)).toBe(consolePaid + gamePaid);
    expect(gamesOwned(sim.player).map((g) => g.label)).toEqual(['Donkey Kong Bananza']);
    expect(watchRefusal(sim, sim.player, 'games')).toBeUndefined();

    // Saved and loaded: the set, the service, the console and the place in Reacher are kept.
    const place = sim.player.watching?.['us-reacher'];
    sim = reload(sim);
    expect(tvAtHome(sim.player)?.watts).toBe(watts);
    expect(sim.player.watching?.['us-reacher']).toEqual(place);
    expect(watchRefusal(sim, sim.player, prime.id)).toBeUndefined();

    // Its month billed at the same price; canceled, the month after bills nothing and Reacher is shut again.
    sim.advanceTo(subscribedAt + 31 * MS_DAY);
    expect(billed()).toBe(2);
    expect(memos(sim, literally(prime.label))[1]!.postings.find((p) => p.amount > 0)!.amount).toBe(monthly);
    sim.must({ kind: 'home.unsubscribe', payload: { id: prime.id } });
    expect(sim.execute({ kind: 'home.unsubscribe', payload: { id: prime.id } }).error).toBe('You don’t subscribe to it.');
    sim.advanceTo(subscribedAt + 75 * MS_DAY);
    expect(billed()).toBe(2);
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: 'us-reacher' } }).error).toBe('It’s on Prime Video: you don’t subscribe to it.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('in London needs the license for live TV and the BBC, bought once a year', () => {
    let sim = life('journey-belongings-licence', 'uk-eng-london');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'unwind', how: 'live' } }).error).toBe('You need a TV license for that.');
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: 'uk-the-traitors' } }).error).toBe('You need a TV license for that.');
    const b0 = banked(sim);
    const r = sim.must<{ paid: number; until: number }>({ kind: 'home.tv_licence', payload: {} });
    expect(r.paid).toBe(inSaveMoney(sim, 180_00, 'GBP'));
    expect(b0 - banked(sim)).toBe(r.paid);
    // Asked again with a year to run, refused and not charged.
    expect(sim.execute({ kind: 'home.tv_licence', payload: {} }).error).toBe('Yours runs more than another month.');
    expect(b0 - banked(sim)).toBe(r.paid);
    sim = reload(sim);
    expect(licensed(sim.player, sim.now)).toBe(true);
    expect(sim.player.tvLicence?.until).toBe(r.until);
    sim.must({ kind: 'life.look_after', payload: { action: 'unwind', how: 'live' } });
    expect(sim.must<{ watched: number }>({ kind: 'tv.watch', payload: { programmeId: 'uk-the-traitors' } }).watched).toBeGreaterThan(0);
    // An American program isn't shown in Britain.
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: 'us-reacher' } }).error).toBe('That isn’t shown where you live.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  // Found by this journey on 2026-10-06 and fixed: `home.unsubscribe` left its month on the calendar, and a plan taken up
  // again before it came was billed by both months.
  it('canceled and taken up again before the old month comes, bills once a month, not twice', () => {
    const sim = life('journey-belongings-resubscribe');
    const prime = plansHere(sim.player).find((p) => p.id === SERVICES.find((s) => s.market === 'us' && s.service === 'Amazon Prime')!.id)!;
    const billed = () => memos(sim, literally(prime.label)).length;
    const t0 = sim.now;
    sim.must({ kind: 'home.subscribe', payload: { id: prime.id } });
    sim.advanceTo(t0 + 5 * MS_DAY);
    sim.must({ kind: 'home.unsubscribe', payload: { id: prime.id } });
    sim.advanceTo(t0 + 10 * MS_DAY);
    sim.must({ kind: 'home.subscribe', payload: { id: prime.id } });
    expect(billed()).toBe(2);
    // Thirty-one days on from taking it up again: the new month's payment only.
    sim.advanceTo(t0 + 41 * MS_DAY);
    expect(billed()).toBe(3);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a dog kept', () => {
  it('is fed, walked, walked by a walker and let go of one, chipped once, and seen by the vet and the groomer', () => {
    let sim = life('journey-belongings-dog');
    const adopted = sim.must<{ paid: number; petId: string }>({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    expect(adopted.paid).toBe(inSaveMoney(sim, 150_00, 'USD'));
    const rexId = adopted.petId;
    const rex = () => petsOf(sim.player).find((p) => p.id === rexId)!;
    // Fed and walked the day it came home.
    expect(sim.execute({ kind: 'pets.feed', payload: {} }).error).toBe('They’re fed for today.');
    expect(sim.execute({ kind: 'pets.walk', payload: { petId: rexId } }).error).toBe('Rex’s been walked today.');

    // Its food: refused with the bank empty and nothing charged, then bought.
    const food = petShop(sim, sim.player).find((x) => x.kind === 'food' && x.species === 'dog')!;
    const given = giveAway(sim);
    expect(banked(sim)).toBe(0);
    const orders = itemsOf(sim.player).length;
    expect(sim.execute({ kind: 'pets.buy', payload: { productId: food.id } }).error).toBe('The bank couldn’t pay for it.');
    expect(banked(sim)).toBe(0);
    expect(itemsOf(sim.player)).toHaveLength(orders);
    giveBack(sim, given);
    let b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'pets.buy', payload: { productId: food.id } }).paid).toBe(food.price);
    expect(b0 - banked(sim)).toBe(food.price);
    expect(foodLeftG(sim.player, 'dog')).toBe(0);

    // Two days waiting for it: a day unfed and unwalked, said and counted.
    sim.advanceTo(dayAt(sim, 2, 12));
    expect(rex().hungryDays).toBeGreaterThanOrEqual(1);
    expect(rex().unwalkedDays).toBeGreaterThanOrEqual(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Rex Went Unfed')).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === 'Rex Wasn’t Walked')).toBe(true);
    // Delivered: fed a day's energy from the bag, and walked an hour.
    expect(foodLeftG(sim.player, 'dog')).toBeCloseTo(food.kg * 1000, 6);
    const ration = (KCAL_A_DAY.dog / (food.kcalPerKg ?? RATION_KCAL_PER_KG.dog)) * 1000;
    sim.must({ kind: 'pets.feed', payload: {} });
    expect(rex().hungryDays).toBe(0);
    expect(foodLeftG(sim.player, 'dog')).toBeCloseTo(food.kg * 1000 - ration, 6);
    const t = sim.now;
    expect(sim.must<{ minutes: number }>({ kind: 'pets.walk', payload: { petId: rexId } }).minutes).toBe(60);
    expect(sim.now - t).toBe(60 * 60_000);
    expect(rex().unwalkedDays).toBe(0);

    // The shortcut feeds it each day from the bag; a walker walks it at the town's rate, each day charged.
    sim.must({ kind: 'life.set_automation', payload: { key: 'feedPets', on: true } });
    sim.must({ kind: 'pets.walker', payload: { petId: rexId, on: true } });
    const left = foodLeftG(sim.player, 'dog');
    const walker = /^A dog walker for Rex$/;
    sim.advanceTo(dayAt(sim, 3, 12));
    expect(foodLeftG(sim.player, 'dog')).toBeCloseTo(left - 3 * ration, 6);
    expect(rex().hungryDays).toBe(0);
    expect(rex().unwalkedDays).toBe(0);
    const day = walkerDay(sim, sim.player) as number;
    expect(day).toBe(inSaveMoney(sim, Math.round(24.42 * 2 * 100), 'USD'));
    expect(memos(sim, walker)).toHaveLength(3);
    for (const w of memos(sim, walker)) expect(w.postings.find((p) => p.amount > 0)!.amount).toBe(day);

    // Saved and loaded with the walker booked.
    sim = reload(sim);
    expect(rex().walker).toBe(true);
    expect(sim.player.automation?.feedPets).toBe(true);

    // The walker let go: no more charged, and the dog unwalked is counted again.
    sim.must({ kind: 'pets.walker', payload: { petId: rexId, on: false } });
    sim.advanceTo(dayAt(sim, 3, 12));
    expect(memos(sim, walker)).toHaveLength(3);
    expect(rex().unwalkedDays).toBeGreaterThanOrEqual(2);
    expect(rex().hungryDays).toBe(0);

    // Chipped at the town's clinic, once.
    b0 = banked(sim);
    const chip = chipPrice(sim, sim.player) as number;
    sim.must({ kind: 'pets.chip', payload: { petId: rexId } });
    expect(b0 - banked(sim)).toBe(chip);
    expect(sim.execute({ kind: 'pets.chip', payload: { petId: rexId } }).error).toBe('Rex is chipped already.');
    expect(b0 - banked(sim)).toBe(chip);
    // The yearly visit, a year on.
    b0 = banked(sim);
    const visit = sim.must<{ paid: number; until: number }>({ kind: 'pets.vet', payload: { petId: rexId } });
    expect(visit.paid).toBe(vetPrice(sim, sim.player, rex()));
    expect(b0 - banked(sim)).toBe(visit.paid);
    expect(rex().vetUntil).toBe(visit.until);
    expect(visit.until - sim.now).toBe(365 * MS_DAY);
    // The groomer at its price; a bath at home for nothing.
    b0 = banked(sim);
    const groomed = sim.must<{ paid: number; due: number }>({ kind: 'pets.groom', payload: { petId: rexId, at: 'groomer' } });
    expect(groomed.paid).toBe(groomerPrice(sim, sim.player));
    expect(b0 - banked(sim)).toBe(groomed.paid);
    expect(rex().groomedAt).toBe(sim.now);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'pets.groom', payload: { petId: rexId, at: 'home' } }).paid).toBe(0);
    expect(banked(sim)).toBe(b0);
    // Papers for abroad: the tapeworm treatment, the CDC's form, and the certificate for Britain.
    sim.must({ kind: 'pets.tapeworm', payload: { petId: rexId } });
    expect(rex().tapewormAt).toBe(sim.now);
    sim.must({ kind: 'pets.import_form', payload: { petId: rexId } });
    expect(rex().importFormAt).toBe(sim.now);
    const cert = certificatePrice(sim, sim.player) as number;
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'pets.certificate', payload: { to: 'uk' } }).paid).toBe(cert);
    expect(b0 - banked(sim)).toBe(cert);
    expect(rex().certificate).toEqual({ to: 'uk', at: sim.now });
    expect(breaches(sim.universe)).toEqual([]);
  });
});

const TIMEX = 'us-timex-weekender-37mm-fabric-strap-watch';

describe('a ring made to order', () => {
  it('is commissioned, engraved, scheduled, locked away, pawned and redeemed, and a watch’s battery changed', () => {
    let sim = life('journey-belongings-ring');
    // Brilliant Earth's least is $2,000, paid in full at the order; with the bank empty, refused and nothing charged.
    expect(sim.execute({ kind: 'jewelry.commission', payload: { jewelerId: 'brilliant-earth', kind: 'ring', metal: 'gold', price: 1_500 } }).error).toBe('Brilliant Earth’s start at 2,000 USD.');
    const order = { jewelerId: 'brilliant-earth', kind: 'ring', metal: 'gold', price: 2_500 };
    const given = giveAway(sim);
    expect(sim.execute({ kind: 'jewelry.commission', payload: order }).error).toBe('The bank can’t pay for it.');
    expect(banked(sim)).toBe(0);
    expect(commissionsOf(sim.player)).toHaveLength(0);
    giveBack(sim, given);
    let b0 = banked(sim);
    const c = sim.must<{ paid: number; readyAt: number }>({ kind: 'jewelry.commission', payload: order });
    expect(c.paid).toBe(inSaveMoney(sim, 2_500_00, 'USD'));
    expect(b0 - banked(sim)).toBe(c.paid);
    expect(c.readyAt - sim.now).toBe(35 * MS_DAY);

    // Saved and loaded while it's made; ready on its day, nothing more to pay.
    sim = reload(sim);
    expect(commissionsOf(sim.player)).toHaveLength(1);
    sim.advanceTo(c.readyAt + MS_HOUR);
    expect(commissionsOf(sim.player)).toHaveLength(0);
    expect(memos(sim, /^Brilliant Earth: the rest of/)).toHaveLength(0);
    const ring = valuablesOf(sim.player).find((i) => i.kind.startsWith('bespoke:'))!;
    expect(ring.label).toBe('A Gold Ring By Brilliant Earth');
    expect(ring.at).toMatchObject({ kind: 'home', spot: 'drawers' });
    expect(sim.universe.notifications.some((n) => n.title === 'Your Commission Is Ready')).toBe(true);

    // Engraved at Kay's $79.
    expect(sim.execute({ kind: 'jewelry.engrave', payload: { itemId: ring.id, words: '  ' } }).error).toBe('Write the words to engrave.');
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'jewelry.engrave', payload: { itemId: ring.id, words: 'For A' } }).paid).toBe(inSaveMoney(sim, 79_00, 'USD'));
    expect(b0 - banked(sim)).toBe(inSaveMoney(sim, 79_00, 'USD'));
    expect(ring.engraved).toBe('For A');

    // Scheduled on the renters' policy, which it can't be without one.
    expect(sim.execute({ kind: 'valuables.schedule', payload: { itemId: ring.id, on: true } }).error).toBe('Scheduling goes on a policy that covers what’s in your home.');
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    expect(sim.must<{ premium: number }>({ kind: 'valuables.schedule', payload: { itemId: ring.id, on: true } }).premium).toBe(scheduledPremium(ring));
    expect(ring.scheduled).toBe(true);

    // A safe: locked in it, a burglar's out of reach; taken out, back in the drawers.
    expect(sim.execute({ kind: 'valuables.lock_up', payload: { itemId: ring.id } }).error).toBe('There’s no safe where you live.');
    const safe = safeCatalog(sim, sim.player)[0]!;
    b0 = banked(sim);
    sim.must({ kind: 'valuables.buy_safe', payload: { id: safe.safe.id } });
    expect(b0 - banked(sim)).toBe(safe.price);
    sim.must({ kind: 'valuables.lock_up', payload: { itemId: ring.id } });
    expect(ring.at.kind).toBe('inside');
    expect(lockedAway(sim.player, ring)).toBe(true);
    sim.must({ kind: 'valuables.take_out', payload: { itemId: ring.id } });
    expect(ring.at).toMatchObject({ kind: 'home', spot: 'drawers' });
    expect(lockedAway(sim.player, ring)).toBe(false);
    expect(sim.execute({ kind: 'valuables.take_out', payload: { itemId: ring.id } }).error).toBe('It isn’t in a safe.');

    // Pawned for 37.5% of Vinted's 28%: $262.50 into the bank.
    b0 = banked(sim);
    const pledged = sim.must<{ pawnId: string; loan: number }>({ kind: 'pawn.pledge', payload: { itemIds: [ring.id] } });
    expect(pledged.loan).toBe(inSaveMoney(sim, 262_50, 'USD'));
    expect(banked(sim) - b0).toBe(pledged.loan);
    // While it's the pawnbroker's: not engraved, not locked up, not worn, not pledged again.
    expect(ring.at.kind).toBe('service');
    expect(sim.execute({ kind: 'jewelry.engrave', payload: { itemId: ring.id, words: 'Again' } }).error).toBe(`The ${ring.label} isn’t to hand.`);
    expect(sim.execute({ kind: 'valuables.lock_up', payload: { itemId: ring.id } }).error).toMatch(/isn’t to hand/);
    expect(unwearable(sim, sim.player, ring as typeof ring & { garment: Garment })).toBe('not to hand');
    expect(sim.execute({ kind: 'pawn.pledge', payload: { itemIds: [ring.id] } }).error).toBe(`The ${ring.label} isn’t to hand.`);

    // Forty-five days on, redeemed for the loan and two months at 4%: $283.50; then there's no pledge to redeem.
    sim.advanceBy(45 * MS_DAY);
    const pawn = pawnsOf(sim.player)[0]!;
    expect(owedOn(sim, pawn)).toBe(inSaveMoney(sim, 283_50, 'USD'));
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'pawn.redeem', payload: { pawnId: pledged.pawnId } }).paid).toBe(inSaveMoney(sim, 283_50, 'USD'));
    expect(b0 - banked(sim)).toBe(inSaveMoney(sim, 283_50, 'USD'));
    expect(ring.at).toMatchObject({ kind: 'home', spot: 'drawers' });
    expect(unwearable(sim, sim.player, ring as typeof ring & { garment: Garment })).toBeUndefined();
    expect(sim.universe.accounts[pawn.accountId]!.closedAt).toBeDefined();
    expect(sim.execute({ kind: 'pawn.redeem', payload: { pawnId: pledged.pawnId } }).error).toBe('There’s no such pledge.');
    // The scheduled premium went on the first of the month it passed, pawned or not.
    const premiums = memos(sim, /^Scheduled jewelry and watches$/);
    expect(premiums.length).toBeGreaterThanOrEqual(1);
    for (const p of premiums) expect(p.postings.find((x) => x.amount > 0)!.amount).toBe(scheduledPremium(ring));

    // A Timex ordered from Timex (New York has no Timex store), its battery changed by Timex's mail-in for $18, away a week.
    const timex = CLOTHING_PRODUCTS.find((p) => p.id === TIMEX)!;
    sim.must({ kind: 'clothes.buy', payload: { productId: TIMEX, how: 'online', size: timex.sizes[0], color: timex.colors[0], quantity: 1, payWith: 'debit' } });
    sim.advanceBy(10 * MS_DAY);
    const watch = itemsOf(sim.player).find((i) => i.kind === TIMEX)!;
    expect(watch.at.kind).toBe('home');
    b0 = banked(sim);
    sim.must({ kind: 'watch.battery', payload: { itemId: watch.id, serviceId: 'timex-mail-in' } });
    expect(b0 - banked(sim)).toBe(inSaveMoney(sim, 18_00, 'USD'));
    expect(watch.at.kind).toBe('service');
    const runsOut = batteryRunsOut(watch)!;
    sim.advanceBy(8 * MS_DAY);
    const back = itemById(sim.player, watch.id)!;
    expect(back.at.kind).toBe('home');
    expect(batteryRunsOut(back)).toBe(runsOut);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('things and bags', () => {
  it('a bag bought, packed, its list kept and packed again; a book read and given; gear; a chair put together and collected', () => {
    let sim = life('journey-belongings-things');
    const first = suitcaseOf(sim.player)!;
    // A carry-on, at its price, into storage; chosen as the bag that goes.
    const piece = luggageCatalog(sim, sim.player).find((x) => x.piece.type === 'carry-on')!;
    let b0 = banked(sim);
    const bag = sim.must<{ paid: number; itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: piece.piece.id } });
    expect(bag.paid).toBe(piece.price);
    expect(b0 - banked(sim)).toBe(piece.price);
    sim.must({ kind: 'luggage.choose', payload: { itemId: bag.itemId } });
    expect(suitcaseOf(sim.player)!.id).toBe(bag.itemId);
    // Packed for a week; the other bag can't be chosen over a packed one.
    const packed = sim.must<{ packed: number }>({ kind: 'luggage.pack', payload: {} }).packed;
    expect(packed).toBeGreaterThan(0);
    const carry = bagsOf(sim.player).find((b) => b.id === bag.itemId)!;
    expect(packedIn(sim.player, carry)).toHaveLength(packed);
    if (first) expect(sim.execute({ kind: 'luggage.choose', payload: { itemId: first.id } }).error).toBe('Unpack the one you have first.');
    // Only this bag goes; none at all is refused.
    sim.must({ kind: 'luggage.take', payload: { itemId: bag.itemId, going: true } });
    expect(sim.player.luggageId).toBe(bag.itemId);
    // Kept as a list.
    expect(sim.execute({ kind: 'luggage.save_list', payload: { name: ' ' } }).error).toBe('Give the list a name.');
    const list = sim.must<{ listId: string; things: number }>({ kind: 'luggage.save_list', payload: { name: 'A Week Away' } });
    expect(list.things).toBe(packed);

    // Saved and loaded with the bag packed and the list kept.
    sim = reload(sim);
    expect(sim.player.packingLists?.map((l) => l.name)).toEqual(['A Week Away']);
    expect(packedIn(sim.player, suitcaseOf(sim.player)!)).toHaveLength(packed);
    // Unpacked, and packed again from the list: the same things, and asked again, nothing more.
    expect(sim.must<{ unpacked: number }>({ kind: 'luggage.unpack', payload: {} }).unpacked).toBe(packed);
    expect(packedIn(sim.player, suitcaseOf(sim.player)!)).toHaveLength(0);
    expect(sim.execute({ kind: 'luggage.unpack', payload: {} }).error).toBe('The suitcase is empty.');
    expect(sim.must<{ packed: number; short: unknown[] }>({ kind: 'luggage.pack_list', payload: { listId: list.listId } })).toMatchObject({ packed, short: [] });
    expect(sim.must<{ packed: number; already: number }>({ kind: 'luggage.pack_list', payload: { listId: list.listId } })).toMatchObject({ packed: 0, already: packed });
    sim.must({ kind: 'luggage.delete_list', payload: { listId: list.listId } });
    expect(sim.player.packingLists).toEqual([]);
    expect(sim.execute({ kind: 'luggage.pack_list', payload: { listId: list.listId } }).error).toBe('There’s no such list.');
    sim.must({ kind: 'luggage.unpack', payload: {} });

    // Something to read: a library card, free; a book at its price, read an hour at home.
    expect(hasSomethingToRead(sim.player)).toBe(false);
    b0 = banked(sim);
    sim.must({ kind: 'reading.library_card', payload: {} });
    expect(sim.execute({ kind: 'reading.library_card', payload: {} }).error).toBe('You have one.');
    expect(banked(sim)).toBe(b0);
    expect(hasSomethingToRead(sim.player)).toBe(true);
    const book = readingCatalog(sim, sim.player).find((x) => x.buy.kind === 'book')!;
    sim.must({ kind: 'reading.buy', payload: { id: book.buy.id } });
    expect(b0 - banked(sim)).toBe(book.price);
    const owned = itemsOf(sim.player).find((i) => i.kind === `book:${book.buy.id}`)!;
    sim.must({ kind: 'life.look_after', payload: { action: 'unwind', how: 'read' } });
    expect(owned.readWords).toBeGreaterThan(0);
    // Moved into the carry-on, it's packed; given to a friend in town, it's theirs, and out of the bag.
    sim.must({ kind: 'items.move', payload: { itemId: owned.id, to: { kind: 'inside', itemId: bag.itemId } } });
    expect(packedIn(sim.player, suitcaseOf(sim.player)!).map((i) => i.id)).toEqual([owned.id]);
    const friend = newContact(sim, sim.player, NY, 'journey-belongings-friend', { at: sim.now, how: 'school' });
    contactsOf(sim.player).push(friend);
    sim.must({ kind: 'items.give', payload: { itemId: owned.id, contactId: friend.id } });
    expect(itemById(sim.player, owned.id)).toBeUndefined();
    expect(packedIn(sim.player, suitcaseOf(sim.player)!)).toHaveLength(0);
    expect(friend.memory[0]!.what).toBe(`You gave them ${owned.label}`);
    expect(sim.execute({ kind: 'items.give', payload: { itemId: owned.id, contactId: friend.id } }).error).toBe('That isn’t something you own.');

    // Gear for a game, at its price, into storage.
    const gear = sportShop(sim, sim.player)[0]!;
    b0 = banked(sim);
    sim.must({ kind: 'sport.buy', payload: { productId: gear.id } });
    expect(b0 - banked(sim)).toBe(gear.cost);
    expect(gearAtHome(sim.player).has(gear.kind)).toBe(true);

    // A chair flat-packed: seats nobody until put together; then the council takes it away, booked once.
    const seats = seatsAtHome(sim.player).seats;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'us-onnestad-19554477', quantity: 1 } });
    const chair = itemsOf(sim.player).find((i) => i.kind === 'ikea:us-onnestad-19554477')!;
    expect(chair.flatPacked).toBe(true);
    expect(seatsAtHome(sim.player).seats).toBe(seats);
    sim.must({ kind: 'items.assemble', payload: { itemId: chair.id } });
    expect(seatsAtHome(sim.player).seats).toBeGreaterThan(seats);
    expect(sim.execute({ kind: 'items.give', payload: { itemId: chair.id, contactId: friend.id } }).error).toBe('It’s moved by movers, not handed over.');
    b0 = banked(sim);
    const pickup = sim.must<{ collectAt: number; fee: number }>({ kind: 'items.discard', payload: { itemIds: [chair.id] } });
    expect(pickup.fee).toBe(0);
    expect(banked(sim)).toBe(b0);
    expect(sim.execute({ kind: 'items.discard', payload: { itemIds: [chair.id] } }).error).toBe(`The ${chair.label} is booked for collection.`);
    sim.advanceTo(pickup.collectAt + MS_HOUR);
    expect(itemById(sim.player, chair.id)).toBeUndefined();
    expect(seatsAtHome(sim.player).seats).toBe(seats);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
