/**
 * The dealership, played out.
 *
 * You get there. Somebody comes over. You pick a car off the lot, look it
 * over, take it out, and then you talk numbers: your offer, their counter,
 * the car you could trade against it, whether they bring it to you, and what
 * they will fix first. When the price is agreed you choose how to pay, sign,
 * insure it if you want to, and either drive it away or wait for the van.
 *
 * Every number is the dealership system's. This decides what to ask and in
 * what order; `deal.*` and `veh.purchase` decide what it costs and what it
 * does, and the summarized version runs the same commands with sensible
 * defaults: one look, one offer, their counter, cash, collect.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDate, formatDuration } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { Id, SceneSession, Vehicle, VehicleDeal, VehicleListing } from '../domain/model';
import { INVENTED_NOTE, placesIn, type Place } from '../content/places';
import { CITIES } from '../content/geography';
import { MODE_LABEL, driveableVehicle, planJourney, type Mode } from '../systems/places';
import { localHour } from '../systems/fitness';
import {
  DEALER_CLOSE, DEALER_OPEN, carName, dealFor, dealOf, findingByText, kindFact, lastSaid, listingKind, listingsAt, lotSells, roundsLeft,
  salespersonAt, sellerKnows, sellerTone, tradeInAllowance, tradeInCandidates, vehicleName, visitsBefore,
} from '../systems/dealership';
import { preview } from '../dialogue/library';
import { KIND_PROFILE, type VehicleKind } from '../content/vehicles';
import { financeRefusal, purchaseQuote, vehicleKind } from '../systems/vehicles';
import { keepingLabel } from '../systems/storage';

/** How the scene talks about what the lot sells. */
interface Words {
  noun: string;
  plural: string;
  /** Where the stock is: 'out front', 'on the ramp'. */
  where: string;
  drive: string;
  driveAliases: string[];
  driveDetail: string;
  another: string;
  tradeIn: string;
  delivery: string;
  deliveryDetail: string;
  brought: string;
}

const WORDS: Readonly<Record<VehicleKind, Words>> = {
  car: { noun: 'car', plural: 'cars', where: 'out front', drive: 'Take It For A Drive', driveAliases: ['drive', 'test drive', 'test'], driveDetail: 'Half an hour on the road.', another: 'Look At Another Car', tradeIn: 'Trade In A Car', delivery: 'Ask For Delivery', deliveryDetail: 'A few days. They get it ready first.', brought: 'They’ll bring it round' },
  motorcycle: { noun: 'bike', plural: 'bikes', where: 'in the showroom', drive: 'Take It For A Ride', driveAliases: ['ride', 'test ride', 'test', 'drive'], driveDetail: 'Half an hour on the road.', another: 'Look At Another Bike', tradeIn: 'Trade In A Bike', delivery: 'Ask For Delivery', deliveryDetail: 'A few days. They get it ready first.', brought: 'They’ll bring it round in the van' },
  boat: { noun: 'boat', plural: 'boats', where: 'on the water and the hard standing', drive: 'Take It Out On The Water', driveAliases: ['sea trial', 'take it out', 'test', 'drive'], driveDetail: 'An hour on the water with the broker aboard.', another: 'Look At Another Boat', tradeIn: 'Trade In A Boat', delivery: 'Ask For Delivery To A Berth', deliveryDetail: 'A few days. They commission it first.', brought: 'They’ll deliver it to a berth' },
  jet: { noun: 'aircraft', plural: 'aircraft', where: 'on the ramp', drive: 'Take A Demonstration Flight', driveAliases: ['demo flight', 'demonstration', 'fly', 'test', 'drive'], driveDetail: 'An hour in the air with their pilot.', another: 'Look At Another Aircraft', tradeIn: 'Trade In An Aircraft', delivery: 'Ask For A Ferry Flight', deliveryDetail: 'A few days. They position it to your home airport.', brought: 'They’ll ferry it to your home airport' },
};

function wordsFor(place: Place): Words {
  return WORDS[lotSells(place)];
}
import { defineScene, unknownStep, type SceneChoice, type SceneRuntime } from '../systems/scenes';

