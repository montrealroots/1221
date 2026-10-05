/**
 * SLATE — Cars: the cars you own and what they cost you, and buying one new
 * or used where you live, every tax and fee on the quote before you pay
 * (`systems/vehicles.ts`, from 2026-09-29).
 */

import { CAR_DETAILS } from '@/engine/content/carspecs';
import { tradeInFor } from '@/engine/systems/vehicles';
import { dealerOffer, listRefusal, listingQuote, privateValue, saleRefusal } from '@/engine/systems/carsale';
import { boxOn, rackRefusal, roofCatalog } from '@/engine/systems/roofbox';
import { redemption } from '@/engine/systems/repossession';
import { boatsOf, boatQuote, buyBoatRefusal, certified, certifyRefusal, onItsTrailer } from '@/engine/systems/boats';
import { BOAT_LOAN, BOAT_RULES, T18, isBoatState } from '@/engine/content/boats';
import { buyCaravanRefusal, caravanQuote, caravansOf, caravanValue, hitchRefusal, towRating } from '@/engine/systems/caravans';
import { CARAVANS, CARAVAN_YEAR, HITCH_FIT, LB } from '@/engine/content/caravans';
import { CITIES } from '@/engine/content/geography';
import { INSPECTION_RULES, nextInspection } from '@/engine/systems/inspections';
import { useState } from 'react';
import { CatalogControls, CompareTable, CompareToggle, catalogPrice, useCatalogView, useCompare } from '@/ui/components/Catalog';
import type { CatalogEntry } from '@/engine/systems/catalog';
import { arrange } from '@/engine/systems/catalog';
import { modCatalog, vehicleCatalog } from '@/engine/systems/catalogs';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate , formatDateTime } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { inSaveMoney } from '@/engine/systems/banking';
import { homeOf } from '@/engine/systems/earnings';
import { buyRefusal, glazed, kindOf, registers, insuranceBasis, insuranceCurrency, jurisdictionOf, kept, liabilityOffered, loanRate, modelById, monthlyInsurance, quote, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { DEPRECIATION_SOURCE, LOAN_RATES, US_LEASE } from '@/engine/content/vehiclefees';
import type { CarModel, VehicleKind } from '@/engine/content/vehiclecatalog';
import { lifeOfTire, odometerOf, tireCatalog, tireLifeOf, tireOfferRefusal, tireSetCost, tiresFittedAt, tiresRefusal, tiresWorn } from '@/engine/systems/tires';
import { DeviceShop, type DeviceRow } from '@/ui/components/DeviceShop';
import { carAudioCatalog, chosenRefusal, fittingFor } from '@/engine/systems/caraudio';
import { tintRefusal } from '@/engine/systems/tint';
import { MOD_LABEL, modRefusal, type Mod } from '@/engine/systems/mods';
import { faultCost, inShopNow, laidUp, repairRefusal, shopsFor } from '@/engine/systems/repairs';
import { duesOf, joinRefusal, tierById, tiersFor } from '@/engine/systems/roadside';
import type { RoadsideTier } from '@/engine/content/roadside';
import { englandRate, hasGarage, keptIn } from '@/engine/systems/theft';
import { FINISHES, PART_LABEL as WRAP_PART_LABEL, WRAP_COLORS, WRAP_PARTS, coverRefusal, removalCost, unwrapRefusal, wrapCost, wrapRefusal, wrapShopsIn, type Finish, type WrapPart } from '@/engine/systems/wraps';
import { inWarranty, serviceCost, serviceDue, serviceRefusal, serviceWhat, servicingKept, warrantyOf } from '@/engine/systems/carcare';
import { CAR_SHOPS } from '@/engine/content/carshops';
import { standInFor, standInQuote } from '@/engine/systems/standin';
import { optionsFor, optionsQuote, orderWeeksOf, specOf } from '@/engine/systems/caroptions';
import { FITS, MATERIAL_LABEL, PART_LABEL, UPHOLSTERERS, interiorQuote, type Material, type Part } from '@/engine/systems/interiors';
import { GRADE_LABEL, capacityOf, chargersIn, fillRefusal, fillingOf, gradesFor, levelOf, lowAt, planFill, priceAt, rangeKm, type FillAmount, type FillAt, type UnitPrice } from '@/engine/systems/fueltank';
import type { Grade } from '@/engine/content/fuelcharging';
import { STATIONS } from '@/engine/content/errandtrips';
import { homeShareOf } from '@/engine/systems/charging';
import { audioQuote, stereoQuote } from '@/engine/systems/caraudio';
import { PRE_PURCHASE, drivenOn, inspectionPrice, reportOn, testDriveMinutes, usedListings } from '@/engine/systems/usedcars';
import { groupLabelOf } from '@/ui/shell/destinations';
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
  const [compared, toggleCompare, clearCompare] = useCompare(`vehicles-${kind}`);
  // Outright, a loan's months or a lease's: one choice, a lease's months negative.
  const [months, setMonths] = useState(0);
  const financed = months > 0;
  const leaseMonths = months < 0 && leaseTerms(j).length > 0 && age === 0 && kind === 'car' ? -months : 0;
  const [coverage, setCoverage] = useState<OwnedVehicle['coverage']>('full');
  const [tradeId, setTradeId] = useState('');
  const model = models.find((m) => m.id === pick) ?? models[0];
  const tradeCar = vehiclesOf(person).find((x) => x.id === tradeId && x.soldAt === undefined && !x.repossessed);
  const trade = tradeCar ? tradeInFor(sim, home, tradeCar) : undefined;
  // Its factory options, on a new one: a paint, wheels and an interior, and any packages (`systems/caroptions.ts`).
  const [chosenOptions, setChosenOptions] = useState<string[]>([]);
  const offered = model && age === 0 ? optionsFor(model.id) : [];
  const options = chosenOptions.filter((k) => offered.some((o) => o.key === k));
  const order = model ? optionsQuote(model, options) : undefined;
  const q = model ? quote(model, home, sim.now, { age, financed, person, options, ...(trade ? { tradeIn: trade } : {}) }) : 'SLATE sells none of these where you live yet.';
  const inHome = (c: number, from: string) => formatMoney(inSaveMoney(sim, c, from), cur);
  const no = model ? buyRefusal(sim, person, model.id, { age, financed, coverage, options }) : typeof q === 'string' ? q : undefined;
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
        <div className="eyebrow">{groupLabelOf('/workspace/vehicles')}</div>
        <h1>Cars</h1>
        <p className="muted">A car, motorcycle, scooter, van, motorhome, bicycle or ATV of your own: what it costs to buy, to keep and to run where you live.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Vehicles">
          {!owned.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <LookRegion>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Vehicle</th><th scope="col">Bought</th><th scope="col" className="num">Worth</th><th scope="col" className="num">Loan Or Lease</th><th scope="col">Registration Due</th><th scope="col">Next Inspection</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {owned.map((v) => {
                    const m = modelById(v.modelId)!;
                    return (
                      <tr key={v.id}>
                        <td><Open subject={at('vehicle', v.id)}>{m.make} {m.model}</Open><FuelGauge v={v} /><CarSpecs modelId={v.modelId} />{v.deliveredAt !== undefined && v.deliveredAt > sim.now ? <div className="xs dim">{`On Order: It Comes ${formatDate(v.deliveredAt, sim.zone)}`}</div> : null}{v.interior ? <div className="xs dim">{v.interior.parts.map((d) => `${PART_LABEL[d.part]} In ${d.color} ${MATERIAL_LABEL[d.material]}${d.stitching ? `, ${d.stitching} Stitching` : ''}`).join(' · ')}</div> : null}</td>
                        <td><Open subject={at('day', dateKey(v.boughtAt, sim.homeZone))}>{formatDate(v.boughtAt, sim.zone)}</Open>{v.ageAtPurchase ? `, ${v.ageAtPurchase} Years Old` : ', New'}</td>
                        <td className="num mono"><Open subject={at('vehicle', v.id)}>{v.lease ? 'Leased' : inHome(valueOf(v, sim.now), m.currency)}</Open></td>
                        <td className="num mono">{v.lease ? `${money(v.lease.monthly)} A Month, ${v.lease.monthsLeft} Left` : v.loan ? <Open subject={at('vehicle', v.id)}>{money(v.loan.owed)}</Open> : 'None'}</td>
                        <td>{registers(modelById(v.modelId)!, v.jurisdiction) ? <Open subject={at('day', dateKey(v.registrationDue, sim.homeZone))}>{formatDate(v.registrationDue, sim.zone)}</Open> : '—'}</td>
                        <td className="small">{(() => { const due = nextInspection(v, v.inspected ?? v.boughtAt); const rule = INSPECTION_RULES[v.jurisdiction]; return due && rule ? <>{`${rule.label}, `}<Open subject={at('day', dateKey(due, sim.homeZone))}>{formatDate(due, sim.zone)}</Open></> : '—'; })()}</td>
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
                            <StereoControl v={v} />
                            <RoofControl v={v} />
                            {tireSetCost(sim, v) !== undefined && kindOf(modelById(v.modelId)!) === 'car' && <Gated feature="vehicle.replace_tires" className="btn btn-sm btn-ghost" title={tiresWorn(v) ? 'Worn to the legal limit: a test that checks them fails them' : `${Math.round((tireLifeOf(v) - (odometerOf(v) - tiresFittedAt(v))) / 1000).toLocaleString('en-US')} thousand km of tread left`} onClick={() => { const a = run<{ paid: number }>('vehicle.replace_tires', { vehicleId: v.id }); if (a.ok) toast(`Four tires fitted, for ${money(a.value!.paid)}.`, 'positive'); }}>{`${tiresWorn(v) ? 'Replace The Worn Tires' : 'Fit New Tires'}, ${money(tireSetCost(sim, v)!)}`}</Gated>}
                            <RepairControl v={v} />
                            <ServiceControl v={v} />
                            <WrapControl v={v} />
                            <CoverControl v={v} />
                            <KeptControl v={v} />
                            <ModifyControl v={v} />
                            {!v.hitch && towRating(v) > 0 && <Gated feature="vehicle.hitch" className="btn btn-sm btn-ghost" disabled={Boolean(hitchRefusal(sim, person, v))} title={hitchRefusal(sim, person, v) ?? `Rated to tow ${Math.round(towRating(v))} kg`} onClick={() => { const a = run<{ paid: number }>('vehicle.hitch', { vehicleId: v.id }); if (a.ok) toast(`A towbar fitted, for ${money(a.value!.paid)}.`, 'positive'); }}>Fit A Towbar</Gated>}
                            {v.transferBy !== undefined && <Gated feature="vehicle.transfer" className="btn btn-sm btn-ghost" title={laidUp(v, sim.now) ?? `Due by ${formatDate(v.transferBy, sim.zone)}`} onClick={() => { const a = run<{ penalty: number }>('vehicle.transfer', { vehicleId: v.id }); if (a.ok) toast(a.value!.penalty ? `Transferred, with a late penalty of ${money(a.value!.penalty)}.` : 'Transferred to you.', 'positive'); }}>Transfer It To You</Gated>}
                            <SaleControl v={v} />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </LookRegion>
          )}
        </Panel>

        <FuelPanel cars={owned} />

        <InteriorWork />

        <TireShop />

        <CarAudioShop />

        <Panel title="Buy One" subtitle={j ? `Where you live: ${PLACE_NAME[j]}` : 'Where you live, SLATE sells no cars yet'}>
          <div className="col gap-3">
            <CatalogControls id="car-catalog" entries={entries} view={view} onChange={(v) => { setView(v); setPick(''); }} facets={{ make: 'Make', fuel: 'Fuel', body: 'Body', drivetrain: 'Drivetrain' }} lead={(
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
                  <option value={0}>New</option>
                  {/* This month's used cars on offer: each its own age, odometer and seller (`usedListings`). */}
                  {(model && j ? usedListings(sim, person, model.id, homeOf(person), j) : []).map((l) => <option key={l.age} value={l.age}>{`${l.age} ${l.age === 1 ? 'Year' : 'Years'} Old, ${l.odometerKm.toLocaleString('en-US')} Km, ${l.seller === 'private' ? 'Privately' : 'At A Dealer'}`}</option>)}
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
            {model && <div className="row gap-2" style={{ alignItems: 'center' }}><CompareToggle className="btn btn-sm" on={compared.includes(model.id)} onToggle={() => toggleCompare(model.id)} /><span className="xs dim">Up to three models side by side, each as its maker states it</span></div>}
            <ModelsCompared ids={compared} entries={entries} money={(c) => formatMoney(c, cur, { cents: false })} onClear={clearCompare} />
            {offered.length > 0 && !leaseMonths && (
              <div className="col gap-2">
                <div className="field-row field-row-tight">
                  {(['paint', 'wheels', 'interior'] as const).filter((cat) => offered.some((o) => o.category === cat)).map((cat) => (
                    <div key={cat} className="field">
                      <label htmlFor={`car-opt-${cat}`}>{cat === 'paint' ? 'Paint' : cat === 'wheels' ? 'Wheels' : 'Interior'}</label>
                      <select id={`car-opt-${cat}`} value={options.find((k) => offered.find((o) => o.key === k)?.category === cat) ?? ''} onChange={(e) => setChosenOptions([...options.filter((k) => offered.find((o) => o.key === k)?.category !== cat), ...(e.target.value ? [e.target.value] : [])])}>
                        <option value="">As It Comes</option>
                        {offered.filter((o) => o.category === cat).map((o) => <option key={o.key} value={o.key}>{`${o.name}, ${o.price ? formatMoney(Math.round(o.price * 100), o.currency, { cents: false }) : 'No Charge'}`}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {offered.some((o) => o.category === 'package' || o.category === 'other') && (
                  <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
                    {offered.filter((o) => o.category === 'package' || o.category === 'other').map((o) => (
                      <label key={o.key} className="row gap-1 small" title={o.includes?.join(', ')}>
                        <input type="checkbox" checked={options.includes(o.key)} onChange={(e) => setChosenOptions(e.target.checked ? [...options, o.key] : options.filter((k) => k !== o.key))} />
                        {`${o.name}, ${o.price ? formatMoney(Math.round(o.price * 100), o.currency, { cents: false }) : 'No Charge'}`}
                      </label>
                    ))}
                  </div>
                )}
                {order?.factory && <div className="xs dim">{model && orderWeeksOf(model) ? `A factory order: about ${orderWeeksOf(model)!.weeks} weeks, ${orderWeeksOf(model)!.whose}, before it’s yours to drive.` : 'No lead time for a factory order of it is published.'}</div>}
              </div>
            )}
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
                    <tr><td>{model.make} {model.model}{kind === 'bicycle' ? '' : `, ${FUEL_WORD[model.fuel]}`}{age ? `, ${Math.round(kept(age) * 100)}% Of New` : ''}{CAR_DETAILS[model.id] ? <span className="xs dim">{` · ${[CAR_DETAILS[model.id]!.year, CAR_DETAILS[model.id]!.body, CAR_DETAILS[model.id]!.transmission, CAR_DETAILS[model.id]!.drivetrain].filter(Boolean).join(' · ')}`}</span> : null}</td><td className="num mono">{inHome(q.price, q.currency)}</td></tr>
                    {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, q.currency)}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(q.total, q.currency)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-3">
              <Stat label="Insurance" value={typeof ins === 'number' && insCurrency ? `${inHome(ins, insCurrency)} A Month` : '—'} note={insBasis ?? 'Not kept here yet'} />
              {leaseMonths ? <Stat label={j?.startsWith('US-') ? 'Money Factor' : 'APR'} value={j?.startsWith('US-') ? String(US_LEASE.moneyFactor) : lq && typeof lq !== 'string' ? `${lq.apr.toFixed(2)}%` : '—'} note={j?.startsWith('US-') ? `About ${(US_LEASE.moneyFactor * 2400).toFixed(2)}% a year, worked back from Toyota’s offers` : pcp ? 'The lender’s rate on a PCP' : 'Honda Canada’s lease rate'} /> : <Stat label="Loan Rate" value={rate !== undefined ? `${(rate * 100).toFixed(2)}%` : '—'} note={rate !== undefined ? 'For your record, where it’s published' : 'Not published here: buy it outright'} />}
              {model && specOf(model.id) && <Stat label="Seats And Cargo" value={specOf(model.id)!.seats ? `${specOf(model.id)!.seats} Seats` : '—'} note={specOf(model.id)!.cargoL ? `${specOf(model.id)!.cargoL} liters behind the seats${specOf(model.id)!.cargoFoldedL ? `, ${specOf(model.id)!.cargoFoldedL} folded` : ''}, the maker’s` : specOf(model.id)!.bedL ? `A ${specOf(model.id)!.bedL} liter bed, the maker’s` : 'No cargo figure published'} />}
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
                const a = run<{ vehicleId: string; paid: number; monthly?: number }>('vehicle.buy', { modelId: model.id, age, financed, months, coverage, options, ...(tradeCar ? { tradeIn: tradeCar.id } : {}) });
                if (a.ok) toast(`Bought, for ${money(a.value!.paid)} now${a.value!.monthly ? ` and ${money(a.value!.monthly)} a month` : ''}.`, 'positive');
              }}>Buy It</Gated>
              )}
              {!leaseMonths && model && age > 0 && <><TestDriveControl modelId={model.id} age={age} /><InspectControl modelId={model.id} age={age} /></>}
            </div>
            <Fine>{lq && typeof lq !== 'string' ? `${lq.basis} ` : ''}{typeof q !== 'string' ? q.basis : q} Depreciation: {DEPRECIATION_SOURCE}. Loans: {LOAN_RATES.source}. Parking on the street at home is the resident’s permit where one’s kept, London’s by Westminster’s bands and Dublin’s, and nothing with a garage at a home you own.</Fine>
          </div>
        </Panel>
        <BoatPanel />
        <CaravanPanel />
        <RoadsidePanel />
      </div>
    </>
  );
}

/** Breakdown cover with the club where one lives (`systems/roadside.ts`): joined at its dues, a tow covered to its kilometers, the calls a year counted. */
function RoadsidePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const m = person.roadside;
  const mine = m ? tierById(m.tierId) : undefined;
  const tiers = tiersFor(sim, person);
  const tow = (t: RoadsideTier) => (t.towKm === null ? 'Anywhere In The Country' : t.towKm === 0 ? (t.covers === 'gb' ? 'To A Nearby Garage' : 'Repaired At The Roadside') : `${Math.round(t.towKm)} km${t.longTowKm ? `, One Of ${Math.round(t.longTowKm)} km` : ''}`);
  return (
    <Panel title="Breakdown Cover" subtitle={mine ? `${mine.club}, ${mine.tier}` : 'A Motoring Club Where You Live'}>
      <div className="col gap-3">
        {m && mine && (
          <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">Paid to {formatDate(m.renewAt, sim.zone)}; {mine.calls === null ? 'unlimited calls' : `${m.used} of ${mine.calls} calls used this year`}; tows {tow(mine).toLowerCase()}.</span>
            <Gated feature="roadside.leave" className="btn btn-sm btn-ghost" onClick={() => { if (run('roadside.leave', {}).ok) toast('Cover ends when what’s paid runs out; nothing more is taken.', 'positive'); }}>Leave The Club</Gated>
          </div>
        )}
        {!m && (tiers.length === 0 ? <p className="small muted" style={{ margin: 0 }}>SLATE has no motoring club for where you live. In Mexico roadside help comes inside a car policy.</p> : (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Cover</th><th scope="col" className="num">Dues</th><th scope="col">Tows</th><th scope="col" className="num">Calls A Year</th><th scope="col">Join</th></tr></thead>
              <tbody>
                {tiers.map((t) => {
                  const d = duesOf(sim, person, t);
                  const no = joinRefusal(sim, person, t.id);
                  return (
                    <tr key={t.id}>
                      <td title={t.basis}>{t.club}, {t.tier}</td>
                      <td className="num mono">{money(d.each)} A {d.period === 'month' ? 'Month' : 'Year'}{d.first > d.each ? `, ${money(d.first)} First` : ''}</td>
                      <td>{tow(t)}</td>
                      <td className="num">{t.calls ?? 'Unlimited'}</td>
                      <td><Gated feature="roadside.join" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ paid: number }>('roadside.join', { tierId: t.id }); if (a.ok) toast(`A member, for ${money(a.value!.paid)}.`, 'positive'); }}>Join</Gated></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        <Fine>A car that won’t go is towed: to the garage when its repair is booked, or on a journey the rest of the way. Without cover it’s the market’s tow; with it, free to the tier’s kilometers and the rest paid by the kilometer. Each club’s dues are its own page’s, or where it prices by ZIP the figure it publishes, as each row says.</Fine>
      </div>
    </Panel>
  );
}

/**
 * Models set side by side (from 2026-10-04, the owner's expansion, §7): the
 * whole price new or used as chosen, and each one's own trim, year, powertrain,
 * economy, body, drivetrain, gearbox, seats, cargo, tank or battery and weight,
 * from its maker's page; a figure not read shows as a dash, never a guess.
 */
function ModelsCompared({ ids, entries, money, onClear }: { ids: readonly string[]; entries: readonly CatalogEntry<CarModel>[]; money: (c: number) => string; onClear: () => void }) {
  const chosen = ids.map((id) => entries.find((e) => e.id === id)).filter((e): e is CatalogEntry<CarModel> => Boolean(e));
  const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const col = (f: (m: CarModel) => string | number | null | undefined) => chosen.map((e) => dash(f(e.value)));
  return (
    <CompareTable heads={chosen.map((e) => e.label)} onClear={onClear} rows={[
      { label: 'Whole Price', values: chosen.map((e) => catalogPrice(e, money)) },
      { label: 'Trim', values: col((m) => m.trim) },
      { label: 'Model Year', values: col((m) => CAR_DETAILS[m.id]?.year) },
      { label: 'Powertrain', values: col((m) => FUEL_WORD[m.fuel]) },
      { label: 'Economy', values: col((m) => (m.kwhPer100km ? `${m.kwhPer100km} kWh Per 100 Km` : m.per100km ? `${m.per100km} L Per 100 Km` : null)) },
      { label: 'Body', values: col((m) => CAR_DETAILS[m.id]?.body) },
      { label: 'Drivetrain', values: col((m) => CAR_DETAILS[m.id]?.drivetrain) },
      { label: 'Transmission', values: col((m) => CAR_DETAILS[m.id]?.transmission) },
      { label: 'Seats', values: col((m) => specOf(m.id)?.seats) },
      { label: 'Cargo', values: col((m) => { const s = specOf(m.id); return s?.cargoL ? `${Math.round(s.cargoL)} L` : s?.bedL ? `A ${Math.round(s.bedL)} L Bed` : null; }) },
      { label: 'Tank Or Battery', values: col((m) => { const c = capacityOf(m); return c ? `${Math.round(c.size)} ${c.unit}${c.estimated ? ' (Estimate)' : ''}` : null; }) },
      { label: 'Weight', values: col((m) => (m.kerbKg ? `${m.kerbKg.toLocaleString('en-US')} Kg` : null)) },
      { label: 'CO2', values: col((m) => (m.co2 ? `${m.co2} G Per Km` : null)) },
    ]} />
  );
}

/** What a car carries, from its maker: seats, cargo and what its tank or battery holds (`specOf`, `capacityOf`), each read by the errands, the shopping and the pump. */
function CarSpecs({ modelId }: { modelId: string }) {
  const m = modelById(modelId);
  const spec = specOf(modelId);
  const cap = m ? capacityOf(m) : undefined;
  const bits = [spec?.seats ? `Seats ${spec.seats}` : undefined, spec?.cargoL ? `${Math.round(spec.cargoL)} L Of Cargo` : spec?.bedL ? `A ${Math.round(spec.bedL)} L Bed` : undefined, cap ? `${Math.round(cap.size)} ${cap.unit}${cap.estimated ? ' (Estimate)' : ''}` : undefined].filter(Boolean);
  return bits.length ? <div className="xs dim">{bits.join(' · ')}</div> : null;
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
            <LookRegion>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Caravan</th><th scope="col">Where</th><th scope="col" className="num">Worth</th><th scope="col">Sell</th></tr></thead>
                <tbody>
                  {mine.map((c) => (
                    <tr key={c.id}>
                      <td><Open subject={at('vehicle', c.id)}>{CARAVANS[c.market].label}</Open></td>
                      <td><Open subject={at('place', c.at ?? c.cityId)}>{CITIES.get(c.at ?? c.cityId)?.name ?? c.cityId}</Open></td>
                      <td className="num mono"><Open subject={at('vehicle', c.id)}>{money(caravanValue(c, sim.now))}</Open></td>
                      <td><Gated feature="caravan.sell" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ value: number }>('caravan.sell', { caravanId: c.id }); if (a.ok) toast(`Sold, for ${money(a.value!.value)}.`, 'positive'); }}>Sell</Gated></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </LookRegion>
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
            <LookRegion>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Boat</th><th scope="col">Kept In</th><th scope="col" className="num">Worth</th><th scope="col">Standing</th><th scope="col">Sell</th></tr></thead>
                <tbody>
                  {boats.map((b) => (
                    <tr key={b.id}>
                      <td><Open subject={at('vehicle', b.id)}>{BOAT_RULES[b.state].model.label}</Open></td>
                      <td><Open subject={at('place', b.cityId)}>{CITIES.get(b.cityId)?.name ?? b.cityId}</Open>{onItsTrailer(person, b) ? ', On Its Trailer' : ''}</td>
                      <td className="num mono"><Open subject={at('vehicle', b.id)}>{money(b.price)}</Open></td>
                      <td>{b.repossessed ? 'Taken By The Lender' : b.loan ? <Open subject={at('vehicle', b.id)}>{`${money(b.loan.owed)} Owed`}</Open> : 'Owned Outright'}</td>
                      <td><Gated feature="boat.sell" className="btn btn-sm btn-ghost" disabled={Boolean(b.repossessed)} title={b.repossessed ? 'The lender has it.' : undefined} onClick={() => { if (run('boat.sell', { boatId: b.id }).ok) toast('Sold.', 'positive'); }}>Sell</Gated></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </LookRegion>
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
  const open = arrange(modCatalog(sim, v.jurisdiction.startsWith('US-') ? 'US' : 'GB')).map((e) => e.value).filter((m) => !modRefusal(v, m, glazed(v)));
  const [mod, setMod] = useState<Mod | ''>('');
  if (!open.length) return null;
  const chosen = mod && open.includes(mod) ? mod : open[0]!;
  return (
    <>
      <select aria-label="Modification" value={chosen} onChange={(e) => setMod(e.target.value as Mod)} style={{ width: 'auto' }}>
        {open.map((m) => <option key={m} value={m}>{MOD_LABEL[m]}</option>)}
      </select>
      <Gated feature="vehicle.modify" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.modify', { vehicleId: v.id, mod: chosen }); if (a.ok) toast(`${MOD_LABEL[chosen]} fitted, for ${formatMoney(a.value!.paid, saveCurrency(sim.universe))}${v.jurisdiction === 'GB' ? ', and declared to the insurer' : ''}.`, 'positive'); }}>Fit It</Gated>
    </>
  );
}

/** A loaner or a rental while the car is in the shop (`systems/standin.ts`). */
function StandInControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const has = standInFor(sim.player, v);
  if (has) return <span className="xs dim">{has.standIn?.loaner ? 'Driving The Loaner' : 'Driving A Rental'}</span>;
  const q = standInQuote(sim, sim.player, v, sim.now);
  if (typeof q === 'string' && q === 'It isn’t in a shop.') return null;
  const cur = saveCurrency(sim.universe);
  const loaner = typeof q !== 'string' && Boolean(q.loaner);
  const price = typeof q === 'string' ? '' : q.total > 0 ? `, ${formatMoney(q.total, cur, { cents: false })}` : ', Free';
  return (
    <Gated feature="vehicle.stand_in" className="btn btn-sm btn-ghost" disabled={typeof q === 'string'} title={typeof q === 'string' ? q : `${q.what}, ${q.days} ${q.days === 1 ? 'day' : 'days'}${q.deposit ? `, a ${formatMoney(q.deposit, cur, { cents: false })} deposit held` : ''}.`} onClick={() => { const a = run('vehicle.stand_in', { vehicleId: v.id }); if (a.ok) toast(loaner ? 'The loaner is yours until the car is ready.' : 'The rental is yours until the car is ready.', 'positive'); }}>{`${loaner ? 'Take The Loaner' : 'Rent A Car Meanwhile'}${price}`}</Gated>
  );
}

/** A fault the car has, and the garages in its town that would take it (`systems/repairs.ts`). */
/** How full its tank or battery is, and how far that goes (`systems/fueltank.ts`). */
function FuelGauge({ v }: { v: OwnedVehicle }) {
  const cap = capacityOf(modelById(v.modelId)!);
  if (!cap) return null;
  const range = rangeKm(v);
  return <div className="xs dim">{cap.unit === 'kWh' ? 'Battery' : 'Tank'} {Math.round(levelOf(v) * 100)}%{range !== undefined ? `, ${Math.round(range)} km` : ''} of {Math.round(cap.size)} {cap.unit === 'kWh' ? 'kWh' : 'Liters'}{cap.estimated ? ' (SLATE’s Estimate)' : ''}</div>;
}

/**
 * Fuel and charging (from 2026-10-03): each car's tank or battery, where it's
 * filled (a station of the town, a public charger, or at home on a charger),
 * how much (full, liters or kWh, a spending limit, or a level), what it comes
 * to on what price, and the last fills; and who fills it as the month goes.
 */
function FuelPanel({ cars }: { cars: OwnedVehicle[] }) {
  const tanked = cars.filter((v) => capacityOf(modelById(v.modelId)!) !== undefined && v.repossessed === undefined);
  if (!tanked.length) return null;
  return (
    <Panel title="Fuel And Charging" subtitle="Where, which grade or charger, how much, and what it comes to; a station’s own posted price where one is published, the area’s average where not">
      <div className="col gap-4">{tanked.map((v) => <FillForm key={v.id} v={v} />)}</div>
    </Panel>
  );
}

type FillBy = 'full' | 'quantity' | 'spend' | 'level';

function FillForm({ v }: { v: OwnedVehicle }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m)!;
  const ev = m.fuel === 'ev';
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const stations = STATIONS[person.currentLocationId] ?? [];
  // An electric car's places: the town's named chargers, any public one at the area's average, and home with a charger.
  // Cheapest first on one basis, a kWh or a liter of the car's usual grade in the save's money; a place the car can't use after them, and one by the hour last of those it can.
  const usual: Grade = m.fuel === 'diesel' ? 'diesel' : 'regular';
  const rank = (p: UnitPrice | string): number => (typeof p === 'string' ? Infinity : p.perHour !== undefined ? 1e9 : inSaveMoney(sim, Math.round(p.minor * 1000), p.currency) / 1000);
  const chargers = ev ? [...chargersIn(person.currentLocationId)].sort((a, b) => rank(priceAt(v, { chargerId: a.id }, sim.now)) - rank(priceAt(v, { chargerId: b.id }, sim.now))) : [];
  const stationOrder = stations.map((_, i) => i).sort((a, b) => rank(priceAt(v, { station: a, grade: usual }, sim.now)) - rank(priceAt(v, { station: b, grade: usual }, sim.now)));
  const places = ev ? [...chargers.map((c) => c.id), 'public', ...(homeShareOf(person) > 0 ? ['home'] : [])] : stationOrder.map(String);
  const [place, setPlace] = useState(places[0] ?? '0');
  const grades = gradesFor(m);
  const [grade, setGrade] = useState<Grade>(grades[0]!);
  const [by, setBy] = useState<FillBy>('full');
  const [value, setValue] = useState('');
  const home = place === 'home';
  const at: FillAt = ev ? (home ? { home: true } : place === 'public' ? {} : { chargerId: place }) : { station: Number(place), grade };
  const amount: FillAmount = by === 'full' ? { by: 'full' } : by === 'level' ? { by: 'level', value: Number(value) / 100 } : by === 'spend' ? { by: 'spend', value: Math.round(Number(value) * 100) } : { by: 'quantity', value: Number(value) };
  const no = fillRefusal(person, v.id, home);
  const plan = no ? no : by !== 'full' && !(Number(value) > 0) ? 'Enter an amount.' : planFill(sim, v, amount, at);
  const unit = cap.unit === 'kWh' ? 'kWh' : 'Liters';
  const range = rangeKm(v);
  const unitPrice = (p: UnitPrice) => (p.perHour !== undefined ? `${formatMoney(Math.round(p.perHour), p.currency)} an hour` : `${formatMoney(Math.round(p.minor), p.currency)} a ${ev ? 'kWh' : 'liter'}`);
  return (
    <div className="col gap-2">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <strong>{`${m.make} ${m.model}`}</strong>
        <span className="xs dim">{`${ev ? 'Battery' : 'Tank'} ${Math.round(levelOf(v) * 100)}%${range !== undefined ? `, about ${Math.round(range)} km` : ''}, of ${Math.round(cap.size)} ${unit}${cap.estimated ? ' (SLATE’s estimate)' : ''}${v.dry ? '; run dry' : levelOf(v) < lowAt(m) ? '; running low' : ''}`}</span>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`fill-at-${v.id}`}>{ev ? 'Charge At' : 'Station'}</label>
          <select id={`fill-at-${v.id}`} value={place} onChange={(e) => setPlace(e.target.value)}>
            {ev ? places.map((p) => {
              const c = chargers.find((x) => x.id === p);
              if (!c) return <option key={p} value={p}>{p === 'home' ? 'Home, On Your Charger' : 'Any Public Fast Charger, The Area’s Average'}</option>;
              const price = priceAt(v, { chargerId: c.id }, sim.now);
              return <option key={p} value={p}>{`${c.network}, ${c.name}, ${c.kw} kW, ${typeof price === 'string' ? price.replace(/\.$/, '') : unitPrice(price)}`}</option>;
            }) : stationOrder.map((i) => { const price = priceAt(v, { station: i, grade: usual }, sim.now); return <option key={stations[i]} value={String(i)}>{`${stations[i]}${typeof price === 'string' ? '' : `, ${GRADE_LABEL[usual]} ${unitPrice(price)}`}`}</option>; })}
          </select>
        </div>
        {!ev && (
          <div className="field">
            <label htmlFor={`fill-grade-${v.id}`}>Grade</label>
            <select id={`fill-grade-${v.id}`} value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
              {grades.map((g) => { const p = priceAt(v, { station: Number(place), grade: g }, sim.now); return <option key={g} value={g}>{`${GRADE_LABEL[g]}${typeof p === 'string' ? ' (Not Here)' : `, ${unitPrice(p)}${p.basis === 'station' ? ', Posted' : ', Area Average'}`}`}</option>; })}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor={`fill-by-${v.id}`}>How Much</label>
          <select id={`fill-by-${v.id}`} value={by} onChange={(e) => { setBy(e.target.value as FillBy); setValue(''); }}>
            <option value="full">{ev ? 'To Full' : 'Fill It'}</option>
            <option value="quantity">{`A Number Of ${unit}`}</option>
            <option value="spend">Up To An Amount Of Money</option>
            <option value="level">To A Level</option>
          </select>
        </div>
        {by !== 'full' && (
          <div className="field">
            <label htmlFor={`fill-n-${v.id}`}>{by === 'quantity' ? unit : by === 'spend' ? cur : 'Percent'}</label>
            <input id={`fill-n-${v.id}`} type="number" min={0} step={by === 'level' ? 5 : 1} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        )}
      </div>
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Gated feature="vehicle.refuel" className="btn btn-sm btn-primary" disabled={typeof plan === 'string'} title={typeof plan === 'string' ? plan : undefined} onClick={() => {
          const a = run<{ amount: number; paid: number; minutes: number }>('vehicle.refuel', { vehicleId: v.id, ...(home ? { home: true } : ev ? {} : { station: Number(place) }), amount });
          if (a.ok) toast(`${a.value!.amount.toFixed(1)} ${cap.unit === 'kWh' ? 'kWh' : 'liters'} for ${money(a.value!.paid)}${a.value!.minutes ? `, ${a.value!.minutes} minutes` : ''}.`, 'positive');
        }}>{ev ? 'Charge It' : 'Fill It'}</Gated>
        <span className="small">{typeof plan === 'string' ? plan : `${plan.amount.toFixed(1)} ${cap.unit === 'kWh' ? 'kWh' : 'liters'} for ${money(plan.cost)}${plan.minutes ? `, ${plan.minutes} minutes` : ', overnight'}, at ${unitPrice(plan.price)}: ${plan.price.why}.`}</span>
      </div>
      <label className="small row gap-1" style={{ alignItems: 'center' }}>
        <Gated feature="vehicle.set_filling" className="btn btn-sm btn-ghost" onClick={() => { if (run('vehicle.set_filling', { vehicleId: v.id, auto: fillingOf(v) !== 'auto' }).ok) toast(fillingOf(v) === 'auto' ? 'It’s filled as it’s driven now.' : 'Only you fill it now.', 'positive'); }}>{fillingOf(v) === 'auto' ? 'Fill It Only When I Do' : 'Fill It As It’s Driven'}</Gated>
        <span className="xs dim">{fillingOf(v) === 'auto' ? `It’s filled as the month’s driving goes: at a ${ev ? 'fifth' : 'quarter'}, to ${ev ? '80%' : 'full'}.` : 'Only you fill it: everyday driving runs it down a day at a time, and it stops where it runs dry.'}</span>
      </label>
      {(v.fills ?? []).length > 0 && (
        <ul className="list-plain xs dim">
          {(v.fills ?? []).slice(0, 5).map((f) => <li key={f.at}>{`${formatDate(f.at, sim.zone)}: ${f.amount.toFixed(1)} ${f.unit === 'kWh' ? 'kWh' : 'liters'}${f.grade ? ` of ${GRADE_LABEL[f.grade].toLowerCase()}` : ''} at ${f.where}, ${money(f.cost)}, to ${Math.round(f.level * 100)}%${f.priceWhy ? `; ${f.priceWhy}` : f.basis === 'area' ? '; the area’s price' : ''}`}</li>)}
        </ul>
      )}
    </div>
  );
}

/** A stereo with CarPlay fitted, where a retailer publishes the fitting (`vehicle.stereo`). */
function StereoControl({ v }: { v: OwnedVehicle }) {
  const { sim, run, toast } = useGame();
  const q = stereoQuote(sim, v);
  if (v.lease) return null;
  // Speakers and an amplifier where a retailer prices fitting them (`audioQuote`).
  const parts = (['speakers', 'amp'] as const).map((part) => ({ part, q: audioQuote(sim, v, part) })).filter((x) => typeof x.q !== 'string') as { part: 'speakers' | 'amp'; q: { price: number; basis: string } }[];
  const extras = parts.map(({ part, q: pq }) => <Gated key={part} feature="vehicle.audio" className="btn btn-sm btn-ghost" title={pq.basis} onClick={() => { const r = run<{ paid: number }>('vehicle.audio', { vehicleId: v.id, part }); if (r.ok) toast(`${part === 'amp' ? 'An amplifier' : 'Speakers'} fitted, for ${formatMoney(r.value!.paid, saveCurrency(sim.universe))}.`, 'positive'); }}>{`${part === 'amp' ? 'Fit An Amplifier' : 'Fit Speakers'}, ${formatMoney(pq.price, saveCurrency(sim.universe), { cents: false })}`}</Gated>);
  if (typeof q === 'string') return extras.length ? <>{extras}</> : null;
  return <>{extras}<Gated feature="vehicle.stereo" className="btn btn-sm btn-ghost" title={q.basis} onClick={() => { const a = run<{ paid: number }>('vehicle.stereo', { vehicleId: v.id }); if (a.ok) toast(`A stereo fitted, for ${formatMoney(a.value!.paid, saveCurrency(sim.universe))}.`, 'positive'); }}>{`Fit A Stereo, ${formatMoney(q.price, saveCurrency(sim.universe), { cents: false })}`}</Gated></>;
}

/** A used car looked over before it's bought (`vehicle.inspect_used`), and what was found. */
/** A test drive at the dealer before buying: its minutes, and what it shows (`vehicle.test_drive`). */
function TestDriveControl({ modelId, age }: { modelId: string; age: number }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const j = jurisdictionOf(homeOf(person));
  if (!j || age <= 0) return null;
  const driven = drivenOn(sim, person, modelId, age, homeOf(person));
  if (driven) return <span className="small">{driven.showed ? (driven.severe ? 'On the test drive it wouldn’t go.' : 'On the test drive a warning light came on.') : 'The test drive showed nothing wrong.'}</span>;
  return <Gated feature="vehicle.test_drive" className="btn btn-sm btn-ghost" title={`${testDriveMinutes(j)} minutes at the dealer, with a license that lets you drive here`} onClick={() => { const a = run<{ showed: boolean }>('vehicle.test_drive', { modelId, age }); if (a.ok) toast(a.value!.showed ? 'Something showed on the drive.' : 'It drove fine.', a.value!.showed ? 'neutral' : 'positive'); }}>Test Drive It</Gated>;
}

function InspectControl({ modelId, age }: { modelId: string; age: number }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const j = jurisdictionOf(homeOf(person));
  if (!j) return null;
  const report = reportOn(sim, person, modelId, age, homeOf(person));
  if (report) return <span className="small">{report.fault ? `The inspection found a ${report.severe ? 'serious ' : ''}fault, about ${formatMoney(Math.round(report.usd! * 100), 'USD', { cents: false })} to mend.` : 'The inspection found nothing wrong.'}</span>;
  const t = PRE_PURCHASE[j];
  return <Gated feature="vehicle.inspect_used" className="btn btn-sm btn-ghost" title={`${t.name}'s pre-purchase inspection. The AA finds seven in ten used cars have a fault.`} onClick={() => { const a = run<{ fault: boolean }>('vehicle.inspect_used', { modelId, age }); if (a.ok) toast(a.value!.fault ? 'The inspector found a fault.' : 'The inspector found nothing wrong.', a.value!.fault ? 'neutral' : 'positive'); }}>{`Have It Inspected, ${formatMoney(inspectionPrice(sim, j), saveCurrency(sim.universe), { cents: false })}`}</Gated>;
}

function RepairControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const m = modelById(v.modelId)!;
  const shops = shopsFor(v.at ?? v.cityId, m);
  const [shopId, setShopId] = useState('');
  const laid = laidUp(v, sim.now);
  if (inShopNow(v, sim.now)) return <><span className="xs dim">{laid}</span><StandInControl v={v} /></>;
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
      <Gated feature="vehicle.repair" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? chosen?.address} onClick={() => { const a = run<{ paid: number; bookedFor?: number }>('vehicle.repair', { vehicleId: v.id, shopId: chosen!.id }); if (a.ok) toast(a.value!.bookedFor !== undefined ? `Booked in at ${chosen!.name}, ${formatDateTime(a.value!.bookedFor, sim.zone)}: it’s paid when it goes in.` : `In at ${chosen!.name}, for ${formatMoney(a.value!.paid, cur, { cents: false })}.`, 'positive'); }}>{chosen && shops.length === 1 ? `Book The Repair At ${chosen.name}` : 'Book The Repair'}</Gated>
    </>
  );
}

/** A wrap in the color and finish chosen, whole or a part, at a shop in the car's town that posts its price, and taken off where one posts that (`systems/wraps.ts`). */
function WrapControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const m = modelById(v.modelId)!;
  const here = wrapShopsIn(v.at ?? v.cityId);
  const parts = WRAP_PARTS.filter((x) => here.some((s) => s.parts[x]));
  const [part, setPart] = useState<WrapPart>('full');
  const [shopId, setShopId] = useState('');
  const [color, setColor] = useState<string>(WRAP_COLORS[0]);
  const [finish, setFinish] = useState<Finish>('gloss');
  const cur = saveCurrency(sim.universe);
  const removers = here.filter((s) => s.removal);
  const off = v.wrap ? removers.map((s) => ({ s, cost: removalCost(sim, s, m)! })).sort((a, b) => a.cost - b.cost)[0] : undefined;
  if (!parts.length && !off) return null;
  const chosen = parts.includes(part) ? part : parts[parts.length - 1]!;
  const shops = here.filter((s) => s.parts[chosen]).sort((a, b) => wrapCost(sim, a, m, chosen)! - wrapCost(sim, b, m, chosen)!);
  const shop = shops.find((x) => x.id === shopId) ?? shops[0];
  const no = shop ? wrapRefusal(sim.player, v, shop.id, color, finish, sim.now, chosen) : undefined;
  return (
    <>
      {v.wrap && <span className="xs dim">{`Wrapped, ${v.wrap.finish === 'gloss' ? 'Gloss' : v.wrap.finish === 'satin' ? 'Satin' : 'Matte'} ${v.wrap.color}${v.wrap.part ? `, ${WRAP_PART_LABEL[v.wrap.part]}` : ''}`}</span>}
      {off && <Gated feature="vehicle.unwrap" className="btn btn-sm btn-ghost" disabled={Boolean(unwrapRefusal(sim.player, v, off.s.id, sim.now))} title={unwrapRefusal(sim.player, v, off.s.id, sim.now)} onClick={() => { const a = run<{ paid: number }>('vehicle.unwrap', { vehicleId: v.id, shopId: off.s.id }); if (a.ok) toast(`At ${off.s.name} to have it taken off, for ${formatMoney(a.value!.paid, cur, { cents: false })}.`, 'positive'); }}>{`Take The Wrap Off At ${off.s.name}, ${formatMoney(off.cost, cur, { cents: false })}`}</Gated>}
      {shop && <>
      <select aria-label="What To Wrap" value={chosen} onChange={(e) => setPart(e.target.value as WrapPart)} style={{ width: 'auto' }}>
        {parts.map((x) => <option key={x} value={x}>{WRAP_PART_LABEL[x]}</option>)}
      </select>
      <select aria-label="Wrap Shop" value={shop.id} onChange={(e) => setShopId(e.target.value)} style={{ width: 'auto' }}>
        {shops.map((x) => <option key={x.id} value={x.id}>{`${x.name}, ${formatMoney(wrapCost(sim, x, m, chosen)!, cur, { cents: false })}`}</option>)}
      </select>
      <select aria-label="Wrap Color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 'auto' }}>
        {WRAP_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select aria-label="Wrap Finish" value={finish} onChange={(e) => setFinish(e.target.value as Finish)} style={{ width: 'auto' }}>
        {FINISHES.map((x) => <option key={x} value={x}>{x === 'gloss' ? 'Gloss' : x === 'satin' ? 'Satin' : 'Matte'}</option>)}
      </select>
      <Gated feature="vehicle.wrap" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ paid: number }>('vehicle.wrap', { vehicleId: v.id, shopId: shop.id, color, finish, part: chosen }); if (a.ok) toast(`At ${shop.name} to be wrapped, for ${formatMoney(a.value!.paid, cur, { cents: false })}.`, 'positive'); }}>Wrap It</Gated>
      </>}
    </>
  );
}

/** Where a car is kept overnight, in England and Wales, where the Crime Survey sets its odds by it (`systems/theft.ts`). */
function KeptControl({ v }: { v: OwnedVehicle }) {
  const { run } = useGame();
  const person = useWorld((s) => s.player);
  const keep = useFeature('vehicle.keep_in');
  if (!/^uk-(eng|wls)-/.test(v.at ?? v.cityId)) return null;
  const where = keptIn(person, v);
  const odds = (w: 'garage' | 'street') => `${(englandRate('of', w) / 100).toFixed(2)} stolen and ${(englandRate('from', w) / 100).toFixed(1)} broken into a 1,000 a year`;
  return (
    <div className="field" style={{ margin: 0 }}>
      <label htmlFor={`kept-${v.id}`}>Kept Overnight</label>
      <select id={`kept-${v.id}`} value={where} disabled={!keep.open} title={keep.reason ?? odds(where)} onChange={(e) => run('vehicle.keep_in', { vehicleId: v.id, where: e.target.value })} style={{ width: 'auto' }}>
        <option value="street">On The Street</option>
        {hasGarage(person) && <option value="garage">In Your Garage</option>}
      </select>
      <span className="xs dim">{odds(where)}</span>
    </div>
  );
}

/** Full cover or liability, changed after buying where the law and the lender allow (`systems/wraps.ts`). */
function CoverControl({ v }: { v: OwnedVehicle }) {
  const { run, toast } = useGame();
  const other = v.coverage === 'full' ? 'liability' : 'full';
  const no = coverRefusal(v, other, liabilityOffered(v.jurisdiction, modelById(v.modelId)!));
  if (no === 'Liability alone isn’t offered for it here.') return null;
  return <Gated feature="vehicle.coverage" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('vehicle.coverage', { vehicleId: v.id, coverage: other }).ok) toast(other === 'full' ? 'Full cover from the next month.' : 'Liability only from the next month.', 'positive'); }}>{other === 'full' ? 'Change To Full Cover' : 'Change To Liability Only'}</Gated>;
}

