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
import { harvestRefusal, plantRefusal, plantingIn, plotsOf, ripeAt } from '@/engine/systems/garden';
import { CROPS, type Crop } from '@/engine/content/garden';
import { CatalogControls, CompareTable, CompareToggle, FavoriteToggle, ShowMore, useCatalogView, useCompare, usePaged } from '@/ui/components/Catalog';
import { arrange } from '@/engine/systems/catalog';
import { applianceCatalog, furnitureCatalog, homeCatalog } from '@/engine/systems/catalogs';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { centsFromTyped, formatMoney, saveCurrency } from '@/engine/core/money';
import { APPLIANCE_LABEL, APPLIANCE_LIFE } from '@/engine/content/appliances';
import { applianceCost, appliancesIn, fitRefusal, hasAppliance, applianceModels, fittedModel, modelFitCost } from '@/engine/systems/appliances';
import { fixturesOf } from '@/engine/systems/dwelling';
import { PIECE_LABEL, type Piece } from '@/engine/content/furniture';
import { bedAtHome, bedQuote, bedsIn, furnishRefusal, mattressCost, mattressRefusal, mattressWorn, owns, pieceCost } from '@/engine/systems/furniture';
import { BED_MARKET, bedSize } from '@/engine/content/beds';
import { RENTED_TRUCK } from '@/engine/content/furniture';
import { assemblyFee, pieceRefusal, piecesCatalog, seatsAtHome } from '@/engine/systems/furnishings';
import { buyTvRefusal, tvAtHome, tvCatalog } from '@/engine/systems/televisions';
import { buySpeakerRefusal, speakerCatalog } from '@/engine/systems/speakers';
import { bulbCatalog, bulbRefusal, darkSockets, fitRefusal as bulbFitRefusal, lampCatalog, lampRefusal, lightsOf, spareBulbs } from '@/engine/systems/lighting';
import { DeviceShop, type DeviceRow } from '@/ui/components/DeviceShop';
import { ROOM_RENT, lodgerRefusal, lodgersIn, roomRent } from '@/engine/systems/lodgers';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COOLING_LABEL, COUNCIL_TAX, FEATURE_LABEL, GYM_LABEL, LAUNDRY_LABEL, OUTDOOR_LABEL, PART_LABEL, conditionWord, homeValueAt, sharedCostsLabel, typeLabel, type Part } from '@/engine/content/homes';
import {
  HOME, askingPrice, minimumDown, atTown, inspectionFee, borrowRefusal, councilBand, councilLetter, councilNation, daysListed, downChoices, equityIn, equityRate, equityRoom, homeValue, letRefusal, lifeOf,
  listingById, listingsIn, livingIn, marketRent, refinanceOffer, refinanceRefusal, moveInRefusal, offerFor, offerRefusal, owedOn, ownedMonth, projectsFor, saleNet,
  sellRefusal, sizeText, termsIn, type HomeFacts, type Listing, type OwnedHome, type SellerAnswer, type Tenancy,
} from '@/engine/systems/homes';
import { CAREER_CITIES } from '@/engine/content/career';
import { managerIn } from '@/engine/systems/propertymanagers';
import { LAWNS, MOWN_CM, gardenerPrice } from '@/engine/systems/lawns';
import { inTheBank } from '@/engine/systems/household';
import { dateKey } from '@/engine/core/time';
import { groupLabelOf } from '@/ui/shell/destinations';
import { LookRegion, Open, at } from '@/ui/looks';

type HomesTab = 'sale' | 'yours';

const HOMES_TABS: readonly { id: HomesTab; label: string }[] = [
  { id: 'sale', label: 'For Sale' },
  { id: 'yours', label: 'Your Homes' },
];

/** A home's lawn: how long it is, and a gardener by the visit (`home.gardener`). */
function LawnRow({ owned }: { owned: OwnedHome }) {
  const { sim, run, toast } = useGame();
  const lawn = owned.facts.features.includes('yard') && LAWNS[owned.cityId] && !owned.tenancies.some((t) => t.unit === 'main' && t.status === 'let') ? owned.lawn ?? { cm: MOWN_CM } : undefined;
  if (!lawn) return null;
  const g = LAWNS[owned.cityId]!.gardener;
  const price = formatMoney(gardenerPrice(sim, owned.cityId), saveCurrency(sim.universe), { cents: false });
  const limit = LAWNS[owned.cityId]!.limitCm;
  return (
    <div className="row-between small">
      <span>{`The Lawn, ${Math.round(lawn.cm)} cm${limit ? ` (The City’s Limit ${Math.round(limit)} cm)` : ''}${lawn.noticeAt ? ', A Notice To Cut It' : ''}`}</span>
      <Gated feature="home.gardener" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.gardener', { homeId: owned.id, on: !lawn.gardener }).ok) toast(lawn.gardener ? 'No gardener now.' : `${g.name}, every ${g.everyDays === 7 ? 'week' : 'two weeks'} in the season.`, 'positive'); }}>{lawn.gardener ? 'Let The Gardener Go' : `Hire A Gardener, ${price} A Visit`}</Gated>
    </div>
  );
}

