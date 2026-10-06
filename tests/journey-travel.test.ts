/**
 * The travel journey (the owner's audit of 2026-10-06): lives run through
 * the Travel screen, and the Belongings screen's bag claims, by the same
 * commands those screens run, each step reading what the one before it left.
 *
 * - **Los Angeles and back**: a round trip booked to Freehand's bunk room,
 *   insured at 6% of what was paid, insured again refused; the flight out
 *   refused a day earlier than the insurance covers and moved a day later,
 *   a night fewer at the hotel and the difference back; a car rented for it,
 *   picked up at the new arrival, not rented twice. Saved and loaded. In the
 *   air it can't be changed or insured; the bank emptied, the car is held at
 *   the desk and the room held for Freehand's $75 until their deposits are
 *   paid. There, the stay made a day longer, the way home, the car's return
 *   and the check-out moving with it; the morning of check-out, a later one
 *   bought at half the night, once; home, the car returned and both
 *   deposits back, once each.
 * - **A let, a friend and a baby**: the hotel given up for a holiday let at
 *   the difference, a friend along who pays back half the let, a baby on a
 *   lap for nothing, a five-year-old with no bed left; the flight no longer
 *   moved with everyone along. Played to the end, the friend has the trip's
 *   waking hours.
 * - **A flight the airline canceled**: the fare taken back instead of the
 *   next flight, the way home with it, once; nothing arrives, and the car
 *   rented on it is refunded at the desk, once.
 * - **The desk asks for ID**: every photo ID reported lost in the air, the
 *   Roosevelt's room refused until a license is replaced and shown, given at
 *   its hour, no deposit held where the hotel asks none; home on it.
 * - **London**: an ETA got first; no change fee is kept for the flight, so
 *   it isn't moved, nor the stay made longer; breakfast at the Hoxton at its
 *   £5, once a morning, not after noon.
 * - **A bag delayed**: a checked bag held by the airline, a tee bought to get
 *   by, the claim refused until the bag is back and then paid what the tee
 *   cost, once.
 * - **A hotel here**: a room booked where they are, as the screen books it,
 *   checked out of early with the nights paid; booked again, it ends itself.
 * - **A pilot and a plane**: training begun, stopped by an empty bank and
 *   taken up again; the tests, a checkride failed and retaken at half the
 *   fee; a 172 bought, flown to Boston at its fuel, its month billed, and
 *   sold, after which no month bills it.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance: money moved away and back is posted against the opening
 * balances. A child of the life's own takes nine months and a partner, which
 * the people journey plays; here one is given, as the children tests do.
 * Three steps the game gets wrong are kept apart, skipped, as defects: a room
 * held for its deposit forgets its hotel; a friend's share isn't split again
 * when the hotel becomes a let; a stay made longer runs past its insurance.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { US_PREMIUM_SHARE } from '@/engine/content/travelinsurance';
import { HALL } from '@/engine/content/people';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { distanceKm } from '@/engine/content/geography';
import { airportsFor } from '@/engine/systems/airports';
import { CHECKOUT_KIND, LEAVE_KIND, changeQuote, extendQuote, hotelRefund, journeysOf, letQuote, partnerOf, planJourney, slotOf, type Journey } from '@/engine/systems/journey';
import { insuranceQuote, policyNow } from '@/engine/systems/travelinsurance';
import { RENTAL_RETURN_KIND, rentalQuote, rentalsOf } from '@/engine/systems/rentals';
import { lateQuote } from '@/engine/systems/latecheckout';
import { depositFor, namedStayQuote } from '@/engine/systems/hotels';
import { inSaveMoney } from '@/engine/systems/banking';
import { AWAKE_SHARE, companionsOf } from '@/engine/systems/companions';
import { childrenOf, type Child } from '@/engine/systems/children';
import { contactsOf, knowTheClass } from '@/engine/systems/people';
import { documentsOf } from '@/engine/systems/documents';
import { bagClaimsOf } from '@/engine/systems/baggage';
import { bagsOf, luggageCatalog } from '@/engine/systems/luggage';
import { inLocalStay, localStayQuote } from '@/engine/systems/localstay';
import { AIRCRAFT_MONTH_KIND, OWN_172, PILOT_MONTH_KIND, PILOT_TRAINING, SKYHAWK, medicalFee, ownHourCost, planesOf, trainingCosts } from '@/engine/systems/aviation';

const NY = 'us-ny-newyork';
const LA = 'us-ca-losangeles';
const LDN = 'uk-eng-london';
const LA_ZONE = 'America/Los_Angeles';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** The transactions whose memo is this. */
const memo = (sim: Simulation, text: string) => sim.universe.transactions.filter((t) => t.memo === text);
/** What a transaction put into the bank: the life's checking and savings. */
const intoBank = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) => t.postings.filter((p) => { const a = sim.universe.accounts[p.accountId]; return a?.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings'); }).reduce((a, p) => a + p.amount, 0);
const money = (sim: Simulation, cents: number) => formatMoney(cents, saveCurrency(sim.universe));
/** Noon some days on, in the life's zone. */
const noon = (sim: Simulation, after: number) => { const p = zonedParts(sim.now + after * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };
/** An hour on the day of a moment, in a zone, some days on. */
const hourOf = (at: number, zone: string, hour: number, days = 0) => { const p = zonedParts(at, zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day + days), hour }, zone); };
const jy = (sim: Simulation, id: string): Journey => journeysOf(sim.player).find((j) => j.id === id)!;
const pending = (sim: Simulation, kind: string, key: string, id: string) => sim.universe.scheduled.filter((s) => s.status === 'pending' && s.kind === kind && s.payload[key] === id).map((s) => s.at);
/** The clock run on half an hour at a time until something's so, or a limit. */
const until = (sim: Simulation, done: () => boolean, limit: number) => { while (!done() && sim.now < limit) sim.advanceTo(Math.min(limit, sim.now + 30 * 60_000)); };

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

/** The way home's latest departure on a day, an evening's, so a later check-out comes before it. */
function latestSlot(sim: Simulation, from: string, to: string, day: number, zone: string): number {
  const slots = Array.from({ length: 12 }, (_, i) => ({ i, legs: planJourney(sim, from, to, day, i, 0) })).filter((x) => typeof x.legs !== 'string');
  return slots.sort((a, b) => zonedParts((b.legs as { departAt: number }[])[0]!.departAt, zone).hour - zonedParts((a.legs as { departAt: number }[])[0]!.departAt, zone).hour)[0]!.i;
}

const FREEHAND = 'freehand-los-angeles';
const ROOSEVELT = 'hollywood-roosevelt';
const HOXTON = 'hoxton-holborn';

describe('Los Angeles and back', () => {
  it('is booked, insured, moved, a car rented for it, held for deposits, made longer, checked out of late, and flown home', () => {
    let sim = life('jt-la');
    const day = noon(sim, 10);
    const ret = latestSlot(sim, LA, NY, day + 3 * MS_DAY, LA_ZONE);
    let b0 = banked(sim);
    const booked = sim.must<{ journeyId: string; returnId: string; total: number }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, hotelId: FREEHAND, room: 'Bunk Room', returnDay: day + 3 * MS_DAY, returnSlot: ret } });
    expect(b0 - banked(sim)).toBe(booked.total);
    const outId = booked.journeyId;
    const backId = booked.returnId;
    expect(jy(sim, outId).hotel!.nights).toBe(3);
    expect(partnerOf(sim.player, jy(sim, outId))!.id).toBe(backId);

    // Insured whole with Allianz at Squaremouth's 6% of what was paid, both halves under one policy; not twice.
    const iq = insuranceQuote(sim, sim.player, jy(sim, outId), sim.now);
    if (typeof iq === 'string') throw new Error(iq);
    expect(iq.premium).toBe(Math.round((jy(sim, outId).total + jy(sim, backId).total) * US_PREMIUM_SHARE));
    b0 = banked(sim);
    expect(sim.must<{ premium: number }>({ kind: 'travel.insure', payload: { journeyId: outId } }).premium).toBe(iq.premium);
    expect(b0 - banked(sim)).toBe(iq.premium);
    expect(jy(sim, backId).insured).toEqual(jy(sim, outId).insured);
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: backId } }).error).toBe('It’s insured already.');
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: 'journey-none' } }).error).toBe('That isn’t a journey you have booked.');

    // The flight out: not a day earlier than the insurance covers, nor past the way home, nor to itself.
    const out0 = jy(sim, outId);
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: out0.leaveAt - MS_DAY, slot: slotOf(out0) } }).error).toBe('The trip’s insurance covers the dates it was bought for.');
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: out0.leaveAt + 4 * MS_DAY, slot: slotOf(out0) } }).error).toBe('It would land after the way home leaves.');
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: out0.leaveAt, slot: slotOf(out0) } }).error).toBe('It’s the flight you have.');
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: backId, day: out0.leaveAt, slot: slotOf(out0) } }).error).toBe('The way home is moved by staying longer.');
    // Nor made longer from home.
    expect(sim.execute({ kind: 'travel.extend', payload: { journeyId: backId, day: jy(sim, backId).leaveAt + MS_DAY, slot: slotOf(jy(sim, backId)) } }).error).toBe('A stay is made longer once you’re there.');
    // A day later: no change fee within America, a night fewer at Freehand's own rate, the difference back.
    const cq = changeQuote(sim, sim.player, outId, out0.leaveAt + MS_DAY, slotOf(out0));
    if (typeof cq === 'string') throw new Error(cq);
    expect(cq.nights).toBe(2);
    expect(cq.stay).toBe(namedStayQuote(sim, FREEHAND, 'Bunk Room', 'flexible', cq.legs[cq.legs.length - 1]!.arriveAt, 2)!.price - out0.hotel!.price);
    expect(cq.stay).toBeLessThan(0);
    const hotelWas = out0.hotel!.price;
    b0 = banked(sim);
    const changed = sim.must<{ total: number; leaveAt: number }>({ kind: 'travel.change', payload: { journeyId: outId, day: out0.leaveAt + MS_DAY, slot: slotOf(out0) } });
    expect(changed.total).toBe(cq.total);
    expect(banked(sim) - b0).toBe(-cq.total);
    expect(jy(sim, outId).hotel).toMatchObject({ nights: 2, price: hotelWas + cq.stay });
    // Its departure on the calendar once, at the new time.
    expect(pending(sim, LEAVE_KIND, 'journeyId', outId)).toEqual([changed.leaveAt]);

    // A car for the stay, at Enterprise's terms at LAX, picked up at the new arrival and back when the way home leaves; not twice.
    const rq = rentalQuote(sim, sim.player, LA, jy(sim, outId).arriveAt, jy(sim, backId).leaveAt, true, false, 'small');
    if (typeof rq === 'string') throw new Error(rq);
    b0 = banked(sim);
    const rent = sim.must<{ rentalId: string; paid: number; deposit: number }>({ kind: 'travel.rent_car', payload: { journeyId: outId, waiver: false, cls: 'small' } });
    expect(rent.paid).toBe(rq.total);
    expect(rent.deposit).toBe(rq.deposit);
    expect(rent.deposit).toBeGreaterThan(0);
    expect(b0 - banked(sim)).toBe(rq.total);
    expect(sim.execute({ kind: 'travel.rent_car', payload: { journeyId: outId } }).error).toBe('A car is rented on it already.');
    expect(sim.execute({ kind: 'travel.rent_car', payload: { journeyId: backId } }).error).toBe('A rental is booked with the way home, which says when it goes back.');
    expect(pending(sim, RENTAL_RETURN_KIND, 'rentalId', rent.rentalId)).toEqual([jy(sim, backId).leaveAt]);

    // Saved and loaded: the trip, its insurance, the change and the car all kept.
    sim = reload(sim);
    expect(jy(sim, outId)).toMatchObject({ status: 'booked', leaveAt: changed.leaveAt, insured: { premium: iq.premium } });
    expect(rentalsOf(sim.player).find((r) => r.id === rent.rentalId)).toMatchObject({ status: 'booked', paid: rq.total, pickupAt: jy(sim, outId).arriveAt });

    // In the air: not changed, not insured, and no canceled flight to take back.
    sim.advanceTo(jy(sim, outId).leaveAt + 30 * 60_000);
    expect(jy(sim, outId).status).toBe('underway');
    expect(jy(sim, outId).rebooked).toBe(false);
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: changed.leaveAt + MS_DAY, slot: 1 } }).error).toBe('That isn’t a journey you have booked.');
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: outId } }).error).toBe('That isn’t a journey you have booked.');
    expect(sim.execute({ kind: 'travel.take_refund', payload: { journeyId: outId } }).error).toBe('No flight of yours was canceled.');
    // The bank emptied in the air: the desks can't hold their deposits.
    const given = giveAway(sim);
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    expect(sim.player.currentLocationId).toBe(LA);
    sim.advanceTo(sim.now + MS_HOUR + 60_000);
    const car = () => rentalsOf(sim.player).find((r) => r.id === rent.rentalId)!;
    expect(car()).toMatchObject({ status: 'held', depositDue: rent.deposit });
    expect(sim.execute({ kind: 'travel.pay_rental_deposit', payload: { rentalId: rent.rentalId } }).error).toBe(`The deposit is ${money(sim, rent.deposit)}, more than the bank holds.`);
    const hotelDeposit = depositFor(sim, FREEHAND, 2);
    if (hotelDeposit > 0) {
      expect(jy(sim, outId).hotel!.depositDue).toBe(hotelDeposit);
      expect(sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: outId } }).error).toBe(`A deposit of ${money(sim, hotelDeposit)} is more than the bank holds.`);
    } else expect(sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: outId } }).error).toBe('No deposit is due on that stay.');
    // The family gives it back: the car's deposit held in escrow, once.
    giveBack(sim, given);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'travel.pay_rental_deposit', payload: { rentalId: rent.rentalId } }).paid).toBe(rent.deposit);
    expect(b0 - banked(sim)).toBe(rent.deposit);
    expect(car()).toMatchObject({ status: 'out', at: LA });
    expect(sim.universe.accounts[car().escrowAccountId!]!.balance).toBe(rent.deposit);
    expect(sim.execute({ kind: 'travel.pay_rental_deposit', payload: { rentalId: rent.rentalId } }).error).toBe('No car is held for a deposit.');
    expect(pending(sim, 'travel.rental_deposit_due', 'rentalId', rent.rentalId)).toEqual([]);
    if (hotelDeposit > 0) {
      b0 = banked(sim);
      expect(sim.must<{ paid: number }>({ kind: 'travel.pay_deposit', payload: { journeyId: outId } }).paid).toBe(hotelDeposit);
      expect(b0 - banked(sim)).toBe(hotelDeposit);
    }
    // A later check-out is the morning's, not the day's of arrival.
    expect(sim.execute({ kind: 'travel.late_checkout', payload: { journeyId: outId } }).error).toBe('A later check-out is asked for on the morning you leave.');

    // A day longer: the way home, the car's return and the check-out all a day on, the difference paid.
    const back0 = jy(sim, backId);
    const xq = extendQuote(sim, sim.player, backId, back0.leaveAt + MS_DAY, slotOf(back0));
    if (typeof xq === 'string') throw new Error(xq);
    expect(xq.nights).toBe(3);
    const carPaid = car().paid;
    b0 = banked(sim);
    const ext = sim.must<{ total: number; leaveAt: number }>({ kind: 'travel.extend', payload: { journeyId: backId, day: back0.leaveAt + MS_DAY, slot: slotOf(back0) } });
    expect(ext.total).toBe(xq.total);
    expect(b0 - banked(sim)).toBe(xq.total);
    expect(jy(sim, backId).leaveAt).toBe(ext.leaveAt);
    expect(jy(sim, outId).hotel!.nights).toBe(3);
    expect(car()).toMatchObject({ returnAt: ext.leaveAt, paid: carPaid + xq.rental });
    expect(pending(sim, LEAVE_KIND, 'journeyId', backId)).toEqual([ext.leaveAt]);
    expect(pending(sim, RENTAL_RETURN_KIND, 'rentalId', rent.rentalId)).toEqual([ext.leaveAt]);
    const checkOutAt = jy(sim, outId).hotel!.checkOutAt;
    expect(pending(sim, CHECKOUT_KIND, 'journeyId', outId)).toEqual([checkOutAt]);
    expect(zonedParts(checkOutAt, LA_ZONE).day).toBe(zonedParts(ext.leaveAt, LA_ZONE).day);

    // The morning of check-out: Freehand's half of the night, to three; once. Its breakfast isn't priced.
    sim = reload(sim);
    sim.advanceTo(checkOutAt - 3 * MS_HOUR);
    const lq = lateQuote(sim, sim.player, outId);
    if (typeof lq === 'string') throw new Error(lq);
    const night = namedStayQuote(sim, FREEHAND, 'Bunk Room', 'flexible', checkOutAt - 24 * MS_HOUR, 1)!.price;
    expect(lq.price).toBe(Math.round(night * 0.5));
    expect(zonedParts(lq.until, LA_ZONE)).toMatchObject({ hour: 15, minute: 0 });
    b0 = banked(sim);
    expect(sim.must<{ until: number; price: number }>({ kind: 'travel.late_checkout', payload: { journeyId: outId } })).toEqual({ until: lq.until, price: lq.price });
    expect(b0 - banked(sim)).toBe(lq.price);
    expect(sim.execute({ kind: 'travel.late_checkout', payload: { journeyId: outId } }).error).toBe('You’re checking out late already.');
    expect(pending(sim, CHECKOUT_KIND, 'journeyId', outId)).toEqual([lq.until]);

    // Home: the car returned and its deposit released, once.
    until(sim, () => jy(sim, backId).status === 'arrived', jy(sim, backId).arriveAt + MS_DAY);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(car().status).toBe('returned');
    const released = memo(sim, 'A rental car’s deposit released');
    expect(released.map((t) => intoBank(sim, t))).toEqual([rent.deposit]);
    expect(sim.universe.accounts[car().escrowAccountId!]!.balance).toBe(0);
    if (hotelDeposit > 0) expect(memo(sim, 'The hotel’s deposit, returned').map((t) => intoBank(sim, t))).toEqual([hotelDeposit]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a let, a friend and a baby', () => {
  it('a let for the hotel, a friend paying back half of it, a baby on a lap, and the flight no longer moved', () => {
    let sim = life('jt-let');
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }]);
    const maya = () => contactsOf(sim.player).find((c) => c.name === 'Maya Okafor')!;
    expect(maya().hours).toBe(HALL.close);
    const day = noon(sim, 12);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const outId = booked.journeyId;
    const backId = booked.returnId;
    const hotel = jy(sim, outId).hotel!;

    // A let instead: AirDNA's night and Airbnb's fee, the hotel refunded whole, the difference paid or back.
    const q = letQuote(sim, LA, hotel.nights);
    if (typeof q === 'string') throw new Error(q);
    let b0 = banked(sim);
    expect(sim.must<{ price: number; hotelBack: number }>({ kind: 'travel.stay_let', payload: { journeyId: outId } })).toEqual({ price: q.price, hotelBack: hotel.price });
    expect(b0 - banked(sim)).toBe(q.price - hotel.price);
    expect(jy(sim, outId).hotel).toBeUndefined();
    expect(jy(sim, outId).let).toMatchObject({ nights: hotel.nights, price: q.price, checkOutAt: hotel.checkOutAt });
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: outId } }).error).toBe('A let takes the place of the journey’s hotel.');
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: 'journey-none' } }).error).toBe('That isn’t a journey you have booked.');

    // Maya along: she pays back half the let, once.
    b0 = banked(sim);
    const asked = sim.must<{ accepted: boolean; repaid?: number }>({ kind: 'travel.companion', payload: { journeyId: outId, contactId: maya().id } });
    expect(asked).toEqual({ accepted: true, repaid: Math.floor(q.price / 2) });
    expect(banked(sim) - b0).toBe(Math.floor(q.price / 2));
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: outId, contactId: maya().id } }).error).toBe('They’re coming already.');
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: backId, contactId: maya().id } }).error).toBe('Ask them on the way out.');

    // A baby on a lap, free within America both ways; a five-year-old would need a bed, and there's none.
    const baby: Child = { id: 'jt-baby', name: 'Ada Okafor', born: sim.now - 300 * MS_DAY };
    const five: Child = { id: 'jt-five', name: 'Ben Okafor', born: sim.now - 5 * 365 * MS_DAY };
    childrenOf(sim.player).push(baby, five);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'travel.child', payload: { journeyId: outId, childId: baby.id } }).paid).toBe(0);
    expect(banked(sim)).toBe(b0);
    expect(jy(sim, outId).childIds).toEqual([baby.id]);
    expect(jy(sim, backId).childIds).toEqual([baby.id]);
    expect(sim.execute({ kind: 'travel.child', payload: { journeyId: outId, childId: baby.id } }).error).toBe('They’re coming already.');
    expect(sim.execute({ kind: 'travel.child', payload: { journeyId: outId, childId: five.id } }).error).toBe('The room sleeps no more.');
    expect(sim.execute({ kind: 'travel.child', payload: { journeyId: outId, childId: 'nobody' } }).error).toBe('That isn’t a child of yours.');
    // Everyone along has a ticket: the flight out isn't moved.
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: jy(sim, outId).leaveAt + MS_DAY, slot: slotOf(jy(sim, outId)) } }).error).toBe('Everyone along has a ticket of their own on it.');

    sim = reload(sim);
    expect(companionsOf(jy(sim, outId))).toEqual([maya().id]);
    expect(jy(sim, outId).companionRepaid).toBe(Math.floor(q.price / 2));

    // There, in the let; home, the trip's waking hours with Maya.
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    expect(sim.player.stay).toMatchObject({ kind: 'let', cityId: LA });
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: outId, contactId: maya().id } }).error).toBe('That isn’t a journey you have booked.');
    const back = jy(sim, backId);
    until(sim, () => sim.now > back.arriveAt + MS_HOUR, back.arriveAt + 2 * MS_HOUR);
    expect(jy(sim, backId).status).toBe('arrived');
    expect(maya().hours).toBeCloseTo(HALL.close + ((jy(sim, backId).arriveAt - jy(sim, outId).leaveAt) / MS_HOUR) * AWAKE_SHARE, 6);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a flight the airline canceled', () => {
  it('is taken back as the fare instead of the next flight, the way home with it, once; nothing arrives, and the car is refunded', () => {
    // The seed was found by drawing the first flight's fate (`flightFate`) over jt-cancel-0 to jt-cancel-119: on this one the flight out is canceled.
    let sim = life('jt-cancel-20');
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 2, returnDay: day + 4 * MS_DAY, returnSlot: 2 } });
    const outId = booked.journeyId;
    const backId = booked.returnId;
    const rent = sim.must<{ rentalId: string; paid: number }>({ kind: 'travel.rent_car', payload: { journeyId: outId, waiver: false, cls: 'small' } });
    expect(sim.execute({ kind: 'travel.take_refund', payload: { journeyId: outId } }).error).toBe('No flight of yours was canceled.');

    // At the airport, the flight canceled and the next one booked for them.
    sim.advanceTo(jy(sim, outId).leaveAt + 60_000);
    const out = jy(sim, outId);
    expect(out).toMatchObject({ status: 'underway', rebooked: true });
    expect(sim.player.currentLocationId).toBe(NY);
    const flights = out.legs.filter((l) => l.mode === 'flight' || l.mode === 'check-in').reduce((a, l) => a + l.fare, 0);
    const refund = flights + hotelRefund(out.hotel!, out.arriveAt, sim.now) + jy(sim, backId).total;
    const b0 = banked(sim);
    expect(sim.must<{ refund: number }>({ kind: 'travel.take_refund', payload: { journeyId: outId } }).refund).toBe(refund);
    expect(banked(sim) - b0).toBe(refund);
    expect(jy(sim, outId).status).toBe('canceled');
    expect(jy(sim, backId).status).toBe('canceled');
    expect(sim.execute({ kind: 'travel.take_refund', payload: { journeyId: outId } }).error).toBe('No flight of yours was canceled.');
    expect(sim.execute({ kind: 'travel.take_refund', payload: { journeyId: backId } }).error).toBe('No flight of yours was canceled.');
    expect(sim.universe.scheduled.some((s) => s.status === 'pending' && (s.payload.journeyId === outId || s.payload.journeyId === backId))).toBe(false);

    sim = reload(sim);
    expect(jy(sim, outId).status).toBe('canceled');
    // Past the hour it would have landed: still at home, and the car at the desk refunded, once.
    sim.advanceTo(jy(sim, outId).arriveAt + 3 * MS_HOUR);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(rentalsOf(sim.player).find((r) => r.id === rent.rentalId)!.status).toBe('canceled');
    expect(memo(sim, 'A rental car not picked up, refunded').map((t) => intoBank(sim, t))).toEqual([rent.paid]);
    expect(pending(sim, RENTAL_RETURN_KIND, 'rentalId', rent.rentalId)).toEqual([]);
    sim.advanceBy(6 * MS_DAY);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(memo(sim, 'A canceled flight, the fare back')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('the desk asks for ID', () => {
  it('gives no room until a license is replaced and shown, and holds no deposit the Roosevelt doesn’t ask', () => {
    // A life holding a New York license as well as a passport: jt-0's (jt-desk's holds a passport only).
    let sim = life('jt-0');
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, hotelId: ROOSEVELT, room: 'Tower Queen Room', returnDay: day + 2 * MS_DAY, returnSlot: 1 } });
    const outId = booked.journeyId;
    expect(sim.execute({ kind: 'travel.show_id', payload: { journeyId: outId } }).error).toBe('No desk is waiting on your ID.');
    // In the air, every photo ID reported lost.
    sim.advanceTo(jy(sim, outId).leaveAt + 2 * MS_HOUR);
    expect(jy(sim, outId).status).toBe('underway');
    for (const d of documentsOf(sim.player).filter((x) => x.status === 'valid' && (x.kind === 'passport' || x.kind === 'license' || x.kind === 'idcard'))) sim.must({ kind: 'documents.report_lost', payload: { documentId: d.id } });
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    expect(jy(sim, outId).hotel!.idDue).toBe(true);
    expect(sim.player.stay).toMatchObject({ kind: 'hotel', hotelId: ROOSEVELT, out: true });
    expect(sim.player.stay!.readyAt).toBeUndefined();
    expect(sim.execute({ kind: 'travel.show_id', payload: { journeyId: outId } }).error).toBe('You have no government photo ID in force.');
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('You aren’t staying at a hotel SLATE knows by name.');
    expect(sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: outId } }).error).toBe('No deposit is due on that stay.');
    sim = reload(sim);
    expect(jy(sim, outId).hotel!.idDue).toBe(true);

    // New York's DMV replaces the license at $17.50, in force at once; shown, the room is given at its own hour.
    const lost = documentsOf(sim.player).find((d) => d.kind === 'license' && d.status === 'lost')!;
    let b0 = banked(sim);
    sim.must({ kind: 'documents.replace_license', payload: { documentId: lost.id } });
    expect(b0 - banked(sim)).toBe(17_50);
    expect(depositFor(sim, ROOSEVELT, 2)).toBe(0);
    b0 = banked(sim);
    const shown = sim.must<{ room: boolean }>({ kind: 'travel.show_id', payload: { journeyId: outId } });
    // No deposit held: the Roosevelt's own page asks none.
    expect(banked(sim)).toBe(b0);
    expect(jy(sim, outId).hotel!.idDue).toBeUndefined();
    expect(jy(sim, outId).hotel!.deposit).toBeUndefined();
    const readyAt = sim.player.stay!.readyAt;
    expect(shown.room).toBe(readyAt === undefined);
    if (readyAt !== undefined) {
      expect(zonedParts(readyAt, LA_ZONE)).toMatchObject({ hour: 15, minute: 0 });
      sim.advanceTo(readyAt + 60_000);
    }
    expect(sim.player.stay).toMatchObject({ kind: 'hotel', hotelId: ROOSEVELT });
    expect(sim.player.stay!.out).toBeUndefined();
    expect(sim.execute({ kind: 'travel.show_id', payload: { journeyId: outId } }).error).toBe('No desk is waiting on your ID.');
    // Home on the replaced license.
    until(sim, () => jy(sim, booked.returnId).status === 'arrived', jy(sim, booked.returnId).arriveAt + MS_DAY);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