/** Its servicing, by the maker's interval, and its warranty (`systems/carcare.ts`). */
/** A roof rack, then a box on it, cheapest first; the box taken off and kept at home between trips (`systems/roofbox.ts`). */
function RoofControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const person = useWorld((s) => s.player);
  const cat = useWorld((s) => roofCatalog(s, v), [v]);
  const [boxId, setBoxId] = useState('');
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const on = boxOn(person, v);
  const atHome = (person.items ?? []).some((i) => i.kind.startsWith('roofbox:') && i.at.kind === 'home');
  if (!v.roofRack) return cat.rack ? <Gated feature="vehicle.roof_rack" className="btn btn-sm btn-ghost" disabled={Boolean(rackRefusal(v))} title={rackRefusal(v) ?? cat.rack.name} onClick={() => { if (run('vehicle.roof_rack', { vehicleId: v.id }).ok) toast('A roof rack fitted.', 'positive'); }}>{`Fit A Roof Rack, ${money(cat.rack.price)}`}</Gated> : null;
  if (on) return <Gated feature="vehicle.roof_box_fit" className="btn btn-sm btn-ghost" title={`${on.label}, ${on.holdsL} liters; it costs fuel while it's on`} onClick={() => { if (run('vehicle.roof_box_fit', { vehicleId: v.id, on: false }).ok) toast('The box is off, kept at home.', 'positive'); }}>Take The Box Off</Gated>;
  if (atHome) return <Gated feature="vehicle.roof_box_fit" className="btn btn-sm btn-ghost" onClick={() => { if (run('vehicle.roof_box_fit', { vehicleId: v.id, on: true }).ok) toast('The box is on.', 'positive'); }}>Put The Box On</Gated>;
  const box = cat.boxes.find((b) => b.id === boxId) ?? cat.boxes[0];
  if (!box) return null;
  return (
    <>
      {cat.boxes.length > 1 && <select aria-label="Roof Box" value={box.id} onChange={(e) => setBoxId(e.target.value)} style={{ width: 'auto' }}>{cat.boxes.map((b) => <option key={b.id} value={b.id}>{`${b.name}, ${b.liters} L, ${money(b.cost)}`}</option>)}</select>}
      <Gated feature="vehicle.roof_box" className="btn btn-sm btn-ghost" title={`${box.liters} liters more; while it's on, 5% more fuel in town and 11.5% on the highway`} onClick={() => { if (run('vehicle.roof_box', { vehicleId: v.id, boxId: box.id }).ok) toast(`${box.name} on.`, 'positive'); }}>{`Buy A Roof Box, ${money(box.cost)}`}</Gated>
    </>
  );
}

