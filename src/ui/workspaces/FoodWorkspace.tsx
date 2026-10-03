/**
 * Food (`systems/kitchen.ts`, `systems/dining.ts`, `systems/alcohol.ts`,
 * from 2026-10-01): the kitchen and what's in it, the recipes and what each
 * is short of, the town's groceries, a bar, and the town's restaurants and
 * their menus, cheapest first, a meal from one at a table, taken away or
 * delivered, with its tax, tip and fees said before it's paid.
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
import { cookRefusal, cookingClash, groceryCatalog, groceryRefusal, kitchenStock, servingsRange, shortfall, unitPrice } from '@/engine/systems/kitchen';
import { MEAL_KEYS } from '@/engine/systems/pantry';
import { RECIPES } from '@/engine/content/groceries';
import { SPOT_LABEL } from '@/engine/systems/items';
import { formatDate } from '@/engine/core/time';
import { groupLabelOf } from '@/ui/shell/destinations';
import { LookRegion, Open, at } from '@/ui/looks';

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
      <LookRegion className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/food')}</div>
        <h1>Food</h1>
        <p className="muted">Your kitchen, the shops and restaurants of <Open subject={at('place', here)}>{town}</Open>, and a bar: the cheapest first.</p>
      </LookRegion>
      <div className="col gap-5">
        <Kitchen />
        <Recipes />
        <Groceries />
        {basket && <Meal basket={basket} onChange={setBasket} />}
        <Bar />
        {entries.length === 0 ? (
          <Panel title={`Restaurants In ${town}`}><p className="small muted" style={{ margin: 0 }}>SLATE doesn’t keep this town’s restaurants yet: the business’s towns so far.</p></Panel>
        ) : (
          <Panel title={`Restaurants In ${town}`} subtitle={`${new Set(entries.map((e) => e.value.restaurant.id)).size} restaurants, ${entries.length} things on their menus`}>
            <div className="col gap-3">
              <CatalogControls id="menus-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ restaurant: 'Restaurant', tier: 'Kind' }} />
              <LookRegion>
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Dish</th><th scope="col">Restaurant</th><th scope="col">Kind</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {shown.slice(0, count).map((e) => (
                      <tr key={e.id}>
                        <td>{e.label}</td>
                        <td className="small"><Open subject={at('restaurant', e.value.restaurant.id)}>{e.value.restaurant.name}</Open></td>
                        <td className="small">{e.facets?.tier}</td>
                        <td className="num mono">{catalogPrice(e, money)}</td>
                        <td><button type="button" className="btn btn-sm btn-ghost" disabled={e.price === null} onClick={() => add(e.value.restaurant.id, e.value.item)}>Add</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </LookRegion>
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
    <Panel title={r.name} look={at('restaurant', r.id)} subtitle={[r.cuisine, r.neighborhood ?? r.address].filter(Boolean).join(' · ')}>
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

/** How much is left of a food, in words. */
const amount = (left: number, unit: string) => (unit === 'ct' ? `${Math.round(left)} Left` : unit === 'ml' ? (left >= 1000 ? `${(left / 1000).toFixed(1)} L Left` : `${Math.round(left)} ml Left`) : left >= 1000 ? `${(left / 1000).toFixed(1)} kg Left` : `${Math.round(left)} g Left`);

