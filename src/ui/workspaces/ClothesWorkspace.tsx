/**
 * Clothes (`systems/clothing.ts`, `systems/wardrobe.ts` and
 * `systems/hygiene.ts`, from 2026-10-01): the wardrobe and what's clean in
 * it, the dry cleaner, what to wear and the outfits put together, the
 * bathroom's toiletries, the town's barbers and salons, the shops of the
 * country they're in, cheapest first, and what they've bought, to take back
 * while they may.
 */
import { SNEAKERS } from '@/engine/content/sneakers';
import { goatPayout, sneakerOffers, sneakerRefusal } from '@/engine/systems/sneakers';
import { Fragment, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { CatalogControls, FavoriteToggle, catalogPrice, useCatalogView } from '@/ui/components/Catalog';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import type { Slot } from '@/engine/content/garmentcare';
import type { ClothingProduct } from '@/engine/content/clothingcatalog';
import { arrange } from '@/engine/systems/catalog';
import type { Item } from '@/engine/systems/items';
import { CHANGE_MINUTES, chosenMissing, cleanOutfits, wornNow, dryCleanDirty, garmentsOf, outfitFor, unwearable, wearable, washableDirty, type Garment, toBasketRefusal } from '@/engine/systems/wardrobe';
import { groomingQuote, groomingRefusal, salonsIn, suppliesOf, toiletryCatalog, toiletryRefusal, lastGroomed, daysSince } from '@/engine/systems/hygiene';
import { alterCost, alterRefusal, fitOf, tailorsIn, chartFor } from '@/engine/systems/tailoring';
import { resaleOf, sellRefusal } from '@/engine/systems/resale';
import { LookRegion, Open, at } from '@/ui/looks';
import { sizeFor, sizeRun } from '@/engine/systems/tailoring';
import { groupLabelOf } from '@/ui/shell/destinations';
import { cloOf } from '@/engine/content/clo';
import type { PayWith } from '@/engine/systems/household';
import { buyRefusal, otherSellers, collectRefusal, cancelRefusal, checkoutQuote, checkoutRefusal, clothingCatalog, type BasketLine, dressRefusal, dryCleanPrice, productById, purchaseItems, purchaseQuote, readyToCollect, retailerById, returnFee, returnRefusal, againOptions } from '@/engine/systems/clothing';

/** The parts of an outfit, as the screen names them. */
const SLOT_LABEL: Readonly<Partial<Record<Slot, string>>> = {
  top: 'Top', bottom: 'Bottom', dress: 'Dress', suit: 'Suit', outer: 'Coat Or Jacket', underwear: 'Underwear', socks: 'Socks', shoes: 'Shoes',
};
const PAGE = 40;

type Worn = Item & { garment: Garment };
const named = (g: Worn) => `${g.label}${g.spec?.size ? `, ${g.spec.size}` : ''}${g.spec?.color ? `, ${g.spec.color}` : ''}`;

export function ClothesWorkspace() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const here = useWorld((s) => s.player.currentLocationId);
  const town = CITIES.get(here)?.name ?? 'Here';
  const state = useWorld((s) => ({
    outfits: cleanOutfits(s, s.player),
    toWash: washableDirty(s, s.player).length,
    toDryClean: dryCleanDirty(s, s.player),
    ready: readyToCollect(s, s.player).length,
    away: garmentsOf(s.player).filter((g) => g.at.kind === 'service').length,
  }));
  const dryCleanCost = state.toDryClean.reduce((sum, g) => sum + dryCleanPrice(sim, here, g).price, 0);
  const dryClean = useFeature('clothes.dry_clean');
  const collect = useFeature('clothes.collect');

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/clothes')}</div>
        <h1>Clothes</h1>
        <p className="muted">What you have to wear, what’s in the wash, and the shops of {town}: the cheapest first.</p>
      </div>
      <div className="col gap-5">
        <Panel
          title="Your Wardrobe"
          actions={(
            <div className="row gap-1">
              <button type="button" className="btn btn-sm btn-ghost" disabled={!dryClean.open || state.toDryClean.length === 0} title={dryClean.reason} onClick={() => { if (run('clothes.dry_clean', {}).ok) toast(`To the dry cleaner, ${money(dryCleanCost)}.`, 'positive'); }}>
                {state.toDryClean.length > 0 ? `Dry Clean ${state.toDryClean.length}, ${money(dryCleanCost)}` : 'Dry Clean'}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!collect.open || state.ready === 0} title={collect.reason} onClick={() => { if (run('clothes.collect', {}).ok) toast('Collected from the dry cleaner.', 'positive'); }}>Collect</button>
            </div>
          )}
        >
          <div className="grid grid-3">
            <Stat label="Clean Outfits" value={String(state.outfits)} note="Whole, to hand and dry" tone={state.outfits <= 2 ? 'warning' : undefined} />
            <Stat label="In The Wash" value={String(state.toWash)} note={state.toWash ? 'Garments to wash' : 'Nothing to wash'} />
            <Stat label="Dry Cleaning" value={String(state.toDryClean.length + state.away)} note={state.away ? `${state.away} at the dry cleaner${state.ready ? `, ${state.ready} ready here` : ''}` : state.toDryClean.length ? 'Waiting to go in' : 'None waiting'} />
          </div>
        </Panel>
        <WhatToWear />
        <SellThem />
        <Fit />
        <YourMeasurements />
        <Bathroom />
        <Salons />
        <Shop />
        <Basket />
        <Sneakers />
        <Bought />
        <Fine>
          The shops are real retailers and the clothes their real products, at the regular prices their pages listed on the date each was read, in the money of the country they’re sold in: with VAT or IVA in Britain, Ireland and Mexico, and with the town’s sales tax added in America and Canada, none on clothing under $110 an item in New York. A store sells where SLATE has its address; online, a retailer delivers in its own country, at its published fee, free over its threshold, in its working days, or its country’s middle figure where it published none, said so. A return is unworn and unwashed, inside the retailer’s window, to a store free where it takes them there, or by mail at its fee; the delivery isn’t refunded. Dry cleaning is a real shop’s list in the town, or New York’s at the town’s cost of living, and two days, SLATE’s estimate. The clothes a life begins with are unbranded, SLATE’s.
        </Fine>
      </div>
    </>
  );
}