/** Sold to a dealer now for its offer, or listed privately at the site's fee to sell for its value in about a month (`systems/carsale.ts`). */
function SaleControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const no = useWorld((s) => saleRefusal(s, s.player, v.id), [v]);
  const noList = useWorld((s) => listRefusal(s, s.player, v.id), [v]);
  const offer = useWorld((s) => dealerOffer(s, v), [v]);
  const worth = useWorld((s) => privateValue(s, v), [v]);
  const listing = useWorld((s) => listingQuote(s, v), [v]);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  if (v.listed) return (
    <>
      <span className="xs dim">{`Listed On ${v.listed.platform}, A Buyer About ${formatDate(v.listed.sellsAt, sim.zone)}`}</span>
      <Gated feature="vehicle.unlist" className="btn btn-sm btn-ghost" onClick={() => { if (run('vehicle.unlist', { vehicleId: v.id }).ok) toast('Taken down.', 'neutral'); }}>Take The Listing Down</Gated>
      <Gated feature="vehicle.sell" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ value: number }>('vehicle.sell', { vehicleId: v.id }); if (a.ok) toast(`Sold to a dealer: ${money(a.value!.value)} to you after the loan.`, 'positive'); }}>{`Sell To A Dealer, ${money(offer)}`}</Gated>
    </>
  );
  return (
    <>
      <Gated feature="vehicle.sell" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? 'Today, for less than a private buyer pays'} onClick={() => { const a = run<{ value: number }>('vehicle.sell', { vehicleId: v.id }); if (a.ok) toast(`Sold to a dealer: ${money(a.value!.value)} to you after the loan.`, 'positive'); }}>{`Sell To A Dealer, ${money(offer)}`}</Gated>
      {listing && <Gated feature="vehicle.list" className="btn btn-sm btn-ghost" disabled={Boolean(noList)} title={noList ?? `On ${listing.platform}${listing.confirmed ? '' : ', its terms read secondhand'}: about ${money(worth)} in a month, when you're in town for the buyer`} onClick={() => { if (run('vehicle.list', { vehicleId: v.id }).ok) toast(`Listed on ${listing.platform}.`, 'positive'); }}>{`List It For Sale${listing.fee > 0 ? `, ${formatMoney(listing.fee, cur)}` : ''}`}</Gated>}
    </>
  );
}

