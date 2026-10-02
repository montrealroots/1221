/**
 * SLATE — a parcel of land, yours or for sale.
 *
 * One kind for both, because a parcel is the same thing either side of its
 * closing: a market’s lot or acreage at a size, worth what land there is worth
 * that day (`landValue`). An id is a parcel’s own where it is yours, and a
 * listing’s — market, month and place in the month — where it is for sale.
 * A listing is drawn from the market it names wherever you are standing, so
 * a lot in Brooklyn opens from Reykjavík as readily as from Queens; only the
 * offer asks that you live there, and that is the screen’s to say.
 *
 * A house going up on a parcel is said inside its look, stage by stage, with
 * the construction loan behind it as a way in where there is one. Every figure
 * is in the land’s own money, as the screen prints it.
 */

import { formatMoney } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { DAYS_TO_SELL, LAND_DEAL, LAND_MARKETS, LAND_TAX, areaWords, type LandMarket } from '@/engine/content/land';
import { STAGES } from '@/engine/content/construction';
import { buildingOn, landValue, listingsFor, parcelsOf, saleProceeds, taxedValue, type Listing, type Parcel } from '@/engine/systems/land';
import { yearRent } from '@/engine/systems/landlease';
import { homeOf } from '@/engine/systems/earnings';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook } from './registry';
import { at } from './subject';
import { asName, waysThatOpen } from './homes';

type TheLand =
  | { kind: 'owned'; parcel: Parcel; m: LandMarket }
  | { kind: 'listed'; listing: Listing; m: LandMarket };

/** The listings of a market, this month, as the land system draws them. */
function listedIn(sim: Simulation, market: number): Listing[] {
  const m = LAND_MARKETS[market];
  return m ? listingsFor(sim, sim.player, m.cityId).filter((l) => l.market === market) : [];
}

/** The town a parcel’s house would stand in: farmland’s own town, a lot’s city. */
const townOf = (m: LandMarket): string => m.town ?? m.cityId;

defineLook<TheLand>('parcel', {
  gone: 'That land isn’t there to be had: sold, or taken off the market at the month’s turn.',
  resolve: (sim, id) => {
    const parcel = parcelsOf(sim.player).find((p) => p.id === id && p.soldAt === undefined);
    if (parcel) {
      const m = LAND_MARKETS[parcel.market];
      return m ? { kind: 'owned', parcel, m } : undefined;
    }
    const market = Number(id.split('.')[0]);
    if (!Number.isInteger(market)) return undefined;
    const listing = listedIn(sim, market).find((l) => l.id === id);
    const m = LAND_MARKETS[market];
    return listing && m ? { kind: 'listed', listing, m } : undefined;
  },
  seeds: (sim) => {
    const owned = parcelsOf(sim.player).filter((p) => p.soldAt === undefined).map((p) => p.id);
    const here = listingsFor(sim, sim.player, homeOf(sim.player)).slice(0, 2).map((l) => l.id);
    // Where nothing is listed where they live, the first market’s land is still for sale.
    const anywhere = here.length ? [] : listedIn(sim, 0).slice(0, 1).map((l) => l.id);
    return [...owned, ...here, ...anywhere];
  },
  look: (land, { sim }) => (land.kind === 'owned' ? ownedLook(sim, land.parcel, land.m) : listedLook(sim, land.listing, land.m)),
});

