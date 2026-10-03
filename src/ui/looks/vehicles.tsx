/**
 * SLATE — a thing you own that goes: a car, a motorcycle, a van, a boat, a
 * caravan or a plane.
 *
 * One kind, `vehicle`, because every one of them is addressed the same way:
 * the engine draws all their ids from one counter (`nextId('vehicle')`), so
 * an id names one machine whichever list it sits in. What it opens into is
 * read from the machine every time — its worth by the depreciation curve
 * (`valueOf`, `caravanValue`), its loan, its cover, its fault and its
 * service from `systems/repairs.ts` and `systems/carcare.ts` — and nothing
 * here is a figure of its own.
 *
 * A car’s loan is a balance on the car, not an account in the ledger, so the
 * way to it goes to the account its payments come out of. The floor of the
 * chain is the town it stands in.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, dateKey, formatDate, type Instant } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { BOAT_RULES } from '@/engine/content/boats';
import { CARAVANS } from '@/engine/content/caravans';
import type { VehicleKind } from '@/engine/content/vehiclecatalog';
import { inSaveMoney } from '@/engine/systems/banking';
import { insuranceCurrency, isPickup, kindOf, modelById, monthlyInsurance, valueOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { caravanValue, type OwnedCaravan } from '@/engine/systems/caravans';
import type { OwnedBoat } from '@/engine/systems/boats';
import type { OwnedAircraft } from '@/engine/systems/aviation';
import { faultCost, laidUp } from '@/engine/systems/repairs';
import { inWarranty, odometer, serviceDue, servicingKept, warrantyOf } from '@/engine/systems/carcare';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';
import { spokenList, nameable } from './words';

type Machine =
  | { what: 'car'; v: OwnedVehicle; person: Person }
  | { what: 'boat'; v: OwnedBoat; person: Person }
  | { what: 'caravan'; v: OwnedCaravan; person: Person }
  | { what: 'plane'; v: OwnedAircraft; person: Person };

/** What each sort of thing is called above its name. Never the engine’s word for it. */
const KIND_WORD: Readonly<Record<VehicleKind, string>> = {
  car: 'A Car Of Your Own',
  motorcycle: 'A Motorcycle Of Your Own',
  scooter: 'A Scooter Of Your Own',
  van: 'A Van Of Your Own',
  campervan: 'A Campervan Of Your Own',
  motorhome: 'A Motorhome Of Your Own',
  bicycle: 'A Bicycle Of Your Own',
  ebike: 'An E-Bike Of Your Own',
  atv: 'An ATV Of Your Own',
};

/**
 * A maker’s name as a name, or a plainer one where it would read as an
 * identifier. A model called 1500 or 3008 is a real name, but four digits in a
 * row is what the gate on names catches, so the make alone stands for it and
 * the model is said in the sentence underneath.
 */

const nameOr = (text: string, fallback: string): string => (nameable(text) ? text : fallback);

const owner = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];

/** Every machine they hold, sold ones and lost ones left out. Read, never moved: `boatsOf` and `planesOf` tidy an older save as they go. */
function machinesOf(person: Person): Machine[] {
  const out: Machine[] = [];
  for (const v of person.vehicles ?? []) if (v.soldAt === undefined && modelById(v.modelId)) out.push({ what: 'car', v, person });
  for (const v of person.boats ?? []) if (v.soldAt === undefined && BOAT_RULES[v.state]) out.push({ what: 'boat', v, person });
  for (const v of person.caravans ?? []) if (v.soldAt === undefined && CARAVANS[v.market]) out.push({ what: 'caravan', v, person });
  for (const v of person.planes ?? []) if (v.soldAt === undefined) out.push({ what: 'plane', v, person });
  return out;
}

/** The town it stands in. */
const whereIs = (m: Machine): string => (m.what === 'car' ? m.v.at ?? m.v.cityId : m.what === 'caravan' ? m.v.at ?? m.v.cityId : m.what === 'plane' ? m.v.at : m.v.cityId);

/** What it’s called. */
function nameOf(m: Machine): string {
  if (m.what === 'car') {
    const model = modelById(m.v.modelId)!;
    return nameOr(`${model.make} ${model.model}`, nameOr(`Your ${model.make}`, 'Your Car'));
  }
  if (m.what === 'boat') return nameOr(BOAT_RULES[m.v.state].model.label, 'Your Boat');
  if (m.what === 'caravan') return nameOr(CARAVANS[m.v.market].label, 'Your Caravan');
  return 'Cessna 172';
}

/** Its worth now, in the save’s money. */
function worthOf(sim: Simulation, m: Machine): number {
  if (m.what === 'car') return m.v.lease ? 0 : inSaveMoney(sim, valueOf(m.v, sim.now), modelById(m.v.modelId)!.currency);
  if (m.what === 'caravan') return caravanValue(m.v, sim.now);
  return m.v.price;
}

/** What is still owed on it, in the save’s money. */
const owedOf = (m: Machine): number => (m.what === 'caravan' ? 0 : m.v.loan?.owed ?? 0);

const years = (from: Instant, to: Instant): number => (to - from) / (365.2425 * MS_DAY);

