/**
 * Food (`systems/dining.ts`, from 2026-10-01): the town's restaurants and
 * their menus, cheapest first, and a meal from one of them, at a table,
 * taken away or delivered, with its tax, tip and fees said before it's paid.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { CatalogControls, catalogPrice, useCatalogView } from '@/ui/components/Catalog';
import { useFeature } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { arrange } from '@/engine/systems/catalog';
import { diningQuote, diningRefusal, menuCatalog, restaurantById, type DineHow } from '@/engine/systems/dining';
import { bacAt, drinkRefusal, pintPrice } from '@/engine/systems/alcohol';

const PAGE = 40;
/** Ordered least to most: taken away, delivered, at a table. */
const HOW_LABEL: Readonly<Record<DineHow, string>> = { takeout: 'Take It Away', delivery: 'Have It Delivered', in: 'At A Table' };

export function FoodWorkspace() {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const here = useWorld((s) => s.player.currentLocationId);
  const town = CITIES.get(here)?.name ?? 'Here';
  const entries = useWorld((s) => menuCatalog(s, here), [here]);
  const [view, setView] = useCatalogView(`menus-${here}`);
  const shown = arrange(entries, view);
  const [count, setCount] = useState(PAGE);
  const [basket, setBasket] = useState<{ restaurantId: string; items: string[] } | undefined>(undefined);
  const add = (restaurantId: string, item: string) => setBasket(basket && basket.restaurantId === restaurantId ? { restaurantId, items: [...basket.items, item].slice(0, 6) } : { restaurantId, items: [item] });
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Food</h1>
        <p className="muted">The restaurants of {town} and their menus, the cheapest first.</p>
      </div>
      <div className="col gap-5">
        {basket && <Meal basket={basket} onChange={setBasket} />}
        <Bar />
        {entries.length === 0 ? (
          <Panel title={`Restaurants In ${town}`}><p className="small muted" style={{ margin: 0 }}>SLATE doesn’t keep this town’s restaurants yet: the business’s towns so far.</p></Panel>
        ) : (
          <Panel title={`Restaurants In ${town}`} subtitle={`${new Set(entries.map((e) => e.value.restaurant.id)).size} restaurants, ${entries.length} things on their menus`}>
            <div className="col gap-3">
              <CatalogControls id="menus-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ restaurant: 'Restaurant', tier: 'Kind' }} />
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Dish</th><th scope="col">Restaurant</th><th scope="col">Kind</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {shown.slice(0, count).map((e) => (
                      <tr key={e.id}>
                        <td>{e.label}</td>
                        <td className="small">{e.value.restaurant.name}</td>
                        <td className="small">{e.facets?.tier}</td>
                        <td className="num mono">{catalogPrice(e, money)}</td>
                        <td><button type="button" className="btn btn-sm btn-ghost" disabled={e.price === null} onClick={() => add(e.value.restaurant.id, e.value.item)}>Add</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
            </div>
          </Panel>
        )}
        <Fine>
          The restaurants are real, and each dish’s price is the one read on the date it was, on the restaurant’s own menu or, for a chain that publishes none, a delivery app’s, which runs above the counter’s. A meal is taxed as its town taxes one: the sales tax in America and Canada, with Connecticut’s 1% meals tax on top and British Columbia’s GST alone; in Britain, Ireland and Mexico it’s in the price. A table is tipped at the custom’s middle and a counter isn’t. A delivery carries its app’s service fee and small-order fee where the app publishes them; its delivery fee, and some service fees and tips, are SLATE’s estimates from what guides report, said so on the bill.
        </Fine>
      </div>
    </>
  );
}

/** The meal being put together: one restaurant's dishes, how it's had, and what it comes to. */
function Meal({ basket, onChange }: { basket: { restaurantId: string; items: string[] }; onChange: (b: { restaurantId: string; items: string[] } | undefined) => void }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const dine = useFeature('food.dine');
  const r = restaurantById(basket.restaurantId)!;
  const [how, setHow] = useState<DineHow>('in');
  const quote = diningQuote(sim, r, basket.items, how);
  const no = diningRefusal(sim, person, r.id, basket.items, how);
  const local = (n: number) => formatMoney(Math.round(n * 100), r.currency);
  return (
    <Panel title={r.name} subtitle={[r.cuisine, r.neighborhood ?? r.address].filter(Boolean).join(' · ')}>
      <div className="col gap-3">
        <div className="small">{basket.items.map((item, i) => (
          <span key={`${item}-${i}`}>{i > 0 ? ' · ' : ''}{item} <button type="button" className="btn btn-sm btn-ghost" aria-label={`Take off ${item}`} onClick={() => { const items = basket.items.filter((_, k) => k !== i); onChange(items.length ? { ...basket, items } : undefined); }}>Remove</button></span>
        ))}</div>
        <div className="field-row field-row-tight">
          <div className="field">
            <label htmlFor="dine-how">How</label>
            <select id="dine-how" value={how} onChange={(e) => setHow(e.target.value as DineHow)}>
              {(Object.keys(HOW_LABEL) as DineHow[]).map((h) => <option key={h} value={h}>{HOW_LABEL[h]}</option>)}
            </select>
          </div>
        </div>
        {quote && (
          <div className="small muted">
            {`Food ${local(quote.food)}${quote.tax ? `, tax ${local(quote.tax)}` : ''}${quote.tip ? `, tip ${local(quote.tip)}` : ''}${quote.fees ? `, the app’s fees ${local(quote.fees)}` : ''}: ${money(quote.total)} in all${quote.estimated ? ', part of it an estimate' : ''}. About ${quote.minutes} minutes.`}
          </div>
        )}
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!dine.open || Boolean(no)} title={no ?? dine.reason} onClick={() => { if (run('food.dine', { restaurantId: r.id, items: basket.items, how }).ok) { toast(`A meal from ${r.name}.`, 'positive'); onChange(undefined); } }}>
            {quote ? `Have It, ${money(quote.total)}` : 'Have It'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)}>Clear</button>
        </div>
        {no && <div className="xs dim">{no}</div>}
      </div>
    </Panel>
  );
}

