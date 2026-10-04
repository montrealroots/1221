/**
 * SLATE — a thing you own, and a garment.
 *
 * Belongings and Clothes printed every possession as a row: a label, a count,
 * a percentage, and nothing behind any of it. Two kinds live here, split the
 * way the engine splits them (`systems/items.ts`): an `item` is a possession
 * that isn’t clothing — a suitcase, a bed, a bottle of shampoo, a loaf in the
 * cupboard — and a `garment` is an item with a garment on it
 * (`systems/wardrobe.ts`), which has wears and washes, a fit and a resale.
 * One thing is never both, so a T-shirt is not two looks of itself.
 *
 * Where a thing is decides most of what can be said about it, so the way up is
 * where it is: the home it’s kept in (`home`, in ./homes), or the bag it’s in.
 * What a garment would fetch is `resaleOf`, the market’s own way of selling
 * where you live; where it wouldn’t sell, the look says why, in the words the
 * sale itself would refuse with.
 *
 * A watch or a piece of jewelry is worn in the accessory’s place, but until
 * 2026-10-03 its page was a garment’s: washed by hand, never washed, and
 * sold as a bag of clothes, with nothing of what a watch has. It has its own
 * now: whether it runs, its battery or its maker’s service and their price
 * where you are, where it’s kept and whether a safe holds it, its insurance,
 * what a pawnbroker here would lend on it, its engraving, and what it cost.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { careFor } from '@/engine/content/garmentcare';
import { SPOT_LABEL, itemsOf, reachable, usedL, whereWords, type Item } from '@/engine/systems/items';
import type { Garment } from '@/engine/systems/wardrobe';
import { fitOf } from '@/engine/systems/tailoring';
import { resaleOf, sellRefusal } from '@/engine/systems/resale';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at, type Subject } from './subject';
import { said } from './words';
import { asName, waysThatOpen } from './homes';
import { isValuable, lockedAway, scheduleRefusal, scheduledPremium } from '@/engine/systems/valuables';
import { batteryOptions, batteryRunsOut, makerServiceOf, serviceDue, servicePrice, stopped } from '@/engine/systems/watches';
import { pawnTermsIn, pledgeQuote, pledgeRefusal } from '@/engine/systems/pawn';

type Worn = Item & { garment: Garment };

const itemOf = (sim: Simulation, id: string): Item | undefined => itemsOf(sim.player).find((i) => i.id === id);

/** The subject a possession opens as: a garment as clothes, anything else as a thing. */
const subjectOf = (i: Item): Subject => (i.garment ? at('garment', i.id) : at('item', i.id));

/** Where a thing is, as the start of a sentence: "It’s at home, in the drawers". */
function whereSentence(sim: Simulation, person: Person, i: Item): string {
  // The engine’s words put the spot after a comma, "at home, the drawers"; a sentence wants the "in".
  const words = i.at.kind === 'home' && whereWords(person, i.at).startsWith('at home')
    ? `at home, ${i.at.spot && i.at.spot !== 'floor' ? `in ${SPOT_LABEL[i.at.spot].toLowerCase()}` : 'in the rooms'}`
    : whereWords(person, i.at);
  const toHand = reachable(sim, person, i.at);
  return `It’s ${words}, and ${toHand ? 'it’s to hand' : 'it isn’t to hand from where you are'}`;
}

/** Up from a thing: the home it’s kept in, the bag it’s in, or you. */
function parentOf(sim: Simulation, person: Person, i: Item): Subject {
  if (i.at.kind === 'home') return at('home', i.at.home);
  if (i.at.kind === 'vehicle') return at('vehicle', i.at.vehicleId);
  if (i.at.kind === 'inside') {
    const holder = itemOf(sim, i.at.itemId);
    if (holder) return subjectOf(holder);
  }
  return at('person', person.id);
}

