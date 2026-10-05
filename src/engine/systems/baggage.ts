/**
 * SLATE — a checked bag the airline mishandles (from 2026-10-05), from
 * `docs/research/world/research-lost-baggage.json`, read that day.
 *
 * - **How often**: America's carriers mishandled 0.52 bags in 100 checked in
 *   2025 (the DOT's Air Travel Consumer Report, read secondhand: its pages
 *   refuse the fetch). A flight between countries mishandles more: SITA's 2025
 *   figures give 9.12 a thousand passengers on international flights against
 *   1.65 within a country, so an international bag is drawn at the DOT's rate
 *   times that ratio, SLATE's derivation.
 * - **What happens to it**: SITA's 2024 split, read on SITA's own page: 74%
 *   delayed, 18% damaged or pilfered, 8% lost or stolen.
 * - **A delayed bag comes back**: SITA, 2024: 66% within 48 hours. The rest come
 *   in two to seven days, SLATE's estimate: no distribution past 48 hours was
 *   read. The airline brings it to where you are, or home if you've gone.
 * - **A lost bag** is declared lost after 21 days, the tracing period Delta's
 *   own page gives and Aer Lingus, Air Canada and Aeromexico are read to keep.
 * - **Claims**: a delayed bag's essentials bought while waiting, against what
 *   was bought (Delta's and BA's policy: clothing and toiletries, no daily cap
 *   stated), within 21 days of its return; a damaged bag's price, within 7 days
 *   (the Montreal Convention's article 31, and the UK CAA's page); a lost bag's
 *   contents and the bag, any time after it's declared lost. Each is capped at
 *   the Montreal Convention's 1,519 SDR (ICAO, from 2024-12-28, about US$2,000
 *   by ICAO's own figure), or America's domestic $4,700 (14 CFR 254.4, from
 *   2025-01-22, read secondhand).
 * - A damaged bag is left at half its condition, SLATE's estimate: no source
 *   reads how badly.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { inSaveMoney } from './banking';
import { bagRuleFor, bagsGoing, checkedSize, packedIn } from './luggage';
import { homeKeyOf, itemsOf, type Item } from './items';

export const BAGGAGE = {
  /** Mishandled bags a checked bag, within a country (the DOT, 2025). */
  domesticRate: 0.0052,
  /** International against domestic, a passenger (SITA, 2025). */
  internationalFactor: 9.12 / 1.65,
  /** Of the mishandled, the shares delayed and damaged; the rest lost (SITA, 2024). */
  delayedShare: 0.74, damagedShare: 0.18,
  /** A delayed bag's return: the share within 48 hours, and the rest's days (SLATE's estimate). */
  within48hShare: 0.66, laterDays: [2, 7] as const,
  tracingDays: 21,
  claimDays: { delayed: 21, damaged: 7 } as const,
  /** The limits, in their own money: Montreal's 1,519 SDR about US$2,000 (ICAO), America's domestic $4,700. */
  montrealUsd: 2_000, usDomesticUsd: 4_700,
  damagedCondition: 0.5,
} as const;

export interface BagClaim {
  id: string; kind: 'delayed' | 'damaged' | 'lost'; bagId: string; bagLabel: string; carrier: string; cityId: string;
  at: Instant; backAt?: Instant; lostAt?: Instant;
  /** The cap on what can be paid, in the save's money. */
  cap: Money;
  /** For a lost bag: what it and its contents were bought for. */
  value?: Money;
  paid?: Money;
}

export const BAG_BACK_KIND = 'travel.bag_back';
export const BAG_LOST_KIND = 'travel.bag_lost';
export const bagClaimsOf = (person: Person): BagClaim[] => (person.bagClaims ??= []);

/** What becomes of one checked bag on a flight, drawn on its own: nothing, delayed some hours, damaged, or lost. */
export function bagFate(sim: Simulation, person: Person, key: string, international: boolean): { kind: 'ok' } | { kind: 'delayed'; hours: number } | { kind: 'damaged' } | { kind: 'lost' } {
  const rng = sim.rng('travel.bags', person.id, key);
  const rate = BAGGAGE.domesticRate * (international ? BAGGAGE.internationalFactor : 1);
  if (rng.next() >= rate) return { kind: 'ok' };
  const x = rng.next();
  if (x < BAGGAGE.delayedShare) {
    const y = rng.next();
    const hours = y < BAGGAGE.within48hShare ? 6 + rng.next() * 42 : 24 * (BAGGAGE.laterDays[0] + rng.next() * (BAGGAGE.laterDays[1] - BAGGAGE.laterDays[0]));
    return { kind: 'delayed', hours: Math.round(hours) };
  }
  return x < BAGGAGE.delayedShare + BAGGAGE.damagedShare ? { kind: 'damaged' } : { kind: 'lost' };
}