/** The offers on the table beside their number, as fractions of it. */
const OFFER_STEPS: readonly number[] = [0.04, 0.08, 0.12];
const FINANCE_MONTHS = 60;
const LEASE_MONTHS = 36;

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function lotOf(session: SceneSession): Place {
  const place = placesIn(session.locationId).find((p) => p.id === str(session, 'placeId') && p.kind === 'dealership');
  if (!place) throw new CommandError('That dealership isn’t here any more.');
  return place;
}

function dealOfSession(sim: Simulation, session: SceneSession): VehicleDeal {
  return dealOf(sim, str(session, 'dealId'));
}

function listingOfDeal(sim: Simulation, deal: VehicleDeal): VehicleListing {
  const listing = sim.universe.vehicleListings[deal.listingId];
  if (!listing) throw new CommandError('That car is no longer on the lot.');
  return listing;
}

function isOpen(sim: Simulation): boolean {
  const hour = localHour(sim);
  return hour >= DEALER_OPEN && hour < DEALER_CLOSE;
}

function hoursLine(): string {
  return `Open ${DEALER_OPEN}:00 to ${DEALER_CLOSE}:00.`;
}

function journeyChoices(sim: Simulation, place: Place): SceneChoice[] {
  const modes: Mode[] = ['walk', 'drive', 'taxi', 'transit'];
  const open = isOpen(sim);
  const out: SceneChoice[] = [];
  for (const mode of modes) {
    if (mode === 'drive' && !driveableVehicle(sim)) continue;
    const journey = planJourney(sim, place, mode);
    const detail = `${formatDuration(journey.minutes * MS_MINUTE)}${journey.cost > 0 ? ` · ${formatMoney(journey.cost)}` : ''}`;
    out.push(open
      ? { id: `go:${mode}`, label: MODE_LABEL[mode], aliases: [mode, `${mode} there`], detail }
      : { id: `go:${mode}`, label: MODE_LABEL[mode], detail, disabled: `${place.name} is closed. ${hoursLine()}` });
  }
  return out;
}

function sellerLine(sim: Simulation, session: SceneSession, place: Place): string {
  const seller = salespersonAt(sim, str(session, 'placeId'));
  const kind = kindFact(lotSells(place));
  if (!seller) return preview(sim, { section: 'vehicles', purpose: 'greet', beat: 'lot' }, { flags: ['nobody'], facts: [kind] }, session.id).text;
  const known = sellerKnows(sim, seller.id);
  const listing = str(session, 'listingId') ? sim.universe.vehicleListings[str(session, 'listingId')] : undefined;
  const flags = known.length > 0 ? [] : [visitsBefore(sim, seller.id) > 0 ? 'returning' : 'first_visit'];
  return preview(sim, { section: 'vehicles', purpose: 'greet', beat: 'lot' }, {
    tone: sellerTone(seller), facts: [...known, kind], flags, vars: { first: seller.firstName, car: listing ? carName(listing) : `the ${wordsFor(place).noun}` },
  }, session.id).text;
}

function conditionLabel(listing: VehicleListing): string {
  return listing.condition === 'new' ? 'New' : listing.condition === 'certified' ? 'Certified' : listing.condition === 'collector' ? 'Collector' : 'Used';
}

function usageLabel(listing: VehicleListing): string {
  const profile = KIND_PROFILE[listingKind(listing)];
  return `${listing.mileage.toLocaleString('en-US')} ${profile.unit === 'miles' ? 'mi' : 'hrs'}`;
}

function carFacts(deal: VehicleDeal, listing: VehicleListing) {
  const facts = [
    { label: deal.status === 'agreed' ? 'Agreed' : 'Asking', value: formatMoney(deal.status === 'agreed' ? (deal.agreedPrice ?? deal.currentAsk) : deal.currentAsk) },
    { label: 'Condition', value: `${conditionLabel(listing)} · ${usageLabel(listing)}` },
    { label: 'Color', value: `${listing.configuration.paint} · ${listing.configuration.interior}` },
    { label: 'Options', value: listing.configuration.options.length > 0 ? `${listing.configuration.options.length} fitted` : 'Standard' },
  ];
  if (deal.inspected) facts.push({ label: 'Found', value: deal.findings.join(' ') });
  return facts;
}

