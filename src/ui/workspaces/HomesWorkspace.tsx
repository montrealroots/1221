/**
 * SLATE — homes: the fifty for sale where they live, cheapest first, and the
 * one they own (`systems/homes.ts`). Every figure is one the homes system
 * reads or charges: the asking price as the town's market has moved it, what
 * the offer takes on the day and what the home costs a month, each part's
 * age, what a job costs and adds, and what a sale would leave.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { centsFromTyped, formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import {
  FEATURE_LABEL, PART_LABEL, conditionWord, homeValueAt, sharedCostsLabel, typeLabel, type Part,
} from '@/engine/content/homes';
import {
  HOME, askingPrice, buyRefusal, downChoices, equityOf, homeValue, lifeOf, listingById, listingsIn, loanBalance,
  monthOf, assessedValue, offerFor, owedOnHome, projectsFor, saleNet, sellRefusal, sizeText, termsIn,
  type HomeFacts, type Listing,
} from '@/engine/systems/homes';

type HomesTab = 'sale' | 'yours';

const HOMES_TABS: readonly { id: HomesTab; label: string }[] = [
  { id: 'sale', label: 'For Sale' },
  { id: 'yours', label: 'Your Home' },
];

export function HomesWorkspace() {
  const owns = useWorld((s) => Boolean(s.player.owned));
  const [tab, setTab] = useState<HomesTab>(owns ? 'yours' : 'sale');
  const panes: Record<HomesTab, JSX.Element> = { sale: <ForSalePane />, yours: <YourHomePane /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Where You Live</div>
        <h1>Homes</h1>
        <p className="muted">Fifty homes for sale in your town, cheapest first, and the one you own.</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Homes">
        {HOMES_TABS.map((one, i) => (
          <button
            key={one.id} id={`homes-tab-${one.id}`} type="button" role="tab" className="tab"
            aria-selected={one.id === tab} aria-controls={`homes-pane-${one.id}`} tabIndex={one.id === tab ? 0 : -1}
            onClick={() => setTab(one.id)}
            onKeyDown={(e) => {
              const go = (n: number) => { const next = HOMES_TABS[(n + HOMES_TABS.length) % HOMES_TABS.length]!; setTab(next.id); document.getElementById(`homes-tab-${next.id}`)?.focus(); };
              if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
              else if (e.key === 'Home') { e.preventDefault(); go(0); }
              else if (e.key === 'End') { e.preventDefault(); go(HOMES_TABS.length - 1); }
            }}
          >
            {one.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`homes-pane-${tab}`} aria-labelledby={`homes-tab-${tab}`} tabIndex={0}>
        {panes[tab]}
      </div>
    </>
  );
}

const bathsText = (baths: number) => `${baths} ${baths === 1 ? 'Bath' : 'Baths'}`;
const bedsText = (beds: number) => (beds === 0 ? 'Studio' : `${beds} ${beds === 1 ? 'Bed' : 'Beds'}`);
const pct = (rate: number) => `${(rate * 100).toFixed(2)}%`;

/** What a home is: its rooms, its size and lot, the year it was built, and what it has. */
function Facts({ facts, countryId }: { facts: HomeFacts; countryId: string }) {
  return (
    <div className="col gap-2 small">
      <div>{typeLabel(facts.type, countryId)} · {bedsText(facts.beds)} · {bathsText(facts.baths)} · {sizeText(facts.size, countryId)}{facts.lot !== undefined ? ` on a ${sizeText(facts.lot, countryId)} lot` : ''} · Built {facts.built}</div>
      {facts.features.length > 0 && <div className="muted">{facts.features.map((f) => FEATURE_LABEL[f]).join(' · ')}</div>}
    </div>
  );
}

