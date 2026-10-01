/**
 * Clothes (`systems/clothing.ts`, `systems/wardrobe.ts` and
 * `systems/hygiene.ts`, from 2026-10-01): the wardrobe and what's clean in
 * it, the dry cleaner, what to wear and the outfits put together, the
 * bathroom's toiletries, the town's barbers and salons, the shops of the
 * country they're in, cheapest first, and what they've bought, to take back
 * while they may.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { CatalogControls, catalogPrice, useCatalogView } from '@/ui/components/Catalog';
import { useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import type { Slot } from '@/engine/content/garmentcare';
import type { ClothingProduct } from '@/engine/content/clothingcatalog';
import { arrange } from '@/engine/systems/catalog';
import { reachable, type Item } from '@/engine/systems/items';
import { cleanOutfits, dryCleanDirty, garmentsOf, outfitFor, wearable, washableDirty, type Garment } from '@/engine/systems/wardrobe';
import { groomingQuote, groomingRefusal, salonsIn, suppliesOf, toiletryCatalog, toiletryRefusal, lastGroomed, daysSince } from '@/engine/systems/hygiene';
import { alterCost, alterRefusal, fitOf, tailorsIn } from '@/engine/systems/tailoring';
import { buyRefusal, clothingCatalog, dryCleanPrice, productById, purchaseItems, purchaseQuote, readyToCollect, retailerById, returnFee, returnRefusal } from '@/engine/systems/clothing';

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
        <div className="eyebrow">Your Day</div>
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
        <Fit />
        <Bathroom />
        <Salons />
        <Shop />
        <Bought />
        <Fine>
          The shops are real retailers and the clothes their real products, at the regular prices their pages listed on the date each was read, in the money of the country they’re sold in: with VAT or IVA in Britain, Ireland and Mexico, and with the town’s sales tax added in America and Canada, none on clothing under $110 an item in New York. A store sells where SLATE has its address; online, a retailer delivers in its own country, at its published fee, free over its threshold, in its working days, or its country’s middle figure where it published none, said so. A return is unworn and unwashed, inside the retailer’s window, to a store free where it takes them there, or by mail at its fee; the delivery isn’t refunded. Dry cleaning is a real shop’s list in the town, or New York’s at the town’s cost of living, and two days, SLATE’s estimate. The clothes a life begins with are unbranded, SLATE’s.
        </Fine>
      </div>
    </>
  );
}

/** What to put on: a garment for each part, from what's to hand, and the outfits put together. */
function WhatToWear() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const ready = useWorld((s) => garmentsOf(s.player).filter((g) => wearable(s, s.player, g)));
  const today = useWorld((s) => (outfitFor(s, s.player) ?? []).map((g) => g.id));
  const outfits = useWorld((s) => s.player.outfits ?? []);
  const [picked, setPicked] = useState<Partial<Record<Slot, string>>>({});
  const [name, setName] = useState('');
  const dress = useFeature('clothes.dress');
  const save = useFeature('clothes.save_outfit');
  const wear = useFeature('clothes.wear_outfit');
  const drop = useFeature('clothes.delete_outfit');
  const slots = (Object.keys(SLOT_LABEL) as Slot[]).filter((slot) => ready.some((g) => g.garment.slot === slot));
  // The choice for each part: what they picked, else what the day would put on.
  const choice = (slot: Slot) => picked[slot] ?? ready.find((g) => g.garment.slot === slot && today.includes(g.id))?.id ?? '';
  const ids = slots.map(choice).filter(Boolean);
  return (
    <Panel title="What To Wear" subtitle="Your choice is worn while it’s clean and to hand; whatever it leaves out, what’s already on the go, then the least washed">
      <div className="col gap-3">
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
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!dress.open || slots.length === 0} title={dress.reason} onClick={() => { if (run('clothes.dress', { itemIds: ids }).ok) toast('Chosen to wear.', 'positive'); }}>Wear These</button>
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
                    <td className="small">{o.itemIds.map((id) => garmentsOf(person).find((g) => g.id === id)).filter((g): g is Worn => Boolean(g)).map((g) => `${g.label}${reachable(sim, person, g.at) ? '' : ' (not to hand)'}`).join(', ') || 'None of it is yours any more'}</td>
                    <td>
                      <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!wear.open} title={wear.reason} onClick={() => { if (run('clothes.wear_outfit', { outfitId: o.id }).ok) toast(`${o.name}, chosen.`, 'positive'); }}>Wear It</button>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!drop.open} title={drop.reason} onClick={() => run('clothes.delete_outfit', { outfitId: o.id })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
        <CatalogControls id="clothes-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setCount(PAGE); }} facets={{ kind: 'Kind', retailer: 'Retailer' }} />
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
                    <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => setChosen(e.id === chosen ? undefined : e.id)}>{e.id === chosen ? 'Close' : 'Choose'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length > count && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCount(count + PAGE)}>{shown.length - count <= PAGE ? `Show The Last ${shown.length - count}` : `Show ${PAGE} More Of ${shown.length - count}`}</button>}
        {chosen && <Choose key={chosen} productId={chosen} />}
        {chosen === undefined && <div className="xs dim">{`${Math.min(count, shown.length)} of ${shown.length} shown.`}</div>}
      </div>
    </Panel>
  );
}

