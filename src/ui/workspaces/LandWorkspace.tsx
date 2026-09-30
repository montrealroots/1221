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
import { buildingOn, landBuyingOf, landQuote, landValue, listingsFor, offerRefusal, parcelsOf, saleProceeds, splitRefusal, type LandAnswer } from '@/engine/systems/land';
import { DAYS_TO_SELL, LAND_DEAL, LAND_MARKETS, LAND_SOURCE, LAND_TAX, areaWords } from '@/engine/content/land';
import { BUILD_RULES, BUILD_SOURCE, SQFT_PER_M2, STAGES, BUILD_LOANS } from '@/engine/content/construction';
import { buildPlaceOf, buildQuote, buildRefusal } from '@/engine/systems/construction';

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
        <Build />
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
                const built = buildingOn(person, p);
                const twin = owned.find((o) => o.id !== p.id && !o.selling && LAND_MARKETS[o.market]!.label === m.label);
                return (
                  <tr key={p.id}>
                    <td>{m.label}</td>
                    <td>{areaWords(p.acres, m.place)}</td>
                    <td className="num mono">{money(worth)}</td>
                    <td className="small">{built ? 'A House Going Up' : p.selling ? `For Sale, Closing ${formatDate(p.selling.closesAt, sim.zone)}` : `Since ${formatDate(p.boughtAt, sim.zone)}`}</td>
                    <td>
                      <div className="row gap-2">
                        {!p.selling && !built && <Gated feature="land.sell" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ closesAt: number }>('land.sell', { parcelId: p.id }); if (a.ok) toast(`For sale: it closes ${formatDate(a.value!.closesAt, sim.zone)}, for ${money(saleProceeds(m, worth).net)} after the seller’s taxes.`, 'positive'); }}>Put It Up For Sale</Gated>}
                        {!p.selling && !built && <Gated feature="land.split" className="btn btn-sm btn-ghost" disabled={Boolean(splitRefusal(p, person))} title={splitRefusal(p, person)} onClick={() => { if (run('land.split', { parcelId: p.id }).ok) toast('Split in two.', 'positive'); }}>Split It</Gated>}
                        {!p.selling && !built && twin && !buildingOn(person, twin) && <Gated feature="land.combine" className="btn btn-sm btn-ghost" onClick={() => { if (run('land.combine', { a: p.id, b: twin.id }).ok) toast('Combined into one.', 'positive'); }}>Combine Them</Gated>}
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