function ServiceControl({ v }: { v: OwnedVehicle }) {
  const { run, toast, sim } = useGame();
  const m = modelById(v.modelId)!;
  const due = serviceDue(v, m);
  const [shopId, setShopId] = useState('');
  if (!due) return null;
  const shops = CAR_SHOPS.filter((x) => x.cityId === (v.at ?? v.cityId) && (!x.make || x.make === m.make));
  const shop = shops.find((x) => x.id === shopId) ?? shops[0];
  const no = shop ? serviceRefusal(sim.player, v, m, shop.id, sim.now) : 'No garage SLATE knows of in its town services it.';
  const kept = servicingKept(v, m, sim.now);
  const w = warrantyOf(v, m);
  const cur = saveCurrency(sim.universe);
  return (
    <>
      <span className="xs dim">{`Service Due ${formatDate(due.at, sim.zone)} Or ${Math.round(due.km).toLocaleString('en-US')} Km${kept ? '' : ', Servicing Not Kept'}${w ? (inWarranty(v, m, sim.now) ? ', Under Warranty' : ', Out Of Warranty') : ''}`}</span>
      {shops.length > 1 && (
        <select aria-label="Service Garage" value={shop?.id ?? ''} onChange={(e) => setShopId(e.target.value)} style={{ width: 'auto' }}>
          {shops.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      )}
      <Gated feature="vehicle.service" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? `${serviceWhat(v)}.`} onClick={() => { const a = run<{ paid: number }>('vehicle.service', { vehicleId: v.id, shopId: shop!.id }); if (a.ok) toast(`Serviced, for ${formatMoney(a.value!.paid, cur, { cents: false })}.`, 'positive'); }}>{`Book The Service, ${formatMoney(serviceCost(sim, v), cur, { cents: false })}`}</Gated>
    </>
  );
}