/** A bar in town: pints at its price, and what's in the blood now. */
function Bar() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const person = useWorld((s) => s.player);
  const here = useWorld((s) => s.player.currentLocationId);
  const bac = useWorld((s) => bacAt(s.player, s.now));
  const drink = useFeature('food.drink');
  const [pints, setPints] = useState(1);
  const price = pintPrice(sim, here);
  const no = drinkRefusal(sim, person, pints);
  const many = pints === 1 ? 'A Pint' : `${pints} Pints`;
  return (
    <Panel title="A Bar" subtitle={`Blood alcohol now ${bac.toFixed(3)}`}>
      <div className="col gap-3">
        <div className="field-row field-row-tight">
          <div className="field">
            <label htmlFor="bar-pints">Pints</label>
            <select id="bar-pints" value={pints} onChange={(e) => setPints(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!drink.open || Boolean(no)} title={no ?? drink.reason} onClick={() => { if (run('food.drink', { pints }).ok) toast(`${pints === 1 ? 'A pint' : `${pints} pints`} at the bar.`, 'positive'); }}>
            {price !== undefined ? `Have ${many}, ${formatMoney(price * pints, cur)}` : `Have ${many}`}
          </button>
        </div>
        {no && <div className="xs dim">{no}</div>}
        <Fine>A pint is Numbeo’s crowd-sourced price for a draft beer here, an estimate. What it puts in the blood is Widmark’s formula for your weight, falling 0.017 an hour, NHTSA’s rate. A drive with alcohol in the blood carries NHTSA’s crash risk for it, and one over the line can end in the place’s first offense: its fine, its suspension, and in Mexico City a night or more at El Torito.</Fine>
      </div>
    </Panel>
  );
}