const townName = (id: string): string => CITIES.get(id)?.name ?? 'a town SLATE doesn’t know';

defineLook<Machine>('vehicle', {
  gone: 'It isn’t yours any more: sold, handed back or taken by the lender.',
  resolve: (sim, id) => {
    const person = owner(sim);
    return person ? machinesOf(person).find((m) => m.v.id === id) : undefined;
  },
  seeds: (sim) => {
    const person = owner(sim);
    return person ? machinesOf(person).map((m) => m.v.id) : [];
  },
  look: (m, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur, { cents: false });
    const zone = sim.homeZone;
    const name = nameOf(m);
    const town = whereIs(m);
    const ways: Way[] = [];
    const add = (way: Way) => { if (lookExists(sim, way.to)) ways.push(way); };

    add({ to: at('place', town), label: townName(town), detail: m.what === 'boat' ? 'Where it’s kept, and what living there costs' : 'Where it stands now, and what living there costs' });
    const pays = m.person.primaryAccountId;
    if (pays && (owedOf(m) > 0 || (m.what === 'car' && m.v.lease))) {
      const account = sim.ledger.tryAccount(pays);
      if (account) {
        add({
          to: at('account', pays),
          label: account.name,
          detail: m.what === 'car' && m.v.lease
            ? `Where the lease’s ${money(m.v.lease.monthly)} a month comes out of`
            : `Where the loan’s ${money(m.what !== 'caravan' && m.v.loan ? m.v.loan.monthly : 0)} a month comes out of`,
        });
      }
    }
    const dueDay = (label: string, when: Instant | undefined, detail: string) => {
      if (when !== undefined && when > sim.now) add({ to: at('day', dateKey(when, zone)), label, detail });
    };

    if (m.what === 'car') return carLook(sim, m.v, name, ways, dueDay, money);

    const worth = worthOf(sim, m);
    const owed = owedOf(m);
    const bought = formatDate(m.v.boughtAt, zone);
    if (m.what === 'boat') dueDay(formatDate(m.v.registeredUntil, zone), m.v.registeredUntil, 'When its registration runs out');
    if (m.what === 'caravan') dueDay(formatDate(m.v.registeredUntil, zone), m.v.registeredUntil, 'When its registration runs out');
    if (m.what === 'plane') dueDay(formatDate(m.v.annualDue, zone), m.v.annualDue, 'When its annual inspection falls due');

    const taken = m.what !== 'caravan' && m.v.repossessed;
    const summary = taken
      ? `Its lender has it, and sells it on ${formatDate(taken.saleAt, zone)} unless you redeem it.`
      : owed > 0
        ? `It’s worth about ${money(worth)}, and you still owe ${money(owed)} on it.`
        : `It’s worth about ${money(worth)}, and it’s yours outright.`;

    const facts: string[] = [`You bought it on ${bought}`];
    if (m.what === 'boat') facts.push(`it’s kept in ${townName(town)}`);
    if (m.what === 'caravan') facts.push(`it stands in ${townName(town)}`);
    if (m.what === 'plane') facts.push(`it’s tied down at ${townName(town)}`, `it has ${Math.round(m.v.hours).toLocaleString('en-US')} hours on it since`);
    const loan = m.what !== 'caravan' ? m.v.loan : undefined;

    return {
      name,
      kind: m.what === 'boat' ? 'A Boat Of Your Own' : m.what === 'caravan' ? 'A Caravan Of Your Own' : 'A Plane Of Your Own',
      parent: at('person', m.person.id),
      summary,
      body: (
        <>
          <p className="small">
            {spokenList(facts)}.{' '}
            {loan ? `Its loan takes ${money(loan.monthly)} a month, ${loan.monthsLeft} ${loan.monthsLeft === 1 ? 'month' : 'months'} still to go${loan.missed ? `, and ${loan.missed} ${loan.missed === 1 ? 'payment has' : 'payments have'} been missed` : ''}.` : 'It’s owned outright.'}
          </p>
          <div className="grid grid-3">
            <Stat label="Worth" value={<span className="mono">{money(worth)}</span>} note={m.what === 'caravan' ? 'On the car curve, no caravan’s having been read' : m.what === 'plane' ? 'What you paid for it' : 'What you paid for it'} />
            <Stat label="Owed" value={<span className="mono">{money(owed)}</span>} tone={owed > 0 ? 'negative' : undefined} note={loan ? 'On the loan' : 'No loan on it'} />
            <Stat label="Bought" value={bought} note={`${Math.max(0, Math.round(years(m.v.boughtAt, sim.now) * 10) / 10)} years ago`} />
          </div>
        </>
      ),
      ways,
    };
  },
});