/** The interior done to your own design at a shop in the car's town: what's done, in what, its colors, an itemized estimate, then the commission (`vehicle.interior`). */
const SEASON_LABEL: Readonly<Record<string, string>> = { 'all-season': 'All-Season', 'all-weather': 'All-Weather', summer: 'Summer', winter: 'Winter' };
/**
 * Tires by make and model (`systems/tires.ts`, from 2026-10-05): a set of four
 * of a model sold where the car is, fitted as its everyday set, or as its
 * winter set where SLATE keeps winter tires, each lasting its own warranty.
 */
function TireShop() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const everyday = useFeature('vehicle.replace_tires');
  const winterGate = useFeature('vehicle.winter_tires');
  const cars = vehiclesOf(person).filter((v) => v.soldAt === undefined && !v.repossessed && kindOf(modelById(v.modelId)!) === 'car');
  const [vehicleId, setVehicleId] = useState('');
  const [winter, setWinter] = useState(false);
  if (cars.length === 0) return null;
  const v = cars.find((x) => x.id === vehicleId) ?? cars[0]!;
  const winterOk = !tiresRefusal(v);
  const asWinter = winter && winterOk;
  const shop = tireCatalog(sim, v, asWinter);
  const life = (r: DeviceRow) => `${typeof r.product.attrs.warrantyKm === 'number' ? '' : '≈'}${Math.round(lifeOfTire(r.product) / 1000).toLocaleString('en-US')} Thousand km`;
  return (
    <Panel title="Tires" subtitle="A set of four, by make and model">
      <div className="col gap-2">
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {cars.length > 1 && <div className="field" style={{ margin: 0 }}><label htmlFor="tire-car">For</label><select id="tire-car" value={v.id} onChange={(e) => setVehicleId(e.target.value)}>{cars.map((c) => <option key={c.id} value={c.id}>{modelById(c.modelId)!.make} {modelById(c.modelId)!.model}</option>)}</select></div>}
          {winterOk && <div className="field" style={{ margin: 0 }}><label htmlFor="tire-kind">Set</label><select id="tire-kind" value={asWinter ? 'winter' : 'everyday'} onChange={(e) => setWinter(e.target.value === 'winter')}><option value="everyday">Everyday</option><option value="winter">Winter</option></select></div>}
        </div>
        {shop.length === 0 ? <div className="small">No tire of that kind was read on sale where the car is.</div> : (
          <DeviceShop list={asWinter ? 'tires-winter' : 'tires'} title={asWinter ? 'Winter Tires' : 'Everyday Tires'} shop={shop} refusal={(id) => tireOfferRefusal(v, id, asWinter)} command={asWinter ? 'vehicle.winter_tires' : 'vehicle.replace_tires'} gate={asWinter ? winterGate : everyday}
            payload={{ vehicleId: v.id }} buyLabel="Fit A Set" bought={(label) => `Four ${label} tires fitted.`}
            facets={{ brand: 'Maker', season: 'Season' }}
            facetsOf={(r) => ({ brand: r.product.brand, season: SEASON_LABEL[String(r.product.attrs.season)] ?? 'All-Season' })}
            columns={[
              { head: 'Season', cell: (r) => SEASON_LABEL[String(r.product.attrs.season)] ?? '—' },
              { head: 'Lasts', num: true, cell: life },
              { head: 'Fitted', cell: (r) => (r.offer.code === 'fitted' ? 'Yes' : r.offer.market === 'us' ? 'Fitting Added' : 'Not Read') },
            ]}
            compare={[
              { label: 'Season', value: (r) => SEASON_LABEL[String(r.product.attrs.season)] ?? '—' },
              { label: 'Size', value: (r) => String(r.product.attrs.size) },
              { label: 'Lasts', value: life },
              { label: 'EU Label', value: (r) => String(r.product.attrs.euLabel ?? '—') },
              { label: 'Load And Speed', value: (r) => String(r.product.attrs.loadSpeed ?? '—') },
            ]}
            fine="Four tires at the seller’s own price, America’s and Canada’s with the place’s sales tax, at 215/55 R17 or the nearest size the maker sells, the size SLATE prices every car’s set at. America’s sets add BJ’s $80 to fit; elsewhere a price not fitted has no fitting read, and none is added. A set lasts its warranty, or, marked ≈, the CrossClimate 2’s 60,000 miles (a winter tire the X-Ice Snow’s 40,000)." />
        )}
      </div>
    </Panel>
  );
}