function termsFacts(sim: Simulation, deal: VehicleDeal) {
  const facts = [
    { label: 'Their Number', value: formatMoney(deal.currentAsk) },
    { label: 'Your Last Offer', value: deal.lastOffer ? formatMoney(deal.lastOffer) : 'None yet' },
    { label: 'Rounds Left', value: `${roundsLeft(deal)}` },
    { label: 'Delivery', value: deal.terms.delivery === 'deliver' ? 'They bring it' : 'You collect' },
  ];
  void sim;
  if (deal.terms.tradeInVehicleId) {
    const trade = sim.universe.vehicles[deal.terms.tradeInVehicleId];
    facts.push({ label: 'Trade-In', value: trade ? `${vehicleName(trade)} · ${formatMoney(deal.terms.tradeInValue ?? 0)}` : formatMoney(deal.terms.tradeInValue ?? 0) });
  }
  if (deal.terms.repairs.length > 0) facts.push({ label: 'They Will', value: deal.terms.repairs.join(', ') });
  return facts;
}

function netCredit(sim: Simulation, deal: VehicleDeal): Money {
  if (!deal.terms.tradeInVehicleId) return 0;
  const trade = sim.universe.vehicles[deal.terms.tradeInVehicleId];
  const owed = trade?.loanAccountId ? Math.max(0, -(sim.ledger.tryAccount(trade.loanAccountId)?.balance ?? 0)) : 0;
  return Math.max(0, (deal.terms.tradeInValue ?? 0) - owed);
}

function payChoices(sim: Simulation, deal: VehicleDeal, kind: VehicleKind): SceneChoice[] {
  const price = deal.agreedPrice ?? deal.currentAsk;
  const credit = netCredit(sim, deal);
  const cash = purchaseQuote(sim, price, 'cash', { tradeInCredit: credit });
  const finance = purchaseQuote(sim, price, 'financed', { termMonths: FINANCE_MONTHS, tradeInCredit: credit });
  const lease = purchaseQuote(sim, price, 'leased', { termMonths: LEASE_MONTHS, tradeInCredit: credit });
  const funds = sim.player.primaryAccountId ? sim.ledger.availableFunds(sim.player.primaryAccountId) : 0;
  const short = (due: Money) => (funds < due ? `You have ${formatMoney(funds)} and this needs ${formatMoney(due)} today.` : undefined);
  const out: SceneChoice[] = [
    { id: 'sign:cash', label: 'Pay Cash', aliases: ['cash', 'outright', 'pay'], detail: `${formatMoney(cash.cashDue)} today`, tone: 'primary', disabled: short(cash.cashDue) },
    { id: 'sign:financed', label: `Finance Over ${FINANCE_MONTHS} Months`, aliases: ['finance', 'loan', 'financed'], detail: `${formatMoney(finance.cashDue)} today · ${formatMoney(finance.monthlyPayment ?? 0)} a month`, disabled: financeRefusal(sim, finance) ?? short(finance.cashDue) },
    { id: 'sign:leased', label: `Lease For ${LEASE_MONTHS} Months`, aliases: ['lease', 'leased'], detail: `${formatMoney(lease.cashDue)} today · ${formatMoney(lease.monthlyPayment ?? 0)} a month`, disabled: kind === 'boat' ? 'Boats aren’t leased here. Cash or finance.' : short(lease.cashDue) },
  ];
  return out;
}

