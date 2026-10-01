/**
 * SLATE — Cars: the cars you own and what they cost you, and buying one new
 * or used where you live, every tax and fee on the quote before you pay
 * (`systems/vehicles.ts`, from 2026-09-29).
 */

import { tradeInFor } from '@/engine/systems/vehicles';
import { redemption } from '@/engine/systems/repossession';
import { boatsOf, boatQuote, buyBoatRefusal, certified, certifyRefusal, onItsTrailer } from '@/engine/systems/boats';
import { BOAT_LOAN, BOAT_RULES, T18, isBoatState } from '@/engine/content/boats';
import { buyCaravanRefusal, caravanQuote, caravansOf, caravanValue, hitchRefusal, towRating } from '@/engine/systems/caravans';
import { CARAVANS, CARAVAN_YEAR, HITCH_FIT, LB } from '@/engine/content/caravans';
import { CITIES } from '@/engine/content/geography';
import { INSPECTION_RULES, nextInspection } from '@/engine/systems/inspections';
import { useState } from 'react';
import { CatalogControls, catalogPrice, useCatalogView } from '@/ui/components/Catalog';
import { arrange } from '@/engine/systems/catalog';
import { modCatalog, vehicleCatalog } from '@/engine/systems/catalogs';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { homeOf } from '@/engine/systems/earnings';
import { buyRefusal, glazed, registers, insuranceBasis, insuranceCurrency, jurisdictionOf, kept, liabilityOffered, loanRate, modelById, monthlyInsurance, quote, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { DEPRECIATION_SOURCE, LOAN_RATES, US_LEASE } from '@/engine/content/vehiclefees';
import type { VehicleKind } from '@/engine/content/vehiclecatalog';
import { tiresRefusal } from '@/engine/systems/tires';
import { tintRefusal } from '@/engine/systems/tint';
import { MOD_LABEL, modRefusal, type Mod } from '@/engine/systems/mods';
import { faultCost, inShopNow, laidUp, repairRefusal, shopsFor } from '@/engine/systems/repairs';
import { buyoutPrice, earlyEnd, halfRule, leaseCurrency, leaseKindOf, leaseQuote, leaseRefusal, leaseTerms, milesOver } from '@/engine/systems/leasing';

const FUEL_WORD = { petrol: 'Gasoline', diesel: 'Diesel', hybrid: 'Hybrid', phev: 'Plug-In Hybrid', ev: 'Electric' } as const;
const PLACE_NAME = { 'US-NY': 'New York', 'US-CT': 'Connecticut', 'US-CA': 'California', GB: 'Great Britain', IE: 'Ireland', 'CA-ON': 'Ontario', 'CA-BC': 'British Columbia', 'MX-CMX': 'Mexico City' } as const;

export function VehiclesWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const home = homeOf(person);
  const j = jurisdictionOf(home);
  const [kind, setKind] = useState<VehicleKind>('car');
  const [pick, setPick] = useState('');
  const [age, setAge] = useState(0);
  // The models as a catalog: the cheapest whole price first, searched and filtered (`systems/catalogs.ts`).
  const [view, setView] = useCatalogView(`vehicles-${kind}`);
  const entries = vehicleCatalog(sim, person, home, kind, age);
  const models = arrange(entries, view).map((e) => e.value);
  // Outright, a loan's months or a lease's: one choice, a lease's months negative.
  const [months, setMonths] = useState(0);
  const financed = months > 0;
  const leaseMonths = months < 0 && leaseTerms(j).length > 0 && age === 0 && kind === 'car' ? -months : 0;
  const [coverage, setCoverage] = useState<OwnedVehicle['coverage']>('full');
  const [tradeId, setTradeId] = useState('');
  const model = models.find((m) => m.id === pick) ?? models[0];
  const tradeCar = vehiclesOf(person).find((x) => x.id === tradeId && x.soldAt === undefined && !x.repossessed);
  const trade = tradeCar ? tradeInFor(sim, home, tradeCar) : undefined;
  const q = model ? quote(model, home, sim.now, { age, financed, person, ...(trade ? { tradeIn: trade } : {}) }) : 'SLATE sells none of these where you live yet.';
  const inHome = (c: number, from: string) => formatMoney(inSaveMoney(sim, c, from), cur);
  const no = model ? buyRefusal(sim, person, model.id, { age, financed, coverage }) : typeof q === 'string' ? q : undefined;
  const ins = j ? monthlyInsurance(j, coverage, model) : undefined;
  const insCurrency = j && model ? insuranceCurrency(j, model) : undefined;
  const insBasis = j && model ? insuranceBasis(j, model) : undefined;
  const liability = Boolean(j && model && liabilityOffered(j, model));
  const rate = j ? loanRate(j, person.credit?.score ?? 0, age > 0) : undefined;
  const owned = vehiclesOf(person).filter((v) => v.soldAt === undefined);
  // A lease in America and Canada, a PCP in Britain and Ireland: new cars only.
  const leasable = leaseTerms(j).length > 0 && age === 0 && kind === 'car';
  const pcp = leaseKindOf(j) === 'pcp';
  const lq = model && leaseMonths ? leaseQuote(model.id, home, sim.now, leaseMonths, person) : undefined;
  const noLease = model && leaseMonths ? leaseRefusal(sim, person, model.id, leaseMonths, coverage) : undefined;
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Cars</h1>
        <p className="muted">A car, motorcycle, scooter, van, motorhome, bicycle or ATV of your own: what it costs to buy, to keep and to run where you live.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Vehicles">
          {!owned.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Vehicle</th><th scope="col">Bought</th><th scope="col" className="num">Worth</th><th scope="col" className="num">Loan Or Lease</th><th scope="col">Registration Due</th><th scope="col">Next Inspection</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {owned.map((v) => {
                    const m = modelById(v.modelId)!;
                    return (
                      <tr key={v.id}>
                        <td>{m.make} {m.model}</td>
                        <td>{formatDate(v.boughtAt, sim.zone)}{v.ageAtPurchase ? `, ${v.ageAtPurchase} Years Old` : ', New'}</td>
                        <td className="num mono">{v.lease ? 'Leased' : inHome(valueOf(v, sim.now), m.currency)}</td>
                        <td className="num mono">{v.lease ? `${money(v.lease.monthly)} A Month, ${v.lease.monthsLeft} Left` : v.loan ? money(v.loan.owed) : 'None'}</td>
                        <td>{registers(modelById(v.modelId)!, v.jurisdiction) ? formatDate(v.registrationDue, sim.zone) : '—'}</td>
                        <td className="small">{(() => { const due = nextInspection(v, v.inspected ?? v.boughtAt); const rule = INSPECTION_RULES[v.jurisdiction]; return due && rule ? `${rule.label}, ${formatDate(due, sim.zone)}` : '—'; })()}</td>
                        <td>
                          {v.lease ? (
                            v.lease.maturedAt === undefined ? (
                              <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
                                <span className="xs dim">Ends {formatDate(v.boughtAt + v.lease.months * 30 * 86_400_000, sim.zone)}{milesOver(v).miles ? `, ${milesOver(v).miles.toLocaleString('en-US')} ${milesOver(v).unit === 'km' ? 'km' : 'miles'} over` : ''}</span>
                                {(() => { const e = earlyEnd(sim, v); return typeof e === 'string' ? null : (<div className="row gap-1"><Gated feature="vehicle.lease_buyout" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.lease_buyout', { vehicleId: v.id }); if (a.ok) toast(`Bought out early, for ${money(a.value!.paid)}.`, 'positive'); }}>Buy It Out Early, {inHome(e.buyout, leaseCurrency(v))}</Gated><Gated feature="vehicle.lease_return" className="btn btn-sm btn-ghost" title={`The balance, ${inHome(e.balance, leaseCurrency(v))}, less its trade-in value, ${inHome(e.realized, leaseCurrency(v))}`} onClick={() => { const a = run<{ paid: number }>('vehicle.lease_return', { vehicleId: v.id }); if (a.ok) toast(`Ended early, for ${money(a.value!.paid)}.`, 'positive'); }}>End It Early, {inHome(e.charge, leaseCurrency(v))}</Gated></div>); })()}
                                {typeof halfRule(v) !== 'string' && <Gated feature="vehicle.lease_return" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.lease_return', { vehicleId: v.id }); if (a.ok) toast(`Handed back, for ${money(a.value!.paid)}.`, 'positive'); }}>Hand It Back Early</Gated>}
                              </div>
                            ) : (
                              <div className="row gap-1">
                                <Gated feature="vehicle.lease_buyout" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.lease_buyout', { vehicleId: v.id }); if (a.ok) toast(`Bought out for ${money(a.value!.paid)}.`, 'positive'); }}>Buy It Out, {inHome(buyoutPrice(v, sim.now) ?? 0, leaseCurrency(v))}</Gated>
                                <Gated feature="vehicle.lease_return" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.lease_return', { vehicleId: v.id }); if (a.ok) toast(`Returned, for ${money(a.value!.paid)}.`, 'positive'); }}>Return It</Gated>
                              </div>
                            )
                          ) : v.repossessed ? (
                            <div className="col gap-1" style={{ alignItems: 'flex-start' }}>
                              <span className="xs dim">Repossessed: sold {formatDate(v.repossessed.saleAt, sim.zone)}</span>
                              <Gated feature="vehicle.redeem" className="btn btn-sm btn-ghost" onClick={() => {
                                const a = run<{ paid: number }>('vehicle.redeem', { vehicleId: v.id });
                                if (a.ok) toast(`Redeemed for ${money(a.value!.paid)}.`, 'positive');
                              }}>Redeem It, {money(redemption(sim, v) ?? 0)}</Gated>
                            </div>
                          ) : (
                            <div className="row gap-1" style={{ flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 240 }}>
                            {!tiresRefusal(v) && <Gated feature="vehicle.winter_tires" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.winter_tires', { vehicleId: v.id }); if (a.ok) toast(`Winter tires on, for ${money(a.value!.paid)}.`, 'positive'); }}>Winter Tires</Gated>}
                            {(['rear', 'full'] as const).filter((k) => !tintRefusal(v, k, glazed(v))).map((k) => <Gated key={k} feature="vehicle.tint" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number; legal: boolean }>('vehicle.tint', { vehicleId: v.id, kind: k }); if (a.ok) toast(a.value!.legal ? `Tinted, within the law here, for ${money(a.value!.paid)}.` : `Tinted darker than the law here allows, for ${money(a.value!.paid)}.`, a.value!.legal ? 'positive' : 'neutral'); }}>{k === 'rear' ? 'Tint The Back' : 'Tint All Round'}</Gated>)}
                            <RepairControl v={v} />
                            <ModifyControl v={v} />
                            {!v.hitch && towRating(v) > 0 && <Gated feature="vehicle.hitch" className="btn btn-sm btn-ghost" disabled={Boolean(hitchRefusal(sim, person, v))} title={hitchRefusal(sim, person, v) ?? `Rated to tow ${Math.round(towRating(v))} kg`} onClick={() => { const a = run<{ paid: number }>('vehicle.hitch', { vehicleId: v.id }); if (a.ok) toast(`A towbar fitted, for ${money(a.value!.paid)}.`, 'positive'); }}>Fit A Towbar</Gated>}
                            <Gated feature="vehicle.sell" className="btn btn-sm btn-ghost" onClick={() => {
                              const a = run<{ value: number }>('vehicle.sell', { vehicleId: v.id });
                              if (a.ok) toast(`Sold: ${money(a.value!.value)} to you after the loan.`, 'positive');
                            }}>Sell It</Gated>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Buy One" subtitle={j ? `Where you live: ${PLACE_NAME[j]}` : 'Where you live, SLATE sells no cars yet'}>
          <div className="col gap-3">
            <CatalogControls id="car-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setPick(''); }} facets={{ make: 'Make', fuel: 'Fuel' }} lead={(
                <div className="field">
                  <label htmlFor="car-kind">Kind</label>
                  <select id="car-kind" value={kind} onChange={(e) => { setKind(e.target.value as VehicleKind); setPick(''); setMonths(0); }}>
                    <option value="atv">ATV</option>
                    <option value="ebike">E-Bike</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="campervan">Campervan</option>
                    <option value="motorhome">Motorhome</option>
                    <option value="van">Cargo Van</option>
                    <option value="scooter">Scooter</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              )} />
            <div className="field-row field-row-tight">
              <div className="field">
                <label htmlFor="car-model">Model</label>
                <select id="car-model" value={model?.id ?? ''} onChange={(e) => setPick(e.target.value)}>
                  {arrange(entries, view).map((e) => <option key={e.id} value={e.id}>{`${e.label}, ${catalogPrice(e, (c) => formatMoney(c, cur, { cents: false }))}`}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="car-age">New Or Used</label>
                <select id="car-age" value={age} onChange={(e) => setAge(Number(e.target.value))}>
                  {[0, 1, 2, 3, 5, 7, 10].map((y) => <option key={y} value={y}>{y === 0 ? 'New' : `${y} ${y === 1 ? 'Year' : 'Years'} Old`}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="car-pay">Paid</label>
                <select id="car-pay" value={leaseMonths ? months : Math.max(0, months)} onChange={(e) => setMonths(Number(e.target.value))}>
                  <option value={0}>Outright</option>
                  {[36, 48, 60, 72].map((n) => <option key={n} value={n}>A Loan, {n} Months</option>)}
                  {leasable && leaseTerms(j).map((n) => <option key={-n} value={-n}>{pcp ? 'A PCP' : 'A Lease'}, {n} Months</option>)}
                </select>
              </div>
              {!(kind === 'bicycle' || kind === 'ebike') && <div className="field">
                <label htmlFor="car-cover">Insurance</label>
                <select id="car-cover" value={coverage} onChange={(e) => setCoverage(e.target.value === 'liability' ? 'liability' : 'full')}>
                  <option value="full">Full Cover</option>
                  {liability && <option value="liability">Liability Only</option>}
                </select>
              </div>}
              {owned.some((x) => !x.repossessed && !x.lease) && (
                <div className="field">
                  <label htmlFor="car-trade">Trade In</label>
                  <select id="car-trade" value={tradeCar?.id ?? ''} onChange={(e) => setTradeId(e.target.value)}>
                    <option value="">None</option>
                    {owned.filter((x) => !x.repossessed && !x.lease).map((x) => <option key={x.id} value={x.id}>Your {modelById(x.modelId)!.make} {modelById(x.modelId)!.model}</option>)}
                  </select>
                </div>
              )}
            </div>
            {lq && typeof lq !== 'string' && (
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Due At Signing</th><th scope="col" className="num">Amount</th></tr></thead>
                  <tbody>
                    {lq.atSigning.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, lq.currency)}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(lq.dueAtSigning, lq.currency)}</td></tr>
                    <tr><td>Then, A Month</td><td className="num mono">{inHome(lq.monthly, lq.currency)}</td></tr>
                    <tr><td>{lq.kind === 'pcp' ? 'The Final Payment, To Own It' : 'To Buy It Out At The End'}</td><td className="num mono">{inHome(lq.residual + lq.buyoutFee, lq.currency)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            {!leaseMonths && typeof q !== 'string' && model && (
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
                  <tbody>
                    <tr><td>{model.make} {model.model}{kind === 'bicycle' ? '' : `, ${FUEL_WORD[model.fuel]}`}{age ? `, ${Math.round(kept(age) * 100)}% Of New` : ''}</td><td className="num mono">{inHome(q.price, q.currency)}</td></tr>
                    {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, q.currency)}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(q.total, q.currency)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-3">
              <Stat label="Insurance" value={typeof ins === 'number' && insCurrency ? `${inHome(ins, insCurrency)} A Month` : '—'} note={insBasis ?? 'Not kept here yet'} />
              {leaseMonths ? <Stat label={j?.startsWith('US-') ? 'Money Factor' : 'APR'} value={j?.startsWith('US-') ? String(US_LEASE.moneyFactor) : lq && typeof lq !== 'string' ? `${lq.apr.toFixed(2)}%` : '—'} note={j?.startsWith('US-') ? `About ${(US_LEASE.moneyFactor * 2400).toFixed(2)}% a year, worked back from Toyota’s offers` : pcp ? 'The lender’s rate on a PCP' : 'Honda Canada’s lease rate'} /> : <Stat label="Loan Rate" value={rate !== undefined ? `${(rate * 100).toFixed(2)}%` : '—'} note={rate !== undefined ? 'For your record, where it’s published' : 'Not published here: buy it outright'} />}
              <Stat label="Economy" value={model?.kwhPer100km ? `${model.kwhPer100km} kWh/100 km` : model?.per100km ? `${model.per100km} L/100 km` : kind === 'bicycle' ? 'Pedaled' : kind === 'ebike' ? 'Charged At Home' : 'Not Yet Rated'} note={model?.per100km || model?.kwhPer100km || kind === 'bicycle' || kind === 'ebike' || kind === 'atv' ? model?.economyBasis : 'Fuel at AAA’s cost a mile until it’s rated'} />
            </div>
            {(leaseMonths ? noLease : no) ? <p className="small" style={{ margin: 0 }}>{leaseMonths ? noLease : no}</p> : null}
            <div className="row gap-2">
              {leaseMonths ? (
                <Gated feature="vehicle.lease" className="btn btn-sm" disabled={Boolean(noLease)} title={noLease} onClick={() => {
                  if (!model) return;
                  const a = run<{ paid: number; monthly: number }>('vehicle.lease', { modelId: model.id, months: leaseMonths, coverage });
                  if (a.ok) toast(`Leased, for ${money(a.value!.paid)} now and ${money(a.value!.monthly)} a month.`, 'positive');
                }}>{pcp ? 'Take The PCP' : 'Lease It'}</Gated>
              ) : (
              <Gated feature="vehicle.buy" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
                if (!model) return;
                const a = run<{ vehicleId: string; paid: number; monthly?: number }>('vehicle.buy', { modelId: model.id, age, financed, months, coverage, ...(tradeCar ? { tradeIn: tradeCar.id } : {}) });
                if (a.ok) toast(`Bought, for ${money(a.value!.paid)} now${a.value!.monthly ? ` and ${money(a.value!.monthly)} a month` : ''}.`, 'positive');
              }}>Buy It</Gated>
              )}
            </div>
            <Fine>{lq && typeof lq !== 'string' ? `${lq.basis} ` : ''}{typeof q !== 'string' ? q.basis : q} Depreciation: {DEPRECIATION_SOURCE}. Loans: {LOAN_RATES.source}. Parking on the street at home is the resident’s permit where one’s kept, London’s by Westminster’s bands and Dublin’s, and nothing with a garage at a home you own.</Fine>
          </div>
        </Panel>
        <BoatPanel />
        <CaravanPanel />
      </div>
    </>
  );
}

/** Caravans of one's own (`systems/caravans.ts`): bought and kept at a house of one's own, towed behind a car with a towbar its maker rates for it. */
function CaravanPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const where = homeOf(person);
  const q = caravanQuote(sim, where);
  const mine = caravansOf(person);
  const noBuy = buyCaravanRefusal(sim, person);
  const place = jurisdictionOf(where);
  const year = place && place in CARAVAN_YEAR ? CARAVAN_YEAR[place as keyof typeof CARAVAN_YEAR] : undefined;
  const model = q ? CARAVANS[q.market] : undefined;
  return (
    <Panel title={mine.length > 1 ? 'Your Caravans' : 'A Caravan'} subtitle={model?.label ?? 'A Travel Trailer Or Touring Caravan'}>
      {!q || !model || !year ? <p className="small muted" style={{ margin: 0 }}>SLATE sells a caravan in New York, Connecticut, California and Britain only yet.</p> : (
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label={model.taxIncluded ? 'Its Price' : 'Taxed And Registered'} value={money(q.price + q.tax + q.registration)} note={model.taxIncluded ? 'The maker’s price, its VAT in it; no registration or road tax' : `${money(q.price)}, ${money(q.tax)} tax, ${money(q.registration)} registered`} />
            <Stat label="Kept" value={`${money(inSaveMoney(sim, Math.round((year.insurance / 12) * 100), year.currency))} A Month`} note="Its insurance, on the drive of a house of your own" />
            <Stat label="Towed" value={q.market === 'US' ? `Up To ${Math.round(model.maxKg / LB).toLocaleString('en-US')} lb` : `Up To ${Math.round(model.maxKg).toLocaleString('en-US')} kg`} note={`Behind a car its maker rates to tow that, with a towbar fitted, ${money(inSaveMoney(sim, HITCH_FIT[q.market].amount * 100, HITCH_FIT[q.market].currency))}`} />
          </div>
          {mine.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Caravan</th><th scope="col">Where</th><th scope="col" className="num">Worth</th><th scope="col">Sell</th></tr></thead>
                <tbody>
                  {mine.map((c) => (
                    <tr key={c.id}>
                      <td>{CARAVANS[c.market].label}</td>
                      <td>{CITIES.get(c.at ?? c.cityId)?.name ?? c.cityId}</td>
                      <td className="num mono">{money(caravanValue(c, sim.now))}</td>
                      <td><Gated feature="caravan.sell" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ value: number }>('caravan.sell', { caravanId: c.id }); if (a.ok) toast(`Sold, for ${money(a.value!.value)}.`, 'positive'); }}>Sell</Gated></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="caravan.buy" className="btn btn-sm btn-ghost" disabled={Boolean(noBuy)} title={noBuy} onClick={() => { if (run('caravan.buy', {}).ok) toast('A caravan of your own.', 'positive'); }}>{mine.length ? 'Buy Another Caravan' : 'Buy A Caravan'}</Gated>
          </div>
          {noBuy && <div className="xs dim">{noBuy}</div>}
          <Fine>Tow it on a journey from the Travel screen: its nights can be at the region’s campground, the drive burns 1% more fuel for each 100 lb it weighs (fueleconomy.gov), and it’s slower where the law sets a lower limit for towing. Its worth follows the car curve, as no caravan’s depreciation was read. Moving to a home with no drive of your own, it’s sold.</Fine>
        </div>
      )}
    </Panel>
  );
}

/** Boats of one's own (`systems/boats.ts`): bought where one lives, as many as the bank allows, each kept and sold on its own, and taken out with the state's certificate. */
function BoatPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const boats = boatsOf(person);
  const where = homeOf(person);
  const state = jurisdictionOf(where);
  const rules = isBoatState(state) ? BOAT_RULES[state] : undefined;
  const q = boatQuote(sim, where);
  const [boatFinanced, setBoatFinanced] = useState(false);
  const noBuy = buyBoatRefusal(sim, person, boatFinanced);
  const noCert = certifyRefusal(sim, person);
  const holds = rules && isBoatState(state) ? certified(person, state) : false;
  const usd = (units: number) => money(inSaveMoney(sim, Math.round(units * 100), 'USD'));
  const here = (units: number) => money(inSaveMoney(sim, Math.round(units * 100), rules?.currency ?? 'USD'));
  return (
    <Panel title={boats.length > 1 ? 'Your Boats' : 'A Boat'} subtitle={rules?.model.label ?? T18.label}>
      {!rules || !q ? <p className="small muted" style={{ margin: 0 }}>SLATE sells a boat in New York, Connecticut, California, London, Dublin and Toronto only yet.</p> : (
        <div className="col gap-3">
          <div className="grid grid-3">
            <Stat label={rules.taxAdded ? 'Taxed And Registered' : 'Its Price'} value={money(q.price + q.tax + q.registration)} note={rules.taxAdded ? `${money(q.price)}${state?.startsWith('US') ? ' with its trailer' : ''}, ${money(q.tax)} tax` : 'A dealer’s price, its VAT in it'} />
            <Stat label="Kept" value={`${here(rules.insuranceYear / 12)} A Month`} note={`Insurance, and ${rules.slip.per === 'year' ? 'its storage' : 'a slip'} at ${here(rules.slip.amount)} a ${rules.slip.per}, unless it stands on its trailer at your house`} />
            {rules.certificate ? <Stat label={rules.certificate.label} value={holds ? 'Held' : here(rules.certificate.amount)} note="Asked of whoever operates a boat here" /> : <Stat label="A License" value="None Asked" note="None is needed to take a pleasure boat to sea here" />}
          </div>
          {boats.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Boat</th><th scope="col">Kept In</th><th scope="col" className="num">Worth</th><th scope="col">Standing</th><th scope="col">Sell</th></tr></thead>
                <tbody>
                  {boats.map((b) => (
                    <tr key={b.id}>
                      <td>{BOAT_RULES[b.state].model.label}</td>
                      <td>{CITIES.get(b.cityId)?.name ?? b.cityId}{onItsTrailer(person, b) ? ', On Its Trailer' : ''}</td>
                      <td className="num mono">{money(b.price)}</td>
                      <td>{b.repossessed ? 'Taken By The Lender' : b.loan ? `${money(b.loan.owed)} Owed` : 'Owned Outright'}</td>
                      <td><Gated feature="boat.sell" className="btn btn-sm btn-ghost" disabled={Boolean(b.repossessed)} title={b.repossessed ? 'The lender has it.' : undefined} onClick={() => { if (run('boat.sell', { boatId: b.id }).ok) toast('Sold.', 'positive'); }}>Sell</Gated></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {state?.startsWith('US') && (
            <div className="field-row field-row-tight">
            <div className="field">
              <label htmlFor="boat-paid">Paid</label>
              <select id="boat-paid" value={boatFinanced ? 'loan' : 'outright'} onChange={(e) => setBoatFinanced(e.target.value === 'loan')}>
                <option value="outright">Outright</option>
                <option value="loan">{`A Loan, ${BOAT_LOAN.months} Months, ${usd(BOAT_LOAN.downUsd)} Down`}</option>
              </select>
            </div>
            </div>
          )}
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="boat.buy" className="btn btn-sm btn-ghost" disabled={Boolean(noBuy)} title={noBuy} onClick={() => { if (run('boat.buy', { financed: boatFinanced }).ok) toast('A boat of your own.', 'positive'); }}>{boats.length ? 'Buy Another Boat' : 'Buy A Boat'}</Gated>
            {!holds && <Gated feature="boat.certify" className="btn btn-sm btn-ghost" disabled={Boolean(noCert)} title={noCert} onClick={() => { if (run('boat.certify', {}).ok) toast('Certified.', 'positive'); }}>Get A Boating Certificate</Gated>}
          </div>
          <Fine>{state?.startsWith('US') ? `Bayliner’s own loan is at ${(BOAT_LOAN.apr * 100).toFixed(1)}% for a well-qualified record, which SLATE takes as ${BOAT_LOAN.minScore}. ` : ''}Take The Boat Out is under Look After Yourself: three hours on the water in fine weather, at its engine’s published burn of {state?.startsWith('US') ? `${T18.gph} gallons` : `about ${Math.round(rules.model.litersPerHour)} liters`} an hour of marina fuel. {rules.slip.basis}.</Fine>
        </div>
      )}
    </Panel>
  );
}

/** Britain's modifications, one at a time, the cheapest fitted first (`modCatalog`); until 2026-10-01 the least of them first. */
function ModifyControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const open = arrange(modCatalog(sim)).map((e) => e.value).filter((m) => !modRefusal(v, m, glazed(v)));
  const [mod, setMod] = useState<Mod | ''>('');
  if (!open.length) return null;
  const chosen = mod && open.includes(mod) ? mod : open[0]!;
  return (
    <>
      <select aria-label="Modification" value={chosen} onChange={(e) => setMod(e.target.value as Mod)} style={{ width: 'auto' }}>
        {open.map((m) => <option key={m} value={m}>{MOD_LABEL[m]}</option>)}
      </select>
      <Gated feature="vehicle.modify" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.modify', { vehicleId: v.id, mod: chosen }); if (a.ok) toast(`${MOD_LABEL[chosen]} fitted, for ${formatMoney(a.value!.paid, saveCurrency(sim.universe))}, and declared to the insurer.`, 'positive'); }}>Fit It</Gated>
    </>
  );
}

/** A fault the car has, and the garages in its town that would take it (`systems/repairs.ts`). */
function RepairControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const m = modelById(v.modelId)!;
  const shops = shopsFor(v.at ?? v.cityId, m);
  const [shopId, setShopId] = useState('');
  const laid = laidUp(v, sim.now);
  if (inShopNow(v, sim.now)) return <span className="xs dim">{laid}</span>;
  if (!v.fault) return null;
  const cur = saveCurrency(sim.universe);
  const cost = formatMoney(faultCost(v, cur), cur, { cents: false });
  const chosen = shops.find((x) => x.id === shopId) ?? shops[0];
  const no = chosen ? repairRefusal(sim.player, v, m, chosen.id, sim.now) : 'No garage SLATE knows of in its town works on it.';
  return (
    <>
      <span className="xs" title={v.fault.severe ? 'RepairPal’s severe repair: three times the model’s annual cost, at least' : 'CarMD’s average check engine repair'}>{v.fault.severe ? `Broken Down, About ${cost}` : `Check Engine Light, About ${cost}`}</span>
      {shops.length > 1 && (
        <select aria-label="Garage" value={chosen?.id ?? ''} onChange={(e) => setShopId(e.target.value)} style={{ width: 'auto' }}>
          {shops.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      )}
      <Gated feature="vehicle.repair" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? chosen?.address} onClick={() => { const a = run<{ paid: number }>('vehicle.repair', { vehicleId: v.id, shopId: chosen!.id }); if (a.ok) toast(`In at ${chosen!.name}, for ${formatMoney(a.value!.paid, cur, { cents: false })}.`, 'positive'); }}>{chosen && shops.length === 1 ? `Book The Repair At ${chosen.name}` : 'Book The Repair'}</Gated>
    </>
  );
}
