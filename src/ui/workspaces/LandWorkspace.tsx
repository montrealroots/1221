/**
 * SLATE — Land: the parcels you own; the land listed where you live, an
 * offer on it and the deal to its closing (`systems/land.ts`, from
 * 2026-09-29). Until 2026-09-29 it bought land at once at its value.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { centsFromTyped, formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { homeOf } from '@/engine/systems/earnings';
import { landBuyingOf, landQuote, landValue, listingsFor, offerRefusal, parcelsOf, saleProceeds, splitRefusal, type LandAnswer } from '@/engine/systems/land';
import { DAYS_TO_SELL, LAND_DEAL, LAND_MARKETS, LAND_SOURCE, LAND_TAX, areaWords } from '@/engine/content/land';

/**
 * One precision down a column of money, so its right edge lines up: whole
 * units where every figure is whole, cents on all where any has them.
 * `formatMoney` alone drops cents from 100,000 up.
 */
const columnOf = (amounts: number[], currency: string) => {
  const cents = amounts.some((c) => c % 100 !== 0);
  return (c: number) => formatMoney(c, currency, { cents });
};

export function LandWorkspace() {
  const person = useWorld((s) => s.player);
  const deal = landBuyingOf(person).deal;
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Land</h1>
        <p className="muted">A parcel of your own: a town lot or acreage, listed where you live near the value published for land there.</p>
      </div>
      <div className="col gap-5">
        <YourLand />
        {deal ? <YourDeal /> : <ForSale />}
      </div>
    </>
  );
}

function YourLand() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const owned = parcelsOf(person).filter((p) => p.soldAt === undefined);
  return (
    <Panel title="Your Land">
      {!owned.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Parcel</th><th scope="col">Size</th><th scope="col" className="num">Worth</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {owned.map((p) => {
                const m = LAND_MARKETS[p.market]!;
                const money = (c: number) => formatMoney(c, m.currency, { cents: false });
                const worth = landValue(m, p.acres, sim.now);
                const twin = owned.find((o) => o.id !== p.id && !o.selling && LAND_MARKETS[o.market]!.label === m.label);
                return (
                  <tr key={p.id}>
                    <td>{m.label}</td>
                    <td>{areaWords(p.acres, m.place)}</td>
                    <td className="num mono">{money(worth)}</td>
                    <td className="small">{p.selling ? `For Sale, Closing ${formatDate(p.selling.closesAt, sim.zone)}` : `Since ${formatDate(p.boughtAt, sim.zone)}`}</td>
                    <td>
                      <div className="row gap-2">
                        {!p.selling && <Gated feature="land.sell" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ closesAt: number }>('land.sell', { parcelId: p.id }); if (a.ok) toast(`For sale: it closes ${formatDate(a.value!.closesAt, sim.zone)}, for ${money(saleProceeds(m, worth).net)} after the seller’s taxes.`, 'positive'); }}>Put It Up For Sale</Gated>}
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
  );
}

/** The offer accepted: the deposit, the day one's bound, the closing, and walking away. */
function YourDeal() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const deal = landBuyingOf(person).deal!;
  const m = LAND_MARKETS[deal.listing.market]!;
  const money = (c: number) => formatMoney(c, m.currency);
  const rule = LAND_DEAL.deposit[m.place];
  const free = sim.now < deal.diligenceUntil;
  const q = landQuote(deal.listing.market, deal.listing.acres, sim.now, deal.price);
  const line = columnOf([q.price, ...q.lines.map((l) => l.amount), q.total], m.currency);
  return (
    <Panel title="Your Offer, Accepted" subtitle={`${m.label}, ${areaWords(deal.listing.acres, m.place)}`}>
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="Price" value={money(deal.price)} note={`${money(q.total)} with what buying it costs`} />
          <Stat label="Deposit" value={money(deal.deposit)} note={deal.escrowAccountId ? 'Paid, and held' : `Paid on exchange, ${formatDate(deal.diligenceUntil, sim.zone)}`} />
          <Stat label="Closing" value={formatDate(deal.closesAt, sim.zone)} note={free ? `Free to walk away until ${formatDate(deal.diligenceUntil, sim.zone)}` : 'Bound: walking away loses the deposit'} tone={free ? undefined : 'warning'} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
            <tbody>
              <tr><td>The Price</td><td className="num mono">{line(q.price)}</td></tr>
              {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{line(l.amount)}</td></tr>)}
              <tr><th scope="row">In All</th><td className="num mono">{line(q.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="row gap-2">
          <Gated feature="land.withdraw" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ depositBack: boolean }>('land.withdraw', {}); if (a.ok) toast(a.value!.depositBack ? 'Walked away, the deposit back.' : 'Walked away; the seller kept the deposit.', 'neutral'); }}>Walk Away</Gated>
        </div>
        <Fine>The deposit is {Math.round(rule.share * 100)}%, paid {rule.at === 'accept' ? 'when the offer was accepted' : 'when contracts are exchanged'}. The time to look into the land and the closing day are SLATE’s estimates; no authority publishes either.</Fine>
      </div>
    </Panel>
  );
}