// Found by this journey on 2026-10-06 and fixed: a room held for a deposit forgot which hotel it was and when it was
// ready, because `holdForDeposit` replaced the stay; paid, its breakfast, gym and pool were the town's.
describe('a room held for its deposit', () => {
  it('is still the named hotel once the deposit is paid', () => {
    let sim = life('jt-desk-name');
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, hotelId: FREEHAND, room: 'Bunk Room', returnDay: day + 2 * MS_DAY, returnSlot: 1 } });
    const outId = booked.journeyId;
    sim.advanceTo(jy(sim, outId).leaveAt + 2 * MS_HOUR);
    const given = giveAway(sim);
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    expect(jy(sim, outId).hotel!.depositDue).toBe(depositFor(sim, FREEHAND, 2));
    sim = reload(sim);
    giveBack(sim, given);
    sim.must({ kind: 'travel.pay_deposit', payload: { journeyId: outId } });
    expect(sim.player.stay).toMatchObject({ kind: 'hotel', cityId: LA, hotelId: FREEHAND });
    expect(sim.player.stay!.out).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  });
});

// Found by this journey on 2026-10-06 and fixed: a hotel made a let left a friend's share at half the hotel, and the
// player paid the rest; `settleRoomShare` now settles it again whenever the room's price changes.
describe('a friend along when the hotel becomes a let', () => {
  it('pays half of the let, not half of the hotel given up', () => {
    const sim = life('jt-let-after');
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }]);
    const maya = contactsOf(sim.player).find((c) => c.name === 'Maya Okafor')!;
    const day = noon(sim, 12);
    const booked = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const outId = booked.journeyId;
    const hotel = jy(sim, outId).hotel!.price;
    expect(sim.must<{ repaid?: number }>({ kind: 'travel.companion', payload: { journeyId: outId, contactId: maya.id } }).repaid).toBe(Math.floor(hotel / 2));
    const b0 = banked(sim);
    const swapped = sim.must<{ price: number; hotelBack: number }>({ kind: 'travel.stay_let', payload: { journeyId: outId } });
    expect(jy(sim, outId).companionRepaid).toBe(Math.floor(swapped.price / 2));
    // The player's own half of the let, and no more, is what the swap leaves them out of pocket for, against their half of the hotel.
    expect(b0 - banked(sim)).toBe((swapped.price - Math.floor(swapped.price / 2)) - (hotel - Math.floor(hotel / 2)));
    expect(breaches(sim.universe)).toEqual([]);
  });
});