function carLook(
  sim: Simulation,
  v: OwnedVehicle,
  name: string,
  ways: Way[],
  dueDay: (label: string, when: Instant | undefined, detail: string) => void,
  money: (c: number) => string,
) {
  const zone = sim.homeZone;
  const model = modelById(v.modelId)!;
  const cur = saveCurrency(sim.universe);
  const worth = v.lease ? undefined : inSaveMoney(sim, valueOf(v, sim.now), model.currency);
  const owed = v.loan?.owed ?? 0;
  const km = Math.round(odometer(v));
  const age = v.ageAtPurchase + years(v.boughtAt, sim.now);
  const ageWords = age < 1 ? 'under a year old' : `${Math.floor(age)} ${Math.floor(age) === 1 ? 'year' : 'years'} old`;
  const ins = monthlyInsurance(v.jurisdiction, v.coverage, model);
  const insurance = typeof ins === 'number' ? inSaveMoney(sim, ins, insuranceCurrency(v.jurisdiction, model)) : undefined;
  const due = serviceDue(v, model);
  const warranty = warrantyOf(v, model);
  const covered = warranty ? inWarranty(v, model, sim.now) : false;
  const laid = laidUp(v, sim.now);

  dueDay(formatDate(v.registrationDue, zone), v.registrationDue, 'When its registration falls due');
  if (due) dueDay(formatDate(due.at, zone), due.at, `When its next service falls due, unless it reaches ${Math.round(due.km).toLocaleString('en-US')} km first`);

  const summary = v.repossessed
    ? `Its lender has it, and sells it on ${formatDate(v.repossessed.saleAt, zone)} unless you redeem it.`
    : v.lease
      ? `It’s leased, ${money(v.lease.monthly)} a month with ${v.lease.monthsLeft} ${v.lease.monthsLeft === 1 ? 'payment' : 'payments'} left, and ${km.toLocaleString('en-US')} km on the clock.`
      : owed > 0
        ? `It’s worth about ${money(worth ?? 0)} with ${km.toLocaleString('en-US')} km on the clock, and you still owe ${money(owed)} on it.`
        : `It’s worth about ${money(worth ?? 0)} with ${km.toLocaleString('en-US')} km on the clock, and it’s yours outright.`;

  const condition: string[] = [];
  if (v.fault) condition.push(v.fault.severe ? `It’s broken down, about ${formatMoney(faultCost(v, cur), cur, { cents: false })} to mend.` : `Its check engine light is on, about ${formatMoney(faultCost(v, cur), cur, { cents: false })} to mend.`);
  if (laid && !v.fault?.severe) condition.push(laid);
  if (due) condition.push(`Its next service is due by ${formatDate(due.at, zone)} or ${Math.round(due.km).toLocaleString('en-US')} km${servicingKept(v, model, sim.now) ? '' : ', and its servicing hasn’t been kept'}.`);
  if (warranty) condition.push(covered ? `It’s under the maker’s warranty, ${warranty.years} years or ${Math.round(warranty.km).toLocaleString('en-US')} km.` : `It’s past the maker’s warranty of ${warranty.years} years or ${Math.round(warranty.km).toLocaleString('en-US')} km, or its servicing lapsed.`);
  const fitted = [v.stereo ? 'a stereo with CarPlay' : '', v.winterTires ? 'winter tires' : '', v.tint ? 'tinted windows' : '', v.hitch ? 'a towbar' : '', v.wrap ? `a ${v.wrap.finish} ${v.wrap.color.toLowerCase()} wrap` : ''].filter(Boolean);

  return {
    name,
    kind: isPickup(model) ? 'A Pickup Of Your Own' : KIND_WORD[kindOf(model)],
    parent: at('person', sim.universe.playerId),
    summary,
    body: (
      <>
        <p className="small">
          {name === `${model.make} ${model.model}` ? 'It’s' : `It’s a ${model.make} ${model.model},`} {ageWords}, bought {v.ageAtPurchase ? `used at ${v.ageAtPurchase} ${v.ageAtPurchase === 1 ? 'year' : 'years'}` : 'new'} on {formatDate(v.boughtAt, zone)}, and it stands in {townName(v.at ?? v.cityId)}.{' '}
          {v.coverage === 'full' ? 'It’s on full cover' : 'It’s insured for liability only'}{insurance !== undefined ? `, ${money(insurance)} a month` : ''}.
          {v.loan ? ` Its loan takes ${money(v.loan.monthly)} a month at ${(v.loan.apr * 100).toFixed(2)}%, ${v.loan.monthsLeft} ${v.loan.monthsLeft === 1 ? 'month' : 'months'} still to go.` : ''}
          {fitted.length ? ` It has ${spokenList(fitted)}.` : ''}
        </p>
        {condition.length > 0 && <p className="small">{condition.join(' ')}</p>}
        <div className="grid grid-3">
          <Stat label="Worth" value={<span className="mono">{worth === undefined ? 'Leased' : money(worth)}</span>} note={worth === undefined ? 'The lessor’s until it’s bought out' : 'Its price new, less what its age has taken'} />
          <Stat label="Owed" value={<span className="mono">{money(owed)}</span>} tone={owed > 0 ? 'negative' : undefined} note={v.loan ? 'On the loan' : 'No loan on it'} />
          <Stat label="On The Clock" value={<span className="mono">{`${km.toLocaleString('en-US')} km`}</span>} note="Its years before you, and every day since" />
        </div>
      </>
    ),
    ways,
    provenance: 'Its worth is its price new on the published depreciation curve, less any repair it needs.',
  };
}