/** The ways out of any possession: where it is, what it holds, and the day it came. */
function waysOf(sim: Simulation, person: Person, i: Item): Way[] {
  const holder = i.at.kind === 'inside' ? itemOf(sim, i.at.itemId) : undefined;
  const held = itemsOf(person).filter((x) => x.at.kind === 'inside' && x.at.itemId === i.id);
  return waysThatOpen(sim, [
    i.at.kind === 'home' ? { to: at('home', i.at.home), label: 'Where It’s Kept', detail: 'The home it’s kept in, and what living there costs' } : undefined,
    holder ? { to: subjectOf(holder), label: holder.label, detail: 'What it’s packed in, and where that is' } : undefined,
    i.at.kind === 'vehicle' ? { to: at('vehicle', i.at.vehicleId), label: 'The Vehicle It’s In', detail: 'Where the vehicle is, and what it costs to keep' } : undefined,
    ...held.slice(0, 12).map((x) => ({ to: subjectOf(x), label: x.label, detail: 'Packed inside it, and the state it’s in' })),
    { to: at('day', dateKey(i.acquiredAt, sim.homeZone)), label: 'The Day It Became Yours', detail: `${formatDate(i.acquiredAt, sim.homeZone)}, and what else that day held` },
  ]);
}

const percent = (condition: number): string => `${Math.round(condition * 100)}%`;

// ---------------------------------------------------------------------------
// A thing
// ---------------------------------------------------------------------------

