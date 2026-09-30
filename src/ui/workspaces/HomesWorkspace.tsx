/**
 * SLATE — homes: the market in a town, cheapest first, an offer and its
 * answer, the purchase under way with its inspection, and every home they
 * own, lived in, let or empty (`systems/homes.ts`). Every figure is one the
 * homes system reads or charges: the asking price as the market and the time
 * unsold have moved it, what an offer takes and costs a month, each part's
 * age once inspected, a tenant's rent and lease, what a job costs and adds,
 * what can be borrowed, and what a sale would leave.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { centsFromTyped, formatMoney, saveCurrency } from '@/engine/core/money';
import { APPLIANCE_LABEL, APPLIANCE_LIFE, type ApplianceKind } from '@/engine/content/appliances';
import { applianceCost, appliancesIn, fitRefusal, hasAppliance } from '@/engine/systems/appliances';
import { fixturesOf } from '@/engine/systems/dwelling';
import { PIECE_LABEL, type Piece } from '@/engine/content/furniture';
import { furnishRefusal, owns, pieceCost } from '@/engine/systems/furniture';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COOLING_LABEL, COUNCIL_TAX, FEATURE_LABEL, GYM_LABEL, LAUNDRY_LABEL, OUTDOOR_LABEL, PART_LABEL, conditionWord, homeValueAt, sharedCostsLabel, typeLabel, type Part } from '@/engine/content/homes';
import {
  HOME, askingPrice, minimumDown, atTown, borrowRefusal, councilBand, councilLetter, councilNation, daysListed, downChoices, equityIn, equityRate, equityRoom, homeValue, letRefusal, lifeOf,
  listingById, listingsIn, livingIn, marketRent, refinanceOffer, refinanceRefusal, moveInRefusal, offerFor, offerRefusal, owedOn, ownedMonth, projectsFor, saleNet,
  sellRefusal, sizeText, termsIn, type HomeFacts, type Listing, type OwnedHome, type SellerAnswer, type Tenancy,
} from '@/engine/systems/homes';
import { CAREER_CITIES } from '@/engine/content/career';
import { inTheBank } from '@/engine/systems/household';

type HomesTab = 'sale' | 'yours';

const HOMES_TABS: readonly { id: HomesTab; label: string }[] = [
  { id: 'sale', label: 'For Sale' },
  { id: 'yours', label: 'Your Homes' },
];

export function HomesWorkspace() {
  const owns = useWorld((s) => (s.player.homes ?? []).length > 0);
  const [tab, setTab] = useState<HomesTab>(owns ? 'yours' : 'sale');
  const panes: Record<HomesTab, JSX.Element> = { sale: <ForSalePane />, yours: <YourHomesPane /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Where You Live</div>
        <h1>Homes</h1>
        <p className="muted">Fifty homes for sale in a town, cheapest first, and the homes you own.</p>
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
const pct = (rate: number) => `${(rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`;

/** What a home is: its rooms, its size and lot, the year it was built, and what it has. */
function Facts({ facts, countryId }: { facts: HomeFacts; countryId: string }) {
  return (
    <div className="col gap-2 small">
      <div>{typeLabel(facts.type, countryId)} · {bedsText(facts.beds)} · {bathsText(facts.baths)} · {sizeText(facts.size, countryId)}{facts.lot !== undefined ? ` on a ${sizeText(facts.lot, countryId)} lot` : ''} · Built {facts.built}</div>
      {facts.features.length > 0 && <div className="muted">{facts.features.map((f) => FEATURE_LABEL[f]).join(' · ')}</div>}
      {facts.fixtures && <div className="muted">{[facts.fixtures.bathtub ? 'Bath And Shower' : 'Shower', facts.fixtures.dishwasher ? 'Dishwasher' : 'No Dishwasher', LAUNDRY_LABEL[facts.fixtures.laundry], COOLING_LABEL[facts.fixtures.cooling], OUTDOOR_LABEL[facts.fixtures.outdoor], GYM_LABEL[facts.fixtures.gym]].join(' · ')}</div>}
    </div>
  );
}