/** Each part, when it was last put in new, and the state it's in. */
function Parts({ facts, year }: { facts: HomeFacts; year: number }) {
  const parts = Object.entries(facts.parts) as [Part, number][];
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th scope="col">Part</th><th scope="col" className="num">Put In</th><th scope="col">Condition</th></tr></thead>
        <tbody>
          {parts.map(([part, put]) => (
            <tr key={part}><td>{PART_LABEL[part]}</td><td className="num mono">{put}</td><td>{conditionWord(Math.max(0, year - put), lifeOf(facts, part))}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ForSalePane() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const cityId = useWorld((s) => s.player.home?.cityId ?? s.player.currentLocationId);
  const city = CITIES.require(cityId);
  const homes = useWorld((s) => listingsIn(s, cityId), [cityId]);
  const buying = useWorld((s) => s.player.buying);
  const owns = useWorld((s) => Boolean(s.player.owned));
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const [down, setDown] = useState<number>(downChoices(city.countryId).includes(0.2) ? 0.2 : downChoices(city.countryId)[0]!);
  const typical = homeValueAt(cityId, cur);
  const listing = chosen ? listingById(sim, chosen) : undefined;
  const year = new Date(sim.now).getUTCFullYear();
  const offer = useWorld((s) => (listing ? offerFor(s, s.player, listing, down) : undefined), [listing, down]);
  const refusal = useWorld((s) => (listing ? buyRefusal(s, s.player, listing.id, down) : undefined), [listing, down]);
  const shared = sharedCostsLabel(city.countryId);
  const terms = termsIn(city.countryId);
  const offerOn = (one: Listing) => {
    const answer = run('home.buy', { listingId: one.id, down });
    if (answer.ok) toast('Your offer was accepted. It closes in thirty days.', 'positive');
  };
  return (
    <div className="col gap-4">
      {buying && (
        <Panel title="Your Purchase" actions={<Gated feature="home.cancel" className="btn btn-sm btn-ghost" onClick={() => run('home.cancel', {})}>Call It Off</Gated>}>
          <div className="small">{listingById(sim, buying.listingId)?.address ?? 'A home'} for {money(buying.price)}, {buying.down >= 1 ? 'in cash' : `${Math.round(buying.down * 100)}% down`}. It closes {formatDate(buying.closesAt, city.timeZone)}, when the money has to be in the bank.</div>
        </Panel>
      )}
      {listing && offer && (
        <>
        <div id="home-chosen" />
        <Panel title={listing.address} subtitle={`${money(offer.price)} · #${listing.rank} of ${homes.length}`}>
          <div className="col gap-3">
            <Facts facts={listing} countryId={city.countryId} />
            <Parts facts={listing} year={year} />
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="home-down">Down Payment</label>
              <select id="home-down" value={down} onChange={(e) => setDown(Number(e.target.value))}>
                {downChoices(city.countryId).map((d) => <option key={d} value={d}>{d >= 1 ? 'Cash' : `${Math.round(d * 100)}%`}</option>)}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <tbody>
                  <tr><th scope="row">Down Payment</th><td className="num mono">{money(offer.down)}</td></tr>
                  {offer.loan > 0 && <tr><th scope="row">Mortgage</th><td className="num mono">{money(offer.loan)} at {pct(offer.rate)} over {terms.years} years</td></tr>}
                  <tr><th scope="row">Closing Costs</th><td className="num mono">{money(offer.closing)}</td></tr>
                  <tr><th scope="row">On The Day</th><td className="num mono">{money(offer.cash)}</td></tr>
                  {offer.loan > 0 && <tr><th scope="row">Principal And Interest</th><td className="num mono">{money(offer.month.mortgage)}</td></tr>}
                  <tr><th scope="row">Property Tax</th><td className="num mono">{money(offer.month.tax)}</td></tr>
                  <tr><th scope="row">Insurance</th><td className="num mono">{money(offer.month.insurance)}</td></tr>
                  {offer.month.pmi > 0 && <tr><th scope="row">Mortgage Insurance</th><td className="num mono">{money(offer.month.pmi)}</td></tr>}
                  {offer.month.hoa > 0 && <tr><th scope="row">{shared}</th><td className="num mono">{money(offer.month.hoa)}</td></tr>}
                  <tr><th scope="row">A Month</th><td className="num mono">{money(offer.month.total)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Gated feature="home.buy" className="btn btn-sm" disabled={Boolean(refusal) || owns} onClick={() => offerOn(listing)}>Make An Offer</Gated>
              {refusal && <span className="xs dim">{refusal}</span>}
            </div>
          </div>
        </Panel>
        </>
      )}
      <Panel title={`For Sale In ${city.name}`} subtitle={`The typical home: ${money(typical.value)} as of ${formatDate(typical.asOf, city.timeZone)}, ${(typical.growth * 100).toFixed(1)}% a year`}>
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col" className="num">#</th><th scope="col">Home</th><th scope="col">Address</th><th scope="col" className="num">Size</th><th scope="col" className="num">Built</th><th scope="col" className="num">Price</th><th scope="col" /></tr>
              </thead>
              <tbody>
                {homes.map((one) => (
                  <tr key={one.id} aria-selected={one.id === chosen}>
                    <td className="num mono">{one.rank}</td>
                    <td>{typeLabel(one.type, city.countryId)}, {bedsText(one.beds)}, {bathsText(one.baths)}</td>
                    <td>{one.address}</td>
                    <td className="num mono">{sizeText(one.size, city.countryId)}</td>
                    <td className="num mono">{one.built}</td>
                    <td className="num mono">{money(askingPrice(sim, one))}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => { setChosen(one.id); requestAnimationFrame(() => document.getElementById('home-chosen')?.scrollIntoView({ block: 'start' })); }}>Look</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Fine>
            {typical.kind === 'zillow'
              ? 'The town’s typical home is Zillow’s Home Value Index (Zillow Research, zillow.com/research/data), its middle third, and its five years’ growth. '
              : typical.kind === 'calibrated'
                ? 'Zillow doesn’t report this town: its typical home is its rent times what homes cost over a year’s rent in the towns of its state that Zillow does. '
                : 'The typical home here is SLATE’s estimate: the town’s rent times how dear homes run over rents in this country, measured against America’s. '}
            The fifty homes are the game’s own, drawn about it: none is a real listing, and the addresses are common street names of the country with numbers of SLATE’s. Rates, down payments and closing costs are SLATE’s estimates of the country’s{city.parentId === 'uk-eng' || city.parentId === 'uk-nir' ? ', but for England’s Stamp Duty Land Tax' : ''}.
          </Fine>
        </div>
      </Panel>
    </div>
  );
}

function YourHomePane() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const owned = useWorld((s) => s.player.owned);
  const value = useWorld((s) => (s.player.owned ? homeValue(s, s.player.owned) : 0));
  const loan = useWorld((s) => (s.player.owned ? loanBalance(s, s.player.owned) : 0));
  const equity = useWorld((s) => equityOf(s, s.player));
  const owed = useWorld((s) => owedOnHome(s.player));
  const projects = useWorld((s) => projectsFor(s, s.player));
  const net = useWorld((s) => (s.player.owned ? saleNet(s, s.player.owned) : 0));
  const noSale = useWorld((s) => sellRefusal(s, s.player));
  const [paying, setPaying] = useState('');
  const [then, setThen] = useState<'shared' | 'own'>('own');
  if (!owned) {
    return <div className="empty"><h3>You Don’t Own A Home</h3><p className="small">The homes for sale in your town are on the other tab.</p></div>;
  }
  const city = CITIES.require(owned.cityId);
  const year = new Date(sim.now).getUTCFullYear();
  const month = monthOf(sim, owned.facts, owned.cityId, value, owned.mortgage ? { payment: owned.mortgage.payment, pmi: owned.mortgage.pmi, balance: loan } : undefined, assessedValue(sim, owned));
  const payDown = () => {
    const answer = run('home.pay_mortgage', { amount: centsFromTyped(paying) });
    if (answer.ok) { toast('Paid off the loan.', 'positive'); setPaying(''); }
  };
  return (
    <div className="col gap-4">
      <Panel title={owned.facts.address} subtitle={`Bought ${formatDate(owned.boughtAt, city.timeZone)} for ${money(owned.price)}`}>
        <div className="col gap-3">
          <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
            <Stat label="Worth" value={money(value)} note="What it cost and what the work added, moved with the town’s market" />
            {owned.mortgage && <Stat label="Mortgage" value={money(loan)} note={`${pct(owned.mortgage.rate)}${owned.mortgage.pmi ? ', with mortgage insurance' : ''}`} />}
            <Stat label="Yours Of It" value={money(equity)} note="Its worth, less the mortgage" tone={equity < 0 ? 'negative' : 'positive'} />
            <Stat label="A Month" value={money(month.total)} note={`${owned.mortgage ? `${money(month.mortgage)} principal and interest, ` : ''}${money(month.tax)} tax, ${money(month.insurance)} insurance${month.pmi > 0 ? `, ${money(month.pmi)} mortgage insurance` : ''}${month.hoa > 0 ? `, ${money(month.hoa)} ${sharedCostsLabel(city.countryId).toLowerCase()}` : ''}`} />
          </div>
          {owed > 0 && <div className="callout callout-warning small">You’re behind: {money(owed)} owed on the home, paid the first day the bank can. {HOME.graceDays} days late costs a fee, {HOME.reportDays} days goes on your record{owned.foreclosureAt !== undefined ? `, and the lender sells it ${formatDate(owned.foreclosureAt, city.timeZone)}` : ''}.</div>}
          <Facts facts={owned.facts} countryId={city.countryId} />
          <Parts facts={owned.facts} year={year} />
          {owned.mortgage && loan > 0 && (
            <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="pay-mortgage">Pay Down The Mortgage ({cur})</label>
                <input id="pay-mortgage" inputMode="decimal" value={paying} onChange={(e) => setPaying(e.target.value)} />
              </div>
              <Gated feature="home.pay_mortgage" className="btn btn-sm" onClick={payDown} disabled={!paying}>Pay Down The Mortgage</Gated>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Work On It" subtitle={owned.works.length > 0 ? `${owned.works.length} under way` : 'Paid when it starts; what it adds follows how worn the part it replaces is'}>
        <div className="col gap-3">
          {owned.works.length > 0 && (
            <ul className="small">
              {owned.works.map((w) => <li key={w.projectId}>{projects.find((p) => p.project.id === w.projectId)?.project.label ?? w.projectId}: done {formatDate(w.doneAt, city.timeZone)}</li>)}
            </ul>
          )}
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Work</th><th scope="col" className="num">Cost</th><th scope="col" className="num">Takes</th><th scope="col" className="num">Adds To Its Worth</th><th scope="col" /></tr></thead>
              <tbody>
                {projects.map(({ project, cost, adds, refusal }) => (
                  <tr key={project.id}>
                    <td>{project.label}{refusal && <div className="xs dim">{refusal}</div>}</td>
                    <td className="num mono">{money(cost)}</td>
                    <td className="num mono">{project.days} {project.days === 1 ? 'day' : 'days'}</td>
                    <td className="num mono">{money(adds)}</td>
                    <td><Gated feature="home.renovate" className="btn btn-sm btn-ghost" disabled={Boolean(refusal)} onClick={() => run('home.renovate', { projectId: project.id })}>Start The Work</Gated></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Fine>What each job costs and returns at sale is SLATE’s estimate of a typical American job, at your town’s cost of living; the pattern follows the remodeling trade’s cost-against-value surveys, in which a new garage door or front door returns more than it costs and a big addition returns about a third. Past half again what the home cost, the street caps what a buyer pays, and a job returns half as much.</Fine>
        </div>
      </Panel>

      <Panel
        title="Selling It"
        actions={owned.selling ? <Gated feature="home.cancel" className="btn btn-sm btn-ghost" onClick={() => run('home.cancel', {})}>Call It Off</Gated> : undefined}
      >
        {owned.selling ? (
          <div className="small">It’s listed, and the sale closes {formatDate(owned.selling.closesAt, city.timeZone)}. You move into {owned.selling.then === 'own' ? 'a place of your own' : 'a room'} that day.</div>
        ) : (
          <div className="col gap-2">
            <div className="small">At its worth today it would leave you {money(net)}, after {Math.round(termsIn(city.countryId).selling * 1000) / 10}% to the agents and the closing{loan > 0 ? ', and the mortgage paid off' : ''}. A sale closes {HOME.saleDays} days after it’s listed.</div>
            <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="sell-then">Then Rent</label>
                <select id="sell-then" value={then} onChange={(e) => setThen(e.target.value === 'shared' ? 'shared' : 'own')}>
                  <option value="shared">A Room</option>
                  <option value="own">A Place Of Your Own</option>
                </select>
              </div>
              <Gated feature="home.sell" className="btn btn-sm" disabled={Boolean(noSale)} onClick={() => run('home.sell', { then })}>Sell Your Home</Gated>
            </div>
            {noSale && <div className="xs dim">{noSale}</div>}
          </div>
        )}
      </Panel>
    </div>
  );
}
