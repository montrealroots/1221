/**
 * SLATE — Cars: the cars you own and what they cost you, and buying one new
 * or used where you live, every tax and fee on the quote before you pay
 * (`systems/vehicles.ts`, from 2026-09-29).
 */

import { INSPECTION_RULES, nextInspection } from '@/engine/systems/inspections';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { homeOf } from '@/engine/systems/earnings';
import { buyRefusal, jurisdictionOf, kept, loanRate, modelById, modelsFor, monthlyInsurance, quote, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { DEPRECIATION_SOURCE, INSURANCE, LOAN_RATES } from '@/engine/content/vehiclefees';

const FUEL_WORD = { petrol: 'Petrol', diesel: 'Diesel', hybrid: 'Hybrid', phev: 'Plug-In Hybrid', ev: 'Electric' } as const;
const PLACE_NAME = { 'US-NY': 'New York', 'US-CT': 'Connecticut', 'US-CA': 'California', GB: 'Great Britain', IE: 'Ireland', 'CA-ON': 'Ontario', 'CA-BC': 'British Columbia', 'MX-CMX': 'Mexico City' } as const;

export function VehiclesWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const home = homeOf(person);
  const j = jurisdictionOf(home);
  const models = modelsFor(home);
  const [pick, setPick] = useState('');
  const [age, setAge] = useState(0);
  // Outright, or a loan's months: one choice.
  const [months, setMonths] = useState(0);
  const financed = months > 0;
  const [coverage, setCoverage] = useState<OwnedVehicle['coverage']>('full');
  const model = modelById(pick) ?? models[0];
  const q = model ? quote(model, home, sim.now, { age, financed, person }) : 'SLATE sells no cars where you live yet.';
  const inHome = (c: number, from: string) => formatMoney(inSaveMoney(sim, c, from), cur);
  const no = model ? buyRefusal(sim, person, model.id, { age, financed, coverage }) : typeof q === 'string' ? q : undefined;
  const ins = j ? monthlyInsurance(j, coverage) : undefined;
  const rate = j ? loanRate(j, person.credit?.score ?? 0, age > 0) : undefined;
  const owned = vehiclesOf(person).filter((v) => v.soldAt === undefined);
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Cars</h1>
        <p className="muted">A car of your own: what it costs to buy, to keep and to run where you live.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Cars">
          {!owned.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Car</th><th scope="col">Bought</th><th scope="col" className="num">Worth</th><th scope="col" className="num">Loan Owed</th><th scope="col">Registration Due</th><th scope="col">Next Inspection</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {owned.map((v) => {
                    const m = modelById(v.modelId)!;
                    return (
                      <tr key={v.id}>
                        <td>{m.make} {m.model}</td>
                        <td>{formatDate(v.boughtAt, sim.zone)}{v.ageAtPurchase ? `, ${v.ageAtPurchase} Years Old` : ', New'}</td>
                        <td className="num mono">{inHome(valueOf(v, sim.now), m.currency)}</td>
                        <td className="num mono">{v.loan ? money(v.loan.owed) : 'None'}</td>
                        <td>{formatDate(v.registrationDue, sim.zone)}</td>
                        <td className="small">{(() => { const due = nextInspection(v, v.inspected ?? v.boughtAt); const rule = INSPECTION_RULES[v.jurisdiction]; return due && rule ? `${rule.label}, ${formatDate(due, sim.zone)}` : '—'; })()}</td>
                        <td>
                          <Gated feature="vehicle.sell" className="btn btn-sm btn-ghost" onClick={() => {
                            const a = run<{ value: number }>('vehicle.sell', { vehicleId: v.id });
                            if (a.ok) toast(`Sold: ${money(a.value!.value)} to you after the loan.`, 'positive');
                          }}>Sell It</Gated>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Buy A Car" subtitle={j ? `Where you live: ${PLACE_NAME[j]}` : 'Where you live, SLATE sells no cars yet'}>
          <div className="col gap-3">
            <div className="field-row field-row-tight">
              <div className="field">
                <label htmlFor="car-model">Car</label>
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
                <select id="car-pay" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                  <option value={0}>Outright</option>
                  {[36, 48, 60, 72].map((n) => <option key={n} value={n}>A Loan, {n} Months</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="car-cover">Insurance</label>
                <select id="car-cover" value={coverage} onChange={(e) => setCoverage(e.target.value === 'liability' ? 'liability' : 'full')}>
                  <option value="full">Full Cover</option>
                  {j && INSURANCE[j]?.liability !== undefined && <option value="liability">Liability Only</option>}
                </select>
              </div>
            </div>
            {typeof q !== 'string' && model && (
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead>
                  <tbody>
                    <tr><td>{model.make} {model.model}, {FUEL_WORD[model.fuel]}{age ? `, ${Math.round(kept(age) * 100)}% Of New` : ''}</td><td className="num mono">{inHome(q.price, q.currency)}</td></tr>
                    {q.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td className="num mono">{inHome(l.amount, q.currency)}</td></tr>)}
                    <tr><th scope="row">In All</th><td className="num mono">{inHome(q.total, q.currency)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-3">
              <Stat label="Insurance" value={typeof ins === 'number' && j ? `${inHome(ins, INSURANCE[j]!.currency)} A Month` : '—'} note={j && INSURANCE[j] ? INSURANCE[j]!.basis : 'Not kept here yet'} />
              <Stat label="Loan Rate" value={rate !== undefined ? `${(rate * 100).toFixed(2)}%` : '—'} note={rate !== undefined ? 'For your record, where it’s published' : 'Not published here: buy it outright'} />
              <Stat label="Economy" value={model?.per100km ? `${model.per100km} L/100 km` : 'Not Yet Rated'} note={model?.per100km ? model.economyBasis : 'Fuel at AAA’s cost a mile until it’s rated'} />
            </div>
            {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
            <div className="row gap-2">
              <Gated feature="vehicle.buy" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
                if (!model) return;
                const a = run<{ vehicleId: string; paid: number; monthly?: number }>('vehicle.buy', { modelId: model.id, age, financed, months, coverage });
                if (a.ok) toast(`Bought, for ${money(a.value!.paid)} now${a.value!.monthly ? ` and ${money(a.value!.monthly)} a month` : ''}.`, 'positive');
              }}>Buy It</Gated>
            </div>
            <Fine>{typeof q !== 'string' ? q.basis : q} Depreciation: {DEPRECIATION_SOURCE}. Loans: {LOAN_RATES.source}. A dealer’s trade-in price, lower than a private sale’s, and repossession aren’t kept; a car’s price is counted as spent, not held against your worth. Parking on the street at home is the resident’s permit where one’s kept, London’s by Westminster’s bands and Dublin’s, and nothing with a garage at a home you own.</Fine>
          </div>
        </Panel>
      </div>
    </>
  );
}