export function HomesWorkspace() {
  const owns = useWorld((s) => (s.player.homes ?? []).length > 0);
  const [tab, setTab] = useState<HomesTab>(owns ? 'yours' : 'sale');
  const panes: Record<HomesTab, JSX.Element> = { sale: <ForSalePane />, yours: <YourHomesPane /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/homes')}</div>
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
  // The listings as a catalog: the cheapest asking price first, searched and filtered (`systems/catalogs.ts`).
  const [view, setView] = useCatalogView(`homes-${town}`);
  const homeEntries = useWorld((s) => homeCatalog(s, town), [town]);
  const shown = arrange(homeEntries, view).map((e) => e.value);
  // Up to three set side by side (from 2026-10-04), kept for the town.
  const [compared, toggleCompare, clearCompare] = useCompare(`homes-${town}`);
  const side = compared.map((id) => homes.find((h) => h.id === id)).filter((h): h is (typeof homes)[number] => Boolean(h));
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
    else toast('Turned down by the seller.', 'neutral');
  };
  const countered = counter && counter.until >= sim.now ? listingById(sim, counter.listingId) : undefined;
  return (
    <div className="col gap-4">
      {buying && <Purchase />}
      {counter && countered && (
        <Panel title="The Seller Countered">
          <LookRegion>
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small"><Open subject={at('listing', countered.id)}>{countered.address}</Open>: {money(counter.price)}, until {formatDate(counter.until, CITIES.require(countered.cityId).timeZone)}. Offer it and it’s yours.</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setTown(countered.cityId); setChosen(countered.id); setTyped(String(counter.price / 100)); }}>Look</button>
          </div>
          </LookRegion>
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
          <Panel title={listing.address} look={at('listing', listing.id)} subtitle={`${money(asking)} · #${listing.rank} of ${homes.length} · ${daysListed(sim, listing)} days on the market${listing.source === 'simulated' ? ' · A Simulated Listing' : ''}`}>
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
                    {inspect && <tr><th scope="row">The Inspection, When Its Report Comes</th><td className="num mono">{money(inspectionFee(sim, town, listing!.type))}</td></tr>}
                    <tr><th scope="row">At Closing</th><td className="num mono">{money(offer.cash - offer.earnest)}</td></tr>
                    {offer.loan > 0 && <tr><th scope="row">Principal And Interest</th><td className="num mono">{money(offer.month.mortgage)}</td></tr>}
                    <tr><th scope="row">{councilNation(town) ? `Council Tax, Band ${councilLetter(town, councilBand(sim, offer.price, town))}${living ? '' : ', Until It’s Let'}` : 'Property Tax'}</th><td className="num mono">{money(offer.month.tax)}</td></tr>
                    <tr><th scope="row">Insurance</th><td className="num mono">{money(offer.month.insurance)}</td></tr>
                    {offer.month.pmi > 0 && <tr><th scope="row">Mortgage Insurance</th><td className="num mono">{money(offer.month.pmi)}</td></tr>}
                    {offer.month.hoa > 0 && <tr><th scope="row">{listing!.tenure === 'leasehold' ? 'Ground Rent And Service Charge' : shared}</th><td className="num mono">{money(offer.month.hoa)}</td></tr>}
                    {listing!.tenure && <tr><th scope="row">Tenure</th><td className="num">{listing!.tenure === 'leasehold' ? 'Leasehold' : 'Freehold'}</td></tr>}
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
      <LookRegion>
      <Panel title={<>For Sale In <Open subject={at('place', town)}>{city.name}</Open></>} subtitle={`The typical home: ${money(typical.value)} as of ${formatDate(typical.asOf, city.timeZone)}, ${(typical.growth * 100).toFixed(1)}% a year`}>
        <LookRegion className="col gap-3">
          <CatalogControls id="homes-catalog" entries={homeEntries} view={view} onChange={setView} facets={{ type: 'Kind', beds: 'Bedrooms' }} />
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col" className="num">#</th><th scope="col">Home</th><th scope="col">Address</th><th scope="col" className="num">Size</th><th scope="col" className="num">Built</th><th scope="col" className="num">Days Listed</th><th scope="col" className="num">Price</th><th scope="col" /></tr>
              </thead>
              <tbody>
                {shown.map((one) => (
                  <tr key={one.id} aria-selected={one.id === chosen}>
                    <td className="num mono">{one.rank}</td>
                    <td>{typeLabel(one.type, city.countryId)}, {bedsText(one.beds)}, {bathsText(one.baths)}</td>
                    <td><Open subject={at('listing', one.id)}>{one.address}</Open></td>
                    <td className="num mono">{sizeText(one.size, city.countryId)}</td>
                    <td className="num mono">{one.built}</td>
                    <td className="num mono">{daysListed(sim, one)}</td>
                    <td className="num mono">{money(askingPrice(sim, one))}</td>
                    <td className="row gap-1"><CompareToggle on={compared.includes(one.id)} onToggle={() => toggleCompare(one.id)} /><button type="button" className="btn btn-sm btn-ghost" onClick={() => choose(one)}>Look</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CompareTable heads={side.map((h) => h.address)} onClear={clearCompare} rows={[
            { label: 'Asking Price', values: side.map((h) => money(askingPrice(sim, h))) },
            { label: 'Kind', values: side.map((h) => typeLabel(h.type, city.countryId)) },
            { label: 'Bedrooms', values: side.map((h) => bedsText(h.beds)) },
            { label: 'Bathrooms', values: side.map((h) => bathsText(h.baths)) },
            { label: 'Size', values: side.map((h) => sizeText(h.size, city.countryId)) },
            { label: 'Built', values: side.map((h) => String(h.built)) },
            { label: 'Days Listed', values: side.map((h) => String(daysListed(sim, h))) },
            { label: 'Has', values: side.map((h) => h.features.map((f) => FEATURE_LABEL[f]).join(', ') || '—') },
          ]} />
          <Fine>
            {typical.kind === 'zillow'
              ? 'The town’s typical home is Zillow’s Home Value Index (Zillow Research, zillow.com/research/data), its middle third, and its five years’ growth. '
              : typical.kind === 'calibrated'
                ? 'Zillow doesn’t report this town: its typical home is its rent times what homes cost over a year’s rent in the towns of its state that Zillow does. '
                : 'The typical home here is SLATE’s estimate: the town’s rent times how dear homes run over rents in this country, measured against America’s. '}
            The fifty homes are the game’s own, drawn about it: none is a real listing, and the addresses are common street names of the country with numbers of SLATE’s. Each sells in a month to six and another comes on; one unsold two months is cut 3%, and at four 3% again. How a seller answers an offer, rates, down payments and closing costs are SLATE’s estimates of the country’s{city.countryId === 'uk' ? ', but for Britain’s taxes on buying: England’s and Northern Ireland’s Stamp Duty Land Tax, Scotland’s Land and Buildings Transaction Tax and Wales’s Land Transaction Tax, each with its own rate on a home bought beside one already owned' : ''}.{councilNation(town) ? ` Council tax is by band, from the ${COUNCIL_TAX.bandDYear} average Band D the nation’s councils set, ${formatMoney(councilNation(town)!.bandD, 'GBP', { cents: false })}.` : ''} A home not to live in is an investment: at least {Math.round(HOME.investmentDown * 100)}% down and {pct(HOME.investmentRate)} on the rate.
          </Fine>
        </LookRegion>
      </Panel>
      </LookRegion>
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
    <LookRegion>
    <Panel
      title="Your Purchase"
      subtitle={<><Open subject={at('listing', buying.listingId)}>{buying.facts.address}</Open>{` · ${money(buying.price)} · ${buying.down >= 1 ? 'cash' : `${Math.round(buying.down * 100)}% down`}${buying.live ? '' : ' · to let'}`}</>}
      actions={<Gated feature="home.cancel" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.cancel', {}).ok) toast(walkAway ? 'Called off. Your earnest money comes back.' : 'Called off. The seller keeps your earnest money.', 'neutral'); }}>Call It Off</Gated>}
    >
      <div className="col gap-3 small">
        <div>{money(buying.earnest)} of earnest money is in <Open subject={at('account', buying.escrowAccountId)}>escrow</Open>. It closes <Open subject={at('day', dateKey(buying.closesAt, sim.homeZone))}>{formatDate(buying.closesAt, zone)}</Open>, when the rest has to be in the bank.</div>
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
    </LookRegion>
  );
}

function YourHomesPane() {
  const homes = useWorld((s) => s.player.homes ?? []);
  if (homes.length === 0) {
    return <div className="empty"><h3>You Don’t Own A Home</h3><p className="small">Homes for sale are on the other tab.</p></div>;
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
  const [bidPick, setBidPick] = useState<Record<string, number>>({});
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
    <Panel title={owned.facts.address} look={at('home', `owned:${owned.id}`)} subtitle={<><Open subject={at('place', owned.cityId)}>{city.name}</Open>{` · ${use} · bought `}<Open subject={at('day', dateKey(owned.boughtAt, sim.homeZone))}>{formatDate(owned.boughtAt, city.timeZone)}</Open>{` for ${money(owned.price)}`}</>}>
      <div className="col gap-4">
        <div className="stats">
          <Stat label="Worth" look={at('home', `owned:${owned.id}`)} value={money(value)} note="Its price and the work, at today’s market" />
          {mortgage > 0 && <Stat label="Mortgage" look={at('account', owned.mortgage!.accountId)} value={money(mortgage)} note={`${pct(owned.mortgage!.rate)}${owned.mortgage!.pmi ? ', with mortgage insurance' : ''}`} />}
          {equityLoan > 0 && <Stat label="Home Equity Loan" look={at('account', owned.equity!.accountId)} value={money(equityLoan)} note={pct(owned.equity!.rate)} />}
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
        <Agent owned={owned} />

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

        <LawnRow owned={owned} />

        <div className="col gap-2">
          <div className="strong small">Work On It{owned.works.length > 0 ? ` · ${owned.works.length} under way` : ''}</div>
          {owned.works.length > 0 && (
            <ul className="small">
              {owned.works.map((w) => <li key={w.projectId}>{projects.find((p) => p.project.id === w.projectId)?.project.label ?? w.projectId}: done <Open subject={at('day', dateKey(w.doneAt, sim.homeZone))}>{formatDate(w.doneAt, city.timeZone)}</Open>{w.paid !== undefined && w.paid < w.cost ? ` · ${money(w.paid)} paid, ${money(w.cost - w.paid)} when it’s done` : ''}{w.coolUntil !== undefined && w.coolUntil > sim.now && <> · <Gated feature="home.cancel_works" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ refunded: number }>('home.cancel_works', { homeId: owned.id, projectId: w.projectId }); if (r.ok) toast(`Canceled, ${money(r.value!.refunded)} back.`, 'positive'); }}>{`Cancel It, Until ${formatDate(w.coolUntil, city.timeZone)}`}</Gated></>}</li>)}
            </ul>
          )}
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Work</th><th scope="col" className="num">Three Bids</th><th scope="col" className="num">Permit</th><th scope="col" className="num">Takes</th><th scope="col" className="num">Adds To Its Worth</th><th scope="col" /></tr></thead>
              <tbody>
                {[...projects].sort((a, b) => a.cost - b.cost || a.project.label.localeCompare(b.project.label)).map(({ project, bids, adds, permit, refusal, instead }) => (
                  <tr key={project.id}>
                    <td>{project.label}{permit && <div className="xs dim">{permit.basis}</div>}{refusal && <div className="xs dim">{refusal}</div>}{instead && <div className="xs dim">{`Instead: ${instead.join('; ')}.`}</div>}</td>
                    <td className="num mono"><select aria-label={`The Bid For ${project.label}`} value={bidPick[project.id] ?? 0} onChange={(e) => setBidPick({ ...bidPick, [project.id]: Number(e.target.value) })}>{bids.map((b, i) => <option key={i} value={i}>{money(b)}</option>)}</select></td>
                    <td className="num mono">{permit ? money(permit.lines.reduce((a, l) => a + l.amount, 0)) : '—'}</td>
                    <td className="num mono">{project.days + (permit?.waitDays ?? 0)} {project.days + (permit?.waitDays ?? 0) === 1 ? 'day' : 'days'}</td>
                    <td className="num mono">{money(adds)}</td>
                    <td><Gated feature="home.renovate" className="btn btn-sm btn-ghost" disabled={Boolean(refusal)} onClick={() => run('home.renovate', { homeId: owned.id, projectId: project.id, bid: bidPick[project.id] ?? 0 })}>Start The Work</Gated></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Furniture />
        <Garden owned={owned} />
        <FitOut owned={owned} />
        <Lodgers owned={owned} />

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

/** A letting agent for a home, where one publishes its fees (`systems/propertymanagers.ts`). */
/** A garden bed and a greenhouse at the home they live in: planted, ripening, picked into the kitchen (`systems/garden.ts`, from 2026-10-04). */
function Garden({ owned }: { owned: OwnedHome }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [crop, setCrop] = useState<Record<string, Crop>>({});
  if (livingIn(person)?.id !== owned.id) return null;
  const plots = plotsOf(person);
  if (!plots.length) return null;
  return (
    <div className="col gap-2">
      <div className="strong small">The Garden</div>
      {plots.map((plot) => {
        const growing = plantingIn(person, plot);
        const chosen = crop[plot] ?? 'tomato';
        const plantNo = plantRefusal(sim, person, plot, chosen);
        const pickNo = harvestRefusal(sim, person, plot);
        return (
          <div key={plot} className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small" style={{ minWidth: '9rem' }}>{plot === 'bed' ? 'Raised Garden Bed' : 'Greenhouse'}</span>
            {growing ? (
              <>
                <span className="small">{`${CROPS[growing.crop].label}, ripe about ${formatDate(ripeAt(growing), sim.zone)}`}</span>
                <Gated feature="garden.harvest" className="btn btn-sm btn-ghost" disabled={Boolean(pickNo)} title={pickNo} onClick={() => { const r = run<{ amount: number }>('garden.harvest', { plot }); if (r.ok) toast(`Picked: ${CROPS[growing.crop].unit === 'ct' ? `${r.value!.amount} heads` : `${(r.value!.amount / 1000).toFixed(1)} kg`} into the kitchen.`, 'positive'); }}>Pick It</Gated>
              </>
            ) : (
              <>
                <select aria-label="What To Plant" value={chosen} onChange={(e) => setCrop((x) => ({ ...x, [plot]: e.target.value as Crop }))}>
                  {(Object.keys(CROPS) as Crop[]).map((c) => <option key={c} value={c}>{`${CROPS[c].label}, ${CROPS[c].days} Days`}</option>)}
                </select>
                <Gated feature="garden.plant" className="btn btn-sm btn-ghost" disabled={Boolean(plantNo)} title={plantNo} onClick={() => { const r = run<{ ripeAt: number }>('garden.plant', { plot, crop: chosen }); if (r.ok) toast(`Planted; ripe about ${formatDate(r.value!.ripeAt, sim.zone)}.`, 'positive'); }}>Plant It</Gated>
                {plantNo ? <span className="xs dim">{plantNo}</span> : null}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Agent({ owned }: { owned: OwnedHome }) {
  const { run, toast } = useGame();
  const m = managerIn(owned.cityId);
  if (!m) return null;
  const terms = `${m.flat ? 'a flat fee a month' : 'a share of each month’s rent'}, a fee to let it to a new tenant${m.renewal ? ' and one on a renewal' : ''}`;
  return (
    <div className="field-row">
      <span className="xs dim">{owned.manager ? `${m.name} manages it: ${terms}.` : `Let yourself, a tenant moves in while you’re in town. ${m.name} would manage it: ${terms}.`}</span>
      {owned.manager
        ? <Gated feature="home.manager" className="btn btn-sm btn-ghost" onClick={() => run('home.manager', { homeId: owned.id, on: false })}>Manage It Yourself</Gated>
        : <Gated feature="home.manager" className="btn btn-sm btn-ghost" title={`${m.source}`} onClick={() => { if (run('home.manager', { homeId: owned.id, on: true }).ok) toast(`${m.name} manages it from now.`, 'positive'); }}>{`Hire ${m.name}`}</Gated>}
    </div>
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
  // The cheapest fitted first, an appliance without a published price last (`applianceCatalog`).
  const kinds = arrange(applianceCatalog(sim, owned.cityId)).map((e) => e.value);
  const table = appliancesIn(owned.cityId);
  // A make and model where one's chosen (from 2026-10-05), by kind; the country's typical machine otherwise.
  const [models, setModels] = useState<Record<string, string>>({});
  return (
    <div className="col gap-2">
      <div className="strong small">Appliances</div>
      {!table ? <div className="xs dim">SLATE keeps no appliance prices in this country yet.</div> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Appliance</th><th scope="col">Has It</th><th scope="col" className="num">Fitted</th><th scope="col" className="num">Lasts</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {kinds.map((kind) => {
                const offered = applianceModels(sim, owned.cityId, kind);
                const pick = offered.find((m) => m.offer.id === models[kind]);
                const fit = pick ? modelFitCost(sim, owned, kind, pick.offer.id) : undefined;
                const cost = typeof fit === 'number' ? fit : applianceCost(sim, owned.cityId, kind);
                const no = fitRefusal(sim, person, owned, kind);
                const has = hasAppliance(f, kind);
                const fitted = fittedModel(owned, kind);
                return (
                  <tr key={kind}>
                    <td>{APPLIANCE_LABEL[kind]}{cost === undefined ? <div className="xs dim">No price published here</div> : null}{fitted ? <div className="xs dim">{`${fitted.brand} ${fitted.model}${typeof fitted.attrs.kwhPerCycle === 'number' ? `, ${fitted.attrs.kwhPerCycle} kWh A Cycle` : ''}`}</div> : null}{!has && offered.length > 0 ? <select aria-label={`Model Of ${APPLIANCE_LABEL[kind]}`} value={models[kind] ?? ''} onChange={(e) => setModels((x) => ({ ...x, [kind]: e.target.value }))}><option value="">The Typical Machine</option>{offered.map((m) => <option key={m.offer.id} value={m.offer.id}>{`${m.product.brand} ${m.offer.code ?? m.product.model}, ${formatMoney(m.price, cur, { cents: false })}${typeof m.product.attrs.kwhPerCycle === 'number' ? `, ${m.product.attrs.kwhPerCycle} kWh A Cycle` : ''}`}</option>)}</select> : null}</td>
                    <td className="small">{has ? 'Yes' : 'No'}</td>
                    <td className="num mono">{cost === undefined ? '—' : formatMoney(cost, cur, { cents: false })}</td>
                    <td className="num mono">{APPLIANCE_LIFE[kind]} years</td>
                    <td>{!has && cost !== undefined && <Gated feature="home.fit" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.fit', { homeId: owned.id, kind, ...(pick ? { offerId: pick.offer.id } : {}) }).ok) toast(`${pick ? `${pick.product.brand} ${pick.product.model}` : APPLIANCE_LABEL[kind]} fitted.`, 'positive'); }}>Buy And Fit</Gated>}</td>
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

/**
 * A television of one's own (`systems/televisions.ts`, from 2026-10-05) and a
 * speaker (`systems/speakers.ts`): the models sold where they live, on the
 * shared device shop (`DeviceShop`), each kept as the home's TV or speaker.
 */
function Televisions() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const owned = tvAtHome(person);
  const gate = useFeature('tv.buy');
  const band = (inches: number) => (inches < 40 ? 'Under 40 Inches' : inches < 55 ? '40 To 54 Inches' : inches < 70 ? '55 To 69 Inches' : '70 Inches And Over');
  const watts = (r: DeviceRow) => (typeof r.product.attrs.onModeWatts === 'number' ? `${r.product.attrs.powerBasis === 'estimate' ? '≈' : ''}${r.product.attrs.onModeWatts} W` : 'Not Read');
  return (
    <DeviceShop list="tvs" title={`Televisions${owned ? ` · Yours: ${owned.label}` : ''}`} shop={tvCatalog(sim, person)} refusal={(id) => buyTvRefusal(person, id)} command="tv.buy" gate={gate} bought={(label) => `${label}, bought and brought home.`}
      facets={{ brand: 'Maker', panel: 'Panel', resolution: 'Resolution', size: 'Size' }}
      facetsOf={(r) => ({ brand: r.product.brand, panel: String(r.product.attrs.panel ?? 'LED'), resolution: String(r.product.attrs.resolution ?? 'Not Read'), size: band(Number(r.product.attrs.sizeIn)) })}
      columns={[
        { head: 'Size', num: true, cell: (r) => `${r.product.attrs.sizeIn}"` },
        { head: 'Panel', cell: (r) => String(r.product.attrs.panel ?? '—') },
        { head: 'On', num: true, cell: watts },
      ]}
      compare={[
        { label: 'Size', value: (r) => `${r.product.attrs.sizeIn} Inches` },
        { label: 'Panel', value: (r) => String(r.product.attrs.panel ?? '—') },
        { label: 'Resolution', value: (r) => String(r.product.attrs.resolution ?? '—') },
        { label: 'Refresh', value: (r) => (r.product.attrs.refreshHz ? `${r.product.attrs.refreshHz} Hz` : '—') },
        { label: 'Smart Platform', value: (r) => String(r.product.attrs.smartOs ?? '—') },
        { label: 'On-Mode Power', value: watts },
        { label: 'Model Year', value: (r) => String(r.product.attrs.year ?? '—') },
      ]}
      fine="Each set at its maker’s or a retailer’s own page, America’s and Canada’s prices with the place’s sales tax added, named by the code its market sells it under. Its on-mode power is its energy label’s where one was read, or, marked ≈, its screen’s area at ENERGY STAR’s median watts a square inch, SLATE’s estimate; watching past a typical household’s 2.6 hours a day is billed." />
  );
}

const SPEAKER_KIND: Readonly<Record<string, string>> = { wireless: 'Wireless', smart: 'Smart', bookshelf: 'Bookshelf', floorstanding: 'Floor-Standing', soundbar: 'Soundbar', powered: 'Powered', portable: 'Portable' };
function Speakers() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const gate = useFeature('speaker.buy');
  return (
    <DeviceShop list="speakers" title="Speakers" shop={speakerCatalog(sim, person)} refusal={(id) => buySpeakerRefusal(person, id)} command="speaker.buy" gate={gate} bought={(label) => `${label}, bought and brought home.`}
      facets={{ brand: 'Maker', kind: 'Kind' }}
      facetsOf={(r) => ({ brand: r.product.brand, kind: SPEAKER_KIND[String(r.product.attrs.type)] ?? 'Wireless' })}
      columns={[
        { head: 'Kind', cell: (r) => `${SPEAKER_KIND[String(r.product.attrs.type)] ?? '—'}${r.product.attrs.pair ? ', A Pair' : ''}` },
        { head: 'Power', num: true, cell: (r) => (r.product.attrs.watts ? `${r.product.attrs.watts} W` : '—') },
      ]}
      compare={[
        { label: 'Kind', value: (r) => SPEAKER_KIND[String(r.product.attrs.type)] ?? '—' },
        { label: 'A Pair', value: (r) => (r.product.attrs.pair ? 'Yes' : 'No') },
        { label: 'Power', value: (r) => (r.product.attrs.watts ? `${r.product.attrs.watts} W` : '—') },
      ]}
      fine="Each at its maker’s or a retailer’s own page, America’s and Canada’s prices with the place’s sales tax added; its power is its maker’s stated amplifier power. The one bought is the home’s speaker, what a music lover unwinds with." />
  );
}
const SOCKET_LABEL: Readonly<Record<string, string>> = { edison: 'Screw (E26/E27)', bayonet: 'Bayonet (B22)', gu10: 'Spot (GU10)', e14: 'Small Screw (E14)', e12: 'Candle (E12)', led: 'Built-In LED' };
const LAMP_KIND: Readonly<Record<string, string>> = { floor: 'Floor Lamp', table: 'Table Lamp', desk: 'Desk Lamp', pendant: 'Pendant', ceiling: 'Ceiling Light', wall: 'Wall Light' };
/**
 * The home's lights (`systems/lighting.ts`, from 2026-10-05): its sockets and
 * the bulbs in them, those gone out, the spares to fit, and bulbs and lamps
 * where they live on the shared device shop.
 */
function Lighting() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const fit = useFeature('lighting.fit');
  const bulbGate = useFeature('lighting.buy_bulbs');
  const lampGate = useFeature('lighting.buy_lamp');
  const lights = lightsOf(person);
  if (!lights) return null;
  const dark = darkSockets(person).length;
  const bySocket = new Map<string, { lit: number; watts: number }>();
  for (const s of lights.sockets) { const x = bySocket.get(s.socket) ?? { lit: 0, watts: 0 }; if (s.watts !== undefined) { x.lit += 1; x.watts += s.watts; } bySocket.set(s.socket, x); }
  const spares = spareBulbs(person);
  const watts = (r: DeviceRow) => `${r.product.attrs.wattsBasis === 'estimate' ? '≈' : ''}${r.product.attrs.watts} W`;
  return (
    <div className="col gap-2">
      <div className="strong small">Lighting</div>
      <div className="small">{lights.sockets.length} sockets, {dark === 0 ? 'every one lit' : `${dark} dark for want of a bulb`}: {[...bySocket.entries()].map(([s, x]) => `${SOCKET_LABEL[s] ?? s} ${x.lit} lit, ${Math.round(x.watts)} W`).join(' · ')}.</div>
      {spares.length > 0 && (
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {spares.map(({ item, product }) => {
            const no = bulbFitRefusal(person, product.id);
            return <button key={item.id} type="button" className="btn btn-sm btn-ghost" disabled={!fit.open || Boolean(no)} title={no ?? fit.reason} onClick={() => { const r = run<{ fitted: number }>('lighting.fit', { productId: product.id }); if (r.ok) toast(`${r.value?.fitted ?? 0} fitted.`, 'positive'); }}>Fit {item.label} ({item.quantity} Spare)</button>;
          })}
        </div>
      )}
      <DeviceShop list="bulbs" title="Light Bulbs" shop={bulbCatalog(sim, person)} refusal={(id) => bulbRefusal(person, id)} command="lighting.buy_bulbs" gate={bulbGate} bought={(label) => `${label}, bought and put away.`}
        facets={{ brand: 'Maker', socket: 'Socket', smart: 'Smart' }}
        facetsOf={(r) => ({ brand: r.product.brand, socket: SOCKET_LABEL[String(r.product.attrs.socket)] ?? 'Other', smart: r.product.attrs.smart ? 'Smart' : 'Plain' })}
        columns={[
          { head: 'Socket', cell: (r) => SOCKET_LABEL[String(r.product.attrs.socket)] ?? '—' },
          { head: 'Draw', num: true, cell: watts },
          { head: 'Light', num: true, cell: (r) => (r.product.attrs.lumens ? `${r.product.attrs.lumens} lm` : '—') },
          { head: 'In A Pack', num: true, cell: (r) => String(r.product.attrs.pack) },
        ]}
        compare={[
          { label: 'Draw', value: watts },
          { label: 'Light', value: (r) => (r.product.attrs.lumens ? `${r.product.attrs.lumens} lm` : '—') },
          { label: 'Rated Life', value: (r) => `${r.product.attrs.lifeBasis === 'estimate' ? '≈' : ''}${Number(r.product.attrs.lifeHours).toLocaleString()} Hours` },
          { label: 'Color Temperature', value: (r) => (r.product.attrs.kelvin ? `${r.product.attrs.kelvin} K` : '—') },
          { label: 'In A Pack', value: (r) => String(r.product.attrs.pack) },
        ]}
        fine="Each at a retailer’s own page, America’s and Canada’s prices with the place’s sales tax added. A draw marked ≈ is the median of the rated LEDs giving the same light, and a life marked ≈ ENERGY STAR’s least, 15,000 hours: SLATE’s estimates. Bought bulbs are kept as spares until fitted." />
      <DeviceShop list="lamps" title="Lamps" shop={lampCatalog(sim, person)} refusal={(id) => lampRefusal(person, id)} command="lighting.buy_lamp" gate={lampGate} bought={(label) => `${label}, bought and brought home.`}
        facets={{ brand: 'Maker', kind: 'Kind' }}
        facetsOf={(r) => ({ brand: r.product.brand, kind: LAMP_KIND[String(r.product.attrs.type)] ?? 'Lamp' })}
        columns={[
          { head: 'Kind', cell: (r) => LAMP_KIND[String(r.product.attrs.type)] ?? '—' },
          { head: 'Bulbs', cell: (r) => (r.product.attrs.integrated ? 'Built-In LED' : `${r.product.attrs.bulbs} ${SOCKET_LABEL[String(r.product.attrs.socket)] ?? ''}${r.product.attrs.bulbIncluded ? ', Included' : ''}`) },
        ]}
        compare={[
          { label: 'Kind', value: (r) => LAMP_KIND[String(r.product.attrs.type)] ?? '—' },
          { label: 'Bulbs', value: (r) => (r.product.attrs.integrated ? 'Built-In LED' : String(r.product.attrs.bulbs)) },
          { label: 'Most Watts', value: (r) => (r.product.attrs.maxWatts ? `${r.product.attrs.maxWatts} W` : '—') },
          { label: 'Height', value: (r) => (r.product.attrs.heightCm ? `${r.product.attrs.heightCm} cm` : '—') },
        ]}
        fine="Each at its maker’s or a retailer’s own page. A lamp brings its sockets, empty unless its bulbs come with it, and takes no bulb over its stated watts; what it burns goes on the electricity with the rest." />
    </div>
  );
}

/** Seats, tables and storage where they live, IKEA's and from 2026-10-05 other makers' (`systems/furnishings.ts`), cheapest first: searched, by kind and maker, a page at a time, favorites kept and up to three compared (from 2026-10-04). */
function FromIkea() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const all = piecesCatalog(sim, person);
  const [view, setView] = useCatalogView('ikea');
  const arranged = arrange(all, view);
  const [shownCount, more] = usePaged('ikea');
  const shown = arranged.slice(0, shownCount);
  const [compared, toggleCompare, clearCompare] = useCompare('ikea');
  const chosen = compared.map((id) => all.find((e) => e.id === id)).filter((e): e is (typeof all)[number] => Boolean(e));
  const size = (p: (typeof all)[number]['value']) => (p.cm.every((x) => x !== null) ? `${p.cm.map((x) => Math.round(x!)).join(' × ')} cm` : '—');
  const does = (p: (typeof all)[number]['value']) => (p.kind === 'diningTable' ? (p.seats ? `Seats ${p.seats} At A Table` : '—') : p.seats ? `Seats ${p.seats}${p.seatsEstimated ? ', By Its Width' : ''}` : p.holdsL ? `Holds ${Math.round(p.holdsL)} Liters` : '—');
  const [count, setCount] = useState(1);
  const [built, setBuilt] = useState(false);
  if (all.length === 0) return null;
  const room = seatsAtHome(person);
  return (
    <div className="col gap-2">
      <div className="strong small">From IKEA And Other Makers{(sim.player.ikeaCredit ?? 0) > 0 ? ` · ${formatMoney(sim.player.ikeaCredit!, saveCurrency(sim.universe), { cents: false })} Credit, Spent First` : ''}</div>
      <CatalogControls id="ikea-catalog" entries={all} view={view} onChange={setView} facets={{ kind: 'Kind', brand: 'Maker' }} lead={<>
        <div className="field">
          <label htmlFor="ikea-count">How Many</label>
          <select id="ikea-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ikea-built">An IKEA Piece Put Together</label>
          <select id="ikea-built" value={built ? 'ikea' : 'you'} onChange={(e) => setBuilt(e.target.value === 'ikea')}>
            <option value="you">By You, At Taskrabbit’s Hours</option>
            <option value="ikea">By IKEA, At Its Price</option>
          </select>
        </div>
      </>} />
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Piece</th><th scope="col">Size</th><th scope="col">Does</th><th scope="col" className="num">Delivered</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
          <tbody>
            {shown.map((e) => {
              const p = e.value;
              const no = pieceRefusal(person, p.id, count, sim);
              return (
                <tr key={e.id}>
                  <td>{e.label}</td>
                  <td className="small">{size(p)}</td>
                  <td className="small">{does(p)}</td>
                  <td className="num mono">{formatMoney((e.price ?? 0) * count + (built && p.brand === 'IKEA' ? assemblyFee(sim, p, count) ?? 0 : 0), cur, { cents: false })}</td>
                  <td className="row gap-1"><FavoriteToggle list="ikea" id={e.id} /><CompareToggle on={compared.includes(e.id)} onToggle={() => toggleCompare(e.id)} /><Gated feature="home.buy_piece" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const ikea = p.brand === 'IKEA'; if (run('home.buy_piece', { pieceId: p.id, quantity: count, assembly: built && ikea }).ok) toast((built && ikea) || !p.flatPack ? `${p.name}, delivered and put together.` : `${p.name}, delivered flat-packed: put it together from Belongings.`, 'positive'); }}>{`Buy From ${p.retailer}`}</Gated></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {arranged.length === 0 && <div className="small">None sold here matches that; clear the search or a filter.</div>}
      <ShowMore shown={shown.length} total={arranged.length} onMore={more} />
      <CompareTable heads={chosen.map((e) => e.label)} onClear={clearCompare} rows={[
        { label: 'Delivered, One', values: chosen.map((e) => formatMoney(e.price ?? 0, cur, { cents: false })) },
        { label: 'Kind', values: chosen.map((e) => e.facets?.kind ?? '—') },
        { label: 'Maker', values: chosen.map((e) => e.value.brand) },
        { label: 'Comes', values: chosen.map((e) => (e.value.flatPack ? 'Flat-Packed' : 'Built')) },
        { label: 'Size', values: chosen.map((e) => size(e.value)) },
        { label: 'Does', values: chosen.map((e) => does(e.value)) },
        { label: 'Put Together By IKEA, One', values: chosen.map((e) => { const fee = assemblyFee(sim, e.value, 1); return fee === undefined ? '—' : formatMoney(fee, cur, { cents: false }); }) },
      ]} />
      <div className="xs dim">{`Seats for ${room.seats} and a table for ${room.table} at home now. Friends come over only to what there are seats for, and a dinner sits everyone at a table. A wardrobe, a frame, a chest or a bookcase holds its outside measure in liters, worked out from IKEA’s, and is filled from Belongings. An IKEA piece comes flat-packed and does nothing until it’s put together, by you or by IKEA’s service: from $52, C$45 or £33 a piece, Ireland’s €40 call-out, Mexico’s 2.5% of a sofa’s price and 9% of the rest. Another maker’s comes as its maker sends it, built unless it says it’s flat-packed, which you put together; a sofa whose maker names no seat count seats as many as its width holds at IKEA’s own width a seat, SLATE’s estimate. Each at its regular price, with the town’s sales tax where it’s added: IKEA’s delivered at its large-item rate, another maker’s at its retailer’s own delivery fee.`}</div>
    </div>
  );
}

/** Their own bed and sofa (`systems/furniture.ts`): theirs wherever they live, and what an empty home goes without. */
function Furniture() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const where = person.home?.cityId ?? person.currentLocationId;
  // The cheapest delivered first, one without a price here last (`furnitureCatalog`).
  const pieces: Piece[] = arrange(furnitureCatalog(sim, where)).map((e) => e.value);
  const does: Record<Piece, string> = { bed: 'Without one, an empty home’s nights are slept on the floor', sofa: 'Without one, unwinding in an empty home takes half the stress off', tv: 'A film or television lover enjoys unwinding at home only with one', console: 'A gamer enjoys unwinding at home only with one', speaker: 'A music lover enjoys unwinding at home only with one' };
  const mattress = mattressCost(sim, person.home?.cityId ?? person.currentLocationId, bedAtHome(person)?.size);
  const noMattress = mattressRefusal(person, person.home?.cityId ?? person.currentLocationId);
  const moveBy = useFeature('home.move_by');
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
                  <td>{!has && cost && <Gated feature="home.furnish" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.furnish', { piece }).ok) toast(`${PIECE_LABEL[piece]}, delivered.`, 'positive'); }}>Buy And Deliver</Gated>}{has && piece === 'bed' && mattressWorn(person, sim.now) && (mattress !== undefined || noMattress) && <Gated feature="home.replace_mattress" className="btn btn-sm btn-ghost" disabled={Boolean(noMattress)} title={noMattress} onClick={() => { if (run('home.replace_mattress', {}).ok) toast('A new mattress.', 'positive'); }}>{mattress !== undefined ? `Replace The Mattress (${formatMoney(mattress, cur, { cents: false })})` : 'Replace The Mattress'}</Gated>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!owns(person, 'bed') && <ChooseABed cityId={where} />}
      <FromIkea />
      <Televisions />
      <Speakers />
      <Lighting />
      <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="move-by">When You Move</label>
        <select id="move-by" value={person.moveBy ?? 'movers'} disabled={!moveBy.open} title={moveBy.reason} onChange={(e) => run('home.move_by', { by: e.target.value === 'truck' ? 'truck' : 'movers' })}>
          <option value="truck">A Rented Truck, Driven Yourself</option>
          <option value="movers">Movers</option>
        </select>
        </div>
      </div>
      <div className="xs dim">{`U-Haul’s 15-foot truck, $${RENTED_TRUCK.perDay} a day and $${RENTED_TRUCK.perMile} a mile there and back, and its fuel: in America, within ${RENTED_TRUCK.withinMiles} miles, on a license you may drive on. Anywhere else, the movers come. A van of your own carries it first.`}</div>
    </div>
  );
}

/**
 * A bed of your choosing (`content/beds.ts`, makers' mattresses from 2026-10-05,
 * `content/mattresscatalog.ts`): a frame sold here, then a mattress of its size,
 * IKEA's or a maker's own, each cheapest first, the whole delivered quoted.
 * Until then one list crossed every frame with every mattress.
 */
function ChooseABed({ cityId }: { cityId: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const market = BED_MARKET[CITIES.get(cityId)?.countryId ?? ''];
  const all = bedsIn(cityId).map((b) => ({ ...b, quote: bedQuote(sim, cityId, b.frame.id, b.mattress.id) }))
    .filter((b): b is typeof b & { quote: Exclude<typeof b.quote, string> } => typeof b.quote !== 'string');
  const frames = [...new Map(all.map((b) => [b.frame.id, b.frame])).values()].sort((x, y) => x.price - y.price);
  const [frameId, setFrame] = useState('');
  const [mattressId, setMattress] = useState('');
  if (!market || frames.length === 0) return null;
  const frame = frames.find((f) => f.id === frameId) ?? frames[0]!;
  const fits = all.filter((b) => b.frame.id === frame.id).sort((x, y) => x.quote.amount - y.quote.amount);
  const chosen = fits.find((b) => b.mattress.id === mattressId) ?? fits[0]!;
  const no = furnishRefusal(sim, person, 'bed');
  const m = chosen.mattress as typeof chosen.mattress & { brand?: string; delivery?: number | null; trialNights?: number | null };
  return (
    <div className="col gap-1">
      <div className="field-row">
        <div className="field">
          <label htmlFor="bed-frame">A Frame</label>
          <select id="bed-frame" value={frame.id} onChange={(e) => { setFrame(e.target.value); setMattress(''); }}>
            {frames.map((f) => <option key={f.id} value={f.id}>{`${bedSize(market, f.size)!.label}: ${f.name}`}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="bed-mattress">A Mattress That Fits It</label>
          <select id="bed-mattress" value={chosen.mattress.id} onChange={(e) => setMattress(e.target.value)}>
            {fits.map((b) => <option key={b.mattress.id} value={b.mattress.id}>{`${b.mattress.name}, ${formatMoney(b.quote.amount, cur, { cents: false })} With The Frame`}</option>)}
          </select>
        </div>
        <Gated feature="home.furnish" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.furnish', { piece: 'bed', frameId: frame.id, mattressId: chosen.mattress.id }).ok) toast('Your bed, delivered.', 'positive'); }}>Buy This Bed</Gated>
      </div>
      <div className="xs dim">{m.brand ? `${m.brand}’s own mattress on IKEA’s frame: ${m.delivery === 0 ? 'its maker delivers it free' : m.delivery ? 'its maker’s own delivery fee, in the price' : 'its maker’s delivery not stated, IKEA’s bed delivery stands in, SLATE’s estimate'}${m.trialNights ? `, ${m.trialNights} nights’ trial` : ''}.` : 'IKEA’s frame and mattress, by IKEA’s delivery.'}</div>
    </div>
  );
}
/** Lodgers in its spare bedrooms (`systems/lodgers.ts`): taken at the town's room rent, paid monthly. */
function Lodgers({ owned }: { owned: OwnedHome }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const rent = roomRent(sim, owned.cityId);
  const no = lodgerRefusal(sim, person, owned);
  const here = lodgersIn(owned).length;
  if (rent === undefined) return null;
  return (
    <div className="col gap-2">
      <div className="strong small">Lodgers</div>
      <div className="grid grid-3">
        <Stat label="Lodgers" value={`${here}`} note={`Of ${Math.min(2, Math.max(0, owned.facts.beds - 1))} spare ${owned.facts.beds - 1 === 1 ? 'bedroom' : 'bedrooms'} to let`} />
        <Stat label="A Room’s Rent" value={`${formatMoney(rent, cur, { cents: false })} A Month`} note={ROOM_RENT[owned.cityId]!.basis} />
      </div>
      <div className="row gap-2">
        <Gated feature="home.take_lodger" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.take_lodger', { homeId: owned.id }).ok) toast('A lodger moves in.', 'positive'); }}>Take A Lodger</Gated>
        {here > 0 && <Gated feature="home.end_lodger" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.end_lodger', { homeId: owned.id }).ok) toast('The lodger moves out.', 'positive'); }}>Let The Lodger Go</Gated>}
      </div>
    </div>
  );
}