/** Clean clothes sold on, by the market's own way of selling (`clothes.sell`). */
function SellThem() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const sellable = useWorld((s) => garmentsOf(s.player).filter((g) => !sellRefusal(s, s.player, g)));
  const [picked, setPicked] = useState<string[]>([]);
  const sell = useFeature('clothes.sell');
  if (sellable.length === 0) return null;
  const chosen = sellable.filter((g) => picked.includes(g.id));
  const q = chosen.length ? resaleOf(sim, person, chosen) : undefined;
  return (
    <Panel title="Sell Clothes" subtitle={q ? q.basis : 'Choose what to sell'}>
      <LookRegion className="col gap-2">
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {sellable.map((g) => (
            <span key={g.id} className="row gap-1 small" style={{ alignItems: 'center' }}>
              <input type="checkbox" aria-label={`Sell the ${named(g)}`} checked={picked.includes(g.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, g.id] : picked.filter((x) => x !== g.id))} /> <Open subject={at('garment', g.id)}>{named(g)}</Open>
            </span>
          ))}
        </div>
        <div><button type="button" className="btn btn-sm btn-ghost" disabled={!sell.open || chosen.length === 0} title={sell.reason} onClick={() => { const a = run<{ paid: number }>('clothes.sell', { itemIds: picked }); if (a.ok) { setPicked([]); toast(`Sold, for ${formatMoney(a.value!.paid, saveCurrency(sim.universe))}.`, 'positive'); } }}>{q ? `Sell Them, ${formatMoney(q.paid, saveCurrency(sim.universe))}` : 'Sell Them'}</button></div>
      </LookRegion>
    </Panel>
  );
}

