/**
 * SLATE — a home, and a home for sale.
 *
 * The Homes screen printed every home owned as a card of figures and every
 * home for sale as a row, and none of them opened. Two kinds live here.
 *
 * A `home` is somewhere you live or own, addressed by the key the belongings
 * system already files things under (`homeKeyOf` in `systems/items.ts`): a
 * home owned is `owned:<id>`, a rented one its kind, town and the day it
 * began. That is what lets a T-shirt in the drawers open onto the room the
 * drawers are in, and the room open onto its town. A rented home is a home
 * too: it is where the first save lives, and leaving it out would have left
 * every belonging in a fresh life pointing at nothing.
 *
 * A `listing` is one of a town’s fifty homes for sale, as `listingsIn` draws
 * it this month. One sold or replaced since says so.
 *
 * Every figure is the homes system’s own: what it would fetch today, what is
 * owed on it from the ledger, what a month costs, and each part’s age against
 * its life. Nothing here is computed for the look alone.
 */

import { formatMoney, saveCurrency, type Money } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { FEATURE_LABEL, PART_LABEL, PROJECTS, conditionWord, typeLabel, type Part } from '@/engine/content/homes';
import { HOUSING, SOFA, billsOf, rentOf, type HomeState } from '@/engine/systems/household';
import {
  askingPrice, daysListed, downChoices, equityIn, homeValue, lifeOf, listingById, listingsIn, livingIn, minimumDown,
  offerFor, ownedMonth, owedOn, saleNet, sizeText, type Listing, type OwnedHome,
} from '@/engine/systems/homes';
import { SPOT_LABEL, homeKeyOf, itemsOf } from '@/engine/systems/items';
import { homePlace } from '@/engine/systems/dwelling';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at, type Subject } from './subject';
import { said, spokenList, toStart, nameable } from './words';

/**
 * The world’s word for a thing, as a look may print it.
 *
 * A name may not carry a run of four digits, an underscore or a slash, and an
 * American house number runs to four digits: 1428 Elm Street is a real kind of
 * address and fails the gate. So where the words fail it, the fallback is
 * the way a person says it — the house on Elm Street — and the full address
 * stays in the sentence below it, where the gate does not reach.
 */
export function asName(text: string, fallback: string): string {
  const ok = nameable;
  return ok(text) ? text : fallback;
}

/** A way, kept only where it opens onto something. A dead edge is never painted. */
export function waysThatOpen(sim: Simulation, ways: readonly (Way | undefined)[]): Way[] {
  return ways.filter((w): w is Way => Boolean(w && lookExists(sim, w.to)));
}

const countryOf = (cityId: string): string => CITIES.get(cityId)?.countryId ?? '';
const townOf = (cityId: string): string => CITIES.get(cityId)?.name ?? 'the town';
const zoneOf = (sim: Simulation, cityId: string) => CITIES.get(cityId)?.timeZone ?? sim.homeZone;

/** A street address as a name: itself where it can be, the house on its street where it can’t. */
function homeName(address: string, type: OwnedHome['facts']['type'], countryId: string): string {
  const street = address.replace(/^\d+\s+/, '').replace(/,.*$/, '');
  return asName(address, `The ${typeLabel(type, countryId)} On ${street}`);
}

/** A day as the day look keys it, in the calendar the game keeps. */
const dayOf = (sim: Simulation, instant: number): Subject => at('day', dateKey(instant, sim.homeZone));

// ---------------------------------------------------------------------------
// A home
// ---------------------------------------------------------------------------

type TheHome =
  | { kind: 'owned'; key: string; person: Person; owned: OwnedHome }
  | { kind: 'rented'; key: string; person: Person; home: HomeState };

defineLook<TheHome>('home', {
  gone: 'You don’t live there any more, and it isn’t yours. Whatever was left in it went with you or stayed behind.',
  resolve: (sim, id) => {
    const person = sim.player;
    if (id.startsWith('owned:')) {
      const owned = (person.homes ?? []).find((h) => h.id === id.slice('owned:'.length));
      return owned ? { kind: 'owned', key: id, person, owned } : undefined;
    }
    const key = homeKeyOf(person.home);
    if (!person.home || !key || key !== id) return undefined;
    return { kind: 'rented', key, person, home: person.home };
  },
  seeds: (sim) => {
    const keys = (sim.player.homes ?? []).map((h) => `owned:${h.id}`);
    const living = homeKeyOf(sim.player.home);
    return [...new Set([...(living ? [living] : []), ...keys])];
  },
  look: (home, { sim }) => (home.kind === 'owned' ? ownedLook(sim, home.key, home.person, home.owned) : rentedLook(sim, home.key, home.person, home.home)),
});