export const DEALER_SCENE = defineScene({
  id: 'vehicles.dealer',
  version: 1,
  title: 'The Dealership',
  placeBound: true,

  available(sim, input) {
    const place = placesIn(sim.player.currentLocationId).find((p) => p.id === String(input['placeId']) && p.kind === 'dealership');
    if (!place) return { ok: false, reason: 'Pick a dealership in the city you’re in.' };
    if (input['dealId']) {
      const deal = sim.universe.vehicleDeals[String(input['dealId'])];
      if (!deal || (deal.status !== 'open' && deal.status !== 'agreed')) return { ok: false, reason: 'That deal isn’t on the table any more.' };
    }
    return { ok: true };
  },

  start(sim, input) {
    const placeId = String(input['placeId']);
    const here = sim.player.currentPlaceId === placeId;
    const dealId = input['dealId'] ? String(input['dealId']) : '';
    const listingId = input['listingId'] ? String(input['listingId']) : '';
    const deal = dealId ? sim.universe.vehicleDeals[dealId] : undefined;
    const node = !here ? 'arrive' : deal ? (deal.status === 'agreed' ? 'agreed' : 'car') : 'lot';
    return {
      node,
      placeId: here ? placeId : undefined,
      context: { placeId, dealId: deal?.id ?? '', listingId: deal?.listingId ?? listingId, salespersonId: deal?.salespersonId ?? '' },
      participantIds: deal ? [deal.salespersonId] : [],
      refType: deal ? 'deal' : undefined,
      refId: deal?.id,
    };
  },

  view(sim, session) {
    const place = lotOf(session);
    switch (session.node) {
      case 'arrive': {
        const open = isOpen(sim);
        return {
          title: place.name,
          eyebrow: 'Getting there',
          text: `${place.about} ${INVENTED_NOTE}${open ? '' : ` It is closed. ${hoursLine()}`}`,
          choices: journeyChoices(sim, place),
          facts: [{ label: 'Hours', value: `${DEALER_OPEN}:00 – ${DEALER_CLOSE}:00` }, { label: KIND_PROFILE[lotSells(place)].plural, value: `${listingsAt(sim, place.id).length} on the lot` }],
          canSkip: false,
        };
      }
      case 'lot': {
        const cars = listingsAt(sim, place.id);
        const words = wordsFor(place);
        const wanted = str(session, 'listingId');
        const choices: SceneChoice[] = cars
          .sort((a, b) => (a.id === wanted ? -1 : b.id === wanted ? 1 : 0))
          .slice(0, 8)
          .map((l) => {
            const open = dealFor(sim, l.id);
            return {
              id: `car:${l.id}`, label: open ? `Back To The ${carName(l)}` : l.id === wanted ? `The ${carName(l)} You Came For` : carName(l),
              aliases: [carName(l).toLowerCase(), l.configuration.paint.toLowerCase()],
              detail: `${conditionLabel(l)} · ${usageLabel(l)} · ${formatMoney(l.price)} · ${l.configuration.paint}`,
            };
          });
        choices.push({ id: 'out', label: 'Walk Out', aliases: ['out', 'leave', 'nothing'] });
        return {
          title: place.name,
          eyebrow: 'The lot',
          text: `${sellerLine(sim, session, place)} ${cars.length === 0 ? 'The lot is empty today; stock comes in every couple of weeks.' : `${cars.length} ${cars.length === 1 ? words.noun : words.plural} ${words.where}.`}`,
          choices,
          canSkip: false,
        };
      }
      case 'car': {
        const deal = dealOfSession(sim, session);
        const listing = listingOfDeal(sim, deal);
        const seller = sim.universe.people[deal.salespersonId];
        const words = WORDS[listingKind(listing)];
        const choices: SceneChoice[] = [
          { id: 'inspect', label: 'Look It Over', aliases: ['inspect', 'look', 'check'], detail: 'Twenty minutes. What you find is a lever.', disabled: deal.inspected ? 'You have looked it over.' : undefined },
          { id: 'drive', label: words.drive, aliases: words.driveAliases, detail: words.driveDetail, disabled: deal.testDriven ? 'You have taken it out.' : sim.player.wellbeing.energy < 10 ? 'You’re too tired to take anything out today.' : undefined },
          { id: 'numbers', label: deal.status === 'agreed' ? 'Back To The Paperwork' : 'Talk Numbers', aliases: ['numbers', 'price', 'talk', 'negotiate', 'offer'], tone: 'primary' },
          { id: 'another', label: words.another, aliases: ['another', 'back', 'lot'] },
          { id: 'walk', label: 'Walk Away', aliases: ['walk', 'no', 'leave it'], tone: 'danger', detail: 'Ends this conversation. They’ll remember it.' },
        ];
        return {
          title: carName(listing),
          eyebrow: `${place.name} · ${seller?.displayName ?? 'the floor'}`,
          text: `${lastSaid(deal)}${str(session, 'impression') ? ` ${str(session, 'impression')}` : ''}`,
          choices,
          facts: carFacts(deal, listing),
          canSkip: true,
        };
      }
      case 'numbers': {
        const deal = dealOfSession(sim, session);
        const listing = listingOfDeal(sim, deal);
        const choices: SceneChoice[] = [];
        if (deal.status === 'agreed') {
          choices.push({ id: 'paperwork', label: 'Review The Paperwork', aliases: ['paperwork', 'sign', 'pay'], tone: 'primary' });
        } else {
          const left = roundsLeft(deal);
          for (const step of OFFER_STEPS) {
            const price = Math.round(deal.currentAsk * (1 - step) / 100) * 100;
            choices.push({ id: `offer:${price}`, label: `Offer ${formatMoney(price)}`, aliases: [`${Math.round(step * 100)} percent`, `${Math.round(step * 100)}% off`], detail: `${Math.round(step * 100)}% under their number`, disabled: left === 0 ? 'They have given you their final price.' : undefined });
          }
          choices.push({ id: 'accept', label: `Accept ${formatMoney(deal.currentAsk)}`, aliases: ['accept', 'yes', 'take it', 'deal'], tone: 'primary' });
          for (const text of deal.findings) {
            const repair = findingByText(text)?.repair;
            if (repair && !deal.terms.repairs.includes(repair)) choices.push({ id: `repair:${repair}`, label: `Ask Them To ${repair}`, aliases: [repair.toLowerCase()], detail: 'Comes off what they can do on the price.' });
          }
        }
        const words = WORDS[listingKind(listing)];
        if (tradeInCandidates(sim, listingKind(listing)).length > 0 && !deal.terms.tradeInVehicleId) choices.push({ id: 'tradein', label: words.tradeIn, aliases: ['trade', 'trade in', 'part exchange'] });
        if (deal.terms.tradeInVehicleId) choices.push({ id: 'notrade', label: 'Keep Yours Out Of It', aliases: ['no trade', 'keep it'] });
        choices.push(deal.terms.delivery === 'deliver'
          ? { id: 'collect', label: 'Collect It Yourself', aliases: ['collect', 'pick up'] }
          : { id: 'deliver', label: words.delivery, aliases: ['deliver', 'delivery', 'bring it', 'ferry'], detail: words.deliveryDetail });
        choices.push({ id: 'back', label: `Back To The ${words.noun.charAt(0).toUpperCase()}${words.noun.slice(1)}`, aliases: ['back', 'car', words.noun] });
        choices.push({ id: 'walk', label: 'Walk Away', aliases: ['walk', 'no', 'leave it'], tone: 'danger' });
        return {
          title: deal.status === 'agreed' ? `Agreed At ${formatMoney(deal.agreedPrice ?? deal.currentAsk)}` : 'The Numbers',
          eyebrow: carName(listing),
          text: lastSaid(deal),
          choices,
          facts: termsFacts(sim, deal),
          canSkip: true,
        };
      }
      case 'tradein': {
        const deal = dealOfSession(sim, session);
        const cars = tradeInCandidates(sim, listingKind(listingOfDeal(sim, deal)));
        const choices: SceneChoice[] = cars.map((v) => ({
          id: `trade:${v.id}`, label: `The ${vehicleName(v)}`, aliases: [vehicleName(v).toLowerCase(), v.model.toLowerCase()],
          detail: `${v.mileage.toLocaleString('en-US')} ${KIND_PROFILE[vehicleKind(v)].unit === 'miles' ? 'mi' : 'hrs'} · they’d allow about ${formatMoney(tradeInAllowance(sim, deal, v))}${v.loanAccountId ? ' · still on finance' : ''}`,
        }));
        choices.push({ id: 'back', label: 'Never Mind', aliases: ['back', 'no', 'cancel'] });
        return {
          title: 'What Would You Trade?',
          eyebrow: 'Part exchange',
          text: 'They’ll walk round it twice and give you a number. It comes off what you owe today, once anything still owed on it is cleared.',
          choices,
          canSkip: false,
        };
      }
      case 'agreed': {
        const deal = dealOfSession(sim, session);
        const listing = listingOfDeal(sim, deal);
        const price = deal.agreedPrice ?? deal.currentAsk;
        const cash = purchaseQuote(sim, price, 'cash', { tradeInCredit: netCredit(sim, deal) });
        const choices = payChoices(sim, deal, listingKind(listing));
        choices.push({ id: 'sleep', label: 'Sleep On It', aliases: ['sleep', 'later', 'think'], detail: `The deal holds until ${formatDate(deal.expiresAt, sim.zone)}.` });
        choices.push({ id: 'walk', label: 'Walk Away', aliases: ['walk', 'no'], tone: 'danger' });
        return {
          title: `Agreed At ${formatMoney(price)}`,
          eyebrow: carName(listing),
          text: `${lastSaid(deal)} The paperwork: price, tax, registration, the documentation fee${deal.terms.tradeInVehicleId ? ', less your trade-in' : ''}.`,
          choices,
          facts: [
            { label: 'Price', value: formatMoney(price) },
            { label: 'Tax And Fees', value: formatMoney(cash.salesTax + cash.registration + cash.docFee) },
            { label: 'Trade-In Credit', value: cash.tradeInCredit > 0 ? `− ${formatMoney(cash.tradeInCredit)}` : 'None' },
            { label: 'Cash Total', value: formatMoney(cash.cashDue) },
          ],
          canSkip: true,
        };
      }
      case 'signed': {
        const deal = dealOfSession(sim, session);
        const vehicle = deal.vehicleId ? sim.universe.vehicles[deal.vehicleId] : undefined;
        const premium = num(session, 'premium');
        const choices: SceneChoice[] = premium > 0
          ? [
            { id: 'insure', label: `Insure It — ${formatMoney(premium)} A Month`, aliases: ['insure', 'yes', 'take it'], tone: 'primary', detail: 'First month now; renews monthly.' },
            { id: 'noinsure', label: 'Not Now', aliases: ['no', 'not now', 'later'] },
          ]
          : [
            { id: 'quote', label: 'Get An Insurance Quote', aliases: ['quote', 'insurance', 'insure'], tone: 'primary', detail: 'Their broker is in the next office.' },
            { id: 'noinsure', label: 'Not Now', aliases: ['no', 'not now', 'later'] },
          ];
        return {
          title: 'Signed',
          eyebrow: vehicle ? vehicleName(vehicle) : carName(listingOfDeal(sim, deal)),
          text: `${formatMoney(num(session, 'paid'))} today.${num(session, 'monthly') > 0 ? ` ${formatMoney(num(session, 'monthly'))} a month after that.` : ''} ${premium > 0 ? `The broker has a number: ${formatMoney(premium)} a month.` : 'Before the keys: do you want it insured?'}`,
          choices,
          canSkip: true,
        };
      }
      case 'handover': {
        const deal = dealOfSession(sim, session);
        const vehicle = deal.vehicleId ? sim.universe.vehicles[deal.vehicleId] : undefined;
        const due = num(session, 'deliveryDueAt');
        return {
          title: due > 0 ? 'On Its Way' : 'The Keys',
          eyebrow: vehicle ? vehicleName(vehicle) : '',
          text: due > 0
            ? `${WORDS[listingKind(listingOfDeal(sim, deal))].brought} on ${formatDate(due, sim.zone)}${deal.terms.repairs.length > 0 ? `, with the work done first: ${deal.terms.repairs.map((r) => r.toLowerCase()).join(', ')}` : ''}. Until then it’s theirs to get ready.`
            : `The keys are in your hand.${deal.terms.repairs.length > 0 ? ` The work you asked for is done: ${deal.terms.repairs.map((r) => r.toLowerCase()).join(', ')}.` : ''} It’s yours.${vehicle?.keeping ? ` It goes to ${keepingLabel(sim, vehicle).toLowerCase()}${vehicle.keeping.monthly > 0 ? `, ${formatMoney(vehicle.keeping.monthly)} a month` : ''}.` : ''}${vehicle?.crewBillId ? ' The crew bill monthly from here.' : ''}`,
          choices: [{ id: 'done', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: vehicle ? [
            { label: 'Insured', value: vehicle.insurancePolicyId ? 'Yes' : 'No' },
            { label: 'Registered In', value: CITIES.get(vehicle.registeredIn)?.name ?? vehicle.registeredIn },
            { label: 'Service Due', value: `${vehicle.nextServiceDueMileage.toLocaleString('en-US')} ${KIND_PROFILE[vehicleKind(vehicle)].unit === 'miles' ? 'mi' : 'hrs'}` },
          ] : undefined,
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const place = lotOf(session);
    switch (session.node) {
      case 'arrive': {
        if (!choiceId.startsWith('go:')) throw unknownStep();
        const mode = choiceId.slice(3) as Mode;
        ctx.commit('go', { kind: 'go.to', payload: { placeId: place.id, mode } });
        session.placeId = place.id;
        const deal = str(session, 'dealId') ? sim.universe.vehicleDeals[str(session, 'dealId')] : undefined;
        ctx.go(deal ? (deal.status === 'agreed' ? 'agreed' : 'car') : 'lot');
        return;
      }
      case 'lot': {
        if (choiceId === 'out') { ctx.say('You walk back out.'); ctx.finish(); return; }
        if (!choiceId.startsWith('car:')) throw unknownStep();
        const listingId = choiceId.slice(4);
        const opened = ctx.commit<{ dealId: Id; salespersonId: Id }>(`open:${listingId}`, { kind: 'deal.open', payload: { placeId: place.id, listingId } });
        session.context['dealId'] = opened.dealId;
        session.context['listingId'] = listingId;
        session.context['salespersonId'] = opened.salespersonId;
        session.context['impression'] = '';
        session.refType = 'deal';
        session.refId = opened.dealId;
        if (!session.participantIds.includes(opened.salespersonId)) session.participantIds.push(opened.salespersonId);
        const deal = dealOf(sim, opened.dealId);
        ctx.go(deal.status === 'agreed' ? 'agreed' : 'car');
        return;
      }
      case 'car': {
        const deal = dealOfSession(sim, session);
        if (choiceId === 'inspect') {
          const { findings } = ctx.commit<{ findings: string[] }>('inspect', { kind: 'deal.inspect', payload: { dealId: deal.id } });
          ctx.say(findings.join(' '));
          return;
        }
        if (choiceId === 'drive') {
          const { impression } = ctx.commit<{ impression: string }>('drive', { kind: 'deal.test_drive', payload: { dealId: deal.id } });
          session.context['impression'] = impression;
          ctx.say(impression);
          return;
        }
        if (choiceId === 'numbers') { ctx.go(deal.status === 'agreed' ? 'agreed' : 'numbers'); return; }
        if (choiceId === 'another') { ctx.go('lot'); return; }
        if (choiceId === 'walk') { walkAway(ctx, deal); return; }
        throw unknownStep();
      }
      case 'numbers': {
        const deal = dealOfSession(sim, session);
        if (choiceId === 'paperwork') { ctx.go('agreed'); return; }
        if (choiceId === 'back') { ctx.go('car'); return; }
        if (choiceId === 'walk') { walkAway(ctx, deal); return; }
        if (choiceId === 'tradein') { ctx.go('tradein'); return; }
        if (choiceId === 'notrade') { ctx.commit(`terms:notrade:${deal.rounds}`, { kind: 'deal.set_terms', payload: { dealId: deal.id, tradeInVehicleId: null } }); return; }
        if (choiceId === 'deliver' || choiceId === 'collect') {
          ctx.commit(`terms:${choiceId}:${deal.rounds}`, { kind: 'deal.set_terms', payload: { dealId: deal.id, delivery: choiceId } });
          return;
        }
        if (choiceId.startsWith('repair:')) {
          const repairs = [...deal.terms.repairs, choiceId.slice(7)];
          ctx.commit(`terms:repairs:${repairs.length}`, { kind: 'deal.set_terms', payload: { dealId: deal.id, repairs } });
          return;
        }
        if (choiceId === 'accept' || choiceId.startsWith('offer:')) {
          const price = choiceId === 'accept' ? deal.currentAsk : Number(choiceId.slice(6));
          const result = ctx.commit<{ status: string; ask: Money; said: string }>(`offer:${deal.rounds}:${price}`, { kind: 'deal.offer', payload: { dealId: deal.id, price } });
          ctx.say(result.said, str(session, 'salespersonId') || undefined);
          if (result.status === 'accepted') ctx.go('agreed');
          return;
        }
        throw unknownStep();
      }
      case 'tradein': {
        const deal = dealOfSession(sim, session);
        if (choiceId === 'back') { ctx.go('numbers'); return; }
        if (!choiceId.startsWith('trade:')) throw unknownStep();
        const vehicleId = choiceId.slice(6);
        const { tradeInValue } = ctx.commit<{ tradeInValue?: Money }>(`terms:trade:${vehicleId}`, { kind: 'deal.set_terms', payload: { dealId: deal.id, tradeInVehicleId: vehicleId } });
        ctx.say(`They’ll allow ${formatMoney(tradeInValue ?? 0)} for it.`);
        ctx.go('numbers');
        return;
      }
      case 'agreed': {
        const deal = dealOfSession(sim, session);
        if (choiceId === 'sleep') { ctx.say(`You’ll come back. The deal holds until ${formatDate(deal.expiresAt, sim.zone)}.`); ctx.finish(); return; }
        if (choiceId === 'walk') { walkAway(ctx, deal); return; }
        if (!choiceId.startsWith('sign:')) throw unknownStep();
        const acquisition = choiceId.slice(5) as Vehicle['acquisition'];
        const signed = ctx.commit<{ vehicleId: Id; paid: Money; monthlyPayment?: Money; deliveryDueAt?: number }>('sign', {
          kind: 'deal.sign', payload: { dealId: deal.id, acquisition, termMonths: acquisition === 'leased' ? LEASE_MONTHS : acquisition === 'financed' ? FINANCE_MONTHS : undefined },
        });
        session.context['vehicleId'] = signed.vehicleId;
        session.context['paid'] = signed.paid;
        session.context['monthly'] = signed.monthlyPayment ?? 0;
        session.context['deliveryDueAt'] = signed.deliveryDueAt ?? 0;
        session.context['premium'] = 0;
        ctx.say(`Signed. ${formatMoney(signed.paid)} today.`);
        ctx.go('signed');
        return;
      }
      case 'signed': {
        const vehicleId = str(session, 'vehicleId');
        if (choiceId === 'quote') {
          const bought = sim.universe.vehicles[vehicleId];
          const line = bought ? KIND_PROFILE[vehicleKind(bought)].insuranceLine : 'auto';
          const quote = ctx.commit<{ premium: Money; quoteId: Id }>('quote', { kind: 'ins.quote', payload: { line, coveredRefs: [{ type: 'vehicle', id: vehicleId }] } });
          session.context['premium'] = quote.premium;
          session.context['quoteId'] = quote.quoteId;
          return;
        }
        if (choiceId === 'insure') {
          ctx.commit('insure', { kind: 'ins.purchase', payload: { quoteId: str(session, 'quoteId') } });
          ctx.say('Insured from today.');
          ctx.go('handover');
          return;
        }
        if (choiceId === 'noinsure') { ctx.go('handover'); return; }
        throw unknownStep();
      }
      case 'handover': {
        if (choiceId !== 'done') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const place = lotOf(session);
    if (session.node === 'arrive') {
      ctx.commit('go', { kind: 'go.to', payload: { placeId: place.id, mode: driveableVehicle(sim) ? 'drive' : 'taxi' } });
      session.placeId = place.id;
    }
    let dealId = str(session, 'dealId');
    if (!dealId) {
      const listingId = str(session, 'listingId');
      if (!listingId) throw new CommandError('Pick one first. The short version needs to know which.');
      const opened = ctx.commit<{ dealId: Id }>(`open:${listingId}`, { kind: 'deal.open', payload: { placeId: place.id, listingId } });
      dealId = opened.dealId;
      session.context['dealId'] = dealId;
    }
    let deal = dealOf(sim, dealId);
    if (deal.status === 'signed') { ctx.finish(); return; }
    if (deal.status === 'open') {
      if (!deal.inspected) ctx.commit('inspect', { kind: 'deal.inspect', payload: { dealId } });
      deal = dealOf(sim, dealId);
      const first = Math.round(deal.currentAsk * 0.94 / 100) * 100;
      const result = ctx.commit<{ status: string; ask: Money }>(`offer:${deal.rounds}:${first}`, { kind: 'deal.offer', payload: { dealId, price: first } });
      if (result.status !== 'accepted') ctx.commit(`accept:${result.ask}`, { kind: 'deal.offer', payload: { dealId, price: result.ask } });
    }
    deal = dealOf(sim, dealId);
    const signed = ctx.commit<{ vehicleId: Id; paid: Money }>('sign', { kind: 'deal.sign', payload: { dealId, acquisition: 'cash' } });
    ctx.say(`Bought the ${carName(listingOfDeal(sim, deal))} for ${formatMoney(deal.agreedPrice ?? deal.currentAsk)}. ${formatMoney(signed.paid)} today, collected.`);
    ctx.finish();
  },
});

function walkAway(ctx: SceneRuntime, deal: VehicleDeal): void {
  ctx.commit('walk', { kind: 'deal.walk_away', payload: { dealId: deal.id } });
  ctx.say('You thank them for their time and walk back to the road.');
  ctx.finish();
}