/** The land listed where you live, and an offer on one. */
function ForSale() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const listings = useWorld((s) => listingsFor(s, s.player, homeOf(s.player)));
  const [pick, setPick] = useState('');
  const listing = listings.find((l) => l.id === pick) ?? listings[0];
  const [typed, setTyped] = useState('');
  const counter = landBuyingOf(person).counter;
  const standing = counter && listing && counter.listingId === listing.id && counter.until >= sim.now ? counter : undefined;
  if (!listing) return <Panel title="For Sale"><p className="small" style={{ margin: 0 }}>SLATE lists no land where you live yet: Mexico City’s land values are published only as scanned images.</p></Panel>;
  const m = LAND_MARKETS[listing.market]!;
  const money = (c: number) => formatMoney(c, m.currency);
  const price = typed ? centsFromTyped(typed) : standing?.price ?? listing.asking;
  const q = landQuote(listing.market, listing.acres, sim.now, price);
  const no = offerRefusal(sim, person, listing.id, price);
  const line = columnOf([q.price, ...q.lines.map((l) => l.amount), q.total], m.currency);
  const offer = () => {
    const a = run<{ answer: LandAnswer['answer']; price?: number }>('land.offer', { listingId: listing.id, price });
    if (!a.ok) return;
    if (a.value!.answer === 'accepted') toast(`Accepted at ${money(price)}. It closes in ${LAND_DEAL.closingDays} days.`, 'positive');
    else if (a.value!.answer === 'countered') { toast(`The seller countered at ${money(a.value!.price!)}; it stands two days.`, 'neutral'); setTyped(''); }
    else toast('The seller turned it down.', 'neutral');
  };
  return (
    <Panel title="For Sale" subtitle="Listed where you live this month">
      <div className="col gap-3">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Land</th><th scope="col">Size</th><th scope="col" className="num">Asking</th><th scope="col">Listed</th><th scope="col"><span className="sr-only">Choose</span></th></tr></thead>
            <tbody>
              {listings.map((l) => {
                const lm = LAND_MARKETS[l.market]!;
                return (
                  <tr key={l.id}>
                    <td>{lm.label}</td>
                    <td>{areaWords(l.acres, lm.place)}</td>
                    <td className="num mono">{formatMoney(l.asking, lm.currency, { cents: false })}</td>
                    <td className="small">{formatDate(l.listedAt, sim.zone)}</td>
                    <td><button type="button" className={`btn btn-sm ${l.id === listing.id ? '' : 'btn-ghost'}`} aria-pressed={l.id === listing.id} onClick={() => { setPick(l.id); setTyped(''); }}>{l.id === listing.id ? 'Chosen' : 'Choose'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="field-row field-row-tight">
          <div className="field">
            <label htmlFor="land-price">Your Offer</label>
            <input id="land-price" inputMode="decimal" value={typed} placeholder={String(price / 100)} onChange={(e) => setTyped(e.target.value)} />
          </div>
        </div>
        {standing && <p className="small" style={{ margin: 0 }}>The seller countered at {money(standing.price)}, until {formatDate(standing.until, sim.zone)}. Offer it and it’s yours.</p>}
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
            <tbody>
              <tr><td>{m.label}, {areaWords(listing.acres, m.place)}</td><td className="num mono">{line(q.price)}</td></tr>
              {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{line(l.amount)}</td></tr>)}
              <tr><th scope="row">In All</th><td className="num mono">{line(q.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="grid grid-3">
          <Stat label="Zoning" value={m.zoning ? m.zoning.name : 'Farmland'} note={m.zoning ? `It builds ${m.zoning.builds}` : 'No house without permission'} />
          <Stat label="Tax A Year" value={LAND_TAX[m.place] ? `${(LAND_TAX[m.place]!.rate * 100).toFixed(2)}% Of Value` : 'None Kept'} note={LAND_TAX[m.place]?.basis ?? 'None on vacant land here, or not kept'} />
          <Stat label="Deposit" value={`${Math.round(LAND_DEAL.deposit[m.place].share * 100)}%`} note={LAND_DEAL.deposit[m.place].at === 'accept' ? 'Paid when the offer is accepted' : 'Paid when contracts are exchanged'} />
        </div>
        {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
        <div className="row gap-2">
          <Gated feature="land.offer" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={offer}>Make An Offer</Gated>
        </div>
        <Fine>{q.basis} None is a real listing: an asking price is within SLATE’s spread of the value, from 5% under it to 15% over it. A seller takes less the longer land has sat. It sells in about {DAYS_TO_SELL} days, a broker’s 2025 US figure taken everywhere. A survey, title insurance, a lawyer and a Phase I environmental assessment, which no authority prices, aren’t kept, nor is a land loan. Sources: {LAND_SOURCE}.</Fine>
      </div>
    </Panel>
  );
}