/** The furniture standing in a home: a bed, a sofa, a suitcase in storage. */
function thingsIn(person: Person, key: string) {
  return itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === key && !i.garment);
}

/** What is kept in a home, said. */
function keptSentence(person: Person, key: string): string {
  const all = itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === key);
  if (all.length === 0) return 'You keep none of your things here.';
  const clothes = all.filter((i) => i.garment).length;
  const rest = all.length - clothes;
  const parts = [clothes ? said(clothes, 'garment') : '', rest ? said(rest, 'other thing', 'other things') : ''].filter(Boolean);
  return `${toStart(spokenList(parts))} of yours ${all.length === 1 ? 'is' : 'are'} kept here.`;
}

function rentedLook(sim: Simulation, key: string, person: Person, home: HomeState) {
  const cur = saveCurrency(sim.universe);
  const money = (c: Money) => formatMoney(c, cur, { cents: false });
  const town = townOf(home.cityId);
  const country = countryOf(home.cityId);
  const place = homePlace(sim, person);
  const sofa = home.kind === 'sofa';
  const rent = rentOf(sim, person);
  const bills = billsOf(sim, person);
  const what = sofa ? 'A Friend’s Sofa' : home.kind === 'shared' ? 'Your Room' : `Your ${place ? typeLabel(place.type, country, true) : 'Place'}`;
  const name = sofa ? `A Friend’s Sofa In ${town}` : `${what} In ${town}`;
  const since = formatDate(home.since, zoneOf(sim, home.cityId));
  const things = thingsIn(person, key);
  const ways = waysThatOpen(sim, [
    { to: at('place', home.cityId), label: town, detail: 'The town it’s in: its people, its climate, its rents and its taxes' },
    person.primaryAccountId && !sofa ? { to: at('account', person.primaryAccountId), label: 'Where The Rent Comes From', detail: `The account the rent and the bills are paid out of on the first, ${money(rent + bills)} a month between them` } : undefined,
    { to: dayOf(sim, home.since), label: 'The Day You Moved In', detail: `${since}, and what else that day held` },
    ...things.map((i) => ({ to: at('item', i.id), label: i.label, detail: `Kept here, ${i.at.kind === 'home' && i.at.spot && i.at.spot !== 'floor' ? `in ${SPOT_LABEL[i.at.spot].toLowerCase()}` : 'in the rooms'}, and what became of it since it came` })),
  ]);
  return {
    name,
    kind: sofa ? 'Where You Sleep For Now' : 'A Home You Rent',
    parent: at('person', person.id),
    summary: sofa
      ? `You’re sleeping on a friend’s sofa in ${town}, which costs no rent and sleeps badly.`
      : `You rent ${home.kind === 'shared' ? 'a room in a shared place' : 'a place of your own'} in ${town} for ${money(rent)} a month, with ${money(bills)} of bills on top.`,
    body: (
      <>
        <p className="small">
          {sofa
            ? SOFA.note
            : `${HOUSING[home.kind === 'shared' ? 'shared' : 'own'].note} ${place ? `It’s a ${typeLabel(place.type, country, true).toLowerCase()} of ${sizeText(place.size, country)}${place.shared ? ', shared with others' : ''}.` : ''}`}{' '}
          You’ve lived here since {since}. {keptSentence(person, key)}
        </p>
        {!sofa && (
          <div className="grid grid-3">
            <Stat label="Rent" value={<span className="mono">{money(rent)}</span>} note="A month, due on the first" />
            <Stat label="Bills" value={<span className="mono">{money(bills)}</span>} note="A month, with the rent" />
            <Stat label="Size" value={place ? sizeText(place.size, country) : '—'} note={place?.shared ? 'The whole place, shared' : 'Yours alone'} />
          </div>
        )}
      </>
    ),
    ways,
    provenance: 'The rent is the town’s, from published figures where there are some and SLATE’s estimate where there aren’t.',
  };
}