defineLook<Item>('item', {
  gone: 'It isn’t yours any more: used up, sold, thrown out or lost along the way.',
  resolve: (sim, id) => {
    const i = itemOf(sim, id);
    return i && !i.garment ? i : undefined;
  },
  seeds: (sim) => itemsOf(sim.player).filter((i) => !i.garment).slice(0, 6).map((i) => i.id),
  look: (i, { sim }) => {
    const person = sim.player;
    const cur = saveCurrency(sim.universe);
    const kind = i.bulky ? 'Furniture' : i.holdsL ? 'Something To Carry Things In' : i.food ? 'Food' : i.supply ? 'A Toiletry' : 'Something You Own';
    const used = i.holdsL ? usedL(person, i.id) : 0;
    const left = i.supply ? `${Math.round(i.supply.left)}${i.supply.unit === 'ct' ? '' : ` ${i.supply.unit}`} left` : i.food ? `${Math.round(i.food.left * 10) / 10} ${i.food.unit} left` : undefined;
    return {
      name: asName(i.label, kind === 'Something You Own' ? 'A Thing Of Yours' : 'This One'),
      kind,
      parent: parentOf(sim, person, i),
      summary: `${whereSentence(sim, person, i)}.`,
      body: (
        <>
          <p className="small">
            You’ve had it since {formatDate(i.acquiredAt, sim.homeZone)}
            {i.paid !== undefined ? `, and it cost ${formatMoney(i.paid, cur)}` : ', and what it cost isn’t known: it came with you'}.{' '}
            {i.holdsL ? `It holds ${i.holdsL} liters, and ${Math.round(used)} of them are taken. ` : ''}
            {left ? `There’s ${left}. ` : ''}
            {i.food?.expiresAt !== undefined ? `It goes off ${formatDate(i.food.expiresAt, sim.homeZone)}. ` : ''}
            {i.bulky ? 'It’s moved by movers or a delivery, never by hand.' : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Condition" value={percent(i.condition)} note={i.condition >= 1 ? 'As new' : 'Worn with use'} tone={i.condition < 0.25 ? 'warning' : undefined} />
            <Stat label="How Many" value={String(i.quantity)} note={i.quantity > 1 ? 'Of the same' : 'Just the one'} />
            <Stat label="Paid" value={i.paid !== undefined ? <span className="mono">{formatMoney(i.paid, cur)}</span> : 'Not Known'} note={i.paid !== undefined ? 'When it was bought' : 'It came with you'} />
          </div>
        </>
      ),
      ways: waysOf(sim, person, i),
    };
  },
});

// ---------------------------------------------------------------------------
// A garment
// ---------------------------------------------------------------------------

/** A watch or a piece of jewelry: whether it runs and what keeps it running, where it’s kept and how it’s covered, and what it would raise. */
function valuableLook(sim: Simulation, person: Person, g: Worn) {
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const watch = /watch|reloj/i.test(g.label);
  const runsOut = batteryRunsOut(g);
  const due = serviceDue(g);
  const maker = makerServiceOf(g);
  const halted = stopped(g, sim.now);
  const change = runsOut !== undefined ? batteryOptions(sim, person, g)[0] : undefined;
  const service = maker ? servicePrice(sim, person, g) : undefined;
  const movement = !watch ? undefined
    : runsOut !== undefined ? (halted ? `Its battery ran down ${formatDate(runsOut, sim.homeZone)}, and it’s stopped until it’s changed${change ? `, ${money(change.price)} at ${change.service.name}` : ', which no one where you are publishes a price for'}.`
      : `It’s quartz, its battery good until about ${formatDate(runsOut, sim.homeZone)}${change ? `; a change is ${money(change.price)} at ${change.service.name}` : ''}.`)
    : due !== undefined ? (halted ? `It’s past ${maker!.brand}’s service, due ${formatDate(due, sim.homeZone)}, and stopped until it’s serviced${service !== undefined ? `, ${money(service)} and three weeks away` : ''}.`
      : `It’s mechanical; ${maker!.brand} asks for its service every ${maker!.years} years, next by ${formatDate(due, sim.homeZone)}${service !== undefined ? `, at ${money(service)}` : ''}.`)
    : 'Its maker publishes no battery life or service interval, so it isn’t counted as running down.';
  const safe = lockedAway(person, g);
  const noSchedule = g.scheduled ? undefined : scheduleRefusal(sim, person, g);
  const cover = g.scheduled ? `It’s scheduled on your policy, ${money(scheduledPremium(g))} a month, and paid in full if it’s taken.` : noSchedule ? `It isn’t insured: ${noSchedule.charAt(0).toLowerCase()}${noSchedule.slice(1)}` : `It’s covered only to your policy’s jewelry limit; scheduled, it would be ${money(scheduledPremium(g))} a month.`;
  const broker = pawnTermsIn(person.currentLocationId);
  const noPawn = broker ? pledgeRefusal(sim, person, [g.id]) : undefined;
  const loan = broker && !noPawn ? pledgeQuote(sim, person, [g.id]).loan : undefined;
  return {
    name: asName(g.label, watch ? 'A Watch' : 'A Piece Of Jewelry'),
    kind: watch ? 'A Watch Of Yours' : 'A Piece Of Jewelry',
    parent: parentOf(sim, person, g),
    summary: `${whereSentence(sim, person, g)}${safe ? ', locked in a safe' : ''}${watch ? (halted ? ', and it’s stopped' : ', and it’s running') : ''}.`,
    body: (
      <>
        <p className="small">
          {movement ? `${movement} ` : ''}
          {g.engraved ? `It’s engraved “${g.engraved}”. ` : ''}
          {cover}{' '}
          {safe ? 'A burglary can’t take it from the safe.' : 'Left out at home, a burglary would take it.'}{' '}
          {g.paid !== undefined ? `It cost ${money(g.paid)}.` : 'What it cost isn’t known.'}
        </p>
        <div className="grid grid-3">
          <Stat label={watch ? 'Running' : 'Condition'} value={watch ? (halted ? 'Stopped' : 'Yes') : percent(g.condition)} note={watch ? (runsOut !== undefined ? 'On its battery' : due !== undefined ? 'On its service' : 'Not counted') : 'As it is'} tone={halted ? 'warning' : undefined} />
          <Stat label="Covered" value={g.scheduled ? 'Scheduled' : noSchedule ? 'Not Covered' : 'To The Limit'} note={g.scheduled ? `${money(scheduledPremium(g))} a month` : noSchedule ? 'No policy on what’s in your home' : 'Your policy’s jewelry limit'} tone={!g.scheduled && noSchedule ? 'warning' : undefined} />
          <Stat label="A Pawnbroker Lends" value={loan !== undefined ? <span className="mono">{money(loan)}</span> : 'Not Here'} note={loan !== undefined ? broker!.lender : noPawn ?? 'No terms kept where you are'} />
        </div>
      </>
    ),
    ways: [...(g.spec?.purchase ? waysThatOpen(sim, [{ to: at('receipt', String(g.spec.purchase)), label: 'Its Receipt', detail: 'What it cost, what paid, and until when it goes back' }]) : []), ...waysOf(sim, person, g)],
  };
}

/** What state it’s in to wear, in one clause. */
function stateOf(sim: Simulation, g: Worn): string {
  if (g.condition <= 0) return 'it’s worn out';
  if (g.garment.dirty) return g.garment.care === 'dry-clean' ? 'it’s waiting for the dry cleaner' : 'it’s waiting for the wash';
  if (g.garment.dryUntil !== undefined && g.garment.dryUntil > sim.now) return 'it’s drying';
  return 'it’s clean';
}

const CARE_WORDS: Readonly<Record<Garment['care'], string>> = { wash: 'goes in the machine', hand: 'is washed by hand', 'dry-clean': 'goes to the dry cleaner' };

defineLook<Worn>('garment', {
  gone: 'You don’t have it any more: sold, given up, or worn through and thrown out.',
  resolve: (sim, id) => {
    const i = itemOf(sim, id);
    return i?.garment ? (i as Worn) : undefined;
  },
  seeds: (sim) => itemsOf(sim.player).filter((i) => i.garment).slice(0, 4).map((i) => i.id),
  look: (g, { sim }) => {
    const person = sim.player;
    const cur = saveCurrency(sim.universe);
    if (isValuable(g)) return valuableLook(sim, person, g);
    const rule = careFor(g.garment.kind);
    const fit = fitOf(person, g.garment);
    const fitWords = fit === 'fits' ? 'it fits you as you are now' : fit === 'big' ? 'it’s too big for you now, and isn’t worn until it’s taken in' : 'you’ve grown out of it, and it isn’t worn';
    const refusal = sellRefusal(sim, person, g);
    const resale = refusal ? undefined : resaleOf(sim, person, [g]);
    const between = Number.isFinite(rule.wearsBetween) ? (rule.wearsBetween === 1 ? 'after every wear' : `about every ${Math.round(rule.wearsBetween * 10) / 10} wears`) : undefined;
    const spec = [g.spec?.size ? `size ${g.spec.size}` : '', g.spec?.color ? g.spec.color.toLowerCase() : ''].filter(Boolean).join(', ');
    return {
      name: asName(g.label, 'Something To Wear'),
      kind: 'Something You Wear',
      parent: parentOf(sim, person, g),
      summary: `${whereSentence(sim, person, g)}; ${stateOf(sim, g)}, and ${fitWords}.`,
      body: (
        <>
          <p className="small">
            {spec ? `It’s ${spec}. ` : ''}
            It {CARE_WORDS[g.garment.care]}{between ? `, ${between}` : ''}
            {rule.lifetimeWashes !== null ? `, and lasts about ${Math.round(rule.lifetimeWashes)} washes` : ', and is never washed'}.{' '}
            {g.garment.wears === 0 ? 'It hasn’t been worn since it was last cleaned' : `It’s been worn ${said(g.garment.wears, 'time')} since it was last cleaned`}
            {g.garment.washes === 0 ? ', and it’s never been washed. ' : `, and washed ${said(g.garment.washes, 'time')} in all. `}
            {g.paid !== undefined ? `It cost ${formatMoney(g.paid, cur)} new.` : 'It came with you, so what it cost isn’t known.'}{' '}
            {resale ? `Sold today it would bring ${formatMoney(resale.paid, cur)}: ${resale.basis.charAt(0).toLowerCase()}${resale.basis.slice(1)}.` : refusal}
          </p>
          <div className="grid grid-3">
            <Stat label="Condition" value={percent(g.condition)} note={g.condition <= 0 ? 'Worn out' : g.condition >= 1 ? 'As new' : 'Worn with use'} tone={g.condition < 0.25 ? 'warning' : undefined} />
            <Stat label="Washes" value={String(g.garment.washes)} note={rule.lifetimeWashes !== null ? `Of about ${Math.round(rule.lifetimeWashes)}` : 'Never washed'} />
            <Stat label="Would Sell For" value={resale ? <span className="mono">{formatMoney(resale.paid, cur)}</span> : 'Not Sold'} note={resale ? 'The way clothes sell where you live' : 'It won’t sell as it is'} />
          </div>
        </>
      ),
      ways: [...(g.spec?.purchase ? waysThatOpen(sim, [{ to: at('receipt', String(g.spec.purchase)), label: 'Its Receipt', detail: 'What it cost, what paid, and until when it goes back' }]) : []), ...waysOf(sim, person, g)],
      provenance: `How often it’s washed and how long it lasts: ${rule.source}.`,
    };
  },
});
