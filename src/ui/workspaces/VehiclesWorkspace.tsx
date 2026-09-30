/**
 * SLATE — Cars: the cars you own and what they cost you, and buying one new
 * or used where you live, every tax and fee on the quote before you pay
 * (`systems/vehicles.ts`, from 2026-09-29).
 */

import { tradeInFor } from '@/engine/systems/vehicles';
import { redemption } from '@/engine/systems/repossession';
import { boatsOf, boatQuote, buyBoatRefusal, certified, certifyRefusal, onItsTrailer } from '@/engine/systems/boats';
import { BOAT_LOAN, BOAT_RULES, T18, isBoatState } from '@/engine/content/boats';
import { CITIES } from '@/engine/content/geography';
import { INSPECTION_RULES, nextInspection } from '@/engine/systems/inspections';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { homeOf } from '@/engine/systems/earnings';
import { buyRefusal, registers, insuranceBasis, insuranceCurrency, jurisdictionOf, kept, liabilityOffered, loanRate, modelById, modelsFor, monthlyInsurance, quote, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { DEPRECIATION_SOURCE, LOAN_RATES, US_LEASE } from '@/engine/content/vehiclefees';
import type { VehicleKind } from '@/engine/content/vehiclecatalog';
import { tiresRefusal } from '@/engine/systems/tires';
import { buyoutPrice, leaseQuote, leaseRefusal, milesOver } from '@/engine/systems/leasing';

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
  const models = modelsFor(home, kind);
  const [pick, setPick] = useState('');
  const [age, setAge] = useState(0);
  // Outright, a loan's months or a lease's: one choice, a lease's months negative.
  const [months, setMonths] = useState(0);
  const financed = months > 0;
  const leaseMonths = months < 0 && Boolean(j?.startsWith('US-')) && age === 0 && kind === 'car' ? -months : 0;
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
  // A lease: new cars in America only.
  const leasable = Boolean(j?.startsWith('US-')) && age === 0 && kind === 'car';
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
                            v.lease.maturedAt === undefined ? <span className="xs dim">Ends {formatDate(v.boughtAt + v.lease.months * 30 * 86_400_000, sim.zone)}{milesOver(v).miles ? `, ${milesOver(v).miles.toLocaleString('en-US')} miles over` : ''}</span> : (
                              <div className="row gap-1">
                                <Gated feature="vehicle.lease_buyout" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.lease_buyout', { vehicleId: v.id }); if (a.ok) toast(`Bought out for ${money(a.value!.paid)}.`, 'positive'); }}>Buy It Out, {inHome(buyoutPrice(v, sim.now) ?? 0, 'USD')}</Gated>
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
                            <div className="row gap-1">
                            {!tiresRefusal(v) && <Gated feature="vehicle.winter_tires" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ paid: number }>('vehicle.winter_tires', { vehicleId: v.id }); if (a.ok) toast(`Winter tires on, for ${money(a.value!.paid)}.`, 'positive'); }}>Winter Tires</Gated>}
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
            <div className="field-row field-row-tight">
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
              <div className="field">
                <label htmlFor="car-model">Model</label>
                <select id="car-model" value={model?.id ?? ''} onChange={(e) => setPick(e.target.value)}>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.make} {m.model}</option>)}
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
                  {leasable && US_LEASE.terms.map((n) => <option key={-n} value={-n}>A Lease, {n} Months</option>)}
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
                    {lq.atSigning.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, 'USD')}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(lq.dueAtSigning, 'USD')}</td></tr>
                    <tr><td>Then, A Month</td><td className="num mono">{inHome(lq.monthly, 'USD')}</td></tr>
                    <tr><td>To Buy It Out At The End</td><td className="num mono">{inHome(lq.residual, 'USD')}</td></tr>
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
              {leaseMonths ? <Stat label="Money Factor" value={String(US_LEASE.moneyFactor)} note={`About ${(US_LEASE.moneyFactor * 2400).toFixed(2)}% a year, worked back from Toyota’s offers`} /> : <Stat label="Loan Rate" value={rate !== undefined ? `${(rate * 100).toFixed(2)}%` : '—'} note={rate !== undefined ? 'For your record, where it’s published' : 'Not published here: buy it outright'} />}
              <Stat label="Economy" value={model?.per100km ? `${model.per100km} L/100 km` : kind === 'bicycle' ? 'Pedaled' : kind === 'ebike' ? 'Charged At Home' : 'Not Yet Rated'} note={model?.per100km || kind === 'bicycle' || kind === 'ebike' || kind === 'atv' ? model?.economyBasis : 'Fuel at AAA’s cost a mile until it’s rated'} />
            </div>
            {(leaseMonths ? noLease : no) ? <p className="small" style={{ margin: 0 }}>{leaseMonths ? noLease : no}</p> : null}
            <div className="row gap-2">
              {leaseMonths ? (
                <Gated feature="vehicle.lease" className="btn btn-sm" disabled={Boolean(noLease)} title={noLease} onClick={() => {
                  if (!model) return;
                  const a = run<{ paid: number; monthly: number }>('vehicle.lease', { modelId: model.id, months: leaseMonths, coverage });
                  if (a.ok) toast(`Leased, for ${money(a.value!.paid)} now and ${money(a.value!.monthly)} a month.`, 'positive');
                }}>Lease It</Gated>
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
      </div>
    </>
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