function ownedLook(sim: Simulation, key: string, person: Person, owned: OwnedHome) {
  const cur = saveCurrency(sim.universe);
  const money = (c: Money) => formatMoney(c, cur, { cents: false });
  const country = countryOf(owned.cityId);
  const town = townOf(owned.cityId);
  const zone = zoneOf(sim, owned.cityId);
  const value = homeValue(sim, owned);
  const mortgage = owedOn(sim, owned.mortgage);
  const equityLoan = owedOn(sim, owned.equity);
  const yours = equityIn(sim, owned);
  const month = ownedMonth(sim, owned);
  const lives = livingIn(person)?.id === owned.id;
  const let_ = owned.tenancies.find((t) => t.unit === 'main' && t.status === 'let');
  const advertised = owned.tenancies.find((t) => t.unit === 'main' && t.status === 'advertised');
  const use = lives ? 'you live in it' : let_ ? `it’s let at ${money(let_.rent)} a month` : advertised ? `it’s advertised to let at ${money(advertised.rent)} a month` : 'it stands empty';
  const year = new Date(sim.now).getUTCFullYear();

  // The part nearest the end of its life, which is the one that fails first.
  const parts = (Object.entries(owned.facts.parts) as [Part, number][])
    .map(([part, put]) => ({ part, age: Math.max(0, year - put), life: lifeOf(owned.facts, part) }))
    .sort((a, b) => b.age / b.life - a.age / a.life);
  const worst = parts[0];
  const worn = parts.filter((p) => conditionWord(p.age, p.life) === 'Worn Out').map((p) => PART_LABEL[p.part].toLowerCase());

  const works = owned.works.map((w) => `${PROJECTS.find((p) => p.id === w.projectId)?.label.toLowerCase() ?? 'a job'}, done ${formatDate(w.doneAt, zone)}`);
  const lawn = owned.lawn;
  const behind = owned.owed.reduce((sum, one) => sum + one.amount + (one.escrow ? one.escrow.tax + one.escrow.insurance + one.escrow.pmi : 0), 0);

  const things = thingsIn(person, key);
  const ways = waysThatOpen(sim, [
    owned.mortgage && mortgage > 0 ? { to: at('account', owned.mortgage.accountId), label: 'The Mortgage', detail: `${money(mortgage)} still owed on it, and its rate` } : undefined,
    owned.equity && equityLoan > 0 ? { to: at('account', owned.equity.accountId), label: 'The Home Equity Loan', detail: `${money(equityLoan)} borrowed against it` } : undefined,
    { to: at('place', owned.cityId), label: town, detail: 'The town it stands in, and what homes there are worth' },
    { to: dayOf(sim, owned.boughtAt), label: 'The Day You Bought It', detail: `${formatDate(owned.boughtAt, sim.homeZone)}, for ${money(owned.price)}` },
    ...owned.works.map((w) => ({ to: dayOf(sim, w.doneAt), label: PROJECTS.find((p) => p.id === w.projectId)?.label ?? 'The Work', detail: `Under way, and due to be done on ${formatDate(w.doneAt, sim.homeZone)}` })),
    ...things.map((i) => ({ to: at('item', i.id), label: i.label, detail: 'Kept here, and what became of it since it came' })),
  ]);

  return {
    name: homeName(owned.facts.address, owned.facts.type, country),
    kind: lives ? 'The Home You Own' : 'A Home Of Yours',
    parent: at('person', person.id),
    summary: `${owned.facts.address} is worth ${money(value)} today and ${use}; ${mortgage + equityLoan > 0 ? `${money(mortgage + equityLoan)} is owed against it` : 'nothing is owed against it'}.`,
    body: (
      <>
        <p className="small">
          A {typeLabel(owned.facts.type, country).toLowerCase()} in {town}: {said(owned.facts.beds, 'bedroom')}, {sizeText(owned.facts.size, country)}, built in {owned.facts.built}
          {owned.facts.features.length ? `, with ${spokenList(owned.facts.features.slice(0, 4).map((f) => FEATURE_LABEL[f].toLowerCase()))}` : ''}.
          You bought it {formatDate(owned.boughtAt, zone)} for {money(owned.price)}, and it costs {money(month.total)} a month to keep.
          Sold today, it would leave you {money(saleNet(sim, owned))}.
        </p>
        <p className="small">
          {worst ? `The ${PART_LABEL[worst.part].toLowerCase()} is the oldest part for its life, ${said(worst.age, 'year')} old against about ${worst.life}.` : ''}
          {worn.length ? ` ${toStart(spokenList(worn))} ${worn.length === 1 ? 'is' : 'are'} worn out, and a worn part is likelier to fail.` : ' Every part of it still has life in it.'}
          {works.length ? ` Work under way: ${spokenList(works)}.` : ''}
          {lawn ? ` The lawn stands at ${Math.round(lawn.cm)} cm${lawn.gardener ? ', and a gardener keeps it' : ''}${lawn.noticeAt ? ', and the city has served a notice to cut it' : ''}.` : ''}
          {behind > 0 ? ` ${money(behind)} of its payments is behind.` : ''}
        </p>
        <div className="grid grid-3">
          <Stat label="Worth" value={<span className="mono">{money(value)}</span>} note="At today’s market, with the work" />
          <Stat label="Owed On It" value={<span className="mono">{money(mortgage + equityLoan)}</span>} tone={mortgage + equityLoan > 0 ? 'negative' : undefined} note={owned.mortgage ? `At ${(owned.mortgage.rate * 100).toFixed(2)}%` : 'Bought outright'} />
          <Stat label="Yours Of It" value={<span className="mono">{money(yours)}</span>} tone={yours < 0 ? 'negative' : 'positive'} note="Its worth, less the loans" />
        </div>
      </>
    ),
    ways,
    provenance: 'What it’s worth moves with the town’s home values; what a part lasts and what fails are SLATE’s estimates.',
  };
}