const AUDIO_PART: Readonly<Record<string, string>> = { 'head-unit': 'Stereo', speakers: 'Speakers', amplifier: 'Amplifier' };
/**
 * Car audio by make and model (`systems/caraudio.ts`, from 2026-10-05): a
 * stereo, speakers or an amplifier sold where the car is, fitted at the
 * market's published price or by the owner where none is published.
 */
function CarAudioShop() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const gate = useFeature('vehicle.audio');
  const cars = vehiclesOf(person).filter((v) => v.soldAt === undefined && !v.repossessed && kindOf(modelById(v.modelId)!) === 'car');
  const [vehicleId, setVehicleId] = useState('');
  if (cars.length === 0) return null;
  const v = cars.find((x) => x.id === vehicleId) ?? cars[0]!;
  const shop = carAudioCatalog(sim, v);
  if (shop.length === 0) return null;
  const spec = (r: DeviceRow) => { const a = r.product.attrs; return a.part === 'head-unit' ? [a.screenIn ? `${a.screenIn}" Screen` : 'No Screen', a.carplay && a.carplay !== 'none' ? `CarPlay (${a.carplay})` : ''].filter(Boolean).join(', ') : a.part === 'speakers' ? [a.sizeIn ? `${a.sizeIn}"` : '', a.kind ?? '', a.rmsWatts ? `${a.rmsWatts} W RMS` : ''].filter(Boolean).join(', ') : [a.channels ? `${a.channels} Channels` : '', a.rmsWatts ? `${a.rmsWatts} W RMS` : ''].filter(Boolean).join(', ') || '—'; };
  const fitting = (r: DeviceRow) => { const f = fittingFor(r.offer.market, r.product); return f ? `By ${f.by}` : 'By You'; };
  return (
    <Panel title="Car Audio" subtitle="A stereo, speakers or an amplifier, by make and model">
      <div className="col gap-2">
        {cars.length > 1 && <div className="field" style={{ margin: 0 }}><label htmlFor="audio-car">For</label><select id="audio-car" value={v.id} onChange={(e) => setVehicleId(e.target.value)}>{cars.map((c) => <option key={c.id} value={c.id}>{modelById(c.modelId)!.make} {modelById(c.modelId)!.model}</option>)}</select></div>}
        <DeviceShop list="car-audio" title="Sold Where The Car Is" shop={shop} refusal={(id) => chosenRefusal(v, id)} command="vehicle.audio" gate={gate}
          payload={{ vehicleId: v.id }} buyLabel="Fit It" bought={(label) => `${label}, fitted.`}
          facets={{ brand: 'Maker', part: 'Part' }}
          facetsOf={(r) => ({ brand: r.product.brand, part: AUDIO_PART[String(r.product.attrs.part)] ?? 'Part' })}
          columns={[
            { head: 'Part', cell: (r) => AUDIO_PART[String(r.product.attrs.part)] ?? '—' },
            { head: 'What It Is', cell: spec },
            { head: 'Fitted', cell: fitting },
          ]}
          compare={[
            { label: 'Part', value: (r) => AUDIO_PART[String(r.product.attrs.part)] ?? '—' },
            { label: 'What It Is', value: spec },
            { label: 'Android Auto', value: (r) => String(r.product.attrs.androidAuto ?? '—') },
            { label: 'Fitted', value: fitting },
          ]}
          fine="Each at its seller’s own page, America’s and Canada’s prices with the place’s sales tax, and fitted at the market’s published price for the work: Geek Squad’s in America, Halfords’ least in Britain and Ireland. Where none is published it’s fitted by you, at nothing. Full cover pays toward what it cost when the car is lost, to the insurer’s cap." />
      </div>
    </Panel>
  );
}

