/**
 * SLATE — Land: the parcels you own, and buying land where you live at its
 * published value, the buyer's taxes on the quote (`systems/land.ts`, from
 * 2026-09-29).
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { homeOf } from '@/engine/systems/earnings';
import { buyLandRefusal, landQuote, landValue, marketsFor, parcelsOf, saleProceeds, splitRefusal } from '@/engine/systems/land';
import { DAYS_TO_SELL, LAND_MARKETS, LAND_SOURCE, LAND_TAX, areaWords } from '@/engine/content/land';

export function LandWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const inHome = (c: number, from: string) => formatMoney(inSaveMoney(sim, c, from), cur);
  const markets = marketsFor(homeOf(person));
  const [pick, setPick] = useState(-1);
  const chosen = markets.find(({ i }) => i === pick) ?? markets[0];
  const [size, setSize] = useState(0);
  const acres = chosen ? chosen.m.sizes[Math.min(size, chosen.m.sizes.length - 1)]! : 0;
  const q = chosen ? landQuote(chosen.i, acres, sim.now) : undefined;
  const no = chosen ? buyLandRefusal(person, chosen.i, acres) : 'SLATE sells no land where you live yet: Mexico City’s land values are published only as scanned images.';
  const owned = parcelsOf(person).filter((p) => p.soldAt === undefined);
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Land</h1>
        <p className="muted">A parcel of your own: a town lot or acreage, at the value published for land where you live.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Land">
          {!owned.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Parcel</th><th scope="col">Size</th><th scope="col" className="num">Worth</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {owned.map((p) => {
                    const m = LAND_MARKETS[p.market]!;
                    const worth = landValue(m, p.acres, sim.now);
                    const twin = owned.find((o) => o.id !== p.id && !o.selling && LAND_MARKETS[o.market]!.label === m.label);
                    return (
                      <tr key={p.id}>
                        <td>{m.label}</td>
                        <td>{areaWords(p.acres, m.place)}</td>
                        <td className="num mono">{inHome(worth, m.currency)}</td>
                        <td className="small">{p.selling ? `For Sale, Closing ${formatDate(p.selling.closesAt, sim.zone)}` : `Since ${formatDate(p.boughtAt, sim.zone)}`}</td>
                        <td>
                          <div className="row gap-2">
                            {!p.selling && <Gated feature="land.sell" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ closesAt: number }>('land.sell', { parcelId: p.id }); if (a.ok) toast(`For sale: it closes ${formatDate(a.value!.closesAt, sim.zone)}, for ${inHome(saleProceeds(m, worth).net, m.currency)} after the seller’s taxes.`, 'positive'); }}>Put It Up For Sale</Gated>}
                            {!p.selling && <Gated feature="land.split" className="btn btn-sm btn-ghost" disabled={Boolean(splitRefusal(p))} title={splitRefusal(p)} onClick={() => { if (run('land.split', { parcelId: p.id }).ok) toast('Split in two.', 'positive'); }}>Split It</Gated>}
                            {!p.selling && twin && <Gated feature="land.combine" className="btn btn-sm btn-ghost" onClick={() => { if (run('land.combine', { a: p.id, b: twin.id }).ok) toast('Combined into one.', 'positive'); }}>Combine Them</Gated>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Buy Land" subtitle={chosen ? 'Where you live' : 'Not where you live yet'}>
          <div className="col gap-3">
            {chosen && (
              <div className="field-row field-row-tight">
                <div className="field">
                  <label htmlFor="land-where">Land</label>
                  <select id="land-where" value={chosen.i} onChange={(e) => { setPick(Number(e.target.value)); setSize(0); }}>
                    {markets.map(({ m, i }) => <option key={i} value={i}>{m.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="land-size">Size</label>
                  <select id="land-size" value={Math.min(size, chosen.m.sizes.length - 1)} onChange={(e) => setSize(Number(e.target.value))}>
                    {chosen.m.sizes.map((s, i) => <option key={s} value={i}>{areaWords(s, chosen.m.place)}</option>)}
                  </select>
                </div>
              </div>
            )}
            {q && chosen && (
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
                  <tbody>
                    <tr><td>{chosen.m.label}, {areaWords(acres, chosen.m.place)}</td><td className="num mono">{inHome(q.price, q.currency)}</td></tr>
                    {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, q.currency)}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(q.total, q.currency)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            {chosen && (
              <div className="grid grid-3">
                <Stat label="Zoning" value={chosen.m.zoning ? chosen.m.zoning.name : 'Farmland'} note={chosen.m.zoning ? `It builds ${chosen.m.zoning.builds}` : 'No house without permission'} />
                <Stat label="Tax A Year" value={LAND_TAX[chosen.m.place] ? `${(LAND_TAX[chosen.m.place]!.rate * 100).toFixed(2)}% Of Value` : 'None Kept'} note={LAND_TAX[chosen.m.place]?.basis ?? 'None on vacant land here, or not kept'} />
                <Stat label="To Sell" value={`About ${DAYS_TO_SELL} Days`} note="A broker’s 2025 US figure, taken everywhere" />
              </div>
            )}
            {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
            <div className="row gap-2">
              <Gated feature="land.buy" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
                if (!chosen) return;
                const a = run<{ parcelId: string; paid: number }>('land.buy', { market: chosen.i, acres });
                if (a.ok) toast(`Bought, for ${money(a.value!.paid)}.`, 'positive');
              }}>Buy It</Gated>
            </div>
            <Fine>{q?.basis ?? ''} A town lot is the zoning’s smallest; its value is held at its figure’s year where the source publishes no change. A buyer’s survey, title insurance and lawyer, whose prices no authority publishes, aren’t kept. Sources: {LAND_SOURCE}.</Fine>
          </div>
        </Panel>
      </div>
    </>
  );
}
