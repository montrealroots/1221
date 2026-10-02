/**
 * SLATE — a restaurant, one of the real ones in `content/restaurants.ts`.
 *
 * What it opens into is its own menu: the dishes priced as the town taxes a
 * meal (`mealTaxRate`), in the save’s money, the cheapest, the middle and the
 * dearest, which is the plainest way to say how dear a place is without
 * inventing a band for it. Its hours are not kept, so nothing here says when
 * it is open. A dish whose price was not found is counted and left out of the
 * figures, never taken as nothing.
 *
 * The floor is the town it is in.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { RESTAURANTS, type Restaurant } from '@/engine/content/restaurants';
import { inSaveMoney } from '@/engine/systems/banking';
import { mealTaxRate, restaurantById, restaurantsIn } from '@/engine/systems/dining';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';
import { spokenList, nameable } from './words';

const TIER_WORD: Readonly<Record<Restaurant['tier'], string>> = {
  fast: 'Counter Service',
  casual: 'Casual Dining',
  mid: 'Mid-Range Dining',
  upscale: 'Fine Dining',
};

/** A name as the house writes it: the typographic apostrophe, which the menus as read don’t use. */
const curly = (text: string): string => text.replace(/(\w)'(\w)/g, '$1’$2');



/** Its dishes at their menu price with the meal’s tax, in the save’s money, cheapest first. */
function priced(sim: Simulation, r: Restaurant): { item: string; price: number }[] {
  const tax = mealTaxRate(r.cityId, sim.now, r);
  return r.menu
    .filter((m) => m.price !== null)
    .map((m) => ({ item: curly(m.item), price: inSaveMoney(sim, Math.round(m.price! * (1 + tax) * 100), r.currency) }))
    .sort((a, b) => a.price - b.price);
}

defineLook<Restaurant>('restaurant', {
  gone: 'There’s no restaurant by that name in any town SLATE keeps.',
  resolve: (_sim, id) => restaurantById(id),
  seeds: (sim) => {
    const person = sim.universe.people[sim.universe.playerId];
    const towns = person ? [person.currentLocationId, person.home?.cityId ?? ''] : [];
    const ids = [...new Set(towns.flatMap((t) => restaurantsIn(t).map((r) => r.id)))];
    return ids.length ? ids : RESTAURANTS.slice(0, 1).map((r) => r.id);
  },
  look: (r, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur);
    const town = CITIES.get(r.cityId)?.name ?? 'a town SLATE keeps';
    const dishes = priced(sim, r);
    const unpriced = r.menu.length - dishes.length;
    const low = dishes[0];
    const high = dishes[dishes.length - 1];
    const middle = dishes[Math.floor((dishes.length - 1) / 2)];
    const here = sim.universe.people[sim.universe.playerId]?.currentLocationId === r.cityId;
    const ways: Way[] = [];
    if (lookExists(sim, at('place', r.cityId))) {
      ways.push({ to: at('place', r.cityId), label: town, detail: 'The town it’s in, and what living there costs' });
    }
    const how = [r.takeout ? 'takes orders away' : '', r.delivery ? 'delivers' : ''].filter(Boolean);
    const kind = TIER_WORD[r.tier];

    return {
      name: nameable(r.name) && !r.name.toLowerCase().includes(kind.toLowerCase()) ? curly(r.name) : `A Restaurant In ${town}`,
      kind,
      parent: lookExists(sim, at('place', r.cityId)) ? at('place', r.cityId) : undefined,
      summary: low && high && middle
        ? `You’d pay from ${money(low.price)} to ${money(high.price)} a dish here, tax in and before a tip, and the middle of the menu is ${money(middle.price)}.`
        : 'You can’t price a meal here yet: none of its dishes had a price where it was read.',
      body: (
        <>
          <p className="small">
            {r.neighborhood ? `It’s in ${town}’s ${r.neighborhood}` : `It’s in ${town}`}
            {r.address ? `, at ${r.address}` : ''}{r.cuisine ? `, and it’s listed as ${r.cuisine}` : ''}.{' '}
            {how.length ? `It ${spokenList(how)}, and you can sit at a table.` : 'It’s a table or nothing: it neither takes orders away nor delivers.'}{' '}
            {here ? 'It’s in the town you’re in.' : 'It isn’t in the town you’re in, so a meal there waits until you are.'}
          </p>
          <p className="small">
            {low && high ? `${low.item} is the cheapest thing on it and ${high.item} the dearest.` : ''}
            {unpriced > 0 ? ` ${unpriced} of its ${r.menu.length} dishes had no price where it was read, and aren’t counted.` : ''}
            {r.date && !Number.isNaN(Date.parse(`${r.date}T12:00:00Z`)) ? ` The prices were read on ${formatDate(Date.parse(`${r.date}T12:00:00Z`), 'UTC')}.` : ''}
          </p>
          <div className="grid grid-3">
            <Stat label="Cheapest" value={<span className="mono">{low ? money(low.price) : 'No Price'}</span>} note={low?.item ?? 'Nothing priced'} />
            <Stat label="The Middle" value={<span className="mono">{middle ? money(middle.price) : 'No Price'}</span>} note={middle?.item ?? 'Nothing priced'} />
            <Stat label="Dearest" value={<span className="mono">{high ? money(high.price) : 'No Price'}</span>} note={high?.item ?? 'Nothing priced'} />
          </div>
        </>
      ),
      ways,
      provenance: r.taxIncluded ? 'Its own menu’s prices, the tax already in them.' : 'Its own menu’s prices, with the meal tax its town charges added.',
    };
  },
});