/** A product chosen: its size, color and how many, and buying it in a store here or online. */
function Choose({ productId }: { productId: string }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const p = productById(productId)!;
  const r = retailerById(p.retailer)!;
  const [size, setSize] = useState(p.sizes[0] ?? '');
  const [color, setColor] = useState(p.colors[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const buy = useFeature('clothes.buy');
  const options = { productId, size: size || undefined, color: color || undefined, quantity };
  const inStore = { ...options, how: 'store' as const };
  const online = { ...options, how: 'online' as const };
  const storeNo = buyRefusal(person, inStore);
  const onlineNo = buyRefusal(person, online);
  const storeQuote = purchaseQuote(sim, person, inStore);
  const onlineQuote = purchaseQuote(sim, person, online);
  const go = (how: 'store' | 'online') => {
    if (run('clothes.buy', how === 'store' ? inStore : online).ok) toast(how === 'store' ? `${p.name}, bought.` : `${p.name}, ordered from ${r.name}.`, 'positive');
  };
  return (
    <div className="col gap-2">
      <div className="small"><strong>{p.name}</strong> · {p.brand}{p.material ? ` · ${p.material}` : ''}{p.careLabel ? ` · ${p.careLabel}` : ''}</div>
      <div className="field-row field-row-tight">
        {p.sizes.length > 0 && (
          <div className="field">
            <label htmlFor="buy-size">Size</label>
            <select id="buy-size" value={size} onChange={(e) => setSize(e.target.value)}>{p.sizes.map((s) => <option key={s} value={s}>{s}</option>)}</select>
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
      </div>
      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" disabled={!buy.open || Boolean(storeNo)} title={storeNo ?? buy.reason} onClick={() => go('store')}>{`Buy In Store, ${money(storeQuote?.total ?? 0)}`}</button>
        <button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(onlineNo)} title={onlineNo ?? buy.reason} onClick={() => go('online')}>
          {onlineQuote ? `Order Online, ${money(onlineQuote.total)}` : 'Order Online'}
        </button>
      </div>
      <div className="xs dim">
        {storeNo ? `${storeNo} ` : ''}
        {!onlineNo && onlineQuote ? `Online: ${onlineQuote.delivery > 0 ? `${money(onlineQuote.delivery)} to deliver${r.freeOver !== null ? `, free over ${formatMoney(Math.round(r.freeOver * 100), p.currency, { cents: false })}` : ''}` : 'delivered free'}${r.feeEstimated ? ' (its fee not published: an estimate)' : ''}, arriving ${formatDate(onlineQuote.arrivesAt!, sim.zone)}${r.daysEstimated ? ' (an estimate)' : ''}. ` : ''}
        {r.returnDays !== null ? `Returns within ${r.returnDays} days, unworn.` : 'Its return window isn’t known.'}
      </div>
    </div>
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
  if (bought.length === 0) return null;
  return (
    <Panel title="Bought">
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Purchase</th><th scope="col">From</th><th scope="col" className="num">Paid</th><th scope="col">Bought</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {bought.map((b) => {
              const p = productById(b.productId);
              const r = retailerById(b.retailerId);
              const storeNo = returnRefusal(sim, person, b.id, 'store');
              const mailNo = returnRefusal(sim, person, b.id, 'mail');
              const fee = returnFee(sim, b, 'mail');
              return (
                <tr key={b.id}>
                  <td>{p?.name ?? 'Clothes'}{b.count > 1 ? <span className="xs dim"> · {b.count}</span> : null}</td>
                  <td className="small">{r?.name}</td>
                  <td className="num mono">{money(b.goods)}</td>
                  <td className="small">{formatDate(b.at, sim.zone)}{b.returnedAt !== undefined ? ', returned' : purchaseItems(person, b.id).some((i) => i.at.kind === 'order') ? ', on its way' : ''}</td>
                  <td>
                    {b.returnedAt === undefined && (
                      <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
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
  return (
    <Panel title="Your Bathroom" subtitle="Each shower uses its soap and shampoo, each day its toothpaste and deodorant; what runs out is bought again on a free day">
      <div className="col gap-3">
        {kept.length === 0 ? <p className="small muted" style={{ margin: 0 }}>SLATE doesn’t count toiletries where you live.</p> : (
          <div className="small">{kept.map((i) => `${i.label}: ${supplyLeft(i.supply.left, i.supply.unit)}`).join(' · ')}</div>
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
                        <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('hygiene.buy', { productId: e.id, quantity: 1 }).ok) toast(`${e.label}, bought.`, 'positive'); }}>Buy</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Fine>What a shower and a day use is weighed use: 11.3 g of body wash and 11.76 g of shampoo a shower (Loretz et al., via the EPA), two pea-sized brushings of 0.25 g a day (the CDC), 0.898 g of deodorant a day, a toothbrush every three months (the ADA). Without soap a shower leaves you at most 85 clean, without shampoo 90, and a morning without toothpaste or deodorant starts five points down for each, SLATE’s estimates.</Fine>
      </div>
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
    <Panel title="Clothes That Don’t Fit" subtitle="More than a size off the weight they were bought for; not worn until they’re taken in or replaced">
      <div className="col gap-2">
        {tailors.length > 1 && (
          <select aria-label="Tailor" value={t?.id ?? ''} onChange={(e) => setTailorId(e.target.value)} style={{ width: 'auto' }}>
            {tailors.map((x) => <option key={x.id} value={x.id}>{`${x.name}, ${x.from ? 'From ' : ''}${money(alterCost(sim, x))}`}</option>)}
          </select>
        )}
        {off.map((g) => {
          const no = t ? alterRefusal(person, g.id, t.id) : 'SLATE keeps no tailor where you are.';
          return (
            <div key={g.id} className="row-between small">
              <span>{g.label}<span className="xs dim">{fitOf(person, g.garment) === 'big' ? ' · Too Big' : ' · Grown Out Of'}</span></span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!alter.open || Boolean(no)} title={no ?? alter.reason} onClick={() => { const a = run<{ readyAt: number }>('clothes.alter', { itemId: g.id, tailorId: t!.id }); if (a.ok) toast(`At ${t!.name}, ready ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive'); }}>{t ? `Take It In, ${money(alterCost(sim, t))}` : 'Take It In'}</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
