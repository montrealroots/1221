/**
 * Food (`systems/kitchen.ts`, `systems/dining.ts`, `systems/alcohol.ts`,
 * from 2026-10-01): the kitchen and what's in it, the recipes and what each
 * is short of, the town's groceries, a bar, and the town's restaurants and
 * their menus, cheapest first, a meal from one at a table, taken away or
 * delivered, with its tax, tip and fees said before it's paid.
 */
import { useState } from 'react';
import { GEAR_LABEL } from '@/engine/content/kitchengear';
import { TABLE_POLICIES, lateFee, reservationsOf, reserveRefusal } from '@/engine/systems/reservations';
import { useGame, useWorld } from '@/app/game-context';
import { cartByChain } from '@/engine/systems/shoppingcart';
import type { PayWith } from '@/engine/systems/household';
import { livingIn } from '@/engine/systems/homes';
import { atHome } from '@/engine/systems/dwelling';
import { Panel, Fine } from '@/ui/components/primitives';
import { CatalogControls, catalogPrice, CompareTable, CompareToggle, FavoriteToggle, ShowMore, useCatalogView, useCompare, usePaged } from '@/ui/components/Catalog';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { titleCaseLabel } from '@/engine/core/text';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { arrange } from '@/engine/systems/catalog';
import { diningQuote, diningRefusal, menuCatalog, restaurantById, restaurantsIn, type DineHow } from '@/engine/systems/dining';
import { bacAt, drinkRefusal, pintPrice } from '@/engine/systems/alcohol';
import { gearOffers, gearRefusal, kitchenHas, cookRefusal, cookingClash, cookingLeft, recipeById, resumeRefusal, dinersOf, groceryCatalog, groceryRefusal, kitchenStock, servingsRange, shortfall, unitPrice, cupOf, freezeDaysOf, freezeRefusal, thawRefusal } from '@/engine/systems/kitchen';
import { MEAL_KEYS } from '@/engine/systems/pantry';
import { RECIPES } from '@/engine/content/groceries';
import { SPOT_LABEL } from '@/engine/systems/items';
import { MS_DAY, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
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
  // Up to three dishes side by side (from 2026-10-04), across restaurants: each one's price and how it can be had.
  const [compared, toggleCompare, clearCompare] = useCompare(`menus-${here}`);
  const side = compared.map((id) => entries.find((e) => e.id === id)).filter((e): e is (typeof entries)[number] => Boolean(e));
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
        <YourBasket />
        {basket && <Meal basket={basket} onChange={setBasket} />}
        <Bar />
        <BookATable />
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
                        <td className="row gap-1"><FavoriteToggle list="menus" id={e.id} /><CompareToggle on={compared.includes(e.id)} onToggle={() => toggleCompare(e.id)} /><button type="button" className="btn btn-sm btn-ghost" disabled={e.price === null} onClick={() => add(e.value.restaurant.id, e.value.item)}>Add</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </LookRegion>
              {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
              <CompareTable heads={side.map((e) => e.label)} onClear={clearCompare} rows={[
                { label: 'Price', values: side.map((e) => catalogPrice(e, money)) },
                { label: 'Restaurant', values: side.map((e) => e.value.restaurant.name) },
                { label: 'Kind', values: side.map((e) => e.facets?.tier ?? '—') },
                { label: 'Cuisine', values: side.map((e) => e.value.restaurant.cuisine ?? '—') },
                { label: 'Neighborhood', values: side.map((e) => e.value.restaurant.neighborhood ?? '—') },
                { label: 'Taken Away', values: side.map((e) => (e.value.restaurant.takeout ? 'Yes' : 'No')) },
                { label: 'Delivered', values: side.map((e) => (e.value.restaurant.delivery ? 'Yes' : 'No')) },
                { label: 'On The Menu', values: side.map((e) => e.value.restaurant.menu.find((m) => m.item === e.value.item)?.note ?? '—') },
              ]} />
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

/** A table booked ahead at a restaurant whose terms are kept, and the bookings held (`systems/reservations.ts`). */
function BookATable() {
  const { sim, run, toast } = useGame();
  const here = useWorld((s) => s.player.currentLocationId);
  const booked = useWorld((s) => [...reservationsOf(s.player)]);
  const places = restaurantsIn(here).filter((r) => TABLE_POLICIES[r.id] && !TABLE_POLICIES[r.id]!.walkInOnly);
  const [rid, setRid] = useState('');
  const r = places.find((x) => x.id === rid) ?? places[0];
  const dishes = r ? r.menu.filter((m) => m.price !== null) : [];
  const [item, setItem] = useState('');
  const dish = dishes.find((m) => m.item === item) ?? dishes[0];
  const [party, setParty] = useState(2);
  const [day, setDay] = useState(7);
  const [hour, setHour] = useState(19);
  const zone = CITIES.require(here).timeZone;
  const today = zonedParts(sim.now, zone);
  const when = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour, minute: 0 }, zone) + day * MS_DAY;
  const no = r && dish ? reserveRefusal(sim, r.id, when, party, dish.item) : 'No restaurant here keeps its booking terms in SLATE.';
  const cur = saveCurrency(sim.universe);
  if (!places.length && !booked.length) return null;
  return (
    <Panel title="Book A Table" subtitle="By each restaurant's own terms: how far ahead, the party, and what a late cancellation or a no-show costs">
      <div className="col gap-3">
        {r && (
          <div className="field-row">
            <div className="field"><label htmlFor="table-at">Restaurant</label><select id="table-at" value={r.id} onChange={(e) => setRid(e.target.value)}>{places.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <div className="field"><label htmlFor="table-dish">Each Orders</label><select id="table-dish" value={dish?.item ?? ''} onChange={(e) => setItem(e.target.value)}>{dishes.map((m) => <option key={m.item} value={m.item}>{m.item}</option>)}</select></div>
            <div className="field"><label htmlFor="table-party">For</label><select id="table-party" value={party} onChange={(e) => setParty(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            <div className="field"><label htmlFor="table-day">Day</label><select id="table-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>{Array.from({ length: 92 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{formatDate(sim.now + d * MS_DAY, zone)}</option>)}</select></div>
            <div className="field"><label htmlFor="table-hour">At</label><select id="table-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 11).map((h) => <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>)}</select></div>
            <Gated feature="food.reserve" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ prepaid: number }>('food.reserve', { restaurantId: r.id, at: when, party, item: dish!.item }); if (a.ok) toast(a.value!.prepaid ? `Booked, ${formatMoney(a.value!.prepaid, cur)} paid ahead.` : 'Booked.', 'positive'); }}>Book The Table</Gated>
          </div>
        )}
        {no && r && <div className="xs dim">{no}</div>}
        {booked.map((b) => { const place = restaurantById(b.restaurantId)!; const fee = lateFee(sim, b.restaurantId, b.at, b.party); return (
          <div key={b.id} className="row gap-2 small" style={{ alignItems: 'center' }}>
            <span>{`${place.name}, for ${b.party}, ${formatDate(b.at, sim.zone)}${fee ? `; a no-show costs ${formatMoney(fee, cur)}` : ''}`}</span>
            <Gated feature="food.cancel_table" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ fee: number }>('food.cancel_table', { reservationId: b.id }); if (a.ok) toast(a.value!.fee ? `Canceled, with ${formatMoney(a.value!.fee, cur)} charged.` : 'Canceled.', 'neutral'); }}>Cancel It</Gated>
          </div>
        ); })}
      </div>
    </Panel>
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
  const person = useWorld((s) => s.player);
  const freeze = useFeature('food.freeze');
  const thaw = useFeature('food.thaw');
  // What the kitchen has, and the small appliances a recipe may ask for (`kitchenHas`, `gearOffers`).
  const has = useWorld((s) => [...kitchenHas(s.player)]);
  const gear = useWorld((s) => gearOffers(s, s.player).map((g) => ({ ...g, no: gearRefusal(s, s.player, g.gear) })));
  const cur = saveCurrency(sim.universe);
  return (
    <Panel title="Your Kitchen" subtitle="The day’s meals come out of what’s ready first; groceries are bought for the rest">
      <div className="row gap-2 small" style={{ alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span className="muted">{`It Has: ${has.map((x) => titleCaseLabel(x.replace('-', ' '))).join(', ')}`}</span>
        {gear.filter((g, i) => (!g.no || !/has one/.test(g.no)) && gear.findIndex((x) => x.gear === g.gear) === i).map((g) => <Gated key={g.gear} feature="food.buy_gear" className="btn btn-sm btn-ghost" disabled={Boolean(g.no)} title={g.no ?? `${g.name} at ${g.retailer}`} onClick={() => { if (run('food.buy_gear', { gear: g.gear }).ok) toast(`${g.name}, in the kitchen.`, 'positive'); }}>{`Buy A ${GEAR_LABEL[g.gear]} (${formatMoney(g.cost, cur)})`}</Gated>)}
      </div>
      {gear.length > 2 && <KitchenAppliances />}
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
                    {/* Frozen at home for FoodKeeper's freezer time, and thawed in the fridge in a day (from 2026-10-06, `food.freeze`). */}
                    {i.food.frozenAt === undefined && freezeDaysOf(i) !== null && (() => { const no = freezeRefusal(sim, person, i); return <button type="button" className="btn btn-sm btn-ghost" disabled={!freeze.open || Boolean(no)} title={no ?? freeze.reason} onClick={() => { if (run('food.freeze', { itemId: i.id }).ok) toast(`${i.label}, frozen.`, 'positive'); }}>Freeze</button>; })()}
                    {i.food.frozenAt !== undefined && <button type="button" className="btn btn-sm btn-ghost" disabled={!thaw.open || Boolean(thawRefusal(sim, person, i))} title={thawRefusal(sim, person, i) ?? thaw.reason} onClick={() => { if (run('food.thaw', { itemId: i.id }).ok) toast(`${i.label}, thawing in the fridge: ready tomorrow.`, 'positive'); }}>Thaw</button>}
                    {cupOf(i) !== undefined && <button type="button" className="btn btn-sm btn-ghost" disabled={!drink.open} title={drink.reason} onClick={() => { if (run('food.drink_home', { itemId: i.id }).ok) toast(`A cup of ${i.label.split(',')[0]}.`, 'positive'); }}>Have A Cup</button>}
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
  // An outdoor kitchen of their own, where they are (from 2026-10-04).
  const outdoors = atHome(person) && Boolean(livingIn(person)?.facts.features.includes('outdoorKitchen'));
  // Whom a meal serves (from 2026-10-06): the partner by default, as before; anyone at home once chosen.
  const diners = dinersOf(sim, person);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const serving = (chosen ?? diners.filter((d) => d.who === 'partner').map((d) => d.id)).filter((id) => diners.some((d) => d.id === id));
  const serve = chosen === null ? {} : { serve: serving };
  // A recipe stopped partway (from 2026-10-06), finished from here within USDA's two hours.
  const partway = cookingLeft(sim, person);
  const resumeNo = partway ? resumeRefusal(sim, person) : undefined;
  return (
    <Panel title="Recipes" subtitle={`${ready} of ${RECIPES.length} can be cooked with what’s in the kitchen`}>
      {partway && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span className="small">{`${recipeById(partway.recipeId)?.name ?? 'A recipe'}, partway: ${Math.round(partway.minutesDone)} of ${partway.minutes} minutes cooked (${partway.why})`}</span>
          <Gated feature="food.resume_cooking" className="btn btn-sm btn-ghost" disabled={Boolean(resumeNo)} title={resumeNo} onClick={() => { const res = run<{ left: number; stopped?: string }>('food.resume_cooking', {}); if (res.ok) toast(res.value?.stopped ? `Stopped again: ${res.value.stopped}.` : `Finished: one eaten, ${res.value?.left ?? 0} kept.`, res.value?.stopped ? 'negative' : 'positive'); }}>Finish Cooking It</Gated>
        </div>
      )}
      {diners.length > 0 && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="small">Serve</span>
          {diners.map((d) => (
            <label key={d.id} className="small row gap-1" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={serving.includes(d.id)} onChange={() => setChosen(serving.includes(d.id) ? serving.filter((x) => x !== d.id) : [...serving, d.id])} />{d.label}
            </label>
          ))}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Recipe</th><th scope="col" className="num">Serves</th><th scope="col" className="num">Minutes</th><th scope="col">Source</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.map(({ r, n, no }) => (
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
                <td><button type="button" className="btn btn-sm btn-ghost" style={{ whiteSpace: 'nowrap' }} disabled={!cookable.open || Boolean(no)} title={no ?? cookable.reason} onClick={() => { const res = run<{ left: number; stopped?: string }>('food.cook', { recipeId: r.id, servings: n, ...serve }); if (res.ok) toast(res.value?.stopped ? `${r.name}, stopped partway: ${res.value.stopped}.` : `${r.name}: one eaten, ${res.value?.left ?? 0} kept.`, res.value?.stopped ? 'negative' : 'positive'); }}>Cook It</button>{outdoors && <Gated feature="food.cook" className="btn btn-sm btn-ghost" style={{ whiteSpace: 'nowrap' }} disabled={Boolean(no)} title={no} onClick={() => { const res = run<{ left: number; stopped?: string }>('food.cook', { recipeId: r.id, servings: n, outside: true, ...serve }); if (res.ok) toast(res.value?.stopped ? `${r.name}, stopped partway: ${res.value.stopped}.` : `${r.name}, cooked outside: one eaten, ${res.value?.left ?? 0} kept.`, res.value?.stopped ? 'negative' : 'positive'); }}>Cook It Outside</Gated>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Fine>The recipes are their sources’ own. A recipe is cooked for the servings chosen, its ingredients scaled to them, from one to three times what it makes: one eaten, the rest in the fridge for its own days or FoodSafety.gov’s three. Seasonings, spices, stock and water are taken as in the cupboard; a count is weighed by USDA’s medium portion. A starred time is SLATE’s 30 minutes where the source gave none. A home’s kitchen has a stove, an oven, a grill, a fridge-freezer and a microwave; a blender or a slow cooker isn’t kept yet.</Fine>
    </Panel>
  );
}

const STORAGE_WORD: Readonly<Record<string, string>> = { pantry: 'The Cupboard', fridge: 'The Fridge', freezer: 'The Freezer' };

/** Blenders and slow cookers by make and model where they live (from 2026-10-05), cheapest first, searched and filtered. */
function KitchenAppliances() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const entries = useWorld((s) => gearOffers(s, s.player).map((g) => ({ id: g.id!, label: g.name, value: g, basis: 'Tax In', price: g.cost, priceKind: 'advertised' as const, facets: { gear: GEAR_LABEL[g.gear], brand: g.brand ?? g.name.split(' ')[0]!, retailer: g.retailer } })));
  const [view, setView] = useCatalogView('kitchen-gear');
  // A page at a time, the rest a click away (from 2026-10-06; until then the first 12 and no more).
  const [count, more] = usePaged('kitchen-gear', 12);
  const arranged = arrange(entries, view);
  const shown = arranged.slice(0, count);
  return (
    <div className="col gap-2" style={{ marginBottom: '0.75rem' }}>
      <div className="strong small">Kitchen Appliances</div>
      <CatalogControls id="kitchen-gear-catalog" entries={entries} view={view} onChange={setView} facets={{ gear: 'Kind', brand: 'Maker', retailer: 'Seller' }} />
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Model</th><th scope="col">Kind</th><th scope="col">Seller</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
          <tbody>
            {shown.map((e) => {
              const no = gearRefusal(sim, sim.player, e.value.gear);
              return (
                <tr key={e.id}>
                  <td>{e.label}</td>
                  <td className="small">{e.facets?.gear}</td>
                  <td className="small">{e.value.retailer}</td>
                  <td className="num mono">{formatMoney(e.price ?? 0, cur, { cents: false })}</td>
                  <td><Gated feature="food.buy_gear" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('food.buy_gear', { gear: e.value.gear, offerId: e.id }).ok) toast(`${e.label}, in the kitchen.`, 'positive'); }}>Buy</Gated></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ShowMore shown={shown.length} total={arranged.length} onMore={more} />
    </div>
  );
}

/** The till's ways to pay: cash in a store, the credit card, the debit card (`payWith`). */
export function PayWithField({ id, way, onChange }: { id: string; way: PayWith; onChange: (w: PayWith) => void }) {
  return (
    <div className="field">
      <label htmlFor={id}>Pay With</label>
      <select id={id} value={way} onChange={(e) => onChange(e.target.value as PayWith)}>
        <option value="cash">Cash, In Store</option>
        <option value="credit">The Credit Card</option>
        <option value="debit">The Debit Card</option>
      </select>
    </div>
  );
}

/** Groceries and toiletries in the basket (`systems/shoppingcart.ts`, from 2026-10-04): a chain at a time, its total here now, checked out at its till the way chosen. */
function YourBasket() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const groups = useWorld((s) => cartByChain(s, s.player));
  const [way, setWay] = useState<PayWith>('debit');
  if (groups.length === 0) return null;
  return (
    <Panel title="Your Basket" subtitle="Groceries and toiletries, checked out a chain at a time, at its till">
      <div className="col gap-3">
        <div className="field-row field-row-tight"><PayWithField id="cart-pay" way={way} onChange={setWay} /></div>
        {groups.map((g) => (
          <div key={g.chain} className="col gap-1">
            <div className="row-between"><strong className="small">{g.name}</strong><span className="mono small">{formatMoney(g.total, cur)}</span></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Thing</th><th scope="col" className="num">How Many</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Take Out</span></th></tr></thead>
                <tbody>{g.lines.map((l) => (
                  <tr key={l.id}><td>{l.label}</td><td className="num">{l.quantity}</td><td className="num mono">{formatMoney(l.price, cur)}</td><td><Gated feature="cart.remove" className="btn btn-sm btn-ghost" onClick={() => run('cart.remove', { lineId: l.id })}>Take It Out</Gated></td></tr>
                ))}</tbody>
              </table>
            </div>
            <div><Gated feature="cart.checkout" className="btn btn-sm" onClick={() => { const r = run<{ paid: number }>('cart.checkout', { chain: g.chain, payWith: way }); if (r.ok) toast(`${g.name}: ${formatMoney(r.value!.paid, cur)} paid.`, 'positive'); }}>{`Check Out At ${g.name}`}</Gated></div>
          </div>
        ))}
      </div>
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
  // Up to three side by side (from 2026-10-04): what a kilo, a liter or one costs, and how long each keeps where it's kept.
  const [compared, toggleCompare, clearCompare] = useCompare(`groceries-${here}`);
  const side = compared.map((id) => entries.find((e) => e.id === id)).filter((e): e is (typeof entries)[number] => Boolean(e));
  const buy = useFeature('food.buy_groceries');
  const [way, setWay] = useState<PayWith>('debit');
  if (entries.length === 0) return <Panel title="Groceries"><p className="small muted" style={{ margin: 0 }}>SLATE doesn’t keep a grocery chain’s prices in this town yet.</p></Panel>;
  return (
    <Panel title="Groceries" subtitle={`${entries.length} things from ${new Set(entries.map((e) => e.value.chain)).size === 1 ? 'one chain' : `${new Set(entries.map((e) => e.value.chain)).size} chains`}`}>
      <div className="col gap-3">
        <CatalogControls id="groceries-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ aisle: 'Aisle', chain: 'Chain' }} lead={<PayWithField id="groceries-pay" way={way} onChange={setWay} />} />
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
                    <td className="row gap-1"><FavoriteToggle list="groceries" id={e.id} /><CompareToggle on={compared.includes(e.id)} onToggle={() => toggleCompare(e.id)} /><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('food.buy_groceries', { productId: e.id, quantity: 1, payWith: way }).ok) toast(`${e.label}, bought.`, 'positive'); }}>Buy</button><Gated feature="cart.add" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('cart.add', { kind: 'grocery', productId: e.id }).ok) toast(`${e.label}, in the basket.`, 'positive'); }}>Add To Basket</Gated></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
        <CompareTable heads={side.map((e) => e.label)} onClear={clearCompare} rows={[
          { label: 'Price', values: side.map((e) => catalogPrice(e, money)) },
          { label: 'Unit Price', values: side.map((e) => { const u = unitPrice(sim, here, e.value); return `${money(u.price)} / ${u.per}`; }) },
          { label: 'Chain', values: side.map((e) => e.facets?.chain ?? '—') },
          { label: 'Size', values: side.map((e) => (e.value.sizeUnit === 'ct' ? `${e.value.sizeQty} in the pack` : `${e.value.sizeQty} ${e.value.sizeUnit}`)) },
          { label: 'Keeps', values: side.map((e) => (e.value.keepsDays === null ? '—' : `${e.value.keepsDays} ${e.value.keepsDays === 1 ? 'Day' : 'Days'}${e.value.keepsEstimated ? ' (Estimate)' : ''}`)) },
          { label: 'Kept In', values: side.map((e) => STORAGE_WORD[e.value.storage] ?? e.value.storage) },
        ]} />
        <Fine>Each product is its chain’s regular shelf price as its own data listed it, or a price tracker’s where the chain blocked the read, with the town’s sales tax where groceries carry one. How long each keeps where it’s kept is USDA FoodKeeper’s, from purchase, or SLATE’s estimate where FoodKeeper gives none. Groceries are bought in a store and go home.</Fine>
      </div>
    </Panel>
  );
}