function ownedLook(sim: Simulation, p: Parcel, m: LandMarket) {
  const money = (c: number) => formatMoney(c, m.currency, { cents: false });
  const zone = CITIES.get(m.cityId)?.timeZone ?? sim.homeZone;
  const worth = landValue(m, p.acres, sim.now);
  const tax = LAND_TAX[m.place];
  const taxYear = tax ? Math.round(taxedValue(p, sim.now) * tax.rate) : 0;
  const rent = p.lease ? yearRent(p, sim.now) : undefined;
  const b = buildingOn(sim.player, p) ? sim.player.building : undefined;
  const town = CITIES.get(townOf(m))?.name ?? 'its town';
  const net = saleProceeds(m, worth).net;

  const standing = b
    ? b.stage === -1
      ? 'A house is to go up on it, and the permit is awaited.'
      : `A house is going up on it: ${STAGES[b.stage]!.name.toLowerCase()} is ${b.unpaid !== undefined ? `done and unpaid, and the contractor stopped on ${formatDate(b.stoppedAt!, zone)} until ${money(b.unpaid)} is paid` : 'under way'}, stage ${b.stage + 1} of ${STAGES.length}, of a contract of ${money(b.amounts.reduce((s, a) => s + a, 0))}.`
    : p.selling
      ? `It’s for sale, and the sale closes ${formatDate(p.selling.closesAt, zone)}, leaving about ${money(net)} after the seller’s taxes.`
      : p.lease
        ? `It’s let to a farmer${rent !== undefined ? ` for ${money(rent)} a year` : ''}${p.lease.ending ? ', to the year’s end' : ''}.`
        : `Sold today, it would leave you about ${money(net)} after the seller’s taxes, in about ${DAYS_TO_SELL} days.`;

  const ways = waysThatOpen(sim, [
    { to: at('place', townOf(m)), label: town, detail: m.kind === 'lot' ? 'The town the lot is in, and what land and homes there are worth' : 'The town nearest the land, whose market its value moves with' },
    { to: at('day', dateKey(p.boughtAt, sim.homeZone)), label: 'The Day You Bought It', detail: `${formatDate(p.boughtAt, sim.homeZone)}, for ${money(p.paid)}` },
    b?.loan ? { to: at('account', b.loan.accountId), label: 'The Construction Loan', detail: `The lender’s ${Math.round(b.loan.share * 100)}% of each stage, at ${(b.loan.rate * 100).toFixed(2)}%` } : undefined,
  ]);

  return {
    name: asName(m.label, m.kind === 'lot' ? 'A Lot' : 'Farmland'),
    kind: 'Land You Own',
    parent: at('person', sim.player.id),
    summary: `It’s ${areaWords(p.acres, m.place)}, worth ${money(worth)} today against the ${money(p.paid)} you paid.`,
    body: (
      <>
        <p className="small">
          {m.zoning ? `It’s zoned ${m.zoning.name}, which builds ${m.zoning.builds}.` : 'It’s farmland: no house without permission.'}{' '}
          {standing}{' '}
          {tax ? `Its tax comes to about ${money(taxYear)} a year.` : 'No tax is kept on it here.'}
          {p.loan ? ` A land loan has ${money(p.loan.owed)} owing on it, ${money(p.loan.monthly)} a month for ${p.loan.monthsLeft} months more.` : ''}
        </p>
        <div className="grid grid-3">
          <Stat label="Worth" value={<span className="mono">{money(worth)}</span>} note="At today’s value of land in its market" />
          <Stat label="Paid" value={<span className="mono">{money(p.paid)}</span>} note={`On ${formatDate(p.boughtAt, zone)}`} />
          <Stat label="Tax A Year" value={tax ? <span className="mono">{money(taxYear)}</span> : 'None'} note={tax ? `${(tax.rate * 100).toFixed(2)}% of its value` : 'None on it here, or not kept'} />
        </div>
      </>
    ),
    ways,
    provenance: `Its value is ${m.basis}, moved with the market since.`,
  };
}

function listedLook(sim: Simulation, l: Listing, m: LandMarket) {
  const money = (c: number) => formatMoney(c, m.currency, { cents: false });
  const zone = CITIES.get(m.cityId)?.timeZone ?? sim.homeZone;
  const worth = landValue(m, l.acres, sim.now);
  const deposit = LAND_DEAL.deposit[m.place];
  const where = CITIES.get(m.cityId)?.name ?? 'its city';
  const livesThere = homeOf(sim.player) === m.cityId;
  const ways = waysThatOpen(sim, [
    { to: at('place', townOf(m)), label: CITIES.get(townOf(m))?.name ?? where, detail: m.kind === 'lot' ? 'The town the lot is in, and what land and homes there are worth' : 'The town nearest the land, whose market its value moves with' },
    { to: at('day', dateKey(l.listedAt, sim.homeZone)), label: 'The Day It Was Listed', detail: `${formatDate(l.listedAt, sim.homeZone)}, and what else that day held` },
  ]);
  return {
    name: asName(m.label, m.kind === 'lot' ? 'A Lot' : 'Farmland'),
    kind: 'Land For Sale',
    parent: at('place', m.cityId),
    summary: `It’s ${areaWords(l.acres, m.place)} asking ${money(l.asking)}, and land like it is worth ${money(worth)} today.`,
    body: (
      <>
        <p className="small">
          Listed {formatDate(l.listedAt, zone)} from {where}.{' '}
          {m.zoning ? `It’s zoned ${m.zoning.name}, which builds ${m.zoning.builds}.` : 'It’s farmland: no house without permission.'}{' '}
          An accepted offer puts down {Math.round(deposit.share * 100)}% {deposit.at === 'accept' ? 'at once' : 'when contracts are exchanged'}, and it closes {LAND_DEAL.closingDays} days on.{' '}
          {livesThere ? 'You live here, so an offer is yours to make.' : `Only a resident of ${where} can make an offer on it.`}
        </p>
        <div className="grid grid-3">
          <Stat label="Asking" value={<span className="mono">{money(l.asking)}</span>} note={areaWords(l.acres, m.place)} />
          <Stat label="Worth" value={<span className="mono">{money(worth)}</span>} note="Today’s value of land in its market" />
          <Stat label="Deposit" value={`${Math.round(deposit.share * 100)}%`} note={deposit.at === 'accept' ? 'When the offer is accepted' : 'When contracts are exchanged'} />
        </div>
      </>
    ),
    ways,
    provenance: 'None is a real listing: an asking price is within SLATE’s spread of the published value.',
  };
}