/** Each part, when it was last put in new, and the state it's in. */
function Parts({ facts, year }: { facts: HomeFacts; year: number }) {
  const parts = Object.entries(facts.parts) as [Part, number][];
  return (
    <div className="table-scroll" style={{ maxWidth: 480 }}>
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
  const homeTown = useWorld((s) => s.player.home?.cityId ?? s.player.currentLocationId);
  // The towns to look in: the business's and New Haven's, and the one they live in, last.
  const towns = [...new Set([...CAREER_CITIES, 'us-ct-newhaven'].filter((id) => id !== homeTown && CITIES.get(id)).concat(homeTown))];
  const [town, setTown] = useState(homeTown);
  const city = CITIES.require(town);
  const homes = useWorld((s) => listingsIn(s, town), [town]);
  const buying = useWorld((s) => s.player.buying);
  const counter = useWorld((s) => s.player.counter);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const listing = useWorld((s) => (chosen ? listingById(s, chosen) : undefined), [chosen]);
  const mayLive = town === homeTown;
  const [live, setLive] = useState(true);
  const living = live && mayLive;
  const asked = useWorld((s) => (listing ? askingPrice(s, listing) : 0), [listing]);
  const choices = downChoices(city.countryId, living, minimumDown(sim, city.countryId, asked, living));
  const [downPicked, setDown] = useState<number>(0.2);
  const down = choices.includes(downPicked) ? downPicked : choices[0]!;
  const [inspect, setInspect] = useState(true);
  const [typed, setTyped] = useState('');
  const asking = useWorld((s) => (listing ? askingPrice(s, listing) : 0), [listing]);
  const price = typed ? centsFromTyped(typed) : asking;
  const offer = useWorld((s) => (listing ? offerFor(s, s.player, listing, down, price, living) : undefined), [listing, down, price, living]);
  const refusal = useWorld((s) => (listing ? offerRefusal(s, s.player, listing.id, price, down, living) : undefined), [listing, price, down, living]);
  const typical = homeValueAt(town, cur);
  const shared = sharedCostsLabel(city.countryId);
  const terms = termsIn(city.countryId);
  const choose = (one: Listing) => { setChosen(one.id); setTyped(''); requestAnimationFrame(() => document.getElementById('home-chosen')?.scrollIntoView({ block: 'start' })); };
  const makeOffer = (at: number) => {
    if (!listing) return;
    const answer = run<SellerAnswer>('home.offer', { listingId: listing.id, price: at, down, live: living, inspect });
    if (!answer.ok) return;
    const a = answer.value!;
    if (a.answer === 'accepted') toast(`Accepted at ${money(at)}. It closes in ${HOME.closingDays} days.`, 'positive');
    else if (a.answer === 'countered') toast(`The seller countered at ${money(a.price)}.`, 'neutral');
    else toast('The seller turned it down.', 'neutral');
  };
  const countered = counter && counter.until >= sim.now ? listingById(sim, counter.listingId) : undefined;
  return (
    <div className="col gap-4">
      {buying && <Purchase />}
      {counter && countered && (
        <Panel title="The Seller Countered">
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">{countered.address}: {money(counter.price)}, until {formatDate(counter.until, CITIES.require(countered.cityId).timeZone)}. Offer it and it’s yours.</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setTown(countered.cityId); setChosen(countered.id); setTyped(String(counter.price / 100)); }}>Look</button>
          </div>
        </Panel>
      )}
      <div className="field" style={{ margin: 0, maxWidth: 320 }}>
        <label htmlFor="homes-town">Town</label>
        <select id="homes-town" value={town} onChange={(e) => { setTown(e.target.value); setChosen(undefined); }}>
          {towns.map((id) => <option key={id} value={id}>{CITIES.get(id)?.name ?? id}</option>)}
        </select>
      </div>
      {listing && offer && (
        <>
          <div id="home-chosen" />
          <Panel title={listing.address} subtitle={`${money(asking)} · #${listing.rank} of ${homes.length} · ${daysListed(sim, listing)} days on the market`}>
            <div className="col gap-3">
              <Facts facts={listing} countryId={city.countryId} />
              <div className="xs dim">How old each part is comes with the inspection’s report.</div>
              <div className="row gap-3" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="home-price">Your Offer ({cur})</label>
                  <input id="home-price" inputMode="decimal" value={typed} placeholder={String(asking / 100)} onChange={(e) => setTyped(e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="home-down">Down Payment</label>
                  <select id="home-down" value={down} onChange={(e) => setDown(Number(e.target.value))}>
                    {choices.map((d) => <option key={d} value={d}>{d >= 1 ? 'Cash' : `${Math.round(d * 100)}%`}</option>)}
                  </select>
                </div>
                {mayLive && (
                  <label className="row gap-1 small" style={{ alignItems: 'center' }}>
                    <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> To Live In
                  </label>
                )}
                <label className="row gap-1 small" style={{ alignItems: 'center' }}>
                  <input type="checkbox" checked={inspect} onChange={(e) => setInspect(e.target.checked)} /> Subject To An Inspection
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <tbody>
                    <tr><th scope="row">Earnest Money, With The Offer</th><td className="num mono">{money(offer.earnest)}</td></tr>
                    <tr><th scope="row">Down Payment</th><td className="num mono">{money(offer.down)}</td></tr>
                    {offer.loan > 0 && <tr><th scope="row">Mortgage</th><td className="num mono">{money(offer.loan)} at {pct(offer.rate)} over {terms.years} years</td></tr>}
                    <tr><th scope="row">Closing Costs</th><td className="num mono">{money(offer.closing)}</td></tr>
                    {inspect && <tr><th scope="row">The Inspection, When Its Report Comes</th><td className="num mono">{money(atTown(sim, town, HOME.inspectionFeeUsd))}</td></tr>}
                    <tr><th scope="row">At Closing</th><td className="num mono">{money(offer.cash - offer.earnest)}</td></tr>
                    {offer.loan > 0 && <tr><th scope="row">Principal And Interest</th><td className="num mono">{money(offer.month.mortgage)}</td></tr>}
                    <tr><th scope="row">{councilNation(town) ? `Council Tax, Band ${councilLetter(town, councilBand(sim, offer.price, town))}${living ? '' : ', Until It’s Let'}` : 'Property Tax'}</th><td className="num mono">{money(offer.month.tax)}</td></tr>
                    <tr><th scope="row">Insurance</th><td className="num mono">{money(offer.month.insurance)}</td></tr>
                    {offer.month.pmi > 0 && <tr><th scope="row">Mortgage Insurance</th><td className="num mono">{money(offer.month.pmi)}</td></tr>}
                    {offer.month.hoa > 0 && <tr><th scope="row">{shared}</th><td className="num mono">{money(offer.month.hoa)}</td></tr>}
                    <tr><th scope="row">A Month</th><td className="num mono">{money(offer.month.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Gated feature="home.offer" className="btn btn-sm" disabled={Boolean(refusal)} onClick={() => makeOffer(price)}>Make An Offer</Gated>
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
                <tr><th scope="col" className="num">#</th><th scope="col">Home</th><th scope="col">Address</th><th scope="col" className="num">Size</th><th scope="col" className="num">Built</th><th scope="col" className="num">Days Listed</th><th scope="col" className="num">Price</th><th scope="col" /></tr>
              </thead>
              <tbody>
                {homes.map((one) => (
                  <tr key={one.id} aria-selected={one.id === chosen}>
                    <td className="num mono">{one.rank}</td>
                    <td>{typeLabel(one.type, city.countryId)}, {bedsText(one.beds)}, {bathsText(one.baths)}</td>
                    <td>{one.address}</td>
                    <td className="num mono">{sizeText(one.size, city.countryId)}</td>
                    <td className="num mono">{one.built}</td>
                    <td className="num mono">{daysListed(sim, one)}</td>
                    <td className="num mono">{money(askingPrice(sim, one))}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => choose(one)}>Look</button></td>
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
            The fifty homes are the game’s own, drawn about it: none is a real listing, and the addresses are common street names of the country with numbers of SLATE’s. Each sells in a month to six and another comes on; one unsold two months is cut 3%, and at four 3% again. How a seller answers an offer, rates, down payments and closing costs are SLATE’s estimates of the country’s{city.countryId === 'uk' ? ', but for Britain’s taxes on buying: England’s and Northern Ireland’s Stamp Duty Land Tax, Scotland’s Land and Buildings Transaction Tax and Wales’s Land Transaction Tax, each with its own rate on a home bought beside one already owned' : ''}.{councilNation(town) ? ` Council tax is by band, from the ${COUNCIL_TAX.bandDYear} average Band D the nation’s councils set, ${formatMoney(councilNation(town)!.bandD, 'GBP', { cents: false })}.` : ''} A home not to live in is an investment: at least {Math.round(HOME.investmentDown * 100)}% down and {pct(HOME.investmentRate)} on the rate.
          </Fine>
        </div>
      </Panel>
    </div>
  );
}

/** The purchase under way: the inspection, its report, and the closing. */
function Purchase() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const buying = useWorld((s) => s.player.buying);
  if (!buying) return null;
  const zone = CITIES.require(buying.cityId).timeZone;
  const walkAway = buying.inspectionUntil !== undefined && sim.now <= buying.inspectionUntil;
  const year = new Date(sim.now).getUTCFullYear();
  return (
    <Panel
      title="Your Purchase"
      subtitle={`${buying.facts.address} · ${money(buying.price)} · ${buying.down >= 1 ? 'cash' : `${Math.round(buying.down * 100)}% down`}${buying.live ? '' : ' · to let'}`}
      actions={<Gated feature="home.cancel" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.cancel', {}).ok) toast(walkAway ? 'Called off. Your earnest money comes back.' : 'Called off. The seller keeps your earnest money.', 'neutral'); }}>Call It Off</Gated>}
    >
      <div className="col gap-3 small">
        <div>{money(buying.earnest)} of earnest money is in escrow. It closes {formatDate(buying.closesAt, zone)}, when the rest has to be in the bank.</div>
        {buying.inspect && buying.inspectedAt === undefined && <div>The inspection’s report comes {formatDate(buying.offeredAt + HOME.reportDays * 86_400_000, zone)}.</div>}
        {buying.inspectedAt !== undefined && (
          <>
            <div>The inspection’s report:</div>
            <Parts facts={buying.facts} year={year} />
          </>
        )}
        <div className="xs dim">
          {walkAway ? `Called off by ${formatDate(buying.inspectionUntil!, zone)}, the earnest money comes back.` : 'Called off now, the seller keeps the earnest money. A loan the lender won’t make at closing gives it back.'}
        </div>
      </div>
    </Panel>
  );
}

function YourHomesPane() {
  const homes = useWorld((s) => s.player.homes ?? []);
  if (homes.length === 0) {
    return <div className="empty"><h3>You Don’t Own A Home</h3><p className="small">The homes for sale are on the other tab.</p></div>;
  }
  return <div className="col gap-4">{homes.map((h) => <HomeCard key={h.id} owned={h} />)}</div>;
}

function HomeCard({ owned }: { owned: OwnedHome }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const city = CITIES.require(owned.cityId);
  const lives = useWorld((s) => livingIn(s.player)?.id === owned.id, [owned.id]);
  const value = useWorld((s) => homeValue(s, owned), [owned]);
  const mortgage = useWorld((s) => owedOn(s, owned.mortgage), [owned]);
  const equityLoan = useWorld((s) => owedOn(s, owned.equity), [owned]);
  const yours = useWorld((s) => equityIn(s, owned), [owned]);
  const month = useWorld((s) => ownedMonth(s, owned), [owned]);
  const projects = useWorld((s) => projectsFor(s, s.player, owned), [owned]);
  const net = useWorld((s) => saleNet(s, owned), [owned]);
  const noSale = useWorld((s) => sellRefusal(s, s.player, owned), [owned]);
  const noMoveIn = useWorld((s) => moveInRefusal(s, s.player, owned), [owned]);
  const room = useWorld((s) => equityRoom(s, owned), [owned]);
  const refi = useWorld((s) => refinanceOffer(s, s.player, owned), [owned]);
  const noRefi = useWorld((s) => refinanceRefusal(s, s.player, owned), [owned]);
  const [paying, setPaying] = useState('');
  const bank = useWorld((s) => inTheBank(s, s.player));
  const [borrowing, setBorrowing] = useState('');
  const noBorrow = useWorld((s) => borrowRefusal(s, s.player, owned, centsFromTyped(borrowing || '0')), [owned, borrowing]);
  const [then, setThen] = useState<'shared' | 'own'>('own');
  const year = new Date(sim.now).getUTCFullYear();
  const owed = owned.owed.reduce((sum, one) => sum + one.amount + (one.escrow ? one.escrow.tax + one.escrow.insurance + one.escrow.pmi : 0), 0);
  const use = lives ? 'you live here' : owned.tenancies.some((t) => t.unit === 'main' && t.status === 'let') ? 'let' : owned.tenancies.some((t) => t.unit === 'main') ? 'advertised to let' : 'empty';
  const payDown = (loan: 'mortgage' | 'equity') => {
    const answer = run('home.pay_mortgage', { homeId: owned.id, amount: centsFromTyped(paying), loan });
    if (answer.ok) { toast('Paid.', 'positive'); setPaying(''); }
  };
  const units: Tenancy['unit'][] = [...(lives ? [] : ['main' as const]), ...(owned.facts.features.includes('adu') ? ['adu' as const] : [])];
  const parts = [
    month.mortgage ? `${money(month.mortgage)} mortgage` : '',
    month.equity ? `${money(month.equity)} equity loan` : '',
    month.tax ? `${money(month.tax)} ${councilNation(owned.cityId) ? 'council tax' : 'tax'}` : '',
    `${money(month.insurance)} insurance`,
    month.pmi ? `${money(month.pmi)} mortgage insurance` : '',
    month.hoa ? `${money(month.hoa)} ${sharedCostsLabel(city.countryId).toLowerCase()}` : '',
  ].filter(Boolean).join(', ');
  return (
    <Panel title={owned.facts.address} subtitle={`${city.name} · ${use} · bought ${formatDate(owned.boughtAt, city.timeZone)} for ${money(owned.price)}`}>
      <div className="col gap-4">
        <div className="stats">
          <Stat label="Worth" value={money(value)} note="Its price and the work, at today’s market" />
          {mortgage > 0 && <Stat label="Mortgage" value={money(mortgage)} note={`${pct(owned.mortgage!.rate)}${owned.mortgage!.pmi ? ', with mortgage insurance' : ''}`} />}
          {equityLoan > 0 && <Stat label="Home Equity Loan" value={money(equityLoan)} note={pct(owned.equity!.rate)} />}
          <Stat label="Yours Of It" value={money(yours)} note="Its worth, less what’s borrowed on it" tone={yours < 0 ? 'negative' : 'positive'} />
          <Stat label="A Month" value={money(month.total)} note={parts} />
        </div>
        {owed > 0 && <div className="callout callout-warning small">Behind: {money(owed)} owed on it, paid the first day the bank can. A payment {HOME.graceDays} days late costs a fee, and a loan’s {HOME.reportLateDays} days late goes on your record{owned.foreclosureAt !== undefined ? `, and the lender sells it ${formatDate(owned.foreclosureAt, city.timeZone)}` : ''}.</div>}
        <Facts facts={owned.facts} countryId={city.countryId} />
        {councilNation(owned.cityId) && <div className="xs dim">Council Tax Band {councilLetter(owned.cityId, councilBand(sim, value, owned.cityId))}.</div>}
        <Parts facts={owned.facts} year={year} />

        {!lives && (
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Gated feature="home.move_in" className="btn btn-sm btn-ghost" disabled={Boolean(noMoveIn)} onClick={() => { if (run('home.move_in', { homeId: owned.id }).ok) toast('Moved in.', 'positive'); }}>Move In</Gated>
            {noMoveIn && <span className="xs dim">{noMoveIn}</span>}
          </div>
        )}

        {units.map((unit) => <Letting key={unit} owned={owned} unit={unit} />)}

        {mortgage > 0 && refi && (
          <div className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Gated feature="home.refinance" className="btn btn-sm btn-ghost" disabled={Boolean(noRefi)} onClick={() => { if (run('home.refinance', { homeId: owned.id }).ok) toast(`Refinanced at ${pct(refi.rate)}.`, 'positive'); }}>Refinance At {pct(refi.rate)}</Gated>
              <span className="xs dim">{noRefi ?? `${money(refi.payment)} a month against ${money(owned.mortgage!.payment)} now, over a new ${termsIn(city.countryId).years} years, for ${money(refi.closing)} in closing costs${refi.pmi ? ', with mortgage insurance' : ''}.`}</span>
            </div>
          </div>
        )}

        {(mortgage > 0 || equityLoan > 0) && (
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor={`pay-${owned.id}`}>Pay Down ({cur})</label>
              <input id={`pay-${owned.id}`} inputMode="decimal" value={paying} onChange={(e) => setPaying(e.target.value)} />
            </div>
            {mortgage > 0 && <Gated feature="home.pay_mortgage" className="btn btn-sm" onClick={() => payDown('mortgage')} disabled={!paying || centsFromTyped(paying) > bank}>Pay Down The Mortgage</Gated>}
            {equityLoan > 0 && <Gated feature="home.pay_mortgage" className="btn btn-sm btn-ghost" onClick={() => payDown('equity')} disabled={!paying || centsFromTyped(paying) > bank}>Pay Down The Equity Loan</Gated>}
          </div>
        )}

        {equityLoan === 0 && room > 0 && (
          <div className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor={`borrow-${owned.id}`}>Borrow, Up To {money(room)} ({cur})</label>
                <input id={`borrow-${owned.id}`} inputMode="decimal" value={borrowing} onChange={(e) => setBorrowing(e.target.value)} />
              </div>
              <Gated feature="home.borrow" className="btn btn-sm btn-ghost" disabled={!borrowing || Boolean(noBorrow)} onClick={() => { if (run('home.borrow', { homeId: owned.id, amount: centsFromTyped(borrowing) }).ok) { toast('Borrowed.', 'positive'); setBorrowing(''); } }}>Borrow Against It</Gated>
            </div>
            <div className="xs dim">{borrowing && noBorrow ? noBorrow : `A home equity loan at ${pct(equityRate(sim.player, owned))} over ${HOME.equityYears} years, paid monthly with the home’s other payments.`}</div>
          </div>
        )}

        <div className="col gap-2">
          <div className="strong small">Work On It{owned.works.length > 0 ? ` · ${owned.works.length} under way` : ''}</div>
          {owned.works.length > 0 && (
            <ul className="small">
              {owned.works.map((w) => <li key={w.projectId}>{projects.find((p) => p.project.id === w.projectId)?.project.label ?? w.projectId}: done {formatDate(w.doneAt, city.timeZone)}</li>)}
            </ul>
          )}
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Work</th><th scope="col" className="num">Cost</th><th scope="col" className="num">Permit</th><th scope="col" className="num">Takes</th><th scope="col" className="num">Adds To Its Worth</th><th scope="col" /></tr></thead>
              <tbody>
                {projects.map(({ project, cost, adds, permit, refusal }) => (
                  <tr key={project.id}>
                    <td>{project.label}{permit && <div className="xs dim">{permit.basis}</div>}{refusal && <div className="xs dim">{refusal}</div>}</td>
                    <td className="num mono">{money(cost)}</td>
                    <td className="num mono">{permit ? money(permit.lines.reduce((a, l) => a + l.amount, 0)) : '—'}</td>
                    <td className="num mono">{project.days + (permit?.waitDays ?? 0)} {project.days + (permit?.waitDays ?? 0) === 1 ? 'day' : 'days'}</td>
                    <td className="num mono">{money(adds)}</td>
                    <td><Gated feature="home.renovate" className="btn btn-sm btn-ghost" disabled={Boolean(refusal)} onClick={() => run('home.renovate', { homeId: owned.id, projectId: project.id })}>Start The Work</Gated></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Furniture />
        <FitOut owned={owned} />

        <div className="col gap-2">
          <div className="strong small">Selling It</div>
          {owned.selling ? (
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="small">It’s listed, and the sale closes {formatDate(owned.selling.closesAt, city.timeZone)}.{owned.selling.then ? ` You move into ${owned.selling.then === 'own' ? 'a place of your own' : 'a room'} that day, if the bank can pay its deposit; otherwise a friend’s sofa.` : ''}</span>
              <Gated feature="home.cancel" className="btn btn-sm btn-ghost" onClick={() => run('home.cancel', { homeId: owned.id })}>Call It Off</Gated>
            </div>
          ) : (
            <>
              <div className="small">At its worth today it would leave you {money(net)}, after {Math.round(termsIn(city.countryId).selling * 1000) / 10}% to the agents and the closing and what’s borrowed on it paid off. It closes {HOME.saleDays} days after it’s listed.</div>
              <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {lives && (
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor={`sell-then-${owned.id}`}>Then Rent</label>
                    <select id={`sell-then-${owned.id}`} value={then} onChange={(e) => setThen(e.target.value === 'shared' ? 'shared' : 'own')}>
                      <option value="shared">A Room</option>
                      <option value="own">A Place Of Your Own</option>
                    </select>
                  </div>
                )}
                <Gated feature="home.sell" className="btn btn-sm" disabled={Boolean(noSale)} onClick={() => run('home.sell', { homeId: owned.id, ...(lives ? { then } : {}) })}>Sell It</Gated>
              </div>
              {noSale && <div className="xs dim">{noSale}</div>}
            </>
          )}
        </div>
        <Fine>What each job costs and returns at sale is SLATE’s estimate of a typical American job, at the town’s cost of living; the pattern follows the remodeling trade’s cost-against-value surveys. Past half again what the home cost, a job returns half as much. A worn part can fail, the likelier the more worn; storms and hard freezes can damage a house, and a fire any home; the insurance pays that damage over a {money(atTown(sim, owned.cityId, HOME.deductibleUsd))} deductible, never wear, and each claim puts a fifth on the premium for three years. What fails and how often, what it costs, what a home lets for by its bedrooms and how tenants behave are SLATE’s estimates.</Fine>
      </div>
    </Panel>
  );
}

/** Letting a home, or its cottage: offered, let, or neither. */
function Letting({ owned, unit }: { owned: OwnedHome; unit: Tenancy['unit'] }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const zone = CITIES.require(owned.cityId).timeZone;
  const market = useWorld((s) => marketRent(s, owned, unit), [owned, unit]);
  const t = owned.tenancies.find((one) => one.unit === unit);
  const [typed, setTyped] = useState('');
  const rent = typed ? centsFromTyped(typed) : market;
  const refusal = useWorld((s) => letRefusal(s, s.player, owned, unit, rent), [owned, unit, rent]);
  const name = unit === 'adu' ? 'The Cottage' : 'The Home';
  return (
    <div className="col gap-1">
      <div className="strong small">Letting {name}</div>
      {t?.status === 'let' && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">Let at {money(t.rent)} a month; the lease ends {formatDate(t.leaseEnds!, zone)}{t.notice ? ', and the tenant has been given notice' : ''}.</span>
          {!t.notice && <Gated feature="home.end_tenancy" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.end_tenancy', { homeId: owned.id, unit }).ok) toast('Notice given: the tenant leaves when the lease ends.', 'positive'); }}>End The Tenancy</Gated>}
        </div>
      )}
      {t?.status === 'advertised' && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">Advertised at {money(t.rent)} a month since {formatDate(t.since, zone)}.</span>
          <Gated feature="home.end_tenancy" className="btn btn-sm btn-ghost" onClick={() => run('home.end_tenancy', { homeId: owned.id, unit })}>End The Tenancy</Gated>
        </div>
      )}
      {!t && (
        <>
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor={`rent-${owned.id}-${unit}`}>Rent A Month ({cur})</label>
              <input id={`rent-${owned.id}-${unit}`} inputMode="decimal" value={typed} placeholder={String(market / 100)} onChange={(e) => setTyped(e.target.value)} />
            </div>
            <Gated feature="home.let" className="btn btn-sm btn-ghost" disabled={Boolean(refusal)} onClick={() => { if (run('home.let', { homeId: owned.id, unit, rent }).ok) toast('Advertised.', 'positive'); }}>Let It</Gated>
          </div>
          <div className="xs dim">{refusal ?? `It lets for about ${money(market)} a month here; nearer that, a tenant comes sooner. A year’s lease, a month’s deposit, and the repairs are yours.`}</div>
        </>
      )}
    </div>
  );
}

/** Appliances fitted to a home owned (`systems/appliances.ts`): what it has, what one costs fitted, and how long it lasts. */
function FitOut({ owned }: { owned: OwnedHome }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const f = fixturesOf(sim, person, owned.cityId, owned.facts, owned.id);
  const kinds = Object.keys(APPLIANCE_LABEL) as ApplianceKind[];
  const table = appliancesIn(owned.cityId);
  return (
    <div className="col gap-2">
      <div className="strong small">Appliances</div>
      {!table ? <div className="xs dim">SLATE keeps no appliance prices in this country yet.</div> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Appliance</th><th scope="col">Has It</th><th scope="col" className="num">Fitted</th><th scope="col" className="num">Lasts</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {kinds.map((kind) => {
                const cost = applianceCost(sim, owned.cityId, kind);
                const no = fitRefusal(sim, person, owned, kind);
                const has = hasAppliance(f, kind);
                return (
                  <tr key={kind}>
                    <td>{APPLIANCE_LABEL[kind]}{cost === undefined ? <div className="xs dim">No price published here</div> : null}</td>
                    <td className="small">{has ? 'Yes' : 'No'}</td>
                    <td className="num mono">{cost === undefined ? '—' : formatMoney(cost, cur, { cents: false })}</td>
                    <td className="num mono">{APPLIANCE_LIFE[kind]} years</td>
                    <td>{!has && cost !== undefined && <Gated feature="home.fit" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.fit', { homeId: owned.id, kind }).ok) toast(`${APPLIANCE_LABEL[kind]} fitted.`, 'positive'); }}>Buy And Fit</Gated>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Their own bed and sofa (`systems/furniture.ts`): theirs wherever they live, and what an empty home goes without. */
function Furniture() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const where = person.home?.cityId ?? person.currentLocationId;
  const pieces: Piece[] = ['bed', 'sofa'];
  const does: Record<Piece, string> = { bed: 'Without one, an empty home’s nights are slept on the floor', sofa: 'Without one, unwinding in an empty home takes half the stress off' };
  return (
    <div className="col gap-2">
      <div className="strong small">Your Furniture</div>
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Piece</th><th scope="col">Yours</th><th scope="col" className="num">Delivered</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {pieces.map((piece) => {
              const cost = pieceCost(sim, where, piece);
              const no = furnishRefusal(sim, person, piece);
              const has = owns(person, piece);
              return (
                <tr key={piece}>
                  <td>{PIECE_LABEL[piece]}<div className="xs dim">{does[piece]}</div></td>
                  <td className="small">{has ? 'Yes' : 'No'}</td>
                  <td className="num mono">{cost ? formatMoney(cost.amount, cur, { cents: false }) : '—'}</td>
                  <td>{!has && cost && <Gated feature="home.furnish" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.furnish', { piece }).ok) toast(`${PIECE_LABEL[piece]}, delivered.`, 'positive'); }}>Buy And Deliver</Gated>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