/** What's in the fridge, the freezer and the pantry, the soonest to go off first. */
function Kitchen() {
  const { sim, run, toast } = useGame();
  const stock = useWorld((s) => [...kitchenStock(s, s.player)].sort((a, b) => (a.food.expiresAt ?? Infinity) - (b.food.expiresAt ?? Infinity)));
  const eat = useFeature('food.eat_ready');
  const drink = useFeature('food.drink_home');
  return (
    <Panel title="Your Kitchen" subtitle="The day’s meals come out of what’s ready first; groceries are bought for the rest">
      {stock.length === 0 ? <p className="small muted" style={{ margin: 0 }}>The fridge, the freezer and the pantry are bare.</p> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Food</th><th scope="col">Where</th><th scope="col" className="num">Left</th><th scope="col">Keeps Until</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {stock.map((i) => (
                <tr key={i.id}>
                  <td>{i.label}</td>
                  <td className="small">{i.at.kind === 'home' ? SPOT_LABEL[i.at.spot ?? 'floor'] : 'Elsewhere'}</td>
                  <td className="num mono">{i.food.key === 'dish' ? `${i.food.left} ${i.food.left === 1 ? 'Portion' : 'Portions'}` : amount(i.food.left, i.food.unit)}</td>
                  <td className="small">{i.food.expiresAt ? formatDate(i.food.expiresAt, sim.zone) : 'Keeps'}</td>
                  <td>
                    {MEAL_KEYS.has(i.food.key) && <button type="button" className="btn btn-sm btn-ghost" disabled={!eat.open} title={eat.reason} onClick={() => { if (run('food.eat_ready', { itemId: i.id }).ok) toast(`${i.label}, eaten.`, 'positive'); }}>Heat And Eat</button>}
                    {(i.food.key === 'beer' || i.food.key === 'wine') && <button type="button" className="btn btn-sm btn-ghost" disabled={!drink.open} title={drink.reason} onClick={() => { if (run('food.drink_home', { itemId: i.id }).ok) toast(i.food.key === 'beer' ? 'A pint, at home.' : 'A glass, at home.', 'positive'); }}>{i.food.key === 'beer' ? 'Have A Pint' : 'Have A Glass'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** The recipes, those that can be cooked now first, and what each of the rest is short of. */
function Recipes() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cookable = useFeature('food.cook');
  const shopFor = useFeature('food.buy_short');
  const [serves, setServes] = useState<Record<string, number>>({});
  const rows = RECIPES.map((r) => ({ r, n: serves[r.id] ?? r.servings, no: cookRefusal(sim, person, r.id, serves[r.id] ?? r.servings) ?? cookingClash(sim, r.id) })).sort((a, b) => Number(Boolean(a.no)) - Number(Boolean(b.no)) || a.r.name.localeCompare(b.r.name));
  const ready = rows.filter((x) => !x.no).length;
  return (
    <Panel title="Recipes" subtitle={`${ready} of ${RECIPES.length} can be cooked with what’s in the kitchen`}>
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Recipe</th><th scope="col" className="num">Serves</th><th scope="col" className="num">Minutes</th><th scope="col">Source</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.slice(0, 12).map(({ r, n, no }) => (
              <tr key={r.id}>
                <td>{r.name}{no ? <div className="xs dim">{no}</div> : null}{no && /short of/.test(no) ? (() => { const need = shortfall(sim, person, r.id, n); if (!need || need.unbuyable.length || need.buys.length === 0) return need?.unbuyable.length ? <div className="xs dim">{`No store here sells ${need.unbuyable.join(', ')}.`}</div> : null; const cost = need.buys.reduce((a, b) => a + b.cost, 0); return <div><button type="button" className="btn btn-sm btn-ghost" disabled={!shopFor.open} title={shopFor.reason} onClick={() => { if (run('food.buy_short', { recipeId: r.id, servings: n }).ok) toast('Bought what was short; it can be cooked now.', 'positive'); }}>{`Buy What’s Short, ${formatMoney(cost, saveCurrency(sim.universe), { cents: false })}`}</button></div>; })() : null}</td>
                <td className="num mono">
                  <label className="sr-only" htmlFor={`serves-${r.id}`}>Servings</label>
                  <select id={`serves-${r.id}`} value={n} onChange={(e) => setServes({ ...serves, [r.id]: Number(e.target.value) })}>
                    {Array.from({ length: servingsRange(r).most }, (_, i) => i + 1).map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </td>
                <td className="num mono">{r.minutes ?? '30*'}</td>
                <td className="small">{r.source}</td>
                <td><button type="button" className="btn btn-sm btn-ghost" style={{ whiteSpace: 'nowrap' }} disabled={!cookable.open || Boolean(no)} title={no ?? cookable.reason} onClick={() => { const res = run<{ left: number }>('food.cook', { recipeId: r.id, servings: n }); if (res.ok) toast(`${r.name}: one eaten, ${res.value?.left ?? 0} kept.`, 'positive'); }}>Cook It</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Fine>The recipes are their sources’ own. A recipe is cooked for the servings chosen, its ingredients scaled to them, from one to three times what it makes: one eaten, the rest in the fridge for its own days or FoodSafety.gov’s three. Seasonings, spices, stock and water are taken as in the cupboard; a count is weighed by USDA’s medium portion. A starred time is SLATE’s 30 minutes where the source gave none. A home’s kitchen has a stove, an oven, a grill, a fridge-freezer and a microwave; a blender or a slow cooker isn’t kept yet.</Fine>
    </Panel>
  );
}

/** The town's groceries, cheapest first, each with its price a kilo, a liter or each. */
function Groceries() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const here = useWorld((s) => s.player.currentLocationId);
  const entries = useWorld((s) => groceryCatalog(s, here), [here]);
  const [view, setView] = useCatalogView(`groceries-${here}`);
  const shown = arrange(entries, view);
  const [count, setCount] = useState(PAGE);
  const buy = useFeature('food.buy_groceries');
  if (entries.length === 0) return <Panel title="Groceries"><p className="small muted" style={{ margin: 0 }}>SLATE doesn’t keep a grocery chain’s prices in this town yet.</p></Panel>;
  return (
    <Panel title="Groceries" subtitle={`${entries.length} things from ${new Set(entries.map((e) => e.value.chain)).size === 1 ? 'one chain' : `${new Set(entries.map((e) => e.value.chain)).size} chains`}`}>
      <div className="col gap-3">
        <CatalogControls id="groceries-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ aisle: 'Aisle', chain: 'Chain' }} />
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Product</th><th scope="col">Chain</th><th scope="col" className="num">Unit Price</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {shown.slice(0, count).map((e) => {
                const unit = unitPrice(sim, here, e.value);
                const no = groceryRefusal(sim, person, e.id, 1);
                return (
                  <tr key={e.id}>
                    <td>{e.label}</td>
                    <td className="small">{e.facets?.chain}</td>
                    <td className="num mono small">{`${money(unit.price)} / ${unit.per}`}</td>
                    <td className="num mono">{catalogPrice(e, money)}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('food.buy_groceries', { productId: e.id, quantity: 1 }).ok) toast(`${e.label}, bought.`, 'positive'); }}>Buy</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
        <Fine>Each product is its chain’s regular shelf price as its own data listed it, or a price tracker’s where the chain blocked the read, with the town’s sales tax where groceries carry one. How long each keeps where it’s kept is USDA FoodKeeper’s, from purchase, or SLATE’s estimate where FoodKeeper gives none. Groceries are bought in a store and go home.</Fine>
      </div>
    </Panel>
  );
}