function InteriorWork() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const work = useFeature('vehicle.interior');
  const cars = vehiclesOf(person).filter((v) => v.soldAt === undefined && !v.repossessed);
  const here = person.currentLocationId;
  const shops = UPHOLSTERERS.filter((s) => s.cityId === here);
  const [vehicleId, setVehicleId] = useState('');
  const [shopId, setShopId] = useState('');
  const [kit, setKit] = useState(false);
  const [parts, setParts] = useState<Partial<Record<Part, { material: Material; color: string; stitching: string }>>>({ seats: { material: 'leopard-vinyl', color: 'Leopard', stitching: 'Black' } });
  if (cars.length === 0 || shops.length === 0) return null;
  const v = cars.find((x) => x.id === vehicleId) ?? cars[0]!;
  const shop = shops.find((x) => x.id === shopId) ?? shops[0]!;
  const design = (Object.keys(parts) as Part[]).filter((k) => parts[k]).map((k) => ({ part: k, ...parts[k]! }));
  const q = interiorQuote(sim, shop.id, design, kit);
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe), { cents: false });
  const set = (part: Part, patch: Partial<{ material: Material; color: string; stitching: string }>) => setParts({ ...parts, [part]: { ...(parts[part] ?? { material: FITS[part][0]!, color: '', stitching: '' }), ...patch } });
  return (
    <Panel title="The Interior, To Your Design" subtitle="What's done, in what, and its colors, at a shop in this town; kept with the car as commissioned">
      <div className="col gap-3">
        <div className="field-row field-row-tight">
          <div className="field">
            <label htmlFor="interior-car">Car</label>
            <select id="interior-car" value={v.id} onChange={(e) => setVehicleId(e.target.value)}>{cars.map((c) => { const m = modelById(c.modelId)!; return <option key={c.id} value={c.id}>{`${m.make} ${m.model}`}</option>; })}</select>
          </div>
          <div className="field">
            <label htmlFor="interior-shop">Shop</label>
            <select id="interior-shop" value={shop.id} onChange={(e) => { setShopId(e.target.value); setKit(false); }}>{shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          {shop.katzkin && (
            <label className="row gap-1 small" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={kit} onChange={(e) => { setKit(e.target.checked); if (e.target.checked) setParts({ seats: { material: 'leather', color: parts.seats?.color || 'Black', stitching: parts.seats?.stitching || 'Black' } }); }} />
              A Katzkin Leather Kit
            </label>
          )}
        </div>
        {(Object.keys(PART_LABEL) as Part[]).filter((part) => !kit || part === 'seats').map((part) => {
          const chosen = parts[part];
          return (
            <div key={part} className="field-row field-row-tight" style={{ alignItems: 'flex-end' }}>
              <label className="row gap-1 small" style={{ alignItems: 'center', minWidth: '10rem' }}>
                <input type="checkbox" checked={Boolean(chosen)} disabled={kit} onChange={(e) => { if (e.target.checked) set(part, {}); else { const next = { ...parts }; delete next[part]; setParts(next); } }} />
                {PART_LABEL[part]}
              </label>
              {chosen && (
                <>
                  <div className="field">
                    <label htmlFor={`interior-${part}-material`}>Material</label>
                    <select id={`interior-${part}-material`} value={chosen.material} disabled={kit} onChange={(e) => set(part, { material: e.target.value as Material })}>{FITS[part].map((m) => <option key={m} value={m}>{MATERIAL_LABEL[m]}</option>)}</select>
                  </div>
                  <div className="field">
                    <label htmlFor={`interior-${part}-color`}>Color Or Pattern</label>
                    <input id={`interior-${part}-color`} value={chosen.color} placeholder="Leopard, Cognac, Two-Tone" onChange={(e) => set(part, { color: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`interior-${part}-stitch`}>Stitching</label>
                    <input id={`interior-${part}-stitch`} value={chosen.stitching} placeholder="Black, Gold" onChange={(e) => set(part, { stitching: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          );
        })}
        {typeof q === 'string' ? <div className="small muted">{q}</div> : (
          <div className="table-scroll">
            <table>
              <tbody>
                {q.lines.map((l) => <tr key={l.label}><td className="small">{l.label}</td><td className="num mono">{money(l.amount)}</td></tr>)}
                <tr><th scope="row">The Estimate</th><td className="num mono">{money(q.total)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="row gap-2" style={{ alignItems: 'baseline' }}>
          <button type="button" className="btn btn-sm btn-primary" disabled={!work.open || typeof q === 'string'} title={work.reason} onClick={() => { const a = run<{ readyAt: number }>('vehicle.interior', { vehicleId: v.id, shopId: shop.id, design, kit }); if (a.ok) toast(`Commissioned at ${shop.name}, ready ${formatDate(a.value!.readyAt, sim.zone)}.`, 'positive'); }}>Commission It</button>
          <span className="xs dim">{kit ? 'Katzkin’s own installed price; the kit is cut in two weeks, then the car is in two days.' : 'Hours at the trade guides’ middles and $75 an hour; materials at suppliers’ prices; the yardage is SLATE’s estimate, no shop publishing one.'}</span>
        </div>
      </div>
    </Panel>
  );
}