// ---------------------------------------------------------------------------
// A home for sale
// ---------------------------------------------------------------------------

defineLook<Listing>('listing', {
  gone: 'That home is off the market now: sold, or taken down, and another has come on in its place.',
  resolve: (sim, id) => listingById(sim, id),
  seeds: (sim) => {
    const town = sim.player.home?.cityId ?? sim.player.currentLocationId;
    return CITIES.get(town) ? listingsIn(sim, town).slice(0, 2).map((l) => l.id) : [];
  },
  look: (listing, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: Money) => formatMoney(c, cur, { cents: false });
    const country = countryOf(listing.cityId);
    const town = townOf(listing.cityId);
    const asking = askingPrice(sim, listing);
    const days = daysListed(sim, listing);
    const count = listingsIn(sim, listing.cityId).length;
    const down = downChoices(country, true, minimumDown(sim, country, asking, true))[0] ?? 1;
    const offer = offerFor(sim, sim.player, listing, down, asking, true);
    const listed = days === 0 ? 'came on the market today' : `has been on the market ${said(days, 'day')}`;
    const ways = waysThatOpen(sim, [
      { to: at('place', listing.cityId), label: town, detail: 'The town it’s for sale in, and what homes there are worth' },
      { to: dayOf(sim, listing.listedAt), label: 'The Day It Came On', detail: `${formatDate(listing.listedAt, sim.homeZone)}, and what else that day held` },
    ]);
    return {
      name: homeName(listing.address, listing.type, country),
      kind: 'A Home For Sale',
      parent: at('place', listing.cityId),
      summary: `${listing.address} is asking ${money(asking)}, and it ${listed}.`,
      body: (
        <>
          <p className="small">
            A {typeLabel(listing.type, country).toLowerCase()} in {town}: {said(listing.beds, 'bedroom')}, {sizeText(listing.size, country)}, built in {listing.built}.
            It’s the {listing.rank === 1 ? 'cheapest' : `${ordinal(listing.rank)} cheapest`} of the {count} for sale here.{' '}
            {down >= 1
              ? `Bought outright to live in, it would cost ${money(offer.cash)} at closing and ${money(offer.month.total)} a month to keep.`
              : `With the least down a lender takes, ${Math.round(down * 100)}%, it would cost ${money(offer.cash)} by the closing and about ${money(offer.month.total)} a month.`}
            {days > 60 ? ' It has sat long enough that the seller has cut the price.' : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Asking" value={<span className="mono">{money(asking)}</span>} note={days > 60 ? 'Cut since it was listed' : 'As listed'} />
            <Stat label="A Month" value={<span className="mono">{money(offer.month.total)}</span>} note="Loan, tax and insurance" />
            <Stat label="On The Market" value={days === 1 ? '1 Day' : `${days} Days`} note={`Since ${formatDate(listing.listedAt, zoneOf(sim, listing.cityId))}`} />
          </div>
        </>
      ),
      ways,
      provenance: 'None is a real listing: the homes are the game’s own, priced at the town’s market.',
    };
  },
});

/** "second", "third", "12th". */
function ordinal(n: number): string {
  const words = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  if (n < words.length) return words[n]!;
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${tail}`;
}