/** The cap on a claim for a flight: America's domestic $4,700 within America, Montreal's otherwise. */
const capFor = (sim: Simulation, fromCity: string, toCity: string): Money => {
  const us = CITIES.get(fromCity)?.countryId === 'us' && CITIES.get(toCity)?.countryId === 'us';
  return inSaveMoney(sim, (us ? BAGGAGE.usDomesticUsd : BAGGAGE.montrealUsd) * 100, 'USD');
};

/** A bag's worth with what's in it: what each was bought for. */
const worth = (person: Person, bag: Item): Money => [bag, ...packedIn(person, bag)].reduce((n, i) => n + (i.paid ?? 0), 0);

/**
 * On landing with checked bags (`travel.arrive`): each drawn, and what's
 * mishandled said, held by the airline or damaged, with a claim to make.
 */
export function landBags(sim: Simulation, person: Person, journeyId: string, fromCity: string, toCity: string, checked: number): BagClaim[] {
  if (checked <= 0) return [];
  const rule = bagRuleFor(fromCity, toCity);
  const carrier = rule?.carrier ?? 'The airline';
  const international = CITIES.get(fromCity)?.countryId !== CITIES.get(toCity)?.countryId;
  const bags = bagsGoing(person).sort((a, b) => Number(checkedSize(b)) - Number(checkedSize(a))).slice(0, checked);
  const made: BagClaim[] = [];
  for (const bag of bags) {
    const fate = bagFate(sim, person, `${journeyId}-${bag.id}`, international);
    if (fate.kind === 'ok') continue;
    const claim: BagClaim = { id: `${journeyId}-${bag.id}`, kind: fate.kind, bagId: bag.id, bagLabel: bag.label, carrier, cityId: toCity, at: sim.now, cap: capFor(sim, fromCity, toCity) };
    if (fate.kind === 'damaged') bag.condition = Math.min(bag.condition, BAGGAGE.damagedCondition);
    if (fate.kind === 'delayed' || fate.kind === 'lost') {
      const until = fate.kind === 'delayed' ? sim.now + fate.hours * 3_600_000 : sim.now + BAGGAGE.tracingDays * MS_DAY;
      bag.at = { kind: 'held', cityId: toCity, by: `${carrier}’s baggage service`, until };
      if (fate.kind === 'delayed') { claim.backAt = until; sim.schedule({ at: until, kind: BAG_BACK_KIND, label: 'Your Bag Comes Back', category: 'personal', priority: 27, payload: { personId: person.id, claimId: claim.id } }); }
      else { claim.lostAt = until; claim.value = worth(person, bag); sim.schedule({ at: until, kind: BAG_LOST_KIND, label: 'A Bag Declared Lost', category: 'personal', priority: 27, payload: { personId: person.id, claimId: claim.id } }); }
    }
    bagClaimsOf(person).push(claim);
    made.push(claim);
    if (person.id === sim.universe.playerId) {
      const body = fate.kind === 'delayed' ? `${bag.label} didn’t come off the carousel: ${carrier} has it and brings it to you, and what you buy to get by until then can be claimed.` : fate.kind === 'damaged' ? `${bag.label} came off the carousel damaged. A claim to ${carrier} pays its price, made within ${BAGGAGE.claimDays.damaged} days.` : `${bag.label} didn’t come off the carousel. ${carrier} traces it for ${BAGGAGE.tracingDays} days.`;
      sim.notify({ category: 'personal', title: fate.kind === 'damaged' ? 'A Damaged Bag' : 'A Bag Didn’t Arrive', body, importance: 70, route: '/workspace/belongings' });
    }
  }
  return made;
}

