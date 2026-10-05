/**
 * A shop of devices sold by make and model (from 2026-10-05: televisions and
 * speakers, `systems/devices.ts`): the models sold where they live, cheapest
 * first with the place's tax, searched and filtered, a page at a time,
 * compared and marked favorite, and bought in a color where a model comes in
 * more than one. Each device names its own facets, columns and compared rows.
 */
import { useState, type ReactNode } from 'react';
import { useGame } from '@/app/game-context';
import { formatMoney, saveCurrency, type Money } from '@/engine/core/money';
import { arrange, type CatalogEntry } from '@/engine/systems/catalog';
import type { CatalogOffer, CatalogProduct } from '@/engine/content/products';
import { colorsOfProduct } from '@/engine/systems/devices';
import type { useFeature } from '@/ui/guide/Guide';
import { CatalogControls, CompareTable, CompareToggle, FavoriteToggle, ShowMore, useCatalogView, useCompare, usePaged } from '@/ui/components/Catalog';

export interface DeviceRow { product: CatalogProduct; offer: CatalogOffer; price: Money }

export function DeviceShop({ list, title, shop, refusal, command, gate, bought, facets, facetsOf, columns, compare, fine, payload, buyLabel }: {
  /** The command buying runs, and its guide gate, opened by the panel with its own name so the guide and the interface read it. */
  list: string; title: string; shop: readonly DeviceRow[]; refusal: (offerId: string) => string | undefined; command: string; gate: ReturnType<typeof useFeature>; bought: (label: string) => string;
  facets: Readonly<Record<string, string>>; facetsOf: (r: DeviceRow) => Record<string, string>;
  columns: readonly { head: string; num?: boolean; cell: (r: DeviceRow) => ReactNode }[];
  compare: readonly { label: string; value: (r: DeviceRow) => string }[]; fine: ReactNode;
  /** What else the command is sent, and the button's word (from 2026-10-05: a set of tires names its car, and is fitted). */
  payload?: Readonly<Record<string, unknown>>; buyLabel?: string;
}) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const [view, setView] = useCatalogView(list);
  const [shownCount, more] = usePaged(list);
  const [compared, toggleCompare, clearCompare] = useCompare(list);
  const [colors, setColors] = useState<Record<string, string>>({});
  if (shop.length === 0) return null;
  const entries: CatalogEntry<DeviceRow>[] = shop.map((r) => ({
    id: r.offer.id, label: `${r.product.brand} ${r.offer.code ?? r.product.model}`, price: r.price, priceKind: 'advertised', basis: 'Each, with the tax as the place shows it',
    facets: facetsOf(r), words: [r.product.family, r.product.model, r.offer.seller].filter(Boolean).join(' '), value: r,
  }));
  const arranged = arrange(entries, view);
  const page = arranged.slice(0, shownCount);
  const chosen = compared.map((id) => entries.find((e) => e.id === id)).filter((e): e is CatalogEntry<DeviceRow> => Boolean(e));
  return (
    <div className="col gap-2">
      <div className="strong small">{title}</div>
      <CatalogControls id={`${list}-catalog`} entries={entries} view={view} onChange={setView} facets={facets} />
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Model</th>{columns.map((c) => <th key={c.head} scope="col" className={c.num ? 'num' : undefined}>{c.head}</th>)}<th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Choose</span></th></tr></thead>
          <tbody>
            {page.map((e) => {
              const r = e.value;
              const no = refusal(r.offer.id);
              const offered = colorsOfProduct(r.product);
              const color = colors[r.offer.id] ?? offered[0];
              return (
                <tr key={r.offer.id}>
                  <td>{e.label}<div className="xs dim">{[r.product.family, r.offer.seller].filter(Boolean).join(' · ')}</div></td>
                  {columns.map((c) => <td key={c.head} className={c.num ? 'num small' : 'small'}>{c.cell(r)}</td>)}
                  <td className="num mono">{money(r.price)}</td>
                  <td>
                    <div className="row gap-1" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {offered.length > 1 && <select aria-label={`Color Of ${e.label}`} value={color} onChange={(ev) => setColors((x) => ({ ...x, [r.offer.id]: ev.target.value }))}>{offered.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
                      <FavoriteToggle list={list} id={r.offer.id} />
                      <CompareToggle on={compared.includes(r.offer.id)} onToggle={() => toggleCompare(r.offer.id)} />
                      <button type="button" className="btn btn-sm btn-ghost" disabled={!gate.open || Boolean(no)} title={no ?? gate.reason} onClick={() => { if (run(command, { ...payload, offerId: r.offer.id, ...(offered.length > 1 && color ? { color } : {}) }).ok) toast(bought(`${e.label}${offered.length > 1 && color ? `, ${color}` : ''}`), 'positive'); }}>{buyLabel ?? 'Buy'}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {arranged.length === 0 && <div className="small">None sold here matches that; clear the search or a filter.</div>}
      <ShowMore shown={page.length} total={arranged.length} onMore={more} />
      <CompareTable heads={chosen.map((e) => e.label)} onClear={clearCompare} rows={[
        { label: 'Price', values: chosen.map((e) => money(e.value.price)) },
        ...compare.map((c) => ({ label: c.label, values: chosen.map((e) => c.value(e.value)) })),
        { label: 'Colors', values: chosen.map((e) => colorsOfProduct(e.value.product).join(', ') || '—') },
      ]} />
      <div className="xs dim">{fine}</div>
    </div>
  );
}