/** A house on a lot you own: the house being built, or choosing one to build. */
function Build() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const lots = parcelsOf(person).filter((p) => p.soldAt === undefined && !p.selling);
  const [pick, setPick] = useState('');
  const parcel = lots.find((p) => p.id === pick) ?? lots[0];
  const place = parcel ? buildPlaceOf(parcel) : undefined;
  const designs = place ? BUILD_RULES[place].designs : [];
  const [designPick, setDesign] = useState('');
  const design = designs.find((d) => d.id === designPick) ?? designs[0];
  const [live, setLive] = useState(true);
  const [financed, setFinanced] = useState(false);
  const b = person.building;
  if (b) {
    const rules = BUILD_RULES[b.place];
    const money = (c: number) => formatMoney(c, rules.currency, { cents: false });
    return (
      <Panel title="Your House, Being Built" subtitle={b.stage === -1 ? (b.place === 'london' ? 'Work starts soon' : 'Waiting for the permit') : `${STAGES[b.stage]!.name}${b.unpaid !== undefined ? ', stopped' : ''}`}>
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Stage</th><th scope="col" className="num">Bill</th><th scope="col">Standing</th></tr></thead>
              <tbody>
                {STAGES.map((st, i) => (
                  <tr key={st.name}>
                    <td>{st.name}</td>
                    <td className="num mono">{money(b.amounts[i]!)}</td>
                    <td className="small">{i < b.stage ? 'Done And Paid' : i === b.stage ? (b.unpaid !== undefined ? 'Done, Unpaid' : 'Under Way') : 'To Come'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.unpaid !== undefined && <p className="small" style={{ margin: 0 }}>The contractor stopped on {formatDate(b.stoppedAt!, sim.zone)} until {money(b.unpaid)} is paid.</p>}
          {b.unpaid !== undefined && (
            <div className="row gap-2">
              <Gated feature="build.pay" className="btn btn-sm" onClick={() => { if (run('build.pay', {}).ok) toast('Paid; work goes on.', 'positive'); }}>Pay The Contractor</Gated>
            </div>
          )}
          <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
            {b.log.slice(-5).map((l) => <li key={`${l.at}-${l.line}`}>{formatDate(l.at, sim.zone)}: {l.line}</li>)}
          </ul>
        </div>
      </Panel>
    );
  }
  if (!parcel) return null;
  const m = LAND_MARKETS[parcel.market]!;
  const lotPicker = lots.length > 1 && (
    <div className="field">
      <label htmlFor="build-lot">Land</label>
      <select id="build-lot" value={parcel.id} onChange={(e) => { setPick(e.target.value); setDesign(''); }}>
        {lots.map((p) => <option key={p.id} value={p.id}>{LAND_MARKETS[p.market]!.label}, {areaWords(p.acres, LAND_MARKETS[p.market]!.place)}</option>)}
      </select>
    </div>
  );
  // Land no house is built on says why, rather than hiding the panel.
  if (!place || !design) {
    const why = buildQuote(parcel, '', live);
    return (
      <Panel title="Build A House" subtitle={`On ${m.label}`}>
        <div className="col gap-3">
          {lotPicker && <div className="field-row field-row-tight">{lotPicker}</div>}
          <p className="small" style={{ margin: 0 }}>{typeof why === 'string' ? why : ''}</p>
        </div>
      </Panel>
    );
  }
  const rules = BUILD_RULES[place];
  const q = buildQuote(parcel, design.id, live);
  const loan = BUILD_LOANS[place];
  const no = buildRefusal(sim, person, parcel.id, design.id, live, financed && loan !== undefined);
  const money = (c: number) => formatMoney(c, rules.currency, { cents: true });
  const size = (sqft: number) => (rules.unit === 'm2' ? `${Math.round(sqft / SQFT_PER_M2)} m²` : `${sqft.toLocaleString('en-US')} sq ft`);
  const waits = place === 'london' ? 'Two Days' : q && typeof q !== 'string' && q.permitDays < 45 ? `About ${q.permitDays} Days` : `About ${Math.round((typeof q === 'string' ? 0 : q.permitDays) / 30.4)} Months`;
  return (
    <Panel title="Build A House" subtitle={`On ${m.kind === 'lot' ? m.label.replace(/^A /, 'the ').replace(/, With Planning Permission$/, '') : m.label}`}>
      <div className="col gap-3">
        <div className="field-row field-row-tight">
          {lotPicker}
          <div className="field">
            <label htmlFor="build-design">House</label>
            <select id="build-design" value={design.id} onChange={(e) => setDesign(e.target.value)}>
              {designs.map((d) => <option key={d.id} value={d.id}>{d.beds} Bedrooms, {size(d.sqft)}</option>)}
            </select>
          </div>
          {loan && (
            <div className="field">
              <label htmlFor="build-paid">Paid</label>
              <select id="build-paid" value={financed ? 'loan' : 'outright'} onChange={(e) => setFinanced(e.target.value === 'loan')}>
                <option value="outright">Outright</option>
                <option value="loan">{`A Construction Loan, ${Math.round(loan.down * 100)}% Down`}</option>
              </select>
            </div>
          )}
        </div>
        {place === 'london' && (
          <label className="row gap-1 small" style={{ alignItems: 'center' }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> To Live In
          </label>
        )}
        {typeof q !== 'string' && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
              <tbody>
                <tr><td>The Contract, Paid Stage By Stage</td><td className="num mono">{money(q.contract)}</td></tr>
                {q.fees.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{money(l.amount)}</td></tr>)}
                <tr><th scope="row">In All</th><td className="num mono">{money(q.total)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
        {typeof q !== 'string' && (
          <div className="grid grid-3">
            <Stat label="The House" value={`${design.beds} Bed, ${design.baths} Bath`} note={`${size(design.sqft)}: ${design.basis}`} />
            <Stat label={place === 'london' ? 'Start' : place === 'leinster' ? 'Planning Permission' : 'The Permit'} value={waits} note="Permits and fees paid when it’s started" />
            <Stat label="Building" value={`About ${Math.round(rules.buildMonths)} Months`} note={`Then its ${rules.occupancy}`} />
          </div>
        )}
        {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
        <div className="row gap-2">
          <Gated feature="build.start" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
            const a = run<{ finishesBy: number }>('build.start', { parcelId: parcel.id, designId: design.id, live, financed: financed && loan !== undefined });
            if (a.ok) toast(`Started: it should be finished about ${formatDate(a.value!.finishesBy, sim.zone)}.`, 'positive');
          }}>Start Building</Gated>
        </div>
        <Fine>{rules.rateBasis}; {rules.timeBasis}.{rules.bulk ? ` It fits by ${rules.bulk.basis}.` : ''} The bank pays each stage as it’s done; a bill it can’t pay stops the work. Finished, it’s a home you own, worth what the land and the building cost.{loan ? ` On ${loan.lender}’s construction loan the lender pays ${Math.round((1 - loan.down) * 100)}% of each stage at ${(loan.rate * 100).toFixed(2)}%, interest only while it’s built, and it becomes the house’s mortgage when it’s finished.` : ''} Delays, overruns, change orders and a structural warranty, which no authority prices for a house, aren’t kept. Sources: {BUILD_SOURCE}.</Fine>
      </div>
    </Panel>
  );
}