/** What a claim pays now, or why it can't be made: a delayed bag's essentials bought while waiting, a damaged bag's price, a lost bag's worth, each capped. */
export function claimRefusal(sim: Simulation, person: Person, claim: BagClaim): string | undefined {
  if (claim.paid !== undefined) return 'It’s been claimed.';
  if (claim.kind === 'delayed') {
    if (claim.backAt === undefined || sim.now < claim.backAt) return 'It’s claimed once the bag is back.';
    if (sim.now > claim.backAt + BAGGAGE.claimDays.delayed * MS_DAY) return `A delayed bag’s claim is made within ${BAGGAGE.claimDays.delayed} days of its return.`;
  }
  if (claim.kind === 'damaged' && sim.now > claim.at + BAGGAGE.claimDays.damaged * MS_DAY) return `A damaged bag’s claim is made within ${BAGGAGE.claimDays.damaged} days.`;
  if (claim.kind === 'lost' && (claim.lostAt === undefined || sim.now < claim.lostAt)) return `It’s still being traced, until ${BAGGAGE.tracingDays} days from landing.`;
  if (claimAmount(person, claim) <= 0) return 'There’s nothing to claim: nothing was bought while it was away.';
  return undefined;
}

/** What a claim comes to, capped. */
export function claimAmount(person: Person, claim: BagClaim): Money {
  let due = 0;
  if (claim.kind === 'delayed') {
    // Clothes and toiletries bought while it was away, against what each cost.
    due = itemsOf(person).filter((i) => (i.garment || i.supply) && i.acquiredAt >= claim.at && i.acquiredAt <= (claim.backAt ?? claim.at)).reduce((n, i) => n + (i.paid ?? 0), 0);
  } else if (claim.kind === 'damaged') {
    due = itemsOf(person).find((i) => i.id === claim.bagId)?.paid ?? 0;
  } else due = claim.value ?? 0;
  return Math.min(due, claim.cap);
}

export function registerBaggage(sim: Simulation): void {
  sim.onSchedule(BAG_BACK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person ? bagClaimsOf(person).find((c) => c.id === item.payload.claimId) : undefined;
    const bag = claim ? itemsOf(person!).find((i) => i.id === claim.bagId) : undefined;
    if (!person || !claim || !bag || bag.at.kind !== 'held') return;
    // To them where they still are, or home.
    const there = person.currentLocationId === claim.cityId;
    const home = homeKeyOf(person.home);
    bag.at = there ? (person.stay ? { kind: 'stay', cityId: claim.cityId } : { kind: 'person' }) : home ? { kind: 'home', home, spot: 'storage' } : { kind: 'person' };
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Your Bag Is Back', body: `${claim.carrier} brought ${bag.label} ${there ? 'to you' : 'home'}. What you bought to get by can be claimed within ${BAGGAGE.claimDays.delayed} days.`, importance: 55, route: '/workspace/belongings' });
  });
  sim.onSchedule(BAG_LOST_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person ? bagClaimsOf(person).find((c) => c.id === item.payload.claimId) : undefined;
    if (!person || !claim) return;
    const bag = itemsOf(person).find((i) => i.id === claim.bagId);
    // Gone, with what was in it.
    const gone = new Set(bag ? [bag.id, ...packedIn(person, bag).map((i) => i.id)] : []);
    person.items = itemsOf(person).filter((i) => !gone.has(i.id));
    if (person.goingBags) person.goingBags = person.goingBags.filter((id) => !gone.has(id));
    if (person.luggageId && gone.has(person.luggageId)) delete person.luggageId;
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'A Bag Declared Lost', body: `${claim.carrier} couldn’t find ${claim.bagLabel} in ${BAGGAGE.tracingDays} days: it’s declared lost, with everything in it. A claim pays what it was all bought for, up to ${formatMoney(claim.cap, saveCurrency(s.universe), { cents: false })}.`, importance: 75, route: '/workspace/belongings' });
  });
  sim.onCommand<{ claimId: string }, { paid: Money }>('travel.bag_claim', (p, { sim: s }) => {
    const person = s.player;
    const claim = bagClaimsOf(person).find((c) => c.id === p?.claimId);
    if (!claim) throw new CommandError('There’s no such claim.');
    const no = claimRefusal(s, person, claim);
    if (no) throw new CommandError(no);
    const amount = claimAmount(person, claim);
    s.post({ memo: `${claim.carrier}: a ${claim.kind} bag’s claim`, category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount }, { accountId: s.nominalAccount('income', 'Airline Compensation').id, amount: -amount }] });
    claim.paid = amount;
    return { paid: amount };
  });
}