// Found by this journey on 2026-10-06 and fixed: a stay made longer ran past its insurance, the way home uncovered.
// The cover is carried to the new homecoming now, at what America's share of the longer stay adds (`coverLonger`).
describe('an insured trip made longer', () => {
  it('is still insured on the way home, the cover carried at its share of what the longer stay adds', () => {
    const sim = life('jt-insured-longer');
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1 } });
    sim.must({ kind: 'travel.insure', payload: { journeyId: booked.journeyId } });
    until(sim, () => jy(sim, booked.journeyId).status === 'arrived', jy(sim, booked.journeyId).arriveAt + MS_DAY);
    const back = jy(sim, booked.returnId);
    const premium = back.insured!.premium;
    const q = extendQuote(sim, sim.player, back.id, back.leaveAt + MS_DAY, slotOf(back));
    if (typeof q === 'string') throw new Error(q);
    expect(q.cover).toBe(Math.round((q.travel + q.stay + q.rental) * US_PREMIUM_SHARE));
    const b0 = banked(sim);
    sim.must({ kind: 'travel.extend', payload: { journeyId: back.id, day: back.leaveAt + MS_DAY, slot: slotOf(back) } });
    expect(b0 - banked(sim)).toBe(q.total);
    const reloaded = reload(sim);
    const home = jy(reloaded, booked.returnId);
    expect(home.insured!.to).toBe(home.arriveAt);
    expect(jy(reloaded, booked.journeyId).insured!.premium).toBe(premium + q.cover);
    expect(policyNow(reloaded.player, home.leaveAt + MS_HOUR)).toBeDefined();
    expect(breaches(reloaded.universe)).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('London', () => {
  it('keeps no change fee for the flight, so it isn’t moved nor the stay made longer; breakfast at the Hoxton once a morning', () => {
    // A life holding a passport: jt-0's. Britain asks an American its ETA, applied for and decided first.
    let sim = life('jt-0');
    const eta = sim.must<{ readyAt: number }>({ kind: 'documents.apply_authorization', payload: { destination: 'GB' } });
    sim.advanceTo(eta.readyAt + 60_000);
    expect(documentsOf(sim.player).find((d) => d.kind === 'authorization')?.status).toBe('valid');
    const day = noon(sim, 12);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LDN, day, slot: 1, hotelId: HOXTON, room: 'Shoebox', returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const outId = booked.journeyId;
    const backId = booked.returnId;
    const out = jy(sim, outId);
    expect(sim.execute({ kind: 'travel.change', payload: { journeyId: outId, day: out.leaveAt + MS_DAY, slot: slotOf(out) } }).error).toBe('SLATE keeps no airline’s change fee for this flight, so it isn’t moved.');
    sim = reload(sim);
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    expect(sim.player.currentLocationId).toBe(LDN);
    expect(sim.execute({ kind: 'travel.extend', payload: { journeyId: backId, day: jy(sim, backId).leaveAt + MS_DAY, slot: slotOf(jy(sim, backId)) } }).error).toBe('SLATE keeps no airline’s change fee for this flight, so it isn’t moved.');
    // The next morning at eight: the Hoxton's £5, once.
    const zone = 'Europe/London';
    sim.advanceTo(hourOf(sim.now, zone, 8, 1));
    expect(sim.player.stay).toMatchObject({ kind: 'hotel', hotelId: HOXTON });
    const price = inSaveMoney(sim, 5_00, 'GBP');
    const fed = sim.player.wellbeing.nourishment;
    const b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'hotel.breakfast', payload: {} }).paid).toBe(price);
    expect(b0 - banked(sim)).toBe(price);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(fed);
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('You’ve had breakfast today.');
    sim = reload(sim);
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('You’ve had breakfast today.');
    // The next day after noon, over; the morning after, served again.
    sim.advanceTo(hourOf(sim.now, zone, 13, 1));
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('Breakfast is over for the day.');
    sim.advanceTo(hourOf(sim.now, zone, 8, 1));
    expect(sim.must<{ paid: number }>({ kind: 'hotel.breakfast', payload: {} }).paid).toBe(price);
    expect(memo(sim, 'The Hoxton, Holborn, breakfast')).toHaveLength(2);
    // Home, and no hotel to breakfast at.
    until(sim, () => jy(sim, backId).status === 'arrived', jy(sim, backId).arriveAt + MS_DAY);
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('You aren’t staying at a hotel SLATE knows by name.');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a bag delayed', () => {
  it('is held by the airline, a tee bought to get by, and the claim paid what the tee cost once the bag is back, once', () => {
    // The seed was found by drawing the checked bag's fate (`bagFate`) over jt-bag-0 to jt-bag-2999: on this one it's delayed 26 hours.
    let sim = life('jt-bag-510');
    const piece = luggageCatalog(sim, sim.player).find((x) => x.piece.type === 'large')!;
    const bag = sim.must<{ itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: piece.piece.id } });
    sim.must({ kind: 'luggage.choose', payload: { itemId: bag.itemId } });
    sim.must({ kind: 'luggage.pack', payload: {} });
    sim.must({ kind: 'luggage.take', payload: { itemId: bag.itemId, going: true } });
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: LA, day, slot: 2, bags: 1, returnDay: day + 4 * MS_DAY, returnSlot: 2 } });
    const outId = booked.journeyId;
    until(sim, () => jy(sim, outId).status === 'arrived', jy(sim, outId).arriveAt + MS_DAY);
    const claim = () => bagClaimsOf(sim.player)[0]!;
    expect(bagClaimsOf(sim.player)).toHaveLength(1);
    expect(claim()).toMatchObject({ id: `${outId}-${bag.itemId}`, kind: 'delayed', cityId: LA });
    expect(claim().backAt! - claim().at).toBe(26 * MS_HOUR);
    expect(bagsOf(sim.player).find((b) => b.id === bag.itemId)!.at.kind).toBe('held');
    expect(sim.execute({ kind: 'travel.bag_claim', payload: { claimId: claim().id } }).error).toBe('It’s claimed once the bag is back.');
    expect(sim.execute({ kind: 'travel.bag_claim', payload: { claimId: 'no-claim' } }).error).toBe('There’s no such claim.');
    // A tee bought in a Los Angeles store to get by.
    const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
    let b0 = banked(sim);
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: tee.sizes[2], color: tee.colors[0] } });
    const spent = b0 - banked(sim);
    expect(spent).toBeGreaterThan(0);
    sim = reload(sim);
    // Back after its 26 hours, brought to the room; the claim is the tee's price, once.
    sim.advanceTo(claim().backAt! + 60_000);
    expect(bagsOf(sim.player).find((b) => b.id === bag.itemId)!.at).toMatchObject({ kind: 'stay', cityId: LA });
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'travel.bag_claim', payload: { claimId: claim().id } }).paid).toBe(spent);
    expect(banked(sim) - b0).toBe(spent);
    expect(sim.execute({ kind: 'travel.bag_claim', payload: { claimId: claim().id } }).error).toBe('It’s been claimed.');
    sim = reload(sim);
    expect(claim().paid).toBe(spent);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a hotel here', () => {
  it('is booked where they are, as the screen books it, and checked out of early, the nights paid', () => {
    let sim = life('jt-here');
    const q = localStayQuote(sim, sim.player, { nights: 3, cls: 'hotel' });
    if (typeof q === 'string') throw new Error(q);
    let b0 = banked(sim);
    const r = sim.must<{ paid: number; checkOutAt: number }>({ kind: 'travel.stay_here', payload: { nights: 3, cls: 'hotel' } });
    expect(r).toEqual({ paid: q.price, checkOutAt: q.checkOutAt });
    expect(b0 - banked(sim)).toBe(q.price);
    expect(inLocalStay(sim.player)).toBe(true);
    expect(sim.execute({ kind: 'travel.stay_here', payload: { nights: 1, cls: 'hostel' } }).error).toBe('You’re staying somewhere here already.');
    // The town's average hotel isn't one SLATE knows by name: no breakfast sold.
    expect(sim.execute({ kind: 'hotel.breakfast', payload: {} }).error).toBe('You aren’t staying at a hotel SLATE knows by name.');
    sim = reload(sim);
    expect(inLocalStay(sim.player)).toBe(true);
    expect(pending(sim, 'travel.local_stay_end', 'personId', sim.player.id)).toEqual([q.checkOutAt]);
    sim.advanceBy(MS_DAY);
    b0 = banked(sim);
    sim.must({ kind: 'travel.check_out', payload: {} });
    expect(banked(sim)).toBe(b0);
    expect(inLocalStay(sim.player)).toBe(false);
    expect(sim.execute({ kind: 'travel.check_out', payload: {} }).error).toBe('You aren’t in a hotel booked here.');
    expect(pending(sim, 'travel.local_stay_end', 'personId', sim.player.id)).toEqual([]);
    // Booked again for a night, it ends itself at the check-out hour.
    const again = sim.must<{ checkOutAt: number }>({ kind: 'travel.stay_here', payload: { nights: 1, cls: 'hotel' } });
    sim.advanceTo(again.checkOutAt + MS_HOUR);
    expect(inLocalStay(sim.player)).toBe(false);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a pilot and a plane', () => {
  it('trains, is stopped by an empty bank and takes it up again, fails a checkride and passes it, flies, buys a 172, flies it, and sells it', () => {
    // The seed was found by drawing the tests (`passesPilotTest`) over jt-pilot-0 to jt-pilot-29: on this one the knowledge test passes first time and the first checkride fails.
    let sim = life('jt-pilot-1');
    const costs = trainingCosts(sim, 'us');
    let b0 = banked(sim);
    expect(sim.must<{ month: number; total: number }>({ kind: 'pilot.train', payload: {} })).toEqual({ month: costs.month, total: costs.total });
    // The first month and the medical.
    expect(b0 - banked(sim)).toBe(costs.month + medicalFee(sim, 'us'));
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).error).toBe('You’re training already.');
    // The bank emptied: the next month can't be paid, and the training stops where it is.
    const given = giveAway(sim);
    sim.advanceBy(30 * MS_DAY + 60_000);
    expect(sim.player.pilotTraining).toMatchObject({ status: 'stopped', monthsDone: 1 });
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).error).toBe('There isn’t enough in the bank for the first month.');
    expect(pending(sim, PILOT_MONTH_KIND, 'personId', sim.player.id)).toEqual([]);
    giveBack(sim, given);
    // Taken up again: a month, no second medical.
    b0 = banked(sim);
    sim.must({ kind: 'pilot.train', payload: {} });
    expect(b0 - banked(sim)).toBe(costs.month);
    expect(sim.player.pilotTraining).toMatchObject({ status: 'training', monthsDone: 2 });
    sim = reload(sim);
    // The months, the knowledge test, a checkride failed and one passed at half the fee.
    until(sim, () => sim.player.pilot !== undefined, sim.now + 12 * 30 * MS_DAY);
    expect(sim.player.pilotTraining).toMatchObject({ status: 'certified', monthsDone: PILOT_TRAINING.months, knowledgeTries: 1, checkrides: 2 });
    expect(memo(sim, 'Flight training, a month').map((t) => -intoBank(sim, t))).toEqual(Array(PILOT_TRAINING.months - 1).fill(costs.month));
    expect(memo(sim, 'The knowledge test').map((t) => -intoBank(sim, t))).toEqual([175_00]);
    expect(memo(sim, 'The checkride').map((t) => -intoBank(sim, t))).toEqual([1_000_00]);
    expect(memo(sim, 'The checkride, a retest').map((t) => -intoBank(sim, t))).toEqual([500_00]);
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).error).toBe('You hold a private pilot certificate.');
    expect(pending(sim, PILOT_MONTH_KIND, 'personId', sim.player.id)).toEqual([]);

    // A 172 of their own, at the listed median and the FAA's $5; not with an empty bank.
    const g2 = giveAway(sim);
    expect(sim.execute({ kind: 'aircraft.buy', payload: { financed: false } }).error).toBe('A 172 costs about $121,847.');
    giveBack(sim, g2);
    b0 = banked(sim);
    const bought = sim.must<{ paid: number; planeId: string }>({ kind: 'aircraft.buy', payload: { financed: false } });
    expect(bought.paid).toBe((OWN_172.priceUsd + OWN_172.registration) * 100);
    expect(b0 - banked(sim)).toBe(bought.paid);
    expect(planesOf(sim.player).map((a) => a.at)).toEqual([NY]);
    // Flown to Boston in it, at its fuel by the hour.
    let flight: { journeyId: string } | undefined;
    let tried = '';
    for (let d = 3; d < 20 && !flight; d += 1) {
      const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ma-boston', day: noon(sim, d), slot: 1, nights: 1, by: 'fly' } });
      if (r.ok) flight = r.value; else tried = r.error ?? '';
    }
    expect(flight, tried).toBeDefined();
    const fly = jy(sim, flight!.journeyId).legs.find((l) => l.mode === 'fly')!;
    expect(fly.routeId).toBe('own');
    // Textron's 124 knots between the nearest airports, and a fifth of an hour for the ground and the climb.
    const nm = distanceKm(airportsFor(NY)[0]!.airport, airportsFor('us-ma-boston')[0]!.airport) / 1.852;
    expect(fly.fare).toBe(Math.round(ownHourCost(sim, NY) * (nm / SKYHAWK.knots + SKYHAWK.overheadHours)));
    sim = reload(sim);
    until(sim, () => jy(sim, flight!.journeyId).status === 'arrived', jy(sim, flight!.journeyId).arriveAt + MS_DAY);
    expect(planesOf(sim.player)[0]).toMatchObject({ at: 'us-ma-boston' });
    expect(planesOf(sim.player)[0]!.hours).toBeGreaterThan(0);
    // Its month: the tiedown and the insurance.
    sim.advanceTo(planesOf(sim.player)[0]!.boughtAt + 30 * MS_DAY + 60_000);
    expect(memo(sim, 'The plane’s tiedown, a month').map((t) => -intoBank(sim, t))).toEqual([OWN_172.tiedown['us-ny']! * 100]);
    expect(memo(sim, 'The plane’s insurance, a month').map((t) => -intoBank(sim, t))).toEqual([Math.round(OWN_172.insuranceYear / 12 * 100)]);
    // Sold at what it was bought for, once; no month bills it after.
    b0 = banked(sim);
    expect(sim.must<{ value: number }>({ kind: 'aircraft.sell', payload: { planeId: bought.planeId } }).value).toBe(OWN_172.priceUsd * 100);
    expect(banked(sim) - b0).toBe(OWN_172.priceUsd * 100);
    expect(sim.execute({ kind: 'aircraft.sell', payload: { planeId: bought.planeId } }).error).toBe('That isn’t a plane you own.');
    expect(sim.execute({ kind: 'aircraft.sell', payload: {} }).error).toBe('You own no plane.');
    expect(pending(sim, AIRCRAFT_MONTH_KIND, 'personId', sim.player.id)).toEqual([]);
    sim = reload(sim);
    sim.advanceBy(31 * MS_DAY);
    expect(memo(sim, 'The plane’s tiedown, a month')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