/** What to put on: a garment for each part, from what's to hand, and the outfits put together. */
function WhatToWear() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const ready = useWorld((s) => garmentsOf(s.player).filter((g) => wearable(s, s.player, g)));
  const today = useWorld((s) => (outfitFor(s, s.player) ?? []).map((g) => g.id));
  const outfits = useWorld((s) => s.player.outfits ?? []);
  const missing = useWorld((s) => chosenMissing(s, s.player));
  const onNow = useWorld((s) => wornNow(s.player));
  const change = useFeature('clothes.change');
  const [picked, setPicked] = useState<Partial<Record<Slot, string>>>({});
  const extras = ready.filter((g) => g.garment.slot === 'accessory');
  const [jewels, setJewels] = useState<string[]>(() => (person.dressed ?? []).filter((id) => extras.some((g) => g.id === id)));
  // Layers: a base layer under, a sweater over the top (from 2026-10-03).
  const layerable = ready.filter((g) => g.garment.slot === 'base' || g.garment.kind === 'sweater');
  const [layers, setLayers] = useState<string[]>(() => (person.dressed ?? []).filter((id) => ready.some((g) => g.id === id && g.garment.slot === 'base')));
  const [name, setName] = useState('');
  const dress = useFeature('clothes.dress');
  const save = useFeature('clothes.save_outfit');
  const wear = useFeature('clothes.wear_outfit');
  const drop = useFeature('clothes.delete_outfit');
  const slots = (Object.keys(SLOT_LABEL) as Slot[]).filter((slot) => ready.some((g) => g.garment.slot === slot));
  // The choice for each part: what they picked, else what the day would put on.
  const choice = (slot: Slot) => picked[slot] ?? ready.find((g) => g.garment.slot === slot && today.includes(g.id))?.id ?? '';
  const ids = [...slots.map(choice).filter(Boolean), ...layers.filter((id) => layerable.some((g) => g.id === id) && !slots.map(choice).includes(id)), ...jewels.filter((id) => extras.some((g) => g.id === id))];
  const warmth = Math.round(ids.reduce((a, id) => { const g = ready.find((x) => x.id === id); return a + (g ? cloOf(g.garment.kind, g.garment.slot, g.label) : 0); }, 0) * 100) / 100;
  return (
    <Panel title="What To Wear" subtitle="Your choice is worn while it’s clean and to hand; whatever it leaves out, what’s already on the go, then the least washed">
      <LookRegion className="col gap-3">
        {onNow.length > 0 && <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}><p className="small" style={{ margin: 0 }}><span className="muted">Wearing Now: </span>{onNow.map((g, n) => <span key={g.id}>{n > 0 ? ', ' : ''}<Open subject={at('garment', g.id)}>{g.label}</Open></span>)}</p>{(() => { const fit = onNow.filter((g) => !toBasketRefusal(sim, person, g)); return fit.length > 0 ? <Gated feature="clothes.to_basket" className="btn btn-sm btn-ghost" title="Washed with the next load, whatever its count of wears says" onClick={() => { if (run('clothes.to_basket', { itemIds: fit.map((g) => g.id) }).ok) toast('In the laundry basket.', 'positive'); }}>Into The Laundry Basket</Gated> : null; })()}</div>}
        {missing.length > 0 && <div className="callout callout-warning small">{missing.map(({ item, why }, n) => <span key={item.id}>{n > 0 ? '; ' : ''}<Open subject={at('garment', item.id)}>{item.label}</Open> is {why}</span>)}: the day puts on something else in its place.</div>}
        {slots.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Nothing clean is to hand.</p> : (
          <div className="field-row field-row-tight">
            {slots.map((slot) => (
              <div key={slot} className="field">
                <label htmlFor={`wear-${slot}`}>{SLOT_LABEL[slot]}</label>
                <select id={`wear-${slot}`} value={choice(slot)} onChange={(e) => setPicked({ ...picked, [slot]: e.target.value })}>
                  <option value="">Whatever’s Next</option>
                  {ready.filter((g) => g.garment.slot === slot).map((g) => <option key={g.id} value={g.id}>{named(g)}</option>)}
                </select>
              </div>
            ))}
            <div className="field">
              <label htmlFor="outfit-name">Outfit Name</label>
              <input id="outfit-name" value={name} placeholder="For an audition" onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        {layerable.length > 0 && (
          <fieldset className="col gap-1" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted" style={{ padding: 0 }}>Layers, Under And Over</legend>
            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              {layerable.map((g) => (
                <label key={g.id} className="row gap-1 small">
                  <input type="checkbox" checked={layers.includes(g.id)} onChange={(e) => setLayers(e.target.checked ? [...layers, g.id] : layers.filter((id) => id !== g.id))} />
                  {named(g)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <p className="small muted" style={{ margin: 0 }}>{`Warmth: ${warmth} clo, ASHRAE’s measured garments summed. Below 10 °C, it decides how long you can be out.`}</p>
        {extras.length > 0 && (
          <fieldset className="col gap-1" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted" style={{ padding: 0 }}>Jewelry, Watches And Accessories</legend>
            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              {extras.map((g) => (
                <label key={g.id} className="row gap-1 small">
                  <input type="checkbox" checked={jewels.includes(g.id)} onChange={(e) => setJewels(e.target.checked ? [...jewels, g.id] : jewels.filter((id) => id !== g.id))} />
                  {named(g)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!dress.open || slots.length === 0} title={dress.reason} onClick={() => { if (run('clothes.dress', { itemIds: ids }).ok) toast('Chosen to wear.', 'positive'); }}>Wear These</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!change.open || ids.length === 0} title={change.reason ?? `Takes ${CHANGE_MINUTES} minutes, SLATE’s estimate`} onClick={() => { if (run('clothes.change', { itemIds: ids }).ok) toast('Changed.', 'positive'); }}>Change Into These Now</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!save.open || ids.length === 0 || !name.trim()} title={save.reason} onClick={() => { if (run('clothes.save_outfit', { name, itemIds: ids }).ok) { toast(`${name.trim()}, saved.`, 'positive'); setName(''); } }}>Save As An Outfit</button>
        </div>
        {outfits.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Outfit</th><th scope="col">In It</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {outfits.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td className="small">{(() => {
                      const inIt = o.itemIds.map((id) => garmentsOf(person).find((g) => g.id === id)).filter((g): g is Worn => Boolean(g));
                      if (inIt.length === 0) return 'None of it is yours any more';
                      return inIt.map((g, n) => <span key={g.id}>{n > 0 ? ', ' : ''}<Open subject={at('garment', g.id)}>{g.label}</Open>{(() => { const why = unwearable(sim, person, g); return why ? ` (${why})` : ''; })()}</span>);
                    })()}</td>
                    <td>
                      <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!wear.open} title={wear.reason ?? dressRefusal(sim, person, o.itemIds)} onClick={() => { if (run('clothes.wear_outfit', { outfitId: o.id }).ok) toast(`${o.name}, chosen.`, 'positive'); }}>Wear It</button>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!drop.open} title={drop.reason} onClick={() => run('clothes.delete_outfit', { outfitId: o.id })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LookRegion>
    </Panel>
  );
}

/** The shops of the country they're in, as a catalog, and one product chosen to buy. */
function Shop() {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const here = useWorld((s) => s.player.currentLocationId);
  const town = CITIES.get(here)?.name ?? 'Here';
  const entries = useWorld((s) => clothingCatalog(s, here), [here]);
  const [view, setView] = useCatalogView(`clothes-${here}`);
  const shown = arrange(entries, view);
  const [count, setCount] = useState(PAGE);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  if (entries.length === 0) {
    return <Panel title={`Shops In ${town}`}><p className="small muted" style={{ margin: 0 }}>SLATE doesn’t keep the clothes sold in this country yet: America, Britain, Ireland, Canada and Mexico so far.</p></Panel>;
  }
  return (
    <Panel title={`Shops In ${town}`} subtitle={`${entries.length} products from ${new Set(entries.map((e) => (e.value as ClothingProduct).retailer)).size} retailers`}>
      <div className="col gap-3">
        <CatalogControls id="clothes-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ department: 'Department', cut: 'Cut And Fit', type: 'Type', kind: 'Kind', special: 'Special Kinds', retailer: 'Retailer', where: 'Where' }} />
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Product</th><th scope="col">Retailer</th><th scope="col">Where</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {shown.slice(0, count).map((e) => {
                const p = e.value as ClothingProduct;
                return (
                  <tr key={e.id} aria-selected={e.id === chosen}>
                    <td>{p.name}{p.pack > 1 ? <span className="xs dim"> · {p.pack} in it</span> : null}</td>
                    <td className="small">{retailerById(p.retailer)?.name}</td>
                    <td className="small">{e.facets?.where}</td>
                    <td className="num mono">{catalogPrice(e, money)}</td>
                    <td className="row gap-1"><FavoriteToggle list="clothes" id={e.id} /><button type="button" className="btn btn-sm btn-ghost" onClick={() => setChosen(e.id === chosen ? undefined : e.id)}>{e.id === chosen ? 'Close' : 'Choose'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
        {chosen && <Choose key={chosen} productId={chosen} onPick={setChosen} />}
        {chosen === undefined && <div className="xs dim">{`${Math.min(count, shown.length)} of ${shown.length} shown.`}</div>}
      </div>
    </Panel>
  );
}

/** A product chosen: its size, color and how many, and buying it in a store here or online. */
function Choose({ productId, onPick }: { productId: string; onPick: (id: string) => void }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const p = productById(productId)!;
  const r = retailerById(p.retailer)!;
  // Your own size first: a size off doesn't fit (`sizeFor`, from 2026-10-02).
  const mine = sizeFor(sim, person, p.sizes, p);
  const sizes = sizeRun(p.sizes);
  const [size, setSize] = useState(mine ?? p.sizes[0] ?? '');
  const [color, setColor] = useState(p.colors[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [way, setWay] = useState<PayWith>('debit');
  const buy = useFeature('clothes.buy');
  const add = useFeature('clothes.basket_add');
  const options = { productId, size: size || undefined, color: color || undefined, quantity };
  const inStore = { ...options, how: 'store' as const };
  const online = { ...options, how: 'online' as const };
  const collect = { ...options, how: 'collect' as const };
  const collectNo = buyRefusal(person, collect);
  const collectQuote = purchaseQuote(sim, person, collect);
  const storeNo = buyRefusal(person, inStore);
  const onlineNo = buyRefusal(person, online);
  const storeQuote = purchaseQuote(sim, person, inStore);
  const onlineQuote = purchaseQuote(sim, person, online);
  const go = (how: 'store' | 'online') => {
    if (run('clothes.buy', { ...(how === 'store' ? inStore : online), payWith: how === 'online' && way === 'cash' ? 'debit' : way }).ok) toast(how === 'store' ? `${p.name}, bought.` : `${p.name}, ordered from ${r.name}.`, 'positive');
  };
  return (
    <div className="col gap-2">
      <div className="small"><strong>{p.name}</strong> · {p.brand}{p.material ? ` · ${p.material}` : ''}{p.careLabel ? ` · ${p.careLabel}` : ''}</div>
      {(() => {
        const others = otherSellers(sim, person.currentLocationId, p);
        return others.length > 0 ? (
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="xs muted">Also Sold By</span>
            {others.map((o) => <button key={o.product.id} type="button" className="btn btn-sm btn-ghost" onClick={() => onPick(o.product.id)}>{`${retailerById(o.product.retailer)?.name}, ${money(o.price)}`}</button>)}
          </div>
        ) : null;
      })()}
      <div className="field-row field-row-tight">
        {p.sizes.length > 0 && (
          <div className="field">
            <label htmlFor="buy-size">Size</label>
            <select id="buy-size" value={size} onChange={(e) => setSize(e.target.value)}>{(sizes.length ? sizes : p.sizes).map((s) => <option key={s} value={s}>{s === mine ? `${s} (Your Size)` : s}</option>)}</select>
          </div>
        )}
        {p.colors.length > 1 && (
          <div className="field">
            <label htmlFor="buy-color">Color</label>
            <select id="buy-color" value={color} onChange={(e) => setColor(e.target.value)}>{p.colors.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>
        )}
        <div className="field">
          <label htmlFor="buy-quantity">How Many</label>
          <select id="buy-quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </div>
        <div className="field">
          <label htmlFor="buy-pay">Pay With</label>
          <select id="buy-pay" value={way} onChange={(e) => setWay(e.target.value as PayWith)}>
            <option value="cash">Cash, In Store</option>
            <option value="credit">The Credit Card</option>
            <option value="debit">The Debit Card</option>
          </select>
        </div>
      </div>
      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" disabled={!buy.open || Boolean(storeNo)} title={storeNo ?? buy.reason} onClick={() => go('store')}>{`Buy In Store, ${money(storeQuote?.total ?? 0)}`}</button>
        <button type="button" className="btn btn-sm btn-ghost" disabled={!add.open || Boolean(storeNo)} title={storeNo ?? add.reason} onClick={() => { if (run('clothes.basket_add', inStore).ok) toast(`${p.name}, in the basket to buy in store.`, 'positive'); }}>Add To Basket, In Store</button>
        <button type="button" className="btn btn-sm btn-ghost" disabled={!add.open || Boolean(onlineNo)} title={onlineNo ?? add.reason} onClick={() => { if (run('clothes.basket_add', online).ok) toast(`${p.name}, in the basket to order online.`, 'positive'); }}>Add To Basket, Online</button>
        {!collectNo && <button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open} title={collectQuote?.arrivesAt ? `Ready ${formatDate(collectQuote.arrivesAt, sim.zone)} at ${r.name} where you live` : buy.reason} onClick={() => { if (run('clothes.buy', collect).ok) toast(`${p.name}, ordered to collect at ${r.name}.`, 'positive'); }}>{`Collect In Store, ${money(collectQuote?.total ?? 0)}`}</button>}
        <button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(onlineNo)} title={onlineNo ?? buy.reason} onClick={() => go('online')}>
          {onlineQuote ? `Order Online, ${money(onlineQuote.total)}` : 'Order Online'}
        </button>
      </div>
      {(() => {
        const chart = chartFor(person, p);
        if (!chart) return null;
        const cm = (v: readonly [number, number] | null) => (v ? `${v[0]}–${v[1]}` : '—');
        const chosen = size.trim().toUpperCase();
        return (
          <details className="small">
            <summary>{`Size Chart, ${chart.retailer}, ${chart.department === 'women' ? 'Women' : 'Men'}`}</summary>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Size</th><th scope="col" className="num">{chart.group === 'tops' ? (chart.department === 'women' ? 'Bust, Centimeters' : 'Chest, Centimeters') : 'Waist, Centimeters'}</th><th scope="col" className="num">Waist, Centimeters</th><th scope="col" className="num">Hip, Centimeters</th></tr></thead>
                <tbody>{chart.rows.map((row, i) => (
                  <tr key={i} style={row.labels.some((l) => l.trim().toUpperCase() === chosen) ? { fontWeight: 600 } : undefined}>
                    <td>{row.labels.join(' / ')}</td>
                    <td className="num mono">{cm(chart.group === 'tops' ? row.bust ?? row.chest : row.waist)}</td>
                    <td className="num mono">{cm(row.waist)}</td>
                    <td className="num mono">{cm(row.hip)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="xs dim">{chart.source ? <>The retailer’s own chart{chart.confirmed ? '' : ', read secondhand'}: <a href={chart.source} target="_blank" rel="noreferrer">{chart.source}</a></> : 'The retailer’s own chart.'}</div>
          </details>
        );
      })()}
      {p.url && <div className="xs dim">{`Its price and details as ${r.name} listed them${p.date ? ` on ${p.date}` : ''}${p.confirmed ? '' : ', read secondhand'}: `}<a href={p.url} target="_blank" rel="noreferrer">{p.url}</a></div>}
      <div className="xs dim">
        {storeNo ? `${storeNo} ` : ''}
        {!onlineNo && onlineQuote ? `Online: ${onlineQuote.delivery > 0 ? `${money(onlineQuote.delivery)} to deliver${r.freeOver !== null ? `, free over ${formatMoney(Math.round(r.freeOver * 100), p.currency, { cents: false })}` : ''}` : 'delivered free'}${r.feeEstimated ? ' (its fee not published: an estimate)' : ''}, arriving ${formatDate(onlineQuote.arrivesAt!, sim.zone)}${r.daysEstimated ? ' (an estimate)' : ''}. ` : ''}
        {r.returnDays !== null ? `Returns within ${r.returnDays} days, unworn.` : 'Its return window isn’t known.'}
      </div>
    </div>
  );
}

/** What's in the basket, a checkout to each retailer and way, each with its own delivery once (`clothes.checkout`). */
function Basket() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const lines = useWorld((s) => [...(s.player.basket ?? [])]);
  const out = useFeature('clothes.checkout');
  const drop = useFeature('clothes.basket_remove');
  const [way, setWay] = useState<PayWith>('debit');
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe));
  if (lines.length === 0) return null;
  const groups = new Map<string, BasketLine[]>();
  for (const l of lines) { const key = `${productById(l.productId)?.retailer}|${l.how}`; groups.set(key, [...(groups.get(key) ?? []), l]); }
  return (
    <Panel title="Basket" subtitle="Each retailer’s checks out on its own: one payment, and online one delivery for the order">
      <div className="col gap-3">
        <div className="field" style={{ maxWidth: '16rem' }}>
          <label htmlFor="basket-pay">Pay With</label>
          <select id="basket-pay" value={way} onChange={(e) => setWay(e.target.value as PayWith)}>
            <option value="cash">Cash, In Store</option>
            <option value="credit">The Credit Card</option>
            <option value="debit">The Debit Card</option>
          </select>
        </div>
        {[...groups.entries()].map(([key, group]) => {
          const [retailerId, how] = key.split('|') as [string, 'store' | 'online' | 'collect'];
          const r = retailerById(retailerId);
          const q = checkoutQuote(sim, person, group);
          const no = checkoutRefusal(person, group);
          return (
            <div key={key} className="col gap-1">
              <div className="strong small">{r?.name ?? 'A Retailer'}, {how === 'online' ? 'Online' : how === 'collect' ? 'To Collect In Store' : 'In Store'}</div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Item</th><th scope="col">Size</th><th scope="col" className="num">How Many</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {group.map((l, i) => (
                      <tr key={l.id}>
                        <td>{productById(l.productId)?.name}{l.color ? <span className="xs dim"> · {l.color}</span> : null}</td>
                        <td>{l.size ?? '—'}</td>
                        <td className="num mono">{l.quantity ?? 1}</td>
                        <td className="num mono">{q ? money(q.goods[i]!) : '—'}</td>
                        <td><button type="button" className="btn btn-sm btn-ghost" disabled={!drop.open} title={drop.reason} onClick={() => run('clothes.basket_remove', { lineId: l.id })}>Take Out</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {q && <div className="xs dim">{how === 'collect' ? `${q.delivery > 0 ? `Collection ${money(q.delivery)}` : 'Collected free'}, ready ${formatDate(q.arrivesAt!, sim.zone)}. ` : ''}{how === 'online' ? (q.delivery > 0 ? `Delivery ${money(q.delivery)}` : 'Delivered free') + `, arriving ${formatDate(q.arrivesAt!, sim.zone)}. ` : ''}{no ?? ''}</div>}
              <div><button type="button" className="btn btn-sm btn-primary" disabled={!out.open || Boolean(no)} title={no ?? out.reason} onClick={() => { const a = run<{ paid: number }>('clothes.checkout', { retailerId, how, payWith: how === 'store' || way !== 'cash' ? way : 'debit' }); if (a.ok) toast(`Checked out at ${r?.name}, ${money(a.value!.paid)}.`, 'positive'); }}>{q ? `Check Out, ${money(q.total)}` : 'Check Out'}</button></div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** Air Jordans: each pair's offers where you live, retail and resale, cheapest first, and selling one on (`sneakers.buy`, `sneakers.sell`). */
function Sneakers() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe), { cents: false });
  const buy = useFeature('sneakers.buy');
  const sell = useFeature('sneakers.sell');
  const [chosen, setChosen] = useState<string | undefined>();
  const [size, setSize] = useState('10');
  const listed = SNEAKERS.map((s) => ({ s, offers: sneakerOffers(sim, person, s.styleCode) })).filter((x) => x.offers.length > 0)
    .sort((a, b) => a.offers[0]!.total - b.offers[0]!.total);
  const owned = garmentsOf(person).filter((g) => g.spec?.styleCode);
  if (listed.length === 0 && owned.length === 0) return null;
  return (
    <Panel title="Sneakers" subtitle="Air Jordans by style code: each retailer’s price where you live, and GOAT’s new and used asks in America">
      <div className="col gap-3">
        {listed.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Sneaker</th><th scope="col">Style Code</th><th scope="col" className="num">From</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {listed.map(({ s, offers }) => (
                  <Fragment key={s.styleCode}>
                    <tr>
                      <td>{s.name}{s.colorway ? <div className="xs dim">{s.colorway}</div> : null}</td>
                      <td className="mono small">{s.styleCode}</td>
                      <td className="num mono">{money(offers[0]!.total)}</td>
                      <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => setChosen(chosen === s.styleCode ? undefined : s.styleCode)}>{chosen === s.styleCode ? 'Close' : 'See Offers'}</button></td>
                    </tr>
                    {chosen === s.styleCode && offers.map((o) => {
                      const no = sneakerRefusal(sim, person, s.styleCode, o.key, o.sizes.includes(size) ? size : o.sizes[0]!);
                      return (
                        <tr key={o.key}>
                          <td className="small">{o.seller}, {o.condition === 'new' ? 'New' : 'Used'}<div className="xs dim">{o.basis}{o.shipping === null ? '; its delivery isn’t kept' : ''}</div></td>
                          <td>
                            <label className="sr-only" htmlFor={`sneaker-size-${o.key}`}>Size</label>
                            <select id={`sneaker-size-${o.key}`} value={o.sizes.includes(size) ? size : o.sizes[0]} onChange={(e) => setSize(e.target.value)}>{o.sizes.map((z) => <option key={z} value={z}>{z}</option>)}</select>
                          </td>
                          <td className="num mono">{money(o.total)}</td>
                          <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('sneakers.buy', { styleCode: s.styleCode, offer: o.key, size: o.sizes.includes(size) ? size : o.sizes[0] }).ok) toast(`${s.name}, ordered from ${o.seller}.`, 'positive'); }}>Buy</button></td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {owned.map((g) => {
          const q = goatPayout(sim, person, g);
          return (
            <div key={g.id} className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="small"><Open subject={at('garment', g.id)}>{g.label}</Open>{g.spec?.size ? `, ${g.spec.size}` : ''}</span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!sell.open || typeof q === 'string'} title={typeof q === 'string' ? q : `GOAT’s ${q.condition} ask, $${q.ask}, less 9.5%, the $5 label and 2.9% to cash out`} onClick={() => { const a = run<{ paid: number }>('sneakers.sell', { itemId: g.id }); if (a.ok) toast(`Sold on GOAT, for ${money(a.value!.paid)}.`, 'positive'); }}>{typeof q === 'string' ? 'Sell On GOAT' : `Sell On GOAT, ${money(q.paid)}`}</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** What they've bought, and taking it back. */
function Bought() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const bought = useWorld((s) => [...(s.player.clothesBought ?? [])].reverse());
  const back = useFeature('clothes.return');
  const cancel = useFeature('clothes.cancel');
  const collectIt = useFeature('clothes.collect_order');
  const again = useFeature('clothes.basket_add');
  if (bought.length === 0) return null;
  return (
    <Panel title="Bought">
      <LookRegion>
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Purchase</th><th scope="col">From</th><th scope="col" className="num">Paid</th><th scope="col">Paid With</th><th scope="col">Bought</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {bought.map((b) => {
              const p = productById(b.productId);
              const r = retailerById(b.retailerId);
              const storeNo = returnRefusal(sim, person, b.id, 'store');
              const mailNo = returnRefusal(sim, person, b.id, 'mail');
              const fee = returnFee(sim, b, 'mail');
              return (
                <tr key={b.id}>
                  <td>{(() => { const first = purchaseItems(person, b.id).find((i) => i.garment); return first ? <Open subject={at('garment', first.id)}>{p?.name ?? 'Clothes'}</Open> : (p?.name ?? 'Clothes'); })()}{b.count > 1 ? <span className="xs dim"> · {b.count}</span> : null}</td>
                  <td className="small">{r?.name}</td>
                  <td className="num mono">{money(b.goods)}</td>
                  <td className="small">{(b.paidFrom ?? []).map((x) => sim.universe.accounts[x.accountId]?.name ?? 'An Account').join(', ') || '—'}</td>
                  <td className="small"><Open subject={at('receipt', b.id)}>{formatDate(b.at, sim.zone)}</Open>{b.canceledAt !== undefined ? ', canceled' : b.returnedAt !== undefined ? ', returned' : purchaseItems(person, b.id).some((i) => i.at.kind === 'order') ? ', on its way' : purchaseItems(person, b.id).some((i) => i.at.kind === 'service' && i.at.serviceId.startsWith('collect:')) ? ', ready to collect' : ''}</td>
                  <td>
                    {(() => { const no = buyRefusal(person, againOptions(b)); return <button type="button" className="btn btn-sm btn-ghost" disabled={!again.open || Boolean(no)} title={no ?? again.reason} onClick={() => { if (run('clothes.basket_add', { ...againOptions(b) }).ok) toast('In the basket again.', 'positive'); }}>Buy Again</button>; })()}
                    {b.returnedAt === undefined && b.canceledAt === undefined && (
                      <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                        {b.how === 'collect' && b.orderId && purchaseItems(person, b.id).some((i) => i.at.kind === 'service') && (() => { const no = collectRefusal(person, b.orderId!); return <button type="button" className="btn btn-sm btn-ghost" disabled={!collectIt.open || Boolean(no)} title={no ?? collectIt.reason} onClick={() => { if (run('clothes.collect_order', { orderId: b.orderId }).ok) toast('Collected.', 'positive'); }}>Collect It</button>; })()}
                        {b.how !== 'store' && purchaseItems(person, b.id).some((i) => i.at.kind === 'order') && <button type="button" className="btn btn-sm btn-ghost" disabled={!cancel.open || Boolean(cancelRefusal(person, b.id))} title={cancelRefusal(person, b.id) ?? cancel.reason} onClick={() => { if (run('clothes.cancel', { purchaseId: b.id }).ok) toast('Canceled, and refunded.', 'positive'); }}>Cancel The Order</button>}
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!back.open || Boolean(storeNo)} title={storeNo ?? back.reason} onClick={() => { if (run('clothes.return', { purchaseId: b.id, how: 'store' }).ok) toast('Returned, and refunded.', 'positive'); }}>Return In Store</button>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!back.open || Boolean(mailNo)} title={mailNo ?? back.reason} onClick={() => { if (run('clothes.return', { purchaseId: b.id, how: 'mail' }).ok) toast('Sent back, and refunded.', 'positive'); }}>{fee !== undefined && fee > 0 ? `Return By Mail, ${money(fee)}` : 'Return By Mail'}</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </LookRegion>
    </Panel>
  );
}

/** How much of a toiletry is left, in words. */
const supplyLeft = (left: number, unit: string) => (unit === 'ct' ? `${Math.round(left)} Left` : `${Math.round(left)} ${unit} Left`);

/** What's in the bathroom, and the toiletries on sale here, cheapest first. */
function Bathroom() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const here = useWorld((s) => s.player.currentLocationId);
  const kept = useWorld((s) => suppliesOf(s.player));
  const entries = useWorld((s) => toiletryCatalog(s, here), [here]);
  const [view, setView] = useCatalogView(`toiletries-${here}`);
  const shown = arrange(entries, view).slice(0, PAGE);
  const buy = useFeature('hygiene.buy');
  const useFirst = useFeature('hygiene.use_first');
  const shaveEvery = useFeature('hygiene.shave_every');
  return (
    <Panel title="Your Bathroom" subtitle="Each shower uses its soap and shampoo, each day its toothpaste and deodorant; what runs out is bought again on a free day">
      <LookRegion className="col gap-3">
        <div className="field" style={{ maxWidth: '18rem' }}>
          <label htmlFor="shave-every">Shave At Home</label>
          <select id="shave-every" disabled={!shaveEvery.open} title={shaveEvery.reason} value={person.shaves ?? ''} onChange={(e) => { if (run('hygiene.shave_every', { every: e.target.value || null }).ok) toast(e.target.value ? 'With the shower on its days: a razor’s share and 2 g of cream, five more minutes.' : 'No shaving at home.', 'positive'); }}>
            <option value="">Not At Home</option>
            <option value="weekly">Weekly</option>
            <option value="twice-weekly">Twice A Week</option>
            <option value="alternate">Every Other Day</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        {kept.length === 0 ? <p className="small muted" style={{ margin: 0 }}>SLATE doesn’t count toiletries where you live.</p> : (
          <div className="col gap-1 small">{kept.map((i) => (
            <div key={i.id} className="row-between">
              <span><Open subject={at('item', i.id)}>{i.label}</Open>{`: ${supplyLeft(i.supply.left, i.supply.unit)}`}{person.usesFirst?.[i.supply.kind] === i.kind && <span className="xs dim"> · Used First, Bought Again</span>}</span>
              {person.usesFirst?.[i.supply.kind] !== i.kind && <button type="button" className="btn btn-sm btn-ghost" disabled={!useFirst.open} title={useFirst.reason ?? 'Used before the others of its kind, and bought again when it runs out'} onClick={() => { if (run('hygiene.use_first', { productId: i.kind }).ok) toast(`${i.label}, used first.`, 'positive'); }}>Use This First</button>}
            </div>
          ))}</div>
        )}
        {entries.length > 0 && (
          <>
            <CatalogControls id="toiletries-catalog" entries={entries} view={view} onChange={setView} facets={{ kind: 'Kind', chain: 'Chain' }} />
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Product</th><th scope="col">Chain</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {shown.map((e) => {
                    const no = toiletryRefusal(person, e.id, 1);
                    return (
                      <tr key={e.id}>
                        <td>{e.label}</td>
                        <td className="small">{e.facets?.chain}</td>
                        <td className="num mono">{catalogPrice(e, money)}</td>
                        <td className="row gap-1"><FavoriteToggle list="toiletries" id={e.id} /><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('hygiene.buy', { productId: e.id, quantity: 1 }).ok) toast(`${e.label}, bought.`, 'positive'); }}>Buy</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Fine>What a shower and a day use is weighed use: 11.3 g of body wash and 11.76 g of shampoo a shower (Loretz et al., via the EPA), two pea-sized brushings of 0.25 g a day (the CDC), 0.898 g of deodorant a day, a toothbrush every three months (the ADA). Without soap a shower leaves you at most 85 clean, without shampoo 90, and a morning without toothpaste or deodorant starts five points down for each, SLATE’s estimates.</Fine>
      </LookRegion>
    </Panel>
  );
}

/** The town's barbers and salons, each service at its own price, tipped as the place tips. */
function Salons() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const here = useWorld((s) => s.player.currentLocationId);
  const since = useWorld((s) => daysSince(s, lastGroomed(s.player)));
  const groom = useFeature('hygiene.groom');
  const places = salonsIn(here);
  if (places.length === 0) return null;
  return (
    <Panel title="Barbers And Salons" subtitle={since === undefined ? 'You haven’t been to one in this life yet' : `Your last visit was ${since} ${since === 1 ? 'day' : 'days'} ago`}>
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Place</th><th scope="col">Service</th><th scope="col" className="num">With The Tip</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {places.flatMap((p) => p.services.map((svc) => {
              const q = groomingQuote(sim, p, svc.service);
              const no = groomingRefusal(sim, person, p.id, svc.service);
              return (
                <tr key={`${p.id}-${svc.service}`}>
                  <td>{p.name}<div className="xs dim">{p.neighborhood ?? p.address}</div></td>
                  <td className="small">{svc.label}</td>
                  <td className="num mono">{q ? `${money(q.price + q.tip)}${svc.from ? ' Up' : ''}` : 'Not Known'}</td>
                  <td><button type="button" className="btn btn-sm btn-ghost" style={{ whiteSpace: 'nowrap' }} disabled={!groom.open || Boolean(no)} title={no ?? groom.reason} onClick={() => { if (run('hygiene.groom', { salonId: p.id, service: svc.service }).ok) toast(`${svc.label} at ${p.name}.`, 'positive'); }}>Book It</button></td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      <Fine>Each place is real and each price its own list’s, read on the date it was; one not found is never shown as nothing. The tip is the custom’s middle: 15 to 20% in America and Canada (Emily Post), 10% in Britain (Debrett’s), 5 to 10% in Ireland, 10 to 20% in Mexico. A service with no time on its list takes 45 minutes, SLATE’s estimate.</Fine>
    </Panel>
  );
}

/** Clothes that no longer fit, and a tailor to take one in (`systems/tailoring.ts`). */
/** Your measurements, and whose charts you size by: a retailer's own chart picks your size where SLATE keeps one (`chartSize`). */
function YourMeasurements() {
  const { run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const m = person.measures;
  const [department, setDepartment] = useState<'women' | 'men'>(m?.department ?? 'women');
  const [chest, setChest] = useState(m?.chestCm ? String(m.chestCm) : '');
  const [waist, setWaist] = useState(m?.waistCm ? String(m.waistCm) : '');
  const [hip, setHip] = useState(m?.hipCm ? String(m.hipCm) : '');
  const [foot, setFoot] = useState(m?.footCm ? String(m.footCm) : '');
  const [finger, setFinger] = useState(m?.fingerMm ? String(m.fingerMm) : '');
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const save = () => { if (run('clothes.measures', { department, chestCm: num(chest), waistCm: num(waist), hipCm: num(hip), footCm: num(foot), fingerMm: num(finger) }).ok) toast('Your sizes now come from each retailer’s chart where it has one.', 'positive'); };
  return (
    <Panel title="Your Measurements" subtitle={m ? `Sized By The ${m.department === 'women' ? 'Women’s' : 'Men’s'} Charts` : 'By Body Mass Index Until Given'}>
      <div className="col gap-2">
        <div className="field-row">
          <div className="field">
            <label htmlFor="measure-dept">Charts</label>
            <select id="measure-dept" value={department} onChange={(e) => setDepartment(e.target.value === 'men' ? 'men' : 'women')}>
              <option value="men">Men’s</option>
              <option value="women">Women’s</option>
            </select>
          </div>
          <div className="field"><label htmlFor="measure-chest">Chest Or Bust, Centimeters</label><input id="measure-chest" inputMode="decimal" value={chest} onChange={(e) => setChest(e.target.value)} /></div>
          <div className="field"><label htmlFor="measure-waist">Waist, Centimeters</label><input id="measure-waist" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
          <div className="field"><label htmlFor="measure-hip">Hips, Centimeters</label><input id="measure-hip" inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} /></div>
          <div className="field"><label htmlFor="measure-foot">Foot, Centimeters</label><input id="measure-foot" inputMode="decimal" value={foot} onChange={(e) => setFoot(e.target.value)} /></div>
          <div className="field"><label htmlFor="measure-finger">Ring Finger Around, Millimeters</label><input id="measure-finger" inputMode="decimal" value={finger} onChange={(e) => setFinger(e.target.value)} /></div>
          <Gated feature="clothes.measures" className="btn btn-sm" onClick={save}>Keep These</Gated>
          {m && <Gated feature="clothes.measures" className="btn btn-sm btn-ghost" onClick={() => { if (run('clothes.measures', { clear: true }).ok) toast('Sized by body mass index again.', 'positive'); }}>Forget Them</Gated>}
        </div>
        <div className="xs dim">A top is sized by chest or bust, a bottom by waist and hips, a dress by bust and hips, a ring by the finger around on H.Samuel’s chart, and a shoe by foot length, and a shoe shorter than your foot won’t go on, against the retailer’s own chart for its market, where SLATE keeps one (H&M, Uniqlo, Zara, Gap, Old Navy, Levi’s, Marks & Spencer, Next and more). Elsewhere, and until you give them, your size is read from your body mass index.</div>
      </div>
    </Panel>
  );
}

function Fit() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const alter = useFeature('clothes.alter');
  const off = garmentsOf(person).filter((g) => g.at.kind !== 'service' && fitOf(person, g.garment) !== 'fits');
  const tailors = tailorsIn(person.currentLocationId).sort((a, b) => alterCost(sim, a) - alterCost(sim, b));
  const [tailorId, setTailorId] = useState('');
  if (!off.length) return null;
  const t = tailors.find((x) => x.id === tailorId) ?? tailors[0];
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe), { cents: false });
  return (
    <Panel title="Clothes That Don’t Fit" subtitle="More than a size off the weight they were bought for; not worn until they’re altered or replaced">
      <LookRegion className="col gap-2">
        {tailors.length > 1 && (
          <select aria-label="Tailor" value={t?.id ?? ''} onChange={(e) => setTailorId(e.target.value)} style={{ width: 'auto' }}>
            {tailors.map((x) => <option key={x.id} value={x.id}>{`${x.name}, ${x.from ? 'From ' : ''}${money(alterCost(sim, x))}`}</option>)}
          </select>
        )}
        {off.map((g) => {
          const no = t ? alterRefusal(person, g.id, t.id) : 'SLATE keeps no tailor where you are.';
          return (
            <div key={g.id} className="row-between small">
              <span><Open subject={at('garment', g.id)}>{g.label}</Open><span className="xs dim">{fitOf(person, g.garment) === 'big' ? ' · Too Big' : ' · Grown Out Of'}</span></span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!alter.open || Boolean(no)} title={no ?? alter.reason} onClick={() => { const a = run<{ readyAt: number }>('clothes.alter', { itemId: g.id, tailorId: t!.id }); if (a.ok) toast(`At ${t!.name}, ready ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive'); }}>{`${fitOf(person, g.garment) === 'big' ? 'Take It In' : 'Let It Out'}${t ? `, ${money(alterCost(sim, t))}` : ''}`}</button>
            </div>
          );
        })}
      </LookRegion>
    </Panel>
  );
}
